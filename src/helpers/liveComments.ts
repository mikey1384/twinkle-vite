import { LIVE_COMMENT_FIELDS } from '~/helpers/aiEnergySponsorship';

// A comment reaches this client from several server responses — the thread
// load, a feed page, a socket `content_edited` — and each one is a snapshot
// taken at a different moment. `comment<id>` in the content context is the one
// copy every surface reads, so a write only lands when it is newer than what
// that entry already holds, and "newer" is decided by when THIS client observed
// the data rather than by anything on the row (comments carry only a creation
// `timeStamp`, so two copies of one comment are indistinguishable by content).
//
// Feed rows stamp the moment their request was ISSUED, not the moment it
// arrived: an edit broadcast that lands while the feed request is in flight is
// newer than the snapshot the server built, and stamping arrival would let the
// response overwrite it.
export function getLiveObservedAt() {
  return typeof performance !== 'undefined' && performance.now
    ? performance.timeOrigin + performance.now()
    : Date.now();
}

// Only the fields the server can replace after upload, and only the ones this
// copy actually carries — a row that omits `filePath` says nothing about the
// attachment, so it must not blank one the content entry already has.
export function extractLiveCommentFields(source: any) {
  const fields: Record<string, any> = {};
  if (!source) return fields;
  for (const field of LIVE_COMMENT_FIELDS) {
    if (source[field] !== undefined) {
      fields[field] = source[field];
    }
  }
  return fields;
}

export function getLiveCommentId(comment: any) {
  return Number(comment?.id || 0);
}

// Comments arrive nested (replies, replies of replies). Every level is a
// comment with its own id, so every level is a copy that can go stale.
export function flattenCommentTree(comments: any): any[] {
  if (!Array.isArray(comments)) return [];
  const flattened: any[] = [];
  for (const comment of comments) {
    if (!comment) continue;
    flattened.push(comment);
    flattened.push(...flattenCommentTree(comment.replies));
  }
  return flattened;
}

export const FEED_ROW_OBSERVED_AT_KEY = '__liveObservedAt';

// Feed rows outlive the response they came in: they sit in the Home/Profile
// context and re-render long afterwards, so a row has to carry the moment its
// request was issued. Stamped here, at the one place every feed response passes
// through, rather than threaded as a prop through three containers.
export function withFeedRowsObservedAt(payload: any, observedAt: number) {
  if (!observedAt || !payload) return payload;
  const stampRow = (row: any) =>
    row && typeof row === 'object'
      ? { ...row, [FEED_ROW_OBSERVED_AT_KEY]: observedAt }
      : row;
  if (Array.isArray(payload)) return payload.map(stampRow);
  if (Array.isArray(payload.feeds)) {
    return { ...payload, feeds: payload.feeds.map(stampRow) };
  }
  return payload;
}

export function getFeedRowObservedAt(feed: any) {
  return Number(feed?.[FEED_ROW_OBSERVED_AT_KEY] || 0);
}

// Thread loads, feed pages and `content_edited` broadcasts all carry copies of
// the same comment, taken at different moments. `comment<id>` is the copy every
// surface reads, so each server response writes into it and the newest OBSERVED
// copy wins — a stale cache can no longer beat a fresh response, and a fresh
// broadcast can no longer be beaten by a response the server built before it.
//
// `createEntry` supplies the content context's default entry shape; it is
// injected so this rule stays a pure function the reducer composes.
export function upsertLiveComments({
  state,
  entries,
  observedAt,
  createEntry
}: {
  state: any;
  entries: { id: number; fields: Record<string, any> }[];
  observedAt: number;
  createEntry: (id: number) => any;
}) {
  if (!observedAt || !entries.length) return state;
  let nextState = state;
  for (const { id, fields } of entries) {
    const contentKey = `comment${id}`;
    const prevContentState = nextState[contentKey];
    if (
      prevContentState &&
      Number(prevContentState.liveObservedAt || 0) >= observedAt
    ) {
      continue;
    }
    // An identical copy is not worth a new state identity — this runs on every
    // feed render. Leaving the stamp alone is harmless precisely because the
    // stored fields already match what this response carries.
    if (
      prevContentState &&
      Object.keys(fields).every(
        (field) => prevContentState[field] === fields[field]
      )
    ) {
      continue;
    }
    if (nextState === state) {
      nextState = { ...state };
    }
    nextState[contentKey] = {
      ...(prevContentState || createEntry(id)),
      ...fields,
      liveObservedAt: observedAt
    };
  }
  return nextState;
}

// The payload the content context needs to upsert one server-observed comment.
export function buildLiveCommentEntries(comments: any[]) {
  const entries: { id: number; fields: Record<string, any> }[] = [];
  const seen = new Set<number>();
  for (const comment of flattenCommentTree(comments)) {
    const id = getLiveCommentId(comment);
    if (!id || seen.has(id)) continue;
    const fields = extractLiveCommentFields(comment);
    if (!Object.keys(fields).length) continue;
    seen.add(id);
    entries.push({ id, fields });
  }
  return entries;
}
