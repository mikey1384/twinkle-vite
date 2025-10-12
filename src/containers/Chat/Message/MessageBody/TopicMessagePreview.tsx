import React, { useMemo, useRef, useEffect, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { useAppContext, useChatContext } from '~/contexts';
import Thumbnail from '~/components/Thumbnail';
import { Color, mobileMaxWidth } from '~/constants/css';
import {
  addCommasToNumber,
  stringIsEmpty,
  isValidSpoiler,
  isUnicodeArt,
  getFileInfoFromFileName
} from '~/helpers/stringHelpers';
import { returnTheme } from '~/helpers';
import { cloudFrontURL } from '~/constants/defaultValues';
import ScopedTheme from '~/theme/ScopedTheme';

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
  fileName,
  filePath,
  thumbUrl,
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
  thumbUrl: string;
  filePath: string;
  fileName: string;
  topicObj: { id: number; content: string };
  username: string;
}) {
  const updateLastTopicId = useAppContext(
    (v) => v.requestHelpers.updateLastTopicId
  );
  const onEnterTopic = useChatContext((v) => v.actions.onEnterTopic);
  const {
    topicText: { color: topicTextColor, shadow: topicShadowColor }
  } = useMemo(() => returnTheme(theme), [theme]);
  const contentPreviewShown = useMemo(() => {
    return (
      !stringIsEmpty(content) &&
      !isValidSpoiler(content) &&
      !isUnicodeArt(content)
    );
  }, [content]);
  const rewardDetails = useMemo(() => {
    if (rewardAmount) {
      return `rewarded ${targetMessage?.username} ${addCommasToNumber(
        rewardAmount
      )} XP ${content}`;
    }
    return '';
  }, [content, rewardAmount, targetMessage?.username]);

  const contentRef = useRef<HTMLSpanElement>(null);
  const topicRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [truncatedContent, setTruncatedContent] = useState('\u200B');
  const [truncatedTopic, setTruncatedTopic] = useState(topicObj.content);

  useEffect(() => {
    setTruncatedContent(truncateText(content, contentRef));
    setTruncatedTopic(truncateText(topicObj.content, topicRef));
  }, [content, topicObj.content]);

  const contentPreview = useMemo(() => {
    return rewardDetails || truncatedContent;
  }, [rewardDetails, truncatedContent]);

  const isVideo = useMemo(() => {
    return getFileInfoFromFileName(fileName)?.fileType === 'video';
  }, [fileName]);

  const appliedThumbUrl = useMemo(() => {
    if (getFileInfoFromFileName(fileName)?.fileType === 'image') {
      return `${cloudFrontURL}/attachments/chat/${filePath}/${fileName}`;
    }
    return thumbUrl;
  }, [fileName, filePath, thumbUrl]);

  return (
    <ErrorBoundary componentPath="Chat/Message/MessageBody/TopicMessagePreview">
      <ScopedTheme theme={theme as any}>
        <div
          ref={containerRef}
          className={css`
            font-family: 'Roboto', sans-serif;
            font-size: ${contentPreviewShown ? '1.5rem' : '1.7rem'};
            color: var(--chat-text);
            background-color: var(--chat-bg);
            border-top: 1px solid var(--chat-border);
            border-bottom: 1px solid var(--chat-border);
            cursor: pointer;
            padding: 1rem 0;
            margin-top: ${prevMessageHasTopic ? '0.5rem' : '1rem'};
            margin-bottom: ${nextMessageHasTopic ? '0.5rem' : '1rem'};
            transition: background 0.3s ease;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            min-height: ${appliedThumbUrl ? '8rem' : '6rem'};
            &:hover {
              background-color: var(--chat-hover-bg);
            }
            @media (max-width: ${mobileMaxWidth}) {
              padding: 1rem 3rem;
            }
          `}
          onClick={handleClick}
        >
          <div
            className={css`
              position: absolute;
              left: 50%;
              top: 50%;
              transform: translate(-50%, -50%);
              width: 35%;
              max-width: 15rem;
              height: 85%;
              opacity: 0.25;
              pointer-events: none;
              overflow: hidden;
            `}
          >
            <Thumbnail playButtonShown={isVideo} thumbUrl={appliedThumbUrl} />
          </div>
          <div
            className={css`
              z-index: 1;
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
            <div>
              {!contentPreviewShown ? `${username} posted a message on ` : ''}
              <b
                ref={topicRef}
                className={css`
                  color: ${Color[topicTextColor]()};
                  ${topicShadowColor
                    ? `text-shadow: 0.05rem 0.05rem 0.05rem ${Color[
                        topicShadowColor
                      ]()};`
                    : ''}
                `}
              >
                {truncatedTopic}
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
                  position: relative;
                  z-index: 1;
                  @media (max-width: ${mobileMaxWidth}) {
                    font-size: 1.2rem;
                  }
                `}
              >
                {username}:{' '}
                <span
                  ref={contentRef}
                  className={css`
                    font-family: 'Noto Sans', Helvetica, sans-serif, Arial;
                  `}
                >
                  {contentPreview}
                </span>
              </div>
            )}
          </div>
        </div>
      </ScopedTheme>
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

  function truncateText(
    text: string,
    elementRef: React.RefObject<HTMLSpanElement>
  ) {
    if (!elementRef.current || !containerRef.current) return text;

    const containerWidth = containerRef.current.offsetWidth;
    const maxWidth = containerWidth * 0.75;

    const element = elementRef.current;
    const testDiv = document.createElement('span');
    testDiv.style.visibility = 'hidden';
    testDiv.style.position = 'absolute';
    testDiv.style.whiteSpace = 'nowrap';
    testDiv.style.font = window.getComputedStyle(element).font;
    if (document.body) {
      document.body.appendChild(testDiv);
    }

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

    if (document.body) {
      document.body.removeChild(testDiv);
    }
    return text.slice(0, start) + (start < text.length ? '...' : '');
  }
}
