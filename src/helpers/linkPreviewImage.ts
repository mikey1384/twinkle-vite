export const LINK_PREVIEW_FALLBACK_IMAGE = '/img/twinkle-link-fallback.png';

export function resolveLinkPreviewImageSrc({
  src,
  fallbackSrc = LINK_PREVIEW_FALLBACK_IMAGE,
  cloudFrontUrl
}: {
  src: unknown;
  fallbackSrc?: string;
  cloudFrontUrl: string;
}) {
  const normalizedSrc = String(src || '').trim();
  if (!normalizedSrc) return fallbackSrc;
  if (normalizedSrc.startsWith('/thumbs')) {
    return `${cloudFrontUrl}${normalizedSrc}`;
  }
  return normalizedSrc;
}
