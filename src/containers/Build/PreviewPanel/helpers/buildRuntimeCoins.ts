import type { CoinConfirmRequest } from '~/components/Build/Coins/coinConfirmText';

// Host side of Twinkle.coins. The app frame only asks; this code (website,
// outside the frame) reads the server's quote, shows Twinkle's own
// confirmation box and only then sends the purchase, carrying exactly what
// the member saw. Nothing the app sends decides a price, a recipient or a
// destination. Drafts and previews go to the owner's preview, which never
// charges, and still show the box so the owner can try the flow.

export const COIN_REQUEST_TYPES = new Set([
  'coins:balance',
  'coins:charge',
  'coins:receipts',
  'coins:make-offer',
  'coins:respond-offer',
  'coins:takeover',
  'coins:withdraw-offer',
  'coins:offers'
]);

type CoinRequest = (operation: string, payload: Record<string, unknown>) => Promise<any>;
export interface BuildRuntimeCoinDeps {
  live: boolean;
  // Which app is asking (its build id): box limits are kept per app.
  appKey: string;
  // Live: published runtime with the server-issued grant; preview: owner draft.
  request: CoinRequest;
  confirm: ((request: CoinConfirmRequest) => Promise<boolean>) | null;
  newRequestId: () => string;
  // Clock for the box limits (tests pass their own).
  now?: () => number;
}

export function coinRequestError(message: string, code: string, details?: unknown) {
  const error = new Error(message) as Error & { code?: string; details?: unknown };
  error.code = code;
  if (details !== undefined) error.details = details;
  return error;
}

// How often one app may open a Coins box (review M7, 11-07): after the player
// says no, nothing from that app for 10 seconds; and at most 4 boxes a
// minute. A refused box is an error the app sees; the player sees nothing.
export const COIN_BOX_LIMITS = Object.freeze({
  afterCancelMs: 10_000,
  perMinute: 4
});
const boxHistory = new Map<string, { opened: number[]; cancelledAt: number }>();
export function resetCoinBoxLimitsForTest() {
  boxHistory.clear();
}
function takeBoxSlot(deps: BuildRuntimeCoinDeps) {
  const now = (deps.now || Date.now)();
  const history = boxHistory.get(deps.appKey) || { opened: [], cancelledAt: -Infinity };
  history.opened = history.opened.filter((at) => now - at < 60_000);
  if (now - history.cancelledAt < COIN_BOX_LIMITS.afterCancelMs || history.opened.length >= COIN_BOX_LIMITS.perMinute) {
    boxHistory.set(deps.appKey, history);
    throw coinRequestError(
      'Please wait a moment before asking again.',
      'build_coin_box_throttled'
    );
  }
  history.opened.push(now);
  boxHistory.set(deps.appKey, history);
  return history;
}

let confirmationOpen = false;
// One box at a time: an app cannot stack purchase boxes on top of each other.
async function askOnce(deps: BuildRuntimeCoinDeps, request: CoinConfirmRequest) {
  if (!deps.confirm)
    throw coinRequestError('Coins confirmation is unavailable.', 'build_coin_confirmation_unavailable');
  if (confirmationOpen)
    throw coinRequestError('Another Coins confirmation is already open.', 'build_coin_confirmation_open');
  const history = takeBoxSlot(deps);
  confirmationOpen = true;
  try {
    const confirmed = await deps.confirm(request);
    if (!confirmed) history.cancelledAt = (deps.now || Date.now)();
    return confirmed;
  } finally {
    confirmationOpen = false;
  }
}
const cancelled = () => coinRequestError('The player did not confirm.', 'build_coin_cancelled');
// The server's client requestId rule. Server-written ids (sales, takeovers)
// are "offer:<id>", which this can never match (review M1).
const REQUEST_ID = /^[A-Za-z0-9_-]{8,64}$/;
const pick = (payload: any, keys: string[]) =>
  Object.fromEntries(keys.filter((key) => payload?.[key] !== undefined).map((key) => [key, payload[key]]));

export async function runBuildRuntimeCoinRequest(
  type: string,
  payload: any,
  deps: BuildRuntimeCoinDeps
) {
  const operation = type.slice('coins:'.length);
  if (type === 'coins:balance') return deps.request('balance', {});
  if (type === 'coins:receipts')
    return deps.request('receipts', pick(payload, ['priceId', 'key', 'mine', 'held', 'cursor', 'limit']));
  if (type === 'coins:offers') return deps.request('offers', pick(payload, ['priceId', 'key', 'mine', 'cursor']));
  if (type === 'coins:charge') {
    const requestId =
      typeof payload?.requestId === 'string' && REQUEST_ID.test(payload.requestId)
        ? payload.requestId
        : deps.newRequestId();
    const ask = {
      priceId: payload?.priceId,
      ...pick(payload, ['key', 'builders']),
      requestId
    };
    const quote = await deps.request('quote', ask);
    // Paid before (the reply was lost): the same receipt, no second box.
    if (quote?.alreadyCharged) return { mode: quote.mode, replayed: true, receipt: quote.receipt };
    if (quote?.available === false)
      throw coinRequestError(
        quote.reason === 'owned'
          ? `You already have ${quote.price?.title || 'this'}.`
          : `${quote.holder?.username || 'Someone'} already has ${quote.price?.title || 'this'}.`,
        quote.reason === 'owned' ? 'build_coin_key_owned' : 'build_coin_key_taken',
        { holder: quote.holder, lastPrice: quote.lastPrice, minimumOffer: quote.minimumOffer }
      );
    if (quote?.selfPayment)
      throw coinRequestError(
        'You own this app, so these Coins would go back to you.',
        'build_coin_self_payment'
      );
    if (!quote?.canAfford)
      throw coinRequestError(
        `You need ${Number(quote?.coins || 0).toLocaleString()} Coins and have ${Number(quote?.balance || 0).toLocaleString()}.`,
        'build_coin_insufficient',
        { balance: quote?.balance, coins: quote?.coins }
      );
    const confirmed = await askOnce(deps, {
      kind: 'charge',
      appTitle: String(quote.appTitle || ''),
      title: String(quote.price?.title || ''),
      key: quote.key ?? null,
      coins: Number(quote.coins || 0),
      priceCoins: Number(quote.priceCoins ?? quote.coins ?? 0),
      destination: quote.destination === 'owner' ? 'owner' : 'removed',
      ownerName: quote.recipient?.username ?? null,
      builders: Array.isArray(quote.builders) ? quote.builders : [],
      balance: Number(quote.balance || 0),
      preview: quote.mode === 'preview'
    });
    if (!confirmed) throw cancelled();
    return deps.request('charge', {
      ...ask,
      ...pick(payload, ['payload']),
      expected: {
        coins: Number(quote.coins || 0),
        destination: quote.destination,
        recipientId: quote.recipient?.id ?? null,
        builders: (Array.isArray(quote.builders) ? quote.builders : []).map((builder: any) => ({
          userId: builder.userId,
          coins: builder.coins
        }))
      }
    });
  }
  if (!deps.live) {
    // Offers happen only in the published app; the preview says so.
    return deps.request(operation, pick(payload, ['priceId', 'key', 'coins', 'offerId', 'decision']));
  }
  if (type === 'coins:make-offer') {
    const quote = await deps.request('offer-quote', { priceId: payload?.priceId, key: payload?.key });
    const coins = Number(payload?.coins);
    if (!Number.isSafeInteger(coins) || coins < Number(quote.minimumOffer || 1))
      throw coinRequestError(
        `An offer for ${quote.price?.title || 'this'} must be at least ${Number(quote.minimumOffer || 1).toLocaleString()} Coins.`,
        'build_coin_offer_too_low',
        { minimumOffer: quote.minimumOffer }
      );
    // The highest offer price the reviewer approved (round-2 N2); the server
    // refuses more anyway, so no box opens for it.
    if (Number.isSafeInteger(quote.maximumOffer) && coins > quote.maximumOffer)
      throw coinRequestError(
        `An offer for ${quote.price?.title || 'this'} can be at most ${Number(quote.maximumOffer).toLocaleString()} Coins.`,
        'build_coin_offer_too_high',
        { maximumOffer: quote.maximumOffer }
      );
    const confirmed = await askOnce(deps, {
      kind: 'offer',
      appTitle: String(quote.appTitle || ''),
      title: String(quote.price?.title || ''),
      key: String(quote.key || ''),
      coins,
      holderName: quote.holder?.username ?? null,
      balance: Number(quote.balance || 0),
      takeoverAfterDays: quote.rule?.takeoverAfterDays,
      lapseAfterDays: quote.rule?.lapseAfterDays,
      reofferCooldownDays: quote.rule?.reofferCooldownDays
    });
    if (!confirmed) throw cancelled();
    return deps.request('make-offer', {
      priceId: payload?.priceId,
      key: payload?.key,
      coins,
      // The holder the box named: if it changed hands, the server refuses
      // instead of sending the offer to someone else (L2).
      expected: { holderId: quote.holder?.id ?? null, receiptId: quote.receiptId ?? null }
    });
  }
  if (type === 'coins:respond-offer' || type === 'coins:takeover' || type === 'coins:withdraw-offer') {
    const quote = await deps.request('offer-quote', { offerId: payload?.offerId });
    const offer = quote?.offer;
    if (!offer) throw coinRequestError('That offer is gone.', 'build_coin_offer_missing');
    const appTitle = String(quote.appTitle || '');
    if (type === 'coins:withdraw-offer') {
      // Withdrawing ends the player's 30-day claim and starts a 7-day wait,
      // so the app cannot do it quietly (M2).
      const confirmed = await askOnce(deps, {
        kind: 'withdraw',
        appTitle,
        title: String(quote.price?.title || ''),
        key: String(offer.key),
        coins: Number(offer.coins),
        holderName: offer.holder?.username ?? null,
        reofferCooldownDays: quote.rule?.reofferCooldownDays
      });
      if (!confirmed) throw cancelled();
      return deps.request('withdraw-offer', { offerId: offer.id });
    }
    if (type === 'coins:respond-offer') {
      // Both answers are the holder's own: selling gives the item away, and
      // keeping blocks the offer (and its 30-day takeover), so an app can
      // never answer for them.
      if (payload?.decision !== 'sell' && payload?.decision !== 'keep')
        throw coinRequestError('Answer keep or sell.', 'build_coin_offer_invalid');
      const confirmed = await askOnce(deps, {
        kind: payload.decision,
        appTitle,
        title: String(quote.price?.title || ''),
        key: String(offer.key),
        coins: Number(offer.coins),
        offererName: offer.offerer?.username ?? null
      });
      if (!confirmed) throw cancelled();
      return deps.request('respond-offer', { offerId: offer.id, decision: payload.decision });
    }
    const balance = await deps.request('balance', {});
    const confirmed = await askOnce(deps, {
      kind: 'takeover',
      appTitle,
      title: String(quote.price?.title || ''),
      key: String(offer.key),
      coins: Number(offer.coins),
      holderName: offer.holder?.username ?? null,
      balance: Number(balance?.coins || 0)
    });
    if (!confirmed) throw cancelled();
    return deps.request('takeover', {
      offerId: offer.id,
      expected: { coins: Number(offer.coins), destination: 'holder', recipientId: offer.holder?.id ?? null }
    });
  }
  throw coinRequestError('Unknown Coins request.', 'build_coin_operation_unknown');
}
