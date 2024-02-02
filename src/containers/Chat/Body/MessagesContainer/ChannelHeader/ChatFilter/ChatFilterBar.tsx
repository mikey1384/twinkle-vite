import React from 'react';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { useChatContext } from '~/contexts';
import Icon from '~/components/Icon';

const getThemeStyles = (theme: string) => {
  const themeColors: Record<string, any> = {
    logoBlue: { bg: Color.logoBlue(), text: '#fff' },
    green: { bg: Color.green(), text: '#fff' },
    orange: { bg: Color.orange(), text: '#fff' },
    rose: { bg: Color.rose(), text: '#fff' },
    pink: { bg: Color.pink(), text: '#fff' },
    purple: { bg: Color.purple(), text: '#fff' },
    black: { bg: Color.black(), text: '#fff' },
    red: { bg: Color.red(), text: '#fff' },
    darkBlue: { bg: Color.darkBlue(), text: '#fff' },
    vantaBlack: { bg: Color.vantaBlack(), text: '#fff' },
    gold: { bg: Color.gold(), text: '#fff' }
  };

  return themeColors[theme] || { bg: Color.gray(), text: '#000' };
};

export default function ChatFilterBar({
  canChangeTopic,
  channelId,
  onScrollToBottom,
  selectedTab = 'all',
  themeColor = 'logoBlue',
  topic,
  topicId
}: {
  canChangeTopic: boolean;
  channelId: number;
  onScrollToBottom: () => void;
  selectedTab: string;
  themeColor: string;
  topic: string;
  topicId: number;
}) {
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);
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
        <div
          className={css`
            display: flex;
            align-items: center;
            height: 100%;
          `}
        >
          <div
            className={css`
              padding-left: 1.2rem;
              cursor: pointer;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100%;
              &:hover {
                color: #007bff;
              }
            `}
          >
            <Icon icon="arrow-left" />
          </div>
          <div
            className={css`
              padding-right: 1.2rem;
              cursor: pointer;
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
              margin-left: 0.5rem;
              &:hover {
                color: #007bff;
              }
            `}
          >
            <Icon icon="arrow-right" />
          </div>
        </div>
        {topic && (
          <div
            onClick={() => handleTabClick('topic')}
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
            `}
          >
            <span
              className={`unselectable ${css`
                padding: 1rem;
                font-weight: bold;
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
    onSetChannelState({
      channelId,
      newState: { selectedTab: tabName, selectedTopicId: topicId }
    });
    onScrollToBottom();
  }
}
