import React, { useLayoutEffect, useMemo } from 'react';
import Button from '~/components/Button';
import { Color } from '~/constants/css';
import MissionStatusCard from '~/components/MissionStatusCard';

const BodyRef = document.scrollingElement || document.documentElement;
const startLabel = 'Start';
const whenReadyPressStartLabel = 'When you are ready, press "Start"';

export default function StartScreen({
  isRepeating,
  loading,
  mission,
  myAttempts,
  onInitMission,
  onStartButtonClick
}: {
  isRepeating?: boolean;
  loading: boolean;
  mission: any;
  myAttempts: any;
  onInitMission: () => any;
  onStartButtonClick: () => any;
}) {
  useLayoutEffect(() => {
    const appElement = document.getElementById('App');
    if (appElement) appElement.scrollTop = 0;
    BodyRef.scrollTop = 0;
    onInitMission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const correctlyAnswerAllQuestionsLabel = useMemo(() => {
    return `Correctly answer all ${mission.numQuestions} questions`;
  }, [mission?.numQuestions]);

  const rewards = useMemo(() => {
    if (myAttempts[mission.id]?.status !== 'pass') return undefined;
    return {
      xp: mission.xpReward,
      coins: mission.coinReward
    };
  }, [mission.coinReward, mission.id, mission.xpReward, myAttempts]);

  return (
    <div
      style={{
        textAlign: 'center',
        width: '100%',
        marginTop: '2.5rem'
      }}
    >
      {isRepeating && (
        <div style={{ marginBottom: '3.5rem' }}>
          <MissionStatusCard
            status="success"
            title="Mission Accomplished"
            message="You've already cleared this mission. Give it another run to earn repeat rewards."
            rewards={rewards}
            style={{ margin: '0 auto' }}
          >
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: Color.green()
              }}
            >
              This mission is repeatable
            </div>
          </MissionStatusCard>
        </div>
      )}
      <h1>{correctlyAnswerAllQuestionsLabel}</h1>
      <p style={{ marginTop: '1.5rem', fontSize: '1.7rem' }}>
        {whenReadyPressStartLabel}
      </p>
      <div
        style={{
          display: 'flex',
          marginTop: '3.5rem',
          justifyContent: 'center'
        }}
      >
        <Button
          color="green"
          variant="soft"
          tone="raised"
          disabled={loading}
          style={{ fontSize: '2.3rem' }}
          onClick={onStartButtonClick}
        >
          {startLabel}
        </Button>
      </div>
    </div>
  );
}
