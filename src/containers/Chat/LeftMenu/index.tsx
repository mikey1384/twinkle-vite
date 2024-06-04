import React, { useMemo } from 'react';
import ChatSearchBox from './ChatSearchBox';
import Channels from './Channels';
import Collect from './Collect';
import Icon from '~/components/Icon';
import Tabs from './Tabs';
import Subchannels from './Subchannels';
import PinnedTopics from './PinnedTopics';
import { Color, desktopMinWidth, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useChatContext, useKeyContext } from '~/contexts';
import {
  AI_CARD_CHAT_TYPE,
  GENERAL_CHAT_ID,
  VOCAB_CHAT_TYPE
} from '~/constants/defaultValues';
import { matchPath, useNavigate, useLocation } from 'react-router-dom';
import localize from '~/constants/localize';
import ErrorBoundary from '~/components/ErrorBoundary';

const newChatLabel = localize('newChat');

export default function LeftMenu({
  channelName,
  currentChannel,
  currentPathId,
  displayedThemeColor,
  loadingVocabulary,
  loadingAICardChat,
  onNewButtonClick,
  selectedChannelId,
  subchannelIds,
  subchannelObj,
  subchannelPath
}: {
  channelName: string;
  currentChannel: any;
  currentPathId: number | string;
  displayedThemeColor: string;
  loadingVocabulary: boolean;
  loadingAICardChat: boolean;
  onNewButtonClick: () => void;
  selectedChannelId: number;
  subchannelIds: any[];
  subchannelObj: any;
  subchannelPath?: string;
}) {
  const { collectType } = useKeyContext((v) => v.myState);
  const navigate = useNavigate();
  const location = useLocation();
  const vocabMatch = useMemo(
    () =>
      matchPath(
        {
          path: `/chat/${VOCAB_CHAT_TYPE}`
        },
        location.pathname
      ),
    [location.pathname]
  );
  const aiCardMatch = useMemo(
    () =>
      matchPath(
        {
          path: `/chat/${AI_CARD_CHAT_TYPE}`
        },
        location.pathname
      ),
    [location.pathname]
  );
  const {
    chatFlatButton: {
      color: chatFlatButtonColor,
      opacity: chatFlatButtonOpacity
    },
    chatFlatButtonHovered: { color: chatFlatButtonHoveredColor },
    chatFlatButtonText: {
      color: chatFlatButtonTextColor,
      shadow: chatFlatButtonTextShadowColor
    }
  } = useKeyContext((v) => v.theme);
  const chatType = useChatContext((v) => v.state.chatType);
  const leftMenuTopButtonColor = useMemo(
    () => Color[chatFlatButtonColor](chatFlatButtonOpacity),
    [chatFlatButtonColor, chatFlatButtonOpacity]
  );
  const leftMenuTopButtonHoverColor = useMemo(
    () => Color[chatFlatButtonHoveredColor](),
    [chatFlatButtonHoveredColor]
  );
  const subchannelsShown = useMemo(() => {
    return (
      !!subchannelIds?.length &&
      !chatType &&
      !(loadingVocabulary || loadingAICardChat)
    );
  }, [chatType, loadingVocabulary, loadingAICardChat, subchannelIds?.length]);

  const isTopicMenuAvailable = useMemo(() => {
    const numTopics = Object.keys(currentChannel?.topicObj || {}).length;
    return numTopics > 0 && selectedChannelId !== GENERAL_CHAT_ID;
  }, [selectedChannelId, currentChannel?.topicObj]);

  return (
    <ErrorBoundary componentPath="Chat/LeftMenu">
      <div
        className={css`
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 16vw;
          position: relative;
          background: #fff;
          -webkit-overflow-scrolling: touch;
          @media (max-width: ${mobileMaxWidth}) {
            width: 40vw;
          }
        `}
      >
        <div
          className={`unselectable ${css`
            padding: 1rem;
            background: ${leftMenuTopButtonColor};
            color: ${Color[chatFlatButtonTextColor]()};
            ${chatFlatButtonTextShadowColor
              ? `text-shadow: 0 0 1px ${Color[chatFlatButtonTextShadowColor]()}`
              : ''};
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            transition: background 0.2s;
            @media (max-width: ${mobileMaxWidth}) {
              background: ${leftMenuTopButtonHoverColor};
            }
            @media (min-width: ${desktopMinWidth}) {
              &:hover {
                background: ${leftMenuTopButtonHoverColor};
              }
            }
          `}`}
          onClick={onNewButtonClick}
        >
          <Icon icon="plus" />
          <div
            style={{
              marginLeft: '0.7rem'
            }}
          >
            {newChatLabel}
          </div>
        </div>
        <Collect
          aiCardSelected={chatType === AI_CARD_CHAT_TYPE || loadingAICardChat}
          vocabSelected={chatType === VOCAB_CHAT_TYPE || loadingVocabulary}
          onClick={() => {
            if (vocabMatch && collectType === VOCAB_CHAT_TYPE) return null;
            if (aiCardMatch && collectType === AI_CARD_CHAT_TYPE) return null;
            navigate(`/chat/${collectType || VOCAB_CHAT_TYPE}`);
          }}
        />
        <ChatSearchBox
          style={{
            marginTop: '1rem',
            padding: '0 1rem',
            zIndex: 5,
            width: '100%'
          }}
        />
        <Tabs />
        {subchannelsShown ? (
          <Subchannels
            currentChannel={currentChannel}
            currentPathId={currentPathId}
            displayedThemeColor={displayedThemeColor}
            subchannelIds={subchannelIds}
            subchannelObj={subchannelObj}
            selectedChannelId={selectedChannelId}
            subchannelPath={subchannelPath}
          />
        ) : null}
        {isTopicMenuAvailable ? (
          <PinnedTopics
            channelId={selectedChannelId}
            featuredTopicId={
              currentChannel.twoPeople ? null : currentChannel?.featuredTopicId
            }
            lastTopicId={currentChannel?.lastTopicId}
            topicObj={currentChannel?.topicObj}
            channelName={channelName}
            displayedThemeColor={displayedThemeColor}
            selectedTab={currentChannel?.selectedTab}
            selectedTopicId={currentChannel?.selectedTopicId}
          />
        ) : null}
        <Channels currentPathId={currentPathId} />
      </div>
    </ErrorBoundary>
  );
}
