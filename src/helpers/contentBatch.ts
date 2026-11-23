// Home feed cards each need their content, and each used to ask for it with
// its own GET /content: 26 requests in the first 20 s of a phone's load and
// several hundred a minute while scrolling, queued behind the browser's
// connection limit on a slow link. Cards that ask within a short window now
// share one POST /content/batch (twinkle-api controllers/content/routes/root.ts
// reads every item exactly as GET /content does).
//
// Nothing depends on the batch route existing: a lone request, an API that
// does not have the route yet, a failed batch and an item the server could
// not read all go through the per-card request, which stays the canonical
// path with its own retries and error handling.

export const CONTENT_BATCH_WINDOW_MS = 30;
// The API refuses more than 30 items (CONTENT_BATCH_MAX_ITEMS).
export const CONTENT_BATCH_MAX_ITEMS = 30;
// After the route was found missing, ask again this much later: the API and
// the website deploy separately.
export const CONTENT_BATCH_UNSUPPORTED_RETRY_MS = 10 * 60 * 1000;

export interface ContentBatchItem {
  contentId: number;
  contentType: string;
  rootType?: string;
}

interface Waiter<T> {
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

interface Pending<T> {
  item: ContentBatchItem;
  waiters: Waiter<T>[];
}

export function createContentBatcher<T>({
  sendBatch,
  loadSingle,
  isRouteMissing,
  windowMs = CONTENT_BATCH_WINDOW_MS,
  maxItems = CONTENT_BATCH_MAX_ITEMS,
  unsupportedRetryMs = CONTENT_BATCH_UNSUPPORTED_RETRY_MS,
  now = () => Date.now(),
  setTimer = (callback, ms) => setTimeout(callback, ms),
  clearTimer = (handle) => clearTimeout(handle as any)
}: {
  // One request for many items; resolves to results in the items' order.
  sendBatch: (items: ContentBatchItem[]) => Promise<unknown[]>;
  // The per-card request.
  loadSingle: (item: ContentBatchItem) => Promise<T>;
  // True when the error says the API has no batch route (an older API).
  isRouteMissing: (error: unknown) => boolean;
  windowMs?: number;
  maxItems?: number;
  unsupportedRetryMs?: number;
  now?: () => number;
  setTimer?: (callback: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
}) {
  let queue = new Map<string, Pending<T>>();
  let timer: unknown = null;
  let unsupportedUntil = 0;

  return { load };

  function load(item: ContentBatchItem): Promise<T> {
    if (now() < unsupportedUntil) return loadSingle(item);
    return new Promise<T>((resolve, reject) => {
      const key = `${item.contentType}:${item.contentId}:${item.rootType || ''}`;
      const pending = queue.get(key);
      // Two cards asking for the same content share one answer.
      if (pending) pending.waiters.push({ resolve, reject });
      else queue.set(key, { item, waiters: [{ resolve, reject }] });
      if (queue.size >= maxItems) flush();
      else if (timer === null) timer = setTimer(flush, windowMs);
    });
  }

  function flush() {
    if (timer !== null) {
      clearTimer(timer);
      timer = null;
    }
    const batch = [...queue.values()];
    queue = new Map();
    if (!batch.length) return;
    if (batch.length === 1) {
      settleSingly(batch);
      return;
    }
    sendBatch(batch.map((pending) => pending.item)).then(
      (results) => {
        if (!Array.isArray(results) || results.length !== batch.length) {
          settleSingly(batch);
          return;
        }
        batch.forEach((pending, index) => {
          const result = results[index] as any;
          // The server could not read this one; the rest of the page did
          // arrive.
          if (result && typeof result === 'object' && result.error === true) {
            settleSingly([pending]);
            return;
          }
          for (const waiter of pending.waiters) waiter.resolve(result as T);
        });
      },
      (error) => {
        if (isRouteMissing(error)) unsupportedUntil = now() + unsupportedRetryMs;
        settleSingly(batch);
      }
    );
  }

  function settleSingly(batch: Pending<T>[]) {
    for (const pending of batch) {
      let request: Promise<T>;
      try {
        request = loadSingle(pending.item);
      } catch (error) {
        request = Promise.reject(error);
      }
      request.then(
        (value) => {
          for (const waiter of pending.waiters) waiter.resolve(value);
        },
        (error) => {
          for (const waiter of pending.waiters) waiter.reject(error);
        }
      );
    }
  }
}
