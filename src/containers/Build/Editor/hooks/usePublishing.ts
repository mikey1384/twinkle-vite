import { useState } from 'react';
import useRelease from '~/components/Build/hooks/useRelease';
import type { Build, BuildCopilotPolicy } from '../types';

interface BuildEditorLocalRunEventInput {
  kind: 'lifecycle' | 'status' | 'action';
  phase: string | null;
  message: string;
  targetRequestId?: string | null;
  pageFeedbackOnMissingRequestId?: boolean;
}

interface UseBuildEditorPublishingOptions {
  appendLocalRunEvent: (event: BuildEditorLocalRunEventInput) => void;
  applyBuildUpdate: (build: Build) => void;
  build: Build;
  canEditCurrentBuildMetadata: boolean;
  ensureBuildThumbnailBeforePublish: () => Promise<Build>;
  getLatestBuild: () => Build;
  ensureProjectFilesPersistedBeforePublish: () => Promise<boolean>;
  hasUnsavedChanges: boolean;
  replaceCopilotPolicy: (policy: BuildCopilotPolicy | null) => void;
  unpublishBuild: (buildId: number) => Promise<any>;
}

export default function usePublishing({
  appendLocalRunEvent,
  applyBuildUpdate,
  build,
  canEditCurrentBuildMetadata,
  ensureBuildThumbnailBeforePublish,
  getLatestBuild,
  ensureProjectFilesPersistedBeforePublish,
  hasUnsavedChanges,
  replaceCopilotPolicy,
  unpublishBuild
}: UseBuildEditorPublishingOptions) {
  const [rewardApprovalPrompt, setRewardApprovalPrompt] = useState(0);
  const [unpublishing, setUnpublishing] = useState(false);
  const release = useRelease({
    buildId: Number(build.id),
    enabled:
      canEditCurrentBuildMetadata &&
      (!build.contributionStatus || build.contributionStatus === 'none'),
    isPublic: Boolean(build.isPublic),
    hasUnpublishedChanges: build.releaseStatus?.hasUnpublishedChanges,
    hasUnsavedChanges,
    busy: unpublishing,
    changeKey: `${build.currentArtifactVersionId}:${build.projectFilesHash}:${build.isPublic}`,
    save: async () => {
      if (unpublishing) return false;
      if (!(await ensureProjectFilesPersistedBeforePublish())) return false;
      const latestBuild = getLatestBuild();
      if (!latestBuild || Number(latestBuild.id) !== Number(build.id)) {
        throw new Error(
          'Build changed before publish. Please retry on the active build.'
        );
      }
      if (!latestBuild.code)
        throw new Error('Add code before publishing your build.');
      return true;
    },
    preparePublish: async () => {
      let latestBuild = getLatestBuild();
      if (Number(latestBuild.id) !== Number(build.id)) {
        throw new Error(
          'Build changed before publish. Please retry on the active build.'
        );
      }
      if (!String(latestBuild.thumbnailUrl || '').trim()) {
        try {
          latestBuild = await ensureBuildThumbnailBeforePublish();
        } catch (error: any) {
          console.error('Failed to auto-generate build thumbnail:', error);
          appendLocalRunEvent({
            kind: 'lifecycle',
            phase: 'publish',
            message: error?.message
              ? `${error.message} Publishing without a thumbnail instead.`
              : 'Preview thumbnail could not be generated automatically. Publishing without a thumbnail instead.',
            pageFeedbackOnMissingRequestId: true
          });
        }
      }
      return {
        thumbnailUrl: String(latestBuild.thumbnailUrl || '').trim() || undefined
      };
    },
    onPublished: (result) => {
      applyBuildUpdate({ ...getLatestBuild(), ...result.build });
      if (Object.prototype.hasOwnProperty.call(result, 'copilotPolicy')) {
        replaceCopilotPolicy(result.copilotPolicy || null);
      }
    },
    onReviewProposal: () => setRewardApprovalPrompt((value) => value + 1),
    onError: (error) => {
      if (error?.response?.data?.releaseStatus) {
        applyBuildUpdate({
          ...getLatestBuild(),
          releaseStatus: error.response.data.releaseStatus
        });
      }
      appendLocalRunEvent({
        kind: 'lifecycle',
        phase: 'publish',
        message: error?.message || 'Unable to publish this build right now.',
        pageFeedbackOnMissingRequestId: true
      });
    }
  });
  const publishing = release.publishing;

  async function handleUnpublish() {
    if (!canEditCurrentBuildMetadata || publishing) return;
    setUnpublishing(true);
    try {
      const latestBuild = getLatestBuild();
      const result = await unpublishBuild(latestBuild.id);
      if (result?.success && result?.build) {
        applyBuildUpdate({
          ...latestBuild,
          ...result.build,
          releaseStatus: result.build.isPublic
            ? (result.build.releaseStatus ?? latestBuild.releaseStatus ?? null)
            : null
        });
        if (Object.prototype.hasOwnProperty.call(result, 'copilotPolicy')) {
          replaceCopilotPolicy(result.copilotPolicy || null);
        }
      }
    } catch (error: any) {
      console.error('Failed to unpublish build:', error);
      appendLocalRunEvent({
        kind: 'lifecycle',
        phase: 'publish',
        message: error?.message || 'Unable to unpublish this build right now.',
        pageFeedbackOnMissingRequestId: true
      });
    }
    setUnpublishing(false);
  }

  return {
    handlePublish: release.run,
    release,
    handleUnpublish,
    publishing,
    rewardApprovalPrompt
  };
}
