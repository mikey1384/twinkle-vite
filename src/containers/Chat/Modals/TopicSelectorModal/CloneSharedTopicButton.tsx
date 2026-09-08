import React, { useRef, useState } from 'react';
import { useAppContext, useChatContext } from '~/contexts';
import { borderRadius } from '~/constants/css';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import ScopedTheme from '~/theme/ScopedTheme';
import { useNavigate } from 'react-router-dom';
import { getStoredItem, setStoredItem } from '~/helpers/userDataHelpers';
import { chatTopicButtonStyle } from '../topicStyles';

export default function CloneSharedTopicButton({
  channelId,
  channelName,
  pathId,
  sharedTopicId,
  themeColor,
  onStartTopic
}: {
  channelId: number;
  channelName: string;
  pathId: string;
  sharedTopicId: number;
  themeColor: string;
  onStartTopic?: () => void;
}) {
  const navigate = useNavigate();
  const cloneSharedTopic = useAppContext(
    (v) => v.requestHelpers.cloneSharedTopic
  );
  const onUploadChatTopic = useChatContext((v) => v.actions.onUploadChatTopic);
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);
  const onSetThinkHardForTopic = useChatContext(
    (v) => v.actions.onSetThinkHardForTopic
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const submittingRef = useRef(false);

  return (
    <ScopedTheme theme={themeColor as any} style={chatTopicButtonStyle(themeColor)}>
      <button
        type="button"
        aria-busy={isSubmitting}
        disabled={!sharedTopicId || isSubmitting}
        className={css`
          display: flex;
          justify-content: center;
          align-items: center;
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
        onClick={handleCloneTopic}
      >
        <span>Start this Topic</span>
        {isSubmitting && (
          <Icon style={{ marginLeft: '0.7rem' }} icon="spinner" pulse />
        )}
      </button>
      {submitError && <p role="alert" style={{ margin: '10px 0 0', fontSize: '14px', color: '#b42318' }}>{submitError}</p>}
    </ScopedTheme>
  );

  async function handleCloneTopic() {
    if (!sharedTopicId || submittingRef.current) {
      return;
    }
    setIsSubmitting(true);
    submittingRef.current = true;
    setSubmitError('');
    try {
      const data = await cloneSharedTopic({
        channelId,
        sharedTopicId
      });
      if (!data?.subject) {
        setSubmitError('Could not start this shared topic. Please try again.');
        return;
      }
      const topic = {
        ...data.subject,
        subjectId: data.subject?.subjectId || data.subjectId
      };
      onUploadChatTopic({
        ...data,
        subject: topic,
        channelId
      });
      const subjectId = topic.subjectId || data.subjectId;
      onSetChannelState({
        channelId,
        newState: {
          selectedTab: 'all'
        }
      });
      if (subjectId) {
        const aiType =
          channelName?.toLowerCase() === 'ciel' ? 'ciel' : 'zero';
        onSetThinkHardForTopic({
          aiType,
          topicId: subjectId,
          thinkHard: false
        });
        // Also persist to localStorage
        try {
          const stored = getStoredItem('thinkHard', '{}');
          const parsed = JSON.parse(stored);
          const updated = {
            ...parsed,
            [aiType]: {
              ...(parsed[aiType] || {}),
              [subjectId]: false
            }
          };
          setStoredItem('thinkHard', JSON.stringify(updated));
        } catch {
          // Ignore localStorage errors
        }
      }
      navigate(`/chat/${pathId}`);
      onStartTopic?.();
    } catch (error) {
      console.error(error);
      setSubmitError('Could not start this shared topic. Please try again.');
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }
}
