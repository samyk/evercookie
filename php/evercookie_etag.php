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
if (empty($_COOKIE['evercookie_etag'])) {
    header("HTTP/1.1 304 Not Modified");
    header("If-None-Match: *");
    exit;
}

// set our etag
header("HTTP/1.1 200 OK");
header('Etag: ' . $_COOKIE['evercookie_etag']);
echo $_COOKIE['evercookie_etag'];
exit;
