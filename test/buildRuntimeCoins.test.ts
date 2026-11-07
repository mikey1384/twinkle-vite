import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  COIN_BOX_LIMITS,
  runBuildRuntimeCoinRequest
} from '../src/containers/Build/PreviewPanel/helpers/buildRuntimeCoins';
import { coinConfirmText, coinBuilderCountLine } from '../src/components/Build/Coins/coinConfirmText';
import { isMutatingPreviewRequestType } from '../src/containers/Build/PreviewPanel/helpers/previewRequestPolicy';
import {
  buildCoinPricePersonWarning,
  COIN_TALLY_PLAIN_WORDS,
  formatBuildCoinPriceLine,
  initialReviewRulesText
} from '../src/helpers/buildRewardReviewCard';
import { createCoinConfirmArming } from '../src/components/Build/Coins/coinConfirmArming';
import {
  COIN_TALLY_REMAINING_RISK,
  coinPriceDestinationLine,
  coinPricePaysPerson
} from '../src/components/Build/Rewards/CoinPricesSummary';

const quote = {
  mode: 'live',
  available: true,
  selfPayment: false,
  price: { id: 'land-plot', title: 'Extra land plot' },
  key: 'main:1:2',
  coins: 535,
  priceCoins: 500,
  destination: 'removed',
  recipient: null,
  builders: [
    { userId: 6, username: 'nayeayo007', units: 10, coins: 20 },
    { userId: 9, username: 'KenGo', units: 7, coins: 15 }
  ],
  unitName: 'block',
  balance: 2000,
  canAfford: true,
  appTitle: 'Firestar World'
};
// Box limits are kept per app: each test gets its own app.
let appCounter = 0;
const nextApp = () => `app-${++appCounter}`;
function deps(overrides: Record<string, any> = {}) {
  const calls: Array<[string, any]> = [];
  const asked: any[] = [];
  return {
    calls,
    asked,
    deps: {
      live: true,
      appKey: nextApp(),
      newRequestId: () => 'host-request-1',
      confirm: async (request: any) => {
        asked.push(request);
        return overrides.answer ?? true;
      },
      request: async (operation: string, body: any) => {
        calls.push([operation, body]);
        if (operation === 'quote') return overrides.quote ?? quote;
        return { mode: 'live', receipt: { id: 1 }, balances: { coins: 1465 } };
      },
      ...(overrides.deps || {})
    }
  };
}

test('a charge shows Twinkle’s box built from the server quote, then sends what was confirmed', async () => {
  const { calls, asked, deps: d } = deps();
  const result = await runBuildRuntimeCoinRequest(
    'coins:charge',
    // The app may try to smuggle a price or recipient; none of it is sent.
    { priceId: 'land-plot', key: 'main:1:2', builders: [{ userId: 6, units: 10 }, { userId: 9, units: 7 }], coins: 1, recipientId: 3, expected: { coins: 1 } },
    d
  );
  assert.equal(result.receipt.id, 1);
  assert.equal(asked.length, 1);
  assert.equal(asked[0].coins, 535);
  const [, chargeBody] = calls.find(([op]) => op === 'charge')!;
  assert.deepEqual(chargeBody.expected, {
    coins: 535,
    destination: 'removed',
    recipientId: null,
    builders: [{ userId: 6, coins: 20 }, { userId: 9, coins: 15 }]
  });
  assert.equal(chargeBody.requestId, 'host-request-1');
  assert.equal('coins' in chargeBody, false);
  assert.equal('recipientId' in chargeBody, false);
  // r2: the app's builder list never leaves the host, in the quote or the charge.
  assert.equal('builders' in calls.find(([op]) => op === 'quote')![1], false);
  assert.equal('builders' in chargeBody, false);
  const text = coinConfirmText(asked[0]);
  assert.match(text.lines.join(' '), /500 Coins are removed, so nobody gets them, and 35 go to nayeayo007 \(20\) and KenGo \(15\), who built here/);
  // The server's tally, in the box: who built here and how many.
  assert.match(text.lines.join(' '), /Twinkle counted the blocks other players placed here: nayeayo007 10 blocks and KenGo 7 blocks\./);
  assert.equal(text.confirmLabel, 'Buy for 535 Coins');
});

test('no confirmation, no charge', async () => {
  const { calls, deps: d } = deps({ answer: false });
  await assert.rejects(
    runBuildRuntimeCoinRequest('coins:charge', { priceId: 'land-plot', key: 'main:1:2' }, d),
    (error: any) => error.code === 'build_coin_cancelled'
  );
  assert.deepEqual(calls.map(([op]) => op), ['quote']);
});

test('a held item, self payment or a short balance never opens the box', async () => {
  for (const [override, expected] of [
    [{ available: false, reason: 'taken', holder: { username: 'rival' } }, 'build_coin_key_taken'],
    [{ selfPayment: true }, 'build_coin_self_payment'],
    [{ canAfford: false }, 'build_coin_insufficient']
  ] as const) {
    const { asked, calls, deps: d } = deps({ quote: { ...quote, ...override } });
    await assert.rejects(
      runBuildRuntimeCoinRequest('coins:charge', { priceId: 'land-plot', key: 'main:1:2' }, d),
      (error: any) => error.code === expected
    );
    assert.equal(asked.length, 0);
    assert.equal(calls.some(([op]) => op === 'charge'), false);
  }
});

test('a retried purchase already paid returns its receipt without a second box', async () => {
  const { asked, calls, deps: d } = deps({ quote: { mode: 'live', alreadyCharged: true, receipt: { id: 7 } } });
  const result = await runBuildRuntimeCoinRequest('coins:charge', { priceId: 'snack', requestId: 'app-request-01' }, d);
  assert.equal(result.receipt.id, 7);
  assert.equal(asked.length, 0);
  assert.equal(calls[0][1].requestId, 'app-request-01');
});

test('owner destination and preview wording are plain', () => {
  const text = coinConfirmText({
    kind: 'charge', appTitle: 'App', title: 'VIP pass', key: null, coins: 100, priceCoins: 100,
    destination: 'owner', ownerName: 'mikey', builders: [], balance: 300, preview: true
  });
  assert.match(text.lines.join(' '), /The Coins go to mikey, who made this app\./);
  assert.match(text.lines.join(' '), /Preview: nothing will be charged/);
  const offer = coinConfirmText({ kind: 'offer', appTitle: 'App', title: 'Plot', key: 'k', coins: 600, holderName: 'buyer', balance: 900 });
  assert.match(offer.lines.join(' '), /30 days/);
  assert.match(offer.lines.join(' '), /Nothing is taken from you now/);
  // Mikey 11-07: the holder may still Keep after day 30, until the offerer buys.
  assert.match(offer.lines.join(' '), /Until you buy, .* can still keep it, even after day 30/);
});

test('every spending request is a mutation the preview transition guard skips', () => {
  for (const type of ['coins:charge', 'coins:make-offer', 'coins:respond-offer', 'coins:takeover', 'coins:withdraw-offer'])
    assert.equal(isMutatingPreviewRequestType(type), true, type);
  assert.equal(isMutatingPreviewRequestType('coins:balance'), false);
});

test('the approval chat card names each price’s destination', () => {
  assert.equal(
    formatBuildCoinPriceLine({ id: 'land', title: 'Extra land plot', coins: 500, destination: 'removed' }),
    'Extra land plot — 500 Coins, removed'
  );
  assert.equal(
    formatBuildCoinPriceLine({ id: 'vip', title: 'VIP', coins: 100, destination: 'owner' }, 'mikey'),
    'VIP — 100 Coins, goes to mikey'
  );
});

test('the host never forwards app-chosen amounts for coins requests', () => {
  const source = readFileSync(new URL('../src/containers/Build/PreviewPanel/hooks/useHostBridge.ts', import.meta.url), 'utf8');
  const block = source.slice(source.indexOf("case 'coins:balance':"), source.indexOf("case 'notifications:get-subject-update-subscription'"));
  assert.match(block, /runBuildRuntimeCoinRequest\(type, payload,/);
  assert.match(block, /requestBuildCoinConfirmationRef\.current/);
  assert.doesNotMatch(block, /payload\?\.(coins|recipientId|expected|destination)/);
});

test('an app cannot answer an offer for the holder: Keep and Sell both need the box', async () => {
  for (const decision of ['keep', 'sell']) {
    const calls: string[] = [];
    const asked: any[] = [];
    await assert.rejects(
      runBuildRuntimeCoinRequest('coins:respond-offer', { offerId: 4, decision }, {
        live: true,
        appKey: nextApp(),
        newRequestId: () => 'x-request-1',
        confirm: async (request) => {
          asked.push(request);
          return false;
        },
        request: async (operation) => {
          calls.push(operation);
          return { offer: { id: 4, key: 'k', coins: 600, offerer: { username: 'rival' } }, price: { title: 'Plot' } };
        }
      }),
      (error: any) => error.code === 'build_coin_cancelled'
    );
    assert.equal(asked[0].kind, decision);
    assert.deepEqual(calls, ['offer-quote']);
  }
});

// Review fixes (projects/lumine-coin-charges/review/REVIEW.md, 11-07). The
// review's host attacks (review/webCoinHostAttacks.test.ts) must now fail.
function harness({ answers = [] as boolean[], responses = {} as Record<string, any>, clock = { now: 0 } } = {}) {
  const calls: Array<[string, any]> = [];
  const asked: any[] = [];
  return {
    calls,
    asked,
    clock,
    deps: {
      live: true,
      appKey: nextApp(),
      now: () => clock.now,
      newRequestId: () => 'host-request-1',
      confirm: async (request: any) => {
        asked.push(request);
        return answers.shift() ?? false;
      },
      request: async (operation: string, body: any) => {
        calls.push([operation, body]);
        if (operation === 'quote') return responses.quote ?? quote;
        return responses[operation] ?? { mode: 'live', receipt: { id: 1 }, balances: { coins: 1 } };
      }
    }
  };
}
const offerQuote = {
  mode: 'live',
  appTitle: 'Firestar World',
  offer: { id: 41, key: 'main:1:2', coins: 600, status: 'open', offerer: { id: 3, username: 'me' }, holder: { id: 2, username: 'holder' } },
  price: { id: 'land-plot', title: 'Extra land plot' },
  rule: { takeoverAfterDays: 30, lapseAfterDays: 44, reofferCooldownDays: 7 }
};

test('M2: withdrawing an offer needs the box; no means the offer stays', async () => {
  const h = harness({ responses: { 'offer-quote': offerQuote } });
  await assert.rejects(
    runBuildRuntimeCoinRequest('coins:withdraw-offer', { offerId: 41 }, h.deps),
    (error: any) => error.code === 'build_coin_cancelled'
  );
  assert.equal(h.asked.length, 1);
  assert.equal(h.asked[0].kind, 'withdraw');
  assert.deepEqual(h.calls.map(([op]) => op), ['offer-quote']);
  const text = coinConfirmText(h.asked[0]);
  assert.match(text.lines.join(' '), /cannot offer on it again for 7 days/);
  const yes = harness({ answers: [true], responses: { 'offer-quote': offerQuote } });
  await runBuildRuntimeCoinRequest('coins:withdraw-offer', { offerId: 41 }, yes.deps);
  assert.deepEqual(yes.calls.at(-1), ['withdraw-offer', { offerId: 41 }]);
});

test('M7: after a no, the same app gets no box for 10 s, and at most 4 boxes a minute', async () => {
  const h = harness();
  await assert.rejects(runBuildRuntimeCoinRequest('coins:charge', { priceId: 'snack' }, h.deps), (e: any) => e.code === 'build_coin_cancelled');
  // The review's 20 boxes in a row: the next 19 never reach the player.
  for (let i = 0; i < 19; i++)
    await assert.rejects(runBuildRuntimeCoinRequest('coins:charge', { priceId: 'snack' }, h.deps), (e: any) => e.code === 'build_coin_box_throttled');
  assert.equal(h.asked.length, 1);
  h.clock.now += COIN_BOX_LIMITS.afterCancelMs;
  await assert.rejects(runBuildRuntimeCoinRequest('coins:charge', { priceId: 'snack' }, h.deps), (e: any) => e.code === 'build_coin_cancelled');
  assert.equal(h.asked.length, 2);
  // Boxes the player accepts still count toward 4 a minute.
  const busy = harness({ answers: [true, true, true, true, true] });
  for (let i = 0; i < 4; i++) {
    await runBuildRuntimeCoinRequest('coins:charge', { priceId: 'snack' }, busy.deps);
    busy.clock.now += 1000;
  }
  await assert.rejects(runBuildRuntimeCoinRequest('coins:charge', { priceId: 'snack' }, busy.deps), (e: any) => e.code === 'build_coin_box_throttled');
  busy.clock.now += 60_000;
  await runBuildRuntimeCoinRequest('coins:charge', { priceId: 'snack' }, busy.deps);
  assert.equal(busy.asked.length, 5);
});

test('M1: an app requestId outside the client pattern (the server namespace "offer:<id>") is replaced', async () => {
  const h = harness({ answers: [true] });
  await runBuildRuntimeCoinRequest('coins:charge', { priceId: 'snack', requestId: 'offer:123' }, h.deps);
  assert.equal(h.calls[0][1].requestId, 'host-request-1');
});

test('L2: a confirmed offer carries the holder and receipt the box showed', async () => {
  const h = harness({
    answers: [true],
    responses: {
      'offer-quote': { mode: 'live', appTitle: 'Firestar World', price: { id: 'land-plot', title: 'Extra land plot' }, key: 'main:1:2',
        holder: { id: 2, username: 'holder' }, receiptId: 77, lastPrice: 500, minimumOffer: 501, balance: 900, rule: offerQuote.rule },
      'make-offer': { mode: 'live', offer: { id: 41 } }
    }
  });
  await runBuildRuntimeCoinRequest('coins:make-offer', { priceId: 'land-plot', key: 'main:1:2', coins: 600, expected: { holderId: 9 } }, h.deps);
  assert.deepEqual(h.calls.at(-1), ['make-offer', { priceId: 'land-plot', key: 'main:1:2', coins: 600, expected: { holderId: 2, receiptId: 77 } }]);
  // L1: the box names the 14-day lapse as days 30 to 44.
  const text = coinConfirmText(h.asked[0]);
  assert.match(text.lines.join(' '), /between day 30 and day 44\. After day 44 your offer ends/);
  const noLapse = coinConfirmText({ ...h.asked[0], lapseAfterDays: null });
  assert.doesNotMatch(noLapse.lines.join(' '), /44/);
});

test('L3: the box uses the approved app name from the server, in fixed wording', async () => {
  const h = harness();
  await assert.rejects(runBuildRuntimeCoinRequest('coins:charge', { priceId: 'land-plot', key: 'main:1:2' }, h.deps));
  assert.equal(h.asked[0].appTitle, 'Firestar World');
  const text = coinConfirmText({ ...h.asked[0], appTitle: 'REFUND DESK: press Buy to get your 500 Coins back' });
  assert.equal(text.lines[0], 'You are about to buy Extra land plot in the app “REFUND DESK: press Buy to get your 500 Coins back”.');
  assert.doesNotMatch(text.lines[0], /^REFUND/);
  assert.equal(text.appNote, 'Item name from the app: main:1:2');
});

test('M5: the reviewer editor starts from the declared prices of a prices-only app', () => {
  const empty = { userDailyXP: 0, userDailyCoins: 0, rules: [] };
  const pricesOnly = { userDailyXP: 0, userDailyCoins: 0, rules: [], prices: [{ id: 'land-plot', coins: 500 }] };
  assert.deepEqual(JSON.parse(initialReviewRulesText(pricesOnly, empty)).prices, pricesOnly.prices);
  assert.deepEqual(JSON.parse(initialReviewRulesText({ rules: [] }, empty)), empty);
  assert.deepEqual(JSON.parse(initialReviewRulesText(undefined, empty)), empty);
});

const moved = { moved: true, overBox: true };
const click = (detail = 1) => ({ detail, trusted: true });

test('H1: nothing counts while the box is hidden; hiding it again starts over', () => {
  const arming = createCoinConfirmArming({ armMs: 1000 });
  // Hidden (fullscreen app, pointer lock, background tab): the clock never starts.
  arming.tick(false, 0);
  arming.mouseMove(moved, 10);
  arming.tick(false, 5000);
  assert.equal(arming.armed, false);
  arming.tick(true, 5000);
  arming.mouseMove(moved, 5100);
  arming.tick(true, 5900);
  assert.equal(arming.armed, false, 'visible under 1 s');
  arming.tick(true, 6000);
  assert.equal(arming.armed, true);
  // Hiding it again resets everything, the mouse movement too.
  arming.tick(false, 6100);
  arming.tick(true, 6200);
  arming.tick(true, 9000);
  assert.equal(arming.armed, false);
  assert.equal(arming.state().moved, false);
});

test('N4/P2: with a mouse, Buy turns on after 1 s visible plus real movement over the box (never under a frame\'s pointer lock)', () => {
  const arming = createCoinConfirmArming({ armMs: 1000 });
  arming.tick(true, 0);
  // A game frame holds pointer lock: the website gets no moves; resting or
  // synthetic hover updates are not movement, nor is movement off the box.
  arming.mouseMove({ moved: false, overBox: true }, 500);
  arming.mouseMove({ moved: true, overBox: false }, 600);
  arming.tick(true, 5000);
  assert.equal(arming.armed, false, 'visible for 5 s but never moved over the box');
  // A resting cursor's click on Buy does nothing.
  arming.press('mouse', true, 5000);
  assert.equal(arming.canConfirm(click(), 5000), false);
  // The first move over the box turns it on at once (visible > 1 s already).
  arming.mouseMove(moved, 5100);
  arming.tick(true, 5100);
  assert.equal(arming.armed, true);
  arming.press('mouse', true, 5200);
  assert.equal(arming.canConfirm(click(), 5200), true);
});

test('P2: a click on the pale Buy does nothing and costs nothing; the next click once Buy is on works', () => {
  const arming = createCoinConfirmArming({ armMs: 1000 });
  arming.tick(true, 0);
  arming.mouseMove(moved, 300);
  arming.press('mouse', true, 500);
  assert.equal(arming.canConfirm(click(), 500), false, 'pale Buy');
  arming.tick(true, 1000);
  assert.equal(arming.armed, true, 'no restart after the early click');
  // Overshoot, start near Buy: no approach rule any more.
  arming.press('mouse', true, 1100);
  assert.equal(arming.canConfirm(click(), 1100), true);
  // A press that began while Buy was pale does not count when released later.
  const late = createCoinConfirmArming({ armMs: 1000 });
  late.tick(true, 0);
  late.mouseMove(moved, 100);
  late.press('mouse', true, 900);
  late.tick(true, 1200);
  assert.equal(late.canConfirm(click(), 1200), false);
  // A click off Buy never confirms.
  late.press('mouse', false, 1300);
  assert.equal(late.canConfirm(click(), 1300), false);
});

test('touch: a visible wait, then a tap that starts on Buy; an early tap does nothing; a non-stop tapper cannot buy', () => {
  const touch = createCoinConfirmArming({ armMs: 1000, touchPrimary: true });
  assert.equal(touch.mode, 'touch');
  touch.tick(true, 0);
  touch.press('touch', true, 500);
  assert.equal(touch.canConfirm(click(), 500), false, 'pale Buy');
  touch.tick(true, 1000);
  assert.equal(touch.armed, true, 'the early tap did not restart the wait');
  touch.press('touch', true, 1400);
  assert.equal(touch.canConfirm(click(), 1400), true);
  // A tap stream every 200 ms never confirms; a tap after a 0.4 s pause does.
  const tapper = createCoinConfirmArming({ armMs: 1000, touchPrimary: true });
  tapper.tick(true, 0);
  for (let at = 0; at <= 3000; at += 200) {
    tapper.press('touch', true, at);
    assert.equal(tapper.canConfirm(click(), at), false, `tap at ${at}`);
  }
  tapper.press('touch', true, 3400);
  assert.equal(tapper.canConfirm(click(), 3400), true);
  // A mouse click on a touch-armed Buy still needs mouse movement.
  const leak = createCoinConfirmArming({ armMs: 1000, touchPrimary: true });
  leak.tick(true, 0);
  leak.tick(true, 1500);
  assert.equal(leak.armed, true);
  leak.press('mouse', true, 1500);
  assert.equal(leak.canConfirm(click(), 1500), false);
});

test('P8: an iPad trackpad never turns an on Buy off', () => {
  const ipad = createCoinConfirmArming({ armMs: 1000, touchPrimary: true });
  ipad.tick(true, 0);
  ipad.tick(true, 1200);
  assert.equal(ipad.armed, true);
  // Trackpad movement off the box: no mode change.
  ipad.mouseMove({ moved: true, overBox: false }, 1300);
  assert.equal(ipad.armedFor(ipad.mode, 1300), true);
  // Over the box: mouse mode, and that movement counts.
  ipad.mouseMove(moved, 1400);
  assert.equal(ipad.mode, 'mouse');
  assert.equal(ipad.armedFor(ipad.mode, 1400), true);
  ipad.press('mouse', true, 1500);
  assert.equal(ipad.canConfirm(click(), 1500), true);
});

test('P1/N9: keyboard: Tab never restarts; Enter on Buy once on confirms; Space, repeats and early Enters never do', () => {
  const keys = createCoinConfirmArming({ armMs: 1000 });
  keys.tick(true, 0);
  // Quick Tabs before Buy is on: no restart. Enter on the pale Buy is
  // blocked and ignored.
  keys.keyDown('Tab', { onBuy: false, repeat: false }, 100);
  keys.keyUp('Tab', false, 150);
  keys.buyFocus(true);
  const early = keys.keyDown('Enter', { onBuy: true, repeat: false }, 300);
  assert.equal(early.block, true);
  assert.equal(keys.canConfirm(click(0), 300), false);
  keys.keyUp('Enter', true, 350);
  assert.equal(keys.mode, 'keyboard');
  keys.tick(true, 1000);
  assert.equal(keys.armed, true, 'Tab and the early Enter did not restart the wait');
  // Space on Buy: blocked on keydown and keyup, and its click is refused.
  assert.equal(keys.keyDown(' ', { onBuy: true, repeat: false }, 1100).block, true);
  assert.equal(keys.keyUp(' ', true, 1150).block, true);
  assert.equal(keys.canConfirm(click(0), 1150), false, 'Space never confirms');
  // A fresh Enter on Buy, Buy on: confirms (no focus timer).
  const enter = keys.keyDown('Enter', { onBuy: true, repeat: false }, 1200);
  assert.equal(enter.block, false);
  assert.equal(keys.canConfirm(click(0), 1200), true);
});

test('P1: an Enter held down from before the box never confirms, even with Buy on and focused', () => {
  const held = createCoinConfirmArming({ armMs: 1000 });
  held.tick(true, 0);
  held.buyFocus(true);
  // Auto-repeat arriving from a key pressed in the game (first event the
  // page sees is already a repeat).
  for (let at = 100; at <= 2000; at += 100) {
    const result = held.keyDown('Enter', { onBuy: true, repeat: true }, at);
    assert.equal(result.block, true, 'a held key never presses a button');
    assert.equal(held.canConfirm(click(0), at), false);
  }
  // Pressed on the pale Buy and kept down past arming (browser not marking
  // repeats): still the same press.
  const longPress = createCoinConfirmArming({ armMs: 1000 });
  longPress.tick(true, 0);
  longPress.buyFocus(true);
  longPress.keyDown('Enter', { onBuy: true, repeat: false }, 500);
  longPress.tick(true, 1500);
  longPress.keyDown('Enter', { onBuy: true, repeat: false }, 1500);
  assert.equal(longPress.canConfirm(click(0), 1500), false);
  // Released and pressed again: confirms.
  longPress.keyUp('Enter', true, 1600);
  longPress.keyDown('Enter', { onBuy: true, repeat: false }, 1700);
  assert.equal(longPress.canConfirm(click(0), 1700), true);
  // A window blur forgets held keys (a key-up that never arrived).
  const blurred = createCoinConfirmArming({ armMs: 1000 });
  blurred.tick(true, 0);
  blurred.buyFocus(true);
  blurred.keyDown('Enter', { onBuy: false, repeat: false }, 100);
  blurred.resetKeys();
  blurred.tick(true, 1200);
  blurred.keyDown('Enter', { onBuy: true, repeat: false }, 1200);
  assert.equal(blurred.canConfirm(click(0), 1200), true);
});

test('P7: an assistive-technology press (no pointer, no key) confirms only with Buy on and focused; scripts never', () => {
  const at = createCoinConfirmArming({ armMs: 1000 });
  at.tick(true, 0);
  at.buyFocus(true);
  assert.equal(at.canConfirm(click(0), 500), false, 'Buy not on yet');
  at.tick(true, 1000);
  assert.equal(at.canConfirm(click(0), 1000), true);
  at.buyFocus(false);
  assert.equal(at.canConfirm(click(0), 1100), false, 'Buy not focused');
  at.buyFocus(true);
  assert.equal(at.canConfirm({ detail: 0, trusted: false }, 1200), false, 'an untrusted (script) click');
  // A click that follows a refused key is judged by that key, not as AT.
  at.keyDown('a', { onBuy: true, repeat: false }, 1300);
  assert.equal(at.canConfirm(click(0), 1300), false);
  assert.equal(at.canConfirm(click(0), 2000), true, 'long after the key, an AT press again');
  // The mode leak: Buy on by the keyboard rule, then a resting mouse click.
  const leak = createCoinConfirmArming({ armMs: 1000 });
  leak.tick(true, 0);
  leak.keyDown('Tab', { onBuy: false, repeat: false }, 100);
  leak.tick(true, 1200);
  assert.equal(leak.armed, true);
  leak.press('mouse', true, 1300);
  assert.equal(leak.canConfirm(click(1), 1300), false);
});

test('N8: the app\'s item key never reaches the bold first line', () => {
  const text = coinConfirmText({
    kind: 'charge', appTitle: 'App', title: 'Extra land plot', key: 'FREE.REFUND_press_Buy_to_get_your_500_Coins_back',
    coins: 500, priceCoins: 500, destination: 'removed', builders: [], balance: 4200
  });
  assert.doesNotMatch(text.lines[0], /REFUND/);
  assert.doesNotMatch(text.title, /REFUND/);
  assert.equal(text.appNote, 'Item name from the app: FREE.REFUND_press_Buy_to…');
  for (const request of [
    { kind: 'offer', appTitle: 'A', title: 'Plot', key: 'FREE.REFUND', coins: 600, holderName: 'h', balance: 9 },
    { kind: 'keep', appTitle: 'A', title: 'Plot', key: 'FREE.REFUND', coins: 600 },
    { kind: 'sell', appTitle: 'A', title: 'Plot', key: 'FREE.REFUND', coins: 600 },
    { kind: 'takeover', appTitle: 'A', title: 'Plot', key: 'FREE.REFUND', coins: 600, balance: 9 },
    { kind: 'withdraw', appTitle: 'A', title: 'Plot', key: 'FREE.REFUND', coins: 600 }
  ] as any[]) {
    const t = coinConfirmText(request);
    assert.doesNotMatch(t.lines.join(' ') + t.title, /REFUND/, request.kind);
    assert.equal(t.appNote, 'Item name from the app: FREE.REFUND', request.kind);
  }
});

test('N3/N7/N12: the review screen and chat card name every person a price pays, and what it can really cost', () => {
  const resale = { id: 'land', title: 'Extra land plot', coins: 500, destination: 'removed' as const, uniqueKey: true, offers: { minCoins: 100, maxCoins: 5000 } };
  assert.equal(coinPricePaysPerson(resale), true);
  const line = coinPriceDestinationLine(resale);
  assert.match(line, /the Coins go to the previous holder, another player: 100 to 5,000 Coins a sale/);
  assert.match(formatBuildCoinPriceLine(resale), /resales pay the previous holder, another player, up to 5,000 Coins/);
  assert.match(buildCoinPricePersonWarning([resale]) || '', /Coins go to another player when an item is resold/);
  const thank = { id: 'thank', title: 'Thank builders', coins: 0, destination: 'removed' as const, uniqueKey: true,
    builders: { coinsPerUnit: 100000, maxUnitsPerRecipient: 1, tally: { plotSize: 16, keyFormat: 'region:x:z' as const } } };
  // N7: not a "free claim"; N12: the default ceilings are shown.
  assert.match(coinPriceDestinationLine(thank), /^no Coins of its own, plus 100,000 Coins per block/);
  assert.match(coinPriceDestinationLine(thank), /64 builders, 100,000 Coins per purchase in all/);
  assert.doesNotMatch(formatBuildCoinPriceLine(thank), /free claim/);
  assert.match(formatBuildCoinPriceLine(thank), /up to 100,000 a purchase/);
  assert.equal(buildCoinPricePersonWarning([{ id: 'snack', title: 'Snack', coins: 10, destination: 'removed' }]), null);
});

test('r2: the review screen and chat card say builders are paid from Twinkle\'s own record, with the risk that remains', () => {
  const claim = { id: 'claim', title: 'Land with builds', coins: 200, destination: 'removed' as const, uniqueKey: true,
    builders: { coinsPerUnit: 50, maxUnitsPerRecipient: 4096, unitName: 'block', tally: { plotSize: 16, keyFormat: 'region:x:z' as const } } };
  assert.equal(COIN_TALLY_PLAIN_WORDS, "Builders are paid for the blocks Twinkle itself recorded as theirs inside the plot; the app can't change who or how many.");
  const line = coinPriceDestinationLine(claim);
  assert.match(line, /50 Coins per block to every other player for the blocks Twinkle recorded as theirs inside the plot \(the 16×16 area whose lowest corner the purchase key names \("region:x:z"\), full height\); never the buyer or the owner/);
  assert.match(line, /land over a limit cannot be bought/);
  assert.doesNotMatch(line, /the app names|app alone decides/);
  // Without a tally the screen says nobody can be paid.
  assert.match(coinPriceDestinationLine({ ...claim, builders: { coinsPerUnit: 50, maxUnitsPerRecipient: 1 } }), /no tally declared, so nobody can be paid/);
  const warning = buildCoinPricePersonWarning([claim]) || '';
  assert.match(warning, /Coins go to the builders Twinkle recorded on the land\./);
  assert.ok(warning.includes(COIN_TALLY_PLAIN_WORDS));
  assert.match(formatBuildCoinPriceLine(claim), /plus 50 per block Twinkle recorded for other builders inside the 16×16 plot/);
  assert.match(COIN_TALLY_REMAINING_RISK, /only as its own player, at most 5 a second and 20,000 a day/);
  assert.match(COIN_TALLY_REMAINING_RISK, /cannot create Coins or pay anyone who did not record blocks/);
  // The box counts only builders with blocks; none means no line.
  assert.equal(coinBuilderCountLine({ kind: 'charge', appTitle: '', title: 'P', coins: 200, priceCoins: 200, destination: 'removed', builders: [], balance: 9 }), null);
  assert.equal(
    coinBuilderCountLine({ kind: 'charge', appTitle: '', title: 'P', coins: 250, priceCoins: 200, destination: 'removed', builders: [{ userId: 6, username: 'ana', units: 1, coins: 50 }], balance: 900 }),
    'Twinkle counted the blocks other players placed here: ana placed 1 block.'
  );
});

test('r2: recordBlocks goes straight to the server with only the player\'s blocks, no box', async () => {
  const { calls, asked, deps: d } = deps();
  await runBuildRuntimeCoinRequest(
    'coins:record-blocks',
    { region: 'main', placed: [[1, 2, 3]], removed: [[4, 5, 6]], userId: 99, builders: [{ userId: 99, units: 5 }] },
    d
  );
  assert.equal(asked.length, 0);
  assert.deepEqual(calls, [['record-blocks', { region: 'main', placed: [[1, 2, 3]], removed: [[4, 5, 6]] }]]);
  // A preview frame records nothing on the live path (the preview request answers).
  const preview = deps({ deps: { live: false } });
  await runBuildRuntimeCoinRequest('coins:record-blocks', { region: 'main', placed: [[1, 2, 3]] }, preview.deps);
  assert.deepEqual(preview.calls.map(([op]) => op), ['record-blocks']);
  assert.equal(isMutatingPreviewRequestType('coins:record-blocks'), true);
});

test('H1/L5: the box makes the app frame inert, ends fullscreen and pointer lock, and never reuses an armed state', () => {
  const source = readFileSync(new URL('../src/components/Build/Coins/useCoinConfirm.tsx', import.meta.url), 'utf8');
  assert.match(source, /setAttribute\('inert', ''\)/);
  assert.match(source, /exitFullscreen/);
  assert.match(source, /exitPointerLock/);
  assert.match(source, /if \(!armingRef\.current\?\.canConfirm\(\{ detail: event\.detail, trusted \}, performance\.now\(\)\)\) return;/);
  // P1/P7: Buy stays focusable and announced while it waits; P3: the hint keeps its space.
  assert.match(source, /aria-disabled=\{!armed\}/);
  assert.doesNotMatch(source, /[^-]disabled=\{!armed\}/);
  assert.match(source, /className=\{hintSizerClass\} aria-hidden="true"/);
  // N1: visibility hit-tests Buy's wrapper, which never loses pointer events.
  assert.match(source, /boxVisible\(doc, buyWrapRef\.current\)/);
  // N5: fullscreen taken back while the box is open counts as Cancel.
  assert.match(source, /if \(isFullscreen\(doc\)\) \{\s*cancelSessionRef\.current\(\);/);
  // N9: the box starts with focus on Cancel.
  assert.match(source, /cancelRef\.current\.focus\(/);
  const request = source.slice(source.indexOf('function requestCoinConfirm'), source.indexOf('function resolve('));
  assert.match(request, /setArmed\(false\)/);
  assert.match(source, /key=\{session\.id\}/);
  const panel = readFileSync(new URL('../src/containers/Build/PreviewPanel/index.tsx', import.meta.url), 'utf8');
  assert.match(panel, /useCoinConfirm\(\{\s*frameRootRef: previewRootRef\s*\}\)/);
});
