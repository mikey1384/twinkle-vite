import React, { memo, useContext, useMemo, useRef, useEffect } from 'react';
import ChatInfo from './ChatInfo';
import VocabInfo from './VocabInfo';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { AI_CARD_CHAT_TYPE, VOCAB_CHAT_TYPE } from '~/constants/defaultValues';
import LocalContext from '../Context';
import AICardInfo from './AICardInfo';

function RightMenu({
  channelName,
  channelOnCall,
  currentChannel,
  currentOnlineUsers,
  displayedThemeColor,
  isZeroChat,
  isCielChat,
  selectedChannelId,
  onScrollToBottom
}: {
  channelName: string;
  channelOnCall: any;
  currentChannel: any;
  currentOnlineUsers: any[];
  displayedThemeColor: string;
  isZeroChat: boolean;
  isCielChat: boolean;
  selectedChannelId: number;
  onScrollToBottom: () => void;
}) {
  const {
    state: { chatType }
  } = useContext(LocalContext);
  const MenuRef: React.RefObject<any> = useRef(null);

  useEffect(() => {
    (MenuRef.current || {}).scrollTop = 0;
  }, [currentChannel?.id]);

  const appliedTopicId = useMemo(() => {
    if (!currentChannel.selectedTab || currentChannel.selectedTab === 'all') {
      return null;
    }
    return currentChannel.selectedTopicId || currentChannel.featuredTopicId;
  }, [
    currentChannel.selectedTab,
    currentChannel.selectedTopicId,
    currentChannel.featuredTopicId
  ]);

  return (
    <ErrorBoundary componentPath="Chat/RightMenu">
      <div
        ref={MenuRef}
        className={css`
          flex-grow: 1;
          width: 10vw;
          height: 100%;
          position: relative;
          background: #fff;
          border-left: 1px solid ${Color.borderGray()};
          overflow-y: scroll;
          -webkit-overflow-scrolling: touch;
          @media (max-width: ${mobileMaxWidth}) {
            max-width: ${chatType === VOCAB_CHAT_TYPE ||
            chatType === AI_CARD_CHAT_TYPE
              ? '48vw'
              : '40vw'};
            width: ${chatType === VOCAB_CHAT_TYPE ||
            chatType === AI_CARD_CHAT_TYPE
              ? '48vw'
              : '40vw'};
          }
        `}
      >
        {chatType === AI_CARD_CHAT_TYPE ? <AICardInfo /> : null}
        {chatType === VOCAB_CHAT_TYPE ? <VocabInfo /> : null}
        {!chatType && (
          <ChatInfo
            isClass={currentChannel?.isClass}
            channelName={channelName}
            channelOnCall={channelOnCall}
            currentChannel={currentChannel}
            currentOnlineUsers={currentOnlineUsers}
            displayedThemeColor={displayedThemeColor}
            isZeroChat={isZeroChat}
            isCielChat={isCielChat}
            topicId={appliedTopicId}
            selectedChannelId={selectedChannelId}
            onScrollToBottom={onScrollToBottom}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default memo(RightMenu);
