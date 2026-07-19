import type { BuildCapabilitySnapshot } from '../../types/capabilityTypes';
import type {
  BuildAgentAssetCreateOptions,
  BuildAgentAssetCreateResult
} from '~/containers/Build/helpers/agentWorkspaceAssets';
import type {
  BuildRuntimeExplorationPlan,
  BuildRuntimeObservationState
} from '../../types/runtimeObservationTypes';
import type {
  PreviewRuntimeUploadAsset,
  PreviewRuntimeUploadsSyncPayload
} from '../../types/runtimeUploadTypes';
export type {
  PreviewRuntimeUploadAsset,
  PreviewRuntimeUploadsSyncPayload,
  PreviewRuntimeUploadUsage
} from '../../types/runtimeUploadTypes';

export interface Build {
  id: number;
  title: string;
  username: string;
  primaryArtifactId?: number | null;
  currentArtifactVersionId?: number | null;
  isPublic?: boolean | number | null;
  updatedAt?: number | null;
  // Server-issued hash of the canonical project files this client last
  // synced; the draft buffer captures it as its save base when reseeded.
  projectFilesHash?: string | null;
}

export interface PreviewMountContext {
  type: 'subject';
  id: number;
}

export interface PreviewLaunchTarget {
  notificationId?: number | null;
  buildId?: number | null;
  eventKey?: string;
  eventLabel?: string;
  target?: Record<string, any> | null;
  [key: string]: any;
}

export interface PreviewPanelProps {
  className?: string;
  build: Build;
  code: string | null;
  projectFiles: Array<{
    path: string;
    content?: string;
  }>;
  streamingProjectFiles?: Array<{
    path: string;
    content?: string;
  }> | null;
  streamingFocusFilePath?: string | null;
  isOwner: boolean;
  codeWorkspaceAvailable?: boolean;
  onReplaceCode: (code: string) => void;
  onApplyRestoredProjectFiles: (
    files: Array<{ path: string; content?: string }>,
    restoredCode?: string | null,
    options?: {
      artifactVersionId?: number | null;
      primaryArtifactId?: number | null;
      contributionStatus?: 'none' | 'draft' | 'merging' | 'merged';
      filesHash?: string | null;
    }
  ) => void;
  onSaveProjectFiles: (
    files: Array<{ path: string; content?: string }>,
    options?: {
      targetBuildId?: number | null;
      targetBuildCode?: string | null;
      draftBaseFilesHash?: string | null;
    }
  ) => Promise<{
    success: boolean;
    error?: string;
    filesHash?: string | null;
  }>;
  runtimeOnly?: boolean;
  requireSignedPreviewAccess?: boolean;
  runtimeHostVisible?: boolean;
  // Keep the preview frame MOUNTED even while host-hidden (the keep-alive
  // full-tab runtime): a hidden frame normally suspends -> its src is nulled ->
  // useFrameManager retires the iframe, which would destroy a backgrounded
  // build tab's state. Embedded panels leave this false so scrolled-off
  // previews still free memory.
  preventFrameSuspend?: boolean;
  audioMuted?: boolean;
  capabilitySnapshot?: BuildCapabilitySnapshot | null;
  maxProjectFileLines?: number | null;
  onEditableProjectFilesStateChange?: (state: {
    files: Array<{ path: string; content?: string }>;
    hasUnsavedChanges: boolean;
    saving: boolean;
    // Save base bound to the current draft buffer: the server-issued files
    // hash captured the last time the buffer matched persisted files.
    draftBaseFilesHash?: string | null;
  }) => void;
  runtimeExplorationPlan?: BuildRuntimeExplorationPlan | null;
  onRuntimeObservationChange?: (state: BuildRuntimeObservationState) => void;
  onRuntimeUploadsSync?: (
    payload: PreviewRuntimeUploadsSyncPayload | null
  ) => void;
  onAiUsagePolicyUpdate?: (aiUsagePolicy: Record<string, any>) => void;
  onOpenRuntimeUploadsManager?: () => void;
  currentBuildRuntimeAssets?: PreviewRuntimeUploadAsset[];
  previewSrcOverride?: string | null;
  mountContext?: PreviewMountContext | null;
  launchTarget?: PreviewLaunchTarget | null;
  viewerOverride?: {
    id: number | null;
    username: string | null;
    profilePicUrl: string | null;
  } | null;
  onCaptureReadyChange?: (
    ready: boolean,
    payload: { codeSignature: string | null; previewSrc: string | null }
  ) => void;
}

export interface PreviewPanelHandle {
  openProjectFileUploadPicker: () => void;
  openProjectFolderImportPicker: () => void;
  openProjectAssetUploadPicker: () => void;
  discardProjectFileDraft: () => Array<{
    path: string;
    content?: string;
  }>;
  rebaseProjectFileDraftBase: (filesHash: string) => void;
  captureThumbnail: () => Promise<string>;
  importProjectFilesFromChatUpload: (files: File[]) => Promise<{
    success: boolean;
    importedCount: number;
    warningText?: string;
    error?: string;
  }>;
  uploadProjectAssetsFromChatUpload: (files: File[]) => Promise<{
    success: boolean;
    uploadedCount: number;
    assets?: PreviewRuntimeUploadAsset[];
    warningText?: string;
    error?: string;
  }>;
  uploadGeneratedProjectAsset: (
    options: BuildAgentAssetCreateOptions
  ) => Promise<BuildAgentAssetCreateResult>;
}

export interface ArtifactVersion {
  id: number;
  version: number;
  summary: string | null;
  createdAt: number;
  createdByRole: 'user' | 'assistant';
}

export interface PreviewSeedCacheEntry {
  buildId: number;
  codeSignature: string;
  src: string;
  cachedAt: number;
}

export interface PreviewFrameMeta {
  buildId: number | null;
  codeSignature: string | null;
  messageNonce: string | null;
  viewerKey: string | null;
  bridgeLoadId: string | null;
  bridgeConfirmed: boolean;
  bridgeNonceRequestOpen: boolean;
  bridgeNonceRequestExpiresAt: number | null;
  hasLoaded: boolean;
}

export type PreviewFrameKey = 'primary' | 'secondary';

export interface PreviewFrameRetiredPayload {
  frame: PreviewFrameKey;
  sourceWindow: Window | null;
  reason: 'cleared' | 'replaced' | 'runtime-reset' | 'navigated';
}

export type PreviewFrameRetiredHandler = (
  payload: PreviewFrameRetiredPayload
) => void;

export interface EditableProjectFile {
  path: string;
  content: string;
}

export interface ProjectExplorerEntryFolder {
  kind: 'folder';
  path: string;
  name: string;
  depth: number;
  fileCount: number;
}

export interface ProjectExplorerEntryFile {
  kind: 'file';
  file: EditableProjectFile;
  depth: number;
}

export type ProjectExplorerEntry =
  ProjectExplorerEntryFolder | ProjectExplorerEntryFile;
