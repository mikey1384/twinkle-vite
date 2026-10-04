// A topic's first page, requested the moment someone shows they are about to
// open it (pointer over it, finger down, keyboard focus) instead of after the
// click and the route change: the first visit to a topic used to show an empty
// "Loading..." for over a second. The open uses the same reply if it is fresh;
// nothing is applied unless the topic is actually opened.
const FRESH_MS = 8_000; // hover-to-click is ~1-2 s; short, so a message posted meanwhile is not missed
const pending = new Map<string, { at: number; promise: Promise<any> }>();
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
    // a failed prefetch is simply not used: the open loads as before
    promise: Promise.resolve()
      .then(() => load({ channelId, topicId }))
      .catch(() => null)
  });
}

/** The prefetched first page, once, if still fresh (null otherwise). */
export function takePrefetchedTopicMessages(channelId: number, topicId: number) {
  const key = keyOf(channelId, topicId);
  const entry = pending.get(key);
  pending.delete(key);
  return entry && Date.now() - entry.at < FRESH_MS ? entry.promise : null;
}
