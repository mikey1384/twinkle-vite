// One shared beat for the page's small periodic network work.
//
// The server pings the socket every 25 s and the client must answer at once.
// A phone on cellular pays for every separate send: the radio stays in its
// high-power state for about ten seconds after each packet. Presence
// heartbeats, status polls and trace uploads on their own timers therefore
// kept the radio up for most of an idle minute (measured 11-23: 79-83% of an
// idle Home page, against 40% for the ping alone). Work that subscribes here
// runs in the same tick as the ping answer, so it shares that one radio wake.
//
// The same beat tells a live link from a dead one. The server allows a silent
// socket 45 minutes before it gives up (a locked phone must not lose its
// session), so the client's own ping timeout never fires in practice and a
// link that died without a close (carrier NAT, a tunnel, a cell handover)
// looked connected indefinitely. Two missed pings on a page that stayed
// visible the whole time mean the link is gone.

export const SOCKET_PING_INTERVAL_MS = 25_000;
export const SOCKET_DEAD_LINK_AFTER_MS = 2 * SOCKET_PING_INTERVAL_MS + 10_000;

export interface SocketKeepalive {
  // The transport connected: start expecting pings.
  connected: () => void;
  // The transport closed: nothing is expected until the next connect.
  disconnected: () => void;
  // A server ping arrived and was answered.
  ping: () => void;
  // The page became visible or hidden. A hidden page's timers are throttled
  // or suspended, so silence proves nothing until it has been visible again
  // for a full window.
  visibilityChanged: (visible: boolean) => void;
  // Runs on every ping. Returns the unsubscribe.
  subscribe: (listener: () => void) => () => void;
}

export function createSocketKeepalive({
  onDeadLink,
  deadLinkAfterMs = SOCKET_DEAD_LINK_AFTER_MS,
  now = () => Date.now(),
  setTimer = (callback, ms) => setTimeout(callback, ms),
  clearTimer = (handle) => clearTimeout(handle as any)
}: {
  onDeadLink: () => void;
  deadLinkAfterMs?: number;
  now?: () => number;
  setTimer?: (callback: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
}): SocketKeepalive {
  const listeners = new Set<() => void>();
  let isConnected = false;
  let isVisible = true;
  // the last proof the link worked, or the moment silence started to count
  let quietSince = 0;
  let timer: unknown = null;

  return { connected, disconnected, ping, visibilityChanged, subscribe };

  function connected() {
    isConnected = true;
    watch();
  }

  function disconnected() {
    isConnected = false;
    stopWatching();
  }

  function ping() {
    if (isConnected) watch();
    for (const listener of [...listeners]) {
      try {
        listener();
      } catch (error) {
        console.error(error);
      }
    }
  }

  function visibilityChanged(visible: boolean) {
    isVisible = visible;
    if (isConnected && visible) watch();
    else stopWatching();
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function watch() {
    stopWatching();
    if (!isVisible) return;
    quietSince = now();
    timer = setTimer(check, deadLinkAfterMs);
  }

  function stopWatching() {
    if (timer === null) return;
    clearTimer(timer);
    timer = null;
  }

  function check() {
    timer = null;
    if (!isConnected || !isVisible) return;
    // A timer that fired late (a suspended page) can run before the pings
    // that queued up meanwhile are delivered; only real elapsed silence on a
    // visible page counts, and a late timer gets one more full window.
    const quietFor = now() - quietSince;
    if (quietFor > deadLinkAfterMs * 1.5) {
      watch();
      return;
    }
    onDeadLink();
  }
}

// Socket.IO's `socket.connect()` is not a no-op during a handshake. While the
// Manager is open and the namespace CONNECT packet is still unanswered, it
// sends CONNECT again; the server then admits the same page twice, the client
// gets two `connect` events, and every bind and chat load behind them runs
// twice. On a fast link that window is a few milliseconds. On a slow one
// (measured 11-23 at 260 ms round trip) the page's own `pageshow` and `focus`
// handlers land inside it on every load: one page sent 4 CONNECTs and 4 binds
// on a single transport. A socket that is active (subscribed to its Manager),
// not connected, with the Manager open, has exactly one CONNECT pending.
export function isNamespaceConnectPending(socket: {
  connected: boolean;
  active: boolean;
  io: unknown;
}) {
  return (
    !socket.connected &&
    socket.active &&
    (socket.io as { _readyState?: string })?._readyState === 'open'
  );
}

// Every caller that "makes sure the socket is connected" (resume, focus,
// pageshow, online, the session recovery probe) calls socket.connect(). The
// guard lives on the socket itself so none of them, present or future, can
// repeat a CONNECT that is already on its way.
export function guardSocketConnect<
  T extends { connected: boolean; active: boolean; io: unknown; connect: () => T }
>(socket: T) {
  const connect = socket.connect.bind(socket);
  socket.connect = function guardedConnect() {
    if (isNamespaceConnectPending(socket)) return socket;
    return connect();
  };
  return socket;
}

// True from the first transport attempt until the namespace is connected:
// nothing has been lost that a reconnect would have to repair.
export function isSocketHandshakeInFlight(socket: {
  connected: boolean;
  active: boolean;
  io: unknown;
}) {
  const state = (socket.io as { _readyState?: string })?._readyState;
  return (
    !socket.connected &&
    socket.active &&
    (state === 'opening' || state === 'open')
  );
}
