import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { COIN_TALLY_PLAIN_WORDS } from '~/helpers/buildRewardReviewCard';
import type { CoinPrice, CoinPriceReviewContext } from './types';

// "Coin prices" in the reward review (RULING 11-07): every price with its
// amount, limits and where its Coins go. Prices that pay a person (the owner,
// the builders Twinkle recorded on the land (r2 tally), or the previous holder
// when an item is resold)
// carry a red banner naming each kind, what they have been paid from this app
// so far, and approving them needs a note (round-2 review N3). Builder
// ceilings the declaration leaves out are shown with the platform defaults
// (N12), and a 0-Coin builders price shows what it can really cost (N7).

// The platform's builder ceilings (helpers/build/coinPrices.ts
// COIN_BUILDERS_MAX_RECIPIENTS / COIN_BUILDERS_MAX_COINS_PER_PURCHASE). The
// server's summary, when the review screen has it, fills them in itself.
const DEFAULT_MAX_RECIPIENTS = 64;
const DEFAULT_MAX_BUILDER_COINS = 100_000;
// The offer rule's days (COIN_OFFER_RULE); the server's context carries them.
const DEFAULT_OFFER_RULE = { takeoverAfterDays: 30, lapseAfterDays: 44 as number | null, reofferCooldownDays: 7 };
// The recordBlocks limits (COIN_TALLY_LIMITS on the API).
const TALLY_PER_SECOND = 5;
const TALLY_PER_DAY = 20_000;
// What a modified copy of the app can still do with the tally (r2).
export const COIN_TALLY_REMAINING_RISK = `Remaining risk: a modified copy of the app can record blocks only as its own player, at most ${TALLY_PER_SECOND} a second and ${TALLY_PER_DAY.toLocaleString()} a day, and only where it says they are. So it can record blocks that are not really there, or clear blocks other players recorded, and that changes what a buyer of that land is asked to pay for that player's blocks. The buyer always sees the total and every builder's share before agreeing. It cannot create Coins or pay anyone who did not record blocks.`;
function tallyAreaText(tally: NonNullable<NonNullable<CoinPrice['builders']>['tally']>) {
  const size = `${tally.plotSize}×${tally.plotSize}`;
  return tally.keyFormat === 'region:cx:cz'
    ? `the ${size} grid square the purchase key names ("region:cx:cz"), full height`
    : `the ${size} area whose lowest corner the purchase key names ("region:x:z"), full height`;
}

const ownerBannerClass = css`
  border: 2px solid ${Color.red()};
  background: ${Color.red(0.08)};
  color: ${Color.red()};
  border-radius: 10px;
  padding: 1rem 1.2rem;
  font-weight: 700;
  display: grid;
  gap: 0.4rem;
  > span {
    font-weight: 400;
    color: ${Color.darkerGray()};
  }
`;

export function coinPricePaysPerson(price: CoinPrice) {
  return price.destination === 'owner' || Boolean(price.builders) || Boolean(price.offers);
}

// The declared price with every builder ceiling filled in.
export function withCoinPriceDefaults(price: CoinPrice): CoinPrice {
  if (!price.builders) return price;
  return {
    ...price,
    builders: {
      ...price.builders,
      maxRecipients: price.builders.maxRecipients ?? DEFAULT_MAX_RECIPIENTS,
      maxCoinsPerPurchase: price.builders.maxCoinsPerPurchase ?? DEFAULT_MAX_BUILDER_COINS
    }
  };
}
export function coinBuildersCeiling(price: CoinPrice) {
  const b = withCoinPriceDefaults(price).builders;
  if (!b) return 0;
  return Math.min(
    b.maxCoinsPerPurchase ?? DEFAULT_MAX_BUILDER_COINS,
    DEFAULT_MAX_BUILDER_COINS,
    b.coinsPerUnit * b.maxUnitsPerRecipient * (b.maxRecipients ?? DEFAULT_MAX_RECIPIENTS)
  );
}

const countOf = (count: number, noun: string) => `${count.toLocaleString()} ${noun}${count === 1 ? '' : 's'}`;
export function coinPriceDestinationLine(price: CoinPrice, ownerName?: string | null) {
  const full = withCoinPriceDefaults(price);
  const base =
    full.coins <= 0
      ? full.builders
        ? 'no Coins of its own'
        : 'free claim'
      : full.destination === 'owner'
        ? `Coins go to ${ownerName || 'the app owner'} (the owner)`
        : 'Coins removed (nobody gets them)';
  const b = full.builders;
  const unit = b?.unitName || 'block';
  const builders = b
    ? `, plus ${b.coinsPerUnit.toLocaleString()} Coins per ${unit} to every other player for the ${unit}s Twinkle recorded as theirs inside the plot${b.tally ? ` (${tallyAreaText(b.tally)})` : ' (no tally declared, so nobody can be paid)'}; never the buyer or the owner; up to ${countOf(b.maxUnitsPerRecipient, unit)} each, ${countOf(b.maxRecipients ?? DEFAULT_MAX_RECIPIENTS, 'builder')}, ${coinBuildersCeiling(full).toLocaleString()} Coins per purchase in all; land over a limit cannot be bought`
    : '';
  // A resale pays a person, so the line never ends at "removed" (N3).
  const resale = full.offers
    ? `. When the item is resold (Sell, or a takeover after 30 days without an answer), the Coins go to the previous holder, another player: ${full.offers.minCoins.toLocaleString()} to ${full.offers.maxCoins !== undefined ? full.offers.maxCoins.toLocaleString() : '(no highest price declared)'} Coins a sale`
    : '';
  return `${base}${builders}${resale}`;
}

function limitsLine(price: CoinPrice) {
  return [
    price.userDailyLimit ? `${price.userDailyLimit} a day per player` : '',
    price.maxLifetime ? `${price.maxLifetime} ever per player` : '',
    price.uniqueKey
      ? `one holder per item key${price.keyGroup ? ` (keys shared with key group “${price.keyGroup}”)` : ''}`
      : '',
    price.offers
      ? `others may offer from ${price.offers.minCoins.toLocaleString()}${price.offers.maxCoins !== undefined ? ` to ${price.offers.maxCoins.toLocaleString()}` : ''} Coins (more than the last price, never above the highest offer price); ${price.offers.maxOpenPerPlayer && price.offers.maxOpenPerPlayer > 1 ? `${price.offers.maxOpenPerPlayer} open offers` : 'one open offer'} per player`
      : price.uniqueKey && price.keyGroup
        ? 'items bought with this price take no offers, even in a shared key group'
        : ''
  ]
    .filter(Boolean)
    .join(' · ');
}

export default function CoinPricesSummary({
  prices: declared,
  spendBudget,
  context
}: {
  prices: CoinPrice[];
  spendBudget?: { userDailyCoins: number } | null;
  context?: CoinPriceReviewContext | null;
}) {
  if (!declared.length) return null;
  // The server's summary fills in defaults; the declaration keeps howTo.
  const summarized = new Map((context?.prices || []).map((price) => [price.id, price]));
  const prices = declared.map((price) =>
    withCoinPriceDefaults({ ...price, ...(summarized.get(price.id) || {}), howTo: price.howTo })
  );
  const ownerName = context?.ownerUsername || null;
  const toOwner = prices.some((price) => price.destination === 'owner');
  const toBuilders = prices.some((price) => price.builders);
  const resold = prices.filter((price) => price.offers);
  const rule = context?.offerRule || DEFAULT_OFFER_RULE;
  const highestResale = Math.max(0, ...resold.map((price) => price.offers?.maxCoins || 0));
  return (
    <>
      <h4>Coin prices</h4>
      {(toOwner || toBuilders || resold.length > 0) && (
        <div className={ownerBannerClass} role="alert">
          {toOwner ? <div>Coins go to {ownerName || 'the app owner'} (the owner)</div> : null}
          {toBuilders ? <div>Coins go to the builders Twinkle recorded on the land</div> : null}
          {resold.length ? <div>Coins go to another player when an item is resold</div> : null}
          {toOwner && context ? (
            <span>
              The owner has earned {context.ownerEarnings.coins.toLocaleString()} Coins from this app so far,
              from {context.ownerEarnings.buyers.toLocaleString()}{' '}
              {context.ownerEarnings.buyers === 1 ? 'buyer' : 'buyers'} (
              {context.ownerEarnings.purchases.toLocaleString()} purchases).
            </span>
          ) : null}
          {toBuilders ? (
            <span>
              {COIN_TALLY_PLAIN_WORDS} The buyer and the app owner are never paid, and land over a limit below
              cannot be bought.
              {context ? ` ${context.builderPurchases.toLocaleString()} purchases so far also paid builders.` : ''}
              {context?.tally
                ? ` Twinkle has recorded ${context.tally.cells.toLocaleString()} blocks in this app from ${context.tally.builders.toLocaleString()} ${context.tally.builders === 1 ? 'player' : 'players'}.`
                : ''}{' '}
              {COIN_TALLY_REMAINING_RISK}
            </span>
          ) : null}
          {resold.length ? (
            <span>
              Other players may offer on items bought with{' '}
              {resold.map((price) => `“${price.title}”`).join(', ')}. Every Sell, and every takeover, pays the
              previous holder (up to {highestResale.toLocaleString()} Coins a sale), so two accounts can move Coins
              between them through one item.
              {context?.resales
                ? ` ${context.resales.sales.toLocaleString()} resales so far paid ${context.resales.coins.toLocaleString()} Coins to ${context.resales.sellers.toLocaleString()} ${context.resales.sellers === 1 ? 'player' : 'players'}.`
                : ''}
            </span>
          ) : null}
          {resold.length ? (
            <span>
              {/* L1, in plain words: the 30-day rule and the lapse. */}
              If the holder does not answer an offer for {rule.takeoverAfterDays} days, the offerer may buy the item
              for the offered Coins
              {rule.lapseAfterDays
                ? ` from day ${rule.takeoverAfterDays} to day ${rule.lapseAfterDays}. If nobody acts by day ${rule.lapseAfterDays}, the offer ends`
                : ''}
              . Until the offerer buys, the holder can still answer Keep or Sell, even after day{' '}
              {rule.takeoverAfterDays}. A holder who comes back and keeps the item ends the offer, no
              Coins move, and the offerer is told in plain words. After a Keep, a withdraw or a lapse, the same
              player waits {rule.reofferCooldownDays} days to offer on that item again. If the app&apos;s approval
              is revoked or the app is unpublished, open offers end at once and no Coins move.
            </span>
          ) : null}
          <span>Approving needs a review note saying why this is fair.</span>
        </div>
      )}
      <p>
        {spendBudget
          ? `At most ${spendBudget.userDailyCoins.toLocaleString()} Coins per player per day on purchases in this app (builder payments included). Offers, Sells and takeovers are not limited by it.`
          : 'No daily spend budget for this app.'}
      </p>
      {prices.map((price) => {
        const sale = context?.sales.find((entry) => entry.priceId === price.id);
        const ceiling = coinBuildersCeiling(price);
        return (
          <article
            key={price.id}
            style={coinPricePaysPerson(price) ? { borderLeftColor: Color.red() } : undefined}
          >
            <h4>
              {price.title} · {price.coins.toLocaleString()} Coins
              {ceiling ? ` + up to ${ceiling.toLocaleString()} Coins to builders` : ''}
            </h4>
            {price.howTo ? <p>What the player gets: {price.howTo}</p> : null}
            <p>
              <strong>Where the Coins go:</strong> {coinPriceDestinationLine(price, ownerName)}
            </p>
            {spendBudget && ceiling && price.coins + ceiling > spendBudget.userDailyCoins ? (
              <p style={{ color: Color.red() }}>
                The daily spend budget ({spendBudget.userDailyCoins.toLocaleString()} Coins) stops any purchase
                that would pay builders more than{' '}
                {Math.max(0, spendBudget.userDailyCoins - price.coins).toLocaleString()} Coins.
              </p>
            ) : null}
            <p>
              Price ID: {price.id}
              {limitsLine(price) ? ` · ${limitsLine(price)}` : ' · no per-player limit'}
            </p>
            {sale ? (
              <p>
                Sold so far: {sale.purchases.toLocaleString()} to {sale.buyers.toLocaleString()}{' '}
                {sale.buyers === 1 ? 'player' : 'players'} · {sale.coins.toLocaleString()} Coins
              </p>
            ) : null}
          </article>
        );
      })}
    </>
  );
}
