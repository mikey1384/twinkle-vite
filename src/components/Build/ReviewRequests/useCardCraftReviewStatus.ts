import { useEffect, useRef, useState } from 'react';
import { useAppContext } from '~/contexts';
import { socket } from '~/constants/sockets/api';
import type { CardCraftSettingsLike } from '~/helpers/buildReviewRequests';

// The owner's card crafting approval state (GET /build/:id/cardcraft), kept
// fresh while the workspace is open: on focus, on Mikey's decision (the
// review-request card push) and every 15 s while a request waits.
export default function useCardCraftReviewStatus(
  buildId: number,
  enabled: boolean
) {
  const loadSettings = useAppContext(
    (v) => v.requestHelpers.loadBuildCardCraftSettings
  );
  const requestReview = useAppContext(
    (v) => v.requestHelpers.requestBuildCardCraftReview
  );
  const [state, setState] = useState<{
    buildId: number;
    settings: CardCraftSettingsLike | null;
  } | null>(null);
  const loadIdRef = useRef(0);
  const settings = state?.buildId === buildId ? state.settings : null;
  const latestState = useRef<string | null>(null);
  latestState.current = settings?.state || null;

  useEffect(() => {
    if (!enabled || !buildId) return;
    let active = true;
    void refresh();
    function onFocus() {
      if (document.visibilityState === 'visible') void refresh();
    }
    function onReviewUpdated(payload: any) {
      if (
        payload?.request?.type === 'cardcraft' &&
        Number(payload.request.buildId) === buildId
      ) {
        void refresh();
      }
    }
    const timer = window.setInterval(() => {
      if (latestState.current === 'pending') onFocus();
    }, 15000);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    socket.on('build_review_request_updated', onReviewUpdated);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
      socket.off('build_review_request_updated', onReviewUpdated);
    };

    async function refresh() {
      const loadId = ++loadIdRef.current;
      try {
        const next = await loadSettings(buildId);
        if (active && loadId === loadIdRef.current)
          setState({ buildId, settings: next || null });
      } catch {
        // Not the owner, or card crafting is unavailable: show nothing.
        if (active && loadId === loadIdRef.current)
          setState({ buildId, settings: null });
      }
    }
    // Request helpers are stable context actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildId, enabled]);

  return {
    settings,
    async request() {
      await requestReview(buildId);
      // The canonical state after the request (pending, or already approved).
      const loadId = ++loadIdRef.current;
      const next = await loadSettings(buildId);
      if (loadId === loadIdRef.current) setState({ buildId, settings: next });
    }
  };
}
