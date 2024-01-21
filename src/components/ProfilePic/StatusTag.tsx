import React from 'react';
import { borderRadius, innerBorderRadius, Color } from '~/constants/css';
import { css } from '@emotion/css';
import { isPhone } from '~/helpers';

const deviceIsPhone = isPhone(navigator);

export default function StatusTag({
  isProfilePage,
  large,
  status = 'online'
}: {
  isProfilePage?: boolean;
  large?: boolean;
  status?: 'online' | 'busy' | 'away';
}) {
  const backgroundColor = {
    online: Color.green(),
    busy: Color.red(),
    away: Color.orange()
  };

  return !(deviceIsPhone && isProfilePage) && large ? (
    <div
      className={css`
        top: 74%;
        left: 70%;
        background: #fff;
        position: absolute;
        border: 3px solid #fff;
        border-radius: ${borderRadius};
      `}
    >
      <div
        className={css`
          background: ${backgroundColor[status]};
          color: #fff;
          padding: 0.3rem;
          min-width: 5rem;
          font-size: 1.4rem;
          text-align: center;
          border-radius: ${innerBorderRadius};
          font-weight: bold;
        `}
      >
        <span>{status}</span>
      </div>
    </div>
  ) : (
    <div
      style={{
        top: '70%',
        left: '67%',
        background: '#fff',
        position: 'absolute',
        border: `${large ? '3px' : '2px'} solid #fff`,
        borderRadius: '47%'
      }}
    >
      <div
        style={{
          background: backgroundColor[status],
          padding: '0.3rem',
          width: large ? '1.5rem' : '1rem',
          height: large ? '1.5rem' : '1rem',
          textAlign: 'center',
          borderRadius: '50%'
        }}
      />
    </div>
  );
}
