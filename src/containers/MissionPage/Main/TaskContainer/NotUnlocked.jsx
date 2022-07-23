import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import GoBack from '~/components/GoBack';
import { css } from '@emotion/css';
import { borderRadius, Color } from '~/constants/css';

NotUnlocked.propTypes = {
  missionTitle: PropTypes.string.isRequired
};

export default function NotUnlocked({ missionTitle }) {
  return (
    <div>
      <div
        className={css`
          text-align: center;
          padding: 5rem 1rem;
          background: #fff;
          border: 1px solid ${Color.borderGray()};
          border-radius: ${borderRadius};
          font-size: 2rem;
          font-weight: bold;
        `}
      >
        <Icon icon="lock" />
        <span style={{ marginLeft: '2rem' }}>
          This task has not been unlocked, yet
        </span>
      </div>
      <GoBack
        isAtTop={false}
        style={{ marginTop: '5rem' }}
        bordered
        to=".."
        text={missionTitle}
      />
    </div>
  );
}
