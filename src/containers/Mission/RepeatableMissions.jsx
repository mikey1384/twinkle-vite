import { useMemo } from 'react';
import PropTypes from 'prop-types';
import MissionItem from '~/components/MissionItem';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import { css } from '@emotion/css';

RepeatableMissions.propTypes = {
  missions: PropTypes.array.isRequired,
  missionObj: PropTypes.object.isRequired,
  className: PropTypes.string,
  myAttempts: PropTypes.object.isRequired,
  style: PropTypes.object
};

export default function RepeatableMissions({
  className,
  missions,
  missionObj,
  myAttempts,
  style
}) {
  const repeatableMissions = useMemo(() => {
    return missions.reduce((prevMissions, currMissionId) => {
      const mission = missionObj[currMissionId];
      if (mission.repeatable && myAttempts[mission.id]?.status === 'pass') {
        return prevMissions.concat(mission);
      }
      return prevMissions;
    }, []);
  }, [missionObj, missions, myAttempts]);

  const repeatableMissionsLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return '반복 가능한 미션';
    }
    return `Repeatable Mission${repeatableMissions.length > 1 ? 's' : ''}`;
  }, [repeatableMissions.length]);

  return repeatableMissions.length > 0 ? (
    <div className={className} style={style}>
      <p
        className={css`
          font-size: 2.5rem;
          font-weight: bold;
        `}
      >
        {repeatableMissionsLabel}
      </p>
      <div>
        {repeatableMissions.map((mission) => (
          <MissionItem
            key={mission.id}
            isRepeatable
            style={{ marginTop: '1rem' }}
            mission={mission}
            missionLink={`/missions/${mission.missionType}`}
            showStatus={false}
          />
        ))}
      </div>
    </div>
  ) : null;
}
