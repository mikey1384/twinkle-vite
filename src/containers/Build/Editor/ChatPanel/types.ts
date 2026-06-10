import type { ReactNode, RefObject } from 'react';
import type {
  BuildAgentAssetCreateOptions,
  BuildAgentAssetCreateResult
} from '~/containers/Build/helpers/agentWorkspaceAssets';

export type ChatPanelRunMode = 'user' | 'greeting' | 'runtime-autofix';
export type ChatPanelCommunicationMode = 'lumine' | 'versions' | 'people';
export type BuildLumineModel = 'claude-fable-5' | 'gpt-5.5' | 'gpt-5.4';
export type BuildLumineThinkLevel =
  | 'none'
  | 'low'
  | 'medium'
  | 'high'
  | 'xhigh';

export interface BuildLumineModelOption {
  model: BuildLumineModel;
  label: string;
  description: string;
  apiContextWindowTokens?: number;
  apiMaxOutputTokens?: number;
  operatingContextWindowTokens?: number;
  operatingMaxOutputTokens?: number;
  maxOutputTokens?: number;
  apiDefaultReasoningEffort?: BuildLumineThinkLevel;
  defaultReasoningEffort: BuildLumineThinkLevel;
  supportedReasoningEfforts: BuildLumineThinkLevel[];
}

export interface BuildLumineModelPreference {
  model: BuildLumineModel;
  reasoningEffort: BuildLumineThinkLevel;
  source?: 'default' | 'stored' | 'explicit' | string;
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
  source?: 'runtime_observation';
  runtimeObservationIssueKey?: string | null;
  runtimeObservationOriginalContent?: string | null;
  runtimeObservationResolved?: boolean;
  runtimeObservationResolvedAt?: number | null;
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

export type BuildAiUsagePolicy = Partial<BuildCopilotPolicy['requestLimits']> &
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

export interface BuildCurrentActivity {
  message: string;
}

export interface BuildStatusStepEntry {
  status: string;
  thoughtContent: string;
  thoughtIsComplete: boolean;
  thoughtIsThinkingHard: boolean;
}

export interface BuildRuntimeDebugSnapshot {
  requestId: string | null;
  threadId: string | null;
  lifecycle: Record<string, any> | null;
  providerChainControl: Record<string, any> | null;
  conflictState: Record<string, any> | null;
  responsesCompaction: Record<string, any> | null;
  eventEnvelope: Record<string, any> | null;
  compactJson: string;
}

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

export interface BuildExecutionPlanSummary {
  status: 'awaiting_confirmation' | 'running' | 'completed' | 'cancelled';
}

export interface BuildFollowUpPrompt {
  question?: string | null;
  suggestedMessage?: string | null;
  sourceMessageId?: number | null;
}

export type BuildLumineChatVisibility = 'private' | 'collaborators';

export interface LumineChatVisibilityControl {
  value: BuildLumineChatVisibility;
  savedValue: BuildLumineChatVisibility;
  loading: boolean;
  error: string;
  onSave: (
    value: BuildLumineChatVisibility
  ) => Promise<boolean | void> | boolean | void;
}

export interface LumineModelSelectionControl {
  value: BuildLumineModelPreference;
  savedValue: BuildLumineModelPreference;
  modelOptions: BuildLumineModelOption[];
  loading: boolean;
  error: string;
  onSave: (
    value: BuildLumineModelPreference
  ) => Promise<boolean | void> | boolean | void;
}

export interface MainUpdateNoticeControl {
  shown: boolean;
  canUpdate: boolean;
  loading: boolean;
  error: string;
  onUpdate: () => Promise<void> | void;
}

export interface LimitProgressItem {
  id: string;
  label: string;
  progress: number;
  text: string;
  caption?: string;
  color?: string;
}

export interface ChatPanelProps {
  className?: string;
  workshopScale?: number;
  preferredCommunicationMode?: ChatPanelCommunicationMode;
  onCommunicationModeChange?: (mode: ChatPanelCommunicationMode) => void;
  communicationScrollTops?: Partial<Record<ChatPanelCommunicationMode, number>>;
  onCommunicationScrollChange?: (
    mode: ChatPanelCommunicationMode,
    scrollTop: number
  ) => void;
  showMainProjectNavigation?: boolean;
  onOpenMainProject?: () => void;
  peoplePanel?: ReactNode;
  versionsPanel?: ReactNode;
  luminePanelOverride?: ReactNode;
  lumineTabLabel?: string;
  lumineTabIcon?: string;
  lumineChatVisibilityControl?: LumineChatVisibilityControl | null;
  lumineModelSelectionControl?: LumineModelSelectionControl | null;
  mainUpdateNoticeControl?: MainUpdateNoticeControl | null;
  messages: ChatMessage[];
  executionPlan?: BuildExecutionPlanSummary | null;
  scopedPlanQuestion?: string | null;
  followUpPrompt?: BuildFollowUpPrompt | null;
  runMode: ChatPanelRunMode;
  generating: boolean;
  generatingStatus: string | null;
  assistantStatusSteps: string[];
  requestId?: string | null;
  agentContext?: Record<string, any> | null;
  lifecycle?: Record<string, any> | null;
  copilotPolicy: BuildCopilotPolicy | null;
  aiUsagePolicy: BuildAiUsagePolicy | null;
  pageFeedbackEvents: BuildRunEvent[];
  runEvents: BuildRunEvent[];
  runError: string | null;
  activeStreamMessageIds: number[];
  isOwner: boolean;
  buildId: number;
  chatScrollRef: RefObject<HTMLDivElement | null>;
  chatEndRef: RefObject<HTMLDivElement | null>;
  onChatScroll: () => void;
  draftMessage: string;
  onDraftMessageChange: (value: string) => void;
  onSendMessage: (message: string) => Promise<boolean> | boolean;
  onContinueScopedPlan: () => void;
  onCancelScopedPlan: () => void;
  onAcceptFollowUpPrompt: () => void;
  onDismissFollowUpPrompt: () => void;
  onOpenBuildChatUpload: () => void;
  uploadInFlight: boolean;
  runtimeUploadsModalShown: boolean;
  runtimeUploadAssets: BuildRuntimeUploadAsset[];
  runtimeUploadsNextCursor: number | null;
  runtimeUploadsLoading: boolean;
  runtimeUploadsLoadingMore: boolean;
  runtimeUploadsError: string;
  runtimeUploadDeletingId: number | null;
  onOpenRuntimeUploadsManager: () => void;
  onCloseRuntimeUploadsManager: () => void;
  onLoadMoreRuntimeUploads: () => void;
  onDeleteRuntimeUpload: (
    asset: BuildRuntimeUploadAsset
  ) => Promise<void> | void;
  onCreateGeneratedRuntimeAsset: (
    options: BuildAgentAssetCreateOptions
  ) => Promise<BuildAgentAssetCreateResult>;
  twinkleCoins: number;
  purchasingGenerationReset: boolean;
  generationResetError: string;
  onPurchaseGenerationReset: () => Promise<void> | void;
  onStopGeneration: () => void;
  onFixRuntimeObservationMessage: (
    message: ChatMessage
  ) => Promise<boolean> | boolean;
  onDeleteMessage: (message: ChatMessage) => void;
}
