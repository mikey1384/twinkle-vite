import React, { useMemo, useRef, useEffect, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { returnTheme } from '~/helpers';
import { useAppContext, useChatContext } from '~/contexts';
import { getThemeStyles } from './StyleHelpers';

export default function TopicStartNotification({
  channelId,
  messageId,
  onSetMessageToScrollTo,
  topicObj,
  theme,
  username
}: {
  channelId: number;
  messageId: number;
  onSetMessageToScrollTo: (v: number) => void;
  topicObj: { id: number; title: string };
  theme: string;
  username: string;
}) {
  const {
    topicText: { color: topicTextColor, shadow: topicShadowColor }
  } = useMemo(() => returnTheme(theme), [theme]);
  const themeStyles = getThemeStyles(theme);
  const updateLastTopicId = useAppContext(
    (v) => v.requestHelpers.updateLastTopicId
  );
  const onEnterTopic = useChatContext((v) => v.actions.onEnterTopic);

  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const [truncatedTitle, setTruncatedTitle] = useState('\u200B');

  useEffect(() => {
    setTruncatedTitle(truncateText(topicObj.title, titleRef));
  }, [topicObj.title]);

  return (
    <ErrorBoundary componentPath="Chat/Message/MessageBody/TopicStartNotification">
      <div
        ref={containerRef}
        className={css`
          font-family: 'Roboto', sans-serif;
          color: ${themeStyles.text};
          background-color: ${themeStyles.titleBg};
          border-top: 1px solid ${themeStyles.border};
          border-bottom: 1px solid ${themeStyles.border};
          cursor: pointer;
          text-align: center;
          padding: 1rem;
          margin: 1rem 0;
          transition: background 0.3s ease;
          width: 100%;
          &:hover {
            background-color: ${themeStyles.hoverTitleBg};
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
            ref={titleRef}
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
            {truncatedTitle}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );

  function handleTopicClick(topicId: number) {
    onSetMessageToScrollTo(messageId);
    updateLastTopicId({
      channelId,
      topicId
    });
    onEnterTopic({ channelId, topicId });
  }

  function truncateText(
    text: string,
    elementRef: React.RefObject<HTMLDivElement>
  ) {
    if (!elementRef.current || !containerRef.current) return text;

    const containerWidth = containerRef.current.offsetWidth;
    const maxWidth = containerWidth * 0.75;

    const element = elementRef.current;
    const testDiv = document.createElement('div');
    testDiv.style.visibility = 'hidden';
    testDiv.style.position = 'absolute';
    testDiv.style.whiteSpace = 'nowrap';
    testDiv.style.font = window.getComputedStyle(element).font;
    document.body.appendChild(testDiv);

    let start = 0;
    let end = text.length;
    let mid = end;

    while (start < end) {
      mid = Math.floor((start + end + 1) / 2);
      testDiv.textContent = text.slice(0, mid) + '...';

      if (testDiv.offsetWidth <= maxWidth) {
        start = mid;
      } else {
        end = mid - 1;
      }
    }

    document.body.removeChild(testDiv);
    return text.slice(0, start) + (start < text.length ? '...' : '');
  }
}
