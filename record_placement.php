<?php 
// ~to be replaced~
$record = 1;
include('common.php');

$placement = json_decode(stripslashes($_POST['placement']));

$data['game'][$gameid]["player"][$gameplyid]['placement'] = $placement;
$data['game'][$gameid]["player"][$gameplyid]['placed'] = 1;

file_put_contents($filename, json_encode($data));

?>
