'use strict'

// This code is very much a work in progress.

//*GameManager should probably be a simple object, without all this prototyping...*
//*Need to implement client timeout*
var canvas = document.getElementById('canvasBS');
var ctx = canvas.getContext('2d'); 
var default_text = {
	font: "16px Arial",
	baseline: 'middle',
	align:'center',
	fill:'#000000'
};
ctx.font = default_text.font;
ctx.textBaseline = default_text.baseline;
ctx.textAlign=default_text.align;

var rot_toggled = false; //
var TEMP_mouse_pos_X // Temporary fix to rotation lag
var TEMP_mouse_pos_Y // in placement phase. Make it more elegant.
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
var mpgames = 4; //Number of allowed mp games at any one time. MUST MANUALLY CHANGE NUMBER OF JSON ENTRIES IF THIS IS CHANGED.
var shipHeight = [5]; // list of battle ships, def: [5,4,3,3,2]
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
	//*Multiplayer*
	lastmove:100,
	inProgress:false, // marked true whenever player joins a game
	svPlayers:[],
	svRefreshing:false,
	svAutoRefresh:false,
	gameindex:mpgames, //which mp game are we playing? if !<mpgames, we aren't playing any
	localplayerindex:mpgames*2,//assigned by server, evens play on left.
	otherplayerindex:mpgames*2,
};
for (var i=0; i<mpgames; i++){
	game.svPlayers.push(2);
}
game.boardLen = game.boardSqLen*game.squareSize;

var mark = {
	ship:1,
	shot:2,
	interest:4 	//flag square as marked as interesting by player (eg by RMB)
};
function GameManager(local){
	this.boards = [	new Board(game.x,game.y,this),
					new Board(game.x + game.boardLen + game.boardSep, game.y,this)];
	this.aiMoves=[]; // * TEMP METHOD OF HANDLING AI
	this.mp = false;
}
GameManager.prototype.newGame = function(mp) {
	if(mp){
		console.log('mp still under construction...');
		game.state = STATE.mpGameList;
		game.svAutoRefresh = true;
		// this.mpSendMove(666);
		// this.mpWaitMove();
		// return;
		this.mp = true;
		this.mpRefreshListings();
	}
	else{
		this.boards[1].placeRandom();
		this.mp = false;
		game.state = STATE.placement;
		this.draw();
	}
	//shared
	document.addEventListener('mousemove',mouseMove);
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
GameManager.prototype.mpWaitMove = function() {
	$.ajax({
			type: "POST",
			url: "get_move.php",
			data:{plyid:game.localplayerindex},
			async: true,
			cache: false,
			success: function(move){
				var move = parseInt(move);
				if(move>=0 && move<100 && move!=game.lastmove){
					console.log('Opponent move received: '+move);
					game.lastmove = move;
					gm.boards[0].shootSquare(move%10,Math.floor(move/10)); //***gm
					game.state = STATE.leftTurn;
				}
				else{
					console.log('no new move yet');
					setTimeout('gm.mpWaitMove()',2500);
				}
			},
				error: function(XMLHttpRequest,textStatus,errorThrown){
				alert('error: '+textStatus + '(' + errorThrown + ')');
				console.log('error: '+textStatus + '(' + errorThrown + ')');
				setTimeout('waitMove()',15000);
			}
		});
};
GameManager.prototype.mpSendMove = function(move) {
	// send move to server
	$.ajax({
        type: "POST",
        url: "record_move.php",
        data: {move:move,plyid:game.localplayerindex}, 
        cache: false,
        success: function(data){
            console.log('Move '+move+' received by server');
            gm.mpWaitMove();
		},
        error: function(XMLHttpRequest,textStatus,errorThrown){
			alert('Error: Move could not be sent.');
			console.log('error: '+textStatus + '(' + errorThrown + ')');
		}
    });

};
GameManager.prototype.mpReceiveMove = function(move) {
	this.boards[game.state = game.state == STATE.rightTurn ? 0 : 1].shootSquare(move%10,Math.floor(move/10));
	this.nextPlayer(100);
};
GameManager.prototype.mpSendPlacement = function() {
	// body...
	var placement = [];
	for (var i=0; i<10; i++){
		for(var j=0; j<10; j++){
			if (this.boards[0].map[i][j] == mark.ship ){
				placement.push(i+j*10);
			}
		}
	}
	var sendme = JSON.stringify(placement);
	$.ajax({
        type: "POST",
        url: "record_placement.php",
        data:{placement: sendme, plyid:game.localplayerindex}, 
        cache: false,
        success: function(data){
            console.log('Placement received by server');
            gm.mpGetPlacement(); //***
        },
        error: function(XMLHttpRequest,textStatus,errorThrown){
			alert('Error: Could not send placement to server.');
			console.log('error: '+textStatus + '(' + errorThrown + ')');

			// ** RETRY? **
		}
    });
};
GameManager.prototype.mpGetPlacement = function() {
	$.ajax({
        type: "POST",
        url: "get_placement.php",
        data:{plyid:game.localplayerindex}, 
        cache: false,
        dataType: 'json',
        success: function(data){
        	console.log('Getting placement. Got: ' + data);
        	if (data == 0){
            	console.log('Waiting for other player to place...');
            	setTimeout('gm.mpGetPlacement()',5000); //***
        	}else {
            	console.log('Other players placement received');
            	for(var i=0; i<data.length; i++){
            		var x = data[i]%10;
            		var y = Math.floor(data[i]/10);
            		gm.boards[1].map[x][y] = mark.ship;
            	}
				game.state = game.localplayerindex%2==0 ? STATE.leftTurn : STATE.rightTurn;
				console.log(game.localplayerindex);
				if(game.state==STATE.rightTurn){
					gm.mpWaitMove();
				}
				gm.draw();
            	//commence game
        	}
        },
        error: function(XMLHttpRequest,textStatus,errorThrown){
			alert('Error: Could not send placement to server.');
			console.log('error: '+textStatus + '(' + errorThrown + ')');
		}
    });
};
GameManager.prototype.mpRefreshListings = function() {
	if(game.state != STATE.mpGameList){
		game.svAutoRefresh = true;
		game.svRefreshing=false;
		return;
	}
	game.svRefreshing = true;
	this.drawUI();
	$.ajax({
			type: "POST",
			url: "refresh_listings.php",
			async: true,
			cache: false,
			dataType: 'json',
			success: function(data){
				console.log('Player list refreshed...')
				for (var i=0; i<game.svPlayers.length; i++){
					game.svPlayers[i]=data[i];
				}
				game.svRefreshing = false;
				gm.drawUI(); //*!!!*

				if(game.svPlayers[game.gameindex]==2){
					console.log('Game has two players, attempting to start game..');
					gm.mpBeginGame(); //*!!!*
				}
				else if(game.svAutoRefresh){
					setTimeout('gm.mpRefreshListings()',10000);
				}
			},
			error: function(XMLHttpRequest,textStatus,errorThrown){
				game.svRefreshing = false;
				gm.drawUI(); //*!!!*
				alert('Error: Could not refresh server listing.');
			}
		});
};
GameManager.prototype.mpJoinGame = function(slot) {
	// if slot<0, leave current game but do not join any.
	$.ajax({
			type: "POST",
			url: "join_game.php",
			async: true,
			cache: false,
			data:{game:slot, plyid:game.localplayerindex},
			success: function(index){
				var index = parseInt(index);
				if(index==0 || index == 1){
					game.localplayerindex = slot*2+index;
					game.otherplayerindex = index==0 ? 
						game.localplayerindex+1 : game.localplayerindex-1;
					game.gameindex=slot;
					console.log('Joining game '+slot+' as player '+game.localplayerindex);
				}else{
					console.log('No game joined. Any active game disconnected.');
					game.localplayerindex = mpgames*2;
					game.otherplayerindex = mpgames*2;
					game.gameindex = mpgames;
				}
				gm.mpRefreshListings(); //*!!!*

				// start game ...

			},
			error: function(XMLHttpRequest,textStatus,errorThrown){
				alert('Error: An error occured while trying to join...');
			}
		});
};
GameManager.prototype.mpBeginGame = function() {
	game.state = STATE.placement;
	this.draw();
};
GameManager.prototype.finishPlacement = function() {
	if(this.mp){
		console.log('Local placement finished...')
		//upload placement and wait for other player
		gm.mpSendPlacement();
	}
	else{
		game.state = STATE.leftTurn;
		ctx.clearRect(0,game.boardSqLen+game.y,canvas.width,canvas.height);
		gm.draw();
	}
};
GameManager.prototype.draw = function() {
	this.drawUI();
	if(game.state >= STATE.menu ){return;}
	this.boards[0].draw(true);
	this.boards[1].draw(draw_rhs);
};
GameManager.prototype.drawUI = function() {
		ctx.fillStyle = default_text.fill;
	if(game.state==STATE.gameOver){	
		ctx.fillText("Game Over!", canvas.width/2, canvas.height - 50);
	}else if (game.state==STATE.menu){
		ctx.clearRect(0,0,canvas.width,canvas.height);
		ctx.fillText("Single Player vs AI", canvas.width/4, canvas.height/2);
		ctx.fillText("Online Multiplayer [UNDER CONSTRUCTION]", 3*canvas.width/4, canvas.height/2);
		ctx.beginPath();
		ctx.moveTo(canvas.width/2,0);
		ctx.lineTo(canvas.width/2,canvas.height);
		ctx.stroke();
	}
	else if (game.state==STATE.mpGameList){
		ctx.clearRect(0,0,canvas.width,canvas.height);
		ctx.fillText("Back", canvas.width/2, 19*canvas.height/20);
		ctx.fillText("Refresh"+(game.svRefreshing?'ing':''),
			canvas.width/2, 17*canvas.height/20);
		ctx.beginPath();
		ctx.moveTo(0,16*canvas.height/20);
		ctx.lineTo(canvas.width,16*canvas.height/20);
		ctx.moveTo(0,18*canvas.height/20);
		ctx.lineTo(canvas.width,18*canvas.height/20);
		ctx.moveTo(0,32);
		ctx.lineTo(canvas.width,32);
		ctx.textAlign = 'left';
		var msg;
		for(var i=1; i<=mpgames; i++){
			if (i-1==game.gameindex){
				msg = 'You have joined this game. Waiting for opponent...';
			}else{
				msg = game.svPlayers[i-1]<2 ? 'Click to join.':'Game full.';
			}
			ctx.fillText("Game "+(i-1)+'. Players: '+game.svPlayers[i-1]+
				'/2. '+msg, 16, i*32+16);
			ctx.moveTo(0,i*32+32);
			ctx.lineTo(canvas.width,i*32+32);
		}
		ctx.stroke();
		ctx.textAlign = default_text.align;
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
	if (mouse_x<0 || mouse_x>canvas.width || mouse_y<0 || mouse_y>canvas.height){return;}
	if (game.state == STATE.menu){
		gm.newGame(mouse_x>canvas.width/2);
	}
	else if (game.state == STATE.mpGameList){
		if (mouse_y>18*canvas.height/20){
			// return to main menu..
			gm.mpJoinGame(-1);
			game.state = STATE.menu;
			gm.draw();
		}else if (mouse_y>16*canvas.height/20){
			//refresh listings..
			gm.mpRefreshListings();
		}
		else if(mouse_y>32 && mouse_y < mpgames*32+32){
			var slot = Math.floor((mouse_y-32)/32)
			if(game.svPlayers[slot]<2 && game.gameindex!=slot){	
				//attempt join game slot..
				gm.mpJoinGame(slot);
			}
		}
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
	TEMP_mouse_pos_X = event.clientX
	TEMP_mouse_pos_Y = event.clientY
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
		gm.finishPlacement();
		document.removeEventListener('mousemove',mouseMove);
		return;
	}
}

document.addEventListener('keyup',function(event){
	if (event.keyCode == 32){
		rot_toggled = ~rot_toggled;
	var temp_move = new MouseEvent('mousemove', {
		'clientX' : TEMP_mouse_pos_X,
		'clientY' : TEMP_mouse_pos_Y});
	document.dispatchEvent(temp_move);
	}
});


function waitMove(){
	gm.mpWaitMove();
}

$(window).bind('beforeunload',function(){
	//Disconnect from active games. I doubt this will be sufficent.
	if(game.state == STATE.mpGameList){
		console.log('Attempting to tell json im leaving...');
		game.state = STATE.menu;
		gm.mpJoinGame(-1);
	}else if (game.state <STATE.gameOver){
		//.. disconnect game and declare other winner.
	}
})
