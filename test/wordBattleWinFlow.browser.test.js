import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

// 11-24 (web 2.6.46, Mikey 22:58 KST): after beating DOGGY from a General
// Chat Wordle result, the loot window never opened its "?" slot and "See what
// it means" did nothing; 2.6.47 returns the battle to the gate that opens it.
// The real gate, word window, battle screen and loot window, with the
// server's answers stubbed as the live DOGGY battle returned them.
const require = createRequire(import.meta.url);
const { chromium } = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const vocab = 'src/containers/Chat/Body/Collect/Vocabulary';

const fixture = `
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import Modal from '~/components/Modal';
import installDomMutationGuard from '~/helpers/installDomMutationGuard';
import WordBattleGate from './${vocab}/WordBattle';
import { WordleWordPopup } from './${vocab}/WordBattle/Wordle';
const locked = { content: 'doggy', battle: { locked: true, wordId: 5438, word: 'doggy', wordLevel: 2 } };
// A word window holding the gate, as WordModal does: the definitions once
// Word Master's state has them unlocked.
function WordWindow() {
  const [unlocked, setUnlocked] = useState(null);
  window.setWordUnlocked = setUnlocked;
  return (
    <Modal modalKey="WordModal" isOpen onClose={() => window.closeWordWindow()} hasHeader={false}>
      {unlocked ? <div data-definitions>{unlocked.noun[0].definition}</div> : <WordBattleGate wordObj={locked} onUnlocked={() => {}} />}
    </Modal>
  );
}
function Fixture() {
  const [shown, setShown] = useState(true);
  window.closeWordWindow = () => setShown(false);
  const wordle = location.hash.startsWith('#wordle');

  return <>{shown && (wordle ? <WordleWordPopup messageId={77} onHide={() => setShown(false)} /> : <WordWindow />)}</>;
}
installDomMutationGuard();
createRoot(document.getElementById('react-view')).render(<Fixture />);
`;

// The live battle's answers: ready, then the won battle (DOGGY, 11-24).
const loot = {
  status: 'won', kind: 'none',
  reward: { xp: 2800, coins: 280, basePoints: 2 },
  drops: [{ kind: 'points', tier: 'tiny', points: 1 }],
  xp: 126077208, coins: 26820285
};
const stubs = {
  '~/contexts': `
    const ready = { status: 'ready', wordId: 5438, word: 'doggy', wordLevel: 2, battlesLeft: 5, captured: null };
    const won = { status: 'won', wordId: 5438, word: 'doggy', wordLevel: 2, playId: 1452, hearts: 2, loot: ${JSON.stringify(loot)}, unlocked: { id: 5438, noun: [{ id: 1, definition: 'a dog (child word)' }] } };
    window.calls = [];
    const requestHelpers = {
      loadWordBattle: async () => (window.calls.push('load'), ready),
      startWordBattle: async () => (window.calls.push('start'), won),
      startWordRehunt: async () => won,
      answerWordBattle: async () => won,
      loadWordBattleAudio: async () => new Blob(),
      captureWordBattle: async () => ready,
      readWordBattle: async () => ready
    };
    const actions = {
      onUnlockWordDefinitions: (unlocked) => { window.calls.push('unlock'); window.setWordUnlocked?.(unlocked); },
      onSetUserState: ({ newState }) => { window.calls.push('xp:' + newState.twinkleXP); }
    };
    // Word Master's words, live: WordModal reads the word from here.
    import { useSyncExternalStore } from 'react';
    let chatState = { wordsObj: {} };
    const listeners = new Set();
    const setWord = (word) => { chatState = { wordsObj: { ...chatState.wordsObj, [word.content]: { ...(chatState.wordsObj[word.content] || {}), ...word } } }; listeners.forEach((l) => l()); };
    requestHelpers.loadWordleBattle = async () => ({ status: 'ok', answer: 'DOGGY', wordObj: { content: 'doggy', wordId: 5438, battle: { locked: true, wordId: 5438, word: 'doggy', wordLevel: 2 } } });
    actions.onApplyServerWordObj = (word) => setWord(word);
    actions.onEditWord = () => {};
    const unlockWords = actions.onUnlockWordDefinitions;
    actions.onUnlockWordDefinitions = (unlocked) => { unlockWords(unlocked); setWord({ content: 'doggy', ...unlocked, battle: { status: 'won', wordId: 5438, word: 'doggy', wordLevel: 2 } }); };
    const app = { requestHelpers, user: { state: { myState: {} }, actions } };
    export const useAppContext = (select) => select(app);
    export const useChatContext = (select) => {
      const state = useSyncExternalStore((l) => (listeners.add(l), () => listeners.delete(l)), () => chatState);
      return select({ state, actions });
    };
    export const useKeyContext = (select) => select({ myState: { userId: 5 }, theme: {} });
    export const useNotiContext = (select) => select({ state: {}, actions: {} });
    export const useViewContext = (select) => select({ state: {}, actions: {} });
    export const useContentContext = (select) => select({ state: {}, actions: {} });
    export const useProfileContext = (select) => select({ state: {}, actions: {} });
    export const useHomeContext = (select) => select({ state: {}, actions: {} });
    export const useInputContext = (select) => select({ state: {}, actions: {} });
  `,
  '~/components/Texts/UsernameText': 'export default () => null;',
  // The word window's dictionary tab (its edit tools need the whole app):
  // the trophy and the definitions it is handed.
  './DictionaryTab': `
    import React from 'react';
    export default function DictionaryTab({ header, posObj, posOrder }) {
      return <main>{header}{posOrder.map((pos) => Object.values(posObj[pos]).map((d) => <p key={d.id}>{d.title}</p>))}</main>;
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
    alias: { '~': path.join(repo, 'src') },
    loader: { '.png': 'dataurl', '.svg': 'dataurl', '.mp3': 'dataurl', '.wav': 'dataurl' },
    define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"development"' },
    plugins: [
      {
        name: 'win-flow-fixture',
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

async function openPage(browser, hash = '') {
  const page = await browser.newPage({ viewport: { width: 900, height: 800 }, reducedMotion: 'reduce' });
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
  await page.goto('http://localhost:3000/' + hash);
  await page.addScriptTag({ content: await compile() });
  return { page, errors };
}

async function winTheBattle(page) {
  await page.getByRole('button', { name: /Battle! ▶/ }).click();
  await page.waitForSelector('[data-testid="battle-loot-window"]', { timeout: 20000 });
  // Every slot opens on its own, the member's XP updates once, and the
  // button to the meaning appears.
  await page.waitForSelector('[data-testid="loot-slot-points"]', { timeout: 5000 });
  await page.getByRole('button', { name: 'See what it means ▶' }).waitFor({ timeout: 5000 });
  await page.waitForTimeout(1500);
  assert.equal(await page.locator('[data-testid="battle-loot-window"]').count(), 1, 'one loot window, not restarting');
  assert.equal(await page.locator('[data-testid="loot-slot-points"]').count(), 1, 'the slot stays open');
}

test('a won battle reveals its loot and "See what it means" opens the definitions (word window still open)', { timeout: 120000 }, async () => {
  const browser = await chromium.launch();
  try {
    const { page, errors } = await openPage(browser);
    await winTheBattle(page);
    await page.getByRole('button', { name: 'See what it means ▶' }).click();
    await page.waitForSelector('[data-definitions]', { timeout: 5000 });
    assert.equal(await page.locator('[data-testid="battle-loot-window"]').count(), 0, 'the battle closes');
    const calls = await page.evaluate(() => window.calls);
    assert.equal(calls.filter((c) => c === 'start').length, 1, `one battle start: ${calls}`);
    assert.equal(calls.filter((c) => c.startsWith('xp:')).length, 1, `XP updated once: ${calls}`);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});

test('the General Chat Wordle path: win, loot, "See what it means" shows the definitions', { timeout: 120000 }, async () => {
  const browser = await chromium.launch();
  try {
    const { page, errors } = await openPage(browser, '#wordle');
    await winTheBattle(page);
    await page.getByRole('button', { name: 'See what it means ▶' }).click();
    await page.waitForFunction(() => !document.querySelector('[data-testid="battle-loot-window"]'), null, { timeout: 5000 });
    await page.getByText('a dog (child word)').waitFor({ timeout: 5000 });
    const calls = await page.evaluate(() => window.calls);
    assert.equal(calls.filter((c) => c === 'start').length, 1, `one battle start: ${calls}`);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});

