import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createTradePreviewPage } from './fixtures/tradePreview.js';

const require = createRequire(import.meta.url);
const {
  chromium
} = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const artifacts = fileURLToPath(
  new URL('../../work/trade-interest-20261029/', import.meta.url)
);
const button = (root, name) => root.getByRole('button', { name, exact: true });
const dialog = (page) => page.getByRole('dialog').last();

test(
  'interest keeps the original nonbinding flow in the new cards and review, on every screen size',
  { timeout: 120000 },
  async () => {
    mkdirSync(artifacts, { recursive: true });
    const html = await createTradePreviewPage();
    writeFileSync(path.join(artifacts, 'preview.html'), html);
    let browser;
    try {
      browser = await chromium.launch();
      for (const [label, width, height] of [
        ['desktop', 1280, 1000],
        ['tablet', 768, 1000],
        ['mobile', 360, 800]
      ]) {
        const page = await browser.newPage({ viewport: { width, height } });
        page.setDefaultTimeout(6000);
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.route('**/*', (route) =>
          route.request().url().startsWith('http://localhost:3000')
            ? route.fulfill({ contentType: 'text/html', body: html })
            : route.abort()
        );
        await page.goto('http://localhost:3000/?view=messages');
        await button(page, 'Interest').click();
        let card = page.getByRole('article', {
          name: 'Interest shown',
          exact: true
        });
        await card.waitFor();
        await assertInterest(card);
        assert.match(
          await card.innerText(),
          /Nova showed interest in your items/
        );
        await page.screenshot({
          path: path.join(artifacts, `${label}-interest.png`),
          fullPage: true,
          animations: 'disabled'
        });

        await button(card, 'View interest').click();
        await button(dialog(page), 'Yes, I want to see them').waitFor();
        await assertInterest(dialog(page));
        assert.equal(await button(page, 'Review & accept').count(), 0);
        await button(dialog(page), 'Yes, I want to see them').click();
        assert.equal(
          await page
            .getByLabel('Coins you receive', { exact: true })
            .inputValue(),
          ''
        );
        assert.equal(await button(page, 'Review offer').isEnabled(), false);
        await page.getByLabel('Coins you receive', { exact: true }).fill('100');
        await button(page, 'Review offer').click();
        await dialog(page)
          .getByText('Review your offer', { exact: true })
          .waitFor();
        assert.match(
          await dialog(page)
            .getByRole('region', { name: 'You give', exact: true })
            .innerText(),
          /Moon Garden/
        );
        assert.match(
          await dialog(page)
            .getByRole('region', { name: 'You receive', exact: true })
            .innerText(),
          /100 coins/
        );
        assert.equal(
          await page.evaluate(
            () => window.accepts.length + window.posts.length
          ),
          0
        );
        await button(dialog(page), 'Send trade offer').click();
        await page.waitForFunction(() => window.posts.length === 1);
        const counteroffer = await page.evaluate(() => window.posts[0]);
        assert.equal(counteroffer.type, 'want');
        assert.equal(counteroffer.targetId, 2);
        assert.deepEqual(counteroffer.offered, {
          coins: 0,
          cardIds: [],
          groupIds: [],
          buildIds: [21]
        });
        assert.deepEqual(counteroffer.wanted, {
          coins: 100,
          cardIds: [],
          groupIds: [],
          buildIds: []
        });
        assert.equal(await page.evaluate(() => window.accepts.length), 0);

        await page.evaluate(() => window.openFixture('messages', 2));
        await assertInterest(
          page.getByRole('article', { name: 'Interest shown', exact: true })
        );
        assert.match(
          await page.getByRole('article').innerText(),
          /You showed interest in Orbit's items/
        );
        for (const [example, status] of [
          ['Declined interest', 'Interest declined'],
          ['Withdrawn interest', 'Interest withdrawn']
        ]) {
          await button(page, example).click();
          card = page.getByRole('article', { name: status, exact: true });
          await assertInterest(card);
          assert.equal(
            await card.getByRole('button', { name: /accept|offer/i }).count(),
            0
          );
        }
        await page.screenshot({
          path: path.join(artifacts, `${label}-closed-interest.png`),
          fullPage: true,
          animations: 'disabled'
        });

        // The sender's confirmation is also interest, not a request for a gift.
        await page.evaluate(() => {
          window.partnerApps = [{ ...window.app, userId: 2 }];
          window.openFixture('chat', 1);
        });
        await page
          .getByRole('region', { name: 'You receive', exact: true })
          .getByRole('button', { name: 'Apps', exact: true })
          .click();
        await button(dialog(page), 'Select Moon Garden').click();
        await button(dialog(page), 'Done (1)').click();
        assert.doesNotMatch(await dialog(page).innerText(), /App ownership/);
        await button(page, 'Review interest').click();
        await dialog(page)
          .getByText('Review your interest', { exact: true })
          .waitFor();
        await assertInterest(dialog(page));
        await page.screenshot({
          path: path.join(artifacts, `${label}-interest-review.png`),
          fullPage: true,
          animations: 'disabled'
        });
        await button(dialog(page), 'Express interest').click();
        await page.waitForFunction(() => window.posts.length === 2);
        const posted = await page.evaluate(() => window.posts[1]);
        assert.deepEqual(posted.offered, {
          coins: 0,
          cardIds: [],
          groupIds: [],
          buildIds: []
        });
        assert.deepEqual(posted.wanted.buildIds, [21]);
        assert.equal(await page.evaluate(() => window.accepts.length), 0);

        // Asking about coins must also leave a path to negotiate an exchange.
        await page.evaluate(() => {
          window.pending = {
            ...window.interest,
            want: { coins: 100, cardIds: [], groupIds: [], buildIds: [] }
          };
          window.openFixture('pending', 1);
        });
        await button(dialog(page), 'Yes, I want to see them').click();
        assert.equal(
          await page.getByLabel('Coins you give', { exact: true }).inputValue(),
          '100'
        );
        assert.equal(await button(page, 'Review offer').isEnabled(), false);
        assert.equal(await button(page, 'Review & accept').count(), 0);
        await button(dialog(page), 'Cancel').click();
        assert.deepEqual(errors, []);
        await page.close();
      }
    } finally {
      await browser?.close();
    }
  }
);

async function assertInterest(root) {
  await root
    .getByRole('heading', { name: 'Interested in', exact: true })
    .waitFor();
  const text = await root.innerText();
  assert.match(text, /Moon Garden/);
  assert.doesNotMatch(
    text,
    /You (?:would )?(?:give|receive)|ownership (?:transfers|did not transfer)|proposed a trade|App ownership/i
  );
  assert.equal(await root.locator('section[data-side]').count(), 1);
  assert.equal(
    await root.evaluate(
      (element) => element.scrollWidth > element.clientWidth + 1
    ),
    false
  );
}
