import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { createTradePreviewPage } from './fixtures/tradePreview.js';

// Mikey 11-24: giving something on the Trade tab and asking for nothing back
// sends it as a gift straight away, without switching to the Gift tab. It
// must be exactly the gift the Gift tab sends, and only when nothing is asked.
const require = createRequire(import.meta.url);
const {
  chromium
} = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const dialog = (page) => page.getByRole('dialog').last();
const button = (root, name) => root.getByRole('button', { name, exact: true });
const giveSide = (page) =>
  page.getByRole('region', { name: 'You give', exact: true });

async function openNewOffer(page) {
  await page.evaluate(() => window.openFixture('chat'));
  await button(page, 'Trade Exchange with each other').waitFor();
}

async function giveBattery(page, percent) {
  await button(giveSide(page), 'Add battery').click();
  await dialog(page)
    .getByRole('button', { name: new RegExp(`^${percent}%`) })
    .click();
  await button(dialog(page), `Add ${percent}% battery`).click();
}

function withoutRequestId(post) {
  const { clientRequestId, ...rest } = post;
  assert.ok(clientRequestId);
  return rest;
}

test(
  'a Trade-tab offer that asks for nothing is sent as the same gift the Gift tab sends',
  { timeout: 120000 },
  async () => {
    const html = await createTradePreviewPage();
    let browser;
    try {
      browser = await chromium.launch();
      const page = await browser.newPage({
        viewport: { width: 1280, height: 1000 }
      });
      page.setDefaultTimeout(6000);
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.route('**/*', (route) =>
        route.request().url().startsWith('http://localhost:3002')
          ? route.fulfill({ contentType: 'text/html', body: html })
          : route.abort()
      );
      await page.goto('http://localhost:3002/?view=messages');

      // Trade tab, battery only: one press to a gift review.
      await openNewOffer(page);
      await giveBattery(page, 40);
      assert.equal(await button(page, 'Send as a gift').isEnabled(), true);
      await page.getByText('This will be a gift.').waitFor();
      assert.match(
        await page
          .getByRole('region', { name: 'You receive', exact: true })
          .innerText(),
        /Nothing in return/
      );
      await button(page, 'Send as a gift').click();
      await dialog(page)
        .getByText('Review your gift', { exact: true })
        .waitFor();
      assert.match(
        await dialog(page).innerText(),
        /goes to Nova immediately\. Nothing in return\./
      );
      await button(dialog(page), 'Give gift to Nova').click();
      await page.waitForFunction(() => window.posts.length === 1);
      const fromTrade = await page.evaluate(() => window.posts[0]);
      assert.equal(fromTrade.type, 'send');
      assert.deepEqual(fromTrade.offered, {
        coins: 0,
        battery: 480000,
        cardIds: [],
        groupIds: [],
        buildIds: []
      });

      // The explicit Gift tab still works and sends the identical request.
      await openNewOffer(page);
      await button(page, 'Give a gift Nothing in return').click();
      await giveBattery(page, 40);
      await button(page, 'Review gift').click();
      await button(dialog(page), 'Give gift to Nova').click();
      await page.waitForFunction(() => window.posts.length === 2);
      const fromGiftTab = await page.evaluate(() => window.posts[1]);
      assert.deepEqual(
        withoutRequestId(fromTrade),
        withoutRequestId(fromGiftTab)
      );

      // Asking for anything keeps it a trade offer.
      await openNewOffer(page);
      await giveBattery(page, 40);
      await page.getByLabel('Coins you receive', { exact: true }).fill('100');
      assert.equal(await button(page, 'Send as a gift').count(), 0);
      assert.equal(await page.getByText('This will be a gift.').count(), 0);
      await button(page, 'Review offer').click();
      await button(dialog(page), 'Send trade offer').click();
      await page.waitForFunction(() => window.posts.length === 3);
      assert.equal(await page.evaluate(() => window.posts[2].type), 'want');

      // Coins asked for but netted away are still an ask: never a gift.
      await openNewOffer(page);
      await page.getByLabel('Coins you give', { exact: true }).fill('150');
      await page.getByLabel('Coins you receive', { exact: true }).fill('100');
      assert.equal(await button(page, 'Send as a gift').count(), 0);
      assert.equal(await button(page, 'Review offer').isEnabled(), false);
      // Clearing the ask turns it into a gift of the full amount.
      await page.getByLabel('Coins you receive', { exact: true }).fill('');
      await button(page, 'Send as a gift').click();
      await button(dialog(page), 'Give gift to Nova').click();
      await page.waitForFunction(() => window.posts.length === 4);
      const coinGift = await page.evaluate(() => window.posts[3]);
      assert.equal(coinGift.type, 'send');
      assert.equal(coinGift.offered.coins, 150);
      assert.deepEqual(coinGift.wanted, {
        coins: 0,
        cardIds: [],
        groupIds: [],
        buildIds: []
      });

      // "Sell or trade" on an app prefills the give side: it waits for a
      // price instead of offering to give the app away.
      await page.evaluate(() => window.openFixture('app'));
      await button(page, 'Sell or trade').click();
      await page.getByPlaceholder('Search by username').fill('Nova');
      await page.getByText('Nova', { exact: true }).click();
      await button(page, 'Continue').click();
      await button(page, 'Review offer').waitFor();
      assert.equal(await button(page, 'Review offer').isEnabled(), false);
      assert.equal(await button(page, 'Send as a gift').count(), 0);
      assert.equal(await page.getByText('This will be a gift.').count(), 0);

      // Nothing on either side: nothing to send.
      await openNewOffer(page);
      assert.equal(await button(page, 'Send as a gift').count(), 0);
      assert.equal(await button(page, 'Review interest').isEnabled(), false);
      assert.deepEqual(errors, []);
    } finally {
      await browser?.close();
    }
  }
);
