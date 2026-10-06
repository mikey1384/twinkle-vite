import {
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  type RefObject
} from 'react';
import {
  UNSAFE_NavigationContext,
  useNavigate,
  type NavigateFunction,
  type NavigateOptions,
  type To
} from 'react-router-dom';

// useNavigate() subscribes its component to LocationContext and RouteContext,
// so the component re-renders on every navigation and every time <Routes>
// re-renders (App re-renders it on most App updates). For long lists of
// components that only navigate from event handlers — the Home feed's cards —
// that is a full re-render of every row on each pass.
//
// Absolute paths go straight to the router's navigator, whose identity is
// stable. Anything else (a relative embed link, a search/hash-only target) is
// handed to the real useNavigate() held by <RouteNavigateBridge>, rendered by
// the same component, so it resolves exactly as React Router would from that
// component's route. The bridge is a tiny leaf: its re-renders do not reach
// the component that owns it.
export function useStableNavigate() {
  const { navigator } = useContext(UNSAFE_NavigationContext);
  const routeNavigateRef = useRef<NavigateFunction | null>(null);
  const navigate = useCallback(
    (to: To, options: NavigateOptions = {}) => {
      if (!isAbsolutePathTarget(to)) {
        const routeNavigate = routeNavigateRef.current;
        if (!routeNavigate) {
          console.error(
            'useStableNavigate: relative target without a RouteNavigateBridge',
            to
          );
          return;
        }
        routeNavigate(to, options);
        return;
      }
      if (options.replace) {
        navigator.replace(to, options.state, options);
      } else {
        navigator.push(to, options.state, options);
      }
    },
    [navigator]
  );
  return { navigate, routeNavigateRef };
}

export function RouteNavigateBridge({
  navigateRef
}: {
  navigateRef: RefObject<NavigateFunction | null>;
}) {
  const navigate = useNavigate();
  useLayoutEffect(() => {
    navigateRef.current = navigate;
  }, [navigate, navigateRef]);
  return null;
}

export function isAbsolutePathTarget(to: To) {
  const pathname = typeof to === 'string' ? to : to.pathname;
  return (
    typeof pathname === 'string' &&
    pathname.startsWith('/') &&
    !pathname.startsWith('//')
  );
}
