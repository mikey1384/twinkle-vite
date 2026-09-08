import React, { useMemo, useRef, useState } from 'react';
import { useAppContext, useChatContext } from '~/contexts';
import { borderRadius } from '~/constants/css';
import { css } from '@emotion/css';
import { exceedsCharLimit, stringIsEmpty } from '~/helpers/stringHelpers';
import Icon from '~/components/Icon';
import ScopedTheme from '~/theme/ScopedTheme';
import { useNavigate } from 'react-router-dom';
import { chatTopicButtonStyle } from '../topicStyles';

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
  const [submitError, setSubmitError] = useState('');
  const submittingRef = useRef(false);
  const titleIsEmpty = useMemo(() => stringIsEmpty(topicTitle), [topicTitle]);
  const titleIsTooLong = useMemo(() => !!exceedsCharLimit({
    contentType: 'chat', inputType: 'topic', text: topicTitle
  }), [topicTitle]);

  return (
    <ScopedTheme theme={themeColor as any} style={chatTopicButtonStyle(themeColor)}>
      <button
        type="button"
        aria-busy={isSubmitting}
        disabled={titleIsEmpty || titleIsTooLong || isSubmitting}
        className={css`
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 2rem;
          padding: 1rem 2rem;
          min-height: 44px;
          font-size: max(14px, 1.5rem);
          font-weight: bold;
          color: var(--chat-topic-button-text);
          background-color: var(--theme-bg);
          border: 1px solid var(--theme-border);
          border-radius: ${borderRadius};
          cursor: pointer;
          transition: background-color 0.3s ease, border-color 0.3s ease;

          &:hover:not(:disabled) {
            color: var(--chat-topic-button-hover-text);
            background-color: var(--theme-hover-bg);
            border-color: var(--theme-border);
          }

          &:focus-visible {
            outline: 2px solid #334155;
            outline-offset: 3px;
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
      {submitError && <p role="alert" style={{ margin: '10px 0 0', fontSize: '14px', color: '#b42318' }}>{submitError}</p>}
    </ScopedTheme>
  );

  async function handleStartTopic(text: string) {
    if (!submittingRef.current && !stringIsEmpty(text) && !exceedsCharLimit({
      contentType: 'chat', inputType: 'topic', text
    })) {
      submittingRef.current = true;
      setIsSubmitting(true);
      setSubmitError('');
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
        setSubmitError('Could not start this topic. Please try again.');
      } finally {
        submittingRef.current = false;
        setIsSubmitting(false);
      }
    }
  }
}
