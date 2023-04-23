import React, { useMemo } from 'react';
import moment from 'moment';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import ActionBlock from './ActionBlock';

export default function ChangeListItem({
  change,
  balance
}: {
  change: any;
  balance: number;
}) {
  const displayedTimeStamp = useMemo(
    () => moment.unix(change.timeStamp).format('lll'),
    [change?.timeStamp]
  );

  return (
    <nav
      style={{
        width: '100%',
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
        type={change.type}
        username={change.username}
      />
      <div
        style={{
          marginLeft: '2rem',
          fontFamily: 'monospace',
          color: change.type === 'increase' ? Color.green() : Color.red()
        }}
      >
        {change.type === 'increase' ? '+' : '-'}
        {addCommasToNumber(change.amount)}
      </div>
      <div
        style={{
          marginLeft: '2rem',
          fontFamily: 'monospace',
          color: Color.darkerGray(),
          fontWeight: 'bold'
        }}
      >
        {addCommasToNumber(balance)}
      </div>
    </nav>
  );
}
