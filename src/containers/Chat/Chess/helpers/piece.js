import WhitePawn from '~/assets/chess/WhitePawn.svg';
import WhiteBishop from '~/assets/chess/WhiteBishop.svg';
import WhiteKnight from '~/assets/chess/WhiteKnight.svg';
import WhiteRook from '~/assets/chess/WhiteRook.svg';
import WhiteQueen from '~/assets/chess/WhiteQueen.svg';
import WhiteKing from '~/assets/chess/WhiteKing.svg';

import BlackPawn from '~/assets/chess/BlackPawn.svg';
import BlackBishop from '~/assets/chess/BlackBishop.svg';
import BlackKnight from '~/assets/chess/BlackKnight.svg';
import BlackRook from '~/assets/chess/BlackRook.svg';
import BlackQueen from '~/assets/chess/BlackQueen.svg';
import BlackKing from '~/assets/chess/BlackKing.svg';

export default function getPiece({
  piece: { type, color },
  myColor,
  interactable
}) {
  const initialPawnPositions = {
    [myColor]: [48, 49, 50, 51, 52, 53, 54, 55],
    [myColor === 'white' ? 'black' : 'white']: [8, 9, 10, 11, 12, 13, 14, 15]
  };
  if (!color) return {};
  switch (type) {
    case 'pawn':
      return {
        img: {
          style: {
            cursor: color === myColor && interactable ? 'pointer' : '',
            position: 'absolute'
          },
          src: color === 'white' ? WhitePawn : BlackPawn
        },
        isMovePossible({
          src,
          dest,
          isDestEnemyOccupied,
          enPassantTarget,
          color,
          myColor
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
          let attackable = isDestEnemyOccupied && destCrossable;
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
        getSrcToDestPath(src, dest) {
          const srcRow = Math.floor(src / 8);
          const destRow = Math.floor(dest / 8);
          const result = [];
          if (srcRow + 2 === destRow) {
            result.push(src + 8);
          }
          if (srcRow - 2 === destRow) {
            result.push(src - 8);
          }
          return result;
        }
      };

    case 'bishop':
      return {
        img: {
          style: {
            cursor: color === myColor && interactable ? 'pointer' : '',
            position: 'absolute'
          },
          src: color === 'white' ? WhiteBishop : BlackBishop
        },
        isMovePossible({ src, dest }) {
          const srcRow = Math.floor(src / 8);
          const srcColumn = src % 8;
          const destRow = Math.floor(dest / 8);
          const destColumn = dest % 8;
          return (
            Math.abs(srcRow - destRow) === Math.abs(srcColumn - destColumn)
          );
        },
        getSrcToDestPath(src, dest) {
          let path = [];
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
        img: {
          style: {
            cursor: color === myColor && interactable ? 'pointer' : '',
            position: 'absolute'
          },
          src: color === 'white' ? WhiteKnight : BlackKnight
        },
        isMovePossible({ src, dest }) {
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
        img: {
          style: {
            cursor: color === myColor && interactable ? 'pointer' : '',
            position: 'absolute'
          },
          src: color === 'white' ? WhiteRook : BlackRook
        },
        isMovePossible({ src, dest }) {
          const srcRow = Math.floor(src / 8);
          const srcColumn = src % 8;
          const destRow = Math.floor(dest / 8);
          const destColumn = dest % 8;
          return srcRow === destRow || srcColumn === destColumn;
        },
        getSrcToDestPath(src, dest) {
          let path = [];
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
        img: {
          style: {
            cursor: color === myColor && interactable ? 'pointer' : '',
            position: 'absolute'
          },
          src: color === 'white' ? WhiteQueen : BlackQueen
        },
        isMovePossible({ src, dest }) {
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
        getSrcToDestPath(src, dest) {
          let path = [];
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
        img: {
          style: {
            cursor: color === myColor && interactable ? 'pointer' : '',
            position: 'absolute'
          },
          src: color === 'white' ? WhiteKing : BlackKing
        },
        isMovePossible({ src, dest }) {
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
