import { useRef } from 'react';
import PropTypes from 'prop-types';
import Link from '~/components/Link';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

MissionItem.propTypes = {
  missionName: PropTypes.string,
  missionType: PropTypes.string,
  style: PropTypes.object
};

export default function MissionItem({ missionName, missionType, style }) {
  const NameRef = useRef(null);
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
          paddingLeft: '0.5rem',
          paddingRight: '0.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%'
        }}
      >
        <Link
          innerRef={NameRef}
          to={`/missions/${missionType}`}
          style={{
            width: '100%',
            textAlign: 'center',
            fontSize: '1.2rem',
            fontWeight: 'bold'
          }}
        >
          {missionName}
        </Link>
      </div>
    </div>
  );
}
