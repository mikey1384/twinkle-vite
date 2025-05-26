// Chess logic functions for move validation and highlighting
// Adapted from the original chess component

interface ChessPiece {
  type: string;
  color: string;
  isPiece: boolean;
  state?: string;
}

// Import the getPiece function logic from the original chess component
export function getPiece({
  piece: { type, color },
  myColor
}: {
  piece: { type: string; color: string };
  myColor: string;
}) {
  const initialPawnPositions = {
    [myColor]: [48, 49, 50, 51, 52, 53, 54, 55],
    [myColor === 'white' ? 'black' : 'white']: [8, 9, 10, 11, 12, 13, 14, 15]
  };

  if (!color) return {};

  switch (type) {
    case 'pawn':
      return {
        isMovePossible({
          src,
          dest,
          isDestEnemyOccupied,
          enPassantTarget,
          color,
          myColor
        }: {
          src: number;
          dest: number;
          isDestEnemyOccupied: boolean;
          enPassantTarget?: number;
          color: string;
          myColor: string;
        }) {
          const srcRow = Math.floor(src / 8);
          const srcColumn = src % 8;
          const destRow = Math.floor(dest / 8);
          const destColumn = dest % 8;
          const oneSquareModifier = color === myColor ? -8 : 8;
          const twoSquaresModifier = color === myColor ? -16 : 16;
          const destCrossable = color
            ? color === myColor
              ? srcRow - destRow === 1
              : destRow - srcRow === 1
            : false;
          const attackable = isDestEnemyOccupied && destCrossable;
          const enPassantPossible =
            enPassantTarget &&
            destCrossable &&
            destColumn === enPassantTarget % 8 &&
            srcRow === Math.floor(enPassantTarget / 8) &&
            Math.abs(srcColumn - (enPassantTarget % 8)) === 1;

          if (
            (dest === src + oneSquareModifier ||
              (dest === src + twoSquaresModifier &&
                initialPawnPositions[color].includes(src))) &&
            !isDestEnemyOccupied
          ) {
            return true;
          } else if (attackable && Math.abs(srcColumn - destColumn) === 1) {
            return true;
          } else if (enPassantPossible) {
            return true;
          }
          return false;
        },
        getSrcToDestPath() {
          return [];
        }
      };

    case 'bishop':
      return {
        isMovePossible({
          src,
          dest
        }: {
          src: number;
          dest: number;
          isDestEnemyOccupied?: boolean;
          color?: string;
          myColor?: string;
          enPassantTarget?: number;
        }) {
          const srcRow = Math.floor(src / 8);
          const srcColumn = src % 8;
          const destRow = Math.floor(dest / 8);
          const destColumn = dest % 8;
          return (
            Math.abs(srcRow - destRow) === Math.abs(srcColumn - destColumn)
          );
        },
        getSrcToDestPath(src: number, dest: number) {
          const path = [];
          let pathStart;
          let pathEnd;
          let incrementBy;
          if (src > dest) {
            pathStart = dest;
            pathEnd = src;
          } else {
            pathStart = src;
            pathEnd = dest;
          }
          if (Math.abs(src - dest) % 9 === 0) {
            incrementBy = 9;
            pathStart += 9;
          } else {
            incrementBy = 7;
            pathStart += 7;
          }

          for (let i = pathStart; i < pathEnd; i += incrementBy) {
            path.push(i);
          }
          return path;
        }
      };

    case 'knight':
      return {
        isMovePossible({
          src,
          dest
        }: {
          src: number;
          dest: number;
          isDestEnemyOccupied?: boolean;
          color?: string;
          myColor?: string;
          enPassantTarget?: number;
        }) {
          const srcRow = Math.floor(src / 8);
          const srcColumn = src % 8;
          const destRow = Math.floor(dest / 8);
          const destColumn = dest % 8;
          return (
            (srcRow + 2 === destRow && srcColumn - 1 === destColumn) ||
            (srcRow + 2 === destRow && srcColumn + 1 === destColumn) ||
            (srcRow + 1 === destRow && srcColumn - 2 === destColumn) ||
            (srcRow + 1 === destRow && srcColumn + 2 === destColumn) ||
            (srcRow - 2 === destRow && srcColumn - 1 === destColumn) ||
            (srcRow - 2 === destRow && srcColumn + 1 === destColumn) ||
            (srcRow - 1 === destRow && srcColumn - 2 === destColumn) ||
            (srcRow - 1 === destRow && srcColumn + 2 === destColumn)
          );
        },
        getSrcToDestPath() {
          return [];
        }
      };

    case 'rook':
      return {
        isMovePossible({
          src,
          dest
        }: {
          src: number;
          dest: number;
          isDestEnemyOccupied?: boolean;
          color?: string;
          myColor?: string;
          enPassantTarget?: number;
        }) {
          const srcRow = Math.floor(src / 8);
          const srcColumn = src % 8;
          const destRow = Math.floor(dest / 8);
          const destColumn = dest % 8;
          return srcRow === destRow || srcColumn === destColumn;
        },
        getSrcToDestPath(src: number, dest: number) {
          const path = [];
          let pathStart;
          let pathEnd;
          let incrementBy;
          if (src > dest) {
            pathStart = dest;
            pathEnd = src;
          } else {
            pathStart = src;
            pathEnd = dest;
          }
          if (Math.abs(src - dest) % 8 === 0) {
            incrementBy = 8;
            pathStart += 8;
          } else {
            incrementBy = 1;
            pathStart += 1;
          }

          for (let i = pathStart; i < pathEnd; i += incrementBy) {
            path.push(i);
          }
          return path;
        }
      };

    case 'queen':
      return {
        isMovePossible({
          src,
          dest
        }: {
          src: number;
          dest: number;
          isDestEnemyOccupied?: boolean;
          color?: string;
          myColor?: string;
          enPassantTarget?: number;
        }) {
          const srcRow = Math.floor(src / 8);
          const srcColumn = src % 8;
          const destRow = Math.floor(dest / 8);
          const destColumn = dest % 8;

          return (
            Math.abs(srcRow - destRow) === Math.abs(srcColumn - destColumn) ||
            srcRow === destRow ||
            srcColumn === destColumn
          );
        },
        getSrcToDestPath(src: number, dest: number) {
          const path = [];
          let pathStart;
          let pathEnd;
          let incrementBy;
          if (src > dest) {
            pathStart = dest;
            pathEnd = src;
          } else {
            pathStart = src;
            pathEnd = dest;
          }
          if (Math.abs(src - dest) % 8 === 0) {
            incrementBy = 8;
            pathStart += 8;
          } else if (Math.abs(src - dest) % 9 === 0) {
            incrementBy = 9;
            pathStart += 9;
          } else if (
            !(src % 8 === 0 && dest - src === 7) &&
            !(src % 8 === 7 && src - dest === 7) &&
            Math.abs(src - dest) % 7 === 0
          ) {
            incrementBy = 7;
            pathStart += 7;
          } else {
            incrementBy = 1;
            pathStart += 1;
          }
          for (let i = pathStart; i < pathEnd; i += incrementBy) {
            path.push(i);
          }
          return path;
        }
      };

    case 'king':
      return {
        isMovePossible({
          src,
          dest
        }: {
          src: number;
          dest: number;
          isDestEnemyOccupied?: boolean;
          color?: string;
          myColor?: string;
          enPassantTarget?: number;
        }) {
          const srcRow = Math.floor(src / 8);
          const srcColumn = src % 8;
          const destRow = Math.floor(dest / 8);
          const destColumn = dest % 8;

          return (
            (Math.abs(srcRow - destRow) === Math.abs(srcColumn - destColumn) ||
              srcRow === destRow ||
              srcColumn === destColumn) &&
            (Math.abs(srcRow - destRow) === 1 ||
              Math.abs(srcColumn - destColumn) === 1)
          );
        },
        getSrcToDestPath() {
          return [];
        }
      };

    default:
      return {};
  }
}

export function isMoveLegal({
  srcToDestPath,
  squares
}: {
  srcToDestPath: number[];
  squares: ChessPiece[];
}) {
  for (let i = 0; i < srcToDestPath.length; i++) {
    if (squares[srcToDestPath[i]].isPiece) {
      return false;
    }
  }
  return true;
}

export function isPossibleAndLegal({
  src,
  dest,
  myColor,
  squares,
  enPassantTarget
}: {
  src: number;
  dest: number;
  myColor: string;
  squares: ChessPiece[];
  enPassantTarget?: number;
}) {
  if (squares[dest].color === squares[src].color) {
    return false;
  }
  return (
    getPiece({ piece: squares[src], myColor })?.isMovePossible?.({
      color: squares[src].color,
      src,
      dest,
      isDestEnemyOccupied: !!squares[dest].color,
      enPassantTarget,
      myColor
    }) &&
    isMoveLegal({
      srcToDestPath:
        getPiece({
          piece: squares[src],
          myColor
        }).getSrcToDestPath?.(src, dest) || [],
      squares
    })
  );
}

export function highlightPossiblePathsFromSrc({
  squares,
  src,
  enPassantTarget,
  myColor
}: {
  squares: ChessPiece[];
  src: number;
  enPassantTarget?: number;
  myColor: string;
}): number[] {
  const actualSquares = squares.map((square) => (square.isPiece ? square : {}));
  const highlightedIndices: number[] = [];

  for (let index = 0; index < actualSquares.length; index++) {
    if (index === src) {
      continue; // Don't highlight the source square itself
    }

    if (
      isPossibleAndLegal({
        src,
        dest: index,
        squares: actualSquares as ChessPiece[],
        enPassantTarget,
        myColor
      })
    ) {
      highlightedIndices.push(index);
    }
  }

  return highlightedIndices;
}
