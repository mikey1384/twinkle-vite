// Whether Zero or Ciel's floating chat window is up. Their acting on the
// page (taking the user somewhere, opening something, pointing) brings it up,
// so the user can keep talking to them on that screen; the user's close puts
// it away until they act again.
let dockAssistant: 'Zero' | 'Ciel' | null = null;
const listeners = new Set<() => void>();

function set(next: 'Zero' | 'Ciel' | null) {
  if (dockAssistant === next) return;
  dockAssistant = next;
  listeners.forEach((listener) => listener());
}

export function openAssistantDock(assistant: 'Zero' | 'Ciel') {
  set(assistant);
}

export function closeAssistantDock() {
  set(null);
}

export function subscribeAssistantDock(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getAssistantDock() {
  return dockAssistant;
}

// Which assistant the Home ask box is showing (it shows the conversation on
// Home, so the window steps aside only for that one).
let homeAskAssistant: 'Zero' | 'Ciel' | null = null;
export function setHomeAskAssistant(assistant: 'Zero' | 'Ciel' | null) {
  if (homeAskAssistant === assistant) return;
  homeAskAssistant = assistant;
  listeners.forEach((listener) => listener());
}
export function getHomeAskAssistant() {
  return homeAskAssistant;
}

// Text for Home's ask box, typed there but not sent (a subject in the Post
// field that is really a question: the user can ask it right away).
let homeAskPrefill: { text: string; nonce: number } | null = null;
const prefillListeners = new Set<() => void>();
export function prefillHomeAsk(text: string) {
  homeAskPrefill = { text, nonce: Date.now() };
  prefillListeners.forEach((listener) => listener());
}
export function subscribeHomeAskPrefill(listener: () => void) {
  prefillListeners.add(listener);
  return () => {
    prefillListeners.delete(listener);
  };
}
export function getHomeAskPrefill() {
  return homeAskPrefill;
}
