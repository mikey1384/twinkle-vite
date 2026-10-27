import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { sharedMediaFixture } from './chatSharedMedia.fixture.js';
const require = createRequire(import.meta.url);
const {
  chromium,
  webkit
} = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const artifacts = process.env.CHAT_MEDIA_ARTIFACTS;
let html;
async function prepare(browser, width = 1280) {
  const page = await browser.newPage({
    viewport: { width, height: width === 360 ? 800 : 900 },
    hasTouch: width === 360
  });
  page.setDefaultTimeout(6500);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/*', (route) =>
    route.request().url() === 'http://localhost:3000/'
      ? route.fulfill({ contentType: 'text/html', body: html })
      : route.abort()
  );
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => window.requestsLog?.length > 0);
  await page
    .getByRole('button', { name: 'View all shared photos and files' })
    .waitFor();
  return { page, errors };
}
const gallery = (page) =>
  page.getByRole('dialog', { name: 'Shared in this chat', exact: true });
const openGallery = async (page) => {
  await page
    .getByRole('button', { name: 'View all shared photos and files' })
    .click();
  await gallery(page)
    .getByRole('button', { name: /^Open / })
    .first()
    .waitFor();
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => {}))
    )
  );
};

test('a burst of uploads keeps every attachment reachable without closing the preview', { timeout: 30000 }, async () => {
  html ||= await sharedMediaFixture();
  const browser = await chromium.launch();
  try {
    const { page, errors } = await prepare(browser);
    await openGallery(page);
    await gallery(page).getByRole('button', { name: /^Open Mountain study/ }).first().click();
    await page.getByRole('button', { name: 'Show in chat', exact: true }).waitFor();
    await page.evaluate(() => {
      window.rows.unshift(...Array.from({ length: 26 }, (_, i) => ({
        ...window.rows[0], id: 126 - i, name: `Burst upload ${126 - i}.png`
      })));
      window.emit('new_message_received', { channelId: 11, message: { fileName: 'new.png', channelId: 11 } });
    });
    await gallery(page).getByRole('button', { name: /^Open Burst upload 126/ }).waitFor({ state: 'attached' });
    await page.getByRole('button', { name: 'Show in chat', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Close modal', exact: true }).last().click();
    while (await gallery(page).getByRole('button', { name: 'Load older', exact: true }).count()) {
      await gallery(page).getByRole('button', { name: 'Load older', exact: true }).click();
      await gallery(page).getByText('Loading attachments…', { exact: true }).waitFor({ state: 'hidden' });
    }
    assert.equal(await gallery(page).getByRole('button', { name: /^Open / }).count(), 59);
    assert.equal(await gallery(page).getByRole('button', { name: /^Open Burst upload 101/ }).count(), 1);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});

for (const [engineName, engine] of Object.entries({ chromium, webkit })) {
  test(
    `shared media layout, filters and message context (${engineName})`,
    { timeout: 60000 },
    async () => {
      html ||= await sharedMediaFixture();
      if (artifacts) {
        mkdirSync(artifacts, { recursive: true });
        writeFileSync(path.join(artifacts, 'preview.html'), html);
      }
      const browser = await engine.launch();
      try {
        for (const width of [360, 768, 1280, 1920]) {
          const { page, errors } = await prepare(browser, width);
          if (width >= 1024) {
            await page.waitForFunction(
              () =>
                document.querySelectorAll(
                  'section[aria-label="Shared in this chat"] .media-thumbs button, section[aria-label="Shared in this chat"] .media-file'
                ).length > 4
            );
            const layout = await page
              .locator('section[aria-label="Shared in this chat"]')
              .evaluate((panel) => {
                const body = panel
                  .querySelector('.media-preview')
                  .getBoundingClientRect();
                const footer = panel
                  .querySelector('.media-all')
                  .getBoundingClientRect();
                const rows = [
                  ...panel.querySelectorAll('.media-thumbs button, .media-file')
                ].map((el) => el.getBoundingClientRect());
                return {
                  bottom: Math.max(...rows.map((row) => row.bottom)),
                  bodyBottom: body.bottom,
                  footerTop: footer.top,
                  rowHeight: footer.height
                };
              });
            assert.ok(
              layout.bottom <= layout.bodyBottom + 1,
              'previews end on complete, unclipped rows'
            );
            assert.ok(
              layout.footerTop - layout.bottom < layout.rowHeight + 12,
              'previews fill the space above View all'
            );
          }
          await page
            .getByRole('textbox', { name: 'Message draft' })
            .fill('Keep my draft while I find the attachment');
          if (artifacts)
            await page.screenshot({
              animations: 'disabled',
              path: path.join(artifacts, `${engineName}-${width}-sidebar.png`)
            });
          await openGallery(page);
          const dialog = gallery(page);
          assert.equal(
            await dialog.getByRole('button', { name: /^Open / }).count(),
            24
          );
          const box = await dialog.boundingBox();
          assert.ok(
            box.x >= -1 && box.x + box.width <= width + 1,
            JSON.stringify(box)
          );
          assert.ok(
            box.y >= -1 &&
              box.y + box.height <= (width === 360 ? 800 : 900) + 1,
            JSON.stringify(box)
          );
          assert.equal(
            await dialog.evaluate((el) => el.scrollWidth > el.clientWidth + 1),
            false
          );
          if (artifacts)
            await page.screenshot({
              animations: 'disabled',
              path: path.join(artifacts, `${engineName}-${width}-gallery.png`)
            });
          await dialog
            .getByRole('button', { name: 'Load older', exact: true })
            .click();
          await page.waitForFunction(
            () => document.querySelectorAll('.media-card').length === 33
          );
          await dialog
            .getByRole('button', { name: 'Files', exact: true })
            .click();
          await dialog.locator('.media-file').first().waitFor();
          assert.equal(await dialog.locator('.media-file').count(), 10);
          if (artifacts && width === 360)
            await page.screenshot({
              animations: 'disabled',
              path: path.join(artifacts, `${engineName}-360-files.png`)
            });
          await dialog.getByRole('combobox').selectOption('22');
          await page.waitForFunction(
            () => window.requestsLog.at(-1)?.topicId === 22
          );
          await dialog
            .getByRole('button', { name: 'Photos & videos', exact: true })
            .click();
          await dialog.locator('.media-card').first().waitFor();
          await dialog.getByRole('combobox').selectOption('0');
          await dialog
            .getByRole('button', { name: /^Open Mountain study/ })
            .first()
            .click();
          await page
            .getByRole('button', { name: 'Show in chat', exact: true })
            .waitFor();
          await page
            .getByRole('button', { name: 'Show in chat', exact: true })
            .click();
          await page.locator('[data-history]').waitFor();
          assert.equal(
            await page.evaluate(() => window.currentTopic),
            23,
            'header and composer follow the attachment’s actual topic'
          );
          assert.equal(
            await page
              .getByRole('textbox', { name: 'Message draft' })
              .inputValue(),
            'Keep my draft while I find the attachment'
          );
          assert.equal(
            (await page.evaluate(() => window.historyRequests.at(-1))).topicId,
            23,
            'jump uses the attachment’s topic, not the currently selected topic'
          );
          await page.getByRole('button', { name: 'Older messages' }).click();
          assert.equal(
            (await page.evaluate(() => window.historyRequests.at(-1))).topicId,
            23,
            'history paging keeps the target topic'
          );
          await page.evaluate(() => window.emit('connect'));
          await page.waitForFunction(() => window.historyRequests.length >= 3);
          assert.equal(
            (await page.evaluate(() => window.historyRequests.at(-1))).topicId,
            23,
            'reconnect keeps the history topic'
          );
          await page.getByRole('button', { name: 'Back to latest' }).click();
          await page
            .getByRole('button', { name: 'Direct message', exact: true })
            .click();
          await openGallery(page);
          assert.equal(
            await gallery(page).getByRole('combobox').count(),
            0,
            'DM without topics still has shared media'
          );
          assert.deepEqual(errors, []);
          await page.close();
        }
      } finally {
        await browser.close();
      }
    }
  );
}

test(
  'deletion, stale reads, channel switches, empty history and retries',
  { timeout: 60000 },
  async () => {
    html ||= await sharedMediaFixture();
    const browser = await chromium.launch();
    try {
      const { page, errors } = await prepare(browser);
      await openGallery(page);
      await page.evaluate(() => {
        window.deferItem = true;
      });
      await gallery(page)
        .getByRole('button', { name: /^Open Mountain study/ })
        .first()
        .click();
      await page.waitForFunction(() => window.pendingItems.length === 1);
      await page.evaluate(() => {
        window.deleted.add(100);
        window.emit('hide_message_attachment', {
          channelId: 11,
          messageId: 100
        });
        window.pendingItems.shift()();
        window.deferItem = false;
      });
      await page.waitForFunction(() => window.requestsLog.length >= 2);
      assert.equal(
        await page
          .getByRole('button', { name: 'Show in chat', exact: true })
          .count(),
        0,
        'a late detail response must not resurrect a hidden attachment'
      );
      await gallery(page)
        .getByRole('button', { name: /^Open Weekend walk/ })
        .first()
        .click();
      await page
        .getByRole('button', { name: 'Show in chat', exact: true })
        .waitFor();
      const beforeNewUpload = await page.evaluate(
        () => window.requestsLog.length
      );
      await page.evaluate(() => {
        window.rows.unshift({
          ...window.rows[0],
          id: 101,
          name: 'New upload.png'
        });
        window.emit('new_message_received', {
          channelId: 11,
          message: { ...window.rows[0], fileName: 'new.png' }
        });
      });
      await page.waitForFunction(
        (count) => window.requestsLog.length > count,
        beforeNewUpload
      );
      const downloadEvent = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Download', exact: true }).click();
      const download = await downloadEvent;
      assert.equal(download.suggestedFilename(), 'Weekend walk.png');
      assert.equal(await page.evaluate(() => window.itemInput.download), true);
      await page
        .getByRole('button', { name: 'Show in chat', exact: true })
        .waitFor();
      await page.evaluate(() => {
        window.deleted.add(99);
        window.emit('chat_message_deleted', { channelId: 11, messageId: 99 });
      });
      await page
        .getByRole('button', { name: 'Show in chat', exact: true })
        .waitFor({ state: 'detached' });
      await page.evaluate(() => {
        window.deferLoads = true;
        window.emit('connect');
      });
      await page.waitForFunction(() => window.pendingReads.length > 0);
      await gallery(page)
        .getByRole('button', { name: 'Files', exact: true })
        .click();
      await page.waitForFunction(() => window.pendingReads.length > 1);
      await page.evaluate(() => {
        window.pendingReads.pop()();
        window.pendingReads.shift()();
        window.deferLoads = false;
      });
      await gallery(page).locator('.media-file').first().waitFor();
      assert.equal(
        await gallery(page)
          .getByRole('button', { name: /^Open Mountain/ })
          .count(),
        0,
        'late All response cannot replace Files results'
      );
      await page.evaluate(() => {
        window.failLoad = true;
        window.emit('connect');
      });
      await gallery(page).getByRole('alert').waitFor();
      await page.evaluate(() => {
        window.failLoad = false;
      });
      await gallery(page).getByRole('button', { name: 'Try again' }).click();
      await gallery(page).locator('.media-file').first().waitFor();
      await page.evaluate(() => {
        window.sparse = true;
        window.emit('connect');
      });
      await gallery(page)
        .getByRole('button', { name: 'Search older messages' })
        .click();
      await gallery(page).locator('.media-file').first().waitFor();
      await page.evaluate(() => {
        window.sparse = false;
        window.deferLoads = true;
        window.emit('connect');
      });
      await page.waitForFunction(() => window.pendingReads.length > 0);
      await page.evaluate(() => {
        window.changeChannel(12);
        window.pendingReads.shift()();
        window.deferLoads = false;
      });
      await page.getByRole('dialog').waitFor({ state: 'detached' });
      assert.deepEqual(errors, []);
      await page.close();
    } finally {
      await browser.close();
    }
  }
);
