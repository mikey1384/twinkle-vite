import React, { useState } from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { Color, mobileMaxWidth } from '~/constants/css';
import { rewardApprovalPresentation } from '~/components/Build/Rewards/approvalPresentation';
import type { RewardSettings } from '~/components/Build/Rewards/types';
import {
  BUILD_REVIEW_TYPE_ICONS,
  BUILD_REVIEW_TYPE_LABELS,
  type BuildReviewRow,
  type BuildReviewRowTone,
  cardCraftReviewRow,
  projectLimitReviewRow,
  storageLimitReviewRow
} from '~/helpers/buildReviewRequests';
import useCardCraftReviewStatus from './useCardCraftReviewStatus';

// The one place in the workspace where a creator sees everything that waits
// on Mikey: XP & Coin rewards, project room, file storage and card crafting.
// Same row for every type: what it is, where it stands, one button at most.
// Each row reads its type's canonical server state; nothing is optimistic.

export interface WorkspaceReviewRequestsProps {
  buildId: number;
  // The Main project's owner (not a contribution branch).
  isCanonicalOwner: boolean;
  rewards: {
    settings: RewardSettings | null;
    hasUnsavedChanges: boolean;
    checking: boolean;
    error: string;
    onOpen: () => void;
  };
  limits?: {
    copilotPolicy: {
      limits?: {
        maxFilesPerProject?: number;
        maxProjectBytes?: number;
        maxRuntimeFileStorageBytes?: number;
      } | null;
      usage?: {
        projectFileCount?: number;
        currentProjectBytes?: number;
        runtimeFileStorageBytes?: number;
      } | null;
      projectLimitApproval?: any;
      storageLimitApproval?: any;
    } | null;
    onRequestProjectLimitIncrease: (selection: {
      files: boolean;
      size: boolean;
    }) => Promise<void> | void;
    onRequestStorageLimitIncrease: (
      requestedBytes: number
    ) => Promise<void> | void;
  } | null;
  // Saves workspace edits before a request that reads the saved version.
  onSaveBeforeRequest?: () => Promise<boolean>;
  hasUnsavedChanges?: boolean;
}

export default function WorkspaceReviewRequests({
  buildId,
  isCanonicalOwner,
  rewards,
  limits,
  onSaveBeforeRequest,
  hasUnsavedChanges = false
}: WorkspaceReviewRequestsProps) {
  const cardCraft = useCardCraftReviewStatus(buildId, isCanonicalOwner);
  const rows: Array<
    BuildReviewRow & { key: string; loading?: boolean; note?: string }
  > = [];

  // Rewards keep their existing plain-language states; the action opens the
  // settings (Publish / Update App is what sends the version for review).
  if (
    isCanonicalOwner &&
    (rewards.checking ||
      rewards.error ||
      rewards.settings?.approvalRequired ||
      (rewards.settings?.state === 'removed' &&
        !rewards.settings.neverHadRewards))
  ) {
    const presentation = rewards.settings
      ? rewardApprovalPresentation(rewards.settings, rewards.hasUnsavedChanges)
      : null;
    rows.push({
      key: 'rewards',
      type: 'rewards',
      tone: rewards.error
        ? 'problem'
        : presentation?.state === 'in_review' ||
            presentation?.state === 'changes_offered'
          ? 'waiting'
          : presentation?.state === 'published' ||
              presentation?.state === 'removed'
            ? 'done'
            : 'action',
      title: rewards.checking
        ? 'Checking approval…'
        : rewards.error
          ? 'Approval status unavailable'
          : presentation?.title || '',
      detail:
        rewards.settings?.liveActive && presentation?.state !== 'published'
          ? 'Your current published app still has its approved rewards.'
          : '',
      action: { kind: 'open-rewards', label: 'Check status' }
    });
  }

  const policy = limits?.copilotPolicy || null;
  const projectRow = limits
    ? projectLimitReviewRow({
        approval: policy?.projectLimitApproval,
        usage: policy?.usage,
        limits: policy?.limits,
        isOwner: isCanonicalOwner
      })
    : null;
  if (projectRow) rows.push({ ...projectRow, key: 'project-limit' });
  const storageRow = limits
    ? storageLimitReviewRow({
        approval: policy?.storageLimitApproval,
        usage: policy?.usage,
        limits: policy?.limits
      })
    : null;
  if (storageRow) rows.push({ ...storageRow, key: 'storage-limit' });
  const cardCraftRow = isCanonicalOwner
    ? cardCraftReviewRow(cardCraft.settings, { hasUnsavedChanges })
    : null;
  if (cardCraftRow) rows.push({ ...cardCraftRow, key: 'cardcraft' });

  if (rows.length === 0) return null;
  return (
    <div className={listClass} aria-label="Waiting on Mikey">
      {rows.map((row) => (
        <ReviewRequestRow key={row.key} row={row} onAction={handleAction} />
      ))}
    </div>
  );

  async function handleAction(row: BuildReviewRow) {
    const action = row.action;
    if (!action) return;
    if (action.kind === 'open-rewards') return rewards.onOpen();
    if (action.kind === 'request-project-limit') {
      return limits?.onRequestProjectLimitIncrease({
        files: Boolean(action.files),
        size: Boolean(action.size)
      });
    }
    if (action.kind === 'request-storage-limit' && action.bytes) {
      return limits?.onRequestStorageLimitIncrease(action.bytes);
    }
    if (action.kind === 'request-cardcraft') {
      // The request reads the saved version, so save edits first.
      if (hasUnsavedChanges && onSaveBeforeRequest) {
        const saved = await onSaveBeforeRequest();
        if (!saved) throw new Error('Save your changes first, then ask again.');
      }
      await cardCraft.request();
    }
  }
}

const TONE_COLOR: Record<BuildReviewRowTone, keyof typeof Color> = {
  action: 'logoBlue',
  waiting: 'orange',
  done: 'green',
  problem: 'rose'
};

function ReviewRequestRow({
  row,
  onAction
}: {
  row: BuildReviewRow;
  onAction: (row: BuildReviewRow) => Promise<unknown> | unknown;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const color = Color[TONE_COLOR[row.tone]] as (opacity?: number) => string;
  return (
    <div
      className={rowClass}
      style={{ borderColor: color(0.35), background: color(0.06) }}
    >
      <div className={textClass} role="status">
        <span className={badgeClass} style={{ color: color(), background: color(0.14) }}>
          <Icon icon={BUILD_REVIEW_TYPE_ICONS[row.type]} />
          {BUILD_REVIEW_TYPE_LABELS[row.type]}
        </span>
        <strong className={titleClass}>{row.title}</strong>
        {row.detail ? <span className={detailClass}>{row.detail}</span> : null}
        {error ? (
          <span className={errorClass} role="alert">
            {error}
          </span>
        ) : null}
      </div>
      {row.action ? (
        <Button
          variant={row.action.kind === 'open-rewards' ? 'outline' : 'solid'}
          color="logoBlue"
          size="sm"
          loading={busy}
          onClick={handleClick}
        >
          {row.action.label}
        </Button>
      ) : null}
    </div>
  );

  async function handleClick() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await onAction(row);
    } catch (err: any) {
      setError(
        err?.responseData?.error ||
          err?.response?.data?.error ||
          err?.message ||
          'Could not send this request. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  }
}

const listClass = css`
  grid-column: 1 / -1;
  flex: 0 0 100%;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const rowClass = css`
  box-sizing: border-box;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.6rem 1rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--ui-border, #ccd3df);
  border-radius: 12px;
  color: var(--chat-text);
  @media (max-width: ${mobileMaxWidth}) {
    flex-wrap: nowrap;
    align-items: flex-end;
    padding: 0.55rem 0.7rem;
    gap: 0.6rem;
    > button {
      flex: 0 0 auto;
    }
  }
`;

const textClass = css`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.25rem 0.6rem;
  min-width: 0;
  flex: 1 1 22rem;
  font-size: 1.1rem;
  line-height: 1.4;
  @media (max-width: ${mobileMaxWidth}) {
    flex: 1 1 auto;
  }
`;

const badgeClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 1rem;
  font-weight: 800;
  white-space: nowrap;
`;

const titleClass = css`
  font-weight: 900;
`;

const detailClass = css`
  flex-basis: 100%;
  opacity: 0.8;
`;

const errorClass = css`
  flex-basis: 100%;
  color: ${Color.rose()};
  font-weight: 800;
`;
