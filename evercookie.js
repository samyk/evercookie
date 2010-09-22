/*
 * evercookie 0.2 (09/20/2010) -- extremely persistent cookies
 *
 *  by samy kamkar : code@samy.pl : http://samy.pl
 *
 * this api attempts to produce several types of persistent data
 * to essentially make a cookie virtually irrevocable from a system
 *
 * specifically it uses:
 *  - standard http cookies
 *  - flash cookies (local shared objects)
 *  - png generation w/forced cache and html5 canvas pixel reading
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
 * TODO:
 *	isolated storage (silverlight)
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
var _ec_history = 1; // CSS history knocking or not .. can be network intensive
var _ec_debug = 0;

function _dump(arr, level)
{
	var dumped_text = "";
	if(!level) level = 0;
	
	//The padding given at the beginning of the line.
	var level_padding = "";
	for(var j=0;j<level+1;j++) level_padding += "    ";
	
	if(typeof(arr) == 'object') { //Array/Hashes/Objects 
		for(var item in arr) {
			var value = arr[item];
			
			if(typeof(value) == 'object') { //If it is an array,
				dumped_text += level_padding + "'" + item + "' ...\n";
				dumped_text += dump(value,level+1);
			} else {
				dumped_text += level_padding + "'" + item + "' => \"" + value + "\"\n";
			}
		}
	} else { //Stings/Chars/Numbers etc.
		dumped_text = "===>"+arr+"<===("+typeof(arr)+")";
	}
	return dumped_text;
}

// necessary for flash to communicate with js...
// please implement a better way
var _global_lso;
function _evercookie_flash_var(cookie)
{
	_global_lso = cookie;

	// remove the flash object now
	var swf = document.getElementById('myswf');
	if (swf)
		swf.parentNode.removeChild(swf);
}

var evercookie = (function () {
this._class = function() {
var self = this;
// private property
_baseKeyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

this._ec = {};

var no_color = -1;
this.get = function(name, cb, dont_reset)
{
	this._evercookie(name, cb, undefined, undefined, dont_reset);
}
this.set = function(name, value)
{
	this._evercookie(name, function() { }, value);
}

this._evercookie = function(name, cb, value, i, dont_reset)
{
	if (typeof self.createLso == 'undefined')
		self = this;
	
	// wait for body to load
	if (typeof document.body == 'undefined')
	{
		setTimeout(self._evercookie, 300, name, cb, value, i);
		return;
	}
	
	if (typeof i == 'undefined')
		i = 0;

	if (typeof swfobject == 'undefined')
		self.addJavascript('swfobject.js', 'body');

	if (typeof _global_lso == 'undefined')
		self.createLso(name, value);
		
	// first run
	if (i == 0)
	{
		self.evercookie_database_storage(name, value);
		self.evercookie_png(name, value);
		self.evercookie_etag(name, value);

		self._ec.cookieData = self.evercookie_cookie(name, value);
		self._ec.localData = self.evercookie_local_storage(name, value);
		self._ec.globalData = self.evercookie_global_storage(name, value);
		self._ec.sessionData = self.evercookie_session_storage(name, value);
	
		if (_ec_history)
			self._ec.historyData = self.evercookie_history(name, value);
	}

	// when writing data, we need to make sure lso object is there
	if (typeof value != 'undefined')
	{
		if (typeof _global_lso == 'undefined' && i++ < 10)
			setTimeout(self._evercookie, 300, name, cb, value, i);
	}
	
	// when reading data, we need to wait for swf, db and png
	else
	{
		if (
			(
				// we support local db and haven't read data in yet
				(window.openDatabase && typeof self._ec.dbData == 'undefined') ||
				(typeof _global_lso == 'undefined') ||
				(document.createElement('canvas').getContext && (typeof self._ec.pngData == 'undefined' || self._ec.pngData == ''))
			)
			&&
			i++ < 10
		)
		{
			setTimeout(self._evercookie, 300, name, cb, value, i);
		}

		// we hit our max wait time or got all our data
		else
		{
			self._ec.lsoData = self.getFromStr(name, _global_lso);
			_global_lso = undefined;
			if (self._ec.pngData && self._ec.pngData.indexOf(name + '=') >= 0)
				self._ec.pngData = self.getFromStr(name, self._ec.pngData);
			else
				self._ec.pngData = undefined;
			var tmpec = self._ec;
			self._ec = {};
			
			// figure out which is the best candidate
			var candidates = new Array();
			var bestnum = 0;
			var candidate;
			for (var item in tmpec)
			{
				if (typeof tmpec[item] != 'undefined')
					candidates[tmpec[item]] = typeof candidates[tmpec[item]] == 'undefined' ? 1 : candidates[tmpec[item]] + 1;
			}
			
			for (var item in candidates)
			{
				if (candidates[item] > bestnum)
				{
					bestnum = candidates[item];
					candidate = item;
				}
			}
			
			// reset cookie everywhere
			if (typeof dont_reset == "undefined" || dont_reset != 1)
				self.set(name, candidate);

			if (typeof cb == 'function')
				cb(candidate, tmpec);
		}
	}
}

this.createDiv = function(id)
{
	var el = document.getElementById(id);
	if (!el)
	{
		el = document.createElement("div");
		el.setAttribute('id', id);
		document.body.appendChild(el);
	}
	return el;
}

this.ajax_request = function(url)
{
	
}

this.evercookie_etag = function(name, value)
{
	if (typeof(value) != "undefined")
	{
		// make sure we have evercookie session defined first
		document.cookie = 'evercookie=' + name + '=' + value;
		
		// evercookie.php handles the hard part of generating the image
		// based off of the http cookie and returning it cached
		var img = new Image();
		img.style.visibility = 'hidden';
		img.style.position = 'absolute';
		img.src = 'evercookie.php?name=' + name;
	}
	else
	{
		var context = document.createElement('canvas');
		context.style.visibility = 'hidden';
		context.style.position = 'absolute';
		context.width = 200;
		context.height = 1;
		var ctx = context.getContext('2d');
		
		// interestingly enough, we want to erase our evercookie
		// http cookie so the php will force a cached response
		var origvalue = this.getFromStr('evercookie', document.cookie);
		document.cookie = 'evercookie=; expires=Mon, 20 Sep 2010 00:00:00 UTC; path=/';

		var img = new Image();
		img.style.visibility = 'hidden';
		img.style.position = 'absolute';
		img.src = 'evercookie.php?name=' + name;
		
		img.onload = function()
		{
			// put our cookie back
			document.cookie = 'evercookie=' + origvalue + '; expires=Tue, 31 Dec 2030 00:00:00 UTC; path=/';

			self._ec.pngData = '';
			ctx.drawImage(img,0,0);

			// get CanvasPixelArray from  given coordinates and dimensions
			var imgd = ctx.getImageData(0, 0, 200, 1);
			var pix = imgd.data;

			// loop over each pixel to get the "RGB" values (ignore alpha)
			for (var i = 0, n = pix.length; i < n; i += 4)
			{
				if (pix[i  ] == 0) break;
				self._ec.pngData += String.fromCharCode(pix[i]);
				if (pix[i+1] == 0) break;
				self._ec.pngData += String.fromCharCode(pix[i+1]);
				if (pix[i+2] == 0) break;
				self._ec.pngData += String.fromCharCode(pix[i+2]);
			}
		}	
	}
}

this.evercookie_png = function(name, value)
{
	if (document.createElement('canvas').getContext)
	{
		if (typeof(value) != "undefined")
		{
			// make sure we have evercookie session defined first
			document.cookie = 'evercookie=' + name + '=' + value;
			
			// evercookie.php handles the hard part of generating the image
			// based off of the http cookie and returning it cached
			var img = new Image();
			img.style.visibility = 'hidden';
			img.style.position = 'absolute';
			img.src = 'evercookie.php';
		}
		else
		{
			var context = document.createElement('canvas');
			context.style.visibility = 'hidden';
			context.style.position = 'absolute';
			context.width = 200;
			context.height = 1;
			var ctx = context.getContext('2d');
			
			// interestingly enough, we want to erase our evercookie
			// http cookie so the php will force a cached response
			var origvalue = this.getFromStr('evercookie', document.cookie);
			document.cookie = 'evercookie=; expires=Mon, 20 Sep 2010 00:00:00 UTC; path=/';

			var img = new Image();
			img.style.visibility = 'hidden';
			img.style.position = 'absolute';
			img.src = 'evercookie.php';
			
			img.onload = function()
			{
				// put our cookie back
				document.cookie = 'evercookie=' + origvalue + '; expires=Tue, 31 Dec 2030 00:00:00 UTC; path=/';

				self._ec.pngData = '';
				ctx.drawImage(img,0,0);

				// get CanvasPixelArray from  given coordinates and dimensions
				var imgd = ctx.getImageData(0, 0, 200, 1);
				var pix = imgd.data;

				// loop over each pixel to get the "RGB" values (ignore alpha)
				for (var i = 0, n = pix.length; i < n; i += 4)
				{
					if (pix[i  ] == 0) break;
					self._ec.pngData += String.fromCharCode(pix[i]);
					if (pix[i+1] == 0) break;
					self._ec.pngData += String.fromCharCode(pix[i+1]);
					if (pix[i+2] == 0) break;
					self._ec.pngData += String.fromCharCode(pix[i+2]);
				}
			}	
		}
	}
}

this.evercookie_local_storage = function(name, value)
{
	try
	{
		if (window.localStorage)
		{
			if (typeof(value) != "undefined")
				localStorage.setItem(name, value);
			else
				return localStorage.getItem(name);
		}
	}
	catch (e) { }
}

this.evercookie_database_storage = function(name, value)
{
	if (window.openDatabase)
	{		
		var database = window.openDatabase("sqlite_evercookie", "", "evercookie", 1024 * 1024);

		if (typeof(value) != "undefined")
			database.transaction(function(tx)
			{
				tx.executeSql("CREATE TABLE IF NOT EXISTS cache(" +
					"id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, " +
					"name TEXT NOT NULL, " +
					"value TEXT NOT NULL, " +
					"UNIQUE (name)" + 
				")", [], function (tx, rs) { }, function (tx, err) { });

				tx.executeSql("INSERT OR REPLACE INTO cache(name, value) VALUES(?, ?)", [name, value],
					function (tx, rs) { }, function (tx, err) { })
			});
		else
		{
			database.transaction(function(tx)
			{
				tx.executeSql("SELECT value FROM cache WHERE name=?", [name],
				function(tx, result1) {
					if (result1.rows.length >= 1)
						self._ec.dbData = result1.rows.item(0)['value'];
					else
						self._ec.dbData = '';
				}, function (tx, err) { })
			});
		}
	}
}

this.evercookie_session_storage = function(name, value)
{
	try
	{
		if (window.sessionStorage)
		{
			if (typeof(value) != "undefined")
				sessionStorage.setItem(name, value);
			else
				return sessionStorage.getItem(name);
		}
	} catch(e) { }
}

this.evercookie_global_storage = function(name, value)
{
	if (window.globalStorage)
	{
		var host = this.getHost();

		try
		{
			if (typeof(value) != "undefined")
				eval("globalStorage[host]." + name + " = value");
			else
				return eval("globalStorage[host]." + name);
		} catch(e) { }
	}
}

// public method for encoding
this.encode = function (input) {
	var output = "";
	var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
	var i = 0;

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
}

// public method for decoding
this.decode = function (input) {
	var output = "";
	var chr1, chr2, chr3;
	var enc1, enc2, enc3, enc4;
	var i = 0;

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

		if (enc3 != 64) {
			output = output + String.fromCharCode(chr2);
		}
		if (enc4 != 64) {
			output = output + String.fromCharCode(chr3);
		}

	}

	output = this._utf8_decode(output);

	return output;

}

// private method for UTF-8 encoding
this._utf8_encode = function (string) {
	string = string.replace(/\r\n/g,"\n");
	var utftext = "";

	for (var n = 0; n < string.length; n++) {

		var c = string.charCodeAt(n);

		if (c < 128) {
			utftext += String.fromCharCode(c);
		}
		else if((c > 127) && (c < 2048)) {
			utftext += String.fromCharCode((c >> 6) | 192);
			utftext += String.fromCharCode((c & 63) | 128);
		}
		else {
			utftext += String.fromCharCode((c >> 12) | 224);
			utftext += String.fromCharCode(((c >> 6) & 63) | 128);
			utftext += String.fromCharCode((c & 63) | 128);
		}

	}

	return utftext;
}

// private method for UTF-8 decoding
this._utf8_decode = function (utftext) {
	var string = "";
	var i = 0;
	var c = c1 = c2 = 0;

	while ( i < utftext.length ) {

		c = utftext.charCodeAt(i);

		if (c < 128) {
			string += String.fromCharCode(c);
			i++;
		}
		else if((c > 191) && (c < 224)) {
			c2 = utftext.charCodeAt(i+1);
			string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
			i += 2;
		}
		else {
			c2 = utftext.charCodeAt(i+1);
			c3 = utftext.charCodeAt(i+2);
			string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
			i += 3;
		}

	}

	return string;
}

// this is crazy but it's 4am in dublin and i thought this would be hilarious
// blame the guinness
this.evercookie_history = function(name, value)
{
	// - is special
	var baseStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=-";
	var baseElems = baseStr.split("");
	
	// sorry google.
	var url = 'http://www.google.com/evercookie/cache/' + this.getHost() + '/' + name;

	if (typeof(value) != "undefined")
	{
		// don't reset this if we already have it set once
		// too much data and you can't clear previous values
		if (this.hasVisited(url))
			return;

		this.createIframe(url, 'if');
		url = url + '/';

		var base = this.encode(value).split("");
		for (var i = 0; i < base.length; i++)
		{
			url = url + base[i];
			this.createIframe(url, 'if' + i);
		}

		// - signifies the end of our data
		url = url + '-';
		this.createIframe(url, 'if_');
	}
	else
	{
		// omg you got csspwn3d
		if (this.hasVisited(url))
		{
			url = url + '/';

			var letter = "";
			var val = "";
			var found = 1;
			while (letter != '-' && found == 1)
			{
				found = 0;
				for (var i = 0; i < baseElems.length; i++)
				{
					if (this.hasVisited(url + baseElems[i]))
					{
						letter = baseElems[i];
						if (letter != '-')
							val = val + letter;
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
}

this.createIframe = function(url, name)
{
	var el = document.createElement("iframe");
	el.style.visibility = 'hidden';
	el.style.position = 'absolute';
	el.setAttribute('id', name);
	document.body.appendChild(el);
	el.setAttribute('src', url);
	return el;
}

this.addJavascript = function(jsname, pos)
{
	var th = document.getElementsByTagName(pos)[0];
	var s = document.createElement('script');
	s.setAttribute('type', 'text/javascript');
	s.setAttribute('src', jsname);
	th.appendChild(s);
}

// wait for our swfobject to appear (swfobject.js to load)
this.waitForSwf = function(i)
{
	if (typeof i == 'undefined')
		i = 0;
	else
		i++;

	// wait for ~2 seconds for swfobject to appear
	if (i < 10 && typeof swfobject == 'undefined')
		setTimeout(waitForSwf, 300, i);
}

this.createLso = function(name, value)
{
	if (typeof swfobject == 'undefined')
		return;

	// already have swf
	if (document.getElementById('myswf') && typeof value == 'undefined')
		return;

	var div = this.createDiv('swfcontainer');
	var flashvars = {};
	if (typeof value != 'undefined')
	{
		flashvars.everdata = name + '=' + value;
	}

	var params           = {};
	params.swliveconnect = "true";
	var attributes       = {};
	attributes.id        = "myswf";
	attributes.name      = "myswf";
	swfobject.embedSWF("evercookie.swf", "swfcontainer", "1", "1", "9.0.0", false, flashvars, params, attributes);
}

this.addLoadEvent = function(func)
{ 
	var oldonload = window.onload; 
	if (typeof window.onload != 'function')
		window.onload = func; 
	else
	{ 
		window.onload = function()
		{ 
			if (oldonload)
				oldonload(); 
			func(); 
		} 
	} 
}


this.evercookie_cookie = function(name, value)
{
	if (typeof(value) != "undefined")
	{
		// expire the cookie first
		document.cookie = name + '=; expires=Mon, 20 Sep 2010 00:00:00 UTC; path=/';
		document.cookie = name + '=' + value + '; expires=Tue, 31 Dec 2030 00:00:00 UTC; path=/';
	}
	else
		return this.getFromStr(name, document.cookie);
}

// get value from param-like string (eg, "x=y&name=VALUE")
this.getFromStr = function(name, text)
{
	if (typeof text != 'string')
		return;
		
	var nameEQ = name + "=";
	var ca = text.split(/[;&]/);
	for (var i = 0; i < ca.length; i++)
	{
		var c = ca[i];
		while (c.charAt(0) == ' ')
			c = c.substring(1, c.length);
		if (c.indexOf(nameEQ) == 0)
			return c.substring(nameEQ.length, c.length);
	}
}

this.getHost = function()
{
	var domain = document.location.host;
	if (domain.indexOf('www.') == 0)
		domain = domain.replace('www.', '');
	return domain;
}

this.toHex = function(str)
{
    var r = "";
    var e = str.length;
    var c = 0;
    var h;
    while (c < e)
    {
        h = str.charCodeAt(c++).toString(16);
        while (h.length < 2)
        	h = "0" + h;
        r += h;
    }
    return r;
}

this.fromHex = function(str)
{
    var r = "";
    var e = str.length;
    var s;
    while (e >= 0)
    {
        s = e - 2;
        r = String.fromCharCode("0x" + str.substring(s, e)) + r;
        e = s;
    }
    return r;
}

/* 
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


this.hasVisited = function(url)
{
	if (this.no_color == -1)
	{
		var no_style = this._getRGB("http://samy-was-here-this-should-never-be-visited.com", -1);
		if (no_style == -1)
			this.no_color =
				this._getRGB("http://samy-was-here-"+Math.floor(Math.random()*9999999)+"rand.com");
	}
	
	// did we give full url?
	if (url.indexOf('https:') == 0 || url.indexOf('http:') == 0)
		return this._testURL(url, this.no_color);
		
	// if not, just test a few diff types	if (exact)
	return	this._testURL("http://" + url, this.no_color) ||
		this._testURL("https://" + url, this.no_color) ||
		this._testURL("http://www." + url, this.no_color) ||
		this._testURL("https://www." + url, this.no_color);
}

/* create our anchor tag */
var _link = document.createElement("a");
_link.id = "_ec_rgb_link";
_link.style.visibility = 'hidden';
_link.style.position = 'absolute';

/* for monitoring */
var created_style;

/* create a custom style tag for the specific link. Set the CSS visited selector to a known value */
var _cssText = '#_ec_rgb_link:visited{display:none;color:#FF0000}';

/* Methods for IE6, IE7, FF, Opera, and Safari */
try {
	created_style = 1;
	var style = document.createElement('style');
	if (style.styleSheet)
		style.styleSheet.innerHTML = _cssText;
	else if (style.innerHTML)
		style.innerHTML = _cssText;
	else
	{
		var cssT = document.createTextNode(_cssText);
		style.appendChild(cssT);
	}
} catch (e) {
	created_style = 0;
}

/* if test_color, return -1 if we can't set a style */
this._getRGB = function(u, test_color)
{
	if (test_color && created_style == 0)
		return -1;

	/* create the new anchor tag with the appropriate URL information */
	_link.href = u;
	_link.innerHTML = u;
	// not sure why, but the next two appendChilds always have to happen vs just once
	document.body.appendChild(style);
	document.body.appendChild(_link);
	
	/* add the link to the DOM and save the visible computed color */
	var color;
	if (document.defaultView)
		color = document.defaultView.getComputedStyle(_link, null).getPropertyValue('color');
	else
		color = _link.currentStyle['color'];

	return color;
}

this._testURL = function(url, no_color)
{
	var color = this._getRGB(url);

	/* check to see if the link has been visited if the computed color is red */
	if (color == "rgb(255, 0, 0)" || color == "#ff0000")
		return 1;

	/* if our style trick didn't work, just compare default style colors */
	else if (no_color && color != no_color)
		return 1;

	/* not found */
	return 0;
}

};

return _class;
})();

