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
const artifacts = process.env.ARENA_EXAM_SCROLL_ARTIFACTS;
const expectBroken = process.env.ARENA_EXAM_SCROLL_EXPECT_BROKEN === '1';
const fixture = `
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import {library} from '@fortawesome/fontawesome-svg-core';
import {faArrowLeft,faClock,faCheck,faChevronUp,faChevronDown,faSpinner,faTrophy} from '@fortawesome/pro-solid-svg-icons';
import BattleRunner from './src/containers/Arena/BattleRunner';
import {readWebsiteAgentPage} from './src/helpers/websiteAgentPage';
window.readAgent=readWebsiteAgentPage;
library.add(faArrowLeft,faClock,faCheck,faChevronUp,faChevronDown,faSpinner,faTrophy);
window.mode='finished';window.solo=false;window.parentChecks=0;window.saves=[];window.submits=[];window.exits=0;
function data(){const now=Math.floor(Date.now()/1000);return {
 battle:{id:70,companion:'Ciel',...(window.solo?{mastery:{clearsBefore:24,required:25,solo:true,target:62,completed:false}}:{}),exam:{key:'kmc-pre-middle1',name:'KMC 예선 중1',nameEn:'KMC Preliminary Middle 1',language:'ko',code:'M1',codeLabel:null,pointTags:'all',layout:'problem',choices:0},length:'full',difficulty:'hard',mode:'battle',status:window.mode,minutes:120,serverNow:now,startedAt:now,deadlineAt:window.mode==='open'?now+7200:null,finishedAt:window.mode==='finished'?now:null,rawPoints:12,maxPoints:100,grade:null,estimate:null,scaleReport:window.scaleReport,won:false,winAt:62,rewardOffer:{target:62,max:100},reward:{xpEarned:0,coinsEarned:0,rewardStatus:'below_target'}},
 passages:{},items:Array.from({length:40},(_,i)=>({no:i+1,type:'math.integer',section:'main',points:3,passageId:null,stem:'Question '+(i+1)+'. 다음 조건을 만족하는 정수의 개수를 구하시오. '+ '문제의 모든 조건을 확인하고 알맞은 답을 쓰시오. '.repeat(4),body:'검토할 내용과 수식입니다. '+ '자연수와 정수의 관계를 살펴보세요. '.repeat(3),choices:[],typed:'integer',answer:window.mode==='finished'?'28':null,...(window.mode==='finished'?{key:'28',correct:true,review:{explanation:'정답 해설입니다. '+ '문제의 조건에 맞는 정수를 하나씩 세어 봅니다. '.repeat(8)}}:{})}))
};}
window.requests={loadArenaBattle:async()=>data(),saveArenaAnswer:async args=>{window.saves.push(args);return {saved:true,answer:args.answer};},submitArenaBattle:async()=>{window.submits.push(1);await new Promise(resolve=>window.finishSubmit=resolve);window.mode='finished';return data();},loadArenaParentPrompt:async()=>{window.parentChecks++;return {eligible:false}}};
function Fixture(){const [key,setKey]=useState(0);window.changeMode=mode=>{window.mode=mode;setKey(x=>x+1);};return <BattleRunner key={key} battleId={70} onExit={()=>window.exits++}/>;}
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
    '~/components/Buttons/AskAgentButton': 'import React from "react";export default ({assistant,context})=> <button data-question={context?.no}>Ask {assistant||"Zero"}</button>;',
    './EssayAnswer': 'export default ()=>null;',
    './SpokenAnswer': 'export default ()=>null;',
    './MarkReview': 'export default ()=>null;'
  };
  const result = await build({
    stdin: { contents: fixture, resolveDir: repo, loader: 'tsx' }, bundle: true, write: false,
    format: 'iife', platform: 'browser', alias: { '~': path.join(repo, 'src') },
    define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"development"' },
    plugins: [{ name: 'exam-fixture-services', setup(builder) {
      builder.onResolve({ filter: /.*/ }, ({ path }) => stubs[path] ? { path, namespace: 'fixture' } : undefined);
      builder.onLoad({ filter: /.*/, namespace: 'fixture' }, ({ path }) => ({ contents: stubs[path], loader: 'jsx', resolveDir: repo }));
    } }]
  });
  bundle = result.outputFiles[0].text;
  return bundle;
}

for (const [name, engine] of Object.entries({ chromium, webkit })) {
  test(`exam and completed paper scroll inside the screen (${name})`, { timeout: 60000 }, async () => {
    const script = await compile();
    const browser = await engine.launch();
    try {
      for (const [width, height, longResult] of [[390,844,false], [1024,844,false], [1280,844,false], [844,390,false], [390,844,true], [844,390,true]]) {
        const page = await browser.newPage({ viewport: { width, height }, hasTouch: width < 1100 });
        page.setDefaultTimeout(6000);
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/*', route => route.request().url() === 'http://localhost:3000/'
          ? route.fulfill({ contentType: 'text/html', body: `<style>${readFileSync(path.join(repo, 'src/styles.css'), 'utf8')}</style><div id="react-view"></div>` })
          : route.abort());
        await page.goto('http://localhost:3000/');
        if (longResult) await page.evaluate(() => {
          window.scaleReport = {
            skills: ['reading', 'useOfEnglish', 'listening', 'writing'].map(key => ({key,label:key,raw:12,max:50,pending:false,range:{low:160,high:170}})),
            average: {skills:4,low:160,high:170}
          };
        });
        await page.addScriptTag({ content: script });
        for (const mode of ['finished', 'open']) {
          if (mode === 'open') await page.evaluate(() => window.changeMode('open'));
          const paper = page.locator('fieldset main');
          await paper.waitFor();
          await page.waitForFunction(mode => document.querySelector('header')?.innerText.includes(mode === 'open' ? 'Leave' : 'Done'), mode);
          const metrics = await paper.evaluate(el => {el.scrollTop=600;const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,clientHeight:el.clientHeight,scrollHeight:el.scrollHeight,scrollTop:el.scrollTop,viewport:innerHeight};});
          if (artifacts) {
            mkdirSync(artifacts, { recursive: true });
            const variant = `${name}-${width}x${height}-${mode}${longResult ? '-long-result' : ''}`;
            writeFileSync(path.join(artifacts, `${variant}.json`), JSON.stringify(metrics,null,2));
            await page.screenshot({ path: path.join(artifacts, `${variant}.png`) });
          }
          if (expectBroken) {
            assert.ok(metrics.bottom > metrics.viewport, 'baseline paper extends below the screen');
            assert.equal(metrics.scrollTop, 0, 'baseline paper itself cannot scroll');
            continue;
          }
          assert.ok(metrics.clientHeight > 100 && metrics.bottom <= metrics.viewport, JSON.stringify(metrics));
          assert.ok(metrics.scrollHeight > metrics.clientHeight && metrics.scrollTop > 0, 'paper must own a real scroll range');
          if (mode === 'finished' && longResult) {
            const result = page.getByRole('region', { name: 'Exam results' });
            await result.focus();
            await page.keyboard.press('End');
            await result.getByRole('button', { name: 'Ask Ciel to coach me' }).scrollIntoViewIfNeeded();
            const bounds = await result.getByRole('button', { name: 'Ask Ciel to coach me' }).boundingBox();
            const region = await result.boundingBox();
            assert.ok(bounds.y >= region.y && bounds.y + bounds.height <= region.y + region.height + 1, 'bottom result actions remain reachable');
            assert.ok(region.y + region.height < height, 'result panel leaves room for the paper');
          }
          await paper.evaluate(el => { el.scrollTop=0; });
          await paper.hover({ position: { x: 60, y: Math.min(150, metrics.clientHeight / 2) } });
          await page.mouse.wheel(0, 600);
          await page.waitForFunction(() => document.querySelector('fieldset main').scrollTop > 20);
          // Actual touch input on Chromium, in addition to both engines' layout/scroll checks.
          if (name === 'chromium' && width === 390) {
            await paper.evaluate(el => { el.scrollTop=0; });
            const session = await page.context().newCDPSession(page);
            const r = await paper.boundingBox();
            const x = r.x + r.width / 2, y = r.y + Math.min(400, r.height - 30);
            await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
            for (let step=1;step<=6;step++) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y:y-step*40 }] });
            await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
            await page.waitForFunction(() => document.querySelector('fieldset main').scrollTop > 20);
            await session.detach();
          }
          await paper.evaluate(el => {el.scrollTop=el.scrollHeight;});
          const last = paper.locator('article').last();
          const lastBounds = await last.boundingBox();
          assert.ok(lastBounds.y < height && lastBounds.y + lastBounds.height > 0, 'last question is reachable');
          if (mode === 'open') {
            const answer = last.locator('input');
            await answer.fill('28');
            await answer.press('Tab');
            await page.waitForFunction(() => window.saves.some(save=>save.no===40 && save.answer==='28'));
            if (width === 390) {
              await page.getByRole('button', { name: /OMR 답안지/ }).click();
              const omr = page.locator('aside');
              await page.waitForFunction(() => document.querySelector('aside').getBoundingClientRect().height > 100);
              const omrRows = omr.locator('div').filter({ has: page.locator('input') });
              assert.ok(await omrRows.count() > 0);
              await page.getByRole('button', { name: /OMR 답안지/ }).click();
            }
            await page.locator('header').getByRole('button', { name: 'Submit', exact: true }).click();
            await page.getByRole('dialog').getByRole('button', { name: 'Submit', exact: true }).click();
            await page.waitForFunction(() => window.submits.length === 1);
            assert.equal(await page.locator('fieldset').evaluate(el=>el.disabled), true, 'submission still locks every answer control');
            await page.evaluate(() => window.finishSubmit());
            await page.getByRole('button', { name: 'Done', exact: true }).waitFor();
          }
        }
        if (width === 390 && !longResult && !expectBroken) {
          await page.evaluate(() => window.changeMode('open'));
          await page.locator('fieldset [data-agent-no-play="arenaBattle"]').waitFor();
          assert.equal(await page.getByRole('button', { name:'Ask Ciel',exact:true }).count(), 40);
          const visible = await page.evaluate(() => window.readAgent());
          assert.match(visible.text, /Question 1/);
          assert.equal(await page.getByRole('button', {name:'Ask Ciel',exact:true}).first().getAttribute('data-question'), '1');
          await page.evaluate(() => {window.solo=true;window.changeMode('open');});
          await page.locator('[data-agent-off-limits="arenaBattle"]').waitFor();
          assert.equal(await page.getByRole('button', { name:/^Ask (Zero|Ciel)$/,exact:true }).count(), 0);
          const hidden = await page.evaluate(() => window.readAgent());
          assert.ok(hidden.offLimits.includes('arenaBattle'));
          assert.doesNotMatch(hidden.text, /Question 1/);
          if (artifacts) await page.screenshot({ path:path.join(artifacts, `${name}-solo-mastery-live.png`) });
          await page.evaluate(() => window.changeMode('finished'));
          await page.getByRole('button',{name:'Done',exact:true}).waitFor();
          assert.equal(await page.locator('[data-agent-off-limits="arenaBattle"]').count(), 0);
          assert.ok(await page.getByRole('button', {name:/^Ask (Zero|Ciel)$/,exact:true}).count() > 0);
          assert.equal(await page.evaluate(() => window.parentChecks), 0, 'An unsuccessful solo attempt offers no parent email');
        }
        assert.deepEqual(errors, []);
        await page.close();
      }
    } finally { await browser.close(); }
  });
}
