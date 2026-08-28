import React, { useEffect, useRef } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import StatusDots from '~/components/StatusDots';
import { Color } from '~/constants/css';
import useLumineDialogue, {
  type LumineDialogueState
} from './hooks/useLumineDialogue';

export default function LumineDialoguePhase({
  partner,
  selectedChannelId,
  topicId,
  scopeVisible
}: {
  partner?: { id: number; username: string };
  selectedChannelId: number;
  topicId: number | null;
  scopeVisible: boolean;
}) {
  const dialogueState = useLumineDialogue({
    partnerId: partner?.id,
    selectedChannelId,
    topicId,
    enabled: scopeVisible
  });
  return dialogueState ? (
    <LumineDialogueContent dialogueState={dialogueState} />
  ) : null;
}

export function LumineDialogueContent({
  dialogueState
}: {
  dialogueState: LumineDialogueState;
}) {
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const lastDialogueId =
    dialogueState?.dialogue[dialogueState.dialogue.length - 1]?.id || 0;

  useEffect(() => {
    const transcript = transcriptRef.current;
    if (!transcript) return;
    transcript.scrollTop = transcript.scrollHeight;
  }, [dialogueState?.jobId, lastDialogueId]);

  const waitingText = getWaitingText(dialogueState);

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
          gap: 0.8rem;
        `}
      >
        <div
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
        </div>
        <div
          className={css`
            flex: 1;
            min-width: 0;
          `}
        >
          <div
            className={css`
              color: ${Color.darkCyan()};
              font-size: 1.4rem;
              font-weight: 650;
            `}
          >
            Talking with Lumine
          </div>
        </div>
        {dialogueState.canProgress && (
          <StatusDots color={Color.darkCyan()} small />
        )}
      </div>

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
              align-self: ${entry.direction === 'lumine_to_persona'
                ? 'flex-end'
                : 'flex-start'};
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
                  ${entry.direction === 'lumine_to_persona'
                    ? Color.darkCyan(0.28)
                    : 'var(--ui-border)'};
                border-radius: 0.7rem;
                background: ${entry.direction === 'lumine_to_persona'
                  ? '#edf8f8'
                  : '#f5f6f8'};
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
          color: ${dialogueState.canProgress
            ? Color.darkCyan()
            : Color.gray()};
          font-size: 1.1rem;
          font-weight: 600;
          margin-top: 1rem;
        `}
      >
        {waitingText}
      </div>
    </section>
  );
}

function getWaitingText(state: LumineDialogueState) {
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
