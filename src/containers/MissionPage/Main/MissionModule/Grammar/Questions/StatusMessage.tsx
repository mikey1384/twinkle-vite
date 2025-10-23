import React, { useMemo } from 'react';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import MissionStatusCard from '~/components/MissionStatusCard';
import RichText from '~/components/Texts/RichText';
import { Color } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';

export default function StatusMessage({
  mission,
  missionComplete,
  status,
  passMessage,
  failMessage,
  onBackToStart
}: {
  mission: any;
  missionComplete: boolean;
  status: string;
  passMessage: string;
  failMessage: string;
  onBackToStart: () => any;
}) {

  const rewards = useMemo(() => {
    return {
      xp: mission.repeatXpReward,
      coins: mission.repeatCoinReward
    };
  }, [mission.repeatCoinReward, mission.repeatXpReward]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '2rem',
        marginBottom: '-1rem',
        padding: '0 1rem'
      }}
    >
      {missionComplete ? (
        <MissionStatusCard
          status="success"
          title="Mission Accomplished"
          message="Great work! You've cleared this run."
          rewards={rewards}
          footer={
            <Button
              onClick={onBackToStart}
              variant="soft"
              tone="raised"
              color="logoBlue"
            >
              Back to Start Screen
            </Button>
          }
          style={{ margin: '0 auto' }}
        />
      ) : (
        <MissionStatusCard
          status={status === 'pass' ? 'success' : 'fail'}
          title={status === 'pass' ? 'Correct!' : 'Not Quite'}
          message={
            status === 'pass'
              ? passMessage
              : 'Review the explanation below and try again.'
          }
          footer={
            status === 'fail' ? (
              <Button
                onClick={onBackToStart}
                variant="soft"
                tone="raised"
                color="rose"
              >
                Back to Start Screen
              </Button>
            ) : null
          }
          style={{ margin: '0 auto' }}
        >
          {status === 'fail' ? (
            <RichText style={{ fontSize: '1.6rem', color: Color.darkGray() }}>
              {failMessage}
            </RichText>
          ) : null}
          {status === 'pass' ? (
            <RichText style={{ fontSize: '1.6rem', color: Color.darkGray() }}>
              {passMessage}
            </RichText>
          ) : null}
        </MissionStatusCard>
      )}
    </div>
  );
}
