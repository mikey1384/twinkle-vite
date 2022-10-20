import PropTypes from 'prop-types';
import Link from '~/components/Link';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

MissionItem.propTypes = {
  missionName: PropTypes.string,
  missionType: PropTypes.string,
  xpReward: PropTypes.number,
  coinReward: PropTypes.number,
  style: PropTypes.object
};

export default function MissionItem({
  missionName,
  missionType,
  xpReward,
  coinReward,
  style
}) {
  return (
    <div
      style={style}
      className={css`
        display: flex;
        flex-direction: column;
        @media (max-width: ${mobileMaxWidth}) {
          width: 12rem;
          height: 12rem;
        }
      `}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%'
        }}
      >
        Your next mission:
        <Link
          to={`/missions/${missionType}`}
          style={{
            width: '100%',
            textAlign: 'center',
            fontSize: '1.2rem',
            fontWeight: 'bold'
          }}
        >
          {missionName} {xpReward} {coinReward}
        </Link>
      </div>
    </div>
  );
}
