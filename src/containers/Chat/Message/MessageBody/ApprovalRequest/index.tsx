import React, { useEffect, useState } from 'react';
import Container from './Container';
import Loading from '~/components/Loading';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { borderRadius, Color } from '~/constants/css';
import { socket } from '~/constants/sockets/api';
import { useReplyCardPresentation } from '../ReplyCardPresentation';

export default function ApprovalRequest({
  channelId,
  cardSettings,
  displayedThemeColor,
  messageId,
  requestId,
  userId,
  username
}: {
  channelId: number;
  cardSettings?: Record<string, any>;
  displayedThemeColor: string;
  messageId: number;
  requestId: number;
  userId: number;
  username: string;
}) {
  const inReply = useReplyCardPresentation();
  const myId = useKeyContext((v) => v.myState.userId);
  const loadApprovalItemById = useAppContext(
    (v) => v.requestHelpers.loadApprovalItemById
  );
  const onUpdateMessageSettings = useChatContext(
    (v) => v.actions.onUpdateMessageSettings
  );
  const [type, setType] = useState('');
  const [content, setContent] = useState(null);
  const [status, setStatus] = useState('');
  const [unavailable, setUnavailable] = useState(false);
  const confirmedStatus = typeof cardSettings?.approvalCardStatus === 'string'
    ? cardSettings.approvalCardStatus
    : '';

  useEffect(() => {
    if (typeof confirmedStatus === 'string' && confirmedStatus) {
      setStatus(confirmedStatus);
    }
  }, [confirmedStatus]);

  useEffect(() => {
    init();
    async function init() {
      try {
        const requestItem = await loadApprovalItemById(requestId);
        setType(requestItem.type);
        setContent(requestItem.content);
        setStatus(requestItem.status);
      } catch (error) {
        // Not visible to this viewer (or gone): render nothing rather than an
        // endless spinner.
        console.error(error);
        setUnavailable(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  useEffect(() => {
    socket.on('approval_result_received', handleApprovalResultReceived);

    function handleApprovalResultReceived({
      type: resultType,
      status: resultStatus
    }: {
      type: string;
      status: string;
    }) {
      // This notification is sent only to the requester. Another person's
      // approval card can be visible in the same chat at the same time.
      if (Number(userId) === Number(myId) &&
          (resultType === 'dob' || resultType === 'mentor') && resultType === type) {
        handleConfirmedStatus(resultStatus);
      }
    }

    return function cleanUp() {
      socket.off('approval_result_received', handleApprovalResultReceived);
    };
  });

  if (unavailable) return null;

  return (
    <div
      style={{
        width: '100%',
        padding: inReply ? 0 : '1rem',
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
          status={confirmedStatus || status}
          type={type}
          onSetStatus={handleConfirmedStatus}
        />
      ) : (
        <Loading />
      )}
    </div>
  );

  function handleConfirmedStatus(nextStatus: string) {
    setStatus(nextStatus);
    if (channelId && messageId) {
      onUpdateMessageSettings({
        channelId,
        messageId,
        settings: { approvalCardStatus: nextStatus }
      });
    }
  }
}
