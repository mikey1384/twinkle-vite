import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

// 11-24 (Mikey: "i was doing word battle and suddenly this appeared and the
// modal turned off"): he opened "glumal" from the second-newest Word Master
// card (21:50:33 KST) and battled it. Two members were collecting fast; by
// 21:51:20 seven new cards had arrived, so that card was ninth: no longer one
// of the eight newest that always render, and far off screen, so the lazy
// feed swapped it for its empty stand-in at once. The word window and the
// battle inside it unmounted with it, just before ShadowNinja's tall
// "Got Lucky!" card (21:51:23). The battle's third question then timed out
// on the server and it was recorded as abandoned (lost).
//
// Real Word Master Feed, lazy-load helpers, Modal and app-level battle host;
// only the card's layout (a word window with a Battle button) and the battle
// screen are stand-ins.
const require = createRequire(import.meta.url);
const { chromium } = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const vocab = 'src/containers/Chat/Body/Collect/Vocabulary';

const fixture = `
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Feed from './${vocab}/FeedsContainer/Feed';
import WordBattleHost from './${vocab}/WordBattle/WordBattleHost';
const card = (id, height = 140) => ({ id, action: 'register', content: 'word' + id, timeStamp: 1795500000 + id, wordLevel: 3 });
window.cardHeights = {};
function Fixture() {
  const [feeds, setFeeds] = useState(() => Array.from({ length: 12 }, (_, i) => card(100 - i)));
  window.pushCard = (height = 140) => setFeeds((list) => {
    const next = card(1000 + list.length);
    window.cardHeights[next.content] = height;
    return [next, ...list];
  });
  window.dropCard = (id) => setFeeds((list) => list.filter((feed) => feed.id !== id));
  // A member reading at the bottom stays at the bottom when a card arrives
  // (FeedsContainer's scroll-to-bottom on a new card).
  useEffect(() => {
    document.getElementById('feed').scrollTop = 0;
  }, [feeds.length]);
  return (
    <>
      <div id="feed" style={{ height: 450, overflowY: 'scroll', display: 'flex', flexDirection: 'column-reverse' }}>
        <div style={{ display: 'flex', flexDirection: 'column-reverse' }}>
          {feeds.map((feed, index) => <Feed key={feed.id} feed={feed} eager={index < 8} />)}
        </div>
      </div>
      <WordBattleHost />
    </>
  );
}
createRoot(document.getElementById('react-view')).render(<Fixture />);
`;

const stubs = {
  '~/contexts': `
    const requestHelpers = { startWordBattle: async () => ({}), startWordRehunt: async () => ({}), answerWordBattle: async () => ({}), loadWordBattleAudio: async () => new Blob() };
    const chat = { state: {}, actions: { onUnlockWordDefinitions: (unlocked) => { window.unlocked = unlocked; } } };
    export const useAppContext = (select) => select({ requestHelpers, user: { state: { myState: {} }, actions: {} } });
    export const useChatContext = (select) => select(chat);
    export const useKeyContext = (select) => select({ myState: {}, theme: {} });
    export const useNotiContext = (select) => select({ state: {}, actions: {} });
    export const useViewContext = (select) => select({ state: {}, actions: {} });
    export const useContentContext = (select) => select({ state: {}, actions: {} });
    export const useProfileContext = (select) => select({ state: {}, actions: {} });
    export const useHomeContext = (select) => select({ state: {}, actions: {} });
    export const useInputContext = (select) => select({ state: {}, actions: {} });
    export const useMissionContext = (select) => select({ state: {}, actions: {} });
    export const useBuildContext = (select) => select({ state: {}, actions: {} });
  `,
  // The card's layout: a word window (a real Modal) whose Battle button hands
  // the battle to the app-level host, as WordBattleGate does.
  './DefaultLayout': `
    import React, { useState } from 'react';
    import Modal from '~/components/Modal';
    import { wordBattleHost } from '~/${vocab.slice(4)}/WordBattle/battleHost';
    export default function DefaultLayout({ content }) {
      const [open, setOpen] = useState(false);
      const wordId = Number(content.slice(4));
      return (
        <div data-card={content} style={{ height: window.cardHeights[content] || 140, background: '#eef' }}>
          <button onClick={() => setOpen(true)}>Open {content}</button>
          {open && (
            <Modal modalKey="WordModal" isOpen onClose={() => setOpen(false)} hasHeader={false}>
              <div data-word-window={content}>
                <button onClick={() => wordBattleHost.open({ wordId, word: content, state: { status: 'ready', wordId, word: content, wordLevel: 3 } })}>Battle {content}</button>
              </div>
            </Modal>
          )}
        </div>
      );
    }
  `,
  // The card list's helpers import a username link with its whole profile
  // tree; nothing here renders one.
  '~/components/Texts/UsernameText': 'export default () => null;',
  '~/components/WordMasterBadges': 'export const badgeStyle = () => ({}); export const getActionColor = () => ""; export const getBreakTypeColor = () => ""; export const getRGBA = () => "";',
  './SpellLayout': 'export default () => null;',
  './RewardLayout': 'export default () => null;',
  './BreakLayout': 'export default () => null;',
  './BattleScreen': `
    import React from 'react';
    export default function BattleScreen({ initial, onFinished }) {
      return (
        <div data-battle={initial.word}>
          Battle {initial.word}
          <button onClick={() => onFinished({ ...initial, status: 'won', unlocked: { id: initial.wordId } })}>Win</button>
        </div>
      );
    }
  `
};

let bundle;
async function compile() {
  if (bundle) return bundle;
  const result = await build({
    stdin: { contents: fixture, resolveDir: repo, loader: 'tsx' },
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    // HostedWordBattle loads lazily in the app; inline here.
    splitting: false,
    alias: { '~': path.join(repo, 'src') },
    define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"development"' },
    plugins: [
      {
        name: 'word-battle-fixture',
        setup(builder) {
          builder.onResolve({ filter: /.*/ }, ({ path: p }) =>
            stubs[p] ? { path: p, namespace: 'fixture' } : undefined
          );
          builder.onLoad({ filter: /.*/, namespace: 'fixture' }, ({ path: p }) => ({
            contents: stubs[p],
            loader: 'jsx',
            resolveDir: repo
          }));
        }
      }
    ]
  });
  return (bundle = result.outputFiles[0].text);
}

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/*', (route) =>
    route.request().url() === 'http://localhost:3000/'
      ? route.fulfill({
          contentType: 'text/html',
          body: `<style>${readFileSync(path.join(repo, 'src/styles.css'), 'utf8')}</style><div id="react-view"></div><div id="modal"></div>`
        })
      : route.abort()
  );
  await page.goto('http://localhost:3000/');
  await page.addScriptTag({ content: await compile() });
  await page.waitForSelector('[data-card="word99"]');
  return { page, errors };
}

test('new cards never close the word window or battle opened from a card they push out of the newest eight', { timeout: 120000 }, async () => {
  const browser = await chromium.launch();
  try {
    const { page, errors } = await openPage(browser);
    // Let the cards measure their heights and the stand-ins settle.
    await page.waitForTimeout(1500);
    // The second-newest card, as Mikey's "glumal" was.
    await page.getByRole('button', { name: 'Open word99' }).click();
    await page.getByRole('button', { name: 'Battle word99' }).click();
    await page.waitForSelector('[data-battle="word99"]');
    const zOf = (selector) =>
      page.evaluate((s) => Number(getComputedStyle(document.querySelector(s).closest('[data-modal-container] > *')).zIndex), selector);
    assert.ok((await zOf('[data-battle]')) > (await zOf('[data-word-window]')), 'the battle opens above the word window');

    // Six ordinary cards, then a tall "Got Lucky!" one: the opened card is
    // ninth and far off screen.
    for (let i = 0; i < 6; i++) {
      await page.evaluate(() => window.pushCard());
      await page.waitForTimeout(150);
    }
    await page.evaluate(() => window.pushCard(700));
    await page.waitForFunction(() => {
      const card = document.querySelector('[data-card="word99"]')?.getBoundingClientRect();
      const feed = document.getElementById('feed').getBoundingClientRect();
      return !card || card.bottom < feed.top - 200;
    });
    // Past useLazyLoad's 2 s hide delay and the stand-in settle.
    await page.waitForTimeout(3500);
    assert.equal(await page.locator('[data-word-window="word99"]').count(), 1, 'the word window is still open');
    assert.equal(await page.locator('[data-battle="word99"]').count(), 1, 'the battle is still open');
    // Its neighbour, which made the same move holding no window, still trades
    // its content for a stand-in.
    assert.equal(await page.locator('[data-card="word98"]').count(), 0, 'cards without a window still lazy-unmount');

    // Even if the card that opened it is gone entirely, the battle stays.
    await page.evaluate(() => window.dropCard(99));
    await page.waitForTimeout(300);
    assert.equal(await page.locator('[data-word-window="word99"]').count(), 0);
    assert.equal(await page.locator('[data-battle="word99"]').count(), 1, 'the battle outlives its opener');
    await page.getByRole('button', { name: 'Win' }).click();
    await page.waitForFunction(() => !document.querySelector('[data-battle]'));
    assert.deepEqual(await page.evaluate(() => window.unlocked), { id: 99 }, 'the host unlocks the definitions with no gate left');
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
