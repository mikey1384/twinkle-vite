import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppContext, useKeyContext } from '~/contexts';

// One fetch of the Earn hub per period, shared by the Bounties shelf and the
// reward leaderboards on the same page. The server computes everything from
// its own receipts; this hook only caches the answer for the page's lifetime.

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

const cache = new Map<string, Promise<EarnHub | null>>();

export function useEarnHub(period: EarnHubPeriod = 'week') {
  const userId = useKeyContext((v) => v.myState.userId);
  const loadRewardEarnHub = useAppContext(
    (v) => v.requestHelpers.loadRewardEarnHub
  );
  const [hub, setHub] = useState<EarnHub | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);
  const load = useCallback(
    async (fresh = false) => {
      const key = `${userId}:${period}`;
      if (fresh || !cache.has(key)) {
        cache.set(
          key,
          Promise.resolve()
            .then(() => loadRewardEarnHub({ period }))
            .then((data: any) =>
              data && Array.isArray(data.apps) ? (data as EarnHub) : null
            )
            .catch(() => null)
        );
      }
      setLoading(true);
      const result = await cache.get(key)!;
      if (!mounted.current) return;
      // A failed fetch is cached as nothing for this page visit; the shelf
      // simply stays away rather than spinning.
      if (result === null) cache.delete(key);
      setHub(result);
      setLoading(false);
    },
    [loadRewardEarnHub, period, userId]
  );
  useEffect(() => {
    mounted.current = true;
    if (!userId) {
      setHub(null);
      setLoading(false);
      return;
    }
    load();
    return () => {
      mounted.current = false;
    };
  }, [load, userId]);
  return { hub, loading, reload: () => load(true) };
}
