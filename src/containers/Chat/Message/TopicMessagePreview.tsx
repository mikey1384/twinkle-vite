import React from 'react';
import { css } from '@emotion/css';
import { useChatContext } from '~/contexts';
import { getThemeStyles } from './StyleHelpers';

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
        color: ${themeStyles.text};
        background-color: ${themeStyles.bg};
        border-top: 1px solid ${themeStyles.border};
        border-bottom: 1px solid ${themeStyles.border};
        cursor: pointer;
        text-align: center;
        padding: 1rem;
        margin-top: ${prevMessageHasTopic ? '0.5rem' : '1rem'};
        margin-bottom: ${nextMessageHasTopic ? '0.5rem' : '1rem'};
        transition: all 0.3s ease;

        &:hover {
          background-color: ${themeStyles.hoverBg};
          border-color: ${themeStyles.hoverBorder};
        }
      `}
      onClick={handleClick}
    >
      <div
        className={css`
          font-size: 16px;
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
