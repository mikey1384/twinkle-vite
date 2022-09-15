import { memo, useMemo, useState } from 'react';
import { useInterval } from '~/helpers/hooks';
import PropTypes from 'prop-types';
import UsernameText from '~/components/Texts/UsernameText';
import Button from '~/components/Button';
import RoundList from '~/components/RoundList';
import Icon from '~/components/Icon';
import { timeSince } from '~/helpers/timeStampHelpers';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import { useChatContext } from '~/contexts';
import {
  GENERAL_CHAT_ID,
  GENERAL_CHAT_PATH_ID
} from '~/constants/defaultValues';
import localize from '~/constants/localize';

const joinConversationLabel = localize('joinConversation');
const broughtBackByLabel = localize('broughtBackBy');
const startedByLabel = localize('startedBy');

ChatFeeds.propTypes = {
  content: PropTypes.string,
  myId: PropTypes.number,
  reloadedBy: PropTypes.number,
  reloaderName: PropTypes.string,
  reloadTimeStamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  style: PropTypes.object,
  timeStamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  userId: PropTypes.number,
  username: PropTypes.string
};

function ChatFeeds({
  content,
  myId,
  reloadedBy,
  reloaderName,
  reloadTimeStamp,
  style = {},
  timeStamp,
  userId,
  username
}) {
  const onUpdateSelectedChannelId = useChatContext(
    (v) => v.actions.onUpdateSelectedChannelId
  );
  const [loadingChat, setLoadingChat] = useState(false);
  const navigate = useNavigate();
  const [timeSincePost, setTimeSincePost] = useState(timeSince(timeStamp));
  const [timeSinceReload, setTimeSinceReload] = useState(
    timeSince(reloadTimeStamp)
  );
  useInterval(() => {
    setTimeSincePost(timeSince(timeStamp));
    setTimeSinceReload(timeSince(reloadTimeStamp));
  }, 1000);
  const Details = useMemo(() => {
    const posterString = (
      <div style={{ width: '100%' }}>
        {startedByLabel} <UsernameText user={{ id: userId, username }} />
        {timeStamp ? ` ${timeSincePost}` : ''}
      </div>
    );
    const reloaderString = (
      <div style={{ marginTop: '0.5rem' }}>
        {broughtBackByLabel}{' '}
        <UsernameText user={{ id: reloadedBy, username: reloaderName }} />
        {reloadTimeStamp ? ` ${timeSinceReload}` : ''}
      </div>
    );

    return (
      <div style={{ margin: '0.5rem 0 1.5rem 0' }}>
        <div>{userId ? posterString : 'Join the conversation!'}</div>
        {reloadedBy && reloaderString}
      </div>
    );
  }, [
    reloadTimeStamp,
    reloadedBy,
    reloaderName,
    timeSincePost,
    timeSinceReload,
    timeStamp,
    userId,
    username
  ]);

  return (
    <RoundList
      style={{
        textAlign: 'center',
        marginTop: '0',
        ...style
      }}
    >
      <nav
        style={{
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word',
          wordBreak: 'break-word',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
        className={css`
          background: #fff;
          &:hover {
            transition: background 0.5s;
            background: ${Color.highlightGray()};
          }
        `}
      >
        <p
          style={{
            fontWeight: 'bold',
            fontSize: '2rem',
            color: Color.darkerGray()
          }}
        >
          {content}
        </p>
        <span style={{ color: Color.darkerGray() }}>{Details}</span>
        <Button
          disabled={loadingChat}
          skeuomorphic
          color="darkerGray"
          onClick={initChatFromThis}
        >
          <Icon icon="comments" />
          <span style={{ marginLeft: '1rem' }}>{joinConversationLabel}</span>
          {loadingChat && (
            <Icon style={{ marginLeft: '0.7rem' }} icon="spinner" pulse />
          )}
        </Button>
      </nav>
    </RoundList>
  );

  async function initChatFromThis() {
    if (myId) {
      setLoadingChat(true);
      return setTimeout(() => {
        onUpdateSelectedChannelId(GENERAL_CHAT_ID);
        navigate(`/chat/${GENERAL_CHAT_PATH_ID}`);
      }, 10);
    }
    navigate('/chat');
  }
}

export default memo(ChatFeeds);
