import React, { useEffect, useId, useRef, useState } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import StatusDots from '~/components/StatusDots';
import { Color } from '~/constants/css';
import useLumineDialogue, {
  type LumineDialogueState
} from './hooks/useLumineDialogue';
import {
  findLumineJobOutcome,
  latestLumineChatMessage,
  type LumineChatMessage,
  type LumineJobOutcome
} from './lumineDialogueMessages';

export default function LumineDialoguePhase({
  partner,
  selectedChannelId,
  topicId,
  scopeVisible,
  messages
}: {
  partner?: { id: number; username: string };
  selectedChannelId: number;
  topicId: number | null;
  scopeVisible: boolean;
  messages: LumineChatMessage[];
}) {
  const dialogueState = useLumineDialogue({
    partnerId: partner?.id,
    selectedChannelId,
    topicId,
    enabled: scopeVisible
  });
  // A finished job's transcript stays until the user closes it.
  const [dismissedJobId, setDismissedJobId] = useState(0);
  return dialogueState &&
    !(dialogueState.ended && dialogueState.jobId === dismissedJobId) ? (
    <LumineDialogueContent
      key={`${dialogueState.requesterUserId}:${dialogueState.jobId}`}
      dialogueState={dialogueState}
      messages={messages}
      onDismiss={() => setDismissedJobId(dialogueState.jobId)}
    />
  ) : null;
}

export function LumineDialogueContent({
  dialogueState,
  messages = [],
  onDismiss
}: {
  dialogueState: LumineDialogueState;
  messages?: LumineChatMessage[];
  onDismiss?: () => void;
}) {
  const transcriptId = useId();
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const queuedAt = dialogueState.dialogue.find(
    (entry) => entry.kind === 'approved_plan'
  )?.createdAt;
  const latestMessageId = queuedAt
    ? latestLumineChatMessage(messages, dialogueState, queuedAt - 1)
    : 0;
  const continuedMessageId = queuedAt
    ? latestLumineChatMessage(messages, dialogueState, queuedAt)
    : 0;
  const previousMessageId = useRef(latestMessageId);
  const [expanded, setExpanded] = useState(!continuedMessageId);
  useEffect(() => {
    // Also catch a send confirmed in the same second as the queue event.
    // Progress updates and polling never reopen or collapse the transcript.
    if (latestMessageId > previousMessageId.current) setExpanded(false);
    previousMessageId.current = Math.max(
      previousMessageId.current,
      latestMessageId
    );
  }, [latestMessageId]);
  const lastDialogueId =
    dialogueState?.dialogue[dialogueState.dialogue.length - 1]?.id || 0;

  useEffect(() => {
    const transcript = transcriptRef.current;
    if (!transcript) return;
    transcript.scrollTop = transcript.scrollHeight;
  }, [dialogueState?.jobId, expanded, lastDialogueId]);

  const outcome = dialogueState.ended
    ? findLumineJobOutcome(messages, dialogueState.jobId)
    : null;
  const waitingText = getWaitingText(dialogueState, outcome);

  return (
    <section
      aria-label="Talking with Lumine"
      className={css`
        margin: 0.8rem 1.5rem 1.5rem;
        padding: 1.2rem 1.4rem;
        border: 1px solid ${Color.darkCyan(0.45)};
        border-left: 0.35rem solid ${Color.darkCyan()};
        border-radius: 0.8rem;
        background: #fff;
      `}
    >
      <div
        className={css`
          display: flex;
          align-items: center;
          gap: 0.6rem;
        `}
      >
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={transcriptId}
          aria-label={`${expanded ? 'Minimize' : 'Expand'} Talking with Lumine`}
          onClick={() => setExpanded((value) => !value)}
          className={css`
            display: flex;
            align-items: center;
            gap: 0.8rem;
            width: 100%;
            padding: 0;
            border: 0;
            background: transparent;
            text-align: left;
            font: inherit;
            cursor: pointer;
            &:focus-visible {
              outline: 2px solid ${Color.darkCyan()};
              outline-offset: 0.4rem;
            }
          `}
        >
          <span
            aria-hidden="true"
            className={css`
              display: flex;
              align-items: center;
              justify-content: center;
              width: 32px;
              height: 32px;
              flex: 0 0 32px;
              border-radius: 50%;
              background: ${Color.darkCyan()};
              color: #fff;
              font-size: 1.4rem;
            `}
          >
            <Icon icon="comments" />
          </span>
          <span
            className={css`
              flex: 1;
              min-width: 0;
            `}
          >
            <span
              className={css`
                display: block;
                color: ${Color.darkCyan()};
                font-size: 1.4rem;
                font-weight: 650;
              `}
            >
              Talking with Lumine
            </span>
            {(!expanded || dialogueState.ended) && (
              <span
                className={css`
                  display: block;
                  margin-top: 0.2rem;
                  color: ${
                    dialogueState.ended && outcome === 'completed'
                      ? '#1e7f24'
                      : Color.darkGray()
                  };
                  font-size: 1.1rem;
                  line-height: 1.4;
                  overflow: hidden;
                  white-space: nowrap;
                  text-overflow: ellipsis;
                `}
              >
                {getCompactStatus(dialogueState, outcome)}
              </span>
            )}
          </span>
          {dialogueState.canProgress && !dialogueState.ended && (
            <StatusDots color={Color.darkCyan()} small />
          )}
          <span
            aria-hidden="true"
            className={css`
              color: ${Color.darkCyan()};
              font-size: 1.1rem;
              flex-shrink: 0;
            `}
          >
            <Icon icon={expanded ? 'chevron-up' : 'chevron-down'} />
          </span>
        </button>
        {dialogueState.ended && onDismiss && (
          <button
            type="button"
            aria-label="Close Talking with Lumine"
            onClick={onDismiss}
            className={css`
              display: flex;
              align-items: center;
              justify-content: center;
              width: 32px;
              height: 32px;
              flex: 0 0 32px;
              padding: 0;
              border: 1px solid var(--ui-border);
              border-radius: 50%;
              background: #fff;
              color: ${Color.darkGray()};
              font-size: 1.2rem;
              cursor: pointer;
              &:hover {
                color: ${Color.black()};
              }
              &:focus-visible {
                outline: 2px solid ${Color.darkCyan()};
                outline-offset: 0.2rem;
              }
            `}
          >
            <Icon icon="times" />
          </button>
        )}
      </div>

      <div id={transcriptId} hidden={!expanded}>
        <div
          ref={transcriptRef}
          role="log"
          aria-label="Lumine dialogue"
          aria-live="polite"
          aria-relevant="additions text"
          className={css`
            display: flex;
            flex-direction: column;
            gap: 0.8rem;
            max-height: 22rem;
            overflow-y: auto;
            margin-top: 1rem;
            padding-right: 0.25rem;
          `}
        >
          {dialogueState.dialogue.map((entry) => (
            <div
              key={entry.id}
              className={css`
                align-self: ${
                  entry.direction === 'lumine_to_persona'
                    ? 'flex-end'
                    : 'flex-start'
                };
                width: min(92%, 54rem);
              `}
            >
              <div
                className={css`
                  color: ${Color.darkGray()};
                  font-size: 1rem;
                  font-weight: 650;
                  margin: 0 0 0.3rem 0.2rem;
                `}
              >
                {entry.direction === 'lumine_to_persona'
                  ? `Lumine → ${dialogueState.personaName}`
                  : `${dialogueState.personaName} → Lumine`}
              </div>
              <div
                className={css`
                  padding: 0.85rem 1rem;
                  border: 1px solid
                    ${
                      entry.direction === 'lumine_to_persona'
                        ? Color.darkCyan(0.28)
                        : 'var(--ui-border)'
                    };
                  border-radius: 0.7rem;
                  background: ${
                    entry.direction === 'lumine_to_persona'
                      ? '#edf8f8'
                      : '#f5f6f8'
                  };
                  color: #303640;
                  font-size: 1.1rem;
                  line-height: 1.5;
                  white-space: pre-wrap;
                  overflow-wrap: anywhere;
                `}
              >
                {entry.message}
              </div>
            </div>
          ))}
        </div>

        <div
          className={css`
            color: ${
              dialogueState.ended
                ? outcome === 'completed'
                  ? '#1e7f24'
                  : Color.darkGray()
                : dialogueState.canProgress
                  ? Color.darkCyan()
                  : Color.gray()
            };
            font-size: 1.1rem;
            font-weight: 600;
            margin-top: 1rem;
          `}
        >
          {waitingText}
        </div>
      </div>
    </section>
  );
}

function getCompactStatus(
  state: LumineDialogueState,
  outcome: LumineJobOutcome | null
) {
  if (state.ended) {
    if (outcome === 'completed') return 'Finished · Result is in the chat';
    if (outcome === 'failed') return 'Stopped · Details are in the chat';
    return 'No longer active';
  }
  if (!state.canProgress) return 'Connection paused';
  if (state.jobStatus === 'queued') return 'Queued · You can keep chatting';
  if (state.jobStatus === 'waiting_user') return 'Waiting for your reply';
  return 'Working · You can keep chatting';
}

function getWaitingText(
  state: LumineDialogueState,
  outcome: LumineJobOutcome | null
) {
  if (state.ended) {
    if (outcome === 'completed') {
      return `Lumine finished this job. ${state.personaName} shared the result in the chat.`;
    }
    if (outcome === 'failed') {
      return `Lumine couldn’t finish this job. ${state.personaName} explained what happened in the chat.`;
    }
    return 'This Lumine job is no longer active. Your project and this conversation are safe.';
  }
  if (!state.canProgress) {
    return 'Lumine’s connection paused. Your project and this conversation are safe.';
  }
  if (state.jobStatus === 'queued') {
    return `${state.personaName} sent the plan. Waiting for Lumine to join…`;
  }
  if (state.jobStatus === 'waiting_user') {
    return `Lumine is waiting for your reply through ${state.personaName}.`;
  }
  return `Lumine and ${state.personaName} are working together now.`;
}
