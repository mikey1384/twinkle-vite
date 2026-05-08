import type { RefObject } from 'react';
import type {
  PreviewFrameMeta,
  PreviewRuntimeUploadsSyncPayload
} from './types';
import {
  getBuildPreviewMessageTargetOrigin
} from '../previewOrigin';
import {
  ensureBuildApiToken,
  type PreviewHostBridgeAuth
} from './previewBridgeAuth';
import type {
  PreviewHostBridgeRequestRefs
} from './previewBridgeRequestRefs';

export function postToPreviewFrames(
  primaryIframeRef: RefObject<HTMLIFrameElement | null>,
  secondaryIframeRef: RefObject<HTMLIFrameElement | null>,
  previewFrameMetaRef: RefObject<{
    primary: PreviewFrameMeta;
    secondary: PreviewFrameMeta;
  }>,
  message: Record<string, any>
) {
  const previewFrames = [
    { frame: 'primary' as const, element: primaryIframeRef.current },
    { frame: 'secondary' as const, element: secondaryIframeRef.current }
  ];

  for (const targetFrame of previewFrames) {
    const targetWindow = targetFrame.element?.contentWindow;
    if (!targetFrame.element || !targetWindow) continue;
    targetWindow.postMessage(
      {
        ...message,
        previewNonce:
          previewFrameMetaRef.current[targetFrame.frame].messageNonce
      },
      getBuildPreviewMessageTargetOrigin(
        targetFrame.element.getAttribute('src') || targetFrame.element.src
      )
    );
  }
}

export async function syncPreviewRuntimeUploadsState({
  buildId,
  previewAuth,
  requestRefs,
  runtimeUploadsSyncRef
}: {
  buildId: number;
  previewAuth: PreviewHostBridgeAuth;
  requestRefs: PreviewHostBridgeRequestRefs;
  runtimeUploadsSyncRef: RefObject<
    ((payload: PreviewRuntimeUploadsSyncPayload | null) => void) | null
  >;
}) {
  if (!runtimeUploadsSyncRef.current || !Number.isFinite(buildId) || buildId <= 0) {
    return;
  }
  const filesReadToken = await ensureBuildApiToken(['files:read'], previewAuth);
  const payload = await requestRefs.listBuildRuntimeFilesRef.current({
    buildId,
    limit: 30,
    token: filesReadToken
  });
  runtimeUploadsSyncRef.current?.(payload || null);
}

export function normalizeBuildRuntimeChatRoomKey(value: unknown) {
  const roomKey = String(value || '').trim();
  if (!roomKey) {
    throw new Error('roomKey is required');
  }
  return roomKey;
}

export function getBuildRuntimeChatSubscriptionKey(
  buildId: number,
  roomKey: string
) {
  return `${Number(buildId)}:${roomKey}`;
}

export function postBuildRuntimeChatEventToFrames({
  subscriptions,
  payload,
  getTargetBridge
}: {
  subscriptions: Map<string, Set<Window>>;
  payload: any;
  getTargetBridge: (targetWindow: Window) => {
    targetOrigin: string;
    previewNonce: string | null;
  };
}) {
  const buildId = Number(payload?.buildId || 0);
  const roomKey = String(payload?.roomKey || '').trim();
  if (!buildId || !roomKey) return;

  const frames = subscriptions.get(
    getBuildRuntimeChatSubscriptionKey(buildId, roomKey)
  );
  if (!frames?.size) return;

  for (const targetWindow of Array.from(frames)) {
    const targetBridge = getTargetBridge(targetWindow);
    targetWindow.postMessage(
      {
        source: 'twinkle-parent',
        type: 'chat:event',
        payload,
        previewNonce: targetBridge.previewNonce
      },
      targetBridge.targetOrigin
    );
  }
}
