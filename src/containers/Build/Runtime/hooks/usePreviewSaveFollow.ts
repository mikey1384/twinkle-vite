import { useEffect, useRef, useState } from 'react';
import { socket } from '~/constants/sockets/api';
import {
  BUILD_PREVIEW_UPDATES_JOIN_EVENT,
  BUILD_PREVIEW_UPDATES_LEAVE_EVENT,
  BUILD_VERSION_SAVED_EVENT,
  decidePreviewFollowStep,
  isViewerActive,
  parseBuildVersionSaved,
  type BuildVersionSaved
} from '../helpers/previewSaveFollow';

export type PreviewReloadKind = 'auto' | 'pill';

// While the pill is up, check this often whether the viewer has gone idle
// (then the preview reloads by itself after all).
const ACTIVE_RECHECK_MS = 2_000;
// A reload that never reports a loaded preview (its load failed) stops
// blocking the next one after this long.
const RELOAD_STUCK_MS = 15_000;

// The saved-workspace preview follows new saves (helpers/previewSaveFollow.ts
// has the rules). `loadedFilesHash` is the projectFilesHash of the files the
// preview is showing (null while a load is in flight); `onReload` replaces
// the running preview with the newest saved files.
export function usePreviewSaveFollow({
  buildId,
  enabled,
  loadedFilesHash,
  onReload
}: {
  buildId: number | null;
  enabled: boolean;
  loadedFilesHash: string | null;
  onReload: (kind: PreviewReloadKind) => void;
}) {
  const [pillShown, setPillShown] = useState(false);
  const onReloadRef = useRef(onReload);
  onReloadRef.current = onReload;
  const loadedHashRef = useRef(loadedFilesHash);
  loadedHashRef.current = loadedFilesHash;
  // Kept across preview reloads of the same build (each reload is a new
  // runtime session); started over for another build.
  const stateRef = useRef({
    buildId: 0,
    latest: null as BuildVersionSaved | null,
    lastReloadAt: 0,
    reloadingSince: 0,
    lastInteractionAt: 0
  });
  const timerRef = useRef<number | null>(null);
  const evaluateRef = useRef<() => void>(() => {});
  const reloadRef = useRef<(kind: PreviewReloadKind) => void>(() => {});

  const activeBuildId = enabled && buildId ? buildId : 0;
  if (stateRef.current.buildId !== activeBuildId && activeBuildId) {
    stateRef.current = {
      buildId: activeBuildId,
      latest: null,
      lastReloadAt: 0,
      reloadingSince: 0,
      lastInteractionAt: 0
    };
  }

  function clearTimer() {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }

  function schedule(ms: number) {
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      evaluateRef.current();
    }, ms);
  }

  reloadRef.current = (kind: PreviewReloadKind) => {
    const state = stateRef.current;
    if (!activeBuildId || state.reloadingSince) return;
    const now = Date.now();
    state.reloadingSince = now;
    state.lastReloadAt = now;
    clearTimer();
    setPillShown(false);
    onReloadRef.current(kind);
    schedule(RELOAD_STUCK_MS);
  };

  evaluateRef.current = () => {
    const state = stateRef.current;
    if (!activeBuildId) return;
    const now = Date.now();
    if (state.reloadingSince && now - state.reloadingSince >= RELOAD_STUCK_MS) {
      state.reloadingSince = 0;
    }
    const pending = Boolean(
      state.latest &&
        loadedHashRef.current &&
        state.latest.filesHash !== loadedHashRef.current
    );
    if (!pending) {
      if (!state.reloadingSince) clearTimer();
      setPillShown(false);
      return;
    }
    const activeElement = document.activeElement;
    const step = decidePreviewFollowStep({
      pending,
      reloading: Boolean(state.reloadingSince),
      active: isViewerActive({
        now,
        lastInteractionAt: state.lastInteractionAt,
        pageVisible: document.visibilityState !== 'hidden',
        windowFocused: document.hasFocus(),
        frameFocused: activeElement?.tagName === 'IFRAME'
      }),
      now,
      lastReloadAt: state.lastReloadAt
    });
    if (step.kind === 'none') return;
    if (step.kind === 'pill') {
      setPillShown(true);
      schedule(ACTIVE_RECHECK_MS);
      return;
    }
    if (step.inMs > 0) {
      schedule(step.inMs);
      return;
    }
    reloadRef.current('auto');
  };

  // Join the build's preview room (the server checks the viewer may see this
  // build's saved workspace) and hear its saves. Joined again after every
  // reconnect, since a new connection starts in no rooms.
  useEffect(() => {
    if (!activeBuildId) return;
    const join = () => {
      socket.emit(BUILD_PREVIEW_UPDATES_JOIN_EVENT, { buildId: activeBuildId });
    };
    const onSaved = (event: unknown) => {
      const saved = parseBuildVersionSaved(event, activeBuildId);
      if (!saved) return;
      const state = stateRef.current;
      // Saves arrive in order on one connection; an older one that arrives
      // late is ignored so the page always ends on the newest.
      if (state.latest && saved.serverTime < state.latest.serverTime) return;
      state.latest = saved;
      evaluateRef.current();
    };
    socket.on(BUILD_VERSION_SAVED_EVENT, onSaved);
    socket.on('connect', join);
    if (socket.connected) join();
    return () => {
      socket.off(BUILD_VERSION_SAVED_EVENT, onSaved);
      socket.off('connect', join);
      socket.emit(BUILD_PREVIEW_UPDATES_LEAVE_EVENT, { buildId: activeBuildId });
      clearTimer();
      setPillShown(false);
    };
  }, [activeBuildId]);

  // A new preview finished loading: the reload is over; check again whether
  // a save came in while it loaded.
  useEffect(() => {
    if (!activeBuildId || !loadedFilesHash) return;
    stateRef.current.reloadingSince = 0;
    evaluateRef.current();
  }, [activeBuildId, loadedFilesHash]);

  // Input on the page counts as using the app (see isViewerActive), and so
  // does moving focus into the app frame (the page's window loses focus to
  // its own iframe).
  useEffect(() => {
    if (!activeBuildId) return;
    const note = (event: Event) => {
      if (!event.isTrusted) return;
      stateRef.current.lastInteractionAt = Date.now();
    };
    const onBlur = () => {
      window.setTimeout(() => {
        if (document.activeElement?.tagName === 'IFRAME') {
          stateRef.current.lastInteractionAt = Date.now();
        }
      }, 0);
    };
    const passive = { capture: true, passive: true } as const;
    document.addEventListener('pointerdown', note, true);
    document.addEventListener('keydown', note, true);
    document.addEventListener('touchstart', note, passive);
    document.addEventListener('wheel', note, passive);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('pointerdown', note, true);
      document.removeEventListener('keydown', note, true);
      document.removeEventListener('touchstart', note, passive);
      document.removeEventListener('wheel', note, passive);
      window.removeEventListener('blur', onBlur);
    };
  }, [activeBuildId]);

  return {
    pillShown: Boolean(activeBuildId) && pillShown,
    reloadNow() {
      reloadRef.current('pill');
    }
  };
}
