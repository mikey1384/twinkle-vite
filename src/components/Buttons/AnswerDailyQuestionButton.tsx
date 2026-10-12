import React from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import { useKeyContext, useNotiContext } from '~/contexts';

export default function AnswerDailyQuestionButton({
  noBorderTop,
  style
}: {
  noBorderTop?: boolean;
  style?: React.CSSProperties;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const todayStats = useNotiContext((v) => v.state.todayStats);
  const navigate = useNavigate();

  const hasAnsweredToday = todayStats?.dailyQuestionCompleted;
  const showButton = userId && !hasAnsweredToday;

  return (
    <>
      {showButton && (
        <div
          className={css`
            margin-top: 1.2rem;
            padding-top: 1rem;
            display: flex;
            justify-content: center;
            ${noBorderTop ? '' : `border-top: 1px solid ${Color.borderGray()};`}
          `}
          style={style}
        >
          <GameCTAButton
            icon="lightbulb"
            variant="purple"
            size="md"
            shiny
            onClick={() => navigate('/daily-reflection')}
          >
            Answer Today's Question
          </GameCTAButton>
        </div>
      )}
    </>
  );
}
