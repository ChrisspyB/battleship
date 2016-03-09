<?php 
// ~to be replaced~
$record = 1;
include('common.php');

$placement = json_decode(stripslashes($_POST['map']));

$data['game'][floor($plyid%2)]["player"][$plyid]['map'] = $placement;
$data['game'][floor($plyid%2)]["player"][$plyid]['placed'] = 1;

file_put_contents($filename, json_encode($data));

?>
