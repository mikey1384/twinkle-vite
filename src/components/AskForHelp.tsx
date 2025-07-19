import React from 'react';
import { useKeyContext } from '~/contexts';

export default function AskForHelp() {
  const userId = useKeyContext((v) => v.myState.userId);
  return (
    <div style={{ fontSize: '1.7rem' }}>
      <span>{`We need your email address in order for us to make sure you are the owner of this account. `}</span>{' '}
      Ask your Twinkle teacher for help. If you no longer attend Twinkle,{' '}
      {userId ? (
        <>
          <b>send a chat message to mikey</b> or email him at{' '}
          <b>mikey@twin-kle.com</b> for help
        </>
      ) : (
        <>
          send an email to mikey at <b>mikey@twin-kle.com</b> for help
        </>
      )}
    </div>
  );
}
