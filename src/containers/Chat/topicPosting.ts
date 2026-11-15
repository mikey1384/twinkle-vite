// Who can post in a chat topic (Mikey, 11-15). The server owns the rule
// (twinkle-api controllers/chat/model/topicPosting.ts) and refuses every
// message path; this file only reads the canonical topic settings so the
// message box can say who may post.
export type TopicPostingMode = 'everyone' | 'owner' | 'chosen';
export type TopicPostingSetBy = 'chat_owner' | 'topic_owner';
export type TopicPostingAccess = 'allowed' | 'blocked' | 'unknown';

export interface TopicPoster {
  id: number;
  username: string;
  realName?: string;
  profilePicUrl?: string | null;
}

export function topicPostingModeOf(settings: any): TopicPostingMode {
  const mode = settings?.postingMode;
  if (mode === 'everyone' || mode === 'owner' || mode === 'chosen') return mode;
  // Topics saved before chosen members only carry the old switch.
  return settings?.isOwnerPostingOnly ? 'owner' : 'everyone';
}

// Who set the rule. Before this was recorded, only the chat owner could turn
// on a group topic's switch (it meant "only the chat owner posts"), and in a
// direct chat only the topic's owner.
// postingSetById is the person: a rule the topic's own owner set stays theirs
// (also after the chat changes hands).
export function topicPostingSetByOf(
  settings: any,
  isTwoPeople: boolean,
  topicOwnerId?: number
): TopicPostingSetBy {
  if (isTwoPeople) return 'topic_owner';
  const setById = Number(settings?.postingSetById || 0);
  if (setById > 0 && topicOwnerId && setById === Number(topicOwnerId)) {
    return 'topic_owner';
  }
  const setBy = settings?.postingSetBy;
  return setBy === 'topic_owner' || setBy === 'chat_owner' ? setBy : 'chat_owner';
}

// A topic's owner (who isn't the chat owner) may change the rule only while
// it is Everyone or one they set themselves.
export function topicOwnerMayChangePosting(settings: any, topicOwnerId?: number) {
  return (
    topicPostingModeOf(settings) === 'everyone' ||
    topicPostingSetByOf(settings, false, topicOwnerId) === 'topic_owner'
  );
}

// In a group the chat owner can always post; the topic owner too when they
// set the rule. In chosen mode the list comes from the server; until it is
// loaded the answer is 'unknown' (the caller fetches it).
export function topicPostingAccess({
  topic,
  userId,
  channelOwnerId,
  isTwoPeople
}: {
  topic: any;
  userId: number;
  channelOwnerId: number;
  isTwoPeople: boolean;
}): TopicPostingAccess {
  if (!topic) return 'allowed';
  const mode = topicPostingModeOf(topic.settings);
  if (mode === 'everyone') return 'allowed';
  const id = Number(userId);
  if (isTwoPeople) return id > 0 && id === Number(topic.userId) ? 'allowed' : 'blocked';
  if (id > 0 && id === Number(channelOwnerId)) return 'allowed';
  if (
    topicPostingSetByOf(topic.settings, false, Number(topic.userId)) === 'topic_owner' &&
    id > 0 &&
    id === Number(topic.userId)
  ) {
    return 'allowed';
  }
  if (mode === 'owner') return 'blocked';
  const posters = topic.settings?.posters;
  if (!Array.isArray(posters)) return 'unknown';
  return posters.some((poster: TopicPoster) => Number(poster?.id) === id)
    ? 'allowed'
    : 'blocked';
}

// Long usernames are shortened so the line and the row stay one or two lines.
const MAX_NAME_LENGTH = 18;
function shortName(name: string) {
  const chars = Array.from(String(name || ''));
  return chars.length > MAX_NAME_LENGTH
    ? `${chars.slice(0, MAX_NAME_LENGTH - 1).join('')}…`
    : chars.join('');
}

function joinNames(names: string[], othersCount: number) {
  if (othersCount > 0) {
    return `${names.join(', ')} and ${othersCount} other${othersCount === 1 ? '' : 's'}`;
  }
  if (names.length <= 1) return names[0] || '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

// "Only twosteps, Lucy and 3 others can post in this topic"
export function formatTopicPostersLine({
  topic,
  channelOwnerName,
  channelOwnerId,
  isTwoPeople
}: {
  topic: any;
  channelOwnerName?: string;
  channelOwnerId?: number;
  isTwoPeople: boolean;
}) {
  const seen = new Set<number>();
  const names: string[] = [];
  const add = (id: number, username?: string) => {
    if (!username || seen.has(Number(id))) return;
    seen.add(Number(id));
    names.push(shortName(username));
  };
  const setBy = topicPostingSetByOf(topic?.settings, isTwoPeople, Number(topic?.userId));
  if (setBy === 'topic_owner') add(Number(topic?.userId), topic?.username);
  if (topicPostingModeOf(topic?.settings) === 'chosen' && !isTwoPeople) {
    for (const poster of topic?.settings?.posters || []) {
      add(Number(poster?.id), poster?.username);
    }
  }
  if (!isTwoPeople) add(Number(channelOwnerId), channelOwnerName);
  if (!names.length) return 'Only some members can post in this topic';
  const shown = names.length > 3 ? names.slice(0, 2) : names;
  return `Only ${joinNames(shown, names.length - shown.length)} can post in this topic`;
}

// "Lucy, twosteps +3" for the compact row in Topic Settings.
export function formatChosenSummary(posters: TopicPoster[]) {
  if (!posters.length) return 'No one yet';
  const shown = posters.slice(0, 2).map((poster) => shortName(poster.username));
  const rest = posters.length - shown.length;
  return `${shown.join(', ')}${rest > 0 ? ` +${rest}` : ''}`;
}

// Reads a topic's rule with a few retries (1 s, then 2 s apart). Resolves to
// null when every try failed: the caller then lets the member type (the
// server still refuses) with a small "couldn't check" note, instead of
// leaving the box stuck on "Checking…".
export async function loadTopicPostingWithRetry<T>({
  load,
  tries = 3,
  isCanceled = () => false,
  wait = (ms: number) => new Promise<void>((done) => setTimeout(done, ms))
}: {
  load: () => Promise<T>;
  tries?: number;
  isCanceled?: () => boolean;
  wait?: (ms: number) => Promise<void>;
}): Promise<T | null> {
  for (let attempt = 0; attempt < tries; attempt++) {
    if (isCanceled()) return null;
    try {
      const data: any = await load();
      if (data?.postingMode) return data;
    } catch {
      // try again below
    }
    if (attempt < tries - 1) await wait(1000 * 2 ** attempt);
  }
  return null;
}
