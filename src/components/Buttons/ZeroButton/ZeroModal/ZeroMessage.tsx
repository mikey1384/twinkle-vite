import React from 'react';
import { ZERO_TWINKLE_ID } from '~/constants/defaultValues';
import ZeroPic from '~/components/ZeroPic';
import UsernameText from '~/components/Texts/UsernameText';
import { useKeyContext } from '~/contexts';

export default function ZeroMessage() {
  const { username } = useKeyContext((v) => v.myState);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column'
          }}
        >
          <div style={{ width: '7rem' }}>
            <ZeroPic />
          </div>
          <UsernameText
            style={{ fontSize: '1.7rem' }}
            user={{
              username: 'Zero',
              id: ZERO_TWINKLE_ID
            }}
          />
        </div>
        <div
          style={{
            marginLeft: '3rem',
            fontSize: '1.7rem',
            fontFamily: 'Roboto Mono, monospace'
          }}
        >
          Hello, {username}! How can I help you?
        </div>
      </div>
    </div>
  );
}
