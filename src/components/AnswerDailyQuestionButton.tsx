import React, { useState } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import DailyQuestionModal from '~/containers/Home/DailyQuestionModal';
import { useKeyContext, useNotiContext } from '~/contexts';

export default function AnswerDailyQuestionButton({
  noBorderTop,
  style
}: {
  noBorderTop?: boolean;
  style?: React.CSSProperties;
}) {
  const { userId } = useKeyContext((v) => v.myState);
  const todayStats = useNotiContext((v) => v.state.todayStats);
  const [dailyQuestionModalShown, setDailyQuestionModalShown] = useState(false);

  const hasAnsweredToday = todayStats?.dailyQuestionCompleted;
  const showButton = userId && !hasAnsweredToday;

  if (!showButton) {
    return null;
  }

  return (
    <>
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
          onClick={() => setDailyQuestionModalShown(true)}
        >
          Answer Today's Question
        </GameCTAButton>
      </div>
      {dailyQuestionModalShown && (
        <DailyQuestionModal onHide={() => setDailyQuestionModalShown(false)} />
      )}
    </>
  );
}
