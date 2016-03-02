<?php 

$filename = dirname(__FILE__).'/playerinfo.json';

if($_GET['moving']==1){
	
	$jsonstr = file_get_contents($filename);
	$data = json_decode($jsonstr,true);

	$data["player1"]['lastmove'] = (int) $_GET["move"];
	
	file_put_contents($filename, json_encode($data));
}
else if ($_GET['moving']==0){
	
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
	$response['move'] 		= $data["player1"]['lastmove'];
	$response['timestamp'] 	= $currentmodif;

	echo json_encode($response);
}

?>
