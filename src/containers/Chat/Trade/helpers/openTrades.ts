// Open trade cards currently on screen. Each open card registers its
// transaction id while mounted; one listener (useTradeDeliverabilitySocket)
// asks the server for the live "can both sides still deliver?" verdict of the
// registered cards, at most 20 at a time, whenever something that could change
// it happens.
export const TRADE_DELIVERABILITY_REFRESH_EVENT =
  'twinkle:trade-deliverability-refresh';
export const MAX_DELIVERABILITY_IDS = 20;

const mounted = new Map<number, number>();

export function registerOpenTrade(transactionId: number) {
  const id = Number(transactionId);
  if (!Number.isSafeInteger(id) || id <= 0) return () => {};
  mounted.set(id, (mounted.get(id) || 0) + 1);
  return () => {
    const count = (mounted.get(id) || 0) - 1;
    if (count > 0) mounted.set(id, count);
    else mounted.delete(id);
  };
}

// Newest first: the most recent offers are the ones people act on.
export function getOpenTradeIds() {
  return [...mounted.keys()].sort((a, b) => b - a);
}

export function requestTradeDeliverabilityRefresh() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(TRADE_DELIVERABILITY_REFRESH_EVENT));
}
