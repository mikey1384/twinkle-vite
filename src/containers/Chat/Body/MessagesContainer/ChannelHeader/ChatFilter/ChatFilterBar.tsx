import React, { useRef } from 'react';
import BackForwardButtons from './BackForwardButtons';
import { css } from '@emotion/css';
import {
  innerBorderRadius,
  borderRadius,
  getThemeStyles,
  mobileMaxWidth
} from '~/constants/css';
import { useAppContext, useChatContext } from '~/contexts';
import Icon from '~/components/Icon';
import SearchInput from './SearchInput';
import { useOutsideTap, useOutsideClick } from '~/helpers/hooks';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { isMobile } from '~/helpers';

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
  topicId
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
}) {
  const searchInputRef = useRef(null);
  const searchButtonRef = useRef(null);
  const updateLastTopicId = useAppContext(
    (v) => v.requestHelpers.updateLastTopicId
  );
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);
  const onEnterTopic = useChatContext((v) => v.actions.onEnterTopic);
  const themeStyles = getThemeStyles(themeColor);

  outsideClickMethod([searchInputRef, searchButtonRef], () => {
    if (!stringIsEmpty(searchText)) {
      return;
    }
    onSetIsSearchActive({
      channelId,
      isActive: false
    });
  });

  return (
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
            box-shadow: 2px 2px 5px #d1d1d1, -2px -2px 5px #ffffff;
            ${selectedTab === 'all'
              ? `background-color: ${themeStyles.bg};`
              : ''};
            ${selectedTab === 'all' ? `color: ${themeStyles.text};` : ''};
            &:hover {
              color: ${themeStyles.text};
              background-color: ${themeStyles.bg};
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
            box-shadow: 2px 2px 5px #d1d1d1, -2px -2px 5px #ffffff;
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
            />
          </div>
          {topic && (
            <div
              onClick={() => {
                if (selectedTab !== 'topic') {
                  handleTabClick('topic');
                } else {
                  onShowTopicSelectorModal();
                }
              }}
              className={css`
                cursor: pointer;
                background: #fff;
                height: 100%;
                display: flex;
                align-items: center;
                ${selectedTab === 'topic'
                  ? `background-color: ${themeStyles.bg};`
                  : ''}
                ${selectedTab === 'topic' ? `color: ${themeStyles.text};` : ''}
              &:hover {
                  color: ${themeStyles.text};
                  background-color: ${themeStyles.bg};
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
            box-shadow: 2px 2px 5px #d1d1d1, -2px -2px 5px #ffffff;
            ${isSearchActive ? `background-color: ${themeStyles.bg};` : ''};
            ${isSearchActive ? `color: ${themeStyles.text};` : ''};
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
  );

  function handleTabClick(tabName: string) {
    if (tabName === 'topic') {
      updateLastTopicId({
        channelId,
        topicId
      });
      return onEnterTopic({ channelId, topicId });
    }
    onSetChannelState({
      channelId,
      newState: { selectedTab: tabName }
    });
  }
}
