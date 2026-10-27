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
library.add(faCoins,faSpinner,faArrowLeft,faTrophy);
const offer={token:'fixture-token',baseXP:200000,xp:300000,baseCoins:200,coins:300,target:10,max:16};
const exam={key:'c1-advanced',name:'C1 Advanced',nameEn:'C1 Advanced',code:'X1',language:'en',listening:false,aiMarked:false,
 difficulties:['easy','normal','hard'].map(difficulty=>({difficulty,ready:true,slain:true})),
 lengths:[{length:'short',items:12,minutes:20,rewards:{normal:offer}}],
 cooldown:{availableAgainDayIndex:1767,availableAt:Date.UTC(2026,10,3)}};
const challenge={id:9,examKey:exam.key,examName:exam.name,examNameEn:exam.name,code:exam.code,codeLabel:null,
 length:'short',difficulty:'normal',sharer:{id:2,username:'Fixture member',profilePicUrl:null}};
function App(){
 const [c,setCase]=useState({surface:'cover',phase:'prepare',code:'ARENA_DAILY_EXAM_LIMIT',sequence:0});
 window.showFixture=next=>{window.calls={prepare:0,start:0};window.opened=null;window.cancelled=false;flushSync(()=>setCase(prev=>({...next,sequence:prev.sequence+1})));};
 window.calls ||= {prepare:0,start:0};
 const error=()=>({code:c.code,message:c.code==='ARENA_EXAM_COOLDOWN'
  ?'You cleared this exam. All its lengths and difficulties unlock again on 2026-11-03 at 9:00 AM Korea time (00:00 UTC). Your result and review are still available.'
  :'Fixture unavailable'});
 const prepare=async()=>{
  window.calls.prepare++;
  if(c.phase==='prepare' || (c.phase==='retry' && window.calls.prepare===1))throw error();
  if(c.existing)return {alreadyTaken:true,battleId:42,status:c.existing};
  return {preview:offer};
 };
 const start=async()=>{window.calls.start++;if(c.phase==='start')throw error();return {battle:{id:42,status:'open'}};};
 window.requests={prepareArenaBattle:prepare,startArenaBattle:start,startArenaChallenge:start,
  loadArenaState:async()=>({exams:[exam],recent:[],abilities:[],examsToday:0,examsPerDay:1}),
  loadArenaChallenge:async()=>({challenge,board:[],myBattle:c.existing?{id:42,status:c.existing}:null,canTake:!c.existing,isSharer:false})};
 const open=id=>{window.opened=id;};
 return <main key={c.sequence}>
  {c.surface==='cover'?<CoverPage exam={exam} length="short" difficulty="normal" starting={false}
   onStart={async()=>{const result=await start();open(result.battle.id);return result;}} onOpenExisting={open} onCancel={()=>{window.cancelled=true;}}/>
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
        contents: args.path === 'context' ? 'export const useAppContext=s=>s({requestHelpers:window.requests});'
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
          for (const phase of ['prepare', 'start']) for (const code of ['ARENA_DAILY_EXAM_LIMIT', 'ARENA_EXAM_COOLDOWN']) {
            await page.evaluate(c => window.showFixture(c), { surface, phase, code });
            if (phase === 'start') {
              await page.getByText(/One new exam per day/).waitFor();
              await startButton().click();
            }
            const alert = page.getByRole('alert');
            await alert.waitFor();
            assert.match(await alert.innerText(), code === 'ARENA_EXAM_COOLDOWN' ? /2026-11-03/ : /already started today/);
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
        await page.evaluate(() => window.showFixture({ surface: 'catalog', phase: 'start', code: 'ARENA_EXAM_COOLDOWN' }));
        await page.getByText(/Boss cleared! New sittings unlock Nov 3/).waitFor();
        await page.getByRole('button', { name: 'Records', exact: true }).click();
        assert.equal(await page.evaluate(() => window.records), 'c1-advanced');
        if (artifacts) await page.screenshot({ path: path.join(artifacts, `${engine.name()}-catalog-${width}.png`), fullPage: true });
        await page.getByRole('button', { name: /^Short/ }).click();
        await page.getByText(/One new exam per day/).waitFor();
        await page.getByRole('button', { name: 'Start', exact: true }).click();
        await page.getByRole('alert').waitFor();
        assert.match(await page.getByRole('alert').innerText(), /2026-11-03/);
        assert.equal(await page.getByRole('dialog', { name: 'Exam cover' }).count(), 1, 'The catalog must preserve the cover and its canonical limit');
        assert.deepEqual(errors, []);
        await page.close();
      }
    } finally { await browser.close(); }
  }
});
