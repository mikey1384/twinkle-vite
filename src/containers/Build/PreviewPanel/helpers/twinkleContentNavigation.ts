const NUMERIC_CONTENT_ROUTE_ROOTS = new Set([
  'achievement-unlocks',
  'ai-stories',
  'comments',
  'daily-reflections',
  'daily-rewards',
  'links',
  'mission-passes',
  'shared-prompts',
  'subjects'
]);

const PUBLIC_BUILD_ROUTE_ALIASES = new Map([
  ['app', 'app'],
  ['apps', 'app'],
  ['build', 'app'],
  ['builds', 'app']
]);

const TWINKLE_PUBLIC_HOSTS = new Set([
  'twin-kle.com',
  'twinkle.network',
  'www.twin-kle.com',
  'www.twinkle.network'
]);

const PREVIEW_QUERY_PARAMETERS = [
  'buildApiToken',
  'embedded',
  'previewRev',
  'twinkleBridgeLoadId'
];

export function authorizeTwinkleContentNavigation({
  currentOrigin,
  target,
  userActivation
}: {
  currentOrigin: string;
  target: unknown;
  userActivation: { isActive?: boolean } | null | undefined;
}):
  | { allowed: true; url: string }
  | { allowed: false; code: string; message: string } {
  if (userActivation?.isActive !== true) {
    return {
      allowed: false,
      code: 'USER_ACTIVATION_REQUIRED',
      message: 'Twinkle content can only be opened from a user action'
    };
  }
  const url = normalizeTwinkleContentNavigationUrl({ currentOrigin, target });
  if (!url) {
    return {
      allowed: false,
      code: 'INVALID_CONTENT_NAVIGATION_TARGET',
      message: 'Navigation target must be a Twinkle content URL'
    };
  }
  return { allowed: true, url };
}

export function createTwinkleContentNavigationConfirmationController() {
  let confirmationPending = false;

  return {
    async request({
      requestConfirmation,
      url
    }: {
      requestConfirmation:
        ((request: { url: string }) => Promise<boolean>) | null | undefined;
      url: string;
    }): Promise<
      | { confirmed: true; url: string }
      | { confirmed: false; code: string; message: string }
    > {
      if (!requestConfirmation) {
        return {
          confirmed: false,
          code: 'CONTENT_NAVIGATION_CONFIRMATION_UNAVAILABLE',
          message: 'Content navigation confirmation is unavailable'
        };
      }
      if (confirmationPending) {
        return {
          confirmed: false,
          code: 'CONTENT_NAVIGATION_CONFIRMATION_PENDING',
          message: 'Another content navigation confirmation is already open'
        };
      }

      confirmationPending = true;
      try {
        const confirmed = await requestConfirmation({ url });
        if (!confirmed) {
          return {
            confirmed: false,
            code: 'CONTENT_NAVIGATION_CANCELLED',
            message: 'Content navigation was cancelled'
          };
        }
        return { confirmed: true, url };
      } finally {
        confirmationPending = false;
      }
    }
  };
}

export function normalizeTwinkleContentNavigationUrl({
  currentOrigin,
  target
}: {
  currentOrigin: string;
  target: unknown;
}) {
  const normalizedOrigin = String(currentOrigin || '').trim();
  const normalizedTarget = String(target || '').trim();
  if (!normalizedOrigin || !normalizedTarget) return '';

  try {
    const currentUrl = new URL(normalizedOrigin);
    const targetUrl = new URL(normalizedTarget, currentUrl);
    const isCurrentOrigin = targetUrl.origin === currentUrl.origin;
    const isPublicTwinkleUrl =
      targetUrl.protocol === 'https:' &&
      TWINKLE_PUBLIC_HOSTS.has(targetUrl.hostname.toLowerCase());
    if (
      targetUrl.username ||
      targetUrl.password ||
      (!isCurrentOrigin && !isPublicTwinkleUrl)
    ) {
      return '';
    }

    const pathParts = targetUrl.pathname.split('/').filter(Boolean);
    const routeRoot = String(pathParts[0] || '').toLowerCase();
    const routeId = pathParts[1] || '';
    let canonicalPath = '';

    const canonicalBuildRoot = PUBLIC_BUILD_ROUTE_ALIASES.get(routeRoot);
    if (canonicalBuildRoot) {
      if (!isPositiveIntegerPathSegment(routeId)) return '';
      canonicalPath = `/${canonicalBuildRoot}/${pathParts.slice(1).join('/')}`;
    } else if (NUMERIC_CONTENT_ROUTE_ROOTS.has(routeRoot)) {
      if (pathParts.length !== 2 || !isPositiveIntegerPathSegment(routeId)) {
        return '';
      }
      canonicalPath = `/${routeRoot}/${routeId}`;
    } else if (routeRoot === 'videos' || routeRoot === 'playlists') {
      if (!isPositiveIntegerPathSegment(routeId)) return '';
      canonicalPath = `/${routeRoot}/${pathParts.slice(1).join('/')}`;
    } else if (routeRoot === 'users' || routeRoot === 'missions') {
      if (!routeId) return '';
      canonicalPath = `/${routeRoot}/${pathParts.slice(1).join('/')}`;
    } else if (routeRoot === 'achievements') {
      if (pathParts.length !== 2 || !routeId) return '';
      canonicalPath = `/achievements/${routeId}`;
    } else {
      canonicalPath = normalizeAiCardContentPath({ pathParts, targetUrl });
    }

    if (!canonicalPath) return '';
    targetUrl.pathname = canonicalPath;
    PREVIEW_QUERY_PARAMETERS.forEach((parameter) => {
      targetUrl.searchParams.delete(parameter);
    });
    return `${currentUrl.origin}${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
  } catch {
    return '';
  }
}

function normalizeAiCardContentPath({
  pathParts,
  targetUrl
}: {
  pathParts: string[];
  targetUrl: URL;
}) {
  const isCanonicalRoute = pathParts[0]?.toLowerCase() === 'ai-cards';
  const isLegacyChatRoute =
    pathParts[0]?.toLowerCase() === 'chat' &&
    pathParts[1]?.toLowerCase() === 'ai-cards';
  if (!isCanonicalRoute && !isLegacyChatRoute) return '';

  const pathId = isLegacyChatRoute ? pathParts[2] : pathParts[1];
  const expectedLength = pathId
    ? isLegacyChatRoute
      ? 3
      : 2
    : isLegacyChatRoute
      ? 2
      : 1;
  if (pathParts.length !== expectedLength) return '';

  const cardId = pathId || targetUrl.searchParams.get('cardId') || '';
  if (!isPositiveIntegerPathSegment(cardId)) return '';
  targetUrl.searchParams.set('cardId', cardId);
  return '/ai-cards/';
}

function isPositiveIntegerPathSegment(value: string) {
  return /^[1-9]\d*$/.test(value);
}
