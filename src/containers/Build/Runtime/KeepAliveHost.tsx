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
import { useKeyContext, useViewContext } from '~/contexts';
import { trackEvent } from '~/helpers/analytics';
import BuildRuntime from '.';
import type { RuntimeBuild } from './types';

interface RuntimeSession {
  buildId: number;
  key: string;
  location: Location;
  loaded: boolean;
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

function createRuntimeSessionKey(buildId: number) {
  return `${buildId}:${Date.now().toString(36)}`;
}

function createRuntimeSession({
  buildId,
  location,
  userId
}: {
  buildId: number;
  location: Location;
  userId: number | null;
}): RuntimeSession {
  return {
    buildId,
    key: createRuntimeSessionKey(buildId),
    location,
    loaded: false,
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
            userId: currentUserId
          })
        ];
      }
      const ownedByDifferentAuthState =
        !!existing.userId && existing.userId !== currentUserId;
      const replacement = ownedByDifferentAuthState
        ? createRuntimeSession({
            buildId: activeBuildId,
            location,
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
  }, [activeBuildId, currentUserId, isRuntimeRoute, location]);

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

  function handleRuntimeBuildLoaded(build: RuntimeBuild) {
    // Only count the first load of a session that is actually for this build.
    // Must read through sessionsRef (not the closure's `sessions`): stale
    // resolves from abandoned builds arrive via old closures.
    const target = sessionsRef.current.find(
      (s) => Number(s.buildId) === Number(build.id)
    );
    if (target && !target.loaded) {
      trackEvent('build_view', {
        build_id: Number(build.id),
        build_title: String(build.title || ''),
        owner_username: String(build.username || '')
      });
    }
    setSessions((current) =>
      current.map((s) =>
        Number(s.buildId) === Number(build.id) && !s.loaded
          ? {
              ...s,
              loaded: true,
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
            data-build-runtime-keepalive-layer="true"
            data-runtime-session-loaded={s.loaded ? 'true' : 'false'}
          >
            <BuildRuntime
              key={s.key}
              buildIdOverride={s.buildId}
              locationOverride={isActive ? location : s.location}
              onRuntimeBuildLoaded={handleRuntimeBuildLoaded}
              runtimeIsActive={isActive}
            />
          </div>
        );
      })}
      {isInvalidRuntimeRoute ? (
        <div
          className={runtimeLayerClass}
          data-active="true"
          data-build-runtime-keepalive-layer="true"
          data-runtime-session-loaded="false"
        >
          <BuildRuntime
            key={`invalid:${location.pathname}`}
            buildIdOverride={null}
            locationOverride={location}
            onRuntimeBuildLoaded={handleRuntimeBuildLoaded}
            runtimeIsActive
          />
        </div>
      ) : null}
    </>
  );
}
