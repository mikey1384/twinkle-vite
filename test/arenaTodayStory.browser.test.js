import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const { chromium, webkit } = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const artifacts = process.env.ARENA_STORY_ARTIFACTS;
const fixture = `
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter,useLocation} from 'react-router-dom';
import {css} from '@emotion/css';
import {library} from '@fortawesome/fontawesome-svg-core';
import {faCoins} from '@fortawesome/pro-solid-svg-icons';
import {FixtureProvider} from '~/contexts';
import ArenaChallengePanel from './src/components/ArenaChallengePanel';
import {arenaChallengeHeadline} from './src/helpers/arenaChallengeCopy';
import {panelPreviewStyles} from './src/containers/Home/Stories/FeedCard/Body/styles/panelPreviewStyles';
import {mobilePreviewStyles} from './src/containers/Home/Stories/FeedCard/Body/styles/mobilePreviewStyles';
library.add(faCoins);
const daily={id:101,kind:'today',dayIndex:1760,dayKey:'2026-10-27',createdAt:1793098800,
 sharer:{id:2,username:'Fixture member',profilePicUrl:null},xpEarned:50000,coinsEarned:5000};
const boss={id:102,examKey:'c1-advanced',examName:'C1 Advanced',code:'C1',codeLabel:null,
 gradeLabels:null,length:'full',difficulty:'normal',sharer:daily.sharer,raw:148,max:148,
 xpEarned:120000,coinsEarned:2400,scoreBonusXpEarned:40000,scoreBonusCoinsEarned:800,
 hunterRank:null,createdAt:daily.createdAt,takers:0,bestTaker:null};
function App(){
 const [data,setData]=useState(daily);const [done,setDone]=useState(false);const [viewer,setViewer]=useState(1);const [surface,setSurface]=useState('feed');
 window.storyState=(s)=>{if('done'in s)setDone(s.done);if('viewer'in s)setViewer(s.viewer);
  if(s.surface)setSurface(s.surface);if(s.kind==='boss')setData({...boss,...s.values});else if(s.kind==='today')setData({...daily,...s.values});};
 const location=useLocation();window.route=location.pathname+location.search;
 return <FixtureProvider value={{myState:{userId:viewer},state:{todayStats:{dailyTaskStatus:{aiStory:{arena:{todayQuestion:{done,setupCompleted:true},done:true}}}}}}}>
 <main><article onClick={()=>window.cardClicks=(window.cardClicks||0)+1}>
  <header><b>Fixture member</b> <span>{arenaChallengeHeadline(data)}</span><small>Local design preview · synthetic rewards</small></header>
  <div className={css(panelPreviewStyles+mobilePreviewStyles)}>
   <div data-slot className={surface==='feed'?"home-feed-card__panel-preview home-feed-card__panel-preview--pass home-feed-card__panel-preview--size-arena-challenge":"content-page-panel"}>
    <ArenaChallengePanel challenge={data}/>
   </div>
  </div><footer>Like　Comment　Recommend</footer>
 </article></main></FixtureProvider>;
}createRoot(document.getElementById('root')).render(<MemoryRouter><App/></MemoryRouter>);`;

async function compile() {
  const stub = `import React,{createContext,useContext} from 'react';const C=createContext({});export const FixtureProvider=C.Provider;export const useKeyContext=s=>s(useContext(C));export const useNotiContext=useKeyContext;`;
  const result = await build({ stdin: { contents: fixture, resolveDir: repo, loader: 'tsx' }, bundle: true, write: false, format: 'iife', platform: 'browser', alias: { '~': path.join(repo, 'src') }, define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"development"' }, plugins: [{ name: 'story-context', setup(b) { b.onResolve({ filter: /^~\/contexts$/ }, () => ({ path: 'context', namespace: 'fixture' })); b.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: stub, loader: 'jsx', resolveDir: repo })); } }] });
  const style = readFileSync(path.join(repo, 'src/styles.css'), 'utf8') + `body{background:#f4f5f7;font-family:Arial,sans-serif}main{max-width:640px;margin:20px auto;padding:12px}article{background:white;border:1px solid #bbb;border-radius:16px;padding:16px}header{font-size:1.6rem;margin-bottom:18px;line-height:1.5}header small{display:block;color:#666;font-size:1.1rem}footer{font-size:1.3rem;margin-top:18px;color:#555}`;
  return `<!doctype html><html><meta name="viewport" content="width=device-width, initial-scale=1"><title>Arena daily challenge story preview</title><style>${style}</style><body><div id="root"></div><script>${result.outputFiles[0].text.replaceAll('</script', '<\\/script')}</script></body></html>`;
}

test('daily stories fit the actual Home preview slot and nudge only an unfinished viewer, preserving boss cards', { timeout: 90000 }, async () => {
  const html = await compile();
  if (artifacts) { mkdirSync(artifacts, { recursive: true }); writeFileSync(path.join(artifacts, 'preview.html'), html); }
  for (const engine of [chromium, webkit]) {
    const browser = await engine.launch();
    try {
      for (const width of [360, 390, 768, 1440]) {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        page.setDefaultTimeout(6000);
        const errors = []; page.on('pageerror', e => errors.push(e.message));
        await page.route('**/*', route => route.request().url() === 'http://localhost:3000/'
          ? route.fulfill({ contentType: 'text/html', body: html })
          : route.fulfill({ status: 204, body: '' }));
        await page.goto('http://localhost:3000/');
        const button = page.getByRole('button', { name: 'Try today’s challenge', exact: true });
        await button.waitFor();
        assert.ok(await page.getByText('50,000', { exact: true }).isVisible());
        assert.ok(await page.getByLabel('5,000 coins', { exact: true }).isVisible());
        assert.ok(await page.getByText('Oct 27, 2026', { exact: true }).isVisible());
        const checkFit = async () => {
          const fits = await page.evaluate(() => {
            const slot = document.querySelector('[data-slot]').getBoundingClientRect();
            return [...document.querySelectorAll('[data-slot] button,[data-slot] .reward-amount-chip')].every(el => {
              const r = el.getBoundingClientRect(); return r.bottom <= slot.bottom + 1 && r.right <= slot.right + 1 && r.left >= slot.left - 1;
            }) && document.documentElement.scrollWidth <= innerWidth + 1;
          });
          assert.ok(fits, `${engine.name()} ${width}: reward or action clipped`);
        };
        await checkFit();
        if (artifacts) await page.screenshot({ path: path.join(artifacts, `${engine.name()}-${width}.png`), fullPage: true });
        await button.click();
        await page.waitForFunction(() => window.route === '/arena?mode=today');
        assert.equal(await page.evaluate(() => window.route), '/arena?mode=today');
        assert.equal(await page.evaluate(() => window.cardClicks || 0), 0, 'The nudge must not also open the post');
        // A real completion response, another viewer, missing state and rollover.
        await page.evaluate(() => window.storyState({ done: true }));
        await button.waitFor({ state: 'detached' });
        assert.ok(await page.getByText('You’ve completed today’s challenge ✓').isVisible());
        await page.evaluate(() => window.storyState({ done: undefined }));
        assert.equal(await button.count(), 0, 'Unknown progress is not an unfinished challenge');
        await page.evaluate(() => window.storyState({ done: false, viewer: 0 }));
        assert.equal(await button.count(), 0);
        await page.evaluate(() => window.storyState({ done: false, viewer: 2, kind: 'today', values: { xpEarned: 25000, coinsEarned: 0 } }));
        await button.waitFor(); // even on one's own old story, today's new challenge is available
        assert.ok(await page.getByText('25,000', { exact: true }).isVisible());
        assert.ok(await page.getByText('0 Coins', { exact: true }).isVisible());
        await checkFit();
        if (artifacts && width === 360) await page.screenshot({ path: path.join(artifacts, `${engine.name()}-guided-${width}.png`), fullPage: true });
        await page.evaluate(() => window.storyState({ kind: 'today', values: { coinsEarned: 200 } }));
        await page.getByLabel('200 coins', { exact: true }).waitFor();
        await page.evaluate(() => window.storyState({ kind: 'boss', viewer: 1 }));
        const bossButton = page.getByRole('button', { name: 'Challenge!', exact: true });
        await bossButton.waitFor();
        assert.ok(await page.getByText('got a perfect score! Can you match it?', { exact: true }).isVisible());
        assert.ok(await page.getByText('120,000', { exact: true }).isVisible());
        await checkFit();
        await bossButton.click();
        await page.waitForFunction(() => window.route === '/arena?mode=arena&challenge=102');
        assert.equal(await page.evaluate(() => window.route), '/arena?mode=arena&challenge=102');
        assert.deepEqual(errors, []);
        await page.close();
      }
    } finally { await browser.close(); }
  }
});

test('million-XP awards are larger at the exact threshold and fit Home and content panels', { timeout: 90000 }, async () => {
  const html = await compile();
  for (const engine of [chromium, webkit]) {
    const browser = await engine.launch();
    try {
      for (const width of [360, 1440]) {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        const errors = []; page.on('pageerror', e => errors.push(e.message));
        await page.route('**/*', route => route.request().url() === 'http://localhost:3000/'
          ? route.fulfill({ contentType: 'text/html', body: html }) : route.fulfill({ status: 204, body: '' }));
        await page.goto('http://localhost:3000/');
        await page.getByRole('button', { name: 'Try today’s challenge', exact: true }).waitFor();
        for (const surface of ['feed', 'content']) {
          let smallerFont;
          for (const xp of [999999, 1000000, 13500000]) {
            await page.evaluate(({ xp, surface }) => window.storyState({ kind: 'boss', surface,
              values: { xpEarned: xp, coinsEarned: 13500, scoreBonusXpEarned: Math.floor(xp / 3), scoreBonusCoinsEarned: 4500 } }), { xp, surface });
            const mainXP = page.getByLabel('Exam rewards', { exact: true }).locator('.xp').first();
            await page.waitForFunction(xp => document.querySelector('[aria-label="Exam rewards"] .reward-chip__xp-number')?.textContent === xp.toLocaleString('en-US'), xp);
            const font = await mainXP.evaluate(el => Number.parseFloat(getComputedStyle(el).fontSize));
            if (xp < 1000000) smallerFont = font;
            else assert.ok(font > smallerFont, `${engine.name()} ${width} ${surface}: million award must be larger`);
            const fit = await page.evaluate(() => {
              const slot = document.querySelector('[data-slot]').getBoundingClientRect();
              return [...document.querySelectorAll('[data-slot] button,[data-slot] .reward-amount-chip')].every(el => {
                const r = el.getBoundingClientRect(); return r.bottom <= slot.bottom + 1 && r.right <= slot.right + 1 && r.left >= slot.left - 1;
              }) && document.documentElement.scrollWidth <= innerWidth + 1;
            });
            assert.ok(fit, `${engine.name()} ${width} ${surface} ${xp}: reward or action clipped`);
            if (artifacts && xp >= 1000000) await page.screenshot({ path: path.join(artifacts, `${engine.name()}-${surface}-${width}-${xp}.png`), fullPage: true });
          }
          await page.evaluate(surface => window.storyState({ kind: 'boss', surface, values: {
            xpEarned: 0, coinsEarned: 0, rewardPending: true, scoreBonusXpEarned: undefined, scoreBonusCoinsEarned: undefined
          } }), surface);
          await page.getByText('Reward payment pending', { exact: true }).waitFor();
          assert.equal(await page.getByLabel('Exam rewards', { exact: true }).locator('.xp').count(), 0, 'Pending rewards never invent a large award');
        }
        assert.deepEqual(errors, []);
        await page.close();
      }
    } finally { await browser.close(); }
  }
});
