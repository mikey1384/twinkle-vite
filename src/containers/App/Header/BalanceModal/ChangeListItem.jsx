import { useMemo } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

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
      <div>{displayedTimeStamp}</div>
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
