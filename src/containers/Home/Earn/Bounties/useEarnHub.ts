import { useEffect, useRef, useState } from 'react';
import { useAppContext, useKeyContext } from '~/contexts';

// Share concurrent reads between the bounty shelf and reward boards. Settled
// responses stay in their consumers, never in a cache that outlives the page.

export type EarnHubPeriod = 'day' | 'week' | 'all';

export interface EarnHubRule {
  id: string;
  title: string;
  xp: number;
  coins: number;
  verifier: 'numeric-quiz' | 'completion';
  available: boolean;
  earnedToday: { xp: number; coins: number; attempt: number } | null;
  attemptsToday: number;
}
export interface EarnHubApp {
  buildId: number;
  title: string;
  ownerId: number;
  ownerUsername: string | null;
  thumbnailUrl: string | null;
  kind: 'quiz' | 'completion' | 'mixed';
  maxXP: number;
  maxCoins: number;
  minXP: number;
  budgets: { userDailyXP: number; userDailyCoins: number; userDailyClaims: number | null };
  today: { xp: number; coins: number; claims: number; earnedRules: number; openRules: number; capReached: boolean };
  rules: EarnHubRule[];
}
export interface EarnHubEarner {
  rank: number;
  userId: number;
  username: string | null;
  profilePicUrl: string | null;
  xp: number;
  coins: number;
  claims: number;
  apps: number;
}
export interface EarnHubCreator {
  rank: number;
  userId: number;
  username: string | null;
  xp: number;
  coins: number;
  players: number;
  apps: string[];
}
export interface EarnHub {
  dayKey: string;
  period: EarnHubPeriod;
  apps: EarnHubApp[];
  standings: { period: EarnHubPeriod; entries: EarnHubEarner[]; me: EarnHubEarner | null };
  creators: { period: EarnHubPeriod; entries: EarnHubCreator[] };
}

const requests = new Map<string, Promise<EarnHub | null>>();
const refreshers = new Map<string, Set<() => void>>();
let refreshTimer: ReturnType<typeof setTimeout> | undefined;
let dayTimer: ReturnType<typeof setTimeout> | undefined;

function refreshEarnHub(key: string) {
  requests.delete(key);
  refreshers.get(key)?.forEach((refresh) => refresh());
}

function refreshVisibleEarnHubs() {
  if (document.visibilityState === 'hidden' || refreshTimer !== undefined) return;
  // Returning to a tab can emit focus, pageshow and visibilitychange together.
  refreshTimer = setTimeout(() => {
    refreshTimer = undefined;
    if (document.visibilityState === 'hidden') return;
    refreshers.forEach((_listeners, key) => refreshEarnHub(key));
  }, 50);
}

function scheduleNextRewardDay() {
  const now = new Date();
  const nextDay = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1
  );
  dayTimer = setTimeout(() => {
    refreshVisibleEarnHubs();
    scheduleNextRewardDay();
  }, nextDay - now.getTime() + 50);
}

function subscribeToEarnHub(key: string, refresh: () => void) {
  if (refreshers.size === 0) {
    window.addEventListener('focus', refreshVisibleEarnHubs);
    window.addEventListener('pageshow', refreshVisibleEarnHubs);
    window.addEventListener('online', refreshVisibleEarnHubs);
    document.addEventListener('visibilitychange', refreshVisibleEarnHubs);
    scheduleNextRewardDay();
  }
  const listeners = refreshers.get(key) || new Set<() => void>();
  listeners.add(refresh);
  refreshers.set(key, listeners);
  return () => {
    listeners.delete(refresh);
    if (listeners.size === 0) {
      refreshers.delete(key);
      requests.delete(key);
    }
    if (refreshers.size > 0) return;
    window.removeEventListener('focus', refreshVisibleEarnHubs);
    window.removeEventListener('pageshow', refreshVisibleEarnHubs);
    window.removeEventListener('online', refreshVisibleEarnHubs);
    document.removeEventListener('visibilitychange', refreshVisibleEarnHubs);
    clearTimeout(refreshTimer);
    clearTimeout(dayTimer);
    refreshTimer = undefined;
    dayTimer = undefined;
  };
}

function loadEarnHubOnce(key: string, load: () => Promise<unknown>) {
  const pending = requests.get(key);
  if (pending) return pending;
  const request: Promise<EarnHub | null> = Promise.resolve()
    .then(() => (requests.get(key) === request ? load() : null))
    .then((data: any) =>
      data && Array.isArray(data.apps) ? (data as EarnHub) : null
    )
    .catch(() => null)
    .finally(() => {
      if (requests.get(key) === request) requests.delete(key);
    });
  requests.set(key, request);
  return request;
}

export function useEarnHub(period: EarnHubPeriod = 'week') {
  const userId = useKeyContext((v) => v.myState.userId);
  const loadRewardEarnHub = useAppContext(
    (v) => v.requestHelpers.loadRewardEarnHub
  );
  const loadRef = useRef(loadRewardEarnHub);
  loadRef.current = loadRewardEarnHub;
  const key = `${userId}:${period}`;
  const [state, setState] = useState<{
    key: string;
    hub: EarnHub | null;
    loading: boolean;
  }>({ key, hub: null, loading: !!userId });
  useEffect(() => {
    if (!userId) return;
    let active = true;
    let sequence = 0;
    const unsubscribe = subscribeToEarnHub(key, load);
    void load();
    return () => {
      active = false;
      unsubscribe();
    };

    async function load() {
      const requestSequence = ++sequence;
      setState((previous) => ({
        key,
        hub: previous.key === key ? previous.hub : null,
        loading: true
      }));
      const hub = await loadEarnHubOnce(key, () => loadRef.current({ period }));
      if (!active || requestSequence !== sequence) return;
      setState({ key, hub, loading: false });
    }
  }, [key, period, userId]);
  return {
    hub: userId && state.key === key ? state.hub : null,
    loading: !!userId && (state.key !== key || state.loading),
    reload: () => refreshEarnHub(key)
  };
}
