import * as Utils from '../utils/Utils';

function drawCheckerboard(context, dims, square) {
	for (let i = 0; i < dims; ++i) {
		for (let j = 0; j < dims; ++j) {
			context.fillStyle = ~(i + j) & 1 ? '#666' : '#AAA';
			context.beginPath();
			context.rect(j * square, i * square, j * square + square, i * square + square);
			context.fill();
		}
	}
}

function drawLight(context, y, x, square) {
	context.save();
	var gradient = context.createRadialGradient(square / 2, square / 2, 0, square / 2, square / 2, square / 4);
	gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
	gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
	context.fillStyle = gradient;
	context.translate(x * square, y * square);
	context.beginPath();
	context.ellipse(square / 2, square / 2, square / 4, square / 4, 0, 0, Math.PI * 2);
	context.fill();
	context.restore();
}

function drawPieceHighlight(context, y, x, square) {
	context.save();
	context.fillStyle = 'rgba(255, 255, 255, 0.2)';
	context.rect(x * square, y * square, square, square);
	context.fill();
	context.restore();
}

function drawLights(context, cells, ctx, clickState, dims, square) {

	if (!(clickState.hasPieceMoved || clickState.isCellSelected)) {
		return;
	}

	var cellY, cellX;
	if (clickState.hasPieceMoved) {
		cellY = clickState.py;
		cellX = clickState.px;
	}
	else {
		cellY = clickState.sy;
		cellX = clickState.sx;
	}

	drawPieceHighlight(context, cellY, cellX, square);

	for (let d in Utils.adjCells) {
		var y = cellY + Utils.adjCells[d].y;
		var x = cellX + Utils.adjCells[d].x;
		while (Utils.isValidCoord(y, x, dims) && cells[y][x] === 'empty') {
			drawLight(context, y, x, square);
			y += Utils.adjCells[d].y;
			x += Utils.adjCells[d].x;
		}
	}
}

function drawQueen(context, y, x, square, player) {

	const outerPoints = [
		{x: 0.1, y: 0.3},
		{x: 0.25, y: 0.575},
		{x: 0.3, y: 0.2},
		{x: 0.4, y: 0.55},
		{x: 0.5, y: 0.15},
		{x: 0.6, y: 0.55},
		{x: 0.7, y: 0.2},
		{x: 0.75, y: 0.575},
		{x: 0.9, y: 0.3},
		{x: 0.85, y: 0.65},
		{x: 0.8, y: 0.7},
		{x: 0.75, y: 0.8},
		{x: 0.8, y: 0.9},
		{x: 0.7, y: 0.95},
		{x: 0.3, y: 0.95},
		{x: 0.2, y: 0.9},
		{x: 0.25, y: 0.8},
		{x: 0.2, y: 0.7},
		{x: 0.15, y: 0.65}
	];

	const lines = [
		[
			{x: 0.2, y: 0.7},
			{x: 0.5, y: 0.6},
			{x: 0.8, y: 0.7}
		],
		[
			{x: 0.25, y: 0.8},
			{x: 0.5, y: 0.7},
			{x: 0.75, y: 0.8}
		],
		[
			{x: 0.2, y: 0.9},
			{x: 0.5, y: 0.8},
			{x: 0.8, y: 0.9}
		]
	];

	const circlePoints = [
		{x: 0.1, y: 0.25},
		{x: 0.3, y: 0.15},
		{x: 0.5, y: 0.1},
		{x: 0.7, y: 0.15},
		{x: 0.9, y: 0.25},
	];

	context.save();
	context.translate(x * square, y * square);

	// Queen fill
	context.fillStyle = player === '0' ? 'white' : 'black';
	context.beginPath();
	context.moveTo(outerPoints[0].x * square, outerPoints[0].y * square);
	for (let i = 0; i < outerPoints.length; ++i) {
		context.lineTo(outerPoints[i].x * square, outerPoints[i].y * square);
	}
	context.closePath();
	context.fill();

	// Black queen outline
	context.strokeStyle = 'black';
	context.lineWidth = square / 40;
	context.stroke();

	// Three lines at bottom of queen
	context.strokeStyle = player === '0' ? 'black' : 'white';
	for (let i = 0; i < lines.length; ++i) {
		context.beginPath();
		context.moveTo(lines[i][0].x * square, lines[i][0].y * square);
		context.quadraticCurveTo(lines[i][1].x * square, lines[i][1].y * square, lines[i][2].x * square,
			lines[i][2].y * square);
		context.stroke();
	}

	// Five circles
	context.fillStyle = player === '0' ? 'white' : 'black';
	context.strokeStyle = 'black';
	for (let i = 0; i < circlePoints.length; ++i) {
		context.beginPath();
		context.ellipse(circlePoints[i].x * square, circlePoints[i].y * square, square / 25, square / 25, 0, 0,
			Math.PI * 2);
		context.fill();
		context.stroke();
	}

	context.restore();
}

function drawArrow(context, y, x, square) {
	context.save();
	context.translate(x * square, y * square);
	context.fillStyle = 'black';
	context.beginPath();
	context.ellipse(square / 2, square / 2, square / 4, square / 4, 0, 0, Math.PI * 2);
	context.fill();
	context.restore();
}

function drawPieces(context, board, dims, square) {
	for (let i = 0; i < dims; ++i) {
		for (let j = 0; j < dims; ++j) {
			if (board[i][j] === 'filled') {
				drawArrow(context, i, j, square);
			}
			else if (board[i][j] !== 'empty') {
				drawQueen(context, i, j, square, board[i][j]);
			}
		}
	}
}

// Render board function
export default function(context, cells, ctx, clickState, boardWidth, dims) {

	var square = boardWidth / dims;

	drawCheckerboard(context, dims, square);
	drawLights(context, cells, ctx, clickState, dims, square);
	drawPieces(context, cells, dims, square);
}
