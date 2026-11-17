import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
const require = createRequire(import.meta.url);
const {
  chromium
} = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');

test('page replacement returns fresh refs without clicking a same-named neighbour', async () => {
  const profile = path.resolve('../browser-test-profile');
  await fs.mkdir(profile, { recursive: true });
  const bundled = await build({
    entryPoints: ['src/helpers/websiteAgentPage.ts'],
    bundle: true,
    write: false,
    format: 'iife',
    globalName: 'agentPage',
    platform: 'browser',
    define: { 'process.env.NODE_ENV': '"test"' }
  });
  const browser = await chromium.launchPersistentContext(profile, {
    headless: true
  });
  try {
    const page = await browser.newPage();
    // A real origin supplies crypto.randomUUID and history; no network leaves
    // the fixture, and no dev server or real member session is opened.
    await page.route('http://fixture.test/**', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<div id="react-view"><section>My bio <button>Save</button></section><section>Other post <button>Save</button></section></div>'
      })
    );
    await page.goto('http://fixture.test/');
    await page.addScriptTag({
      content:
        'if (!crypto.randomUUID) crypto.randomUUID = () => "f4ed6839-8261-49fd-8b0b-974b1487be30";'
    });
    await page.addScriptTag({ content: bundled.outputFiles[0].text });
    const result = await page.evaluate(async () => {
      let clicks = 0;
      document.addEventListener('click', () => clicks++);
      const first = agentPage.readWebsiteAgentPage();
      const button = document.querySelector('button');
      const oldRef = button.getAttribute('data-agent-ref');
      button.outerHTML = '<button>Save</button>';
      const stale = await agentPage.performWebsiteAgentClick({
        ref: oldRef,
        effect: 'change'
      });
      const clicksAfterStale = clicks;
      const replacement = document.querySelector('button');
      const fresh = replacement.getAttribute('data-agent-ref');
      const second = await agentPage.performWebsiteAgentClick({
        ref: fresh,
        effect: 'change'
      });
      const clicksAfterFresh = clicks;
      // React can reuse a node for another record: context change invalidates it.
      replacement.parentElement.firstChild.textContent = 'Different record ';
      const reused = agentPage.findWebsiteAgentElement(fresh);
      history.pushState({}, '', '/another-page');
      const moved = agentPage.findWebsiteAgentElement(fresh);
      const foreign = agentPage.findWebsiteAgentElement(
        'r00000000-0000-0000-0000-000000000000_1'
      );
      return {
        first,
        stale,
        oldRef,
        fresh,
        second,
        clicksAfterStale,
        clicksAfterFresh,
        reused: !!reused,
        moved: !!moved,
        foreign: !!foreign
      };
    });
    assert.equal(result.stale.code, 'stale_page');
    assert.ok(result.stale.pageNow.elements.includes(result.fresh));
    assert.notEqual(result.oldRef, result.fresh);
    assert.equal(result.clicksAfterStale, 0);
    assert.equal(result.clicksAfterFresh, 1);
    assert.equal(result.second.ok, true);
    assert.equal(result.reused, false);
    assert.equal(result.moved, false);
    assert.equal(result.foreign, false);
    // Form typing and guide-only guards still work with the new ref format.
    const typing = await page.evaluate(async () => {
      document.querySelector('#react-view').innerHTML =
        '<input aria-label="Bio"><div data-agent-guide-only><input aria-label="Answer"></div>';
      agentPage.readWebsiteAgentPage();
      const fields = document.querySelectorAll('input');
      const typed = await agentPage.performWebsiteAgentType({
        ref: fields[0].getAttribute('data-agent-ref'),
        text: 'My own bio',
        pressEnter: false
      });
      const refused = await agentPage.performWebsiteAgentType({
        ref: fields[1].getAttribute('data-agent-ref'),
        text: 'Not allowed',
        pressEnter: false
      });
      return { typed, refused, bio: fields[0].value, answer: fields[1].value };
    });
    assert.equal(typing.typed.ok, true);
    assert.equal(typing.bio, 'My own bio');
    assert.equal(typing.refused.ok, false);
    assert.equal(typing.answer, '');
  } finally {
    await browser.close();
    await fs.rm(profile, { recursive: true, force: true });
  }
});
