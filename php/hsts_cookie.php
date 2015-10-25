<?php
//header('Access-Control-Allow-Origin: *');
$is_ssl = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443;

if(isset($_GET['SET'])){
	if($is_ssl){
		header('Strict-Transport-Security: max-age=31536000');
        header('Content-type: image/png');
        echo base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAgAAAAJCAIAAACAMfp5AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYSURBVBhXY/z//z8DNsAEpTHAkJJgYAAAo0sDD8axyJQAAAAASUVORK5CYII=');
	}else{
		$redirect = "https://".$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI'];
		header("Location: $redirect");
	}
	die();
}

if(isset($_GET['DEL'])){
	if($is_ssl){
		header('Strict-Transport-Security: max-age=0');
	}else{
		$redirect = "https://".$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI'];
		header("Location: $redirect");
	}
	die();
}

if($is_ssl){
	header('Content-type: image/png');
	// some white pixel
	echo base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAgAAAAJCAIAAACAMfp5AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYSURBVBhXY/z//z8DNsAEpTHAkJJgYAAAo0sDD8axyJQAAAAASUVORK5CYII=');
	die();
}else{
	header('X-PHP-Response-Code: 404', true, 404);
}
?>
