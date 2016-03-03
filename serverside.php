<?php 

$filename = dirname(__FILE__).'/playerinfo.json';
	
$lastmodif = isset($_GET['timestamp']) ? $_GET['timestamp'] : 0;
$currentmodif = filemtime($filename); 

while ($currentmodif <= $lastmodif) {
	usleep(10000);
	clearstatcache();
	$currentmodif = filemtime($filename);
}

$jsonstr = file_get_contents($filename);
$data = json_decode($jsonstr,true);

$response = array();
$response['move'] 		= $data["player"][0]['lastmove'];
$response['timestamp'] 	= $currentmodif;

echo json_encode($response);


?>
