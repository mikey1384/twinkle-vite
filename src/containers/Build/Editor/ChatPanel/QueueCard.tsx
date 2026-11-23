import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { BuildRunQueue } from './types';
import { describeBuildRunQueue } from './helpers/queue';

const MAX_AHEAD_MARKERS = 4;

// What a member sees while their request waits behind someone else's build
// (Mikey 11-23). Counts only: never who is ahead or what they are building.
// Static by design: no looping animation, so a long wait costs a phone
// nothing; the server sends a new place in line when it changes.
export default function QueueCard({
  queue,
  onCancel,
  spaced
}: {
  queue: BuildRunQueue;
  onCancel?: () => void;
  spaced?: boolean;
}) {
  const { headline, detail } = describeBuildRunQueue(queue);
  const markers = Math.min(queue.ahead, MAX_AHEAD_MARKERS);
  const extra = queue.ahead - markers;
  return (
    <div
      role="status"
      aria-live="polite"
      className={css`
        @keyframes buildQueueIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        animation: buildQueueIn 200ms ease-out 1;
        @media (prefers-reduced-motion: reduce) {
          animation: none;
        }
        margin-top: ${spaced ? '0.55rem' : '0'};
        padding: 0.7rem 0.8rem;
        border-radius: 10px;
        border: 1px solid ${Color.logoBlue(0.18)};
        background: ${Color.logoBlue(0.05)};
        color: var(--chat-text);
        display: grid;
        gap: 0.45rem;
      `}
    >
      <div
        className={css`
          display: flex;
          align-items: flex-start;
          gap: 0.55rem;
        `}
      >
        <span
          aria-hidden
          className={css`
            flex: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 1.9rem;
            height: 1.9rem;
            border-radius: 999px;
            background: ${Color.logoBlue(0.12)};
            color: ${Color.logoBlue()};
            font-size: var(--build-workshop-small-font-size);
          `}
        >
          <Icon icon="clock" />
        </span>
        <div
          className={css`
            min-width: 0;
            display: grid;
            gap: 0.12rem;
          `}
        >
          <div
            className={css`
              font-size: var(--build-workshop-meta-font-size);
              font-weight: 800;
              line-height: 1.3;
            `}
          >
            {headline}
          </div>
          <div
            className={css`
              font-size: var(--build-workshop-small-font-size);
              line-height: 1.4;
              opacity: 0.78;
            `}
          >
            {detail}
          </div>
        </div>
      </div>
      <div
        className={css`
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.6rem;
          flex-wrap: wrap;
        `}
      >
        <div
          aria-hidden
          className={css`
            display: flex;
            align-items: center;
            gap: 0.28rem;
            min-width: 0;
          `}
        >
          {Array.from({ length: markers }, (_, index) => (
            <span
              key={index}
              className={css`
                width: 1.5rem;
                height: 0.42rem;
                border-radius: 999px;
                background: ${Color.gray(index === 0 ? 0.55 : 0.3)};
              `}
            />
          ))}
          {extra > 0 ? (
            <span
              className={css`
                font-size: var(--build-workshop-tiny-font-size);
                font-weight: 700;
                opacity: 0.6;
              `}
            >
              +{extra}
            </span>
          ) : null}
          <span
            className={css`
              margin-left: 0.15rem;
              padding: 0.05rem 0.45rem;
              border-radius: 999px;
              background: ${Color.logoBlue()};
              color: #fff;
              font-size: var(--build-workshop-tiny-font-size);
              font-weight: 800;
              line-height: 1.4;
            `}
          >
            You
          </span>
        </div>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className={css`
              background: none;
              border: 1px solid var(--ui-border);
              border-radius: 999px;
              padding: 0.28rem 0.8rem;
              min-height: 2rem;
              color: var(--chat-text);
              font-size: var(--build-workshop-small-font-size);
              font-weight: 700;
              cursor: pointer;
              &:hover {
                border-color: ${Color.rose(0.5)};
                color: ${Color.rose()};
              }
            `}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  );
}
