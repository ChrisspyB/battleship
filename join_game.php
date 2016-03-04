<?php 

$filename = dirname(__FILE__).'/playerinfo.json';
$jsonstr = file_get_contents($filename);
$data = json_decode($jsonstr,true);
$slot = (int) $_POST["game"];
$plyindex = (int) $_POST["plyindex"];

if ($plyindex < count($data['game'])*2){
	//remove player from previous game
	$data['game'][floor($plyindex/2)]['player'][$plyindex%2];
	$data['game'][floor($plyindex/2)]['players']-=1;
}
if($slot>=0){
	$response_index = $data['game'][$slot]['players'];

	if ($response_index<2){
		//update json
		$data['game'][$slot]['players']++;
	}
	echo intval($response_index);	
}

file_put_contents($filename, json_encode($data));
?>
