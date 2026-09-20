import { useEffect, useState } from 'react';
import { useAppContext, useKeyContext } from '~/contexts';
import { createRewardStatusReader } from '~/helpers/buildRewardStatus';
import type { RewardSettings } from './types';

// Several merged chat cards can point at the same app. Share confirmed
// responses and coalesce reads, without retaining account data after unmount.
const listeners = new Set<(scope: string, settings: RewardSettings) => void>();
const loadSharedSettings = createRewardStatusReader((scope, settings) => {
  for (const listener of listeners) listener(scope, settings);
});

export default function useRewardStatus(
  buildId: number,
  enabled = true,
  changeKey = ''
) {
  const loadSettings = useAppContext(
    (v) => v.requestHelpers.loadBuildRewardSettings
  );
  const userId = useKeyContext((v) => v.myState.userId);
  const scope = `${userId}:${buildId}`;
  const [refreshId, setRefreshId] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    settings: RewardSettings | null;
    error: string;
  } | null>(null);
  const key = `${scope}:${changeKey}:${refreshId}`;
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let inFlight = false;
    let hasRewards = false;
    function onSettings(updatedScope: string, settings: RewardSettings) {
      if (updatedScope !== scope) return;
      hasRewards = settings.configured;
      setResult({ key, settings, error: '' });
    }
    listeners.add(onSettings);
    async function refresh() {
      if (inFlight) return;
      inFlight = true;
      try {
        await loadSharedSettings(scope, key, () => loadSettings(buildId));
      } catch {
        if (active)
          setResult((current) => ({
            key,
            settings: current?.key === key ? current.settings : null,
            error: 'Couldn’t refresh approval status. Please try again.'
          }));
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
      listeners.delete(onSettings);
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
    // Request helpers are stable context actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildId, enabled, key, scope]);
  const current = enabled && result?.key === key ? result : null;
  return {
    settings: current?.settings || null,
    error: current?.error || '',
    loading: enabled && !current,
    refresh: () => setRefreshId((value) => value + 1),
    load: () =>
      loadSharedSettings(scope, key, () => loadSettings(buildId), true)
  };
}
