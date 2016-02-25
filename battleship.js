'use strict'
var canvas = document.getElementById('canvasBS');
var ctx = canvas.getContext('2d'); 

var rot_toggled = false; //
var draw_rhs = false; // draw the opponents pieces? For debugging.
var STATE = {
	placement:0,
	leftTurn:1,
	rightTurn:2,
	gameOver:3,
	menu:4,
	mpGameList:5
};
var COLOR = {
	water:'#aaaaff',
	ship:'#aaaaaa',
	hit:'#ffaaaa',
	miss:'#ddddff'
};
var shipHeight = [2]; // list of battle ships, def: [5,4,3,3,2]
var maxHits = 0;
for (var i=0; i<shipHeight.length; i++){
	maxHits += shipHeight[i];
}
var game = {
	x:10,
	y:10,
	squareSize:38,
	boardSep:32, //separation of two boards
	boardSqLen:10, //length of boards, in squares
	state:STATE.menu,
};
game.boardLen = game.boardSqLen*game.squareSize;

var mark = {
	ship:1,
	shot:2,
	interest:4 	//flag square as marked as interesting by player (eg by RMB)
};
function GameManager(local){
	/*
	local 	= is this an offline game
	*/
	this.boards = [	new Board(game.x,game.y,this),
					new Board(game.x + game.boardLen + game.boardSep, game.y,this)];
	this.aiMoves=[]; // * TEMP METHOD OF HANDLING AI
	this.mp = false;
}
GameManager.prototype.newGame = function(mp) {
	if(mp){
		console.log('not yet implemented');
		game.state = STATE.mpGameList;
		this.draw();
		return;
		this.mp = true;
	}
	else{
		this.boards[1].placeRandom();
		this.mp = false;
	}
	//shared
	game.state = STATE.placement;
	this.draw();
};
GameManager.prototype.nextPlayer = function(move) {
	if(game.state == STATE.gameOver){
		this.drawUI();
		return;
	}
	game.state = game.state == STATE.rightTurn ? STATE.leftTurn : STATE.rightTurn;
	if (this.mp){
		if (move<100){ //end local player's turn
			this.mpSendMove(move);
		}
		else{ // begin local player's turn

		}
	}
	else{
		if (game.state==STATE.rightTurn) {this.playAI()};
	}
};
GameManager.prototype.mpSendMove = function(move) {
	// send move to server
};
GameManager.prototype.mpReceiveMove = function(move) {
	this.boards[game.state = game.state == STATE.rightTurn ? 0 : 1].shootSquare(move%10,Math.floor(move/10));
	this.nextPlayer(100);
};
GameManager.prototype.draw = function() {
	this.drawUI();
	if(game.state >= STATE.menu ){return;}
	this.boards[0].draw(true);
	this.boards[1].draw(draw_rhs);
};
GameManager.prototype.drawUI = function() {
	if(game.state==STATE.gameOver){	
		ctx.font = "16px Arial";
		ctx.textAlign="center";
		ctx.fillStyle = "#000000";
		ctx.fillText("Game Over!", canvas.width/2, canvas.height - 50);
	}else if (game.state==STATE.menu){
		ctx.clearRect(0,0,canvas.width,canvas.height);
		ctx.font = "16px Arial";
		ctx.textAlign="center";
		ctx.fillStyle = "#000000";
		ctx.fillText("Single Player vs AI", canvas.width/4, canvas.height/2);
		ctx.fillText("Online Multiplayer", 3*canvas.width/4, canvas.height/2);
		ctx.beginPath();
		ctx.moveTo(canvas.width/2,0);
		ctx.lineTo(canvas.width/2,canvas.height);
		ctx.stroke();
	}
	else if (game.state==STATE.mpGameList){
		ctx.clearRect(0,0,canvas.width,canvas.height);
		ctx.font = "16px Arial";
		ctx.textAlign="center";
		ctx.fillStyle = "#000000";
		ctx.fillText("Back", canvas.width/2, 7*canvas.height/8);
		ctx.beginPath();
		ctx.moveTo(0,3*canvas.height/4);
		ctx.lineTo(canvas.width,3*canvas.height/4);
		ctx.stroke();
	}
};
GameManager.prototype.playAI = function(){
	// very dirty, inefficient, rubbish ai just for the moment.
	// no minimum run time hoooray!
	var generating = true;
	var move = 0;
	while (generating){
		generating = false;
		move = Math.floor(Math.random()*game.boardSqLen) + 10*Math.floor(Math.random()*game.boardSqLen);
		for (var i=0; i<this.aiMoves.length; i++){
			if (move == this.aiMoves[i]){
				generating=true;
				break;
			}
		}
	}
	this.aiMoves.push(move);
	this.boards[0].shootSquare(move%10,Math.floor(move/10));
	this.nextPlayer(0);
}

function Board(x,y,gm){
	this.x = x;
	this.y = y;
	this.manager = gm;
	this.ships = 0;
	this.health = maxHits;
	this.friendly = true; // Does the board belong to the local player
	this.map = [];
	for (var i=0; i<game.boardSqLen; i++ ){
		this.map.push([]);
		for (var j=0; j<game.boardSqLen; j++ ){	
			this.map[i].push(0);
		}
	}
}

Board.prototype.addShip = function(x,y,rot) {
	/*
	x,y = grid position of top left of ship.
	*/
	if (this.ships >= shipHeight.length){return;}
	var h   = shipHeight[this.ships]

	if(rot){
		if (x+h > game.boardSqLen){return;}
		for (var i=x; i<x+h; i++){
			if (this.map[i][y] & mark.ship){return;}
		}
		for (var i=x; i<x+h; i++){
			this.map[i][y] = mark.ship;
		}
	}
	else{
		if (y+h > game.boardSqLen){return;}
		for (var i=y; i<y+h; i++){
			if (this.map[x][i] & mark.ship){return;}
		}
		for (var i=y; i<y+h; i++){
			this.map[x][i] = mark.ship;
		}		
	}

	this.ships+=1;
};
Board.prototype.placeRandom = function() {
	if (this.ships >= shipHeight.length){return;}
	var h = shipHeight[this.ships];
	var rot = Math.random() < 0.5 ? true : false;
	var x = Math.floor(Math.random()*(game.boardSqLen - (rot ? h:0)));
	var y = Math.floor(Math.random()*(game.boardSqLen - (rot ? 0:h)));
	this.addShip(x,y,rot);
	this.placeRandom();
};
Board.prototype.draw = function(showShips) {
	for (var i=0; i<game.boardSqLen; i++){
		for (var j=0; j<game.boardSqLen; j++){
			this.drawSquare(i,j,showShips);
		}
	}
};
Board.prototype.drawSquare = function(i,j,showShips) {
	ctx.beginPath();
	ctx.rect(this.x+game.squareSize*i,this.y+game.squareSize*j,game.squareSize,game.squareSize);
	if(this.map[i][j] & mark.shot && this.map[i][j] & mark.ship) {
		ctx.fillStyle = COLOR.hit; }
	else if (this.map[i][j] & mark.shot) { ctx.fillStyle = COLOR.miss; }
	else if (this.map[i][j] & mark.ship) { 
		ctx.fillStyle = showShips ? COLOR.ship:COLOR.water; }
	else {ctx.fillStyle = COLOR.water}
	ctx.fill();
	ctx.stroke();
	ctx.closePath();

};
Board.prototype.shootSquare = function(i,j) {
	this.map[i][j] = this.map[i][j] | mark.shot;
	if (this.map[i][j] & mark.ship){
		this.health--;
	}
	this.drawSquare(i,j);
	if (this.health<=0){
		game.state = STATE.gameOver;
		this.manager.drawUI();
	}
};
Board.prototype.clickSquare = function(mouse_x,mouse_y,placement) {
	if (mouse_x < this.x || mouse_x > this.x + game.boardLen ||
		mouse_y < this.y || mouse_y > this.y + game.boardLen) { return; }
	var i = Math.floor((mouse_x - this.x) / game.squareSize);
	var j = Math.floor((mouse_y - this.y) / game.squareSize);
	if (i > 9){ i = 9;} 
	if (j > 9){ j = 9;} 
	if (placement){
		this.addShip(i,j,rot_toggled);
	}
	else if (game.state == STATE.leftTurn && !(this.map[i][j] & mark.shot)){
		this.shootSquare(i,j);
		this.manager.nextPlayer(i+j*10);
	}
};	

//

var gm = new GameManager(true);	
gm.draw();


document.addEventListener('click',function(event){
	var rect = canvas.getBoundingClientRect();
	var mouse_x = event.clientX  - rect.left;
	var mouse_y = event.clientY - rect.top;
	if (game.state == STATE.menu){
		gm.newGame(mouse_x>canvas.width/2);
	}
	else if (game.state == STATE.mpGameList && mouse_y>3*canvas.height/4){

		game.state = STATE.menu;
		gm.draw();
	}
	else if (mouse_x > game.x + game.boardLen && game.state != (STATE.placement || STATE.gameOver)){
		gm.boards[1].clickSquare(mouse_x,mouse_y,false);
	}
	else if (game.state == STATE.placement) {
		gm.boards[0].clickSquare(mouse_x,mouse_y,true);
	}
});

function mouseMove (event) {
	// only called during placement
	if (game.state != STATE.placement){return;}
	var rect = canvas.getBoundingClientRect();
	var mouse_x = event.clientX  - rect.left;
	var mouse_y = event.clientY - rect.top;
	ctx.clearRect(0,0,canvas.width,canvas.height);
	gm.draw();
	ctx.beginPath();
	if (rot_toggled)
		for (var i=0; i<shipHeight[gm.boards[0].ships]; i++) { 
			ctx.rect(mouse_x+game.squareSize*i-game.squareSize/2,mouse_y,game.squareSize,game.squareSize);
		}
	else{
		for (var i=0; i<shipHeight[gm.boards[0].ships]; i++) { 
			ctx.rect(mouse_x-game.squareSize/2,mouse_y+game.squareSize*i,game.squareSize,game.squareSize);
		}
	}
	ctx.fillStyle = COLOR.ship;
	ctx.fill();
	ctx.stroke();
	ctx.closePath();

	if (gm.boards[0].ships >= shipHeight.length){
		game.state = STATE.leftTurn;
		ctx.clearRect(0,game.boardSqLen+game.y,canvas.width,canvas.height);
		gm.draw();
		document.removeEventListener('mousemove',mouseMove);
		return;
	}
}
document.addEventListener('mousemove',mouseMove);

document.addEventListener('keyup',function(event){
	if (event.keyCode == 32){
		rot_toggled = ~rot_toggled;
		// mouseMove(event);
	}
});
