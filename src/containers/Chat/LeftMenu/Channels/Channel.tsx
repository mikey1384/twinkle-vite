import React, { useContext, memo, useCallback, useMemo, useRef } from 'react';
import { Color, desktopMinWidth, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { useAppContext, useKeyContext, useChatContext } from '~/contexts';
import { VOCAB_CHAT_TYPE, AI_CARD_CHAT_TYPE } from '~/constants/defaultValues';
import { useNavigate } from 'react-router-dom';
import LocalContext from '../../Context';
import localize from '~/constants/localize';
import ErrorBoundary from '~/components/ErrorBoundary';

const deletedLabel = localize('deleted');

function Channel({
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
  const { userId } = useKeyContext((v) => v.myState);
  const {
    chatUnread: { color: chatUnreadColor }
  } = useKeyContext((v) => v.theme);
  const onUpdateSelectedChannelId = useChatContext(
    (v) => v.actions.onUpdateSelectedChannelId
  );
  const {
    generalChat: { color: generalChatColor }
  } = useKeyContext((v) => v.theme);
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
      rootType,
      transferDetails,
      transactionDetails
    }: {
      content?: string;
      fileName?: string;
      gameWinnerId?: number;
      userId?: number;
      username?: string;
      isAbort?: boolean;
      isDraw?: boolean;
      rootType?: string;
      transferDetails?: {
        askId?: number;
        offerId?: number;
        from?: number;
        to?: number;
        card?: {
          id: number;
          name: string;
          image: string;
        };
      };
      transactionDetails?: {
        from?: number;
        to?: number;
        offer: {
          cards: {
            id: number;
            name: string;
            image: string;
          }[];
          coins?: number;
          id: number;
          name: string;
          image: string;
        };
        type?: string;
        card?: {
          id: number;
          name: string;
          image: string;
        };
      };
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
      if (isAbort) {
        return <span>chess match was aborted</span>;
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
      if (transferDetails) {
        const isPurchase = !!transferDetails.askId;
        const isSale = !!transferDetails.offerId;
        const buyer = transferDetails.to === userId ? 'You' : otherMember;
        const seller = transferDetails.from === userId ? 'You' : otherMember;
        if (isPurchase) {
          return (
            <span>{`${buyer}: bought Card #${transferDetails?.card?.id}`}</span>
          );
        }
        if (isSale) {
          return (
            <span>{`${seller}: sold Card #${transferDetails?.card?.id}`}</span>
          );
        }
      }
      if (rootType === 'approval') {
        return <span>{`${messageSender}:`} requested approval</span>;
      }
      if (transactionDetails) {
        const from = transactionDetails.from === userId ? 'You' : otherMember;
        const to = transactionDetails.to === userId ? 'you' : otherMember;
        let actionText = '';
        if (transactionDetails.type === 'trade') {
          const noCoinsOffered = !transactionDetails?.offer.coins;
          const noCardsOffered = !transactionDetails?.offer.cards?.length;
          if (noCoinsOffered && noCardsOffered) {
            const tos =
              transactionDetails.to === userId ? 'your' : `${otherMember}'s}`;
            actionText = `showed interest in ${tos} items`;
          } else {
            actionText = 'proposed a trade';
          }
        }
        if (transactionDetails.type === 'show') {
          actionText = `${
            transactionDetails.from === userId ? 'have' : 'has'
          } something to show`;
        }
        if (transactionDetails.type === 'send') {
          actionText = `sent ${to} something`;
        }
        return <span>{`${from}: ${actionText}`}</span>;
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
  }, [lastMessage, otherMember, userId]);

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

  const handleChannelClick = useCallback(() => {
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
    chatType,
    channelId,
    lastSubchannelPath,
    navigate,
    pathId,
    pathIdMatches
  ]);

  const badgeShown = useMemo(() => {
    return (
      channelId !== selectedChannelId &&
      totalNumUnreads > 0 &&
      lastMessage?.sender?.id !== userId
    );
  }, [
    channelId,
    lastMessage?.sender?.id,
    totalNumUnreads,
    selectedChannelId,
    userId
  ]);

  return (
    <ErrorBoundary componentPath="Chat/LeftMenu/Channels/Channel">
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

export default memo(Channel);
