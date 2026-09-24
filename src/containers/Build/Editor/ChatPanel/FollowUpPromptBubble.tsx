import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';

export default function FollowUpPromptBubble({
  question,
  yesLabel = 'Yes',
  onceLabel,
  noLabel = 'No',
  busy = false,
  onYes,
  onOnce,
  onNo,
  onRedirect
}: {
  question: string;
  // An action card names what each press does instead of a bare Yes:
  // "Yes, switch to Medium!" · "Just this once" · "No thanks".
  yesLabel?: string;
  onceLabel?: string;
  noLabel?: string;
  busy?: boolean;
  onYes: () => void;
  onOnce?: () => void;
  onNo: () => void;
  onRedirect: () => void;
}) {
  const onceShown = Boolean(onceLabel && onOnce);
  return (
    <div
      className={css`
        align-self: flex-start;
        max-width: 85%;
        padding: 0.85rem 1.05rem;
        border-radius: 12px;
        background: var(--chat-bg);
        color: var(--chat-text);
        border: 1px solid var(--ui-border);
        word-break: break-word;
        font-size: var(--build-workshop-message-font-size);
        line-height: 1.48;
        display: grid;
        gap: 0.65rem;
      `}
    >
      {question ? (
        // Lumine asks in its own voice, like Zero and Ciel's approval
        // prompts: most creators are 8-13 and skip bare system questions.
        <div
          className={css`
            display: flex;
            gap: 0.7rem;
            align-items: flex-start;
          `}
        >
          <div
            aria-hidden
            className={css`
              flex-shrink: 0;
              width: 2.8rem;
              height: 2.8rem;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              background: ${Color.logoBlue(0.12)};
              color: ${Color.logoBlue()};
              font-size: 1.3rem;
            `}
          >
            <Icon icon="sparkles" />
          </div>
          <div>
            <div
              className={css`
                font-weight: 800;
                font-size: 0.85em;
                color: ${Color.logoBlue()};
              `}
            >
              Lumine
            </div>
            <div
              className={css`
                font-weight: 700;
              `}
            >
              {question}
            </div>
          </div>
        </div>
      ) : null}
      <div
        className={css`
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
        `}
      >
        <button
          type="button"
          onClick={onYes}
          disabled={busy}
          className={css`
            border: 1px solid ${Color.green(0.24)};
            background: ${Color.green(0.12)};
            color: ${Color.green()};
            border-radius: 999px;
            padding: 0.5rem 0.9rem;
            font-size: var(--build-workshop-choice-font-size);
            font-weight: 800;
            cursor: pointer;
            transition:
              background-color 0.16s ease,
              border-color 0.16s ease,
              color 0.16s ease;
            &:hover,
            &:focus-visible {
              border-color: ${Color.green(0.42)};
              background: ${Color.green(0.2)};
              color: ${Color.green()};
            }
            &:disabled {
              opacity: 0.6;
              cursor: default;
            }
          `}
        >
          {yesLabel}
        </button>
        {onceShown ? (
          <button
            type="button"
            onClick={onOnce}
            disabled={busy}
            className={css`
              border: 1px solid ${Color.logoBlue(0.24)};
              background: ${Color.logoBlue(0.1)};
              color: ${Color.logoBlue()};
              border-radius: 999px;
              padding: 0.5rem 0.9rem;
              font-size: var(--build-workshop-choice-font-size);
              font-weight: 800;
              cursor: pointer;
              transition:
                background-color 0.16s ease,
                border-color 0.16s ease,
                color 0.16s ease;
              &:hover,
              &:focus-visible {
                border-color: ${Color.logoBlue(0.42)};
                background: ${Color.logoBlue(0.18)};
              }
              &:disabled {
                opacity: 0.6;
                cursor: default;
              }
            `}
          >
            {onceLabel}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onNo}
          className={css`
            border: 1px solid rgba(148, 163, 184, 0.28);
            background: rgba(148, 163, 184, 0.1);
            color: #334155;
            border-radius: 999px;
            padding: 0.5rem 0.9rem;
            font-size: var(--build-workshop-choice-font-size);
            font-weight: 800;
            cursor: pointer;
            transition:
              background-color 0.16s ease,
              border-color 0.16s ease,
              color 0.16s ease;
            &:hover,
            &:focus-visible {
              border-color: rgba(100, 116, 139, 0.42);
              background: rgba(148, 163, 184, 0.18);
              color: #1e293b;
            }
          `}
        >
          {noLabel}
        </button>
        {onceShown ? null : (
          <button
            type="button"
            onClick={onRedirect}
            className={css`
              border: 1px solid rgba(217, 119, 6, 0.2);
              background: rgba(245, 158, 11, 0.11);
              color: #b45309;
              border-radius: 999px;
              padding: 0.5rem 0.9rem;
              font-size: var(--build-workshop-choice-font-size);
              font-weight: 800;
              cursor: pointer;
              transition:
                background-color 0.16s ease,
                border-color 0.16s ease,
                color 0.16s ease;
              &:hover,
              &:focus-visible {
                border-color: rgba(217, 119, 6, 0.36);
                background: rgba(245, 158, 11, 0.18);
                color: #92400e;
              }
            `}
          >
            No (explain what you want instead)
          </button>
        )}
      </div>
    </div>
  );
}
