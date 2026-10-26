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
const artifacts = path.resolve(repo, '../work/grammar-quest-review-20261026');
const base = './src/containers/Home/GrammarGameModal/';
const fontPath = path.join(artifacts, 'pixel-font.woff2');
const font = existsSync(fontPath) ? readFileSync(fontPath) : null;
const contexts = `
window.reportCalls=[];window.challengeCalls=[];window.missCalls=[];
const app={user:{actions:{onSetUserState(){}}},requestHelpers:{
 loadGrammarQuestState:async()=>({worlds:[{id:1,name:'Village',unlocked:true,nodes:[]},{id:4,name:'Forest',unlocked:true,nodes:[]}],nemesis:[],rewardedRunsLeft:10}),
 loadGrammarQuestMisses:async p=>{window.missCalls.push(p);if(window.loadFailure){window.loadFailure=false;throw Error('offline')};return p.before?{items:[window.extraMiss],next:null}:{items:window.misses,next:'older'}},
 reportGrammarQuestion:async p=>{window.reportCalls.push(p);if(window.reportFailure){window.reportFailure=false;throw Error('Try again after reconnecting.')};if(window.holdReport)return new Promise(r=>window.finishReport=()=>r({reportId:91}));return {reportId:91}},
 challengeGrammarQuestion:async p=>{window.challengeCalls.push(p);return {justified:false,explanation:'The shared reviewer confirmed the answer.'}}
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
window.misses=[
 {questionId:101,questionVersion:1,runId:80,position:0,kind:'stop',nodeId:'w4s1',format:'blank',questionText:'She ____ to school every day.',answeredAt:1792990000,challenge:{questionId:101,checked:false}},
 {questionId:202,questionVersion:2,runId:81,position:2,kind:'castle',nodeId:'w4c',format:'crack',questionText:'The sentence was already reviewed, but the marked word still seems wrong.',answeredAt:1792989000,challenge:{questionId:202,checked:true,review:{outcome:'rejected',explanation:'An earlier reviewer accepted this wording.'}}},
 {questionId:303,questionVersion:3,runId:82,position:4,sourceIndex:2,kind:'fort',nodeId:'w4f1',format:'stomp',questionText:'This retired sentence can still be reported with its own source question ID.',answeredAt:1792988000,challenge:null}
];
window.extraMiss={...window.misses[0],questionId:404,runId:79,questionText:'An older question.',challenge:{questionId:404,checked:false}};
localStorage.setItem('userId','7');localStorage.setItem('grammarQuestSound','0');localStorage.setItem('grammarQuestMusic','0');
createRoot(document.getElementById('root')).render(<Grammarbles onHide={()=>{}}/>);
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
    './MarbleRunScreen': 'export default function Marble(){return null}'
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
          assert.equal(await page.locator('article').count(), 3);
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
            .filter({ hasText: 'The sentence was already reviewed' });
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
          assert.equal(await page.locator('article').count(), 4);
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
          assert.deepEqual(errors, []);
          await page.close();
        }
      } finally {
        await browser.close();
      }
    }
  );
}
