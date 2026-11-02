import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

// The step-by-step review and the one-time "Stuck?" offer (Mikey 11-02), on
// the real lt-math-e6 Easy Short paper a struggling member left blank.
// ARENA_STEPS_ARTIFACTS=<dir> saves phone (360, 390) and desktop renders.

const require = createRequire(import.meta.url);
const { chromium, webkit } = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const artifacts = process.env.ARENA_STEPS_ARTIFACTS;
const paper = JSON.parse(readFileSync(new URL('./fixtures/arenaLtMathE6EasyShort.json', import.meta.url), 'utf8'));

const fixture = `
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import {library} from '@fortawesome/fontawesome-svg-core';
import {faArrowLeft,faClock,faCheck,faChevronUp,faChevronDown,faSpinner,faTrophy} from '@fortawesome/pro-solid-svg-icons';
import BattleRunner from './src/containers/Arena/BattleRunner';
library.add(faArrowLeft,faClock,faCheck,faChevronUp,faChevronDown,faSpinner,faTrophy);
const PAPER=${JSON.stringify(paper)};
window.mode='finished';window.startedAgo=0;
function data(){const now=Math.floor(Date.now()/1000);const open=window.mode==='open';return {
 battle:{id:139,companion:'solo',exam:{key:'lt-math-e6',name:'수학학원 레벨테스트 (초5–6)',nameEn:'Academy Math Level Test (Grades 5–6)',language:'ko',code:'E6-2',codeLabel:'레벨테스트',pointTags:'all',layout:'problem',choices:5,gradeLabels:['Top class','Upper class','Middle class','Basic class','Not placed']},length:'short',difficulty:'easy',mode:'battle',status:window.mode,minutes:25,serverNow:now,startedAt:now-window.startedAgo,deadlineAt:open?now-window.startedAgo+1500:null,finishedAt:open?null:now,rawPoints:0,maxPoints:50,grade:5,estimate:null,won:false,winAt:35,rewardOffer:{target:35,max:50},reward:{xpEarned:0,coinsEarned:0,rewardStatus:'below_target'}},
 passages:PAPER.passages,
 items:PAPER.items.map(item=>open?{...item,key:undefined,correct:undefined,review:undefined}:item)
};}
window.requests={loadArenaBattle:async()=>data(),saveArenaAnswer:async args=>({saved:true,answer:args.answer}),submitArenaBattle:async()=>data(),loadArenaParentPrompt:async()=>({eligible:false})};
function Fixture(){const [key,setKey]=useState(0);window.changeMode=(mode,ago=0)=>{window.mode=mode;window.startedAgo=ago;setKey(x=>x+1);};return <BattleRunner key={key} battleId={139} onExit={()=>{}}/>;}
createRoot(document.getElementById('react-view')).render(<MemoryRouter><Fixture/></MemoryRouter>);
`;

let bundle;
async function compile() {
  if (bundle) return bundle;
  const stubs = {
    '~/contexts': 'export const useAppContext=select=>select({requestHelpers:window.requests});export const useNotiContext=select=>select({actions:{onApplyTodayStatsProgress:()=>{}}});',
    '~/helpers': 'export const buildTodayStatsPatchFromDailyTaskStatus=x=>x;',
    '~/helpers/hooks/useUserActivity': 'export default ()=>{};',
    '~/helpers/websiteAgentScreenState': 'export const useAgentScreenState=()=>{};',
    '~/constants/sockets/api': 'export const socket={emit(){},on(){},off(){}};',
    '~/components/Buttons/AskAgentButton': 'import React from "react";export default ({assistant,context,label,onClick})=> <button className="ask" data-question={context?.no} data-step={context?.step||""} onClick={()=>{onClick?.();window.asked=context;}}>{label||("Ask "+(assistant||"Zero"))}</button>;',
    './EssayAnswer': 'export default ()=>null;',
    './SpokenAnswer': 'export default ()=>null;',
    './MarkReview': 'export default ()=>null;'
  };
  const result = await build({
    stdin: { contents: fixture, resolveDir: repo, loader: 'tsx' }, bundle: true, write: false,
    format: 'iife', platform: 'browser', alias: { '~': path.join(repo, 'src') },
    define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"development"' },
    plugins: [{ name: 'steps-fixture-services', setup(builder) {
      builder.onResolve({ filter: /.*/ }, ({ path }) => stubs[path] ? { path, namespace: 'fixture' } : undefined);
      builder.onLoad({ filter: /.*/, namespace: 'fixture' }, ({ path }) => ({ contents: stubs[path], loader: 'jsx', resolveDir: repo }));
    } }]
  });
  bundle = result.outputFiles[0].text;
  return bundle;
}

async function openPage(browser, width, height, script, { reducedMotion = 'no-preference' } = {}) {
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: width < 1100, reducedMotion });
  page.setDefaultTimeout(8000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/*', (route) => route.request().url() === 'http://localhost:3000/'
    ? route.fulfill({ contentType: 'text/html', body: `<style>${readFileSync(path.join(repo, 'src/styles.css'), 'utf8')}</style><div id="react-view"></div>` })
    : route.abort());
  await page.goto('http://localhost:3000/');
  await page.evaluate(() => { try { localStorage.clear(); } catch {} });
  await page.addScriptTag({ content: script });
  return { page, errors };
}

const shot = async (page, name, options = {}) => {
  if (!artifacts) return;
  mkdirSync(artifacts, { recursive: true });
  await page.screenshot({ path: path.join(artifacts, `${name}.png`), ...options });
};

for (const [engineName, engine] of Object.entries({ chromium, webkit })) {
  test(`a blank question's explanation opens one step at a time and builds up (${engineName})`, { timeout: 90000 }, async () => {
    const script = await compile();
    const browser = await engine.launch();
    try {
      for (const [width, height] of [[360, 780], [390, 844], [1280, 800]]) {
        const { page, errors } = await openPage(browser, width, height, script);
        const tag = `${engineName}-${width}x${height}`;
        const first = page.locator('article').first();
        await first.locator('[data-arena-steps]').waitFor();
        // question 1: 4 authored sentences, step 1 shown
        const steps = first.locator('[data-arena-steps] li');
        assert.equal(await first.locator('[data-arena-steps]').getAttribute('data-arena-steps'), '4');
        assert.equal(await steps.count(), 1);
        assert.match(await first.innerText(), /풀이 · 1\/4단계/);
        assert.match(await steps.first().innerText(), /곱셈과 나눗셈을 뺄셈보다 먼저 한다\./);
        // the member's blank stays visible: the key is printed and no pick is marked
        assert.match(await first.innerText(), /정답:/);
        await first.scrollIntoViewIfNeeded();
        await shot(page, `${tag}-review-step1`);

        // step 2: a chained calculation builds up in three pieces
        await first.getByRole('button', { name: /Next step/ }).click();
        assert.equal(await steps.count(), 2);
        const pieces = steps.nth(1).locator('[data-pieces]');
        assert.equal(await pieces.getAttribute('data-pieces'), '3');
        const animation = await steps.nth(1).evaluate((el) => getComputedStyle(el).animationName);
        assert.notEqual(animation, 'none', 'the new step animates in');
        // mid build-up: the last piece has not arrived yet
        await page.waitForTimeout(450);
        const midOpacity = await pieces.locator(':scope > span').nth(2).evaluate((el) => Number(getComputedStyle(el).opacity));
        assert.ok(midOpacity < 0.5, `third piece still on its way (${midOpacity})`);
        await shot(page, `${tag}-review-step2-building`, { clip: await clipOf(first) });
        await page.waitForTimeout(1800);
        const endOpacity = await pieces.locator(':scope > span').nth(2).evaluate((el) => Number(getComputedStyle(el).opacity));
        assert.equal(endOpacity, 1);
        // what the pieces show is the authored expression, in order
        const shown = (await pieces.innerText()).replace(/\s+/g, '');
        assert.ok(shown.includes('=6'), shown);
        await shot(page, `${tag}-review-step2`, { clip: await clipOf(first) });

        // Ask about the step being read
        const ask = first.getByRole('button', { name: 'Ask about step 2' });
        assert.equal(await ask.getAttribute('data-step'), '2');
        assert.equal(await first.locator('button.ask').count(), 1, 'one Ask per question while stepping');
        await ask.click();
        const asked = await page.evaluate(() => window.asked);
        assert.equal(asked.kind, 'arenaBattleItem');
        assert.equal(asked.no, 1);
        assert.equal(asked.step, 2);

        // Show all opens the rest and is remembered for the next question
        await first.getByRole('button', { name: 'Show all' }).click();
        assert.equal(await steps.count(), 4);
        assert.equal(await page.evaluate(() => localStorage.getItem('arena-review-steps')), 'all');
        assert.equal(await first.getByRole('button', { name: 'Ask Zero' }).getAttribute('data-step'), '');
        await page.waitForTimeout(400);
        await shot(page, `${tag}-review-all`, { clip: await clipOf(first) });

        // nothing overflows sideways on a phone
        const overflow = await page.evaluate(() => {
          const main = document.querySelector('fieldset main');
          return { scroll: main.scrollWidth, client: main.clientWidth };
        });
        assert.ok(overflow.scroll <= overflow.client + 1, JSON.stringify(overflow));
        assert.deepEqual(errors, []);
        await page.close();
      }
    } finally {
      await browser.close();
    }
  });

  test(`a stuck member is offered Zero/Ciel once; "Not now" sticks (${engineName})`, { timeout: 60000 }, async () => {
    const script = await compile();
    const browser = await engine.launch();
    try {
      for (const [width, height] of [[360, 780], [390, 844], [1280, 800]]) {
        const { page, errors } = await openPage(browser, width, height, script);
        const tag = `${engineName}-${width}x${height}`;
        // just started: no offer
        await page.waitForFunction(() => typeof window.changeMode === 'function');
        await page.evaluate(() => window.changeMode('open', 60));
        await page.locator('header').getByRole('button', { name: 'Leave' }).waitFor();
        assert.equal(await page.getByRole('status', { name: 'Help with this exam' }).count(), 0);
        // five quiet minutes, nothing answered
        await page.evaluate(() => window.changeMode('open', 300));
        const nudge = page.getByRole('status', { name: 'Help with this exam' });
        await nudge.waitFor();
        assert.match(await nudge.innerText(), /Stuck\?.*first step of question 1/s);
        const askNudge = nudge.getByRole('button', { name: 'Ask about question 1' });
        assert.equal(await askNudge.getAttribute('data-question'), '1');
        await page.waitForTimeout(400);
        await shot(page, `${tag}-live-stuck-offer`);
        const box = await nudge.boundingBox();
        assert.ok(box.x >= 0 && box.x + box.width <= width + 1, 'the offer fits the screen width');
        if (width === 390) {
          // Ask hides it for this paper
          await askNudge.click();
          assert.equal(await nudge.count(), 0);
          assert.equal((await page.evaluate(() => window.asked)).no, 1);
          await page.evaluate(() => window.changeMode('open', 320));
          await page.locator('header').getByRole('button', { name: 'Leave' }).waitFor();
          await page.waitForTimeout(200);
          assert.equal(await page.getByRole('status', { name: 'Help with this exam' }).count(), 0, 'once per paper');
        } else {
          await nudge.getByRole('button', { name: 'Not now' }).click();
          assert.equal(await nudge.count(), 0);
          assert.equal(await page.evaluate(() => localStorage.getItem('arena-help-nudge')), 'off');
          await page.evaluate(() => window.changeMode('open', 900));
          await page.locator('header').getByRole('button', { name: 'Leave' }).waitFor();
          await page.waitForTimeout(200);
          assert.equal(await page.getByRole('status', { name: 'Help with this exam' }).count(), 0, '"Not now" is respected');
        }
        assert.deepEqual(errors, []);
        await page.close();
      }
    } finally {
      await browser.close();
    }
  });
}

test('reduced motion: the steps still work, nothing animates', { timeout: 60000 }, async () => {
  const script = await compile();
  const browser = await chromium.launch();
  try {
    const { page, errors } = await openPage(browser, 390, 844, script, { reducedMotion: 'reduce' });
    const first = page.locator('article').first();
    await first.locator('[data-arena-steps]').waitFor();
    await first.getByRole('button', { name: /Next step/ }).click();
    const step = first.locator('[data-arena-steps] li').nth(1);
    assert.equal(await step.evaluate((el) => getComputedStyle(el).animationName), 'none');
    const piece = step.locator('[data-pieces] > span').first();
    assert.equal(await piece.evaluate((el) => getComputedStyle(el).animationName), 'none');
    assert.equal(await piece.evaluate((el) => Number(getComputedStyle(el).opacity)), 1);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});

async function clipOf(locator) {
  const box = await locator.boundingBox();
  const page = locator.page();
  const viewport = page.viewportSize();
  const y = Math.max(0, box.y);
  return { x: 0, y, width: viewport.width, height: Math.max(1, Math.min(viewport.height - y, box.height)) };
}
