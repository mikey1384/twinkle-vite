import React, { useMemo, Fragment } from 'react';
import getPiece from '../helpers/piece';
import Square from '../Square';
import { mobileMaxWidth } from '~/constants/css';
import { isTablet } from '~/helpers';
import { css } from '@emotion/css';
import CastlingButton from './CastlingButton';
import BoardSpoiler from '../../BoardSpoiler';

const deviceIsTablet = isTablet(navigator);
const defaultBoardWidth = deviceIsTablet ? '25vh' : '50vh';
const inlineBoardWidth = deviceIsTablet
  ? 'clamp(14rem, 40vw, 20rem)'
  : 'clamp(14rem, 30vw, 22rem)';
const inlineMobileBoardWidth = 'clamp(11rem, 50vw, 16rem)';

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
  const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  if (myColor === 'black') letters.reverse();

  // Smaller axis fonts for compact view on mobile
  const axisFontClass =
    size !== 'regular'
      ? css`
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 0.8rem;
          }
        `
      : '';
  const boardWidth =
    size === 'compact'
      ? '16rem'
      : size === 'inline'
      ? inlineBoardWidth
      : defaultBoardWidth;
  const mobileBoardWidth =
    size === 'compact'
      ? 'min(90vw, 14rem)'
      : size === 'inline'
      ? inlineMobileBoardWidth
      : '50vw';

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
            className={squares[index]?.state}
            img={piece.img}
            shade={
              (isEven(i) && isEven(j)) || (!isEven(i) && !isEven(j))
                ? 'light'
                : 'dark'
            }
            onClick={() => onClick(index)}
          />
        );
      }
      result.push(<Fragment key={i}>{squareRows}</Fragment>);
    }
    return result;
  }, [interactable, myColor, onClick, squares]);

  const grid = (
    <div
      onClick={spoilerOff ? onBoardClick : undefined}
      className={css`
        cursor: ${spoilerOff && !!onBoardClick ? 'pointer' : ''};
        display: grid;
        width: 100%;
        height: 100%;
        grid-template-areas:
          'num chess'
          'num letter';
        grid-template-columns: 2rem ${boardWidth};
        grid-template-rows: ${boardWidth} 2.5rem;
        background: #fff;
        @media (max-width: ${mobileMaxWidth}) {
          grid-template-columns: 2rem ${mobileBoardWidth};
          grid-template-rows: ${mobileBoardWidth} 2.5rem;
        }
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
      style={{ width: '100%', height: '100%' }}
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
