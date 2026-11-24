import { useEffect, useRef, useState } from 'react';
import { socket } from '~/constants/sockets/api';
import {
  BUILD_PREVIEW_UPDATES_JOIN_EVENT,
  BUILD_PREVIEW_UPDATES_LEAVE_EVENT,
  BUILD_VERSION_SAVED_EVENT,
  PREVIEW_RELOAD_MIN_GAP_MS,
  parseBuildVersionSaved
} from '../../Runtime/helpers/previewSaveFollow';

// build_version_saved for this tab's own save can beat its HTTP response.
export const STUDIO_OWN_SAVE_SETTLE_MS = 1200;

// Build Studio follows saves made elsewhere (the CLI, another tab, a
// teammate on a branch, a merge into Main): main for its owner, and a branch
// (/build/<root>/<n>, where the forum's "Preview branch", the chat's "Open
// branch" and the branch switcher land) for anyone the server admits to the
// build's preview room (twinkle-api helpers/build/previewUpdateEvents.ts).
//
// - A save this tab already shows (its own save, its Lumine run) does nothing.
// - Clean editor: the saved files are read again (`refresh`) and the preview
//   follows them, as it does for this tab's own saves.
// - Unsaved edits in the editor: nothing is replaced; `pillShown` asks the
//   viewer, and the page decides what loading means for their edits.
// - Each signal causes at most one read: a read that started after the
//   signal arrived uses it up, whatever files it found, so a writer that
//   changes files without a signal (or signals out of order) never loops.
// - Rapid saves read at most once per PREVIEW_RELOAD_MIN_GAP_MS.
export function useStudioSaveFollow({
  workspaceBuildId,
  currentFilesHash,
  dirty,
  refresh,
  onReloadCounted
}: {
  workspaceBuildId: number;
  currentFilesHash: string | null;
  dirty: boolean;
  refresh: () => Promise<unknown>;
  onReloadCounted?: (buildId: number, kind: 'auto' | 'pill') => void;
}) {
  const [pillShown, setPillShown] = useState(false);
  const hashRef = useRef(currentFilesHash);
  hashRef.current = currentFilesHash;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  const countRef = useRef(onReloadCounted);
  countRef.current = onReloadCounted;
  const loadRef = useRef<(kind: 'auto' | 'pill') => void>(() => {});

  useEffect(() => {
    if (!workspaceBuildId) return;
    let stopped = false;
    let timer: number | null = null;
    let latest: { filesHash: string; receivedAt: number } | null = null;
    let lastReadAt = 0;
    let reading = false;

    function schedule(ms: number) {
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        timer = null;
        decide();
      }, ms);
    }
    function decide() {
      if (stopped || reading) return;
      if (!latest || latest.filesHash === hashRef.current) {
        latest = null;
        setPillShown(false);
        return;
      }
      if (dirtyRef.current) {
        setPillShown(true);
        return;
      }
      void load('auto');
    }
    async function load(kind: 'auto' | 'pill') {
      if (stopped || reading || !latest) return;
      reading = true;
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
      if (latest) schedule(Math.max(0, lastReadAt + PREVIEW_RELOAD_MIN_GAP_MS - Date.now()));
    }
    loadRef.current = (kind) => void load(kind);

    function onSaved(event: unknown) {
      const saved = parseBuildVersionSaved(event, workspaceBuildId);
      if (!saved || stopped) return;
      if (saved.filesHash === hashRef.current) return;
      latest = { filesHash: saved.filesHash, receivedAt: Date.now() };
      if (reading) return;
      schedule(
        Math.max(
          STUDIO_OWN_SAVE_SETTLE_MS,
          lastReadAt + PREVIEW_RELOAD_MIN_GAP_MS - Date.now()
        )
      );
    }
    function join() {
      socket.emit(BUILD_PREVIEW_UPDATES_JOIN_EVENT, { buildId: workspaceBuildId });
    }
    socket.on(BUILD_VERSION_SAVED_EVENT, onSaved);
    socket.on('connect', join);
    if (socket.connected) join();
    return () => {
      stopped = true;
      if (timer !== null) window.clearTimeout(timer);
      socket.off(BUILD_VERSION_SAVED_EVENT, onSaved);
      socket.off('connect', join);
      socket.emit(BUILD_PREVIEW_UPDATES_LEAVE_EVENT, { buildId: workspaceBuildId });
      loadRef.current = () => {};
      setPillShown(false);
    };
  }, [workspaceBuildId]);

  return {
    pillShown,
    loadNow() {
      loadRef.current('pill');
    }
  };
}
