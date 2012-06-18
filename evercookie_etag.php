<?php
/* evercookie, by samy kamkar, 09/20/2010
 *  http://samy.pl : code@samy.pl
 *
 * This is the server-side ETag software which tags a user by 
 * using the Etag HTTP header, as well as If-None-Match to check
 * if the user has been tagged before.
 *
 * -samy kamkar
 */

// we don't have a cookie, so we're not setting it
if (!$_COOKIE["evercookie_etag"])
{
	// read our etag and pass back
	if (function_exists('apache_request_headers')) {
		$headers = apache_request_headers();
		echo $headers['If-None-Match'];
	} else {
		header("HTTP/1.1 500 Internal Server Error");
	}

	exit;
}

// set our etag
header('Etag: ' . $_COOKIE["evercookie_etag"]);
echo $_COOKIE["evercookie_etag"];

?>
