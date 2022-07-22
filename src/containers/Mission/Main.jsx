import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import CurrentMission from './CurrentMission';
import MissionList from './MissionList';
import Loading from '~/components/Loading';
import RepeatableMissions from './RepeatableMissions';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

Main.propTypes = {
  className: PropTypes.string,
  currentMissionId: PropTypes.number,
  isCreator: PropTypes.bool,
  loading: PropTypes.bool,
  missions: PropTypes.array,
  missionObj: PropTypes.object,
  myAttempts: PropTypes.object,
  userId: PropTypes.number
};

export default function Main({
  className,
  currentMissionId,
  isCreator,
  loading,
  missions,
  missionObj,
  myAttempts,
  userId
}) {
  const width = useMemo(
    () => (isCreator ? '100%' : 'CALC(100% - 5rem)'),
    [isCreator]
  );
  const marginLeft = useMemo(() => (isCreator ? '3rem' : '5rem'), [isCreator]);
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
          @media (max-width: ${mobileMaxWidth}) {
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
            @media (max-width: ${mobileMaxWidth}) {
              width: 100%;
            }
          `}
        />
        {missionObj[currentMissionId] && (
          <div
            className={css`
              width: CALC(35% - 5rem);
              margin-left: 5rem;
              @media (max-width: ${mobileMaxWidth}) {
                margin-left: 0;
                margin-top: 3rem;
                width: 100%;
              }
            `}
          >
            <CurrentMission
              mission={missionObj[currentMissionId]}
              missionId={currentMissionId}
              style={{ width: '100%' }}
            />
            {userId && (
              <RepeatableMissions
                className={css`
                  margin-top: 2rem;
                  @media (max-width: ${mobileMaxWidth}) {
                    margin-top: 0;
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
