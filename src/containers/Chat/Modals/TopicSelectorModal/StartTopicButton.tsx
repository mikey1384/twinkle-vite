import React, { useMemo, useState } from 'react';
import { useAppContext, useChatContext } from '~/contexts';
import { borderRadius } from '~/constants/css';
import { css } from '@emotion/css';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import Icon from '~/components/Icon';
import ScopedTheme from '~/theme/ScopedTheme';
import { useNavigate } from 'react-router-dom';

export default function StartTopicButton({
  channelId,
  topicTitle,
  themeColor,
  onStartTopic,
  pathId
}: {
  channelId: number;
  topicTitle: string;
  themeColor: string;
  onStartTopic?: () => void;
  pathId: string;
}) {
  const navigate = useNavigate();
  const uploadChatTopic = useAppContext(
    (v) => v.requestHelpers.uploadChatTopic
  );
  const onUploadChatTopic = useChatContext((v) => v.actions.onUploadChatTopic);
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleIsEmpty = useMemo(() => stringIsEmpty(topicTitle), [topicTitle]);

  return (
    <ScopedTheme theme={themeColor as any}>
      <button
        disabled={titleIsEmpty || isSubmitting}
        className={css`
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 2rem;
          padding: 1rem 2rem;
          font-size: 1.5rem;
          font-weight: bold;
          color: var(--theme-text);
          background-color: var(--theme-bg);
          border: 1px solid var(--theme-border);
          border-radius: ${borderRadius};
          cursor: pointer;
          transition: background-color 0.3s ease, border-color 0.3s ease;

          &:hover:not(:disabled) {
            background-color: var(--theme-hover-bg);
            border-color: var(--theme-border);
          }

          &:disabled {
            cursor: not-allowed;
            opacity: 0.5;
            background-color: var(--theme-disabled-bg);
            border-color: var(--theme-disabled-border);
          }
        `}
        onClick={() => handleStartTopic(topicTitle)}
      >
        <span>Start this Topic</span>
        {isSubmitting && (
          <Icon style={{ marginLeft: '0.7rem' }} icon="spinner" pulse />
        )}
      </button>
    </ScopedTheme>
  );

  async function handleStartTopic(text: string) {
    if (!isSubmitting) {
      setIsSubmitting(true);
      try {
        const data = await uploadChatTopic({
          content: text,
          channelId,
          isFeatured: false
        });
        onUploadChatTopic({
          ...data,
          channelId
        });
        onSetChannelState({
          channelId,
          newState: {
            selectedTab: 'all'
          }
        });
        navigate(`/chat/${pathId}`);
        onStartTopic?.();
      } catch (error) {
        console.error(error);
      } finally {
        setIsSubmitting(false);
      }
    }
  }
}
