import React, { useMemo, useState } from 'react';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { useAppContext, useMissionContext, useKeyContext } from '~/contexts';
import ErrorBoundary from '~/components/ErrorBoundary';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';

export default function TaskComplete({
  innerRef,
  style,
  taskId,
  allTasksComplete = false,
  passMessage,
  passMessageFontSize
}: {
  innerRef?: React.RefObject<any>;
  style?: React.CSSProperties;
  taskId: number;
  allTasksComplete?: boolean;
  passMessage?: string;
  passMessageFontSize?: string;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const uploadMissionAttempt = useAppContext(
    (v) => v.requestHelpers.uploadMissionAttempt
  );
  const myAttempts = useMissionContext((v) => v.state.myAttempts);
  const onUpdateMissionAttempt = useMissionContext(
    (v) => v.actions.onUpdateMissionAttempt
  );
  const myAttempt = useMemo(() => myAttempts[taskId], [myAttempts, taskId]);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const [submitDisabled, setSubmitDisabled] = useState(false);

  if (myAttempt?.status || !allTasksComplete) return null;

  return (
    <ErrorBoundary
      componentPath="MissionModule/components/TaskComplete"
      innerRef={innerRef}
    >
      <div
        className={css`
          width: 100%;
          background: linear-gradient(
            135deg,
            ${Color.brownOrange(0.08)} 0%,
            ${Color.gold(0.12)} 50%,
            ${Color.brownOrange(0.08)} 100%
          );
          border: 2px solid ${Color.brownOrange(0.4)};
          border-radius: ${borderRadius};
          padding: 2rem;
          text-align: center;
          position: relative;
          overflow: hidden;
          @media (max-width: ${mobileMaxWidth}) {
            padding: 1.5rem;
            border-radius: 0;
            border-left: 0;
            border-right: 0;
          }
        `}
        style={style}
      >
        <div
          className={css`
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 6rem;
            opacity: 0.1;
          `}
        >
          <Icon icon="trophy" />
        </div>
        <div
          className={css`
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.8rem;
            margin-bottom: 0.8rem;
          `}
        >
          <Icon
            icon="party-horn"
            style={{ fontSize: '2rem', color: Color.brownOrange() }}
          />
          <h3
            className={css`
              margin: 0;
              font-size: 2rem;
              font-weight: 800;
              color: ${Color.black()};
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.7rem;
              }
            `}
          >
            Mission Complete!
          </h3>
          <Icon
            icon="party-horn"
            style={{
              fontSize: '2rem',
              color: Color.brownOrange(),
              transform: 'scaleX(-1)'
            }}
          />
        </div>
        <p
          className={css`
            margin: 0 0 1.5rem;
            font-size: ${passMessageFontSize || '1.4rem'};
            color: ${Color.darkerGray()};
          `}
        >
          {passMessage || "You've completed all the steps. Claim your XP and coins!"}
        </p>
        <GameCTAButton
          variant="gold"
          size="xl"
          shiny
          icon="gift"
          disabled={submitDisabled}
          loading={submitDisabled}
          onClick={handleTaskComplete}
        >
          Collect Reward
        </GameCTAButton>
      </div>
    </ErrorBoundary>
  );

  async function handleTaskComplete() {
    setSubmitDisabled(true);
    const { success, newXpAndRank, newCoins } = await uploadMissionAttempt({
      missionId: taskId,
      attempt: { status: 'pass' }
    });
    if (success) {
      if (newXpAndRank.xp) {
        onSetUserState({
          userId,
          newState: { twinkleXP: newXpAndRank.xp, rank: newXpAndRank.rank }
        });
      }
      if (newCoins) {
        onSetUserState({
          userId,
          newState: { twinkleCoins: newCoins }
        });
      }
      onUpdateMissionAttempt({
        missionId: taskId,
        newState: { status: 'pass' }
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setSubmitDisabled(false);
  }
}
