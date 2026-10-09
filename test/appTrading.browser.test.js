import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createTradePreviewPage } from './fixtures/tradePreview.js';

const require = createRequire(import.meta.url);
const {
  chromium
} = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const artifacts = fileURLToPath(
  new URL('../../work/trade-interface/', import.meta.url)
);
const dialog = (page) => page.getByRole('dialog').last();
const button = (root, name) => root.getByRole('button', { name, exact: true });

async function screenshot(page, name) {
  await page.screenshot({
    path: path.join(artifacts, `${name}.png`),
    fullPage: true,
    animations: 'disabled'
  });
}

async function assertPanelsFit(root, stacked) {
  const give = await root.locator('section[data-side="give"]').boundingBox();
  const receive = await root
    .locator('section[data-side="receive"]')
    .boundingBox();
  assert.ok(
    give.width > 250 && receive.width > 250,
    'Offer panels must not collapse into narrow columns'
  );
  if (stacked)
    assert.ok(
      receive.y >= give.y + give.height,
      'Mobile keeps give before receive'
    );
  else
    assert.ok(
      receive.x >= give.x + give.width,
      'Desktop shows both sides together'
    );
  assert.equal(
    await root.evaluate(
      (element) => element.scrollWidth > element.clientWidth + 1
    ),
    false
  );
}

test(
  'trade review, exact amounts, gifts, changed offers and chat receipts on desktop and mobile',
  { timeout: 120000 },
  async () => {
    mkdirSync(artifacts, { recursive: true });
    const html = await createTradePreviewPage();
    let browser;
    try {
      browser = await chromium.launch();
      for (const [label, width, height] of [
        ['desktop', 1280, 1000],
        ['mobile', 390, 844]
      ]) {
        const page = await browser.newPage({ viewport: { width, height } });
        page.setDefaultTimeout(6000);
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.route('**/*', (route) =>
          route.request().url().startsWith('http://localhost:3001')
            ? route.fulfill({ contentType: 'text/html', body: html })
            : route.abort()
        );
        await page.goto('http://localhost:3001');
        await button(page, 'Review & accept').waitFor();
        const mobile = label === 'mobile';
        await assertPanelsFit(dialog(page), mobile);
        assert.match(
          await dialog(page)
            .getByRole('region', { name: 'You give', exact: true })
            .innerText(),
          /1,500 coins.*1 group.*1 app/s
        );
        assert.match(
          await dialog(page)
            .getByRole('region', { name: 'You receive', exact: true })
            .innerText(),
          /Aurora Phoenix/
        );
        await screenshot(page, `${label}-offer`);
        await button(page, 'Review & accept').click();
        await button(dialog(page), 'Accept trade').waitFor();
        assert.equal(
          await dialog(page).getByRole('checkbox').count(),
          0,
          'Clarity does not add an acknowledgment checkbox'
        );
        assert.equal(
          await button(dialog(page), 'Accept trade').isEnabled(),
          true
        );
        await assertPanelsFit(dialog(page), mobile);
        await screenshot(page, `${label}-review`);
        // Inspecting an item must not dismiss the reviewed agreement.
        await button(dialog(page), 'Inspect card').click();
        await page.getByText('Preview card #41 · Aurora Phoenix').waitFor();
        await button(dialog(page), 'Close modal').click();
        await button(dialog(page), 'Accept trade').click();
        await page.waitForFunction(
          () => window.accepts.length === 1 && window.coinUpdates.length > 0
        );
        assert.deepEqual(await page.evaluate(() => window.accepts[0]), {
          channelId: 20,
          transactionId: 71,
          reviewedBuildIds: [21]
        });
        assert.equal(
          await page.evaluate(
            () => window.coinUpdates[0].newState.twinkleCoins
          ),
          3500
        );
        assert.ok(
          (await page.evaluate(() => window.handoffs)).some(
            (event) => event.buildId === 21
          )
        );

        // Counteroffers preserve viewer orientation and the complete mixed bundle.
        await page.evaluate(() => window.openFixture('pending'));
        await button(page, 'Counteroffer').click();
        assert.equal(
          await page.getByLabel('Coins you give', { exact: true }).inputValue(),
          '1500'
        );
        assert.equal(
          await page
            .getByLabel('Coins you receive', { exact: true })
            .inputValue(),
          ''
        );
        const outgoing = page.getByLabel('Coins you give', { exact: true });
        for (const invalid of ['1.5', '-20', '1e3', '1,50', '5001']) {
          await outgoing.fill(invalid);
          assert.equal(
            await outgoing.inputValue(),
            invalid,
            'Never silently change the entered amount'
          );
          assert.equal(await button(page, 'Review offer').isEnabled(), false);
          assert.ok(await page.getByRole('alert').count());
        }
        await outgoing.fill('2,000');
        await page.getByLabel('Coins you receive', { exact: true }).fill('500');
        await page
          .getByText(
            'Coins are entered on both sides. Only the difference moves: you give 1,500 coins.',
            { exact: true }
          )
          .waitFor();
        await screenshot(page, `${label}-composer`);
        await button(page, 'Review offer').click();
        assert.match(
          await dialog(page)
            .getByRole('region', { name: 'You give', exact: true })
            .innerText(),
          /1,500 coins/
        );
        await button(dialog(page), 'Send trade offer').click();
        await page.waitForFunction(() => window.posts.length === 1);
        const counter = await page.evaluate(() => window.posts[0]);
        assert.deepEqual(counter.offered, {
          coins: 1500,
          cardIds: [],
          groupIds: [90],
          buildIds: [21]
        });
        assert.deepEqual(counter.wanted, {
          coins: 0,
          cardIds: [41],
          groupIds: [],
          buildIds: []
        });

        // Switching to a gift discards hidden wanted items; failed sends do not invent balances.
        await page.evaluate(() => window.openFixture('pending'));
        await button(page, 'Counteroffer').click();
        await button(page, 'Give a gift Nothing in return').click();
        await button(page, 'Review gift').click();
        const receive = dialog(page).getByRole('region', {
          name: 'You receive',
          exact: true
        });
        assert.match(await receive.innerText(), /Nothing/);
        assert.doesNotMatch(await receive.innerText(), /Aurora Phoenix/);
        await screenshot(page, `${label}-gift-review`);
        const before = await page.evaluate(() => {
          window.failNext = true;
          return window.coinUpdates.length;
        });
        await button(dialog(page), 'Give gift to Nova').click();
        await dialog(page).getByRole('alert').waitFor();
        assert.equal(
          await page.evaluate(() => window.coinUpdates.length),
          before
        );
        await button(dialog(page), 'Give gift to Nova').click();
        await page.waitForFunction(() => window.posts.length === 3);
        const giftPosts = await page.evaluate(() => window.posts.slice(1));
        assert.equal(giftPosts[0].type, 'send');
        assert.deepEqual(giftPosts[0].wanted, {
          coins: 0,
          cardIds: [],
          groupIds: [],
          buildIds: []
        });
        assert.equal(
          giftPosts[0].clientRequestId,
          giftPosts[1].clientRequestId
        );

        // The app-page handoff and chat inventory picker both use the same review.
        await page.evaluate(() => window.openFixture('app'));
        await button(page, 'Give as a gift').click();
        await page.getByPlaceholder('Search by username').fill('Nova');
        await page.getByText('Nova', { exact: true }).click();
        await screenshot(page, `${label}-app-entry`);
        await button(page, 'Continue').click();
        await button(page, 'Review gift').click();
        await button(dialog(page), 'Give gift to Nova').click();
        await page.waitForFunction(() => window.posts.length === 4);
        await page.evaluate(() => window.openFixture('chat'));
        await page
          .getByRole('region', { name: 'You give', exact: true })
          .getByRole('button', { name: 'Apps', exact: true })
          .click();
        await button(page, 'Select Moon Garden').click();
        await button(page, 'Done (1)').click();
        await button(page, 'Show items You keep everything').click();
        await button(page, 'Review showcase').click();
        assert.equal(
          await dialog(page)
            .getByRole('region', { name: 'You receive', exact: true })
            .count(),
          0
        );
        assert.equal(
          await dialog(page)
            .getByText(/ownership transfers/)
            .count(),
          0
        );
        await button(dialog(page), 'Share showcase').click();
        await page.waitForFunction(() => window.posts.length === 5);
        assert.equal(
          await page.evaluate(() => window.posts.at(-1).type),
          'offer'
        );

        // A changed or withdrawn offer cannot be accepted using an earlier review.
        await page.evaluate(() => window.openFixture('pending'));
        await button(page, 'Review & accept').click();
        await button(dialog(page), 'Accept trade').waitFor();
        await page.evaluate(() => {
          window.pending = {
            ...window.pending,
            id: 81,
            want: { ...window.pending.want, coins: 1800 }
          };
        });
        await button(dialog(page), 'Accept trade').click();
        await page
          .getByRole('alert')
          .filter({ hasText: /changed or was withdrawn/ })
          .waitFor();
        assert.equal(await page.evaluate(() => window.accepts.length), 1);
        assert.match(await dialog(page).innerText(), /1,800 coins/);
        await button(page, 'Review & accept').click();
        await button(dialog(page), 'Accept trade').waitFor();
        await page.evaluate(() => {
          window.pending = null;
        });
        await button(dialog(page), 'Accept trade').click();
        await page
          .getByRole('alert')
          .filter({ hasText: /changed or was withdrawn/ })
          .waitFor();
        assert.equal(await page.evaluate(() => window.accepts.length), 1);

        // Actual TransactionDetails chat component, including final server statuses.
        await page.evaluate(() => window.openFixture('messages'));
        const chat = page.getByRole('region', {
          name: 'Chat message preview',
          exact: true
        });
        const completed = chat.getByRole('article', {
          name: 'Trade completed',
          exact: true
        });
        await completed.waitFor();
        assert.equal(
          await completed
            .getByRole('heading', { name: 'You gave', exact: true })
            .count(),
          1
        );
        assert.equal(
          await completed
            .getByRole('heading', { name: 'You received', exact: true })
            .count(),
          1
        );
        await assertPanelsFit(completed, mobile);
        await screenshot(page, `${label}-chat-completed`);
        await button(chat, 'Pending offer').click();
        await button(chat, 'Review offer').waitFor();
        await screenshot(page, `${label}-chat-pending`);
        await button(chat, 'Review offer').click();
        // Preview pending was deliberately withdrawn above; reset just the example for subsequent states.
        await page.evaluate(() => window.openFixture('messages'));
        await button(chat, 'Gift sent').click();
        await chat
          .getByRole('article', { name: 'Gift sent', exact: true })
          .waitFor();
        assert.match(
          await chat
            .getByRole('region', { name: 'You received', exact: true })
            .innerText(),
          /Nothing/
        );
        await screenshot(page, `${label}-chat-gift`);
        await button(chat, 'Gift received').click();
        await chat
          .getByRole('article', { name: 'Gift received', exact: true })
          .waitFor();
        assert.match(
          await chat
            .getByRole('region', { name: 'You received', exact: true })
            .innerText(),
          /Moon Garden/
        );
        await button(chat, 'View gift').click();
        await button(page, 'Got it').click();
        await button(page, 'Review request').waitFor();
        await page.evaluate(() => window.openFixture('messages'));
        for (const state of ['Withdrawn', 'Declined']) {
          await button(chat, state).click();
          await chat.getByText('Nothing moved.', { exact: true }).waitFor();
          assert.equal(await button(chat, 'Review offer').count(), 0);
          await screenshot(page, `${label}-chat-${state.toLowerCase()}`);
        }
        await button(chat, 'Showcase').click();
        await chat.getByRole('heading', { name: 'Shown items' }).waitFor();
        assert.equal(await chat.getByText(/ownership transfers/).count(), 0);
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth
          ),
          false
        );
        assert.deepEqual(errors, []);
        await page.close();
      }
    } finally {
      await browser?.close();
    }
  }
);

test(
  'trade picker layout audit: full inventories, selected items, long names, pagination and small screens',
  { timeout: 120000 },
  async () => {
    mkdirSync(artifacts, { recursive: true });
    const html = await createTradePreviewPage();
    let browser;
    try {
      browser = await chromium.launch();
      for (const [label, width, height] of [
        ['desktop', 1280, 900],
        ['tablet', 768, 900],
        ['mobile', 390, 844],
        ['small-mobile', 320, 700]
      ]) {
        const page = await browser.newPage({ viewport: { width, height } });
        page.setDefaultTimeout(7000);
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.route('**/*', (route) =>
          route.request().url().startsWith('http://localhost:3001')
            ? route.fulfill({ contentType: 'text/html', body: html })
            : route.abort()
        );
        await page.goto('http://localhost:3001/?view=apps');
        const modal = dialog(page);
        await button(modal, 'Select Moon Garden').waitFor();
        await checkBounds('Done');
        const rows = modal.locator('[data-selected]');
        assert.equal(await rows.count(), 5);
        for (const row of await rows.all()) {
          const box = await row.boundingBox();
          const control = await row.getByRole('button').boundingBox();
          assert.ok(
            control.x > box.x + box.width / 2,
            'Selection control stays on the trailing edge of its app row'
          );
          assert.ok(
            Math.abs(control.y + control.height / 2 - box.y - box.height / 2) <
              2,
            'App control and details share a vertical center'
          );
          assert.ok(
            control.width < box.width * 0.4,
            'Selection does not become a detached headline-sized button'
          );
          assert.equal(
            await row.evaluate(
              (element) => element.scrollWidth > element.clientWidth + 1
            ),
            false
          );
        }
        await screenshot(page, `${label}-picker-apps`);
        await button(modal, 'Select Moon Garden').click();
        assert.equal(
          await rows.count(),
          5,
          'Selecting does not insert a duplicate list above the results'
        );
        await button(modal, 'Load More').scrollIntoViewIfNeeded();
        const moreBox = await button(modal, 'Load More').boundingBox();
        const modalBox = await modal.boundingBox();
        const lastRow = await rows.last().boundingBox();
        assert.ok(
          Math.abs(
            moreBox.x + moreBox.width / 2 - modalBox.x - modalBox.width / 2
          ) < 2,
          'Pagination is centered'
        );
        assert.ok(
          moreBox.y - lastRow.y - lastRow.height >= 12,
          'Pagination has breathing room after the final row'
        );
        await screenshot(page, `${label}-picker-pagination`);
        await button(modal, 'Load More').click();
        await button(modal, 'Select Private Studio').waitFor();
        await page.getByPlaceholder('Search apps').fill('Private Studio');
        await page.waitForFunction(
          () => document.querySelectorAll('[data-selected]').length === 1
        );
        await button(modal, 'Select Private Studio').click();
        await modal
          .getByRole('tab', { name: 'Selected (2)', exact: true })
          .click();
        assert.equal(await rows.count(), 2);
        await checkBounds('Done (2)');
        await screenshot(page, `${label}-picker-selected-apps`);
        await button(modal, 'Done (2)').click();
        assert.deepEqual(
          await page.evaluate(() => window.selectedApps.map((app) => app.id)),
          [21, 14]
        );

        await page.evaluate(() => window.openFixture('groups'));
        await button(modal, 'Select Stargazers Guild').waitFor();
        await checkBounds('Done');
        await screenshot(page, `${label}-picker-groups`);
        await button(modal, 'Select Stargazers Guild').click();
        await button(modal, 'Load More').click();
        await button(modal, 'Select Game Studio').click();
        await page.getByPlaceholder('Search Groups...').fill('Weekend');
        await button(modal, 'Select Weekend Adventures').click();
        await modal
          .locator('nav')
          .filter({ hasText: /^Selected/ })
          .click();
        await button(modal, 'Remove Weekend Adventures').waitFor();
        assert.equal(
          await modal.getByRole('button', { name: /^Remove / }).count(),
          3,
          'Selected groups include searched and paginated items'
        );
        await screenshot(page, `${label}-picker-selected-groups`);
        await button(modal, 'Done (3)').click();
        assert.deepEqual(
          await page.evaluate(() => window.selectedGroups),
          [90, 85, 84]
        );

        await page.evaluate(() => window.openFixture('cards'));
        await button(modal, 'Select card #59').waitFor();
        await checkBounds('Done');
        await button(modal, 'Select card #59').scrollIntoViewIfNeeded();
        assert.ok(
          (await button(modal, 'Select card #59').boundingBox()).height >= 39,
          'Card selection remains easy to tap on small screens'
        );
        await screenshot(page, `${label}-picker-cards`);
        await button(modal, 'Select card #59').click();
        await button(modal, 'Load More').click();
        await button(modal, 'Select card #42').click();
        await modal
          .locator('nav')
          .filter({ hasText: /^Selected/ })
          .click();
        await button(modal, 'Remove card #42').waitFor();
        const cards = modal.getByRole('button', { name: /^Remove card/ });
        assert.equal(await cards.count(), 2);
        await checkBounds('Done');
        await screenshot(page, `${label}-picker-selected-cards`);
        await button(modal, 'Done').click();
        assert.deepEqual(
          await page.evaluate(() => window.selectedCards),
          [59, 42]
        );
        assert.deepEqual(errors, []);
        await page.close();

        async function checkBounds(doneLabel) {
          await modal.evaluate((element) =>
            Promise.all(
              element
                .getAnimations({ subtree: true })
                .filter(
                  (animation) =>
                    animation.effect?.getTiming().iterations !== Infinity
                )
                .map((animation) => animation.finished.catch(() => {}))
            )
          );
          const rootBox = await modal.boundingBox();
          const done = await button(modal, doneLabel).boundingBox();
          assert.ok(
            rootBox.x >= -1 &&
              rootBox.y >= -1 &&
              rootBox.x + rootBox.width <= width + 1 &&
              rootBox.y + rootBox.height <= height + 1,
            'Dialog stays inside the viewport'
          );
          assert.ok(
            done.y + done.height <= height && done.height >= 43,
            'Footer remains visible with the standard touch target'
          );
          assert.equal(
            await modal.evaluate(
              (element) => element.scrollWidth > element.clientWidth + 1
            ),
            false,
            'No horizontal overflow'
          );
        }
      }
    } finally {
      await browser?.close();
    }
  }
);
