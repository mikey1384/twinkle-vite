import { useEffect, useRef } from 'react';
import { socket } from '~/constants/sockets/api';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import {
  MAX_DELIVERABILITY_IDS,
  TRADE_DELIVERABILITY_REFRESH_EVENT,
  getOpenTradeIds
} from '~/containers/Chat/Trade/helpers/openTrades';

// Keeps "Offer expired" on open trade cards current (DESIGN §5). The verdict
// is the server's (the same check accept runs); this only decides when to ask
// again for the cards on screen, in one batched request:
// - an asset moved, a trade was accepted or cancelled, a group or app changed
//   owners (socket events that reach this viewer);
// - the viewer's own Coins changed;
// - the viewer's AI Energy changed (at most once every 30 seconds);
// - a card appeared (a channel opened), the window regained focus, or
//   "Review offer" was clicked (requestTradeDeliverabilityRefresh).
// A partner spending elsewhere sends this viewer no event, so a card can be
// stale until the next trigger; accept still re-checks under the trade lock.
const DEBOUNCE_MS = 400;
const ENERGY_THROTTLE_MS = 30_000;

export default function useTradeDeliverabilitySocket() {
  const userId = useKeyContext((v) => v.myState.userId);
  const coins = useKeyContext((v) => v.myState.twinkleCoins);
  const scheduleRef = useRef<(() => void) | null>(null);
  const loadTradeDeliverability = useAppContext(
    (v) => v.requestHelpers.loadTradeDeliverability
  );
  const onSetTradeDeliverability = useChatContext(
    (v) => v.actions.onSetTradeDeliverability
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const pendingRef = useRef(false);
  const lastEnergyRefreshRef = useRef(0);

  useEffect(() => {
    if (!userId) return;
    let active = true;

    async function refresh() {
      timerRef.current = null;
      const ids = getOpenTradeIds();
      if (!ids.length || !active) return;
      if (inFlightRef.current) {
        pendingRef.current = true;
        return;
      }
      inFlightRef.current = true;
      try {
        // Refresh every mounted card, with bounded serial batches. Slicing
        // the registry itself would permanently starve cards older than #20.
        for (let start = 0; start < ids.length && active; start += MAX_DELIVERABILITY_IDS) {
          const verdicts = await loadTradeDeliverability(
            ids.slice(start, start + MAX_DELIVERABILITY_IDS)
          );
          if (active && verdicts && typeof verdicts === 'object') {
            onSetTradeDeliverability(verdicts);
          }
        }
      } catch {
        // A failed refresh leaves the last verdict; accept is authoritative.
      } finally {
        inFlightRef.current = false;
        if (pendingRef.current && active) {
          pendingRef.current = false;
          schedule();
        }
      }
    }

    function schedule() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(refresh, DEBOUNCE_MS);
    }

    scheduleRef.current = schedule;
    schedule();

    function handleEnergyUpdate() {
      const now = Date.now();
      if (now - lastEnergyRefreshRef.current < ENERGY_THROTTLE_MS) return;
      lastEnergyRefreshRef.current = now;
      schedule();
    }

    function handleNewMessage(payload: any) {
      // group ownership changes arrive as owner_change notices
      if (payload?.message?.notificationType === 'owner_change') schedule();
    }

    const events = [
      'assets_sent',
      'transaction_accepted',
      'transaction_cancelled',
      'build_ownership_changed',
      'canonical_coin_balance_updated'
    ];
    for (const event of events) socket.on(event, schedule);
    socket.on('new_message_received', handleNewMessage);
    socket.on('ai_usage_policy_updated', handleEnergyUpdate);
    window.addEventListener(TRADE_DELIVERABILITY_REFRESH_EVENT, schedule);
    window.addEventListener('focus', schedule);

    return () => {
      active = false;
      scheduleRef.current = null;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      for (const event of events) socket.off(event, schedule);
      socket.off('new_message_received', handleNewMessage);
      socket.off('ai_usage_policy_updated', handleEnergyUpdate);
      window.removeEventListener(TRADE_DELIVERABILITY_REFRESH_EVENT, schedule);
      window.removeEventListener('focus', schedule);
    };
    // Context actions/helpers are stable; only account changes rebind sockets.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    scheduleRef.current?.();
  }, [coins]);
}
