import PropTypes from 'prop-types';
import { mobileMaxWidth } from '~/constants/css';
import { cloudFrontURL } from '~/constants/defaultValues';
import { css } from '@emotion/css';

Activity.propTypes = {
  activity: PropTypes.object.isRequired
};

export default function Activity({ activity }) {
  return (
    <div
      style={{
        width: '100%',
        padding: '1rem',
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column'
      }}
    >
      <div>
        <img
          className={css`
            height: 50vh;
            @media (max-width: ${mobileMaxWidth}) {
              height: 30vh;
            }
          `}
          src={`${cloudFrontURL}${activity.images[0]}`}
        />
      </div>
      <div style={{ padding: '1rem' }}>
        <div>{activity.prompt}</div>
      </div>
    </div>
  );
}
