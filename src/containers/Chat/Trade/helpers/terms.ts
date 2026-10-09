import type { TradeBundle, TradeTerms } from '../types';

export function emptyBundle(): TradeBundle {
  return { coins: 0, cardIds: [], groupIds: [], builds: [] };
}

export function parseTradeCoins(input: string) {
  const text = input.trim();
  if (!text) return { amount: 0, error: '' };
  if (!/^\d+$/.test(text) && !/^\d{1,3}(,\d{3})+$/.test(text)) {
    return {
      amount: 0,
      error: 'Use whole coins, such as 1,500. No decimals or minus signs.'
    };
  }
  const amount = Number(text.replaceAll(',', ''));
  if (!Number.isSafeInteger(amount) || amount > 999_999_999) {
    return { amount: 0, error: 'Enter no more than 999,999,999 coins.' };
  }
  return { amount, error: '' };
}

export function hasTradeAssets(bundle: TradeBundle) {
  return Boolean(
    bundle.coins ||
    bundle.cardIds.length ||
    bundle.groupIds.length ||
    bundle.builds.length
  );
}

export function summarizeBundle(bundle: TradeBundle) {
  const parts: string[] = [];
  if (bundle.coins) parts.push(`${bundle.coins.toLocaleString('en-US')} coins`);
  for (const [count, label] of [
    [bundle.cardIds.length, 'card'],
    [bundle.groupIds.length, 'group'],
    [bundle.builds.length, 'app']
  ] as const) {
    if (count) parts.push(`${count} ${label}${count === 1 ? '' : 's'}`);
  }
  return parts.join(' + ') || 'Nothing';
}

export function normalizeBundle(bundle: any): TradeBundle {
  return {
    coins: Number(bundle?.coins) || 0,
    cardIds: [
      ...(bundle?.cardIds || bundle?.cards?.map((card: any) => card.id) || [])
    ],
    groupIds: [
      ...(bundle?.groupIds ||
        bundle?.groups?.map((group: any) => group.id) ||
        [])
    ],
    builds: bundle?.buildIds?.length
      ? bundle.buildIds.map(
          (id: number) =>
            bundle.builds?.find(
              (build: any) => Number(build.id) === Number(id)
            ) || { id, title: `App #${id}`, unavailable: true }
        )
      : [...(bundle?.builds || [])],
    cards: bundle?.cards || [],
    groups: bundle?.groups || []
  };
}

export function getViewerTradeTerms(
  transaction: any,
  viewerId: number
): TradeTerms {
  const offer = normalizeBundle(transaction.offer);
  const want = normalizeBundle(transaction.want);
  return Number(transaction.from) === Number(viewerId)
    ? { give: offer, receive: want }
    : { give: want, receive: offer };
}

export function tradeTermsKey(transaction: any) {
  const keys = (bundle: any) => {
    const normalized = normalizeBundle(bundle);
    return [
      normalized.coins,
      [...normalized.cardIds].sort((a, b) => a - b),
      [...normalized.groupIds].sort((a, b) => a - b),
      normalized.builds.map((build) => Number(build.id)).sort((a, b) => a - b)
    ];
  };
  return JSON.stringify([
    transaction?.id,
    transaction?.from,
    transaction?.to,
    transaction?.type,
    keys(transaction?.offer),
    keys(transaction?.want)
  ]);
}
