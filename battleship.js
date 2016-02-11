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

var game = {
	x:10,
	y:10,
	squareSize:32,
	boardSep:32,
	boardSqLen:10,
	state:STATE.placement
};
game.boardLen = game.boardSqLen*game.squareSize;

var mark = {
	ship: 	1,
	hit: 	2,
	miss: 	4,
	interest:8 	//flag square as marked as interesting by player (eg by RMB)
};
function GameManager(local){
	/*
	local 	= is this an offline game
	*/
	this.boards = [	new Board(game.x,game.y),
					new Board(game.x + game.boardLen + game.boardSep, game.y)];
}
GameManager.prototype.draw = function() {
	this.drawUI();
	this.boards[0].draw();
	this.boards[1].draw();
};
GameManager.prototype.drawUI = function() {
};

function Board(x,y){
	this.x = x;
	this.y = y;
	this.ships = 0;
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
	if (this.ships == shipHeight.length){return;}
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

			ctx.beginPath();
			ctx.rect(this.x+game.squareSize*i,this.y+game.squareSize*j,game.squareSize,game.squareSize);
			if(this.map[i][j] & mark.hit) {	ctx.fillStyle = COLOR.hit; }
			else { ctx.fillStyle = COLOR.water; }
			ctx.fill();
			ctx.stroke();
			ctx.closePath();
			if(this.map[i][j] & mark.ship) {
				// draw ship ...
				ctx.beginPath();
				ctx.rect(this.x+game.squareSize*i,this.y+game.squareSize*j,game.squareSize,game.squareSize);
				ctx.fillStyle = COLOR.ship;
				ctx.fill();
				ctx.closePath();
			}
		}
	}
};
Board.prototype.clickSquare = function(mouse_x,mouse_y) {
	if (mouse_x < this.x || mouse_x > this.x + game.boardLen ||
		mouse_y < this.y || mouse_y > this.y + game.boardLen) { return; }
	var i = Math.floor((mouse_x - this.x) / game.squareSize);
	var j = Math.floor((mouse_y - this.y) / game.squareSize);

	if (game.state == STATE.placement){
		this.addShip(i,j)
	}
};	


//Testing
var gm = new GameManager(true);
gm.draw();


document.addEventListener('click',function(event){
	var rect = canvas.getBoundingClientRect();
	var mouse_x = event.clientX  - rect.left;
	var mouse_y = event.clientY - rect.top;
	if (mouse_x > game.x + game.boardLen){
		gm.boards[1].clickSquare(mouse_x,mouse_y);
	}
	else{
		gm.boards[0].clickSquare(mouse_x,mouse_y);
	}
});

function mouseMove (event) {
	if (game.state!=STATE.placement){
		document.removeEventListener('mousemove',mouseMove);
		return;
	}

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
}
document.addEventListener('mousemove',mouseMove);

document.addEventListener('keydown',function(event){
	if (event.keyCode == 32){
		rot_toggled = ~rot_toggled;
		// mouseMove(event);
	}
});