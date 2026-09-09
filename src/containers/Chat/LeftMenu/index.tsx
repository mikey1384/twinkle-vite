import React, { useMemo } from 'react';
import ChatSearchBox from './ChatSearchBox';
import Channels from './Channels';
import Collect from './Collect';
import Tabs from './Tabs';
import Subchannels from './Subchannels';
import PinnedTopics from './PinnedTopics';
import ChatQuickAccess from './QuickAccess';
import ChatFlatButton from '../FlatButton';
import Layout from './Layout';
import { getTopicNavigation } from './helpers/topicNavigation';
import { css } from '@emotion/css';
import { useChatContext, useKeyContext } from '~/contexts';
import {
  AI_CARD_CHAT_TYPE,
  GENERAL_CHAT_ID,
  VOCAB_CHAT_TYPE
} from '~/constants/defaultValues';
import { matchPath, useNavigate, useLocation } from 'react-router-dom';
import ErrorBoundary from '~/components/ErrorBoundary';

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

  const topicNavigation = useMemo(
    () =>
      getTopicNavigation({
        featuredTopicId:
          currentChannel?.twoPeople && !isAIChat
            ? null
            : currentChannel?.featuredTopicId,
        lastTopicId: currentChannel?.lastTopicId,
        pinnedTopicIds: currentChannel?.pinnedTopicIds,
        topicObj: currentChannel?.topicObj
      }),
    [
      currentChannel?.twoPeople,
      currentChannel?.featuredTopicId,
      currentChannel?.lastTopicId,
      currentChannel?.pinnedTopicIds,
      currentChannel?.topicObj,
      isAIChat
    ]
  );
  const isTopicMenuAvailable =
    topicNavigation.isVisible &&
    selectedChannelId === currentChannel?.id &&
    selectedChannelId !== GENERAL_CHAT_ID;

  return (
    <ErrorBoundary componentPath="Chat/LeftMenu">
      <Layout
        controls={
          <>
            <div
              className={css`
                display: flex;
                flex-direction: column;
                padding: 1rem;
                border-bottom: 1px solid var(--ui-border);
                @container chat-channels (max-width: 180px) {
                  padding: 0.7rem 0.6rem;
                  > button {
                    min-height: 36px;
                    padding: 0.6rem 0.3rem;
                    font-size: 14px;
                  }
                }
                @media (pointer: coarse) {
                  > button { min-height: 44px; }
                }
              `}
            >
              <ChatFlatButton label="New Group" onClick={onNewButtonClick} />
              <ChatQuickAccess />
            </div>
            <Collect
              aiCardSelected={chatType === AI_CARD_CHAT_TYPE || loadingAICardChat}
              vocabSelected={chatType === VOCAB_CHAT_TYPE || loadingVocabulary}
              onClick={() => {
                if (vocabMatch || aiCardMatch) return null;
                navigate(`/chat/${collectType || VOCAB_CHAT_TYPE}`);
              }}
            />
          </>
        }
        filters={
          <>
            <ChatSearchBox
              style={{
                marginTop: '1rem',
                zIndex: 5,
                width: '100%'
              }}
            />
            <Tabs style={{ marginBottom: 0 }} />
          </>
        }
        channelNavigation={
          subchannelsShown || isTopicMenuAvailable ? (
            <>
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
                  navigation={topicNavigation}
                  channelName={channelName}
                  displayedThemeColor={displayedThemeColor}
                  selectedTab={currentChannel?.selectedTab}
                  selectedTopicId={currentChannel?.selectedTopicId}
                  isAIChat={isAIChat}
                  isTwoPeopleChat={currentChannel?.twoPeople}
                  isOwner={Number(currentChannel?.creatorId) === Number(userId)}
                  onSetTopicSelectorModalShown={onSetTopicSelectorModalShown}
                  pathId={String(currentChannel?.pathId)}
                />
              ) : null}
            </>
          ) : null
        }
        channels={<Channels currentPathId={currentPathId} />}
      />
    </ErrorBoundary>
  );
}
