import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '~/contexts';
import { BUILD_EARN_BOUNTIES_VIEW_SOURCE } from '~/containers/Build/constants/runtimeViewSources';
import type { EarnHubApp } from './useEarnHub';
import { trackBountyAppOpen } from './appCardHelpers';

// What the Bounties shelf reports (Mikey 10-08): which apps a member actually
// saw and which they played, the recommender's signals for "keeps scrolling
// past it" and "few have seen it". The server keeps one row per member, app
// and day, so a repeat report is harmless; here each app is sent once per page.
export type BountySlot = 'recommended' | 'recent' | 'top' | 'card' | 'row';
type Sender = (payload: {
  seen?: Array<{ buildId: number; slot: BountySlot }>;
  played?: { buildId: number; slot: BountySlot } | null;
}) => Promise<unknown>;

const reported = new Set<number>();
let queue: Array<{ buildId: number; slot: BountySlot }> = [];
let flushTimer: ReturnType<typeof setTimeout> | undefined;
let send: Sender | null = null;

function flushSoon() {
  if (flushTimer !== undefined) return;
  flushTimer = setTimeout(() => {
    flushTimer = undefined;
    const batch = queue;
    queue = [];
    if (batch.length && send) send({ seen: batch }).catch(() => {});
  }, 1500);
}

// A card counts as seen once half of it has been on screen.
export function useBountySeen(app: EarnHubApp, slot: BountySlot) {
  const record = useAppContext((v) => v.requestHelpers.recordEarnImpressions);
  send = record;
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const element = ref.current;
    if (
      !element ||
      reported.has(app.buildId) ||
      typeof IntersectionObserver === 'undefined'
    )
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.intersectionRatio >= 0.5)) return;
        observer.disconnect();
        if (reported.has(app.buildId)) return;
        reported.add(app.buildId);
        queue.push({ buildId: app.buildId, slot });
        flushSoon();
      },
      { threshold: [0.5] }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [app.buildId, slot]);
  return ref;
}

// Play: the analytics event, the shelf's play report, and the app page with
// the shelf as its source (so these plays don't count as organic players).
export function useOpenBountyApp() {
  const navigate = useNavigate();
  const record = useAppContext((v) => v.requestHelpers.recordEarnImpressions);
  return useCallback(
    (app: EarnHubApp, slot: BountySlot) => {
      trackBountyAppOpen(
        app,
        slot === 'top'
          ? 'top_pick'
          : slot === 'recommended'
            ? 'recommended'
            : slot
      );
      record({ played: { buildId: app.buildId, slot } }).catch(() => {});
      navigate(
        `/app/${app.buildId}?viewSource=${BUILD_EARN_BOUNTIES_VIEW_SOURCE}`
      );
    },
    [navigate, record]
  );
}
