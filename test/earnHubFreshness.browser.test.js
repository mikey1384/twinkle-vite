import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { build, stop } from 'esbuild';

const require = createRequire(import.meta.url);
const { chromium } = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));

const contexts = `
import {useSyncExternalStore} from 'react';
const listeners = new Set();
const key = {myState: {userId: 1}};
const requests = [];
const app = {requestHelpers: {loadRewardEarnHub({period}) {
  return new Promise((resolve, reject) => requests.push({
    userId: key.myState.userId, period, resolve, reject
  }));
}}};
export const useAppContext = select => select(app);
export const useKeyContext = select => useSyncExternalStore(
  callback => {listeners.add(callback); return () => listeners.delete(callback)},
  () => select(key)
);
window.earnRequests = requests;
window.setEarnUser = userId => {key.myState.userId = userId; listeners.forEach(fn => fn())};
window.resolveEarn = (index, xp) => {
  const request = requests[index];
  request.resolve({
    dayKey: new Date().toISOString().slice(0, 10), period: request.period,
    apps: [{buildId: 17, title: 'Test app', today: {xp}}],
    standings: {period: request.period, entries: [], me: null},
    creators: {period: request.period, entries: []}
  });
};
window.rejectEarn = index => requests[index].reject(new Error('temporary network failure'));
let visibility = 'visible';
Object.defineProperty(document, 'visibilityState', {get: () => visibility});
window.setEarnVisibility = value => {
  visibility = value;
  document.dispatchEvent(new Event('visibilitychange'));
};
`;

const fixture = `
import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {useEarnHub} from './src/containers/Home/Earn/Bounties/useEarnHub';
function Consumer({name, period}) {
  const {hub, loading, reload} = useEarnHub(period);
  return <section>
    <output data-testid={name}>{JSON.stringify({
      hub: hub ? {day: hub.dayKey, period: hub.period, xp: hub.apps[0].today.xp} : null,
      loading
    })}</output>
    <button onClick={reload}>Refresh {name}</button>
  </section>;
}
function Fixture() {
  const [settings, setSettings] = useState({shown: true, period: 'week'});
  window.setEarnPage = patch => setSettings(previous => ({...previous, ...patch}));
  return settings.shown && <>
    <Consumer name="bounties" period="week"/>
    <Consumer name="standings" period={settings.period}/>
  </>;
}
const root = createRoot(document.getElementById('root'));
root.render(<Fixture/>);
window.unmountEarnFixture = () => root.unmount();
`;

function ownChildren() {
  const rows = execFileSync('ps', ['-axo', 'pid=,ppid='], {encoding: 'utf8'})
    .trim().split('\n').map(line => line.trim().split(/\s+/).map(Number));
  const owned = new Set([process.pid]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const [pid, parent] of rows) {
      if (owned.has(parent) && !owned.has(pid)) {owned.add(pid); changed = true;}
    }
  }
  return [...owned].filter(pid => pid !== process.pid);
}

test('Earn hub refreshes canonical rewards across navigation, lifecycle and identity changes', {timeout: 60000}, async t => {
  const bundle = await build({
    stdin: {contents: fixture, resolveDir: repo, loader: 'tsx'},
    bundle: true, write: false, format: 'iife', platform: 'browser', jsx: 'transform',
    define: {'process.env.NODE_ENV': '"development"'},
    plugins: [{name: 'earn-context-fixture', setup(builder) {
      builder.onResolve({filter: /^~\/contexts$/}, () => ({path: 'contexts', namespace: 'fixture'}));
      builder.onLoad({filter: /.*/, namespace: 'fixture'}, () => ({contents: contexts, loader: 'jsx', resolveDir: repo}));
      builder.onResolve({filter: /^~\//}, args => builder.resolve(path.join(repo, 'src', args.path.slice(2)), {resolveDir: repo, kind: args.kind}));
    }}]
  });
  stop();
  const browser = await chromium.launch({headless: true, timeout: 10000});
  let owned = [];
  const errors = [];
  async function open({midnight = false} = {}) {
    const page = await browser.newPage();
    page.setDefaultTimeout(3000);
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => route.abort());
    if (midnight) {
      await page.clock.install({time: new Date('2026-09-13T23:59:58Z')});
      await page.clock.pauseAt(new Date('2026-09-13T23:59:59Z'));
    }
    await page.setContent('<div id="root"></div>');
    await page.addScriptTag({content: bundle.outputFiles[0].text});
    await requested(page, 1);
    return page;
  }
  async function requested(page, count) {
    await page.waitForFunction(expected => window.earnRequests.length === expected, count);
  }
  async function shown(page, name, xp, period = 'week') {
    await page.waitForFunction(({name, xp, period}) => {
      const node = document.querySelector('[data-testid="' + name + '"]');
      if (!node) return false;
      const state = JSON.parse(node.textContent);
      return !state.loading && state.hub?.xp === xp && state.hub?.period === period;
    }, {name, xp, period});
  }
  async function read(page, name) {
    return JSON.parse(await page.getByTestId(name).textContent());
  }
  try {
    await t.test('returning after earning fetches a new shared server response', async () => {
      const page = await open();
      await page.evaluate(() => window.resolveEarn(0, 100));
      await shown(page, 'bounties', 100);
      await shown(page, 'standings', 100);
      await page.evaluate(() => window.setEarnPage({shown: false}));
      await page.getByTestId('bounties').waitFor({state: 'detached'});
      await page.evaluate(() => window.setEarnPage({shown: true}));
      await requested(page, 2);
      assert.deepEqual(await read(page, 'bounties'), {hub: null, loading: true});
      await page.evaluate(() => window.resolveEarn(1, 700));
      await shown(page, 'bounties', 700);
      await shown(page, 'standings', 700);
      await page.close();
    });
    await t.test('returning while the old visit is still loading ignores its late response', async () => {
      const page = await open();
      await page.evaluate(() => window.setEarnPage({shown: false}));
      await page.getByTestId('bounties').waitFor({state: 'detached'});
      await page.evaluate(() => window.setEarnPage({shown: true}));
      await requested(page, 2);
      await page.evaluate(() => window.resolveEarn(1, 800));
      await shown(page, 'bounties', 800);
      await page.evaluate(() => window.resolveEarn(0, 50));
      await shown(page, 'bounties', 800);
      await shown(page, 'standings', 800);
      await page.close();
    });
    await t.test('foreground events coalesce, replace older reads and avoid hidden requests', async () => {
      const page = await open();
      await page.evaluate(() => {
        window.dispatchEvent(new Event('focus'));
        window.dispatchEvent(new Event('pageshow'));
        window.setEarnVisibility('visible');
      });
      await requested(page, 2);
      await page.evaluate(() => window.resolveEarn(1, 200));
      await shown(page, 'bounties', 200);
      await page.evaluate(() => window.resolveEarn(0, 25));
      await shown(page, 'standings', 200);
      await page.evaluate(() => {
        window.setEarnVisibility('hidden');
        window.dispatchEvent(new Event('focus'));
        window.dispatchEvent(new Event('online'));
      });
      await new Promise(resolve => setTimeout(resolve, 100));
      assert.equal(await page.evaluate(() => window.earnRequests.length), 2);
      await page.evaluate(() => window.setEarnVisibility('visible'));
      await requested(page, 3);
      await page.evaluate(() => window.resolveEarn(2, 300));
      await shown(page, 'bounties', 300);
      await shown(page, 'standings', 300);
      await page.close();
    });
    await t.test('period changes cannot show a different period or accept its late response', async () => {
      const page = await open();
      await page.evaluate(() => window.resolveEarn(0, 100));
      await shown(page, 'bounties', 100);
      await page.evaluate(() => window.setEarnPage({period: 'day'}));
      await requested(page, 2);
      assert.deepEqual(await read(page, 'standings'), {hub: null, loading: true});
      await page.evaluate(() => window.setEarnPage({period: 'all'}));
      await requested(page, 3);
      await page.evaluate(() => window.resolveEarn(2, 900));
      await shown(page, 'standings', 900, 'all');
      await page.evaluate(() => window.resolveEarn(1, 10));
      await shown(page, 'standings', 900, 'all');
      await shown(page, 'bounties', 100);
      await page.close();
    });
    await t.test('account changes and logout cannot display another account’s progress', async () => {
      const page = await open();
      await page.evaluate(() => window.setEarnUser(2));
      await requested(page, 2);
      assert.deepEqual(await read(page, 'bounties'), {hub: null, loading: true});
      await page.evaluate(() => window.resolveEarn(1, 400));
      await shown(page, 'bounties', 400);
      await page.evaluate(() => window.resolveEarn(0, 100));
      await shown(page, 'standings', 400);
      await page.evaluate(() => window.setEarnUser(0));
      await page.waitForFunction(() => JSON.parse(document.querySelector('[data-testid="bounties"]').textContent).hub === null);
      assert.deepEqual(await read(page, 'bounties'), {hub: null, loading: false});
      assert.equal(await page.evaluate(() => window.earnRequests.length), 2);
      await page.close();
    });
    await t.test('failed reads recover when online and explicit refresh updates both consumers', async () => {
      const page = await open();
      await page.evaluate(() => window.rejectEarn(0));
      await page.waitForFunction(() => !JSON.parse(document.querySelector('[data-testid="bounties"]').textContent).loading);
      assert.deepEqual(await read(page, 'bounties'), {hub: null, loading: false});
      await page.evaluate(() => window.dispatchEvent(new Event('online')));
      await requested(page, 2);
      await page.evaluate(() => window.resolveEarn(1, 100));
      await shown(page, 'bounties', 100);
      await page.getByRole('button', {name: 'Refresh standings'}).click();
      await requested(page, 3);
      assert.equal((await read(page, 'bounties')).hub.xp, 100);
      await page.evaluate(() => window.resolveEarn(2, 600));
      await shown(page, 'bounties', 600);
      await shown(page, 'standings', 600);
      await page.close();
    });
    await t.test('UTC reward-day rollover refreshes the server data and unmount removes timers/listeners', async () => {
      const page = await open({midnight: true});
      await page.evaluate(() => window.resolveEarn(0, 500));
      await shown(page, 'bounties', 500);
      await page.clock.runFor(1200);
      await requested(page, 2);
      assert.equal((await read(page, 'bounties')).hub.xp, 500, 'do not invent reset balances before the server replies');
      await page.evaluate(() => window.resolveEarn(1, 0));
      await shown(page, 'bounties', 0);
      assert.equal((await read(page, 'bounties')).hub.day, '2026-09-14');
      await page.evaluate(() => window.unmountEarnFixture());
      await page.evaluate(() => {
        window.dispatchEvent(new Event('focus'));
        window.dispatchEvent(new Event('online'));
        window.setEarnVisibility('visible');
      });
      await page.clock.fastForward(24 * 60 * 60 * 1000);
      assert.equal(await page.evaluate(() => window.earnRequests.length), 2);
      await page.close();
    });
    assert.deepEqual(errors, []);
  } finally {
    owned = ownChildren();
    await browser.close();
    stop();
    for (const pid of owned) {
      assert.throws(() => process.kill(pid, 0), {code: 'ESRCH'}, `owned browser child ${pid} should exit`);
    }
  }
});
