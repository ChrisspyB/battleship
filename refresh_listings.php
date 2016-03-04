<?php 

$filename = dirname(__FILE__).'/playerinfo.json';
$jsonstr = file_get_contents($filename);
$data = json_decode($jsonstr,true);

$players=array();

for ($x=0; $x<count($data['game']); $x++){
	array_push($players, $data['game'][$x]['players']);
}

echo json_encode($players);

?>
