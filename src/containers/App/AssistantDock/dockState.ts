// Whether Zero or Ciel's floating chat window is up. Their acting on the
// page (taking the user somewhere, opening something, pointing) brings it up,
// so the user can keep talking to them on that screen; the user's close puts
// it away until they act again.
let dockAssistant: 'Zero' | 'Ciel' | null = null;
let dockTopicId = 0;
let accountEpoch = 0;
export function getAssistantAccountEpoch() {
  return accountEpoch;
}
const drafts = new Map<string, string>();
const lastTopics = new Map<string, number>();
const contexts = new Map<string, AssistantAskContext | null>();
const scrollPositions = new Map<string, { top: number; pinned: boolean }>();
let view: {
  position?: { x: number; y: number };
  expanded?: boolean;
  scrollTop?: number;
} = {};
const key = (assistant: string | null, topicId = dockTopicId) =>
  `${assistant}:${topicId}`;
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
  // an app asked about for its rewards (the Earn page), not to play
  focus?: 'rewards';
  // an Arena battle question's number, a drill question's version (the
  // server re-reads the question as the member)
  no?: number;
  version?: number;
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
  if (dockAssistant) contexts.set(key(dockAssistant), null);
  listeners.forEach((listener) => listener());
}

// Pressing Ask on something keeps the window up until the member closes it,
// even on the chat page that shows the same conversation: the reply belongs
// where they are looking.
let askedFromItem = false;
export function getAssistantDockAskedFromItem() {
  return askedFromItem;
}

export function openAssistantDock(
  assistant: 'Zero' | 'Ciel',
  context?: AssistantAskContext | null,
  requestedTopicId?: number
) {
  const topicId =
    requestedTopicId ??
    (dockAssistant === assistant
      ? dockTopicId
      : lastTopics.get(assistant) || 0);
  const topicChanged = dockTopicId !== topicId;
  if (dockAssistant) contexts.set(key(dockAssistant), askContext);
  if (dockAssistant !== assistant || topicChanged) askedFromItem = false;
  if (dockAssistant !== assistant || topicChanged)
    askContext = contexts.get(key(assistant, topicId)) || null;
  dockTopicId = topicId;
  lastTopics.set(assistant, topicId);
  if (context !== undefined) askContext = context;
  if (context) askedFromItem = true;
  const changed = dockAssistant !== assistant;
  dockAssistant = assistant;
  // a new context must reach an already-open dock too
  if (changed || topicChanged || context !== undefined)
    listeners.forEach((l) => l());
}

export function closeAssistantDock() {
  if (dockAssistant) contexts.set(key(dockAssistant), askContext);
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

// Which assistant the Home ask box is showing, so the Post box knows it can
// leave a question there. (The box shows no conversation itself: its replies
// open in this window like every other Ask.)
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

export function getAssistantDockTopic() {
  return dockTopicId;
}
export function getAssistantDraft(assistant: string, topicId: number) {
  return drafts.get(key(assistant, topicId)) || '';
}
export function setAssistantDraft(
  assistant: string,
  topicId: number,
  text: string
) {
  drafts.set(key(assistant, topicId), text);
  listeners.forEach((fn) => fn());
}
export function getAssistantWindowView() {
  return view;
}
export function setAssistantWindowView(patch: Partial<typeof view>) {
  view = { ...view, ...patch };
}
export function resetAssistantDock() {
  accountEpoch++;
  homeAskAssistant = null;
  homeAskPrefill = null;
  lastTopics.clear();
  drafts.clear();
  contexts.clear();
  scrollPositions.clear();
  askContext = null;
  askedFromItem = false;
  view = {};
  dockTopicId = 0;
  dockAssistant = null;
  listeners.forEach((fn) => fn());
}

export function getAssistantScroll(assistant: string, topicId: number) {
  return scrollPositions.get(key(assistant, topicId));
}
export function setAssistantScroll(
  assistant: string,
  topicId: number,
  scroll: { top: number; pinned: boolean }
) {
  scrollPositions.set(key(assistant, topicId), scroll);
}

export function consumeAssistantAskContext(
  assistant: string,
  topicId: number,
  expected: AssistantAskContext | null
) {
  if (contexts.get(key(assistant, topicId)) === expected)
    contexts.set(key(assistant, topicId), null);
  if (
    dockAssistant === assistant &&
    dockTopicId === topicId &&
    askContext === expected
  )
    clearAssistantAskContext();
}
