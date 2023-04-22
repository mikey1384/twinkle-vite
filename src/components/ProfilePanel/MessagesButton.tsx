import React, { useMemo } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';

export default function MessagesButton({
  commentsShown,
  loading,
  profileId,
  myId,
  onMessagesButtonClick,
  numMessages,
  style
}: {
  commentsShown: boolean;
  loading: boolean;
  profileId: number;
  myId: number;
  onMessagesButtonClick: () => void;
  numMessages: number;
  style: React.CSSProperties;
}) {
  const leaveMessageLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return (
        <>
          메시지
          {profileId === myId ? '' : ' 남기기'}
        </>
      );
    }
    return (
      <>
        {profileId === myId ? '' : 'Leave '}
        Message
      </>
    );
  }, [profileId, myId]);

  return (
    <Button
      loading={loading}
      style={style}
      disabled={commentsShown && profileId === myId}
      color="logoBlue"
      onClick={onMessagesButtonClick}
    >
      <Icon icon="comment-alt" />
      <span style={{ marginLeft: '0.7rem' }}>
        {leaveMessageLabel}
        {profileId === myId && Number(numMessages) > 0 && !commentsShown
          ? `${numMessages > 1 ? 's' : ''}`
          : ''}
        {Number(numMessages) > 0 && !commentsShown ? ` (${numMessages})` : ''}
      </span>
    </Button>
  );
}
