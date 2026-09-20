import { useRef, useState } from 'react';
import { useAppContext } from '~/contexts';
import { getBuildReleaseAction, releaseBuild } from '~/helpers/buildRelease';
import useRewardStatus from '../Rewards/useRewardStatus';

export default function useRelease({
  buildId,
  enabled,
  isPublic,
  hasUnpublishedChanges,
  hasUnsavedChanges = false,
  busy = false,
  changeKey = '',
  save,
  preparePublish,
  onPublished,
  onReviewProposal,
  onError
}: {
  buildId: number;
  enabled: boolean;
  isPublic: boolean;
  hasUnpublishedChanges?: boolean;
  hasUnsavedChanges?: boolean;
  busy?: boolean;
  changeKey?: string;
  save?: () => Promise<boolean>;
  preparePublish?: () => Promise<{ thumbnailUrl?: string }>;
  onPublished: (result: any) => void | Promise<void>;
  onReviewProposal: () => void;
  onError?: (error: any) => void;
}) {
  const requestReview = useAppContext(
    (v) => v.requestHelpers.requestBuildRewardReview
  );
  const publish = useAppContext((v) => v.requestHelpers.publishBuild);
  const rewardStatus = useRewardStatus(buildId, enabled, changeKey);
  const activeRequest = useRef(false);
  const currentBuildId = useRef(buildId);
  currentBuildId.current = buildId;
  const [publishing, setPublishing] = useState(false);
  const [failure, setFailure] = useState<{
    buildId: number;
    message: string;
  } | null>(null);
  const action = getBuildReleaseAction({
    settings: rewardStatus.settings,
    isPublic,
    hasUnpublishedChanges,
    hasUnsavedChanges,
    busy: publishing || busy
  });

  return {
    action,
    publishing: publishing || busy,
    error: failure?.buildId === buildId ? failure.message : '',
    rewardStatus,
    run
  };

  async function run() {
    if (!enabled || !buildId || activeRequest.current || action.disabled)
      return;
    activeRequest.current = true;
    setPublishing(true);
    setFailure(null);
    try {
      const outcome = await releaseBuild({
        buildId,
        save,
        preparePublish,
        loadRewards: rewardStatus.load,
        requestReview: async (id) => {
          await requestReview(id);
          // The draft can change while the request or its chat notification is
          // in flight. Confirm the current candidate through the ordered reader.
          return rewardStatus.load();
        },
        publish
      });
      if (currentBuildId.current !== buildId) return;
      if (outcome.kind === 'published') {
        await onPublished(outcome.result);
        rewardStatus.refresh();
      } else if (
        outcome.kind === 'approval' &&
        ['changes_offered', 'changes_requested', 'paused'].includes(
          outcome.settings.state
        )
      ) {
        onReviewProposal();
      }
    } catch (error: any) {
      if (currentBuildId.current !== buildId) return;
      setFailure({
        buildId,
        message:
          error?.response?.data?.error ||
          error?.message ||
          'Unable to update this app. Please try again.'
      });
      onError?.(error);
    } finally {
      activeRequest.current = false;
      setPublishing(false);
    }
  }
}

export type BuildReleaseControl = ReturnType<typeof useRelease>;
