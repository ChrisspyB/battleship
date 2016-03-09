<?php 

$record = 1;
include('common.php');

$data['game'][floor($plyid%2)]["player"][$plyid]['lastmove'] = (int) $_POST["move"];

file_put_contents($filename, json_encode($data));

?>
