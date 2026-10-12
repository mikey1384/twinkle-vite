// A same-site path with exactly one leading slash, or '' (plain text). Extra
// leading slashes would make "//example.org/x", which a browser reads as
// another site; script/data sources and backslashes never become links.
// Browsers drop tabs and newlines inside URLs and read a backslash as a
// slash, so "/\t/evil.com" or "/\\evil.com" would still open another site.
export const UNSAFE_PATH_CHARACTERS = /[\u0000-\u001F\u007F\\]/;

export function getInternalPath(src: string, normalizedSrc?: string) {
  if (/^\s*(javascript|data|vbscript):/i.test(String(src || ''))) return '';
  const path = String(normalizedSrc || '').trim();
  if (!path.startsWith('/') || UNSAFE_PATH_CHARACTERS.test(path)) return '';
  if (/^\/*[a-z][a-z0-9+.-]*:/i.test(path)) return '';
  return `/${path.replace(/^\/+/, '')}`;
}

// Only http(s) links get an href. A bare "www." link is read as https, the
// same way internal embed sources are parsed; anything else (relative paths,
// other schemes) renders as plain text.
export function getExternalLinkUrl(src: string) {
  const trimmed = String(src || '').trim();
  const candidate = /^www\./i.test(trimmed) ? `https://${trimmed}` : trimmed;
  try {
    const url = new URL(candidate);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}
