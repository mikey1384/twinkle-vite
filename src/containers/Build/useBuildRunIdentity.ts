import { useRef } from 'react';

export type BuildRunMode = 'user' | 'greeting' | 'runtime-autofix';

export interface SharedBuildRunIdentitySource {
  requestId?: string | null;
  generating?: boolean | null;
  runMode?: BuildRunMode | null;
  userMessage?: { id?: number | null } | null;
  assistantMessage?: { id?: number | null } | null;
}

export interface SharedBuildRunIdentityState {
  requestId: string;
  generating: boolean;
  runMode: BuildRunMode;
  userMessageId: number | null;
  assistantMessageId: number | null;
}

interface BuildRunIdentityApi {
  beginRun(options: {
    requestId: string;
    runMode: BuildRunMode;
    userMessageId?: number | null;
    assistantMessageId?: number | null;
    messageContext?: string | null;
  }): void;
  clearRunOwnership(): void;
  resetRunMode(): void;
  setAssistantMessageId(messageId?: number | null): void;
  adoptMessageIds(options: {
    userMessageId?: number | null;
    assistantMessageId?: number | null;
  }): void;
  getMessageContext(): string | null;
  getCurrentActiveRunRequestId(
    sharedRunState?: SharedBuildRunIdentityState | null,
    hasCurrentPageRunActivity?: boolean
  ): string;
  getCurrentRunRequestId(
    requestId?: string | null,
    sharedRunState?: SharedBuildRunIdentityState | null,
    hasCurrentPageRunActivity?: boolean
  ): string;
  getCurrentRunMode(
    requestId?: string | null,
    sharedRunState?: SharedBuildRunIdentityState | null
  ): BuildRunMode;
  getCurrentActiveUserMessageId(
    requestId?: string | null,
    sharedRunState?: SharedBuildRunIdentityState | null,
    hasCurrentPageRunActivity?: boolean
  ): number | null;
  getCurrentActiveAssistantMessageId(
    requestId?: string | null,
    sharedRunState?: SharedBuildRunIdentityState | null,
    hasCurrentPageRunActivity?: boolean
  ): number | null;
}

function getSharedRunMatchingRequest(
  requestId?: string | null,
  sharedRunState?: SharedBuildRunIdentityState | null
) {
  if (!sharedRunState) return null;
  const sharedRequestId = String(sharedRunState.requestId || '').trim();
  if (!sharedRequestId) return null;
  const normalizedRequestId = String(requestId || '').trim();
  if (normalizedRequestId) {
    return sharedRequestId === normalizedRequestId ? sharedRunState : null;
  }
  return sharedRunState.generating ? sharedRunState : null;
}

function normalizeMessageId(messageId?: number | null) {
  const normalizedMessageId = Number(messageId || 0);
  return normalizedMessageId > 0 ? normalizedMessageId : null;
}

function normalizeMessageContext(messageContext?: string | null) {
  const normalizedMessageContext = String(messageContext || '').trim();
  return normalizedMessageContext || null;
}

export function getSharedBuildRunIdentityState(
  buildRun: SharedBuildRunIdentitySource | null | undefined
): SharedBuildRunIdentityState | null {
  const requestId = String(buildRun?.requestId || '').trim();
  if (!requestId) {
    return null;
  }
  return {
    requestId,
    generating: Boolean(buildRun?.generating),
    runMode: buildRun?.runMode || 'user',
    userMessageId: normalizeMessageId(buildRun?.userMessage?.id),
    assistantMessageId: normalizeMessageId(buildRun?.assistantMessage?.id)
  };
}

export default function useBuildRunIdentity(): BuildRunIdentityApi {
  const requestIdRef = useRef<string | null>(null);
  const userMessageIdRef = useRef<number | null>(null);
  const assistantMessageIdRef = useRef<number | null>(null);
  const runModeRef = useRef<BuildRunMode>('user');
  const messageContextRef = useRef<string | null>(null);
  const apiRef = useRef<BuildRunIdentityApi | null>(null);

  if (!apiRef.current) {
    apiRef.current = {
      beginRun({
        requestId,
        runMode,
        userMessageId,
        assistantMessageId,
        messageContext
      }) {
        requestIdRef.current = String(requestId || '').trim() || null;
        runModeRef.current = runMode || 'user';
        userMessageIdRef.current = normalizeMessageId(userMessageId);
        assistantMessageIdRef.current = normalizeMessageId(assistantMessageId);
        messageContextRef.current = normalizeMessageContext(messageContext);
      },

      clearRunOwnership() {
        requestIdRef.current = null;
        userMessageIdRef.current = null;
        assistantMessageIdRef.current = null;
        messageContextRef.current = null;
      },

      resetRunMode() {
        runModeRef.current = 'user';
      },

      setAssistantMessageId(messageId?: number | null) {
        assistantMessageIdRef.current = normalizeMessageId(messageId);
      },

      adoptMessageIds({ userMessageId, assistantMessageId }) {
        userMessageIdRef.current = normalizeMessageId(userMessageId);
        assistantMessageIdRef.current = normalizeMessageId(assistantMessageId);
      },

      getMessageContext() {
        return messageContextRef.current;
      },

      getCurrentActiveRunRequestId(
        sharedRunState,
        hasCurrentPageRunActivity = false
      ) {
        const sharedRequestId = String(
          getSharedRunMatchingRequest(undefined, sharedRunState)?.requestId || ''
        ).trim();
        if (sharedRequestId) {
          return sharedRequestId;
        }
        if (!hasCurrentPageRunActivity) {
          return '';
        }
        return String(requestIdRef.current || '').trim();
      },

      getCurrentRunRequestId(
        requestId,
        sharedRunState,
        hasCurrentPageRunActivity = false
      ) {
        const normalizedRequestId = String(requestId || '').trim();
        const sharedRequestId = String(
          getSharedRunMatchingRequest(normalizedRequestId, sharedRunState)
            ?.requestId || ''
        ).trim();
        if (sharedRequestId) {
          return sharedRequestId;
        }
        const localRequestId = String(requestIdRef.current || '').trim();
        if (!localRequestId) {
          return '';
        }
        if (normalizedRequestId) {
          return localRequestId === normalizedRequestId ? localRequestId : '';
        }
        if (!hasCurrentPageRunActivity) {
          return '';
        }
        return localRequestId;
      },

      getCurrentRunMode(requestId, sharedRunState) {
        return (
          getSharedRunMatchingRequest(requestId, sharedRunState)?.runMode ||
          runModeRef.current
        );
      },

      getCurrentActiveUserMessageId(
        requestId,
        sharedRunState,
        hasCurrentPageRunActivity = false
      ) {
        const sharedUserMessageId = Number(
          getSharedRunMatchingRequest(requestId, sharedRunState)?.userMessageId ||
            0
        );
        if (sharedUserMessageId > 0) {
          return sharedUserMessageId;
        }
        const normalizedRequestId = String(requestId || '').trim();
        if (
          normalizedRequestId &&
          apiRef.current?.getCurrentRunRequestId(
            normalizedRequestId,
            sharedRunState,
            hasCurrentPageRunActivity
          ) !== normalizedRequestId
        ) {
          return null;
        }
        return userMessageIdRef.current;
      },

      getCurrentActiveAssistantMessageId(
        requestId,
        sharedRunState,
        hasCurrentPageRunActivity = false
      ) {
        const sharedAssistantMessageId = Number(
          getSharedRunMatchingRequest(requestId, sharedRunState)
            ?.assistantMessageId || 0
        );
        if (sharedAssistantMessageId > 0) {
          return sharedAssistantMessageId;
        }
        const normalizedRequestId = String(requestId || '').trim();
        if (
          normalizedRequestId &&
          apiRef.current?.getCurrentRunRequestId(
            normalizedRequestId,
            sharedRunState,
            hasCurrentPageRunActivity
          ) !== normalizedRequestId
        ) {
          return null;
        }
        return assistantMessageIdRef.current;
      }
    };
  }

  return apiRef.current!;
}
