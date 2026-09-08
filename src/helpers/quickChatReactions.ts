import { getChatReaction, type ChatReactionKey } from '~/constants/chatReactions';

export const QUICK_REACTION_LIMIT = 8;
export const DEFAULT_QUICK_REACTIONS: readonly ChatReactionKey[] = Object.freeze([
  'thumb', 'heart', 'laughing', 'surprised', 'wave', 'crying', 'angry', 'fire'
]);
const changeEvent = 'twinkle:quick-chat-reactions';
const sessionChoices = new Map<string, readonly ChatReactionKey[]>();

export function quickReactionStorageKey(userId: number) {
  const account = Number.isSafeInteger(userId) && userId > 0 ? userId : 'guest';
  return `twinkle.chat.quick-reactions.v1:${account}`;
}

export function normalizeQuickReactions(value: unknown): ChatReactionKey[] {
  if (!Array.isArray(value)) return [...DEFAULT_QUICK_REACTIONS];
  const keys: ChatReactionKey[] = [];
  for (const key of value) {
    const definition = typeof key === 'string' && getChatReaction(key);
    if (definition && !keys.includes(definition.key)) keys.push(definition.key);
    if (keys.length === QUICK_REACTION_LIMIT) break;
  }
  return keys.length ? keys : [...DEFAULT_QUICK_REACTIONS];
}

export function readQuickReactions(userId: number): readonly ChatReactionKey[] {
  const key = quickReactionStorageKey(userId);
  const cached = sessionChoices.get(key);
  if (cached) return cached;
  let value: unknown;
  try {
    value = JSON.parse(window.localStorage.getItem(key) || 'null');
  } catch {
    // Malformed/blocked storage must never break a message's reaction menu.
  }
  const choices = Object.freeze(normalizeQuickReactions(value));
  sessionChoices.set(key, choices);
  return choices;
}

export function saveQuickReactions(userId: number, value: readonly string[]) {
  const key = quickReactionStorageKey(userId);
  const choices = Object.freeze(normalizeQuickReactions(value));
  sessionChoices.set(key, choices);
  let persisted = false;
  try {
    window.localStorage.setItem(key, JSON.stringify(choices));
    persisted = true;
  } catch {
    // Keep the user's choice for this session if browser storage is unavailable.
  }
  window.dispatchEvent(new CustomEvent(changeEvent, { detail: { key } }));
  return persisted;
}

export function subscribeQuickReactions(userId: number, listener: () => void) {
  const key = quickReactionStorageKey(userId);
  const onLocalChange = (event: Event) => {
    if ((event as CustomEvent<{ key: string }>).detail?.key === key) listener();
  };
  const onStorageChange = (event: StorageEvent) => {
    if (event.key !== null && event.key !== key) return;
    sessionChoices.delete(key);
    listener();
  };
  window.addEventListener(changeEvent, onLocalChange);
  window.addEventListener('storage', onStorageChange);
  return () => {
    window.removeEventListener(changeEvent, onLocalChange);
    window.removeEventListener('storage', onStorageChange);
  };
}
