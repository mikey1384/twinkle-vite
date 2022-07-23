import { useMemo } from 'react';
import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';

MessagesButton.propTypes = {
  commentsShown: PropTypes.bool,
  profileId: PropTypes.number.isRequired,
  myId: PropTypes.number,
  onMessagesButtonClick: PropTypes.func.isRequired,
  numMessages: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  style: PropTypes.object
};

export default function MessagesButton({
  commentsShown,
  profileId,
  myId,
  onMessagesButtonClick,
  numMessages,
  style
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
