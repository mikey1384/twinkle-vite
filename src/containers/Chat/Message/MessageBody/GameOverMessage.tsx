import React, { memo, useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import { useKeyContext } from '~/contexts';
import localize from '~/constants/localize';

const chessEndedInDrawLabel = localize('chessEndedInDraw');
const chessWasAbortedLabel = localize('chessWasAborted');

function GameOverMessage({
  myId,
  opponentName,
  winnerId,
  isAbort,
  isDraw,
  isResign,
  gameType = 'chess',
  omokState,
  content
}: {
  myId: number;
  opponentName: string;
  winnerId: number;
  isAbort: boolean;
  isDraw: boolean;
  isResign: boolean;
  gameType?: 'chess' | 'omok';
  omokState?: any;
  content?: string;
}) {
  const abortColor = useKeyContext((v) => v.theme.abort.color);
  const drawColor = useKeyContext((v) => v.theme.draw.color);
  const victoryColor = useKeyContext((v) => v.theme.victory.color);
  const failColor = useKeyContext((v) => v.theme.fail.color);

  const isVictorious = useMemo(() => myId === winnerId, [myId, winnerId]);
  const gameDisplayEn = gameType === 'omok' ? 'omok' : 'chess';
  const gameDisplayKr = gameType === 'omok' ? '오목' : '체스';

  const failedToMakeMoveInTimeLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return isVictorious ? (
        <div style={{ textAlign: 'center' }}>
          <p>
            {opponentName}님이 제한시간 안에 {gameDisplayKr}에서 회신하지 못했습니다...
          </p>
          <p style={{ fontWeight: 'bold' }}>{gameDisplayKr} 승리!</p>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <p>회원님은 제한시간 안에 {gameDisplayKr}에서 회신하지 못했습니다...</p>
          <p>{opponentName}님이 {gameDisplayKr}에서 승리했습니다</p>
        </div>
      );
    }
    return isVictorious ? (
      <div style={{ textAlign: 'center' }}>
        <p>{opponentName} failed to make a move in time in {gameDisplayEn}...</p>
        <p style={{ fontWeight: 'bold' }}>You win the {gameDisplayEn} match!</p>
      </div>
    ) : (
      <div style={{ textAlign: 'center' }}>
        <p>You failed to make a move in time in {gameDisplayEn}...</p>
        <p>{opponentName} wins the {gameDisplayEn} match</p>
      </div>
    );
  }, [gameDisplayEn, gameDisplayKr, isVictorious, opponentName]);

  // Omok-specific: detect connect-five victory when message contains omokState.winnerId
  const omokConnectFiveLabel = useMemo(() => {
    if (gameType !== 'omok') return null;
    const isFiveWin = Boolean(omokState?.winnerId);
    if (!isFiveWin) return null;
    if (SELECTED_LANGUAGE === 'kr') {
      return isVictorious ? (
        <div style={{ textAlign: 'center' }}>
          <p>오목 5목 달성!</p>
          <p style={{ fontWeight: 'bold' }}>회원님이 승리했습니다</p>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <p>{opponentName}님이 5목을 달성했습니다</p>
          <p>{opponentName}님이 승리했습니다</p>
        </div>
      );
    }
    return isVictorious ? (
      <div style={{ textAlign: 'center' }}>
        <p>Five in a row!</p>
        <p style={{ fontWeight: 'bold' }}>You win the omok match!</p>
      </div>
    ) : (
      <div style={{ textAlign: 'center' }}>
        <p>{opponentName} connected five</p>
        <p>{opponentName} wins the omok match</p>
      </div>
    );
  }, [gameType, isVictorious, omokState?.winnerId, opponentName]);

  const resignLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return isVictorious ? (
        <div style={{ textAlign: 'center' }}>
          <p>{opponentName}님이 {gameDisplayKr}에서 기권했습니다</p>
          <p style={{ fontWeight: 'bold' }}>{gameDisplayKr} 승리!</p>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <p>회원님은 {gameDisplayKr}에서 기권하셨습니다...</p>
          <p>{opponentName}님이 {gameDisplayKr}에서 승리했습니다</p>
        </div>
      );
    }
    return isVictorious ? (
      <div style={{ textAlign: 'center' }}>
        <p>{opponentName} resigned the {gameDisplayEn} match!</p>
        <p style={{ fontWeight: 'bold' }}>You win the {gameDisplayEn} match!</p>
      </div>
    ) : (
      <div style={{ textAlign: 'center' }}>
        <p>You resigned the {gameDisplayEn} match...</p>
        <p>{opponentName} wins the {gameDisplayEn} match</p>
      </div>
    );
  }, [gameDisplayEn, gameDisplayKr, isVictorious, opponentName]);

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
              {SELECTED_LANGUAGE === 'kr'
                ? `${gameDisplayKr} 게임이 무승부로 종료되었습니다`
                : `The ${gameDisplayEn} match ended in a draw`}
            </div>
          ) : isAbort ? (
            <div style={{ textAlign: 'center' }}>
              {SELECTED_LANGUAGE === 'kr'
                ? `${gameDisplayKr} 게임이 취소되었습니다`
                : `The ${gameDisplayEn} match was aborted`}
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
