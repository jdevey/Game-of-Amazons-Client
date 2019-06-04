import React from 'react';
import { Client } from 'boardgame.io/react';
import { Game } from 'boardgame.io/core';

import Styles from '../styles/Styles';
import StartPositions from '../constants/StartPositions';
import * as Utils from '../utils/Utils';
import RenderBoard from '../display/BoardRenderer';

var dims = 10;
var screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
var screenHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
const boardWidth = Math.min(screenWidth, screenHeight) * 4 / 5;

function deepCopy(obj) {
	return JSON.parse(JSON.stringify(obj));
}

function copyGameState(a, b) {
	b.cells = a.cells;
	b.white = a.white;
	b.black = a.black;
}

function createGameStateObject(G) {
	return {
		cells: deepCopy(G.cells),
		white: deepCopy(G.white),
		black: deepCopy(G.black)
	};
}

function playerToColor(player) {
	return player === '0' ? 'white' : 'black';
}

function getOpposingPlayer(player) {
	return player === '0' ? '1' : '0';
}

function ucFirst(s) {
    return s[0].toUpperCase() + s.slice(1);
}

function isGameOver(G, ctx) {
	var player = getOpposingPlayer(ctx.currentPlayer);
	var color = playerToColor(player);
	for (let i in G[color]) {
		var y = G[color][i].y;
		var x = G[color][i].x;
		for (let d in Utils.adjCells) {
			var ny = Utils.adjCells[d].y + y;
			var nx = Utils.adjCells[d].x + x;
			if (Utils.isValidCoord(ny, nx, dims) && G.cells[ny][nx] === 'empty') {
				return false;
			}
		}
	}
	return true;
}

function getGameWinner(ctx) {
	return { winner: ctx.currentPlayer };
}

function generateBoardStart() {
	var board = new Array(dims);
	for (let i = 0; i < dims; ++i) {
		board[i] = new Array(dims).fill('empty');
	}
	var white = StartPositions[dims].white;
	var black = StartPositions[dims].black;
	for (let i in white) {
		board[white[i].y][white[i].x] = '0';
	}
	for (let i in black) {
		board[black[i].y][black[i].x] = '1';
	}
	return board;
}

const Amazons = Game({

	setup: () => ({
		cells: generateBoardStart(),
		white: StartPositions[dims].white,
		black: StartPositions[dims].black,
		undoStack: [],
		redoStack: []
	}),

	moves: {
		move(G, ctx, sy, sx, ey, ex, ay, ax) {

			// Store current state onto undo and redo stacks
			G.undoStack.push(createGameStateObject(G));
			G.redoStack = [];

			// Change current state
			var color = playerToColor(ctx.currentPlayer);
			G.cells[sy][sx] = 'empty';
			G.cells[ey][ex] = ctx.currentPlayer;
			G.cells[ay][ax] = 'filled';
			for (let i in G[color]) {
				if (G[color][i].y === sy && G[color][i].x === sx) {
					G[color][i] = { y: ey, x: ex };
				}
			}
		},
		undo(G, ctx) {
			var newG = G.undoStack.pop();
			G.redoStack.push(createGameStateObject(G));
			copyGameState(newG, G);
		},
		redo(G, ctx) {
			var newG = G.redoStack.pop();
			G.undoStack.push(createGameStateObject(G));
			copyGameState(newG, G);
		}
	},

	flow: {
		endGameIf: (G, ctx) => {
			if (isGameOver(G, ctx)) {
				return getGameWinner(ctx);
			}
		}
	}
});

class Board extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			hasPieceMoved: false,
			isCellSelected: false,
			sy: 0,
			sx: 0,
			py: 0,
			px: 0
		}
		document.addEventListener('keydown', e => {
			if (e.ctrlKey && e.which === 90) {
				this.handleUndo();
			}
			else if (e.ctrlKey && e.which === 89) {
				this.handleRedo();
			}
		})
		this.handleUndo = this.handleUndo.bind(this);
		this.handleRedo = this.handleRedo.bind(this);
		this.canvasRef = React.createRef();
		document.body.style.background = '#222';
	}

	componentDidMount() {

		// Canvas needs to render; not ready until component is mounted
		this.forceUpdate();

		var canvas = this.refs.canvas;
		canvas.addEventListener('click', function(event) {
			var rect = canvas.getBoundingClientRect();
			var squareDims = boardWidth / dims;
			var y = event.pageY - rect.top;
			var x = event.pageX - rect.left;
			var i = Math.floor(y / squareDims);
			var j = Math.floor(x / squareDims);
			this.onClick(i, j);
		}.bind(this));

		// Prevent double clicking from selecting other elements on page
		canvas.onmousedown = () => false;
	}

	onClick(y, x) {
		if (!this.props.isActive) {
			return;
		}
		var cells = this.props.G.cells;
		var player = this.props.ctx.currentPlayer;
		var sy = this.state.sy;
		var sx = this.state.sx;
		var py = this.state.py;
		var px = this.state.px;
		if (this.state.hasPieceMoved) {
			if (Utils.pointsOnSameLine(y, x, py, px) && Utils.isPathToPointClear(cells, y, x, py, px, sy, sx) &&
				!(y === py && x === px)) {
				this.setState({
					hasPieceMoved: false
				})
				this.props.moves.move(sy, sx, py, px, y, x);
				this.props.events.endTurn();
			}
		}
		else {
			if (this.state.isCellSelected) {
				if (cells[y][x] === player) {
					this.setState({
						isCellSelected: !(y === sy && x === sx),
						sy: y,
						sx: x
					})
				}
				else if (Utils.pointsOnSameLine(y, x, sy, sx) &&
					Utils.isPathToPointClear(cells, y, x, sy, sx, -1, -1)) {
					this.setState({
						hasPieceMoved: true,
						isCellSelected: false,
						py: y,
						px: x
					});
				}
			}
			else {
				if (cells[y][x] === player) {
					this.setState({
						isCellSelected: true,
						sy: y,
						sx: x
					})
				}
			}
		}
	}

	handleUndo() {
		if (this.props.G.undoStack.length > 0) {
			this.props.moves.undo();
			this.props.events.endTurn();
			this.setState({
				hasPieceMoved: false,
				isCellSelected: false
			})
		}
	}

	handleRedo() {
		if (this.props.G.redoStack.length > 0) {
			this.props.moves.redo();
			this.props.events.endTurn();
			this.setState({
				hasPieceMoved: false,
				isCellSelected: false
			})
		}
	}

	render() {
		var winner = <div />;
		var player = this.props.ctx.currentPlayer;
		var color = ucFirst(playerToColor(player));
		var cells = deepCopy(this.props.G.cells);
		var sy = this.state.sy;
		var sx = this.state.sx;
		var py = this.state.py;
		var px = this.state.px;

		if (this.props.ctx.gameover) {
			winner = this.props.ctx.gameover.winner !== undefined ?
				<div id='winner'>Winner: {ucFirst(playerToColor(this.props.ctx.gameover.winner))}</div> :
				<div id='winner'>Winner: Draw</div>;
		}

		if (this.state.hasPieceMoved) {
			cells[sy][sx] = 'empty';
			cells[py][px] = player;
		}

		if (this.refs.canvas) {
			var canvas = this.refs.canvas;
			var context = canvas.getContext('2d');
			RenderBoard(context, cells, this.props.ctx, this.state, boardWidth, dims);
		}

		return (
			<div style={Styles.centered}>
				<div>
					<div style={{width: '100%'}}>
						<span style={{marginRight: 100}}>
							<button style={Styles.button} onClick={this.handleUndo}>U</button>
							<button style={Styles.button} onClick={this.handleRedo}>R</button>
						</span>
						<span style={{color: 'white', margin: 5, fontSize: 24}}>{ucFirst(color)}'s turn</span>
					</div>
					<canvas ref='canvas' width={boardWidth} height={boardWidth} style={{border: '5px solid white'}}/>
					<div style={{color: 'white', margin: 5, fontSize: 24}}>{winner}</div>
				</div>
			</div>
		);
	}
}

const Home = Client({
	game: Amazons,
	board: Board,
	debug: false
})

export default Home;
