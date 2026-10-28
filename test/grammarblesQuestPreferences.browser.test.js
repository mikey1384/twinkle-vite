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
window.musicRequests = []; window.challengeRequests = []; window.balanceUpdates = []; window.startRequests=[]; window.answerRequests=[]; window.masteryRequests=[];
window.setAccount = settings => {state={myState:{userId:7,settings}};localStorage.setItem('fixtureAccount',JSON.stringify(settings));listeners.forEach(fn=>fn())};
const app = {user:{actions:{onSetUserState:update=>{window.balanceUpdates.push(update);if(Object.hasOwn(update.newState,'settings'))window.setAccount(update.newState.settings)}}},requestHelpers:{
 updateGrammarblesSettings: choice=>new Promise((resolve,reject)=>window.musicRequests.push({choice,resolve,reject})),
 loadGrammarQuestState:async()=>structuredClone(window.serverQuestState || {worlds:[{id:1,unlocked:true,nodes:[]}],nemesis:[],rewardedRunsLeft:3}),
 claimGrammarQuestWorldMastery:worldId=>new Promise((resolve,reject)=>window.masteryRequests.push({worldId,resolve,reject})),
 startGrammarQuestRun:async({nodeId})=>{window.startRequests.push(nodeId);const world=window.serverQuestState.worlds.find(w=>w.nodes.some(n=>n.id===nodeId));const node=world.nodes.find(n=>n.id===nodeId);return {runId:1,nodeId,worldId:world.id,kind:node.kind,rules:{mode:node.kind==='stop'?'practice':'boss'},questions:[]}},
 loadGrammarReview:async()=>({items:[window.reviewItem],hasMore:false}),
 answerGrammarQuestQuestion:async data=>{window.answerRequests.push(data);return typeof window.questAnswer==='function'?window.questAnswer(data):window.questAnswer},
 resumeGrammarQuestRun:async(runId,position)=>{window.resumeRequests.push({runId,position});return typeof window.questResume==='function'?window.questResume():window.questResume},
 finishGrammarQuestRun:async()=>{window.finishRequests=(window.finishRequests||0)+1;return {runId:123,points:610}},
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
 if(view.mode==='practice')return <MarbleRunScreen key={view.revision} run={window.fixtureRun || run} onFinished={()=>{window.finished=(window.finished||0)+1}} onQuit={()=>{}}/>;
 if(view.mode==='results')return <Result key={view.revision} kind="fort" result={window.fixtureResult || {runId:1,score:50,cleared:false,firstTryCorrect:0,size:1,xp:0,coins:0}} answers={[{...window.questAnswer,questionText:question.question}]} onBackToMap={()=>{}}/>;
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
    './MarbleRun/boss/fight': 'export class BossFight {}',
    './MarbleRun/boss/catalog': 'export const bossFor=()=>({});',
    './MarbleRun/lab/fitPreview':
      'export const fitPreviewParam=()=>null; export const PREVIEW_QUEST_RUN=null, PREVIEW_QUEST_RESULT=null, PREVIEW_QUEST_ANSWERS=[];'
  };
  if (realBoss) {
    const fight = path.join(repo, base, 'Quest/MarbleRun/boss/fight.ts');
    stubs['./MarbleRun/boss/fight'] = `
      import {BossFight as ActualBossFight} from '${fight}';
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
      loader: { '.webp': 'dataurl' },
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

test('all-S world bonuses show progress and canonical collection, and replays stay in the chosen world', { timeout: 120000 }, async () => {
  const output = process.env.GRAMMARBLES_MASTERY_ARTIFACTS ||
    path.resolve(repo, '../work/grammar-quest-world-mastery-20261028');
  mkdirSync(output, { recursive: true });
  const script = await compile();
  const css = readFileSync(path.join(repo, 'src/styles.css'), 'utf8');
  const pixelFont = process.env.GRAMMARBLES_PIXEL_FONT;
  const fontCss = pixelFont
    ? `@font-face{font-family:'Press Start 2P';src:url(data:font/woff2;base64,${readFileSync(pixelFont).toString('base64')}) format('woff2');font-weight:400;}`
    : '';
  const html = `<meta name="viewport" content="width=device-width,initial-scale=1"><style>${fontCss}${css}body{margin:0;background:#1a1426}#root{display:flex;height:100dvh;padding:8px}</style><div id="root"></div><script>${script.replaceAll('</script', '<\\/script')}</script>`;
  for (const [engine, browserType] of [['chromium', chromium], ['webkit', webkit]]) {
    let browser;
    try {
      browser = await browserType.launch({ headless: true, timeout: 10000 });
      for (const width of [360, 1280]) {
        const page = await browser.newPage({ viewport: { width, height: 820 } });
        page.setDefaultTimeout(8000);
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.addInitScript(() => localStorage.setItem('fixtureAccount', JSON.stringify({ grammarbles: { music: false, sound: false } })));
        await page.route('**/*', async route => {
          const url = new URL(route.request().url());
          if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: html });
          if (url.pathname.startsWith('/gq-media/') && !url.pathname.endsWith('.ogg')) {
            try { return await route.fulfill({ body: await readMedia(url.pathname) }); } catch { return route.abort(); }
          }
          return route.abort();
        });
        await page.goto('http://localhost:3000/');
        if (pixelFont) {
          assert.equal(await page.evaluate(async () => (await document.fonts.load('10px "Press Start 2P"')).length), 1);
        }
        await page.waitForFunction(() => typeof window.showFixture === 'function');
        await page.evaluate(() => {
          window.setAccount({ grammarbles: { music: false, sound: false } });
          window.realMap = true;
          window.resetAllMaps();
          for (const world of window.serverQuestState.worlds) {
            world.mastery = { xp: world.id * 100000, coins: world.id * 5000, eligible: false, claimed: false };
            for (const node of world.nodes) Object.assign(node, { cleared: true, bestScore: 90, grade: 'A' });
          }
          window.showFixture('map');
        });
        const last = page.getByRole('region', { name: 'World 10 all-S bonus' });
        await last.waitFor();
        assert.match(await last.innerText(), /1,000,000 XP/);
        assert.match(await last.innerText(), /50,000 Coins/);
        assert.equal(await last.getByRole('button').count(), 0);
        await page.screenshot({ path: path.join(output, `${engine}-${width}-world10.png`), fullPage: true, animations: 'disabled' });
        await page.getByRole('button', { name: 'World 1: Starter Village', exact: true }).click();
        const first = page.getByRole('region', { name: 'World 1 all-S bonus' });
        await first.waitFor();
        assert.match(await first.innerText(), /100,000 XP/);
        assert.match(await first.innerText(), /5,000 Coins/);
        // Replay a cleared A stop twice. Finishing and map refreshes must not
        // jump back to unlocked World 10 or silently switch the chosen stop.
        for (let replay = 0; replay < 2; replay++) {
          const target = await page.evaluate(() => window.serverQuestState.worlds[0].nodes[0].name);
          await page.getByRole('button', { name: `Play ${target}`, exact: true }).click({ force: true });
          await page.getByRole('button', { name: 'Clear fixture level', exact: true }).click();
          await page.getByRole('button', { name: 'Back to map', exact: true }).click();
          await first.waitFor();
          assert.equal(await last.count(), 0);
          assert.equal(await page.getByRole('button', { name: `Play ${target}`, exact: true }).count(), 1);
        }
        await page.screenshot({ path: path.join(output, `${engine}-${width}-world1.png`), fullPage: true, animations: 'disabled' });
        // Existing all-S progress is collectible; wait for the canonical
        // response before changing either the receipt or displayed balances.
        await page.evaluate(() => {
          const w = window.serverQuestState.worlds[9];
          w.sMarbles = w.nodeCount;
          w.mastery.eligible = true;
          for (const n of w.nodes) Object.assign(n, { grade: 'S', bestScore: 100 });
          window.showFixture('map');
        });
        const collect = last.getByRole('button', { name: 'Collect bonus', exact: true });
        await collect.waitFor();
        await page.screenshot({ path: path.join(output, `${engine}-${width}-ready.png`), fullPage: true, animations: 'disabled' });
        await collect.click();
        await page.waitForFunction(() => window.masteryRequests.length === 1);
        assert.equal(await last.getByRole('button', { name: 'Collecting…', exact: true }).isDisabled(), true);
        assert.equal(await page.evaluate(() => window.balanceUpdates.length), 0);
        assert.doesNotMatch(await last.innerText(), /BONUS COLLECTED/);
        await page.evaluate(() => window.masteryRequests[0].reject(new Error('synthetic failure')));
        await collect.waitFor();
        assert.match(await page.locator('body').innerText(), /Could not collect the bonus/);
        assert.doesNotMatch(await last.innerText(), /BONUS COLLECTED/);
        await collect.click();
        await page.waitForFunction(() => window.masteryRequests.length === 2);
        await page.evaluate(() => {
          const w = window.serverQuestState.worlds[9];
          w.mastery = { ...w.mastery, claimed: true, awardedAt: 123 };
          window.masteryRequests[1].resolve({ worldId: 10, mastery: w.mastery, newXp: 1234567, newCoins: 54321 });
        });
        await page.waitForFunction(() => window.balanceUpdates.length === 1);
        assert.match(await last.innerText(), /BONUS COLLECTED/);
        assert.equal(await last.getByRole('button').count(), 0);
        assert.deepEqual(await page.evaluate(() => window.balanceUpdates[0].newState), { twinkleXP: 1234567, twinkleCoins: 54321 });
        await page.screenshot({ path: path.join(output, `${engine}-${width}-collected.png`), fullPage: true, animations: 'disabled' });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
        await page.evaluate(() => {
          window.fixtureResult = { runId: 1, score: 100, grade: 'S', cleared: true, firstTryCorrect: 7, size: 7, xp: 0, coins: 0,
            masteryBonus: { worldId: 10, xp: 1000000, coins: 50000, awardedAt: 123 } };
          window.showFixture('results');
        });
        await page.getByText('World 10 mastered!', { exact: false }).waitFor();
        assert.match(await page.getByRole('status').innerText(), /\+1,000,000 XP · \+50,000 Coins/);
        await page.screenshot({ path: path.join(output, `${engine}-${width}-result.png`), fullPage: true, animations: 'disabled' });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
        assert.deepEqual(errors, []);
        // Every world must display its own complete artwork, including the
        // narrow layout. Keep this in the actual map/collection fixture.
        await page.evaluate(() => window.showFixture('map'));
        const worlds = await page.evaluate(() => window.serverQuestState.worlds.map(({ id, name }) => ({ id, name })));
        const artSources = new Set();
        for (const world of worlds) {
          await page.getByRole('button', { name: `World ${world.id}: ${world.name}`, exact: true }).click();
          const banner = page.getByRole('region', { name: `World ${world.id} all-S bonus` });
          const art = banner.locator('figure img');
          await art.evaluate(img => img.decode());
          assert.equal(await art.evaluate(img => img.naturalWidth), 480);
          artSources.add(await art.getAttribute('src'));
          assert.equal(await banner.locator('figcaption').innerText(), world.name);
          assert.equal(await banner.evaluate(el => el.scrollWidth <= el.clientWidth), true);
          await banner.screenshot({ path: path.join(output, `${engine}-${width}-banner-${world.id}.png`) });
        }
        assert.equal(artSources.size, worlds.length);
        await page.close();
      }
    } finally { await browser?.close(); }
  }
});

test('a boss explanation waits for Resume without spending the next grade clock in Chromium and WebKit', { timeout: 180000 }, async () => {
  const output = path.resolve(repo, '../work/grammar-quest-review-resume-20261028');
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
      await page.goto('http://localhost:3000/__grammar-boss-first-miss-fixture');
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
          window.resumeRequests = [];
          window.showFixture('practice');
        };
        window.mountBoss();
        window.questAnswer = () => new Promise((resolve) => { window.resolveBossAnswer = resolve; });
      });
      await page.waitForFunction(() => window.fixtureFight.canAnswer);
      await page.getByText('One wrong answer = F for this marble.', { exact: true }).waitFor();
      // A transport error has no verdict and must not consume a marble.
      await page.evaluate(() => { window.questAnswer = () => Promise.reject(new Error('offline')); });
      await page.getByRole('button', { name: /^B\s*be$/ }).click();
      await page.getByText('That answer did not reach the server. Try again.', { exact: true }).waitFor();
      assert.equal(await page.evaluate(() => window.fixtureFight.answered), null);
      assert.equal(await page.evaluate(() => window.fixtureFight.wrongPicks), 0);
      await page.evaluate(() => {
        window.questAnswer = () => new Promise((resolve) => { window.resolveBossAnswer = resolve; });
      });
      await page.getByRole('button', { name: /^B\s*be$/ }).click();
      await page.waitForFunction(() => !!window.resolveBossAnswer);
      assert.equal(await page.getByText('Wrong answer · F for this marble', { exact: true }).count(), 0,
        'pending requests do not invent a failure');
      assert.equal(await page.evaluate(() => window.fixtureFight.wrongPicks), 0);
      await page.evaluate(() => window.resolveBossAnswer(window.savedMiss = {
        position: 0, isCorrect: false, settled: true, selectedIndex: 1, correctIndex: 0,
        grade: 'F', gained: 10, points: 10, hp: 480, readMs: 6000, reviewPending: true,
        ruleCard: { skill: 'agreement', nameEn: 'Subject–verb agreement',
          why: 'Use “is” with “she”. “She is ready” is correct.',
          wrongChoices: [{ choice: 'be', error: 'Use the singular form is with she.' }] },
        pickedText: 'be', challenge: { questionId: 123, checked: false }
      }));
      await page.getByText('Wrong answer · F for this marble', { exact: true }).waitFor();
      await page.waitForFunction(() => window.fixtureFight.answered === 'F');
      await page.getByText('Use “is” with “she”. “She is ready” is correct.', { exact: true }).waitFor();
      assert.equal(await page.getByRole('button', { name: /^A\s*is/ }).isDisabled(), true,
        'the revealed correct choice cannot rescue this marble');
      assert.equal(await page.evaluate(() => window.fixtureFight.hpAfter), 480,
        'damage remains the server-confirmed F points');
      const rule = await page.getByText('Wrong answer · F for this marble', { exact: true }).boundingBox();
      assert.ok(rule && rule.x >= 0 && rule.x + rule.width <= viewport.width,
        'the new rule fits on the phone');
      await page.screenshot({ path: path.join(output, `${label}-wrong-answer.png`), fullPage: true });
      const resume = page.getByRole('button', { name: /^Resume/ });
      assert.equal(await resume.isDisabled(), true, 'minimum reading time still applies');
      await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(() => window.resumeRequests.length), 0);
      await page.waitForFunction(() => window.fixtureFight.phase === 'review');
      await page.getByRole('button', { name: 'Resume', exact: true }).waitFor();
      await page.waitForTimeout(2000);
      assert.equal(await page.evaluate(() => window.fixtureFight.phase), 'review', 'the minimum unlocks Resume without auto-advancing');
      assert.equal(await page.evaluate(() => window.fixtureFight.queued), null);
      await page.screenshot({ path: path.join(output, `${label}-resume-ready.png`), fullPage: true });
      await page.evaluate(() => { window.questResume = () => Promise.reject(new Error('offline')); });
      await resume.click();
      await page.getByText('Could not resume. Your explanation is saved. Try again.', { exact: true }).waitFor();
      assert.equal(await page.evaluate(() => window.fixtureFight.phase), 'review');
      await page.evaluate(() => { window.questResume = () => new Promise(resolve => { window.resolveResume = resolve; }); });
      await resume.click();
      await page.getByRole('button', { name: 'Resuming…', exact: true }).waitFor();
      await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(() => window.resumeRequests.length), 2, 'one failed request and one in flight, without double Resume');
      await page.evaluate(() => window.resolveResume({ position: 0, next: { ...window.bossQuestion, position: 1 } }));
      await page.waitForFunction(() => window.fixtureFight.canAnswer && window.fixtureFight.idx === 1);
      assert.deepEqual(await page.evaluate(() => window.fixtureFight.grades), ['F']);
      assert.equal(await page.evaluate(() => window.fixtureFight.wrongPicks), 0);
      assert.equal(await page.evaluate(() => window.fixtureFight.usedMs), 0);
      await page.evaluate(() => {
        window.questAnswer = {
          position: 1, isCorrect: true, selectedIndex: 0, correctIndex: 0,
          grade: 'S', gained: 100, points: 110, hp: 380,
          next: { ...window.bossQuestion, position: 2 }
        };
      });
      await page.getByRole('button', { name: /^A\s*is$/ }).click();
      await page.waitForFunction(() => window.fixtureFight.answered === 'S');
      assert.equal(await page.evaluate(() => window.fixtureFight.hpAfter), 380);
      await page.waitForFunction(() => window.fixtureFight.canAnswer && window.fixtureFight.idx === 2);
      assert.deepEqual(await page.evaluate(() => window.fixtureFight.grades), ['F', 'S'],
        'a failed question does not end the boss battle or fail later marbles');

      // Reopening a paused explanation restores it, including a long card
      // on a phone. Sentence/translation controls must not trigger Resume.
      await page.evaluate(() => {
        window.mountBoss({ reviewPosition: 0, hp: 480,
          answers: [{ ...window.savedMiss, readMs: 0, ruleCard: {
            ...window.savedMiss.ruleCard,
            why: Array(16).fill('Use “is” with “she”; the subject and verb must agree.').join(' ')
          }}] });
      });
      await page.getByRole('button', { name: 'Resume', exact: true }).waitFor();
      await page.waitForTimeout(1000);
      assert.equal(await page.evaluate(() => window.fixtureFight.phase), 'review');
      assert.deepEqual(await page.evaluate(() => window.fixtureFight.grades), ['F']);
      const pausedButton = await page.getByRole('button', { name: 'Resume', exact: true }).boundingBox();
      assert.ok(pausedButton && pausedButton.y >= 0 && pausedButton.y + pausedButton.height <= viewport.height, 'Resume stays visible beside a long explanation');
      assert.equal(await page.evaluate(() => {
        const card = document.querySelector('[data-fit-flex]');
        if (card.scrollHeight <= card.clientHeight) return true;
        card.scrollTop = card.scrollHeight;
        return card.scrollTop > 0;
      }), true, 'the full explanation remains scrollable');
      await page.screenshot({ path: path.join(output, `${label}-long-review-reopened.png`), fullPage: true });
      await page.evaluate(() => { window.questResume = { position: 0, next: { ...window.bossQuestion, position: 1 } }; });
      await page.getByRole('button', { name: 'Resume', exact: true }).click();
      await page.waitForFunction(() => window.fixtureFight.canAnswer && window.fixtureFight.idx === 1);
      assert.equal(await page.evaluate(() => window.fixtureFight.usedMs), 0);

      // Even a fight whose seventh marble has settled must not dismiss its
      // last explanation or claim the result until Resume.
      await page.evaluate(() => {
        window.finished = window.finishRequests = 0;
        const questions = Array.from({ length: 7 }, (_, position) => ({ ...window.bossQuestion, position }));
        window.mountBoss({ questions, reviewPosition: 6, hp: 0, answers: questions.map(q => q.position === 6
          ? { ...window.savedMiss, position: 6, readMs: 1 }
          : { position: q.position, selectedIndex: 0, correctIndex: 0, isCorrect: true, grade: 'S' }) });
        window.questResume = { position: 6 };
      });
      await page.getByRole('button', { name: 'Resume', exact: true }).waitFor();
      await page.waitForTimeout(3500);
      assert.equal(await page.evaluate(() => window.finishRequests), 0);
      assert.equal(await page.evaluate(() => window.fixtureFight.phase), 'review');
      await page.getByRole('button', { name: 'Resume', exact: true }).click();
      await page.waitForFunction(() => window.finished === 1);
      assert.equal(await page.evaluate(() => window.finishRequests), 1);

      // The saved F survives reopening; the current unanswered marble keeps
      // its own banked clock and reading pause.
      await page.evaluate(() => window.mountBoss({
        questions: [window.bossQuestion, { ...window.bossQuestion, position: 1,
          baseTimeMs: 18000, graceMs: 6000, revealDelayMs: 500 }],
        wrongPicks: [], usedMs: 9000, hp: 480,
        answers: [{ position: 0, selectedIndex: 1, correctIndex: 0, isCorrect: false, grade: 'F', points: 10 }]
      }));
      await page.waitForFunction(() => window.fixtureFight.canAnswer);
      assert.deepEqual(await page.evaluate(() => {
        const fight = window.fixtureFight;
        return { grades: fight.grades, wrong: fight.wrongPicks, used: fight.elapsedMs(fight.questionAt),
          grade: fight.liveGrade(fight.elapsedMs(fight.questionAt)), reveal: fight.questionAt - fight.telegraphEnd };
      }), { grades: ['F'], wrong: 0, used: 9000, grade: 'A', reveal: 500 });
      await page.screenshot({ path: path.join(output, `${label}-resumed.png`), fullPage: true });

      // A wrong answer saved by the former retry rule cannot regain S.
      await page.evaluate(() => window.mountBoss({ wrongPicks: [1],
        answers: [{ position: 0, selectedIndex: 1, correctIndex: null, isCorrect: false, grade: null, points: 0 }] }));
      await page.waitForFunction(() => window.fixtureFight.canAnswer);
      assert.equal(await page.evaluate(() => window.fixtureFight.liveGrade(100)), 'F');

      await page.evaluate(() => {
        window.mountBoss({ questions: [{ ...window.bossQuestion, counter: true, baseTimeMs: 8000, graceMs: 0 }] });
        window.questAnswer = { position: 0, counter: true, isCorrect: false, hit: false, damage: 0, hp: 490 };
      });
      await page.waitForFunction(() => window.fixtureFight.canAnswer);
      await page.getByRole('button', { name: /^B\s*be$/ }).click();
      await page.waitForFunction(() => window.fixtureFight.phase === 'recover');
      assert.equal(await page.getByText('One wrong answer = F for this marble.', { exact: true }).count(), 0,
        'optional counters are not question marbles');
      assert.deepEqual(await page.evaluate(() => window.fixtureFight.grades), []);
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
          // A castle unlocks the next world, but keeps the chosen map (10-28).
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
              name: 'Play First stop',
              exact: true
            })
            .waitFor();
          assert.equal(await page.getByRole('button', { name: 'Play Harbor Beginnings', exact: true }).count(), 0);
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
