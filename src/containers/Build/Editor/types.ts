import type {
  BuildLumineChatVisibility,
  BuildLumineModelOption,
  BuildLumineModelPreference
} from './ChatPanel/types';
import type { BuildCapabilitySnapshot } from '../types/capabilityTypes';
import type { BuildLiveRunState } from '~/contexts/Build/reducer';
import type { BuildRuntimeExplorationPlan } from '../types/runtimeObservationTypes';

export type MobilePanelTab = 'chat' | 'preview';

export interface MobilePanelTabIntent {
  tab: MobilePanelTab;
  version: number;
}

export interface PendingBranchThumbnailCapture {
  buildId: number;
  artifactVersionId: number;
  codeSignature: string;
}

export interface BuildEditorRouteState {
  forumThreadId?: number;
  openForkHistory?: boolean;
  openCollaborationSettings?: boolean;
  openPeoplePanel?: boolean;
  openVersionsPanel?: boolean;
  skipDefaultContributionBranchRedirect?: boolean;
  [key: string]: unknown;
}

export type BuildChatUploadRoute =
  | 'project_files_import'
  | 'runtime_asset_upload'
  | 'chat_reference'
  | 'clarify';

export interface BuildChatUploadDecision {
  route?: BuildChatUploadRoute;
  confidence?: 'low' | 'medium' | 'high';
  reason?: string;
  clarificationQuestion?: string | null;
}

export interface PendingBuildChatUploadClarification {
  files: File[];
  messageText: string;
  intentPersisted: boolean;
}

export interface BuildChatFileSelectionResult {
  handled: boolean;
}

export interface BuildVersionSummary {
  id: number;
  userId?: number | null;
  username?: string | null;
  profilePicUrl?: string | null;
  title?: string;
  contributionRootBuildId?: number | null;
  contributionContributorId?: number | null;
  contributionBranchNumber?: number | null;
  contributionStatus?: string | null;
  updatedAt?: number | null;
  thumbnailUrl?: string | null;
}

export interface BuildBranchDeleteTarget {
  id: number;
  title: string;
  confirmTitle: string;
}

export interface BuildReleaseStatus {
  state: 'private' | 'up_to_date' | 'unpublished_changes' | 'missing_snapshot';
  isPublic: boolean;
  hasPublishedVersion: boolean;
  hasUnpublishedChanges: boolean;
  diff?: {
    total: number;
    added: number;
    updated: number;
    deleted: number;
  };
  publishedArtifactVersionId?: number | null;
  currentArtifactVersionId?: number | null;
}

export interface Build {
  id: number;
  userId: number;
  username: string;
  title: string;
  description: string | null;
  slug: string;
  code: string | null;
  primaryArtifactId?: number | null;
  currentArtifactVersionId?: number | null;
  isPublic: boolean;
  publishedAt?: number | null;
  publishedArtifactVersionId?: number | null;
  releaseStatus?: BuildReleaseStatus | null;
  thumbnailUrl?: string | null;
  collaboratorCount?: number;
  pendingCollaborationRequestCount?: number;
  sourceBuildId?: number | null;
  collaborationMode?: 'private' | 'contribution' | 'open_source';
  contributionAccess?: 'anyone' | 'invite_only';
  canOpenContributionWorkspace?: boolean;
  hasActiveContributionInvite?: boolean;
  lumineChatVisibility?: BuildLumineChatVisibility | 'public';
  rootBuildUserId?: number | null;
  rootBuildUsername?: string | null;
  rootBuildProfilePicUrl?: string | null;
  rootBuildSourceBuildId?: number | null;
  rootBuildTitle?: string | null;
  rootBuildIsPublic?: boolean | number | null;
  rootBuildCollaborationMode?: 'private' | 'contribution' | 'open_source';
  contributionParentBuildId?: number | null;
  contributionRootBuildId?: number | null;
  contributionContributorId?: number | null;
  contributionBranchNumber?: number | null;
  contributionStatus?: 'none' | 'draft' | 'merging' | 'merged';
  contributionBaseBuildUpdatedAt?: number | null;
  contributionMergedAt?: number | null;
  contributionClosedAt?: number | null;
  contributionMergedByUserId?: number | null;
  projectManifest?: {
    entryPath: string;
    storageMode: string;
    fileCount: number;
  } | null;
  projectFiles?: Array<{
    id?: number;
    path: string;
    content?: string;
    sizeBytes?: number;
    contentHash?: string;
    createdAt?: number;
    updatedAt?: number;
  }>;
  capabilitySnapshot?: BuildCapabilitySnapshot | null;
  executionPlan?: BuildExecutionPlan | null;
  followUpPrompt?: BuildFollowUpPrompt | null;
  runtimeExplorationPlan?: BuildRuntimeExplorationPlan | null;
  createdAt: number;
  updatedAt: number;
}

export interface BuildExecutionPlanChunk {
  id: string;
  kind: 'chunk' | 'big_chunk';
  title: string;
  summary: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
  chunks: BuildExecutionPlanChunk[];
}

export interface BuildExecutionPlan {
  buildId: number;
  mode: 'large' | 'too_broad';
  status: 'awaiting_confirmation' | 'running' | 'completed' | 'cancelled';
  summary: string;
  question?: string | null;
  plan: {
    version: 1;
    mode: 'large' | 'too_broad';
    summary: string;
    question?: string | null;
    chunks: BuildExecutionPlanChunk[];
  };
  currentBigChunkId: string | null;
  currentChunkId: string | null;
  createdByUserId: number;
  createdAt: number;
  updatedAt: number;
}

export interface BuildFollowUpPrompt {
  question?: string | null;
  suggestedMessage?: string | null;
  sourceMessageId?: number | null;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  codeGenerated: string | null;
  streamCodePreview?: string | null;
  uploadProgressPercent?: number | null;
  billingState?: 'charged' | 'not_charged' | 'pending' | null;
  artifactVersionId?: number | null;
  clientMessageId?: string | null;
  createdAt: number;
  persisted?: boolean;
  source?: 'runtime_observation';
}

export interface BuildCopilotPolicy {
  limits: {
    maxProjectBytes: number;
    maxFilesPerProject: number;
    maxFileLines: number;
    maxEffectiveLineColumns?: number;
    maxPublishedBuildStorageBytes: number;
    maxRuntimeFileStorageBytes: number;
    maxRuntimeFileBytes: number;
  };
  usage: {
    currentProjectBytes: number;
    projectBytesRemaining: number;
    projectFileCount: number;
    projectFileBytes: number;
    maxFilesPerProject: number;
    publishedBuildStorageBytes: number;
    publishedBuildStorageRemaining: number;
    publishedBuildCount: number;
    runtimeFileStorageBytes: number;
    runtimeFileStorageRemaining: number;
    runtimeFileCount: number;
  };
  requestLimits: {
    dayIndex: number;
    dayKey: string;
    hasVerifiedEmail?: boolean;
    identityType?: 'verified_email' | 'user';
    isLegacyUnverifiedIdentity?: boolean;
    baseEnergyUnitsPerDay?: number;
    energyLimit?: number;
    energyUsed?: number;
    energyCharged?: number;
    energyOverflow?: number;
    energyRemaining?: number;
    energyPercent?: number;
    energySegments?: number;
    energySegmentsRemaining?: number;
    energyUnitsPerSegment?: number;
    currentMode?: 'full_quality' | 'low_energy';
    lastUsageOverflowed?: boolean;
    resetPurchasesToday?: number;
    resetCost?: number;
    generationBaseRequestsPerDay: number;
    generationResetPurchasesToday: number;
    generationResetCost: number;
    generationRequestsPerDay: number;
    generationRequestsToday: number;
    generationRequestsRemaining: number;
  };
  lumineModelPreference?: BuildLumineModelPreference | null;
  lumineModelOptions?: BuildLumineModelOption[];
}

export type BuildRequestLimitsSnapshot = Partial<
  BuildCopilotPolicy['requestLimits']
> &
  Record<string, any>;

export interface BuildRunEvent {
  id: string;
  schemaVersion?: number | null;
  eventType?: string | null;
  source?: string | null;
  threadId?: string | null;
  requestId?: string | null;
  sequence?: number | null;
  buildId?: number | null;
  userId?: number | null;
  kind: 'lifecycle' | 'phase' | 'action' | 'status' | 'usage';
  phase: string | null;
  message: string;
  createdAt: number;
  deduped?: boolean;
  details?:
    | ({
        thoughtContent?: string | null;
        isComplete?: boolean;
        isThinkingHard?: boolean;
      } & Record<string, any>)
    | null;
  usage?:
    | ({
        stage?: string | null;
        model?: string | null;
        inputTokens?: number;
        outputTokens?: number;
        totalTokens?: number;
      } & Record<string, any>)
    | null;
}

export type BuildPlanAction = 'continue' | 'cancel' | 'pivot';

export interface BuildScopedPlanContinuePromptBinding {
  kind: 'scoped_plan_continue';
  question?: string | null;
  executionPlan: BuildExecutionPlan;
}

export interface BuildFollowUpAcceptPromptBinding {
  kind: 'follow_up_accept';
  question?: string | null;
  suggestedMessage: string;
  sourceMessageId?: number | null;
}

export type BuildPromptBinding =
  | BuildScopedPlanContinuePromptBinding
  | BuildFollowUpAcceptPromptBinding;

export interface BuildRuntimeUploadAsset {
  id: number;
  buildId: number;
  buildTitle: string | null;
  buildSlug: string | null;
  buildIsPublic: boolean;
  fileName: string;
  originalFileName: string;
  mimeType: string | null;
  sizeBytes: number;
  filePath: string;
  url: string;
  thumbUrl: string | null;
  fileType: 'image' | 'audio' | 'pdf' | 'archive' | 'other';
  uploadedByUserId: number;
  createdAt: number;
}

export interface BuildRuntimeUploadUsage {
  totalBytes: number;
  fileCount: number;
  maxRuntimeFileStorageBytes: number;
  remainingBytes: number;
}

export interface QueuedBuildRequest {
  id: string;
  message: string;
  planAction?: BuildPlanAction | null;
  promptBinding?: BuildPromptBinding | null;
  messageContext?: string | null;
  existingUserMessageId?: number | null;
  waitForStopRequestId?: string | null;
  createdAt: number;
}

export interface DeferredBuildRequest {
  message: string;
  messageContext?: string | null;
  planAction?: BuildPlanAction | null;
  stopActiveRun?: boolean | null;
  stopRequestId?: string | null;
}

export interface BuildHiddenMessageContextOptions {
  messageText?: string;
  references: Array<{
    fileName: string;
    url: string;
  }>;
}

export interface BuildEditorProps {
  build: Build;
  chatMessages: ChatMessage[];
  copilotPolicy: BuildCopilotPolicy | null;
  isOwner: boolean;
  initialPrompt?: string;
  initialPromptContext?: string;
  forceInitialPrompt?: boolean;
  seedGreeting?: boolean;
  onUpdateBuild: (build: Build) => void;
  onUpdateChatMessages: (messages: ChatMessage[]) => void;
  onUpdateCopilotPolicy: (policy: BuildCopilotPolicy | null) => void;
}

export interface ProjectFileSaveResult {
  success: boolean;
  error?: string;
}

export interface ProjectFileSaveOptions {
  resumePausedQueue?: boolean;
  targetBuildId?: number | null;
  targetBuildCode?: string | null;
}

export interface CurrentBuildRunView {
  requestId: string | null;
  runMode: BuildLiveRunState['runMode'];
  generating: boolean;
  status: string | null;
  assistantStatusSteps: string[];
  agentContext: BuildLiveRunState['agentContext'] | null;
  lifecycle: BuildLiveRunState['lifecycle'] | null;
  usageMetrics: BuildLiveRunState['usageMetrics'];
  runEvents: BuildRunEvent[];
  streamingProjectFiles: Array<{ path: string; content?: string }> | null;
  streamingFocusFilePath: string | null;
  error: string | null;
  terminalState: BuildLiveRunState['terminalState'] | null;
  executionPlan: BuildExecutionPlan | null;
  followUpPrompt: BuildFollowUpPrompt | null;
  runtimeExplorationPlan: BuildRuntimeExplorationPlan | null;
  activeStreamMessageIds: number[];
}
