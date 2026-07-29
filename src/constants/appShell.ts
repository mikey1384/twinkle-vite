export const APP_SHELL_HEADER_SELECTOR = '[data-app-shell-header="true"]';
export const APP_SHELL_TOP_OFFSET_VAR = '--app-shell-top-offset';
// On phones the global nav is a fixed BOTTOM bar; the build runtime overlay
// reserves this much space at the bottom so the app sits above the nav (0 when
// the nav is hidden — desktop, or the build "super full screen" collapse).
export const APP_SHELL_BOTTOM_OFFSET_VAR = '--app-shell-bottom-offset';
export const APP_SHELL_HEADER_OFFSET_FALLBACK = '4.5rem';
export const APP_SHELL_HEADER_OFFSET_STYLE = `var(${APP_SHELL_TOP_OFFSET_VAR}, ${APP_SHELL_HEADER_OFFSET_FALLBACK})`;
// Height the on-screen keyboard steals from the bottom of the viewport.
// Mobile browsers shrink only the VISUAL viewport when the keyboard opens; the
// LAYOUT viewport that `height: 100%` resolves against stays full height, so
// without this the shell keeps laying itself out behind the keyboard.
// Maintained by useMobileKeyboardInset; 0 whenever no keyboard is up.
export const APP_SHELL_KEYBOARD_INSET_VAR = '--app-keyboard-inset';
export const APP_SHELL_KEYBOARD_INSET_STYLE = `var(${APP_SHELL_KEYBOARD_INSET_VAR}, 0px)`;
// Raw footprint of the fixed mobile bottom nav, before any keyboard netting.
export const MOBILE_NAV_FOOTPRINT_STYLE = 'var(--mobile-nav-footprint)';
// Bottom offset for layers that are themselves `position: fixed` (the build
// runtime host). Fixed layers resolve against the LAYOUT viewport, which the
// keyboard does not shrink, so the app shell's keyboard inset does not constrain
// them — they must clear whichever of the nav or the keyboard is taller
// themselves. This is the mirror image of --mobile-nav-total-height, which nets
// the keyboard OUT for surfaces that already live inside the shrunken shell.
export const APP_SHELL_FIXED_BOTTOM_OFFSET_STYLE = `max(${MOBILE_NAV_FOOTPRINT_STYLE}, ${APP_SHELL_KEYBOARD_INSET_STYLE})`;
