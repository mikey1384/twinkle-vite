import type { RewardSettings } from '../components/Build/Rewards/types';

export type BuildReleaseOutcome =
  | { kind: 'cancelled' }
  | { kind: 'published'; result: any }
  | { kind: 'approval'; settings: RewardSettings };

// Every creator release surface uses this sequence. Save first, then ask the
// server about that candidate; an older approval never authorizes a new draft.
export async function releaseBuild({
  buildId,
  save,
  preparePublish,
  loadRewards,
  requestReview,
  publish
}: {
  buildId: number;
  save?: () => Promise<boolean>;
  preparePublish?: () => Promise<{ thumbnailUrl?: string }>;
  loadRewards: (buildId: number) => Promise<RewardSettings>;
  requestReview: (buildId: number) => Promise<RewardSettings>;
  publish: (options: {
    buildId: number;
    thumbnailUrl?: string;
  }) => Promise<any>;
}): Promise<BuildReleaseOutcome> {
  if (save && !(await save())) return { kind: 'cancelled' };
  const settings = await loadRewards(buildId);
  if (needsReview(settings)) return submit(settings);

  const options = await preparePublish?.();
  try {
    const result = await publish({ ...options, buildId });
    if (!result?.success || !result?.build) {
      throw new Error(
        result?.error || 'Unable to update this app. Please try again.'
      );
    }
    return { kind: 'published', result };
  } catch (error: any) {
    const response = error?.response?.data || {};
    const code = error?.code || response.code;
    if (code === 'build_reward_approval_required') {
      // Another save may have changed the candidate after the preflight. The
      // publishing transaction is authoritative; recover through the same flow.
      const latest = await loadRewards(buildId);
      if (needsReview(latest)) return submit(latest);
    }
    if (code === 'build_release_up_to_date' && response.releaseStatus) {
      return {
        kind: 'published',
        result: {
          eventTimeMs: response.eventTimeMs,
          build: {
            id: buildId,
            isPublic: response.releaseStatus.isPublic,
            releaseStatus: response.releaseStatus
          }
        }
      };
    }
    throw error;
  }

  async function submit(current: RewardSettings): Promise<BuildReleaseOutcome> {
    // An outstanding proposal must remain available to accept or decline.
    // Retrying an existing request should not send another admin notification.
    if (
      ['in_review', 'changes_offered', 'changes_requested', 'paused'].includes(
        current.state
      )
    ) {
      return { kind: 'approval', settings: current };
    }
    if (current.declaration && !current.declaration.ok) {
      throw new Error(
        'Lumine needs to finish the rewards setup before this version can be sent. Ask Lumine to check the rewards, then try again.'
      );
    }
    const submitted = await requestReview(buildId);
    if (submitted.state === 'needs_review' || submitted.state === 'removed') {
      throw new Error(
        'Your app changed while requesting approval. Press Update App again to send the latest version.'
      );
    }
    return { kind: 'approval', settings: submitted };
  }
}

function needsReview(settings: RewardSettings) {
  return (
    settings.approvalRequired &&
    !settings.canPublish &&
    settings.state !== 'published'
  );
}

export function getBuildReleaseAction({
  settings,
  isPublic,
  hasUnpublishedChanges,
  hasUnsavedChanges = false,
  busy = false
}: {
  settings: RewardSettings | null;
  isPublic: boolean;
  hasUnpublishedChanges?: boolean;
  hasUnsavedChanges?: boolean;
  busy?: boolean;
}) {
  const currentReview = !hasUnsavedChanges && settings?.approvalRequired;
  const approvalRequested = Boolean(
    currentReview && settings.state === 'in_review'
  );
  const changesOffered = Boolean(
    currentReview && settings.state === 'changes_offered'
  );
  const feedbackAvailable = Boolean(
    currentReview && ['changes_requested', 'paused'].includes(settings.state)
  );
  const upToDate = Boolean(
    !hasUnsavedChanges &&
    isPublic &&
    (settings?.state === 'published' ||
      (hasUnpublishedChanges === false &&
        !settings?.canPublish &&
        (!settings || !needsReview(settings))))
  );
  return {
    label: busy
      ? 'Processing...'
      : approvalRequested
        ? 'Approval requested'
        : changesOffered
          ? 'Review changes'
          : feedbackAvailable
            ? 'Review feedback'
            : upToDate
              ? 'Up to Date'
              : isPublic
                ? 'Update App'
                : 'Publish',
    disabled: busy || approvalRequested || upToDate,
    approvalRequested,
    notice: approvalRequested
      ? isPublic
        ? 'This update is waiting for approval. Your current app stays live.'
        : 'This version is waiting for approval. It will go live when approved.'
      : ''
  };
}
