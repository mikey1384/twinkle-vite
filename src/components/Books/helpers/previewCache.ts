import type { BookPreview } from '~/helpers/bookEmbedHelpers';

type Result = { book: BookPreview | null };
const previews = new Map<string, { result: Result; expiresAt: number }>();
const pending = new Map<string, Promise<Result>>();
const MAX_PREVIEWS = 100;
const FRESH_MS = 60_000;

// Public, server-confirmed metadata only. Keys include the viewing account and
// the relevant canonical subject fields; edits/deletion never reuse old data.
// The bounded lifetime covers short feed unmounts without an indefinite cache.
export function readBookPreview(key: string): Result | undefined {
  const cached = previews.get(key);
  return cached && cached.expiresAt > Date.now() ? cached.result : undefined;
}

export function invalidateBookPreview(key: string) {
  previews.delete(key);
}

export function requestBookPreview(
  key: string,
  subjectId: number,
  load: (subjectId: number) => Promise<Result>
): Promise<Result> {
  const cached = readBookPreview(key);
  if (cached) return Promise.resolve(cached);
  const existing = pending.get(key);
  if (existing) return existing;

  const request = Promise.resolve()
    .then(() => load(subjectId))
    .then((data) => {
      if (!data || (data.book !== null && data.book?.subjectId !== subjectId)) {
        throw new Error('Invalid book preview');
      }
      const previous = previews.get(key)?.result;
      const result = previous && JSON.stringify(previous) === JSON.stringify(data)
        ? previous
        : data;
      previews.delete(key);
      previews.set(key, { result, expiresAt: Date.now() + FRESH_MS });
      if (previews.size > MAX_PREVIEWS) previews.delete(previews.keys().next().value!);
      return result;
    })
    .finally(() => {
      if (pending.get(key) === request) pending.delete(key);
    });
  pending.set(key, request);
  return request;
}
