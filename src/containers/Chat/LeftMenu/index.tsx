import React, { useMemo, useState } from 'react';
import ChatSearchBox from './ChatSearchBox';
import Channels from './Channels';
import Collect from './Collect';
import Icon from '~/components/Icon';
import Tabs from './Tabs';
import Subchannels from './Subchannels';
import PinnedTopics from './PinnedTopics';
import ciel from '~/assets/ciel.png';
import zero from '~/assets/zero.png';
import { Color, desktopMinWidth, mobileMaxWidth } from '~/constants/css';
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
import { matchPath, useNavigate, useLocation } from 'react-router-dom';
import localize from '~/constants/localize';
import ErrorBoundary from '~/components/ErrorBoundary';

const newChatLabel = localize('newChat');

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
  currentPathId: string;
  displayedThemeColor: string;
  isAIChat: boolean;
  loadingVocabulary: boolean;
  loadingAICardChat: boolean;
  onNewButtonClick: () => void;
  selectedChannelId: number;
  subchannelIds: number[];
  subchannelObj: any;
  subchannelPath: string;
  onSetTopicSelectorModalShown: (shown: boolean) => void;
}) {
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
        <div
          className={css`
            display: flex;
            justify-content: center;
          `}
        >
          <button
            className={css`
              border: none;
              cursor: ${cielChatLoading ? 'not-allowed' : 'pointer'};
              opacity: ${cielChatLoading ? 0.5 : 1};
              background: none;
              padding: 0;
            `}
            onClick={() => handleAIClick('ciel')}
            disabled={cielChatLoading}
          >
            <div
              className={css`
                display: flex;
                align-items: center;
                justify-content: center;
                width: 4rem;
                height: 4rem;
                position: relative;
              `}
            >
              <img
                src={ciel}
                alt="Ciel"
                className={css`
                  width: 100%;
                  height: 100%;
                  background-size: cover;
                  border-radius: 4px;
                `}
              />
              {cielChatLoading && (
                <Icon
                  icon="spinner"
                  pulse
                  className={css`
                    position: absolute;
                  `}
                />
              )}
            </div>
          </button>
          <button
            className={css`
              border: none;
              cursor: ${zeroChatLoading ? 'not-allowed' : 'pointer'};
              opacity: ${zeroChatLoading ? 0.5 : 1};
              margin-left: 1rem;
              background: none;
              padding: 0;
            `}
            onClick={() => handleAIClick('zero')}
            disabled={zeroChatLoading}
          >
            <div
              className={css`
                display: flex;
                align-items: center;
                justify-content: center;
                width: 4rem;
                height: 4rem;
                position: relative;
              `}
            >
              <img
                src={zero}
                alt="Zero"
                className={css`
                  width: 100%;
                  height: 100%;
                  background-size: cover;
                  border-radius: 4px;
                `}
              />
              {zeroChatLoading && (
                <Icon
                  icon="spinner"
                  pulse
                  className={css`
                    position: absolute;
                  `}
                />
              )}
            </div>
          </button>
        </div>
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
            onSetTopicSelectorModalShown={onSetTopicSelectorModalShown}
          />
        ) : null}
        <Channels currentPathId={currentPathId} />
      </div>
    </ErrorBoundary>
  );

  async function handleAIClick(type: 'zero' | 'ciel') {
    if (type === 'zero') {
      setZeroChatLoading(true);
    } else {
      setCielChatLoading(true);
    }
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
    if (type === 'zero') {
      setZeroChatLoading(false);
    } else {
      setCielChatLoading(false);
    }
  }
}
