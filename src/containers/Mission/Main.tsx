import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import CurrentMission from './CurrentMission';
import MissionList from './MissionList';
import Loading from '~/components/Loading';
import RepeatableMissions from './RepeatableMissions';
import { mobileMaxWidth, tabletMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

Main.propTypes = {
  className: PropTypes.string,
  currentMissionId: PropTypes.number,
  isAdmin: PropTypes.bool,
  loading: PropTypes.bool,
  missions: PropTypes.array,
  missionObj: PropTypes.object,
  myAttempts: PropTypes.object,
  userId: PropTypes.number
};
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
            width: CALC(${missionObj[currentMissionId] ? '65%' : '80%'} - 5rem);
            @media (max-width: ${tabletMaxWidth}) {
              width: 100%;
            }
          `}
        />
        {missionObj[currentMissionId] && (
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
            <CurrentMission
              missionId={currentMissionId}
              style={{ width: '100%' }}
            />
            {userId && (
              <RepeatableMissions
                className={css`
                  margin-top: 2rem;
                  @media (max-width: ${mobileMaxWidth}) {
                    margin-top: 1.5rem;
                  }
                `}
                myAttempts={myAttempts}
                missions={missions}
                missionObj={missionObj}
              />
            )}
          </div>
        )}
        <div className="mobile" style={{ height: '7rem', width: '100%' }} />
      </div>
    </div>
  ) : null;
}
