import React, { useMemo } from 'react';
import FileViewer from '~/components/FileViewer';
import UsernameText from '~/components/Texts/UsernameText';
import Button from '~/components/Button';
import MissionStatusCard from '~/components/MissionStatusCard';
import RichText from '~/components/Texts/RichText';
import { useMissionContext } from '~/contexts';
import { borderRadius, Color } from '~/constants/css';
import { timeSince } from '~/helpers/timeStampHelpers';
import { useRoleColor } from '~/theme/useRoleColor';

export default function ApprovedStatus({
  isTask,
  xpReward,
  coinReward,
  missionId,
  myAttempt,
  passMessage,
  style
}: {
  isTask?: boolean;
  xpReward?: number;
  coinReward?: number;
  missionId: number;
  myAttempt: any;
  passMessage?: string;
  style?: React.CSSProperties;
}) {
  const linkRole = useRoleColor('link', { fallback: 'logoBlue' });
  const successRole = useRoleColor('success', { fallback: 'green' });
  const linkColor = useMemo(
    () => linkRole.getColor() || Color.logoBlue(),
    [linkRole]
  );
  const successColor = useMemo(
    () => successRole.getColor() || Color.green(),
    [successRole]
  );
  const onUpdateMissionAttempt = useMissionContext(
    (v) => v.actions.onUpdateMissionAttempt
  );
  const rewards = useMemo(() => {
    if (myAttempt.status !== 'pass') return undefined;
    return {
      xp: xpReward,
      coins: coinReward
    };
  }, [coinReward, myAttempt.status, xpReward]);

  return (
    <div
      style={{
        width: '100%',
        fontSize: '1.7rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        lineHeight: 1.8,
        gap: '2.4rem',
        ...style
      }}
    >
      <MissionStatusCard
        status={
          myAttempt.status === 'pass'
            ? 'success'
            : myAttempt.status === 'fail'
            ? 'fail'
            : 'info'
        }
        title={
          myAttempt.status === 'pass'
            ? isTask
              ? 'Task Complete'
              : 'Mission Accomplished'
            : myAttempt.status === 'fail'
            ? 'Mission Failed'
            : 'Awaiting Review'
        }
        message={
          myAttempt.status === 'pass'
            ? passMessage ||
              (isTask
                ? 'You completed all the steps and earned your reward!'
                : 'Great work! Your submission has been approved.')
            : myAttempt.status === 'fail'
            ? 'Take another look and give it another shot.'
            : undefined
        }
        rewards={rewards}
        footer={
          myAttempt.status === 'fail' ? (
            <Button
              color={successColor}
              onClick={() =>
                onUpdateMissionAttempt({
                  missionId,
                  newState: { tryingAgain: true }
                })
              }
              filled
              style={{ fontSize: '1.6rem', padding: '1.1rem 2.2rem' }}
            >
              Try Again
            </Button>
          ) : null
        }
      >
        {myAttempt.status === 'pass' && myAttempt.reviewer ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              fontSize: '1.4rem',
              color: Color.darkGray()
            }}
          >
            Reviewed by&nbsp;
            <UsernameText color={linkColor} user={myAttempt.reviewer} />
            &nbsp;•&nbsp;{timeSince(myAttempt.reviewTimeStamp)}
          </div>
        ) : null}
      </MissionStatusCard>
      {myAttempt.filePath && (
        <FileViewer
          style={{ marginTop: '2rem' }}
          thumbUrl={myAttempt.thumbUrl}
          src={myAttempt.filePath}
        />
      )}
      {myAttempt.content && myAttempt.status === 'fail' && (
        <RichText style={{ marginTop: '1rem' }}>{myAttempt.content}</RichText>
      )}
      {myAttempt.reviewer && myAttempt.status !== 'pass' && (
        <div
          style={{
            width: '100%',
            marginTop: '1.4rem',
            padding: '1rem',
            border: '1px solid var(--ui-border)',
            borderRadius
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              lineHeight: 1.5
            }}
          >
            <UsernameText
              color={linkColor}
              user={myAttempt.reviewer}
            />
            <span>{timeSince(myAttempt.reviewTimeStamp)}</span>
          </div>
          <RichText>
            {myAttempt.feedback ||
              (myAttempt.status === 'pass' ? 'Great job!' : 'Please try again')}
          </RichText>
        </div>
      )}
    </div>
  );
}
