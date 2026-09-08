import { useEffect, useState } from 'react';
import { useAppContext } from '~/contexts';
import type { RewardSettings } from './types';

export default function useRewardStatus(
  buildId: number,
  enabled = true,
  changeKey = ''
) {
  const loadSettings = useAppContext(
    (v) => v.requestHelpers.loadBuildRewardSettings
  );
  const [refreshId, setRefreshId] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    settings: RewardSettings | null;
    error: string;
  } | null>(null);
  const key = `${buildId}:${changeKey}:${refreshId}`;
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let inFlight = false;
    let hasRewards = false;
    async function refresh() {
      if (inFlight) return;
      inFlight = true;
      try {
        const settings: RewardSettings = await loadSettings(buildId);
        hasRewards = settings.configured;
        if (active) setResult({ key, settings, error: '' });
      } catch {
        if (active)
          setResult({
            key,
            settings: null,
            error: 'Couldn’t check approval right now. Please try again.'
          });
      } finally {
        inFlight = false;
      }
    }
    void refresh();
    function onFocus() {
      if (document.visibilityState === 'visible') void refresh();
    }
    // Keep admin decisions visible while the creator is in the workspace.
    const timer = window.setInterval(() => {
      if (hasRewards) onFocus();
    }, 15000);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
    // Request helpers are stable context actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildId, enabled, key]);
  const current = enabled && result?.key === key ? result : null;
  return {
    settings: current?.settings || null,
    error: current?.error || '',
    loading: enabled && !current,
    refresh: () => setRefreshId((value) => value + 1)
  };
}
