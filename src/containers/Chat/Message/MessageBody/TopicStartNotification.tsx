import React, { useMemo, useRef, useEffect, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { getThemeRoles, ThemeName } from '~/theme/themes';
import { useAppContext, useChatContext } from '~/contexts';
import ScopedTheme from '~/theme/ScopedTheme';

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
  const themeName = useMemo<ThemeName>(
    () => (theme as ThemeName),
    [theme]
  );
  const themeRoles = useMemo(() => getThemeRoles(themeName), [themeName]);
  const topicTextColor = useMemo(() => {
    const role = themeRoles.topicText;
    const key = role?.color || themeName;
    const fn = Color[key as keyof typeof Color];
    return fn ? fn() : key;
  }, [themeRoles, themeName]);
  const topicShadowColor = useMemo(() => {
    const role = themeRoles.topicText;
    const key = role?.shadow;
    if (!key) return '';
    const fn = Color[key as keyof typeof Color];
    return fn ? fn() : key;
  }, [themeRoles]);
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
      <ScopedTheme theme={theme as any}>
        <div
          ref={containerRef}
          className={css`
            font-family: 'Roboto', sans-serif;
            color: var(--chat-text);
            background-color: var(--chat-title-bg);
            border-top: 1px solid var(--chat-border);
            border-bottom: 1px solid var(--chat-border);
            cursor: pointer;
            text-align: center;
            padding: 1rem;
            margin: 1rem 0;
            transition: background 0.3s ease;
            width: 100%;
            &:hover {
              background-color: var(--chat-hover-title-bg);
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
                color: ${topicTextColor};
                text-shadow: ${topicShadowColor
                  ? `0.05rem 0.05rem 0.05rem ${topicShadowColor}`
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
      </ScopedTheme>
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
