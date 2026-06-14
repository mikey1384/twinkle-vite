const CHAT_BOOTSTRAP_HISTORY_LIMIT = 300;

interface ChatBootstrapHistoryEntry {
  event: string;
  seq: number;
  timeStamp: number;
  isoTime: string;
  [key: string]: any;
}

interface ChatBootstrapWindow extends Window {
  __chatBootstrapHistory?: ChatBootstrapHistoryEntry[];
  __chatBootstrapLogSeq?: number;
  __chatBootstrapAttemptSeq?: number;
}

function getChatBootstrapWindow() {
  if (typeof window === 'undefined') return null;
  return window as ChatBootstrapWindow;
}

export function nextChatBootstrapId() {
  const targetWindow = getChatBootstrapWindow();
  const nextAttemptSeq = (targetWindow?.__chatBootstrapAttemptSeq || 0) + 1;
  if (targetWindow) {
    targetWindow.__chatBootstrapAttemptSeq = nextAttemptSeq;
  }
  return `chat-bootstrap-${Date.now()}-${nextAttemptSeq}`;
}

export function recordChatBootstrapEvent(
  event: string,
  details: Record<string, any> = {}
) {
  const targetWindow = getChatBootstrapWindow();
  const nextLogSeq = (targetWindow?.__chatBootstrapLogSeq || 0) + 1;
  const timeStamp = Date.now();
  const entry: ChatBootstrapHistoryEntry = {
    event,
    seq: nextLogSeq,
    timeStamp,
    isoTime: new Date(timeStamp).toISOString(),
    ...details
  };

  if (targetWindow) {
    targetWindow.__chatBootstrapLogSeq = nextLogSeq;
    const history = targetWindow.__chatBootstrapHistory || [];
    history.push(entry);
    if (history.length > CHAT_BOOTSTRAP_HISTORY_LIMIT) {
      history.splice(0, history.length - CHAT_BOOTSTRAP_HISTORY_LIMIT);
    }
    targetWindow.__chatBootstrapHistory = history;
  }

  return entry;
}

// The bootstrap buffer is in-memory, so it vanishes on the page reload typically
// used to recover from a wedged "Loading Twinkle Chat...". Persist it (on pagehide,
// on tab-hide, and on demand from the watchdog) so the wedged trace survives even a
// hard quit, and expose window.dumpChatBootstrap() to read current + previous.
const CHAT_BOOTSTRAP_PERSIST_KEY = 'chatBootstrapHistory:lastSession';

// Write the live buffer to localStorage so it outlives a reload/close. Called by
// the pagehide/visibility listeners and directly by the stuck-chat watchdog so the
// wedged trace is saved the moment trouble is detected, not only on unload.
export function flushChatBootstrapHistory() {
  const targetWindow = getChatBootstrapWindow();
  if (!targetWindow) return;
  try {
    const history = targetWindow.__chatBootstrapHistory;
    if (history && history.length) {
      window.localStorage.setItem(
        CHAT_BOOTSTRAP_PERSIST_KEY,
        JSON.stringify(history)
      );
    }
  } catch {}
}

function buildChatBootstrapReport(count = 80) {
  const targetWindow = getChatBootstrapWindow();
  const current = (targetWindow?.__chatBootstrapHistory || []).slice(-count);
  const previous = (
    (targetWindow as any)?.__chatBootstrapHistoryPrev || []
  ).slice(-count);
  return {
    meta: {
      capturedAt: new Date().toISOString(),
      href: typeof location !== 'undefined' ? location.href : null,
      userAgent:
        typeof navigator !== 'undefined' ? navigator.userAgent : null,
      online: typeof navigator !== 'undefined' ? navigator.onLine : null,
      visibility:
        typeof document !== 'undefined' ? document.visibilityState : null,
      currentEventCount: current.length,
      previousEventCount: previous.length
    },
    current,
    previous
  };
}

function setupChatBootstrapPersistence() {
  const targetWindow = getChatBootstrapWindow();
  if (!targetWindow) return;
  if ((targetWindow as any).__chatBootstrapPersistenceReady) return;
  (targetWindow as any).__chatBootstrapPersistenceReady = true;

  try {
    const prev = window.localStorage.getItem(CHAT_BOOTSTRAP_PERSIST_KEY);
    if (prev) {
      (targetWindow as any).__chatBootstrapHistoryPrev = JSON.parse(prev);
    }
  } catch {}

  window.addEventListener('pagehide', flushChatBootstrapHistory);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushChatBootstrapHistory();
  });

  // Console helper: `copy(dumpChatBootstrap())` in devtools yields a full,
  // shareable diagnostic (current + previous session + environment meta).
  (targetWindow as any).dumpChatBootstrap = (count = 80) =>
    buildChatBootstrapReport(count);
}

setupChatBootstrapPersistence();
