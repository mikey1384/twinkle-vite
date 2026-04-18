import { useEffect, useRef } from 'react';
import { socket } from '~/constants/sockets/api';
import { useBuildContext, useKeyContext } from '~/contexts';
import type {
  BuildLiveRunUsageMetric,
  BuildLiveRunState,
  BuildWorkspaceSnapshot
} from '~/contexts/Build/reducer';
import {
  getBuildResumeRunStateReplayKey,
  type BuildResumeRunStatePayload,
  normalizeBuildResumeRunState,
  replayBuildResumeRunState
} from '~/contexts/Build/resumeRunState';
import {
  buildFallbackBuildRunEventId,
  normalizeBuildRunEventCreatedAt,
  normalizeBuildRunEventId
} from '~/contexts/Build/runEventIdentity';
import { createFallbackBuildRunMessageId } from '~/contexts/Build/messageIdentity';

function getBuildRequestLimitsFromPayload(payload: any) {
  return payload?.requestLimits || payload?.billing?.snapshot || null;
}

export default function useBuildSocket() {
  const userId = useKeyContext((v) => v.myState.userId);
  const buildRuns = useBuildContext(
    (v) => v.state.buildRuns
  ) as Record<string, BuildLiveRunState>;
  const buildRunRequestMap = useBuildContext(
    (v) => v.state.buildRunRequestMap
  ) as Record<string, number>;
  const buildWorkspaces = useBuildContext(
    (v) => v.state.buildWorkspaces
  ) as Record<string, BuildWorkspaceSnapshot>;
  const onRegisterBuildRun = useBuildContext(
    (v) => v.actions.onRegisterBuildRun
  );
  const onUpdateBuildRunStatus = useBuildContext(
    (v) => v.actions.onUpdateBuildRunStatus
  );
  const onUpdateBuildRunStream = useBuildContext(
    (v) => v.actions.onUpdateBuildRunStream
  );
  const onApplyBuildRunRunningSnapshot = useBuildContext(
    (v) => v.actions.onApplyBuildRunRunningSnapshot
  );
  const onAppendBuildRunEvent = useBuildContext(
    (v) => v.actions.onAppendBuildRunEvent
  );
  const onCompleteBuildRun = useBuildContext(
    (v) => v.actions.onCompleteBuildRun
  );
  const onFailBuildRun = useBuildContext((v) => v.actions.onFailBuildRun);
  const onStopBuildRun = useBuildContext((v) => v.actions.onStopBuildRun);
  const onResetBuildRuns = useBuildContext((v) => v.actions.onResetBuildRuns);
  const onPublishBuildRuntimeVerifyResult = useBuildContext(
    (v) => v.actions.onPublishBuildRuntimeVerifyResult
  );
  const buildRunsRef = useRef<Record<string, BuildLiveRunState>>(buildRuns);
  const buildRunRequestMapRef = useRef<Record<string, number>>(
    buildRunRequestMap
  );
  const buildWorkspacesRef = useRef<Record<string, BuildWorkspaceSnapshot>>(
    buildWorkspaces
  );
  const replayedResumeRunStateKeysRef = useRef<Record<string, string>>({});

  useEffect(() => {
    buildRunsRef.current = buildRuns;
    buildRunRequestMapRef.current = buildRunRequestMap;
    buildWorkspacesRef.current = buildWorkspaces;
  }, [buildRunRequestMap, buildRuns, buildWorkspaces]);

  useEffect(() => {
    onResetBuildRuns();
    replayedResumeRunStateKeysRef.current = {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    function resolveBuildId(requestId?: string, explicitBuildId?: number | null) {
      const normalizedBuildId = Number(explicitBuildId || 0);
      if (normalizedBuildId > 0) return normalizedBuildId;
      const normalizedRequestId = String(requestId || '').trim();
      if (!normalizedRequestId) return 0;
      return Number(buildRunRequestMapRef.current[normalizedRequestId] || 0) || 0;
    }

    function shouldHandleRun(requestId?: string, explicitBuildId?: number | null) {
      const resolvedBuildId = resolveBuildId(requestId, explicitBuildId);
      if (!resolvedBuildId) {
        return {
          buildId: 0,
          shouldHandle: false
        };
      }
      return {
        buildId: resolvedBuildId,
        shouldHandle: true
      };
    }

    function findWorkspaceMessage(buildId: number, messageId?: number | null) {
      const normalizedMessageId = Number(messageId || 0);
      if (normalizedMessageId <= 0) return null;
      const workspace = buildWorkspacesRef.current[String(buildId)] || null;
      if (!Array.isArray(workspace?.chatMessages)) return null;
      return (
        workspace.chatMessages.find(
          (entry: any) => Number(entry?.id || 0) === normalizedMessageId
        ) || null
      );
    }

    function ensureBuildRunRegistered({
      requestId,
      buildId,
      runMode,
      status,
      userMessageContent,
      userMessageId,
      userClientMessageId,
      assistantMessageId,
      assistantClientMessageId,
      assistantMessageCreatedAt,
      lastActivityAt
    }: {
      requestId?: string;
      buildId: number;
      runMode?: 'user' | 'greeting' | 'runtime-autofix' | null;
      status?: string | null;
      userMessageContent?: string | null;
      userMessageId?: number | null;
      userClientMessageId?: string | null;
      assistantMessageId?: number | null;
      assistantClientMessageId?: string | null;
      assistantMessageCreatedAt?: number | null;
      lastActivityAt?: number | null;
    }) {
      const normalizedRequestId = String(requestId || '').trim();
      if (!normalizedRequestId || buildId <= 0) return;
      const workspace = buildWorkspacesRef.current[String(buildId)] || null;
      const userMessage =
        findWorkspaceMessage(buildId, userMessageId) ||
        (typeof userMessageContent === 'string'
          ? {
              id:
                Number(userMessageId || 0) > 0
                  ? Number(userMessageId)
                  : createFallbackBuildRunMessageId(),
              role: 'user' as const,
              content: userMessageContent,
              codeGenerated: null,
              billingState: null,
              streamCodePreview: null,
              artifactVersionId: null,
              clientMessageId: String(userClientMessageId || '').trim() || null,
              createdAt: Math.floor(Date.now() / 1000),
              persisted: Number(userMessageId || 0) > 0
            }
          : null);
      const assistantMessage =
        findWorkspaceMessage(buildId, assistantMessageId) ||
        (Number(assistantMessageId || 0) > 0 ||
          String(assistantClientMessageId || '').trim()
          ? {
              id:
                Number(assistantMessageId || 0) > 0
                  ? Number(assistantMessageId || 0)
                  : createFallbackBuildRunMessageId(),
              role: 'assistant' as const,
              content: '',
              codeGenerated: null,
              billingState: null,
              streamCodePreview: null,
              artifactVersionId: null,
              clientMessageId:
                String(assistantClientMessageId || '').trim() || null,
              createdAt:
                Number(assistantMessageCreatedAt || 0) > 0
                  ? Number(assistantMessageCreatedAt)
                  : Math.floor(Date.now() / 1000),
              persisted: Number(assistantMessageId || 0) > 0
            }
          : null);
      const existingRun = buildRunsRef.current[String(buildId)] || null;
      if (existingRun?.requestId === normalizedRequestId) {
        if (existingRun.userMessage || !userMessage) {
          return;
        }
        onUpdateBuildRunStream({
          buildId,
          requestId: normalizedRequestId,
          userMessageId:
            Number(userMessageId || 0) > 0 ? Number(userMessageId) : null,
          userMessageContent: userMessage.content,
          userClientMessageId:
            String(userClientMessageId || '').trim() || undefined,
          updatedAt:
            Number(lastActivityAt || 0) > 0 ? Number(lastActivityAt) : Date.now()
        });
        return;
      }
      onRegisterBuildRun({
        buildId,
        requestId: normalizedRequestId,
        runMode:
          runMode === 'greeting' || runMode === 'runtime-autofix'
            ? runMode
            : 'user',
        generating: true,
        status: typeof status === 'string' ? status : null,
        assistantStatusSteps:
          typeof status === 'string' && status.trim().length > 0
            ? [status]
            : [],
        userMessage,
        assistantMessage,
        baseProjectFiles: Array.isArray(workspace?.build?.projectFiles)
          ? workspace.build.projectFiles
          : [],
        updatedAt:
          Number(lastActivityAt || 0) > 0 ? Number(lastActivityAt) : Date.now()
      });
    }

    function replayResumeRunState(payload: BuildResumeRunStatePayload) {
      const normalizedResumeRunState = normalizeBuildResumeRunState(payload);
      const resolvedRun = shouldHandleRun(
        normalizedResumeRunState.requestId,
        normalizedResumeRunState.buildId
      );
      if (!resolvedRun.shouldHandle) return;
      const replayKey = getBuildResumeRunStateReplayKey(
        normalizedResumeRunState
      );
      const replayLookupKey = [
        resolvedRun.buildId,
        String(normalizedResumeRunState.requestId || '').trim()
      ].join(':');
      if (replayedResumeRunStateKeysRef.current[replayLookupKey] === replayKey) {
        return;
      }
      replayedResumeRunStateKeysRef.current[replayLookupKey] = replayKey;
      ensureBuildRunRegistered({
        requestId: normalizedResumeRunState.requestId,
        buildId: resolvedRun.buildId,
        runMode: normalizedResumeRunState.runMode,
        status: normalizedResumeRunState.status,
        userMessageContent:
          normalizedResumeRunState.streamUpdate?.userMessageContent,
        userMessageId: normalizedResumeRunState.streamUpdate?.userMessageId,
        userClientMessageId:
          normalizedResumeRunState.streamUpdate?.userClientMessageId,
        assistantMessageId:
          normalizedResumeRunState.streamUpdate?.assistantMessageId,
        assistantClientMessageId:
          normalizedResumeRunState.streamUpdate?.assistantClientMessageId,
        assistantMessageCreatedAt:
          normalizedResumeRunState.streamUpdate?.assistantMessageCreatedAt,
        lastActivityAt: normalizedResumeRunState.lastActivityAt
      });
      replayBuildResumeRunState({
        normalized: normalizedResumeRunState,
        onTerminalComplete: (terminalPayload) => {
          onCompleteBuildRun({
            buildId: resolvedRun.buildId,
            requestId: normalizedResumeRunState.requestId,
            assistantText: terminalPayload.assistantText,
            artifactCode:
              terminalPayload.artifact?.content ?? terminalPayload.code ?? null,
            projectFiles:
              Array.isArray(terminalPayload.projectFiles) &&
              terminalPayload.projectFiles.length > 0
                ? terminalPayload.projectFiles
                : null,
            ...(Object.prototype.hasOwnProperty.call(
              terminalPayload || {},
              'interruptionReason'
            )
              ? {
                  interruptionReason: terminalPayload.interruptionReason ?? null
                }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(
              terminalPayload || {},
              'workspaceChanged'
            )
              ? {
                  workspaceChanged: terminalPayload.workspaceChanged === true
                }
              : {}),
            executionPlan: terminalPayload.executionPlan,
            followUpPrompt:
              Object.prototype.hasOwnProperty.call(
                terminalPayload || {},
                'followUpPrompt'
              )
                ? terminalPayload.followUpPrompt ?? null
                : undefined,
            deferredBuildRequest: Object.prototype.hasOwnProperty.call(
              terminalPayload || {},
              'deferredBuildRequest'
            )
              ? terminalPayload.deferredBuildRequest ?? null
              : undefined,
            ...(Object.prototype.hasOwnProperty.call(
              terminalPayload || {},
              'runtimeExplorationPlan'
            )
              ? {
                  runtimeExplorationPlan:
                    terminalPayload.runtimeExplorationPlan ?? null
                }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(
              terminalPayload || {},
              'runtimePlanRefined'
            )
              ? {
                  runtimePlanRefined: Boolean(terminalPayload.runtimePlanRefined)
                }
              : {}),
            billingState: terminalPayload.billingState ?? null,
            requestLimits: getBuildRequestLimitsFromPayload(terminalPayload),
            artifactVersionId:
              Number(terminalPayload?.message?.artifactVersionId || 0) > 0
                ? Number(terminalPayload.message.artifactVersionId)
                : Number(terminalPayload?.artifact?.versionId || 0) > 0
                  ? Number(terminalPayload.artifact.versionId)
                  : null,
            persistedAssistantId:
              Number(terminalPayload?.message?.id || 0) > 0
                ? Number(terminalPayload.message.id)
                : null,
            persistedUserId:
              Number(terminalPayload?.message?.userMessageId || 0) > 0
                ? Number(terminalPayload.message.userMessageId)
                : null,
            userClientMessageId:
              typeof terminalPayload?.message?.userClientMessageId === 'string'
                ? terminalPayload.message.userClientMessageId
                : undefined,
            assistantClientMessageId:
              typeof terminalPayload?.message?.assistantClientMessageId ===
              'string'
                ? terminalPayload.message.assistantClientMessageId
                : undefined,
            createdAt:
              Number(terminalPayload?.message?.createdAt || 0) > 0
                ? Number(terminalPayload.message.createdAt)
                : undefined
          });
        },
        onTerminalError: (terminalPayload) => {
          onFailBuildRun({
            buildId: resolvedRun.buildId,
            requestId: normalizedResumeRunState.requestId,
            error: terminalPayload.error || 'Failed to generate code.',
            requestLimits: getBuildRequestLimitsFromPayload(terminalPayload)
          });
        },
        onTerminalStopped: (terminalPayload) => {
          onStopBuildRun({
            buildId: resolvedRun.buildId,
            requestId: normalizedResumeRunState.requestId,
            stopReason: terminalPayload.stopReason || null,
            ...(typeof terminalPayload.assistantText === 'string'
              ? { assistantText: terminalPayload.assistantText }
              : {})
          });
        },
        onRunningSnapshot: (runningSnapshot) => {
          onApplyBuildRunRunningSnapshot({
            buildId: resolvedRun.buildId,
            requestId: normalizedResumeRunState.requestId,
            runningSnapshot: {
              status: runningSnapshot.status,
              assistantStatusSteps: runningSnapshot.assistantStatusSteps,
              usageMetrics: runningSnapshot.usageMetrics,
              updatedAt: runningSnapshot.lastActivityAt
            }
          });
        },
        onRunEvent: (runEvent) => {
          onAppendBuildRunEvent({
            buildId: resolvedRun.buildId,
            requestId: normalizedResumeRunState.requestId,
            event: runEvent,
            updatedAt: normalizedResumeRunState.lastActivityAt
          });
        },
        onStreamUpdate: (streamUpdate) => {
          onUpdateBuildRunStream({
            buildId: resolvedRun.buildId,
            requestId: normalizedResumeRunState.requestId,
            ...streamUpdate,
            updatedAt: normalizedResumeRunState.lastActivityAt
          });
        }
      });
    }

    function handleGenerateUpdate({
      requestId,
      buildId,
      runMode,
      status,
      assistantStatusSteps,
      reply,
      codeGenerated,
      userMessageId,
      userClientMessageId,
      userMessageContent,
      assistantMessageId,
      assistantClientMessageId,
      assistantMessageCreatedAt,
      usageMetrics,
      baseProjectFiles,
      projectFiles,
      projectFilesMode,
      projectFilesPersisted,
      projectFilesFocusPath
    }: {
      requestId?: string;
      buildId?: number | null;
      runMode?: 'user' | 'greeting' | 'runtime-autofix' | null;
      status?: string | null;
      assistantStatusSteps?: string[];
      reply?: string;
      codeGenerated?: string | null;
      userMessageId?: number | null;
      userClientMessageId?: string | null;
      userMessageContent?: string | null;
      assistantMessageId?: number | null;
      assistantClientMessageId?: string | null;
      assistantMessageCreatedAt?: number | null;
      usageMetrics?: Record<string, BuildLiveRunUsageMetric> | null;
      baseProjectFiles?: Array<{ path: string; content?: string }> | null;
      projectFiles?: Array<{ path: string; content?: string }> | null;
      projectFilesMode?: 'patch' | 'snapshot' | null;
      projectFilesPersisted?: boolean;
      projectFilesFocusPath?: string | null;
    }) {
      const resolvedRun = shouldHandleRun(requestId, buildId);
      if (!resolvedRun.shouldHandle || !requestId) return;
      const payload = arguments[0] || {};
      const latestAssistantStatus =
        typeof status === 'string'
          ? status
          : Array.isArray(assistantStatusSteps)
            ? String(
                assistantStatusSteps[assistantStatusSteps.length - 1] || ''
              ).trim() || null
            : null;
      ensureBuildRunRegistered({
        requestId,
        buildId: resolvedRun.buildId,
        runMode,
        status: latestAssistantStatus,
        userMessageContent,
        userMessageId,
        userClientMessageId,
        assistantMessageId,
        assistantClientMessageId,
        assistantMessageCreatedAt
      });
      const buildRun: any = {
        buildId: resolvedRun.buildId,
        requestId
      };
      if (Object.prototype.hasOwnProperty.call(payload, 'status')) {
        buildRun.status = typeof status === 'string' ? status : null;
      }
      if (Object.prototype.hasOwnProperty.call(payload, 'assistantStatusSteps')) {
        buildRun.assistantStatusSteps = Array.isArray(assistantStatusSteps)
          ? assistantStatusSteps.filter(
              (step): step is string =>
                typeof step === 'string' && step.trim().length > 0
            )
          : [];
      }
      if (typeof reply === 'string') {
        buildRun.reply = reply;
      }
      if (Object.prototype.hasOwnProperty.call(payload, 'codeGenerated')) {
        buildRun.codeGenerated = codeGenerated ?? null;
      }
      if (Object.prototype.hasOwnProperty.call(payload, 'userMessageId')) {
        buildRun.userMessageId =
          Number(userMessageId || 0) > 0 ? Number(userMessageId) : null;
      }
      if (Object.prototype.hasOwnProperty.call(payload, 'userMessageContent')) {
        buildRun.userMessageContent =
          typeof userMessageContent === 'string' ? userMessageContent : null;
      }
      if (Object.prototype.hasOwnProperty.call(payload, 'userClientMessageId')) {
        buildRun.userClientMessageId =
          typeof userClientMessageId === 'string'
            ? userClientMessageId.trim() || null
            : null;
      }
      if (Object.prototype.hasOwnProperty.call(payload, 'assistantMessageId')) {
        buildRun.assistantMessageId =
          Number(assistantMessageId || 0) > 0
            ? Number(assistantMessageId)
            : null;
      }
      if (
        Object.prototype.hasOwnProperty.call(
          payload,
          'assistantClientMessageId'
        )
      ) {
        buildRun.assistantClientMessageId =
          typeof assistantClientMessageId === 'string'
            ? assistantClientMessageId.trim() || null
            : null;
      }
      if (
        Object.prototype.hasOwnProperty.call(
          payload,
          'assistantMessageCreatedAt'
        )
      ) {
        buildRun.assistantMessageCreatedAt =
          Number(assistantMessageCreatedAt || 0) > 0
            ? Number(assistantMessageCreatedAt)
            : null;
      }
      if (Object.prototype.hasOwnProperty.call(payload, 'usageMetrics')) {
        buildRun.usageMetrics =
          usageMetrics && typeof usageMetrics === 'object' ? usageMetrics : {};
      }
      if (Object.prototype.hasOwnProperty.call(payload, 'baseProjectFiles')) {
        buildRun.baseProjectFiles = Array.isArray(baseProjectFiles)
          ? baseProjectFiles
          : [];
      }
      if (Object.prototype.hasOwnProperty.call(payload, 'projectFiles')) {
        buildRun.projectFiles = Array.isArray(projectFiles) ? projectFiles : [];
        buildRun.projectFilesMode =
          projectFilesMode === 'snapshot' ? 'snapshot' : 'patch';
        buildRun.projectFilesPersisted = projectFilesPersisted === true;
        buildRun.projectFilesFocusPath =
          String(projectFilesFocusPath || '').trim() || null;
      }
      onUpdateBuildRunStream(buildRun);
    }

    function handleGenerateComplete({
      requestId,
      buildId,
      runMode,
      assistantText,
      artifact,
      code,
      projectFiles,
      interruptionReason,
      executionPlan,
      followUpPrompt,
      runtimeExplorationPlan,
      runtimePlanRefined,
      workspaceChanged,
      billingState,
      requestLimits,
      billing,
      deferredBuildRequest,
      message
    }: {
      requestId?: string;
      buildId?: number | null;
      runMode?: 'user' | 'greeting' | 'runtime-autofix' | null;
      assistantText?: string;
      artifact?: {
        content?: string;
        versionId?: number | null;
      };
      code?: string | null;
      projectFiles?: Array<{ path: string; content?: string }> | null;
      interruptionReason?: 'tool_limit' | 'energy_depleted' | null;
      executionPlan?: any | null;
      followUpPrompt?:
        | {
            question?: string | null;
            suggestedMessage?: string | null;
            sourceMessageId?: number | null;
          }
        | null;
      runtimeExplorationPlan?: any | null;
      runtimePlanRefined?: boolean;
      workspaceChanged?: boolean;
      billingState?: 'charged' | 'not_charged' | 'pending' | null;
      requestLimits?: any | null;
      billing?: { snapshot?: any | null } | null;
      deferredBuildRequest?: {
        message?: string | null;
        messageContext?: string | null;
        planAction?: 'continue' | 'cancel' | 'pivot' | null;
        stopActiveRun?: boolean | null;
        stopRequestId?: string | null;
      } | null;
      message?: {
        id?: number | null;
        userMessageId?: number | null;
        userMessageContent?: string | null;
        userClientMessageId?: string | null;
        assistantClientMessageId?: string | null;
        artifactVersionId?: number | null;
        createdAt?: number;
      };
    }) {
      const resolvedRun = shouldHandleRun(requestId, buildId);
      if (!resolvedRun.shouldHandle || !requestId) return;
      ensureBuildRunRegistered({
        requestId,
        buildId: resolvedRun.buildId,
        runMode,
        userMessageContent:
          typeof message?.userMessageContent === 'string'
            ? message.userMessageContent
            : null,
        userMessageId: message?.userMessageId,
        userClientMessageId: message?.userClientMessageId,
        assistantMessageId: message?.id,
        assistantClientMessageId: message?.assistantClientMessageId,
        assistantMessageCreatedAt: message?.createdAt
      });
      onCompleteBuildRun({
        buildId: resolvedRun.buildId,
        requestId,
        assistantText,
        artifactCode: artifact?.content ?? code ?? null,
        projectFiles:
          Array.isArray(projectFiles) && projectFiles.length > 0
            ? projectFiles
            : null,
        interruptionReason,
        executionPlan,
        followUpPrompt:
          Object.prototype.hasOwnProperty.call(
            arguments[0] || {},
            'followUpPrompt'
          )
            ? followUpPrompt ?? null
            : undefined,
        deferredBuildRequest: Object.prototype.hasOwnProperty.call(
          arguments[0] || {},
          'deferredBuildRequest'
        )
          ? deferredBuildRequest ?? null
          : undefined,
        ...(Object.prototype.hasOwnProperty.call(
          arguments[0] || {},
          'runtimeExplorationPlan'
        )
          ? {
              runtimeExplorationPlan: runtimeExplorationPlan ?? null
            }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(
          arguments[0] || {},
          'runtimePlanRefined'
        )
          ? {
              runtimePlanRefined: Boolean(runtimePlanRefined)
            }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(
          arguments[0] || {},
          'workspaceChanged'
        )
          ? { workspaceChanged: workspaceChanged === true }
          : {}),
        billingState: billingState ?? null,
        requestLimits: requestLimits || billing?.snapshot || null,
        artifactVersionId:
          Number(message?.artifactVersionId || 0) > 0
            ? Number(message?.artifactVersionId)
            : Number(artifact?.versionId || 0) > 0
              ? Number(artifact?.versionId)
              : null,
        persistedAssistantId:
          Number(message?.id || 0) > 0 ? Number(message?.id) : null,
        persistedUserId:
          Number(message?.userMessageId || 0) > 0
            ? Number(message?.userMessageId)
            : null,
        userClientMessageId:
          typeof message?.userClientMessageId === 'string'
            ? message.userClientMessageId
            : undefined,
        assistantClientMessageId:
          typeof message?.assistantClientMessageId === 'string'
            ? message.assistantClientMessageId
            : undefined,
        createdAt:
          Number(message?.createdAt || 0) > 0 ? message?.createdAt : undefined
      });
    }

    function handleGenerateError({
      requestId,
      buildId,
      runMode,
      error,
      requestLimits
    }: {
      requestId?: string;
      buildId?: number | null;
      runMode?: 'user' | 'greeting' | 'runtime-autofix' | null;
      error?: string;
      requestLimits?: any | null;
    }) {
      const resolvedRun = shouldHandleRun(requestId, buildId);
      if (!resolvedRun.shouldHandle || !requestId) return;
      ensureBuildRunRegistered({
        requestId,
        buildId: resolvedRun.buildId,
        runMode
      });
      onFailBuildRun({
        buildId: resolvedRun.buildId,
        requestId,
        error: error || 'Failed to generate code.',
        requestLimits: requestLimits || null
      });
    }

    function handleGenerateStopped({
      requestId,
      buildId,
      runMode,
      deduped,
      guardStatus,
      assistantText,
      stopReason
    }: {
      requestId?: string;
      buildId?: number | null;
      runMode?: 'user' | 'greeting' | 'runtime-autofix' | null;
      deduped?: boolean;
      guardStatus?: 'processing' | 'completed' | 'conflict';
      assistantText?: string;
      stopReason?: 'user' | 'replacement' | null;
    }) {
      const resolvedRun = shouldHandleRun(requestId, buildId);
      if (!resolvedRun.shouldHandle || !requestId) return;
      ensureBuildRunRegistered({
        requestId,
        buildId: resolvedRun.buildId,
        runMode
      });
      if (deduped && guardStatus === 'processing') {
        const existingRun =
          buildRunsRef.current[String(resolvedRun.buildId)] || null;
        onUpdateBuildRunStatus({
          buildId: resolvedRun.buildId,
          requestId,
          status:
            String(existingRun?.status || '').trim() === 'Stopping...'
              ? 'Stopping...'
              : 'Recovering live response...'
        });
        return;
      }
      onStopBuildRun({
        buildId: resolvedRun.buildId,
        requestId,
        stopReason: stopReason || null,
        ...(typeof assistantText === 'string' ? { assistantText } : {})
      });
    }

    function handleRunEvent({
      requestId,
      buildId,
      runMode,
      event
    }: {
      requestId?: string;
      buildId?: number | null;
      runMode?: 'user' | 'greeting' | 'runtime-autofix' | null;
      event?: {
        id?: string;
        buildId?: number | null;
        kind?: 'lifecycle' | 'phase' | 'action' | 'status' | 'usage';
        phase?: string | null;
        message?: string;
        createdAt?: number;
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
      };
    }) {
      const resolvedRun = shouldHandleRun(
        requestId,
        Number(event?.buildId || 0) > 0 ? Number(event?.buildId) : buildId
      );
      if (!resolvedRun.shouldHandle || !requestId || !event?.kind || !event?.message) {
        return;
      }
      ensureBuildRunRegistered({
        requestId,
        buildId: resolvedRun.buildId,
        runMode
      });
      const normalizedCreatedAt = normalizeBuildRunEventCreatedAt(
        event.createdAt
      );
      const normalizedId = normalizeBuildRunEventId(event.id);
      onAppendBuildRunEvent({
        buildId: resolvedRun.buildId,
        requestId,
        event: {
          id:
            normalizedId ||
            buildFallbackBuildRunEventId({
              requestId,
              event: {
                kind: event.kind,
                phase: event.phase || null,
                message: event.message,
                createdAt: normalizedCreatedAt
              }
            }),
          kind: event.kind,
          phase: event.phase || null,
          message: event.message,
          createdAt: normalizedCreatedAt,
          deduped: Boolean(event.deduped),
          details: event.details || null,
          usage: event.usage || null
        }
      });
    }

    function handleRuntimeVerifyComplete({
      buildId,
      requestId,
      improved,
      reason,
      shouldRepairAgain,
      nextRemainingRepairs
    }: {
      buildId?: number | null;
      requestId?: string;
      improved?: boolean;
      reason?: string;
      shouldRepairAgain?: boolean;
      nextRemainingRepairs?: number;
    }) {
      const normalizedRequestId = String(requestId || '').trim();
      if (!normalizedRequestId) return;
      onPublishBuildRuntimeVerifyResult({
        buildId: Number(buildId || 0) > 0 ? Number(buildId) : null,
        requestId: normalizedRequestId,
        status: 'complete',
        improved: improved === true,
        reason: typeof reason === 'string' ? reason : null,
        shouldRepairAgain: shouldRepairAgain === true,
        nextRemainingRepairs
      });
    }

    function handleRuntimeVerifyError({
      buildId,
      requestId,
      error
    }: {
      buildId?: number | null;
      requestId?: string;
      error?: string;
    }) {
      const normalizedRequestId = String(requestId || '').trim();
      if (!normalizedRequestId) return;
      onPublishBuildRuntimeVerifyResult({
        buildId: Number(buildId || 0) > 0 ? Number(buildId) : null,
        requestId: normalizedRequestId,
        status: 'error',
        error:
          typeof error === 'string' && error.trim().length > 0
            ? error
            : 'Runtime verification failed.'
      });
    }

    function resumeTrackedBuildRuns() {
      for (const buildRun of Object.values(buildRunsRef.current)) {
        if (!buildRun?.generating || !buildRun.requestId) continue;
        socket.emit('build_resume_run', {
          buildId: Number(buildRun.buildId || 0) || undefined,
          requestId: buildRun.requestId
        });
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState !== 'visible') return;
      resumeTrackedBuildRuns();
    }

    socket.on('build_generate_update', handleGenerateUpdate);
    socket.on('build_generate_complete', handleGenerateComplete);
    socket.on('build_generate_error', handleGenerateError);
    socket.on('build_generate_stopped', handleGenerateStopped);
    socket.on('build_run_event', handleRunEvent);
    socket.on('build_resume_run_state', replayResumeRunState);
    socket.on('build_runtime_verify_complete', handleRuntimeVerifyComplete);
    socket.on('build_runtime_verify_error', handleRuntimeVerifyError);
    socket.on('connect', resumeTrackedBuildRuns);
    window.addEventListener('pageshow', resumeTrackedBuildRuns);
    window.addEventListener('online', resumeTrackedBuildRuns);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      socket.off('build_generate_update', handleGenerateUpdate);
      socket.off('build_generate_complete', handleGenerateComplete);
      socket.off('build_generate_error', handleGenerateError);
      socket.off('build_generate_stopped', handleGenerateStopped);
      socket.off('build_run_event', handleRunEvent);
      socket.off('build_resume_run_state', replayResumeRunState);
      socket.off('build_runtime_verify_complete', handleRuntimeVerifyComplete);
      socket.off('build_runtime_verify_error', handleRuntimeVerifyError);
      socket.off('connect', resumeTrackedBuildRuns);
      window.removeEventListener('pageshow', resumeTrackedBuildRuns);
      window.removeEventListener('online', resumeTrackedBuildRuns);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
