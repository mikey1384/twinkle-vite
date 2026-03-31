import { useEffect, useMemo, useRef, useState } from 'react';
import type { PreviewFrameMeta, PreviewSeedCacheEntry } from './types';

const PREVIEW_SEED_CACHE_TTL_MS = 10 * 60 * 1000;
const PREVIEW_SEED_CACHE_MAX_ENTRIES = 8;

const previewSeedCache = new Map<number, PreviewSeedCacheEntry>();

function revokePreviewUrl(src: string | null | undefined) {
  if (!src || typeof src !== 'string') return;
  try {
    URL.revokeObjectURL(src);
  } catch {
    // Ignore invalid or already revoked object URLs.
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

function takeCachedPreviewSeed(buildId: number, codeSignature: string | null) {
  prunePreviewSeedCache();
  if (!codeSignature) return null;
  const entry = previewSeedCache.get(buildId);
  if (!entry) return null;
  if (entry.codeSignature !== codeSignature) return null;
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

interface UsePreviewFrameManagerArgs {
  buildId: number;
  runtimeOnly: boolean;
  previewCodeSignature: string | null;
  runtimePreviewSrc: string | null;
  workspacePreviewSrc: string | null;
}

export function usePreviewFrameManager({
  buildId,
  runtimeOnly,
  previewCodeSignature,
  runtimePreviewSrc,
  workspacePreviewSrc
}: UsePreviewFrameManagerArgs) {
  const [activePreviewFrame, setActivePreviewFrame] = useState<
    'primary' | 'secondary'
  >('primary');
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
  const activePreviewFrameRef = useRef<'primary' | 'secondary'>('primary');
  const messageTargetFrameRef = useRef<'primary' | 'secondary'>('primary');
  const previewTransitioningRef = useRef(false);
  const previewFrameMetaRef = useRef<{
    primary: PreviewFrameMeta;
    secondary: PreviewFrameMeta;
  }>({
    primary: { buildId: null, codeSignature: null },
    secondary: { buildId: null, codeSignature: null }
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

  const previewSrc = useMemo(
    () => (runtimeOnly ? runtimePreviewSrc : workspacePreviewSrc),
    [runtimeOnly, runtimePreviewSrc, workspacePreviewSrc]
  );

  useEffect(() => {
    buildIdRef.current = buildId;
  }, [buildId]);

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
      const cached = takeCachedPreviewSeed(buildId, previewCodeSignature);
      if (cached?.src) {
        const seededSources = {
          ...currentSources,
          [activeFrame]: cached.src
        };
        previewFrameSourcesRef.current = seededSources;
        setPreviewFrameSources(seededSources);
        previewFrameMetaRef.current = {
          ...previewFrameMetaRef.current,
          [activeFrame]: {
            buildId,
            codeSignature: cached.codeSignature || previewCodeSignature
          }
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
        primary: { buildId: null, codeSignature: null },
        secondary: { buildId: null, codeSignature: null }
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

    if (!activeSrc) {
      const nextSources = {
        ...currentSources,
        [activeFrame]: previewSrc
      };
      previewFrameSourcesRef.current = nextSources;
      setPreviewFrameSources(nextSources);
      previewFrameMetaRef.current = {
        ...previewFrameMetaRef.current,
        [activeFrame]: {
          buildId,
          codeSignature: previewCodeSignature
        }
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
        currentMeta?.codeSignature !== nextSignature
      ) {
        previewFrameMetaRef.current = {
          ...previewFrameMetaRef.current,
          [reusedFrame]: {
            buildId,
            codeSignature: nextSignature
          }
        };
      }
      return;
    }

    if (inactiveSrc && inactiveSrc !== previewSrc) {
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
      [inactiveFrame]: {
        buildId,
        codeSignature: previewCodeSignature
      }
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
  }, [buildId, previewCodeSignature, previewSrc]);

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

    previewFrameMetaRef.current = {
      primary: {
        buildId,
        codeSignature: previewCodeSignature
      },
      secondary: {
        buildId: null,
        codeSignature: null
      }
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
  }, [buildId, previewCodeSignature, runtimeOnly]);

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
      [activeFrame]: {
        buildId: null,
        codeSignature: null
      }
    };
    const nextReady = {
      ...previewFrameReadyRef.current,
      [activeFrame]: false
    };
    previewFrameReadyRef.current = nextReady;
    setPreviewFrameReady(nextReady);
  }

  return {
    activePreviewFrame,
    handlePreviewFrameLoad,
    messageTargetFrameRef,
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
