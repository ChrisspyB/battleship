<?php 

$filename = dirname(__FILE__).'/playerinfo.json';
$jsonstr = file_get_contents($filename);
$data = json_decode($jsonstr,true);
$plyid = (int) $_POST["plyid"];

$placement = json_decode(stripslashes($_POST['map']));

$data['game'][0]["player"][$plyid]['map'] = $placement;
$data['game'][0]["player"][$plyid]['placed'] = 1;

file_put_contents($filename, json_encode($data));

// echo json_encode($placement);
// echo $_POST['data'];
?>
