import React from 'react';
import { css } from '@emotion/css';
import { ARENA } from './theme';
import type { ArenaMasteryProgress } from './types';

export default function MasteryProgress({ progress }: { progress: ArenaMasteryProgress }) {
  const done = progress.rewardsComplete ?? progress.completed;
  const count = progress.retry?.clears ?? progress.clears;
  const required = progress.retry?.required ?? progress.required;
  return (
    <details className={progressCls}>
      <summary>
        <span>Full + Hard mastery</span>
        <b>{done ? 'Both rewards collected' : `${count} / ${required}${progress.retry ? ' toward another attempt' : ' clears'}`}</b>
        {progress.tiers && <span className={tiersCls}>
          <span>Pass reward: {progress.tiers.pass ? 'Collected ✓' : 'Available'}</span>
          <span>Full-marks reward: {progress.tiers.perfect ? 'Collected ✓' : 'Available'}</span>
        </span>}
      </summary>
      <div className={detailsCls}>
        <progress
          value={count}
          max={required}
          aria-label={progress.retry ? 'Successful clears toward another mastery attempt' : 'Confirmed Full Hard mastery clears'}
        />
        <p>{done
          ? 'Both mastery rewards are collected. New papers earn ordinary rewards, with Zero or Ciel available to help.'
          : progress.pending
            ? 'Your previous Full Hard paper is still being marked. Progress updates after its final result.'
            : progress.solo
              ? 'Your solo mastery attempt is ready. It needs a fresh paper; Zero and Ciel can review it with you after submission.'
              : progress.retry
                ? `Clear ${required - count} more different Full Hard papers to unlock another solo mastery attempt. Zero or Ciel can help with all ${required} qualifying clears.`
                : `Clear ${Math.max(0, required - 1 - count)} more different Full Hard papers to unlock your first solo mastery attempt. Zero or Ciel can help with these qualifying clears.`}</p>
        {!done && <>
          <p>Two separate <b>20× XP and Coins rewards</b>: one for passing, one for full marks. Each pays once. Full marks claims that reward first; a later pass can claim the pass reward, even with full marks again.</p>
          <p>After every mastery attempt, clear 10 more different Full Hard papers before trying again. If only the full-marks reward remains, passing alone earns ordinary rewards.</p>
        </>}
        <p>Only successful clears on different papers count. Failed ordinary papers remain retryable within the one-new-exam-per-day limit.</p>
      </div>
    </details>
  );
}

const progressCls = css`
  border: 2px solid ${ARENA.line};
  border-radius: 8px;
  background: ${ARENA.paper};
  font-size: 1.2rem;
  line-height: 1.5;
  summary {
    cursor: pointer;
    padding: 0.8rem 1rem;
    min-height: 4.4rem;
    overflow-wrap: anywhere;
    b { margin-left: 0.6rem; }
    &:focus-visible { outline: 3px solid ${ARENA.accent}; outline-offset: 3px; }
  }
`;

const tiersCls = css`
  display: flex; flex-wrap: wrap; gap: 0.2rem 1rem;
  margin-top: 0.3rem; font-size: 1.1rem;
`;

const detailsCls = css`
  padding: 0 1rem 0.8rem;
  progress { width: 100%; height: 1rem; accent-color: ${ARENA.accent}; }
  p { margin: 0.6rem 0 0; font-size: 1.1rem; }
`;
