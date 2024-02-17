import React from 'react';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useTheme } from '~/helpers/hooks';
import { useChatContext } from '~/contexts';
import { getThemeStyles } from './StyleHelpers';

export default function TopicStartNotification({
  channelId,
  topicObj,
  theme,
  username
}: {
  channelId: number;
  topicObj: { id: number; title: string };
  theme: string;
  username: string;
}) {
  const {
    topicText: { color: topicTextColor, shadow: topicShadowColor }
  } = useTheme(theme);
  const themeStyles = getThemeStyles(theme);
  const onEnterTopic = useChatContext((v) => v.actions.onEnterTopic);

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
        margin: 1rem 0;
        transition: background 0.3s ease;

        &:hover {
          background-color: ${themeStyles.hoverBg};
          border-color: ${themeStyles.hoverBorder};
        }
      `}
      onClick={() => handleTopicClick(topicObj.id)}
    >
      <div
        className={css`
          font-size: 1.6rem;
          font-weight: bold;
          width: 100%;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.5rem;
          }
        `}
      >
        <div
          className={css`
            width: 100%;
          `}
        >
          {username} started a new topic
        </div>
        <div
          className={css`
            width: 100%;
            padding: 0 10rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: ${Color[topicTextColor]()};
            text-shadow: ${topicShadowColor
              ? `0.05rem 0.05rem 0.05rem ${Color[topicShadowColor]()}`
              : 'none'};
            @media (max-width: ${mobileMaxWidth}) {
              padding: 0 3rem;
            }
          `}
        >
          {topicObj.title}
        </div>
      </div>
    </div>
  );

  function handleTopicClick(topicId: number) {
    onEnterTopic({ channelId, topicId });
  }
}
