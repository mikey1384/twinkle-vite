import React, { useMemo, useState, useRef, useEffect, Fragment } from 'react';
import getPiece from '../helpers/piece';
import Square from '../Square';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import CastlingButton from './CastlingButton';
import BoardSpoiler from '../../BoardSpoiler';

export default function Board({
  interactable,
  myColor,
  onBoardClick,
  onCastling,
  onClick,
  onSpoilerClick,
  opponentName,
  spoilerOff,
  squares,
  size = 'regular'
}: {
  interactable: boolean;
  myColor: string;
  onBoardClick?: () => void;
  onCastling: (v: string) => void;
  onClick: (v: number) => void;
  onSpoilerClick: () => void;
  opponentName: string;
  spoilerOff: boolean;
  squares: any[];
  size?: 'regular' | 'compact' | 'inline';
}) {
  const [activeSquare, setActiveSquare] = useState(60);
  const boardRef = useRef<HTMLDivElement>(null);
  const wasVisible = useRef(spoilerOff);
  useEffect(() => {
    const revealed = spoilerOff && !wasVisible.current;
    wasVisible.current = spoilerOff;
    const board = boardRef.current;
    if (!revealed || !board) return;
    const doc = board.ownerDocument;
    if (doc.activeElement === doc.body || doc.activeElement === doc.documentElement) {
      board.querySelector<HTMLElement>('[data-chess-index][tabindex="0"]')?.focus({ preventScroll: true });
    }
  }, [spoilerOff]);
  function handleBoardKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.metaKey || event.nativeEvent.isComposing) return;
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-chess-index]');
    if (!target || !event.currentTarget.contains(target)) return;
    const index = Number(target.dataset.chessIndex);
    if (!Number.isInteger(index) || index < 0 || index > 63) return;
    const row = Math.floor(index / 8), col = index % 8;
    let next = index;
    switch (event.key) {
      case 'ArrowLeft': next = row * 8 + Math.max(0, col - 1); break;
      case 'ArrowRight': next = row * 8 + Math.min(7, col + 1); break;
      case 'ArrowUp': next = Math.max(0, row - 1) * 8 + col; break;
      case 'ArrowDown': next = Math.min(7, row + 1) * 8 + col; break;
      case 'Home': next = event.ctrlKey ? 0 : row * 8; break;
      case 'End': next = event.ctrlKey ? 63 : row * 8 + 7; break;
      default: return;
    }
    event.preventDefault();
    event.stopPropagation();
    setActiveSquare(next);
    event.currentTarget.querySelector<HTMLElement>(`[data-chess-index="${next}"]`)?.focus({ preventScroll: true });
  }
  const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  if (myColor === 'black') letters.reverse();

  const axisFontClass =
    size !== 'regular'
      ? css`
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.1rem;
          }
        `
      : '';

  const board = useMemo(() => {
    const result = [];
    for (let i = 0; i < 8; i++) {
      const squareRows = [];
      for (let j = 0; j < 8; j++) {
        const index = i * 8 + j;
        const piece = squares[index]
          ? getPiece({ piece: squares[index], myColor, interactable })
          : {};
        squareRows.push(
          <Square
            key={index}
            label={`${myColor === 'black' ? 'hgfedcba'[j] : 'abcdefgh'[j]}${myColor === 'black' ? i + 1 : 8 - i}, ${squares[index]?.type ? `${squares[index].color} ${squares[index].type}` : 'empty'}${squares[index]?.state ? `, ${squares[index].state}` : ''}`}
            interactive={interactable || !!onBoardClick}
            navigationIndex={index}
            tabIndex={activeSquare === index ? 0 : -1}
            onFocus={() => setActiveSquare(index)}
            className={squares[index]?.state}
            img={piece.img}
            shade={
              (isEven(i) && isEven(j)) || (!isEven(i) && !isEven(j))
                ? 'light'
                : 'dark'
            }
            onClick={interactable ? () => onClick(index) : undefined}
          />
        );
      }
      result.push(<Fragment key={i}>{squareRows}</Fragment>);
    }
    return result;
  }, [activeSquare, interactable, myColor, onClick, onBoardClick, squares]);

  const grid = (
    <div
      onClick={spoilerOff ? onBoardClick : undefined}
      className={css`
        cursor: ${spoilerOff && !!onBoardClick ? 'pointer' : ''};
        display: grid;
        width: 100%;
        height: auto;
        grid-template-areas:
          'num chess'
          'num letter'
          '. castling';
        grid-template-columns: 2rem var(--chat-chess-board-size);
        grid-template-rows: var(--chat-chess-board-size) 2.5rem auto;
        background: #fff;
      `}
    >
      <div
        className={axisFontClass}
        style={{
          gridArea: 'num',
          background: '#fff',
          display: 'grid',
          gridTemplateRows: '1fr 2.5rem'
        }}
      >
        <div style={{ display: 'grid', gridTemplateRows: 'repeat(8, 1fr)' }}>
          {Array(8)
            .fill(null)
            .map((elem, index) => (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                key={index}
              >
                {myColor === 'black' ? index + 1 : 8 - index}
              </div>
            ))}
        </div>
        <div />
      </div>
      <div
        style={{
          gridArea: 'chess',
          position: 'relative'
        }}
      >
        <div
          ref={boardRef}
          role="group"
          aria-label={interactable ? 'Chess board. Use arrow keys to explore squares; Enter or Space selects a piece or destination.' : onBoardClick ? 'Chess board. Use arrow keys to explore squares; Enter or Space opens the board.' : 'Chess board. Use arrow keys to explore squares.'}
          onKeyDown={handleBoardKeyDown}
          style={{
            margin: '0 auto',
            width: '100%',
            height: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)'
          }}
        >
          {board}
        </div>
      </div>
      {squares.length > 0 && (
        <CastlingButton
          interactable={interactable}
          myColor={myColor}
          onCastling={onCastling}
          squares={squares}
        />
      )}
      <div
        className={axisFontClass}
        style={{
          gridArea: 'letter',
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          background: '#fff'
        }}
      >
        {letters.map((elem, index) => (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            key={index}
          >
            {elem}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <BoardSpoiler
      revealed={spoilerOff}
      onReveal={onSpoilerClick}
      style={{ width: '100%', height: 'auto' }}
      gameType="chess"
      opponentName={opponentName}
    >
      {grid}
    </BoardSpoiler>
  );

  function isEven(num: number) {
    return num % 2 === 0;
  }
}
