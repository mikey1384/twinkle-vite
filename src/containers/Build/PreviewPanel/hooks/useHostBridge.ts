import { useEffect, useRef } from 'react';
import {
  ensureBuildApiToken,
  ensureGuestSessionId,
  getViewerInfo,
  isGuestViewerActive,
  triggerGuestRestriction
} from '../helpers/previewBridgeAuth';
import {
  getBuildRuntimeChatSubscriptionKey,
  normalizeBuildRuntimeWorldKey,
  normalizeBuildRuntimeChatRoomKey,
  postBuildRuntimeChatEventToFrames,
  postBuildRuntimeWorldEventToFrames,
  postToPreviewFrames,
  syncPreviewRuntimeUploadsState
} from '../helpers/previewBridgeMessaging';
import {
  handlePreviewHealthMessage,
  handleRuntimeObservationPreviewMessage
} from '../helpers/runtimeObservationMessages';
import type { UsePreviewHostBridgeArgs } from '../types/previewHostBridgeTypes';
import { isMutatingPreviewRequestType } from '../helpers/previewRequestPolicy';
import {
  authorizeTwinkleContentNavigation,
  createTwinkleContentNavigationConfirmationController
} from '../helpers/twinkleContentNavigation';
import { createBuildRuntimeImageGenerationController } from '../helpers/buildRuntimeImageGeneration';
import {
  getBuildAppAiUsagePolicy,
  sanitizeBuildAppAiUsagePolicyPayload
} from '../helpers/previewAiUsagePolicy';

export {
  buildEmptyRuntimeObservationState,
  normalizeRuntimeExplorationPlan
} from '../helpers/runtimeObservationBridge';
export {
  ensureBuildApiToken,
  type PreviewHostBridgeAuth
} from '../helpers/previewBridgeAuth';
export type { PreviewHostBridgeRequestRefs } from '../helpers/previewBridgeRequestRefs';
import {
  executeGuestViewerDbExec,
  executeGuestViewerDbQuery
} from '../helpers/guestViewerDb';
import { socket } from '~/constants/sockets/api';
import type { PreviewFrameMeta, PreviewMountContext } from '../types';
import { triggerPreviewLocalDownload } from '../helpers/previewDownloads';
import { TWINKLE_SOCKET_AUTH_READY_EVENT } from '~/constants/socketEvents';
import {
  BUILD_PREVIEW_BRIDGE_LOAD_ID_QUERY_PARAM,
  extractBuildIdFromPreviewPath,
  getBuildPreviewMessageTargetOrigin,
  isAllowedBuildPreviewMessageOrigin,
  normalizeAllowedBuildPreviewFrameSrc
} from '~/helpers/buildPreviewOriginHelpers';
import {
  disposeBuildChessEngine,
  evaluateBuildChessPosition
} from '../helpers/chessEngine';
import { waitForSocketAuthReady } from '~/helpers/socketAuthReady';
import {
  type AiImageRequestFingerprintInput,
  createAIImageRequestFingerprint,
  pollCanonicalAIImageStatus,
  resolveAIImageStatusImageUrl,
  shouldRecoverAIImageUnknownOutcome
} from '~/helpers/aiImageStatus';

interface ActiveAiImageStatusTarget {
  messageId: string;
  requestId: string;
  sourceWindow: Window;
  statusCount: number;
  terminalStatusForwarded: boolean;
  transportFailed: boolean;
  pendingCompletionPayload?: any;
  recoveryPromise?: Promise<any> | null;
  terminalResponse?: any;
  imageRequest?: any;
  completionFallbackTimer?: number | null;
  terminalResponsePromise: Promise<any>;
  resolveTerminalResponse: (response: any) => void;
}

function getBuildRuntimeWorldViewerIdentityKey(
  viewer: ReturnType<typeof getViewerInfo>
) {
  if (viewer.isLoggedIn) {
    return `user:${viewer.id || ''}`;
  }
  if (viewer.isGuest) {
    return `guest:${viewer.id || ''}`;
  }
  return `anonymous:${viewer.isOwner ? 'owner' : 'viewer'}`;
}

function shouldUseReliableBuildRuntimeWorldEmit(eventName: string) {
  return (
    eventName === 'build_app_world_join' ||
    eventName === 'build_app_world_leave'
  );
}

function isBuildRuntimeWorldSocketWritable() {
  const transport = (socket as any).io?.engine?.transport;
  return socket.connected && (!transport || transport.writable !== false);
}

function createPreviewBridgeError(message: string, code: string) {
  const error = new Error(message) as Error & { code?: string };
  error.code = code;
  return error;
}

function getPreviewBridgeErrorCode(error: any) {
  return typeof error?.code === 'string' && error.code.trim()
    ? error.code.trim()
    : null;
}

function isWorldPreviewBridgeMessageType(type: unknown) {
  return String(type || '').startsWith('world:');
}

function getPreviewSrcBridgeLoadId(previewSrc: string | null | undefined) {
  const normalizedPreviewSrc = String(previewSrc || '').trim();
  if (!normalizedPreviewSrc) return '';
  try {
    const parsedUrl = new URL(normalizedPreviewSrc, window.location.href);
    return String(
      parsedUrl.searchParams.get(BUILD_PREVIEW_BRIDGE_LOAD_ID_QUERY_PARAM) || ''
    ).trim();
  } catch {
    return '';
  }
}

function isBridgeNonceRequestOpen(frameMeta: PreviewFrameMeta) {
  if (!frameMeta.bridgeNonceRequestOpen) return false;
  const expiresAt = Number(frameMeta.bridgeNonceRequestExpiresAt || 0);
  return !expiresAt || expiresAt > Date.now();
}

// Client-side capture of where a build's world request dies BEFORE it reaches
// the backend (the host nonce gate / auth wait / emit), so the Management
// "Build Worlds" page can see failures that never produce a server-side row.
// Bounded per page load so a misbehaving build can never flood the socket/db.
let worldBridgeTelemetryCount = 0;
const WORLD_BRIDGE_TELEMETRY_CAP = 200;

function emitWorldBridgeTelemetry(data: {
  buildId?: number | null;
  worldKey?: unknown;
  roomKey?: unknown;
  instanceId?: unknown;
  outcome: string;
  stage: string;
  messageType?: string;
  errorCode?: string | null;
  message?: string;
  hadNonce?: boolean;
}) {
  if (!data.buildId) return;
  if (worldBridgeTelemetryCount >= WORLD_BRIDGE_TELEMETRY_CAP) return;
  worldBridgeTelemetryCount += 1;
  try {
    socket.emit('build_app_world_bridge_telemetry', data);
  } catch {
    // Bridge telemetry must never affect the preview bridge.
  }
}

export function useHostBridge({
  runtimeOnly,
  appMcpSessionId,
  buildId,
  buildIsPublic,
  isOwner,
  userId,
  username,
  profilePicUrl,
  resolvedCapabilitySnapshot,
  resolvedRuntimeExplorationPlan,
  audioMuted,
  mountContext,
  launchTarget,
  capabilitySnapshotRef,
  runtimeExplorationPlanRef,
  messageTargetFrameRef,
  navigateHostContentRef,
  navigatePreviewFrameRef,
  previewCodeSignatureRef,
  previewFrameMetaRef,
  previewFrameReady,
  previewFrameSources,
  previewFrameSourcesRef,
  previewTransitioningRef,
  onPreviewFrameRetiredRef,
  primaryIframeRef,
  secondaryIframeRef,
  setRuntimeObservationState,
  previewAuth,
  requestRefs,
  runtimeUploadsSyncRef,
  onAiUsagePolicyUpdateRef,
  requestOpenContentConfirmationRef,
  requestBuildImageGenerationConfirmationRef
}: UsePreviewHostBridgeArgs) {
  const mountContextRef = useRef<PreviewMountContext | null>(mountContext);
  const launchTargetRef = useRef<Record<string, any> | null>(launchTarget);
  const audioMutedRef = useRef(audioMuted);
  const launchTargetBroadcastReadyRef = useRef(false);
  const resetWorldSessionsRef = useRef<((reason: string) => void) | null>(null);
  const worldViewerIdentityKeyRef = useRef<string | null>(null);
  const contentNavigationConfirmationControllerRef = useRef<ReturnType<
    typeof createTwinkleContentNavigationConfirmationController
  > | null>(null);
  const contentNavigationConfirmationController =
    contentNavigationConfirmationControllerRef.current ||
    createTwinkleContentNavigationConfirmationController();
  contentNavigationConfirmationControllerRef.current =
    contentNavigationConfirmationController;
  const imageGenerationControllerRef = useRef<ReturnType<
    typeof createBuildRuntimeImageGenerationController
  > | null>(null);
  const imageGenerationController =
    imageGenerationControllerRef.current ||
    createBuildRuntimeImageGenerationController();
  imageGenerationControllerRef.current = imageGenerationController;
  mountContextRef.current = mountContext;
  launchTargetRef.current = launchTarget;
  audioMutedRef.current = audioMuted;

  useEffect(() => {
    if (!runtimeOnly) return;
    postToPreviewFrames(
      primaryIframeRef,
      secondaryIframeRef,
      previewFrameMetaRef,
      {
        source: 'twinkle-parent',
        type: 'audio:mute',
        muted: audioMuted,
        payload: { muted: audioMuted }
      }
    );
  }, [
    audioMuted,
    previewFrameMetaRef,
    previewFrameReady.primary,
    previewFrameReady.secondary,
    previewFrameSources.primary,
    previewFrameSources.secondary,
    primaryIframeRef,
    runtimeOnly,
    secondaryIframeRef
  ]);

  useEffect(() => {
    const viewer = getViewerInfo(previewAuth);
    const viewerIdentityKey = getBuildRuntimeWorldViewerIdentityKey(viewer);
    const previousViewerIdentityKey = worldViewerIdentityKeyRef.current;
    worldViewerIdentityKeyRef.current = viewerIdentityKey;
    if (
      previousViewerIdentityKey &&
      previousViewerIdentityKey !== viewerIdentityKey
    ) {
      resetWorldSessionsRef.current?.('viewer-changed');
    }
    postToPreviewFrames(
      primaryIframeRef,
      secondaryIframeRef,
      previewFrameMetaRef,
      {
        source: 'twinkle-parent',
        type: 'viewer:update',
        viewer
      }
    );
  }, [
    buildId,
    buildIsPublic,
    isOwner,
    userId,
    username,
    profilePicUrl,
    previewAuth,
    previewFrameMetaRef,
    primaryIframeRef,
    secondaryIframeRef
  ]);

  useEffect(() => {
    postToPreviewFrames(
      primaryIframeRef,
      secondaryIframeRef,
      previewFrameMetaRef,
      {
        source: 'twinkle-parent',
        type: 'capabilities:update',
        capabilities: resolvedCapabilitySnapshot
      }
    );
  }, [
    previewFrameMetaRef,
    primaryIframeRef,
    resolvedCapabilitySnapshot,
    secondaryIframeRef
  ]);

  useEffect(() => {
    postToPreviewFrames(
      primaryIframeRef,
      secondaryIframeRef,
      previewFrameMetaRef,
      {
        source: 'twinkle-parent',
        type: 'mount:update',
        mount: mountContext
      }
    );
  }, [mountContext, previewFrameMetaRef, primaryIframeRef, secondaryIframeRef]);

  useEffect(() => {
    if (!launchTargetBroadcastReadyRef.current) {
      launchTargetBroadcastReadyRef.current = true;
      return;
    }

    postToPreviewFrames(
      primaryIframeRef,
      secondaryIframeRef,
      previewFrameMetaRef,
      {
        source: 'twinkle-parent',
        type: 'notifications:launch-target',
        launchTarget
      }
    );
  }, [launchTarget, previewFrameMetaRef, primaryIframeRef, secondaryIframeRef]);

  useEffect(() => {
    postToPreviewFrames(
      primaryIframeRef,
      secondaryIframeRef,
      previewFrameMetaRef,
      {
        source: 'twinkle-parent',
        type: 'exploration-plan:update',
        explorationPlan: resolvedRuntimeExplorationPlan
      }
    );
  }, [
    previewFrameMetaRef,
    primaryIframeRef,
    resolvedRuntimeExplorationPlan,
    secondaryIframeRef
  ]);

  useEffect(() => {
    const chatSubscriptions = new Map<string, Set<Window>>();
    let appMcpRuntime: {
      connectionId: string;
      sourceWindow: Window;
      activeCallId: string | null;
      stopped: boolean;
    } | null = null;
    let appMcpPollTimer = 0;

    function scheduleAppMcpPoll(delayMs = 250) {
      window.clearTimeout(appMcpPollTimer);
      if (!appMcpRuntime || appMcpRuntime.stopped) {
        return;
      }
      const resolvedDelayMs = appMcpRuntime.activeCallId
        ? Math.max(delayMs, 15_000)
        : delayMs;
      appMcpPollTimer = window.setTimeout(
        () => void pollAppMcpCall(),
        resolvedDelayMs
      );
    }

    async function pollAppMcpCall() {
      const runtime = appMcpRuntime;
      if (!runtime || runtime.stopped || !appMcpSessionId) {
        return;
      }
      try {
        const payload = await requestRefs.pollBuildAppMcpCallRef.current({
          buildId,
          sessionId: appMcpSessionId,
          connectionId: runtime.connectionId,
          activeCallId: runtime.activeCallId
        });
        if (runtime !== appMcpRuntime || runtime.stopped) return;
        const call = payload?.call;
        if (!call?.id) {
          scheduleAppMcpPoll(runtime.activeCallId ? 15_000 : 350);
          return;
        }
        if (runtime.activeCallId) {
          scheduleAppMcpPoll(15_000);
          return;
        }
        runtime.activeCallId = String(call.id);
        const targetBridge = getMessageTargetBridgeForWindow(runtime.sourceWindow);
        runtime.sourceWindow.postMessage(
          {
            source: 'twinkle-parent',
            type: 'app-tools:invoke',
            previewNonce: targetBridge.previewNonce,
            payload: call
          },
          targetBridge.targetOrigin
        );
        scheduleAppMcpPoll(15_000);
      } catch (error: any) {
        if (runtime !== appMcpRuntime || runtime.stopped) return;
        if (Number(error?.status || error?.response?.status) === 404) {
          runtime.stopped = true;
          return;
        }
        scheduleAppMcpPoll(runtime.activeCallId ? 15_000 : 1500);
      }
    }
    const activeAiImageStatusTargets = new Map<
      string,
      ActiveAiImageStatusTarget
    >();
    const activeWorldSessions = new Map<
      string,
      {
        sourceWindow: Window;
        buildId: number;
        worldKey: string;
        roomKey: string;
        instanceId: string;
      }
    >();

    function subscribeBuildRuntimeChatRoom(buildId: number, roomKey: string) {
      socket.emit('build_app_chat_subscribe', {
        buildId,
        roomKey
      });
    }

    function unsubscribeBuildRuntimeChatRoom(buildId: number, roomKey: string) {
      socket.emit('build_app_chat_unsubscribe', {
        buildId,
        roomKey
      });
    }

    function handleBuildRuntimeChatEvent(payload: any) {
      postBuildRuntimeChatEventToFrames({
        subscriptions: chatSubscriptions,
        payload,
        getTargetBridge: getMessageTargetBridgeForWindow
      });
    }

    function handleBuildRuntimeWorldEvent(payload: any) {
      postBuildRuntimeWorldEventToFrames({
        sessions: activeWorldSessions,
        payload,
        getTargetBridge: getMessageTargetBridgeForWindow
      });
    }

    function postBuildRuntimeWorldResetToFrame({
      reason,
      sessionIds,
      sourceWindow
    }: {
      reason: string;
      sessionIds: string[];
      sourceWindow: Window;
    }) {
      const targetBridge = getMessageTargetBridgeForWindow(sourceWindow);
      sourceWindow.postMessage(
        {
          source: 'twinkle-parent',
          type: 'world:reset',
          payload: {
            reason,
            sessionIds,
            serverTime: Date.now()
          },
          previewNonce: targetBridge.previewNonce
        },
        targetBridge.targetOrigin
      );
    }

    function resetActiveWorldSessions({
      leaveServer,
      reason
    }: {
      leaveServer?: boolean;
      reason: string;
    }) {
      if (activeWorldSessions.size === 0) return;
      const sessionIdsByWindow = new Map<Window, string[]>();
      for (const [sessionId, session] of activeWorldSessions) {
        if (leaveServer && socket.connected) {
          socket.emit('build_app_world_leave', { sessionId });
        }
        const sessionIds = sessionIdsByWindow.get(session.sourceWindow) || [];
        sessionIds.push(sessionId);
        sessionIdsByWindow.set(session.sourceWindow, sessionIds);
      }
      activeWorldSessions.clear();
      for (const [sourceWindow, sessionIds] of sessionIdsByWindow) {
        postBuildRuntimeWorldResetToFrame({
          reason,
          sessionIds,
          sourceWindow
        });
      }
    }

    function handleBuildRuntimeWorldSocketDisconnect() {
      resetActiveWorldSessions({
        reason: 'socket-disconnected'
      });
    }

    resetWorldSessionsRef.current = (reason: string) => {
      resetActiveWorldSessions({
        leaveServer: true,
        reason
      });
    };

    function emitBuildRuntimeWorldRequest(
      eventName: string,
      payload: Record<string, any>,
      timeoutMs = 8000
    ) {
      return new Promise<Record<string, any>>((resolve, reject) => {
        const useReliableEmit =
          shouldUseReliableBuildRuntimeWorldEmit(eventName);
        if (!socket.connected) {
          reject(
            createPreviewBridgeError(
              'Socket is not connected',
              'WORLD_SOCKET_DISCONNECTED'
            )
          );
          return;
        }
        if (useReliableEmit && !isBuildRuntimeWorldSocketWritable()) {
          reject(
            createPreviewBridgeError(
              'Socket transport is not ready',
              'WORLD_SOCKET_NOT_READY'
            )
          );
          return;
        }
        let settled = false;
        const timeout = window.setTimeout(() => {
          if (settled) return;
          settled = true;
          reject(
            createPreviewBridgeError(
              'World request timed out',
              'WORLD_REQUEST_TIMED_OUT'
            )
          );
        }, timeoutMs);
        const emitter = useReliableEmit ? socket : socket.volatile;
        emitter.emit(eventName, payload, (response: any) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeout);
          if (!response?.ok) {
            const serverError = createPreviewBridgeError(
              response?.error || 'World request failed',
              response?.code || 'WORLD_REQUEST_FAILED'
            ) as Error & { reachedServer?: boolean };
            // The backend acked with a failure (room full / validation / auth),
            // so it already recorded its own join telemetry row. Mark it so we
            // don't ALSO log a client-side "bridge" failure for the same event.
            serverError.reachedServer = true;
            reject(serverError);
            return;
          }
          resolve(response);
        });
      });
    }

    function trackWorldSession({
      response,
      sourceWindow,
      buildId
    }: {
      response: any;
      sourceWindow: Window;
      buildId: number;
    }) {
      const sessionId = String(response?.session?.sessionId || '').trim();
      if (!sessionId) return;
      const worldKey = normalizeBuildRuntimeWorldKey(
        response?.room?.worldKey || response?.session?.worldKey,
        'default'
      );
      const roomKey = normalizeBuildRuntimeWorldKey(
        response?.room?.roomKey || response?.session?.roomKey,
        'main'
      );
      const instanceId = normalizeBuildRuntimeWorldKey(
        response?.room?.instanceId || response?.session?.instanceId,
        'main'
      );
      activeWorldSessions.set(sessionId, {
        sourceWindow,
        buildId,
        worldKey,
        roomKey,
        instanceId
      });
    }

    function forgetWorldSession(sessionId: unknown) {
      activeWorldSessions.delete(String(sessionId || '').trim());
    }

    function leaveWorldSessionsForWindow(sourceWindow: Window | null) {
      if (!sourceWindow) return;
      const sessionIds: string[] = [];
      for (const [sessionId, session] of Array.from(activeWorldSessions)) {
        if (session.sourceWindow !== sourceWindow) continue;
        socket.emit('build_app_world_leave', { sessionId });
        activeWorldSessions.delete(sessionId);
        sessionIds.push(sessionId);
      }
      if (sessionIds.length > 0) {
        postBuildRuntimeWorldResetToFrame({
          reason: 'frame-retired',
          sessionIds,
          sourceWindow
        });
      }
    }

    function leaveAllWorldSessions() {
      for (const sessionId of activeWorldSessions.keys()) {
        socket.emit('build_app_world_leave', { sessionId });
      }
      activeWorldSessions.clear();
    }

    async function ensureAiImageNotificationChannel() {
      const userId = previewAuth.userIdRef.current;
      if (!userId) return;
      try {
        await waitForSocketAuthReady(userId, 1000);
      } catch {
        return;
      }
      await new Promise<void>((resolve) => {
        let settled = false;
        const timeout = window.setTimeout(() => {
          if (settled) return;
          settled = true;
          resolve();
        }, 1000);
        try {
          socket.emit('enter_my_notification_channel', userId, () => {
            if (settled) return;
            settled = true;
            window.clearTimeout(timeout);
            resolve();
          });
        } catch {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeout);
          resolve();
        }
      });
    }

    function postAiImageStatusToTarget(
      target: ActiveAiImageStatusTarget,
      payload: any
    ) {
      if (payload?.aiUsagePolicy && typeof payload.aiUsagePolicy === 'object') {
        onAiUsagePolicyUpdateRef.current?.(payload.aiUsagePolicy);
      }
      target.statusCount += 1;
      const stage = String(payload?.stage || '').trim();
      const hasCompletedImage =
        stage === 'completed' &&
        typeof payload?.imageUrl === 'string' &&
        !!payload.imageUrl;
      if (hasCompletedImage || stage === 'error') {
        target.terminalStatusForwarded = true;
        target.terminalResponse = hasCompletedImage
          ? {
              success: true,
              requestId: target.requestId,
              imageUrl: payload.imageUrl,
              responseId: payload.responseId,
              imageId: payload.imageId,
              engine: payload.engine,
              quality: payload.quality,
              aiUsagePolicy: payload.aiUsagePolicy
            }
          : {
              success: false,
              requestId: target.requestId,
              error:
                payload?.error || payload?.message || 'Image generation failed',
              code: payload?.code,
              reason: payload?.reason,
              aiUsagePolicy: payload?.aiUsagePolicy
            };
        target.resolveTerminalResponse(target.terminalResponse);
      }
      const targetWindow = target.sourceWindow;
      const targetBridge = getMessageTargetBridgeForWindow(targetWindow);
      const iframePayload = sanitizeBuildAppAiUsagePolicyPayload(payload);
      try {
        targetWindow.postMessage(
          {
            source: 'twinkle-parent',
            type: 'ai:image-generation-status',
            previewNonce: targetBridge.previewNonce,
            payload: iframePayload
          },
          targetBridge.targetOrigin
        );
      } catch (error) {
        console.error(
          'Failed to forward AI image generation status to build preview:',
          error
        );
      }
    }

    async function recoverAiImageStatusForTarget(
      target: ActiveAiImageStatusTarget,
      payload: any
    ) {
      if (target.recoveryPromise) return await target.recoveryPromise;
      target.recoveryPromise = (async () => {
        let canonicalResult: any = null;
        if (target.imageRequest) {
          const requestFingerprint =
            await createAIImageRequestFingerprint(target.imageRequest);
          const statusRequest = requestFingerprint
            ? { ...target.imageRequest, requestFingerprint }
            : target.imageRequest;
          canonicalResult = await pollCanonicalAIImageStatus({
            loadStatus: () =>
              requestRefs.loadBuildRuntimeAiImageStatusRef.current(
                statusRequest
              ),
            isActive: () =>
              activeAiImageStatusTargets.get(target.messageId) === target &&
              !target.terminalStatusForwarded,
            transientInitialStatuses: ['not_found'],
            transientInitialStatusTimeoutMs: 10_000
          });
        }
        if (
          activeAiImageStatusTargets.get(target.messageId) !== target ||
          target.terminalStatusForwarded
        ) {
          return null;
        }
        const imageUrl = canonicalResult?.imageUrl
          ? canonicalResult.imageUrl
          : await resolveAIImageStatusImageUrl({
              recovery: payload.recovery,
              loadResult: requestRefs.loadAIImageResultRef.current
            });
        if (!imageUrl) return null;
        const forwardedPayload = {
          ...payload,
          ...(canonicalResult || {}),
          requestId: target.requestId,
          stage: 'completed',
          imageUrl
        };
        delete forwardedPayload.recovery;
        return forwardedPayload;
      })().finally(() => {
        target.recoveryPromise = null;
      });
      return await target.recoveryPromise;
    }

    function retireAiImageStatusTarget(target: ActiveAiImageStatusTarget) {
      if (target.completionFallbackTimer) {
        window.clearTimeout(target.completionFallbackTimer);
        target.completionFallbackTimer = null;
      }
      if (activeAiImageStatusTargets.get(target.messageId) === target) {
        activeAiImageStatusTargets.delete(target.messageId);
      }
    }

    async function recoverAndForwardAiImageCompletion(
      target: ActiveAiImageStatusTarget,
      payload: any
    ) {
      try {
        const forwardedPayload = await recoverAiImageStatusForTarget(
          target,
          payload
        );
        if (
          !forwardedPayload ||
          target.terminalStatusForwarded ||
          activeAiImageStatusTargets.get(target.messageId) !== target
        ) {
          return;
        }
        postAiImageStatusToTarget(target, forwardedPayload);
        if (target.terminalStatusForwarded) {
          retireAiImageStatusTarget(target);
        }
      } catch (error) {
        console.error('Failed to recover completed Build AI image status:', error);
      }
    }

    // Fan-out path for status events pushed from the server (no specific target
    // known): route to whichever registered in-flight target owns the requestId.
    async function handleAiImageGenerationStatus(payload: any) {
      const payloadRequestId = String(payload?.requestId || '').trim();
      if (!payloadRequestId) return;
      for (const target of activeAiImageStatusTargets.values()) {
        if (payloadRequestId !== target.requestId) continue;
        let forwardedPayload = payload;
        if (
          payload?.stage === 'completed' &&
          !payload?.imageUrl &&
          payload?.recovery
        ) {
          target.pendingCompletionPayload = payload;
          if (!target.transportFailed) {
            if (!target.completionFallbackTimer) {
              // A healthy HTTP response follows the terminal socket event and
              // avoids a second image download. If that response stalls, the
              // confirmed socket completion becomes the SDK result after a
              // short grace period instead of leaving the Build app waiting.
              target.completionFallbackTimer = window.setTimeout(() => {
                target.completionFallbackTimer = null;
                void recoverAndForwardAiImageCompletion(target, payload);
              }, 1_000);
            }
            continue;
          }
          forwardedPayload = await recoverAiImageStatusForTarget(target, payload);
          if (!forwardedPayload) continue;
        }
        if (
          target.terminalStatusForwarded &&
          (forwardedPayload?.stage === 'completed' ||
            forwardedPayload?.stage === 'error')
        ) {
          continue;
        }
        if (activeAiImageStatusTargets.get(target.messageId) !== target) {
          continue;
        }
        postAiImageStatusToTarget(target, forwardedPayload);
        if (target.terminalStatusForwarded) {
          retireAiImageStatusTarget(target);
        }
      }
    }

    function buildTerminalAiImageStatusFromResponse({
      response,
      requestId
    }: {
      response: any;
      requestId: string;
    }) {
      if (response?.success === false) {
        const errorMessage =
          response.error || response.message || 'Image generation failed';
        return {
          requestId,
          stage: 'error',
          error: errorMessage,
          message: errorMessage,
          ...(response.code ? { code: response.code } : {}),
          ...(response.reason ? { reason: response.reason } : {}),
          ...(response.aiUsagePolicy
            ? { aiUsagePolicy: response.aiUsagePolicy }
            : {})
        };
      }

      if (response?.imageUrl) {
        return {
          requestId,
          stage: 'completed',
          imageUrl: response.imageUrl,
          responseId: response.responseId,
          imageId: response.imageId,
          engine: response.engine,
          quality: response.quality,
          ...(response.aiUsagePolicy
            ? { aiUsagePolicy: response.aiUsagePolicy }
            : {})
        };
      }

      return null;
    }

    function forwardTerminalAiImageStatusIfNeeded({
      target,
      response
    }: {
      target: ActiveAiImageStatusTarget;
      response: any;
    }) {
      if (target.terminalStatusForwarded) return;
      const terminalStatus = buildTerminalAiImageStatusFromResponse({
        response,
        requestId: target.requestId
      });
      if (!terminalStatus) return;
      // Deliver straight to this specific target. Routing through
      // handleAiImageGenerationStatus would re-resolve the recipient by
      // requestId against the registered in-flight targets, which drops the
      // event for an unregistered duplicate target (and misroutes it to the
      // first request when a duplicate reuses an in-flight requestId).
      postAiImageStatusToTarget(target, terminalStatus);
    }

    function buildAiImageErrorResponse(error: any) {
      const errorMessage =
        error?.message ||
        error?.error ||
        error?.toString?.() ||
        'Image generation failed';
      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
        ...(error?.code ? { code: error.code } : {}),
        ...(error?.reason ? { reason: error.reason } : {}),
        ...(error?.aiUsagePolicy ? { aiUsagePolicy: error.aiUsagePolicy } : {})
      };
    }

    function replayBuildRuntimeChatSubscriptions() {
      for (const subscriptionKey of chatSubscriptions.keys()) {
        const [rawBuildId, ...roomKeyParts] = subscriptionKey.split(':');
        const subscribedBuildId = Number(rawBuildId);
        const subscribedRoomKey = roomKeyParts.join(':');
        if (!subscribedBuildId || !subscribedRoomKey) continue;
        subscribeBuildRuntimeChatRoom(subscribedBuildId, subscribedRoomKey);
      }
    }

    function handleSocketAuthReady() {
      replayBuildRuntimeChatSubscriptions();
      if (activeAiImageStatusTargets.size > 0) {
        void ensureAiImageNotificationChannel();
      }
    }

    const handlePreviewFrameRetired = ({
      sourceWindow
    }: {
      sourceWindow: Window | null;
    }) => {
      leaveWorldSessionsForWindow(sourceWindow);
    };
    onPreviewFrameRetiredRef.current = handlePreviewFrameRetired;

    function getMessageTargetBridgeForWindow(targetWindow: Window) {
      const primaryWindow = primaryIframeRef.current?.contentWindow || null;
      if (primaryWindow && targetWindow === primaryWindow) {
        const primaryMeta = previewFrameMetaRef.current.primary;
        return {
          targetOrigin: getBuildPreviewMessageTargetOrigin(
            previewFrameSourcesRef.current.primary ||
              primaryIframeRef.current?.getAttribute('src') ||
              primaryIframeRef.current?.src
          ),
          previewNonce: primaryMeta.bridgeConfirmed
            ? primaryMeta.messageNonce
            : null
        };
      }

      const secondaryWindow = secondaryIframeRef.current?.contentWindow || null;
      if (secondaryWindow && targetWindow === secondaryWindow) {
        const secondaryMeta = previewFrameMetaRef.current.secondary;
        return {
          targetOrigin: getBuildPreviewMessageTargetOrigin(
            previewFrameSourcesRef.current.secondary ||
              secondaryIframeRef.current?.getAttribute('src') ||
              secondaryIframeRef.current?.src
          ),
          previewNonce: secondaryMeta.bridgeConfirmed
            ? secondaryMeta.messageNonce
            : null
        };
      }

      return { targetOrigin: '*', previewNonce: null };
    }

    function forwardAiStreamEventToFrame({
      sourceWindow,
      requestId,
      event,
      messageType = 'ai:chat-status'
    }: {
      sourceWindow: Window;
      requestId: string;
      event: any;
      messageType?: 'ai:chat-status' | 'ai:object-status';
    }) {
      if (event?.aiUsagePolicy && typeof event.aiUsagePolicy === 'object') {
        onAiUsagePolicyUpdateRef.current?.(event.aiUsagePolicy);
      }
      const targetBridge = getMessageTargetBridgeForWindow(sourceWindow);
      const iframeEvent = sanitizeBuildAppAiUsagePolicyPayload(event || {});
      sourceWindow.postMessage(
        {
          source: 'twinkle-parent',
          type: messageType,
          previewNonce: targetBridge.previewNonce,
          payload: {
            requestId,
            ...iframeEvent
          }
        },
        targetBridge.targetOrigin
      );
    }

    async function handleMessage(event: MessageEvent) {
      const data = event.data;
      if (!data || data.source !== 'twinkle-build') return;
      const { id, type, payload, previewNonce } = data;

      const sourceWindow = event.source as Window | null;
      if (!sourceWindow) return;
      const primaryWindow = primaryIframeRef.current?.contentWindow || null;
      const secondaryWindow = secondaryIframeRef.current?.contentWindow || null;
      const sourceFrame =
        primaryWindow && sourceWindow === primaryWindow
          ? 'primary'
          : secondaryWindow && sourceWindow === secondaryWindow
            ? 'secondary'
            : null;
      if (!sourceFrame) return;
      const sourceFrameMeta = previewFrameMetaRef.current[sourceFrame];
      const sourcePreviewSrc =
        previewFrameSourcesRef.current[sourceFrame] ||
        (sourceFrame === 'primary'
          ? primaryIframeRef.current?.getAttribute('src') ||
            primaryIframeRef.current?.src
          : secondaryIframeRef.current?.getAttribute('src') ||
            secondaryIframeRef.current?.src);
      const sourceOriginAllowed = isAllowedBuildPreviewMessageOrigin({
        eventOrigin: event.origin,
        previewSrc: sourcePreviewSrc
      });
      if (type === 'bridge:request-nonce') {
        const requestedBridgeLoadId = String(
          payload?.bridgeLoadId || ''
        ).trim();
        const sourceBridgeLoadId = getPreviewSrcBridgeLoadId(sourcePreviewSrc);
        if (
          sourceOriginAllowed &&
          sourceFrameMeta.messageNonce &&
          isBridgeNonceRequestOpen(sourceFrameMeta) &&
          requestedBridgeLoadId &&
          requestedBridgeLoadId === sourceFrameMeta.bridgeLoadId &&
          requestedBridgeLoadId === sourceBridgeLoadId
        ) {
          previewFrameMetaRef.current = {
            ...previewFrameMetaRef.current,
            [sourceFrame]: {
              ...sourceFrameMeta,
              bridgeNonceRequestOpen: false,
              bridgeNonceRequestExpiresAt: null
            }
          };
          sourceWindow.postMessage(
            {
              source: 'twinkle-parent',
              type: 'bridge:nonce',
              previewNonce: sourceFrameMeta.messageNonce
            },
            getBuildPreviewMessageTargetOrigin(sourcePreviewSrc)
          );
        }
        return;
      }
      if (
        !sourceFrameMeta.messageNonce ||
        previewNonce !== sourceFrameMeta.messageNonce
      ) {
        if (isWorldPreviewBridgeMessageType(type)) {
          emitWorldBridgeTelemetry({
            buildId: previewAuth.buildRef.current?.id ?? null,
            worldKey: payload?.worldKey,
            roomKey: payload?.roomKey,
            instanceId: payload?.instanceId,
            outcome: 'nonce_drop',
            stage: 'gate',
            messageType: type,
            hadNonce: !!previewNonce
          });
        }
        return;
      }
      if (!sourceOriginAllowed) {
        return;
      }
      const previewMessageTargetOrigin =
        getBuildPreviewMessageTargetOrigin(sourcePreviewSrc);
      const previewMessageNonce = sourceFrameMeta.messageNonce;
      if (!sourceFrameMeta.bridgeConfirmed) {
        previewFrameMetaRef.current = {
          ...previewFrameMetaRef.current,
          [sourceFrame]: {
            ...sourceFrameMeta,
            bridgeConfirmed: true
          }
        };
        if (runtimeOnly) {
          sourceWindow.postMessage(
            {
              source: 'twinkle-parent',
              type: 'audio:mute',
              previewNonce: previewMessageNonce,
              muted: audioMutedRef.current,
              payload: { muted: audioMutedRef.current }
            },
            previewMessageTargetOrigin
          );
        }
      }
      const targetFrame = messageTargetFrameRef.current;
      const targetWindow =
        targetFrame === 'primary' ? primaryWindow : secondaryWindow;
      const alternateFrame =
        targetFrame === 'primary' ? 'secondary' : 'primary';
      const alternateWindow =
        alternateFrame === 'primary' ? primaryWindow : secondaryWindow;
      const frameMeta = previewFrameMetaRef.current;
      const activeBuild = previewAuth.buildRef.current;
      const activeBuildId = activeBuild?.id ?? null;
      if (!activeBuildId) return;
      const targetMeta = frameMeta[targetFrame];
      const alternateMeta = frameMeta[alternateFrame];
      const alternateHasSource = Boolean(
        previewFrameSourcesRef.current[alternateFrame]
      );
      const shouldAcceptAlternate =
        previewTransitioningRef.current &&
        alternateHasSource &&
        alternateMeta?.buildId === activeBuildId;
      const allowRuntimePrimaryWindow =
        runtimeOnly &&
        targetFrame === 'primary' &&
        primaryWindow &&
        sourceWindow === primaryWindow;
      const fromTargetWindow = Boolean(
        targetWindow &&
        sourceWindow === targetWindow &&
        (targetMeta?.buildId === activeBuildId || allowRuntimePrimaryWindow)
      );
      const fromAlternateWindow = Boolean(
        alternateWindow &&
        sourceWindow === alternateWindow &&
        alternateMeta?.buildId === activeBuildId
      );
      if (
        !fromTargetWindow &&
        !(shouldAcceptAlternate && fromAlternateWindow)
      ) {
        return;
      }

      if (type === 'runtime-observation') {
        handleRuntimeObservationPreviewMessage({
          activeBuildId,
          frameMeta,
          payload,
          previewCodeSignatureRef,
          runtimeOnly,
          setRuntimeObservationState,
          sourceFrame,
          sourceFrameMeta
        });
        return;
      }

      if (type === 'preview-health') {
        handlePreviewHealthMessage({
          activeBuildId,
          frameMeta,
          payload,
          previewCodeSignatureRef,
          runtimeOnly,
          setRuntimeObservationState,
          sourceFrame,
          sourceFrameMeta
        });
        return;
      }

      if (
        previewTransitioningRef.current &&
        isMutatingPreviewRequestType(type)
      ) {
        const mutationAuthorityFrame = shouldAcceptAlternate
          ? alternateFrame
          : targetFrame;
        if (sourceFrame !== mutationAuthorityFrame) {
          sourceWindow.postMessage(
            {
              source: 'twinkle-parent',
              id,
              previewNonce: previewMessageNonce,
              error:
                'Preview is updating. This request was skipped to prevent duplicate side effects.',
              errorCode: 'PREVIEW_UPDATING'
            },
            previewMessageTargetOrigin
          );
          return;
        }
      }

      try {
        let response: any = {};
        let pendingHostNavigationUrl = '';

        switch (type) {
          case 'app-tools:register': {
            if (!runtimeOnly || !appMcpSessionId) {
              response = { success: true, active: false, session: null };
              break;
            }
            if (!userId) {
              throw createPreviewBridgeError(
                'Sign in to connect this Lumine app-mcp session',
                'APP_MCP_SIGN_IN_REQUIRED'
              );
            }
            const handlerNames = Array.isArray(payload?.handlerNames)
              ? payload.handlerNames.map(String)
              : [];
            const existingRuntime = appMcpRuntime;
            if (
              existingRuntime?.activeCallId &&
              existingRuntime.sourceWindow !== sourceWindow
            ) {
              throw createPreviewBridgeError(
                'Wait for the active App MCP call before reconnecting the app',
                'APP_MCP_CALL_ACTIVE'
              );
            }
            const connectionId =
              existingRuntime?.connectionId || crypto.randomUUID();
            const connected =
              await requestRefs.connectBuildAppMcpRuntimeRef.current({
                buildId,
                sessionId: appMcpSessionId,
                connectionId,
                handlerNames
              });
            if (existingRuntime) {
              existingRuntime.sourceWindow = sourceWindow;
              existingRuntime.stopped = false;
              appMcpRuntime = existingRuntime;
            } else {
              appMcpRuntime = {
                connectionId,
                sourceWindow,
                activeCallId: null,
                stopped: false
              };
            }
            scheduleAppMcpPoll(0);
            response = {
              success: true,
              active: true,
              session: connected?.session || null
            };
            break;
          }

          case 'app-tools:complete': {
            const runtime = appMcpRuntime;
            const callId = String(payload?.callId || '');
            if (
              !runtime ||
              runtime.sourceWindow !== sourceWindow ||
              !appMcpSessionId ||
              !callId
            ) {
              throw createPreviewBridgeError(
                'App MCP call is not active',
                'APP_MCP_CALL_NOT_ACTIVE'
              );
            }
            await requestRefs.completeBuildAppMcpCallRef.current({
              buildId,
              sessionId: appMcpSessionId,
              callId,
              connectionId: runtime.connectionId,
              result: payload?.result,
              error: payload?.error
            });
            if (runtime.activeCallId === callId) {
              runtime.activeCallId = null;
              scheduleAppMcpPoll(0);
            }
            response = { success: true };
            break;
          }

          case 'init':
            response = {
              id: activeBuild.id,
              title: activeBuild.title,
              username: activeBuild.username,
              viewer: getViewerInfo(previewAuth),
              mount: mountContextRef.current,
              launchTarget: launchTargetRef.current,
              capabilities: capabilitySnapshotRef.current,
              explorationPlan: runtimeExplorationPlanRef.current
            };
            break;

          case 'app:navigate': {
            const nextPreviewSrc = normalizeAllowedBuildPreviewFrameSrc(
              payload?.url
            );
            if (!nextPreviewSrc) {
              throw createPreviewBridgeError(
                'Navigation target must be a Build preview URL',
                'INVALID_NAVIGATION_TARGET'
              );
            }
            const nextPreviewBuildId =
              extractBuildIdFromPreviewPath(nextPreviewSrc);
            if (nextPreviewBuildId !== activeBuild.id) {
              throw createPreviewBridgeError(
                'Navigation target must belong to the current build',
                'INVALID_NAVIGATION_TARGET'
              );
            }
            const navigatedPreviewSrc =
              navigatePreviewFrameRef.current?.(nextPreviewSrc) || null;
            if (!navigatedPreviewSrc) {
              throw createPreviewBridgeError(
                'Navigation target is invalid',
                'INVALID_NAVIGATION_TARGET'
              );
            }
            response = { success: true, src: navigatedPreviewSrc };
            break;
          }

          case 'app:open-content': {
            const navigationDecision = authorizeTwinkleContentNavigation({
              currentOrigin: window.location.origin,
              target: payload?.url,
              userActivation: navigator.userActivation
            });
            if (!navigationDecision.allowed) {
              throw createPreviewBridgeError(
                navigationDecision.message,
                navigationDecision.code
              );
            }
            const confirmationDecision =
              await contentNavigationConfirmationController.request({
                requestConfirmation: requestOpenContentConfirmationRef.current,
                url: navigationDecision.url
              });
            if (!confirmationDecision.confirmed) {
              throw createPreviewBridgeError(
                confirmationDecision.message,
                confirmationDecision.code
              );
            }
            pendingHostNavigationUrl = confirmationDecision.url;
            response = { success: true, url: confirmationDecision.url };
            break;
          }

          case 'mount:get':
            response = { mount: mountContextRef.current };
            break;

          case 'capabilities:get':
            response = { capabilities: capabilitySnapshotRef.current };
            break;

          case 'ai:list-prompts':
            response = {
              prompts:
                (await requestRefs.loadBuildAiPromptsRef.current())?.prompts ||
                []
            };
            break;

          case 'ai:get-usage-policy':
            if (!previewAuth.userIdRef.current) {
              triggerGuestRestriction(previewAuth);
            }
            response = await requestRefs.getAiEnergyPolicyRef.current();
            if (
              response?.aiUsagePolicy &&
              typeof response.aiUsagePolicy === 'object'
            ) {
              onAiUsagePolicyUpdateRef.current?.(response.aiUsagePolicy);
            }
            response = {
              aiUsagePolicy: getBuildAppAiUsagePolicy(
                response?.aiUsagePolicy
              )
            };
            break;

          case 'ai:chat':
            if (!previewAuth.userIdRef.current) {
              triggerGuestRestriction(previewAuth);
            }
            if (payload?.stream) {
              const requestId = String(payload?.requestId || id);
              response =
                await requestRefs.callBuildRuntimeAiChatStreamRef.current({
                  buildId: activeBuild.id,
                  promptId: payload.promptId,
                  message: payload.message,
                  history: payload.history,
                  systemPrompt: payload.systemPrompt,
                  webSearch: payload.webSearch,
                  onEvent: (streamEvent: any) => {
                    forwardAiStreamEventToFrame({
                      sourceWindow,
                      requestId,
                      event: streamEvent
                    });
                  }
                });
            } else {
              response = await requestRefs.callBuildRuntimeAiChatRef.current({
                buildId: activeBuild.id,
                promptId: payload.promptId,
                message: payload.message,
                history: payload.history,
                systemPrompt: payload.systemPrompt,
                webSearch: payload.webSearch
              });
            }
            if (
              response?.aiUsagePolicy &&
              typeof response.aiUsagePolicy === 'object'
            ) {
              onAiUsagePolicyUpdateRef.current?.(response.aiUsagePolicy);
            }
            break;

          case 'ai:generate-object':
            if (!previewAuth.userIdRef.current) {
              triggerGuestRestriction(previewAuth);
            }
            response = await requestRefs.callBuildRuntimeAiObjectRef.current({
              buildId: activeBuild.id,
              prompt: payload.prompt,
              expectedStructure: payload.expectedStructure,
              thinkingMode: payload.thinkingMode,
              mode: payload.mode,
              model: payload.model,
              instructions: payload.instructions,
              systemPrompt: payload.systemPrompt,
              webSearch: payload.webSearch,
              onEvent:
                payload?.stream === true
                  ? (streamEvent: any) => {
                      forwardAiStreamEventToFrame({
                        sourceWindow,
                        requestId: String(payload?.requestId || id),
                        event: streamEvent,
                        messageType: 'ai:object-status'
                      });
                    }
                  : undefined
            });
            if (
              response?.aiUsagePolicy &&
              typeof response.aiUsagePolicy === 'object'
            ) {
              onAiUsagePolicyUpdateRef.current?.(response.aiUsagePolicy);
            }
            break;

          case 'news:get-current':
            response = await requestRefs.getBuildTwinkleNewsRef.current({
              buildId: activeBuild.id
            });
            break;

          case 'news:list-editions':
            response =
              await requestRefs.listBuildTwinkleNewsEditionsRef.current({
                buildId: activeBuild.id,
                limit: payload?.limit,
                cursor: payload?.cursor
              });
            break;

          case 'news:get-edition':
            response = await requestRefs.getBuildTwinkleNewsEditionRef.current({
              buildId: activeBuild.id,
              dayIndex: payload?.dayIndex,
              revisionNumber: payload?.revisionNumber
            });
            break;

          case 'news:generate':
            if (!previewAuth.userIdRef.current) {
              triggerGuestRestriction(previewAuth);
            }
            response = await requestRefs.generateBuildTwinkleNewsRef.current({
              buildId: activeBuild.id,
              refresh: payload?.refresh === true
            });
            break;

          case 'characters:chat':
            if (!previewAuth.userIdRef.current) {
              triggerGuestRestriction(previewAuth);
            }
            if (payload?.stream) {
              const requestId = String(payload?.requestId || id);
              response =
                await requestRefs.callBuildRuntimeCharacterChatStreamRef.current(
                  {
                    buildId: activeBuild.id,
                    character: payload.character,
                    thinkingMode: payload.thinkingMode,
                    message: payload.message,
                    history: payload.history,
                    roomContext: payload.roomContext,
                    scene: payload.scene,
                    systemPrompt: payload.systemPrompt,
                    instructions: payload.instructions,
                    includeWebsiteContext: payload.includeWebsiteContext,
                    webSearch: payload.webSearch,
                    onEvent: (streamEvent: any) => {
                      forwardAiStreamEventToFrame({
                        sourceWindow,
                        requestId,
                        event: streamEvent
                      });
                    }
                  }
                );
            } else {
              response =
                await requestRefs.callBuildRuntimeCharacterChatRef.current({
                  buildId: activeBuild.id,
                  character: payload.character,
                  thinkingMode: payload.thinkingMode,
                  message: payload.message,
                  history: payload.history,
                  roomContext: payload.roomContext,
                  scene: payload.scene,
                  systemPrompt: payload.systemPrompt,
                  instructions: payload.instructions,
                  includeWebsiteContext: payload.includeWebsiteContext,
                  webSearch: payload.webSearch
                });
            }
            if (
              response?.aiUsagePolicy &&
              typeof response.aiUsagePolicy === 'object'
            ) {
              onAiUsagePolicyUpdateRef.current?.(response.aiUsagePolicy);
            }
            break;

          case 'ai:generate-image': {
            if (!previewAuth.userIdRef.current) {
              triggerGuestRestriction(previewAuth);
              throw createPreviewBridgeError(
                'Sign in to generate AI images.',
                'AUTH_REQUIRED'
              );
            }

            const selectedImageEngine: 'gemini' | 'openai' =
              payload?.engine === 'gemini' ? 'gemini' : 'openai';
            const selectedImageQuality: 'low' | 'medium' | 'high' =
              payload?.quality === 'low' ||
              payload?.quality === 'medium' ||
              payload?.quality === 'high'
                ? payload.quality
                : 'high';
            const imageAuthorization =
              await imageGenerationController.authorize({
                userActivation: navigator.userActivation,
                request: {
                  prompt: String(payload?.prompt || '').trim(),
                  engine: selectedImageEngine,
                  quality: selectedImageQuality
                },
                requestConfirmation:
                  requestBuildImageGenerationConfirmationRef.current
              });
            if (!imageAuthorization.authorized) {
              throw createPreviewBridgeError(
                imageAuthorization.message,
                imageAuthorization.code
              );
            }

            let resolveTerminalResponse!: (response: any) => void;
            const terminalResponsePromise = new Promise<any>((resolve) => {
              resolveTerminalResponse = resolve;
            });
            activeAiImageStatusTargets.set(id, {
              messageId: id,
              requestId: String(payload?.requestId || id),
              sourceWindow,
              statusCount: 0,
              terminalStatusForwarded: false,
              transportFailed: false,
              terminalResponsePromise,
              resolveTerminalResponse
            });
            const aiImageStatusTarget = activeAiImageStatusTargets.get(id);
            try {
              await ensureAiImageNotificationChannel();
              const imageRequest: AiImageRequestFingerprintInput & {
                buildId: number;
                requestId: string;
              } = {
                buildId: activeBuild.id,
                prompt: String(payload?.prompt || '').trim(),
                previousImageId: payload?.previousImageId,
                previousResponseId: payload?.previousResponseId,
                referenceImageB64: payload?.referenceImageB64,
                engine: selectedImageEngine,
                quality: selectedImageQuality,
                requestId: String(payload?.requestId || id)
              };
              if (aiImageStatusTarget) {
                aiImageStatusTarget.imageRequest = imageRequest;
              }
              const httpResponsePromise =
                requestRefs.callBuildRuntimeAiImageRef.current(imageRequest);
              response = aiImageStatusTarget
                ? await Promise.race([
                    httpResponsePromise,
                    aiImageStatusTarget.terminalResponsePromise
                  ])
                : await httpResponsePromise;
              if (
                response?.aiUsagePolicy &&
                typeof response.aiUsagePolicy === 'object'
              ) {
                onAiUsagePolicyUpdateRef.current?.(response.aiUsagePolicy);
              }
              if (
                aiImageStatusTarget &&
                response?.success === false &&
                shouldRecoverAIImageUnknownOutcome({
                  reachedServer: response.reachedServer,
                  hasServerProgress: aiImageStatusTarget.statusCount > 0,
                  hasPendingCompletion:
                    !!aiImageStatusTarget.pendingCompletionPayload
                })
              ) {
                aiImageStatusTarget.transportFailed = true;
                if (aiImageStatusTarget.completionFallbackTimer) {
                  window.clearTimeout(
                    aiImageStatusTarget.completionFallbackTimer
                  );
                  aiImageStatusTarget.completionFallbackTimer = null;
                }
                let canonicalResult = aiImageStatusTarget.pendingCompletionPayload
                  ? await recoverAiImageStatusForTarget(
                      aiImageStatusTarget,
                      aiImageStatusTarget.pendingCompletionPayload
                    )
                  : null;
                if (!canonicalResult) {
                  const requestFingerprint =
                    await createAIImageRequestFingerprint(imageRequest);
                  const statusRequest = requestFingerprint
                    ? { ...imageRequest, requestFingerprint }
                    : imageRequest;
                  canonicalResult = await pollCanonicalAIImageStatus({
                    loadStatus: () =>
                      requestRefs.loadBuildRuntimeAiImageStatusRef.current(
                        statusRequest
                      ),
                    isActive: () =>
                      activeAiImageStatusTargets.get(id) ===
                        aiImageStatusTarget &&
                      !aiImageStatusTarget.terminalStatusForwarded,
                    transientInitialStatuses: ['not_found'],
                    transientInitialStatusTimeoutMs: 10_000
                  });
                }
                if (canonicalResult) {
                  response = canonicalResult;
                } else if (aiImageStatusTarget.terminalResponse) {
                  // A socket completion can win while the read-only status
                  // request is in flight. Return that same terminal truth to
                  // the SDK promise as well as its status listener so a
                  // successful image never resolves as a transport failure.
                  response = aiImageStatusTarget.terminalResponse;
                }
              }
              if (aiImageStatusTarget) {
                forwardTerminalAiImageStatusIfNeeded({
                  target: aiImageStatusTarget,
                  response
                });
              }
            } catch (error: any) {
              if (aiImageStatusTarget) {
                forwardTerminalAiImageStatusIfNeeded({
                  target: aiImageStatusTarget,
                  response: buildAiImageErrorResponse(error)
                });
              }
              throw error;
            } finally {
              if (aiImageStatusTarget) {
                retireAiImageStatusTarget(aiImageStatusTarget);
              } else {
                activeAiImageStatusTargets.delete(id);
              }
              imageAuthorization.release();
            }
            break;
          }

          case 'viewer:get':
            response = { viewer: getViewerInfo(previewAuth) };
            break;

          case 'app:get-info':
            // Host-computed app identity so a build can build its own canonical
            // share/deep-link URLs (the sandboxed iframe has an opaque origin and
            // can't read the parent site origin itself).
            response = {
              app: {
                buildId: activeBuild.id,
                appUrl: `${window.location.origin}/app/${activeBuild.id}`
              }
            };
            break;

          case 'chess:best-move':
          case 'chess:evaluate':
            response = await evaluateBuildChessPosition(payload);
            break;

          case 'user-db:query':
            if (isGuestViewerActive(previewAuth)) {
              response = await executeGuestViewerDbQuery({
                buildId: activeBuild.id,
                guestSessionId: ensureGuestSessionId(previewAuth),
                sql: payload?.sql,
                params: payload?.params
              });
            } else {
              response = await requestRefs.queryViewerDbRef.current({
                buildId: activeBuild.id,
                sql: payload?.sql,
                params: payload?.params
              });
            }
            break;

          case 'user-db:exec':
            if (isGuestViewerActive(previewAuth)) {
              response = await executeGuestViewerDbExec({
                buildId: activeBuild.id,
                guestSessionId: ensureGuestSessionId(previewAuth),
                sql: payload?.sql,
                params: payload?.params
              });
            } else {
              response = await requestRefs.execViewerDbRef.current({
                buildId: activeBuild.id,
                sql: payload?.sql,
                params: payload?.params
              });
            }
            break;

          case 'api:get-user': {
            const userToken = await ensureBuildApiToken(
              ['user:read'],
              previewAuth
            );
            response = await requestRefs.getBuildApiUserRef.current({
              buildId: activeBuild.id,
              userId: payload?.userId,
              token: userToken
            });
            break;
          }

          case 'api:get-users': {
            const usersToken = await ensureBuildApiToken(
              ['users:read'],
              previewAuth
            );
            response = await requestRefs.getBuildApiUsersRef.current({
              buildId: activeBuild.id,
              search: payload?.search,
              userIds: payload?.userIds,
              cursor: payload?.cursor,
              limit: payload?.limit,
              token: usersToken
            });
            break;
          }

          case 'api:get-daily-reflections': {
            const reflectionsToken = await ensureBuildApiToken(
              ['dailyReflections:read'],
              previewAuth
            );
            response = await requestRefs.getBuildDailyReflectionsRef.current({
              buildId: activeBuild.id,
              userIds: payload?.userIds,
              lastId: payload?.lastId,
              cursor: payload?.cursor,
              limit: payload?.limit,
              token: reflectionsToken
            });
            break;
          }

          case 'files:upload-selected': {
            const filesWriteToken = await ensureBuildApiToken(
              ['files:write'],
              previewAuth
            );
            response = await requestRefs.uploadBuildRuntimeFilesRef.current({
              buildId: activeBuild.id,
              files: Array.isArray(payload?.files) ? payload.files : [],
              token: filesWriteToken
            });
            if (Array.isArray(response?.assets) && response.assets.length > 0) {
              void syncPreviewRuntimeUploadsState({
                buildId: activeBuild.id,
                previewAuth,
                requestRefs,
                runtimeUploadsSyncRef
              }).catch((error) => {
                console.error(
                  'Failed to sync runtime uploads after preview upload:',
                  error
                );
              });
            }
            break;
          }

          case 'files:save-as':
            response = await triggerPreviewLocalDownload(payload);
            break;

          case 'files:list': {
            const filesReadToken = await ensureBuildApiToken(
              ['files:read'],
              previewAuth
            );
            response = await requestRefs.listBuildRuntimeFilesRef.current({
              buildId: activeBuild.id,
              cursor: payload?.cursor,
              limit: payload?.limit,
              token: filesReadToken
            });
            break;
          }

          case 'files:delete': {
            const filesWriteToken = await ensureBuildApiToken(
              ['files:write'],
              previewAuth
            );
            response = await requestRefs.deleteBuildRuntimeFileRef.current({
              buildId: activeBuild.id,
              assetId: payload?.assetId,
              token: filesWriteToken
            });
            if (response?.success) {
              void syncPreviewRuntimeUploadsState({
                buildId: activeBuild.id,
                previewAuth,
                requestRefs,
                runtimeUploadsSyncRef
              }).catch((error) => {
                console.error(
                  'Failed to sync runtime uploads after preview delete:',
                  error
                );
              });
            }
            break;
          }

          case 'content:my-subjects': {
            const contentSubjectsToken = await ensureBuildApiToken(
              ['content:read'],
              previewAuth
            );
            response = await requestRefs.getBuildMySubjectsRef.current({
              buildId: activeBuild.id,
              limit: payload?.limit,
              cursor: payload?.cursor,
              token: contentSubjectsToken
            });
            break;
          }

          case 'content:subjects:search': {
            const contentSubjectsToken = await ensureBuildApiToken(
              ['content:read'],
              previewAuth
            );
            response = await requestRefs.searchBuildSubjectsRef.current({
              buildId: activeBuild.id,
              query: payload?.query,
              limit: payload?.limit,
              cursor: payload?.cursor,
              token: contentSubjectsToken
            });
            break;
          }

          case 'content:ai-cards:list': {
            const contentAiCardsToken = await ensureBuildApiToken(
              ['content:read'],
              previewAuth
            );
            response = await requestRefs.listBuildAiCardsRef.current({
              buildId: activeBuild.id,
              limit: payload?.limit,
              cursor: payload?.cursor,
              level: payload?.level,
              minLevel: payload?.minLevel,
              maxLevel: payload?.maxLevel,
              quality: payload?.quality,
              userId: payload?.userId,
              hasImage: payload?.hasImage,
              hasExample: payload?.hasExample,
              token: contentAiCardsToken
            });
            break;
          }

          case 'content:ai-cards:search': {
            const contentAiCardsToken = await ensureBuildApiToken(
              ['content:read'],
              previewAuth
            );
            response = await requestRefs.searchBuildAiCardsRef.current({
              buildId: activeBuild.id,
              query: payload?.query,
              limit: payload?.limit,
              cursor: payload?.cursor,
              level: payload?.level,
              minLevel: payload?.minLevel,
              maxLevel: payload?.maxLevel,
              quality: payload?.quality,
              userId: payload?.userId,
              hasImage: payload?.hasImage,
              hasExample: payload?.hasExample,
              token: contentAiCardsToken
            });
            break;
          }

          case 'content:ai-card': {
            const contentAiCardToken = await ensureBuildApiToken(
              ['content:read'],
              previewAuth
            );
            response = await requestRefs.getBuildAiCardRef.current({
              buildId: activeBuild.id,
              cardId: payload?.cardId,
              token: contentAiCardToken
            });
            break;
          }

          case 'content:ai-stories:list': {
            const contentAiStoriesToken = await ensureBuildApiToken(
              ['content:read'],
              previewAuth
            );
            response = await requestRefs.listBuildAiStoriesRef.current({
              buildId: activeBuild.id,
              limit: payload?.limit,
              cursor: payload?.cursor,
              order: payload?.order,
              difficulty: payload?.difficulty,
              type: payload?.type,
              topicKey: payload?.topicKey,
              storyBy: payload?.storyBy,
              isListening: payload?.isListening,
              userId: payload?.userId,
              hasImage: payload?.hasImage,
              hasQuestions: payload?.hasQuestions,
              token: contentAiStoriesToken
            });
            break;
          }

          case 'content:ai-stories:chapters': {
            const contentAiStoriesToken = await ensureBuildApiToken(
              ['content:read'],
              previewAuth
            );
            response =
              await requestRefs.listBuildAiStoryChaptersRef.current({
                buildId: activeBuild.id,
                limit: payload?.limit,
                cursor: payload?.cursor,
                groupBy: payload?.groupBy,
                difficulty: payload?.difficulty,
                type: payload?.type,
                topicKey: payload?.topicKey,
                storyBy: payload?.storyBy,
                isListening: payload?.isListening,
                userId: payload?.userId,
                hasImage: payload?.hasImage,
                hasQuestions: payload?.hasQuestions,
                token: contentAiStoriesToken
              });
            break;
          }

          case 'content:ai-stories:search': {
            const contentAiStoriesToken = await ensureBuildApiToken(
              ['content:read'],
              previewAuth
            );
            response = await requestRefs.searchBuildAiStoriesRef.current({
              buildId: activeBuild.id,
              query: payload?.query,
              limit: payload?.limit,
              cursor: payload?.cursor,
              order: payload?.order,
              difficulty: payload?.difficulty,
              type: payload?.type,
              topicKey: payload?.topicKey,
              storyBy: payload?.storyBy,
              isListening: payload?.isListening,
              userId: payload?.userId,
              hasImage: payload?.hasImage,
              hasQuestions: payload?.hasQuestions,
              token: contentAiStoriesToken
            });
            break;
          }

          case 'content:ai-story': {
            const contentAiStoryToken = await ensureBuildApiToken(
              ['content:read'],
              previewAuth
            );
            response = await requestRefs.getBuildAiStoryRef.current({
              buildId: activeBuild.id,
              storyId: payload?.storyId,
              token: contentAiStoryToken
            });
            break;
          }

          case 'content:grammarbles:questions': {
            const contentGrammarblesToken = await ensureBuildApiToken(
              ['content:read'],
              previewAuth
            );
            response =
              await requestRefs.listBuildGrammarblesQuestionsRef.current({
                buildId: activeBuild.id,
                level: payload?.level,
                limit: payload?.limit,
                cursor: payload?.cursor,
                token: contentGrammarblesToken
              });
            break;
          }

          case 'content:grammarbles:history': {
            const contentGrammarblesToken = await ensureBuildApiToken(
              ['content:read'],
              previewAuth
            );
            response = await requestRefs.getBuildGrammarblesHistoryRef.current({
              buildId: activeBuild.id,
              level: payload?.level,
              limit: payload?.limit,
              cursor: payload?.cursor,
              token: contentGrammarblesToken
            });
            break;
          }

          case 'content:subject': {
            const contentSubjectToken = await ensureBuildApiToken(
              ['content:read'],
              previewAuth
            );
            response = await requestRefs.getBuildSubjectRef.current({
              buildId: activeBuild.id,
              subjectId: payload?.subjectId,
              token: contentSubjectToken
            });
            break;
          }

          case 'content:write-status': {
            const contentWriteStatusToken = await ensureBuildApiToken(
              ['content:read'],
              previewAuth
            );
            response =
              await requestRefs.getBuildContentWriteStatusRef.current({
                buildId: activeBuild.id,
                subjectId: payload?.subjectId,
                commentId: payload?.commentId,
                token: contentWriteStatusToken
              });
            break;
          }

          case 'content:subject:create': {
            const contentWriteToken = await ensureBuildApiToken(
              ['content:write'],
              previewAuth
            );
            response = await requestRefs.createBuildContentSubjectRef.current({
              buildId: activeBuild.id,
              title: payload?.title,
              description: payload?.description,
              token: contentWriteToken
            });
            break;
          }

          case 'content:subject:edit': {
            const contentWriteToken = await ensureBuildApiToken(
              ['content:write'],
              previewAuth
            );
            response = await requestRefs.editBuildContentSubjectRef.current({
              buildId: activeBuild.id,
              subjectId: payload?.subjectId,
              title: payload?.title,
              description: payload?.description,
              token: contentWriteToken
            });
            break;
          }

          case 'content:comment:create': {
            const contentWriteToken = await ensureBuildApiToken(
              ['content:write'],
              previewAuth
            );
            response = await requestRefs.createBuildContentCommentRef.current({
              buildId: activeBuild.id,
              subjectId: payload?.subjectId,
              content: payload?.content,
              token: contentWriteToken
            });
            break;
          }

          case 'content:comment:edit': {
            const contentWriteToken = await ensureBuildApiToken(
              ['content:write'],
              previewAuth
            );
            response = await requestRefs.editBuildContentCommentRef.current({
              buildId: activeBuild.id,
              commentId: payload?.commentId,
              content: payload?.content,
              token: contentWriteToken
            });
            break;
          }

          case 'content:subject-comments': {
            const contentCommentsToken = await ensureBuildApiToken(
              ['content:read'],
              previewAuth
            );
            response = await requestRefs.getBuildSubjectCommentsRef.current({
              buildId: activeBuild.id,
              subjectId: payload?.subjectId,
              limit: payload?.limit,
              cursor: payload?.cursor,
              token: contentCommentsToken
            });
            break;
          }

          case 'content:subject-comments:list': {
            const contentCommentsToken = await ensureBuildApiToken(
              ['content:read'],
              previewAuth
            );
            response = await requestRefs.listBuildSubjectCommentsRef.current({
              buildId: activeBuild.id,
              subjectId: payload?.subjectId,
              limit: payload?.limit,
              cursor: payload?.cursor,
              sortBy: payload?.sortBy,
              includeReplies: payload?.includeReplies,
              author: payload?.author,
              authorUserId: payload?.authorUserId,
              replyScope: payload?.replyScope,
              token: contentCommentsToken
            });
            break;
          }

          case 'content:profile-comments': {
            const contentProfileCountToken = await ensureBuildApiToken(
              ['content:read'],
              previewAuth
            );
            response = await requestRefs.getBuildProfileCommentsRef.current({
              buildId: activeBuild.id,
              profileUserId: payload?.profileUserId,
              limit: payload?.limit,
              offset: payload?.offset,
              sortBy: payload?.sortBy,
              includeReplies: payload?.includeReplies,
              range: payload?.range,
              since: payload?.since,
              until: payload?.until,
              token: contentProfileCountToken
            });
            break;
          }

          case 'content:profile-comment-ids': {
            const contentProfileIdsToken = await ensureBuildApiToken(
              ['content:read'],
              previewAuth
            );
            response = await requestRefs.getBuildProfileCommentIdsRef.current({
              buildId: activeBuild.id,
              profileUserId: payload?.profileUserId,
              limit: payload?.limit,
              offset: payload?.offset,
              sortBy: payload?.sortBy,
              includeReplies: payload?.includeReplies,
              range: payload?.range,
              since: payload?.since,
              until: payload?.until,
              token: contentProfileIdsToken
            });
            break;
          }

          case 'content:profile-comments-by-ids': {
            const contentProfileByIdsToken = await ensureBuildApiToken(
              ['content:read'],
              previewAuth
            );
            response =
              await requestRefs.getBuildProfileCommentsByIdsRef.current({
                buildId: activeBuild.id,
                ids: Array.isArray(payload?.ids) ? payload.ids : [],
                token: contentProfileByIdsToken
              });
            break;
          }

          case 'content:profile-comment-counts': {
            const contentProfileCountsToken = await ensureBuildApiToken(
              ['content:read'],
              previewAuth
            );
            response =
              await requestRefs.getBuildProfileCommentCountsRef.current({
                buildId: activeBuild.id,
                ids: Array.isArray(payload?.ids) ? payload.ids : [],
                token: contentProfileCountsToken
              });
            break;
          }

          case 'shared-db:get-topics': {
            const sharedDbTopicsToken = await ensureBuildApiToken(
              ['sharedDb:read'],
              previewAuth
            );
            response = await requestRefs.getSharedDbTopicsRef.current({
              buildId: activeBuild.id,
              token: sharedDbTopicsToken
            });
            break;
          }

          case 'shared-db:create-topic': {
            const sharedDbCreateTopicToken = await ensureBuildApiToken(
              ['sharedDb:write'],
              previewAuth
            );
            response = await requestRefs.createSharedDbTopicRef.current({
              buildId: activeBuild.id,
              name: payload?.name,
              token: sharedDbCreateTopicToken
            });
            break;
          }

          case 'shared-db:get-entries': {
            const sharedDbEntriesToken = await ensureBuildApiToken(
              ['sharedDb:read'],
              previewAuth
            );
            response = await requestRefs.getSharedDbEntriesRef.current({
              buildId: activeBuild.id,
              topicName: payload?.topicName,
              topicId: payload?.topicId,
              limit: payload?.limit,
              pageSize: payload?.pageSize,
              cursor: payload?.cursor,
              order: payload?.order || payload?.sort || payload?.direction,
              token: sharedDbEntriesToken
            });
            break;
          }

          case 'shared-db:add-entry': {
            // A subjectRef add is get-or-create: it may return an existing
            // (possibly another user's) canonical entry, which is a read. Only
            // then request read scope too — a plain append stays write-only.
            const sharedDbAddEntryScopes =
              payload?.subjectRef != null
                ? ['sharedDb:write', 'sharedDb:read']
                : ['sharedDb:write'];
            const sharedDbAddEntryToken = await ensureBuildApiToken(
              sharedDbAddEntryScopes,
              previewAuth
            );
            response = await requestRefs.addSharedDbEntryRef.current({
              buildId: activeBuild.id,
              topicName: payload?.topicName,
              topicId: payload?.topicId,
              data: payload?.data,
              notify: payload?.notify,
              subjectRef: payload?.subjectRef,
              token: sharedDbAddEntryToken
            });
            break;
          }

          case 'shared-db:update-entry': {
            const sharedDbUpdateEntryToken = await ensureBuildApiToken(
              ['sharedDb:write'],
              previewAuth
            );
            response = await requestRefs.updateSharedDbEntryRef.current({
              buildId: activeBuild.id,
              entryId: payload?.entryId,
              data: payload?.data,
              notify: payload?.notify,
              token: sharedDbUpdateEntryToken
            });
            break;
          }

          case 'shared-db:delete-entry': {
            const sharedDbDeleteEntryToken = await ensureBuildApiToken(
              ['sharedDb:write'],
              previewAuth
            );
            response = await requestRefs.deleteSharedDbEntryRef.current({
              buildId: activeBuild.id,
              entryId: payload?.entryId,
              token: sharedDbDeleteEntryToken
            });
            break;
          }

          case 'shared-db:claim-entry': {
            const sharedDbClaimEntryToken = await ensureBuildApiToken(
              ['sharedDb:write'],
              previewAuth
            );
            response = await requestRefs.claimSharedDbEntryRef.current({
              buildId: activeBuild.id,
              entryId: payload?.entryId,
              token: sharedDbClaimEntryToken
            });
            break;
          }

          case 'shared-db:kv-get': {
            const sharedDbKvGetToken = await ensureBuildApiToken(
              ['sharedDb:read'],
              previewAuth
            );
            response = await requestRefs.getSharedDbKvItemRef.current({
              buildId: activeBuild.id,
              namespace: payload?.namespace,
              key: payload?.key,
              token: sharedDbKvGetToken
            });
            break;
          }

          case 'shared-db:kv-list': {
            const sharedDbKvListToken = await ensureBuildApiToken(
              ['sharedDb:read'],
              previewAuth
            );
            response = await requestRefs.listSharedDbKvItemsRef.current({
              buildId: activeBuild.id,
              namespace: payload?.namespace,
              limit: payload?.limit,
              cursor: payload?.cursor,
              since: payload?.since,
              token: sharedDbKvListToken
            });
            break;
          }

          case 'shared-db:kv-set': {
            const sharedDbKvSetToken = await ensureBuildApiToken(
              ['sharedDb:write'],
              previewAuth
            );
            response = await requestRefs.setSharedDbKvItemsRef.current({
              buildId: activeBuild.id,
              namespace: payload?.namespace,
              items: payload?.items,
              token: sharedDbKvSetToken
            });
            break;
          }

          case 'shared-db:kv-delete': {
            const sharedDbKvDeleteToken = await ensureBuildApiToken(
              ['sharedDb:write'],
              previewAuth
            );
            response = await requestRefs.deleteSharedDbKvItemRef.current({
              buildId: activeBuild.id,
              namespace: payload?.namespace,
              key: payload?.key,
              token: sharedDbKvDeleteToken
            });
            break;
          }

          case 'leaderboards:get': {
            const viewer = getViewerInfo(previewAuth);
            response = await requestRefs.getBuildLeaderboardRef.current({
              buildId: activeBuild.id,
              boardKey: payload?.boardKey,
              limit: payload?.limit,
              cursor: payload?.cursor,
              guestSessionId: viewer.isGuest ? viewer.id : null
            });
            break;
          }

          case 'leaderboards:submit': {
            const viewer = getViewerInfo(previewAuth);
            response = await requestRefs.submitBuildLeaderboardScoreRef.current(
              {
                buildId: activeBuild.id,
                boardKey: payload?.boardKey,
                score: payload?.score,
                displayName: payload?.displayName,
                meta: payload?.meta,
                guestSessionId: viewer.isGuest ? viewer.id : null
              }
            );
            break;
          }

          case 'chat:list-rooms': {
            const chatReadToken = await ensureBuildApiToken(
              ['chat:read'],
              previewAuth
            );
            response = await requestRefs.listBuildChatRoomsRef.current({
              buildId: activeBuild.id,
              token: chatReadToken
            });
            break;
          }

          case 'chat:create-room': {
            const chatWriteToken = await ensureBuildApiToken(
              ['chat:write'],
              previewAuth
            );
            response = await requestRefs.createBuildChatRoomRef.current({
              buildId: activeBuild.id,
              roomKey: payload?.roomKey,
              name: payload?.name,
              token: chatWriteToken
            });
            break;
          }

          case 'chat:list-messages': {
            const chatReadToken = await ensureBuildApiToken(
              ['chat:read'],
              previewAuth
            );
            response = await requestRefs.listBuildChatMessagesRef.current({
              buildId: activeBuild.id,
              roomKey: payload?.roomKey,
              cursor: payload?.cursor,
              limit: payload?.limit,
              token: chatReadToken
            });
            break;
          }

          case 'chat:send-message': {
            const chatWriteToken = await ensureBuildApiToken(
              ['chat:write'],
              previewAuth
            );
            response = await requestRefs.sendBuildChatMessageRef.current({
              buildId: activeBuild.id,
              roomKey: payload?.roomKey,
              roomName: payload?.roomName,
              text: payload?.text,
              metadata: payload?.metadata,
              clientMessageId: payload?.clientMessageId,
              token: chatWriteToken
            });
            break;
          }

          case 'chat:delete-message': {
            const chatWriteToken = await ensureBuildApiToken(
              ['chat:write'],
              previewAuth
            );
            response =
              await requestRefs.deleteBuildRuntimeChatMessageRef.current({
                buildId: activeBuild.id,
                messageId: payload?.messageId,
                token: chatWriteToken
              });
            break;
          }

          case 'chat:subscribe': {
            await ensureBuildApiToken(['chat:read'], previewAuth);
            const roomKey = normalizeBuildRuntimeChatRoomKey(payload?.roomKey);
            const subscriptionKey = getBuildRuntimeChatSubscriptionKey(
              activeBuild.id,
              roomKey
            );
            const frames =
              chatSubscriptions.get(subscriptionKey) || new Set<Window>();
            const wasEmpty = frames.size === 0;
            frames.add(sourceWindow);
            chatSubscriptions.set(subscriptionKey, frames);
            if (wasEmpty) {
              subscribeBuildRuntimeChatRoom(activeBuild.id, roomKey);
            }
            response = { success: true };
            break;
          }

          case 'chat:unsubscribe': {
            const roomKey = normalizeBuildRuntimeChatRoomKey(payload?.roomKey);
            const subscriptionKey = getBuildRuntimeChatSubscriptionKey(
              activeBuild.id,
              roomKey
            );
            const frames = chatSubscriptions.get(subscriptionKey);
            frames?.delete(sourceWindow);
            if (!frames?.size) {
              chatSubscriptions.delete(subscriptionKey);
              unsubscribeBuildRuntimeChatRoom(activeBuild.id, roomKey);
            }
            response = { success: true };
            break;
          }

          case 'world:join': {
            const viewer = getViewerInfo(previewAuth);
            if (viewer.isLoggedIn) {
              await waitForSocketAuthReady(Number(viewer.id || 0));
            }
            response = await emitBuildRuntimeWorldRequest(
              'build_app_world_join',
              {
                buildId: activeBuild.id,
                worldKey: payload?.worldKey,
                roomKey: payload?.roomKey,
                instanceId: payload?.instanceId,
                presence: payload?.presence,
                player: {
                  ...(payload?.player || {}),
                  name: payload?.player?.name || viewer.username,
                  profilePicUrl: viewer.isLoggedIn
                    ? viewer.profilePicUrl
                    : payload?.player?.profilePicUrl
                },
                guestSessionId: viewer.isGuest ? viewer.id : null
              }
            );
            trackWorldSession({
              response,
              sourceWindow,
              buildId: activeBuild.id
            });
            break;
          }

          case 'world:update-presence': {
            response = await emitBuildRuntimeWorldRequest(
              'build_app_world_update_presence',
              {
                sessionId: payload?.sessionId,
                presence: payload?.presence
              }
            );
            break;
          }

          case 'world:send': {
            response = await emitBuildRuntimeWorldRequest(
              'build_app_world_send',
              {
                sessionId: payload?.sessionId,
                action: payload?.action
              }
            );
            break;
          }

          case 'world:heartbeat': {
            response = await emitBuildRuntimeWorldRequest(
              'build_app_world_heartbeat',
              {
                sessionId: payload?.sessionId
              }
            );
            break;
          }

          case 'world:leave': {
            response = await emitBuildRuntimeWorldRequest(
              'build_app_world_leave',
              {
                sessionId: payload?.sessionId
              }
            );
            forgetWorldSession(payload?.sessionId);
            break;
          }

          case 'private-db:get': {
            const privateDbReadToken = await ensureBuildApiToken(
              ['privateDb:read'],
              previewAuth
            );
            response = await requestRefs.getPrivateDbItemRef.current({
              buildId: activeBuild.id,
              key: payload?.key,
              token: privateDbReadToken
            });
            break;
          }

          case 'private-db:list': {
            const privateDbListToken = await ensureBuildApiToken(
              ['privateDb:read'],
              previewAuth
            );
            response = await requestRefs.listPrivateDbItemsRef.current({
              buildId: activeBuild.id,
              prefix: payload?.prefix,
              limit: payload?.limit,
              cursor: payload?.cursor,
              token: privateDbListToken
            });
            break;
          }

          case 'private-db:set': {
            const privateDbWriteToken = await ensureBuildApiToken(
              ['privateDb:write'],
              previewAuth
            );
            response = await requestRefs.setPrivateDbItemRef.current({
              buildId: activeBuild.id,
              key: payload?.key,
              value: payload?.value,
              token: privateDbWriteToken
            });
            break;
          }

          case 'private-db:remove': {
            const privateDbDeleteToken = await ensureBuildApiToken(
              ['privateDb:write'],
              previewAuth
            );
            response = await requestRefs.deletePrivateDbItemRef.current({
              buildId: activeBuild.id,
              key: payload?.key,
              token: privateDbDeleteToken
            });
            break;
          }

          case 'reminders:list': {
            const remindersReadToken = await ensureBuildApiToken(
              ['reminders:read'],
              previewAuth
            );
            response = await requestRefs.listBuildRemindersRef.current({
              buildId: activeBuild.id,
              includeDisabled: payload?.includeDisabled,
              limit: payload?.limit,
              token: remindersReadToken
            });
            break;
          }

          case 'reminders:create': {
            const remindersWriteToken = await ensureBuildApiToken(
              ['reminders:write'],
              previewAuth
            );
            response = await requestRefs.createBuildReminderRef.current({
              buildId: activeBuild.id,
              title: payload?.title,
              body: payload?.body,
              targetPath: payload?.targetPath,
              payload: payload?.payload,
              schedule: payload?.schedule,
              isEnabled: payload?.isEnabled,
              token: remindersWriteToken
            });
            break;
          }

          case 'reminders:update': {
            const remindersUpdateToken = await ensureBuildApiToken(
              ['reminders:write'],
              previewAuth
            );
            response = await requestRefs.updateBuildReminderRef.current({
              buildId: activeBuild.id,
              reminderId: payload?.reminderId,
              title: payload?.title,
              body: payload?.body,
              targetPath: payload?.targetPath,
              payload: payload?.payload,
              schedule: payload?.schedule,
              isEnabled: payload?.isEnabled,
              token: remindersUpdateToken
            });
            break;
          }

          case 'reminders:remove': {
            const remindersDeleteToken = await ensureBuildApiToken(
              ['reminders:write'],
              previewAuth
            );
            response = await requestRefs.deleteBuildReminderRef.current({
              buildId: activeBuild.id,
              reminderId: payload?.reminderId,
              token: remindersDeleteToken
            });
            break;
          }

          case 'reminders:get-due': {
            const remindersDueToken = await ensureBuildApiToken(
              ['reminders:read'],
              previewAuth
            );
            response = await requestRefs.getDueBuildRemindersRef.current({
              buildId: activeBuild.id,
              now: payload?.now,
              autoAcknowledge: payload?.autoAcknowledge,
              limit: payload?.limit,
              token: remindersDueToken
            });
            break;
          }

          case 'notifications:get-subject-update-subscription': {
            const notificationsReadToken = await ensureBuildApiToken(
              ['notifications:read'],
              previewAuth
            );
            response =
              await requestRefs.getBuildSubjectUpdateSubscriptionRef.current({
                buildId: activeBuild.id,
                subjectId: payload?.subjectId,
                token: notificationsReadToken
              });
            break;
          }

          case 'notifications:get-subscription': {
            const notificationsReadToken = await ensureBuildApiToken(
              ['notifications:read'],
              previewAuth
            );
            response =
              await requestRefs.getBuildNotificationSubscriptionRef.current({
                buildId: activeBuild.id,
                channelKey: payload?.channelKey,
                targetKey: payload?.targetKey,
                token: notificationsReadToken
              });
            break;
          }

          case 'notifications:subscribe': {
            const notificationsWriteToken = await ensureBuildApiToken(
              ['notifications:write'],
              previewAuth
            );
            response =
              await requestRefs.subscribeToBuildNotificationsRef.current({
                buildId: activeBuild.id,
                channelKey: payload?.channelKey,
                targetKey: payload?.targetKey,
                launchTarget: payload?.launchTarget,
                token: notificationsWriteToken
              });
            break;
          }

          case 'notifications:unsubscribe': {
            const notificationsWriteToken = await ensureBuildApiToken(
              ['notifications:write'],
              previewAuth
            );
            response =
              await requestRefs.unsubscribeFromBuildNotificationsRef.current({
                buildId: activeBuild.id,
                channelKey: payload?.channelKey,
                targetKey: payload?.targetKey,
                token: notificationsWriteToken
              });
            break;
          }

          case 'notifications:subscribe-many': {
            const notificationsWriteToken = await ensureBuildApiToken(
              ['notifications:write'],
              previewAuth
            );
            response =
              await requestRefs.subscribeToBuildNotificationsBatchRef.current({
                buildId: activeBuild.id,
                subscriptions: payload?.subscriptions,
                token: notificationsWriteToken
              });
            break;
          }

          case 'notifications:unsubscribe-many': {
            const notificationsWriteToken = await ensureBuildApiToken(
              ['notifications:write'],
              previewAuth
            );
            response =
              await requestRefs.unsubscribeFromBuildNotificationsBatchRef.current(
                {
                  buildId: activeBuild.id,
                  subscriptions: payload?.subscriptions,
                  token: notificationsWriteToken
                }
              );
            break;
          }

          case 'notifications:notify-subscribers': {
            const notificationsEmitToken = await ensureBuildApiToken(
              ['notifications:emit'],
              previewAuth
            );
            response = await requestRefs.notifyBuildSubscribersRef.current({
              buildId: activeBuild.id,
              channelKey: payload?.channelKey,
              targetKey: payload?.targetKey,
              eventKey: payload?.eventKey,
              label: payload?.label,
              title: payload?.title,
              summary: payload?.summary,
              body: payload?.body,
              launchTarget: payload?.launchTarget,
              payload: payload?.payload,
              token: notificationsEmitToken
            });
            break;
          }

          case 'notifications:subscribe-subject-updates': {
            const notificationsWriteToken = await ensureBuildApiToken(
              ['notifications:write'],
              previewAuth
            );
            response =
              await requestRefs.subscribeToBuildSubjectUpdatesRef.current({
                buildId: activeBuild.id,
                subjectId: payload?.subjectId,
                target: payload?.target,
                token: notificationsWriteToken
              });
            break;
          }

          case 'notifications:unsubscribe-subject-updates': {
            const notificationsWriteToken = await ensureBuildApiToken(
              ['notifications:write'],
              previewAuth
            );
            response =
              await requestRefs.unsubscribeFromBuildSubjectUpdatesRef.current({
                buildId: activeBuild.id,
                subjectId: payload?.subjectId,
                token: notificationsWriteToken
              });
            break;
          }

          default:
            throw new Error(`Unknown request type: ${type}`);
        }

        const iframeResponse = sanitizeBuildAppAiUsagePolicyPayload(response);
        sourceWindow.postMessage(
          {
            source: 'twinkle-parent',
            id,
            previewNonce: previewMessageNonce,
            payload: iframeResponse
          },
          previewMessageTargetOrigin
        );
        if (pendingHostNavigationUrl) {
          window.setTimeout(() => {
            navigateHostContentRef.current(pendingHostNavigationUrl);
          }, 0);
        }
      } catch (error: any) {
        if (error?.aiUsagePolicy && typeof error.aiUsagePolicy === 'object') {
          onAiUsagePolicyUpdateRef.current?.(error.aiUsagePolicy);
        }
        if (type === 'world:join' && !error?.reachedServer) {
          // Only count failures that never reached the backend (auth wait
          // timeout, socket disconnected/not-ready, no ack). Server-acked
          // rejections are excluded — the backend already logged those as join
          // rows, so emitting a bridge row would double-count them.
          emitWorldBridgeTelemetry({
            buildId: previewAuth.buildRef.current?.id ?? null,
            worldKey: payload?.worldKey,
            roomKey: payload?.roomKey,
            instanceId: payload?.instanceId,
            outcome: 'error',
            stage: 'handler',
            messageType: 'world:join',
            errorCode: getPreviewBridgeErrorCode(error),
            message: error?.message
          });
        }
        const rawErrorDetails =
          error && typeof error === 'object'
            ? {
                ...(typeof error.status === 'number'
                  ? { status: error.status }
                  : {}),
                ...(typeof error.code === 'string' ? { code: error.code } : {}),
                ...(error.retryAfterSeconds != null
                  ? { retryAfterSeconds: error.retryAfterSeconds }
                  : {}),
                ...(error.writeStatus
                  ? { writeStatus: error.writeStatus }
                  : {}),
                ...(error.aiUsagePolicy
                  ? { aiUsagePolicy: error.aiUsagePolicy }
                  : {}),
                ...(error.details && typeof error.details === 'object'
                  ? error.details
                  : {})
              }
            : null;
        const errorDetails = sanitizeBuildAppAiUsagePolicyPayload(
          rawErrorDetails
        );
        sourceWindow.postMessage(
          {
            source: 'twinkle-parent',
            id,
            previewNonce: previewMessageNonce,
            error: error.message || 'Unknown error',
            errorCode: getPreviewBridgeErrorCode(error),
            ...(errorDetails && Object.keys(errorDetails).length > 0
              ? { errorDetails }
              : {})
          },
          previewMessageTargetOrigin
        );
      }
    }

    window.addEventListener('message', handleMessage);
    window.addEventListener(
      TWINKLE_SOCKET_AUTH_READY_EVENT,
      handleSocketAuthReady
    );
    socket.on('build_app_chat_event', handleBuildRuntimeChatEvent);
    socket.on('build_app_world_event', handleBuildRuntimeWorldEvent);
    socket.on('disconnect', handleBuildRuntimeWorldSocketDisconnect);
    socket.on(
      'image_generation_status_received',
      handleAiImageGenerationStatus
    );
    return () => {
      window.clearTimeout(appMcpPollTimer);
      if (appMcpRuntime) appMcpRuntime.stopped = true;
      window.removeEventListener('message', handleMessage);
      window.removeEventListener(
        TWINKLE_SOCKET_AUTH_READY_EVENT,
        handleSocketAuthReady
      );
      socket.off('build_app_chat_event', handleBuildRuntimeChatEvent);
      socket.off('build_app_world_event', handleBuildRuntimeWorldEvent);
      socket.off('disconnect', handleBuildRuntimeWorldSocketDisconnect);
      socket.off(
        'image_generation_status_received',
        handleAiImageGenerationStatus
      );
      for (const subscriptionKey of chatSubscriptions.keys()) {
        const [rawBuildId, ...roomKeyParts] = subscriptionKey.split(':');
        const subscribedBuildId = Number(rawBuildId);
        const subscribedRoomKey = roomKeyParts.join(':');
        if (!subscribedBuildId || !subscribedRoomKey) continue;
        unsubscribeBuildRuntimeChatRoom(subscribedBuildId, subscribedRoomKey);
      }
      chatSubscriptions.clear();
      for (const target of activeAiImageStatusTargets.values()) {
        if (target.completionFallbackTimer) {
          window.clearTimeout(target.completionFallbackTimer);
        }
      }
      activeAiImageStatusTargets.clear();
      leaveAllWorldSessions();
      if (resetWorldSessionsRef.current) {
        resetWorldSessionsRef.current = null;
      }
      if (onPreviewFrameRetiredRef.current === handlePreviewFrameRetired) {
        onPreviewFrameRetiredRef.current = null;
      }
      disposeBuildChessEngine();
    };
  }, [
    appMcpSessionId,
    buildId,
    capabilitySnapshotRef,
    contentNavigationConfirmationController,
    imageGenerationController,
    messageTargetFrameRef,
    navigateHostContentRef,
    navigatePreviewFrameRef,
    previewAuth,
    previewCodeSignatureRef,
    previewFrameMetaRef,
    previewFrameSourcesRef,
    previewTransitioningRef,
    onPreviewFrameRetiredRef,
    primaryIframeRef,
    requestRefs,
    runtimeUploadsSyncRef,
    onAiUsagePolicyUpdateRef,
    requestBuildImageGenerationConfirmationRef,
    requestOpenContentConfirmationRef,
    runtimeExplorationPlanRef,
    runtimeOnly,
    secondaryIframeRef,
    setRuntimeObservationState,
    userId
  ]);
}
