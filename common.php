<?php

$filename = dirname(__FILE__).'/playerinfo.json';
$jsonstr = file_get_contents($filename);
$data = json_decode($jsonstr,true);

if (isset($_POST["plyid"])){
	$plyid = $_POST["plyid"];
	$gameid = floor($plyid/2);
	$gameplyid = $plyid%2;
	if ($plyid<count($data['game'])*2) {	
		$data['game'][floor($plyid/2)]['player'][$plyid%2]['last_comm'] = time();
	}
}
if (!isset($record) && isset($plyid)) {
	file_put_contents($filename, json_encode($data));
}

?>