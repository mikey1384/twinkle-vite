import React, { useMemo } from 'react';
import Loading from '~/components/Loading';
import { css } from '@emotion/css';
import { isTablet } from '~/helpers';
import { mobileMaxWidth } from '~/constants/css';

const deviceIsTablet = isTablet(navigator);

export default function BoardFrame({
  children,
  loading = false,
  size = 'regular'
}: {
  children?: React.ReactNode;
  loading?: boolean;
  size?: 'regular' | 'compact' | 'inline';
}) {
  const { desktopBoardSize, mobileBoardSize } = useMemo(() => {
    if (size === 'compact') {
      return {
        desktopBoardSize: '16rem',
        mobileBoardSize: 'min(90vw, 14rem)'
      };
    }
    if (size === 'inline') {
      return {
        desktopBoardSize: deviceIsTablet
          ? 'clamp(14rem, 40vw, 20rem)'
          : 'clamp(14rem, 30vw, 22rem)',
        mobileBoardSize: 'clamp(11rem, 50vw, 16rem)'
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
        --chat-chess-board-size: ${desktopBoardSize};
        width: calc(var(--chat-chess-board-size) + 2rem);
        min-height: calc(var(--chat-chess-board-size) + 2.5rem);
        position: relative;
        @media (max-width: ${mobileMaxWidth}) {
          --chat-chess-board-size: ${mobileBoardSize};
        }
      `}
    >
      {loading ? (
        <Loading
          text="Loading chess board…"
          style={{ position: 'absolute', inset: 0, height: 'auto' }}
        />
      ) : (
        children
      )}
    </div>
  );
}
