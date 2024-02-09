import React from 'react';
import { css } from '@emotion/css';
import { useChatContext } from '~/contexts';
import { getThemeStyles } from './StyleHelpers';
import { mobileMaxWidth } from '~/constants/css';

export default function TopicMessagePreview({
  channelId,
  nextMessageHasTopic,
  prevMessageHasTopic,
  theme,
  topicObj,
  username
}: {
  channelId: number;
  nextMessageHasTopic: boolean;
  prevMessageHasTopic: boolean;
  theme: string;
  topicObj: { id: number; content: string };
  username: string;
}) {
  const themeStyles = getThemeStyles(theme);
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);

  return (
    <div
      className={css`
        font-family: 'Roboto', sans-serif;
        font-size: 1.7rem;
        color: ${themeStyles.text};
        background-color: ${themeStyles.bg};
        border-top: 1px solid ${themeStyles.border};
        border-bottom: 1px solid ${themeStyles.border};
        cursor: pointer;
        padding: 1rem 10rem;
        margin-top: ${prevMessageHasTopic ? '0.5rem' : '1rem'};
        margin-bottom: ${nextMessageHasTopic ? '0.5rem' : '1rem'};
        transition: background 0.3s ease;

        &:hover {
          background-color: ${themeStyles.hoverBg};
          border-color: ${themeStyles.hoverBorder};
        }
        @media (max-width: ${mobileMaxWidth}) {
          padding: 1rem 3rem;
        }
      `}
      onClick={handleClick}
    >
      <div
        className={css`
          font-size: 1.6rem;
          width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: center;
          white-space: nowrap;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.3rem;
          }
        `}
      >
        {username} posted a message on {topicObj.content}
      </div>
    </div>
  );

  function handleClick() {
    onSetChannelState({
      channelId,
      newState: { selectedTab: 'topic', selectedTopicId: topicObj.id }
    });
  }
}
