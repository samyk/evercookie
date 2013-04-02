<html>
<head>
<link rel="stylesheet" href="master.css" type="text/css">
<script type="text/javascript" src="swfobject-2.2.min.js"></script>
<script type="text/javascript" src="evercookie.js"></script>
<title>evercookie - virtually irrevocable persistent cookies</title>
</head>
<body>

<div id="pagebox1" align="center">
<div id="pagebox2">
<table width="728" border="0" align="center" cellpadding="0" cellspacing="0" class="topnavtable"><tr><td></td></tr></table>

<div id="pagecontent" align="left" style="margin-top:5px">
<a href="http://samy.pl">samy's home page</a> || <a href="http://twitter.com/samykamkar">follow my twitter</a> || <a href="http://namb.la">blog</a> || <a href="mailto:code@samy.pl">email me</a> || samy kamkar<hr>

<h1>evercookie <small>-- never forget.</small></h1>
10/10/2010: Reported on by the <a target=_new href="http://www.nytimes.com/2010/10/11/business/media/11privacy.html?hp">New York Times</a>

<PRE>

</PRE>
<H2>DESCRIPTION</H2><PRE>
    <i>evercookie</i> is a javascript API available that produces
    extremely persistent cookies in a browser. Its goal
    is to identify a client even after they've removed standard
    cookies, Flash cookies (Local Shared Objects or LSOs), and
    others.

    evercookie accomplishes this by storing the cookie data in
    several types of storage mechanisms that are available on
    the local browser. Additionally, if evercookie has found the
    user has removed any of the types of cookies in question, it
    recreates them using each mechanism available.

    Specifically, when creating a new cookie, it uses the
    following storage mechanisms when available:<b>
     - Standard <A href="http://en.wikipedia.org/wiki/HTTP_cookie">HTTP Cookies</a>
     - <a href="http://en.wikipedia.org/wiki/Local_Shared_Object">Local Shared Objects</a> (Flash Cookies)
     - Silverlight <a href="http://www.silverlight.net/learn/quickstarts/isolatedstorage/">Isolated Storage</a>
     - Storing cookies in RGB values of auto-generated, force-cached 
        PNGs using HTML5 Canvas tag to read pixels (cookies) back out
     - Storing cookies in and reading out <a href="http://samy.pl/csshack/">Web History</a>
     - Storing cookies in HTTP <a href="http://en.wikipedia.org/wiki/HTTP_ETag">ETags</a>
     - Storing cookies in <a href="http://en.wikipedia.org/wiki/Web_cache">Web cache</a>
     - <a href="http://en.wikipedia.org/wiki/HTTP_cookie#window.name">window.name</a> caching
     - Internet Explorer <a href="http://msdn.microsoft.com/en-us/library/ms531424(VS.85).aspx">userData</a> storage
     - HTML5 <a href="http://dev.w3.org/html5/webstorage/#the-sessionstorage-attribute">Session Storage</a>
     - HTML5 <a href="http://dev.w3.org/html5/webstorage/#dom-localstorage">Local Storage</a>
     - HTML5 <a href="https://developer.mozilla.org/en/dom/storage#globalStorage">Global Storage</a>
     - HTML5 <a href="http://dev.w3.org/html5/webdatabase/">Database Storage</a> via SQLite

    TODO:</b> adding support for:
     - Caching in <a href="http://en.wikipedia.org/wiki/Basic_access_authentication">HTTP Authentication</a>
     - Using Java to produce a unique key based off of NIC info

    Got a crazy idea to improve this? <a href="mailto:code@samy.pl">Email me!</a>

</PRE>
<H2>EXAMPLE</H2><PRE>
<script>
var val = "<?php echo rand(1, 1000) ?>";
var ec = new evercookie();

getC(0);
//setTimeout(getC, 500, 1);

function getC(dont)
{
	ec.get("uid", function(best, all) {
		document.getElementById('idtag').innerHTML = best;
		var txt = document.getElementById('cookies');
		txt.innerHTML = '';
		for (var item in all)
			txt.innerHTML += item + ' mechanism: ' + (val == all[item] ? '<b>' + all[item] + '</b>' : all[item]) + '<br>';
		if (!dont)
			getC(1);
	}, dont);
}
</script>
    <b>Cookie found:</b> <i>uid</i> = <span id='idtag'>currently not set</span>

    Click to create an evercookie. Don't worry, the cookie is a
    random number between 1 and 1000, not enough for me to track
    you, just enough to test evercookies.
    <input type=button value="Click to create an evercookie" onClick="document.getElementById('idtag').innerHTML = '*creating*'; document.getElementById('cookies').innerHTML = ''; ec.set('uid', val); setTimeout(getC, 1000, 1); ">

    <div id='cookies'></div>
    Now, try deleting this "uid" cookie anywhere possible, then
    <input type=button value="Click to rediscover cookies" onClick="document.getElementById('idtag').innerHTML = '*checking*'; document.getElementById('cookies').innerHTML = ''; setTimeout(getC, 300);">
      or 
    <input type=button value="Click to rediscover cookies WITHOUT reactivating deleted cookies" onClick="document.getElementById('idtag').innerHTML = '*checking*'; document.getElementById('cookies').innerHTML = ''; setTimeout(getC, 300, 1);">

</PRE>
<H2><a href="evercookie-0.4.tgz">DOWNLOAD</a></H2><PRE>
    <I>evercookie</I> is written in JavaScript and additionally
    uses a SWF (Flash) object for the Local Shared Objects and
    PHPs for the server-side generation of cached PNGs and ETags.

    <B>v0.4 BETA</B>, released 10/13/2010
            download source <a href="evercookie-0.4.tgz">here</a>

    Or get it from github: <a href="http://github.com/samyk/evercookie">http://github.com/samyk/evercookie</a>

</PRE>
<H2>FAQ</H2><PRE>
	<b>What is the point of evercookie?</b>
	Evercookie is designed to make persistent data just that, persistent. By
	storing the same data in several locations that a client can access, if
	any of the data is ever lost (for example, by clearing cookies), the data
	can be recovered and then reset and reused.

	Simply think of it as cookies that just won't go away.

	<b>PRIVACY CONCERN! How do I stop websites from doing this?</b>
	Great question. So far, I've found that using <a href="http://www.apple.com/pro/tips/privacy_safari.html">Private Browsing</a>
	in <a href="http://www.apple.com/safari/">Safari</a> will stop ALL evercookie methods after a browser restart.

	<b>What if the user deletes their cookies?</b>
	That's the great thing about evercookie. With all the methods available,
	currently thirteen, it only takes one cookie to remain for most, if not all,
	of them to be reset again.

	For example, if the user deletes their standard HTTP cookies, LSO data,
	and all HTML5 storage, the PNG cookie and history cookies will still
	exist. Once either of those are discovered, all of the others will
	come back (assuming the browser supports them).

	<b>Why not use EFF's <a href="https://panopticlick.eff.org/">Panopticlick</a>?</b>
	Panopticlick is an awesome idea, however the uniqueness really only
	helps in consumer machines and typically not systems running in a
	business or corporation. Typically those systems are virtually
	identical and provide no difference in information where a home
	user's laptop would. Evercookie is meant to be able to store the
	same unique data a normal cookie would.

	<b>Does this work cross-browser?</b>
	If a user gets cookied on one browser and switches to another browser,
	as long as they still have the Local Shared Object cookie, the cookie
	will reproduce in both browsers.

	<b>Does the client have to install anything?</b>
	No, the client simply uses the website without even knowing about the
	persistent data being set, just as they would use a website with standard
	HTTP cookies.

	<b>Does the server have to install anything?</b>
	The server must at least have access to the JavaScript evercookie file.
	Additionally, to use Local Shared Object (Flash Cookies) storage, the
	evercookie.swf file must be present, and to use the auto-generated PNG
	caching, standard caching and ETag storage mechanisms, PHP must be
	installed and evercookie_(png|etag|cache).php must be on the server.

	All of these are available in the download.

	<b>Is evercookie open source?</b>
	Yes, evercookie is open source. The code is in readable format without
	any obfuscation. Additionally, the PHP files are open source as is the
	FLA (Flash) code used to generate the SWF Flash object. You can compile
	the Flash object yourself or use the pre-compiled version (evercookie.swf).

	<b>How does the PNG caching work?</b>
	When evercookie sets a cookie, it accesses evercookie_png.php with a special
	HTTP cookie, different than the one used for standard session data. This
	special cookie is read by the PHP file, and if found, generates a PNG file
	where all the RGB values are set to the equivalent of the session data to
	be stored. Additionally, the PNG is sent back to the client browser with
	the request to cache the file for 20 years.

	When evercookie retrieves this data, it deletes the special HTTP cookie,
	then makes the same request to the same file without any user information.
	When the PHP script sees it has no information to generate a PNG with, it
	returns a forged HTTP response of "304 Not Modified" which forces the web
	browser to access its local cache. The browser then produces the cached
	image and then applies it to an HTML5 Canvas tag. Once applied, evercookie
	reads each pixel of the Canvas tag, extracting the RGB values, and thus
	producing the initial cookie data that was stored.

	<b>How does the Web History storage work</b>
	When evercookie sets a cookie, assuming the Web History caching is enabled,
	it Base64 encodes the data to be stored. Let's assume this data is "bcde"
	in Base64. Evercookie then accesses the following URLs in the background:
		google.com/evercookie/cache/b
		google.com/evercookie/cache/bc
		google.com/evercookie/cache/bcd
		google.com/evercookie/cache/bcde
		google.com/evercookie/cache/bcde-
	These URLs are now stored in history.

	When checking for a cookie, evercookie loops through all the possible Base64
	characters on google.com/evercookie/cache/, starting with "a" and moving up,
	but only for a single character. Once it sees a URL that was accessed, it
	attempts to brute force the next letter. This is actually extremely fast
	because <b>no requests</b> are made to theserver. The history lookups are simply
	locally in JavaScript using the <a href="http://samy.pl/csshack/">CSS History Knocker</a>. Evercookie knows it has
	reached the end of the string as soon as it finds a URL that ends in "-".
</PRE>
<H2>USAGE</H2><PRE>
    <b>&lt;script type="text/javascript" src="jquery-1.4.2.min.js"&gt;&lt;/script&gt;
    &lt;script type="text/javascript" src="swfobject-2.2.min.js"&gt;&lt;/script&gt;
    &lt;script type="text/javascript" src="evercookie.js"&gt;&lt;/script&gt;

    &lt;script&gt;
    var ec = new evercookie();</b>
    
    // set a cookie "id" to "12345"
    // usage: ec.set(key, value)
    <b>ec.set("id", "12345");</b>
    
    // retrieve a cookie called "id" (simply)
    <b>ec.get("id", function(value) { alert("Cookie value is " + value) });</b>

    // or use a more advanced callback function for getting our cookie
    // the cookie value is the first param
    // an object containing the different storage methods
    // and returned cookie values is the second parameter
    <b>function getCookie(best_candidate, all_candidates)
    {
        alert("The retrieved cookie is: " + best_candidate + "\n" +
        	"You can see what each storage mechanism returned " +
    		"by looping through the all_candidates object.");

    	for (var item in all_candidates)
    		document.write("Storage mechanism " + item +
    			" returned: " + all_candidates[item] + "&lt;br&gt;");
    }
    ec.get("id", getCookie);</b>
    
    // we look for "candidates" based off the number of "cookies" that
    // come back matching since it's possible for mismatching cookies.
    // the best candidate is most likely the correct one
    <b>&lt;/script&gt;</b>

</PRE>
<H2>SEE ALSO</H2><PRE>
    <B><a href="http://samy.pl/csshack/">csshack</a>, <a href="http://samy.pl">best website ever</a></B>

</PRE>
<H2>BUGS</H2><PRE>
    See <b>CONTACT</b>.

</PRE>
<H2>CONTACT</H2><PRE>
    Questions or comments, email me: <B><a href="mailto:code@samy.pl">code@samy.pl</a></B>.

    Visit <a href="http://samy.pl">http://samy.pl</a> for more awesome stuff.

</PRE>
<H2>evercookie, by <a href="mailto:code@samy.pl">Samy Kamkar</a>, 09/20/2010</h2>
</div>
</div></div>
<script type="text/javascript">
var gaJsHost = (("https:" == document.location.protocol) ? "https://ssl." : "http://www.");
document.write(unescape("%3Cscript src='" + gaJsHost + "google-analytics.com/ga.js' type='text/javascript'%3E%3C/script%3E"));
</script>
<script type="text/javascript">
try {
var pageTracker = _gat._getTracker("UA-6127617-2");
pageTracker._trackPageview();
} catch(err) {}</script>

</body>
</html>
