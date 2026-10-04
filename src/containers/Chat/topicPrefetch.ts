// A topic's first page, requested the moment someone shows they are about to
// open it (pointer over it, finger down, keyboard focus) instead of after the
// click and the route change: the first visit to a topic used to show an empty
// "Loading..." for over a second. The open uses the same reply if it is fresh;
// nothing is applied unless the topic is actually opened.
//
// A reply older than the chat's live state is never applied: the channel's
// activity revision (bumped by every message, edit, deletion and reaction the
// socket delivers) is recorded when the prefetch starts, and a prefetch that a
// later event overtook is dropped and the topic loads fresh.
import { getChatProjectionActivityRevision } from '~/helpers/chatUnreadActivity';

const FRESH_MS = 8_000; // hover-to-click is ~1-2 s
const pending = new Map<
  string,
  { at: number; revision: number; promise: Promise<any> }
>();
const keyOf = (channelId: number, topicId: number) => `${channelId}:${topicId}`;

export function prefetchTopicMessages(
  load: (params: { channelId: number; topicId: number }) => Promise<any>,
  { channelId, topicId }: { channelId: number; topicId: number }
) {
  if (!(channelId > 0) || !(topicId > 0)) return;
  const key = keyOf(channelId, topicId);
  const entry = pending.get(key);
  if (entry && Date.now() - entry.at < FRESH_MS) return;
  if (pending.size > 50) pending.clear();
  pending.set(key, {
    at: Date.now(),
    revision: getChatProjectionActivityRevision(channelId),
    // a failed prefetch is simply not used: the open loads as before
    promise: Promise.resolve()
      .then(() => load({ channelId, topicId }))
      .catch(() => null)
  });
}

/**
 * The prefetched first page, once, if still fresh and nothing happened in the
 * channel since it was asked for (null otherwise: load it fresh).
 */
export async function takePrefetchedTopicMessages(
  channelId: number,
  topicId: number
) {
  const key = keyOf(channelId, topicId);
  const entry = pending.get(key);
  pending.delete(key);
  if (!entry || Date.now() - entry.at >= FRESH_MS) return null;
  const data = await entry.promise;
  return getChatProjectionActivityRevision(channelId) === entry.revision
    ? data
    : null;
}

/** Forget a topic's prefetch (an open that loads its own page, e.g. to a message). */
export function dropPrefetchedTopicMessages(
  channelId: number,
  topicId: number
) {
  pending.delete(keyOf(channelId, topicId));
}
