import React from 'react';
import Details from './Details';
import { useKeyContext } from '~/contexts';
import { borderRadius, Color } from '~/constants/css';

export default function ApprovalRequest({
  requestId,
  userId,
  username
}: {
  requestId: number;
  userId: number;
  username: string;
}) {
  const content = '1984-01-03';
  const { userId: myId } = useKeyContext((v) => v.myState);
  return (
    <div
      style={{
        width: '100%',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <div style={{ borderRadius, color: Color.darkGray() }}>
        {userId === myId ? 'requested approval' : 'requests your approval'}
      </div>
      <Details
        requestId={requestId}
        content={content}
        myId={myId}
        userId={userId}
        username={username}
      />
    </div>
  );
}
