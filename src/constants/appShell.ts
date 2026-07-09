export const APP_SHELL_HEADER_SELECTOR = '[data-app-shell-header="true"]';
export const APP_SHELL_TOP_OFFSET_VAR = '--app-shell-top-offset';
// On phones the global nav is a fixed BOTTOM bar; the build runtime overlay
// reserves this much space at the bottom so the app sits above the nav (0 when
// the nav is hidden — desktop, or the build "super full screen" collapse).
export const APP_SHELL_BOTTOM_OFFSET_VAR = '--app-shell-bottom-offset';
export const APP_SHELL_HEADER_OFFSET_FALLBACK = '4.5rem';
export const APP_SHELL_HEADER_OFFSET_STYLE = `var(${APP_SHELL_TOP_OFFSET_VAR}, ${APP_SHELL_HEADER_OFFSET_FALLBACK})`;
