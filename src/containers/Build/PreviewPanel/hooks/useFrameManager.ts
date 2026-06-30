import {
  type RefObject,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import type {
  PreviewFrameKey,
  PreviewFrameMeta,
  PreviewFrameRetiredHandler,
  PreviewSeedCacheEntry
} from '../types';
import {
  BUILD_PREVIEW_BRIDGE_LOAD_ID_QUERY_PARAM,
  canUseSameOriginBuildPreviewSandbox,
  getBuildPreviewMessageTargetOrigin
} from '~/helpers/buildPreviewOriginHelpers';

const PREVIEW_SEED_CACHE_TTL_MS = 10 * 60 * 1000;
const PREVIEW_SEED_CACHE_MAX_ENTRIES = 8;
const PREVIEW_BRIDGE_NONCE_REQUEST_TTL_MS = 35 * 1000;
const PREVIEW_TOKEN_REFRESH_QUERY_PARAMS = ['buildApiToken'];

const previewSeedCache = new Map<number, PreviewSeedCacheEntry>();

function revokePreviewUrl(src: string | null | undefined) {
  if (!src || typeof src !== 'string') return;
  try {
    URL.revokeObjectURL(src);
  } catch {
    // Blob URL cleanup is best effort.
  }
}

function prunePreviewSeedCache() {
  const now = Date.now();
  for (const [buildId, entry] of previewSeedCache.entries()) {
    if (!entry?.src || now - entry.cachedAt > PREVIEW_SEED_CACHE_TTL_MS) {
      revokePreviewUrl(entry?.src);
      previewSeedCache.delete(buildId);
    }
  }

  while (previewSeedCache.size > PREVIEW_SEED_CACHE_MAX_ENTRIES) {
    const oldest = Array.from(previewSeedCache.entries()).sort(
      (a, b) => a[1].cachedAt - b[1].cachedAt
    )[0];
    if (!oldest) break;
    revokePreviewUrl(oldest[1].src);
    previewSeedCache.delete(oldest[0]);
  }
}

function takeCachedPreviewSeed(
  buildId: number,
  codeSignature: string | null,
  expectedSrc: string | null
) {
  prunePreviewSeedCache();
  if (!codeSignature) return null;
  const entry = previewSeedCache.get(buildId);
  if (!entry) return null;
  if (entry.codeSignature !== codeSignature) return null;
  if (expectedSrc && entry.src !== expectedSrc) return null;
  previewSeedCache.delete(buildId);
  return entry;
}

function putCachedPreviewSeed(entry: PreviewSeedCacheEntry) {
  prunePreviewSeedCache();
  const existing = previewSeedCache.get(entry.buildId);
  if (existing?.src && existing.src !== entry.src) {
    revokePreviewUrl(existing.src);
  }
  previewSeedCache.set(entry.buildId, entry);
  prunePreviewSeedCache();
}

function clearCachedPreviewSeed(buildId: number) {
  const existing = previewSeedCache.get(buildId);
  if (existing?.src) {
    revokePreviewUrl(existing.src);
  }
  previewSeedCache.delete(buildId);
}

function createPreviewFrameMessageNonce() {
  try {
    const values = new Uint32Array(4);
    window.crypto.getRandomValues(values);
    return Array.from(values)
      .map((value) => value.toString(36))
      .join('');
  } catch {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  }
}

function createPreviewFrameBridgeLoadId() {
  try {
    const values = new Uint32Array(3);
    window.crypto.getRandomValues(values);
    return Array.from(values)
      .map((value) => value.toString(36))
      .join('');
  } catch {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  }
}

function createEmptyPreviewFrameMeta(): PreviewFrameMeta {
  return {
    buildId: null,
    codeSignature: null,
    messageNonce: null,
    viewerKey: null,
    bridgeLoadId: null,
    bridgeConfirmed: false,
    bridgeNonceRequestOpen: false,
    bridgeNonceRequestExpiresAt: null,
    hasLoaded: false
  };
}

function createPreviewFrameMeta({
  buildId,
  bridgeLoadId = null,
  codeSignature,
  messageNonce,
  viewerKey
}: {
  buildId: number;
  bridgeLoadId?: string | null;
  codeSignature: string | null;
  messageNonce: string | null;
  viewerKey: string;
}): PreviewFrameMeta {
  return {
    buildId,
    codeSignature,
    messageNonce,
    viewerKey,
    bridgeLoadId,
    bridgeConfirmed: false,
    bridgeNonceRequestOpen: Boolean(bridgeLoadId),
    bridgeNonceRequestExpiresAt: bridgeLoadId
      ? Date.now() + PREVIEW_BRIDGE_NONCE_REQUEST_TTL_MS
      : null,
    hasLoaded: false
  };
}

function formatPreviewFrameSrc(parsedUrl: URL, rawSrc: string) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(rawSrc)) {
    return parsedUrl.toString();
  }
  return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
}

function getParsedPreviewFrameSrc(src: string | null | undefined) {
  const trimmedSrc = String(src || '').trim();
  if (!trimmedSrc) return null;

  try {
    return new URL(trimmedSrc, window.location.href);
  } catch {
    return null;
  }
}

function normalizePreviewFrameSrcForTokenRefreshComparison(
  src: string | null | undefined
) {
  const parsedUrl = getParsedPreviewFrameSrc(src);
  if (!parsedUrl) return '';
  for (const paramName of PREVIEW_TOKEN_REFRESH_QUERY_PARAMS) {
    parsedUrl.searchParams.delete(paramName);
  }
  return parsedUrl.toString();
}

function isPreviewFrameTokenOnlyRefresh(
  previousSrc: string | null | undefined,
  nextSrc: string | null | undefined
) {
  if (!previousSrc || !nextSrc) return false;
  const previousNormalized =
    normalizePreviewFrameSrcForTokenRefreshComparison(previousSrc);
  const nextNormalized = normalizePreviewFrameSrcForTokenRefreshComparison(nextSrc);
  return (
    Boolean(previousNormalized && nextNormalized) &&
    previousNormalized === nextNormalized
  );
}

function hasPreviewFrameRefreshToken(src: string | null | undefined) {
  const parsedUrl = getParsedPreviewFrameSrc(src);
  if (!parsedUrl) return false;
  return PREVIEW_TOKEN_REFRESH_QUERY_PARAMS.some((paramName) => {
    return Boolean(String(parsedUrl.searchParams.get(paramName) || '').trim());
  });
}

function postPreviewTokenRefreshToFrame({
  previewNonce,
  previewSrc,
  targetSrc,
  targetWindow
}: {
  previewNonce: string | null;
  previewSrc: string;
  targetSrc: string | null | undefined;
  targetWindow: Window | null | undefined;
}) {
  if (!targetWindow || !previewNonce) return;
  targetWindow.postMessage(
    {
      source: 'twinkle-parent',
      type: 'preview:token-refresh',
      previewNonce,
      payload: {
        previewSrc
      }
    },
    getBuildPreviewMessageTargetOrigin(targetSrc)
  );
}

function refreshPreviewFrameNavigationQuery({
  bridgeLoadId,
  canonicalSrc,
  navigationSrc
}: {
  bridgeLoadId: string;
  canonicalSrc: string;
  navigationSrc: string;
}) {
  const parsedNavigationSrc = getParsedPreviewFrameSrc(navigationSrc);
  const parsedCanonicalSrc = getParsedPreviewFrameSrc(canonicalSrc);
  if (!parsedNavigationSrc || !parsedCanonicalSrc) {
    return appendPreviewFrameBridgeLoadId(navigationSrc, bridgeLoadId);
  }

  for (const paramName of PREVIEW_TOKEN_REFRESH_QUERY_PARAMS) {
    const nextValue = parsedCanonicalSrc.searchParams.get(paramName);
    if (nextValue === null) {
      parsedNavigationSrc.searchParams.delete(paramName);
    } else {
      parsedNavigationSrc.searchParams.set(paramName, nextValue);
    }
  }
  parsedNavigationSrc.searchParams.set(
    BUILD_PREVIEW_BRIDGE_LOAD_ID_QUERY_PARAM,
    bridgeLoadId
  );
  return formatPreviewFrameSrc(parsedNavigationSrc, navigationSrc);
}

function appendPreviewFrameBridgeLoadId(src: string, bridgeLoadId: string) {
  const trimmedSrc = String(src || '').trim();
  if (!trimmedSrc || !bridgeLoadId) return trimmedSrc;

  try {
    const parsedUrl = new URL(trimmedSrc, window.location.href);
    parsedUrl.searchParams.delete(BUILD_PREVIEW_BRIDGE_LOAD_ID_QUERY_PARAM);
    parsedUrl.searchParams.set(
      BUILD_PREVIEW_BRIDGE_LOAD_ID_QUERY_PARAM,
      bridgeLoadId
    );
    return formatPreviewFrameSrc(parsedUrl, trimmedSrc);
  } catch {
    const [withoutHash, hash = ''] = trimmedSrc.split('#');
    const [path, search = ''] = withoutHash.split('?');
    const params = new URLSearchParams(search);
    params.delete(BUILD_PREVIEW_BRIDGE_LOAD_ID_QUERY_PARAM);
    params.set(BUILD_PREVIEW_BRIDGE_LOAD_ID_QUERY_PARAM, bridgeLoadId);
    return `${path}?${params.toString()}${hash ? `#${hash}` : ''}`;
  }
}

interface UsePreviewFrameManagerArgs {
  buildId: number;
  runtimeOnly: boolean;
  previewCodeSignature: string | null;
  runtimePreviewSrc: string | null;
  viewerKey: string;
  workspacePreviewSrc: string | null;
  onPreviewFrameRetiredRef?: RefObject<PreviewFrameRetiredHandler | null>;
}

function notifyPreviewFrameRetired({
  frame,
  onPreviewFrameRetiredRef,
  primaryIframeRef,
  reason,
  secondaryIframeRef
}: {
  frame: PreviewFrameKey;
  onPreviewFrameRetiredRef?: RefObject<PreviewFrameRetiredHandler | null>;
  primaryIframeRef: RefObject<HTMLIFrameElement | null>;
  reason: 'cleared' | 'replaced' | 'runtime-reset' | 'navigated';
  secondaryIframeRef: RefObject<HTMLIFrameElement | null>;
}) {
  const sourceWindow =
    frame === 'primary'
      ? primaryIframeRef.current?.contentWindow || null
      : secondaryIframeRef.current?.contentWindow || null;
  onPreviewFrameRetiredRef?.current?.({
    frame,
    sourceWindow,
    reason
  });
}

export function useFrameManager({
  buildId,
  runtimeOnly,
  previewCodeSignature,
  runtimePreviewSrc,
  viewerKey,
  workspacePreviewSrc,
  onPreviewFrameRetiredRef
}: UsePreviewFrameManagerArgs) {
  const [activePreviewFrame, setActivePreviewFrame] =
    useState<PreviewFrameKey>('primary');
  const [previewFrameSources, setPreviewFrameSources] = useState<{
    primary: string | null;
    secondary: string | null;
  }>({
    primary: null,
    secondary: null
  });
  const [previewFrameReady, setPreviewFrameReady] = useState<{
    primary: boolean;
    secondary: boolean;
  }>({
    primary: false,
    secondary: false
  });
  const [previewTransitioning, setPreviewTransitioning] = useState(false);
  const primaryIframeRef = useRef<HTMLIFrameElement>(null);
  const secondaryIframeRef = useRef<HTMLIFrameElement>(null);
  const activePreviewFrameRef = useRef<PreviewFrameKey>('primary');
  const messageTargetFrameRef = useRef<PreviewFrameKey>('primary');
  const previewTransitioningRef = useRef(false);
  const previewFrameMetaRef = useRef<{
    primary: PreviewFrameMeta;
    secondary: PreviewFrameMeta;
  }>({
    primary: createEmptyPreviewFrameMeta(),
    secondary: createEmptyPreviewFrameMeta()
  });
  const previewFrameSourcesRef = useRef<{
    primary: string | null;
    secondary: string | null;
  }>({
    primary: null,
    secondary: null
  });
  const previewFrameReadyRef = useRef<{
    primary: boolean;
    secondary: boolean;
  }>({
    primary: false,
    secondary: false
  });
  const previewCodeSignatureRef = useRef<string | null>(null);
  const buildIdRef = useRef(buildId);
  const viewerKeyRef = useRef(viewerKey);
  const canonicalPreviewSrcRef = useRef<string | null>(null);
  const navigatePreviewFrameRef = useRef<((src: string) => string | null) | null>(
    null
  );
  const [parentNavigation, setParentNavigation] = useState<{
    src: string;
    bridgeLoadId: string;
  } | null>(null);

  const canonicalPreviewSrc = useMemo(
    () => (runtimeOnly ? runtimePreviewSrc : workspacePreviewSrc),
    [runtimeOnly, runtimePreviewSrc, workspacePreviewSrc]
  );
  const previewSrc = parentNavigation?.src || canonicalPreviewSrc;
  const previewBridgeLoadId = parentNavigation?.bridgeLoadId || null;

  useEffect(() => {
    const previousCanonicalPreviewSrc = canonicalPreviewSrcRef.current;
    if (previousCanonicalPreviewSrc === canonicalPreviewSrc) return;
    canonicalPreviewSrcRef.current = canonicalPreviewSrc;
    setParentNavigation((currentNavigation) => {
      if (
        currentNavigation &&
        canonicalPreviewSrc &&
        isPreviewFrameTokenOnlyRefresh(
          previousCanonicalPreviewSrc,
          canonicalPreviewSrc
        )
      ) {
        const bridgeLoadId = createPreviewFrameBridgeLoadId();
        const nextSrc = refreshPreviewFrameNavigationQuery({
          bridgeLoadId,
          canonicalSrc: canonicalPreviewSrc,
          navigationSrc: currentNavigation.src
        });
        return {
          src: nextSrc,
          bridgeLoadId
        };
      }
      return null;
    });
  }, [canonicalPreviewSrc]);

  useEffect(() => {
    buildIdRef.current = buildId;
  }, [buildId]);

  useEffect(() => {
    viewerKeyRef.current = viewerKey;
  }, [viewerKey]);

  useEffect(() => {
    previewCodeSignatureRef.current = previewCodeSignature;
  }, [previewCodeSignature]);

  useEffect(() => {
    const activeFrame = activePreviewFrameRef.current;
    const inactiveFrame = activeFrame === 'primary' ? 'secondary' : 'primary';
    const currentSources = previewFrameSourcesRef.current;
    let activeSrc = currentSources[activeFrame];
    let inactiveSrc = currentSources[inactiveFrame];
    let seededFromCache = false;

    if (!activeSrc && !inactiveSrc && previewCodeSignature) {
      const cached = takeCachedPreviewSeed(
        buildId,
        previewCodeSignature,
        previewSrc
      );
      if (cached?.src) {
        const seededSources = {
          ...currentSources,
          [activeFrame]: cached.src
        };
        previewFrameSourcesRef.current = seededSources;
        setPreviewFrameSources(seededSources);
        previewFrameMetaRef.current = {
          ...previewFrameMetaRef.current,
          [activeFrame]: createPreviewFrameMeta({
            buildId,
            codeSignature: cached.codeSignature || previewCodeSignature,
            messageNonce: createPreviewFrameMessageNonce(),
            viewerKey
          })
        };
        const seededReady = {
          ...previewFrameReadyRef.current,
          [activeFrame]: false
        };
        previewFrameReadyRef.current = seededReady;
        setPreviewFrameReady(seededReady);
        activeSrc = cached.src;
        messageTargetFrameRef.current = activeFrame;
        seededFromCache = true;
      }
    }

    if (!previewSrc) {
      clearCachedPreviewSeed(buildId);
      if (currentSources.primary) {
        notifyPreviewFrameRetired({
          frame: 'primary',
          onPreviewFrameRetiredRef,
          primaryIframeRef,
          reason: 'cleared',
          secondaryIframeRef
        });
      }
      if (currentSources.secondary) {
        notifyPreviewFrameRetired({
          frame: 'secondary',
          onPreviewFrameRetiredRef,
          primaryIframeRef,
          reason: 'cleared',
          secondaryIframeRef
        });
      }
      if (currentSources.primary) {
        revokePreviewUrl(currentSources.primary);
      }
      if (
        currentSources.secondary &&
        currentSources.secondary !== currentSources.primary
      ) {
        revokePreviewUrl(currentSources.secondary);
      }
      const cleared = { primary: null, secondary: null };
      previewFrameSourcesRef.current = cleared;
      setPreviewFrameSources(cleared);
      previewFrameMetaRef.current = {
        primary: createEmptyPreviewFrameMeta(),
        secondary: createEmptyPreviewFrameMeta()
      };
      const clearedReady = { primary: false, secondary: false };
      previewFrameReadyRef.current = clearedReady;
      setPreviewFrameReady(clearedReady);
      messageTargetFrameRef.current = activeFrame;
      previewTransitioningRef.current = false;
      setPreviewTransitioning(false);
      return;
    }

    if (seededFromCache) {
      revokePreviewUrl(previewSrc);
      previewTransitioningRef.current = false;
      setPreviewTransitioning(false);
      return;
    }

    if (runtimeOnly) {
      const currentPrimarySrc = currentSources.primary;
      const primaryMatchesPreviewSrc = currentPrimarySrc === previewSrc;
      const currentPrimaryMeta = previewFrameMetaRef.current.primary;
      const primaryHasTokenOnlyRefresh =
        Boolean(currentPrimarySrc) &&
        !primaryMatchesPreviewSrc &&
        isPreviewFrameTokenOnlyRefresh(currentPrimarySrc, previewSrc) &&
        hasPreviewFrameRefreshToken(currentPrimarySrc) &&
        hasPreviewFrameRefreshToken(previewSrc) &&
        canUseSameOriginBuildPreviewSandbox(currentPrimarySrc) &&
        currentPrimaryMeta.viewerKey === viewerKey &&
        currentPrimaryMeta.hasLoaded &&
        currentPrimaryMeta.bridgeConfirmed;
      const shouldPreservePrimaryFrame =
        primaryMatchesPreviewSrc || primaryHasTokenOnlyRefresh;
      const nextPrimaryNonce = shouldPreservePrimaryFrame
        ? currentPrimaryMeta.messageNonce
        : createPreviewFrameMessageNonce();
      const nextPrimarySrc = primaryHasTokenOnlyRefresh
        ? currentPrimarySrc
        : previewSrc;
      if (primaryHasTokenOnlyRefresh) {
        postPreviewTokenRefreshToFrame({
          previewNonce: currentPrimaryMeta.messageNonce,
          previewSrc,
          targetSrc: currentPrimarySrc,
          targetWindow: primaryIframeRef.current?.contentWindow
        });
      }

      if (currentPrimarySrc && !shouldPreservePrimaryFrame) {
        notifyPreviewFrameRetired({
          frame: 'primary',
          onPreviewFrameRetiredRef,
          primaryIframeRef,
          reason: 'replaced',
          secondaryIframeRef
        });
        revokePreviewUrl(currentPrimarySrc);
      }
      if (currentSources.secondary) {
        notifyPreviewFrameRetired({
          frame: 'secondary',
          onPreviewFrameRetiredRef,
          primaryIframeRef,
          reason: 'runtime-reset',
          secondaryIframeRef
        });
        if (
          currentSources.secondary !== currentPrimarySrc &&
          currentSources.secondary !== previewSrc
        ) {
          revokePreviewUrl(currentSources.secondary);
        }
      }

      const nextSources = { primary: nextPrimarySrc, secondary: null };
      previewFrameSourcesRef.current = nextSources;
      setPreviewFrameSources(nextSources);
      previewFrameMetaRef.current = {
        primary: shouldPreservePrimaryFrame
          ? {
              ...currentPrimaryMeta,
              buildId,
              codeSignature: previewCodeSignature,
              messageNonce: nextPrimaryNonce,
              viewerKey
            }
          : createPreviewFrameMeta({
              buildId,
              bridgeLoadId: previewBridgeLoadId,
              codeSignature: previewCodeSignature,
              messageNonce: nextPrimaryNonce,
              viewerKey
            }),
        secondary: createEmptyPreviewFrameMeta()
      };
      const nextReady = {
        primary: shouldPreservePrimaryFrame
          ? previewFrameReadyRef.current.primary
          : false,
        secondary: false
      };
      previewFrameReadyRef.current = nextReady;
      setPreviewFrameReady(nextReady);
      messageTargetFrameRef.current = 'primary';
      activePreviewFrameRef.current = 'primary';
      setActivePreviewFrame('primary');
      previewTransitioningRef.current = !shouldPreservePrimaryFrame;
      setPreviewTransitioning(!shouldPreservePrimaryFrame);
      return;
    }

    if (!activeSrc) {
      const nextSources = {
        ...currentSources,
        [activeFrame]: previewSrc
      };
      previewFrameSourcesRef.current = nextSources;
      setPreviewFrameSources(nextSources);
      previewFrameMetaRef.current = {
        ...previewFrameMetaRef.current,
        [activeFrame]: createPreviewFrameMeta({
          buildId,
          bridgeLoadId: previewBridgeLoadId,
          codeSignature: previewCodeSignature,
          messageNonce: createPreviewFrameMessageNonce(),
          viewerKey
        })
      };
      const nextReady = {
        ...previewFrameReadyRef.current,
        [activeFrame]: false
      };
      previewFrameReadyRef.current = nextReady;
      setPreviewFrameReady(nextReady);
      messageTargetFrameRef.current = activeFrame;
      previewTransitioningRef.current = true;
      setPreviewTransitioning(true);
      return;
    }

    if (previewSrc === activeSrc || previewSrc === inactiveSrc) {
      const reusedFrame =
        previewSrc === activeSrc ? activeFrame : inactiveFrame;
      const currentMeta = previewFrameMetaRef.current[reusedFrame];
      const nextSignature = previewCodeSignature || currentMeta?.codeSignature;
      if (
        currentMeta?.buildId !== buildId ||
        currentMeta?.codeSignature !== nextSignature ||
        currentMeta?.viewerKey !== viewerKey
      ) {
        previewFrameMetaRef.current = {
          ...previewFrameMetaRef.current,
          [reusedFrame]: {
            ...currentMeta,
            buildId,
            codeSignature: nextSignature,
            messageNonce: currentMeta?.messageNonce || null,
            viewerKey
          }
        };
      }
      return;
    }

    if (inactiveSrc && inactiveSrc !== previewSrc) {
      notifyPreviewFrameRetired({
        frame: inactiveFrame,
        onPreviewFrameRetiredRef,
        primaryIframeRef,
        reason: 'replaced',
        secondaryIframeRef
      });
      revokePreviewUrl(inactiveSrc);
    }

    const nextSources = {
      ...currentSources,
      [inactiveFrame]: previewSrc
    };
    previewFrameSourcesRef.current = nextSources;
    setPreviewFrameSources(nextSources);
    previewFrameMetaRef.current = {
      ...previewFrameMetaRef.current,
      [inactiveFrame]: createPreviewFrameMeta({
        buildId,
        bridgeLoadId: previewBridgeLoadId,
        codeSignature: previewCodeSignature,
        messageNonce: createPreviewFrameMessageNonce(),
        viewerKey
      })
    };
    const nextReady = {
      ...previewFrameReadyRef.current,
      [inactiveFrame]: false
    };
    previewFrameReadyRef.current = nextReady;
    setPreviewFrameReady(nextReady);
    messageTargetFrameRef.current = activeFrame;
    previewTransitioningRef.current = true;
    setPreviewTransitioning(true);
  }, [
    buildId,
    onPreviewFrameRetiredRef,
    previewCodeSignature,
    previewBridgeLoadId,
    previewSrc,
    primaryIframeRef,
    runtimeOnly,
    secondaryIframeRef,
    viewerKey
  ]);

  useEffect(() => {
    activePreviewFrameRef.current = activePreviewFrame;
  }, [activePreviewFrame]);

  useEffect(() => {
    previewFrameSourcesRef.current = previewFrameSources;
  }, [previewFrameSources]);

  useEffect(() => {
    previewFrameReadyRef.current = previewFrameReady;
  }, [previewFrameReady]);

  useEffect(() => {
    previewTransitioningRef.current = previewTransitioning;
  }, [previewTransitioning]);

  useEffect(() => {
    if (!runtimeOnly) return;
    if (previewFrameSourcesRef.current.secondary) {
      notifyPreviewFrameRetired({
        frame: 'secondary',
        onPreviewFrameRetiredRef,
        primaryIframeRef,
        reason: 'runtime-reset',
        secondaryIframeRef
      });
    }

    previewFrameMetaRef.current = {
      primary: createPreviewFrameMeta({
        buildId,
        codeSignature: previewCodeSignature,
        messageNonce: previewFrameMetaRef.current.primary.messageNonce,
        viewerKey: viewerKeyRef.current
      }),
      secondary: createEmptyPreviewFrameMeta()
    };
    messageTargetFrameRef.current = 'primary';
    activePreviewFrameRef.current = 'primary';
    setActivePreviewFrame('primary');
    previewTransitioningRef.current = false;
    setPreviewTransitioning(false);
    const nextReadyState = {
      primary: false,
      secondary: false
    };
    previewFrameReadyRef.current = nextReadyState;
    setPreviewFrameReady(nextReadyState);
  }, [
    buildId,
    onPreviewFrameRetiredRef,
    previewCodeSignature,
    primaryIframeRef,
    runtimeOnly,
    secondaryIframeRef
  ]);

  useEffect(() => {
    return () => {
      const activeFrame = activePreviewFrameRef.current;
      const sources = previewFrameSourcesRef.current;
      const ready = previewFrameReadyRef.current;
      const frameMeta = previewFrameMetaRef.current;
      const activeMeta = frameMeta[activeFrame];
      const activeSrc = sources[activeFrame];
      const shouldCacheActive =
        Boolean(activeSrc) &&
        ready[activeFrame] &&
        Boolean(activeMeta?.codeSignature) &&
        activeMeta?.buildId === buildIdRef.current;

      if (
        shouldCacheActive &&
        activeSrc &&
        activeMeta?.buildId &&
        activeMeta?.codeSignature
      ) {
        putCachedPreviewSeed({
          buildId: activeMeta.buildId,
          codeSignature: activeMeta.codeSignature,
          src: activeSrc,
          cachedAt: Date.now()
        });
      } else if (activeSrc) {
        revokePreviewUrl(activeSrc);
      }

      if (sources.primary && sources.primary !== activeSrc) {
        revokePreviewUrl(sources.primary);
      }
      if (sources.secondary && sources.secondary !== sources.primary) {
        if (sources.secondary !== activeSrc) {
          revokePreviewUrl(sources.secondary);
        }
      }
    };
  }, []);

  function handlePreviewFrameLoad(
    frame: 'primary' | 'secondary',
    expectedSrc: string | null
  ) {
    if (!expectedSrc) return;
    const sources = previewFrameSourcesRef.current;
    if (sources[frame] !== expectedSrc) return;
    const nextReadyState = {
      ...previewFrameReadyRef.current,
      [frame]: true
    };
    previewFrameReadyRef.current = nextReadyState;
    setPreviewFrameReady(nextReadyState);

    const loadedMeta = previewFrameMetaRef.current[frame];
    if (loadedMeta.hasLoaded) {
      notifyPreviewFrameRetired({
        frame,
        onPreviewFrameRetiredRef,
        primaryIframeRef,
        reason: 'navigated',
        secondaryIframeRef
      });
      previewFrameMetaRef.current = {
        ...previewFrameMetaRef.current,
        [frame]: {
          // Keep the nonce stable because PreviewStage uses it as the
          // iframe key/mount signal for the current browsing context.
          ...loadedMeta,
          bridgeLoadId: null,
          bridgeConfirmed: false,
          bridgeNonceRequestOpen: false,
          bridgeNonceRequestExpiresAt: null
        }
      };
    } else if (loadedMeta.bridgeNonceRequestOpen || !loadedMeta.hasLoaded) {
      previewFrameMetaRef.current = {
        ...previewFrameMetaRef.current,
        [frame]: {
          ...loadedMeta,
          hasLoaded: true
        }
      };
    }

    const activeFrame = activePreviewFrameRef.current;
    const inactiveFrame = activeFrame === 'primary' ? 'secondary' : 'primary';

    if (frame === activeFrame) {
      messageTargetFrameRef.current = frame;
      if (!sources[inactiveFrame]) {
        previewTransitioningRef.current = false;
        setPreviewTransitioning(false);
      }
      return;
    }

    const outgoingSrc = sources[activeFrame];
    if (outgoingSrc && outgoingSrc !== expectedSrc) {
      notifyPreviewFrameRetired({
        frame: activeFrame,
        onPreviewFrameRetiredRef,
        primaryIframeRef,
        reason: 'replaced',
        secondaryIframeRef
      });
    }
    setActivePreviewFrame(frame);
    activePreviewFrameRef.current = frame;
    messageTargetFrameRef.current = frame;
    previewTransitioningRef.current = false;
    setPreviewTransitioning(false);

    if (outgoingSrc && outgoingSrc !== expectedSrc) {
      revokePreviewUrl(outgoingSrc);
    }

    const nextSources = {
      ...sources,
      [activeFrame]: null
    };
    previewFrameSourcesRef.current = nextSources;
    setPreviewFrameSources(nextSources);
    previewFrameMetaRef.current = {
      ...previewFrameMetaRef.current,
      [activeFrame]: createEmptyPreviewFrameMeta()
    };
    const nextReady = {
      ...previewFrameReadyRef.current,
      [activeFrame]: false
    };
    previewFrameReadyRef.current = nextReady;
    setPreviewFrameReady(nextReady);
  }

  function navigatePreviewFrame(src: string) {
    const normalizedSrc = String(src || '').trim();
    if (!normalizedSrc) return null;

    const bridgeLoadId = createPreviewFrameBridgeLoadId();
    const nextNavigation = {
      src: appendPreviewFrameBridgeLoadId(normalizedSrc, bridgeLoadId),
      bridgeLoadId
    };
    setParentNavigation(nextNavigation);
    return nextNavigation.src;
  }
  navigatePreviewFrameRef.current = navigatePreviewFrame;

  return {
    activePreviewFrame,
    handlePreviewFrameLoad,
    messageTargetFrameRef,
    navigatePreviewFrameRef,
    previewCodeSignatureRef,
    previewFrameMetaRef,
    previewFrameReady,
    previewFrameReadyRef,
    previewFrameSources,
    previewFrameSourcesRef,
    previewSrc,
    previewTransitioning,
    previewTransitioningRef,
    primaryIframeRef,
    secondaryIframeRef
  };
}
