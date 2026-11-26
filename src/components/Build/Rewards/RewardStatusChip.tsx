import React from 'react';
import { HeaderChip, type HeaderChipTone } from '~/components/Build/HeaderChip';
import { rewardApprovalPresentation } from './approvalPresentation';
import type { RewardSettings } from './types';

// The owner's XP & Coins approval as one chip in the Build header's strip.
// It reads the canonical reward status; pressing it opens the reward
// settings, where the full status and its next step live.

export interface RewardStatusChipInput {
  settings: RewardSettings | null;
  hasUnsavedChanges: boolean;
  checking: boolean;
  error: string;
}

// An app that never used rewards has no status to show.
export function shouldShowRewardStatus({
  settings,
  checking,
  error
}: RewardStatusChipInput) {
  return Boolean(
    checking ||
      error ||
      settings?.approvalRequired ||
      (settings?.state === 'removed' && !settings.neverHadRewards)
  );
}

const STATE_TONES: Record<string, HeaderChipTone> = {
  published: 'green',
  approved: 'green',
  in_review: 'amber',
  changes_offered: 'amber',
  changes_requested: 'pink',
  paused: 'pink',
  needs_review: 'blue',
  check_changes: 'blue',
  removed: 'slate'
};

export default function RewardStatusChip({
  onOpen,
  ...input
}: RewardStatusChipInput & { onOpen: () => void }) {
  if (!shouldShowRewardStatus(input)) return null;
  const presentation = input.settings
    ? rewardApprovalPresentation(input.settings, input.hasUnsavedChanges)
    : null;
  const word = input.error
    ? 'Unavailable'
    : input.checking || !presentation
      ? 'Checking…'
      : presentation.short;
  const tone: HeaderChipTone = input.error
    ? 'pink'
    : presentation && !input.checking
      ? STATE_TONES[presentation.state] || 'slate'
      : 'slate';
  return (
    <HeaderChip
      chip="rewards"
      icon="coins"
      tone={tone}
      label={`XP & Coins: ${word}`}
      title={
        input.error
          ? 'Approval status unavailable'
          : presentation
            ? `${presentation.title}${
                input.settings?.liveActive && presentation.state !== 'published'
                  ? '. Your current published app still has its approved rewards.'
                  : ''
              }`
            : 'XP & Coins'
      }
      onClick={onOpen}
    />
  );
}
