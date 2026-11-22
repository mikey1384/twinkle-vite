// Whether the Quick Ask window (a temporary chat with Zero for small
// questions, kept out of the member's main chat) is open. Its conversation
// lives only inside the window, so closing it, a reload or an account change
// ends it; Save to chat keeps one answer.
let open = false;
const listeners = new Set<() => void>();
const focusListeners = new Set<() => void>();

function set(next: boolean) {
  if (open === next) return;
  open = next;
  listeners.forEach((listener) => listener());
}

// Opening again while it is open puts the cursor back in its box.
export function openQuickAsk() {
  if (open) {
    focusListeners.forEach((listener) => listener());
    return;
  }
  set(true);
}

export function closeQuickAsk() {
  set(false);
}

export function toggleQuickAsk() {
  if (open) closeQuickAsk();
  else openQuickAsk();
}

export function getQuickAskOpen() {
  return open;
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
