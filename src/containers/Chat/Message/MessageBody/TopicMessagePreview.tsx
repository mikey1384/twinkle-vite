import React from 'react';
import { css } from '@emotion/css';
import { useAppContext, useChatContext } from '~/contexts';
import { getThemeStyles } from './StyleHelpers';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useTheme } from '~/helpers/hooks';

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
  const updateLastTopicId = useAppContext(
    (v) => v.requestHelpers.updateLastTopicId
  );
  const onEnterTopic = useChatContext((v) => v.actions.onEnterTopic);
  const {
    topicText: { color: topicTextColor, shadow: topicShadowColor }
  } = useTheme(theme);

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
        {username} posted a message on{' '}
        <b
          style={{
            color: Color[topicTextColor](),
            ...(topicShadowColor
              ? {
                  textShadow: `0.05rem 0.05rem 0.05rem ${Color[
                    topicShadowColor
                  ]()}`
                }
              : {})
          }}
        >
          {topicObj.content}
        </b>
      </div>
    </div>
  );

  async function handleClick() {
    await updateLastTopicId({
      channelId,
      topicId: topicObj.id
    });
    onEnterTopic({ channelId, topicId: topicObj.id });
  }
}
