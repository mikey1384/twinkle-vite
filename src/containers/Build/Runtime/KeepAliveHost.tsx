import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { css } from '@emotion/css';
import {
  matchPath,
  type Location,
  useLocation,
  useNavigate
} from 'react-router-dom';
import { useAppContext, useKeyContext, useViewContext } from '~/contexts';
import {
  BUILD_RUNTIME_KEEPALIVE_LAYER_ATTR,
  BUILD_RUNTIME_SESSION_LOADED_ATTR
} from '~/constants/appShell';
import { trackEvent } from '~/helpers/analytics';
import {
  getBuildRuntimeSourceFromSearch,
  type BuildRuntimeSource
} from '~/helpers/buildRuntimeSource';
import BuildRuntime from '.';
import type { RuntimeBuild } from './types';
import { getActiveBuildViewEvent } from './helpers/buildViewTracking';
import {
  getBuildViewAnalyticsParams,
  type BuildViewAnalyticsPayload
} from '~/helpers/buildViewAnalytics';

interface RuntimeSession {
  buildId: number;
  buildView: BuildViewAnalyticsPayload | null;
  buildViewTracked: boolean;
  key: string;
  location: Location;
  loaded: boolean;
  publishedVersionId: number | null;
  runtimeSource: BuildRuntimeSource;
  title: string;
  userId: number | null;
}

interface RuntimeRouteMatch {
  buildId: number | null;
}

const runtimeLayerClass = css`
  position: fixed;
  /* Sit BELOW the global header when it is shown (desktop app pages) and ABOVE
     the fixed bottom nav on phones. Both offset vars are 0 when their bar is
     hidden — desktop has no bottom bar, phones have no top offset, and the
     build "super full screen" collapse hides the nav so both go to 0 (app fills
     the screen). */
  inset: var(--app-shell-top-offset, 0px) 0 var(--app-shell-bottom-offset, 0px)
    0;
  overflow: hidden;
  background: #fff;
  z-index: 70;

  &[data-active='false'] {
    opacity: 0;
    pointer-events: none;
    visibility: hidden;
  }

  &[data-active='true'] {
    opacity: 1;
    pointer-events: auto;
    visibility: visible;
  }
`;

function createRuntimeSessionKey(
  buildId: number,
  runtimeSource: BuildRuntimeSource
) {
  return `${buildId}:${runtimeSource}:${Date.now().toString(36)}`;
}

function createRuntimeSession({
  buildId,
  location,
  runtimeSource,
  userId
}: {
  buildId: number;
  location: Location;
  runtimeSource: BuildRuntimeSource;
  userId: number | null;
}): RuntimeSession {
  return {
    buildId,
    buildView: null,
    buildViewTracked: false,
    key: createRuntimeSessionKey(buildId, runtimeSource),
    location,
    loaded: false,
    publishedVersionId: null,
    runtimeSource,
    title: 'Build App',
    userId
  };
}

function getRuntimeRouteMatch(pathname: string): RuntimeRouteMatch | null {
  // The trailing splat is an app-defined shareable deep link
  // (e.g. /app/884/432-the-great-gatsby) parsed by the build itself; the host
  // only needs the buildId here. The build reads the segment from its location.
  const match = matchPath({ path: '/app/:buildId/*', end: true }, pathname);
  if (!match) return null;
  const rawBuildId = String(match.params.buildId || '').trim();
  const buildId = Number(rawBuildId);
  return {
    buildId:
      /^\d+$/.test(rawBuildId) &&
      Number.isSafeInteger(buildId) &&
      buildId > 0
        ? buildId
        : null
  };
}

export default function BuildRuntimeKeepAliveHost() {
  const location = useLocation();
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
  // Explicit "tear down this app's running session" request, raised by every
  // real tab-close path (the runtime "Close app" button and MainNavs's tab
  // removal). Preferred over deriving teardown from tab existence because
  // MainNavs — the tab owner — is unmounted on mobile /app routes, so tab
  // state lags exactly when a close happens.
  const killBuildAppSession = useViewContext(
    (v) => v.state.killBuildAppSession
  );
  const buildAppNavTabIds = useViewContext((v) => v.state.buildAppNavTabIds);
  const lastHandledKillNonceRef = useRef(killBuildAppSession?.nonce || 0);
  const runtimeRouteMatch = useMemo(
    () => getRuntimeRouteMatch(location.pathname),
    [location.pathname]
  );
  const activeBuildId = runtimeRouteMatch?.buildId || null;
  const isRuntimeRoute = Boolean(runtimeRouteMatch);
  const activeRuntimeSource = useMemo(
    () => getBuildRuntimeSourceFromSearch(location.search),
    [location.search]
  );
  // One session PER opened build app, each kept mounted (hidden) while another
  // tab is active. A single slot only kept the last-viewed app alive, so
  // switching build tab -> build tab tore the previous one down and reloaded it
  // on return; holding a session per build keeps them all warm. Sessions are
  // added on entering a build route and removed on explicit tab close
  // (killBuildAppSession) or auth change.
  const [sessions, setSessions] = useState<RuntimeSession[]>([]);
  // Latest-sessions ref for handleRuntimeBuildLoaded / kill teardown: the
  // runtime's load effect has no cancellation, so a stale build's resolve
  // invokes an OLD closure of that callback. The ref object is stable across
  // renders, so even stale closures read the current sessions through it.
  const sessionsRef = useRef<RuntimeSession[]>([]);
  sessionsRef.current = sessions;
  const currentUserId = Number(userId) || null;

  const activeSession = useMemo(
    () =>
      isRuntimeRoute && activeBuildId
        ? sessions.find((s) => Number(s.buildId) === Number(activeBuildId)) ||
          null
        : null,
    [activeBuildId, isRuntimeRoute, sessions]
  );

  useLayoutEffect(() => {
    if (!isRuntimeRoute || !activeBuildId) return;
    setSessions((current) => {
      const existing = current.find((s) => s.buildId === activeBuildId);
      if (!existing) {
        return [
          ...current,
          createRuntimeSession({
            buildId: activeBuildId,
            location,
            runtimeSource: activeRuntimeSource,
            userId: currentUserId
          })
        ];
      }
      const ownedByDifferentAuthState =
        !!existing.userId && existing.userId !== currentUserId;
      const sourceChanged = existing.runtimeSource !== activeRuntimeSource;
      const replacement = ownedByDifferentAuthState || sourceChanged
        ? createRuntimeSession({
            buildId: activeBuildId,
            location,
            runtimeSource: activeRuntimeSource,
            userId: currentUserId
          })
        : {
            ...existing,
            location,
            userId: existing.userId || currentUserId
          };
      return current.map((s) =>
        s.buildId === activeBuildId ? replacement : s
      );
    });
  }, [
    activeBuildId,
    activeRuntimeSource,
    currentUserId,
    isRuntimeRoute,
    location
  ]);

  // Publish freshness: a kept-alive published-app session can outlive a new
  // publish (update in the workspace, come back to the app tab -> old build).
  // Re-entering the app route is a natural reload boundary, so verify the
  // published version there and discard the stale session when it moved on.
  // The probe must be the dedicated published-version endpoint: the runtime
  // endpoint records a view for published fetches, and the workspace loader
  // returns no build (only an access redirect) for public non-owner visitors
  // while running heavy owner-only side effects for owners.
  const loadBuildPublishedVersion = useAppContext(
    (v) => v.requestHelpers.loadBuildPublishedVersion
  );
  const loadBuildPublishedVersionRef = useRef(loadBuildPublishedVersion);
  loadBuildPublishedVersionRef.current = loadBuildPublishedVersion;
  useEffect(() => {
    if (!isRuntimeRoute || !activeBuildId) return;
    const session = sessionsRef.current.find(
      (s) => s.buildId === activeBuildId
    );
    // A loaded published session with a null version is a legacy build served
    // through the build.code fallback (no artifact snapshot). It must still
    // be probed: when its owner later publishes a modern snapshot, the live
    // version moves null -> id and the kept session below refreshes. A
    // still-legacy build compares null === null and keeps its session.
    if (!session || !session.loaded || session.runtimeSource !== 'published') {
      return;
    }
    let cancelled = false;
    const staleKey = session.key;
    const loadedVersion = session.publishedVersionId;
    (async () => {
      try {
        const data = await loadBuildPublishedVersionRef.current(activeBuildId);
        if (cancelled) return;
        // Only a well-formed 2xx body is canonical; anything else (errors
        // reject into the catch, malformed proxy bodies land here) keeps the
        // session. A confirmed null is a real revocation: the owner
        // unpublished, so the session must not keep serving the old app —
        // replace it and let the fresh load surface the canonical runtime
        // response (403 error for visitors, workspace fallback for the owner).
        if (!data || typeof data !== 'object') return;
        if (!('publishedArtifactVersionId' in data)) return;
        const liveVersion =
          Number(data.publishedArtifactVersionId) || null;
        if (liveVersion === loadedVersion) return;
        setSessions((current) =>
          current.map((s) =>
            s.key === staleKey && s.publishedVersionId === loadedVersion
              ? createRuntimeSession({
                  buildId: s.buildId,
                  location: s.location,
                  runtimeSource: s.runtimeSource,
                  userId: s.userId
                })
              : s
          )
        );
      } catch {
        // Version check is best-effort; the kept session stays up on failure.
      }
    })();
    return () => {
      cancelled = true;
    };
     
  }, [activeBuildId, isRuntimeRoute]);

  // Auth reconciliation (mirrors the single-session version, applied per
  // session): adopt the current user for anon sessions; drop any background
  // session that belongs to a now-signed-out or different user. The active
  // runtime session is reconciled by the layout effect above so it can be
  // replaced in-place without blanking the visible route.
  useEffect(() => {
    setSessions((current) => {
      let changed = false;
      const next: RuntimeSession[] = [];
      for (const s of current) {
        if (isRuntimeRoute && Number(s.buildId) === Number(activeBuildId)) {
          next.push(s);
          continue;
        }
        if (!s.userId) {
          if (currentUserId) {
            next.push({ ...s, userId: currentUserId });
            changed = true;
          } else {
            next.push(s);
          }
          continue;
        }
        if (!currentUserId || s.userId !== currentUserId) {
          changed = true;
          continue;
        }
        next.push(s);
      }
      return changed ? next : current;
    });
  }, [activeBuildId, currentUserId, isRuntimeRoute]);

  // Never keep a half-loaded session alive in the background: if we leave the
  // runtime area while a session never finished loading, discard it (it would
  // otherwise linger as a stuck, blank hidden layer).
  useEffect(() => {
    if (isRuntimeRoute) return;
    setSessions((current) => {
      const next = current.filter((s) => s.loaded);
      return next.length === current.length ? current : next;
    });
  }, [isRuntimeRoute, sessions]);

  // Once the nav owner has published a reliable app-tab list, hidden runtime
  // sessions without a corresponding tab are unreachable. Tear them down
  // instead of keeping invisible iframes running forever.
  useEffect(() => {
    if (buildAppNavTabIds === null) return;
    const reachableBuildIds = new Set(buildAppNavTabIds);
    setSessions((current) => {
      let changed = false;
      const next = current.filter((s) => {
        if (isRuntimeRoute && Number(activeBuildId) === Number(s.buildId)) {
          return true;
        }
        const reachable = reachableBuildIds.has(String(s.buildId));
        if (!reachable) changed = true;
        return reachable;
      });
      return changed ? next : current;
    });
  }, [activeBuildId, buildAppNavTabIds, isRuntimeRoute]);

  // Explicit teardown: the user closed a build tab (runtime "Close app" button
  // or tab removal). Process each request once via its monotonic nonce so a
  // stale request can't kill a freshly reopened app; read the live sessions
  // through the ref. If the killed app IS the one on screen (desktop removing
  // the active tab), navigate away too — otherwise dropping its session would
  // blank the /app route.
  useEffect(() => {
    if (!killBuildAppSession) return;
    if (killBuildAppSession.nonce === lastHandledKillNonceRef.current) return;
    lastHandledKillNonceRef.current = killBuildAppSession.nonce;
    const killBuildId = Number(killBuildAppSession.buildAppId);
    const hadSession = sessionsRef.current.some(
      (s) => Number(s.buildId) === killBuildId
    );
    if (!hadSession) return;
    const killingActiveRoute =
      isRuntimeRoute && Number(activeBuildId) === killBuildId;
    setSessions((current) =>
      current.filter((s) => Number(s.buildId) !== killBuildId)
    );
    if (killingActiveRoute) {
      navigate('/build', { replace: true });
    }
  }, [killBuildAppSession, isRuntimeRoute, activeBuildId, navigate]);

  // Header skips document.title writes on /app routes, so the runtime owns the
  // title while it is the active route. Header overwrites it on exit.
  const activeSessionLoaded = activeSession?.loaded || false;
  const activeSessionTitle = activeSession?.title || '';
  useEffect(() => {
    if (!isRuntimeRoute) return;
    document.title = activeSessionLoaded
      ? `${activeSessionTitle} | Twinkle`
      : 'Build App | Twinkle';
  }, [isRuntimeRoute, activeSessionLoaded, activeSessionTitle]);

  useEffect(() => {
    const buildView = getActiveBuildViewEvent({
      activeBuildId,
      isRuntimeRoute,
      session: activeSession
    });
    if (!buildView || !activeSession) return;

    trackEvent('build_view', getBuildViewAnalyticsParams(buildView));
    const trackedSessionKey = activeSession.key;
    setSessions((current) =>
      current.map((session) =>
        session.key === trackedSessionKey
          ? { ...session, buildViewTracked: true }
          : session
      )
    );
  }, [activeBuildId, activeSession, isRuntimeRoute]);

  function handleRuntimeBuildLoaded(
    sessionKey: string,
    build: RuntimeBuild,
    runtimeSource: BuildRuntimeSource
  ) {
    // Must read through sessionsRef (not the closure's `sessions`): stale
    // resolves from abandoned builds arrive via old closures. Store canonical
    // analytics identity with the loaded session; the active-session effect
    // above emits the view only once the user can actually see this app.
    const target = sessionsRef.current.find((s) => s.key === sessionKey);
    if (!target || target.runtimeSource !== runtimeSource) return;
    const loadedBuildId = Number(build.id);
    if (loadedBuildId !== target.buildId) return;
    setSessions((current) =>
      current.map((s) =>
        s.key === sessionKey && !s.loaded
          ? {
              ...s,
              buildView:
                runtimeSource === 'published'
                  ? {
                      buildId: loadedBuildId,
                      buildTitle: String(build.title || ''),
                      ownerUsername: String(build.username || '')
                    }
                  : null,
              loaded: true,
              publishedVersionId: Number(build.publishedArtifactVersionId) || null,
              title: String(build.title || 'Build App')
            }
          : s
      )
    );
  }

  const isInvalidRuntimeRoute = isRuntimeRoute && !activeBuildId;

  if (sessions.length === 0 && !isInvalidRuntimeRoute) return null;

  return (
    <>
      {sessions.map((s) => {
        const isActive =
          isRuntimeRoute && Number(activeBuildId) === Number(s.buildId);
        return (
          <div
            key={s.key}
            className={runtimeLayerClass}
            data-active={isActive ? 'true' : 'false'}
            {...{
              // Shared with clientUpdate.ts's unsaved-work gate: a loaded
              // layer blocks silent client-update reloads (opaque iframe
              // state). Keep the attribute names in ~/constants/appShell.
              [BUILD_RUNTIME_KEEPALIVE_LAYER_ATTR]: 'true',
              [BUILD_RUNTIME_SESSION_LOADED_ATTR]: s.loaded ? 'true' : 'false'
            }}
          >
            <BuildRuntime
              key={s.key}
              buildIdOverride={s.buildId}
              locationOverride={isActive ? location : s.location}
              onRuntimeBuildLoaded={(build, runtimeSource) =>
                handleRuntimeBuildLoaded(s.key, build, runtimeSource)
              }
              runtimeIsActive={isActive}
            />
          </div>
        );
      })}
      {isInvalidRuntimeRoute ? (
        <div
          className={runtimeLayerClass}
          data-active="true"
          {...{
            [BUILD_RUNTIME_KEEPALIVE_LAYER_ATTR]: 'true',
            [BUILD_RUNTIME_SESSION_LOADED_ATTR]: 'false'
          }}
        >
          <BuildRuntime
            key={`invalid:${location.pathname}`}
            buildIdOverride={null}
            locationOverride={location}
            onRuntimeBuildLoaded={() => {}}
            runtimeIsActive
          />
        </div>
      ) : null}
    </>
  );
}
