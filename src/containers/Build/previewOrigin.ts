const DEFAULT_BUILD_PREVIEW_ORIGIN = 'https://preview.lumine.app';

function normalizeOrigin(value: unknown) {
  const rawValue = String(value || '').trim();
  if (!rawValue) return '';

  try {
    return new URL(rawValue).origin;
  } catch {
    return '';
  }
}

function isLocalPreviewHost() {
  if (typeof window === 'undefined') return true;
  const hostname = String(window.location.hostname || '').toLowerCase();
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '[::1]' ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  );
}

export function getBuildPreviewOrigin() {
  const configuredOrigin = normalizeOrigin(
    import.meta.env.VITE_BUILD_PREVIEW_ORIGIN
  );
  if (configuredOrigin) return configuredOrigin;
  return isLocalPreviewHost() ? '' : DEFAULT_BUILD_PREVIEW_ORIGIN;
}

export function getBuildPreviewMessageTargetOrigin(
  previewSrc: string | null | undefined
) {
  void previewSrc;
  return '*';
}

export function isAllowedBuildPreviewMessageOrigin({
  eventOrigin,
  previewSrc
}: {
  eventOrigin: string;
  previewSrc: string | null | undefined;
}) {
  void previewSrc;
  return eventOrigin === 'null';
}

export function buildPreviewFrameWindowName(
  messageNonce: string | null | undefined
) {
  const normalizedMessageNonce = String(messageNonce || '').trim();
  return normalizedMessageNonce
    ? `twinkle-build-preview:${normalizedMessageNonce}`
    : undefined;
}

export function buildPreviewFrameSrc(previewPath: string) {
  const normalizedPreviewPath = String(previewPath || '').trim();
  if (!normalizedPreviewPath.startsWith('/build/preview/')) {
    return normalizedPreviewPath;
  }

  const previewOrigin = getBuildPreviewOrigin();
  return previewOrigin
    ? `${previewOrigin}${normalizedPreviewPath}`
    : normalizedPreviewPath;
}

export function normalizeAllowedBuildPreviewFrameSrc(rawPreviewSrc: string) {
  const normalizedRawPreviewSrc = String(rawPreviewSrc || '').trim();
  if (!normalizedRawPreviewSrc) return '';
  if (normalizedRawPreviewSrc.startsWith('/build/preview/')) {
    return buildPreviewFrameSrc(normalizedRawPreviewSrc);
  }

  try {
    const parsedPreviewSrc = new URL(
      normalizedRawPreviewSrc,
      typeof window === 'undefined'
        ? DEFAULT_BUILD_PREVIEW_ORIGIN
        : window.location.href
    );
    if (!parsedPreviewSrc.pathname.startsWith('/build/preview/')) {
      return '';
    }

    const previewOrigin = getBuildPreviewOrigin();
    const expectedOrigin =
      previewOrigin ||
      (typeof window === 'undefined' ? '' : window.location.origin);
    if (expectedOrigin && parsedPreviewSrc.origin !== expectedOrigin) {
      return '';
    }

    if (previewOrigin) {
      return parsedPreviewSrc.toString();
    }
    return `${parsedPreviewSrc.pathname}${parsedPreviewSrc.search}${parsedPreviewSrc.hash}`;
  } catch {
    return '';
  }
}
