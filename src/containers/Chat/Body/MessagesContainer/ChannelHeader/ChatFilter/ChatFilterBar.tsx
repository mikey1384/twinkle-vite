import React from 'react';
import BackForwardButtons from './BackForwardButtons';
import { css } from '@emotion/css';
import { borderRadius, getThemeStyles, mobileMaxWidth } from '~/constants/css';
import { useChatContext } from '~/contexts';
import Icon from '~/components/Icon';

export default function ChatFilterBar({
  canChangeTopic,
  channelId,
  onShowTopicSelectorModal,
  selectedTab = 'all',
  themeColor = 'logoBlue',
  topic,
  topicHistory,
  topicId
}: {
  canChangeTopic: boolean;
  channelId: number;
  onShowTopicSelectorModal: () => void;
  selectedTab: string;
  themeColor: string;
  topic: string;
  topicHistory: number[];
  topicId: number;
}) {
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);
  const onEnterTopic = useChatContext((v) => v.actions.onEnterTopic);
  const themeStyles = getThemeStyles(themeColor);

  return (
    <div
      className={css`
        display: flex;
        height: 4rem;
        align-items: center;
        font-size: 1.5rem;
        gap: 1.5rem;
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
            border-radius: 4px;
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
            border-radius: 4px;
          }
        `}
      >
        <BackForwardButtons topicHistory={topicHistory} />
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
        {canChangeTopic && (
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
        )}
      </div>
    </div>
  );

  function handleTabClick(tabName: string) {
    if (tabName === 'topic') {
      return onEnterTopic({ channelId, topicId });
    }
    onSetChannelState({
      channelId,
      newState: { selectedTab: tabName }
    });
  }
}
