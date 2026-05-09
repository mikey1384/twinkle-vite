const DEFAULT_BUILD_PREVIEW_ORIGIN = 'https://preview.lumine.app';
const BUILD_PREVIEW_ORIGIN_TEMPLATE_BUILD_ID_TOKEN = '{buildId}';

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

function extractBuildIdFromPreviewPath(previewPath: string | null | undefined) {
  const normalizedPreviewPath = String(previewPath || '').trim();
  if (!normalizedPreviewPath) return null;

  try {
    const parsedPreviewUrl = new URL(
      normalizedPreviewPath,
      DEFAULT_BUILD_PREVIEW_ORIGIN
    );
    const match = parsedPreviewUrl.pathname.match(
      /^\/build\/preview\/build\/(\d+)(?:\/|$)/
    );
    const buildId = Number(match?.[1] || 0);
    return Number.isFinite(buildId) && buildId > 0 ? Math.floor(buildId) : null;
  } catch {
    return null;
  }
}

function getConfiguredBuildPreviewOriginTemplate() {
  const rawTemplate = String(
    import.meta.env.VITE_BUILD_PREVIEW_ORIGIN_TEMPLATE || ''
  ).trim();
  if (!rawTemplate.includes(BUILD_PREVIEW_ORIGIN_TEMPLATE_BUILD_ID_TOKEN)) {
    return '';
  }
  return rawTemplate;
}

function getBuildScopedPreviewOrigin(previewPath: string | null | undefined) {
  const buildId = extractBuildIdFromPreviewPath(previewPath);
  const template = getConfiguredBuildPreviewOriginTemplate();
  if (!buildId || !template) return '';

  return normalizeOrigin(
    template.replaceAll(
      BUILD_PREVIEW_ORIGIN_TEMPLATE_BUILD_ID_TOKEN,
      String(buildId)
    )
  );
}

export function getBuildPreviewOrigin(previewPath?: string | null) {
  const buildScopedPreviewOrigin = getBuildScopedPreviewOrigin(previewPath);
  if (buildScopedPreviewOrigin) return buildScopedPreviewOrigin;

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

function getPreviewSrcOrigin(previewSrc: string | null | undefined) {
  const normalizedPreviewSrc = String(previewSrc || '').trim();
  if (!normalizedPreviewSrc || typeof window === 'undefined') return '';

  try {
    return new URL(normalizedPreviewSrc, window.location.href).origin;
  } catch {
    return '';
  }
}

export function canUseSameOriginBuildPreviewSandbox(
  previewSrc: string | null | undefined
) {
  const previewSrcOrigin = getPreviewSrcOrigin(previewSrc);
  const buildScopedPreviewOrigin = getBuildScopedPreviewOrigin(previewSrc);
  return Boolean(
    previewSrcOrigin &&
      buildScopedPreviewOrigin &&
      previewSrcOrigin === buildScopedPreviewOrigin
  );
}

export function isAllowedBuildPreviewMessageOrigin({
  eventOrigin,
  previewSrc
}: {
  eventOrigin: string;
  previewSrc: string | null | undefined;
}) {
  if (eventOrigin === 'null') return true;

  const normalizedEventOrigin = normalizeOrigin(eventOrigin);
  const previewSrcOrigin = getPreviewSrcOrigin(previewSrc);
  return Boolean(
    normalizedEventOrigin &&
      previewSrcOrigin &&
      normalizedEventOrigin === previewSrcOrigin
  );
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

  const previewOrigin = getBuildPreviewOrigin(normalizedPreviewPath);
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

    const previewOrigin = getBuildPreviewOrigin(parsedPreviewSrc.pathname);
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
