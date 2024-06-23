import React, { useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { useAppContext, useChatContext } from '~/contexts';
import { getThemeStyles } from './StyleHelpers';
import { Color, mobileMaxWidth } from '~/constants/css';
import {
  addCommasToNumber,
  stringIsEmpty,
  isValidSpoiler
} from '~/helpers/stringHelpers';
import { returnTheme } from '~/helpers';

export default function TopicMessagePreview({
  channelId,
  content,
  rewardAmount,
  messageId,
  nextMessageHasTopic,
  onSetMessageToScrollTo,
  targetMessage,
  prevMessageHasTopic,
  theme,
  topicObj,
  username
}: {
  channelId: number;
  content: string;
  rewardAmount: number;
  messageId: number;
  nextMessageHasTopic: boolean;
  onSetMessageToScrollTo: (v: number) => void;
  prevMessageHasTopic: boolean;
  targetMessage: any;
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
  } = useMemo(() => returnTheme(theme), [theme]);
  const contentPreviewShown = useMemo(() => {
    return !stringIsEmpty(content) && !isValidSpoiler(content);
  }, [content]);
  const rewardDetails = useMemo(() => {
    if (rewardAmount) {
      return `rewarded ${addCommasToNumber(rewardAmount)} XP to ${
        targetMessage?.username
      } ${content}`;
    }
    return '';
  }, [content, rewardAmount, targetMessage?.username]);

  return (
    <ErrorBoundary componentPath="Chat/Message/MessageBody/TopicMessagePreview">
      <div
        className={css`
          font-family: 'Roboto', sans-serif;
          font-size: ${contentPreviewShown ? '1.5rem' : '1.7rem'};
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
          }
          @media (max-width: ${mobileMaxWidth}) {
            padding: 1rem 3rem;
          }
        `}
        onClick={handleClick}
      >
        <div
          className={css`
            font-size: ${contentPreviewShown ? '1.4rem' : '1.6rem'};
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
          {!contentPreviewShown ? `${username} posted a message on ` : ''}
          <b
            className={css`
              color: ${Color[topicTextColor]()};
              ${topicShadowColor
                ? `text-shadow: 0.05rem 0.05rem 0.05rem ${Color[
                    topicShadowColor
                  ]()};`
                : ''}
            `}
          >
            {topicObj.content}
          </b>
        </div>
        {contentPreviewShown && (
          <div
            className={css`
              color: ${Color.black()};
              margin-top: 0.5rem;
              width: 100%;
              overflow: hidden;
              text-overflow: ellipsis;
              text-align: center;
              white-space: nowrap;
              font-size: 1.5rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.2rem;
              }
            `}
          >
            {username}:{' '}
            <span
              className={css`
                font-family: 'Noto Sans', Helvetica, sans-serif, Arial;
              `}
            >
              {rewardDetails || content}
            </span>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );

  function handleClick() {
    onSetMessageToScrollTo(messageId);
    updateLastTopicId({
      channelId,
      topicId: topicObj.id
    });
    onEnterTopic({ channelId, topicId: topicObj.id });
  }
}
