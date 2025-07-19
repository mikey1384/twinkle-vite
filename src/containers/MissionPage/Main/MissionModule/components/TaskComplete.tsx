import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Color } from '~/constants/css';
import { useAppContext, useMissionContext, useKeyContext } from '~/contexts';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import Icon from '~/components/Icon';

TaskComplete.propTypes = {
  innerRef: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  style: PropTypes.object,
  taskId: PropTypes.number.isRequired,
  passMessage: PropTypes.string,
  passMessageFontSize: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
};

export default function TaskComplete({
  innerRef,
  style,
  taskId,
  passMessage,
  passMessageFontSize
}: {
  innerRef?: React.RefObject<any>;
  style?: React.CSSProperties;
  taskId: number;
  passMessage: string;
  passMessageFontSize?: number | string;
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

  return myAttempt?.status ? null : (
    <ErrorBoundary
      componentPath="MissionModule/components/TaskComplete"
      innerRef={innerRef}
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontSize: '1.7rem',
        ...style
      }}
    >
      <p
        style={{
          fontWeight: 'bold',
          fontSize: passMessageFontSize || '1.8rem',
          marginBottom: '1.5rem',
          color: Color.black()
        }}
      >
        {passMessage}
      </p>
      <p style={{ color: Color.black() }}>
        Press the <b style={{ color: Color.brownOrange() }}>button</b> below to
        collect your reward
      </p>
      <Button
        filled
        disabled={submitDisabled}
        style={{ marginTop: '3.5rem', fontSize: '1.7rem' }}
        skeuomorphic
        color="brownOrange"
        onClick={handleTaskComplete}
      >
        <Icon icon="bolt" />
        <span style={{ marginLeft: '1rem' }}>Task Complete</span>
      </Button>
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
    }
    setSubmitDisabled(false);
  }
}
