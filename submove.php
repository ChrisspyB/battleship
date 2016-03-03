<?php 

$filename = dirname(__FILE__).'/playerinfo.json';
$jsonstr = file_get_contents($filename);
$data = json_decode($jsonstr,true);

$data["player"][0]['lastmove'] = (int) $_POST["move"];

file_put_contents($filename, json_encode($data));

?>
