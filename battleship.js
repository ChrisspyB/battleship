'use strict'
var canvas = document.getElementById('canvasBS');
var ctx = canvas.getContext('2d'); 

var rot_toggled = false; //

var STATE = {
	placement:0,
	leftTurn:1,
	rightTurn:2,
	gameOver:3
};
var COLOR = {
	water:'#aaaaff',
	ship:'#aaaaaa',
	hit:'#ffaaaa',
	miss:'#ddddff'
};
var shipHeight = [5,4,3,3,2];
var maxHits = 0;
for (var i=0; i<shipHeight.length; i++){
	maxHits += shipHeight[i];
}
var game = {
	x:10,
	y:10,
	squareSize:38,
	boardSep:32,
	boardSqLen:10,
	state:STATE.placement
};
game.boardLen = game.boardSqLen*game.squareSize;

var mark = {
	ship: 	1,
	shot: 	2,
	interest:4 	//flag square as marked as interesting by player (eg by RMB)
};
function GameManager(local){
	/*
	local 	= is this an offline game
	*/
	this.boards = [	new Board(game.x,game.y,this),
					new Board(game.x + game.boardLen + game.boardSep, game.y,this)];
	this.aiMoves=[];
}
GameManager.prototype.draw = function() {
	this.drawUI();
	this.boards[0].draw();
	this.boards[1].draw();
};
GameManager.prototype.drawUI = function() {
	ctx.font = "16px Arial";
	ctx.textAlign="center";
	ctx.fillStyle = "#000000";
	ctx.fillText("State: "+game.state, canvas.width/2, canvas.height - 50);
};
GameManager.prototype.playAI = function(){
	// very dirty, inefficient, rubbish ai just for the moment.
	// no minimum run time hoooray!
	var generating = true;
	var move = []
	while (generating){
		generating = false;
		move = [Math.floor(Math.random()*10),Math.floor(Math.random()*10)];
		for (var i=0; i<this.aiMoves.length; i++){
			if (move[0] == this.aiMoves[i][0] && move[1] == this.aiMoves[i][1]){
				console.log('REPEAT ASLJDHAKSD GAKJ')
				generating=true;
				break;
			}
		}
	}
	this.aiMoves.push(move);
	this.boards[0].shootSquare(move[0],move[1]);
	game.state = STATE.leftTurn;
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

Board.prototype.addShip = function(x,y) {
	/*
	x,y = grid position of top left of ship.
	*/
	if (this.ships >= shipHeight.length){return;}
	var h   = shipHeight[this.ships]

	if(rot_toggled){
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
Board.prototype.draw = function() {
	for (var i=0; i<game.boardSqLen; i++){
		for (var j=0; j<game.boardSqLen; j++){
			this.drawSquare(i,j);
		}
	}
};
Board.prototype.drawSquare = function(i,j) {
	ctx.beginPath();
	ctx.rect(this.x+game.squareSize*i,this.y+game.squareSize*j,game.squareSize,game.squareSize);
	if(this.map[i][j] & mark.shot && this.map[i][j] & mark.ship) {
		ctx.fillStyle = COLOR.hit; }
	else if (this.map[i][j] & mark.shot) { ctx.fillStyle = COLOR.miss; }
	else if (this.map[i][j] & mark.ship) { ctx.fillStyle = COLOR.ship; }
	else {ctx.fillStyle = COLOR.water}
	ctx.fill();
	ctx.stroke();
	ctx.closePath();

};
Board.prototype.shootSquare = function(i,j) {
	this.map[i][j] = this.map[i][j] | mark.shot;
	if (this.map[i][j] & mark.ship){
		console.log('Hit!');
		this.health--;
	}else{
		console.log('Miss!');
	}
	this.drawSquare(i,j);
};
Board.prototype.clickSquare = function(mouse_x,mouse_y,placement) {
	if (mouse_x < this.x || mouse_x > this.x + game.boardLen ||
		mouse_y < this.y || mouse_y > this.y + game.boardLen) { return; }
	var i = Math.floor((mouse_x - this.x) / game.squareSize);
	var j = Math.floor((mouse_y - this.y) / game.squareSize);

	if (placement){
		this.addShip(i,j);
	}else if (game.state == STATE.leftTurn && !(this.map[i][j] & mark.shot)){
		
		this.shootSquare(i,j);

		game.state = STATE.rightTurn; 
		this.manager.drawUI();
		this.manager.playAI();
	}
};	

//Testing
var gm = new GameManager(true);
for (var i = 0; i<shipHeight.length; i++){
	gm.boards[1].addShip(i*2,1);
}
gm.draw();	

document.addEventListener('click',function(event){
	var rect = canvas.getBoundingClientRect();
	var mouse_x = event.clientX  - rect.left;
	var mouse_y = event.clientY - rect.top;
	if (mouse_x > game.x + game.boardLen && game.state != STATE.placement){
		gm.boards[1].clickSquare(mouse_x,mouse_y,false);
	}
	else if (game.state == STATE.placement) {
		gm.boards[0].clickSquare(mouse_x,mouse_y,true);
	}
});

function mouseMove (event) {
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