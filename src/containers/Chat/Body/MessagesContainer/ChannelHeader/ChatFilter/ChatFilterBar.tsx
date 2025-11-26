import React, { useMemo, useRef } from 'react';
import BackForwardButtons from './BackForwardButtons';
import { css } from '@emotion/css';
import {
  innerBorderRadius,
  borderRadius,
  mobileMaxWidth
} from '~/constants/css';
import { useAppContext, useChatContext } from '~/contexts';
import Icon from '~/components/Icon';
import SearchInput from './SearchInput';
import { useOutsideTap, useOutsideClick } from '~/helpers/hooks';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { isMobile } from '~/helpers';
import ScopedTheme from '~/theme/ScopedTheme';
import { useRoleColor } from '~/theme/useRoleColor';
import { useNavigate, useParams } from 'react-router-dom';

const deviceIsMobile = isMobile(navigator);
const outsideClickMethod = deviceIsMobile ? useOutsideTap : useOutsideClick;

export default function ChatFilterBar({
  canChangeTopic,
  channelId,
  isOwner,
  isSearchActive,
  onSearch,
  onShowTopicSelectorModal,
  onSetBuyTopicModalShown,
  onSetIsSearchActive,
  searchText,
  selectedTab = 'all',
  themeColor = 'logoBlue',
  topicHistory,
  currentTopicIndex,
  topic,
  topicId,
  pathId
}: {
  canChangeTopic: boolean;
  channelId: number;
  isOwner: boolean;
  isSearchActive: boolean;
  onSearch: (text: string) => void;
  onShowTopicSelectorModal: () => void;
  onSetBuyTopicModalShown: (shown: boolean) => void;
  onSetIsSearchActive: (info: {
    channelId: number;
    isToggle?: boolean;
    isActive?: boolean;
  }) => void;
  searchText: string;
  selectedTab: string;
  themeColor: string;
  topicHistory: number[];
  currentTopicIndex: number;
  topic: string;
  topicId: number;
  pathId: string;
}) {
  const navigate = useNavigate();
  const { subchannelPath } = useParams();
  const searchInputRef = useRef(null);
  const searchButtonRef = useRef(null);
  const topicButtonRef = useRef(null);
  const normalizedTheme = useMemo(() => themeColor || 'logoBlue', [themeColor]);
  const { color: chatTopicColor, themeName } = useRoleColor('chatTopic', {
    themeName: normalizedTheme,
    fallback: normalizedTheme
  });
  const { color: chatTopicTextColor } = useRoleColor('chatTopicText', {
    themeName,
    fallback: 'white'
  });
  const chatTopicColorVar = useMemo(
    () => `var(--role-chatTopic-color, ${chatTopicColor})`,
    [chatTopicColor]
  );
  const chatTopicTextColorVar = useMemo(
    () => `var(--role-chatTopicText-color, ${chatTopicTextColor})`,
    [chatTopicTextColor]
  );
  const updateLastTopicId = useAppContext(
    (v) => v.requestHelpers.updateLastTopicId
  );
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);

  outsideClickMethod([searchInputRef, searchButtonRef, topicButtonRef], () => {
    if (!stringIsEmpty(searchText)) {
      return;
    }
    onSetIsSearchActive({
      channelId,
      isActive: false
    });
  });

  return (
    <ScopedTheme theme={themeName} roles={['chatTopic', 'chatTopicText']}>
      <div
        className={css`
          display: flex;
          flex-direction: column;
          height: 4rem;
        `}
      >
        <div
          className={css`
            display: flex;
            gap: 1.5rem;
            width: 100%;
            height: 100%;
            align-items: center;
            font-size: 1.5rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.2rem;
            }
          `}
        >
          <div
            className={css`
              height: 100%;
              padding: 0 1.2rem;
              border-radius: ${borderRadius};
              display: flex;
              align-items: center;
              background: #fff;
              cursor: pointer;
              border: 1px solid var(--ui-border);
              box-shadow: 0 12px 20px -16px rgba(15, 23, 42, 0.16);
              transition: background 0.18s ease, color 0.18s ease,
                border-color 0.18s ease, box-shadow 0.18s ease,
                transform 0.06s ease;
              ${selectedTab === 'all'
                ? `background-color: ${chatTopicColorVar};`
                : ''};
              ${selectedTab === 'all'
                ? `color: ${chatTopicTextColorVar};`
                : ''};
              &:hover {
                color: ${chatTopicTextColorVar};
                background-color: ${chatTopicColorVar};
                box-shadow: 0 16px 26px -18px rgba(15, 23, 42, 0.22);
                transform: translateY(-1px);
              }
              @media (max-width: ${mobileMaxWidth}) {
                padding: 0;
                border-radius: ${innerBorderRadius};
              }
            `}
            onClick={() => handleTabClick('all')}
          >
            <span
              className={css`
                padding: 1rem;
                font-weight: bold;
              `}
            >
              All
            </span>
          </div>
          <div
            className={css`
              height: 100%;
              border-radius: ${borderRadius};
              display: flex;
              align-items: center;
              background: #fff;
              border: 1px solid var(--ui-border);
              box-shadow: 0 12px 20px -16px rgba(15, 23, 42, 0.16);
              transition: box-shadow 0.18s ease, transform 0.06s ease;
              @media (max-width: ${mobileMaxWidth}) {
                border-radius: ${innerBorderRadius};
              }
            `}
          >
            <div
              className={css`
                display: none;
                @media (min-width: ${mobileMaxWidth}) {
                  display: flex;
                }
              `}
            >
              <BackForwardButtons
                channelId={channelId}
                topicHistory={topicHistory}
                currentTopicIndex={currentTopicIndex}
                pathId={pathId}
              />
            </div>
            {topic && (
              <div
                ref={topicButtonRef}
                onClick={() => {
                  handleTabClick('topic');
                }}
                className={css`
                  cursor: pointer;
                  background: #fff;
                  height: 100%;
                  display: flex;
                  align-items: center;
                  ${selectedTab === 'topic'
                    ? `background-color: ${chatTopicColorVar};`
                    : ''}
                  ${selectedTab === 'topic'
                    ? `color: ${chatTopicTextColorVar};`
                    : ''}
              &:hover {
                    color: ${chatTopicTextColorVar};
                    background-color: ${chatTopicColorVar};
                  }
                  max-width: 20vw;
                  @media (max-width: ${mobileMaxWidth}) {
                    border-top-left-radius: ${innerBorderRadius};
                    border-bottom-left-radius: ${innerBorderRadius};
                  }
                `}
              >
                <span
                  className={`unselectable ${css`
                    padding: 0.5rem 1.5rem;
                    font-weight: bold;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  `}`}
                >
                  {topic}
                </span>
              </div>
            )}
            {canChangeTopic ? (
              <div
                className={css`
                  cursor: pointer;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100%;
                  padding: 0 1.2rem;
                  &:hover {
                    color: #007bff;
                  }
                `}
                onClick={onShowTopicSelectorModal}
              >
                <Icon icon="caret-down" />
                {!topic ? (
                  <span
                    className={css`
                      font-weight: bold;
                      margin-left: 1rem;
                    `}
                  >
                    Topics
                  </span>
                ) : (
                  ''
                )}
              </div>
            ) : isOwner ? (
              <div
                className={css`
                  cursor: pointer;
                  display: flex;
                  font-weight: bold;
                  justify-content: center;
                  align-items: center;
                  height: 100%;
                  padding: 0 1.2rem;
                  &:hover {
                    color: #007bff;
                  }
                `}
                onClick={() => onSetBuyTopicModalShown(true)}
              >
                <Icon icon="caret-down" />
                <span
                  className={css`
                    font-weight: bold;
                    margin-left: 1rem;
                  `}
                >
                  Enable Topics
                </span>
              </div>
            ) : (
              <div
                className={css`
                  cursor: not-allowed;
                  display: flex;
                  font-weight: bold;
                  justify-content: center;
                  align-items: center;
                  color: #ccc;
                  height: 100%;
                  padding: 0 1.2rem;
                `}
              >
                Topics Not Enabled
              </div>
            )}
          </div>
          <div
            ref={searchButtonRef}
            className={css`
              height: 100%;
              padding: 0 1.2rem;
              border-radius: ${borderRadius};
              display: flex;
              align-items: center;
              background: #fff;
              cursor: pointer;
              border: 1px solid var(--ui-border);
              box-shadow: 0 12px 20px -16px rgba(15, 23, 42, 0.16);
              transition: background 0.18s ease, color 0.18s ease,
                border-color 0.18s ease, box-shadow 0.18s ease,
                transform 0.06s ease;
              ${isSearchActive ? `background-color: var(--chat-bg);` : ''};
              ${isSearchActive ? `color: var(--chat-text);` : ''};
              @media (max-width: ${mobileMaxWidth}) {
                border-radius: ${innerBorderRadius};
              }
            `}
            onClick={() =>
              onSetIsSearchActive({
                channelId,
                isToggle: true
              })
            }
          >
            <Icon icon="search" />
          </div>
        </div>
        {isSearchActive && (
          <div ref={searchInputRef}>
            <SearchInput searchText={searchText} onChange={onSearch} />
          </div>
        )}
      </div>
    </ScopedTheme>
  );

  function handleTabClick(tabName: string) {
    if (selectedTab === 'topic' && tabName === 'topic' && !isSearchActive) {
      return onShowTopicSelectorModal();
    }
    if (tabName === 'topic') {
      updateLastTopicId({
        channelId,
        topicId
      });
      return navigate(
        `/chat/${pathId}${
          subchannelPath ? `/${subchannelPath}` : ''
        }/topic/${topicId}`
      );
    }
    onSetChannelState({
      channelId,
      newState: {
        selectedTab: tabName,
        isSearchActive: false,
        ...(tabName === 'all' ? { lastTopicId: 0 } : {})
      }
    });
    if (tabName === 'all') {
      updateLastTopicId({
        channelId,
        topicId: 0
      });
      navigate(`/chat/${pathId}${subchannelPath ? `/${subchannelPath}` : ''}`);
    }
  }
}
