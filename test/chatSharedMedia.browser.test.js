import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { sharedMediaFixture } from './chatSharedMedia.fixture.js';
const require = createRequire(import.meta.url);
const {
  chromium,
  webkit
} = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const artifacts = process.env.CHAT_MEDIA_ARTIFACTS;
let html;
async function prepare(browser, width = 1280, options = {}) {
  const page = await browser.newPage({
    viewport: { width, height: width === 360 ? 800 : 900 },
    hasTouch: width === 360,
    ...options
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

test('foreground events retain shared media and do not duplicate fresh requests', { timeout: 30000 }, async () => {
  html ||= await sharedMediaFixture();
  const browser = await chromium.launch();
  try {
    const { page, errors } = await prepare(browser);
    await openGallery(page);
    await gallery(page).getByRole('button', { name: /^Open Mountain study/ }).first().click();
    const preview = page.getByRole('button', { name: 'Show in chat', exact: true });
    await preview.waitFor();
    const before = await page.evaluate(() => window.requestsLog.length);
    await page.evaluate(() => {
      window.emit('new_message_received', {
        channelId: 11,
        message: { id: 500, channelId: 11, userId: 1, content: 'A plain chat message' }
      });
    });
    await page.waitForTimeout(250);
    assert.equal(await page.evaluate(() => window.requestsLog.length), before, 'posting a plain message must not reload attachments');
    await page.evaluate(() => {
      window.deferLoads = true;
      window.dispatchEvent(new Event('focus'));
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(250);
    assert.equal(await page.evaluate(() => window.requestsLog.length), before, 'foregrounding a fresh list must not reload it');
    assert.equal(await preview.isVisible(), true, 'returning to Chrome must not close the attachment being viewed');
    assert.ok(await gallery(page).getByRole('button', { name: /^Open / }).count() > 0, 'loaded cards must stay mounted');
    assert.deepEqual(errors, []);
    await page.close();
  } finally {
    await browser.close();
  }
});

test('a confirmed empty chat stays settled during a background head check', { timeout: 30000 }, async () => {
  html ||= await sharedMediaFixture();
  const browser = await chromium.launch();
  try {
    const { page, errors } = await prepare(browser);
    await page.evaluate(() => {
      window.rows = [];
      window.emit('connect');
    });
    const panel = page.getByRole('region', { name: 'Shared in this chat' });
    await panel.getByRole('button', { name: 'Photos & files', exact: true }).waitFor();
    await page.clock.setFixedTime(new Date(Date.now() + 120_000));
    await page.evaluate(() => {
      window.deferLoads = true;
      window.dispatchEvent(new Event('focus'));
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForFunction(() => window.pendingReads.length === 1);
    assert.equal(await panel.getByText('Loading…', { exact: true }).count(), 0);
    assert.equal(await panel.getByRole('button', { name: 'Photos & files', exact: true }).isVisible(), true);
    assert.deepEqual(errors, []);
    await page.close();
  } finally {
    await browser.close();
  }
});

test('global Chat state retains shared media pages across a sidebar remount', { timeout: 30000 }, async () => {
  html ||= await sharedMediaFixture();
  const browser = await chromium.launch();
  try {
    const { page, errors } = await prepare(browser);
    await openGallery(page);
    const more = gallery(page).getByRole('button', { name: 'Load older' });
    if (await more.count()) await more.click();
    await page.waitForFunction(() => window.requestsLog.some(input => input.beforeId));
    await gallery(page).getByText('Loading attachments…', { exact: true }).waitFor({ state: 'hidden' });
    const count = await gallery(page).getByRole('button', { name: /^Open / }).count();
    const before = await page.evaluate(() => window.requestsLog.length);
    await page.evaluate(() => {
      window.deferLoads = true;
      window.remountMedia();
    });
    await gallery(page).waitFor({ state: 'detached' });
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => window.requestsLog.length), before, 'a new sidebar instance should reuse the global page');
    await openGallery(page);
    assert.equal(await gallery(page).getByRole('button', { name: /^Open / }).count(), count, 'already loaded older pages must survive');
    assert.deepEqual(errors, []);
    await page.close();
  } finally {
    await browser.close();
  }
});

for (const [engineName, engine] of Object.entries({ chromium, webkit })) {
  test(`stale foreground checks keep pages visible and reconcile removals (${engineName})`, { timeout: 30000 }, async () => {
    html ||= await sharedMediaFixture();
    const browser = await engine.launch();
    try {
      const { page, errors } = await prepare(browser, engineName === 'webkit' ? 360 : 1280);
      await openGallery(page);
      await gallery(page).getByRole('button', { name: 'Load older' }).click();
      await page.waitForFunction(() => window.requestsLog.some(input => input.beforeId));
      await gallery(page).getByText('Loading attachments…', { exact: true }).waitFor({ state: 'hidden' });
      assert.equal(await gallery(page).getByRole('button', { name: /^Open / }).count(), 33);
      await gallery(page).getByRole('button', { name: /^Open Mountain study/ }).first().click();
      const previewAction = page.getByRole('button', { name: 'Show in chat', exact: true });
      await previewAction.waitFor();
      const before = await page.evaluate(() => window.requestsLog.length);
      await page.clock.setFixedTime(new Date(Date.now() + 120_000));
      await page.evaluate(() => {
        window.deferLoads = true;
        window.dispatchEvent(new Event('focus'));
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await page.waitForFunction(() => window.pendingReads.length === 1);
      assert.equal(await page.evaluate(() => window.requestsLog.length), before + 1, 'paired events share one refresh');
      assert.equal(await gallery(page).getByRole('button', { name: /^Open / }).count(), 33, 'pending check retains all loaded pages');
      assert.equal(await previewAction.isVisible(), true, 'pending check keeps the open preview');
      await page.evaluate(() => {
        window.pendingReads.shift()();
        window.deferLoads = false;
      });
      await gallery(page).getByText('Loading attachments…', { exact: true }).waitFor({ state: 'hidden' });
      assert.equal(await gallery(page).getByRole('button', { name: /^Open / }).count(), 33, 'head refresh preserves validated older pages');
      assert.equal(await previewAction.isVisible(), true);
      if (artifacts) {
        mkdirSync(artifacts, { recursive: true });
        await page.screenshot({ path: path.join(artifacts, `foreground-preview-${engineName}.png`), animations: 'disabled' });
      }

      await page.clock.setFixedTime(new Date(Date.now() + 240_000));
      await page.evaluate(() => {
        window.deleted.add(100);
        window.dispatchEvent(new Event('focus'));
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await previewAction.waitFor({ state: 'detached' });
      assert.equal(await gallery(page).getByRole('button', { name: /^Open / }).count(), 32, 'canonical head removes a deleted record without losing older pages');
      assert.deepEqual(errors, []);
      await page.close();
    } finally {
      await browser.close();
    }
  });
}

test('inactive caches receive uploads and deletions and never cross accounts', { timeout: 30000 }, async () => {
  html ||= await sharedMediaFixture();
  const browser = await chromium.launch();
  try {
    const { page, errors } = await prepare(browser);
    await openGallery(page);
    await page.evaluate(() => window.changeChannel(12));
    await gallery(page).waitFor({ state: 'detached' });
    await page.evaluate(() => {
      window.deleted.add(100);
      window.emit('message_attachment_hid', { channelId: 11, messageId: 100 });
      window.changeChannel(11);
    });
    await openGallery(page);
    assert.equal(await gallery(page).getByRole('button', { name: /^Open / }).count(), 23);
    await gallery(page).getByRole('button', { name: /^Open Mountain study/ }).first().click();
    await page.getByRole('button', { name: 'Show in chat', exact: true }).waitFor();
    assert.equal(await page.evaluate(() => window.itemInput.messageId), 94, 'the deleted first Mountain attachment must not return from an inactive cache');
    await page.getByRole('button', { name: 'Close modal', exact: true }).last().click();
    await page.evaluate(() => window.changeChannel(12));
    await gallery(page).waitFor({ state: 'detached' });
    await page.evaluate(() => {
      window.rows.unshift({ ...window.rows[0], id: 101, name: 'Inactive upload.png' });
      window.emit('new_message_received', { channelId: 11, message: { fileName: 'new.png' } });
      window.changeChannel(11);
    });
    await openGallery(page);
    await gallery(page).getByRole('button', { name: /^Open Inactive upload/ }).waitFor();

    // A different account must fetch its own canonical page, even if the
    // channel/filter happen to match and the prior account's cache is fresh.
    await page.evaluate(() => { window.deferLoads = true; window.changeUser(2); });
    await page.waitForFunction(() => window.pendingReads.length === 1);
    assert.equal(await page.getByRole('button', { name: /^Open Inactive upload/ }).count(), 0);
    await page.evaluate(() => { window.pendingReads.shift()(); window.deferLoads = false; });
    await openGallery(page);
    await gallery(page).getByRole('button', { name: /^Open Inactive upload/ }).waitFor();
    assert.deepEqual(errors, []);
    await page.close();
  } finally {
    await browser.close();
  }
});

// Three seconds of silence, generated locally. No network or microphone access.
function audioFixture() {
  const samples = 8000 * 3;
  const wav = Buffer.alloc(44 + samples * 2);
  wav.write('RIFF');
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(8000, 24);
  wav.writeUInt32LE(16000, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(samples * 2, 40);
  return wav;
}

for (const [engineName, engine] of Object.entries({ chromium, webkit })) {
  test(`shared attachment playback and fallbacks (${engineName})`, { timeout: 60000 }, async () => {
    html ||= await sharedMediaFixture();
    const browser = await engine.launch();
    try {
      for (const width of [1280, 360]) {
        const { page, errors } = await prepare(browser, width, width === 360 ? {
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'
        } : {});
        await page.route('**/test-video.mp4', route => route.fulfill({
          contentType: 'video/mp4',
          body: readFileSync(new URL('./fixtures/chatSharedMedia.mp4', import.meta.url))
        }));
        await page.route('**/test-audio.wav', route => route.fulfill({
          contentType: 'audio/wav', body: audioFixture()
        }));
        await page.evaluate(() => {
          window.rows.find(row => row.id === 96).url = 'http://localhost:3000/test-video.mp4';
          Object.assign(window.rows.find(row => row.id === 97), {
            fileType: 'audio', url: 'http://localhost:3000/test-audio.wav'
          });
        });
        await openGallery(page);
        await gallery(page).getByRole('button', { name: /^Open First animation/ }).first().click();
        const preview = page.getByRole('dialog', { name: 'First animation.mp4', exact: true });
        await preview.locator('video').waitFor();
        await page.waitForFunction(() => document.querySelector('video')?.readyState >= 1);
        const media = preview.locator('video');
        assert.equal(await media.evaluate(el => el.paused), true, 'opening a preview must not autoplay');
        assert.equal(await media.getAttribute('preload'), 'metadata');
        if (width === 1280) {
          await preview.getByRole('button', { name: 'Play', exact: true }).click();
          await page.waitForFunction(() => document.querySelector('video').currentTime > 0.1);
          await preview.getByRole('button', { name: 'Pause', exact: true }).click();
          assert.equal(await media.evaluate(el => el.paused), true);
        } else {
          assert.equal(await media.evaluate(el => el.controls), true, 'phone keeps native playback controls');
          await media.evaluate(el => el.play());
          await page.waitForFunction(() => document.querySelector('video').currentTime > 0.1);
          await media.evaluate(el => el.pause());
        }
        const bounds = await media.boundingBox();
        assert.ok(bounds.width > 0 && bounds.width <= width && bounds.height <= 440);
        if (artifacts) {
          mkdirSync(artifacts, { recursive: true });
          await page.screenshot({ path: path.join(artifacts, `shared-player-${engineName}-${width}.png`), animations: 'disabled' });
        }
        await media.evaluate(el => {
          el.src = 'data:video/mp4,not-a-video';
          el.load();
        });
        await preview.getByText('This format can’t be previewed here.', { exact: true }).waitFor();
        await preview.getByRole('link', { name: 'Open file' }).waitFor();
        assert.equal(await preview.getByRole('button', { name: 'Download', exact: true }).isEnabled(), true);
        await preview.getByRole('button', { name: 'Close modal', exact: true }).click();

        await gallery(page).getByRole('button', { name: /^Open Club project notes/ }).first().click();
        const audioPreview = page.getByRole('dialog', { name: 'Club project notes.pdf', exact: true });
        const audio = audioPreview.locator('audio');
        await audio.waitFor();
        await page.waitForFunction(() => document.querySelector('audio')?.readyState >= 1);
        assert.equal(await audio.evaluate(el => el.paused && el.controls), true);
        await audio.evaluate(el => el.play());
        await page.waitForFunction(() => document.querySelector('audio').currentTime > 0.1);
        await audio.evaluate(el => {
          el.pause();
          el.src = 'data:audio/wav,not-audio';
          el.load();
        });
        await audioPreview.getByText('This format can’t be previewed here.', { exact: true }).waitFor();
        await audioPreview.getByRole('link', { name: 'Open file' }).waitFor();
        await audioPreview.getByRole('button', { name: 'Close modal', exact: true }).click();
        await gallery(page).waitFor();
        assert.deepEqual(errors, []);
        await page.close();
      }
    } finally {
      await browser.close();
    }
  });
}

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
        window.emit('message_attachment_hid', {
          channelId: 11,
          messageId: 100
        });
        window.pendingItems.shift()();
        window.deferItem = false;
      });
      await page.waitForTimeout(50);
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

for (const [engineName, engine] of Object.entries({ chromium, webkit })) {
  test(`deletions retain unrelated cards and previews without reloading (${engineName})`, { timeout: 30000 }, async () => {
    html ||= await sharedMediaFixture();
    const browser = await engine.launch();
    try {
      const { page, errors } = await prepare(browser, engineName === 'webkit' ? 360 : 1280);
      await openGallery(page);
      await gallery(page).getByRole('button', { name: /^Open Mountain study/ }).first().click();
      const preview = page.getByRole('button', { name: 'Show in chat', exact: true });
      await preview.waitFor();
      const before = await page.evaluate(() => window.requestsLog.length);
      const count = await gallery(page).getByRole('button', { name: /^Open / }).count();
      await page.evaluate(() => {
        window.deferLoads = true;
        window.emit('chat_message_deleted', { channelId: 11, messageId: 9999 });
        window.emit('chat_message_edited', { channelId: 11, messageId: 9998, editedMessage: 'Updated text' });
      });
      await page.waitForTimeout(250);
      assert.equal(await page.evaluate(() => window.requestsLog.length), before, 'plain-message edits/deletions do not reload attachments');
      assert.equal(await gallery(page).getByRole('button', { name: /^Open / }).count(), count);
      assert.equal(await preview.isVisible(), true);
      await page.evaluate(() => {
        window.deleted.add(99);
        window.emit('chat_message_deleted', { channelId: 11, messageId: 99 });
      });
      await page.waitForTimeout(250);
      assert.equal(await gallery(page).getByRole('button', { name: /^Open / }).count(), count - 1, 'only the deleted attachment disappears');
      assert.equal(await preview.isVisible(), true, 'deleting another attachment keeps this preview open');
      assert.equal(await page.evaluate(() => window.requestsLog.length), before, 'canonical deletion needs no replacement list request');
      assert.equal(await page.getByText('Loading…', { exact: true }).count(), 0);
      assert.equal(await gallery(page).getByText('Loading attachments…', { exact: true }).count(), 0);
      await page.evaluate(() => {
        window.deleted.add(100);
        window.emit('message_attachment_hid', { channelId: 11, messageId: 100 });
      });
      await preview.waitFor({ state: 'detached' });
      assert.equal(await gallery(page).getByRole('button', { name: /^Open / }).count(), count - 2);
      assert.equal(await page.evaluate(() => window.requestsLog.length), before);
      assert.deepEqual(errors, []);
    } finally { await browser.close(); }
  });
}

test('deletion fences old list/detail responses and permits a later canonical undo', { timeout: 30000 }, async () => {
  html ||= await sharedMediaFixture();
  const browser = await chromium.launch();
  try {
    const { page, errors } = await prepare(browser);
    await openGallery(page);
    await page.clock.setFixedTime(new Date(Date.now() + 120_000));
    await page.evaluate(() => {
      window.deferLoads = true; window.deferItem = true;
      window.dispatchEvent(new Event('focus'));
    });
    await page.waitForFunction(() => window.pendingReads.length === 1);
    await gallery(page).getByRole('button', { name: /^Open Mountain study/ }).first().click();
    await page.waitForFunction(() => window.pendingItems.length === 1);
    await page.evaluate(() => {
      window.deleted.add(100);
      window.emit('message_attachment_hid', { channelId: 11, messageId: 100 });
      window.pendingReads.shift()(); window.pendingItems.shift()();
      window.deferLoads = false; window.deferItem = false;
    });
    await page.waitForTimeout(100);
    assert.equal(await gallery(page).getByRole('button', { name: /^Open / }).count(), 23);
    assert.equal(await page.getByRole('button', { name: 'Show in chat', exact: true }).count(), 0);
    await page.clock.setFixedTime(new Date(Date.now() + 240_000));
    await page.evaluate(() => { window.deleted.delete(100); window.dispatchEvent(new Event('focus')); });
    await page.waitForFunction(() => window.requestsLog.length >= 3);
    assert.equal(await gallery(page).getByRole('button', { name: /^Open / }).count(), 24, 'a canonical read after undo may restore the attachment');
    await gallery(page).getByRole('button', { name: /^Open Mountain study/ }).first().click();
    await page.getByRole('button', { name: 'Show in chat', exact: true }).waitFor();
    await page.evaluate(() => { window.deleted.add(100); window.emit('chat_message_deleted', { channelId: 11, messageId: 100 }); });
    await page.getByRole('button', { name: 'Show in chat', exact: true }).waitFor({ state: 'detached' });
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
