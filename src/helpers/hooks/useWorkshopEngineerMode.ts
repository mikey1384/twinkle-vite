import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { css, keyframes } from '@emotion/css';
import { useAppContext, useKeyContext } from '~/contexts';
import { BUILD_WORKSHOP_PREVIEW_USER_IDS } from '~/constants/defaultValues';

type WorkshopPersona = 'zero' | 'ciel';

interface WorkshopStatus {
  featureVisible?: boolean;
  agentState?: 'build_available' | 'build_working' | 'chat_only';
}

type LoadWorkshopStatus = (params: {
  persona: WorkshopPersona;
}) => Promise<WorkshopStatus>;

const POLL_MS = 60_000;

// New Workshop duty is shared across both assistants, so one stable persona
// status is the canonical read for the shared engineer-mode indicator.
const SHARED_DUTY_STATUS_PERSONA: WorkshopPersona = 'zero';

// Module-level store so every consumer (home buttons, chat quick access)
// shares one poll of the Workshop duty status instead of polling per mount.
let dutyLive = false;
let timer: number | null = null;
let subscriberCount = 0;
let statusUserId: number | null = null;
let fetchStatus: LoadWorkshopStatus | null = null;
const listeners = new Set<() => void>();

function getSnapshot() {
  return dutyLive;
}

function notify() {
  for (const listener of listeners) listener();
}

async function refresh() {
  const loadStatus = fetchStatus;
  const requestUserId = statusUserId;
  if (!loadStatus || !requestUserId) return;

  try {
    const status = await loadStatus({
      persona: SHARED_DUTY_STATUS_PERSONA
    });
    if (loadStatus !== fetchStatus || requestUserId !== statusUserId) return;

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
    // Keep the last canonical value on transient failures.
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
    if (subscriberCount !== 0) return;

    if (timer !== null) window.clearInterval(timer);
    timer = null;
    fetchStatus = null;
    statusUserId = null;
    dutyLive = false;
  };
}

/**
 * True while shared Build Workshop duty is live AND the signed-in user is in
 * the preview rollout. Everyone else gets false with zero network traffic.
 */
export default function useWorkshopEngineerMode({
  enabled = true
}: { enabled?: boolean } = {}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const loadBuildWorkshopStatus = useAppContext(
    (v) => v.requestHelpers.loadBuildWorkshopStatus
  ) as LoadWorkshopStatus;
  const canonicalUserId = Number(userId);
  const shouldSubscribe =
    enabled && BUILD_WORKSHOP_PREVIEW_USER_IDS.has(canonicalUserId);

  useEffect(() => {
    if (!shouldSubscribe) return;

    const sourceChanged =
      statusUserId !== canonicalUserId ||
      fetchStatus !== loadBuildWorkshopStatus;
    statusUserId = canonicalUserId;
    fetchStatus = loadBuildWorkshopStatus;

    // Mounted consumers survive an in-app account switch. Clear the previous
    // account's projection and reject its pending response before refreshing.
    if (sourceChanged && subscriberCount > 0) {
      if (dutyLive) {
        dutyLive = false;
        notify();
      }
      void refresh();
    }
  }, [canonicalUserId, loadBuildWorkshopStatus, shouldSubscribe]);

  const getCurrentSnapshot = useCallback(
    () =>
      shouldSubscribe && statusUserId === canonicalUserId
        ? getSnapshot()
        : false,
    [canonicalUserId, shouldSubscribe]
  );

  return useSyncExternalStore(
    shouldSubscribe ? subscribe : subscribeNoop,
    getCurrentSnapshot,
    getFalse
  );
}

function subscribeNoop() {
  return () => {};
}

function getFalse() {
  return false;
}

const engineerGlowPulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 0.5rem 0.15rem rgba(255, 184, 51, 0.6);
  }
  50% {
    box-shadow: 0 0 1.1rem 0.5rem rgba(255, 184, 51, 0.95);
  }
`;

// Golden "duty is live — come build!" halo for the engineer avatars.
export const workshopEngineerGlowClass = css`
  animation: ${engineerGlowPulse} 1.8s ease-in-out infinite;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
    box-shadow: 0 0 0.8rem 0.3rem rgba(255, 184, 51, 0.8);
  }
`;
