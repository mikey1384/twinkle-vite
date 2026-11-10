import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { build, stop } from 'esbuild';

const require = createRequire(import.meta.url);
const {
  chromium,
  webkit
} = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const artifacts = process.env.GRAMMAR_QUEST_REVIEW_ARTIFACTS || path.resolve(repo, '../work/grammar-quest-original-review-20261104/browser');
const base = './src/containers/Home/GrammarGameModal/';
const fontPath = path.resolve(repo, '../work/grammar-quest-review-20261026/pixel-font.woff2');
const font = existsSync(fontPath) ? readFileSync(fontPath) : null;
const contexts = `
window.reportCalls=[];window.challengeCalls=[];window.missCalls=[];window.correctedResults=[];
const app={user:{actions:{onSetUserState(){}}},requestHelpers:{
 loadGrammarQuestState:async()=>({worlds:[{id:1,name:'Village',unlocked:true,nodes:[]},{id:4,name:'Forest',unlocked:true,nodes:[]}],nemesis:[],rewardedRunsLeft:10}),
 loadGrammarQuestMisses:async p=>{window.missCalls.push(p);if(window.loadFailure){window.loadFailure=false;throw Error('offline')};return p.before?{items:[window.extraMiss],next:null}:{items:window.misses,next:'older'}},
 reportGrammarQuestion:async p=>{window.reportCalls.push(p);if(window.reportFailure){window.reportFailure=false;throw Error('Try again after reconnecting.')};if(window.holdReport)return new Promise(r=>window.finishReport=()=>r({reportId:91}));return {reportId:91}},
 challengeGrammarQuestion:async p=>{window.challengeCalls.push(p);return window.acceptChallenge?{justified:true,questMissForgiven:true,questRunId:p.quest.runId,questPosition:p.quest.position,questCombo:2,questScheduleReviewPending:!!window.questScheduleReviewPending,explanation:'The answer was valid.'}:{justified:false,explanation:'The shared reviewer confirmed the answer.'}},
 loadGrammarQuestRun:async()=>window.ghostFresh,
 resumeGrammarQuestRun:async(runId,position)=>{(window.resumeCalls=window.resumeCalls||[]).push([runId,position]);return {}},
 answerGrammarQuestQuestion:async()=>window.practiceAnswer,
 finishGrammarQuestRun:async()=>new Promise(resolve=>{window.resolveCorrectedResult=()=>resolve(window.correctedPayload||{runId:81,score:70,grade:'B',points:490,passPoints:490,cleared:true,rights:5,size:7,forgivenHits:1,xp:200,coins:10,newXp:1200,newCoins:110,answers:[{position:2,forgiven:true}]})})
}};
export const useAppContext=s=>s(app);
export const useKeyContext=s=>s({myState:{userId:7,settings:{grammarbles:{music:false,sound:false}}}});
export const useHomeContext=s=>s({actions:{onUpdateGrammarLoadingStatus(){},onUpdateGrammarGenerationProgress(){}}});
export const useNotiContext=s=>s({actions:{onApplyTodayStatsProgress(){},onUpdateTodayStats(){}},state:{todayStats:{}}});
export const useViewContext=s=>s({state:{aiFeaturesDisabled:false}});
`;
const entry = `
import React from 'react';import {createRoot} from 'react-dom/client';
import Grammarbles from '${base}index';
import ChallengeModal from '${base}Review/ChallengeModal';
import Result from '${base}Quest/Result';
import GhostRun from '${base}Quest/Run';
import PracticeScreen from '${base}Quest/MarbleRunScreen';
import QuestMisses from '${base}Review/QuestMisses';
import {GamePageContext} from '${base}gamePortal';
window.misses=[
 {questionId:101,questionVersion:1,runId:80,position:0,kind:'stop',nodeId:'w4s1',format:'blank',questionText:'She ____ to school every day.',answeredAt:1792990000,challenge:{questionId:101,checked:false}},
 {questionId:202,questionVersion:2,runId:81,position:2,kind:'castle',nodeId:'w4c',format:'crack',questionText:'The sentence was already reviewed, but the marked word still seems wrong.',answeredAt:1792989000,challenge:{questionId:202,checked:true,review:{outcome:'rejected',explanation:'An earlier reviewer accepted this wording.'}}},
 {questionId:303,questionVersion:3,runId:82,position:4,sourceIndex:2,kind:'fort',nodeId:'w4f1',format:'stomp',questionText:'This retired sentence can still be reported with its own source question ID.',answeredAt:1792988000,challenge:null}
];
window.misses[0].presentation={format:'blank',question:'She ____ to school every day.',choices:['go','goes','going','gone']};
window.misses[0].selectedTaps=[0];
const words="The students in Mr. Park's science class was planting a vegetable garden this spring.".split(' ');
Object.assign(window.misses[1],{counter:true,presentation:{format:'crack',question:words.join(' '),tokens:words,choices:[]},selectedTaps:[8]});
Object.assign(window.misses[2],{presentation:{format:'stomp',question:'',choices:['She walks home.','He go home.','This retired sentence can still be reported with its own source question ID.','They arrived.'],manualSubmit:true},selectedTaps:[4]});
for(const [i,presentation,selectedTaps] of [
 [0,{format:'which',question:'Hidden bank blank ____',choices:['They was playing.','They were playing.']},[0]],
 [1,{format:'fix',question:'Today is the July fourth.',parts:{before:'Today is the ',wrong:'July fourth',after:'.'},choices:['fourth of July','July the fourth','the fourth of July']},[2]],
 [2,{format:'momentum',question:'Hidden bank blank ____',choices:['We walked home.','She walk home.','They walks home.']},[5]],
 [3,{format:'build',question:'home. They went',tokens:['home','They','went'],end:'.',choices:[],instruction:'Make a statement.'},[5]]
]) window.misses.push({...window.misses[0],questionId:500+i,runId:100+i,format:presentation.format,presentation,selectedTaps,challenge:{questionId:500+i,checked:false}});
window.extraMiss={...window.misses[0],presentation:undefined,questionId:404,runId:79,questionText:'An older question.',challenge:{questionId:404,checked:false}};
localStorage.setItem('userId','7');localStorage.setItem('grammarQuestSound','0');localStorage.setItem('grammarQuestMusic','0');
createRoot(document.getElementById('root')).render(<Grammarbles onHide={()=>{}}/>);
window.openResult=()=>{
 const layer=document.createElement('div');layer.id='result-fixture';Object.assign(layer.style,{position:'fixed',inset:0,zIndex:2147482000,overflow:'auto'});document.body.appendChild(layer);
 createRoot(layer).render(<Result kind="castle" runId={81} onBackToMap={()=>{}} onCorrected={()=>{}} result={{runId:81,score:60,grade:'F',points:420,cleared:false,rights:5,size:7,perfect:false,xp:210,coins:0,rewarded:true}} answers={[{position:2,isCorrect:false,selectedIndex:8,correctIndex:7,questionText:window.misses[1].questionText,presentation:window.misses[1].presentation,challenge:{questionId:202,checked:false},counter:true}]}/>);
};
window.openForgivenResult=()=>{
 const layer=document.createElement('div');layer.id='forgiven-result-fixture';Object.assign(layer.style,{position:'fixed',inset:0,zIndex:2147482000,overflow:'auto'});document.body.appendChild(layer);
 createRoot(layer).render(<GamePageContext.Provider value={layer}><Result kind="castle" runId={81} onBackToMap={()=>{}} onCorrected={r=>window.correctedResults.push(r)} result={{runId:81,score:60,grade:'F',points:420,cleared:false,rights:5,size:7,perfect:false,xp:210,coins:0}} answers={[{position:2,isCorrect:false,selectedIndex:8,correctIndex:7,grade:'F',questionText:window.misses[1].questionText,presentation:window.misses[1].presentation,challenge:{questionId:606,checked:false}}]}/></GamePageContext.Provider>);
};
window.openForgivenPractice=()=>{
 const layer=document.createElement('div');layer.id='forgiven-practice-fixture';Object.assign(layer.style,{position:'fixed',inset:0,zIndex:2147482000,overflow:'auto'});document.body.appendChild(layer);
 createRoot(layer).render(<GamePageContext.Provider value={layer}><Result kind="stop" runId={81} onBackToMap={()=>{}} onCorrected={r=>window.correctedResults.push(r)} result={{runId:81,score:83,grade:'A',cleared:true,rights:5,misses:1,size:6,perfect:false,xp:560,coins:50}} answers={[{position:2,isCorrect:false,selectedIndex:8,correctIndex:7,questionText:window.misses[1].questionText,presentation:window.misses[1].presentation,challenge:{questionId:606,checked:false}}]}/></GamePageContext.Provider>);
};
window.openUngradedBoss=()=>{
 const layer=document.createElement('div');layer.id='ungraded-boss-fixture';Object.assign(layer.style,{position:'fixed',inset:0,zIndex:2147482000,overflow:'auto'});document.body.appendChild(layer);
 createRoot(layer).render(<GamePageContext.Provider value={layer}><Result kind="castle" runId={81} onBackToMap={()=>{}} onCorrected={()=>{}} result={{runId:81,score:null,grade:null,cleared:false,rights:0,size:7,points:0,passPoints:490,forgivenHits:7,xp:70,coins:0,answers:[{position:2,forgiven:true}]}} answers={[{position:2,isCorrect:false,selectedIndex:8,correctIndex:7,grade:'F',questionText:window.misses[1].questionText,presentation:window.misses[1].presentation,challenge:{questionId:606,checked:false}}]}/></GamePageContext.Provider>);
};
window.openGhostRun=()=>{
 const questions=[0,1,2].map(position=>({position,question:'The ghost question ____',choices:['right','also right','wrong','wrong'],skill:'grammar.test',skillName:'Test',format:'blank'}));
 const answers=questions.map((q,i)=>({position:i,isCorrect:i!==2,selectedIndex:i===2?1:0,correctIndex:0,combo:i===2?0:i+1,...(i===2?{challenge:{questionId:606,checked:false}}:{})}));
 window.ghostFresh={runId:83,combo:2,answers:answers.map((a,i)=>i===2?{...a,forgiven:true}:a),questions};
 const layer=document.createElement('div');layer.id='ghost-fixture';document.body.appendChild(layer);
 createRoot(layer).render(<GhostRun run={{runId:83,nodeId:'nemesis',kind:'nemesis',worldId:1,questions,answers,combo:0,rules:{mode:'nemesis'}}} onFinished={()=>{}} onQuit={()=>{}}/>);
};
window.openGhostMisses=()=>{
 window.misses=[{...window.misses[0],questionId:707,runId:87,kind:'nemesis',nodeId:'nemesis',questionText:'The pending Ghost question ____',presentation:{format:'blank',question:'The pending Ghost question ____',choices:['right','also right','wrong','wrong']},forgiven:true,scheduleReviewPending:true,challenge:{questionId:707,checked:true}},
 {...window.misses[0],questionId:708,runId:88,kind:'nemesis',nodeId:'nemesis',questionText:'The new Ghost question ____',presentation:{format:'blank',question:'The new Ghost question ____',choices:['right','also right','wrong','wrong']},challenge:{questionId:708,checked:false}}];
 const layer=document.createElement('div');layer.id='ghost-misses-fixture';document.body.appendChild(layer);
 createRoot(layer).render(<GamePageContext.Provider value={layer}><QuestMisses look="quest"/></GamePageContext.Provider>);
};
window.openPracticeChallenge=()=>{
 const question={position:0,question:'The practice question ____',choices:['right','also right','wrong','wrong'],skill:'grammar.test',skillName:'Test',format:'blank'};
 const next={...question,position:1,question:'The next practice question ____'};
 window.practiceAnswer={position:0,isCorrect:false,selectedIndex:1,correctIndex:0,combo:0,caught:true,chaser:{gap:0,start:100},challenge:{questionId:606,checked:false}};
 window.ghostFresh={runId:84,combo:2,rules:{mode:'practice',modifier:'chaser',chaser:{gap:10,start:100}},answers:[{...window.practiceAnswer,forgiven:true}],questions:[question,next]};
 const layer=document.createElement('div');layer.id='practice-fixture';document.body.appendChild(layer);
 createRoot(layer).render(<PracticeScreen run={{runId:84,nodeId:'w7s1',kind:'stop',worldId:7,questions:[question],answers:[],combo:0,rules:{mode:'practice',goal:5,slots:['blank'],modifier:'chaser',chaser:{gap:100,start:100}}}} onFinished={()=>{}} onQuit={()=>{}}/>);
};
window.openBossMissChallenge=()=>{
 const question={position:0,question:'The boss question ____',choices:['right','also right','wrong','wrong'],skill:'grammar.test',skillName:'Test',format:'blank',baseTimeMs:12000};
 const miss={position:0,isCorrect:false,selectedIndex:1,correctIndex:0,grade:'F',gained:0,points:0,settled:true,reviewPending:true,readMs:0,ruleCard:null,challenge:{questionId:606,checked:false}};
 const layer=document.createElement('div');layer.id='boss-fixture';document.body.appendChild(layer);
 createRoot(layer).render(<PracticeScreen run={{runId:85,nodeId:'w4f1',kind:'fort',worldId:4,questions:[question],answers:[miss],reviewPosition:0,combo:0,rules:{mode:'boss'}}} onFinished={()=>{}} onQuit={()=>{}}/>);
};
window.openRunChallenge=()=>{
 const layer=document.createElement('div');layer.id='quest-run-layer';
 Object.assign(layer.style,{position:'fixed',inset:'0',zIndex:'2147482000',background:'#123'});
 document.body.appendChild(layer);const root=createRoot(layer);
 root.render(<ChallengeModal isOpen portalTarget={layer} questionId={202} questKind="castle" questRef={{runId:81,position:2}} savedReview={{outcome:'rejected',explanation:'An earlier reviewer accepted this wording.'}} onClose={()=>{root.unmount();layer.remove()}}/>);
};
`;
let compiled;
async function compile() {
  if (compiled) return compiled;
  const stubs = {
    '~/contexts': contexts,
    '~/helpers':
      'export const isMobile=()=>false,isTablet=()=>false,buildTodayStatsPatchFromDailyTaskStatus=x=>x;',
    '~/helpers/hooks/useUserActivity':
      'export default function useUserActivity(){}',
    '~/helpers/websiteAgentScreenState':
      'export const useAgentScreenState=()=>{};',
    '~/helpers/userDataHelpers':
      'export const getStoredItem=k=>localStorage.getItem(k),setStoredItem=(k,v)=>localStorage.setItem(k,v),removeStoredItem=k=>localStorage.removeItem(k);',
    '~/constants/sockets/api': 'export const socket={on(){},off(){}};',
    '~/components/Icon': 'export default function Icon(){return null}',
    '~/components/ErrorBoundary':
      'export default function Boundary({children}){return children}',
    '~/components/StreamingThoughtContent':
      'export default function Thought(){return null}',
    './ModeChooser': `import React from 'react';export default function Choose({onPick}){return <button onClick={()=>onPick('quest')}>Grammar Quest</button>}`,
    './Game': 'export default function Game(){return null}',
    './StartScreen': 'export default function Start(){return null}',
    './FinishScreen': 'export default function Finish(){return null}',
    './Review': 'export default function ClassicReview(){return null}',
    './ClassicArcade':
      'export default function Arcade({children}){return children}',
    './Rankings': `import React from 'react';export default function Rankings(){return <div>Quest rankings</div>}`,
    './WorldMap': `import React from 'react';export default function Map({world,selectedNodeId,onSelectWorld,onSelectNode}){return <div><h1>World {world.id}</h1><button onClick={()=>onSelectWorld(4)}>Forest</button><button onClick={()=>onSelectNode('w4s5')}>Stop 5</button><p>Selected: {selectedNodeId}</p></div>}`,
    './MusicChoice': 'export default function MusicChoice(){return null}',
    './Run': 'export default function Run(){return null}',
    './Result': 'export default function Result(){return null}',
    './MarbleRunScreen': 'export default function Marble(){return null}',
    './MarbleRun/level/runner': `export class PracticeRun {grade=null;busy=false;misses=0;constructor(theme,node,events){this.events=events;window.practiceEngine=this}resume(){}answer(ok,hint,forgiven){if(!ok&&!forgiven)this.misses++;setTimeout(()=>this.events.onReady(),0);return true}frame(g){g.fillStyle='#223a43';g.fillRect(0,0,960,380)}setChaser(){}}`
  };
  try {
    const result = await build({
      stdin: { contents: entry, resolveDir: repo, loader: 'tsx' },
      bundle: true,
      write: false,
      format: 'iife',
      platform: 'browser',
      jsx: 'transform',
      define: {
        'process.env.NODE_ENV': '"development"',
        'import.meta.env': '{"DEV":false}'
      },
      plugins: [
        {
          name: 'quest-review-fixture',
          setup(b) {
            b.onResolve({ filter: /.*/ }, (a) =>
              Object.hasOwn(stubs, a.path)
                ? { path: a.path, namespace: 'fixture' }
                : undefined
            );
            b.onLoad({ filter: /.*/, namespace: 'fixture' }, (a) => ({
              contents: stubs[a.path],
              loader: 'jsx',
              resolveDir: repo
            }));
          }
        }
      ]
    });
    compiled = result.outputFiles[0].text;
    return compiled;
  } finally {
    stop();
  }
}

for (const [name, engine] of [
  ['chromium', chromium],
  ['webkit', webkit]
]) {
  test(`${name}: a Ghost schedule awaiting review stays visible after reload and a new challenge`, { timeout: 45000 }, async () => {
    const script = await compile();
    mkdirSync(artifacts, { recursive: true });
    const css = readFileSync(path.join(repo, 'src/styles.css'), 'utf8');
    const html = `<meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div id="root"></div><div id="modal"></div><script>${script.replaceAll('</script', '<\\/script')}</script>`;
    const browser = await engine.launch({ headless: true });
    try {
      const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.route('**/*', (r) => r.request().isNavigationRequest() ? r.fulfill({ contentType: 'text/html', body: html }) : r.abort());
      await page.goto('http://localhost:3000/__quest-ghost-misses');
      await page.evaluate(() => { window.acceptChallenge = true; window.questScheduleReviewPending = true; window.openGhostMisses(); });
      const list = page.locator('#ghost-misses-fixture');
      const pending = list.locator('article').filter({ hasText: 'The pending Ghost question' });
      const fresh = list.locator('article').filter({ hasText: 'The new Ghost question' });
      await pending.getByText('Forgiven — the question was at fault. Its earlier Ghost review schedule still needs review.').waitFor();
      await fresh.getByRole('button', { name: 'Challenge', exact: true }).click();
      await page.getByRole('button', { name: 'Start review', exact: true }).click();
      await page.getByText('This Ghost question is forgiven. Its earlier review schedule still needs review.').waitFor();
      await page.getByRole('button', { name: 'Back to review', exact: true }).last().click();
      await fresh.getByText('Forgiven — the question was at fault. Its earlier Ghost review schedule still needs review.').waitFor();
      await page.screenshot({ path: path.join(artifacts, `${name}-ghost-pending-review.png`), fullPage: true });
      assert.deepEqual(errors, []);
      await page.close();
    } finally { await browser.close(); }
  });
  test(`${name}: a successful Quest challenge waits for the corrected server result`, { timeout: 45000 }, async () => {
    const script = await compile();
    mkdirSync(artifacts, { recursive: true });
    const css = readFileSync(path.join(repo, 'src/styles.css'), 'utf8');
    const html = `<meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div id="root"></div><div id="modal"></div><script>${script.replaceAll('</script', '<\\/script')}</script>`;
    const browser = await engine.launch({ headless: true });
    try {
      const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.route('**/*', (r) => r.request().isNavigationRequest() ? r.fulfill({ contentType: 'text/html', body: html }) : r.abort());
      await page.goto('http://localhost:3000/__quest-forgiven');
      await page.evaluate(() => { window.acceptChallenge = true; window.openForgivenResult(); });
      const result = page.locator('#forgiven-result-fixture');
      assert.equal(await result.locator('[title="F"]').count(), 1);
      await result.getByRole('button', { name: /Review questions/ }).click();
      await result.getByRole('button', { name: 'Challenge', exact: true }).click();
      await page.getByRole('button', { name: 'Start review', exact: true }).click();
      await page.getByText('Good catch!', { exact: true }).waitFor();
      await page.waitForFunction(() => typeof window.resolveCorrectedResult === 'function');
      assert.equal(await result.locator('[title="F"]').count(), 1, 'do not invent forgiveness before the canonical result arrives');
      await page.evaluate(() => window.resolveCorrectedResult());
      await page.getByText('Back to results', { exact: true }).click();
      await result.getByLabel('Forgiven: the question was at fault').waitFor();
      await result.getByText('Forgiven — the question was at fault. Free rematch earned.').waitFor({ state: 'visible' });
      assert.equal(await result.locator('[title="F"]').count(), 0);
      await result.getByText('1 question is forgiven and won’t count against your result.').waitFor();
      assert.equal(await page.evaluate(() => window.correctedResults.length), 1);
      await page.screenshot({ path: path.join(artifacts, `${name}-forgiven-result.png`), fullPage: true });
      assert.deepEqual(errors, []);
      await page.close();
    } finally {
      await browser.close();
    }
  });
  test(`${name}: a successful Quest challenge refreshes practice and an entirely forgiven boss has no grade`, { timeout: 45000 }, async () => {
    const script = await compile();
    const css = readFileSync(path.join(repo, 'src/styles.css'), 'utf8');
    const html = `<meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div id="root"></div><div id="modal"></div><script>${script.replaceAll('</script', '<\\/script')}</script>`;
    const browser = await engine.launch({ headless: true });
    try {
      const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.route('**/*', (r) => r.request().isNavigationRequest() ? r.fulfill({ contentType: 'text/html', body: html }) : r.abort());
      await page.goto('http://localhost:3000/__quest-practice-forgiven');
      await page.evaluate(() => {
        window.acceptChallenge = true;
        window.correctedPayload = { runId: 81, score: 100, grade: 'S', cleared: true, rights: 5, misses: 0, size: 6,
          perfect: true, xp: 1800, coins: 150, newXp: 1800, newCoins: 150, answers: [{ position: 2, forgiven: true }] };
        window.openForgivenPractice();
      });
      const practice = page.locator('#forgiven-practice-fixture');
      await practice.getByRole('button', { name: /Review questions/ }).click();
      await practice.getByRole('button', { name: 'Challenge', exact: true }).click();
      await page.getByRole('button', { name: 'Start review', exact: true }).click();
      await page.waitForFunction(() => typeof window.resolveCorrectedResult === 'function');
      await page.evaluate(() => window.resolveCorrectedResult());
      await page.getByText('Back to results', { exact: true }).click();
      await practice.getByText('Flawless on every graded question.').waitFor();
      await practice.getByText('Forgiven — the question was at fault.').waitFor({ state: 'visible' });
      assert.equal(await page.evaluate(() => window.correctedResults.length), 1);
      await page.evaluate(() => window.openUngradedBoss());
      const ungraded = page.locator('#ungraded-boss-fixture');
      await ungraded.getByText('NO GRADE', { exact: true }).waitFor();
      await ungraded.getByText('Every hit was forgiven. Play again for a score.').waitFor();
      assert.equal(await ungraded.getByText(/0 of 490 points/).count(), 0);
      assert.equal(await ungraded.getByText(/Half XP while the boss stands/).count(), 0);
      await page.screenshot({ path: path.join(artifacts, `${name}-ungraded-boss.png`), fullPage: true });
      assert.deepEqual(errors, []);
      await page.close();
    } finally { await browser.close(); }
  });
  test(`${name}: a successful Quest challenge marks the Ghost answer forgiven`, { timeout: 45000 }, async () => {
    const script = await compile();
    const css = readFileSync(path.join(repo, 'src/styles.css'), 'utf8');
    const html = `<meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div id="root"></div><div id="modal"></div><script>${script.replaceAll('</script', '<\\/script')}</script>`;
    const browser = await engine.launch({ headless: true });
    try {
      const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.route('**/*', (r) => r.request().isNavigationRequest() ? r.fulfill({ contentType: 'text/html', body: html }) : r.abort());
      await page.goto('http://localhost:3000/__quest-ghost-forgiven');
      await page.evaluate(() => { window.acceptChallenge = true; window.openGhostRun(); });
      const ghost = page.getByRole('region', { name: 'Ghost review battle' });
      await ghost.getByRole('button', { name: 'Challenge', exact: true }).click();
      await page.getByRole('button', { name: 'Start review', exact: true }).click();
      await page.getByText('Good catch!', { exact: true }).waitFor();
      await page.getByText('Back to question', { exact: true }).click();
      await ghost.getByText('Forgiven — the question was at fault.').waitFor();
      assert.equal(await ghost.locator('[title="Question 3: forgiven"]').count(), 1);
      assert.match(await ghost.locator('[role="img"]').getAttribute('aria-label'), /Ghost strength: 0 of 3/);
      await page.screenshot({ path: path.join(artifacts, `${name}-ghost-forgiven.png`), fullPage: true });
      assert.deepEqual(errors, []);
      await page.close();
    } finally { await browser.close(); }
  });
  test(`${name}: a boss miss can be challenged while its grade timer is paused`, { timeout: 45000 }, async () => {
    const script = await compile();
    const css = readFileSync(path.join(repo, 'src/styles.css'), 'utf8');
    const html = `<meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div id="root"></div><div id="modal"></div><script>${script.replaceAll('</script', '<\\/script')}</script>`;
    const browser = await engine.launch({ headless: true });
    try {
      const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.route('**/*', (r) => r.request().isNavigationRequest() ? r.fulfill({ contentType: 'text/html', body: html }) : r.abort());
      mkdirSync(artifacts, { recursive: true });
      await page.goto('http://localhost:3000/__quest-boss-miss');
      await page.evaluate(() => { window.acceptChallenge = false; window.openBossMissChallenge(); });
      await page.getByText('Grade timer paused. Take your time.').waitFor();
      await page.screenshot({ path: path.join(artifacts, `${name}-boss-miss-challenge.png`), fullPage: true });
      await page.getByRole('button', { name: 'Challenge', exact: true }).click();
      await page.getByRole('button', { name: 'Start review', exact: true }).click();
      await page.getByText('The shared reviewer confirmed the answer.').waitFor();
      assert.deepEqual(await page.evaluate(() => window.challengeCalls.at(-1).quest), { runId: 85, position: 0 });
      // the fight stays paused until the learner resumes, from the modal too
      assert.equal(await page.evaluate(() => (window.resumeCalls || []).length), 0);
      await page.getByRole('dialog').getByRole('button', { name: 'Resume', exact: true }).click();
      await page.waitForFunction(() => (window.resumeCalls || []).length === 1);
      assert.deepEqual(await page.evaluate(() => window.resumeCalls), [[85, 0]]);
      assert.deepEqual(errors, []);
      await page.close();
    } finally { await browser.close(); }
  });
  test(`${name}: a successful Quest challenge refreshes a practice answer while playing`, { timeout: 45000 }, async () => {
    const script = await compile();
    const css = readFileSync(path.join(repo, 'src/styles.css'), 'utf8');
    const html = `<meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div id="root"></div><div id="modal"></div><script>${script.replaceAll('</script', '<\\/script')}</script>`;
    const browser = await engine.launch({ headless: true });
    try {
      const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.route('**/*', (r) => r.request().isNavigationRequest() ? r.fulfill({ contentType: 'text/html', body: html }) : r.abort());
      await page.goto('http://localhost:3000/__quest-practice-active');
      await page.evaluate(() => { window.acceptChallenge = true; window.openPracticeChallenge(); });
      await page.getByRole('button', { name: 'B also right', exact: true }).click();
      await page.getByRole('button', { name: 'Challenge', exact: true }).waitFor();
      mkdirSync(artifacts, { recursive: true });
      await page.screenshot({ path: path.join(artifacts, `${name}-practice-miss.png`), fullPage: true });
      await page.getByRole('button', { name: 'Challenge', exact: true }).click();
      await page.getByRole('button', { name: 'Start review', exact: true }).click();
      await page.getByText('Good catch!', { exact: true }).waitFor();
      await page.getByText('Back to question', { exact: true }).click();
      await page.getByText('Forgiven — the question was at fault.').waitFor();
      assert.equal(await page.evaluate(() => window.practiceEngine.misses), 0);
      assert.equal(await page.getByText('The chaser caught you! This stop ends here; try it again.').count(), 0);
      await page.screenshot({ path: path.join(artifacts, `${name}-practice-forgiven.png`), fullPage: true });
      await page.getByRole('button', { name: 'Continue (Enter)', exact: true }).click();
      await page.getByText('The next practice question ____', { exact: true }).waitFor();
      assert.deepEqual(errors, []);
      await page.close();
    } finally { await browser.close(); }
  });
  test(
    `${name}: Quest navigation, challenges and canonical reports at desktop and phone widths`,
    { timeout: 90000 },
    async () => {
      const script = await compile();
      mkdirSync(artifacts, { recursive: true });
      const css = readFileSync(path.join(repo, 'src/styles.css'), 'utf8');
      const html = `<meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}${font ? '@font-face{font-family:"Press Start 2P";src:url(/pixel-font);font-weight:400;font-style:normal}' : ''}</style><div id="root"></div><div id="modal"></div><script>${script.replaceAll('</script', '<\\/script')}</script>`;
      const browser = await engine.launch({ headless: true });
      try {
        for (const [width, height] of [
          [1280, 800],
          [360, 800],
          [844, 390]
        ]) {
          const page = await browser.newPage({
            viewport: { width, height }
          });
          const errors = [];
          page.on('pageerror', (e) => errors.push(e.message));
          page.setDefaultTimeout(10000);
          await page.route('**/*', (r) =>
            r.request().isNavigationRequest()
              ? r.fulfill({ contentType: 'text/html', body: html })
              : font && new URL(r.request().url()).pathname === '/pixel-font'
                ? r.fulfill({ contentType: 'font/woff2', body: font })
                : r.abort()
          );
          await page.goto('http://localhost:3000/__quest-review');
          await page
            .getByRole('button', { name: 'Grammar Quest', exact: true })
            .click();
          await page
            .getByRole('button', { name: 'Forest', exact: true })
            .click();
          await page
            .getByRole('button', { name: 'Stop 5', exact: true })
            .click();
          await page.evaluate(() => {
            window.loadFailure = true;
          });
          await page
            .getByRole('button', { name: 'Review', exact: true })
            .click();
          await page.getByRole('region', { name: 'Quest review' }).waitFor();
          await page
            .getByText('Could not load your Grammar Quest misses.', {
              exact: false
            })
            .waitFor();
          await page
            .getByRole('button', { name: 'Try again', exact: true })
            .click();
          await page.locator('article').first().waitFor();
          assert.equal(await page.locator('article').count(), 7);
          for (const format of ['blank','crack','stomp','which','fix','momentum','build']) {
            assert.equal(await page.locator('[data-question-format='+format+']').count(),1);
          }
          const crack = page.locator('[data-question-format=crack]');
          assert.match(await crack.textContent(), /plantingYour tap/);
          assert.match(await crack.locator('..').locator('..').textContent(), /Spot the crack · Counter/);
          assert.equal(await crack.getByRole('button').count(),0,'review words are read-only');
          assert.equal(await page.getByText('Hidden bank blank ____').count(),0);
          assert.equal(await page.locator('[data-question-format=fix] mark').textContent(),'July fourth');
          assert.match(await page.locator('[data-question-format=momentum]').textContent(),/You called this wrong/);
          await page.screenshot({path:path.join(artifacts,`${name}-${width}-formats.png`),fullPage:true});
          if (width === 360) {
            for (const format of ['crack','fix','stomp','momentum','build']) {
              await page.locator('[data-question-format='+format+']').screenshot({path:path.join(artifacts,`${name}-${width}-${format}.png`)});
            }
          }
          const retired = page
            .locator('article')
            .filter({ hasText: 'This retired sentence' });
          assert.equal(
            await retired
              .getByRole('button', { name: 'Challenge', exact: true })
              .count(),
            0
          );
          await retired
            .getByRole('button', { name: 'Report to Mikey', exact: true })
            .click();
          const report = page.getByRole('dialog', {
            name: 'Report to Mikey',
            exact: true
          });
          await report.getByText('Question ID: 303', { exact: true }).waitFor();
          assert.equal(
            await report
              .getByRole('button', { name: 'Send report', exact: true })
              .isEnabled(),
            false
          );
          await report
            .getByLabel('What seems wrong?')
            .fill('This sentence has another valid answer.');
          await page.evaluate(() => {
            window.reportFailure = true;
          });
          await report
            .getByRole('button', { name: 'Send report', exact: true })
            .click();
          await report.getByRole('alert').waitFor();
          assert.equal(
            await report.getByLabel('What seems wrong?').inputValue(),
            'This sentence has another valid answer.'
          );
          await page.screenshot({
            path: path.join(artifacts, `${name}-${width}-report.png`)
          });
          const box = await report.boundingBox();
          assert.ok(
            box.x >= 0 && box.x + box.width <= width + 1,
            'report fits the viewport'
          );
          assert.ok(
            box.y >= 0 && box.y + box.height <= height + 1,
            'report fits a short viewport'
          );
          await page.evaluate(() => {
            window.holdReport = true;
          });
          await report
            .getByRole('button', { name: 'Send report', exact: true })
            .click();
          await page.waitForFunction(() => !!window.finishReport);
          assert.equal(
            await report
              .getByRole('button', { name: 'Send report', exact: true })
              .isEnabled(),
            false
          );
          await page.evaluate(() => window.finishReport());
          await page
            .getByRole('dialog', { name: 'Report sent', exact: true })
            .getByRole('button', { name: 'Done', exact: true })
            .click();
          assert.deepEqual(
            await page.evaluate(() => window.reportCalls),
            Array(2).fill({
              questionId: 303,
              questionVersion: 3,
              runId: 82,
              position: 4,
              note: 'This sentence has another valid answer.'
            })
          );
          assert.equal(
            await page.evaluate(() => window.challengeCalls.length),
            0
          );
          const checked = page
            .locator('article')
            .filter({ has: page.locator('[data-question-format=crack]') });
          await checked
            .getByRole('button', { name: 'Challenge rejected', exact: true })
            .click();
          await page
            .getByText('An earlier reviewer accepted this wording.', {
              exact: true
            })
            .waitFor();
          await page
            .getByRole('dialog')
            .getByRole('button', { name: 'Report to Mikey', exact: true })
            .click();
          await page
            .getByRole('dialog', { name: 'Report to Mikey', exact: true })
            .getByText('Question ID: 202', { exact: true })
            .waitFor();
          await page
            .getByRole('dialog', { name: 'Report to Mikey', exact: true })
            .getByRole('button', { name: 'Cancel', exact: true })
            .click();
          await page
            .getByRole('dialog')
            .getByRole('button', { name: 'Back to review', exact: true })
            .last()
            .click();
          await page
            .locator('article')
            .first()
            .getByRole('button', { name: 'Challenge', exact: true })
            .click();
          await page
            .getByRole('button', { name: 'Start review', exact: true })
            .click();
          await page
            .getByText('The shared reviewer confirmed the answer.', {
              exact: true
            })
            .waitFor();
          assert.deepEqual(await page.evaluate(() => window.challengeCalls), [
            { questionId: 101, quest: { runId: 80, position: 0 } }
          ]);
          await page
            .getByRole('dialog')
            .getByRole('button', { name: 'Back to review', exact: true })
            .last()
            .click();
          await page
            .getByRole('button', { name: 'Load more', exact: true })
            .click();
          await page.getByText('An older question.', { exact: true }).waitFor();
          assert.equal(await page.locator('article').count(), 8);
          await page.screenshot({
            path: path.join(artifacts, `${name}-${width}-review.png`)
          });
          assert.ok(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth + 1
            ),
            'no horizontal overflow'
          );
          await page.getByRole('button', { name: 'Map', exact: true }).click();
          await page.getByText('Selected: w4s5', { exact: true }).waitFor();
          await page
            .getByRole('button', { name: 'Rankings', exact: true })
            .click();
          await page.getByText('Quest rankings', { exact: true }).waitFor();
          await page.evaluate(() => window.openRunChallenge());
          await page
            .getByRole('dialog')
            .getByRole('button', { name: 'Report to Mikey', exact: true })
            .click();
          const runReport = page.getByRole('dialog', {
            name: 'Report to Mikey',
            exact: true
          });
          await runReport
            .getByText('Question ID: 202', { exact: true })
            .waitFor();
          assert.equal(
            await runReport.evaluate((el) => !!el.closest('#quest-run-layer')),
            true,
            'a report from the full-screen run stays in its overlay'
          );
          await runReport
            .getByRole('button', { name: 'Cancel', exact: true })
            .click();
          await page
            .getByRole('dialog')
            .getByRole('button', { name: 'Back to review', exact: true })
            .last()
            .click();
          await page.evaluate(() => window.openResult());
          await page.locator('#result-fixture').getByRole('button',{name:/View reviews|Review questions/}).click();
          const resultCrack=page.locator('#result-fixture [data-question-format=crack]');
          assert.match(await resultCrack.textContent(),/plantingYour tap/);
          if(width===360) await resultCrack.screenshot({path:path.join(artifacts,`${name}-${width}-result-crack.png`)});
          assert.deepEqual(errors, []);
          await page.close();
        }
      } finally {
        await browser.close();
      }
    }
  );
}
