import React, { useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { CHAT_ID_BASE_NUMBER } from '~/constants/defaultValues';
import zero from '~/assets/zero.png';
import ciel from '~/assets/ciel.png';

export default function CloneButtons({
  sharedTopicId,
  sharedTopicTitle,
  uploaderId,
  onCloneSuccess,
  style
}: {
  sharedTopicId: number;
  sharedTopicTitle?: string;
  uploaderId: number;
  onCloneSuccess?: (data: {
    sharedTopicId: number;
    target: 'zero' | 'ciel';
    topicId: number;
    channelId: number;
    title: string;
  }) => void;
  style?: React.CSSProperties;
}) {
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
  const cloneSharedSystemPrompt = useAppContext(
    (v) => v.requestHelpers.cloneSharedSystemPrompt
  );
  const onSetThinkHardForTopic = useChatContext(
    (v) => v.actions.onSetThinkHardForTopic
  );
  const onUpdateSelectedChannelId = useChatContext(
    (v) => v.actions.onUpdateSelectedChannelId
  );
  const onEnterTopic = useChatContext((v) => v.actions.onEnterTopic);
  const [submitting, setSubmitting] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState('');

  const isOwnTopic = uploaderId === userId;

  if (!userId || isOwnTopic) {
    return null;
  }

  return (
    <div
      className={css`
        display: flex;
        gap: 0.6rem;
        flex-wrap: wrap;
      `}
      style={style}
    >
      {error && (
        <div
          className={css`
            width: 100%;
            color: red;
            font-size: 1.2rem;
            margin-bottom: 0.5rem;
          `}
        >
          {error}
        </div>
      )}
      <Button
        color="logoBlue"
        variant="solid"
        tone="raised"
        onClick={() => handleClone('zero')}
        disabled={submitting.zero || submitting.ciel}
      >
        {submitting.zero ? (
          <>
            <Icon style={{ marginRight: '0.5rem' }} icon="spinner" pulse />
            Cloning to Zero...
          </>
        ) : (
          <>
            <img
              src={zero}
              alt="Zero"
              className={css`
                width: 2rem;
                height: 2rem;
                border-radius: 50%;
                margin-right: 0.5rem;
                object-fit: contain;
                background: #fff;
              `}
            />
            Clone to Zero
          </>
        )}
      </Button>
      <Button
        color="purple"
        variant="solid"
        tone="raised"
        onClick={() => handleClone('ciel')}
        disabled={submitting.zero || submitting.ciel}
      >
        {submitting.ciel ? (
          <>
            <Icon style={{ marginRight: '0.5rem' }} icon="spinner" pulse />
            Cloning to Ciel...
          </>
        ) : (
          <>
            <img
              src={ciel}
              alt="Ciel"
              className={css`
                width: 2rem;
                height: 2rem;
                border-radius: 50%;
                margin-right: 0.5rem;
                object-fit: contain;
                background: #fff;
              `}
            />
            Clone to Ciel
          </>
        )}
      </Button>
    </div>
  );

  async function handleClone(target: 'zero' | 'ciel') {
    if (!sharedTopicId || submitting[target]) return;
    setError('');
    setSubmitting((prev) => ({ ...prev, [target]: true }));
    try {
      const data = await cloneSharedSystemPrompt({ sharedTopicId, target });
      if (
        typeof data?.subjectId === 'number' &&
        typeof data?.channelId === 'number'
      ) {
        onCloneSuccess?.({
          sharedTopicId,
          target,
          topicId: data.subjectId,
          channelId: data.channelId,
          title: sharedTopicTitle || ''
        });

        // Set thinkHard to false for the new topic
        onSetThinkHardForTopic({
          aiType: target,
          topicId: data.subjectId,
          thinkHard: false
        });
        // Also persist to localStorage
        try {
          const stored = localStorage.getItem('thinkHard') || '{}';
          const parsed = JSON.parse(stored);
          const updated = {
            ...parsed,
            [target]: {
              ...(parsed[target] || {}),
              [data.subjectId]: false
            }
          };
          localStorage.setItem('thinkHard', JSON.stringify(updated));
        } catch {
          // Ignore localStorage errors
        }

        // Navigate to the topic chat
        const pathId = Number(data.channelId) + Number(CHAT_ID_BASE_NUMBER);
        onUpdateSelectedChannelId(data.channelId);
        onEnterTopic({ channelId: data.channelId, topicId: data.subjectId });
        navigate(`/chat/${pathId}/topic/${data.subjectId}`);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          'Failed to clone shared prompt'
      );
    } finally {
      setSubmitting((prev) => ({ ...prev, [target]: false }));
    }
  }
}
