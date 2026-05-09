import { TWINKLE_SOCKET_AUTH_READY_EVENT } from '~/constants/socketEvents';
import { socket } from '~/constants/sockets/api';

interface SocketAuthReadyState {
  socketId: string | null;
  userId: number | null;
  readyAt: number | null;
}

const SOCKET_AUTH_READY_TIMEOUT_MS = 5000;

let socketAuthReadyState: SocketAuthReadyState = {
  socketId: null,
  userId: null,
  readyAt: null
};

function normalizeSocketAuthUserId(userId: number | null | undefined) {
  const normalizedUserId = Number(userId || 0);
  return Number.isFinite(normalizedUserId) && normalizedUserId > 0
    ? normalizedUserId
    : null;
}

export function markSocketAuthReady(userId?: number | null) {
  const normalizedUserId = normalizeSocketAuthUserId(userId);
  if (!normalizedUserId) return;
  socketAuthReadyState = {
    socketId: socket.id || null,
    userId: normalizedUserId,
    readyAt: Date.now()
  };
  window.dispatchEvent(
    new CustomEvent(TWINKLE_SOCKET_AUTH_READY_EVENT, {
      detail: {
        socketId: socket.id,
        userId: normalizedUserId
      }
    })
  );
}

export function clearSocketAuthReady() {
  socketAuthReadyState = {
    socketId: null,
    userId: null,
    readyAt: null
  };
}

export function isSocketAuthReadyForUser(userId?: number | null) {
  const normalizedUserId = normalizeSocketAuthUserId(userId);
  if (!normalizedUserId || !socket.connected || !socket.id) return false;
  return (
    socketAuthReadyState.socketId === socket.id &&
    socketAuthReadyState.userId === normalizedUserId
  );
}

export function waitForSocketAuthReady(
  userId?: number | null,
  timeoutMs = SOCKET_AUTH_READY_TIMEOUT_MS
) {
  const normalizedUserId = normalizeSocketAuthUserId(userId);
  if (!normalizedUserId || isSocketAuthReadyForUser(normalizedUserId)) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    let settled = false;
    const timeout = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      window.removeEventListener(
        TWINKLE_SOCKET_AUTH_READY_EVENT,
        handleSocketAuthReady
      );
      reject(new Error('Socket authentication was not ready'));
    }, timeoutMs);

    function handleSocketAuthReady(event: Event) {
      const detail = (event as CustomEvent).detail || {};
      if (
        Number(detail.userId || 0) !== normalizedUserId ||
        (detail.socketId && detail.socketId !== socket.id)
      ) {
        return;
      }
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      window.removeEventListener(
        TWINKLE_SOCKET_AUTH_READY_EVENT,
        handleSocketAuthReady
      );
      resolve();
    }

    window.addEventListener(
      TWINKLE_SOCKET_AUTH_READY_EVENT,
      handleSocketAuthReady
    );
  });
}
