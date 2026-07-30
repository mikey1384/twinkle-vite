import { useEffect } from 'react';
import { APP_SHELL_KEYBOARD_INSET_VAR } from '~/constants/appShell';

// Input types that never open the on-screen keyboard.
const NON_TEXT_INPUT_TYPES = new Set([
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

// A misread must never be able to collapse the app to nothing.
const MAX_INSET_RATIO = 0.7;
// Mobile browsers can deliver the viewport resize before the caret-reveal pan.
// Requiring consecutive matching frames keeps that intermediate geometry out of
// shared layout without adding a fixed device-specific keyboard-animation delay.
const REQUIRED_STABLE_VIEWPORT_FRAMES = 3;

/**
 * Publishes how much of the viewport the on-screen keyboard is covering.
 *
 * Mobile browsers can shrink and pan the VISUAL viewport when the keyboard
 * opens, while the LAYOUT viewport that `height: 100%` resolves against may keep
 * its full height. On surfaces that fill the layout viewport and clip overflow,
 * that can leave bottom-anchored controls behind the keyboard.
 *
 * Publishing the space below the visual viewport's actual bottom edge keeps the
 * shell inside the visible boundary without counting the browser's caret-reveal
 * pan as keyboard coverage a second time.
 */
export default function useMobileKeyboardInset() {
  useEffect(() => {
    const visualViewport = window.visualViewport;
    if (!visualViewport) return;
    const root = document.documentElement;
    const insetPublisher = createSettledInsetPublisher({
      readInset,
      publishInset: applyInset,
      requestFrame: (callback) => window.requestAnimationFrame(callback),
      cancelFrame: (frameId) => window.cancelAnimationFrame(frameId)
    });

    insetPublisher.schedule();
    // The inset is a difference between TWO measurements, so BOTH have to be
    // watched. Subscribing only to visualViewport was a real bug: an in-app
    // WKWebView (a link opened inside Instagram, Facebook, etc.), Android Chrome
    // with interactive-widget=resizes-content, and iPadOS split view all shrink
    // the LAYOUT viewport for the keyboard as well. That fires window resize, not
    // a visualViewport event, so a keyboard-sized inset stayed published after
    // clientHeight had already dropped to match — and the shell got shrunk twice,
    // collapsing chat to a sliver. Observing documentElement directly is what
    // makes this self-correcting rather than a list of events to keep guessing at.
    visualViewport.addEventListener('resize', insetPublisher.schedule);
    visualViewport.addEventListener('scroll', insetPublisher.schedule);
    window.addEventListener('resize', insetPublisher.schedule);
    window.addEventListener('orientationchange', insetPublisher.schedule);
    // focusin/focusout are what tell us a keyboard is plausible at all; without
    // them a viewport that shrinks for browser chrome reads as a keyboard.
    document.addEventListener('focusin', insetPublisher.schedule);
    document.addEventListener('focusout', insetPublisher.schedule);
    // No feedback loop: the inset is applied to the shell inside <body>, while
    // the root box stays 100% of the layout viewport, so publishing it cannot
    // resize what is being observed.
    let rootResizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      rootResizeObserver = new ResizeObserver(insetPublisher.schedule);
      rootResizeObserver.observe(root);
    }

    return () => {
      insetPublisher.dispose();
      visualViewport.removeEventListener('resize', insetPublisher.schedule);
      visualViewport.removeEventListener('scroll', insetPublisher.schedule);
      window.removeEventListener('resize', insetPublisher.schedule);
      window.removeEventListener('orientationchange', insetPublisher.schedule);
      document.removeEventListener('focusin', insetPublisher.schedule);
      document.removeEventListener('focusout', insetPublisher.schedule);
      rootResizeObserver?.disconnect();
      root.style.removeProperty(APP_SHELL_KEYBOARD_INSET_VAR);
    };

    function applyInset(nextInset: number) {
      const inset = `${nextInset}px`;
      if (
        root.style.getPropertyValue(APP_SHELL_KEYBOARD_INSET_VAR).trim() ===
        inset
      ) {
        return;
      }
      root.style.setProperty(APP_SHELL_KEYBOARD_INSET_VAR, inset);
    }

    function readInset() {
      if (!visualViewport) return 0;
      // No editable focused means whatever shrank the visual viewport was
      // browser chrome (the collapsing iOS toolbar), not a keyboard. Shrinking
      // the shell for that would thrash layout on every scroll.
      if (!editableElementIsFocused()) return 0;
      // Pinch/page zoom shrinks the visual viewport too; only at scale 1 can the
      // difference be attributed to the keyboard.
      if (Math.abs((visualViewport.scale || 1) - 1) > 0.01) return 0;
      // documentElement.clientHeight is the LAYOUT viewport height (per CSSOM,
      // for the root element in standards mode) — the same height `100%`
      // resolves against, and it does not change when the shell shrinks, so this
      // cannot feed back on itself.
      const layoutHeight = root.clientHeight;
      return calculateMobileKeyboardInset({
        layoutHeight,
        visualViewportHeight: visualViewport.height,
        visualViewportOffsetTop: visualViewport.offsetTop
      });
    }
  }, []);
}

export function createSettledInsetPublisher({
  readInset,
  publishInset,
  requestFrame,
  cancelFrame
}: {
  readInset: () => number;
  publishInset: (inset: number) => void;
  requestFrame: (callback: () => void) => number;
  cancelFrame: (frameId: number) => void;
}) {
  let frame: number | null = null;
  let lastInset: number | null = null;
  let stableFrameCount = 0;
  let disposed = false;

  return {
    schedule,
    dispose
  };

  function schedule() {
    if (disposed) return;
    // A new viewport/focus event invalidates every observation made before it.
    // The next publication must be confirmed again from the new geometry.
    lastInset = null;
    stableFrameCount = 0;
    requestNextFrame();
  }

  function dispose() {
    disposed = true;
    if (frame !== null) {
      cancelFrame(frame);
      frame = null;
    }
  }

  function requestNextFrame() {
    if (disposed || frame !== null) return;
    frame = requestFrame(measure);
  }

  function measure() {
    frame = null;
    if (disposed) return;
    const inset = readInset();
    if (inset === lastInset) {
      stableFrameCount += 1;
    } else {
      lastInset = inset;
      stableFrameCount = 1;
    }
    if (stableFrameCount >= REQUIRED_STABLE_VIEWPORT_FRAMES) {
      publishInset(inset);
      return;
    }
    requestNextFrame();
  }
}

export function calculateMobileKeyboardInset({
  layoutHeight,
  visualViewportHeight,
  visualViewportOffsetTop
}: {
  layoutHeight: number;
  visualViewportHeight: number;
  visualViewportOffsetTop: number;
}) {
  if (!layoutHeight) return 0;

  // The visual viewport's bottom edge, not its height alone, is the canonical
  // visible boundary. Mobile browsers can pan that viewport downward to reveal
  // the focused caret. Ignoring offsetTop counts the browser's pan as additional
  // keyboard coverage, so the shell moves a bottom composer upward a second
  // time. Negative offsets are rubber-band overscroll, not keyboard occlusion.
  const visibleBottom =
    Math.max(0, visualViewportOffsetTop) + visualViewportHeight;
  const occluded = layoutHeight - visibleBottom;
  if (occluded <= 1) return 0;
  return Math.round(Math.min(occluded, layoutHeight * MAX_INSET_RATIO));
}

// Deliberately does NOT treat a focused IFRAME as editable. Tapping anywhere in
// any frame — a YouTube embed, a build app with no text field — makes the frame
// the host's activeElement, and the host cannot see whether a keyboard actually
// opened inside it. Trusting that would let ordinary iOS toolbar collapse (which
// shrinks the visual viewport by ~50-90px with no keyboard present) publish a
// bogus inset and jump the shell, modals and nav reserve mid-scroll. A sandboxed
// build app owns its own layout via the Twinkle.preview sizing APIs.
//
// Read-only fields are excluded for the same reason: they take focus and hold it
// until the user taps away, but no keyboard ever opens. The build code editor is
// read-only for non-owners, while code streams, and when project files are
// locked; the generated-asset URL field and the chess FEN field exist to be
// tapped and copied. `disabled` needs no branch — it cannot take focus at all.
function editableElementIsFocused() {
  const active = document.activeElement as HTMLElement | null;
  if (!active) return false;
  if (active.isContentEditable) return true;
  const tagName = active.tagName;
  if (tagName === 'TEXTAREA') {
    return !(active as HTMLTextAreaElement).readOnly;
  }
  if (tagName !== 'INPUT') return false;
  const input = active as HTMLInputElement;
  if (input.readOnly) return false;
  const inputType = String(input.type || '').toLowerCase();
  return !NON_TEXT_INPUT_TYPES.has(inputType);
}
