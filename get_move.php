<?php 

$filename = dirname(__FILE__).'/playerinfo.json';
$jsonstr = file_get_contents($filename);
$data = json_decode($jsonstr,true);

echo (int) $data["player"][0]['lastmove'];

?>
