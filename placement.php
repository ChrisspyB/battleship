<?php 

$filename = dirname(__FILE__).'/playerinfo.json';
$placement = json_decode(stripslashes($_POST['data']));
echo json_encode($placement);

?>
