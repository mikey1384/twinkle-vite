import React from 'react';
import Loading from '~/components/Loading';
import Board from './Board';
import { css } from '@emotion/css';
import { isTablet } from '~/helpers';
import { mobileMaxWidth } from '~/constants/css';

const deviceIsTablet = isTablet(navigator);
const boardWidth = deviceIsTablet ? '25vh' : '50vh';

export default function Game({
  interactable,
  loading,
  onClick,
  squares,
  myColor,
  onBoardClick,
  onCastling,
  onSpoilerClick,
  opponentName,
  spoilerOff
}: {
  interactable: boolean;
  loading: boolean;
  onClick: (v: number) => void;
  squares: any[];
  myColor: string;
  onCastling: (v: string) => void;
  spoilerOff: boolean;
  opponentName: string;
  onBoardClick?: () => void;
  onSpoilerClick: () => void;
}) {
  return (
    <div
      className={css`
        width: CALC(${boardWidth} + 2rem);
        height: CALC(${boardWidth} + 2.5rem);
        position: relative;
        @media (max-width: ${mobileMaxWidth}) {
          width: CALC(50vw + 2rem);
          height: CALC(50vw + 2.5rem);
        }
      `}
    >
      {loading ? (
        <Loading />
      ) : squares.length > 0 ? (
        <Board
          interactable={interactable}
          myColor={myColor}
          onBoardClick={onBoardClick}
          onCastling={onCastling}
          onClick={onClick}
          onSpoilerClick={onSpoilerClick}
          opponentName={opponentName}
          spoilerOff={spoilerOff}
          squares={squares}
        />
      ) : null}
    </div>
  );
}
