import React, { useMemo, useState } from 'react';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { borderRadius, getThemeStyles } from '~/constants/css';
import { socket } from '~/constants/sockets/api';
import { css } from '@emotion/css';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import Icon from '~/components/Icon';

export default function StartTopicButton({
  channelId,
  channelName,
  topicTitle,
  themeColor,
  onStartTopic,
  pathId
}: {
  channelId: number;
  channelName: string;
  topicTitle: string;
  themeColor: string;
  onStartTopic?: () => void;
  pathId: string;
}) {
  const themeStyles = getThemeStyles(themeColor);
  const { userId, username, profilePicUrl } = useKeyContext((v) => v.myState);
  const uploadChatTopic = useAppContext(
    (v) => v.requestHelpers.uploadChatTopic
  );
  const onUploadChatTopic = useChatContext((v) => v.actions.onUploadChatTopic);
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleIsEmpty = useMemo(() => stringIsEmpty(topicTitle), [topicTitle]);

  return (
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
        color: ${themeStyles.text};
        background-color: ${themeStyles.bg};
        border: 1px solid ${themeStyles.border};
        border-radius: ${borderRadius};
        cursor: pointer;
        transition: background-color 0.3s ease;

        &:hover:not(:disabled) {
          background-color: ${themeStyles.hoverBg};
          border-color: ${themeStyles.border};
        }

        &:disabled {
          cursor: not-allowed;
          opacity: 0.5;
          background-color: ${themeStyles.disabledBg};
          border-color: ${themeStyles.disabledBorder};
        }
      `}
      onClick={() => handleStartTopic(topicTitle)}
    >
      <span>Start this Topic</span>
      {isSubmitting && (
        <Icon style={{ marginLeft: '0.7rem' }} icon="spinner" pulse />
      )}
    </button>
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
        const timeStamp = Math.floor(Date.now() / 1000);
        const topic = {
          id: data.subject.id,
          isSubject: true,
          subjectId: data.subjectId,
          userId,
          username,
          reloadedBy: null,
          reloaderName: null,
          uploader: { id: userId, username },
          content: text,
          timeStamp
        };
        onUploadChatTopic({
          ...data,
          subject: topic,
          channelId
        });
        const message = {
          profilePicUrl,
          userId,
          username,
          content: text,
          isSubject: true,
          channelId,
          subjectId: data.subjectId,
          timeStamp,
          isNewMessage: true
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
}
