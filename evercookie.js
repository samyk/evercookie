/*jslint browser: true, nomen: false, plusplus: false, bitwise: false, maxerr: 50, indent: 2 */
/**
 * @depends swfobject-2.2.min.js
 *
 * evercookie 0.4 (10/13/2010) -- extremely persistent cookies
 *
 *  by samy kamkar : code@samy.pl : http://samy.pl
 *
 * this api attempts to produce several types of persistent data
 * to essentially make a cookie virtually irrevocable from a system
 *
 * specifically it uses:
 *  - standard http cookies
 *  - flash cookies (local shared objects)
 *  - silverlight isolated storage
 *  - png generation w/forced cache and html5 canvas pixel reading
 *  - http etags
 *  - http cache
 *  - window.name
 *  - IE userData
 *  - html5 session cookies
 *  - html5 local storage
 *  - html5 global storage
 *  - html5 database storage via sqlite
 *  - css history scanning
 *
 *  if any cookie is found, it's then reset to all the other locations
 *  for example, if someone deletes all but one type of cookie, once
 *  that cookie is re-discovered, all of the other cookie types get reset
 *
 *  !!! SOME OF THESE ARE CROSS-DOMAIN COOKIES, THIS MEANS
 *  OTHER SITES WILL BE ABLE TO READ SOME OF THESE COOKIES !!!
 *
 * USAGE:

  var ec = new evercookie();

  // set a cookie "id" to "12345"
  // usage: ec.set(key, value)
  ec.set("id", "12345");

  // retrieve a cookie called "id" (simply)
  ec.get("id", function(value) { alert("Cookie value is " + value) });

  // or use a more advanced callback function for getting our cookie
  // the cookie value is the first param
  // an object containing the different storage methods
  // and returned cookie values is the second parameter
  function getCookie(best_candidate, all_candidates)
  {
    alert("The retrieved cookie is: " + best_candidate + "\n" +
      "You can see what each storage mechanism returned " +
      "by looping through the all_candidates object.");

    for (var item in all_candidates)
      document.write("Storage mechanism " + item +
        " returned " + all_candidates[item] + " votes<br>");
    }
    ec.get("id", getCookie);

  // we look for "candidates" based off the number of "cookies" that
  // come back matching since it's possible for mismatching cookies.
  // the best candidate is very-very-likely the correct one

*/

/* to turn off CSS history knocking, set _ec_history to 0 */
var _ec_history = 1, // CSS history knocking or not .. can be network intensive
  _ec_tests = 10, //1000
  _ec_baseurl = ''; // base url for php, flash and silverlight assets

function _ec_replace(str, key, value) {
  if (str.indexOf("&" + key + "=") > -1 || str.indexOf(key + "=") === 0) {
    // find start
    var idx = str.indexOf("&" + key + "="),
      end, newstr;
    if (idx === -1) {
      idx = str.indexOf(key + "=");
    }
    // find end
    end = str.indexOf("&", idx + 1);
    if (end !== -1) {
      newstr = str.substr(0, idx) + str.substr(end + (idx ? 0 : 1)) + "&" + key + "=" + value;
    } else {
      newstr = str.substr(0, idx) + "&" + key + "=" + value;
    }
    return newstr;
  } else {
    return str + "&" + key + "=" + value;
  }
}


// necessary for flash to communicate with js...
// please implement a better way
var _global_lso;
function _evercookie_flash_var(cookie) {
  _global_lso = cookie;

  // remove the flash object now
  var swf = document.getElementById("myswf");
  if (swf && swf.parentNode) {
    swf.parentNode.removeChild(swf);
  }
}

/*
 * Again, ugly workaround....same problem as flash.
 */
var _global_isolated;
function onSilverlightLoad(sender, args) {
  var control = sender.getHost();
  _global_isolated = control.Content.App.getIsolatedStorage();
}

function onSilverlightError(sender, args) {
  _global_isolated = "";
}

var evercookie = (function (window) {
  var document = window.document,
    Image = window.Image,
    localStorage = window.localStorage,
    globalStorage = window.globalStorage,
    swfobject = window.swfobject;
  try {
    var sessionStorage = window.sessionStorage;
  } catch (e) { }

  this._class = function () {
    // private property
    var self = this,
      _baseKeyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
      no_color = -1;
    this._ec = {};

    this.get = function (name, cb, dont_reset) {
      self._evercookie(name, cb, undefined, undefined, dont_reset);
    };

    this.set = function (name, value) {
      self._evercookie(name, function () {}, value);
    };

    this._evercookie = function (name, cb, value, i, dont_reset) {
      if (self._evercookie === undefined) {
        self = this;
      }
      if (i === undefined) {
        i = 0;
      }
      // first run
      if (i === 0) {
        self.evercookie_database_storage(name, value);
        self.evercookie_png(name, value);
        self.evercookie_etag(name, value);
        self.evercookie_cache(name, value);
        self.evercookie_lso(name, value);
        self.evercookie_silverlight(name, value);

        self._ec.userData      = self.evercookie_userdata(name, value);
        self._ec.cookieData    = self.evercookie_cookie(name, value);
        self._ec.localData     = self.evercookie_local_storage(name, value);
        self._ec.globalData    = self.evercookie_global_storage(name, value);
        self._ec.sessionData   = self.evercookie_session_storage(name, value);
        self._ec.windowData    = self.evercookie_window(name, value);

        if (_ec_history) {
          self._ec.historyData = self.evercookie_history(name, value);
        }
      }

      // when writing data, we need to make sure lso and silverlight object is there
      if (value !== undefined) {
        if ((typeof _global_lso === "undefined" ||
          typeof _global_isolated === "undefined") &&
          i++ < _ec_tests) {
          setTimeout(function () {
            self._evercookie(name, cb, value, i, dont_reset);
          }, 300);
        }
      }

      // when reading data, we need to wait for swf, db, silverlight and png
      else
      {
        if (
          (
            // we support local db and haven't read data in yet
            (window.openDatabase && typeof self._ec.dbData === "undefined") ||
            (typeof _global_lso === "undefined") ||
            (typeof self._ec.etagData === "undefined") ||
            (typeof self._ec.cacheData === "undefined") ||
            (document.createElement("canvas").getContext && (typeof self._ec.pngData === "undefined" || self._ec.pngData === "")) ||
            (typeof _global_isolated === "undefined")
          ) &&
          i++ < _ec_tests
        )
        {
          setTimeout(function () {
            self._evercookie(name, cb, value, i, dont_reset);
          }, 300);
        }

        // we hit our max wait time or got all our data
        else
        {
          // get just the piece of data we need from swf
          self._ec.lsoData = self.getFromStr(name, _global_lso);
          _global_lso = undefined;

          // get just the piece of data we need from silverlight
          self._ec.slData = self.getFromStr(name, _global_isolated);
          _global_isolated = undefined;

          var tmpec = self._ec,
            candidates = [],
            bestnum = 0,
            candidate,
            item;
          self._ec = {};

          // figure out which is the best candidate
          for (item in tmpec) {
            if (tmpec[item] && tmpec[item] !== "null" && tmpec[item] !== "undefined") {
              candidates[tmpec[item]] = candidates[tmpec[item]] === undefined ? 1 : candidates[tmpec[item]] + 1;
            }
          }

          for (item in candidates) {
            if (candidates[item] > bestnum) {
              bestnum = candidates[item];
              candidate = item;
            }
          }

          // reset cookie everywhere
          if (dont_reset === undefined || dont_reset !== 1) {
            self.set(name, candidate);
          }
          if (typeof cb === "function") {
            cb(candidate, tmpec);
          }
        }
      }
    };

    this.evercookie_window = function (name, value) {
      try {
        if (value !== undefined) {
          window.name = _ec_replace(window.name, name, value);
        } else {
          return this.getFromStr(name, window.name);
        }
      } catch (e) { }
    };

    this.evercookie_userdata = function (name, value) {
      try {
        var elm = this.createElem("div", "userdata_el", 1);
        elm.style.behavior = "url(#default#userData)";

        if (value !== undefined) {
          elm.setAttribute(name, value);
          elm.save(name);
        } else {
          elm.load(name);
          return elm.getAttribute(name);
        }
      } catch (e) {}
    };

    function newImage(src) {
      var img = new Image();
      img.style.visibility = "hidden";
      img.style.position = "absolute";
      img.src = src;
    }

    this.ajax = function (settings) {
      var headers, name, transports, transport, i, length;

      headers = {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
      };

      transports = [
        function () { return new XMLHttpRequest(); },
        function () { return new ActiveXObject('Msxml2.XMLHTTP'); },
        function () { return new ActiveXObject('Microsoft.XMLHTTP'); }
      ];

      for (i = 0, length = transports.length; i < length; i++) {
        transport = transports[i];
        try {
          transport = transport();
          break;
        } catch (e) {
        }
      }

      transport.onreadystatechange = function () {
        if (transport.readyState !== 4) {
          return;
        }
        settings.success(transport.responseText);
      };
      transport.open('get', settings.url, true);
      for (name in headers) {
        transport.setRequestHeader(name, headers[name]);
      }
      transport.send();
    };

    this.evercookie_cache = function (name, value) {
      if (value !== undefined) {
        // make sure we have evercookie session defined first
        document.cookie = "evercookie_cache=" + value;
        // evercookie_cache.php handles caching
        newImage(_ec_baseurl + "evercookie_cache.php?name=" + name);
      } else {
        // interestingly enough, we want to erase our evercookie
        // http cookie so the php will force a cached response
        var origvalue = this.getFromStr("evercookie_cache", document.cookie);
        self._ec.cacheData = undefined;
        document.cookie = "evercookie_cache=; expires=Mon, 20 Sep 2010 00:00:00 UTC; path=/";

        self.ajax({
          url: _ec_baseurl + "evercookie_cache.php?name=" + name,
          success: function (data) {
            // put our cookie back
            document.cookie = "evercookie_cache=" + origvalue + "; expires=Tue, 31 Dec 2030 00:00:00 UTC; path=/";

            self._ec.cacheData = data;
          }
        });
      }
    };

    this.evercookie_etag = function (name, value) {
      if (value !== undefined) {
        // make sure we have evercookie session defined first
        document.cookie = "evercookie_etag=" + value;
        // evercookie_etag.php handles etagging
        newImage(_ec_baseurl + "evercookie_etag.php?name=" + name);
      } else {
        // interestingly enough, we want to erase our evercookie
        // http cookie so the php will force a cached response
        var origvalue = this.getFromStr("evercookie_etag", document.cookie);
        self._ec.etagData = undefined;
        document.cookie = "evercookie_etag=; expires=Mon, 20 Sep 2010 00:00:00 UTC; path=/";

        self.ajax({
          url: _ec_baseurl + "evercookie_etag.php?name=" + name,
          success: function (data) {
            // put our cookie back
            document.cookie = "evercookie_etag=" + origvalue + "; expires=Tue, 31 Dec 2030 00:00:00 UTC; path=/";

            self._ec.etagData = data;
          }
        });
      }
    };

    this.evercookie_lso = function (name, value) {
      var div = document.getElementById("swfcontainer"),
        flashvars = {},
        params = {},
        attributes = {};
      if (!div.length) {
        div = document.createElement("div");
        div.setAttribute("id", "swfcontainer");
        document.body.appendChild(div);
      }

      if (value !== undefined) {
        flashvars.everdata = name + "=" + value;
      }
      params.swliveconnect = "true";
      attributes.id        = "myswf";
      attributes.name      = "myswf";
      swfobject.embedSWF(_ec_baseurl + "evercookie.swf", "swfcontainer", "1", "1", "9.0.0", false, flashvars, params, attributes);
    };

    this.evercookie_png = function (name, value) {
      var canvas = document.createElement("canvas"),
       img, ctx, origvalue;
      canvas.style.visibility = "hidden";
      canvas.style.position = "absolute";
      canvas.width = 200;
      canvas.height = 1;
      if (canvas && canvas.getContext) {
        // evercookie_png.php handles the hard part of generating the image
        // based off of the http cookie and returning it cached
        img = new Image();
        img.style.visibility = "hidden";
        img.style.position = "absolute";
        if (value !== undefined) {
          // make sure we have evercookie session defined first
          document.cookie = "evercookie_png=" + value;
        } else {
          self._ec.pngData = undefined;
          ctx = canvas.getContext("2d");

          // interestingly enough, we want to erase our evercookie
          // http cookie so the php will force a cached response
          origvalue = this.getFromStr("evercookie_png", document.cookie);
          document.cookie = "evercookie_png=; expires=Mon, 20 Sep 2010 00:00:00 UTC; path=/";

          img.onload = function () {
            // put our cookie back
            document.cookie = "evercookie_png=" + origvalue + "; expires=Tue, 31 Dec 2030 00:00:00 UTC; path=/";

            self._ec.pngData = "";
            ctx.drawImage(img, 0, 0);

            // get CanvasPixelArray from  given coordinates and dimensions
            var imgd = ctx.getImageData(0, 0, 200, 1),
              pix = imgd.data, i, n;

            // loop over each pixel to get the "RGB" values (ignore alpha)
            for (i = 0, n = pix.length; i < n; i += 4) {
              if (pix[i] === 0) {
                break;
              }
              self._ec.pngData += String.fromCharCode(pix[i]);
              if (pix[i + 1] === 0) {
                break;
              }
              self._ec.pngData += String.fromCharCode(pix[i + 1]);
              if (pix[i + 2] === 0) {
                break;
              }
              self._ec.pngData += String.fromCharCode(pix[i + 2]);
            }
          };
        }
        img.src = _ec_baseurl + "evercookie_png.php?name=" + name;
      }
    };

    this.evercookie_local_storage = function (name, value) {
      try {
        if (localStorage) {
          if (value !== undefined) {
            localStorage.setItem(name, value);
          } else {
            return localStorage.getItem(name);
          }
        }
      } catch (e) { }
    };

    this.evercookie_database_storage = function (name, value) {
      try {
        if (window.openDatabase) {
          var database = window.openDatabase("sqlite_evercookie", "", "evercookie", 1024 * 1024);

          if (value !== undefined) {
            database.transaction(function (tx) {
              tx.executeSql("CREATE TABLE IF NOT EXISTS cache(" +
                "id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, " +
                "name TEXT NOT NULL, " +
                "value TEXT NOT NULL, " +
                "UNIQUE (name)" +
                ")", [], function (tx, rs) {}, function (tx, err) {});
              tx.executeSql("INSERT OR REPLACE INTO cache(name, value) " +
                "VALUES(?, ?)",
                [name, value], function (tx, rs) {}, function (tx, err) {});
            });
          } else {
            database.transaction(function (tx) {
              tx.executeSql("SELECT value FROM cache WHERE name=?", [name],
                function (tx, result1) {
                  if (result1.rows.length >= 1) {
                    self._ec.dbData = result1.rows.item(0).value;
                  } else {
                    self._ec.dbData = "";
                  }
                }, function (tx, err) {});
            });
          }
        }
      } catch (e) { }
    };

    this.evercookie_session_storage = function (name, value) {
      try {
        if (sessionStorage) {
          if (value !== undefined) {
            sessionStorage.setItem(name, value);
          } else {
            return sessionStorage.getItem(name);
          }
        }
      } catch (e) { }
    };

    this.evercookie_global_storage = function (name, value) {
      if (globalStorage) {
        var host = this.getHost();
        try {
          if (value !== undefined) {
            globalStorage[host][name] = value;
          } else {
            return globalStorage[host][name];
          }
        } catch (e) { }
      }
    };

    this.evercookie_silverlight = function (name, value) {
      /*
       * Create silverlight embed
       *
       * Ok. so, I tried doing this the proper dom way, but IE chokes on appending anything in object tags (including params), so this
       * is the best method I found. Someone really needs to find a less hack-ish way. I hate the look of this shit.
       */
      var source = _ec_baseurl + "evercookie.xap",
        minver = "4.0.50401.0",
        initParam = "",
        html;
      if (value !== undefined) {
        initParam = '<param name="initParams" value="' + name + '=' + value + '" />';
      }

      html =
      '<object data="data:application/x-silverlight-2," type="application/x-silverlight-2" id="mysilverlight" width="0" height="0">' +
        initParam +
        '<param name="source" value="' + source + '"/>' +
        '<param name="onLoad" value="onSilverlightLoad"/>' +
        '<param name="onError" value="onSilverlightError"/>' +
        '<param name="background" value="Transparent"/>' +
        '<param name="windowless" value="true"/>' +
        '<param name="minRuntimeVersion" value="' + minver + '"/>' +
        '<param name="autoUpgrade" value="true"/>' +
        '<a href="http://go.microsoft.com/fwlink/?LinkID=149156&v=' + minver + '" style="text-decoration:none">' +
        'Get Microsoft Silverlight' +
        '</a>' +
      '</object>';
      $(document).append(html);
    };

    // public method for encoding
    this.encode = function (input) {
      var output = "",
        chr1, chr2, chr3, enc1, enc2, enc3, enc4,
        i = 0;

      input = this._utf8_encode(input);

      while (i < input.length) {

        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);

        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;

        if (isNaN(chr2)) {
          enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
          enc4 = 64;
        }

        output = output +
          _baseKeyStr.charAt(enc1) + _baseKeyStr.charAt(enc2) +
          _baseKeyStr.charAt(enc3) + _baseKeyStr.charAt(enc4);

      }

      return output;
    };

    // public method for decoding
    this.decode = function (input) {
      var output = "",
        chr1, chr2, chr3,
        enc1, enc2, enc3, enc4,
        i = 0;

      input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

      while (i < input.length) {
        enc1 = _baseKeyStr.indexOf(input.charAt(i++));
        enc2 = _baseKeyStr.indexOf(input.charAt(i++));
        enc3 = _baseKeyStr.indexOf(input.charAt(i++));
        enc4 = _baseKeyStr.indexOf(input.charAt(i++));

        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;

        output = output + String.fromCharCode(chr1);

        if (enc3 !== 64) {
          output = output + String.fromCharCode(chr2);
        }
        if (enc4 !== 64) {
          output = output + String.fromCharCode(chr3);
        }
      }
      output = this._utf8_decode(output);
      return output;
    };

    // private method for UTF-8 encoding
    this._utf8_encode = function (str) {
      str = str.replace(/\r\n/g, "\n");
      var utftext = "", i = 0, n = str.length, c;
      for (; i < n; i++) {
        c = str.charCodeAt(i);
        if (c < 128) {
          utftext += String.fromCharCode(c);
        } else if ((c > 127) && (c < 2048)) {
          utftext += String.fromCharCode((c >> 6) | 192);
          utftext += String.fromCharCode((c & 63) | 128);
        } else {
          utftext += String.fromCharCode((c >> 12) | 224);
          utftext += String.fromCharCode(((c >> 6) & 63) | 128);
          utftext += String.fromCharCode((c & 63) | 128);
        }
      }
      return utftext;
    };

    // private method for UTF-8 decoding
    this._utf8_decode = function (utftext) {
      var str = "",
      i = 0, n = utftext.length,
      c = 0, c1 = 0, c2 = 0, c3 = 0;
      while (i < n) {
        c = utftext.charCodeAt(i);
        if (c < 128) {
          str += String.fromCharCode(c);
          i += 1;
        } else if ((c > 191) && (c < 224)) {
          c2 = utftext.charCodeAt(i + 1);
          str += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
          i += 2;
        } else {
          c2 = utftext.charCodeAt(i + 1);
          c3 = utftext.charCodeAt(i + 2);
          str += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
          i += 3;
        }
      }
      return str;
    };

    // this is crazy but it's 4am in dublin and i thought this would be hilarious
    // blame the guinness
    this.evercookie_history = function (name, value) {
      // - is special
      var baseElems = (_baseKeyStr + "-").split(""),
        // sorry google.
        url = "http://www.google.com/evercookie/cache/" + this.getHost() + "/" + name,
        i, base,
        letter = "",
        val = "",
        found = 1;

      if (value !== undefined) {
        // don't reset this if we already have it set once
        // too much data and you can't clear previous values
        if (this.hasVisited(url)) {
          return;
        }

        this.createIframe(url, "if");
        url = url + "/";

        base = this.encode(value).split("");
        for (i = 0; i < base.length; i++) {
          url = url + base[i];
          this.createIframe(url, "if" + i);
        }

        // - signifies the end of our data
        url = url + "-";
        this.createIframe(url, "if_");
      } else {
        // omg you got csspwn3d
        if (this.hasVisited(url)) {
          url = url + "/";

          while (letter !== "-" && found === 1) {
            found = 0;
            for (i = 0; i < baseElems.length; i++) {
              if (this.hasVisited(url + baseElems[i])) {
                letter = baseElems[i];
                if (letter !== "-") {
                  val = val + letter;
                }
                url = url + letter;
                found = 1;
                break;
              }
            }
          }

          // lolz
          return this.decode(val);
        }
      }
    };

    this.createElem = function (type, name, append) {
      var el;
      if (name !== undefined && document.getElementById(name)) {
        el = document.getElementById(name);
      } else {
        el = document.createElement(type);
      }
      el.style.visibility = "hidden";
      el.style.position = "absolute";

      if (name) {
        el.setAttribute("id", name);
      }

      if (append) {
        document.body.appendChild(el);
      }
      return el;
    };

    this.createIframe = function (url, name) {
      var el = this.createElem("iframe", name, 1);
      el.setAttribute("src", url);
      return el;
    };

    // wait for our swfobject to appear (swfobject.js to load)
    var waitForSwf = this.waitForSwf = function (i) {
      if (i === undefined) {
        i = 0;
      } else {
        i++;
      }

      // wait for ~2 seconds for swfobject to appear
      if (i < _ec_tests && typeof swfobject === "undefined") {
        setTimeout(function () {
          waitForSwf(i);
        }, 300);
      }
    };

    this.evercookie_cookie = function (name, value) {
      if (value !== undefined) {
        // expire the cookie first
        document.cookie = name + "=; expires=Mon, 20 Sep 2010 00:00:00 UTC; path=/";
        document.cookie = name + "=" + value + "; expires=Tue, 31 Dec 2030 00:00:00 UTC; path=/";
      } else {
        return this.getFromStr(name, document.cookie);
      }
    };

    // get value from param-like string (eg, "x=y&name=VALUE")
    this.getFromStr = function (name, text) {
      if (typeof text !== "string") {
        return;
      }
      var nameEQ = name + "=",
        ca = text.split(/[;&]/),
        i, c;
      for (i = 0; i < ca.length; i++) {
        c = ca[i];
        while (c.charAt(0) === " ") {
          c = c.substring(1, c.length);
        }
        if (c.indexOf(nameEQ) === 0) {
          return c.substring(nameEQ.length, c.length);
        }
      }
    };

    this.getHost = function () {
      return window.location.host.replace(/:\d+/, '');
    };

    this.toHex = function (str) {
      var r = "",
        e = str.length,
        c = 0,
        h;
      while (c < e) {
        h = str.charCodeAt(c++).toString(16);
        while (h.length < 2) {
          h = "0" + h;
        }
        r += h;
      }
      return r;
    };

    this.fromHex = function (str) {
      var r = "",
        e = str.length,
        s;
      while (e >= 0) {
        s = e - 2;
        r = String.fromCharCode("0x" + str.substring(s, e)) + r;
        e = s;
      }
      return r;
    };

    /**
     * css history knocker (determine what sites your visitors have been to)
     *
     * originally by Jeremiah Grossman
     * http://jeremiahgrossman.blogspot.com/2006/08/i-know-where-youve-been.html
     *
     * ported to additional browsers by Samy Kamkar
     *
     * compatible with ie6, ie7, ie8, ff1.5, ff2, ff3, opera, safari, chrome, flock
     *
     * - code@samy.pl
     */
    this.hasVisited = function (url) {
      if (this.no_color === -1) {
        var no_style = this._getRGB("http://samy-was-here-this-should-never-be-visited.com", -1);
        if (no_style === -1) {
          this.no_color = this._getRGB("http://samy-was-here-" + Math.floor(Math.random() * 9999999) + "rand.com");
        }
      }

      // did we give full url?
      if (url.indexOf("https:") === 0 || url.indexOf("http:") === 0) {
        return this._testURL(url, this.no_color);
      }

      // if not, just test a few diff types  if (exact)
      return this._testURL("http://" + url, this.no_color) ||
        this._testURL("https://" + url, this.no_color) ||
        this._testURL("http://www." + url, this.no_color) ||
        this._testURL("https://www." + url, this.no_color);
    };

    /* create our anchor tag */
    var _link = this.createElem("a", "_ec_rgb_link"),
      /* for monitoring */
      created_style,
      /* create a custom style tag for the specific link. Set the CSS visited selector to a known value */
      _cssText = "#_ec_rgb_link:visited{display:none;color:#FF0000}",
	  style;

    /* Methods for IE6, IE7, FF, Opera, and Safari */
    try {
      created_style = 1;
      style = document.createElement("style");
      if (style.styleSheet) {
        style.styleSheet.innerHTML = _cssText;
      } else if (style.innerHTML) {
        style.innerHTML = _cssText;
      } else {
        style.appendChild(document.createTextNode(_cssText));
      }
    } catch (e) {
      created_style = 0;
    }

    /* if test_color, return -1 if we can't set a style */
    this._getRGB = function (u, test_color) {
      if (test_color && created_style === 0) {
        return -1;
      }

      /* create the new anchor tag with the appropriate URL information */
      _link.href = u;
      _link.innerHTML = u;
      // not sure why, but the next two appendChilds always have to happen vs just once
      document.body.appendChild(style);
      document.body.appendChild(_link);

      /* add the link to the DOM and save the visible computed color */
      var color;
      if (document.defaultView) {
        color = document.defaultView.getComputedStyle(_link, null).getPropertyValue("color");
      } else {
        color = _link.currentStyle.color;
      }
      return color;
    };

    this._testURL = function (url, no_color) {
      var color = this._getRGB(url);

      /* check to see if the link has been visited if the computed color is red */
      if (color === "rgb(255, 0, 0)" || color === "#ff0000") {
        return 1;
      } else if (no_color && color !== no_color) {
        /* if our style trick didn't work, just compare default style colors */
        return 1;
      }
      /* not found */
      return 0;
    };

  };
  return this._class;
}(window));
