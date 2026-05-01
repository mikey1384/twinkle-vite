import {
  getBuildRunEventLogicalIdentity,
  normalizeBuildRunEventCreatedAt
} from './runEventIdentity';
import { createFallbackBuildRunMessageId } from './messageIdentity';

export interface BuildLiveRunMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  codeGenerated: string | null;
  streamCodePreview?: string | null;
  billingState?: 'charged' | 'not_charged' | 'pending' | null;
  artifactVersionId?: number | null;
  clientMessageId?: string | null;
  createdAt: number;
  persisted?: boolean;
}

export interface BuildLiveRunUsageMetric {
  stage: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface BuildLiveRunEvent {
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

export interface BuildLiveRunFollowUpPrompt {
  question?: string | null;
  suggestedMessage?: string | null;
  sourceMessageId?: number | null;
}

export interface BuildLiveRunDeferredRequest {
  message: string;
  messageContext?: string | null;
  planAction?: 'continue' | 'cancel' | 'pivot' | null;
  stopActiveRun?: boolean | null;
  stopRequestId?: string | null;
}

export interface BuildLiveRunState {
  buildId: number;
  requestId: string;
  runMode: 'user' | 'greeting' | 'runtime-autofix';
  generating: boolean;
  terminalState?: 'complete' | 'error' | 'stopped' | null;
  stopReason?: 'user' | 'replacement' | null;
  interruptionReason?: 'tool_limit' | 'energy_depleted' | null;
  error: string | null;
  status: string | null;
  assistantStatusSteps: string[];
  usageMetrics: Record<string, BuildLiveRunUsageMetric>;
  runEvents: BuildLiveRunEvent[];
  userMessage: BuildLiveRunMessage | null;
  assistantMessage: BuildLiveRunMessage | null;
  baseProjectFiles: Array<{ path: string; content?: string }>;
  streamingProjectFiles: Array<{ path: string; content?: string }> | null;
  streamingFocusFilePath: string | null;
  executionPlan?: any | null;
  followUpPrompt?: BuildLiveRunFollowUpPrompt | null;
  deferredBuildRequest?: BuildLiveRunDeferredRequest | null;
  runtimeExplorationPlan?: any | null;
  runtimePlanRefined?: boolean;
  billingState?: 'charged' | 'not_charged' | 'pending' | null;
  requestLimits?: any | null;
  updatedAt: number;
}

export interface BuildWorkspaceSnapshot {
  build: any;
  chatMessages: any[];
  copilotPolicy: any | null;
  updatedAt: number;
}

export type BuildStudioTab =
  | 'mine'
  | 'collaborating'
  | 'community'
  | 'open_source';
type BuildStudioBrowseTab = Exclude<BuildStudioTab, 'mine'>;

export interface BuildStudioBrowseTabState {
  builds: any[];
  loadMoreToken: string | null;
  loaded: boolean;
  userId: number | null;
  scrollY: number;
}

export interface BuildStudioState {
  activeTab: BuildStudioTab;
  myBuilds: any[];
  myBuildsLoaded: boolean;
  myBuildsUserId: number | null;
  myBuildsScrollY: number;
  browse: Record<BuildStudioBrowseTab, BuildStudioBrowseTabState>;
}

export interface BuildLiveRunStreamUpdatePayload {
  userMessageContent?: string | null;
  userClientMessageId?: string | null;
  status?: string | null;
  assistantStatusSteps?: string[];
  reply?: string;
  codeGenerated?: string | null;
  userMessageId?: number | null;
  assistantMessageId?: number | null;
  assistantClientMessageId?: string | null;
  assistantMessageCreatedAt?: number | null;
  usageMetrics?: Record<string, BuildLiveRunUsageMetric>;
  baseProjectFiles?: Array<{ path: string; content?: string }> | null;
  projectFiles?: Array<{ path: string; content?: string }> | null;
  projectFilesMode?: 'patch' | 'snapshot' | null;
  projectFilesPersisted?: boolean;
  projectFilesFocusPath?: string | null;
  executionPlan?: any | null;
  followUpPrompt?: BuildLiveRunFollowUpPrompt | null;
  deferredBuildRequest?: BuildLiveRunDeferredRequest | null;
  runtimeExplorationPlan?: any | null;
  runtimePlanRefined?: boolean;
  billingState?: 'charged' | 'not_charged' | 'pending' | null;
  requestLimits?: any | null;
}

export interface BuildLiveRunRunningSnapshotPayload {
  status?: string | null;
  assistantStatusSteps?: string[];
  usageMetrics?: Record<string, BuildLiveRunUsageMetric>;
  updatedAt?: number | null;
}

export interface BuildLiveRunActionPayload
  extends BuildLiveRunStreamUpdatePayload {
  buildId?: number;
  build?: any;
  chatMessages?: any[];
  copilotPolicy?: any | null;
  requestId?: string;
  runMode?: BuildLiveRunState['runMode'];
  generating?: boolean;
  status?: string | null;
  assistantStatusSteps?: string[];
  userMessage?: BuildLiveRunMessage | null;
  assistantMessage?: BuildLiveRunMessage | null;
  baseProjectFiles?: Array<{ path: string; content?: string }> | null;
  runningSnapshot?: BuildLiveRunRunningSnapshotPayload | null;
  workspaceChanged?: boolean;
  event?: BuildLiveRunEvent | null;
  messageId?: number | null;
  messageRole?: BuildLiveRunMessage['role'] | null;
  clientMessageId?: string | null;
  assistantText?: string;
  stopReason?: 'user' | 'replacement' | null;
  artifactCode?: string | null;
  artifactVersionId?: number | null;
  persistedAssistantId?: number | null;
  persistedUserId?: number | null;
  createdAt?: number;
  interruptionReason?: 'tool_limit' | 'energy_depleted' | null;
  error?: string;
  preserveAssistantArtifactsOnError?: boolean;
  preserveTransientUserMessage?: boolean;
  preserveTransientAssistantMessage?: boolean;
  updatedAt?: number;
}

export interface BuildRuntimeVerifyResultPayload {
  buildId?: number | null;
  requestId?: string;
  status?: 'complete' | 'error' | null;
  improved?: boolean;
  reason?: string | null;
  shouldRepairAgain?: boolean;
  nextRemainingRepairs?: number | null;
  error?: string | null;
}

export interface BuildRuntimeVerifyResult {
  buildId: number | null;
  requestId: string;
  status: 'complete' | 'error';
  improved: boolean;
  reason: string | null;
  shouldRepairAgain: boolean;
  nextRemainingRepairs: number;
  error: string | null;
}

export interface BuildStudioActionPayload {
  activeTab?: BuildStudioTab;
  tab?: BuildStudioTab;
  builds?: any[];
  build?: any;
  buildId?: number;
  userId?: number | null;
  loadMoreToken?: string | null;
  scrollY?: number;
}

export interface BuildState {
  buildRuns: Record<string, BuildLiveRunState>;
  buildRunRequestMap: Record<string, number>;
  buildWorkspaces: Record<string, BuildWorkspaceSnapshot>;
  runtimeVerifyResults: Record<string, BuildRuntimeVerifyResult>;
  buildStudio: BuildStudioState;
}

export interface BuildAction {
  type:
    | 'REGISTER_BUILD_RUN'
    | 'UPDATE_BUILD_RUN_STATUS'
    | 'UPDATE_BUILD_RUN_STREAM'
    | 'APPLY_BUILD_RUN_RUNNING_SNAPSHOT'
    | 'APPEND_BUILD_RUN_EVENT'
    | 'COMPLETE_BUILD_RUN'
    | 'FAIL_BUILD_RUN'
    | 'STOP_BUILD_RUN'
    | 'REMOVE_BUILD_RUN_MESSAGE'
    | 'SET_BUILD_WORKSPACE'
    | 'SET_BUILD_STUDIO_ACTIVE_TAB'
    | 'SET_BUILD_STUDIO_MY_BUILDS'
    | 'PATCH_BUILD_STUDIO_MY_BUILD'
    | 'REMOVE_BUILD_STUDIO_MY_BUILD'
    | 'SET_BUILD_STUDIO_BROWSE_BUILDS'
    | 'APPEND_BUILD_STUDIO_BROWSE_BUILDS'
    | 'SET_BUILD_STUDIO_SCROLL'
    | 'PUBLISH_BUILD_RUNTIME_VERIFY_RESULT'
    | 'CLEAR_BUILD_RUNTIME_VERIFY_RESULT'
    | 'CLEAR_BUILD_RUN'
    | 'RESET_BUILD_RUNS';
  buildRun?: BuildLiveRunActionPayload;
  runtimeVerifyResult?: BuildRuntimeVerifyResultPayload;
  buildStudio?: BuildStudioActionPayload;
}

export function createInitialBuildStudioState(): BuildStudioState {
  return {
    activeTab: 'mine',
    myBuilds: [],
    myBuildsLoaded: false,
    myBuildsUserId: null,
    myBuildsScrollY: 0,
    browse: {
      community: createInitialBuildStudioBrowseState(),
      collaborating: createInitialBuildStudioBrowseState(),
      open_source: createInitialBuildStudioBrowseState()
    }
  };
}

function createInitialBuildStudioBrowseState(): BuildStudioBrowseTabState {
  return {
    builds: [],
    loadMoreToken: null,
    loaded: false,
    userId: null,
    scrollY: 0
  };
}

function getBuildRunLookupBuildId(
  state: BuildState,
  buildRun?: BuildLiveRunActionPayload
) {
  const explicitBuildId = Number(buildRun?.buildId || 0);
  if (explicitBuildId > 0) return explicitBuildId;
  const requestId = String(buildRun?.requestId || '').trim();
  if (!requestId) return 0;
  return Number(state.buildRunRequestMap[requestId] || 0) || 0;
}

function getBuildRunKey(buildId: number) {
  return String(Number(buildId) || 0);
}

function getBuildRuntimeVerifyResultKey(
  runtimeVerifyResult?: BuildRuntimeVerifyResultPayload
) {
  const requestId = String(runtimeVerifyResult?.requestId || '').trim();
  if (!requestId) return '';
  const buildId = Number(runtimeVerifyResult?.buildId || 0);
  return `${buildId > 0 ? buildId : 0}:${requestId}`;
}

function getBuildStudioState(state: BuildState) {
  return state.buildStudio || createInitialBuildStudioState();
}

function normalizeBuildStudioTab(value?: string | null): BuildStudioTab {
  return value === 'collaborating' ||
    value === 'community' ||
    value === 'open_source'
    ? value
    : 'mine';
}

function normalizeBuildStudioBrowseTab(
  value?: string | null
): BuildStudioBrowseTab {
  if (value === 'collaborating') return 'collaborating';
  return value === 'open_source' ? 'open_source' : 'community';
}

function normalizeBuildStudioUserId(value: unknown) {
  const userId = Math.floor(Number(value) || 0);
  return userId > 0 ? userId : null;
}

function normalizeBuildStudioScrollY(value: unknown) {
  const normalized = Number(value || 0);
  if (!Number.isFinite(normalized)) return 0;
  return Math.max(0, Math.floor(normalized));
}

function patchBuildStudioMyBuild(
  builds: any[],
  nextBuild?: any | null
) {
  const buildId = Number(nextBuild?.id || 0);
  if (!buildId) return builds;
  return builds.map((build) =>
    Number(build?.id || 0) === buildId ? { ...build, ...nextBuild } : build
  );
}

function normalizeBuildRunProjectFilePath(rawPath: string) {
  const trimmedPath = String(rawPath || '').trim().replace(/\\/g, '/');
  if (!trimmedPath) return null;
  const normalized = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;
  return normalized.replace(/\/{2,}/g, '/');
}

function normalizeBuildRunClientMessageId(value: unknown) {
  const normalized = String(value || '').trim();
  return normalized || null;
}

function getStreamingFocusFilePath(
  projectFiles?: Array<{ path: string; content?: string }> | null
) {
  const firstNonIndexPath = (projectFiles || [])
    .map((file) => {
      return normalizeBuildRunProjectFilePath(String(file?.path || ''));
    })
    .find((path): path is string => {
      if (!path) return false;
      const lowerPath = path.toLowerCase();
      return lowerPath !== '/index.html' && lowerPath !== '/index.htm';
    });
  return firstNonIndexPath || null;
}

function normalizeBuildRunProjectFiles(
  projectFiles?: Array<{ path: string; content?: string }> | null
) {
  const merged = new Map<string, string>();
  for (const file of projectFiles || []) {
    if (!file || typeof file !== 'object') continue;
    const rawPath = String(file.path || '').trim().replace(/\\/g, '/');
    if (!rawPath) continue;
    const normalized = (rawPath.startsWith('/') ? rawPath : `/${rawPath}`).replace(
      /\/{2,}/g,
      '/'
    );
    merged.set(
      normalized,
      typeof file.content === 'string' ? file.content : ''
    );
  }
  return Array.from(merged.entries()).map(([path, content]) => ({
    path,
    content
  }));
}

function overlayBuildRunProjectFiles({
  baseFiles,
  updates
}: {
  baseFiles: Array<{ path: string; content?: string }>;
  updates?: Array<{ path: string; content?: string }> | null;
}) {
  const merged = new Map<string, string>();
  for (const file of normalizeBuildRunProjectFiles(baseFiles)) {
    merged.set(file.path, typeof file.content === 'string' ? file.content : '');
  }
  for (const file of normalizeBuildRunProjectFiles(updates)) {
    merged.set(file.path, typeof file.content === 'string' ? file.content : '');
  }
  return Array.from(merged.entries()).map(([path, content]) => ({
    path,
    content
  }));
}

function appendAssistantStatusStep(
  steps: string[],
  status: string | null | undefined
) {
  const nextStatus = String(status || '').trim();
  if (!nextStatus) return steps;
  return steps[steps.length - 1] === nextStatus ? steps : [...steps, nextStatus];
}

function normalizeBuildRunAssistantStatusSteps(
  assistantStatusSteps?: string[],
  fallbackStatus?: string | null
) {
  const normalizedAssistantStatusSteps = Array.isArray(assistantStatusSteps)
    ? assistantStatusSteps.filter(
        (step): step is string =>
          typeof step === 'string' && step.trim().length > 0
      )
    : [];

  if (normalizedAssistantStatusSteps.length > 0) {
    return normalizedAssistantStatusSteps;
  }

  const normalizedFallbackStatus = String(fallbackStatus || '').trim();
  return normalizedFallbackStatus ? [normalizedFallbackStatus] : [];
}

function normalizeBuildRunUsageMetrics(
  usageMetrics?: Record<string, BuildLiveRunUsageMetric>
) {
  return Object.values(usageMetrics || {}).reduce<
    Record<string, BuildLiveRunUsageMetric>
  >((result, metric) => {
    const stage = String(metric?.stage || '').trim();
    const model = String(metric?.model || '').trim();
    if (!stage || !model) return result;
    result[stage] = {
      stage,
      model,
      inputTokens: Number(metric?.inputTokens || 0),
      outputTokens: Number(metric?.outputTokens || 0),
      totalTokens: Number(metric?.totalTokens || 0)
    };
    return result;
  }, {});
}

function normalizeBuildRunDeferredRequest(
  deferredBuildRequest?: BuildLiveRunDeferredRequest | null
) {
  const message = String(deferredBuildRequest?.message || '').trim();
  if (!message) return null;
  const messageContext =
    String(deferredBuildRequest?.messageContext || '').trim() || null;
  const planAction =
    deferredBuildRequest?.planAction === 'continue' ||
    deferredBuildRequest?.planAction === 'cancel' ||
    deferredBuildRequest?.planAction === 'pivot'
      ? deferredBuildRequest.planAction
      : null;
  const stopRequestId =
    String(deferredBuildRequest?.stopRequestId || '').trim() || null;
  return {
    message,
    messageContext,
    planAction,
    stopActiveRun:
      typeof deferredBuildRequest?.stopActiveRun === 'boolean'
        ? deferredBuildRequest.stopActiveRun
        : null,
    stopRequestId
  };
}

function resolveBuildRunUpdatedAt(
  updatedAt?: number | null,
  fallbackUpdatedAt?: number
) {
  const normalizedUpdatedAt = Number(updatedAt || 0);
  if (normalizedUpdatedAt > 0) {
    return normalizedUpdatedAt;
  }
  const normalizedFallbackUpdatedAt = Number(fallbackUpdatedAt || 0);
  return normalizedFallbackUpdatedAt > 0
    ? normalizedFallbackUpdatedAt
    : Date.now();
}

function applyBuildRunStreamUpdate(
  currentRun: BuildLiveRunState,
  buildRun?: BuildLiveRunStreamUpdatePayload | null,
  options?: {
    updatedAt?: number | null;
  }
): BuildLiveRunState {
  const hasStatusField = Object.prototype.hasOwnProperty.call(
    buildRun || {},
    'status'
  );
  const hasUserMessageContentField = Object.prototype.hasOwnProperty.call(
    buildRun || {},
    'userMessageContent'
  );
  const hasUserClientMessageIdField = Object.prototype.hasOwnProperty.call(
    buildRun || {},
    'userClientMessageId'
  );
  const hasAssistantClientMessageIdField =
    Object.prototype.hasOwnProperty.call(
      buildRun || {},
      'assistantClientMessageId'
    );
  const hasAssistantStatusStepsField = Object.prototype.hasOwnProperty.call(
    buildRun || {},
    'assistantStatusSteps'
  );
  const hasCodeGeneratedField = Object.prototype.hasOwnProperty.call(
    buildRun || {},
    'codeGenerated'
  );
  const hasUsageMetricsField = Object.prototype.hasOwnProperty.call(
    buildRun || {},
    'usageMetrics'
  );
  const hasBaseProjectFilesField = Object.prototype.hasOwnProperty.call(
    buildRun || {},
    'baseProjectFiles'
  );
  const normalizedBaseProjectFiles = hasBaseProjectFilesField
    ? normalizeBuildRunProjectFiles(
        Array.isArray(buildRun?.baseProjectFiles) ? buildRun.baseProjectFiles : []
      )
    : null;
  const projectFilesMode =
    buildRun?.projectFilesMode === 'snapshot' ? 'snapshot' : 'patch';
  const incomingProjectFiles = Array.isArray(buildRun?.projectFiles)
    ? buildRun.projectFiles
    : null;
  const hasProjectFilesField = incomingProjectFiles !== null;
  const hasProjectFileUpdates =
    hasProjectFilesField &&
    (projectFilesMode === 'snapshot' ||
      incomingProjectFiles.length > 0 ||
      buildRun?.projectFilesPersisted === true);
  const normalizedProjectFiles = hasProjectFilesField
    ? normalizeBuildRunProjectFiles(incomingProjectFiles)
    : null;
  const hasExplicitProjectFilesFocusPath = Object.prototype.hasOwnProperty.call(
    buildRun || {},
    'projectFilesFocusPath'
  );
  const explicitProjectFilesFocusPath = hasExplicitProjectFilesFocusPath
    ? typeof buildRun?.projectFilesFocusPath === 'string'
      ? normalizeBuildRunProjectFilePath(buildRun.projectFilesFocusPath)
      : null
    : undefined;
  const projectFilesPersisted = buildRun?.projectFilesPersisted === true;
  const persistedUserMessageId =
    Number(buildRun?.userMessageId || 0) > 0
      ? Number(buildRun?.userMessageId)
      : null;
  const persistedAssistantMessageId =
    Number(buildRun?.assistantMessageId || 0) > 0
      ? Number(buildRun?.assistantMessageId)
      : null;
  const persistedAssistantMessageCreatedAt =
    Number(buildRun?.assistantMessageCreatedAt || 0) > 0
      ? Number(buildRun?.assistantMessageCreatedAt)
      : null;
  const normalizedUserMessageContent = hasUserMessageContentField
    ? typeof buildRun?.userMessageContent === 'string'
      ? buildRun.userMessageContent
      : ''
    : null;
  const normalizedUserClientMessageId = hasUserClientMessageIdField
    ? normalizeBuildRunClientMessageId(buildRun?.userClientMessageId)
    : null;
  const normalizedAssistantClientMessageId = hasAssistantClientMessageIdField
    ? normalizeBuildRunClientMessageId(buildRun?.assistantClientMessageId)
    : null;
  const latestAssistantStatusStep = Array.isArray(buildRun?.assistantStatusSteps)
    ? String(
        buildRun.assistantStatusSteps[buildRun.assistantStatusSteps.length - 1] ||
          ''
      ).trim() || null
    : null;
  const nextStatus = hasStatusField
    ? typeof buildRun?.status === 'string'
      ? buildRun.status
      : null
    : hasAssistantStatusStepsField
      ? latestAssistantStatusStep
      : currentRun.status;
  const nextAssistantStatusSteps = hasAssistantStatusStepsField
    ? normalizeBuildRunAssistantStatusSteps(
        buildRun?.assistantStatusSteps,
        nextStatus
      )
    : hasStatusField
      ? appendAssistantStatusStep(currentRun.assistantStatusSteps, nextStatus)
      : currentRun.assistantStatusSteps;
  const nextBaseProjectFiles = hasBaseProjectFilesField
    ? normalizedBaseProjectFiles || []
    : projectFilesPersisted && normalizedProjectFiles
      ? normalizedProjectFiles
      : currentRun.baseProjectFiles;
  const nextStreamingProjectFiles = hasProjectFileUpdates
    ? projectFilesMode === 'snapshot'
      ? normalizedProjectFiles
      : overlayBuildRunProjectFiles({
          baseFiles:
            currentRun.streamingProjectFiles !== null
              ? currentRun.streamingProjectFiles
              : hasBaseProjectFilesField
                ? nextBaseProjectFiles
                : currentRun.baseProjectFiles,
          updates: normalizedProjectFiles
        })
    : currentRun.streamingProjectFiles;

  return {
    ...currentRun,
    generating: true,
    terminalState: null,
    stopReason: null,
    interruptionReason: null,
    error: null,
    status: nextStatus,
    assistantStatusSteps: nextAssistantStatusSteps,
    userMessage:
      currentRun.userMessage
        ? {
            ...currentRun.userMessage,
            ...(persistedUserMessageId
              ? {
                  id: persistedUserMessageId,
                  persisted: true
                }
              : {}),
            ...(hasUserMessageContentField
              ? {
                  content: normalizedUserMessageContent || currentRun.userMessage.content
                }
              : {}),
            ...(hasUserClientMessageIdField
              ? {
                  clientMessageId: normalizedUserClientMessageId
                }
              : {})
          }
        : persistedUserMessageId !== null ||
            hasUserMessageContentField ||
            hasUserClientMessageIdField
          ? {
              id:
                persistedUserMessageId ||
                createFallbackBuildRunMessageId(),
              role: 'user' as const,
              content: normalizedUserMessageContent || '',
              codeGenerated: null,
              billingState: null,
              artifactVersionId: null,
              clientMessageId: normalizedUserClientMessageId,
              createdAt: Math.floor(Date.now() / 1000),
              persisted: persistedUserMessageId !== null
            }
          : currentRun.userMessage,
    assistantMessage: currentRun.assistantMessage
      ? {
          ...currentRun.assistantMessage,
          id: persistedAssistantMessageId || currentRun.assistantMessage.id,
          persisted:
            persistedAssistantMessageId !== null
              ? true
              : currentRun.assistantMessage.persisted,
          content:
            typeof buildRun?.reply === 'string'
              ? buildRun.reply
              : currentRun.assistantMessage.content,
          createdAt:
            persistedAssistantMessageCreatedAt ||
            currentRun.assistantMessage.createdAt,
          ...(hasCodeGeneratedField
            ? {
                streamCodePreview: buildRun?.codeGenerated ?? null
              }
            : {}),
          ...(hasAssistantClientMessageIdField
            ? {
                clientMessageId: normalizedAssistantClientMessageId
              }
            : {})
        }
      : persistedAssistantMessageId ||
          typeof buildRun?.reply === 'string' ||
          hasAssistantClientMessageIdField
        ? {
            id:
              persistedAssistantMessageId ||
              createFallbackBuildRunMessageId(),
            role: 'assistant' as const,
            content: typeof buildRun?.reply === 'string' ? buildRun.reply : '',
            codeGenerated: null,
            ...(hasCodeGeneratedField
              ? {
                  streamCodePreview: buildRun?.codeGenerated ?? null
                }
              : {}),
            billingState: null,
            artifactVersionId: null,
            clientMessageId: normalizedAssistantClientMessageId,
            createdAt:
              persistedAssistantMessageCreatedAt ||
              Math.floor(Date.now() / 1000),
            persisted: persistedAssistantMessageId !== null
          }
        : currentRun.assistantMessage,
    usageMetrics: hasUsageMetricsField
      ? normalizeBuildRunUsageMetrics(buildRun?.usageMetrics)
      : currentRun.usageMetrics,
    baseProjectFiles: nextBaseProjectFiles,
    streamingProjectFiles: projectFilesPersisted
      ? null
      : nextStreamingProjectFiles,
    streamingFocusFilePath:
      projectFilesPersisted
        ? null
        : hasExplicitProjectFilesFocusPath
          ? explicitProjectFilesFocusPath ?? null
          : hasProjectFileUpdates
            ? getStreamingFocusFilePath(buildRun?.projectFiles)
            : currentRun.streamingFocusFilePath,
    executionPlan:
      Object.prototype.hasOwnProperty.call(buildRun || {}, 'executionPlan')
        ? buildRun?.executionPlan ?? null
        : currentRun.executionPlan,
    followUpPrompt:
      Object.prototype.hasOwnProperty.call(buildRun || {}, 'followUpPrompt')
        ? buildRun?.followUpPrompt ?? null
        : currentRun.followUpPrompt,
    deferredBuildRequest:
      Object.prototype.hasOwnProperty.call(
        buildRun || {},
        'deferredBuildRequest'
      )
        ? normalizeBuildRunDeferredRequest(buildRun?.deferredBuildRequest)
        : currentRun.deferredBuildRequest,
    runtimeExplorationPlan: Object.prototype.hasOwnProperty.call(
      buildRun || {},
      'runtimeExplorationPlan'
    )
      ? buildRun?.runtimeExplorationPlan ?? null
      : currentRun.runtimeExplorationPlan,
    runtimePlanRefined:
      typeof buildRun?.runtimePlanRefined === 'boolean'
        ? buildRun.runtimePlanRefined
        : currentRun.runtimePlanRefined,
    billingState:
      Object.prototype.hasOwnProperty.call(buildRun || {}, 'billingState')
        ? buildRun?.billingState ?? null
        : currentRun.billingState,
    requestLimits: Object.prototype.hasOwnProperty.call(
      buildRun || {},
      'requestLimits'
    )
      ? buildRun?.requestLimits ?? null
      : currentRun.requestLimits,
    updatedAt: resolveBuildRunUpdatedAt(options?.updatedAt)
  };
}

function upsertBuildRun(
  state: BuildState,
  buildId: number,
  nextRun: BuildLiveRunState
) {
  return {
    ...state,
    buildRuns: {
      ...state.buildRuns,
      [getBuildRunKey(buildId)]: nextRun
    },
    buildRunRequestMap: nextRun.requestId
      ? {
          ...state.buildRunRequestMap,
          [nextRun.requestId]: buildId
        }
      : state.buildRunRequestMap
  };
}

function removeBuildRunRequestMapping(
  requestMap: Record<string, number>,
  requestId: string
) {
  if (!requestId || !requestMap[requestId]) return requestMap;
  const nextMap = { ...requestMap };
  delete nextMap[requestId];
  return nextMap;
}

export default function BuildReducer(
  state: BuildState,
  action: BuildAction
): BuildState {
  switch (action.type) {
    case 'REGISTER_BUILD_RUN': {
      const buildId = Number(action.buildRun?.buildId || 0);
      const requestId = String(action.buildRun?.requestId || '').trim();
      if (!buildId || !requestId) return state;
      const nextStatus =
        typeof action.buildRun?.status === 'string'
          ? action.buildRun.status
          : null;
      const nextAssistantStatusSteps = normalizeBuildRunAssistantStatusSteps(
        action.buildRun?.assistantStatusSteps,
        nextStatus
      );
      return upsertBuildRun(state, buildId, {
        buildId,
        requestId,
        runMode: action.buildRun?.runMode || 'user',
        generating: action.buildRun?.generating !== false,
        terminalState: null,
        stopReason: null,
        interruptionReason: null,
        error:
          typeof action.buildRun?.error === 'string' &&
          action.buildRun.error.trim()
            ? action.buildRun.error
            : null,
        status: nextStatus,
        assistantStatusSteps: nextAssistantStatusSteps,
        usageMetrics: {},
        runEvents: [],
        userMessage: action.buildRun?.userMessage || null,
        assistantMessage: action.buildRun?.assistantMessage || null,
        baseProjectFiles: normalizeBuildRunProjectFiles(
          action.buildRun?.baseProjectFiles
        ),
        streamingProjectFiles: null,
        streamingFocusFilePath: null,
        executionPlan: null,
        followUpPrompt: null,
        deferredBuildRequest: null,
        runtimeExplorationPlan: null,
        runtimePlanRefined: false,
        billingState: null,
        updatedAt:
          Number(action.buildRun?.updatedAt || 0) > 0
            ? Number(action.buildRun?.updatedAt)
            : Date.now()
      });
    }
    case 'UPDATE_BUILD_RUN_STATUS': {
      const buildId = getBuildRunLookupBuildId(state, action.buildRun);
      if (!buildId) return state;
      const key = getBuildRunKey(buildId);
      const currentRun = state.buildRuns[key];
      if (!currentRun) return state;
      const nextStatus =
        typeof action.buildRun?.status === 'string'
          ? action.buildRun.status
          : null;
      return upsertBuildRun(state, buildId, {
        ...currentRun,
        generating: true,
        terminalState: null,
        stopReason: null,
        interruptionReason: null,
        error: null,
        status: nextStatus,
        assistantStatusSteps: appendAssistantStatusStep(
          currentRun.assistantStatusSteps,
          nextStatus
        ),
        updatedAt: Date.now()
      });
    }
    case 'UPDATE_BUILD_RUN_STREAM': {
      const buildId = getBuildRunLookupBuildId(state, action.buildRun);
      if (!buildId) return state;
      const key = getBuildRunKey(buildId);
      const currentRun = state.buildRuns[key];
      if (!currentRun) return state;
      const nextUpdatedAt = resolveBuildRunUpdatedAt(action.buildRun?.updatedAt);
      return upsertBuildRun(
        state,
        buildId,
        applyBuildRunStreamUpdate(currentRun, action.buildRun, {
          updatedAt: nextUpdatedAt
        })
      );
    }
    case 'APPLY_BUILD_RUN_RUNNING_SNAPSHOT': {
      const buildId = getBuildRunLookupBuildId(state, action.buildRun);
      if (!buildId) return state;
      const key = getBuildRunKey(buildId);
      const currentRun = state.buildRuns[key];
      const runningSnapshot = action.buildRun?.runningSnapshot;
      if (!currentRun || !runningSnapshot) return state;
      const nextStatus =
        typeof runningSnapshot.status === 'string'
          ? runningSnapshot.status
          : null;
      const nextUpdatedAt = resolveBuildRunUpdatedAt(
        runningSnapshot.updatedAt,
        currentRun.updatedAt
      );
      const nextRunWithoutStreamUpdate: BuildLiveRunState = {
        ...currentRun,
        generating: true,
        terminalState: null,
        stopReason: null,
        interruptionReason: null,
        error: null,
        status: nextStatus,
        assistantStatusSteps: normalizeBuildRunAssistantStatusSteps(
          runningSnapshot.assistantStatusSteps,
          nextStatus
        ),
        usageMetrics: normalizeBuildRunUsageMetrics(runningSnapshot.usageMetrics),
        updatedAt: nextUpdatedAt
      };
      return upsertBuildRun(state, buildId, nextRunWithoutStreamUpdate);
    }
    case 'APPEND_BUILD_RUN_EVENT': {
      const buildId = getBuildRunLookupBuildId(state, action.buildRun);
      if (!buildId || !action.buildRun?.event) return state;
      const key = getBuildRunKey(buildId);
      const currentRun = state.buildRuns[key];
      if (!currentRun) return state;
      const nextEvent = action.buildRun.event;
      const nextEventIdentity = getBuildRunEventLogicalIdentity(nextEvent);
      let nextRunEvents: BuildLiveRunEvent[];

      if (nextEventIdentity.hasStableId) {
        const existingEventIndex = currentRun.runEvents.findIndex((event) => {
          const existingEventIdentity = getBuildRunEventLogicalIdentity(event);
          return (
            existingEventIdentity.hasStableId &&
            existingEventIdentity.key === nextEventIdentity.key
          );
        });

        nextRunEvents =
          existingEventIndex >= 0
            ? currentRun.runEvents.map((event, index) => {
                if (index !== existingEventIndex) {
                  return event;
                }
                return {
                  ...event,
                  ...nextEvent,
                  id: event.id
                };
              })
            : [...currentRun.runEvents, nextEvent].slice(-40);
      } else {
        const lastEvent = currentRun.runEvents[currentRun.runEvents.length - 1];
        const normalizedNextEventCreatedAt = normalizeBuildRunEventCreatedAt(
          nextEvent.createdAt
        );
        const normalizedLastEventCreatedAt = normalizeBuildRunEventCreatedAt(
          lastEvent?.createdAt
        );

        nextRunEvents =
          lastEvent &&
          lastEvent.kind === nextEvent.kind &&
          lastEvent.phase === nextEvent.phase &&
          lastEvent.message === nextEvent.message &&
          Math.abs(
            normalizedLastEventCreatedAt - normalizedNextEventCreatedAt
          ) < 1500
            ? [
                ...currentRun.runEvents.slice(0, -1),
                {
                  ...lastEvent,
                  createdAt:
                    normalizedNextEventCreatedAt || lastEvent.createdAt,
                  deduped: nextEvent.deduped,
                  details: nextEvent.details ?? lastEvent.details ?? null,
                  usage: nextEvent.usage ?? lastEvent.usage ?? null
                }
              ]
            : [...currentRun.runEvents, nextEvent].slice(-40);
      }
      const lifecycleErrorMessage =
        nextEvent.kind === 'lifecycle' &&
        String(nextEvent.phase || '').trim().toLowerCase() === 'error'
          ? String(nextEvent.message || '')
              .replace(/^.*?failed:\s*/i, '')
              .trim()
          : '';
      return upsertBuildRun(state, buildId, {
        ...currentRun,
        runEvents: nextRunEvents,
        error: lifecycleErrorMessage || currentRun.error,
        updatedAt: resolveBuildRunUpdatedAt(action.buildRun?.updatedAt)
      });
    }
    case 'COMPLETE_BUILD_RUN': {
      const buildId = getBuildRunLookupBuildId(state, action.buildRun);
      if (!buildId) return state;
      const key = getBuildRunKey(buildId);
      const currentRun = state.buildRuns[key];
      if (!currentRun) return state;
      const nextRequestMap = removeBuildRunRequestMapping(
        state.buildRunRequestMap,
        currentRun.requestId
      );
      const nextRun = {
        ...currentRun,
        generating: false,
        terminalState: 'complete' as const,
        stopReason: null,
        interruptionReason:
          action.buildRun &&
          Object.prototype.hasOwnProperty.call(
            action.buildRun,
            'interruptionReason'
          )
            ? action.buildRun.interruptionReason ?? null
            : currentRun.interruptionReason ?? null,
        error: null,
        status: null,
        assistantStatusSteps: [],
        userMessage:
          currentRun.userMessage &&
          Number(action.buildRun?.persistedUserId || 0) > 0
            ? {
                ...currentRun.userMessage,
                id: Number(action.buildRun?.persistedUserId),
                ...(Object.prototype.hasOwnProperty.call(
                  action.buildRun || {},
                  'userClientMessageId'
                )
                  ? {
                      clientMessageId: normalizeBuildRunClientMessageId(
                        action.buildRun?.userClientMessageId
                      )
                    }
                  : {}),
                persisted: true
              }
            : currentRun.userMessage,
        assistantMessage: currentRun.assistantMessage
          ? {
              ...currentRun.assistantMessage,
              id:
                Number(action.buildRun?.persistedAssistantId || 0) > 0
                  ? Number(action.buildRun?.persistedAssistantId)
                  : currentRun.assistantMessage.id,
              ...(Object.prototype.hasOwnProperty.call(
                action.buildRun || {},
                'assistantClientMessageId'
              )
                ? {
                    clientMessageId: normalizeBuildRunClientMessageId(
                      action.buildRun?.assistantClientMessageId
                    )
                  }
                : {}),
              persisted:
                Number(action.buildRun?.persistedAssistantId || 0) > 0
                  ? true
                  : currentRun.assistantMessage.persisted,
              content:
                typeof action.buildRun?.assistantText === 'string'
                  ? action.buildRun.assistantText
                  : currentRun.assistantMessage.content,
              codeGenerated:
                action.buildRun &&
                Object.prototype.hasOwnProperty.call(action.buildRun, 'artifactCode')
                  ? action.buildRun?.artifactCode ?? null
                  : currentRun.assistantMessage.codeGenerated,
              billingState:
                action.buildRun &&
                Object.prototype.hasOwnProperty.call(action.buildRun, 'billingState')
                  ? action.buildRun.billingState ?? null
                  : currentRun.assistantMessage.billingState ?? null,
              streamCodePreview: null,
              artifactVersionId:
                Number(action.buildRun?.artifactVersionId || 0) > 0
                  ? Number(action.buildRun?.artifactVersionId)
                  : currentRun.assistantMessage.artifactVersionId ?? null,
              createdAt:
                Number(action.buildRun?.createdAt || 0) > 0
                  ? Number(action.buildRun?.createdAt)
                  : currentRun.assistantMessage.createdAt
            }
          : currentRun.assistantMessage,
        baseProjectFiles:
          Array.isArray(action.buildRun?.projectFiles) &&
          action.buildRun.projectFiles.length > 0
            ? normalizeBuildRunProjectFiles(action.buildRun.projectFiles)
            : action.buildRun?.workspaceChanged === false
              ? currentRun.baseProjectFiles
            : currentRun.streamingProjectFiles !== null
              ? currentRun.streamingProjectFiles
              : currentRun.baseProjectFiles,
        streamingProjectFiles: null,
        streamingFocusFilePath: null,
        executionPlan:
          action.buildRun &&
          Object.prototype.hasOwnProperty.call(action.buildRun, 'executionPlan')
            ? action.buildRun.executionPlan ?? null
            : currentRun.executionPlan,
        followUpPrompt:
          action.buildRun &&
          Object.prototype.hasOwnProperty.call(action.buildRun, 'followUpPrompt')
            ? action.buildRun.followUpPrompt ?? null
            : currentRun.followUpPrompt,
        deferredBuildRequest:
          action.buildRun &&
          Object.prototype.hasOwnProperty.call(
            action.buildRun,
            'deferredBuildRequest'
          )
            ? normalizeBuildRunDeferredRequest(action.buildRun.deferredBuildRequest)
            : currentRun.deferredBuildRequest,
        runtimeExplorationPlan:
          action.buildRun &&
          Object.prototype.hasOwnProperty.call(
            action.buildRun,
            'runtimeExplorationPlan'
          )
            ? action.buildRun.runtimeExplorationPlan ?? null
            : currentRun.runtimeExplorationPlan,
        runtimePlanRefined:
          typeof action.buildRun?.runtimePlanRefined === 'boolean'
            ? action.buildRun.runtimePlanRefined
            : currentRun.runtimePlanRefined,
        billingState:
          action.buildRun &&
          Object.prototype.hasOwnProperty.call(action.buildRun, 'billingState')
            ? action.buildRun.billingState ?? null
            : currentRun.billingState,
        requestLimits:
          action.buildRun &&
          Object.prototype.hasOwnProperty.call(action.buildRun, 'requestLimits')
            ? action.buildRun.requestLimits ?? null
            : currentRun.requestLimits,
        updatedAt: Date.now()
      };
      return {
        ...state,
        buildRuns: {
          ...state.buildRuns,
          [key]: nextRun
        },
        buildRunRequestMap: nextRequestMap
      };
    }
    case 'FAIL_BUILD_RUN': {
      const buildId = getBuildRunLookupBuildId(state, action.buildRun);
      if (!buildId) return state;
      const key = getBuildRunKey(buildId);
      const currentRun = state.buildRuns[key];
      if (!currentRun) return state;
      const nextRequestMap = removeBuildRunRequestMapping(
        state.buildRunRequestMap,
        currentRun.requestId
      );
      const errorMessage =
        String(action.buildRun?.error || '').trim() || 'Failed to generate code.';
      const preserveTransientUserMessage =
        action.buildRun?.preserveTransientUserMessage === true;
      const preserveTransientAssistantMessage =
        action.buildRun?.preserveTransientAssistantMessage === true;
      const preserveAssistantArtifactsOnError =
        action.buildRun?.preserveAssistantArtifactsOnError === true ||
        (currentRun.assistantMessage?.persisted === true &&
          (Number(currentRun.assistantMessage.artifactVersionId || 0) > 0 ||
            (typeof currentRun.assistantMessage.codeGenerated === 'string' &&
              currentRun.assistantMessage.codeGenerated.trim().length > 0)));
      const nextAssistantText =
        typeof action.buildRun?.assistantText === 'string'
          ? action.buildRun.assistantText
          : errorMessage;
      return {
        ...state,
        buildRuns: {
          ...state.buildRuns,
          [key]: {
            ...currentRun,
            generating: false,
            terminalState: 'error' as const,
            stopReason: null,
            interruptionReason: null,
            error: errorMessage,
            status: null,
            assistantStatusSteps: [],
            userMessage:
              currentRun.userMessage?.persisted || preserveTransientUserMessage
                ? currentRun.userMessage
                : null,
            assistantMessage:
              currentRun.assistantMessage?.persisted ||
              preserveTransientAssistantMessage
              ? currentRun.assistantMessage
                ? {
                    ...currentRun.assistantMessage,
                    content: preserveAssistantArtifactsOnError
                      ? currentRun.assistantMessage.content
                      : nextAssistantText,
                    codeGenerated: preserveAssistantArtifactsOnError
                      ? currentRun.assistantMessage.codeGenerated ?? null
                      : null,
                    streamCodePreview: null,
                    artifactVersionId: preserveAssistantArtifactsOnError
                      ? currentRun.assistantMessage.artifactVersionId ?? null
                      : null
                  }
                : null
              : null,
            streamingProjectFiles: null,
            streamingFocusFilePath: null,
            requestLimits:
              action.buildRun &&
              Object.prototype.hasOwnProperty.call(
                action.buildRun,
                'requestLimits'
              )
                ? action.buildRun.requestLimits ?? null
                : currentRun.requestLimits,
            updatedAt: Date.now()
          }
        },
        buildRunRequestMap: nextRequestMap
      };
    }
    case 'STOP_BUILD_RUN': {
      const buildId = getBuildRunLookupBuildId(state, action.buildRun);
      if (!buildId) return state;
      const key = getBuildRunKey(buildId);
      const currentRun = state.buildRuns[key];
      if (!currentRun) return state;
      const nextRequestMap = removeBuildRunRequestMapping(
        state.buildRunRequestMap,
        currentRun.requestId
      );
      const preserveTransientUserMessage =
        action.buildRun?.preserveTransientUserMessage === true;
      const preserveTransientAssistantMessage =
        action.buildRun?.preserveTransientAssistantMessage === true;
      const stopReason =
        action.buildRun?.stopReason === 'replacement'
          ? 'replacement'
          : action.buildRun?.stopReason === 'user'
            ? 'user'
            : null;
      const shouldClearAssistantMessage = stopReason === 'replacement';
      return {
        ...state,
        buildRuns: {
          ...state.buildRuns,
          [key]: {
            ...currentRun,
            generating: false,
            terminalState: 'stopped' as const,
            stopReason,
            interruptionReason: null,
            error: null,
            status: null,
            assistantStatusSteps: [],
            userMessage:
              currentRun.userMessage?.persisted || preserveTransientUserMessage
                ? currentRun.userMessage
                : null,
            assistantMessage:
              !shouldClearAssistantMessage &&
              (currentRun.assistantMessage?.persisted ||
                preserveTransientAssistantMessage)
              ? currentRun.assistantMessage
                ? {
                    ...currentRun.assistantMessage,
                    content:
                      typeof action.buildRun?.assistantText === 'string'
                        ? action.buildRun.assistantText
                        : currentRun.assistantMessage.content,
                    codeGenerated: null,
                    streamCodePreview: null,
                    artifactVersionId: null
                  }
                : null
              : null,
            streamingProjectFiles: null,
            streamingFocusFilePath: null,
            updatedAt: Date.now()
          }
        },
        buildRunRequestMap: nextRequestMap
      };
    }
    case 'REMOVE_BUILD_RUN_MESSAGE': {
      const buildId = getBuildRunLookupBuildId(state, action.buildRun);
      if (!buildId) return state;
      const key = getBuildRunKey(buildId);
      const currentRun = state.buildRuns[key];
      if (!currentRun) return state;
      const messageId = Number(action.buildRun?.messageId || 0);
      const messageRole = action.buildRun?.messageRole || null;
      const clientMessageId = normalizeBuildRunClientMessageId(
        action.buildRun?.clientMessageId
      );
      function matchesMessage(message: BuildLiveRunMessage | null) {
        if (!message) return false;
        if (messageRole && message.role !== messageRole) return false;
        if (messageId > 0 && Number(message.id || 0) === messageId) {
          return true;
        }
        if (
          clientMessageId &&
          normalizeBuildRunClientMessageId(message.clientMessageId) ===
            clientMessageId
        ) {
          return true;
        }
        return false;
      }
      const shouldRemoveUserMessage = matchesMessage(currentRun.userMessage);
      const shouldRemoveAssistantMessage = matchesMessage(
        currentRun.assistantMessage
      );
      if (!shouldRemoveUserMessage && !shouldRemoveAssistantMessage) return state;
      return upsertBuildRun(state, buildId, {
        ...currentRun,
        userMessage: shouldRemoveUserMessage ? null : currentRun.userMessage,
        assistantMessage: shouldRemoveAssistantMessage
          ? null
          : currentRun.assistantMessage,
        error: shouldRemoveAssistantMessage ? null : currentRun.error,
        updatedAt: Date.now()
      });
    }
    case 'SET_BUILD_WORKSPACE': {
      const buildId = Number(action.buildRun?.buildId || 0);
      if (!buildId || !action.buildRun?.build) return state;
      const key = getBuildRunKey(buildId);
      const currentWorkspace = state.buildWorkspaces[key];
      if (
        currentWorkspace &&
        currentWorkspace.build === action.buildRun.build &&
        currentWorkspace.chatMessages === action.buildRun.chatMessages &&
        currentWorkspace.copilotPolicy === action.buildRun.copilotPolicy
      ) {
        return state;
      }
      return {
        ...state,
        buildWorkspaces: {
          ...state.buildWorkspaces,
          [key]: {
            build: action.buildRun.build,
            chatMessages: Array.isArray(action.buildRun.chatMessages)
              ? action.buildRun.chatMessages
              : [],
            copilotPolicy:
              action.buildRun.copilotPolicy !== undefined
                ? action.buildRun.copilotPolicy
                : null,
            updatedAt: Date.now()
          }
        }
      };
    }
    case 'SET_BUILD_STUDIO_ACTIVE_TAB': {
      const buildStudio = getBuildStudioState(state);
      const activeTab = normalizeBuildStudioTab(action.buildStudio?.activeTab);
      if (buildStudio.activeTab === activeTab) return state;
      return {
        ...state,
        buildStudio: {
          ...buildStudio,
          activeTab
        }
      };
    }
    case 'SET_BUILD_STUDIO_MY_BUILDS': {
      const buildStudio = getBuildStudioState(state);
      const userId = Number(action.buildStudio?.userId || 0) || null;
      return {
        ...state,
        buildStudio: {
          ...buildStudio,
          myBuilds: Array.isArray(action.buildStudio?.builds)
            ? action.buildStudio.builds
            : [],
          myBuildsLoaded: true,
          myBuildsUserId: userId
        }
      };
    }
    case 'PATCH_BUILD_STUDIO_MY_BUILD': {
      const buildStudio = getBuildStudioState(state);
      const userId = Number(action.buildStudio?.userId || 0) || null;
      if (userId && buildStudio.myBuildsUserId !== userId) return state;
      return {
        ...state,
        buildStudio: {
          ...buildStudio,
          myBuilds: patchBuildStudioMyBuild(
            buildStudio.myBuilds,
            action.buildStudio?.build
          )
        }
      };
    }
    case 'REMOVE_BUILD_STUDIO_MY_BUILD': {
      const buildStudio = getBuildStudioState(state);
      const buildId = Number(action.buildStudio?.buildId || 0);
      const userId = Number(action.buildStudio?.userId || 0) || null;
      if (!buildId) return state;
      if (userId && buildStudio.myBuildsUserId !== userId) return state;
      return {
        ...state,
        buildStudio: {
          ...buildStudio,
          myBuilds: buildStudio.myBuilds.filter(
            (build) => Number(build?.id || 0) !== buildId
          )
        }
      };
    }
    case 'SET_BUILD_STUDIO_BROWSE_BUILDS': {
      const buildStudio = getBuildStudioState(state);
      const tab = normalizeBuildStudioBrowseTab(action.buildStudio?.tab);
      return {
        ...state,
        buildStudio: {
          ...buildStudio,
          browse: {
            ...buildStudio.browse,
            [tab]: {
              ...buildStudio.browse[tab],
              builds: Array.isArray(action.buildStudio?.builds)
                ? action.buildStudio.builds
                : [],
              loadMoreToken:
                typeof action.buildStudio?.loadMoreToken === 'string'
                  ? action.buildStudio.loadMoreToken
                  : null,
              loaded: true,
              userId: normalizeBuildStudioUserId(action.buildStudio?.userId)
            }
          }
        }
      };
    }
    case 'APPEND_BUILD_STUDIO_BROWSE_BUILDS': {
      const buildStudio = getBuildStudioState(state);
      const tab = normalizeBuildStudioBrowseTab(action.buildStudio?.tab);
      const userId = normalizeBuildStudioUserId(action.buildStudio?.userId);
      const currentTabState = buildStudio.browse[tab];
      const canAppend = currentTabState.userId === userId;
      return {
        ...state,
        buildStudio: {
          ...buildStudio,
          browse: {
            ...buildStudio.browse,
            [tab]: {
              ...currentTabState,
              builds: canAppend
                ? [
                    ...currentTabState.builds,
                    ...(Array.isArray(action.buildStudio?.builds)
                      ? action.buildStudio.builds
                      : [])
                  ]
                : Array.isArray(action.buildStudio?.builds)
                  ? action.buildStudio.builds
                  : [],
              loadMoreToken:
                typeof action.buildStudio?.loadMoreToken === 'string'
                  ? action.buildStudio.loadMoreToken
                  : null,
              loaded: true,
              userId
            }
          }
        }
      };
    }
    case 'SET_BUILD_STUDIO_SCROLL': {
      const buildStudio = getBuildStudioState(state);
      const tab = normalizeBuildStudioTab(action.buildStudio?.tab);
      const scrollY = normalizeBuildStudioScrollY(action.buildStudio?.scrollY);
      if (tab === 'mine') {
        if (buildStudio.myBuildsScrollY === scrollY) return state;
        return {
          ...state,
          buildStudio: {
            ...buildStudio,
            myBuildsScrollY: scrollY
          }
        };
      }
      return {
        ...state,
        buildStudio: {
          ...buildStudio,
          browse: {
            ...buildStudio.browse,
            [tab]: {
              ...buildStudio.browse[tab],
              scrollY
            }
          }
        }
      };
    }
    case 'PUBLISH_BUILD_RUNTIME_VERIFY_RESULT': {
      const resultKey = getBuildRuntimeVerifyResultKey(action.runtimeVerifyResult);
      const requestId = String(action.runtimeVerifyResult?.requestId || '').trim();
      const status =
        action.runtimeVerifyResult?.status === 'error' ? 'error' : 'complete';
      if (!resultKey || !requestId) return state;
      const buildId = Number(action.runtimeVerifyResult?.buildId || 0);
      return {
        ...state,
        runtimeVerifyResults: {
          ...state.runtimeVerifyResults,
          [resultKey]: {
            buildId: buildId > 0 ? buildId : null,
            requestId,
            status,
            improved: action.runtimeVerifyResult?.improved === true,
            reason:
              typeof action.runtimeVerifyResult?.reason === 'string' &&
              action.runtimeVerifyResult.reason.trim().length > 0
                ? action.runtimeVerifyResult.reason
                : null,
            shouldRepairAgain:
              action.runtimeVerifyResult?.shouldRepairAgain === true,
            nextRemainingRepairs: Number.isFinite(
              Number(action.runtimeVerifyResult?.nextRemainingRepairs)
            )
              ? Math.max(
                  0,
                  Math.floor(Number(action.runtimeVerifyResult?.nextRemainingRepairs))
                )
              : 0,
            error:
              typeof action.runtimeVerifyResult?.error === 'string' &&
              action.runtimeVerifyResult.error.trim().length > 0
                ? action.runtimeVerifyResult.error
                : null
          }
        }
      };
    }
    case 'CLEAR_BUILD_RUNTIME_VERIFY_RESULT': {
      const resultKey = getBuildRuntimeVerifyResultKey(action.runtimeVerifyResult);
      if (!resultKey || !state.runtimeVerifyResults[resultKey]) return state;
      const nextRuntimeVerifyResults = { ...state.runtimeVerifyResults };
      delete nextRuntimeVerifyResults[resultKey];
      return {
        ...state,
        runtimeVerifyResults: nextRuntimeVerifyResults
      };
    }
    case 'CLEAR_BUILD_RUN': {
      const buildId = Number(action.buildRun?.buildId || 0);
      if (!buildId) return state;
      const key = getBuildRunKey(buildId);
      const currentRun = state.buildRuns[key];
      if (!currentRun) return state;
      const nextRuns = { ...state.buildRuns };
      delete nextRuns[key];
      return {
        ...state,
        buildRuns: nextRuns,
        buildRunRequestMap: removeBuildRunRequestMapping(
          state.buildRunRequestMap,
          currentRun.requestId
        )
      };
    }
    case 'RESET_BUILD_RUNS':
      return {
        ...state,
        buildRuns: {},
        buildRunRequestMap: {},
        buildWorkspaces: {},
        runtimeVerifyResults: {}
      };
    default:
      return state;
  }
}
