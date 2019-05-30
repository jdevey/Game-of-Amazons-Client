export const adjCells = [
	{y: -1, x: -1},
	{y: -1, x: 0},
	{y: -1, x: 1},
	{y: 0, x: -1},
	{y: 0, x: 1},
	{y: 1, x: -1},
	{y: 1, x: 0},
	{y: 1, x: 1},
]

export function isValidCoord(y, x, boardDims) {
	return y > -1 && x > -1 && y < boardDims && x < boardDims;
}

export function pointsOnSameLine(y1, x1, y2, x2) {
	return y1 === y2 || x1 === x2 || y1 - x1 === y2 - x2 || y1 + x1 === y2 + x2;
}

// ey and ex are the exception since they represent the queen's original position
export function isPathToPointClear(cells, y, x, sy, sx, ey, ex) {
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
