import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const { chromium, webkit } = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const artifacts = process.env.ARENA_LIMIT_ARTIFACTS;
const fixture = `
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {library} from '@fortawesome/fontawesome-svg-core';
import {faCoins,faSpinner,faArrowLeft,faTrophy} from '@fortawesome/pro-solid-svg-icons';
import CoverPage from './src/containers/Arena/CoverPage';
import Challenge from './src/containers/Arena/Challenge';
import Battles from './src/containers/Arena/Battles';
import {getAssistantDock,getAssistantAskContext,closeAssistantDock} from './src/containers/App/AssistantDock/dockState';
library.add(faCoins,faSpinner,faArrowLeft,faTrophy);
const offer={token:'fixture-token',baseXP:200000,xp:300000,baseCoins:4000,coins:6000,target:10,max:16};
const exam={key:'c1-advanced',name:'C1 Advanced',nameEn:'C1 Advanced',code:'X1',language:'en',listening:false,aiMarked:false,
 difficulties:['easy','normal','hard'].map(difficulty=>({difficulty,ready:true,slain:true})),
 lengths:[{length:'short',items:12,minutes:20,rewards:{normal:offer}}],
 ageLevel:19};
const challenge={id:9,examKey:exam.key,examName:exam.name,examNameEn:exam.name,code:exam.code,codeLabel:null,
 length:'short',difficulty:'normal',sharer:{id:2,username:'Fixture member',profilePicUrl:null}};
function App(){
 const [c,setCase]=useState({surface:'cover',phase:'prepare',code:'ARENA_DAILY_EXAM_LIMIT',sequence:0});
 window.showFixture=next=>{window.calls={prepare:0,start:0};window.opened=null;window.chosen=null;closeAssistantDock();window.cancelled=false;flushSync(()=>setCase(prev=>({...next,sequence:prev.sequence+1})));};
 window.calls ||= {prepare:0,start:0};
 const error=()=>({code:c.code});
 const reward=()=>c.mastery?{...offer,mastery:{clears:24,required:25,completed:false,solo:true,pending:false},masteryReward:{target:14,xp:5333400,coins:106660,maxXP:6000000,maxCoins:120000},xp:6000000,coins:120000}:offer;
 const prepare=async()=>{
  window.calls.prepare++;
  if(c.phase==='prepare' || (c.phase==='retry' && window.calls.prepare===1))throw error();
  if(c.existing)return {alreadyTaken:true,battleId:42,status:c.existing};
  return {preview:reward()};
 };
 const start=async(...args)=>{window.calls.start++;if(c.phase==='start')throw error();window.chosen=typeof args[0]==='object'?args[0].companion:args[2];return {battle:{id:42,status:'open',exam:{nameEn:exam.name},companion:c.mastery?'solo':window.chosen,mastery:c.mastery?{solo:true}:undefined},items:[{no:1}]};};
 window.dock=()=>({assistant:getAssistantDock(),context:getAssistantAskContext()});
 window.requests={prepareArenaBattle:prepare,startArenaBattle:start,startArenaChallenge:start,
  loadArenaState:async()=>({exams:[{...exam,...(c.locked?{access:{message:'First clear a Full Normal or Hard SAT Reading and Writing exam.',prerequisites:[{key:'sat-rw',name:'SAT Reading and Writing'}]}}:{}),lengths:exam.lengths.map(l=>({...l,rewards:{normal:{...offer,...(c.wait?{nextPaperAvailable:false}:{} )}}}))}],recent:[],abilities:[],examsToday:0,examsPerDay:1}),
  loadArenaChallenge:async()=>({challenge,board:[],myBattle:c.existing?{id:42,status:c.existing}:null,canTake:!c.existing,isSharer:false})};
 const open=id=>{window.opened=id;};
 return <main key={c.sequence}>
  {c.surface==='cover'?<CoverPage exam={exam} length={c.mastery?"full":"short"} difficulty={c.mastery?"hard":"normal"} starting={false}
   onStart={async(token,companion)=>{const result=await start({previewToken:token,companion});open(result.battle.id);return result;}} onOpenExisting={open} onCancel={()=>{window.cancelled=true;}}/>
  :c.surface==='challenge'?<Challenge challengeId={9} onOpenBattle={open}/>
  :<Battles examKey={exam.key} onStart={open} onBrowseExams={()=>{}} onOpenRecords={key=>{window.records=key;}}/>}
 </main>;
}createRoot(document.getElementById('root')).render(<App/>);`;

async function compile() {
  const result = await build({
    stdin: { contents: fixture, resolveDir: repo, loader: 'tsx' }, bundle: true, write: false,
    format: 'iife', platform: 'browser', alias: { '~': path.join(repo, 'src') },
    define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"development"' },
    plugins: [{ name: 'arena-limit-fixture', setup(b) {
      b.onResolve({ filter: /^~\/contexts$/ }, () => ({ path: 'context', namespace: 'fixture' }));
      b.onResolve({ filter: /^(~\/components\/(ProfilePic|Buttons\/AskAgentButton)|\.\/Records|\.\/League|\.\/Rising|\.\/AIStory\/Game\/ArenaGoals)$/ }, () => ({ path: 'unrelated', namespace: 'fixture' }));
      b.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({
        contents: args.path === 'context' ? 'export const useAppContext=s=>s({requestHelpers:window.requests});export const useChatContext=s=>s({state:{zeroChannelId:1,cielChannelId:2}});'
          : 'export default function Stub(){return null};export const TodayArenaGoals=Stub;', loader: 'jsx', resolveDir: repo
      }));
    } }]
  });
  return `<!doctype html><html><meta name="viewport" content="width=device-width, initial-scale=1"><style>${readFileSync(path.join(repo, 'src/styles.css'), 'utf8')}body{background:#faf5e8;font-family:Arial,sans-serif}main{max-width:1100px;margin:16px auto;padding:16px}</style><body><div id="root"></div><script>${result.outputFiles[0].text.replaceAll('</script', '<\\/script')}</script></body></html>`;
}

test('covers and shared challenges explain admission limits, keep review and retry usable, and fit phones', { timeout: 90000 }, async () => {
  const html = await compile();
  if (artifacts) mkdirSync(artifacts, { recursive: true });
  for (const engine of [chromium, webkit]) {
    const browser = await engine.launch();
    try {
      for (const width of [360, 1440]) {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        page.setDefaultTimeout(6000);
        const errors = []; page.on('pageerror', e => errors.push(e.message));
        await page.route('**/*', route => route.request().url() === 'http://localhost:3000/'
          ? route.fulfill({ contentType: 'text/html', body: html }) : route.fulfill({ status: 204, body: '' }));
        await page.goto('http://localhost:3000/');
        await page.waitForFunction(() => !!window.showFixture);
        for (const surface of ['cover', 'challenge']) {
          const startButton = () => page.getByRole('button', { name: surface === 'cover' ? 'Start' : 'Challenge!', exact: true });
          for (const phase of ['prepare', 'start']) for (const code of ['ARENA_DAILY_EXAM_LIMIT', 'ARENA_NEXT_PAPER_PENDING', 'ARENA_MASTERY_MARKING_PENDING', 'ARENA_PREREQUISITE_REQUIRED']) {
            await page.evaluate(c => window.showFixture(c), { surface, phase, code });
            if (phase === 'start') {
              await page.getByText(/One new exam per day/).waitFor();
              await startButton().click();
            }
            const alert = page.getByRole('alert');
            await alert.waitFor();
            assert.match(await alert.innerText(), ({ARENA_DAILY_EXAM_LIMIT:/already started today/,ARENA_NEXT_PAPER_PENDING:/next different paper/,ARENA_MASTERY_MARKING_PENDING:/still being marked/,ARENA_PREREQUISITE_REQUIRED:/prerequisite exam/})[code]);
            assert.equal(await startButton().isEnabled(), false);
            assert.equal(await page.getByRole('button', { name: 'Try again', exact: true }).count(), 0);
            assert.equal(await page.getByText('Checking available rewards…', { exact: true }).count(), 0);
            assert.equal(await page.evaluate(() => window.opened), null);
            assert.deepEqual(await page.evaluate(() => window.calls), { prepare: 1, start: phase === 'start' ? 1 : 0 }, 'Limit errors must not trigger a refresh loop');
            const fit = await alert.evaluate(el => { const r=el.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth+1 && document.documentElement.scrollWidth <= innerWidth+1; });
            assert.ok(fit, `${engine.name()} ${width} ${surface}: limit text clipped`);
            if (artifacts && phase === 'start') await page.screenshot({ path: path.join(artifacts, `${engine.name()}-${surface}-${width}-${code}.png`), fullPage: true });
            if (surface === 'cover') { await page.getByRole('button', { name: 'Not now' }).click(); assert.equal(await page.evaluate(() => window.cancelled), true); }
          }
          // A real network failure still has a working retry, then can start.
          await page.evaluate(c => window.showFixture(c), { surface, phase: 'retry', code: 'NETWORK_ERROR' });
          await page.getByRole('button', { name: 'Try again', exact: true }).click();
          await page.getByText(/One new exam per day/).waitFor();
          await startButton().click();
          await page.waitForFunction(() => window.opened === 42);
          for (const existing of ['open', 'finished']) {
            await page.evaluate(c => window.showFixture(c), { surface, existing });
            const name = existing === 'finished' ? 'See my result' : surface === 'cover' ? 'Resume exam' : 'Resume my battle';
            await page.getByRole('button', { name, exact: true }).click();
            assert.equal(await page.evaluate(() => window.opened), 42);
            assert.equal(await page.evaluate(() => window.calls.start), 0, 'Review/resume must open the saved sitting');
          }
        }
        for (const surface of ['cover', 'challenge']) {
          await page.evaluate(c => window.showFixture(c), { surface });
          await page.getByRole('radio', { name: 'Do this with Ciel' }).click();
          await page.getByText(/usual AI Energy/).waitFor();
          await page.getByRole('button', { name: surface === 'cover' ? 'Start' : 'Challenge!', exact: true }).click();
          await page.waitForFunction(() => window.opened === 42);
          assert.equal(await page.evaluate(() => window.chosen), 'Ciel');
          if (surface === 'challenge') {
            assert.deepEqual(await page.evaluate(() => window.dock()), { assistant:'Ciel',context:{kind:'arenaBattleItem',id:42,no:1,label:'C1 Advanced · question 1',path:'/arena?mode=arena&battle=42'} });
          }
          await page.evaluate(c => window.showFixture(c), { surface, mastery: true });
          await page.getByText('This is your solo mastery run.', { exact: true }).waitFor();
          assert.equal(await page.getByRole('radio', { name: 'Do this with Ciel' }).count(), 0);
          assert.match(await page.locator('main').innerText(), /24 \/ 25 clears/);
          assert.match(await page.locator('main').innerText(), /Mastery clear/);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
          if (artifacts) await page.screenshot({ path: path.join(artifacts, `${engine.name()}-mastery-${surface}-${width}.png`), fullPage: true });
          await page.getByRole('button', { name: surface === 'cover' ? 'Start' : 'Challenge!', exact: true }).click();
          await page.waitForFunction(() => window.opened === 42);
          assert.equal(await page.evaluate(() => window.chosen), 'solo');
          assert.equal(await page.evaluate(() => window.dock().assistant), null);
        }
        await page.evaluate(() => window.showFixture({ surface:'catalog', locked:true }));
        await page.getByText(/First clear a Full Normal/).waitFor();
        assert.equal(await page.getByRole('button', { name: /^Short/ }).isDisabled(), true);
        assert.match(await page.getByRole('link', { name: /SAT Reading/ }).getAttribute('href'), /sat-rw/);
        await page.getByRole('button', { name: 'Records', exact: true }).click();
        assert.equal(await page.evaluate(() => window.records), 'c1-advanced');
        await page.evaluate(() => window.showFixture({ surface:'catalog', wait:true }));
        await page.getByText(/next different paper/).waitFor();
        assert.equal(await page.getByRole('button', { name: /^Short/ }).isDisabled(), true);
        if (artifacts) await page.screenshot({ path: path.join(artifacts, `${engine.name()}-waiting-${width}.png`), fullPage: true });
        assert.deepEqual(errors, []);
        await page.close();
      }
    } finally { await browser.close(); }
  }
});
