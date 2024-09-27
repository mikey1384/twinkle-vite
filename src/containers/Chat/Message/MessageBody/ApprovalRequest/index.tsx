import React, { useEffect, useState } from 'react';
import Container from './Container';
import Loading from '~/components/Loading';
import { useAppContext, useKeyContext } from '~/contexts';
import { borderRadius, Color } from '~/constants/css';
import { socket } from '~/constants/sockets/api';

export default function ApprovalRequest({
  displayedThemeColor,
  messageId,
  requestId,
  userId,
  username
}: {
  displayedThemeColor: string;
  messageId: number;
  requestId: number;
  userId: number;
  username: string;
}) {
  const { userId: myId } = useKeyContext((v) => v.myState);
  const loadApprovalItemById = useAppContext(
    (v) => v.requestHelpers.loadApprovalItemById
  );
  const [type, setType] = useState('');
  const [content, setContent] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    init();
    async function init() {
      const requestItem = await loadApprovalItemById(requestId);
      setType(requestItem.type);
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
      if (type === 'dob' || type === 'mentor') {
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
        <Container
          content={content}
          displayedThemeColor={displayedThemeColor}
          messageId={messageId}
          myId={myId}
          userId={userId}
          username={username}
          status={status}
          type={type}
          onSetStatus={setStatus}
        />
      ) : (
        <Loading />
      )}
    </div>
  );
}
