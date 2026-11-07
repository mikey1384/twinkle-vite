import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { build, stop } from 'esbuild';

// Grammarbles Classic, reopened mid-round (Mikey 11-07: "go Grammarbles
// resume"): the real round screen renders the server's resumed round — the
// earned marbles, the question in play with its choices up at once (they were
// already seen), picks numbered after the round's last — and a new round still
// starts at question 1 with the usual reading pause.

const require = createRequire(import.meta.url);
const {
  chromium,
  webkit
} = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const artifacts =
  process.env.GRAMMARBLES_RESUME_ARTIFACTS ||
  path.resolve(repo, '../work/grammarbles-resume-20261107/browser');
// (from a scratch copy, set GRAMMARBLES_RESUME_ARTIFACTS)
const base = './src/containers/Home/GrammarGameModal/';

const contexts = `
window.calls={start:0,answers:[],shown:[],finish:[],cancel:[]};
const app={user:{actions:{onSetUserState(){}}},requestHelpers:{
 startGrammarSession:async()=>{window.calls.start++;return window.startPayload},
 markGrammarQuestionShown:async p=>{window.calls.shown.push({...p,at:performance.now()});return {recorded:true}},
 checkGrammarAnswer:async p=>{window.calls.answers.push(p);return window.answerReply(p)},
 finishGrammarSession:async p=>{window.calls.finish.push(p);return {scoreArray:window.finalScores,newXp:100,isDuplicate:false}},
 cancelGrammarGame:async p=>{window.calls.cancel.push(p);return {cancelled:true}},
 updateGrammarblesSettings:async()=>({})
}};
export const useAppContext=s=>s(app);
export const useKeyContext=s=>s({myState:{userId:7,profileTheme:'logoBlue',settings:{grammarbles:{music:false,sound:false}}}});
export const useHomeContext=s=>s({actions:{onUpdateGrammarLoadingStatus(){},onUpdateGrammarGenerationProgress(){}}});
export const useNotiContext=s=>s({actions:{onApplyTodayStatsProgress(){},onUpdateTodayStats(){}},state:{todayStats:{}}});
export const useViewContext=s=>s({state:{aiFeaturesDisabled:false}});
`;
const entry = `
import React from 'react';import {createRoot} from 'react-dom/client';
import Grammarbles from '${base}index';
localStorage.setItem('userId','7');
window.mount=()=>createRoot(document.getElementById('root')).render(<Grammarbles onHide={()=>{}}/>);
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
    './ModeChooser': `import React from 'react';export default function Choose({onPick}){return <button onClick={()=>onPick('classic')}>Classic</button>}`,
    './StartScreen': `import React from 'react';export default function Start({onGameStart}){return <button onClick={onGameStart}>Start round</button>}`,
    './FinishScreen': `import React from 'react';export default function Finish(){return <div>Round finished</div>}`,
    './Review': 'export default function ClassicReview(){return null}',
    './Review/QuestReview': 'export default function QuestReview(){return null}',
    './Rankings': 'export default function Rankings(){return null}',
    './Quest': 'export default function Quest(){return null}'
  };
  try {
    const result = await build({
      stdin: { contents: entry, resolveDir: repo, loader: 'tsx' },
      bundle: true,
      write: false,
      format: 'iife',
      platform: 'browser',
      jsx: 'transform',
      loader: { '.wav': 'dataurl', '.png': 'dataurl', '.webp': 'dataurl', '.mp3': 'dataurl', '.woff2': 'dataurl' },
      define: {
        'process.env.NODE_ENV': '"development"',
        'import.meta.env': '{"DEV":false}'
      },
      plugins: [
        {
          name: 'grammarbles-resume-fixture',
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
    await stop();
  }
}

const question = (index) => ({
  index,
  question: `Pick the right word for sentence ${index + 1}.`,
  choices: [`alpha ${index}`, `bravo ${index}`, `charlie ${index}`, `delta ${index}`]
});

async function openPage(engine, startPayload) {
  const script = await compile();
  const css = readFileSync(path.join(repo, 'src/styles.css'), 'utf8');
  const html = `<meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div id="root"></div><div id="modal"></div><script>${script.replaceAll('</script', '<\\/script')}</script>`;
  const browser = await engine.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/*', (r) =>
    r.request().isNavigationRequest()
      ? r.fulfill({ contentType: 'text/html', body: html })
      : r.abort()
  );
  await page.goto('http://localhost:3000/__grammarbles-resume');
  await page.evaluate((payload) => {
    window.startPayload = payload;
    window.answerReply = (p) => ({
      isCorrect: true,
      questionIndex: p.questionIndex,
      choiceIndex: p.choiceIndex,
      grade: 'B',
      nextQuestion: {
        index: p.questionIndex + 1,
        question: `Pick the right word for sentence ${p.questionIndex + 2}.`,
        choices: ['a', 'b', 'c', 'd'].map((l) => `${l}${p.questionIndex + 1}`)
      },
      finished: false
    });
    window.mount();
  }, startPayload);
  await page.getByRole('button', { name: 'Classic' }).click();
  return { browser, page, errors };
}

const marbles = (page) =>
  page.$$eval('.track .ball', (balls) => balls.map((b) => b.textContent || ''));

for (const [name, engine] of [
  ['chromium', chromium],
  ['webkit', webkit]
]) {
  test(`${name}: a resumed round shows its marbles and continues at the question in play`, { timeout: 60000 }, async () => {
    mkdirSync(artifacts, { recursive: true });
    const { browser, page, errors } = await openPage(engine, {
      sessionId: 77,
      attemptNumber: 2,
      level: 2,
      totalQuestions: 10,
      resumed: true,
      question: question(3),
      grades: ['S', 'A', 'C', null, null, null, null, null, null, null],
      wrongPicks: 1,
      revealDelayMs: 0,
      lastClickId: 7,
      finished: false
    });
    try {
      await page.getByRole('button', { name: 'Start round' }).click();
      await page.getByText('Pick the right word for sentence 4.').waitFor();
      // already seen before the reopen: the choices are up at once
      await page.getByText('bravo 3', { exact: true }).waitFor({ state: 'visible', timeout: 1000 });
      assert.deepEqual(await marbles(page), ['S', 'A', 'C', '', '', '', '', '', '', '']);
      await page.waitForFunction(() => window.calls.shown.length === 1);
      assert.equal(await page.evaluate(() => window.calls.shown[0].questionIndex), 3);
      assert.equal(await page.evaluate(() => window.calls.shown[0].sessionId), 77);
      await page.waitForTimeout(900); // the marbles' appear animation
      await page.screenshot({ path: path.join(artifacts, `${name}-resumed.png`) });
      await page.getByText('bravo 3', { exact: true }).click();
      await page.waitForFunction(() => window.calls.answers.length === 1);
      const sent = await page.evaluate(() => window.calls.answers[0]);
      assert.equal(sent.sessionId, 77);
      assert.equal(sent.questionIndex, 3);
      assert.equal(sent.choiceIndex, 1);
      assert.equal(sent.clickId, 8, 'numbered after the round’s last pick');
      assert.ok(sent.elapsedMs >= 0 && sent.elapsedMs < 20000);
      await page.getByText('Pick the right word for sentence 5.').waitFor();
      assert.deepEqual(await marbles(page), ['S', 'A', 'C', 'B', '', '', '', '', '', '']);
      await page.waitForTimeout(900);
      await page.screenshot({ path: path.join(artifacts, `${name}-resumed-next.png`) });
      assert.equal(await page.evaluate(() => window.calls.start), 1);
      assert.deepEqual(errors, []);
    } finally {
      await browser.close();
    }
  });

  test(`${name}: a new round still starts at question 1 after the usual reading pause`, { timeout: 60000 }, async () => {
    const { browser, page, errors } = await openPage(engine, {
      sessionId: 78,
      attemptNumber: 1,
      level: 1,
      totalQuestions: 10,
      question: question(0)
    });
    try {
      await page.getByRole('button', { name: 'Start round' }).click();
      await page.getByText('Pick the right word for sentence 1.').waitFor();
      const shownAt = await page.evaluate(() => performance.now());
      assert.equal(await page.getByText('bravo 0', { exact: true }).isVisible(), false);
      await page.getByText('bravo 0', { exact: true }).waitFor({ state: 'visible', timeout: 4000 });
      assert.ok((await page.evaluate(() => performance.now())) - shownAt > 1000, 'choices wait for the reading pause');
      assert.deepEqual(await marbles(page), Array(10).fill(''));
      await page.getByText('alpha 0', { exact: true }).click();
      await page.waitForFunction(() => window.calls.answers.length === 1);
      const sent = await page.evaluate(() => window.calls.answers[0]);
      assert.equal(sent.questionIndex, 0);
      assert.equal(sent.clickId, 1);
      assert.equal(await page.evaluate(() => window.calls.shown[0]?.questionIndex), 0);
      assert.deepEqual(errors, []);
    } finally {
      await browser.close();
    }
  });

  test(`${name}: a round answered to the end before the reopen goes straight to finishing`, { timeout: 60000 }, async () => {
    const { browser, page, errors } = await openPage(engine, {
      sessionId: 79,
      attemptNumber: 3,
      level: 3,
      totalQuestions: 10,
      resumed: true,
      question: null,
      grades: Array(10).fill('A'),
      wrongPicks: 0,
      revealDelayMs: 0,
      lastClickId: 12,
      finished: true
    });
    try {
      await page.evaluate(() => { window.finalScores = Array(10).fill('A'); });
      await page.getByRole('button', { name: 'Start round' }).click();
      await page.getByText('Round finished').waitFor({ timeout: 15000 });
      assert.deepEqual(await page.evaluate(() => window.calls.finish), [{ sessionId: 79 }]);
      assert.equal(await page.evaluate(() => window.calls.answers.length), 0);
      assert.equal(await page.evaluate(() => window.calls.shown.length), 0);
      assert.deepEqual(errors, []);
    } finally {
      await browser.close();
    }
  });
}
