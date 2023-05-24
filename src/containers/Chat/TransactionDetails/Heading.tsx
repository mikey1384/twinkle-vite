import React, { useMemo } from 'react';
import moment from 'moment';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function Heading({
  isCurrent,
  color,
  children,
  timeStamp
}: {
  isCurrent: boolean;
  color: string;
  children: any;
  timeStamp: number;
}) {
  const displayedTimeStamp = useMemo(
    () => moment.unix(timeStamp).format('lll'),
    [timeStamp]
  );
  return (
    <div
      className={css`
        font-size: 2rem;
        padding: 2rem;
        @media (max-width: ${mobileMaxWidth}) {
          font-size: 1.7rem;
          padding: 1.5rem;
        }
      `}
      style={{
        marginTop: '1rem',
        marginBottom: '0.5rem',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        fontFamily: 'Roboto, monospace',
        fontWeight: 'bold',
        backgroundColor: Color[color](isCurrent ? 1 : 0.7),
        color: '#fff',
        position: 'relative'
      }}
    >
      {children}
      <div
        className={css`
          position: absolute;
          top: 0.3rem;
          right: 0.5rem;
          font-family: Roboto, sans-serif;
          font-size: 1.2rem;
          font-weight: normal;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 0.8rem;
          }
        `}
      >
        {displayedTimeStamp}
      </div>
    </div>
  );
}
