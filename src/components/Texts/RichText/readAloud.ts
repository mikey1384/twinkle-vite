// Read-aloud is a capability of every long text on the site, not a Zero/Ciel
// perk. A surface opts in with RichText's `readAloud` prop (or renders
// ReadAloudButton directly); short texts never earn a speaker because a
// button under every "Congrats~" is clutter, not help.
export const READ_ALOUD_MIN_CHARS = 120;
// Zero reads non-bot text. The server treats an empty voice as Zero's.
export const READ_ALOUD_DEFAULT_VOICE = '';

// What gets spoken: links become their label or vanish (nobody wants a URL
// read letter by letter), and markdown markers are dropped.
export function readAloudText(text: unknown): string {
  return String(text || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/[*_~`#>]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isReadAloudEligible(text: unknown): boolean {
  return readAloudText(text).length >= READ_ALOUD_MIN_CHARS;
}
