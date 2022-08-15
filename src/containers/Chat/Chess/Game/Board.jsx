import { useMemo, Fragment } from 'react';
import PropTypes from 'prop-types';
import getPiece from '../helpers/piece';
import Square from '../Square';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import CastlingButton from './CastlingButton';

Board.propTypes = {
  interactable: PropTypes.bool,
  myColor: PropTypes.string,
  onBoardClick: PropTypes.func,
  onCastling: PropTypes.func,
  onSpoilerClick: PropTypes.func,
  onClick: PropTypes.func,
  opponentName: PropTypes.string,
  spoilerOff: PropTypes.bool,
  squares: PropTypes.array
};
export default function Board({
  interactable,
  myColor,
  onBoardClick,
  onCastling,
  onClick,
  onSpoilerClick,
  opponentName,
  spoilerOff,
  squares
}) {
  const madeNewMoveLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return (
        <>
          <p>{opponentName}님이 체스 메시지를 보냈습니다.</p>
          <p>조회하시려면 여기를 탭 하세요.</p>
          <p>
            {`${opponentName}님의 체스 메시지를 열어보신 다음에는`}
            반드시 <b>5분</b>안에 회답하셔야 하며, 그렇지 못할 경우 패배
            처리됩니다.
          </p>
        </>
      );
    }
    return (
      <>
        <p>{opponentName} made a new chess move.</p>
        <p>Tap here to view it.</p>
        <p>
          {`After viewing ${opponentName}'s move, you `}
          <b>must</b> make your own move in <b>5 minutes</b>. Otherwise, you
          will lose.
        </p>
      </>
    );
  }, [opponentName]);

  const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  if (myColor === 'black') letters.reverse();
  if (spoilerOff) {
    const board = [];
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
      board.push(<Fragment key={i}>{squareRows}</Fragment>);
    }

    return (
      <div
        onClick={spoilerOff ? onBoardClick : undefined}
        className={css`
          cursor: ${spoilerOff && onBoardClick ? 'pointer' : ''};
          display: ${spoilerOff === false ? 'flex' : 'grid'};
          align-items: ${spoilerOff === false ? 'center' : ''};
          width: 100%;
          height: 100%;
          grid-template-areas:
            'num chess'
            '. letter';
          grid-template-columns: 2rem 360px;
          grid-template-rows: 360px 2.5rem;
          background: ${spoilerOff ? '#fff' : ''};
          @media (max-width: ${mobileMaxWidth}) {
            grid-template-columns: 2rem 50vw;
            grid-template-rows: 50vw 2.5rem;
          }
        `}
      >
        <div
          style={{
            gridArea: 'num',
            display: 'grid',
            gridTemplateRows: 'repeat(8, 1fr)'
          }}
        >
          {Array(8)
            .fill()
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
          style={{
            gridArea: 'letter',
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)'
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
  } else if (spoilerOff === false) {
    return (
      <div
        onClick={spoilerOff ? onBoardClick : undefined}
        className={css`
          cursor: ${spoilerOff && onBoardClick ? 'pointer' : ''};
          display: ${spoilerOff === false ? 'flex' : 'grid'};
          align-items: ${spoilerOff === false ? 'center' : ''};
          width: 100%;
          height: 100%;
          grid-template-areas:
            'num chess'
            '. letter';
          grid-template-columns: 2rem 360px;
          grid-template-rows: 360px 2.5rem;
          background: ${spoilerOff ? '#fff' : ''};
          @media (max-width: ${mobileMaxWidth}) {
            grid-template-columns: 2rem 50vw;
            grid-template-rows: 50vw 2.5rem;
          }
        `}
      >
        <div
          className={css`
            margin: 0 auto;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            flex-direction: column;
            align-items: center;
            text-align: center;
            font-size: 1.7rem;
            line-height: 2;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.5rem;
            }
          `}
        >
          <div
            className={css`
              cursor: pointer;
              background: #fff;
              border: 1px solid ${Color.darkGray()};
              padding: 1rem;
              &:hover {
                text-decoration: underline;
              }
            `}
            onClick={onSpoilerClick}
          >
            {madeNewMoveLabel}
          </div>
        </div>
      </div>
    );
  } else return null;

  function isEven(num) {
    return num % 2 === 0;
  }
}
