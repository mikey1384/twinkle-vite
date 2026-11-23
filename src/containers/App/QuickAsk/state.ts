import type { AssistantAskContext } from '../AssistantDock/dockState';

// Whether the Quick Ask window (Zero or Ciel in temporary mode: small
// questions, kept out of the member's main chat) is open, and with what.
// Its conversation lives only inside the window, so closing it, a reload or
// an account change ends it; Save to chat keeps one answer.
export interface QuickAskRequest {
  agent: 'Zero' | 'Ciel';
  // what the member pressed Ask on, sent with the first question
  context: AssistantAskContext | null;
  // a question typed elsewhere (the Home box), sent as soon as it opens
  question: string;
  nonce: number;
}
let request: QuickAskRequest | null = null;
const listeners = new Set<() => void>();
const focusListeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

// Opening it again for the same assistant with nothing new puts the cursor
// back in its box. A new item or question for the same assistant joins the
// open conversation (the window reads the new request); another assistant
// opens its own window.
export function openQuickAsk({
  agent = 'Zero',
  context = null,
  question = ''
}: {
  agent?: 'Zero' | 'Ciel';
  context?: AssistantAskContext | null;
  question?: string;
} = {}) {
  if (request && request.agent === agent && !context && !question) {
    focusListeners.forEach((listener) => listener());
    return;
  }
  request = { agent, context, question, nonce: Date.now() + Math.random() };
  notify();
}

export function closeQuickAsk() {
  if (!request) return;
  request = null;
  notify();
}

export function getQuickAskRequest() {
  return request;
}

export function getQuickAskOpen() {
  return !!request;
}

export function subscribeQuickAsk(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function subscribeQuickAskFocus(listener: () => void) {
  focusListeners.add(listener);
  return () => {
    focusListeners.delete(listener);
  };
}

// Ctrl+K (⌘K on a Mac) opens Quick Ask from anywhere on a computer.
export function isQuickAskShortcut(event: KeyboardEvent) {
  return (
    (event.metaKey || event.ctrlKey) &&
    !event.altKey &&
    !event.shiftKey &&
    event.key.toLowerCase() === 'k'
  );
}

export function quickAskShortcutLabel() {
  const mac =
    typeof navigator !== 'undefined' &&
    /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  return mac ? '⌘K' : 'Ctrl+K';
}
