<?php
/* evercookie, by samy kamkar, 09/20/2010
 *  http://samy.pl : code@samy.pl
 *
 * This is the server-side variable PNG generator for evercookie.
 * If an HTTP cookie is passed, the cookie data gets converted into
 * RGB-values in a PNG image. The PNG image is printed out with a
 * 20-year cache expiration date.
 *
 * If for any reason this file is accessed again WITHOUT the cookie,
 * as in the user deleted their cookie, the code returns back with
 * a forced 'Not Modified' meaning the browser should look at its
 * cache for the image.
 *
 * The client-side code then places the cached image in a canvas and
 * reads it in pixel by pixel, converting the PNG back into a cookie.
 *
 * -samy kamkar
 */

// we get cookie name from current file name so remember about it when rename of this file will be required
include dirname(__FILE__) . DIRECTORY_SEPARATOR . '_cookie_name.php';
$cookie_name = evercookie_get_cookie_name(__FILE__);

// we don't have a cookie, user probably deleted it, force cache
if (empty($_COOKIE[$cookie_name])) {
    if(!headers_sent()) {
        header('HTTP/1.1 304 Not Modified');
    }
    exit;
}

// width of 200 means 600 bytes (3 RGB bytes per pixel)
$x = 200;
$y = 1;

$gd = imagecreatetruecolor($x, $y);

$data_arr = str_split($_COOKIE[$cookie_name]);

$x = 0;
$y = 0;
for ($i = 0, $i_count = count($data_arr); $i < $i_count; $i += 3) {
    $red   = isset($data_arr[$i])   ? ord($data_arr[$i])   : 0;
    $green = isset($data_arr[$i+1]) ? ord($data_arr[$i+1]) : 0;
    $blue  = isset($data_arr[$i+2]) ? ord($data_arr[$i+2]) : 0;
    $color = imagecolorallocate($gd, $red, $green, $blue);
    imagesetpixel($gd, $x++, $y, $color);
}

if(!headers_sent()) {
    header('Content-Type: image/png');
    header('Last-Modified: Wed, 30 Jun 2010 21:36:48 GMT');
    header('Expires: Tue, 31 Dec 2030 23:30:45 GMT');
    header('Cache-Control: private, max-age=630720000');
}

// boom. headshot.
imagepng($gd);
