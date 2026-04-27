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
