<?php

/**
 * Gets evercookie's cookie name for PHP's scripts to get value froms
 * 
 * @param string $file_name Usually it's a file name like 'evercookie_blabla.php'
 * @return string evercookie_blabla
 */
function evercookie_get_cookie_name($file_name) {
    if (!empty($_GET['cookie'])) {
        return $_GET['cookie'];
    }
    return basename($file_name, '.php');
}
