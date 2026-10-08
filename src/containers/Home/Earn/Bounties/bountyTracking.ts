import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext, useKeyContext } from '~/contexts';
import { BUILD_EARN_BOUNTIES_VIEW_SOURCE } from '~/containers/Build/constants/runtimeViewSources';
import type { EarnHubApp } from './useEarnHub';
import { trackBountyAppOpen } from './appCardHelpers';
import {
  createBountyImpressionTracker,
  type BountySlot
} from './bountyImpressions';
export type { BountySlot } from './bountyImpressions';

const TrackingContext = createContext<ReturnType<
  typeof createBountyImpressionTracker
> | null>(null);

export function BountyTrackingProvider({
  dayKey,
  children
}: {
  dayKey?: string;
  children: ReactNode;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const record = useAppContext((v) => v.requestHelpers.recordEarnImpressions);
  const scope = userId && dayKey ? `${userId}:${dayKey}` : '';
  const active = useRef(false);
  const current = useRef({ scope, record });
  current.current = { scope, record };
  const tracker = useMemo(
    () =>
      createBountyImpressionTracker(
        (payload) => current.current.record(payload),
        () => active.current && !!scope && current.current.scope === scope
      ),
    [scope]
  );
  // A logout can unmount the whole shelf before this provider renders the new
  // identity. Drop pending reports on cleanup; Play flushes before navigating.
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      tracker.dispose();
    };
  }, [tracker]);
  return createElement(TrackingContext.Provider, { value: tracker }, children);
}

// A card counts as seen once half of it is visible in the foreground tab.
export function useBountySeen(app: EarnHubApp, slot: BountySlot) {
  const tracker = useContext(TrackingContext);
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || !tracker || typeof IntersectionObserver === 'undefined')
      return;
    let visible = false;
    const report = () => {
      if (visible && document.visibilityState !== 'hidden') {
        tracker.seen({ buildId: app.buildId, slot });
      }
    };
    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries.some(
          (entry) => entry.isIntersecting && entry.intersectionRatio >= 0.5
        );
        report();
      },
      { threshold: [0.5] }
    );
    observer.observe(element);
    document.addEventListener('visibilitychange', report);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', report);
    };
  }, [app.buildId, slot, tracker]);
  return ref;
}

// Play tags this visit so the shelf cannot inflate its own organic ranking.
export function useOpenBountyApp() {
  const navigate = useNavigate();
  const tracker = useContext(TrackingContext);
  return useCallback(
    (app: EarnHubApp, slot: BountySlot) => {
      trackBountyAppOpen(app, slot === 'top' ? 'top_pick' : slot);
      tracker?.play({ buildId: app.buildId, slot });
      navigate(
        `/app/${app.buildId}?viewSource=${BUILD_EARN_BOUNTIES_VIEW_SOURCE}`
      );
    },
    [navigate, tracker]
  );
}
