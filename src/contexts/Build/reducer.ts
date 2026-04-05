export interface BuildLiveRunMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  codeGenerated: string | null;
  streamCodePreview?: string | null;
  billingState?: 'charged' | 'not_charged' | 'pending' | null;
  artifactVersionId?: number | null;
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
  usage?: {
    stage?: string | null;
    model?: string | null;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  } | null;
}

export interface BuildLiveRunState {
  buildId: number;
  requestId: string;
  runMode: 'user' | 'greeting' | 'runtime-autofix';
  generating: boolean;
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
  runtimeExplorationPlan?: any | null;
  runtimePlanRefined?: boolean;
  billingState?: 'charged' | 'not_charged' | 'pending' | null;
  updatedAt: number;
}

export interface BuildWorkspaceSnapshot {
  build: any;
  chatMessages: any[];
  copilotPolicy: any | null;
  updatedAt: number;
}

export interface BuildLiveRunActionPayload {
  buildId?: number;
  build?: any;
  chatMessages?: any[];
  copilotPolicy?: any | null;
  requestId?: string;
  runMode?: BuildLiveRunState['runMode'];
  status?: string | null;
  reply?: string;
  codeGenerated?: string | null;
  projectFiles?: Array<{ path: string; content?: string }> | null;
  userMessage?: BuildLiveRunMessage | null;
  assistantMessage?: BuildLiveRunMessage | null;
  baseProjectFiles?: Array<{ path: string; content?: string }> | null;
  executionPlan?: any | null;
  runtimeExplorationPlan?: any | null;
  runtimePlanRefined?: boolean;
  billingState?: 'charged' | 'not_charged' | 'pending' | null;
  workspaceChanged?: boolean;
  event?: BuildLiveRunEvent | null;
  usage?: {
    stage?: string | null;
    model?: string | null;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  } | null;
  assistantText?: string;
  artifactCode?: string | null;
  artifactVersionId?: number | null;
  persistedAssistantId?: number | null;
  persistedUserId?: number | null;
  createdAt?: number;
  error?: string;
}

export interface BuildState {
  buildRuns: Record<string, BuildLiveRunState>;
  buildRunRequestMap: Record<string, number>;
  buildWorkspaces: Record<string, BuildWorkspaceSnapshot>;
}

export interface BuildAction {
  type:
    | 'REGISTER_BUILD_RUN'
    | 'UPDATE_BUILD_RUN_STATUS'
    | 'UPDATE_BUILD_RUN_STREAM'
    | 'APPEND_BUILD_RUN_EVENT'
    | 'UPDATE_BUILD_RUN_USAGE'
    | 'COMPLETE_BUILD_RUN'
    | 'FAIL_BUILD_RUN'
    | 'STOP_BUILD_RUN'
    | 'SET_BUILD_WORKSPACE'
    | 'CLEAR_BUILD_RUN'
    | 'RESET_BUILD_RUNS';
  buildRun?: BuildLiveRunActionPayload;
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

function getStreamingFocusFilePath(
  projectFiles?: Array<{ path: string; content?: string }> | null
) {
  const firstNonIndexPath = (projectFiles || [])
    .map((file) => {
      const rawPath = String(file?.path || '').trim().replace(/\\/g, '/');
      const normalized = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
      return normalized.replace(/\/{2,}/g, '/');
    })
    .find((path) => {
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
      return upsertBuildRun(state, buildId, {
        buildId,
        requestId,
        runMode: action.buildRun?.runMode || 'user',
        generating: true,
        status: null,
        assistantStatusSteps: [],
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
        runtimeExplorationPlan: null,
        runtimePlanRefined: false,
        billingState: null,
        updatedAt: Date.now()
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
      const hasCodeGeneratedField =
        action.buildRun &&
        Object.prototype.hasOwnProperty.call(action.buildRun, 'codeGenerated');
      const hasProjectFileUpdates =
        Array.isArray(action.buildRun?.projectFiles) &&
        action.buildRun.projectFiles.length > 0;
      return upsertBuildRun(state, buildId, {
        ...currentRun,
        generating: true,
        assistantMessage: currentRun.assistantMessage
          ? {
              ...currentRun.assistantMessage,
              content:
                typeof action.buildRun?.reply === 'string'
                  ? action.buildRun.reply
                  : currentRun.assistantMessage.content,
              ...(hasCodeGeneratedField
                ? {
                    streamCodePreview: action.buildRun?.codeGenerated ?? null
                  }
                : {})
            }
          : currentRun.assistantMessage,
        streamingProjectFiles: hasProjectFileUpdates
          ? overlayBuildRunProjectFiles({
              baseFiles:
                currentRun.streamingProjectFiles?.length
                  ? currentRun.streamingProjectFiles
                  : currentRun.baseProjectFiles,
              updates: action.buildRun?.projectFiles
            })
          : currentRun.streamingProjectFiles,
        streamingFocusFilePath: hasProjectFileUpdates
          ? getStreamingFocusFilePath(action.buildRun?.projectFiles)
          : currentRun.streamingFocusFilePath,
        executionPlan:
          action.buildRun &&
          Object.prototype.hasOwnProperty.call(action.buildRun, 'executionPlan')
            ? action.buildRun.executionPlan ?? null
            : currentRun.executionPlan,
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
        updatedAt: Date.now()
      });
    }
    case 'APPEND_BUILD_RUN_EVENT': {
      const buildId = getBuildRunLookupBuildId(state, action.buildRun);
      if (!buildId || !action.buildRun?.event) return state;
      const key = getBuildRunKey(buildId);
      const currentRun = state.buildRuns[key];
      if (!currentRun) return state;
      const nextEvent = action.buildRun.event;
      const lastEvent = currentRun.runEvents[currentRun.runEvents.length - 1];
      const nextRunEvents =
        lastEvent &&
        lastEvent.kind === nextEvent.kind &&
        lastEvent.phase === nextEvent.phase &&
        lastEvent.message === nextEvent.message &&
        Math.abs(lastEvent.createdAt - nextEvent.createdAt) < 1500
          ? currentRun.runEvents
          : [...currentRun.runEvents, nextEvent].slice(-40);
      return upsertBuildRun(state, buildId, {
        ...currentRun,
        runEvents: nextRunEvents,
        updatedAt: Date.now()
      });
    }
    case 'UPDATE_BUILD_RUN_USAGE': {
      const buildId = getBuildRunLookupBuildId(state, action.buildRun);
      const usage = action.buildRun?.usage;
      const stage = String(usage?.stage || '').trim();
      const model = String(usage?.model || '').trim();
      if (!buildId || !stage || !model) return state;
      const key = getBuildRunKey(buildId);
      const currentRun = state.buildRuns[key];
      if (!currentRun) return state;
      const existing = currentRun.usageMetrics[stage];
      const inputTokens = Number(usage?.inputTokens || 0);
      const outputTokens = Number(usage?.outputTokens || 0);
      const totalTokens = Number(usage?.totalTokens || 0);
      return upsertBuildRun(state, buildId, {
        ...currentRun,
        usageMetrics: {
          ...currentRun.usageMetrics,
          [stage]: {
            stage,
            model,
            inputTokens: (existing?.inputTokens || 0) + inputTokens,
            outputTokens: (existing?.outputTokens || 0) + outputTokens,
            totalTokens: (existing?.totalTokens || 0) + totalTokens
          }
        },
        updatedAt: Date.now()
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
        status: null,
        assistantStatusSteps: [],
        userMessage:
          currentRun.userMessage &&
          Number(action.buildRun?.persistedUserId || 0) > 0
            ? {
                ...currentRun.userMessage,
                id: Number(action.buildRun?.persistedUserId),
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
            : currentRun.streamingProjectFiles?.length
              ? currentRun.streamingProjectFiles
              : currentRun.baseProjectFiles,
        streamingProjectFiles: null,
        streamingFocusFilePath: null,
        executionPlan:
          action.buildRun &&
          Object.prototype.hasOwnProperty.call(action.buildRun, 'executionPlan')
            ? action.buildRun.executionPlan ?? null
            : currentRun.executionPlan,
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
      return {
        ...state,
        buildRuns: {
          ...state.buildRuns,
          [key]: {
            ...currentRun,
            generating: false,
            status: null,
            assistantStatusSteps: [],
            userMessage: currentRun.userMessage?.persisted
              ? currentRun.userMessage
              : null,
            assistantMessage: currentRun.assistantMessage?.persisted
              ? {
                  ...currentRun.assistantMessage,
                  content:
                    action.buildRun?.error || 'Failed to generate code.',
                  codeGenerated: null,
                  streamCodePreview: null,
                  artifactVersionId: null
                }
              : null,
            streamingProjectFiles: null,
            streamingFocusFilePath: null,
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
      return {
        ...state,
        buildRuns: {
          ...state.buildRuns,
          [key]: {
            ...currentRun,
            generating: false,
            status: null,
            assistantStatusSteps: [],
            userMessage: currentRun.userMessage?.persisted
              ? currentRun.userMessage
              : null,
            assistantMessage: currentRun.assistantMessage?.persisted
              ? currentRun.assistantMessage
              : null,
            streamingProjectFiles: null,
            streamingFocusFilePath: null,
            updatedAt: Date.now()
          }
        },
        buildRunRequestMap: nextRequestMap
      };
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
        buildWorkspaces: {}
      };
    default:
      return state;
  }
}
