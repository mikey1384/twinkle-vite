export interface BookPreview {
  subjectId: number;
  title: string;
  description: string;
  coverUrl: string | null;
  author: { id: number; username: string };
}

// `bookAvailable` is derived on the server, and only the full subject queries
// (the subject page, feed previews and subject lists) return it. Copies that
// arrive elsewhere - a comment's root subject, profile highlights, search rows,
// notifications - still mark the shared state `loaded`. Loaders that show a
// subject's description treat such a copy as incomplete and fetch the full
// subject once, so the book card appears on every route, not only on a
// direct visit. Missing, deleted and unloaded subjects are left to the normal
// load path.
export function subjectBookAvailabilityUnknown(
  contentType: string | undefined,
  state:
    | {
        loaded?: boolean;
        notFound?: boolean;
        isDeleted?: boolean | number;
        bookAvailable?: boolean | number | string | null;
      }
    | null
    | undefined
) {
  return Boolean(
    contentType === 'subject' &&
      state?.loaded &&
      !state.notFound &&
      !Number(state.isDeleted) &&
      state.bookAvailable == null
  );
}

// Website presentation only. The stored description stays clean for editing
// and for Book Maker's cover. Existing explicit self-embeds are not doubled.
export function getSubjectDisplayDescription(subject: {
  id?: number;
  contentId?: number;
  bookAvailable?: boolean | number | string | null;
  description?: string;
  content?: string;
}) {
  const description = String(subject?.description || subject?.content || '');
  const id = Number(subject?.id || subject?.contentId);
  if (
    Number(subject?.bookAvailable) !== 1 ||
    !Number.isSafeInteger(id) ||
    id <= 0
  )
    return description;
  const embeds = embedStandaloneBookLinks(description).matchAll(
    /!\[[^\]]*\]\(([^)\s]+)\)/g
  );
  if (
    Array.from(embeds).some(
      (match) => parseBookLink(match[1])?.subjectId === id
    )
  )
    return description;
  return `${description}${description ? '\n\n' : ''}![Read book](https://www.twin-kle.com/app/884/${id})`;
}

const bookHosts = new Set([
  'twin-kle.com',
  'www.twin-kle.com',
  'twinkle.network',
  'www.twinkle.network',
  'localhost',
  '127.0.0.1'
]);

// Only the reader deep link exported by Book Maker. The app root and Build
// editor still use the regular app embed. Do not trust a hostname prefix.
export function parseBookLink(
  src: string
): { subjectId: number; path: string } | null {
  try {
    if (src.startsWith('//') || /[\s\\]/.test(src)) return null;
    const url = new URL(
      src.startsWith('www.') ? `https://${src}` : src,
      'https://www.twin-kle.com'
    );
    if (
      !/^https?:$/.test(url.protocol) ||
      !bookHosts.has(url.hostname) ||
      url.username ||
      url.password
    )
      return null;
    const match = url.pathname.match(/^\/app\/884\/(\d+)(?:-[^/]+)?\/?$/);
    if (!match) return null;
    const subjectId = Number(match[1]);
    if (!Number.isSafeInteger(subjectId) || subjectId <= 0) return null;
    return { subjectId, path: `${url.pathname}${url.search}${url.hash}` };
  } catch {
    return null;
  }
}

// A book URL pasted on its own line behaves like an embed. Inline links,
// explicit markdown links, indented code and fenced examples stay as written.
// Reused before RichText rendering and feed/comment preview extraction.
export function embedStandaloneBookLinks(text: string) {
  if (!text.includes('/app/884/')) return text;
  let fence: { marker: string; length: number } | null = null;
  let htmlCode = false;
  return text
    .split('\n')
    .map((line) => {
      const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
      if (marker) {
        if (!fence) fence = { marker: marker[1][0], length: marker[1].length };
        else if (
          marker[1][0] === fence.marker &&
          marker[1].length >= fence.length &&
          !marker[2].trim()
        )
          fence = null;
        return line;
      }
      if (fence) return line;
      if (/<(?:pre|code)(?:\s|>)/i.test(line)) htmlCode = true;
      if (htmlCode) {
        if (/<\/(?:pre|code)>/i.test(line)) htmlCode = false;
        return line;
      }
      const candidate = line.match(
        /^ {0,3}((?:https?:\/\/|www\.)[^\s<>]+)\s*$/
      )?.[1];
      const book = candidate ? parseBookLink(candidate) : null;
      const path = book?.path.replace(/\(/g, '%28').replace(/\)/g, '%29');
      return book ? `![Book](https://www.twin-kle.com${path})` : line;
    })
    .join('\n');
}
