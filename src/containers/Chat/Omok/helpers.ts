export type OmokColor = 'black' | 'white';
export type OmokCell = OmokColor | null;
type WindowCell = OmokCell | 'OOB';

export const BOARD_SIZE = 19;

export interface OmokMove {
  number: number;
  by: number;
  position: {
    row: number;
    col: number;
  };
}

export function createEmptyBoard(): OmokCell[][] {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from<OmokCell>({ length: BOARD_SIZE }).fill(null)
  );
}

export function cloneBoard(board: OmokCell[][]): OmokCell[][] {
  return board.map((row) => row.slice());
}

export function isWinningMove({
  board,
  move,
  color
}: {
  board: OmokCell[][];
  move: OmokMove;
  color: OmokColor;
}) {
  const directions: Array<[number, number]> = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1]
  ];

  for (const [dr, dc] of directions) {
    let count = 1;

    // forward direction
    let r = move.position.row + dr;
    let c = move.position.col + dc;
    while (isInside(r, c) && board[r][c] === color) {
      count++;
      r += dr;
      c += dc;
    }

    // backward direction
    r = move.position.row - dr;
    c = move.position.col - dc;
    while (isInside(r, c) && board[r][c] === color) {
      count++;
      r -= dr;
      c -= dc;
    }

    if (count >= 5) {
      return true;
    }
  }

  return false;
}

export function createsOverline({
  board,
  move,
  color
}: {
  board: OmokCell[][];
  move: OmokMove;
  color: OmokColor;
}) {
  const directions: Array<[number, number]> = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1]
  ];

  for (const [dr, dc] of directions) {
    let count = 1;

    let r = move.position.row + dr;
    let c = move.position.col + dc;
    while (isInside(r, c) && board[r][c] === color) {
      count++;
      r += dr;
      c += dc;
    }

    r = move.position.row - dr;
    c = move.position.col - dc;
    while (isInside(r, c) && board[r][c] === color) {
      count++;
      r -= dr;
      c -= dc;
    }

    if (count > 5) {
      return true;
    }
  }

  return false;
}

// Returns the winning line (array of {row,col}) if a win is present.
// If lastMove is provided, checks lines through that move first; otherwise scans board.
export function getWinningLine({
  board,
  lastMove,
  color
}: {
  board: OmokCell[][];
  lastMove?: { row: number; col: number } | null;
  color?: OmokColor;
}): Array<{ row: number; col: number }> | null {
  const directions: Array<[number, number]> = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1]
  ];

  function checkFrom(r0: number, c0: number, clr: OmokColor) {
    for (const [dr, dc] of directions) {
      let cells: Array<{ row: number; col: number }> = [{ row: r0, col: c0 }];
      // forward
      let r = r0 + dr;
      let c = c0 + dc;
      while (isInside(r, c) && board[r][c] === clr) {
        cells.push({ row: r, col: c });
        r += dr;
        c += dc;
      }
      // backward
      r = r0 - dr;
      c = c0 - dc;
      while (isInside(r, c) && board[r][c] === clr) {
        cells.unshift({ row: r, col: c });
        r -= dr;
        c -= dc;
      }
      if (cells.length >= 5) {
        // return exactly 5 contiguous cells centered at the segment that includes r0,c0
        return cells.slice(0, Math.max(5, cells.length));
      }
    }
    return null;
  }

  if (lastMove && color) {
    const seg = checkFrom(lastMove.row, lastMove.col, color);
    if (seg) return seg;
  }
  // scan board to find any win
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const clr = board[r][c];
      if (clr === 'black' || clr === 'white') {
        const seg = checkFrom(r, c, clr);
        if (seg) return seg;
      }
    }
  }
  return null;
}

export function createsDoubleThree({
  board,
  move,
  color
}: {
  board: OmokCell[][];
  move: OmokMove;
  color: OmokColor;
}) {
  const directions: Array<[number, number]> = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1]
  ];

  // simulate placing the stone
  const simBoard = cloneBoard(board);
  simBoard[move.position.row][move.position.col] = color;

  let openThreeDirections = 0;
  for (const [dr, dc] of directions) {
    // scan windows length 5 (contiguous open three: .XXX.)
    if (scanWindowsForOpenThree(simBoard, move.position, color, dr, dc, 5)) {
      openThreeDirections++;
    } else if (
      // scan windows length 6 for broken threes: .XX.X. or .X.XX.
      scanWindowsForOpenThree(simBoard, move.position, color, dr, dc, 6)
    ) {
      openThreeDirections++;
    }
    if (openThreeDirections >= 2) return true;
  }
  return false;
}

function scanWindowsForOpenThree(
  board: OmokCell[][],
  pos: { row: number; col: number },
  color: OmokColor,
  dr: number,
  dc: number,
  length: number
) {
  const span = length;
  // offset so that window includes the move position
  for (let offset = -span + 1; offset <= 0; offset++) {
    const window: WindowCell[] = [];
    let includesTarget = false;
    for (let i = 0; i < span; i++) {
      const r = pos.row + (offset + i) * dr;
      const c = pos.col + (offset + i) * dc;
      if (!isInside(r, c)) {
        window.push('OOB');
      } else {
        window.push(board[r][c]);
        if (r === pos.row && c === pos.col) includesTarget = true;
      }
    }
    if (!includesTarget) continue;
    if (isOpenThreePattern(window, color)) return true;
  }
  return false;
}

function isOpenThreePattern(window: WindowCell[], color: OmokColor) {
  const opp = color === 'black' ? 'white' : 'black';
  if (window.some((cell) => cell === 'OOB')) return false;
  // length 5: .XXX.
  if (window.length === 5) {
    const [a, b, c, d, e] = window as OmokCell[];
    const endsOpen = a === null && e === null;
    const stones = [b, c, d];
    if (endsOpen) {
      if (stones.every((s) => s === color)) return true;
    }
  }
  // length 6: .XX.X. or .X.XX.
  if (window.length === 6) {
    const [a, b, c, d, e, f] = window as OmokCell[];
    const endsOpen = a === null && f === null;
    const inner = [b, c, d, e];
    if (endsOpen && inner.every((s) => s === color || s === null) && !inner.includes(opp as OmokCell)) {
      // match patterns with exactly three stones and one gap among inner
      const stonesCount = inner.filter((s) => s === color).length;
      const emptiesCount = inner.filter((s) => s === null).length;
      if (stonesCount === 3 && emptiesCount === 1) return true;
    }
  }
  return false;
}

export function isInside(row: number, col: number) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

export function normaliseBoard(board?: any): OmokCell[][] {
  const result = createEmptyBoard();
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const value = board?.[r]?.[c];
      if (value === 'black' || value === 'white') {
        result[r][c] = value;
      } else {
        result[r][c] = null;
      }
    }
  }
  return result;
}
