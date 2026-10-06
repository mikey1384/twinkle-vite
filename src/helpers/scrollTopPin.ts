// After a forward navigation opens a page at the top, iOS Safari (document
// scroller, async UI-process scrolling) can put the PREVIOUS page's offset
// back: the new page first renders shorter than that offset, so scrollTop
// reads a clamped 0, and once the content arrives and the document grows
// WebKit re-applies the old offset (owner trace 2026-10-06: a pinned comment's
// date link opened /comments/335037 at scrollTop 869 a few ms after the hook
// set 0). A top pin window puts such a browser-chosen offset back to 0 for a
// short while. It never fights the user: any scroll input ends it for good,
// and it also ends on its own after a short window or a hard cap.
//
// Pure state machine so it can be tested without a DOM; the hook wires the
// listeners, observers and timers around it.

export const topPinWindowMs = 1500;
// A page that keeps re-applying top resets (data arriving in pieces) extends
// the window, but never past this from the first start.
export const topPinHardCapMs = 4000;
// A position fought this many times is not a one-off WebKit re-apply; stop.
export const topPinMaxRepins = 12;
// Subpixel layout settling is not a stray offset.
const strayScrollTopThresholdPx = 1;

export interface TopPinWindow {
  isActive(): boolean;
  // Called on a scroll event or a document resize; re-pins and returns true
  // when a non-user offset left the top.
  check(trigger: string): boolean;
  // The hook applied another top scroll while the window was open.
  extend(): void;
  stop(reason: string): void;
}

export function createTopPinWindow({
  now,
  readScrollTop,
  userInputSince,
  repin,
  onEnd
}: {
  now: () => number;
  readScrollTop: () => number;
  // True when touch / wheel / key / pointer input arrived at or after the
  // given time.
  userInputSince: (time: number) => boolean;
  repin: (strayScrollTop: number, trigger: string, count: number) => void;
  onEnd: (reason: string, repins: number) => void;
}): TopPinWindow {
  const startedAt = now();
  let lastExtendedAt = startedAt;
  let repins = 0;
  let active = true;

  function stop(reason: string) {
    if (!active) return;
    active = false;
    onEnd(reason, repins);
  }

  function expired(time: number) {
    return (
      time - lastExtendedAt > topPinWindowMs ||
      time - startedAt > topPinHardCapMs
    );
  }

  return {
    isActive: () => active,
    check(trigger) {
      if (!active) return false;
      const time = now();
      if (expired(time)) {
        stop('expired');
        return false;
      }
      if (userInputSince(startedAt)) {
        stop('user-input');
        return false;
      }
      const scrollTop = readScrollTop();
      if (!(scrollTop >= strayScrollTopThresholdPx)) return false;
      if (repins >= topPinMaxRepins) {
        stop('repin-cap');
        return false;
      }
      repins += 1;
      repin(scrollTop, trigger, repins);
      return true;
    },
    extend() {
      if (!active) return;
      const time = now();
      if (time - startedAt > topPinHardCapMs) {
        stop('expired');
        return;
      }
      lastExtendedAt = time;
    },
    stop
  };
}

// The pin is for arriving on a page, not for the page changing its own anchor
// key: People / Build / Prompt search key their anchor on the query text, so
// every keystroke re-runs the hook's key effect while the last navigation
// type is still PUSH. Opening a pin there fought iOS revealing the caret with
// the keyboard open (release review 2026-10-06). One gate for the whole app
// so a hook that remounts on the same location (a results list that mounts
// once a query is typed) doesn't count as a navigation either.
export function createTopPinNavigationGate() {
  let lastLocationKey: string | null = null;
  return {
    // True only the first time a given location key is seen.
    consume(locationKey: string) {
      if (locationKey === lastLocationKey) return false;
      lastLocationKey = locationKey;
      return true;
    }
  };
}

const nonTextInputTypes = new Set([
  'button',
  'checkbox',
  'color',
  'file',
  'hidden',
  'image',
  'radio',
  'range',
  'reset',
  'submit'
]);

interface FocusedElementLike {
  tagName?: string;
  isContentEditable?: boolean;
  readOnly?: boolean;
  type?: string;
}

// A focused text field means the person is working on the page (and on iOS
// the keyboard is open, so WebKit scrolls to the caret): never open a pin.
// Same rules as useMobileKeyboardInset: read-only fields and non-text inputs
// open no keyboard, so they don't count.
export function elementIsEditableField(
  element: FocusedElementLike | null | undefined
) {
  if (!element) return false;
  if (element.isContentEditable) return true;
  const tagName = String(element.tagName || '').toUpperCase();
  if (tagName === 'TEXTAREA') return !element.readOnly;
  if (tagName !== 'INPUT') return false;
  if (element.readOnly) return false;
  return !nonTextInputTypes.has(String(element.type || '').toLowerCase());
}
