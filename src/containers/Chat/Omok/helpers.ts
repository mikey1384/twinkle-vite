export type OmokColor = 'black' | 'white';
export type OmokCell = OmokColor | null;

export const BOARD_SIZE = 15;

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

  let openThreeDirections = 0;

  for (const [dr, dc] of directions) {
    let foundInDirection = false;

    // examine windows of length 5 that include the placed stone
    for (let offset = -4; offset <= 0; offset++) {
      const window: (OmokCell | 'pending')[] = [];
      let includesTarget = false;

      for (let i = 0; i < 5; i++) {
        const r = move.position.row + (offset + i) * dr;
        const c = move.position.col + (offset + i) * dc;
        if (!isInside(r, c)) {
          window.push(null);
          continue;
        }
        if (r === move.position.row && c === move.position.col) {
          includesTarget = true;
          window.push('pending');
        } else {
          window.push(board[r][c]);
        }
      }

      if (!includesTarget) continue;
      if (isOpenThreeWindow(window, color)) {
        foundInDirection = true;
        break;
      }
    }

    if (foundInDirection) {
      openThreeDirections++;
      if (openThreeDirections >= 2) return true;
    }
  }

  return false;
}

function isOpenThreeWindow(
  window: (OmokCell | 'pending')[],
  color: OmokColor
) {
  if (window.length !== 5) return false;
  const [a, b, c, d, e] = window;
  const isStone = (cell: OmokCell | 'pending') => cell === color || cell === 'pending';
  const isEmpty = (cell: OmokCell | 'pending') => cell === null;

  return isEmpty(a) && isStone(b) && isStone(c) && isStone(d) && isEmpty(e);
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
