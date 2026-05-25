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
import type { PreviewMountContext } from '../types';
import { triggerPreviewLocalDownload } from '../helpers/previewDownloads';
import { TWINKLE_SOCKET_AUTH_READY_EVENT } from '~/constants/socketEvents';
import {
  getBuildPreviewMessageTargetOrigin,
  isAllowedBuildPreviewMessageOrigin
} from '~/helpers/buildPreviewOriginHelpers';
import {
  disposeBuildChessEngine,
  evaluateBuildChessPosition
} from '../helpers/chessEngine';
import { waitForSocketAuthReady } from '~/helpers/socketAuthReady';

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

export function useHostBridge({
  runtimeOnly,
  buildId,
  buildIsPublic,
  isOwner,
  userId,
  username,
  profilePicUrl,
  resolvedCapabilitySnapshot,
  resolvedRuntimeExplorationPlan,
  mountContext,
  launchTarget,
  capabilitySnapshotRef,
  runtimeExplorationPlanRef,
  messageTargetFrameRef,
  previewCodeSignatureRef,
  previewFrameMetaRef,
  previewFrameSourcesRef,
  previewTransitioningRef,
  onPreviewFrameRetiredRef,
  primaryIframeRef,
  secondaryIframeRef,
  setRuntimeObservationState,
  previewAuth,
  requestRefs,
  runtimeUploadsSyncRef,
  onAiUsagePolicyUpdateRef
}: UsePreviewHostBridgeArgs) {
  const mountContextRef = useRef<PreviewMountContext | null>(mountContext);
  const launchTargetRef = useRef<Record<string, any> | null>(launchTarget);
  const launchTargetBroadcastReadyRef = useRef(false);
  const resetWorldSessionsRef = useRef<((reason: string) => void) | null>(null);
  const worldViewerIdentityKeyRef = useRef<string | null>(null);
  mountContextRef.current = mountContext;
  launchTargetRef.current = launchTarget;

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
    const activeAiImageStatusTargets = new Map<
      string,
      {
        requestId: string;
        sourceWindow: Window;
        statusCount: number;
        terminalStatusForwarded: boolean;
      }
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
          reject(new Error('Socket is not connected'));
          return;
        }
        if (useReliableEmit && !isBuildRuntimeWorldSocketWritable()) {
          reject(new Error('Socket transport is not ready'));
          return;
        }
        let settled = false;
        const timeout = window.setTimeout(() => {
          if (settled) return;
          settled = true;
          reject(new Error('World request timed out'));
        }, timeoutMs);
        const emitter = useReliableEmit ? socket : socket.volatile;
        emitter.emit(eventName, payload, (response: any) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeout);
          if (!response?.ok) {
            reject(new Error(response?.error || 'World request failed'));
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
      for (const [sessionId, session] of Array.from(activeWorldSessions)) {
        if (session.sourceWindow !== sourceWindow) continue;
        socket.emit('build_app_world_leave', { sessionId });
        activeWorldSessions.delete(sessionId);
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

    function handleAiImageGenerationStatus(payload: any) {
      let appliedAiUsagePolicy = false;
      for (const target of activeAiImageStatusTargets.values()) {
        const payloadRequestId = String(payload?.requestId || '').trim();
        if (!payloadRequestId || payloadRequestId !== target.requestId) {
          continue;
        }
        if (
          !appliedAiUsagePolicy &&
          payload?.aiUsagePolicy &&
          typeof payload.aiUsagePolicy === 'object'
        ) {
          appliedAiUsagePolicy = true;
          onAiUsagePolicyUpdateRef.current?.(payload.aiUsagePolicy);
        }
        target.statusCount += 1;
        const stage = String(payload?.stage || '').trim();
        if (stage === 'completed' || stage === 'error') {
          target.terminalStatusForwarded = true;
        }
        const targetWindow = target.sourceWindow;
        const targetBridge = getMessageTargetBridgeForWindow(targetWindow);
        try {
          targetWindow.postMessage(
            {
              source: 'twinkle-parent',
              type: 'ai:image-generation-status',
              previewNonce: targetBridge.previewNonce,
              payload
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
      target: {
        requestId: string;
        sourceWindow: Window;
        statusCount: number;
        terminalStatusForwarded: boolean;
      };
      response: any;
    }) {
      if (target.terminalStatusForwarded) return;
      const terminalStatus = buildTerminalAiImageStatusFromResponse({
        response,
        requestId: target.requestId
      });
      if (!terminalStatus) return;
      handleAiImageGenerationStatus(terminalStatus);
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
        return {
          targetOrigin: getBuildPreviewMessageTargetOrigin(
            previewFrameSourcesRef.current.primary ||
              primaryIframeRef.current?.getAttribute('src') ||
              primaryIframeRef.current?.src
          ),
          previewNonce: previewFrameMetaRef.current.primary.messageNonce
        };
      }

      const secondaryWindow = secondaryIframeRef.current?.contentWindow || null;
      if (secondaryWindow && targetWindow === secondaryWindow) {
        return {
          targetOrigin: getBuildPreviewMessageTargetOrigin(
            previewFrameSourcesRef.current.secondary ||
              secondaryIframeRef.current?.getAttribute('src') ||
              secondaryIframeRef.current?.src
          ),
          previewNonce: previewFrameMetaRef.current.secondary.messageNonce
        };
      }

      return { targetOrigin: '*', previewNonce: null };
    }

    function forwardAiChatStreamEventToFrame({
      sourceWindow,
      requestId,
      event
    }: {
      sourceWindow: Window;
      requestId: string;
      event: any;
    }) {
      if (event?.aiUsagePolicy && typeof event.aiUsagePolicy === 'object') {
        onAiUsagePolicyUpdateRef.current?.(event.aiUsagePolicy);
      }
      const targetBridge = getMessageTargetBridgeForWindow(sourceWindow);
      sourceWindow.postMessage(
        {
          source: 'twinkle-parent',
          type: 'ai:chat-status',
          previewNonce: targetBridge.previewNonce,
          payload: {
            requestId,
            ...(event || {})
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
      if (
        !sourceFrameMeta.messageNonce ||
        previewNonce !== sourceFrameMeta.messageNonce
      ) {
        return;
      }
      const sourcePreviewSrc =
        previewFrameSourcesRef.current[sourceFrame] ||
        (sourceFrame === 'primary'
          ? primaryIframeRef.current?.getAttribute('src') ||
            primaryIframeRef.current?.src
          : secondaryIframeRef.current?.getAttribute('src') ||
            secondaryIframeRef.current?.src);
      if (
        !isAllowedBuildPreviewMessageOrigin({
          eventOrigin: event.origin,
          previewSrc: sourcePreviewSrc
        })
      ) {
        return;
      }
      const previewMessageTargetOrigin =
        getBuildPreviewMessageTargetOrigin(sourcePreviewSrc);
      const previewMessageNonce = sourceFrameMeta.messageNonce;
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
                'Preview is updating. This request was skipped to prevent duplicate side effects.'
            },
            previewMessageTargetOrigin
          );
          return;
        }
      }

      try {
        let response: any = {};

        switch (type) {
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
                  onEvent: (streamEvent: any) => {
                    forwardAiChatStreamEventToFrame({
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
                systemPrompt: payload.systemPrompt
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
              instructions: payload.instructions,
              systemPrompt: payload.systemPrompt
            });
            if (
              response?.aiUsagePolicy &&
              typeof response.aiUsagePolicy === 'object'
            ) {
              onAiUsagePolicyUpdateRef.current?.(response.aiUsagePolicy);
            }
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
                    onEvent: (streamEvent: any) => {
                      forwardAiChatStreamEventToFrame({
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
                  includeWebsiteContext: payload.includeWebsiteContext
                });
            }
            if (
              response?.aiUsagePolicy &&
              typeof response.aiUsagePolicy === 'object'
            ) {
              onAiUsagePolicyUpdateRef.current?.(response.aiUsagePolicy);
            }
            break;

          case 'ai:generate-image':
            if (!previewAuth.userIdRef.current) {
              triggerGuestRestriction(previewAuth);
            }
            activeAiImageStatusTargets.set(id, {
              requestId: String(payload?.requestId || id),
              sourceWindow,
              statusCount: 0,
              terminalStatusForwarded: false
            });
            const aiImageStatusTarget = activeAiImageStatusTargets.get(id);
            try {
              await ensureAiImageNotificationChannel();
              response = await requestRefs.generateAiImageRef.current({
                prompt: payload?.prompt,
                previousImageId: payload?.previousImageId,
                previousResponseId: payload?.previousResponseId,
                referenceImageB64: payload?.referenceImageB64,
                engine: payload?.engine || 'openai',
                quality: payload?.quality || 'high',
                requestId: payload?.requestId || id
              });
              if (
                response?.aiUsagePolicy &&
                typeof response.aiUsagePolicy === 'object'
              ) {
                onAiUsagePolicyUpdateRef.current?.(response.aiUsagePolicy);
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
              activeAiImageStatusTargets.delete(id);
            }
            break;

          case 'viewer:get':
            response = { viewer: getViewerInfo(previewAuth) };
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

          case 'content:ai-stories:list': {
            const contentAiStoriesToken = await ensureBuildApiToken(
              ['content:read'],
              previewAuth
            );
            response = await requestRefs.listBuildAiStoriesRef.current({
              buildId: activeBuild.id,
              limit: payload?.limit,
              cursor: payload?.cursor,
              difficulty: payload?.difficulty,
              type: payload?.type,
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
              difficulty: payload?.difficulty,
              type: payload?.type,
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
            const sharedDbAddEntryToken = await ensureBuildApiToken(
              ['sharedDb:write'],
              previewAuth
            );
            response = await requestRefs.addSharedDbEntryRef.current({
              buildId: activeBuild.id,
              topicName: payload?.topicName,
              topicId: payload?.topicId,
              data: payload?.data,
              notify: payload?.notify,
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
                  profilePicUrl:
                    payload?.player?.profilePicUrl || viewer.profilePicUrl
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

        sourceWindow.postMessage(
          {
            source: 'twinkle-parent',
            id,
            previewNonce: previewMessageNonce,
            payload: response
          },
          previewMessageTargetOrigin
        );
      } catch (error: any) {
        if (error?.aiUsagePolicy && typeof error.aiUsagePolicy === 'object') {
          onAiUsagePolicyUpdateRef.current?.(error.aiUsagePolicy);
        }
        sourceWindow.postMessage(
          {
            source: 'twinkle-parent',
            id,
            previewNonce: previewMessageNonce,
            error: error.message || 'Unknown error'
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
    buildId,
    capabilitySnapshotRef,
    messageTargetFrameRef,
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
    runtimeExplorationPlanRef,
    runtimeOnly,
    secondaryIframeRef,
    setRuntimeObservationState
  ]);
}
