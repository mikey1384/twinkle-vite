import React from 'react';
import { css } from '@emotion/css';
import { timeSince } from '~/helpers/timeStampHelpers';
import { mobileMaxWidth } from '~/constants/css';

const noticeClass = css`
  border: 2px solid var(--ui-border);
  border-radius: 8px;
  background: #fff;
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  strong {
    font-size: 1.1rem;
    font-weight: 900;
  }
  span {
    color: #4b5563;
    font-size: 1.1rem;
    font-weight: 800;
    line-height: 1.35;
  }
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.75rem;
  }
`;

const seenClass = css`
  border-color: #0f766e;
  background: color-mix(in srgb, #14b8a6 10%, #ffffff);
  color: #134e4a;
`;

const staleClass = css`
  border-color: #d97706;
  background: color-mix(in srgb, #f59e0b 10%, #ffffff);
  color: #78350f;
`;

const unseenClass = css`
  border-color: #64748b;
  background: color-mix(in srgb, #94a3b8 10%, #ffffff);
  color: #334155;
`;

// Tells the contributor whether the project owner has actually opened this
// branch, and whether that was before or after their latest save. The signal is
// the owner's own build-open record, so it means "they looked at the branch",
// never "they read a message".
export default function BranchOwnerAttentionNotice({
  ownerLastOpenedAt,
  branchUpdatedAt,
  ownerUsername
}: {
  ownerLastOpenedAt: number;
  branchUpdatedAt: number;
  ownerUsername?: string | null;
}) {
  const openedAt = Math.floor(Number(ownerLastOpenedAt) || 0);
  const savedAt = Math.floor(Number(branchUpdatedAt) || 0);
  const owner = String(ownerUsername || '').trim() || 'The project owner';

  if (!openedAt) {
    return (
      <div className={[noticeClass, unseenClass].join(' ')} aria-live="polite">
        <strong>Not opened yet</strong>
        <span>{owner} has not opened this branch yet.</span>
      </div>
    );
  }

  const sawLatest = savedAt > 0 ? openedAt >= savedAt : true;
  return (
    <div
      className={[noticeClass, sawLatest ? seenClass : staleClass].join(' ')}
      aria-live="polite"
    >
      <strong>{sawLatest ? 'Opened your branch' : 'Saw an older version'}</strong>
      <span>
        {sawLatest
          ? `${owner} opened this branch ${timeSince(openedAt)}, after your latest save.`
          : `${owner} last opened this branch ${timeSince(
              openedAt
            )} — you have saved since then.`}
      </span>
    </div>
  );
}
