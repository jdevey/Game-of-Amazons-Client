import React from 'react';
import { Client } from 'boardgame.io/react';
import { Game } from 'boardgame.io/core';

import '../App.css';
import styles from './styles/styles';
import StartPositions from './constants/StartPositions';

const dims = 4;

const adjCells = [
	{y: -1, x: -1},
	{y: -1, x: 0},
	{y: -1, x: 1},
	{y: 0, x: -1},
	{y: 0, x: 1},
	{y: 1, x: -1},
	{y: 1, x: 0},
	{y: 1, x: 1},
]

function isValidCoord(y, x) {
	return y > -1 && x > -1 && y < dims && x < dims;
}

function pointsOnSameLine(y1, x1, y2, x2) {
	return y1 === y2 || x1 === x2 || y1 - x1 === y2 - x2 || y1 + x1 === y2 + x2;
}

// ey and ex are the exception since they represent the queen's original position
function isPathToPointClear(G, y, x, sy, sx, ey, ex) {
	var cells = G.cells;
	var dy = (y - sy) / Math.max(Math.abs(y - sy), 1);
	var dx = (x - sx) / Math.max(Math.abs(x - sx), 1);
	do {
		sy += dy;
		sx += dx;
		if (cells[sy][sx] !== 'empty' && !(sy === ey && sx === ex)) {
			return false;
		}
	} while (!(sy === y && sx === x));
	return true;
}

function playerToColor(player) {
	return player === '0' ? 'white' : 'black';
}

function getOpposingPlayer(player) {
	return player === '0' ? '1' : '0';
}

function typeToDisplay(type) {
	switch (type) {
		case 'empty':
			return '';
		case 'filled':
			return '+';
		default:
			return type;
	}
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
		for (let d in adjCells) {
			var ny = adjCells[d].y + y;
			var nx = adjCells[d].x + x;
			if (isValidCoord(ny, nx) && G.cells[ny][nx] === 'empty') {
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
		black: StartPositions[dims].black
	}),

	moves: {
		move(G, ctx, sy, sx, ey, ex, ay, ax) {
			var color = playerToColor(ctx.currentPlayer);
			G.cells[sy][sx] = 'empty';
			G.cells[ey][ex] = ctx.currentPlayer;
			G.cells[ay][ax] = 'filled';

			// Why doesn't work? >:(
			// G[color].map(elem => elem.y === sy && elem.x === sx ? { y: ey, x: ex } : elem);
			for (let i in G[color]) {
				if (G[color][i].y === sy && G[color][i].x === sx) {
					G[color][i] = { y: ey, x: ex };
				}
			}
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
			if (pointsOnSameLine(y, x, py, px) && isPathToPointClear(this.props.G, y, x, py, px, sy, sx) &&
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
				else if (pointsOnSameLine(y, x, sy, sx) && isPathToPointClear(this.props.G, y, x, sy, sx, -1, -1)) {
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

	render() {
		var winner = <div />;
		var player = this.props.ctx.currentPlayer;
		var color = ucFirst(playerToColor(player));
		var cells = JSON.parse(JSON.stringify(this.props.G.cells));
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

		var tbody = [];
		for (let i = 0; i < dims; ++i) {
			var row = [];
			for (let j = 0; j < dims; ++j) {
				var id = dims * i + j;
				var cell = cells[i][j];
				var isCellSelected = this.state.isCellSelected && this.state.sy === i && this.state.sx === j;
				row.push(
					<td key={id} style={isCellSelected ? styles.highlightedCell : styles.cellStyle}
						onClick={() => this.onClick(i, j)}>
						{typeToDisplay(cell)}
					</td>
				);
			}
			tbody.push(<tr key={i} style={{flex: 1, marginBottom: -4}}>{row}</tr>);
		}

		return (
			// maybe use styles.centered
			<div>
				<div>{ucFirst(color)}'s turn</div>
				<table id='board'><tbody>{tbody}</tbody></table>
				<div>{winner}</div>
			</div>
		);
	}
}

const App = Client({
	game: Amazons,
	board: Board,
	debug: false
})

export default App;
