import React, { useMemo } from 'react';
import Loading from '~/components/Loading';
import Board from './Board';
import { css } from '@emotion/css';
import { isTablet } from '~/helpers';
import { mobileMaxWidth } from '~/constants/css';

const deviceIsTablet = isTablet(navigator);

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
  spoilerOff,
  size = 'regular'
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
  size?: 'regular' | 'compact';
}) {
  const { desktopBoardSize, mobileBoardSize } = useMemo(() => {
    if (size === 'compact') {
      return {
        desktopBoardSize: '9rem',
        mobileBoardSize: '8rem'
      };
    }
    return {
      desktopBoardSize: deviceIsTablet ? '25vh' : '50vh',
      mobileBoardSize: '50vw'
    };
  }, [size]);

  return (
    <div
      className={css`
        width: calc(${desktopBoardSize} + 2rem);
        height: calc(${desktopBoardSize} + 2.5rem);
        position: relative;
        @media (max-width: ${mobileMaxWidth}) {
          width: calc(${mobileBoardSize} + 2rem);
          height: calc(${mobileBoardSize} + 2.5rem);
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
          size={size}
        />
      ) : null}
    </div>
  );
}
