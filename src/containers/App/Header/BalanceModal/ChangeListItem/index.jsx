import { useMemo } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import ActionBlock from './ActionBlock';

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
      <ActionBlock
        style={{ marginLeft: '2rem' }}
        action={change.action}
        target={change.target}
      />
      <div
        style={{
          marginLeft: '2rem',
          fontFamily: 'monospace',
          color: change.type === 'increase' ? Color.green() : Color.red()
        }}
      >
        {change.type === 'increase' ? '+' : '-'}
        {change.amount}
      </div>
    </nav>
  );
}
