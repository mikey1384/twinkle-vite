import type { BuildCapabilitySnapshot } from '../capabilityTypes';
import type {
  BuildRuntimeExplorationPlan,
  BuildRuntimeObservationState
} from '../runtimeObservationTypes';

export interface Build {
  id: number;
  title: string;
  username: string;
  primaryArtifactId?: number | null;
  currentArtifactVersionId?: number | null;
  isPublic?: boolean | number | null;
  updatedAt?: number | null;
}

export interface PreviewPanelProps {
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
  onReplaceCode: (code: string) => void;
  onApplyRestoredProjectFiles: (
    files: Array<{ path: string; content?: string }>,
    restoredCode?: string | null,
    options?: {
      artifactVersionId?: number | null;
      primaryArtifactId?: number | null;
    }
  ) => void;
  onSaveProjectFiles: (
    files: Array<{ path: string; content?: string }>
  ) => Promise<{ success: boolean; error?: string }>;
  runtimeOnly?: boolean;
  capabilitySnapshot?: BuildCapabilitySnapshot | null;
  onEditableProjectFilesStateChange?: (state: {
    files: Array<{ path: string; content?: string }>;
    hasUnsavedChanges: boolean;
    saving: boolean;
  }) => void;
  runtimeExplorationPlan?: BuildRuntimeExplorationPlan | null;
  onRuntimeObservationChange?: (
    state: BuildRuntimeObservationState
  ) => void;
}

export interface ArtifactVersion {
  id: number;
  version: number;
  summary: string | null;
  gitCommitSha: string | null;
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
}

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
  | ProjectExplorerEntryFolder
  | ProjectExplorerEntryFile;
