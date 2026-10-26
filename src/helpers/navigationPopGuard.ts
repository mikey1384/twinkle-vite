let installed = false;
const guards = new Set<(event: PopStateEvent) => void>();
export const NAVIGATION_BLOCKED_EVENT = 'twinkle-navigation-blocked';

// Window popstate listeners run in registration order. This must be installed
// before BrowserRouter subscribes: a page's own listener is too late to stop
// the router from unmounting unsaved work, even with capture:true.
export function installNavigationPopGuard() {
  if (installed) return;
  installed = true;
  window.addEventListener(
    'popstate',
    (event) => {
      for (const guard of guards) {
        guard(event);
        if (event.cancelBubble) break;
      }
    },
    true
  );
}

export function registerNavigationPopGuard(
  guard: (event: PopStateEvent) => void
) {
  guards.add(guard);
  return () => {
    guards.delete(guard);
  };
}
