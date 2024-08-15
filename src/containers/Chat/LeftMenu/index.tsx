import React, { memo, useMemo, useState } from 'react';
import ChatSearchBox from './ChatSearchBox';
import Channels from './Channels';
import Collect from './Collect';
import Icon from '~/components/Icon';
import Tabs from './Tabs';
import Subchannels from './Subchannels';
import PinnedTopics from './PinnedTopics';
import AIButton from './AIButton';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import {
  CIEL_PFP_URL,
  CIEL_TWINKLE_ID,
  ZERO_TWINKLE_ID,
  ZERO_PFP_URL,
  AI_CARD_CHAT_TYPE,
  GENERAL_CHAT_ID,
  VOCAB_CHAT_TYPE
} from '~/constants/defaultValues';
import { isMobile, isTablet } from '~/helpers';
import { matchPath, useNavigate, useLocation } from 'react-router-dom';
import ErrorBoundary from '~/components/ErrorBoundary';

const deviceIsMobile = isMobile(navigator) || isTablet(navigator);

function LeftMenu({
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
  const { collectType, username, userId, profilePicUrl } = useKeyContext(
    (v) => v.myState
  );
  const loadDMChannel = useAppContext((v) => v.requestHelpers.loadDMChannel);
  const onOpenNewChatTab = useChatContext((v) => v.actions.onOpenNewChatTab);
  const onUpdateSelectedChannelId = useChatContext(
    (v) => v.actions.onUpdateSelectedChannelId
  );
  const [zeroChatLoading, setZeroChatLoading] = useState(false);
  const [cielChatLoading, setCielChatLoading] = useState(false);
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
            -webkit-overflow-scrolling: touch;
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
              border-bottom: 1px solid ${Color.borderGray()};
            `}
          >
            <button
              className={css`
                padding: 0.75rem 1rem;
                background: ${leftMenuTopButtonColor};
                color: ${Color[chatFlatButtonTextColor]()};
                ${chatFlatButtonTextShadowColor
                  ? `text-shadow: 0 0 1px ${Color[
                      chatFlatButtonTextShadowColor
                    ]()}`
                  : ''};
                display: flex;
                border: none;
                justify-content: center;
                align-items: center;
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 1.5rem;
                font-weight: bold;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);

                &:hover {
                  background: ${leftMenuTopButtonHoverColor};
                  transform: translateY(2px);
                  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
                }

                &:active {
                  transform: translateY(0);
                  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);
                }
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1.2rem;
                }
              `}
              onClick={onNewButtonClick}
            >
              <Icon icon="plus" />
              <div style={{ marginLeft: '0.5rem' }}>New Group</div>
            </button>
            <div
              className={css`
                display: flex;
                justify-content: center;
                gap: 1rem;
                margin-top: 1rem;
              `}
            >
              <AIButton
                aiName="ciel"
                loading={cielChatLoading}
                onClick={() => handleAIClick('ciel')}
              />
              <AIButton
                aiName="zero"
                loading={zeroChatLoading}
                onClick={() => handleAIClick('zero')}
              />
            </div>
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
            isOwner={currentChannel?.creatorId === userId}
            isFixed={isChannelsScrolling}
            onSetTopicSelectorModalShown={onSetTopicSelectorModalShown}
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

  async function handleAIClick(type: 'ciel' | 'zero') {
    if (type === 'zero') {
      setZeroChatLoading(true);
    } else {
      setCielChatLoading(true);
    }

    try {
      const { channelId, pathId } = await loadDMChannel({
        recipient: { id: type === 'ciel' ? CIEL_TWINKLE_ID : ZERO_TWINKLE_ID }
      });

      if (!pathId) {
        onOpenNewChatTab({
          user: {
            username,
            id: userId,
            profilePicUrl
          },
          recipient: {
            username: type === 'ciel' ? 'Ciel' : 'Zero',
            id: type === 'ciel' ? CIEL_TWINKLE_ID : ZERO_TWINKLE_ID,
            profilePicUrl: type === 'ciel' ? CIEL_PFP_URL : ZERO_PFP_URL
          }
        });
      }

      onUpdateSelectedChannelId(channelId);
      setTimeout(() => navigate(pathId ? `/chat/${pathId}` : `/chat/new`), 0);
    } catch (error) {
      console.error('Error handling AI Button click:', error);
    } finally {
      if (type === 'zero') {
        setZeroChatLoading(false);
      } else {
        setCielChatLoading(false);
      }
    }
  }
}

export default memo(LeftMenu);
