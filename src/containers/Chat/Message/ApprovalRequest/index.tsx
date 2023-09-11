import React, { useEffect, useState } from 'react';
import Details from './Details';
import Loading from '~/components/Loading';
import { useAppContext, useKeyContext } from '~/contexts';
import { borderRadius, Color } from '~/constants/css';
import { socket } from '~/constants/io';

export default function ApprovalRequest({
  requestId,
  userId,
  username
}: {
  requestId: number;
  userId: number;
  username: string;
}) {
  const { userId: myId } = useKeyContext((v) => v.myState);
  const loadApprovalItemById = useAppContext(
    (v) => v.requestHelpers.loadApprovalItemById
  );
  const [content, setContent] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    init();
    async function init() {
      const requestItem = await loadApprovalItemById(requestId);
      setContent(requestItem.content);
      setStatus(requestItem.status);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  useEffect(() => {
    socket.on('approval_result_received', handleApprovalResultReceived);

    function handleApprovalResultReceived({
      type,
      status
    }: {
      type: string;
      status: string;
    }) {
      if (type === 'dob') {
        setStatus(status);
      }
    }

    return function cleanUp() {
      socket.removeListener(
        'approval_result_received',
        handleApprovalResultReceived
      );
    };
  });

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
      {content ? (
        <Details
          requestId={requestId}
          content={content}
          myId={myId}
          userId={userId}
          username={username}
          status={status}
          onSetStatus={setStatus}
        />
      ) : (
        <Loading />
      )}
    </div>
  );
}
