import React, { memo, useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useKeyContext } from '~/contexts';

function GameOverMessage({
  myId,
  opponentName,
  winnerId,
  isAbort,
  isDraw,
  isResign,
  gameType = 'chess',
  omokState
}: {
  myId: number;
  opponentName: string;
  winnerId: number;
  isAbort: boolean;
  isDraw: boolean;
  isResign: boolean;
  gameType?: 'chess' | 'omok';
  omokState?: any;
}) {
  const abortColor = useKeyContext((v) => v.theme.abort.color);
  const drawColor = useKeyContext((v) => v.theme.draw.color);
  const victoryColor = useKeyContext((v) => v.theme.victory.color);
  const failColor = useKeyContext((v) => v.theme.fail.color);

  const isVictorious = useMemo(() => myId === winnerId, [myId, winnerId]);
  const gameDisplayEn = gameType === 'omok' ? 'omok' : 'chess';

  const failedToMakeMoveInTimeLabel = useMemo(() => {
    return isVictorious ? (
      <div style={{ textAlign: 'center' }}>
        <p>
          {opponentName} failed to make a move in time in {gameDisplayEn}...
        </p>
        <p style={{ fontWeight: 'bold' }}>You win the {gameDisplayEn} match!</p>
      </div>
    ) : (
      <div style={{ textAlign: 'center' }}>
        <p>You failed to make a move in time in {gameDisplayEn}...</p>
        <p>
          {opponentName} wins the {gameDisplayEn} match
        </p>
      </div>
    );
  }, [gameDisplayEn, isVictorious, opponentName]);

  // Omok-specific: detect connect-five victory when message contains omokState.winnerId
  const omokConnectFiveLabel = useMemo(() => {
    if (gameType !== 'omok') return null;
    const isFiveWin = Boolean(omokState?.winnerId);
    if (!isFiveWin) return null;
    return isVictorious ? (
      <div style={{ textAlign: 'center' }}>
        <p>五目!</p>
        <p style={{ fontWeight: 'bold' }}>You win</p>
      </div>
    ) : (
      <div style={{ textAlign: 'center' }}>
        <p>五目...</p>
        <p>{opponentName} wins</p>
      </div>
    );
  }, [gameType, isVictorious, omokState?.winnerId, opponentName]);

  const resignLabel = useMemo(() => {
    return isVictorious ? (
      <div style={{ textAlign: 'center' }}>
        <p>
          {opponentName} resigned the {gameDisplayEn} match!
        </p>
        <p style={{ fontWeight: 'bold' }}>You win</p>
      </div>
    ) : (
      <div style={{ textAlign: 'center' }}>
        <p>You resigned the {gameDisplayEn} match...</p>
        <p>{opponentName} wins</p>
      </div>
    );
  }, [gameDisplayEn, isVictorious, opponentName]);

  return (
    <ErrorBoundary componentPath="GameOverMessage">
      <div
        style={{
          paddingBottom: '1rem'
        }}
      >
        <div
          className={css`
            background: ${isDraw
              ? Color[drawColor]()
              : isAbort
              ? Color[abortColor]()
              : isVictorious
              ? Color[victoryColor]()
              : Color[failColor]()};
            font-size: 2.5rem;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: ${isDraw || isAbort ? '2rem' : '1rem'};
            color: #fff;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.7rem;
            }
          `}
        >
          {isDraw ? (
            <div style={{ textAlign: 'center' }}>
              {`The ${gameDisplayEn} match ended in a draw`}
            </div>
          ) : isAbort ? (
            <div style={{ textAlign: 'center' }}>
              {`The ${gameDisplayEn} match was aborted`}
            </div>
          ) : omokConnectFiveLabel ? (
            omokConnectFiveLabel
          ) : isResign ? (
            resignLabel
          ) : (
            failedToMakeMoveInTimeLabel
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default memo(GameOverMessage);
