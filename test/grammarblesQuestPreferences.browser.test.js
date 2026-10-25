import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { build, stop } from 'esbuild';

const require = createRequire(import.meta.url);
const { chromium, webkit } = require(
  process.env.PLAYWRIGHT_MODULE ||
    '/Users/mikey/.npm-packages/lib/node_modules/playwright'
);
const repo = fileURLToPath(new URL('..', import.meta.url));
const artifacts =
  process.env.GRAMMARBLES_ARTIFACTS ||
  path.resolve(repo, '../work/grammarbles-review-music-20261009');
const questionArtifacts =
  process.env.GRAMMARBLES_QUESTION_ARTIFACTS ||
  path.resolve(repo, '../work/grammarbles-cloudstar-20261009');
const base = './src/containers/Home/GrammarGameModal/';
// Local media is deliberately gitignored. Standalone CI uses the same
// content-hashed, public CDN assets without downloading/decoding full songs.
const mediaBase =
  process.env.GRAMMARBLES_MEDIA_BASE ||
  'https://d3jvoamd2k4p0s.cloudfront.net/grammar-quest/v1/';
const mediaCache = new Map();
async function readMedia(pathname, metadataOnly = false) {
  const cacheKey = `${metadataOnly}:${pathname}`;
  if (!mediaCache.has(cacheKey)) {
    mediaCache.set(cacheKey, readUncachedMedia());
    async function readUncachedMedia() {
      const localPath = path.join(repo, 'public', pathname);
      try {
        if (metadataOnly) {
          assert.ok(statSync(localPath).size > 0);
          return null;
        }
        return readFileSync(localPath);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      const response = await fetch(
        new URL(pathname.slice('/gq-media/'.length), mediaBase),
        {
          method: metadataOnly ? 'HEAD' : 'GET',
          signal: AbortSignal.timeout(15000)
        }
      );
      assert.ok(
        response.ok,
        `Published Quest asset ${pathname}: ${response.status}`
      );
      if (metadataOnly) {
        assert.ok(Number(response.headers.get('content-length')) > 0);
        return null;
      }
      return Buffer.from(await response.arrayBuffer());
    }
  }
  return mediaCache.get(cacheKey);
}
const contexts = `
import {useSyncExternalStore} from 'react';
let state = {myState:{userId:7,settings:JSON.parse(localStorage.getItem('fixtureAccount') || '{}')}};
const listeners = new Set();
const subscribe = fn => {listeners.add(fn);return () => listeners.delete(fn)};
window.musicRequests = []; window.challengeRequests = []; window.balanceUpdates = []; window.startRequests=[]; window.answerRequests=[];
window.setAccount = settings => {state={myState:{userId:7,settings}};localStorage.setItem('fixtureAccount',JSON.stringify(settings));listeners.forEach(fn=>fn())};
const app = {user:{actions:{onSetUserState:update=>{window.balanceUpdates.push(update);window.setAccount(update.newState.settings)}}},requestHelpers:{
 updateGrammarblesSettings: choice=>new Promise((resolve,reject)=>window.musicRequests.push({choice,resolve,reject})),
 loadGrammarQuestState:async()=>structuredClone(window.serverQuestState || {worlds:[{id:1,unlocked:true,nodes:[]}],nemesis:[],rewardedRunsLeft:3}),
 startGrammarQuestRun:async({nodeId})=>{window.startRequests.push(nodeId);const world=window.serverQuestState.worlds.find(w=>w.nodes.some(n=>n.id===nodeId));const node=world.nodes.find(n=>n.id===nodeId);return {runId:1,nodeId,worldId:world.id,kind:node.kind,rules:{mode:node.kind==='stop'?'practice':'boss'},questions:[]}},
 loadGrammarReview:async()=>({items:[window.reviewItem],hasMore:false}),
 answerGrammarQuestQuestion:async data=>{window.answerRequests.push(data);return typeof window.questAnswer==='function'?window.questAnswer(data):window.questAnswer},
 challengeGrammarQuestion:async data=>{window.challengeRequests.push(data);return {justified:false,explanation:'The reviewer confirmed the answer.'}}
}};
export const useAppContext = select => select(app);
export const useKeyContext = select => useSyncExternalStore(subscribe,()=>select(state));
export const useNotiContext = select => select({state:{todayStats:{}},actions:{onUpdateTodayStats(){},onApplyTodayStatsProgress(){}}});
export const useViewContext = select => select({state:{aiFeaturesDisabled:window.aiDisabled || false}});
`;
const fixture = `
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import Quest from '${base}Quest';
import MarbleRunScreen from '${base}Quest/MarbleRunScreen';
import MultiTapQuestion from '${base}Quest/MultiTapQuestion';
import Result from '${base}Quest/Result';
import Review from '${base}Review';
import {setMusicEnabled} from '${base}Quest/MarbleRun/music';
import '${base}Quest/MarbleRun/level/enemies';
import '${base}Quest/MarbleRun/level/obstacles/formats';
import {obstacleMaker} from '${base}Quest/MarbleRun/level/obstacles/registry';
// Snapshot of the public map fields from the API catalog, c6017dfa (2026-10-10).
// Keep the UI fixture runnable from a standalone website checkout.
import QUEST_MAP from './test/fixtures/grammarQuestMap.json';
window.setFixtureMusic=on=>setMusicEnabled(on,{fromAccount:true});
window.stompAnimationOutcome=mask=>{
 const entities=[];
 const obstacle=obstacleMaker('stompers')({x:100,enemyKind:()=> 'beetle',add(){},entity(e){entities.push(e);return e}});
 const marble={hint:mask,groundAt:()=>309,arc:(from,to,high,k)=>({x:from+(to-from)*k,y:200}),place(){},fx:{burst(){},text(){}}};
 obstacle.pass.step(0,marble,0);
 for(let i=0;i<5;i++)obstacle.pass.step((i+0.99)/5,marble,(i+1)*400);
 return entities.slice(0,4).map(e=>e.alive);
};
window.resetAllMaps=()=>{
 window.serverQuestState={worlds:QUEST_MAP.map(w=>({...w,unlocked:true,sMarbles:0,nodeCount:w.nodes.length,nodes:w.nodes.map(n=>({...n,skills:undefined,unlocked:true,cleared:false,countsForGoals:true}))})),nemesis:[],ruleBook:{seen:2,total:20},rewardedRunsLeft:3};
};
localStorage.setItem('userId','7');
const question={position:0,question:'There is ____ milk in the fridge.',choices:['some','any','many','a'],skill:'some-any',skillName:'some / any / no'};
const run={runId:1,nodeId:'w1s1',kind:'stop',worldId:1,rules:{mode:'practice',goal:5},questions:[question]};
const ruleCard={skill:'some-any',nameEn:'some / any / no',nameKo:'some과 any',why:'Use “some” in positive sentences. “Some milk” is right.',whyKo:'긍정문에는 some을 써요.',wrongChoices:[{choice:'a',error:'Uses a with an uncountable noun.'}]};
window.resetMap=()=>{
 const node=(id,name,index,cleared,unlocked,kind='stop')=>({id,name,index,kind,cleared,unlocked,bestScore:cleared?100:null,grade:cleared?'S':null,countsForGoals:true,skills:kind==='stop'?[{code:'articles',nameEn:'No article before my / his / your (my car, not the my car)'},{code:'dates',nameEn:"Dates and times (July 4th, at seven o'clock)"}]:undefined});
 window.serverQuestState={worlds:[
 {id:1,key:'starter-village',name:'Starter Village',tier:'AR 1–2',unlocked:true,sMarbles:1,nodeCount:3,nodes:[node('w1s1','First stop',1,true,true),node('w1s2','Articles · Sentence patterns and word order',2,false,true),node('w1c','Village Castle',3,false,false,'castle')]},
 {id:2,key:'harbor-town',name:'Harbor Town',tier:'AR 3–5',unlocked:false,sMarbles:0,nodeCount:1,nodes:[node('w2s1','Harbor Beginnings',1,false,false)]}
 ],nemesis:[],ruleBook:{seen:2,total:20},rewardedRunsLeft:3};
};
window.finishMapNode=(nodeId,cleared)=>{
 if(!cleared)return;
 const worlds=window.serverQuestState.worlds;
 const nodes=worlds.flatMap(w=>w.nodes);const index=nodes.findIndex(n=>n.id===nodeId);
 Object.assign(nodes[index],{cleared:true,grade:'S',bestScore:100});
 if(nodes[index+1]){nodes[index+1].unlocked=true;worlds.find(w=>w.nodes.includes(nodes[index+1])).unlocked=true}
};
function Fixture(){const [view,setView]=useState({mode:'music',revision:0});
 window.showFixture=(mode,outcome='rejected',checked=true)=>{
   const id=100+view.revision;
   const saved=checked?{outcome,explanation:outcome==='accepted'?'Two choices were possible. The question was corrected.':outcome==='rejected'?'Milk is uncountable, so “There is some milk” is correct.':'This earlier review explains why “some milk” is correct.'}:null;
   window.questAnswer={position:0,isCorrect:false,selectedIndex:3,correctIndex:0,readMs:1,ruleCard,challenge:{questionId:id,checked,review:saved}};
   window.reviewItem={id,questionId:id,question:question.question,choices:question.choices,answerIndex:0,isChecked:checked,explanation:saved?.explanation,challengeReview:saved};
   flushSync(()=>setView({mode,revision:view.revision+1}));
 };
 if(view.mode==='stomp')return <MultiTapQuestion key={view.revision} {...window.stompProps} cls={{question:'prompt',choices:'choices',choice:'choice',key:'key',right:'right',wrong:'wrong'}} onPick={index=>window.answerRequests.push({choiceIndex:index})}/>;
 if(view.mode==='practice')return <MarbleRunScreen key={view.revision} run={window.fixtureRun || run} onFinished={()=>{}} onQuit={()=>{}}/>;
 if(view.mode==='results')return <Result key={view.revision} kind="fort" result={{runId:1,score:50,cleared:false,firstTryCorrect:0,size:1,xp:0,coins:0}} answers={[{...window.questAnswer,questionText:question.question}]} onBackToMap={()=>{}}/>;
 if(view.mode==='classic')return <Review key={view.revision}/>;
 return <Quest key={view.revision}/>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);
`;

async function compile({ realBoss = false } = {}) {
  const stubs = {
    '~/contexts': contexts,
    '~/helpers':
      'export const isMobile=()=>false; export const isTablet=()=>false; export const buildTodayStatsPatchFromDailyTaskStatus=x=>x;',
    '~/helpers/userDataHelpers':
      'export const getStoredItem=key=>localStorage.getItem(key); export const setStoredItem=(key,value)=>localStorage.setItem(key,value); export const removeStoredItem=key=>localStorage.removeItem(key);',
    '~/helpers/websiteAgentScreenState':
      'export const useAgentScreenState=()=>{};',
    '~/constants/sockets/api': 'export const socket={on(){},off(){}};',
    '~/components/ErrorBoundary':
      'export default function Boundary({children}){return children}',
    '~/components/Icon': 'export default function Icon(){return null}',
    '~/components/StreamingThoughtContent':
      'export default function Thought(){return null}',
    './WorldMap': `import React from 'react'; import AudioToggles from '${base}Quest/AudioToggles'; import WorldMap from '${base}Quest/WorldMap'; export default function Map(props){return window.realMap ? <div data-testid="real-map" style={{display:'flex',flex:1,minHeight:0}}><WorldMap {...props}/></div> : <div><h1>Quest map</h1><AudioToggles/></div>}`,
    './MarbleRunScreen': `import React from 'react';export default function Run({run,onFinished}){const finish=cleared=>{window.finishMapNode(run.nodeId,cleared);onFinished({runId:run.runId,cleared,score:100,firstTryCorrect:5,size:5,xp:0,coins:0,rights:5},[])};return <div><button onClick={()=>finish(true)}>Clear fixture level</button><button onClick={()=>finish(false)}>Fail fixture level</button></div>}`,
    './MarbleRun/level/runner': `export class PracticeRun {grade='B';busy=false;constructor(theme,node,events){this.events=events}resume(){}answer(){setTimeout(()=>this.events.onReady(),0)}frame(g){g.fillStyle='#223a43';g.fillRect(0,0,960,380)}}`,
    './MarbleRun/boss/fight': 'export class BossFight {} export const WRONG_PICK_PENALTY_MS=2000;',
    './MarbleRun/boss/catalog': 'export const bossFor=()=>({});',
    './MarbleRun/lab/fitPreview':
      'export const fitPreviewParam=()=>null; export const PREVIEW_QUEST_RUN=null, PREVIEW_QUEST_RESULT=null, PREVIEW_QUEST_ANSWERS=[];'
  };
  if (realBoss) {
    const fight = path.join(repo, base, 'Quest/MarbleRun/boss/fight.ts');
    stubs['./MarbleRun/boss/fight'] = `
      import {BossFight as ActualBossFight} from '${fight}';
      export {WRONG_PICK_PENALTY_MS} from '${fight}';
      export class BossFight extends ActualBossFight {
        constructor(...args){super(...args);window.fixtureFight=this;}
      }
    `;
    delete stubs['./MarbleRun/boss/catalog'];
  }
  try {
    const result = await build({
      stdin: { contents: fixture, resolveDir: repo, loader: 'tsx' },
      bundle: true,
      write: false,
      format: 'iife',
      platform: 'browser',
      jsx: 'transform',
      define: {
        'process.env.NODE_ENV': '"development"',
        'import.meta.env': '{"DEV":true}'
      },
      plugins: [
        {
          name: 'quest-fixture',
          setup(builder) {
            builder.onResolve({ filter: /.*/ }, (args) =>
              Object.hasOwn(stubs, args.path)
                ? { path: args.path, namespace: 'fixture' }
                : undefined
            );
            builder.onLoad({ filter: /.*/, namespace: 'fixture' }, (args) => ({
              contents: stubs[args.path],
              loader: 'jsx',
              resolveDir: repo
            }));
          }
        }
      ]
    });
    return result.outputFiles[0].text;
  } finally {
    stop();
  }
}

test('boss penalties survive reading grace, retries and reopening in Chromium and WebKit', { timeout: 120000 }, async () => {
  const output = path.resolve(repo, '../work/grammar-quest-boss-penalty-20261025');
  mkdirSync(output, { recursive: true });
  const script = await compile({ realBoss: true });
  const css = readFileSync(path.join(repo, 'src/styles.css'), 'utf8');
  const html = `<meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div id="root"></div><script>${script.replaceAll('</script', '<\\/script')}</script>`;
  for (const [label, browserType, viewport] of [
    ['chromium-desktop', chromium, { width: 1280, height: 800 }],
    ['webkit-phone', webkit, { width: 360, height: 780 }]
  ]) {
    let browser;
    try {
      browser = await browserType.launch({ headless: true, timeout: 10000 });
      const page = await browser.newPage({ viewport });
      page.setDefaultTimeout(12000);
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.text().includes('Marble run frame failed')) errors.push(message.text());
      });
      await page.route('**/*', async (route) => {
        if (route.request().isNavigationRequest())
          return route.fulfill({ contentType: 'text/html', body: html });
        const url = new URL(route.request().url());
        if (url.pathname.startsWith('/gq-media/') && !url.pathname.endsWith('.mp3'))
          return route.fulfill({ contentType: 'image/webp', body: await readMedia(url.pathname) });
        return route.abort();
      });
      await page.addInitScript(() => {
        localStorage.setItem('grammarQuestMusic', '0');
        localStorage.setItem('grammarQuestSound', '0');
      });
      await page.goto('http://localhost:3000/__grammar-boss-penalty-fixture');
      await page.waitForFunction(() => !!window.showFixture);
      await page.evaluate(() => {
        window.bossQuestion = {
          position: 0, format: 'fix', question: 'She are ready.',
          parts: { before: 'She ', wrong: 'are', after: ' ready.' },
          choices: ['is', 'be', 'am'], skill: 'agreement',
          skillName: 'Subject–verb agreement', baseTimeMs: 13600, graceMs: 4000,
          revealDelayMs: 50, telegraphMs: 0, attack: 'trap'
        };
        window.mountBoss = (extra = {}) => {
          window.fixtureRun = {
            runId: 123, nodeId: 'w1f1', kind: 'fort', worldId: 1,
            rules: { mode: 'boss', hits: 7, passPoints: 490, hp: 490, timeScale: 2 },
            questions: [window.bossQuestion], wrongPicks: [], usedMs: 0, hp: 490,
            answers: [], ...extra
          };
          window.answerRequests = [];
          window.showFixture('practice');
        };
        window.mountBoss();
        window.questAnswer = () => new Promise((resolve) => { window.resolveBossAnswer = resolve; });
      });
      await page.waitForFunction(() => window.fixtureFight.canAnswer);
      await page.getByRole('button', { name: /^B\s*be$/ }).click();
      await page.waitForFunction(() => !!window.resolveBossAnswer);
      assert.equal(await page.getByText('1 wrong · +2s penalty', { exact: true }).count(), 0,
        'pending requests do not invent penalties');
      assert.equal(await page.evaluate(() => window.fixtureFight.wrongPicks), 0);
      await page.evaluate(() => window.resolveBossAnswer({ position: 0, isCorrect: false, wrong: 1 }));
      await page.getByText('1 wrong · +2s penalty', { exact: true }).waitFor();
      assert.equal(await page.evaluate(() => window.fixtureFight.liveGrade(900)), 'A',
        'reading allowance cannot erase a confirmed mistake');

      await page.evaluate(() => { window.questAnswer = () => Promise.reject(new Error('offline')); });
      await page.getByRole('button', { name: /^C\s*am$/ }).click();
      await page.getByText('That answer did not reach the server. Try again.', { exact: true }).waitFor();
      assert.equal(await page.evaluate(() => window.fixtureFight.wrongPicks), 1,
        'failed requests do not add a penalty');
      await page.evaluate(() => { window.questAnswer = { position: 0, isCorrect: false, wrong: 2 }; });
      await page.getByRole('button', { name: /^C\s*am$/ }).click();
      await page.getByText('2 wrong · +4s penalty', { exact: true }).waitFor();
      assert.equal(await page.evaluate(() => {
        const fight = window.fixtureFight;
        fight.answerWrong(2);
        return fight.wrongPicks;
      }), 2, 'a replayed acknowledgement is counted once');
      assert.equal(await page.evaluate(() => window.fixtureFight.liveGrade(900)), 'B');
      const penalty = await page.getByText('2 wrong · +4s penalty', { exact: true }).boundingBox();
      assert.ok(penalty && penalty.x >= 0 && penalty.x + penalty.width <= viewport.width,
        'the penalty remains readable inside the phone viewport');
      await page.screenshot({ path: path.join(output, `${label}-wrong-answer.png`), fullPage: true });

      await page.evaluate(() => {
        window.questAnswer = {
          position: 0, isCorrect: true, selectedIndex: 0, correctIndex: 0,
          grade: 'D', hp: 460, readMs: 0,
          next: { ...window.bossQuestion, position: 1 }
        };
      });
      await page.getByRole('button', { name: /^A\s*is$/ }).click();
      await page.waitForFunction(() => window.fixtureFight.answered === 'D');
      assert.equal(await page.evaluate(() => window.fixtureFight.hpAfter), 460,
        'the server decides the final grade and damage');
      assert.equal(await page.getByText(/wrong · \+\d+s penalty/).count(), 0,
        'the final grade replaces the running penalty once the hit settles');
      await page.waitForFunction(() => window.fixtureFight.canAnswer && window.fixtureFight.idx === 1);
      assert.equal(await page.getByText(/wrong · \+\d+s penalty/).count(), 0,
        'penalties end with the question, not the fight');
      assert.equal(await page.evaluate(() => window.fixtureFight.wrongPicks), 0);
      assert.equal(await page.evaluate(() => window.fixtureFight.usedMs), 0);

      await page.evaluate(() => window.mountBoss({
        questions: [{ ...window.bossQuestion, baseTimeMs: 18000, graceMs: 6000, revealDelayMs: 500 }],
        wrongPicks: [1, 2], usedMs: 9000,
        answers: [{ position: 0, selectedIndex: 1, correctIndex: null, isCorrect: false, grade: null, points: 0 }]
      }));
      await page.waitForFunction(() => window.fixtureFight.canAnswer);
      await page.getByText('2 wrong · +4s penalty', { exact: true }).waitFor();
      assert.deepEqual(await page.evaluate(() => {
        const fight = window.fixtureFight;
        return {
          wrong: fight.wrongPicks, used: fight.elapsedMs(fight.questionAt),
          grade: fight.liveGrade(fight.elapsedMs(fight.questionAt)),
          reveal: fight.questionAt - fight.telegraphEnd
        };
      }), { wrong: 2, used: 9000, grade: 'C', reveal: 500 },
      'reopening keeps the banked clock and wrong picks without skipping the reading pause');
      assert.equal(await page.getByRole('button', { name: /^B\s*be/ }).isDisabled(), true);
      await page.screenshot({ path: path.join(output, `${label}-resumed.png`), fullPage: true });

      await page.evaluate(() => {
        window.mountBoss({ questions: [{ ...window.bossQuestion, counter: true, baseTimeMs: 8000, graceMs: 0 }] });
        window.questAnswer = { position: 0, counter: true, isCorrect: false, hit: false, damage: 0, hp: 490 };
      });
      await page.waitForFunction(() => window.fixtureFight.canAnswer);
      await page.getByRole('button', { name: /^B\s*be$/ }).click();
      await page.waitForFunction(() => window.fixtureFight.phase === 'recover');
      assert.equal(await page.getByText(/wrong · \+\d+s penalty/).count(), 0,
        'optional counter misses still carry no penalty');
      assert.equal(await page.evaluate(() => window.fixtureFight.wrongPicks), 0);
      assert.deepEqual(errors, []);
    } finally {
      await browser?.close();
    }
  }
});

test('independent Stomp submits explicitly and keeps each sentence review reachable on phones', { timeout: 60000 }, async () => {
  const output = path.resolve(repo, '../work/grammar-stomp-20261021');
  mkdirSync(output, { recursive: true });
  const script = await compile();
  const css = readFileSync(path.join(repo, 'src/styles.css'), 'utf8');
  const html = `<meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div id="root"></div><script>${script.replaceAll('</script', '<\\/script')}</script>`;
  let browser;
  try {
    browser = await chromium.launch({ headless: true, timeout: 10000, args: ['--disable-gpu'] });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/*', (route) => route.request().isNavigationRequest()
      ? route.fulfill({ contentType: 'text/html', body: html }) : route.abort());
    await page.addInitScript(() => {
      localStorage.setItem('grammarQuestMusic', '0');
      localStorage.setItem('grammarQuestSound', '0');
    });
    await page.goto('http://localhost:3000/__grammar-stomp-fixture');
    await page.waitForFunction(() => !!window.showFixture);
    for (const mask of [1, 5, 13]) {
      assert.deepEqual(await page.evaluate((mask) => window.stompAnimationOutcome(mask), mask),
        [0, 1, 2, 3].map((i) => !(mask & (1 << i))), 'the real obstacle spares every correct sentence’s enemy');
    }
    for (const mask of [1, 5, 13]) {
      await page.evaluate(() => {
        window.answerRequests = [];
        window.stompProps = { disabled: false, question: { position: 0, format: 'stomp', manualSubmit: true, question: '', choices: ['One.', 'Two.', 'Three.', 'Four.'], skill: 'agreement', skillName: 'Agreement' } };
        window.showFixture('stomp');
      });
      await page.getByRole('button', { name: 'Submit (Enter)', exact: true }).waitFor();
      for (let i = 0; i < 4; i++) if (mask & (1 << i)) await page.keyboard.press(String(i + 1));
      assert.equal(await page.evaluate(() => window.answerRequests.length), 0, 'marking never auto-submits');
      await page.keyboard.press('Enter');
      assert.deepEqual(await page.evaluate(() => window.answerRequests), [{ choiceIndex: mask }]);
    }
    await page.evaluate(() => { window.answerRequests = []; window.showFixture('stomp'); });
    await page.getByRole('button', { name: /^1\s*One\./ }).click();
    await page.getByRole('button', { name: /^1\s*One\./ }).click();
    assert.equal(await page.getByRole('button', { name: 'Submit (Enter)', exact: true }).isEnabled(), false);
    await page.getByRole('button', { name: /^4\s*Four\./ }).click();
    await page.getByRole('button', { name: 'Submit (Enter)', exact: true }).click();
    assert.deepEqual(await page.evaluate(() => window.answerRequests), [{ choiceIndex: 8 }]);
    await page.evaluate(() => {
      window.answerRequests = [];
      window.stompProps = { ...window.stompProps, revealed: 2 };
      window.showFixture('stomp');
    });
    await page.getByRole('button', { name: /^1\s*One\./ }).click();
    assert.equal(await page.getByRole('button', { name: /^3\s*Three\./ }).isEnabled(), false);
    assert.equal(await page.getByRole('button', { name: 'Submit (Enter)', exact: true }).isEnabled(), false, 'read all four before submitting through fog');
    await page.evaluate(() => {
      window.answerRequests = [];
      window.stompProps = { disabled: false, question: { ...window.stompProps.question, manualSubmit: undefined, targets: 3 } };
      window.showFixture('stomp');
    });
    await page.getByRole('button', { name: 'Submit (Enter)', exact: true }).waitFor({ state: 'detached' });
    for (const key of ['1', '2', '3']) await page.keyboard.press(key);
    assert.deepEqual(await page.evaluate(() => window.answerRequests), [{ choiceIndex: 7 }], 'old questions keep their original interaction');

    for (const [width, height] of [[1280, 800], [360, 800], [360, 640]]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => {
        window.answerRequests = [];
        const choices = [
          'The books that were borrowed from the library last week have to be returned before Friday.',
          'The student who helped organize the exhibition have already received a thank-you letter from the principal.',
          'The paintings that hang beside the entrance were donated by a local artist.',
          'The teacher whose students won the competition are planning a small celebration after school.'
        ];
        const question = { position: 0, format: 'stomp', manualSubmit: true, question: '', choices, skill: 'agreement', skillName: 'Agreement with relative clauses' };
        window.fixtureRun = { runId: 42, nodeId: 'w7s1', kind: 'stop', worldId: 7, rules: { mode: 'practice', goal: 5, slots: Array(5).fill('stomp') }, questions: [question] };
        window.showFixture('practice');
        window.questAnswer = {
          position: 0, isCorrect: false, selectedIndex: 1, correctIndex: 10, rights: 0, readMs: 1,
          sentences: [0, 1, 3].map((index) => ({
            index, text: choices[index], isWrong: index !== 0,
            correctText: choices[index].replace('exhibition have', 'exhibition has').replace('competition are', 'competition is'),
            prompt: choices[index], ruleCard: null,
            challenge: { questionId: 200 + index, checked: true, review: { outcome: 'rejected', explanation: `Saved explanation for sentence ${index + 1}.` } }
          }))
        };
      });
      const submit = page.getByRole('button', { name: 'Submit (Enter)', exact: true });
      await submit.waitFor();
      const first = page.getByRole('button', { name: /^1\s*The books/ });
      await first.click();
      assert.equal(await page.evaluate(() => window.answerRequests.length), 0);
      const bounds = await submit.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: innerWidth, height: innerHeight };
      });
      assert.ok(bounds.left >= 0 && bounds.right <= width && bounds.top >= 0 && bounds.bottom <= height, JSON.stringify(bounds));
      await page.screenshot({ path: path.join(output, `stomp-${width}x${height}.png`), animations: 'disabled' });
      await submit.click();
      await page.getByRole('button', { name: 'Sentence 4', exact: true }).click();
      await page.getByText('Corrected: The teacher whose students won the competition is planning a small celebration after school.', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Challenge rejected', exact: true }).click();
      await page.getByText('Saved explanation for sentence 4.', { exact: true }).waitFor();
      assert.equal(await page.evaluate(() => window.challengeRequests.length), 0, 'reading a saved ruling makes no AI request');
      await page.keyboard.press('Escape');
      await page.screenshot({ path: path.join(output, `stomp-review-${width}x${height}.png`), animations: 'disabled' });
    }
    assert.deepEqual(errors, []);
    await page.close();
  } finally {
    await browser?.close();
  }
});

test(
  'Quest sentences stay fully visible as questions change and after scrolling a review',
  { timeout: 120000 },
  async () => {
    mkdirSync(questionArtifacts, { recursive: true });
    const script = await compile();
    const css = readFileSync(path.join(repo, 'src/styles.css'), 'utf8');
    const html = `<meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div id="root"></div><script>${script.replaceAll('</script', '<\\/script')}</script>`;
    const failures = [];
    let browser;
    try {
      browser = await chromium.launch({
        headless: true,
        timeout: 30000,
        args: ['--disable-gpu']
      });
      for (const [label, width, height, fontScale = 1] of [
        ['android-compact', 360, 640],
        ['android-short', 393, 600],
        ['android-landscape', 640, 360],
        ['android-landscape-browser-bars', 568, 280],
        ['android-large-text', 360, 640, 1.5],
        ['android-landscape-large-text', 640, 360, 1.5],
        ['laptop-short', 1280, 600]
      ]) {
        const page = await browser.newPage({ viewport: { width, height } });
        page.setDefaultTimeout(15000);
        await page.route('**/*', (route) =>
          route.request().isNavigationRequest()
            ? route.fulfill({ contentType: 'text/html', body: html })
            : route.abort()
        );
        await page.goto('http://localhost:3000/__grammarbles-question-fixture');
        if (fontScale !== 1) {
          await page.addStyleTag({
            content: `html { font-size: ${(width < 768 ? 8 : 10) * fontScale}px !important; }`
          });
        }
        await page.evaluate(() => {
          localStorage.setItem('grammarQuestMusic', '0');
          localStorage.setItem('grammarQuestSound', '0');
          window.fixtureRun = {
            runId: 42,
            nodeId: 'w1s1',
            kind: 'stop',
            worldId: 1,
            rules: { mode: 'practice', goal: 5 },
            questions: [
              {
                position: 0,
                question: 'She ____ here.',
                choices: ['lives', 'live', 'living', 'lived'],
                skill: 'conditionals',
                skillName: 'Second conditional'
              },
              {
                position: 1,
                question:
                  'Choose the option that completes this standard second conditional sentence about an unreal present situation: If I had more experience, _____.',
                choices: [
                  'I would apply for the job',
                  'I will apply for the job',
                  'I would have applied for the job',
                  'I apply for the job'
                ],
                skill: 'conditionals',
                skillName: 'Second conditional'
              },
              {
                position: 2,
                question:
                  'Rewrite "The argument of the prosecution was compelling" using the singular possessive form of "prosecution": "The _____ argument was compelling."',
                choices: [
                  "prosecution's",
                  "prosecutions'",
                  "prosecutions's",
                  "prosecution'"
                ],
                skill: 'possessives',
                skillName: 'Singular possessive'
              }
            ]
          };
          window.showFixture('practice');
        });
        const choices = page
          .locator('button')
          .filter({ has: page.locator('span', { hasText: /^A$/ }) });
        await choices.waitFor();
        await page.evaluate(() => {
          window.questAnswer = {
            position: 0,
            isCorrect: true,
            selectedIndex: 0,
            correctIndex: 0,
            rights: 1,
            goal: 5
          };
        });
        await choices.click();
        const secondText = await page.evaluate(
          () => window.fixtureRun.questions[1].question
        );
        await page.getByText(secondText, { exact: true }).waitFor();
        await page.waitForTimeout(100);
        await checkSentence(page, secondText, `${label}-long-question`);
        await page.evaluate(() => {
          window.questAnswer = {
            position: 1,
            isCorrect: false,
            selectedIndex: 1,
            correctIndex: 0,
            rights: 1,
            readMs: 1,
            ruleCard: {
              skill: 'conditionals',
              nameEn: 'Second conditional',
              nameKo: '가정법 과거',
              why: 'Use would with the base form of the verb for an unreal present situation. '.repeat(
                8
              ),
              whyKo:
                '현재와 다른 상황을 상상할 때 사용하는 표현입니다. '.repeat(5),
              wrongChoices: []
            }
          };
        });
        await page
          .getByRole('button', {
            name: 'B I will apply for the job',
            exact: true
          })
          .click();
        await page
          .getByRole('button', { name: 'Continue (Enter)', exact: true })
          .click();
        const thirdText = await page.evaluate(
          () => window.fixtureRun.questions[2].question
        );
        await page.getByText(thirdText, { exact: true }).waitFor();
        await page.waitForTimeout(100);
        await checkSentence(page, thirdText, `${label}-after-review`);
        await page.close();
      }
      assert.deepEqual(
        failures,
        [],
        'the complete sentence must be visible without scrolling at each new question'
      );
    } finally {
      await browser?.close();
    }

    async function checkSentence(page, text, label) {
      const geometry = await page
        .getByText(text, { exact: true })
        .evaluate((el) => {
          const rect = el.getBoundingClientRect();
          let top = 0,
            bottom = innerHeight,
            left = 0,
            right = innerWidth;
          const scrolls = [];
          for (
            let parent = el.parentElement;
            parent;
            parent = parent.parentElement
          ) {
            const style = getComputedStyle(parent),
              box = parent.getBoundingClientRect();
            if (style.overflowY !== 'visible') {
              top = Math.max(top, box.top + parent.clientTop);
              bottom = Math.min(
                bottom,
                box.top + parent.clientTop + parent.clientHeight
              );
            }
            if (style.overflowX !== 'visible') {
              left = Math.max(left, box.left + parent.clientLeft);
              right = Math.min(
                right,
                box.left + parent.clientLeft + parent.clientWidth
              );
            }
            if (
              parent.scrollTop ||
              parent.scrollHeight > parent.clientHeight + 1
            )
              scrolls.push({
                scrollTop: parent.scrollTop,
                content: parent.scrollHeight,
                height: parent.clientHeight
              });
          }
          const clippedControls = [
            ...document.querySelectorAll('button[aria-label^="Turn "]')
          ].flatMap((button) => {
            const box = button.getBoundingClientRect();
            return box.top < 0 ||
              box.bottom > innerHeight ||
              box.left < 0 ||
              box.right > innerWidth
              ? [
                  {
                    label: button.getAttribute('aria-label'),
                    top: box.top,
                    bottom: box.bottom
                  }
                ]
              : [];
          });
          return {
            visible:
              rect.top >= top - 1 &&
              rect.bottom <= bottom + 1 &&
              rect.left >= left - 1 &&
              rect.right <= right + 1,
            sentence: { top: rect.top, bottom: rect.bottom },
            visibleArea: { top, bottom },
            scrolls,
            clippedControls
          };
        });
      await page.screenshot({
        path: path.join(questionArtifacts, `${label}.png`),
        animations: 'disabled'
      });
      if (!geometry.visible || geometry.clippedControls.length)
        failures.push({ label, ...geometry });
    }
  }
);

test(
  'Quest review decisions, saved music choices, map progression, and distinct world music',
  { timeout: 120000 },
  async () => {
    mkdirSync(artifacts, { recursive: true });
    const script = await compile();
    const css = readFileSync(path.join(repo, 'src/styles.css'), 'utf8');
    const html = `<meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}body{background:#1a1426;margin:0}#root{padding:16px;max-width:1000px;margin:auto}#root:has([data-testid="real-map"]){display:flex;height:100dvh;max-width:none}</style><div id="root"></div><script>${script.replaceAll('</script', '<\\/script')}</script>`;
    let browser;
    try {
      browser = await chromium.launch({ headless: true, timeout: 10000 });
      for (const [label, width, height] of [
        ['desktop', 1280, 950],
        ['mobile', 390, 844]
      ]) {
        const page = await browser.newPage({ viewport: { width, height } });
        page.setDefaultTimeout(5000);
        const errors = [];
        const musicFiles = [];
        page.on('pageerror', (error) => errors.push(error.message));
        // Exercise the real music controller without decoding ten large tracks
        // or playing sound on the shared dev machine.
        await page.addInitScript(() => {
          window.startedTracks = [];
          window.stoppedTracks = [];
          window.AudioContext = class {
            state = 'running';
            currentTime = 0;
            destination = {};
            resume() {
              this.state = 'running';
              return Promise.resolve();
            }
            suspend() {
              this.state = 'suspended';
              return Promise.resolve();
            }
            decodeAudioData(data) {
              return Promise.resolve({
                duration: 300,
                trackId: new Uint8Array(data)[0]
              });
            }
            createGain() {
              return {
                gain: {
                  value: 1,
                  setValueAtTime() {},
                  exponentialRampToValueAtTime() {},
                  cancelScheduledValues() {}
                },
                connect(target) {
                  return target;
                }
              };
            }
            createBufferSource() {
              return {
                connect(target) {
                  return target;
                },
                start() {
                  window.startedTracks.push(this.buffer.trackId);
                },
                stop() {
                  window.stoppedTracks.push(this.buffer.trackId);
                }
              };
            }
          };
        });
        // Keep the shared dev server untouched; only this browser receives the fixture.
        await page.route('**/*', async (route) => {
          try {
            if (route.request().isNavigationRequest())
              return route.fulfill({ contentType: 'text/html', body: html });
            const url = new URL(route.request().url());
            if (url.pathname.startsWith('/gq-media/')) {
              if (url.pathname.endsWith('.mp3')) {
                musicFiles.push(url.pathname);
                // Also catch references to a missing local/CDN bundle asset.
                await readMedia(url.pathname, true);
                const worldId = Number(
                  /\/w(\d+)-/.exec(url.pathname)?.[1] || 99
                );
                return route.fulfill({
                  contentType: 'audio/mpeg',
                  body: Buffer.from([worldId])
                });
              }
              return route.fulfill({
                contentType: 'image/webp',
                body: await readMedia(url.pathname)
              });
            }
            return await route.abort();
          } catch (error) {
            errors.push(error.message);
            await route.abort();
          }
        });
        await page.goto('http://localhost:3000/__grammarbles-fixture');
        await page
          .getByRole('heading', { name: 'Music for your quest?' })
          .waitFor();
        await page.screenshot({
          path: path.join(artifacts, `${label}-music-choice.png`),
          fullPage: true
        });
        await page
          .getByRole('button', { name: 'Music off', exact: true })
          .click();
        assert.equal(
          await page
            .getByRole('button', { name: 'Music on', exact: true })
            .isDisabled(),
          true
        );
        assert.equal(
          await page.getByRole('heading', { name: 'Quest map' }).count(),
          0,
          'wait for the canonical saved choice'
        );
        await page.evaluate(() =>
          window.musicRequests[0].reject(new Error('offline'))
        );
        await page
          .getByRole('alert')
          .getByText('Could not save your choice. Please try again.')
          .waitFor();
        await page
          .getByRole('button', { name: 'Music off', exact: true })
          .click();
        await page.evaluate(() =>
          window.musicRequests[1].resolve({
            settings: { grammarbles: { music: false } }
          })
        );
        await page.getByRole('heading', { name: 'Quest map' }).waitFor();
        assert.equal(
          await page.evaluate(() => localStorage.getItem('grammarQuestMusic')),
          '0'
        );
        await page.reload();
        await page.getByRole('heading', { name: 'Quest map' }).waitFor();
        assert.equal(
          await page.getByText('Music for your quest?').count(),
          0,
          'explicit off survives a reopened session'
        );
        await page.evaluate(() =>
          window.setAccount({ grammarbles: { sound: false } })
        );
        await page
          .getByRole('button', { name: 'Music on', exact: true })
          .click();
        await page.evaluate(() =>
          window.musicRequests[0].resolve({
            settings: { grammarbles: { music: true, sound: false } }
          })
        );
        await page.getByRole('heading', { name: 'Quest map' }).waitFor();
        assert.equal(
          await page.evaluate(() => localStorage.getItem('grammarQuestMusic')),
          '1'
        );
        await page.reload();
        await page.getByRole('heading', { name: 'Quest map' }).waitFor();
        assert.equal(
          await page.getByText('Music for your quest?').count(),
          0,
          'explicit on also skips the prompt'
        );

        for (const mode of ['practice', 'results', 'classic']) {
          for (const outcome of ['accepted', 'rejected', null]) {
            await page.evaluate(
              ({ mode, outcome }) => window.showFixture(mode, outcome),
              { mode, outcome }
            );
            if (mode === 'practice')
              await page
                .getByRole('button', { name: 'D a', exact: true })
                .click();
            if (mode === 'results')
              await page
                .getByRole('button', { name: 'View reviews (1)' })
                .click();
            const labelText = outcome
              ? `Challenge ${outcome}`
              : 'Already reviewed';
            await page
              .getByRole('button', { name: labelText, exact: true })
              .click();
            await page
              .getByRole('heading', { name: 'Reviewer’s explanation' })
              .waitFor();
            const explanation =
              outcome === 'accepted'
                ? 'Two choices were possible. The question was corrected.'
                : outcome === 'rejected'
                  ? 'Milk is uncountable, so “There is some milk” is correct.'
                  : 'This earlier review explains why “some milk” is correct.';
            await page.getByText(explanation, { exact: true }).waitFor();
            assert.equal(
              await page
                .getByRole('button', { name: 'Start review', exact: true })
                .count(),
              0
            );
            assert.equal(
              await page
                .getByText('50,000 Coins earned', { exact: true })
                .count(),
              0,
              'a saved review never claims a reward for this viewer'
            );
            assert.equal(
              await page.evaluate(() => window.challengeRequests.length),
              0,
              'reading saved decisions makes no paid request'
            );
            if (mode === 'practice' && outcome === 'rejected') {
              await page.screenshot({
                path: path.join(artifacts, `${label}-saved-review.png`),
                fullPage: true,
                animations: 'disabled'
              });
            }
          }
        }
        // Unchecked questions retain the opt-in review flow.
        await page.evaluate(() => window.showFixture('practice', null, false));
        await page.getByRole('button', { name: 'D a', exact: true }).click();
        await page
          .getByRole('button', { name: 'Challenge', exact: true })
          .click();
        await page
          .getByRole('button', { name: 'Start review', exact: true })
          .waitFor();
        assert.equal(
          await page.evaluate(() => window.challengeRequests.length),
          0
        );

        for (const startFrom of ['bubble', 'panel']) {
          await page.evaluate(() => {
            window.realMap = true;
            window.resetMap();
            window.showFixture('map');
          });
          // Select another dot and then the current stop, reproducing a pinned selection.
          // The map takes the pointer and works out the stop from where it
          // lands (the stop buttons are for the keyboard), so these are real
          // clicks at each stop's point.
          await page
            .getByRole('button', {
              name: 'First stop, best grade S',
              exact: true
            })
            .click({ force: true });
          await page
            .getByRole('button', {
              name: 'Articles · Sentence patterns and word order',
              exact: true
            })
            .click({ force: true });
          const panelPlay = page.getByRole('button', {
            name: 'Play',
            exact: true
          });
          const geometry = await panelPlay.evaluate((el) => {
            const button = el.getBoundingClientRect(),
              panel = el.parentElement.getBoundingClientRect();
            return {
              buttonTop: button.top,
              buttonBottom: button.bottom,
              panelTop: panel.top,
              panelBottom: panel.bottom,
              first: el === el.parentElement.firstElementChild
            };
          });
          assert.equal(
            geometry.first,
            true,
            'Play comes before the explanation'
          );
          assert.ok(
            geometry.buttonTop >= geometry.panelTop &&
              geometry.buttonBottom <= geometry.panelBottom,
            'Play is fully visible without scrolling the panel'
          );
          if (startFrom === 'panel')
            await page.screenshot({
              path: path.join(artifacts, `${label}-map-play-top.png`),
              fullPage: true,
              animations: 'disabled'
            });
          await (
            startFrom === 'bubble'
              ? page.getByRole('button', {
                  name: 'Play Articles · Sentence patterns and word order',
                  exact: true
                })
              : panelPlay
          ).click({ force: startFrom === 'bubble' });
          await page
            .getByRole('button', { name: 'Clear fixture level' })
            .click();
          // a clear starts the victory fanfare (the fixture's id 99: its
          // file has no world number) on the result screen (Mikey 10-12)
          await page.waitForFunction(() => window.startedTracks.at(-1) === 99);
          const fanfareStops = await page.evaluate(
            () => window.stoppedTracks.filter((id) => id === 99).length
          );
          await page
            .getByRole('button', { name: 'Back to map', exact: true })
            .click();
          await page
            .getByRole('button', { name: 'Play Village Castle', exact: true })
            .waitFor();
          // Back to map stops it and the map's own song returns
          await page.waitForFunction(() => window.startedTracks.at(-1) === 1);
          assert.equal(
            await page.evaluate(
              () => window.stoppedTracks.filter((id) => id === 99).length
            ),
            fanfareStops + 1,
            'Back to map stops the victory fanfare'
          );
          // An explicit world choice must not pin the next world after a castle clear.
          await page
            .getByRole('button', {
              name: 'World 1: Starter Village',
              exact: true
            })
            .click();
          await page
            .getByRole('button', { name: 'Play Village Castle', exact: true })
            .click({ force: true });
          await page
            .getByRole('button', { name: 'Clear fixture level' })
            .click();
          await page
            .getByRole('button', { name: 'Back to map', exact: true })
            .click();
          await page
            .getByRole('button', {
              name: 'Play Harbor Beginnings',
              exact: true
            })
            .waitFor();
        }

        // Failure does not advance the selected stop.
        await page.evaluate(() => {
          window.resetMap();
          window.showFixture('map');
        });
        await page
          .getByRole('button', {
            name: 'Play Articles · Sentence patterns and word order',
            exact: true
          })
          .click({ force: true });
        const startsBeforeFail = await page.evaluate(
          () => window.startedTracks.length
        );
        await page.getByRole('button', { name: 'Fail fixture level' }).click();
        await page
          .getByRole('button', { name: 'Back to map', exact: true })
          .waitFor();
        await page.waitForTimeout(300);
        assert.deepEqual(
          await page.evaluate(
            (from) => window.startedTracks.slice(from),
            startsBeforeFail
          ),
          [],
          'a stop that is not cleared plays no victory fanfare'
        );
        await page
          .getByRole('button', { name: 'Back to map', exact: true })
          .click();
        await page
          .getByRole('button', {
            name: 'Play Articles · Sentence patterns and word order',
            exact: true
          })
          .waitFor();

        // music off: a clear's result screen stays silent too
        await page.evaluate(() => {
          window.setFixtureMusic(false);
          window.resetMap();
          window.showFixture('map');
        });
        const startsWhileMuted = await page.evaluate(
          () => window.startedTracks.length
        );
        await page
          .getByRole('button', {
            name: 'Play Articles · Sentence patterns and word order',
            exact: true
          })
          .click({ force: true });
        await page.getByRole('button', { name: 'Clear fixture level' }).click();
        await page
          .getByRole('button', { name: 'Back to map', exact: true })
          .waitFor();
        await page.waitForTimeout(300);
        assert.equal(
          await page.evaluate(() => window.startedTracks.length),
          startsWhileMuted,
          'with music off a clear plays no victory fanfare'
        );
        await page
          .getByRole('button', { name: 'Back to map', exact: true })
          .click();

        await page.evaluate(() => {
          window.resetAllMaps();
          window.showFixture('map');
        });
        const worlds = await page.evaluate(() =>
          window.serverQuestState.worlds.map((w) => ({
            id: w.id,
            name: w.name,
            key: w.key,
            firstStop: w.nodes[0].name
          }))
        );
        const mutedStarts = await page.evaluate(
          () => window.startedTracks.length
        );
        const mutedFetches = musicFiles.length;
        for (const world of worlds) {
          await page
            .getByRole('button', {
              name: `World ${world.id}: ${world.name}`,
              exact: true
            })
            .click();
          if (label === 'mobile') {
            // Smooth horizontal scrolling must bring the current stop into view.
            await page.waitForFunction((name) => {
              const button = [...document.querySelectorAll('button')].find(
                (el) => el.getAttribute('aria-label') === `Play ${name}`
              );
              if (!button) return false;
              const rect = button.getBoundingClientRect();
              return rect.left >= 0 && rect.right <= innerWidth;
            }, world.firstStop);
          }
          if (label === 'desktop' || world.id === 2) {
            await page.screenshot({
              path: path.join(artifacts, `${label}-world-${world.id}.png`),
              fullPage: true,
              animations: 'disabled'
            });
          }
        }
        assert.equal(
          await page.evaluate(() => window.startedTracks.length),
          mutedStarts,
          'browsing every map while muted starts no music'
        );
        assert.equal(
          musicFiles.length,
          mutedFetches,
          'muted world changes fetch no music'
        );
        await page
          .getByRole('button', { name: 'Turn music on', exact: true })
          .click();
        await page.waitForFunction(() => window.startedTracks.at(-1) === 10);
        for (const world of worlds) {
          await page
            .getByRole('button', {
              name: `World ${world.id}: ${world.name}`,
              exact: true
            })
            .click();
          await page.waitForFunction(
            (id) => window.startedTracks.at(-1) === id,
            world.id
          );
        }
        assert.equal(
          new Set(
            await page.evaluate(() =>
              window.startedTracks.filter((id) => id <= 10)
            )
          ).size,
          10,
          'all ten maps select distinct playable tracks'
        );
        assert.deepEqual(
          musicFiles
            .slice(mutedFetches)
            .filter(
              (file) => !/\/w\d+-map-[a-z-]+\.[0-9a-f]{10}\.mp3$/.test(file)
            ),
          [],
          'every map plays its own map song, never a level theme (Mikey 10-10)'
        );
        await page
          .getByRole('button', { name: 'Turn music off', exact: true })
          .click();
        assert.deepEqual(errors, []);
        await page.close();
      }
    } finally {
      await browser?.close();
    }
  }
);
