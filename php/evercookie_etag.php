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
if (!isset($_COOKIE['evercookie_etag']) || empty($_COOKIE['evercookie_etag'])) {
    // read our etag and pass back
    if (!function_exists('apache_request_headers')) {

        function apache_request_headers()
        {
            // Source: http://www.php.net/manual/en/function.apache-request-headers.php#70810
            $arh = array();
            $rx_http = '/\AHTTP_/';
            foreach ($_SERVER as $key => $val) {
                if (preg_match($rx_http, $key)) {
                    $arh_key = preg_replace($rx_http, '', $key);
                    $rx_matches = array();
                    // do some nasty string manipulations to restore the original letter case
                    // this should work in most cases
                    $rx_matches = explode('_', $arh_key);
                    if (count($rx_matches) > 0 and strlen($arh_key) > 2) {
                        foreach ($rx_matches as $ak_key => $ak_val) {
                            $rx_matches[$ak_key] = ucfirst($ak_val);
                        }
                        $arh_key = implode('-', $rx_matches);
                    }
                    $arh[$arh_key] = $val;
                }
            }

            return ($arh);
        }
    }

    $headers = apache_request_headers();
    if(isset($headers['If-None-Match'])) {
		echo $headers['If-None-Match'];
	}

    header('Etag: '.$headers["If-None-Match"]);
	exit;
}

// set our etag
header('Etag: ' . $_COOKIE['evercookie_etag']);
echo $_COOKIE['evercookie_etag'];
