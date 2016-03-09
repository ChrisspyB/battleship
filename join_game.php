<?php 

include('common.php');

$slot = (int) $_POST["game"];

if ($plyid < count($data['game'])*2){
	//remove player from previous game 
	$data['game'][$gameid]['player'][$gameplyid]['locked'] = 0;
	$data['game'][$gameid]['players']-=1;
}

if($slot>=0){
	$new_id = $data['game'][$slot]['players'];

	if ($new_id<2){
		//update json
		$data['game'][$slot]['players']++;
		if ($data['game'][$slot]['player'][$new_id]['locked']==1){
			$new_id = $new_id==1 ? 0 : 1;
		}
		$data['game'][$slot]['player'][$new_id]['last_comm'] = time();
		$data['game'][$slot]['player'][$new_id]['locked'] = 1;
	}
	echo $new_id;
}

file_put_contents($filename, json_encode($data));
?>