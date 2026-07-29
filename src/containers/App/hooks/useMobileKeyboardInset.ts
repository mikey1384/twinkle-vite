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

/**
 * Publishes how much of the viewport the on-screen keyboard is covering.
 *
 * Mobile browsers shrink only the VISUAL viewport when the keyboard opens — the
 * LAYOUT viewport that `height: 100%` resolves against keeps its full height. On
 * surfaces that fill the viewport and clip their overflow (the build workspace,
 * chat), that leaves the document with zero scroll room, so a bottom-anchored
 * composer lays out *behind* the keyboard with no way to bring it up, and
 * WebKit's caret-reveal keeps yanking the surface back to the offset it chose
 * when the keyboard rose — which is what a swipe "snapping back" actually is.
 *
 * Subtracting this inset from the shell height keeps layout inside the visual
 * viewport, which removes both symptoms at their shared cause: the composer is
 * on screen, and the browser has nothing left to pan.
 */
export default function useMobileKeyboardInset() {
  useEffect(() => {
    const visualViewport = window.visualViewport;
    if (!visualViewport) return;
    const root = document.documentElement;
    let frame: number | null = null;

    applyInset();
    visualViewport.addEventListener('resize', scheduleApply);
    visualViewport.addEventListener('scroll', scheduleApply);
    window.addEventListener('orientationchange', scheduleApply);
    // focusin/focusout are what tell us a keyboard is plausible at all; without
    // them a viewport that shrinks for browser chrome reads as a keyboard.
    document.addEventListener('focusin', scheduleApply);
    document.addEventListener('focusout', scheduleApply);

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      visualViewport.removeEventListener('resize', scheduleApply);
      visualViewport.removeEventListener('scroll', scheduleApply);
      window.removeEventListener('orientationchange', scheduleApply);
      document.removeEventListener('focusin', scheduleApply);
      document.removeEventListener('focusout', scheduleApply);
      root.style.removeProperty(APP_SHELL_KEYBOARD_INSET_VAR);
    };

    function scheduleApply() {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(() => {
        frame = null;
        applyInset();
      });
    }

    function applyInset() {
      const inset = `${readInset()}px`;
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
      // cannot feed back on itself. visualViewport.offsetTop is deliberately
      // excluded: it is how far the browser panned to reveal the caret, and the
      // shrink is what unwinds that pan.
      const layoutHeight = root.clientHeight;
      if (!layoutHeight) return 0;
      const occluded = layoutHeight - visualViewport.height;
      if (occluded <= 1) return 0;
      return Math.round(Math.min(occluded, layoutHeight * MAX_INSET_RATIO));
    }
  }, []);
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
