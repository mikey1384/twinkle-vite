import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  useLocation,
  useNavigate,
  type Location
} from 'react-router-dom';

export interface ReadyNavigationLocation {
  key: string;
  pathname: string;
  search: string;
}

interface PendingNavigation {
  dispatchState: 'scheduled' | 'dispatched';
  expectsLocationChange: boolean;
  id: number;
  sourceLocation: string;
  sourceRouteKey: string;
  sourceWasExited: boolean;
  target: string;
  targetLocation: string;
}

interface NavigationFeedbackContextValue {
  activeLocation: ReadyNavigationLocation;
  loadingTarget: string | null;
  pendingTarget: string | null;
  onNavigationStart: (target: string) => boolean;
  onRouteReady: (location: ReadyNavigationLocation) => void;
}

const NAVIGATION_LOADING_INDICATOR_DELAY_MS = 200;
const NavigationFeedbackContext =
  createContext<NavigationFeedbackContextValue | null>(null);

export function getNavigationTargetLocation(target: string) {
  try {
    const url = new URL(target, window.location.origin);
    return {
      pathname: url.pathname,
      search: url.search
    };
  } catch {
    const [pathnameSearch] = target.split('#');
    const [pathname, targetSearch = ''] = pathnameSearch.split('?');
    return {
      pathname,
      search: targetSearch ? `?${targetSearch}` : ''
    };
  }
}

export function getNavigationLocationKey(pathname: string, search = '') {
  return `${pathname}${search}`;
}

export function NavigationFeedbackProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentLocation = useMemo(
    () => ({
      key: location.key,
      pathname: location.pathname,
      search: location.search
    }),
    [location.key, location.pathname, location.search]
  );
  const [readyLocation, setReadyLocation] =
    useState<ReadyNavigationLocation>(currentLocation);
  const [pendingNavigation, setPendingNavigation] =
    useState<PendingNavigation | null>(null);
  const [loadingRequestId, setLoadingRequestId] = useState<number | null>(null);
  const dispatchedRequestIdRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);
  const pendingNavigationId = pendingNavigation?.id ?? null;

  const onRouteReady = useCallback((nextLocation: ReadyNavigationLocation) => {
    setReadyLocation((current) =>
      navigationLocationsMatch(current, nextLocation) ? current : nextLocation
    );
    setPendingNavigation((current) => {
      if (!current || current.dispatchState !== 'dispatched') return current;
      const nextLocationKey = getNavigationLocationKey(
        nextLocation.pathname,
        nextLocation.search
      );
      const destinationCommitted =
        nextLocationKey === current.targetLocation;
      const redirectedDestinationCommitted =
        current.expectsLocationChange &&
        nextLocation.key !== current.sourceRouteKey;
      return destinationCommitted || redirectedDestinationCommitted
        ? null
        : current;
    });
  }, []);

  useEffect(() => {
    if (pendingNavigationId === null) return;
    const loadingIndicatorTimer = window.setTimeout(() => {
      setLoadingRequestId(pendingNavigationId);
    }, NAVIGATION_LOADING_INDICATOR_DELAY_MS);
    return () => clearTimeout(loadingIndicatorTimer);
  }, [pendingNavigationId]);

  const feedback = useMemo<NavigationFeedbackContextValue>(
    () => ({
      activeLocation: pendingNavigation ? readyLocation : currentLocation,
      loadingTarget:
        pendingNavigation?.id === loadingRequestId
          ? pendingNavigation.targetLocation
          : null,
      pendingTarget: pendingNavigation?.targetLocation || null,
      onNavigationStart(target) {
        const targetLocation = getNavigationTargetLocation(target);
        const targetLocationKey = getNavigationLocationKey(
          targetLocation.pathname,
          targetLocation.search
        );
        const currentLocationKey = getNavigationLocationKey(
          currentLocation.pathname,
          currentLocation.search
        );
        const currentRouteIsReady = navigationLocationsMatch(
          currentLocation,
          readyLocation
        );

        if (targetLocationKey === currentLocationKey && currentRouteIsReady) {
          requestIdRef.current += 1;
          setPendingNavigation(null);
          return false;
        }

        const id = requestIdRef.current + 1;
        requestIdRef.current = id;
        setPendingNavigation({
          dispatchState:
            targetLocationKey === currentLocationKey
              ? 'dispatched'
              : 'scheduled',
          expectsLocationChange: false,
          id,
          sourceLocation: getNavigationLocationKey(
            currentLocation.pathname,
            currentLocation.search
          ),
          sourceRouteKey: currentLocation.key,
          sourceWasExited: false,
          target,
          targetLocation: targetLocationKey
        });
        return true;
      },
      onRouteReady
    }),
    // onRouteReady is a stable context action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentLocation, loadingRequestId, pendingNavigation, readyLocation]
  );

  useLayoutEffect(() => {
    if (
      !pendingNavigation ||
      pendingNavigation.dispatchState !== 'dispatched'
    ) {
      return;
    }
    const currentLocationKey = getNavigationLocationKey(
      currentLocation.pathname,
      currentLocation.search
    );

    setPendingNavigation((current) => {
      if (
        !current ||
        current.id !== pendingNavigation.id ||
        current.dispatchState !== 'dispatched'
      ) {
        return current;
      }
      const routerIsAtSource =
        currentLocation.key === current.sourceRouteKey &&
        currentLocationKey === current.sourceLocation;

      if (!current.expectsLocationChange) {
        return routerIsAtSource ? current : null;
      }
      // This provider sees history changes even while the route observer is
      // suspended. Remember the push so a later POP to its source can cancel.
      if (!current.sourceWasExited) {
        return routerIsAtSource
          ? current
          : { ...current, sourceWasExited: true };
      }
      return routerIsAtSource ? null : current;
    });
  }, [currentLocation, pendingNavigation]);

  useEffect(() => {
    if (pendingNavigation?.dispatchState !== 'scheduled') return;
    let navigationTimer: number | null = null;
    const navigationFrame = requestAnimationFrame(() => {
      // Let the browser paint the urgent pending state before starting route
      // work that may synchronously occupy the main thread.
      navigationTimer = window.setTimeout(() => {
        if (
          requestIdRef.current !== pendingNavigation.id ||
          dispatchedRequestIdRef.current === pendingNavigation.id
        ) {
          return;
        }
        // useNavigate changes identity with declarative-router locations. The
        // request id guard makes dispatch one-shot across those effect reruns.
        dispatchedRequestIdRef.current = pendingNavigation.id;

        const sourceLocation = getNavigationLocationKey(
          currentLocation.pathname,
          currentLocation.search
        );
        const targetAlreadyCurrent =
          sourceLocation === pendingNavigation.targetLocation;
        const targetAlreadyReady =
          targetAlreadyCurrent &&
          navigationLocationsMatch(currentLocation, readyLocation);

        if (targetAlreadyReady) {
          setPendingNavigation((current) =>
            current?.id === pendingNavigation.id ? null : current
          );
          return;
        }

        setPendingNavigation((current) =>
          current?.id === pendingNavigation.id
            ? {
                ...current,
                dispatchState: 'dispatched',
                expectsLocationChange: !targetAlreadyCurrent,
                sourceLocation,
                sourceRouteKey: currentLocation.key,
                sourceWasExited: false
              }
            : current
        );
        if (!targetAlreadyCurrent) {
          navigate(pendingNavigation.target);
        }
      }, 0);
    });
    return () => {
      cancelAnimationFrame(navigationFrame);
      if (navigationTimer !== null) clearTimeout(navigationTimer);
    };
  }, [currentLocation, navigate, pendingNavigation, readyLocation]);

  return (
    <NavigationFeedbackContext.Provider value={feedback}>
      {children}
    </NavigationFeedbackContext.Provider>
  );
}

export function NavigationRouteReadyObserver() {
  const location = useLocation();
  const { onRouteReady } = useNavigationFeedback();

  useLayoutEffect(() => {
    onRouteReady(toReadyNavigationLocation(location));
    // onRouteReady is a stable context action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key, location.pathname, location.search]);

  return null;
}

export function useNavigationFeedback() {
  const feedback = useContext(NavigationFeedbackContext);
  if (!feedback) {
    throw new Error(
      'useNavigationFeedback must be used inside NavigationFeedbackProvider'
    );
  }
  return feedback;
}

function toReadyNavigationLocation(location: Location) {
  return {
    key: location.key,
    pathname: location.pathname,
    search: location.search
  };
}

function navigationLocationsMatch(
  first: ReadyNavigationLocation,
  second: ReadyNavigationLocation
) {
  return (
    first.key === second.key &&
    first.pathname === second.pathname &&
    first.search === second.search
  );
}
