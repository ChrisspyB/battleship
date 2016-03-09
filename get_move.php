<?php 

include('common.php');

if($data['game'][$gameid]["player"][1-$gameplyid]['moved'] == 1){
	$data['game'][$gameid]["player"][1-$gameplyid]['moved'] = 0;
	echo $data['game'][$gameid]["player"][1-$gameplyid]['lastmove'];
}
echo null;
?>
