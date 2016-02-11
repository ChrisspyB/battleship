'use strict'
var canvas = document.getElementById('canvasBS');
var ctx = canvas.getContext('2d'); 

var game = {
	x:10,
	y:10,
	squareSize:32,
	boardSep:32,
	boardSqLen:10,
	squareColor: '#aaaaff'
};
game.boardLen = game.boardSqLen*game.squareSize;

var mark = {
	ship: 	1, 	//flag square has having a ship
	shot: 	2, 	//flag square as being shot
	interest:4 	//flag square as marked as interesting by player (RMB)
};

function GameManager(local){
	/*
	x,y 	= board origin
	local 	= is this an offline game
	*/
	var separation = 20; // *magic number
	this.boards = [	new Board(game.x,game.y),
					new Board(game.x + game.boardLen + game.boardSep, game.y)];
}

GameManager.prototype.draw = function() {
	
};

function Board(x,y){
	this.x = x;
	this.y = y;
	this.friendly = true; // Does the board belong to the local player
	this.map = [];
	for (var i=0; i++; i<game.boardSqLen){
		for (var i=0; i<game.boardSqLen; i++ ){
			this.map.append(0);
		}
	}
}
Board.prototype.addShip = function(x,y,h,hor) {
	/*
	x,y = grid position of top left of ship.
	h 	= length of ship
	hor = (optional) if true ship is placed horizontal. Vertical otherwise
	*/
	hor = hor || 0;
	if(hor){
		for (var i=x; i<x+h; i++){
			this.map[i][y] = 1;
		}
	}
	else{
		for (var i=y; i<y+h; i++){
			this.map[x][i] = 1;
		}
	}
};

Board.prototype.draw = function() {
	for (var x=this.x; x<this.x+game.boardLen; x+=game.squareSize){
		for (var y=this.y; y<this.y+game.boardLen; y+=game.squareSize){
			ctx.beginPath();
			ctx.rect(x,y,game.squareSize,game.squareSize);
			ctx.fillStyle = game.squareColor
			// Render extra here...
			ctx.fill();
			ctx.stroke();
			ctx.closePath();
		}
	}
};
Board.prototype.clickSquare = function(mouse_x,mouse_y) {
	if (mouse_x < this.x || mouse_x > this.x + game.boardLen ||
		mouse_y < this.y || mouse_y > this.y + game.boardLen) { return; }
	var i = Math.floor((mouse_x - this.x) / game.squareSize);
	var j = Math.floor((mouse_y - this.y) / game.squareSize);
};	



//Testing
var gm = new GameManager(true);
gm.boards[0].draw();
gm.boards[1].draw();

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