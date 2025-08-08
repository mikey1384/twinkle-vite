import React, { useMemo, useCallback, useState } from 'react';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { isTablet } from '~/helpers';
import { cloudFrontURL } from '~/constants/defaultValues';
import { Chess } from 'chess.js';
import {
  algebraicToIndex,
  indexToAlgebraic,
  viewToBoard,
  boardToView
} from './helpers';

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
const boardWidth = deviceIsTablet ? '25vh' : '40vh';

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
  selectedSquare?: number | null;
  legalTargets?: number[];
  game?: Chess;
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

  const backgroundColor = highlighted
    ? shade === 'light'
      ? 'RGB(174, 255, 196)'
      : 'RGB(164, 236, 137)'
    : shade === 'light'
    ? Color.ivory()
    : Color.sandyBrown();

  return (
    <div
      className={`${css`
        position: relative;
        aspect-ratio: 1;
        cursor: ${interactable && (highlighted || piece?.color === playerColor)
          ? 'pointer'
          : 'default'};
        background-color: ${backgroundColor};

        &:hover {
          ${interactable && (piece?.color === playerColor || highlighted)
            ? `background-color: ${
                shade === 'light' ? 'RGB(174, 255, 196)' : 'RGB(164, 236, 137)'
              };`
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

        &.check {
          background-color: ${Color.orange()};
        }

        &.checkmate {
          background-color: red !important;
          animation: checkmateGlow 1.5s ease-in-out infinite alternate;
        }

        @keyframes checkmateGlow {
          0% {
            background-color: red !important;
            box-shadow: 0 0 5px rgba(255, 0, 0, 0.8);
          }
          100% {
            background-color: #ff4444 !important;
            box-shadow: 0 0 15px rgba(255, 0, 0, 1);
          }
        }

        /* Green highlighting takes precedence over state-based highlighting */
        ${highlighted
          ? `
          &.arrived,
          &.blurred,
          &.danger,
          &.check {
            background-color: ${
              shade === 'light' ? 'RGB(174, 255, 196)' : 'RGB(164, 236, 137)'
            } !important;
          }
        `
          : ''}
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
  opponentName: _opponentName = 'AI',
  enPassantTarget: _enPassantTarget,
  selectedSquare: externalSelectedSquare,
  legalTargets,
  game
}: ChessBoardProps) {
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

  const calculatedLegalTargets = useMemo(() => {
    if (externalSelectedSquare == null || !game) return [];
    const abs = viewToBoard(externalSelectedSquare, playerColor === 'black');
    const alg = indexToAlgebraic(abs);

    return game
      .moves({ square: alg as any, verbose: true })
      .map((m: any) =>
        boardToView(algebraicToIndex(m.to), playerColor === 'black')
      );
  }, [game, externalSelectedSquare, playerColor]);

  React.useEffect(() => {
    if (
      externalSelectedSquare !== null &&
      externalSelectedSquare !== undefined
    ) {
      if (legalTargets && legalTargets.length > 0) {
        setHighlightedSquares(legalTargets);
      } else if (game) {
        setHighlightedSquares(calculatedLegalTargets);
      } else {
        setHighlightedSquares([]);
      }
    } else {
      setHighlightedSquares([]);
    }
  }, [externalSelectedSquare, legalTargets, calculatedLegalTargets, game]);

  const handleSquareClick = useCallback(
    (index: number) => {
      if (!interactable) return;
      onSquareClick(index);
    },
    [interactable, onSquareClick]
  );

  const board = useMemo(() => {
    const result = [];
    for (let i = 0; i < 8; i++) {
      const squareRows = [];
      for (let j = 0; j < 8; j++) {
        const viewIdx = i * 8 + j;
        const boardIdx =
          playerColor === 'black' ? (7 - i) * 8 + (7 - j) : viewIdx;

        const piece = squares[boardIdx];
        const isEven = (num: number) => num % 2 === 0;
        const shade: 'light' | 'dark' =
          (isEven(i) && isEven(j)) || (!isEven(i) && !isEven(j))
            ? 'light'
            : 'dark';

        const highlighted =
          externalSelectedSquare === viewIdx ||
          highlightedSquares.includes(viewIdx);

        squareRows.push(
          <Square
            key={viewIdx}
            piece={piece}
            shade={shade}
            highlighted={highlighted}
            playerColor={playerColor}
            interactable={interactable}
            onClick={() => handleSquareClick(viewIdx)}
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
    externalSelectedSquare,
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
        <button
          className={css`
            cursor: pointer;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 1.5rem 2.5rem;
            text-align: center;
            font-size: 1.125rem;
            font-weight: 600;
            line-height: 1.4;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            transition: all 0.3s ease;
            max-width: 280px;
            position: relative;
            overflow: hidden;

            &:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
              background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
            }

            &:active {
              transform: translateY(0);
            }

            &::before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(
                90deg,
                transparent,
                rgba(255, 255, 255, 0.2),
                transparent
              );
              transition: left 0.6s;
            }

            &:hover::before {
              left: 100%;
            }

            @media (max-width: ${mobileMaxWidth}) {
              font-size: 0.9rem;
              padding: 1rem 1.5rem;
              max-width: 240px;
            }
          `}
          onClick={onSpoilerClick}
        >
          <div
            className={css`
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 0.5rem;
            `}
          >
            <div
              className={css`
                font-size: 2rem;
                margin-bottom: 0.5rem;
              `}
            >
              ♟️
            </div>
            <div
              className={css`
                font-weight: 700;
                font-size: 1.25rem;
                margin-bottom: 0.5rem;
              `}
            >
              Chess Puzzle Ready!
            </div>
            <div
              className={css`
                font-size: 1rem;
                opacity: 0.9;
              `}
            >
              Click to reveal the position
            </div>
          </div>
        </button>
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
          grid-template-columns: 1.5rem 70vw;
          grid-template-rows: 70vw 2rem;
        }
      `}
    >
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
              font-weight: 700;
              font-size: 1.125rem;
              color: ${Color.darkerGray()};
            `}
          >
            {number}
          </div>
        ))}
      </div>

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
              font-weight: 700;
              font-size: 1.125rem;
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
