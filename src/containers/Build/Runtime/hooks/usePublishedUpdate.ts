import { useEffect, useRef, useState } from 'react';
import { socket } from '~/constants/sockets/api';
import { askReloadVersion } from '~/containers/Build/PreviewPanel/helpers/buildRuntimeLand';

// Check only the visible app, with jitter so a release does not synchronize
// every player's next request against the writer database.
const POLL_MIN_MS = 2 * 60 * 1000;
const POLL_JITTER_MS = 30 * 1000;
const MIN_CHECK_GAP_MS = 5000;

interface UpdateNotice {
  sessionKey: string;
  versionId: number;
  dismissed: boolean;
}

/** undefined is an invalid/error response; null is a confirmed unpublish. */
export function publishedVersionFromResponse(data: unknown): number | null | undefined {
  if (!data || typeof data !== 'object' || !('publishedArtifactVersionId' in data)) {
    return undefined;
  }
  const version = (data as { publishedArtifactVersionId?: unknown }).publishedArtifactVersionId;
  if (version === null) return null;
  return typeof version === 'number' && Number.isSafeInteger(version) && version > 0
    ? version
    : undefined;
}

export function usePublishedUpdate({
  buildId,
  sessionKey,
  loadedVersion,
  enabled,
  loadVersion,
  onUnpublished
}: {
  buildId: number | null;
  sessionKey: string | null;
  loadedVersion: number | null;
  enabled: boolean;
  loadVersion: (buildId: number) => Promise<unknown>;
  onUnpublished: (sessionKey: string, loadedVersion: number) => void;
}) {
  const [notice, setNotice] = useState<UpdateNotice | null>(null);
  const loadRef = useRef(loadVersion);
  const unpublishRef = useRef(onUnpublished);
  loadRef.current = loadVersion;
  unpublishRef.current = onUnpublished;

  useEffect(() => {
    if (!enabled || !buildId || !sessionKey) return;
    const activeBuildId = buildId;
    const activeSessionKey = sessionKey;
    let stopped = false;
    let inFlight = false;
    let followUp = false;
    let lastStartedAt: number | null = null;
    let deferred: number | null = null;

    // "Later" lasts until the player leaves and returns to this app (or the
    // browser returns from the background), so it is not a permanent hide.
    setNotice((current) => current?.sessionKey === activeSessionKey
      ? { ...current, dismissed: false }
      : null);

    function requestCheck() {
      if (stopped || document.visibilityState === 'hidden') return;
      if (inFlight) {
        followUp = true;
        return;
      }
      if (deferred !== null) return;
      const wait = lastStartedAt === null
        ? 0
        : Math.max(0, lastStartedAt + MIN_CHECK_GAP_MS - Date.now());
      if (wait > 0) {
        deferred = window.setTimeout(() => {
          deferred = null;
          requestCheck();
        }, wait);
        return;
      }
      inFlight = true;
      lastStartedAt = Date.now();
      void Promise.resolve().then(() => loadRef.current(activeBuildId)).then((response) => {
        if (stopped) return;
        const published = publishedVersionFromResponse(response);
        if (published === undefined) return;
        if (published === loadedVersion) {
          setNotice((current) => current?.sessionKey === activeSessionKey ? null : current);
          return;
        }
        // Keep the existing access behavior for an app that was unpublished.
        if (published === null) {
          if (loadedVersion !== null) unpublishRef.current(activeSessionKey, loadedVersion);
          return;
        }
        setNotice((current) =>
          current?.sessionKey === activeSessionKey && current.versionId === published
            ? current
            : { sessionKey: activeSessionKey, versionId: published, dismissed: false }
        );
      }).catch(() => {
        // Network errors are not evidence of a new version or an unpublish.
      }).finally(() => {
        inFlight = false;
        if (followUp && !stopped) {
          followUp = false;
          requestCheck();
        }
      });
    }

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') return;
      setNotice((current) => current?.sessionKey === activeSessionKey
        ? { ...current, dismissed: false }
        : current);
      requestCheck();
    };
    // The server says a new version went live (land and multiplayer apps): show
    // the same notice now. Its version is authoritative, so no read is needed
    // (a lagging replica could otherwise answer with the old version).
    const onAppUpdated = (event: unknown) => {
      if (stopped) return;
      const latest = askReloadVersion({ event, buildId: activeBuildId, loadedVersion });
      if (latest === null) return;
      setNotice((current) =>
        current?.sessionKey === activeSessionKey && current.versionId === latest
          ? current
          : { sessionKey: activeSessionKey, versionId: latest, dismissed: false }
      );
    };
    socket.on('build_app_updated', onAppUpdated);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', requestCheck);
    window.addEventListener('pageshow', requestCheck);
    window.addEventListener('online', requestCheck);
    const interval = window.setInterval(
      requestCheck,
      POLL_MIN_MS + Math.floor(Math.random() * POLL_JITTER_MS)
    );
    requestCheck();
    return () => {
      stopped = true;
      socket.off('build_app_updated', onAppUpdated);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', requestCheck);
      window.removeEventListener('pageshow', requestCheck);
      window.removeEventListener('online', requestCheck);
      window.clearInterval(interval);
      if (deferred !== null) window.clearTimeout(deferred);
    };
  }, [buildId, enabled, loadedVersion, sessionKey]);

  return {
    available: Boolean(enabled && notice?.sessionKey === sessionKey && !notice.dismissed),
    dismiss() {
      setNotice((current) => current?.sessionKey === sessionKey
        ? { ...current, dismissed: true }
        : current);
    }
  };
}
