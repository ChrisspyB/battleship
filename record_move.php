<?php 

$record = 1;
include('common.php');

$data['game'][$gameid]["player"][$gameplyid]['lastmove'] = (int) $_POST["move"];
$data['game'][$gameid]["player"][$gameplyid]['moved'] = 1;

file_put_contents($filename, json_encode($data));

?>
