import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const { chromium, webkit } = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const artifacts = process.env.AI_STORY_SCROLL_ARTIFACTS;
const baseline = process.env.AI_STORY_SCROLL_BASELINE;
const story = Array.from({ length: 8 }, (_, i) =>
  `Story paragraph ${i + 1}. The river runs through the park. Elephants drink there and rest under big trees. These trees have wide trunks and can live for many years.`
).join('\n\n');
const questions = Array.from({ length: 3 }, (_, i) => ({
  id: i + 1,
  question: `Question ${i + 1}: Where do the elephants rest after drinking from the river?`,
  choices: ['Under the big trees.', 'Near the visitors’ cars.', 'Near the local towns.', 'Beside the restaurant.'],
  skill: 'reading.detail'
}));

const fixture = `
import React from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter,Routes,Route,useNavigate,useLocation} from 'react-router-dom';
import {library} from '@fortawesome/fontawesome-svg-core';
import {faArrowLeft,faArrowRight,faCheck,faTimes,faStar,faSpinner,faCheckCircle,faTimesCircle,faKeyboard,faSparkles,faTrophy} from '@fortawesome/pro-solid-svg-icons';
import Arena from './src/containers/Arena';
import {installNavigationPopGuard} from './src/helpers/navigationPopGuard';
import {NavigationFeedbackProvider,NavigationRouteReadyObserver,useNavigationFeedback} from './src/containers/App/navigationFeedback';
library.add(faArrowLeft,faArrowRight,faCheck,faTimes,faStar,faSpinner,faCheckCircle,faTimesCircle,faKeyboard,faSparkles,faTrophy);
installNavigationPopGuard();
window.history.scrollRestoration='manual';
window.story=${JSON.stringify(story)};
window.questions=${JSON.stringify(questions)};
window.questionDelay=false;
window.submissions=[];
window.socketEvents=[];window.audios=[];window.audioUrls=[];window.revokedUrls=[];
URL.createObjectURL=()=>{const url='blob:fixture-'+window.audioUrls.length;window.audioUrls.push(url);return url;};
URL.revokeObjectURL=url=>window.revokedUrls.push(url);
window.Audio=class {constructor(src){this.src=src;this.paused=true;window.audios.push(this);}play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}removeAttribute(){this.src='';}load(){}};
window.requests={
  loadAIStoryTopic:async()=>({topic:'The park',topicKey:'park',type:'nonfiction',readCount:0,listenCount:0}),
  loadAIStory:async()=>{if(window.storyDelay)await new Promise(resolve=>window.finishStory=resolve);return {attemptId:7,storyObj:{id:42,story:window.story,explanation:''}};},
  loadAIStoryListeningAudio:async()=>{if(window.audioDelay)await new Promise(resolve=>window.finishAudio=resolve);return {attemptId:8,storyId:42,audioBlob:new Blob(['fixture'])};},
  loadAIStoryQuestions:async()=>{if(window.questionDelay)await new Promise(resolve=>window.finishQuestions=resolve);return window.questions;},
  uploadAIStoryAttempt:async payload=>{window.submissions.push(payload);return {isPassed:true,numCorrect:3,totalQuestions:3,answers:payload.answers.map(answer=>({...answer,answerIndex:0}))};},
  loadAIStoryClear:async()=>{if(window.clearDelay)await new Promise(resolve=>window.finishClear=resolve);return {story:{storyId:42,difficulty:1,numQuestions:3,xpRewardAmount:0,coinRewardAmount:0}};},
  getAiEnergyPolicy:async()=>({aiUsagePolicy:{energyRemaining:10,energyPercent:100}}),
  loadAIStoryVocabSummary:async()=>({eligibleCount:2,totalWords:2}),
  submitAIStoryVocabQuizAnswer:async({selectedIndex})=>({result:{isCorrect:true,collected:true,word:'tree',wordLevel:1,selectedIndex,answerIndex:0,definition:'A large plant with a woody trunk.'}}),
  loadAIStoryRankings:async()=>({myRank:12,all:Array.from({length:10},(_,i)=>({id:i+1,username:'Reader '+(i+1),rank:i+7,xpEarned:1000})),top30s:Array.from({length:30},(_,i)=>({id:i+1,username:'Reader '+(i+1),rank:i+1,xpEarned:1000}))})
};
function Navigation(){const navigate=useNavigate();const feedback=useNavigationFeedback();window.navigate=navigate;window.navigateWithFeedback=feedback.onNavigationStart;window.pendingTarget=feedback.pendingTarget;window.currentRoute=useLocation();return null;}
createRoot(document.getElementById('root')).render(
  <BrowserRouter><NavigationFeedbackProvider><Navigation/><NavigationRouteReadyObserver/><Routes><Route path="/arena" element={<Arena/>}/><Route path="*" element={<h1>Other page</h1>}/></Routes></NavigationFeedbackProvider></BrowserRouter>
);
`;

let bundle;
async function compileFixture() {
  if (bundle) return bundle;
  // Exercise the real Arena/AIStory/Game/Reading/ContentContainer tree and
  // controls. Substitute services and unrelated screens; no API/model calls.
  const stubs = {
    '~/contexts': `const noop=()=>{};export const useAppContext=select=>select({requestHelpers:window.requests,user:{actions:{onSetUserState:noop}}});export const useKeyContext=select=>select({myState:{userId:1,settings:{}}});export const useNotiContext=select=>select({state:{todayStats:{}},actions:{onApplyTodayStatsProgress:noop,onUpdateTodayStats:noop}});export const useViewContext=select=>select({state:{aiFeaturesDisabled:false}});`,
    '~/components/ErrorBoundary': `export default ({children})=>children;`,
    '~/components/LoggedOutPrompt': 'export default ()=>null;',
    '~/components/AIDisabledNotice': 'export default ()=>null;',
    '~/components/Button': `import React from 'react';export default ({children,onClick,disabled})=><button onClick={onClick} disabled={disabled}>{children}</button>;`,
    '~/components/Texts/RichText': `import React from 'react';export default ({children,style,className})=><div data-story-text className={className} style={{...style,whiteSpace:'pre-wrap'}}>{children}</div>;`,
    '~/helpers': 'export const sleep=ms=>new Promise(r=>setTimeout(r,ms));export const buildTodayStatsPatchFromDailyTaskStatus=x=>x;export const getDailyRewardPreviewStreak=()=>0;export const isMobile=()=>true;export const isTablet=()=>false;',
    '~/components/DailyRewardBoostStrip': `export const buildAIStoryRow=()=>({basicAchieved:false,excellenceAchieved:false,title:'Clear a story',description:'Clear three stories'});export const getBoostStreakMultiplier=()=>1;export const formatMultiplier=String;`,
    '~/components/ProfilePic': `import React from 'react';export default ()=> <span>Avatar</span>;`,
    '~/components/Texts/UsernameText': `import React from 'react';export default ({user})=><span>{user.username}</span>;`,
    '~/theme/hooks/useRoleColor': `export const useRoleColor=()=>({color:'#126bb5',colorKey:'logoBlue',themeName:'logoBlue'});`,
    '~/components/AiEnergyCard': 'export default ()=>null;',
    '~/helpers/userDataHelpers': 'export const getStoredItem=()=>1;export const setStoredItem=()=>{};',
    '~/helpers/analytics': 'export const trackEvent=()=>{};',
    '~/contexts/hooks': 'export const useInputContext=select=>select({getInputState:()=>({})});',
    '~/helpers/clientUpdate': 'export const hasUnsavedUserWork=()=>false;export const applyClientUpdateAtSafeBoundary=async()=>{};export const gateClientUpdateNavigation=async({destination,release})=>{release(destination);return "released";};',
    '~/helpers/ownerTrace': 'export const isOwnerTraceActive=()=>false;export const noteOwnerNavGate=()=>{};export const noteOwnerNavLocation=()=>{};export const noteOwnerNavStart=()=>{};export const noteOwnerRouteReady=()=>{};',
    '~/helpers/websiteAgentScreenState': 'export const useAgentScreenState=()=>{};',
    '~/helpers/socketAuthReady': 'export const waitForSocketAuthReady=async()=>{};',
    '~/constants/sockets/api': `
      const listeners=new Map();
      const publish=(event,data)=>{for(const fn of listeners.get(event)||[])fn(data);};
      window.publishStoryEvent=publish;
      export const socket={
        on(event,fn){if(!listeners.has(event))listeners.set(event,new Set());listeners.get(event).add(fn);},
        off(event,fn){listeners.get(event)?.delete(fn);},
        timeout(){return this;},
        emit(event,payload,ack){
          window.socketEvents.push(event);
          ack?.(null,{accepted:true});
          setTimeout(()=>{
            if(event==='generate_ai_story'){
              publish('ai_story_updated',{storyId:42,story:window.story});
              publish('ai_story_finished',42);
            }
            if(event==='generate_ai_story_explanations')publish('ai_story_explanation_finished',{storyId:42});
            if(event==='start_ai_story_vocab_quiz'||event==='request_next_ai_story_vocab_question'){
              if(event==='start_ai_story_vocab_quiz'){window.wordNumber=0;publish('ai_story_vocab_quiz_started',{storyId:42,totalQuestions:2});}
              window.wordNumber++;
              publish('ai_story_vocab_quiz_question',{storyId:42,totalQuestions:2,currentIndex:window.wordNumber-1,question:{id:window.wordNumber,question:'Vocabulary question '+window.wordNumber+': '+('Choose the word describing a large plant with a thick trunk. '.repeat(24)),choices:['Tree','River','Town','Car'],status:'collectable',wordLevel:1}});
            }
          },0);
        }
      };`,
    './paperFont': 'export const useArenaPaperFonts=()=>{};',
    './ModeChooser': 'export default ()=>null;',
    './Train': 'export default ()=>null;',
    './ReviewDeck': 'export default ()=>null;',
    './Skills': 'export default ()=>null;',
    './Drill': 'export default ()=>null;',
    './Reports': 'export default ()=>null;',
    './Battles': 'export default ()=>null;',
    './Challenge': 'export default ()=>null;',
    './BattleRunner': 'export default ()=>null;'
  };
  const result = await build({
    stdin: { contents: fixture, loader: 'tsx', resolveDir: repo },
    bundle: true, write: false, format: 'iife', platform: 'browser',
    alias: { '~': path.join(repo, 'src'), 'react-sanitized-html': path.join(repo, 'src/shims/react-sanitized-html.tsx') },
    define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"development"' },
    plugins: [{ name: 'story-scroll-fixture', setup(builder) {
      builder.onResolve({ filter: /.*/ }, ({ path: name }) => stubs[name] ? { path: name, namespace: 'fixture' } : undefined);
      builder.onLoad({ filter: /.*/, namespace: 'fixture' }, ({ path: name }) => ({ contents: stubs[name], loader: 'jsx', resolveDir: repo }));
      if (baseline) builder.onLoad({ filter: /\/AIStory\/.*\.tsx$/ }, ({ path: filename }) => {
        const saved = path.join(baseline, path.relative(repo, filename));
        return existsSync(saved) ? { contents: readFileSync(saved, 'utf8'), loader: 'tsx', resolveDir: path.dirname(filename) } : undefined;
      });
    } }]
  });
  bundle = result.outputFiles[0].text;
  return bundle;
}

async function settle(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function offsets(page) {
  return page.evaluate(() => [
    document.getElementById('App'),
    document.scrollingElement,
    ...document.querySelectorAll('#App div')
  ].filter(el => el && (el.scrollTop || el.scrollHeight > el.clientHeight + 1))
    .map(el => ({ id: el.id, top: el.scrollTop, height: el.clientHeight, scrollHeight: el.scrollHeight, overflow: getComputedStyle(el).overflowY, firstChild: el.firstElementChild?.tagName })));
}

async function assertAtTop(page, label) {
  await settle(page);
  const surfaces = await offsets(page);
  assert.ok(surfaces.every(surface => surface.top === 0), `${label}: ${JSON.stringify(surfaces)}`);
}

for (const [engine, browserType] of Object.entries({ chromium, webkit })) {
  test(`AI Story starts each view at the top without resetting answers (${engine})`, { timeout: 90000 }, async () => {
    const script = await compileFixture();
    const browser = await browserType.launch();
    const observations = [];
    try {
      for (const width of [360, 390, 1280]) {
        const page = await browser.newPage({ viewport: { width, height: 850 }, hasTouch: width < 768 });
        page.setDefaultTimeout(8000);
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/*', route => route.request().url().startsWith('http://localhost:3000/')
          ? route.fulfill({ contentType: 'text/html', body: `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${readFileSync(path.join(repo, 'src/styles.css'), 'utf8')}#root{height:100%}body{margin:0}#App{height:100dvh}</style></head><body><div id="App" class="${width === 360 ? 'ios' : ''}"><div id="root"></div></div></body></html>` })
          : route.abort());
        await page.goto('http://localhost:3000/arena?mode=train&play=ai-story');
        await page.addScriptTag({ content: script });
        const read = page.getByRole('button', { name: /^Read 0 \/ 5 cleared/ });
        await read.click();
        const solve = page.getByRole('button', { name: 'Solve Questions', exact: true });
        await solve.waitFor();
        for (let cycle = 0; cycle < 3; cycle++) {
          await solve.scrollIntoViewIfNeeded();
          const beforeQuestions = await offsets(page);
          assert.ok(beforeQuestions.some(surface => surface.top > 100), 'Reading must really be scrolled before switching');
          await solve.click();
          await page.getByText(questions[0].question, { exact: true }).waitFor();
          await settle(page);
          const afterQuestions = await offsets(page);
          observations.push({ width, cycle, beforeQuestions, afterQuestions });
          if (!baseline) await assertAtTop(page, 'Story → questions');
          else if (width < 768) assert.ok(afterQuestions.some(surface => surface.top > 100), 'Reproduce the old mobile question offset');
          if (artifacts && cycle === 0) {
            mkdirSync(artifacts, { recursive: true });
            await page.screenshot({ path: path.join(artifacts, `${engine}-${width}-questions.png`) });
          }
          const readAgain = page.getByRole('button', { name: 'Read Again', exact: true });
          await readAgain.scrollIntoViewIfNeeded();
          const beforeStory = await offsets(page);
          assert.ok(beforeStory.some(surface => surface.top > 100), 'Questions must really be scrolled before switching');
          await readAgain.click();
          await solve.waitFor();
          await settle(page);
          const afterStory = await offsets(page);
          observations.push({ width, cycle, beforeStory, afterStory });
          if (!baseline) await assertAtTop(page, 'Questions → story');
          else if (width < 768) assert.ok(afterStory.some(surface => surface.top > 100), 'Reproduce the old mobile story offset');
          if (artifacts && cycle === 0) await page.screenshot({ path: path.join(artifacts, `${engine}-${width}-story.png`) });
        }
        if (!baseline) {
          await solve.click();
          const choices = page.getByRole('button', { name: 'A Under the big trees.', exact: true });
          for (let i = 0; i < questions.length; i++) {
            const choice = choices.nth(i);
            await choice.scrollIntoViewIfNeeded();
            await settle(page);
            const beforeChoice = await offsets(page);
            await choice.click();
            await settle(page);
            assert.deepEqual(await offsets(page), beforeChoice, 'Selecting an answer must preserve scroll');
          }
          await page.getByRole('button', { name: 'Read Again', exact: true }).click();
          await solve.click();
          assert.equal(await page.locator('button[aria-pressed="true"]').count(), 3, 'Reading again retains all answers');
          await page.getByRole('button', { name: 'Finish', exact: true }).click();
          await page.getByText('Level 1 cleared!', { exact: true }).waitFor();
          await assertAtTop(page, 'Questions → clear screen');
          await page.getByRole('button', { name: 'Back to story', exact: true }).click();
          await page.getByRole('button', { name: 'Reopen Clear Screen', exact: true }).waitFor();
          await assertAtTop(page, 'Clear screen → graded questions');
          await page.getByRole('button', { name: 'Read Again', exact: true }).click();
          const review = page.getByRole('button', { name: 'Review Questions', exact: true });
          await review.waitFor();
          await assertAtTop(page, 'Graded questions → story');
          await review.click();
          await assertAtTop(page, 'Graded story → questions');
          await page.getByRole('button', { name: 'New Story', exact: true }).click();
          await read.waitFor();
          await assertAtTop(page, 'New Story → menu');

          // Questions may arrive after the user has already left the story.
          await page.evaluate(() => { window.questionDelay = true; });
          await read.click();
          await solve.click();
          await page.waitForFunction(() => typeof window.finishQuestions === 'function');
          await assertAtTop(page, 'Story → question loader');
          await page.evaluate(() => window.finishQuestions());
          await page.getByText(questions[0].question, { exact: true }).waitFor();
          await assertAtTop(page, 'Question loader → questions');
          for (let i = 0; i < questions.length; i++) await choices.nth(i).click();
          await page.getByRole('button', { name: 'Finish', exact: true }).click();
          await page.getByText('Level 1 cleared!', { exact: true }).waitFor();
          await page.getByRole('button', { name: 'Collect Words', exact: true }).click();
          await page.getByText(/^Vocabulary question 1:/).waitFor();
          await assertAtTop(page, 'Clear screen → vocabulary quiz');
          await page.getByRole('button', { name: 'A Tree', exact: true }).click();
          await page.getByRole('button', { name: 'Next Word', exact: true }).click();
          await page.getByText(/^Vocabulary question 2:/).waitFor();
          await assertAtTop(page, 'Next vocabulary question');
          await page.getByRole('button', { name: 'A Tree', exact: true }).click();
          await page.getByRole('button', { name: 'Finish', exact: true }).click();
          await page.getByRole('button', { name: 'Word Master', exact: true }).waitFor();
          await assertAtTop(page, 'Vocabulary quiz → results');
          await page.getByRole('button', { name: 'Close', exact: true }).click();
          await page.getByText('Level 1 cleared!', { exact: true }).waitFor();
          await assertAtTop(page, 'Vocabulary results → clear screen');
          await page.getByRole('button', { name: 'Story menu', exact: true }).click();
          await read.waitFor();
          await assertAtTop(page, 'Clear screen → Story menu');
          assert.equal(await page.evaluate(() => window.submissions.length), 2);
        }
        assert.deepEqual(errors, []);
        await page.close();
      }
      if (artifacts) writeFileSync(path.join(artifacts, `${engine}-offsets.json`), JSON.stringify(observations, null, 2) + '\n');
    } finally {
      await browser.close();
    }
  });

  if (!baseline) test(`AI Story guards navigation and disposes loading/audio work (${engine})`, { timeout: 60000 }, async () => {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 390, height: 850 }, hasTouch: true });
      page.setDefaultTimeout(8000);
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('dialog', dialog => dialog.dismiss());
      await page.route('**/*', route => route.request().url().startsWith('http://localhost:3000/')
        ? route.fulfill({ contentType: 'text/html', body: `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>${readFileSync(path.join(repo, 'src/styles.css'), 'utf8')}#root{height:100%}body{margin:0}#App{height:100dvh}</style><div id="App"><div id="root"></div></div><div id="modal"></div>` })
        : route.abort());
      await page.goto('http://localhost:3000/before-story');
      await page.addScriptTag({ content: await compileFixture() });
      await page.getByRole('heading', { name: 'Other page' }).waitFor();
      const storyPath = '/arena?mode=train&play=ai-story';
      const read = page.getByRole('button', { name: /^Read 0 \/ 5 cleared/ });
      const listen = page.getByRole('button', { name: /^Listen 2× rewards 0 \/ 5 cleared/ });
      const dialog = page.getByRole('dialog');
      await page.evaluate(pathname => window.navigate(pathname), storyPath);
      await read.click();
      await page.getByRole('button', { name: 'Solve Questions', exact: true }).click();
      await page.getByRole('button', { name: 'A Under the big trees.', exact: true }).first().click();
      assert.equal(await page.evaluate(() => window.dispatchEvent(new Event('beforeunload', { cancelable: true }))), false);

      await page.evaluate(() => window.navigateWithFeedback('/outside'));
      await dialog.waitFor();
      await page.waitForFunction(() => window.pendingTarget === null);
      if (artifacts) {
        mkdirSync(artifacts, { recursive: true });
        await page.screenshot({ path: path.join(artifacts, `${engine}-leave-confirmation.png`), animations: 'disabled' });
      }
      await dialog.getByRole('button', { name: 'Cancel' }).click();

      await page.evaluate(pathname => window.navigate(pathname + '#reading'), storyPath);
      await page.waitForURL('**#reading');
      assert.equal(await dialog.count(), 0, 'Same-story navigation must not warn');
      await page.evaluate(() => history.back());
      await page.waitForURL(url => !url.hash && url.pathname === '/arena');
      assert.equal(await page.locator('button[aria-pressed="true"]').count(), 1);

      for (const replace of [false, true]) {
        await page.evaluate(replace => window.navigate('/outside', { replace }), replace);
        await dialog.waitFor();
        assert.equal(new URL(page.url()).pathname, '/arena');
        await dialog.getByRole('button', { name: 'Cancel' }).click();
        assert.equal(await page.locator('button[aria-pressed="true"]').count(), 1);
      }
      await page.getByRole('button', { name: 'Back to Train', exact: true }).click();
      await dialog.waitFor();
      await dialog.getByRole('button', { name: 'Cancel' }).click();
      const historyLength = await page.evaluate(() => history.length);
      // The second Back can reach the prior document. Dismiss its native
      // beforeunload prompt just as a member choosing to keep the story would.
      await page.evaluate(() => { history.back(); history.back(); });
      await dialog.waitFor();
      assert.equal(new URL(page.url()).pathname, '/arena');
      assert.equal(await page.evaluate(() => window.currentRoute.pathname), '/arena');
      assert.equal(await page.evaluate(() => history.length), historyLength, 'Back cancellation must not grow history');
      await dialog.getByRole('button', { name: 'Cancel' }).click();
      assert.equal(await page.locator('button[aria-pressed="true"]').count(), 1);
      await page.evaluate(() => history.back());
      await dialog.waitFor();
      await dialog.getByRole('button', { name: 'Leave anyway' }).click();
      await page.waitForURL('**/before-story');
      await page.getByRole('heading', { name: 'Other page' }).waitFor();
      await page.evaluate(() => history.forward());
      await read.waitFor();
      await read.click();
      await page.getByRole('button', { name: 'Solve Questions', exact: true }).waitFor();
      await page.evaluate(() => window.navigate('/outside', { replace: true }));
      await dialog.waitFor();
      await dialog.getByRole('button', { name: 'Leave anyway' }).click();
      await page.waitForURL('**/outside');
      await page.getByRole('heading', { name: 'Other page' }).waitFor();

      // Leaving while an HTTP response is pending must not start a new stream.
      await page.evaluate(pathname => { window.storyDelay = true; window.navigate(pathname); }, storyPath);
      await read.click();
      await page.waitForFunction(() => typeof window.finishStory === 'function');
      const eventsBeforeLeave = await page.evaluate(() => window.socketEvents.length);
      await page.evaluate(() => window.navigate('/outside'));
      await dialog.waitFor();
      await dialog.getByRole('button', { name: 'Leave anyway' }).click();
      await page.waitForURL('**/outside');
      await page.getByRole('heading', { name: 'Other page' }).waitFor();
      await page.evaluate(() => window.finishStory());
      await settle(page);
      assert.equal(await page.evaluate(() => window.socketEvents.length), eventsBeforeLeave);

      // The same lifecycle boundary applies to listening audio and object URLs.
      await page.evaluate(pathname => { window.audioDelay = true; window.navigate(pathname); }, storyPath);
      await listen.click();
      await page.waitForFunction(() => typeof window.finishAudio === 'function');
      await page.evaluate(() => window.navigate('/outside'));
      await dialog.waitFor();
      await dialog.getByRole('button', { name: 'Leave anyway' }).click();
      await page.waitForURL('**/outside');
      await page.getByRole('heading', { name: 'Other page' }).waitFor();
      await page.evaluate(() => window.finishAudio());
      await settle(page);
      assert.equal(await page.evaluate(() => window.audios.length), 0);
      assert.equal(await page.evaluate(() => window.audioUrls.length), 0);
      await page.evaluate(pathname => { window.audioDelay = false; window.navigate(pathname); }, storyPath);
      await listen.click();
      await page.getByRole('button', { name: 'Start Listening', exact: true }).click();
      assert.equal(await page.evaluate(() => window.audios.at(-1).paused), false);
      await page.evaluate(() => window.navigate('/outside'));
      await dialog.waitFor();
      await dialog.getByRole('button', { name: 'Cancel' }).click();
      assert.equal(await page.evaluate(() => window.audios.at(-1).paused), false, 'Cancelling leave keeps the listening session alive');
      await page.evaluate(() => window.audios.at(-1).onended());
      await page.getByText(questions[0].question, { exact: true }).waitFor();
      await assertAtTop(page, 'Listening → questions');
      const choices = page.getByRole('button', { name: 'A Under the big trees.', exact: true });
      for (let i = 0; i < questions.length; i++) await choices.nth(i).click();
      await page.evaluate(() => { window.clearDelay = true; });
      await page.getByRole('button', { name: 'Finish', exact: true }).click();
      await page.waitForFunction(() => typeof window.finishClear === 'function');
      await page.getByRole('button', { name: 'Reopen Clear Screen', exact: true }).waitFor();
      assert.equal(await page.evaluate(() => window.dispatchEvent(new Event('beforeunload', { cancelable: true }))), true, 'A saved result must not warn about unsaved progress');
      await page.getByRole('button', { name: 'New Story', exact: true }).click();
      await read.waitFor();
      await page.evaluate(() => window.finishClear());
      await settle(page);
      assert.ok(await read.isVisible(), 'A late clear-screen response must not replace the story menu');
      await page.evaluate(() => window.navigate('/outside'));
      await page.waitForURL('**/outside');
      await page.getByRole('heading', { name: 'Other page' }).waitFor();
      assert.equal(await dialog.count(), 0);
      assert.equal(await page.evaluate(() => window.audios.at(-1).paused), true);
      assert.deepEqual(await page.evaluate(() => window.revokedUrls), await page.evaluate(() => window.audioUrls));

      // The previously modal leaderboard must still reach its last row.
      await page.evaluate(pathname => window.navigate(pathname), storyPath);
      await page.getByRole('tab', { name: 'Rankings', exact: true }).click();
      await page.getByRole('button', { name: 'Top 30', exact: true }).click();
      await page.getByText('Reader 30', { exact: true }).scrollIntoViewIfNeeded();
      assert.ok(await page.getByText('Reader 30', { exact: true }).isVisible());
      await page.getByRole('tab', { name: 'Game', exact: true }).click();
      await read.waitFor();
      await assertAtTop(page, 'Rankings → menu');
      await page.evaluate(() => window.navigateWithFeedback('/outside'));
      await page.getByRole('heading', { name: 'Other page' }).waitFor();
      await page.waitForFunction(() => window.pendingTarget === null);
      assert.equal(await dialog.count(), 0, 'Normal navigation remains unblocked outside an attempt');

      // Older screens can create history entries without the router index.
      await page.evaluate(() => {
        history.pushState({ usr: { legacy: true } }, '', '/legacy');
        window.storyDelay = false;
        window.navigate('/legacy-bridge');
      });
      await page.waitForURL('**/legacy-bridge');
      await page.evaluate(pathname => window.navigate(pathname), storyPath);
      await read.click();
      await page.getByRole('button', { name: 'Solve Questions', exact: true }).waitFor();
      await page.evaluate(() => { history.back(); history.back(); });
      await dialog.waitFor();
      assert.equal(new URL(page.url()).pathname, '/arena');
      await dialog.getByRole('button', { name: 'Cancel' }).click();
      await page.evaluate(() => history.back());
      await dialog.waitFor();
      await dialog.getByRole('button', { name: 'Leave anyway' }).click();
      // WebKit may coalesce the two Back requests into one traversal.
      await page.waitForURL(url => ['/legacy', '/legacy-bridge'].includes(url.pathname));
      await page.getByRole('heading', { name: 'Other page' }).waitFor();
      await page.evaluate(pathname => {
        history.pushState({ usr: { legacy: true } }, '', '/legacy');
        window.navigate(pathname);
      }, storyPath);
      await read.click();
      await page.getByRole('button', { name: 'Solve Questions', exact: true }).waitFor();
      await page.evaluate(() => history.back());
      await dialog.waitFor();
      await dialog.getByRole('button', { name: 'Leave anyway' }).click();
      await page.waitForURL('**/legacy');
      await page.getByRole('heading', { name: 'Other page' }).waitFor();
      assert.deepEqual(errors, []);
    } finally { await browser.close(); }
  });
}
