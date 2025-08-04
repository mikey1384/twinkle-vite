import React from 'react';
import { Color, borderRadius } from '~/constants/css';

export default function PendingStatus({
  style
}: {
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center'
      }}
    >
      <div
        style={{
          padding: '1rem',
          border: `1px solid ${Color.borderGray()}`,
          borderRadius,
          background: Color.ivory(),
          fontSize: '1.7rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          lineHeight: 2,
          ...style
        }}
      >
        <div>Your attempt has been successfully submitted!</div>
        <div>{`Please wait until it's reviewed by the administrator.`}</div>
        <div>This may take a couple of days.</div>
      </div>
    </div>
  );
}
