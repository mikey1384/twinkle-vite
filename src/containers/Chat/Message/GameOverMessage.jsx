import { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import { useKeyContext } from '~/contexts';
import localize from '~/constants/localize';

const chessEndedInDrawLabel = localize('chessEndedInDraw');

GameOverMessage.propTypes = {
  opponentName: PropTypes.string,
  myId: PropTypes.number.isRequired,
  winnerId: PropTypes.number,
  isDraw: PropTypes.bool,
  isResign: PropTypes.bool
};

function GameOverMessage({ myId, opponentName, winnerId, isDraw, isResign }) {
  const {
    draw: { color: drawColor },
    victory: { color: victoryColor },
    defeat: { color: defeatColor }
  } = useKeyContext((v) => v.theme);

  const isVictorious = useMemo(() => myId === winnerId, [myId, winnerId]);
  const failedToMakeMoveInTimeLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return isVictorious ? (
        <div style={{ textAlign: 'center' }}>
          <p>{opponentName}님이 제한시간 안에 회신하지 못했습니다...</p>
          <p style={{ fontWeight: 'bold' }}>
            축하합니다. 회원님이 승리했습니다
          </p>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <p>회원님은 제한시간 안에 회신하지 못했습니다...</p>
          <p>{opponentName}님이 승리했습니다</p>
        </div>
      );
    }
    return isVictorious ? (
      <div style={{ textAlign: 'center' }}>
        <p>{opponentName} failed to make a move in time...</p>
        <p style={{ fontWeight: 'bold' }}>You win!</p>
      </div>
    ) : (
      <div style={{ textAlign: 'center' }}>
        <p>You failed to make a move in time...</p>
        <p>{opponentName} wins</p>
      </div>
    );
  }, [isVictorious, opponentName]);

  const resignLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return isVictorious ? (
        <div style={{ textAlign: 'center' }}>
          <p>{opponentName}님이 기권했습니다</p>
          <p style={{ fontWeight: 'bold' }}>
            축하합니다. 회원님이 승리했습니다
          </p>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <p>회원님은 기권하셨습니다...</p>
          <p>{opponentName}님이 승리했습니다</p>
        </div>
      );
    }
    return isVictorious ? (
      <div style={{ textAlign: 'center' }}>
        <p>{opponentName} resigned!</p>
        <p style={{ fontWeight: 'bold' }}>You win!</p>
      </div>
    ) : (
      <div style={{ textAlign: 'center' }}>
        <p>You resigned...</p>
        <p>{opponentName} wins</p>
      </div>
    );
  }, [isVictorious, opponentName]);

  return (
    <ErrorBoundary componentPath="GameOverMessage">
      <div
        style={{
          marginRight: '1rem',
          paddingBottom: '1rem'
        }}
      >
        <div
          className={css`
            background: ${isDraw
              ? Color[drawColor]()
              : isVictorious
              ? Color[victoryColor]()
              : Color[defeatColor]()};
            font-size: 2.5rem;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: ${isDraw ? '2rem' : '1rem'};
            color: #fff;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.7rem;
            }
          `}
        >
          {isDraw ? (
            <div style={{ textAlign: 'center' }}>{chessEndedInDrawLabel}</div>
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
