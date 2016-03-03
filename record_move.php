<?php 

$filename = dirname(__FILE__).'/playerinfo.json';
$jsonstr = file_get_contents($filename);
$data = json_decode($jsonstr,true);
$plyid = (int) $_POST["plyid"]

$data["player"][$plyid]['lastmove'] = (int) $_POST["move"];

file_put_contents($filename, json_encode($data));

?>
