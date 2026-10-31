import { useContext, useLayoutEffect, useRef, useState } from 'react';
import { UNSAFE_NavigationContext } from 'react-router-dom';
import {
  NAVIGATION_BLOCKED_EVENT,
  registerNavigationPopGuard
} from '~/helpers/navigationPopGuard';

function isStoryLocation(url: URL) {
  return (
    url.pathname.replace(/\/$/, '') === '/arena' &&
    url.searchParams.get('mode') === 'train' &&
    url.searchParams.get('play') === 'ai-story'
  );
}

// BrowserRouter has no useBlocker support. Guard its navigator while this
// unsaved story is open, and undo a browser POP before the router unmounts it.
// No extra history entry is needed for normal router-owned navigation.
export default function useStoryNavigationGuard(enabled: boolean) {
  const { navigator } = useContext(UNSAFE_NavigationContext);
  const [pending, setPending] = useState<(() => void) | null>(null);
  const pendingRef = useRef<(() => void) | null>(null);

  useLayoutEffect(() => {
    if (!enabled) {
      pendingRef.current = null;
      setPending(null);
      return;
    }
    const originalPush = navigator.push;
    const originalReplace = navigator.replace;
    let currentState = window.history.state;
    let currentHref = window.location.href;
    let restoring = false;
    let restoreFrame = 0;
    let proceeding = false;
    let restoredAction: (() => void) | null = null;

    function rememberLocation() {
      currentState = window.history.state;
      currentHref = window.location.href;
    }

    function ask(action: () => void) {
      window.dispatchEvent(new Event(NAVIGATION_BLOCKED_EVENT));
      if (pendingRef.current) return;
      pendingRef.current = action;
      setPending(() => action);
    }

    const push: typeof navigator.push = (...args) => {
      if (restoring || pendingRef.current) {
        window.dispatchEvent(new Event(NAVIGATION_BLOCKED_EVENT));
        return;
      }
      if (isStoryLocation(new URL(navigator.createHref(args[0]), currentHref))) {
        originalPush(...args);
        rememberLocation();
      } else {
        ask(() => originalPush(...args));
      }
    };
    const replace: typeof navigator.replace = (...args) => {
      if (restoring || pendingRef.current) {
        window.dispatchEvent(new Event(NAVIGATION_BLOCKED_EVENT));
        return;
      }
      if (isStoryLocation(new URL(navigator.createHref(args[0]), currentHref))) {
        originalReplace(...args);
        rememberLocation();
      } else {
        ask(() => originalReplace(...args));
      }
    };
    navigator.push = push;
    navigator.replace = replace;

    function restoreLocation() {
      if (restoreFrame) return;
      // Several rapid Back requests can supersede a go() issued inside the
      // first popstate. Restore once those events settle, using the actual
      // current index rather than the first event's now-stale delta.
      restoreFrame = window.requestAnimationFrame(() => {
        restoreFrame = 0;
        if (window.location.href === currentHref) {
          finishRestore();
        } else if (
          !Number.isInteger(window.history.state?.idx) ||
          window.history.state.idx === currentState.idx
        ) {
          restoreUnindexedLocation();
        } else {
          window.history.go(currentState.idx - window.history.state.idx);
        }
      });
    }

    function restoreUnindexedLocation() {
      // A same-document entry created outside the router has no index to
      // traverse back to. Keep the story mounted and retain the requested
      // destination. Also covers rapid Back crossing an unindexed entry.
      const destination =
        window.location.pathname +
        window.location.search +
        window.location.hash;
      const state = window.history.state?.usr;
      window.history.pushState(currentState, '', currentHref);
      restoring = false;
      restoredAction = null;
      ask(() => originalReplace(destination, state));
    }

    function finishRestore() {
      restoring = false;
      if (restoredAction) ask(restoredAction);
      restoredAction = null;
    }

    function handlePop(event: PopStateEvent) {
      if (proceeding) {
        // Let the one confirmed traversal through, then guard again: the
        // member may open another unfinished story without a remount.
        proceeding = false;
        rememberLocation();
        return;
      }
      if (restoring) {
        event.stopImmediatePropagation();
        if (window.location.href === currentHref) {
          finishRestore();
        } else {
          restoreLocation();
        }
        return;
      }
      if (!pendingRef.current && isStoryLocation(new URL(window.location.href))) {
        rememberLocation();
        return;
      }
      event.stopImmediatePropagation();
      const nextIndex = window.history.state?.idx;
      const previousIndex = currentState?.idx;
      if (
        Number.isInteger(nextIndex) &&
        Number.isInteger(previousIndex) &&
        nextIndex !== previousIndex
      ) {
        restoring = true;
        restoredAction = () => {
          proceeding = true;
          window.history.go(nextIndex - window.history.state.idx);
        };
        restoreLocation();
      } else {
        restoreUnindexedLocation();
      }
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = '';
    }

    const unregisterPopGuard = registerNavigationPopGuard(handlePop);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      if (restoreFrame) window.cancelAnimationFrame(restoreFrame);
      if (navigator.push === push) navigator.push = originalPush;
      if (navigator.replace === replace) navigator.replace = originalReplace;
      unregisterPopGuard();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, navigator]);

  return {
    blocked: !!pending,
    cancel() {
      pendingRef.current = null;
      setPending(null);
    },
    proceed() {
      const action = pendingRef.current;
      pendingRef.current = null;
      setPending(null);
      action?.();
    }
  };
}
