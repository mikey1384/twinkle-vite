import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

// Mikey 11-02: the per-question Ask buttons on Arena papers keep their words
// on phones ("Ask Zero" / "Ask Ciel"), with nothing overflowing at 320, 360
// and 390 wide: long Korean questions, the OMR bar, the timer and the
// "Stuck?" offer, with either companion. The real AskAgentButton renders
// here (its Button, face and colours are real; contexts, the error
// boundary and the voice preference are stubbed). ARENA_ASK_ARTIFACTS=<dir> saves renders.

const require = createRequire(import.meta.url);
const { chromium, webkit } = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const artifacts = process.env.ARENA_ASK_ARTIFACTS;
const FACE = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
const paper = JSON.parse(readFileSync(new URL('./fixtures/arenaLtMathE6EasyShort.json', import.meta.url), 'utf8'));
// a long Korean question with a long unbroken run, on top of the real paper
const longItem = {
  no: 20, type: 'ltm.thinking.short', section: 'main', points: 5, passageId: null, typed: 'integer', choices: [], answer: null,
  stem: '어떤 수를 \\( 7 \\)로 나누면 나머지가 \\( 3 \\)이고, 같은 수를 \\( 11 \\)로 나누면 나머지가 \\( 5 \\)이며, 같은 수를 \\( 13 \\)으로 나누면 나머지가 \\( 9 \\)이다. 이러한 조건을 모두 만족하는 세 자리 자연수 중에서 가장 작은 수와 가장 큰 수의 차를 구하시오. 단, 조건을만족하는수는반드시세자리자연수이어야하며나머지의정의에주의한다.'
};

const fixture = `
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import {library} from '@fortawesome/fontawesome-svg-core';
import {faArrowLeft,faClock,faCheck,faChevronUp,faChevronDown,faSpinner,faTrophy} from '@fortawesome/pro-solid-svg-icons';
import BattleRunner from './src/containers/Arena/BattleRunner';
library.add(faArrowLeft,faClock,faCheck,faChevronUp,faChevronDown,faSpinner,faTrophy);
const PAPER=${JSON.stringify({ ...paper, items: [...paper.items, longItem] })};
window.companion='Zero';window.startedAgo=300;
function data(){const now=Math.floor(Date.now()/1000);return {
 battle:{id:139,companion:window.companion,exam:{key:'lt-math-e6',name:'수학학원 레벨테스트 (초5–6)',nameEn:'Academy Math Level Test (Grades 5–6)',language:'ko',code:'E6-2',codeLabel:'레벨테스트',pointTags:'all',layout:'problem',choices:5},length:'short',difficulty:'easy',mode:'battle',status:'open',minutes:25,serverNow:now,startedAt:now-window.startedAgo,deadlineAt:now-window.startedAgo+1500,finishedAt:null,rawPoints:null,maxPoints:55,grade:null,estimate:null},
 passages:PAPER.passages,
 items:PAPER.items.map(item=>({...item,key:undefined,correct:undefined,review:undefined}))
};}
window.requests={loadArenaBattle:async()=>data(),saveArenaAnswer:async args=>({saved:true,answer:args.answer}),submitArenaBattle:async()=>data()};
function Fixture(){const [key,setKey]=useState(0);window.setCompanion=c=>{window.companion=c;setKey(x=>x+1);};return <BattleRunner key={key} battleId={139} onExit={()=>{}}/>;}
createRoot(document.getElementById('react-view')).render(<MemoryRouter><Fixture/></MemoryRouter>);
`;

let bundle;
async function compile() {
  if (bundle) return bundle;
  const stubs = {
    '~/contexts': 'export const useAppContext=select=>select({requestHelpers:window.requests});export const useNotiContext=select=>select({actions:{onApplyTodayStatsProgress:()=>{}}});export const useChatContext=select=>select({state:{zeroChannelId:11,cielChannelId:12}});export const useKeyContext=select=>select({myState:{userId:18353,profileTheme:"logoBlue"}});',
    '~/helpers': 'export const buildTodayStatsPatchFromDailyTaskStatus=x=>x;',
    '~/helpers/hooks/useUserActivity': 'export default ()=>{};',
    '~/helpers/websiteAgentScreenState': 'export const useAgentScreenState=()=>{};',
    '~/constants/sockets/api': 'export const socket={emit(){},on(){},off(){}};',
    '~/containers/App/AssistantDock/dockState': 'export function openAssistantDock(assistant,context){window.opened={assistant,context};}',
    // layout-neutral wrappers whose own imports reach the whole app
    '~/components/ErrorBoundary': 'export default ({children})=>children;',
    '~/helpers/assistantVoice': 'export const useUserAssistant=()=>"Zero";',
    './EssayAnswer': 'export default ()=>null;',
    './SpokenAnswer': 'export default ()=>null;',
    './MarkReview': 'export default ()=>null;'
  };
  const result = await build({
    stdin: { contents: fixture, resolveDir: repo, loader: 'tsx' }, bundle: true, write: false,
    format: 'iife', platform: 'browser', alias: { '~': path.join(repo, 'src') },
    loader: { '.png': 'dataurl', '.svg': 'dataurl', '.jpg': 'dataurl', '.webp': 'dataurl', '.mp3': 'dataurl' },
    define: { 'import.meta.env': '{"VITE_ZERO_TWINKLE_ID":"1","VITE_CIEL_TWINKLE_ID":"2","VITE_ZERO_PFP_URL":"http://localhost:3000/zero.png","VITE_CIEL_PFP_URL":"http://localhost:3000/ciel.png"}', 'process.env.NODE_ENV': '"development"' },
    plugins: [{ name: 'ask-fixture-services', setup(builder) {
      builder.onResolve({ filter: /.*/ }, ({ path }) => stubs[path] ? { path, namespace: 'fixture' } : undefined);
      builder.onLoad({ filter: /.*/, namespace: 'fixture' }, ({ path }) => ({ contents: stubs[path], loader: 'jsx', resolveDir: repo }));
    } }]
  });
  bundle = result.outputFiles[0].text;
  return bundle;
}

for (const [engineName, engine] of Object.entries({ chromium, webkit })) {
  test(`Arena paper Ask buttons keep their words on phones without overflow (${engineName})`, { timeout: 120000 }, async () => {
    const script = await compile();
    const browser = await engine.launch();
    try {
      for (const width of [320, 360, 390]) {
        const height = 780;
        const page = await browser.newPage({ viewport: { width, height }, hasTouch: true, isMobile: engineName === 'chromium' });
        page.setDefaultTimeout(8000);
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        // the faces are real images at their real size, so the button is as wide as on the site
        await page.route('**/*', (route) => {
          const url = route.request().url();
          if (url === 'http://localhost:3000/') return route.fulfill({ contentType: 'text/html', body: `<meta name="viewport" content="width=device-width, initial-scale=1"><style>${readFileSync(path.join(repo, 'src/styles.css'), 'utf8')}</style><div id="react-view"></div>` });
          if (/\/(zero|ciel)\.png$/.test(url)) return route.fulfill({ contentType: 'image/png', body: FACE });
          return route.abort();
        });
        await page.goto('http://localhost:3000/');
        await page.evaluate(() => { try { localStorage.clear(); } catch {} });
        await page.addScriptTag({ content: script });
        for (const companion of ['Zero', 'Ciel', 'solo']) {
          await page.waitForFunction(() => typeof window.setCompanion === 'function');
          await page.evaluate((c) => window.setCompanion(c), companion);
          await page.locator('header').getByRole('button', { name: 'Leave' }).waitFor();
          await page.locator('article').first().waitFor();
          const tag = `${engineName}-${width}x${height}-${companion}`;
          const nudge = page.getByRole('status', { name: 'Help with this exam' });
          if (companion === 'solo') {
            // they chose to take it alone: never the offer, even after five quiet minutes
            await page.waitForTimeout(300);
            assert.equal(await nudge.count(), 0, 'no Stuck? offer for an alone run');
          } else {
            await nudge.waitFor();
            assert.match(await nudge.innerText(), new RegExp(`${companion} can teach you`));
          }
          // the per-question buttons say who they ask, in words
          const label = companion === 'Ciel' ? 'Ask Ciel' : 'Ask Zero';
          const asks = page.locator('article').getByRole('button', { name: label, exact: true });
          assert.equal(await asks.count(), 11, tag);
          const firstAsk = asks.first();
          assert.equal((await firstAsk.innerText()).trim(), label, 'the label is visible text, not just the face');
          const face = firstAsk.locator('img');
          assert.equal(await face.count(), 1);
          assert.ok((await face.boundingBox()).width >= 15, 'the face keeps its size beside the words');
          // the paper and every control stay inside the screen
          const layout = await page.evaluate(() => {
            const doc = document.documentElement;
            const out = { docScroll: doc.scrollWidth, viewport: innerWidth, offenders: [] };
            const main = document.querySelector('fieldset main');
            out.mainScroll = main.scrollWidth; out.mainClient = main.clientWidth;
            for (const el of document.querySelectorAll('article button, header *, aside button, [aria-label="Help with this exam"] *')) {
              const r = el.getBoundingClientRect();
              if (!r.width) continue;
              if (r.left < -1 || r.right > innerWidth + 1) out.offenders.push(`${el.tagName}:${(el.textContent || '').trim().slice(0, 24)} ${Math.round(r.left)}-${Math.round(r.right)}`);
            }
            for (const article of document.querySelectorAll('article')) {
              const box = article.getBoundingClientRect();
              for (const button of article.querySelectorAll('button')) {
                const r = button.getBoundingClientRect();
                if (r.width && (r.right > box.right + 1 || r.left < box.left - 1)) out.offenders.push(`ask outside its question: ${button.textContent.trim()}`);
              }
            }
            const clock = [...document.querySelectorAll('header div')].find((d) => /\d+:\d\d/.test(d.textContent || ''));
            out.clock = clock ? clock.getBoundingClientRect().right : null;
            const omr = document.querySelector('aside button');
            out.omr = omr ? { top: omr.getBoundingClientRect().top, bottom: omr.getBoundingClientRect().bottom, right: omr.getBoundingClientRect().right } : null;
            return out;
          });
          assert.ok(layout.docScroll <= layout.viewport + 1, `${tag} page scrolls sideways ${JSON.stringify(layout)}`);
          assert.ok(layout.mainScroll <= layout.mainClient + 1, `${tag} paper scrolls sideways ${JSON.stringify(layout)}`);
          assert.deepEqual(layout.offenders, [], tag);
          assert.ok(layout.clock && layout.clock <= width + 1, `${tag} timer fits ${layout.clock}`);
          assert.ok(layout.omr && layout.omr.bottom <= height + 1 && layout.omr.right <= width + 1, `${tag} OMR bar on screen ${JSON.stringify(layout.omr)}`);
          if (artifacts) {
            mkdirSync(artifacts, { recursive: true });
            await page.waitForTimeout(400);
            await page.screenshot({ path: path.join(artifacts, `${tag}-live-ask-labels.png`) });
            // the long Korean question and its Ask button
            const last = page.locator('article').last();
            await last.scrollIntoViewIfNeeded();
            await page.screenshot({ path: path.join(artifacts, `${tag}-live-long-question.png`) });
          }
          // pressing it opens that companion's window with the question attached
          await firstAsk.click();
          const opened = await page.evaluate(() => window.opened);
          assert.equal(opened.context.kind, 'arenaBattleItem');
          assert.equal(opened.context.no, 1);
          if (companion !== 'solo') assert.equal(opened.assistant, companion);
          await page.evaluate(() => { window.opened = null; localStorage.clear(); document.querySelector('fieldset main').scrollTop = 0; });
        }
        assert.deepEqual(errors, []);
        await page.close();
      }
    } finally {
      await browser.close();
    }
  });
}
