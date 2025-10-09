import React, { useContext, useCallback, useMemo, useRef } from 'react';
import { Color, desktopMinWidth, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { addCommasToNumber, stringIsEmpty } from '~/helpers/stringHelpers';
import { useAppContext, useKeyContext, useChatContext } from '~/contexts';
import { VOCAB_CHAT_TYPE, AI_CARD_CHAT_TYPE } from '~/constants/defaultValues';
import { useNavigate } from 'react-router-dom';
import LocalContext from '../../Context';
import localize from '~/constants/localize';
import ErrorBoundary from '~/components/ErrorBoundary';

const deletedLabel = localize('deleted');

export default function Channel({
  customChannelNames,
  currentPathId,
  channel: {
    id: channelId,
    channelName,
    messageIds = [],
    messagesObj = {},
    twoPeople,
    members,
    numUnreads,
    pathId,
    subchannelObj = {}
  },
  channel,
  chatType,
  selectedChannelId
}: {
  customChannelNames: {
    [key: number]: string;
  };
  currentPathId?: string | number;
  channel: {
    id: number;
    channelName?: string;
    messageIds?: number[];
    messagesObj?: {
      [key: number]: {
        id: number;
        [key: string]: any;
      };
    };
    twoPeople?: boolean;
    members?: { id: number; username: string }[];
    numUnreads?: number;
    pathId?: number;
    subchannelObj?: object;
  };
  chatType?: string;
  selectedChannelId?: number;
}) {
  const ChannelRef = useRef(channel);
  const {
    state: { lastSubchannelPaths }
  } = useContext(LocalContext);
  const reportError = useAppContext((v) => v.requestHelpers.reportError);
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
  const chatUnreadColor = useKeyContext((v) => v.theme.chatUnread.color);
  const onUpdateSelectedChannelId = useChatContext(
    (v) => v.actions.onUpdateSelectedChannelId
  );
  const generalChatColor = useKeyContext((v) => v.theme.generalChat.color);
  const effectiveChannelName = useMemo(
    () => customChannelNames[channelId] || channelName,
    [channelName, customChannelNames, channelId]
  );
  const pathIdMatches = useMemo(
    () => Number(pathId) === Number(currentPathId),
    [currentPathId, pathId]
  );
  const selected = useMemo(() => {
    if (
      currentPathId === VOCAB_CHAT_TYPE ||
      chatType === VOCAB_CHAT_TYPE ||
      currentPathId === AI_CARD_CHAT_TYPE ||
      chatType === AI_CARD_CHAT_TYPE
    ) {
      return false;
    }
    if (pathIdMatches || channelId === selectedChannelId) {
      return true;
    }
    return false;
  }, [currentPathId, chatType, pathIdMatches, channelId, selectedChannelId]);
  const lastMessage: {
    [key: string]: any;
  } = useMemo(() => {
    const lastMessageId = messageIds?.[0];
    let mostRecentMessage = messagesObj?.[lastMessageId];
    if (Object.values(subchannelObj).length > 0) {
      let mostRecentSubchannelMessageId = 0;
      for (const subchannel of Object.values(subchannelObj)) {
        if (
          subchannel?.messageIds?.[0] &&
          Number(subchannel?.messageIds?.[0]) >
            Number(mostRecentSubchannelMessageId)
        ) {
          mostRecentSubchannelMessageId = Number(subchannel?.messageIds?.[0]);
          if (mostRecentSubchannelMessageId > lastMessageId) {
            mostRecentMessage =
              subchannel?.messagesObj?.[mostRecentSubchannelMessageId];
          }
        }
      }
    }
    return mostRecentMessage;
  }, [messageIds, messagesObj, subchannelObj]);

  const otherMember = useMemo(() => {
    return twoPeople
      ? members
          ?.filter(({ id: memberId }) => memberId !== userId)
          ?.map(({ username }) => username)?.[0]
      : undefined;
  }, [members, twoPeople, userId]);

  const PreviewMessage = useMemo(() => {
    return renderPreviewMessage(lastMessage || {});
    function renderPreviewMessage({
      content,
      fileName,
      gameWinnerId,
      userId: senderId,
      username: senderName,
      isAbort,
      isDraw,
      rewardAmount,
      rootType,
      targetMessage,
      transferId,
      transactionId,
      notificationType,
      newOwner
    }: {
      content?: string;
      fileName?: string;
      gameWinnerId?: number;
      userId?: number;
      username?: string;
      isAbort?: boolean;
      isDraw?: boolean;
      rewardAmount?: number;
      rootType?: string;
      targetMessage?: {
        username: string;
      };
      transferId?: number;
      transactionId?: number;
      notificationType?: string;
      newOwner?: {
        username: string;
      };
    }) {
      const messageSender = senderId
        ? senderId === userId
          ? localize('You')
          : senderName
        : '';
      if (rewardAmount) {
        return (
          <span>
            {messageSender}: rewarded {targetMessage?.username}{' '}
            {addCommasToNumber(rewardAmount)} XP
          </span>
        );
      }
      if (fileName && stringIsEmpty(content)) {
        return (
          <span>
            {messageSender}: {`"${fileName}"`}
          </span>
        );
      }
      const isOmokGame = /omok match/i.test(content || '');
      if (isAbort) {
        return <span>{isOmokGame ? 'omok match was aborted' : 'chess match was aborted'}</span>;
      }
      if (isDraw) {
        return <span>{isOmokGame ? 'omok match ended in a draw' : 'chess match ended in a draw'}</span>;
      }
      if (typeof gameWinnerId === 'number') {
        if (gameWinnerId === 0) {
          return (
            <span>
              {isOmokGame
                ? 'The omok match ended in a draw'
                : 'The chess match ended in a draw'}
            </span>
          );
        }
        return gameWinnerId === userId ? (
          <span>{isOmokGame ? 'You won the omok match!' : 'You won the chess match!'}</span>
        ) : (
          <span>{isOmokGame ? 'You lost the omok match' : 'You lost the chess match'}</span>
        );
      }
      if (transferId) {
        return <span>new transfer notification</span>;
      }
      if (rootType === 'approval') {
        return <span>{messageSender}: requested approval</span>;
      }
      if (transactionId) {
        return (
          <span>
            {content
              ? `${messageSender}: ${content.slice(0, 100)}`
              : 'Trade notification'}
          </span>
        );
      }
      if (notificationType === 'owner_change' && newOwner) {
        return (
          <span>
            transferred ownership of this channel to {newOwner.username}
          </span>
        );
      }
      if (messageSender && content) {
        const truncatedContent =
          content.startsWith('/spoiler ') || content.startsWith('/secret ')
            ? 'Secret Message'
            : content.slice(0, 100);
        return <span>{`${messageSender}: ${truncatedContent}`}</span>;
      }
      return <span>{'\u00a0'}</span>;
    }
  }, [lastMessage, userId]);

  const totalNumUnreads = useMemo(() => {
    let result = Number(numUnreads);
    for (const subchannel of Object.values(subchannelObj)) {
      result += Number(subchannel.numUnreads || 0);
    }
    return result;
  }, [numUnreads, subchannelObj]);

  const ChannelName = useMemo(() => {
    const result = otherMember || effectiveChannelName;
    if (!result) {
      if (process.env.NODE_ENV === 'development') return `(${deletedLabel})`;
      reportError({
        componentPath: 'Chat/LeftMenu/Channel',
        message: `Channel name was rendered as "Deleted." Channel data is as follows: ${JSON.stringify(
          ChannelRef.current
        )}`
      });
    }
    return result || `(${deletedLabel})`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveChannelName, otherMember]);

  const lastSubchannelPath = useMemo(
    () => lastSubchannelPaths[channelId],
    [channelId, lastSubchannelPaths]
  );

  const handleChannelClick = useCallback(async () => {
    if (pathIdMatches && !chatType) return;
    if (pathId) {
      onUpdateSelectedChannelId(channelId);
      return navigate(
        `/chat/${pathId}${lastSubchannelPath ? `/${lastSubchannelPath}` : ''}`
      );
    }
    navigate('/chat/new');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pathIdMatches,
    chatType,
    pathId,
    navigate,
    channelId,
    lastSubchannelPath
  ]);

  const lastSenderId = useMemo(
    () => (lastMessage as any)?.sender?.id ?? (lastMessage as any)?.userId,
    [lastMessage]
  );

  const badgeShown = useMemo(() => {
    return (
      channelId !== selectedChannelId && totalNumUnreads > 0 && lastSenderId !== userId
    );
  }, [channelId, lastSenderId, totalNumUnreads, selectedChannelId, userId]);

  return (
    <ErrorBoundary componentPath="Chat/LeftMenu/Channels/Channel">
      <div
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
              width: badgeShown ? 'calc(100% - 3rem)' : '100%',
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
                      : !effectiveChannelName && !otherMember
                      ? Color.lighterGray()
                      : undefined,
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
                background: Color[chatUnreadColor]?.(),
                display: 'flex',
                color: '#fff',
                fontWeight: 'bold',
                minWidth: '1.3rem',
                height: '1.3rem',
                borderRadius: '50%',
                lineHeight: 1,
                justifyContent: 'center',
                alignItems: 'center'
              }}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
