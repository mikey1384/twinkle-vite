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

// What the member is asking about: set when they press an "Ask Zero/Ciel"
// button on something (a comment, a post, a page). The dock shows it as a
// small chip above the message box and sends it with the next message, so the
// agent knows what "this" means, the way Grok attaches the post on X.
export interface AssistantAskContext {
  // what it is: 'comment', 'subject', 'achievement', 'bridgeBuilder', 'page'...
  kind: string;
  // the thing's id when it has one
  id?: number;
  // a pass's kind ('mission' or 'achievement'), as the feed knows it
  rootType?: string;
  // a short name for the chip ("this comment", "the Bridge Builder meetup quest")
  label: string;
  // where it lives, for the agent to open or link
  path?: string;
  // a short excerpt of its text (the server re-reads the real thing; this is
  // only a fallback for things with no page of their own)
  excerpt?: string;
}
let askContext: AssistantAskContext | null = null;
export function getAssistantAskContext() {
  return askContext;
}
export function clearAssistantAskContext() {
  if (!askContext) return;
  askContext = null;
  listeners.forEach((listener) => listener());
}

// Pressing Ask on something keeps the window up until the member closes it,
// even on Home where the ask box shows the same conversation: they asked from
// a card far down the feed and the reply belongs where they are looking.
let askedFromItem = false;
export function getAssistantDockAskedFromItem() {
  return askedFromItem;
}

export function openAssistantDock(
  assistant: 'Zero' | 'Ciel',
  context?: AssistantAskContext | null
) {
  if (context !== undefined) askContext = context;
  if (context) askedFromItem = true;
  const changed = dockAssistant !== assistant;
  dockAssistant = assistant;
  // a new context must reach an already-open dock too
  if (changed || context !== undefined) listeners.forEach((l) => l());
}

export function closeAssistantDock() {
  askContext = null;
  askedFromItem = false;
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
