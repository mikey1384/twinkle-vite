import { useMemo } from 'react';
import PropTypes from 'prop-types';
import MissionItem from '~/components/MissionItem';
import { css } from '@emotion/css';
import { useMissionContext } from '~/contexts';
import localize from '~/constants/localize';

CurrentMission.propTypes = {
  style: PropTypes.object,
  missionId: PropTypes.number
};

const currentMissionLabel = localize('currentMission');

export default function CurrentMission({ style, missionId }) {
  const missionObj = useMissionContext((v) => v.state.missionObj);
  const mission = useMemo(
    () => missionObj[missionId] || {},
    [missionId, missionObj]
  );

  return (
    <div style={style} className="desktop">
      <p
        className={css`
          font-size: 2.5rem;
          font-weight: bold;
        `}
      >
        {currentMissionLabel}
      </p>
      <MissionItem
        showStatus={false}
        style={{ marginTop: '1rem' }}
        mission={mission}
        missionLink={`/missions/${mission.missionType}`}
      />
    </div>
  );
}
