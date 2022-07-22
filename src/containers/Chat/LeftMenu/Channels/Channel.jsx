import React, { memo, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Color, desktopMinWidth, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { useKeyContext } from '~/contexts';
import { useNavigate, useLocation } from 'react-router-dom';
import localize from '~/constants/localize';

const deletedLabel = localize('deleted');

Channel.propTypes = {
  channel: PropTypes.object.isRequired,
  chatType: PropTypes.string,
  customChannelNames: PropTypes.object.isRequired,
  selectedChannelId: PropTypes.number
};

function Channel({
  customChannelNames,
  channel: {
    id: channelId,
    channelName,
    messageIds = [],
    messagesObj = {},
    twoPeople,
    members,
    numUnreads,
    pathId
  },
  chatType,
  selectedChannelId
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPathId = useMemo(() => {
    return Number(location.pathname.split('chat/')[1]);
  }, [location.pathname]);
  const { userId } = useKeyContext((v) => v.myState);
  const {
    generalChat: { color: generalChatColor }
  } = useKeyContext((v) => v.theme);
  const effectiveChannelName = useMemo(
    () => customChannelNames[channelId] || channelName,
    [channelName, customChannelNames, channelId]
  );
  const pathIdMatches = useMemo(
    () => pathId === currentPathId,
    [currentPathId, pathId]
  );
  const selected = useMemo(() => {
    if (currentPathId === 'vocabulary' || chatType === 'vocabulary') {
      return false;
    }
    if (pathIdMatches || channelId === selectedChannelId) {
      return true;
    }
    return false;
  }, [currentPathId, chatType, pathIdMatches, channelId, selectedChannelId]);
  const lastMessage = useMemo(() => {
    const lastMessageId = messageIds[0];
    return messagesObj[lastMessageId];
  }, [messageIds, messagesObj]);
  const PreviewMessage = useMemo(() => {
    return renderPreviewMessage(lastMessage || {});
    function renderPreviewMessage({
      content,
      fileName,
      gameWinnerId,
      userId: senderId,
      username: senderName,
      isDraw
    }) {
      const messageSender = senderId
        ? senderId === userId
          ? localize('You')
          : senderName
        : '';
      if (fileName && stringIsEmpty(content)) {
        return (
          <span>
            {`${messageSender}:`} {`"${fileName}"`}
          </span>
        );
      }
      if (isDraw) {
        return <span>chess match ended in a draw</span>;
      }
      if (typeof gameWinnerId === 'number') {
        if (gameWinnerId === 0) {
          return <span>The chess match ended in a draw</span>;
        }
        return gameWinnerId === userId ? (
          <span>You won the chess match!</span>
        ) : (
          <span>You lost the chess match</span>
        );
      }
      if (messageSender && content) {
        const truncatedContent =
          content.startsWith('/spoiler ') || content.startsWith('/secret ')
            ? 'Secret Message'
            : content.substr(0, 100);
        return (
          <>
            <span>{`${messageSender}: `}</span>
            <span>{truncatedContent}</span>
          </>
        );
      }
      return '\u00a0';
    }
  }, [lastMessage, userId]);
  const otherMember = twoPeople
    ? members
        ?.filter(({ id: memberId }) => memberId !== userId)
        ?.map(({ username }) => username)?.[0]
    : undefined;

  const ChannelName = useMemo(
    () => otherMember || effectiveChannelName || `(${deletedLabel})`,
    [effectiveChannelName, otherMember]
  );

  const handleChannelClick = useCallback(() => {
    if (pathIdMatches) return;
    if (pathId) {
      return navigate(`/chat/${pathId}`);
    }
    navigate('/chat/new');
  }, [navigate, pathId, pathIdMatches]);

  const badgeShown = useMemo(() => {
    return (
      channelId !== selectedChannelId &&
      numUnreads > 0 &&
      lastMessage?.sender?.id !== userId
    );
  }, [
    channelId,
    lastMessage?.sender?.id,
    numUnreads,
    selectedChannelId,
    userId
  ]);

  const badgeWidth = useMemo(() => {
    const numDigits = numUnreads?.toString?.()?.length || 1;
    if (numDigits === 1) {
      return '2rem';
    }
    return `${Math.min(numDigits, 4)}.5rem`;
  }, [numUnreads]);

  return (
    <div
      key={channelId}
      className={css`
        @media (min-width: ${desktopMinWidth}) {
          &:hover {
            background: ${Color.checkboxAreaGray()};
          }
        }
      `}
      style={{
        width: '100%',
        cursor: 'pointer',
        padding: '1rem',
        height: '6.5rem',
        ...(selected ? { backgroundColor: Color.highlightGray() } : {})
      }}
      onClick={handleChannelClick}
    >
      <div
        style={{
          display: 'flex',
          height: '100%',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div
          style={{
            display: 'flex',
            width: badgeShown ? 'CALC(100% - 3rem)' : '100%',
            height: '100%',
            whiteSpace: 'nowrap',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <p
              style={{
                color:
                  channelId === 2
                    ? Color[generalChatColor]()
                    : !effectiveChannelName && !otherMember && '#7c7c7c',
                fontWeight: 'bold',
                margin: 0,
                padding: 0,
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                lineHeight: 'normal'
              }}
              className={css`
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1.5rem;
                }
              `}
            >
              {ChannelName}
            </p>
          </div>
          <div
            className={css`
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.3rem;
              }
            `}
            style={{
              width: '100%',
              textOverflow: 'ellipsis',
              overflow: 'hidden'
            }}
          >
            {PreviewMessage}
          </div>
        </div>
        {badgeShown && (
          <div
            style={{
              background: Color.rose(),
              display: 'flex',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '1.5rem',
              minWidth: badgeWidth,
              height: '2rem',
              borderRadius: '1rem',
              lineHeight: 1,
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            {numUnreads}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(Channel);
