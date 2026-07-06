import { useLayoutEffect, useRef, type RefObject } from 'react';
import {
  addScrollAnchorExternalSaveListener,
  addScrollAnchorRestoreCancelListener,
  addScrollAnchorTopResetListener,
  appOwnsScrollRestoration,
  notifyScrollAnchorExternalSave,
  suppressScrollAnchorSaves,
  scrollAnchorRestoresAreSuppressed,
  scrollAnchorSavesAreSuppressed
} from '~/helpers/scrollAnchorRestorationCoordinator';
import {
  isScrollDiagnosticsLoggingEnabled,
  recordScrollDiagnostic
} from '~/helpers/scrollAnchorDiagnostics';

// An incidental pointer event (iOS momentum from the swipe-to-reveal-nav, or
// the navigation tap itself) must not cancel an in-flight restore before it has
// actually pinned the saved anchor — otherwise the scroll is stranded at the
// not-yet-settled fallback position. After this grace window we honor user
// input even if the anchor never rendered, so we never fight a deliberate
// scroll for long.
const restoreCancelGraceMs = 900;

// After a programmatic scroll (anchor restore / initial scroll), a scroll
// event that arrives without any user scroll input since that scroll was
// applied is browser-initiated (native history restore, iOS viewport
// settling) — saving it would persist a position the user never chose as the
// new anchor. This window bounds only the DETECTION of such scrolls; one that
// is caught sets a standing taint that keeps blocking saves until user input,
// a hook-applied scroll, or a top reset clears it.
const postRestoreNonUserSaveGuardMs = 3000;

// A scroll observed while saves are suppressed is normally the hook's own
// (setScrollTop's synthetic event and the browser's native echo land exactly
// at the applied position). Deviation beyond this tolerance means something
// else — a browser history restore — moved the scroller inside the
// suppression window, which must taint like any other guarded non-user
// scroll or it would be saved once suppression lapses.
const appliedScrollTopTolerancePx = 2;

interface SavedScrollAnchor {
  anchorKey: string;
  primaryId?: string;
  secondaryId?: string;
  contentKey?: string;
  offset: number;
  scrollTop: number;
}

type InitialScrollPolicy =
  | { type: 'preserve' }
  | { type: 'top' }
  | {
      type: 'element';
      targetRef: RefObject<HTMLElement | null>;
      topOffset?: number;
    };

const savedScrollAnchors: Record<string, SavedScrollAnchor> = {};
const restoreSaveSuppressionDurationMs = 250;
const restoreCancelKeys = new Set([
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'End',
  'Home',
  'PageDown',
  'PageUp',
  ' '
]);
const scrollableOverflowValues = new Set(['auto', 'overlay', 'scroll']);

export function useScrollAnchorRestoration({
  anchorKey,
  containerRef,
  ignoreSavedAnchor = false,
  initialScroll,
  itemsReady
}: {
  anchorKey: string;
  containerRef: RefObject<HTMLElement | null>;
  ignoreSavedAnchor?: boolean;
  initialScroll: InitialScrollPolicy;
  itemsReady: boolean;
}) {
  const initialScrollType = initialScroll.type;
  const initialScrollTargetRef =
    initialScroll.type === 'element' ? initialScroll.targetRef : null;
  const initialScrollTopOffset =
    initialScroll.type === 'element' ? initialScroll.topOffset : undefined;
  const initialScrollAttemptedRef = useRef('');
  const activeIgnoredSavedAnchorKeyRef = useRef('');
  const ignoredSavedAnchorSignaturesRef = useRef<Record<string, string>>({});
  const activeAnchorKeyRef = useRef('');
  const restoreAttemptedRef = useRef('');
  const restoreSettledSignatureRef = useRef('');
  const userCancelledRestoreRef = useRef('');
  const restoreAppliedAtRef = useRef(0);
  const userScrollInputAtRef = useRef(0);
  const nonUserScrollTaintedRef = useRef(false);
  const lastAppliedScrollTopRef = useRef(-1);

  if (ignoreSavedAnchor) {
    activeIgnoredSavedAnchorKeyRef.current = anchorKey;
    const ignoredRestoreSignature = getSavedAnchorRestoreSignature(anchorKey);
    if (ignoredRestoreSignature) {
      ignoredSavedAnchorSignaturesRef.current[anchorKey] =
        ignoredRestoreSignature;
    }
  } else if (
    !ignoreSavedAnchor &&
    activeIgnoredSavedAnchorKeyRef.current === anchorKey
  ) {
    activeIgnoredSavedAnchorKeyRef.current = '';
  }

  useLayoutEffect(() => {
    // Per-key state must reset INSIDE the effect, not during render: the
    // previous key's effect cleanups (including its teardown save) run at
    // commit, after render — a render-phase reset would clear the taint and
    // settled signature before that teardown save reads them, letting a
    // browser-chosen offset be saved under the old key. Effect order
    // guarantees this runs after every old-key cleanup and before the new
    // key's save/restore effects.
    if (activeAnchorKeyRef.current !== anchorKey) {
      activeAnchorKeyRef.current = anchorKey;
      restoreAttemptedRef.current = '';
      restoreSettledSignatureRef.current = '';
      userCancelledRestoreRef.current = '';
      restoreAppliedAtRef.current = 0;
      userScrollInputAtRef.current = 0;
      nonUserScrollTaintedRef.current = false;
      lastAppliedScrollTopRef.current = -1;
    }

    function markUserScrollInput() {
      userCancelledRestoreRef.current = anchorKey;
      userScrollInputAtRef.current = nowMs();
      // User input ratifies the current position: any scroll that follows is
      // theirs to save, so a standing non-user taint no longer applies.
      nonUserScrollTaintedRef.current = false;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (!restoreCancelKeys.has(event.key)) return;
      markUserScrollInput();
    }

    function handleTopReset() {
      savedScrollAnchors[anchorKey] = {
        anchorKey,
        offset: 0,
        scrollTop: 0
      };
      restoreSettledSignatureRef.current =
        getSavedAnchorRestoreSignature(anchorKey);
      userCancelledRestoreRef.current = '';
      // The app just re-established the position (top), so any standing
      // non-user taint is superseded and the browser's async echo of the
      // reset scroll must compare against 0, not a stale applied position.
      nonUserScrollTaintedRef.current = false;
      lastAppliedScrollTopRef.current = 0;
      recordScrollDiagnostic({ type: 'top-reset', anchorKey, scrollTop: 0 });
    }

    // An external write to this instance's anchor has no restore in flight;
    // without marking it settled here, saveShouldWaitForPendingRestore would
    // block every subsequent natural scroll save until remount (e.g. after a
    // popup link click that never navigates). Per-instance on purpose: a
    // remounted hook must still treat that saved anchor as a pending restore.
    function handleExternalSave(savedAnchorKey: string) {
      if (savedAnchorKey !== anchorKey) return;
      restoreSettledSignatureRef.current =
        getSavedAnchorRestoreSignature(anchorKey);
    }

    window.addEventListener('wheel', markUserScrollInput, {
      capture: true,
      passive: true
    });
    window.addEventListener('touchmove', markUserScrollInput, {
      capture: true,
      passive: true
    });
    window.addEventListener('keydown', handleKeyDown, {
      capture: true
    });
    const removeRestoreCancelListener =
      addScrollAnchorRestoreCancelListener(markUserScrollInput);
    const removeTopResetListener =
      addScrollAnchorTopResetListener(handleTopReset);
    const removeExternalSaveListener =
      addScrollAnchorExternalSaveListener(handleExternalSave);

    return () => {
      window.removeEventListener('wheel', markUserScrollInput, {
        capture: true
      });
      window.removeEventListener('touchmove', markUserScrollInput, {
        capture: true
      });
      window.removeEventListener('keydown', handleKeyDown, {
        capture: true
      });
      removeRestoreCancelListener();
      removeTopResetListener();
      removeExternalSaveListener();
    };
  }, [anchorKey]);

  useLayoutEffect(() => {
    if (!itemsReady || !containerRef.current) return;
    const scroller = getAppScroller();
    const container = containerRef.current;
    let frame = 0;

    function handleScroll() {
      if (scrollAnchorSavesAreSuppressed()) {
        taintIfScrollLeftAppliedPosition('suppressed-window');
        return;
      }
      if (saveShouldWaitForPendingRestore()) return;
      if (scrollIsNonUserWhileGuarded()) return;
      saveAnchorAndMarkSettled();
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        if (scrollAnchorSavesAreSuppressed()) {
          taintIfScrollLeftAppliedPosition('suppressed-window');
          return;
        }
        if (saveShouldWaitForPendingRestore()) return;
        if (scrollIsNonUserWhileGuarded()) return;
        saveAnchorAndMarkSettled();
      });
    }

    // Single detection predicate for non-user scrolls, shared by the
    // suppressed branch, the guarded branch, and the teardown check. The
    // hook's own scroll events either carry the in-flight flag or sit at the
    // applied position (including delayed native echoes), so under guard, a
    // scroll that has LEFT that position is browser-initiated and must
    // taint. The teardown call also covers an override written in the final
    // frame whose scroll event never got delivered before unmount.
    function taintIfScrollLeftAppliedPosition(note: string) {
      if (applyingProgrammaticScroll) return;
      if (nonUserScrollTaintedRef.current) return;
      if (!nonUserScrollGuardHolds()) return;
      const appliedScrollTop = lastAppliedScrollTopRef.current;
      if (appliedScrollTop < 0) return;
      const currentScrollTop = getScrollTop(getActiveScroller());
      if (
        Math.abs(currentScrollTop - appliedScrollTop) <=
        appliedScrollTopTolerancePx
      ) {
        return;
      }
      nonUserScrollTaintedRef.current = true;
      recordScrollDiagnostic({
        type: 'save-skipped-non-user-scroll',
        anchorKey,
        scrollTop: Math.round(currentScrollTop),
        note
      });
    }

    // Only guards document-scroller mode (iOS: #App.ios is overflow-y
    // visible): that is where the browser's own history restore can move the
    // scroller without user input, and touch/wheel/key input coverage is
    // exhaustive there. Element-scroller platforms have native scrollbars,
    // whose drags emit scroll events with no wheel/touch/key signal (Firefox
    // dispatches no pointer events for them at all) — and no browser-initiated
    // history restore targets the element scroller, so the guard must stay
    // inert there or real user scrolls would be dropped.
    function nonUserScrollGuardHolds() {
      // Before the first in-app pushState, scrollRestoration is still 'auto'
      // and a browser-initiated scroll is the LEGITIMATE deferred restore of
      // a reload / bfcache-evicted return — adopt it as the anchor instead
      // of tainting it. No same-document traversal (and thus no race) can
      // exist yet.
      if (!appOwnsScrollRestoration()) return false;
      const appliedAt = restoreAppliedAtRef.current;
      if (!appliedAt) return false;
      if (nowMs() - appliedAt > postRestoreNonUserSaveGuardMs) return false;
      if (userScrollInputAtRef.current >= appliedAt) return false;
      if (getActiveScroller()) return false;
      return true;
    }

    // A scroll event arriving under guard that has LEFT the applied position
    // is browser-initiated: it taints the position as no longer matching what
    // the hook applied. The position check matters here too, not just in the
    // suppressed branch — the browser can deliver the native echo of the
    // hook's own scrollTop write after the 250ms suppression lapses (busy
    // main thread during a route remount), and that echo sits at the applied
    // position, so it must save normally rather than taint. Taint is a
    // STANDING block — a browser-chosen offset must never become the anchor
    // without ratification, and dwell time is not ratification. It clears
    // only when user scroll input arrives, when the hook applies a scroll
    // (e.g. an observer re-pin correcting the override), or on a top reset.
    function scrollIsNonUserWhileGuarded() {
      if (nonUserScrollTaintedRef.current) {
        recordScrollDiagnostic({
          type: 'save-skipped-non-user-scroll',
          anchorKey,
          scrollTop: Math.round(getScrollTop(getActiveScroller())),
          note: 'standing-taint'
        });
        return true;
      }
      taintIfScrollLeftAppliedPosition('guarded');
      return nonUserScrollTaintedRef.current;
    }

    function saveAnchorAndMarkSettled() {
      saveCurrentAnchor(anchorKey, container, getActiveScroller());
      restoreSettledSignatureRef.current =
        getSavedAnchorRestoreSignature(anchorKey);
    }

    function saveShouldWaitForPendingRestore() {
      const restoreSignature = getSavedAnchorRestoreSignature(anchorKey);
      if (
        activeIgnoredSavedAnchorKeyRef.current === anchorKey ||
        (!!restoreSignature &&
          ignoredSavedAnchorSignaturesRef.current[anchorKey] ===
            restoreSignature)
      ) {
        return false;
      }
      return (
        !!restoreSignature &&
        restoreSettledSignatureRef.current !== restoreSignature
      );
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    scroller?.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      taintIfScrollLeftAppliedPosition('teardown-check');
      if (
        !scrollAnchorSavesAreSuppressed() &&
        !saveShouldWaitForPendingRestore() &&
        !nonUserScrollTaintedRef.current
      ) {
        saveAnchorAndMarkSettled();
      }
      window.removeEventListener('scroll', handleScroll);
      scroller?.removeEventListener('scroll', handleScroll);
    };
  }, [anchorKey, containerRef, itemsReady]);

  useLayoutEffect(() => {
    if (!itemsReady || !containerRef.current) return;
    const savedAnchorRestoreSignature =
      getSavedAnchorRestoreSignature(anchorKey);
    if (
      activeIgnoredSavedAnchorKeyRef.current === anchorKey &&
      savedAnchorRestoreSignature
    ) {
      ignoredSavedAnchorSignaturesRef.current[anchorKey] =
        savedAnchorRestoreSignature;
    }
    const savedAnchorIsIgnored =
      activeIgnoredSavedAnchorKeyRef.current === anchorKey ||
      (!!savedAnchorRestoreSignature &&
        ignoredSavedAnchorSignaturesRef.current[anchorKey] ===
          savedAnchorRestoreSignature);
    const savedAnchor =
      savedAnchorIsIgnored ? undefined : savedScrollAnchors[anchorKey];
    const restoreSignature = savedAnchor ? savedAnchorRestoreSignature : '';
    if (scrollAnchorRestoresAreSuppressed()) {
      markSavedAnchorRestoreSettled();
      return;
    }
    if (userCancelledRestoreRef.current === anchorKey) {
      markSavedAnchorRestoreSettled();
      return;
    }
    if (!savedAnchor) {
      const initialScrollKey = `${anchorKey}:initial`;
      if (initialScrollAttemptedRef.current === initialScrollKey) return;
      initialScrollAttemptedRef.current = initialScrollKey;
      // While the browser still owns scroll (pre-first-push), a programmatic
      // initial scroll would CANCEL the browser's deferred native restore
      // (browsers abandon pending restoration once script scrolls the
      // document), losing the reload / bfcache-evicted-return position.
      // Fresh navigations start at top anyway, so skipping loses nothing.
      if (!appOwnsScrollRestoration()) {
        recordScrollDiagnostic({
          type: 'initial-scroll',
          anchorKey,
          scrollTop: Math.round(getScrollTop(getActiveScroller())),
          itemsReady,
          reason: initialScrollType,
          note: 'skipped-browser-owned'
        });
        return;
      }
      recordScrollDiagnostic({
        type: 'initial-scroll',
        anchorKey,
        scrollTop: Math.round(getScrollTop(getActiveScroller())),
        itemsReady,
        reason: initialScrollType,
        note: savedAnchorIsIgnored ? 'saved-anchor-ignored' : 'no-saved-anchor'
      });
      applyInitialScroll({
        scroller: getActiveScroller(),
        targetRef: initialScrollTargetRef,
        topOffset: initialScrollTopOffset,
        type: initialScrollType
      });
      if (initialScrollType !== 'preserve') {
        markProgrammaticScrollApplied();
      }
      return;
    }

    const anchorToRestore = savedAnchor;
    const restoreKey = `${anchorKey}:${anchorToRestore.primaryId || ''}:${
      anchorToRestore.secondaryId || ''
    }:${anchorToRestore.contentKey || ''}`;
    if (restoreAttemptedRef.current === restoreKey) {
      markSavedAnchorRestoreSettled();
      return;
    }
    restoreAttemptedRef.current = restoreKey;

    let attempts = 0;
    let restoreFrame = 0;
    let settleFrame = 0;
    let settleAttempts = 0;
    let observerTimer = 0;
    let resizeObserver: ResizeObserver | null = null;
    let mutationObserver: MutationObserver | null = null;
    let restoreCancelled = false;
    let cancelListenersAttached = false;
    let removeRestoreCancelSignalListener: (() => void) | null = null;
    let landedOnAnchor = false;
    const restoreStartedAt = nowMs();

    function diag(type: string, extra: Record<string, unknown> = {}) {
      recordScrollDiagnostic({
        type,
        anchorKey,
        scrollTop: Math.round(getScrollTop(getActiveScroller())),
        itemsReady,
        primaryId: anchorToRestore.primaryId,
        secondaryId: anchorToRestore.secondaryId,
        savedScrollTop: anchorToRestore.scrollTop,
        savedOffset: anchorToRestore.offset,
        ...extra
      });
    }

    diag('restore-start');

    function restore() {
      if (restoreCancelled) return;
      if (scrollAnchorRestoresAreSuppressed()) {
        diag('restore-suppressed');
        cancelPendingRestore('suppressed');
        return;
      }
      const container = containerRef.current;
      if (!container) return;
      const scroller = getActiveScroller();
      const anchorElement = findAnchorElement(container, anchorToRestore);
      if (!anchorElement) {
        restoreToSavedScrollTop(anchorToRestore, scroller);
        markProgrammaticScrollApplied();
        diag('anchor-missing-fallback-scrolltop', { attempt: attempts });
        markRestoreSettledIfNoAnchorIdentity();
        attempts += 1;
        if (attempts < 12) {
          restoreFrame = window.requestAnimationFrame(restore);
        } else if (!resizeObserver && !mutationObserver) {
          markRestoreSettled();
        }
        return;
      }
      const computedScrollTop = restoreToAnchor(
        anchorElement,
        anchorToRestore.offset,
        scroller
      );
      markProgrammaticScrollApplied();
      landedOnAnchor = true;
      diag('restore-to-anchor', { computedScrollTop });
      markRestoreSettled();
      settleAnchor();
    }

    addRestoreCancelListeners();
    restore();

    if (typeof ResizeObserver === 'function') {
      resizeObserver = new ResizeObserver(() => {
        restore();
      });
      resizeObserver.observe(containerRef.current);
    }
    if (typeof MutationObserver === 'function') {
      mutationObserver = new MutationObserver(() => {
        restore();
      });
      mutationObserver.observe(containerRef.current, {
        childList: true,
        subtree: true
      });
    }
    if (resizeObserver || mutationObserver) {
      observerTimer = window.setTimeout(() => {
        resizeObserver?.disconnect();
        mutationObserver?.disconnect();
        markRestoreSettled();
        removeRestoreCancelListeners();
      }, 3000);
    }

    return () => {
      cancelPendingRestore('cleanup');
    };

    function addRestoreCancelListeners() {
      if (cancelListenersAttached) return;
      cancelListenersAttached = true;
      window.addEventListener('wheel', handleWheelCancel, {
        capture: true,
        passive: true
      });
      window.addEventListener('touchmove', handleTouchCancel, {
        capture: true,
        passive: true
      });
      window.addEventListener('keydown', handleRestoreKeyDown, {
        capture: true
      });
      removeRestoreCancelSignalListener =
        addScrollAnchorRestoreCancelListener(() =>
          cancelPendingRestore('signal')
        );
    }

    function removeRestoreCancelListeners() {
      if (!cancelListenersAttached) return;
      cancelListenersAttached = false;
      window.removeEventListener('wheel', handleWheelCancel, {
        capture: true
      });
      window.removeEventListener('touchmove', handleTouchCancel, {
        capture: true
      });
      window.removeEventListener('keydown', handleRestoreKeyDown, {
        capture: true
      });
      removeRestoreCancelSignalListener?.();
      removeRestoreCancelSignalListener = null;
    }

    function handleWheelCancel() {
      handleUserScrollInput('wheel');
    }

    function handleTouchCancel() {
      handleUserScrollInput('touchmove');
    }

    // While a restore is in flight and has NOT yet pinned the saved anchor,
    // ignore incidental pointer input for a short grace window so iOS momentum
    // / the navigation tap can't strand the scroll at the fallback position.
    // Once the anchor is pinned (or the grace elapses) we honor input normally
    // so a deliberate scroll is never fought.
    function handleUserScrollInput(reason: string) {
      if (
        !landedOnAnchor &&
        nowMs() - restoreStartedAt < restoreCancelGraceMs
      ) {
        diag('cancel-suppressed', { reason });
        return;
      }
      diag('cancel', { reason });
      cancelPendingRestore(reason);
    }

    function handleRestoreKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (!restoreCancelKeys.has(event.key)) return;
      diag('cancel', { reason: 'keydown' });
      cancelPendingRestore('keydown');
    }

    function cancelPendingRestore(reason = 'cancel') {
      if (restoreCancelled) return;
      restoreCancelled = true;
      // Effect teardown on ordinary unmount/navigation is normal bookkeeping,
      // not an interrupted restore — log it as a distinct teardown so it never
      // counts toward the "restores cancelled" signal. Genuine cancels (touch /
      // wheel / key / coordinator signal) stay as restore-cancelled, and the
      // note records whether the restore had pinned the anchor before it ended.
      diag(reason === 'cleanup' ? 'restore-teardown' : 'restore-cancelled', {
        reason,
        note: landedOnAnchor ? 'landed' : 'not-landed'
      });
      markRestoreSettled();
      if (restoreFrame) window.cancelAnimationFrame(restoreFrame);
      if (settleFrame) window.cancelAnimationFrame(settleFrame);
      if (observerTimer) window.clearTimeout(observerTimer);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      removeRestoreCancelListeners();
    }

    function settleAnchor() {
      if (restoreCancelled) return;
      if (settleFrame) return;

      settleFrame = window.requestAnimationFrame(function settle() {
        if (restoreCancelled) return;
        if (scrollAnchorRestoresAreSuppressed()) {
          cancelPendingRestore('suppressed');
          return;
        }
        settleFrame = 0;
        const container = containerRef.current;
        if (!container) return;
        const scroller = getActiveScroller();
        const anchorElement = findAnchorElement(container, anchorToRestore);
        if (!anchorElement) {
          restoreToSavedScrollTop(anchorToRestore, scroller);
          markProgrammaticScrollApplied();
          markRestoreSettledIfNoAnchorIdentity();
          return;
        }

        const computedScrollTop = restoreToAnchor(
          anchorElement,
          anchorToRestore.offset,
          scroller
        );
        markProgrammaticScrollApplied();
        landedOnAnchor = true;
        markRestoreSettled();
        settleAttempts += 1;
        if (settleAttempts >= 11) {
          diag('settle-final', { computedScrollTop, attempt: settleAttempts });
        }
        if (settleAttempts < 12 && !restoreCancelled) {
          settleFrame = window.requestAnimationFrame(settle);
        }
      });
    }

    // A hook-applied scroll re-establishes "position matches what we applied":
    // it restarts the non-user-save guard window and clears any taint from an
    // earlier browser-initiated scroll (e.g. an observer re-pin correcting it).
    // The applied position is read back after the write so clamping is
    // captured; it is the baseline the suppression-window taint check
    // compares against.
    function markProgrammaticScrollApplied() {
      restoreAppliedAtRef.current = nowMs();
      nonUserScrollTaintedRef.current = false;
      lastAppliedScrollTopRef.current = getScrollTop(getActiveScroller());
    }

    function markRestoreSettled() {
      restoreSettledSignatureRef.current = restoreSignature;
    }

    function markRestoreSettledIfNoAnchorIdentity() {
      if (!savedAnchorHasElementIdentity(anchorToRestore)) {
        markRestoreSettled();
      }
    }

    function markSavedAnchorRestoreSettled() {
      if (restoreSignature) {
        restoreSettledSignatureRef.current = restoreSignature;
      }
    }
  }, [
    anchorKey,
    containerRef,
    initialScrollTargetRef,
    initialScrollTopOffset,
    initialScrollType,
    itemsReady,
    ignoreSavedAnchor
  ]);
}

function savedAnchorHasElementIdentity(savedAnchor: SavedScrollAnchor) {
  return Boolean(
    savedAnchor.primaryId || savedAnchor.secondaryId || savedAnchor.contentKey
  );
}

function getSavedAnchorRestoreSignature(anchorKey: string) {
  const savedAnchor = savedScrollAnchors[anchorKey];
  if (!savedAnchor) return '';
  return `${anchorKey}:${savedAnchor.primaryId || ''}:${
    savedAnchor.secondaryId || ''
  }:${savedAnchor.contentKey || ''}:${savedAnchor.offset}:${savedAnchor.scrollTop}`;
}

export function clearSavedScrollAnchors(...anchorKeys: string[]) {
  for (const anchorKey of anchorKeys) {
    delete savedScrollAnchors[anchorKey];
  }
}

export function saveScrollAnchorForElement(
  sourceElement: HTMLElement | null,
  anchorKey?: string
) {
  if (!sourceElement) return;
  const anchorElement = sourceElement.closest<HTMLElement>(
    '[data-scroll-anchor-id], [data-scroll-anchor-content-key]'
  );
  if (anchorKey && anchorElement) {
    saveAnchorElement(anchorKey, anchorElement, getActiveScroller());
    suppressScrollAnchorSaves(restoreSaveSuppressionDurationMs);
    return;
  }

  if (!anchorKey && anchorElement) {
    const groupKey = anchorElement.closest<HTMLElement>(
      '[data-scroll-anchor-group-key]'
    )?.dataset.scrollAnchorGroupKey;
    if (groupKey) {
      saveAnchorElement(groupKey, anchorElement, getActiveScroller());
      suppressScrollAnchorSaves(restoreSaveSuppressionDurationMs);
      return;
    }
  }

  const contentPagePanel = sourceElement.closest<HTMLElement>(
    '[data-content-page="true"]'
  );
  const contentAnchorContainer = contentPagePanel?.closest<HTMLElement>(
    '[data-scroll-anchor-id^="content:"]'
  );
  const contentAnchorKey = contentAnchorContainer?.dataset.scrollAnchorId;
  if (!contentAnchorKey || !contentAnchorContainer) return;

  if (
    anchorElement &&
    anchorElement !== contentAnchorContainer &&
    contentAnchorContainer.contains(anchorElement)
  ) {
    saveAnchorElement(contentAnchorKey, anchorElement, getActiveScroller());
    suppressScrollAnchorSaves(restoreSaveSuppressionDurationMs);
    return;
  }

  saveCurrentAnchor(
    contentAnchorKey,
    contentAnchorContainer,
    getActiveScroller()
  );
  notifyScrollAnchorExternalSave(contentAnchorKey);
  suppressScrollAnchorSaves(restoreSaveSuppressionDurationMs);
}

function applyInitialScroll({
  scroller,
  targetRef,
  topOffset,
  type
}: {
  scroller: HTMLElement | null;
  targetRef: RefObject<HTMLElement | null> | null;
  topOffset?: number;
  type: InitialScrollPolicy['type'];
}) {
  if (type === 'preserve') return;
  if (type === 'top') {
    suppressScrollAnchorSaves(restoreSaveSuppressionDurationMs);
    setScrollTop(scroller, 0);
    return;
  }

  const targetElement = targetRef?.current;
  if (!targetElement) return;
  suppressScrollAnchorSaves(restoreSaveSuppressionDurationMs);
  scrollElementToTop(targetElement, topOffset || 0, scroller);
}

function saveAnchorElement(
  anchorKey: string,
  anchorElement: HTMLElement,
  scroller: HTMLElement | null
) {
  const viewportTop = getViewportTop(scroller);
  const rect = anchorElement.getBoundingClientRect();
  savedScrollAnchors[anchorKey] = {
    anchorKey,
    primaryId: anchorElement.dataset.scrollAnchorId,
    secondaryId: anchorElement.dataset.scrollAnchorSecondaryId,
    contentKey: anchorElement.dataset.scrollAnchorContentKey,
    offset: viewportTop - rect.top,
    scrollTop: getScrollTop(scroller)
  };
  notifyScrollAnchorExternalSave(anchorKey);
  recordAnchorSave(anchorKey, 'element');
}

function recordAnchorSave(anchorKey: string, note: string) {
  if (!isScrollDiagnosticsLoggingEnabled()) return;
  const saved = savedScrollAnchors[anchorKey];
  if (!saved) return;
  recordScrollDiagnostic({
    type: 'save',
    anchorKey,
    primaryId: saved.primaryId,
    secondaryId: saved.secondaryId,
    savedScrollTop: saved.scrollTop,
    savedOffset: Math.round(saved.offset),
    scrollTop: Math.round(saved.scrollTop),
    note
  });
}

function saveCurrentAnchor(
  anchorKey: string,
  container: HTMLElement | null,
  scroller: HTMLElement | null
) {
  if (!container) return;
  const scrollTop = getScrollTop(scroller);
  if (!container.isConnected) {
    if (savedScrollAnchors[anchorKey]) return;
    savedScrollAnchors[anchorKey] = {
      anchorKey,
      offset: 0,
      scrollTop
    };
    recordAnchorSave(anchorKey, 'disconnected');
    return;
  }

  const items = getScrollAnchorItems(container);
  if (items.length === 0) {
    savedScrollAnchors[anchorKey] = {
      anchorKey,
      offset: 0,
      scrollTop
    };
    recordAnchorSave(anchorKey, 'no-items');
    return;
  }

  const viewportTop = getViewportTop(scroller);
  const viewportBottom = getViewportBottom(scroller);
  const anchorElement = findCurrentAnchorElement({
    items,
    viewportBottom,
    viewportTop
  });
  if (!anchorElement) {
    savedScrollAnchors[anchorKey] = {
      anchorKey,
      offset: 0,
      scrollTop
    };
    recordAnchorSave(anchorKey, 'no-anchor-in-view');
    return;
  }

  const rect = anchorElement.getBoundingClientRect();
  savedScrollAnchors[anchorKey] = {
    anchorKey,
    primaryId: anchorElement.dataset.scrollAnchorId,
    secondaryId: anchorElement.dataset.scrollAnchorSecondaryId,
    contentKey: anchorElement.dataset.scrollAnchorContentKey,
    offset: viewportTop - rect.top,
    scrollTop
  };
  recordAnchorSave(anchorKey, 'current');
}

function findCurrentAnchorElement({
  items,
  viewportBottom,
  viewportTop
}: {
  items: HTMLElement[];
  viewportBottom: number;
  viewportTop: number;
}) {
  const viewportHeight = Math.max(0, viewportBottom - viewportTop);
  const anchorLine =
    viewportTop + Math.min(Math.max(viewportHeight * 0.1, 72), 140);
  let containingAnchor: { item: HTMLElement; height: number } | null = null;
  let firstLowerAnchor: HTMLElement | null = null;
  let nearestAnchor: { item: HTMLElement; distance: number } | null = null;

  for (const item of items) {
    const rect = item.getBoundingClientRect();
    const distanceFromAnchorLine =
      rect.top > anchorLine
        ? rect.top - anchorLine
        : Math.max(0, anchorLine - rect.bottom);
    if (!nearestAnchor || distanceFromAnchorLine < nearestAnchor.distance) {
      nearestAnchor = {
        item,
        distance: distanceFromAnchorLine
      };
    }

    const visibleHeight =
      Math.min(rect.bottom, viewportBottom) - Math.max(rect.top, viewportTop);
    if (visibleHeight <= 1) continue;
    if (rect.top <= anchorLine && rect.bottom >= anchorLine) {
      const height = Math.max(rect.height, 1);
      if (!containingAnchor || height < containingAnchor.height) {
        containingAnchor = { item, height };
      }
      continue;
    }
    if (rect.bottom >= anchorLine && !firstLowerAnchor) {
      firstLowerAnchor = item;
    }
  }

  return containingAnchor?.item || firstLowerAnchor || nearestAnchor?.item;
}

function findAnchorElement(
  container: HTMLElement,
  savedAnchor: SavedScrollAnchor
) {
  const items = getScrollAnchorItems(container);
  if (savedAnchor.primaryId) {
    const primaryMatch = items.find(
      (item) => item.dataset.scrollAnchorId === savedAnchor.primaryId
    );
    if (primaryMatch) return primaryMatch;
  }

  if (savedAnchor.secondaryId) {
    const secondaryMatch = items.find(
      (item) =>
        item.dataset.scrollAnchorSecondaryId === savedAnchor.secondaryId
    );
    if (secondaryMatch) return secondaryMatch;
  }

  if (savedAnchor.contentKey) {
    return items.find(
      (item) => item.dataset.scrollAnchorContentKey === savedAnchor.contentKey
    );
  }

  return undefined;
}

function getScrollAnchorItems(container: HTMLElement) {
  const items = Array.from(
    container.querySelectorAll<HTMLElement>(
      '[data-scroll-anchor-id], [data-scroll-anchor-content-key]'
    )
  );
  if (
    container.dataset.scrollAnchorId !== undefined ||
    container.dataset.scrollAnchorContentKey !== undefined
  ) {
    items.unshift(container);
  }
  return items.filter(
    (item) =>
      item.dataset.scrollAnchorId !== undefined ||
      item.dataset.scrollAnchorContentKey !== undefined
  );
}

function restoreToAnchor(
  anchorElement: HTMLElement,
  offset: number,
  scroller: HTMLElement | null
) {
  const viewportTop = getViewportTop(scroller);
  const rect = anchorElement.getBoundingClientRect();
  const currentScrollTop = getScrollTop(scroller);
  const nextScrollTop = Math.max(
    0,
    currentScrollTop + rect.top - viewportTop + offset
  );
  suppressScrollAnchorSaves(restoreSaveSuppressionDurationMs);
  setScrollTop(scroller, nextScrollTop);
  return Math.round(nextScrollTop);
}

function nowMs() {
  try {
    return performance.now();
  } catch {
    return Date.now();
  }
}

function restoreToSavedScrollTop(
  savedAnchor: SavedScrollAnchor,
  scroller: HTMLElement | null
) {
  if (!Number.isFinite(savedAnchor.scrollTop)) return;
  suppressScrollAnchorSaves(restoreSaveSuppressionDurationMs);
  setScrollTop(scroller, Math.max(0, savedAnchor.scrollTop));
}

function scrollElementToTop(
  element: HTMLElement,
  topOffset: number,
  scroller: HTMLElement | null
) {
  const viewportTop = getViewportTop(scroller);
  const rect = element.getBoundingClientRect();
  const currentScrollTop = getScrollTop(scroller);
  const nextScrollTop = currentScrollTop + rect.top - viewportTop - topOffset;
  setScrollTop(scroller, Math.max(0, nextScrollTop));
}

function getAppScroller() {
  return document.getElementById('App');
}

function getActiveScroller() {
  const scroller = getAppScroller();
  return scroller && elementUsesOwnScroll(scroller) ? scroller : null;
}

function elementUsesOwnScroll(element: HTMLElement) {
  const { overflowY } = window.getComputedStyle(element);
  return scrollableOverflowValues.has(overflowY);
}

function getViewportTop(scroller: HTMLElement | null) {
  return scroller ? scroller.getBoundingClientRect().top : 0;
}

function getViewportBottom(scroller: HTMLElement | null) {
  return scroller ? scroller.getBoundingClientRect().bottom : window.innerHeight;
}

function getScrollTop(scroller: HTMLElement | null) {
  const bodyRef = document.scrollingElement || document.documentElement;
  return scroller ? scroller.scrollTop : bodyRef?.scrollTop || 0;
}

// True only during setScrollTop's synchronous dispatch: those scroll events
// are the hook's own and fire before the caller can record the newly applied
// position, so the applied-position taint check must not classify them.
let applyingProgrammaticScroll = false;

function setScrollTop(scroller: HTMLElement | null, scrollTop: number) {
  const bodyRef = document.scrollingElement || document.documentElement;
  applyingProgrammaticScroll = true;
  try {
    if (scroller) {
      scroller.scrollTop = scrollTop;
      scroller.dispatchEvent(new Event('scroll'));
    } else if (bodyRef) {
      bodyRef.scrollTop = scrollTop;
      bodyRef.dispatchEvent(new Event('scroll'));
    }
    window.dispatchEvent(new Event('scroll'));
  } finally {
    applyingProgrammaticScroll = false;
  }
}
