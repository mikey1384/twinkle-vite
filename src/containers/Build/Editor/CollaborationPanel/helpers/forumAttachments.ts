import { getFileInfoFromFileName } from '~/helpers/stringHelpers';

// Team Forum attachments travel in the post body as the website's shared
// embed markup, ![name](url), pointing at a file the shared embed upload
// stored (attachments/embed/<uuid>/<name>). The API accepts only the
// poster's own verified uploads in that shape (twinkle-api
// controllers/build/services/forumAttachments.ts) and RichText renders them.

export const FORUM_ATTACHMENT_MAX_COUNT = 10;

const FORUM_EMBED_PATTERN =
  /!\[([^[\]\n]{0,255})\]\((https:\/\/[^\s()<>]+\/attachments\/embed\/[^\s()<>]+)\)/g;

export function buildForumAttachmentMarkup({
  fileName,
  url
}: {
  fileName: string;
  url: string;
}) {
  // The name shows on file cards and is what agents read; keep it to one
  // line of text the Markdown can hold. "secret" is RichText's spoiler-image
  // marker, so it never stands alone as a name.
  let name = String(fileName || '')
    .replace(/[[\]\n\r()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
  if (name.toLowerCase() === 'secret') name = `${name} file`;
  return `![${name}](${url})`;
}

// One line for list previews and reply quotes: the typed words, or what was
// sent when the post is only attachments.
export function summarizeForumBody(body?: string | null) {
  const value = String(body || '');
  const text = value
    .replace(FORUM_EMBED_PATTERN, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text) return text;
  const kinds = Array.from(value.matchAll(FORUM_EMBED_PATTERN)).map((match) => {
    let storedName = '';
    try {
      storedName = decodeURIComponent(match[2].split('/').pop() || '');
    } catch {
      storedName = '';
    }
    return getFileInfoFromFileName(storedName || match[1]).fileType === 'image'
      ? 'image'
      : 'file';
  });
  if (!kinds.length) return '';
  const imageCount = kinds.filter((kind) => kind === 'image').length;
  const fileCount = kinds.length - imageCount;
  if (fileCount === 0) {
    return imageCount === 1 ? 'sent an image' : `sent ${imageCount} images`;
  }
  if (imageCount === 0) {
    return fileCount === 1 ? 'sent a file' : `sent ${fileCount} files`;
  }
  return `sent ${kinds.length} attachments`;
}

export interface ForumComposerAttachment {
  markup: string;
  name: string;
  url: string;
  isImage: boolean;
}

// The composer shows what the member types in the text box and the
// attachments as chips under it; the post body is the two joined, text
// first, one embed per line.
export function splitForumComposerValue(value: string): {
  text: string;
  attachments: ForumComposerAttachment[];
} {
  const body = String(value || '');
  const attachments = Array.from(body.matchAll(FORUM_EMBED_PATTERN)).map(
    (match) => {
      let storedName = '';
      try {
        storedName = decodeURIComponent(match[2].split('/').pop() || '');
      } catch {
        storedName = '';
      }
      return {
        markup: match[0],
        name: match[1].trim() || storedName || 'file',
        url: match[2],
        isImage:
          getFileInfoFromFileName(storedName || match[1]).fileType === 'image'
      };
    }
  );
  if (!attachments.length) return { text: body, attachments };
  const block = attachments.map((item) => item.markup).join('\n');
  if (body === block) return { text: '', attachments };
  if (body.endsWith(`\n${block}`)) {
    return { text: body.slice(0, -block.length - 1), attachments };
  }
  return {
    text: body.replace(FORUM_EMBED_PATTERN, '').replace(/\n{3,}/g, '\n\n'),
    attachments
  };
}

export function joinForumComposerValue(text: string, markups: string[]) {
  if (!markups.length) return text;
  const block = markups.join('\n');
  return text ? `${text}\n${block}` : block;
}
