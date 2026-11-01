import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

// "Try this question" (Mikey 11-01): Today's Challenge screen on another
// member's cleared question, opened from their Home story.
const require = createRequire(import.meta.url);
const { chromium, webkit } = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const artifacts = process.env.ARENA_SHARED_ARTIFACTS;
const fixture = `
import React from 'react';
import {createRoot} from 'react-dom/client';
import {library} from '@fortawesome/fontawesome-svg-core';
import {faCoins,faSpinner} from '@fortawesome/pro-solid-svg-icons';
import {FixtureProvider} from '~/contexts';
import TodayQuestion from './src/containers/Arena/TodayQuestion';
library.add(faCoins,faSpinner);
const context={myState:{userId:1},requestHelpers:{
 arenaToday:async()=>{throw new Error('the daily endpoint must not be used');},
 arenaShared:async(action,body)=>window.sharedServer(action,body)
},user:{actions:{onSetUserState:v=>{window.balances=v.newState;}}},state:{todayStats:{}},actions:{onApplyTodayStatsProgress:v=>{window.daily=v;}}};
createRoot(document.getElementById('root')).render(<FixtureProvider value={context}><main><TodayQuestion sharedId={101}/></main></FixtureProvider>);`;

async function compile() {
  const stubs = {
    '~/contexts': `import React,{createContext,useContext} from 'react';const C=createContext({});export const FixtureProvider=C.Provider;export const useAppContext=s=>s(useContext(C));export const useKeyContext=useAppContext;export const useNotiContext=useAppContext;`,
    '~/helpers': `export const buildTodayStatsPatchFromDailyTaskStatus=dailyTaskStatus=>({dailyTaskStatus});`,
    '~/helpers/websiteAgentPage': `export const WEBSITE_AGENT_NO_PLAY_ATTRIBUTE='data-twinkle-agent-no-play';export const WEBSITE_AGENT_OFF_LIMITS_ATTRIBUTE='data-twinkle-agent-off-limits';`
  };
  const result = await build({ stdin: { contents: fixture, resolveDir: repo, loader: 'tsx' }, bundle: true, write: false, format: 'iife', platform: 'browser', alias: { '~': path.join(repo, 'src') }, define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"development"' }, plugins: [{ name: 'shared-services', setup(b) { b.onResolve({ filter: /.*/ }, ({ path }) => stubs[path] ? { path, namespace: 'fixture' } : undefined); b.onLoad({ filter: /.*/, namespace: 'fixture' }, ({ path }) => ({ contents: stubs[path], loader: 'jsx', resolveDir: repo })); } }] });
  return result.outputFiles[0].text;
}

// a small in-page server: the question's answer is 75, its check's 96
const server = `
window.sharedLog=[];
window.makeShared=({paidToday})=>{
 let first=null,via=null,step=0,check=null;const rewards={correctXP:10000,correctCoins:1000,guidedXP:5000,guidedCoins:0};
 const steps=[{title:'Start from 80',prompt:'What is 25% of 80?',options:[{label:'15'},{label:'20'}],correct:1},{title:'Then grow it',prompt:'25% of 60?',options:[{label:'15'},{label:'20'}],correct:0}];
 const snap=()=>{const paying=paidToday<3;const unpaid=!!via&&!paying;const reward=!via||unpaid?{xp:0,coins:0}:via==='correct'?{xp:10000,coins:1000}:{xp:5000,coins:0};
  return {kind:'shared',challengeId:101,sharer:{id:2,username:'Stealth'},dayIndex:1,nextDay:Date.now()+864e5,rewards,paidPerDay:3,paidToday:paidToday+(via&&!unpaid?1:0),
   balances:{twinkleXP:reward.xp,twinkleCoins:reward.coins},...(via&&!unpaid?{dailyTaskStatus:{aiStory:{isPassed:true}}}:{}),
   assignment:{id:55,dayIndex:1,title:'Two discounts',skill:'Percent change',question:{prompt:'A jacket costs 80 dollars; -25% then +25%. Final price?'},rewards,attempted:first!==null,firstAnswer:first,firstCorrect:first===null?null:first==='75',completedVia:via,reward,unpaid,
    ...(first!==null?{lesson:{title:'Percent of what',totalSteps:2,completedSteps:step,...(step===2?{summary:'Each percent is of the current price.'}:{}),steps:steps.slice(0,step+1).map(s=>({title:s.title,prompt:s.prompt,options:s.options}))}}:{}),
    ...(step===2?{check:{prompt:'100 dollars, -20% then +20%?'},checkResult:check===null?null:{answer:check,correct:check==='96'}}:{})}};};
 window.sharedServer=async(action,body)=>{window.sharedLog.push({action,body});
  if(action==='action'){if(body.action==='answer'&&first===null){first=body.answer;if(first==='75')via='correct';}
   if(body.action==='lesson'&&body.option===steps[body.step].correct)step=body.step+1;
   if(body.action==='check'){check=body.answer;if(check==='96'&&!via)via='guided';}}
  return snap();};
};`;

test('a shared question opens with no setup, pays its own amounts, learns from a miss and respects the daily paid limit', { timeout: 90000 }, async () => {
  const script = await compile();
  for (const engine of [chromium, webkit]) {
    const browser = await engine.launch();
    try {
      for (const width of [360, 1100]) {
        for (const paidToday of [0, 3]) {
          const page = await browser.newPage({ viewport: { width, height: 900 } });
          page.setDefaultTimeout(6000);
          const errors = []; page.on('pageerror', e => errors.push(e.message));
          await page.route('**/*', route => route.request().url() === 'http://localhost:3000/'
            ? route.fulfill({ contentType: 'text/html', body: `<style>${readFileSync(path.join(repo, 'src/styles.css'), 'utf8')}main{padding:24px 14px}</style><div id="root"></div>` })
            : route.abort());
          await page.goto('http://localhost:3000/');
          await page.addScriptTag({ content: server });
          await page.evaluate(p => window.makeShared({ paidToday: p }), paidToday);
          await page.addScriptTag({ content: script });
          await page.getByRole('heading', { name: 'Try this question' }).waitFor();
          assert.ok(await page.getByText('STEALTH CLEARED THIS').isVisible());
          assert.equal(await page.getByRole('button', { name: 'My focus' }).count(), 0, 'no preferences on someone else’s question');
          assert.equal(await page.getByText('What are you working toward?').count(), 0, 'no setup');
          assert.deepEqual(await page.evaluate(() => window.sharedLog[0]), { action: 'open', body: { challengeId: 101 } });
          if (paidToday === 0) {
            assert.ok(await page.getByText('10,000', { exact: true }).first().isVisible());
            assert.ok(await page.getByText('5,000', { exact: true }).first().isVisible());
          } else {
            assert.ok(await page.getByText(/paid questions are used up/).isVisible());
          }
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `overflow ${engine.name()} ${width}`);
          if (artifacts) { mkdirSync(artifacts, { recursive: true }); await page.screenshot({ path: path.join(artifacts, `${engine.name()}-${width}-${paidToday}-open.png`), fullPage: true }); }
          // miss, learn, pass the check
          await page.getByRole('textbox').fill('80');
          await page.getByRole('button', { name: 'Submit answer' }).click();
          await page.getByText('Not quite — let’s work it out.').waitFor();
          assert.deepEqual(await page.evaluate(() => window.sharedLog.at(-1).body), { attemptId: 55, action: 'answer', answer: '80' });
          await page.getByRole('button', { name: '20', exact: true }).click();
          await page.getByRole('button', { name: 'Next step' }).click();
          await page.getByRole('button', { name: '15', exact: true }).click();
          await page.getByRole('button', { name: 'Try the understanding check' }).click();
          await page.getByRole('textbox').fill('96');
          await page.getByRole('button', { name: 'Check my understanding' }).click();
          await page.getByRole('heading', { name: 'You worked it out.' }).waitFor();
          if (paidToday === 0) {
            assert.ok(await page.getByText('A CLEARED ✓').isVisible());
            assert.deepEqual(await page.evaluate(() => window.balances), { twinkleXP: 5000, twinkleCoins: 0 });
            assert.equal(await page.evaluate(() => window.daily.newStats.dailyTaskStatus.aiStory.isPassed), true);
          } else {
            assert.ok(await page.getByText('CLEARED', { exact: true }).isVisible());
            assert.ok(await page.getByText(/paid questions were already used/).isVisible());
            assert.equal(await page.evaluate(() => window.daily), undefined, 'an unpaid clear never clears A');
          }
          assert.ok(await page.getByText(/Your own Today’s Challenge is separate/).isVisible());
          if (artifacts) await page.screenshot({ path: path.join(artifacts, `${engine.name()}-${width}-${paidToday}-done.png`), fullPage: true });
          assert.ok(await page.evaluate(() => window.sharedLog.every(l => l.action === 'open' || Number.isInteger(l.body.attemptId) && !('assignmentId' in l.body))));
          assert.deepEqual(errors, []);
          await page.close();
        }
      }
    } finally { await browser.close(); }
  }
});
