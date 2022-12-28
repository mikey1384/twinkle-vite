import { useMemo } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

ChangeListItem.propTypes = {
  change: PropTypes.object.isRequired
};

export default function ChangeListItem({ change }) {
  const displayedTimeStamp = useMemo(
    () => moment.unix(change.timeStamp).format('lll'),
    [change?.timeStamp]
  );

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <div
        className={css`
          font-size: 1.3rem;
          color: ${Color.darkGray()};
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.2rem;
          }
        `}
      >
        {displayedTimeStamp}
      </div>
      <div style={{ marginLeft: '2rem' }}>
        {change.action} {change.target}
      </div>
      <div style={{ marginLeft: '2rem' }}>
        {change.type}
        {change.amount}
      </div>
    </nav>
  );
}
