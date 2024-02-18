import React, { useMemo } from 'react';
import Icon from '~/components/Icon';
import { useChatContext } from '~/contexts';
import { css } from '@emotion/css';

export default function BackForwardButtons({
  channelId,
  topicHistory,
  currentTopicIndex
}: {
  channelId: number;
  topicHistory: number[];
  currentTopicIndex: number;
}) {
  const onEnterTopic = useChatContext((v) => v.actions.onEnterTopic);
  const canGoBack = useMemo(() => currentTopicIndex > 0, [currentTopicIndex]);
  const canGoForward = useMemo(
    () => currentTopicIndex < topicHistory?.length - 1,
    [currentTopicIndex, topicHistory]
  );

  return (
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
          cursor: ${canGoBack ? 'pointer' : 'not-allowed'};
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
          color: ${canGoBack ? 'inherit' : '#ccc'};
          &:hover {
            color: ${canGoBack ? '#007bff' : '#ccc'};
          }
        `}
        onClick={() => canGoBack && handleClick('back')}
      >
        <Icon icon="arrow-left" />
      </div>
      <div
        className={css`
          padding-right: 1.2rem;
          cursor: ${canGoForward ? 'pointer' : 'not-allowed'};
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-left: 0.5rem;
          color: ${canGoForward ? 'inherit' : '#ccc'}; // Grey out if disabled
          &:hover {
            color: ${canGoForward ? '#007bff' : '#ccc'};
          }
        `}
        onClick={() => canGoForward && handleClick('forward')}
      >
        <Icon icon="arrow-right" />
      </div>
    </div>
  );

  function handleClick(direction: 'back' | 'forward') {
    onEnterTopic({
      channelId,
      direction
    });
  }
}
