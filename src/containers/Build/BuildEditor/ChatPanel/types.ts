import type { ReactNode, RefObject } from 'react';

export type ChatPanelRunMode = 'user' | 'greeting' | 'runtime-autofix';
export type ChatPanelCommunicationMode = 'lumine' | 'versions' | 'people';

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
}

export interface BuildCopilotPolicy {
  limits: {
    maxProjectBytes: number;
    maxFilesPerProject: number;
    maxFileLines: number;
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
}

export type BuildAiUsagePolicy = Partial<
  BuildCopilotPolicy['requestLimits']
> &
  Record<string, any>;

export interface BuildRunEvent {
  id: string;
  kind: 'lifecycle' | 'phase' | 'action' | 'status' | 'usage';
  phase: string | null;
  message: string;
  createdAt: number;
  deduped?: boolean;
  details?: {
    thoughtContent?: string | null;
    isComplete?: boolean;
    isThinkingHard?: boolean;
  } | null;
  usage?: {
    stage?: string | null;
    model?: string | null;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  } | null;
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
  peoplePanel?: ReactNode;
  versionsPanel?: ReactNode;
  luminePanelOverride?: ReactNode;
  lumineTabLabel?: string;
  lumineTabIcon?: string;
  lumineChatVisibilityControl?: LumineChatVisibilityControl | null;
  messages: ChatMessage[];
  executionPlan?: BuildExecutionPlanSummary | null;
  scopedPlanQuestion?: string | null;
  followUpPrompt?: BuildFollowUpPrompt | null;
  runMode: ChatPanelRunMode;
  generating: boolean;
  generatingStatus: string | null;
  assistantStatusSteps: string[];
  copilotPolicy: BuildCopilotPolicy | null;
  aiUsagePolicy: BuildAiUsagePolicy | null;
  pageFeedbackEvents: BuildRunEvent[];
  runEvents: BuildRunEvent[];
  runError: string | null;
  activeStreamMessageIds: number[];
  isOwner: boolean;
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
  onDeleteRuntimeUpload: (asset: BuildRuntimeUploadAsset) => Promise<void> | void;
  twinkleCoins: number;
  purchasingGenerationReset: boolean;
  generationResetError: string;
  onPurchaseGenerationReset: () => Promise<void> | void;
  onStopGeneration: () => void;
  onFixRuntimeObservationMessage: (message: ChatMessage) => Promise<boolean> | boolean;
  onDeleteMessage: (message: ChatMessage) => void;
}
