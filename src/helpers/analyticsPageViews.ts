interface AnalyticsLocation {
  hash: string;
  pathname: string;
  search: string;
}

export interface AnalyticsPageView {
  path: string;
  referrerPath: string | null;
}

export function getAnalyticsPath(location: AnalyticsLocation) {
  return `${location.pathname}${location.search}${location.hash}`;
}

// The analytics command gate owns identity readiness for every event. This
// controller owns only virtual-route identity and referrer order so React
// Router state-only replacements cannot become duplicate page views.
export function createAnalyticsPageViewController(
  trackPageView: (pageView: AnalyticsPageView) => void
) {
  let lastObservedPath: string | null = null;
  let lastTrackedPath: string | null = null;

  function trackPath(path: string) {
    trackPageView({ path, referrerPath: lastTrackedPath });
    lastTrackedPath = path;
  }

  return {
    observe({ path }: { path: string }) {
      const pathChanged = path !== lastObservedPath;
      if (!pathChanged) return;
      lastObservedPath = path;
      trackPath(path);
    }
  };
}
