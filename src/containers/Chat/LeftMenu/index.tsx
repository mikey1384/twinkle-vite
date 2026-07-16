import React, { useMemo, useState } from 'react';
import ChatSearchBox from './ChatSearchBox';
import Channels from './Channels';
import Collect from './Collect';
import Tabs from './Tabs';
import Subchannels from './Subchannels';
import PinnedTopics from './PinnedTopics';
import ChatQuickAccess from './QuickAccess';
import ChatFlatButton from '../FlatButton';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useChatContext, useKeyContext } from '~/contexts';
import {
  AI_CARD_CHAT_TYPE,
  GENERAL_CHAT_ID,
  VOCAB_CHAT_TYPE
} from '~/constants/defaultValues';
import { isMobile, isTablet } from '~/helpers';
import { matchPath, useNavigate, useLocation } from 'react-router-dom';
import ErrorBoundary from '~/components/ErrorBoundary';

const deviceIsMobile = isMobile(navigator) || isTablet(navigator);

export default function LeftMenu({
  channelName,
  currentChannel,
  currentPathId,
  displayedThemeColor,
  isAIChat,
  loadingVocabulary,
  loadingAICardChat,
  onNewButtonClick,
  selectedChannelId,
  subchannelIds,
  subchannelObj,
  subchannelPath,
  onSetTopicSelectorModalShown
}: {
  channelName: string;
  currentChannel: any;
  currentPathId: string | number;
  displayedThemeColor: string;
  isAIChat: boolean;
  loadingVocabulary: boolean;
  loadingAICardChat: boolean;
  onNewButtonClick: () => void;
  selectedChannelId: number;
  subchannelIds: number[];
  subchannelObj: any;
  subchannelPath?: string;
  onSetTopicSelectorModalShown: (shown: boolean) => void;
}) {
  const [isChannelsScrolling, setIsChannelsScrolling] = useState(false);
  const collectType = useKeyContext((v) => v.myState.collectType);
  const userId = useKeyContext((v) => v.myState.userId);
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
  const chatType = useChatContext((v) => v.state.chatType);
  const subchannelsShown = useMemo(() => {
    return (
      !!subchannelIds?.length &&
      !chatType &&
      !(loadingVocabulary || loadingAICardChat)
    );
  }, [chatType, loadingVocabulary, loadingAICardChat, subchannelIds?.length]);

  const isTopicMenuAvailable = useMemo(() => {
    const numTopics = Object.keys(currentChannel?.topicObj || {}).length;
    return (
      numTopics > 0 &&
      selectedChannelId === currentChannel?.id &&
      selectedChannelId !== GENERAL_CHAT_ID
    );
  }, [selectedChannelId, currentChannel?.id, currentChannel?.topicObj]);

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
            touch-action: pan-y;
            -webkit-overflow-scrolling: auto;
          }
        `}
      >
        <div
          className={css`
            display: flex;
            flex-direction: column;
            width: 16vw;
            position: relative;
            background: #fff;
            @media (max-width: ${mobileMaxWidth}) {
              width: 40vw;
            }
          `}
        >
          <div
            className={css`
              display: flex;
              flex-direction: column;
              padding: 1rem;
              border-bottom: 1px solid var(--ui-border);
            `}
          >
            <ChatFlatButton label="New Group" onClick={onNewButtonClick} />
            <ChatQuickAccess />
          </div>
        </div>
        <Collect
          aiCardSelected={chatType === AI_CARD_CHAT_TYPE || loadingAICardChat}
          vocabSelected={chatType === VOCAB_CHAT_TYPE || loadingVocabulary}
          onClick={() => {
            if (vocabMatch || aiCardMatch) return null;
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
        <Tabs
          style={{
            marginBottom: 0
          }}
        />
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
              currentChannel.twoPeople && !isAIChat
                ? null
                : currentChannel?.featuredTopicId
            }
            lastTopicId={currentChannel?.lastTopicId}
            topicObj={currentChannel?.topicObj}
            channelName={channelName}
            displayedThemeColor={displayedThemeColor}
            pinnedTopicIds={currentChannel?.pinnedTopicIds}
            selectedTab={currentChannel?.selectedTab}
            selectedTopicId={currentChannel?.selectedTopicId}
            isAIChat={isAIChat}
            isTwoPeopleChat={currentChannel?.twoPeople}
            isOwner={Number(currentChannel?.creatorId) === Number(userId)}
            isFixed={isChannelsScrolling}
            onSetTopicSelectorModalShown={onSetTopicSelectorModalShown}
            pathId={String(currentChannel?.pathId)}
          />
        ) : null}
        <Channels
          style={{
            marginTop: 0
          }}
          currentPathId={currentPathId}
          onMouseEnter={() => {
            if (deviceIsMobile) return;
            setIsChannelsScrolling(true);
          }}
          onMouseLeave={() => setIsChannelsScrolling(false)}
        />
      </div>
    </ErrorBoundary>
  );
}
