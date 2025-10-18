import React, { useMemo } from 'react';
import FileViewer from '~/components/FileViewer';
import UsernameText from '~/components/Texts/UsernameText';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import RichText from '~/components/Texts/RichText';
import { useMissionContext } from '~/contexts';
import { borderRadius, Color } from '~/constants/css';
import { timeSince } from '~/helpers/timeStampHelpers';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useRoleColor } from '~/theme/useRoleColor';

export default function ApprovedStatus({
  isTask,
  xpReward,
  coinReward,
  missionId,
  myAttempt,
  style
}: {
  isTask?: boolean;
  xpReward?: number;
  coinReward?: number;
  missionId: number;
  myAttempt: any;
  style?: React.CSSProperties;
}) {
  const linkRole = useRoleColor('link', { fallback: 'logoBlue' });
  const successRole = useRoleColor('success', { fallback: 'green' });
  const xpNumberRole = useRoleColor('xpNumber', { fallback: 'logoGreen' });
  const linkColor = useMemo(
    () => linkRole.getColor() || Color.logoBlue(),
    [linkRole]
  );
  const successColor = useMemo(
    () => successRole.getColor() || Color.green(),
    [successRole]
  );
  const xpNumberColor = useMemo(
    () => xpNumberRole.getColor() || Color.logoGreen(),
    [xpNumberRole]
  );
  const onUpdateMissionAttempt = useMissionContext(
    (v) => v.actions.onUpdateMissionAttempt
  );
  const rewardDetails = useMemo(() => {
    return (xpReward || coinReward) && myAttempt.status === 'pass' ? (
      <div
        style={{
          marginTop: '0.5rem',
          color: Color.black()
        }}
      >
        You were rewarded{' '}
        {xpReward ? (
          <span style={{ color: xpNumberColor, fontWeight: 'bold' }}>
            {addCommasToNumber(xpReward)}{' '}
            <span style={{ color: Color.gold(), fontWeight: 'bold' }}>XP</span>
          </span>
        ) : null}
        {xpReward && coinReward ? <> and </> : null}
        {coinReward ? (
          <>
            <Icon
              style={{ color: Color.brownOrange(), fontWeight: 'bold' }}
              icon={['far', 'badge-dollar']}
            />{' '}
            <span style={{ color: Color.brownOrange(), fontWeight: 'bold' }}>
              {coinReward}
            </span>
          </>
        ) : null}
      </div>
    ) : null;
  }, [coinReward, myAttempt.status, xpNumberColor, xpReward]);

  return (
    <div
      style={{
        width: '100%',
        fontSize: '1.7rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        lineHeight: 2,
        ...style
      }}
    >
      <div
        style={{
          ...(myAttempt.status === 'pass' || myAttempt.status === 'fail'
            ? {
                borderRadius,
                boxShadow: `0 0 2px ${
                  myAttempt.status === 'pass' ? Color.brown() : Color.black()
                }`,
                padding: '0.5rem 2rem'
              }
            : {}),
          fontWeight: 'bold',
          fontSize: '2rem',
          background:
            myAttempt.status === 'pass'
              ? Color.brownOrange()
              : myAttempt.status === 'fail'
              ? Color.black()
              : '',
          color: '#fff'
        }}
      >
        {myAttempt.status === 'pass'
          ? isTask
            ? 'Task Complete'
            : 'Mission Accomplished'
          : 'Mission Failed...'}
      </div>
      {rewardDetails}
      {myAttempt.filePath && (
        <FileViewer
          style={{ marginTop: '2rem' }}
          thumbUrl={myAttempt.thumbUrl}
          src={myAttempt.filePath}
        />
      )}
      {myAttempt.content && myAttempt.status === 'fail' && (
        <RichText style={{ marginTop: '3rem' }}>{myAttempt.content}</RichText>
      )}
      {myAttempt.reviewer && (
        <div
          style={{
            width: '100%',
            marginTop: '2.5rem',
            padding: '1rem',
            border: `1px solid ${Color.borderGray()}`,
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
      {myAttempt.status === 'fail' && (
        <div style={{ marginTop: '3rem' }}>
          <Button
            style={{ fontSize: '2.5rem' }}
            color={successColor}
            onClick={() =>
              onUpdateMissionAttempt({
                missionId,
                newState: { tryingAgain: true }
              })
            }
            filled
          >
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
