import React, { useMemo, useCallback, useState } from 'react';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { isTablet } from '~/helpers';
import { cloudFrontURL } from '~/constants/defaultValues';
import { highlightPossiblePathsFromSrc } from './helpers/chessLogic';

// Chess piece images
const pieceImages = {
  white: {
    pawn: `${cloudFrontURL}/assets/chess/WhitePawn.svg`,
    bishop: `${cloudFrontURL}/assets/chess/WhiteBishop.svg`,
    knight: `${cloudFrontURL}/assets/chess/WhiteKnight.svg`,
    rook: `${cloudFrontURL}/assets/chess/WhiteRook.svg`,
    queen: `${cloudFrontURL}/assets/chess/WhiteQueen.svg`,
    king: `${cloudFrontURL}/assets/chess/WhiteKing.svg`
  },
  black: {
    pawn: `${cloudFrontURL}/assets/chess/BlackPawn.svg`,
    bishop: `${cloudFrontURL}/assets/chess/BlackBishop.svg`,
    knight: `${cloudFrontURL}/assets/chess/BlackKnight.svg`,
    rook: `${cloudFrontURL}/assets/chess/BlackRook.svg`,
    queen: `${cloudFrontURL}/assets/chess/BlackQueen.svg`,
    king: `${cloudFrontURL}/assets/chess/BlackKing.svg`
  }
};

const deviceIsTablet = isTablet(navigator);
const boardWidth = deviceIsTablet ? '25vh' : '50vh';

interface ChessPiece {
  type: string;
  color: string;
  isPiece: boolean;
  state?: string;
}

interface ChessBoardProps {
  squares: ChessPiece[];
  playerColor: 'white' | 'black';
  interactable: boolean;
  onSquareClick: (index: number) => void;
  showSpoiler?: boolean;
  onSpoilerClick?: () => void;
  opponentName?: string;
  enPassantTarget?: number;
}

function Square({
  piece,
  shade,
  highlighted,
  playerColor,
  interactable,
  onClick
}: {
  piece?: ChessPiece;
  shade: 'light' | 'dark';
  highlighted?: boolean;
  playerColor: string;
  interactable: boolean;
  onClick: () => void;
}) {
  const pieceImage = piece?.isPiece
    ? pieceImages[piece.color as 'white' | 'black']?.[
        piece.type as keyof typeof pieceImages.white
      ]
    : null;

  return (
    <div
      className={`${css`
        position: relative;
        aspect-ratio: 1;
        cursor: ${interactable && (highlighted || piece?.color === playerColor)
          ? 'pointer'
          : 'default'};
        background-color: ${highlighted
          ? Color.blue(0.5)
          : shade === 'light'
          ? '#f0d9b5'
          : Color.sandyBrown()};

        &:hover {
          ${interactable && (piece?.color === playerColor || highlighted)
            ? `background-color: ${Color.blue(0.3)};`
            : ''}
        }

        &.arrived {
          background-color: ${Color.brownOrange(0.8)};
        }

        &.blurred {
          background-color: ${Color.brownOrange(0.8)};
          > img {
            opacity: 0.1;
          }
        }

        &.danger {
          background-color: ${Color.red(0.7)};
        }
      `} ${piece?.state || ''}`}
      onClick={onClick}
    >
      {pieceImage && (
        <img
          src={pieceImage}
          alt={`${piece?.color} ${piece?.type}`}
          loading="lazy"
          className={css`
            width: 100%;
            height: 100%;
            position: absolute;
            top: 0;
            left: 0;
          `}
        />
      )}
    </div>
  );
}

export default function ChessBoard({
  squares,
  playerColor,
  interactable,
  onSquareClick,
  showSpoiler = false,
  onSpoilerClick,
  opponentName = 'AI',
  enPassantTarget
}: ChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
  const [highlightedSquares, setHighlightedSquares] = useState<number[]>([]);

  const letters = useMemo(() => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    return playerColor === 'black' ? files.reverse() : files;
  }, [playerColor]);

  const numbers = useMemo(() => {
    return playerColor === 'black'
      ? [1, 2, 3, 4, 5, 6, 7, 8]
      : [8, 7, 6, 5, 4, 3, 2, 1];
  }, [playerColor]);

  const handleSquareClick = useCallback(
    (index: number) => {
      if (!interactable) return;

      const piece = squares[index];

      // If clicking on own piece, select it
      if (piece?.isPiece && piece.color === playerColor) {
        setSelectedSquare(index);
        // Calculate possible moves and highlight them
        const highlightedIndices = highlightPossiblePathsFromSrc({
          squares,
          src: index,
          enPassantTarget,
          myColor: playerColor
        });
        setHighlightedSquares(highlightedIndices);
      }
      // If a piece is selected and clicking on different square, try to move
      else if (selectedSquare !== null) {
        onSquareClick(index);
        setSelectedSquare(null);
        setHighlightedSquares([]);
      }
    },
    [
      interactable,
      squares,
      playerColor,
      selectedSquare,
      onSquareClick,
      enPassantTarget
    ]
  );

  const board = useMemo(() => {
    const result = [];
    for (let i = 0; i < 8; i++) {
      const squareRows = [];
      for (let j = 0; j < 8; j++) {
        const index = i * 8 + j;
        const piece = squares[index];
        const isEven = (num: number) => num % 2 === 0;
        const shade: 'light' | 'dark' =
          (isEven(i) && isEven(j)) || (!isEven(i) && !isEven(j))
            ? 'light'
            : 'dark';

        const highlighted =
          selectedSquare === index || highlightedSquares.includes(index);

        squareRows.push(
          <Square
            key={index}
            piece={piece}
            shade={shade}
            highlighted={highlighted}
            playerColor={playerColor}
            interactable={interactable}
            onClick={() => handleSquareClick(index)}
          />
        );
      }
      result.push(
        <div
          key={i}
          className={css`
            display: contents;
          `}
        >
          {squareRows}
        </div>
      );
    }
    return result;
  }, [
    squares,
    selectedSquare,
    highlightedSquares,
    playerColor,
    interactable,
    handleSquareClick
  ]);

  if (showSpoiler) {
    return (
      <div
        className={css`
          width: 100%;
          height: 400px;
          display: flex;
          justify-content: center;
          align-items: center;
          @media (max-width: ${mobileMaxWidth}) {
            height: 300px;
          }
        `}
      >
        <div
          className={css`
            cursor: pointer;
            background: #fff;
            border: 1px solid ${Color.darkGray()};
            padding: 2rem;
            text-align: center;
            font-size: 1.7rem;
            line-height: 1.5;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

            &:hover {
              text-decoration: underline;
              background: ${Color.lightGray()};
            }

            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.5rem;
              padding: 1.5rem;
            }
          `}
          onClick={onSpoilerClick}
        >
          <p style={{ margin: '0 0 1rem 0' }}>
            {opponentName} made a new chess move.
          </p>
          <p style={{ margin: '0 0 1rem 0' }}>Tap here to view the puzzle.</p>
          <p style={{ margin: 0 }}>
            Solve the puzzle to earn XP and improve your chess skills!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={css`
        display: grid;
        grid-template-areas:
          'numbers board'
          '. letters';
        grid-template-columns: 2rem ${boardWidth};
        grid-template-rows: ${boardWidth} 2.5rem;
        justify-content: center;
        margin: 0 auto;

        @media (max-width: ${mobileMaxWidth}) {
          grid-template-columns: 2rem 80vw;
          grid-template-rows: 80vw 2.5rem;
        }
      `}
    >
      {/* Rank numbers */}
      <div
        className={css`
          grid-area: numbers;
          display: grid;
          grid-template-rows: repeat(8, 1fr);
        `}
      >
        {numbers.map((number, index) => (
          <div
            key={index}
            className={css`
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              color: ${Color.darkerGray()};
            `}
          >
            {number}
          </div>
        ))}
      </div>

      {/* Chess board */}
      <div
        className={css`
          grid-area: board;
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          border: 2px solid ${Color.darkGray()};
        `}
      >
        {board}
      </div>

      {/* File letters */}
      <div
        className={css`
          grid-area: letters;
          display: grid;
          grid-template-columns: repeat(8, 1fr);
        `}
      >
        {letters.map((letter, index) => (
          <div
            key={index}
            className={css`
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              color: ${Color.darkerGray()};
            `}
          >
            {letter}
          </div>
        ))}
      </div>
    </div>
  );
}
