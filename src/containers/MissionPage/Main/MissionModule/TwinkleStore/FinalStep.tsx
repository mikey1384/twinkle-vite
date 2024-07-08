import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext, useMissionContext } from '~/contexts';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';

FinalStep.propTypes = {
  mission: PropTypes.object.isRequired,
  userId: PropTypes.number.isRequired,
  style: PropTypes.object
};

export default function FinalStep({
  mission,
  style,
  userId
}: {
  mission: any;
  userId: number;
  style?: React.CSSProperties;
}) {
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const uploadMissionAttempt = useAppContext(
    (v) => v.requestHelpers.uploadMissionAttempt
  );
  const onUpdateMissionAttempt = useMissionContext(
    (v) => v.actions.onUpdateMissionAttempt
  );
  const [submitDisabled, setSubmitDisabled] = useState(false);

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontSize: '1.7rem',
        ...style
      }}
      className={css`
        > p {
          line-height: 2;
        }
      `}
    >
      <p>
        Great! You have successfully unlocked the <b>change username item</b>{' '}
        from Settings.
      </p>
      <p>
        Press the <b style={{ color: Color.brownOrange() }}>button</b> below to
        collect your reward
      </p>
      <Button
        filled
        disabled={submitDisabled}
        style={{ marginTop: '5rem', fontSize: '1.7rem' }}
        skeuomorphic
        color="brownOrange"
        onClick={handleCompleteMission}
      >
        <Icon icon="bolt" />
        <span style={{ marginLeft: '1rem' }}>Collect Reward</span>
      </Button>
    </div>
  );

  async function handleCompleteMission() {
    setSubmitDisabled(true);
    const { success, newXpAndRank, newCoins } = await uploadMissionAttempt({
      missionId: mission.id,
      attempt: { status: 'pass' }
    });
    if (success) {
      if (newXpAndRank.xp) {
        onSetUserState({
          userId,
          newState: { xp: newXpAndRank.xp, rank: newXpAndRank.rank }
        });
      }
      if (newCoins) {
        onSetUserState({
          userId,
          newState: { twinkleCoins: newCoins }
        });
      }
      onUpdateMissionAttempt({
        missionId: mission.id,
        newState: { status: 'pass' }
      });
    }
    setSubmitDisabled(false);
  }
}
