import { useState } from 'react';
import type {
  Build,
  BuildCopilotPolicy
} from '../types';

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
  publishBuild: (options: Record<string, any>) => Promise<any>;
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
  publishBuild,
  replaceCopilotPolicy,
  unpublishBuild
}: UseBuildEditorPublishingOptions) {
  const [publishing, setPublishing] = useState(false);

  async function handlePublish() {
    if (!canEditCurrentBuildMetadata || publishing) return;

    setPublishing(true);
    try {
      const requestedBuildId = Number(getLatestBuild()?.id || build.id);
      if (!Number.isFinite(requestedBuildId) || requestedBuildId <= 0) {
        appendLocalRunEvent({
          kind: 'lifecycle',
          phase: 'error',
          message: 'Unable to publish: build not found.',
          pageFeedbackOnMissingRequestId: true
        });
        return;
      }
      const projectFilesReady =
        await ensureProjectFilesPersistedBeforePublish();
      if (!projectFilesReady) {
        return;
      }
      const latestBuild = getLatestBuild();
      if (!latestBuild || Number(latestBuild.id) !== requestedBuildId) {
        appendLocalRunEvent({
          kind: 'lifecycle',
          phase: 'error',
          message:
            'Build changed before publish. Please retry on the active build.',
          pageFeedbackOnMissingRequestId: true
        });
        return;
      }
      if (!latestBuild.code) {
        appendLocalRunEvent({
          kind: 'lifecycle',
          phase: 'error',
          message: 'Add code before publishing your build.',
          pageFeedbackOnMissingRequestId: true
        });
        return;
      }
      if (
        latestBuild.isPublic &&
        latestBuild.releaseStatus &&
        !latestBuild.releaseStatus.hasUnpublishedChanges
      ) {
        appendLocalRunEvent({
          kind: 'lifecycle',
          phase: 'publish',
          message: 'This app is already up to date.',
          pageFeedbackOnMissingRequestId: true
        });
        return;
      }
      let publishTargetBuild = latestBuild;
      if (!String(latestBuild.thumbnailUrl || '').trim()) {
        try {
          publishTargetBuild = await ensureBuildThumbnailBeforePublish();
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
      const result = await publishBuild({
        buildId: publishTargetBuild.id,
        thumbnailUrl:
          String(publishTargetBuild.thumbnailUrl || '').trim() || undefined
      });
      if (result?.success && result?.build) {
        applyBuildUpdate({
          ...publishTargetBuild,
          ...result.build
        });
        if (Object.prototype.hasOwnProperty.call(result, 'copilotPolicy')) {
          replaceCopilotPolicy(result.copilotPolicy || null);
        }
      }
    } catch (error: any) {
      console.error('Failed to publish build:', error);
      if (error?.response?.data?.releaseStatus) {
        const latestBuild = getLatestBuild();
        if (latestBuild) {
          applyBuildUpdate({
            ...latestBuild,
            releaseStatus: error.response.data.releaseStatus
          });
        }
      }
      appendLocalRunEvent({
        kind: 'lifecycle',
        phase: 'publish',
        message: error?.message || 'Unable to publish this build right now.',
        pageFeedbackOnMissingRequestId: true
      });
    } finally {
      setPublishing(false);
    }
  }

  async function handleUnpublish() {
    if (!canEditCurrentBuildMetadata || publishing) return;
    setPublishing(true);
    try {
      const latestBuild = getLatestBuild();
      const result = await unpublishBuild(latestBuild.id);
      if (result?.success && result?.build) {
        applyBuildUpdate({
          ...latestBuild,
          ...result.build,
          releaseStatus: result.build.isPublic
            ? result.build.releaseStatus ?? latestBuild.releaseStatus ?? null
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
    setPublishing(false);
  }

  return {
    handlePublish,
    handleUnpublish,
    publishing
  };
}
