import React, { memo, useContext, useRef, useEffect } from 'react';
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
  isAIChat,
  selectedChannelId
}: {
  channelName: string;
  channelOnCall: any;
  currentChannel: any;
  currentOnlineUsers: any[];
  displayedThemeColor: string;
  isAIChat: boolean;
  selectedChannelId: number;
}) {
  const {
    state: { chatType }
  } = useContext(LocalContext);
  const MenuRef: React.RefObject<any> = useRef(null);

  useEffect(() => {
    (MenuRef.current || {}).scrollTop = 0;
  }, [currentChannel?.id]);

  return (
    <ErrorBoundary componentPath="Chat/RightMenu">
      <div
        ref={MenuRef}
        className={css`
          flex-grow: 1;
          max-width: 22vw;
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
            channelName={channelName}
            channelOnCall={channelOnCall}
            currentChannel={currentChannel}
            currentOnlineUsers={currentOnlineUsers}
            displayedThemeColor={displayedThemeColor}
            isAIChat={isAIChat}
            selectedChannelId={selectedChannelId}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default memo(RightMenu);
