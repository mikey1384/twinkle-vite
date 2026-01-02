import React, { useEffect, useMemo, useRef, useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import ScopedTheme from '~/theme/ScopedTheme';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { CHAT_ID_BASE_NUMBER } from '~/constants/defaultValues';
import { Color } from '~/constants/css';
import zero from '~/assets/zero.png';
import ciel from '~/assets/ciel.png';

type CloneTarget = 'zero' | 'ciel';

interface CloneEntry {
  target: CloneTarget;
  channelId: number;
  topicId: number;
}

export default function CloneButtons({
  sharedTopicId,
  sharedTopicTitle,
  uploaderId,
  myClones = [],
  onCloneSuccess,
  style
}: {
  sharedTopicId: number;
  sharedTopicTitle?: string;
  uploaderId: number;
  myClones?: CloneEntry[];
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
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const scopedTheme = useMemo(() => profileTheme as any, [profileTheme]);
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
  const [newClones, setNewClones] = useState<CloneEntry[]>([]);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<{ [key: string]: number }>({});
  const progressIntervalRef = useRef<{ [key: string]: number }>({});

  // Progress bar animation - rises slowly over ~50 seconds
  useEffect(() => {
    const targets: CloneTarget[] = ['zero', 'ciel'];
    const currentIntervals = progressIntervalRef.current;
    for (const target of targets) {
      if (submitting[target] && !currentIntervals[target]) {
        setProgress((prev) => ({ ...prev, [target]: 0 }));
        // Increment ~1.6% every second to reach ~80% in 50 seconds
        // (we never reach 100% - that happens on success)
        currentIntervals[target] = window.setInterval(() => {
          setProgress((prev) => {
            const current = prev[target] || 0;
            // Slow down as we approach 90%
            const increment = current < 50 ? 1.6 : current < 75 ? 1 : 0.5;
            return { ...prev, [target]: Math.min(current + increment, 90) };
          });
        }, 1000);
      } else if (!submitting[target] && currentIntervals[target]) {
        clearInterval(currentIntervals[target]);
        delete currentIntervals[target];
        setProgress((prev) => ({ ...prev, [target]: 0 }));
      }
    }
    return () => {
      for (const target of targets) {
        if (currentIntervals[target]) {
          clearInterval(currentIntervals[target]);
        }
      }
    };
  }, [submitting]);

  const isOwnTopic = uploaderId === userId;

  // Combine API clones with newly created clones from this session
  const existingClones = useMemo(() => {
    const cloneMap: Partial<Record<CloneTarget, { channelId: number; topicId: number }>> = {};
    for (const clone of myClones) {
      cloneMap[clone.target] = { channelId: clone.channelId, topicId: clone.topicId };
    }
    for (const clone of newClones) {
      cloneMap[clone.target] = { channelId: clone.channelId, topicId: clone.topicId };
    }
    return cloneMap;
  }, [myClones, newClones]);

  if (!userId || isOwnTopic) {
    return null;
  }

  const targetConfig = {
    zero: { label: 'Zero', color: 'logoBlue', icon: zero },
    ciel: { label: 'Ciel', color: 'purple', icon: ciel }
  } as const;
  const cloneTargets: CloneTarget[] = ['zero', 'ciel'];
  const hasCloneForTarget = (clone?: { channelId: number; topicId: number }) =>
    typeof clone?.channelId === 'number' && typeof clone?.topicId === 'number';
  const existingCloneTargets = cloneTargets.filter((target) =>
    hasCloneForTarget(existingClones[target])
  );
  const hasAnyClone = existingCloneTargets.length > 0;
  const compactRowClass = css`
    width: 100%;
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  `;

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
      {hasAnyClone ? (
        <>
          {existingCloneTargets.map((target) => renderChatButton(target))}
          <div className={compactRowClass}>
            {cloneTargets.map((target) => renderCloneButton(target, true))}
          </div>
        </>
      ) : (
        <>
          {cloneTargets.map((target) => renderCloneButton(target, false))}
        </>
      )}
    </div>
  );

  function renderChatButton(target: CloneTarget) {
    const clone = existingClones[target];
    if (!hasCloneForTarget(clone)) return null;
    const { color, icon, label } = targetConfig[target];
    return (
      <Button
        key={`chat-${target}`}
        color={color}
        variant="solid"
        tone="raised"
        onClick={() => handleGoToClone(target)}
        disabled={submitting.zero || submitting.ciel}
      >
        <img
          src={icon}
          alt={label}
          className={css`
            width: 2rem;
            height: 2rem;
            border-radius: 50%;
            margin-right: 0.5rem;
            object-fit: contain;
            background: #fff;
          `}
        />
        Chat with {label}
        <Icon icon="chevron-right" />
      </Button>
    );
  }

  function renderCloneButton(target: CloneTarget, compact: boolean) {
    const { color, icon, label } = targetConfig[target];
    const isSubmitting = submitting[target];
    const currentProgress = progress[target] || 0;
    const labelText = `Clone to ${label}`;
    const loadingText = `Cloning to ${label}...`;

    return (
      <div
        key={`${compact ? 'compact' : 'main'}-${target}`}
        className={css`
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          ${compact ? 'flex: 1;' : ''}
        `}
      >
        <Button
          color={color}
          variant={compact ? 'ghost' : 'solid'}
          tone={compact ? 'flat' : 'raised'}
          size={compact ? 'sm' : 'md'}
          uppercase={!compact}
          onClick={() => handleClone(target)}
          disabled={submitting.zero || submitting.ciel}
          style={{ width: compact ? '100%' : undefined }}
        >
          {isSubmitting ? (
            <>
              <Icon
                style={{ marginRight: compact ? '0.4rem' : '0.5rem' }}
                icon="spinner"
                pulse
              />
              {loadingText}
            </>
          ) : compact ? (
            labelText
          ) : (
            <>
              <img
                src={icon}
                alt={label}
                className={css`
                  width: 2rem;
                  height: 2rem;
                  border-radius: 50%;
                  margin-right: 0.5rem;
                  object-fit: contain;
                  background: #fff;
                `}
              />
              {labelText}
            </>
          )}
        </Button>
        {isSubmitting && (
          <ScopedTheme theme={scopedTheme} roles={['cloneProgress']}>
            <div
              className={css`
                width: 100%;
                height: 4px;
                background: ${Color.highlightGray()};
                border-radius: 2px;
                overflow: hidden;
              `}
            >
              <div
                className={css`
                  height: 100%;
                  background: var(--role-cloneProgress-color, ${Color.logoBlue()});
                  border-radius: 2px;
                  transition: width 0.3s ease-out;
                `}
                style={{ width: `${currentProgress}%` }}
              />
            </div>
          </ScopedTheme>
        )}
      </div>
    );
  }

  function handleGoToClone(target: CloneTarget) {
    const clone = existingClones[target];
    if (!hasCloneForTarget(clone)) return;
    const pathId = Number(clone!.channelId) + Number(CHAT_ID_BASE_NUMBER);
    onUpdateSelectedChannelId(clone!.channelId);
    onEnterTopic({ channelId: clone!.channelId, topicId: clone!.topicId });
    navigate(`/chat/${pathId}/topic/${clone!.topicId}`);
  }

  async function handleClone(target: CloneTarget) {
    if (!sharedTopicId || submitting[target]) return;
    setError('');
    setSubmitting((prev) => ({ ...prev, [target]: true }));
    try {
      const data = await cloneSharedSystemPrompt({ sharedTopicId, target });
      if (
        typeof data?.subjectId === 'number' &&
        typeof data?.channelId === 'number'
      ) {
        // Store new clone in local state
        setNewClones((prev) => [
          ...prev.filter((c) => c.target !== target),
          { target, channelId: data.channelId, topicId: data.subjectId }
        ]);

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
