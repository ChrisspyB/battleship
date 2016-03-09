<?php 

include('common.php');

$otherid = 1 - $gameplyid;
if ($data['game'][$gameid]["player"][$otherid]['placed'] == 1){
	echo json_encode($data['game'][$gameid]["player"][$otherid]['placement']);
}
else {
	echo 0;
}
?>
