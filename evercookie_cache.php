<?php
/* evercookie, by samy kamkar, 09/20/2010
 *  http://samy.pl : code@samy.pl
 *
 * This is the server-side simple caching mechanism.
 *
 * -samy kamkar
 */

// we don't have a cookie, user probably deleted it, force cache
if (!$_COOKIE["evercookie_cache"])
{
	header("HTTP/1.1 304 Not Modified");
	exit;
}

header('Content-Type: text/html');
header('Last-Modified: Wed, 30 Jun 2010 21:36:48 GMT');
header('Expires: Tue, 31 Dec 2030 23:30:45 GMT');
header('Cache-Control: private, max-age=630720000');

echo $_COOKIE["evercookie_cache"];
