import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const { chromium } = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const artifacts = process.env.ARENA_TODAY_ARTIFACTS;
const source = JSON.parse(readFileSync(path.join(repo, '../api/test/fixtures/arenaTodayQuestion.json'), 'utf8'));
const fixture = `
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {library} from '@fortawesome/fontawesome-svg-core';
import {faCoins,faChevronRight,faSpinner} from '@fortawesome/pro-solid-svg-icons';
import {FixtureProvider} from '~/contexts';
import TodayQuestion from './src/containers/Arena/TodayQuestion';
import ModeChooser from './src/containers/Arena/ModeChooser';
library.add(faCoins,faChevronRight,faSpinner);
function App(){
 const [view,setView]=useState('choose');const [viewer,setViewer]=useState(1);window.setViewer=setViewer;
 const context={myState:{userId:viewer},requestHelpers:{arenaToday:async(action,body)=>{
  const r=await fetch('/today/'+action,{method:'POST',headers:{'content-type':'application/json','x-viewer':String(viewer)},body:JSON.stringify(body)});
  if(!r.ok) throw new Error('Please refresh and try again.');return r.json();
 }},user:{actions:{onSetUserState:value=>{window.balances=value;}}},state:{todayStats:{}},actions:{onApplyTodayStatsProgress:value=>{window.daily=value;}}};
 return <FixtureProvider value={context}><main>{view==='choose'?<ModeChooser onPick={setView}/>:<TodayQuestion/>}</main></FixtureProvider>;
}createRoot(document.getElementById('root')).render(<App/>);`;
let bundle;
async function compile() {
  if (bundle) return bundle;
  const stubs = {
    '~/contexts': `import React,{createContext,useContext} from 'react';const C=createContext({});export const FixtureProvider=C.Provider;export const useAppContext=s=>s(useContext(C));export const useKeyContext=useAppContext;export const useNotiContext=useAppContext;`,
    '~/helpers': `export const buildTodayStatsPatchFromDailyTaskStatus=dailyTaskStatus=>({dailyTaskStatus});`,
    '~/helpers/websiteAgentPage': `export const WEBSITE_AGENT_NO_PLAY_ATTRIBUTE='data-twinkle-agent-no-play';export const WEBSITE_AGENT_OFF_LIMITS_ATTRIBUTE='data-twinkle-agent-off-limits';`
  };
  const result = await build({ stdin: { contents: fixture, resolveDir: repo, loader: 'tsx' }, bundle: true, write: false, format: 'iife', platform: 'browser', alias: { '~': path.join(repo, 'src') }, define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"development"' }, plugins: [{ name: 'today-services', setup(b) { b.onResolve({ filter: /.*/ }, ({ path }) => stubs[path] ? { path, namespace: 'fixture' } : undefined); b.onLoad({ filter: /.*/, namespace: 'fixture' }, ({ path }) => ({ contents: stubs[path], loader: 'jsx', resolveDir: repo })); } }] });
  return bundle = result.outputFiles[0].text;
}
const prompt = q => ({ prompt: q.prompt, passage: q.passage, choices: q.choices });
const rewards = { correctXP: 50000, correctCoins: 5000, guidedXP: 25000, guidedCoins: 0 };
function backend() {
  let profile = null, ready = false, firstAnswer = null, completedVia = null, lessonStep = 0, responses = [], checkAnswer = null;
  let loseReply = false;
  const actions = [];
  const options = { goals: [{ key: 'sat', label: 'SAT', subjects: ['Reading and Writing', 'Math'] }], grades: [{ key: 'm2', label: '중등 2 · Grade 8' }], confidence: [{ key: 'comfortable', label: 'I know the basics; help me improve' }], exams: [] };
  function snapshot(viewer = '1') {
    if (viewer !== '1') return { dayIndex: 1, nextDay: Date.now() + 86400000, options, rewards, profile: null, assignment: null, balances: { twinkleXP: 0, twinkleCoins: 0 } };
    const learned = lessonStep === 2;
    const paid = completedVia === 'correct' ? { xp: 50000, coins: 5000 } : completedVia ? { xp: 25000, coins: 0 } : { xp: 0, coins: 0 };
    return { dayIndex: 1, nextDay: Date.now() + 86400000, options, rewards, profile,
      balances: { twinkleXP: paid.xp, twinkleCoins: paid.coins },
      ...(completedVia ? { dailyTaskStatus: { aiStory: { isPassed: true, arena: { todayQuestion: { done: true } } } } } : {}),
      assignment: ready ? { id: 71, dayIndex: 1, title: source.title, skill: source.skill, question: prompt(source.question), rewards, attempted: firstAnswer !== null, firstAnswer, firstCorrect: firstAnswer === null ? null : firstAnswer === '75', completedVia, reward: paid,
        ...(firstAnswer !== null ? { lesson: { title: source.lesson.title, totalSteps: 2, completedSteps: lessonStep, ...(learned ? { summary: source.lesson.summary } : {}), steps: source.lesson.steps.slice(0, lessonStep + 1).map((s, i) => ({ title: s.title, prompt: s.prompt, scene: s.scene, options: s.options.map(o => ({ label: o.label })), ...(responses[i] ? { response: { ...responses[i], feedback: s.options[responses[i].option].feedback, scene: s.options[responses[i].option].scene } } : {}) })) } } : {}),
        ...(learned ? { check: prompt(source.check), checkResult: checkAnswer === null ? null : { answer: checkAnswer, correct: checkAnswer === '96', ...(checkAnswer === '96' ? { explanation: source.check.explanation } : {}) } } : {})
      } : null };
  }
  return {
    actions, publish: () => { ready = true; }, loseNextReply: () => { loseReply = true; }, snapshot,
    async route(route) {
      const action = new URL(route.request().url()).pathname.split('/').at(-1);
      const body = route.request().postDataJSON(); actions.push({ action, body });
      if (action === 'profile') profile = { ...body, revision: 1 };
      if (action === 'action') {
        if (body.action === 'answer' && firstAnswer === null) { firstAnswer = body.answer; if (firstAnswer === '75') completedVia = 'correct'; }
        if (body.action === 'lesson') { responses[body.step] = { option: body.option, correct: body.option === source.lesson.steps[body.step].correct }; if (responses[body.step].correct) lessonStep = body.step + 1; }
        if (body.action === 'check') { checkAnswer = body.answer; if (checkAnswer === '96' && !completedVia) completedVia = 'guided'; }
        await new Promise(resolve => setTimeout(resolve, 150));
        if (loseReply) { loseReply = false; return route.abort(); }
      }
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify(snapshot(route.request().headers()['x-viewer'])) });
    }
  };
}

test('Today’s Challenge automatic readiness, onboarding, guided learning and canonical rewards render at 360px and desktop', { timeout: 90000 }, async () => {
  const script = await compile();
  const browser = await chromium.launch();
  try {
    for (const width of [360, 1100]) {
      for (const outcome of ['guided', 'correct']) {
        const server = backend();
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        await page.clock.install();
        page.setDefaultTimeout(6000);
        const errors = []; page.on('pageerror', err => errors.push(err.message));
        await page.route('**/*', route => {
          if (new URL(route.request().url()).pathname.startsWith('/today/')) return server.route(route);
          if (/\/img\/arena\/cover-(train|arena)\.jpg$/.test(route.request().url())) return route.fulfill({ contentType: 'image/jpeg', body: readFileSync(path.join(repo, 'public', new URL(route.request().url()).pathname)) });
          if (route.request().url() === 'http://localhost:3000/') return route.fulfill({ contentType: 'text/html', body: `<style>${readFileSync(path.join(repo, 'src/styles.css'), 'utf8')}body{background:#f5f1e5}main{padding:24px 14px}button{min-height:42px}</style><div id="root"></div>` });
          return route.abort();
        });
        const shot = async name => {
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `horizontal overflow ${name} ${width}`);
          if (artifacts) { mkdirSync(artifacts, { recursive: true }); await page.screenshot({ path: path.join(artifacts, `${width}-${outcome}-${name}.png`), fullPage: true }); }
        };
        const boot = async () => { await page.goto('http://localhost:3000/'); await page.addScriptTag({ content: script }); await page.getByRole('button', { name: /Today’s Challenge/ }).waitFor(); if (outcome === 'guided') await shot('chooser'); await page.getByRole('button', { name: /Today’s Challenge/ }).click(); };
        await boot();
        await page.getByRole('heading', { name: 'What are you working toward?' }).waitFor();
        await shot('setup');
        await page.getByRole('button', { name: 'SAT', exact: true }).click();
        await page.getByRole('button', { name: 'Math', exact: true }).click();
        await page.getByRole('button', { name: '중등 2 · Grade 8', exact: true }).click();
        await page.getByRole('button', { name: 'I know the basics; help me improve', exact: true }).click();
        await page.getByRole('heading', { name: 'We’re preparing your challenge' }).waitFor();
        assert.equal(await page.getByRole('button', { name: 'Check for my question' }).count(), 0);
        await shot('waiting');
        const openCount = () => server.actions.filter(action => action.action === 'open').length;
        if (outcome === 'guided') {
          await page.getByRole('button', { name: 'My focus', exact: true }).click();
          await page.getByRole('button', { name: 'SAT', exact: true }).click();
          const beforeEditing = openCount();
          await page.clock.fastForward(60000);
          await page.evaluate(() => window.dispatchEvent(new Event('focus')));
          assert.equal(openCount(), beforeEditing, 'Do not refresh over preference edits');
          assert.equal(await page.getByRole('heading', { name: 'What should we focus on?' }).count(), 1);
          await page.getByRole('button', { name: 'Cancel', exact: true }).click();
          await page.evaluate(() => Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' }));
          const beforeHidden = openCount();
          await page.clock.fastForward(60000);
          assert.equal(openCount(), beforeHidden, 'Do not poll a hidden page');
          await page.evaluate(() => Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' }));
        }
        server.publish();
        if (outcome === 'guided') await page.clock.fastForward(60000);
        else if (width === 360) await page.evaluate(() => window.dispatchEvent(new Event('focus')));
        else await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
        await page.getByRole('heading', { name: source.title }).waitFor();
        assert.equal(await page.getByText('50,000', { exact: true }).count(), 1);
        assert.equal(await page.getByText('5,000', { exact: true }).count(), 1);
        assert.equal(await page.getByText('25,000', { exact: true }).count(), 1);
        assert.equal(await page.locator('[data-twinkle-agent-off-limits="arenaToday"]').count(), 1);
        await shot('question');
        await page.getByLabel('Your answer', { exact: true }).fill('draft answer');
        const beforeAnswering = openCount();
        await page.clock.fastForward(60000);
        await page.evaluate(() => window.dispatchEvent(new Event('focus')));
        assert.equal(openCount(), beforeAnswering, 'Stop readiness polling once the question is served');
        assert.equal(await page.getByLabel('Your answer', { exact: true }).inputValue(), 'draft answer');
        if (outcome === 'correct') {
          await page.getByLabel('Your answer', { exact: true }).fill('75');
          server.loseNextReply();
          await page.getByRole('button', { name: 'Submit answer', exact: true }).click();
          assert.equal(await page.getByText('A CLEARED ✓', { exact: true }).count(), 0, 'No optimistic payout');
          await page.getByRole('alert').waitFor();
          await page.getByRole('button', { name: 'Refresh', exact: true }).click();
          await page.getByRole('heading', { name: 'Right first time!' }).waitFor();
        } else {
          await page.getByLabel('Your answer', { exact: true }).fill('80');
          await page.getByRole('button', { name: 'Submit answer', exact: true }).click();
          await page.getByRole('heading', { name: 'Find the reduced price' }).waitFor();
          assert.equal(await page.getByRole('button', { name: 'Next step', exact: true }).isDisabled(), true);
          await page.getByRole('button', { name: 'Subtract 25 dollars', exact: true }).click();
          await page.getByText('25% is a fraction of the price', { exact: false }).waitFor();
          assert.equal(await page.getByRole('button', { name: 'Next step', exact: true }).isDisabled(), true);
          await page.getByRole('button', { name: 'Keep three parts: 60 dollars', exact: true }).click();
          await page.getByRole('button', { name: 'Next step', exact: true }).click();
          await page.getByRole('button', { name: 'The reduced price: 60 dollars', exact: true }).click();
          await page.getByText('Compare the two changes', { exact: true }).waitFor();
          await shot('interactive-lesson');
          await page.getByRole('button', { name: 'Try the understanding check', exact: true }).click();
          await page.getByLabel('Your answer', { exact: true }).last().fill('100');
          await page.getByRole('button', { name: 'Check my understanding', exact: true }).click();
          await page.getByText('Not yet. Revisit the explanation', { exact: false }).waitFor();
          assert.equal(await page.getByText('A CLEARED ✓', { exact: true }).count(), 0);
          await boot(); // genuine reload restores the unlocked check from the server
          await page.getByRole('heading', { name: 'A quick understanding check' }).waitFor();
          await page.getByLabel('Your answer', { exact: true }).last().fill('96');
          await page.getByRole('button', { name: 'Check my understanding', exact: true }).click();
          await page.getByRole('heading', { name: 'You worked it out.' }).waitFor();
        }
        await shot('complete');
        assert.deepEqual(await page.evaluate(() => window.balances.newState), outcome === 'correct' ? { twinkleXP: 50000, twinkleCoins: 5000 } : { twinkleXP: 25000, twinkleCoins: 0 });
        assert.equal(await page.evaluate(() => window.daily.newStats.dailyTaskStatus.aiStory.isPassed), true);
        assert.equal(await page.locator('[data-twinkle-agent-off-limits]').count(), 0);
        await page.getByRole('button', { name: 'My focus', exact: true }).click();
        await page.getByRole('button', { name: 'Cancel', exact: true }).click();
        assert.equal(await page.getByText('A CLEARED ✓', { exact: true }).count(), 1);
        await page.evaluate(() => window.setViewer(2));
        await page.getByRole('heading', { name: 'What are you working toward?' }).waitFor();
        assert.equal(await page.getByText('A CLEARED ✓', { exact: true }).count(), 0);
        assert.deepEqual(errors, []);
        await page.close();
      }
    }
  } finally { await browser.close(); }
});
