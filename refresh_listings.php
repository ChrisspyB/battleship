<?php 

include('common.php');

$players=array();

for ($x=0; $x<count($data['game']); $x++){
	array_push($players, $data['game'][$x]['players']);
}

echo json_encode($players);

?>
