import React, { useState } from 'react';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { borderRadius } from '~/constants/css';
import { socket } from '~/constants/sockets/api';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import ScopedTheme from '~/theme/ScopedTheme';

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
  const userId = useKeyContext((v) => v.myState.userId);
  const username = useKeyContext((v) => v.myState.username);
  const profilePicUrl = useKeyContext((v) => v.myState.profilePicUrl);
  const cloneSharedTopic = useAppContext(
    (v) => v.requestHelpers.cloneSharedTopic
  );
  const onUploadChatTopic = useChatContext((v) => v.actions.onUploadChatTopic);
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <ScopedTheme theme={themeColor as any}>
      <button
        disabled={!sharedTopicId || isSubmitting}
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
        onClick={handleCloneTopic}
      >
        <span>Start this Topic</span>
        {isSubmitting && (
          <Icon style={{ marginLeft: '0.7rem' }} icon="spinner" pulse />
        )}
      </button>
    </ScopedTheme>
  );

  async function handleCloneTopic() {
    if (!sharedTopicId || isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    try {
      const data = await cloneSharedTopic({
        channelId,
        sharedTopicId
      });
      if (!data?.subject) {
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
      const timeStamp = topic.timeStamp || Math.floor(Date.now() / 1000);
      const message = {
        profilePicUrl: topic.profilePicUrl || profilePicUrl,
        userId: topic.userId || userId,
        username: topic.username || username,
        content: topic.content,
        isSubject: true,
        channelId,
        subjectId,
        timeStamp,
        isNewMessage: true,
        id: topic.id
      };
      socket.emit('new_subject', {
        isFeatured: data.isFeatured,
        topicObj: topic,
        subject: topic,
        message,
        channelName,
        channelId,
        pathId
      });
      onSetChannelState({
        channelId,
        newState: {
          selectedTab: 'all'
        }
      });
      onStartTopic?.();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }
}
