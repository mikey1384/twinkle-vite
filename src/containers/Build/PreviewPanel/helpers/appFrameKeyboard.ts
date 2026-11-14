import { calculateMobileKeyboardInset } from '~/containers/App/hooks/useMobileKeyboardInset';

// The on-screen keyboard as an app frame sees it (Twinkle.preview
// layout.keyboard): open, and how many CSS px of the frame's bottom it covers.
export interface AppFrameKeyboardState {
  open: boolean;
  height: number;
}

export const CLOSED_APP_FRAME_KEYBOARD: AppFrameKeyboardState = {
  open: false,
  height: 0
};

// How long after the keyboard closes the host checks that the page is back
// where it was. iOS animates the keyboard away (~250 ms) and can re-apply its
// own scroll after that, so the check repeats; it never runs later than this.
export const APP_FRAME_KEYBOARD_RESTORE_DELAYS_MS = [0, 250, 600] as const;

// A visual viewport this much shorter than the layout viewport at scale 1,
// while a text field in the app has focus, is the keyboard even when the
// browser has panned all the way down to the field (nothing left below the
// visible bottom edge). Collapsing browser toolbars change it by ~50-90 px;
// phone keyboards are well over 200 px.
const KEYBOARD_VIEWPORT_SHRINK_PX = 150;

// The host learns that a text field inside the app has focus only from the
// app's SDK (keyboard:focus); it cannot see into the sandboxed frame. Given
// that, the keyboard is whatever hides the bottom of the visual viewport
// (the same measurement as the shell's own keyboard inset), and the frame's
// share of it is the part of the frame below the visible bottom edge. All
// geometry is in the outermost Twinkle window's layout-viewport CSS px;
// frameCssHeight converts to the app's own CSS px when the frame is scaled.
export function calculateAppFrameKeyboard({
  editing,
  layoutHeight,
  visualViewportHeight,
  visualViewportOffsetTop,
  visualViewportScale,
  frameTop,
  frameBottom,
  frameCssHeight
}: {
  editing: boolean;
  layoutHeight: number;
  visualViewportHeight: number;
  visualViewportOffsetTop: number;
  visualViewportScale: number;
  frameTop: number;
  frameBottom: number;
  frameCssHeight: number;
}): AppFrameKeyboardState {
  if (!editing) return CLOSED_APP_FRAME_KEYBOARD;
  // Pinch zoom shrinks the visual viewport too; only at scale 1 is the
  // difference the keyboard.
  if (Math.abs((visualViewportScale || 1) - 1) > 0.01) {
    return CLOSED_APP_FRAME_KEYBOARD;
  }
  const occluded = calculateMobileKeyboardInset({
    layoutHeight,
    visualViewportHeight,
    visualViewportOffsetTop
  });
  if (
    occluded <= 0 &&
    layoutHeight - visualViewportHeight < KEYBOARD_VIEWPORT_SHRINK_PX
  ) {
    return CLOSED_APP_FRAME_KEYBOARD;
  }
  const frameHeight = frameBottom - frameTop;
  if (!(frameHeight > 0)) return { open: true, height: 0 };
  const visibleBottom =
    Math.max(0, visualViewportOffsetTop) + visualViewportHeight;
  const covered = Math.min(
    frameHeight,
    Math.max(0, frameBottom - visibleBottom)
  );
  const scale = frameCssHeight > 0 ? frameCssHeight / frameHeight : 1;
  return { open: true, height: Math.round(covered * scale) };
}

export function appFrameKeyboardStatesEqual(
  a: AppFrameKeyboardState | null,
  b: AppFrameKeyboardState | null
) {
  return Boolean(a && b && a.open === b.open && a.height === b.height);
}

export interface SavedScrollPosition<Target> {
  target: Target;
  left: number;
  top: number;
}

// The saved positions the browser moved while the keyboard was up (beyond
// subpixel settling): the ones to put back.
export function getDriftedScrollPositions<Target>(
  saved: SavedScrollPosition<Target>[],
  read: (target: Target) => { left: number; top: number } | null
) {
  return saved.filter((position) => {
    const current = read(position.target);
    if (!current) return false;
    return (
      Math.abs(current.left - position.left) > 1 ||
      Math.abs(current.top - position.top) > 1
    );
  });
}
