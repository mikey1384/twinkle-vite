import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useKeyContext } from '~/contexts';
import { useToast } from '~/contexts/Toast';
import { socket } from '~/constants/sockets/api';
import {
  describeLumineRunFinished,
  isLumineBuildPage,
  LUMINE_RUN_FINISHED_EVENT,
  LUMINE_RUN_TITLE_PREFIX,
  normalizeLumineRunFinishedNotice,
  type LumineRunFinishedNotice
} from '~/helpers/lumineRunFinished';

// Lumine keeps working while members go elsewhere (Mikey 11-24: "it will let
// them know when their work is done"). Lives at the app shell. A notice for
// the build page that is in front of the member is skipped (the page shows
// the result); a hidden tab waits until it is visible, marks its title, and
// skips the toast if another tab or the build page already showed it.
const SHOWN_KEY_PREFIX = 'lumine-run-notice:';

const SHOWN_KEEP_MS = 24 * 60 * 60 * 1000;

function wasShown(key: string) {
  try {
    return Boolean(window.localStorage.getItem(key));
  } catch {
    return false;
  }
}

function markShown(key: string) {
  try {
    window.localStorage.setItem(key, String(Date.now()));
  } catch {
    // Private mode: the notice may show in more than one tab; harmless.
  }
}

// Old "already shown" marks are only needed for a moment; drop day-old ones.
function pruneShown() {
  try {
    const now = Date.now();
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(SHOWN_KEY_PREFIX)) continue;
      const at = Number(window.localStorage.getItem(key)) || 0;
      if (now - at > SHOWN_KEEP_MS) window.localStorage.removeItem(key);
    }
  } catch {
    // Storage unavailable: nothing to prune.
  }
}

export default function LumineRunNotifications() {
  const userId = useKeyContext((v) => v.myState.userId);
  const showToast = useToast();
  const location = useLocation();
  const pathnameRef = useRef(location.pathname);
  pathnameRef.current = location.pathname;
  const pendingRef = useRef<LumineRunFinishedNotice[]>([]);

  useEffect(() => {
    pendingRef.current = [];
    if (!userId) return;
    pruneShown();
    const ownerUserId = Number(userId);

    function keyFor(notice: LumineRunFinishedNotice) {
      return `${SHOWN_KEY_PREFIX}${notice.requestId || `${notice.buildId}:${notice.finishedAt}`}`;
    }

    function present(notice: LumineRunFinishedNotice) {
      const key = keyFor(notice);
      if (wasShown(key)) return;
      if (isLumineBuildPage(pathnameRef.current, notice.buildId)) {
        markShown(key);
        return;
      }
      const text = describeLumineRunFinished(notice);
      showToast({
        kind: 'lumine',
        ownerUserId,
        title: text.title,
        message: text.message,
        success: text.success,
        actionLabel: 'Open project',
        linkTo: `/build/${notice.buildId}`,
        onShown: () => markShown(key)
      });
    }

    function receive(value: unknown) {
      const notice = normalizeLumineRunFinishedNotice(value);
      if (!notice) return;
      if (document.hidden) {
        pendingRef.current.push(notice);
        if (!document.title.startsWith(LUMINE_RUN_TITLE_PREFIX)) {
          document.title = `${LUMINE_RUN_TITLE_PREFIX}${document.title}`;
        }
        return;
      }
      present(notice);
    }

    function onVisibility() {
      if (document.hidden) return;
      if (document.title.startsWith(LUMINE_RUN_TITLE_PREFIX)) {
        document.title = document.title.slice(LUMINE_RUN_TITLE_PREFIX.length);
      }
      const pending = pendingRef.current;
      pendingRef.current = [];
      pending.forEach(present);
    }

    socket.on(LUMINE_RUN_FINISHED_EVENT, receive);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      socket.off(LUMINE_RUN_FINISHED_EVENT, receive);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [showToast, userId]);

  return null;
}
