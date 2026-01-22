import React, { useMemo } from 'react';
import CurrentMission from './CurrentMission';
import MissionList from './MissionList';
import Loading from '~/components/Loading';
import RepeatableMissions from './RepeatableMissions';
import { mobileMaxWidth, tabletMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function Main({
  className,
  currentMissionId,
  isAdmin,
  loading,
  missions,
  missionObj,
  myAttempts,
  userId
}: {
  className?: string;
  currentMissionId: number;
  isAdmin: boolean;
  loading: boolean;
  missions: any[];
  missionObj: any;
  myAttempts: any;
  userId: number;
}) {
  const width = useMemo(
    () => (isAdmin ? '100%' : 'CALC(100% - 5rem)'),
    [isAdmin]
  );
  const marginLeft = useMemo(() => (isAdmin ? '3rem' : '5rem'), [isAdmin]);
  const repeatableMissions: { id: number; missionType: string }[] =
    useMemo(() => {
      if (!userId) return [];
      return missions.reduce(
        (prev: { id: number; missionType: string }[], currMissionId: number) => {
          const mission = missionObj[currMissionId];
          if (mission?.repeatable && myAttempts[mission.id]?.status === 'pass') {
            return prev.concat(mission);
          }
          return prev;
        },
        []
      );
    }, [userId, missionObj, missions, myAttempts]);
  const hasCurrentMission = !!missionObj[currentMissionId];
  const hasRightColumn = hasCurrentMission || repeatableMissions.length > 0;
  if (missions.length === 0 && loading) {
    return <Loading />;
  }
  return missions.length > 0 ? (
    <div className={className}>
      <div
        className={css`
          width: ${width};
          margin-left: ${marginLeft};
          display: flex;
          @media (max-width: ${tabletMaxWidth}) {
            width: CALC(100% - 2rem);
            margin-top: 1.5rem;
            margin-left: 1rem;
            flex-direction: column;
          }
        `}
      >
        <MissionList
          missions={missions}
          missionObj={missionObj}
          className={css`
            width: CALC(${hasRightColumn ? '65%' : '80%'} - 5rem);
            @media (max-width: ${tabletMaxWidth}) {
              width: 100%;
            }
          `}
        />
        {hasRightColumn && (
          <div
            className={css`
              width: CALC(35% - 5rem);
              margin-left: 5rem;
              @media (max-width: ${tabletMaxWidth}) {
                margin-left: 0;
                margin-top: 3rem;
                width: 100%;
              }
            `}
          >
            {hasCurrentMission && (
              <CurrentMission
                missionId={currentMissionId}
                style={{ width: '100%' }}
              />
            )}
            {repeatableMissions.length > 0 && (
              <RepeatableMissions
                className={css`
                  margin-top: ${hasCurrentMission ? '2rem' : 0};
                  @media (max-width: ${mobileMaxWidth}) {
                    margin-top: ${hasCurrentMission ? '1.5rem' : 0};
                  }
                `}
                repeatableMissions={repeatableMissions}
              />
            )}
          </div>
        )}
        <div className="mobile" style={{ height: '7rem', width: '100%' }} />
      </div>
    </div>
  ) : null;
}
