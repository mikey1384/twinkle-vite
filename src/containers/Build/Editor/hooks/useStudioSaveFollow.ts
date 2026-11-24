import { useEffect, useRef, useState } from 'react';
import { socket } from '~/constants/sockets/api';
import {
  BUILD_PREVIEW_UPDATES_JOIN_EVENT,
  BUILD_PREVIEW_UPDATES_LEAVE_EVENT,
  BUILD_VERSION_SAVED_EVENT,
  PREVIEW_RELOAD_MIN_GAP_MS,
  isViewerActiveNow,
  parseBuildVersionSaved,
  trackViewerActivity
} from '../../Runtime/helpers/previewSaveFollow';

// build_version_saved for this tab's own save can beat its HTTP response.
export const STUDIO_OWN_SAVE_SETTLE_MS = 1200;
// While a save waits (this tab saving, the pill up), check again this often.
export const STUDIO_RECHECK_MS = 2000;

// Build Studio follows saves made elsewhere (the CLI, another tab, a
// teammate on a branch, a merge into Main): main for its owner, and a branch
// (/build/<root>/<n>, where the forum's "Preview branch", the chat's "Open
// branch" and the branch switcher land) for anyone the server admits to the
// build's preview room (twinkle-api helpers/build/previewUpdateEvents.ts).
//
// The decision is made again whenever the files this tab shows, its unsaved
// edits or its saving state change, and every STUDIO_RECHECK_MS while a save
// is waiting:
// - The signal names the files this tab shows: nothing to do. That is how
//   this tab's own save ends, however slowly its response comes back: while
//   this tab is saving nothing is decided, and when the save returns its
//   hash is the signal's.
// - Unsaved edits, or the viewer used the page in the last 20 s (playing the
//   preview, same idle window as /app): nothing is replaced; `pillShown`
//   asks, and the page decides what loading means for unsaved edits.
// - Otherwise the saved files are read again (`refresh`) and the preview
//   follows them.
// - Each signal causes at most one read: a read that started after the
//   signal arrived uses it up, whatever files it found, so a writer that
//   changes files without a signal (or signals out of order) never loops.
//   Reads come at most once per PREVIEW_RELOAD_MIN_GAP_MS.
export function useStudioSaveFollow({
  workspaceBuildId,
  currentFilesHash,
  unsavedEdits,
  saving,
  refresh,
  onReloadCounted
}: {
  workspaceBuildId: number;
  currentFilesHash: string | null;
  unsavedEdits: boolean;
  saving: boolean;
  refresh: () => Promise<unknown>;
  onReloadCounted?: (buildId: number, kind: 'auto' | 'pill') => void;
}) {
  const [pillShown, setPillShown] = useState(false);
  const propsRef = useRef({ currentFilesHash, unsavedEdits, saving });
  propsRef.current = { currentFilesHash, unsavedEdits, saving };
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  const countRef = useRef(onReloadCounted);
  countRef.current = onReloadCounted;
  const loadRef = useRef<(kind: 'auto' | 'pill') => void>(() => {});
  const decideRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!workspaceBuildId) return;
    let stopped = false;
    let timer: number | null = null;
    let latest: { filesHash: string; receivedAt: number } | null = null;
    let lastReadAt = 0;
    let lastInteractionAt = 0;
    let reading = false;

    function schedule(ms: number) {
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        timer = null;
        decide();
      }, Math.max(0, ms));
    }
    function clearTimer() {
      if (timer !== null) window.clearTimeout(timer);
      timer = null;
    }
    function decide() {
      if (stopped || reading) return;
      const { currentFilesHash: shown, unsavedEdits: dirty, saving: busy } =
        propsRef.current;
      if (!latest || latest.filesHash === shown) {
        latest = null;
        clearTimer();
        setPillShown(false);
        return;
      }
      const now = Date.now();
      // This tab's own save is still on its way back: its hash will settle it.
      if (busy) {
        setPillShown(false);
        schedule(STUDIO_RECHECK_MS);
        return;
      }
      const settleAt = latest.receivedAt + STUDIO_OWN_SAVE_SETTLE_MS;
      if (now < settleAt) {
        schedule(settleAt - now);
        return;
      }
      if (dirty || isViewerActiveNow(lastInteractionAt)) {
        setPillShown(true);
        schedule(STUDIO_RECHECK_MS);
        return;
      }
      const readAt = lastReadAt + PREVIEW_RELOAD_MIN_GAP_MS;
      if (now < readAt) {
        schedule(readAt - now);
        return;
      }
      void load('auto');
    }
    async function load(kind: 'auto' | 'pill') {
      if (stopped || reading || !latest) return;
      reading = true;
      clearTimer();
      const startedAt = Date.now();
      lastReadAt = startedAt;
      setPillShown(false);
      countRef.current?.(workspaceBuildId, kind);
      try {
        await refreshRef.current();
      } catch {
        // The next save signal tries again.
      }
      reading = false;
      if (stopped) return;
      if (latest && latest.receivedAt <= startedAt) latest = null;
      decide();
    }
    loadRef.current = (kind) => void load(kind);
    decideRef.current = decide;

    function onSaved(event: unknown) {
      const saved = parseBuildVersionSaved(event, workspaceBuildId);
      if (!saved || stopped) return;
      if (saved.filesHash === propsRef.current.currentFilesHash) return;
      latest = { filesHash: saved.filesHash, receivedAt: Date.now() };
      decide();
    }
    function join() {
      socket.emit(BUILD_PREVIEW_UPDATES_JOIN_EVENT, { buildId: workspaceBuildId });
    }
    socket.on(BUILD_VERSION_SAVED_EVENT, onSaved);
    socket.on('connect', join);
    if (socket.connected) join();
    const stopTracking = trackViewerActivity((at) => {
      lastInteractionAt = at;
    });
    return () => {
      stopped = true;
      clearTimer();
      stopTracking();
      socket.off(BUILD_VERSION_SAVED_EVENT, onSaved);
      socket.off('connect', join);
      socket.emit(BUILD_PREVIEW_UPDATES_LEAVE_EVENT, { buildId: workspaceBuildId });
      loadRef.current = () => {};
      decideRef.current = () => {};
      setPillShown(false);
    };
  }, [workspaceBuildId]);

  // The files shown, the unsaved edits or the saving state changed: decide
  // again (a slow own save clears here when its hash arrives).
  useEffect(() => {
    decideRef.current();
  }, [currentFilesHash, unsavedEdits, saving]);

  return {
    pillShown,
    loadNow() {
      loadRef.current('pill');
    }
  };
}
