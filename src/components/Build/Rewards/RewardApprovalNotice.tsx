import React from 'react';
import { css } from '@emotion/css';
import { rewardApprovalPresentation } from './approvalPresentation';
import type { RewardSettings } from './types';

export default function RewardApprovalNotice({
  settings,
  hasUnsavedChanges,
  checking,
  error,
  onOpen
}: {
  settings: RewardSettings | null;
  hasUnsavedChanges: boolean;
  checking: boolean;
  error: string;
  onOpen: () => void;
}) {
  if (
    !checking &&
    !error &&
    !settings?.approvalRequired &&
    settings?.state !== 'removed'
  )
    return null;
  const presentation = settings
    ? rewardApprovalPresentation(settings, hasUnsavedChanges)
    : null;
  return (
    <div
      className={css`
        grid-column: 1 / -1;
        flex: 0 0 100%;
        width: 100%;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 0.6rem 1rem;
        padding: 0.8rem 1rem;
        border: 1px solid var(--ui-border, #ccd3df);
        border-radius: 12px;
        color: var(--chat-text);
        font-size: 1.1rem;
        button {
          font: inherit;
          color: #264d9a;
          background: #fff;
          border: 1px solid #66768c;
          border-radius: 7px;
          padding: 0.45rem 0.8rem;
          cursor: pointer;
        }
      `}
    >
      <span role="status">
        <strong>
          XP & Coin rewards ·{' '}
          {checking
            ? 'Checking approval…'
            : error
              ? 'Approval status unavailable'
              : presentation?.title}
        </strong>
        {settings?.liveActive && presentation?.state !== 'published' && (
          <span style={{ display: 'block' }}>
            Your current published app still has its approved rewards.
          </span>
        )}
      </span>
      <button onClick={onOpen}>Check status</button>
    </div>
  );
}
