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
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import { mobileMaxWidth, tabletMaxWidth } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import BuildRuntime from '.';
import type { RuntimeBuild } from './types';

interface RuntimeSession {
  buildId: number;
  key: string;
  path: string;
  location: Location;
  loaded: boolean;
  title: string;
  thumbnailUrl: string | null;
  username: string;
  openedAt: number;
  userId: number | null;
}

interface DragStart {
  pointerId: number;
  offsetX: number;
  offsetY: number;
  startX: number;
  startY: number;
  moved: boolean;
}

interface RuntimeRouteMatch {
  buildId: number | null;
}

const runtimeLayerClass = css`
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100dvh;
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

const trayClass = css`
  position: fixed;
  right: 1rem;
  bottom: calc(1rem + env(safe-area-inset-bottom));
  z-index: 90;
  width: min(34rem, calc(100vw - 2rem));
  border: 1px solid rgba(148, 163, 184, 0.55);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.18);
  color: #18202a;
  overflow: hidden;
  backdrop-filter: blur(8px);
  touch-action: none;

  &[data-positioned='true'] {
    right: auto;
    bottom: auto;
  }

  &[data-collapsed='true'] {
    display: inline-flex;
    align-items: center;
    width: auto;
    min-width: 17rem;
    border-radius: 999px;
  }

  @media (max-width: ${tabletMaxWidth}) {
    width: min(31rem, calc(100vw - 1.5rem));
  }

  @media (max-width: ${mobileMaxWidth}) {
    left: auto;
    right: 0.75rem;
    top: auto;
    bottom: calc(
      var(--mobile-nav-height, 7rem) + 0.75rem + env(safe-area-inset-bottom)
    );
    width: min(50vw, calc(100vw - 1.5rem));
    min-width: 18rem;
    border-radius: 16px;

    &[data-positioned='true'] {
      right: auto;
      bottom: auto;
    }

    &[data-collapsed='true'] {
      display: flex;
      min-width: 0;
      border-radius: 999px;
    }
  }
`;

const trayHeaderClass = css`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-height: 4.2rem;
  padding: 0.65rem 0.75rem 0.65rem 0.9rem;
  cursor: grab;
  user-select: none;
  border-bottom: 1px solid rgba(148, 163, 184, 0.22);

  &:active {
    cursor: grabbing;
  }
`;

const trayTitleStackClass = css`
  min-width: 0;
  flex: 1;
`;

const trayKickerClass = css`
  margin: 0;
  color: #667085;
  font-size: 1.1rem;
  font-weight: 800;
  line-height: 1.2;
`;

const trayTitleClass = css`
  margin: 0.12rem 0 0;
  font-size: 1.15rem;
  font-weight: 900;
  line-height: 1.22;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const trayControlsClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
`;

const trayIconButtonClass = css`
  width: 2.45rem;
  height: 2.45rem;
  border: 1px solid rgba(148, 163, 184, 0.45);
  border-radius: 999px;
  background: #fff;
  color: #344054;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.1rem;

  &:hover {
    background: #f4f7fb;
  }
`;

const trayBodyClass = css`
  display: grid;
  grid-template-columns: 5.5rem minmax(0, 1fr);
  gap: 0.8rem;
  padding: 0.85rem;
  align-items: center;

  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 4.8rem minmax(0, 1fr);
    padding: 0.75rem;
  }
`;

const thumbnailClass = css`
  width: 5.5rem;
  height: 4rem;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: #eef5f3;
  object-fit: cover;
  display: block;

  @media (max-width: ${mobileMaxWidth}) {
    width: 4.8rem;
    height: 3.4rem;
  }
`;

const thumbnailFallbackClass = css`
  width: 5.5rem;
  height: 4rem;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: #e8f3ef;
  color: #2f7d72;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;

  @media (max-width: ${mobileMaxWidth}) {
    width: 4.8rem;
    height: 3.4rem;
  }
`;

const trayMetaClass = css`
  min-width: 0;
`;

const trayDescriptionClass = css`
  margin: 0.18rem 0 0;
  color: #667085;
  font-size: 1.1rem;
  line-height: 1.25;
`;

const collapsedButtonClass = css`
  flex: 1;
  min-height: 3.8rem;
  border: none;
  background: transparent;
  color: #18202a;
  padding: 0.5rem 0.65rem 0.5rem 1.1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.62rem;
  cursor: pointer;
  min-width: 0;

  @media (max-width: ${mobileMaxWidth}) {
    justify-content: center;
    min-height: 3.65rem;
    padding-left: 1rem;
  }
`;

const collapsedCloseButtonClass = css`
  flex: 0 0 auto;
  width: 2.6rem;
  height: 2.6rem;
  margin-right: 0.55rem;
  border: none;
  border-radius: 999px;
  background: rgba(226, 232, 240, 0.72);
  color: #475467;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.1rem;

  &:hover {
    color: #18202a;
    background: rgba(203, 213, 225, 0.9);
  }

  @media (max-width: ${mobileMaxWidth}) {
    width: 2.8rem;
    height: 2.8rem;
  }
`;

const collapsedTextClass = css`
  min-width: 0;
  font-size: 1.1rem;
  font-weight: 900;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

function createRuntimeSessionKey(buildId: number) {
  return `${buildId}:${Date.now().toString(36)}`;
}

function createRuntimeSession({
  buildId,
  location,
  path,
  userId
}: {
  buildId: number;
  location: Location;
  path: string;
  userId: number | null;
}): RuntimeSession {
  return {
    buildId,
    key: createRuntimeSessionKey(buildId),
    path,
    location,
    loaded: false,
    title: 'Build App',
    thumbnailUrl: null,
    username: '',
    openedAt: Date.now(),
    userId
  };
}

function getRuntimeRouteMatch(pathname: string): RuntimeRouteMatch | null {
  const match = matchPath({ path: '/app/:buildId', end: true }, pathname);
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

function getLocationPath(location: Location) {
  return `${location.pathname}${location.search}${location.hash}`;
}

function clampTrayPosition(x: number, y: number, tray: HTMLElement | null) {
  const rect = tray?.getBoundingClientRect();
  const width = rect?.width || 340;
  const height = rect?.height || 150;
  const margin = 12;
  return {
    x: Math.max(margin, Math.min(window.innerWidth - width - margin, x)),
    y: Math.max(margin, Math.min(window.innerHeight - height - margin, y))
  };
}

function useIsMobileRuntimeTray() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(`(max-width: ${mobileMaxWidth})`).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${mobileMaxWidth})`);
    function handleChange() {
      setIsMobile(mediaQuery.matches);
    }
    handleChange();
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isMobile;
}

function RunningAppTray({
  collapsed,
  session,
  onCollapseToggle,
  onKill,
  onRestore
}: {
  collapsed: boolean;
  session: RuntimeSession;
  onCollapseToggle: () => void;
  onKill: () => void;
  onRestore: () => void;
}) {
  const isMobile = useIsMobileRuntimeTray();
  const trayRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<DragStart | null>(null);
  const dragListenerCleanupRef = useRef<(() => void) | null>(null);
  const suppressNextClickRef = useRef(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null
  );

  useEffect(() => {
    if (!isMobile) return;
    setPosition(null);
  }, [isMobile]);

  useEffect(() => {
    return () => {
      removeDragListeners();
      dragStartRef.current = null;
    };
  }, []);

  function removeDragListeners() {
    dragListenerCleanupRef.current?.();
    dragListenerCleanupRef.current = null;
  }

  function handlePointerMove(event: PointerEvent) {
    const dragStart = dragStartRef.current;
    if (!dragStart) return;
    if (event.pointerId !== dragStart.pointerId) return;
    const distance = Math.hypot(
      event.clientX - dragStart.startX,
      event.clientY - dragStart.startY
    );
    if (!dragStart.moved && distance < 4) return;
    dragStart.moved = true;
    suppressNextClickRef.current = true;
    const nextPosition = clampTrayPosition(
      event.clientX - dragStart.offsetX,
      event.clientY - dragStart.offsetY,
      trayRef.current
    );
    setPosition(nextPosition);
  }

  function handlePointerUp() {
    const dragStart = dragStartRef.current;
    if (!dragStart) return;
    if (dragStart.moved) {
      suppressNextClickRef.current = true;
      window.setTimeout(() => {
        suppressNextClickRef.current = false;
      }, 0);
    }
    dragStartRef.current = null;
    removeDragListeners();
  }

  function handleDragPointerDown(event: React.PointerEvent) {
    if (event.button !== 0) return;
    const rect = trayRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragStartRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      startX: event.clientX,
      startY: event.clientY,
      moved: false
    };
    removeDragListeners();
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    dragListenerCleanupRef.current = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }

  function consumeSuppressedClick(event: React.MouseEvent) {
    if (!consumeSuppressedAction()) return false;
    event.preventDefault();
    event.stopPropagation();
    return true;
  }

  function consumeSuppressedAction() {
    if (!suppressNextClickRef.current) return false;
    suppressNextClickRef.current = false;
    return true;
  }

  function handleCollapseClick(event: React.MouseEvent) {
    if (consumeSuppressedClick(event)) return;
    onCollapseToggle();
  }

  function handleKillClick(event: React.MouseEvent) {
    if (consumeSuppressedClick(event)) return;
    onKill();
  }

  function handleRestoreClick() {
    if (consumeSuppressedAction()) return;
    onRestore();
  }

  const trayStyle = position
    ? {
        left: `${position.x}px`,
        top: `${position.y}px`
      }
    : undefined;

  return (
    <div
      ref={trayRef}
      className={trayClass}
      data-collapsed={collapsed ? 'true' : 'false'}
      data-positioned={position ? 'true' : 'false'}
      data-runtime-app-tray="true"
      onPointerDown={handleDragPointerDown}
      style={trayStyle}
    >
      {collapsed ? (
        <>
          <button
            type="button"
            className={collapsedButtonClass}
            onClick={handleCollapseClick}
            title="Show running app"
          >
            <Icon icon="laptop-code" />
            <span className={collapsedTextClass}>1 app running</span>
          </button>
          <button
            type="button"
            className={collapsedCloseButtonClass}
            onClick={handleKillClick}
            title="Close app session"
          >
            <Icon icon="times" />
          </button>
        </>
      ) : (
        <>
          <div className={trayHeaderClass}>
            <Icon icon="laptop-code" />
            <div className={trayTitleStackClass}>
              <p className={trayKickerClass}>Running app</p>
              <p className={trayTitleClass}>{session.title}</p>
            </div>
            <div className={trayControlsClass}>
              <button
                type="button"
                className={trayIconButtonClass}
                onClick={handleCollapseClick}
                title="Collapse running app tray"
              >
                <Icon icon="minus" />
              </button>
              <button
                type="button"
                className={trayIconButtonClass}
                onClick={handleKillClick}
                title="Close app session"
              >
                <Icon icon="times" />
              </button>
            </div>
          </div>
          <div className={trayBodyClass}>
            {session.thumbnailUrl ? (
              <img
                className={thumbnailClass}
                src={session.thumbnailUrl}
                alt=""
                draggable={false}
              />
            ) : (
              <div className={thumbnailFallbackClass}>
                <Icon icon="laptop-code" />
              </div>
            )}
            <div className={trayMetaClass}>
              <p className={trayTitleClass}>{session.title}</p>
              <p className={trayDescriptionClass}>
                {session.username ? `by ${session.username}` : 'Still running'}
              </p>
              <GameCTAButton
                icon="play"
                size="sm"
                variant="success"
                style={{ marginTop: '0.65rem' }}
                onClick={handleRestoreClick}
              >
                Return to app
              </GameCTAButton>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function BuildRuntimeKeepAliveHost() {
  const location = useLocation();
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
  const runtimeRouteMatch = useMemo(
    () => getRuntimeRouteMatch(location.pathname),
    [location.pathname]
  );
  const isCaptureRoute = useMemo(
    () =>
      Boolean(
        matchPath(
          { path: '/app-capture/:buildId', end: true },
          location.pathname
        )
      ),
    [location.pathname]
  );
  const activeBuildId = runtimeRouteMatch?.buildId || null;
  const isRuntimeRoute = Boolean(runtimeRouteMatch);
  const [session, setSession] = useState<RuntimeSession | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const currentUserId = Number(userId) || null;
  const sessionUserId = session?.userId || null;
  const sessionKey = session?.key || '';

  useLayoutEffect(() => {
    if (!isRuntimeRoute || !activeBuildId) return;
    const path = getLocationPath(location);
    setSession((current) => {
      if (current?.buildId === activeBuildId) {
        const ownedByDifferentAuthState =
          !!current.userId && current.userId !== currentUserId;
        if (ownedByDifferentAuthState) {
          return createRuntimeSession({
            buildId: activeBuildId,
            path,
            location,
            userId: currentUserId
          });
        }
        return {
          ...current,
          path,
          location,
          userId: current.userId || currentUserId
        };
      }
      return createRuntimeSession({
        buildId: activeBuildId,
        path,
        location,
        userId: currentUserId
      });
    });
  }, [activeBuildId, currentUserId, isRuntimeRoute, location]);

  useEffect(() => {
    if (isRuntimeRoute) return;
    if (!sessionUserId && currentUserId) {
      setSession((current) =>
        current && !current.userId
          ? {
              ...current,
              userId: currentUserId
            }
          : current
      );
      return;
    }
    if (!sessionUserId) return;
    if (!currentUserId) {
      setSession(null);
      setCollapsed(false);
      return;
    }
    if (sessionUserId === currentUserId) return;
    setSession(null);
    setCollapsed(false);
  }, [currentUserId, isRuntimeRoute, sessionUserId]);

  useEffect(() => {
    if (!isRuntimeRoute || !sessionKey) return;
    setCollapsed(false);
  }, [isRuntimeRoute, sessionKey]);

  useEffect(() => {
    if (isRuntimeRoute || !session || session.loaded) return;
    setSession(null);
  }, [isRuntimeRoute, session]);

  function handleRuntimeBuildLoaded(build: RuntimeBuild) {
    setSession((current) => {
      if (!current || Number(current.buildId) !== Number(build.id)) {
        return current;
      }
      return {
        ...current,
        loaded: true,
        title: String(build.title || 'Build App'),
        thumbnailUrl: build.thumbnailUrl || null,
        username: String(build.username || current.username || '')
      };
    });
  }

  function handleRestoreSession() {
    if (!session) return;
    navigate(session.path, { state: session.location.state });
  }

  function handleKillSession() {
    setSession(null);
    setCollapsed(false);
  }

  const isInvalidRuntimeRoute = isRuntimeRoute && !activeBuildId;

  if (!session && !isInvalidRuntimeRoute) return null;

  const isActiveSession =
    isRuntimeRoute &&
    !!session &&
    Number(activeBuildId) === Number(session.buildId);
  const runtimeIsActive = isInvalidRuntimeRoute || isActiveSession;
  const runtimeLocation = runtimeIsActive ? location : session!.location;
  const runtimeBuildId = isInvalidRuntimeRoute ? null : session!.buildId;
  const runtimeKey = isInvalidRuntimeRoute
    ? `invalid:${location.pathname}`
    : session!.key;

  return (
    <>
      <div
        className={runtimeLayerClass}
        data-active={runtimeIsActive ? 'true' : 'false'}
        data-build-runtime-keepalive-layer="true"
        data-runtime-session-loaded={session?.loaded ? 'true' : 'false'}
      >
        <BuildRuntime
          key={runtimeKey}
          buildIdOverride={runtimeBuildId}
          locationOverride={runtimeLocation}
          onRuntimeBuildLoaded={handleRuntimeBuildLoaded}
          runtimeIsActive={runtimeIsActive}
        />
      </div>
      {!runtimeIsActive && !isCaptureRoute && session?.loaded ? (
        <RunningAppTray
          collapsed={collapsed}
          session={session}
          onCollapseToggle={() => setCollapsed((current) => !current)}
          onKill={handleKillSession}
          onRestore={handleRestoreSession}
        />
      ) : null}
    </>
  );
}
