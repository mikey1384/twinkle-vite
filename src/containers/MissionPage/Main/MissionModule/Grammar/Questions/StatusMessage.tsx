import React, { useMemo } from 'react';
import Button from '~/components/Button';
import MissionStatusCard from '~/components/MissionStatusCard';
import AnswerFeedback from './AnswerFeedback';

export default function StatusMessage({
  mission,
  missionComplete,
  status,
  failMessage,
  onBackToStart
}: {
  mission: any;
  missionComplete: boolean;
  status: string;
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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            width: '100%',
            maxWidth: '40rem'
          }}
        >
          <AnswerFeedback
            isCorrect={status === 'pass'}
            explanation={status === 'fail' ? failMessage : ''}
          />
          {status === 'fail' && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                onClick={onBackToStart}
                variant="soft"
                tone="raised"
                color="rose"
              >
                Back to Start Screen
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
