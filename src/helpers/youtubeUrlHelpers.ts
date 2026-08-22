const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export function getYouTubeVideoId(value: unknown): string {
  if (typeof value !== 'string') return '';

  const source = normalizeTwinkleEscapedUrl(
    value.trim().replace(/&amp;/gi, '&')
  );
  if (!source) return '';

  let parsedUrl: URL;
  try {
    const normalizedSource = source.startsWith('//')
      ? `https:${source}`
      : /^[a-z][a-z\d+.-]*:\/\//i.test(source)
        ? source
        : `https://${source}`;
    parsedUrl = new URL(normalizedSource);
  } catch {
    return '';
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return '';
  }

  const hostname = parsedUrl.hostname.toLowerCase().replace(/\.$/, '');
  let candidate = '';

  if (hostname === 'youtu.be' || hostname.endsWith('.youtu.be')) {
    candidate = getPathSegment(parsedUrl.pathname, 0);
  } else if (isYouTubeHostname(hostname)) {
    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
    const route = pathSegments[0]?.toLowerCase();

    if (route === 'watch') {
      candidate = parsedUrl.searchParams.get('v') || '';
    } else if (['embed', 'live', 'shorts', 'v'].includes(route)) {
      candidate = pathSegments[1] || '';
    }
  }

  return normalizeVideoId(candidate);
}

export function isYouTubeVideoUrl(value: unknown): boolean {
  return Boolean(getYouTubeVideoId(value));
}

function getPathSegment(pathname: string, index: number): string {
  return pathname.split('/').filter(Boolean)[index] || '';
}

function isYouTubeHostname(hostname: string): boolean {
  return (
    hostname === 'youtube.com' ||
    hostname.endsWith('.youtube.com') ||
    hostname === 'youtube-nocookie.com' ||
    hostname.endsWith('.youtube-nocookie.com')
  );
}

function normalizeVideoId(candidate: string): string {
  let decodedCandidate = candidate;
  try {
    decodedCandidate = decodeURIComponent(candidate);
  } catch {
    return '';
  }

  return YOUTUBE_VIDEO_ID_PATTERN.test(decodedCandidate)
    ? decodedCandidate
    : '';
}

// Twinkle's markdown protection can persist a backslash before URL characters
// that otherwise have meaning to the parser. Full RichText already restores
// these sequences; feed previews must classify that same canonical URL.
function normalizeTwinkleEscapedUrl(value: string): string {
  return value
    .replace(/%5C/gi, '\\')
    .replace(/\\=/g, '=')
    .replace(/\\-/g, '-')
    .replace(/\\_/g, '_')
    .replace(/%5F/gi, '_');
}
