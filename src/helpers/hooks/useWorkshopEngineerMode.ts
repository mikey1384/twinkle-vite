import { useEffect, useSyncExternalStore } from 'react';
import { useAppContext, useKeyContext } from '~/contexts';
import { BUILD_WORKSHOP_PREVIEW_USER_IDS } from '~/constants/defaultValues';

const POLL_MS = 60_000;

// Module-level store so every consumer (home buttons, chat quick access)
// shares one poll of the Workshop duty status instead of polling per mount.
let dutyLive = false;
let timer: number | null = null;
let subscriberCount = 0;
let fetchStatus: ((params: { persona: 'zero' | 'ciel' }) => Promise<any>) | null =
  null;
const listeners = new Set<() => void>();

function getSnapshot() {
  return dutyLive;
}

function notify() {
  for (const listener of listeners) listener();
}

async function refresh() {
  if (!fetchStatus) return;
  try {
    const status = await fetchStatus({ persona: 'zero' });
    const nextLive = Boolean(
      status?.featureVisible &&
        (status?.agentState === 'build_available' ||
          status?.agentState === 'build_working')
    );
    if (nextLive !== dutyLive) {
      dutyLive = nextLive;
      notify();
    }
  } catch {
    // Keep the last known value on transient failures.
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  subscriberCount += 1;
  if (subscriberCount === 1) {
    void refresh();
    timer = window.setInterval(refresh, POLL_MS);
  }
  return () => {
    listeners.delete(listener);
    subscriberCount -= 1;
    if (subscriberCount === 0 && timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  };
}

/**
 * True while the Build Workshop duty is live AND the signed-in user is in the
 * preview rollout. Everyone else always gets false with zero network traffic.
 */
export default function useWorkshopEngineerMode() {
  const userId = useKeyContext((v) => v.myState.userId);
  const loadBuildWorkshopStatus = useAppContext(
    (v) => v.requestHelpers.loadBuildWorkshopStatus
  );
  const isPreviewUser = BUILD_WORKSHOP_PREVIEW_USER_IDS.has(Number(userId));

  useEffect(() => {
    if (isPreviewUser) {
      fetchStatus = loadBuildWorkshopStatus;
    }
    // Context request helpers are stable and intentionally excluded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPreviewUser]);

  const live = useSyncExternalStore(
    isPreviewUser ? subscribe : subscribeNoop,
    isPreviewUser ? getSnapshot : getFalse
  );
  return live;
}

function subscribeNoop() {
  return () => {};
}

function getFalse() {
  return false;
}
