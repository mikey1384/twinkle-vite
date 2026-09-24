// Turning what someone typed into Home's Post Something field into a post:
// the first line (or sentence) is the title, the rest the description, and a
// link is shared through the link form. Nothing is rewritten.
export const POST_TITLE_MAX = 300;

export function splitPostText(text: string) {
  const value = String(text || '')
    .replace(/\r\n/g, '\n')
    .trim();
  if (!value) return { title: '', description: '' };
  const newline = value.indexOf('\n');
  let title = newline >= 0 ? value.slice(0, newline) : value;
  let rest = newline >= 0 ? value.slice(newline + 1) : '';
  if (title.length > POST_TITLE_MAX) {
    // A long first line: end the title at a sentence, else at a word.
    const head = title.slice(0, POST_TITLE_MAX);
    const sentenceEnd = Math.max(
      head.lastIndexOf('. '),
      head.lastIndexOf('? '),
      head.lastIndexOf('! ')
    );
    const cut =
      sentenceEnd >= 40 ? sentenceEnd + 1 : Math.max(head.lastIndexOf(' '), 1);
    rest = `${title.slice(cut).trim()}${rest ? `\n${rest}` : ''}`;
    title = title.slice(0, cut).trim();
  }
  return { title: title.trim(), description: rest.trim() };
}

const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>"]+/i;

// The first link in the text, and the text around it.
export function findPostLink(text: string) {
  const match = String(text || '').match(URL_PATTERN);
  if (!match) return null;
  const url = match[0].replace(/[).,!?]+$/, '');
  const rest = String(text || '')
    .replace(match[0], ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return { url, rest };
}
