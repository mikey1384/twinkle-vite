import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

// Picture options (TOSEL "choose the picture", 2026-10-31 todo 162): the four
// pictures sit in a 2x2 grid at every width, so pictures (A)-(D) and the
// (A)-(D) answer row fit on one screen of the paper while the audio plays.
// Before, a 390px phone stacked them in one column and the answer row sat
// far below pictures A and B.

const require = createRequire(import.meta.url);
const { chromium, webkit } = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const artifacts = process.env.ARENA_PICTURE_OPTIONS_ARTIFACTS;
// screenshots of the old layout: record only, check nothing
const baseline = process.env.ARENA_PICTURE_OPTIONS_BASELINE === '1';
// two code-drawn TOSEL Basic picture sets (no answer keys); the second is
// printed full width, where a wide paper may show the four in one row
const pictures = JSON.parse(
  readFileSync(path.join(repo, 'test/fixtures/arenaPictureOptions.json'), 'utf8')
);
const fixture = `
import React from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import {library} from '@fortawesome/fontawesome-svg-core';
import {faArrowLeft,faClock,faCheck,faChevronUp,faChevronDown,faSpinner,faTrophy,faPlay,faHeadphones,faVolumeHigh} from '@fortawesome/pro-solid-svg-icons';
import BattleRunner from './src/containers/Arena/BattleRunner';
library.add(faArrowLeft,faClock,faCheck,faChevronUp,faChevronDown,faSpinner,faTrophy,faPlay,faHeadphones,faVolumeHigh);
const pictures=${JSON.stringify(pictures)};
window.saves=[];
function data(){const now=Math.floor(Date.now()/1000);return {
 battle:{id:71,companion:'Ciel',exam:{key:'tosel-ba',name:'TOSEL Basic',nameEn:'TOSEL Basic',language:'en',code:'E2',codeLabel:null,pointTags:'none',optionMarkers:'letters',choices:4},length:'full',difficulty:'easy',mode:'battle',status:'open',minutes:50,serverNow:now,startedAt:now,deadlineAt:now+3000,finishedAt:null,rawPoints:0,maxPoints:100,grade:null,estimate:null,won:false,winAt:60,rewardOffer:{target:60,max:100},reward:null},
 passages:Object.fromEntries(pictures.map(p=>[String(p.no),{kind:'listening',body:'',audioPath:'audio/tosel-ba/fixture/'+p.no+'.mp3'}])),
 items:pictures.map(p=>({no:p.no,type:'tosel.l.recognize',section:'listening',points:1,passageId:p.no,stem:p.stem,body:null,choices:['①','②','③','④'],answer:null,visual:p.visual,fullWidth:p.no===2}))
};}
window.requests={loadArenaBattle:async()=>data(),saveArenaAnswer:async args=>{window.saves.push(args);return {saved:true,answer:args.answer};},submitArenaBattle:async()=>data(),loadArenaParentPrompt:async()=>({eligible:false})};
createRoot(document.getElementById('react-view')).render(<MemoryRouter><BattleRunner battleId={71} onExit={()=>{}}/></MemoryRouter>);
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
    logLevel: 'error',
    plugins: [{ name: 'picture-fixture-services', setup(builder) {
      builder.onResolve({ filter: /.*/ }, ({ path }) => stubs[path] ? { path, namespace: 'fixture' } : undefined);
      builder.onLoad({ filter: /.*/, namespace: 'fixture' }, ({ path }) => ({ contents: stubs[path], loader: 'jsx', resolveDir: repo }));
    } }]
  });
  bundle = result.outputFiles[0].text;
  return bundle;
}

for (const [name, engine] of Object.entries({ chromium, webkit })) {
  test(`picture options form a 2x2 that fits with its answer row (${name})`, { timeout: 60000 }, async () => {
    const script = await compile();
    const browser = await engine.launch();
    try {
      for (const [width, height] of [[390, 844], [360, 740], [768, 1024], [820, 1180], [1024, 768], [1280, 844]]) {
        const page = await browser.newPage({ viewport: { width, height }, hasTouch: width < 1100 });
        page.setDefaultTimeout(6000);
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/*', route => route.request().url() === 'http://localhost:3000/'
          ? route.fulfill({ contentType: 'text/html', body: `<meta name="viewport" content="width=device-width, initial-scale=1"><style>${readFileSync(path.join(repo, 'src/styles.css'), 'utf8')}</style><div id="react-view"></div>` })
          : route.abort());
        await page.goto('http://localhost:3000/');
        await page.addScriptTag({ content: script });
        const paper = page.locator('fieldset main');
        await paper.waitFor();
        await paper.locator('article svg').first().waitFor();
        for (const no of pictures.map(p => p.no)) {
          const article = paper.locator('article').filter({ has: page.locator('b', { hasText: new RegExp(`^${no}\\.$`) }) });
          await article.scrollIntoViewIfNeeded();
          const m = await article.evaluate(el => {
            const box = r => { const b = r.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height, bottom: b.bottom, right: b.right }; };
            const grid = el.querySelector('figure > div');
            const cells = [...grid.children].map(box);
            const row = el.querySelector('ol');
            const buttons = [...row.querySelectorAll('button')].map(box);
            const main = el.closest('main');
            // the listening console stays pinned over the top of the paper
            const pinned = [...main.querySelectorAll('*')].find(node => getComputedStyle(node).position === 'sticky');
            const letters = getComputedStyle(row.querySelector('button')).fontSize;
            return { cells, grid: box(grid), row: box(row), buttons, letters: parseFloat(letters), paper: { pinned: pinned ? pinned.getBoundingClientRect().height : 0, clientHeight: main.clientHeight, clientWidth: main.clientWidth, scrollWidth: main.scrollWidth } };
          });
          if (artifacts) {
            mkdirSync(artifacts, { recursive: true });
            const variant = `${name}-${width}x${height}-q${no}`;
            // put the picture grid at the top of the paper, as a student
            // scrolls it while the audio plays
            await article.evaluate(el => { const main = el.closest('main'); main.scrollTop += el.querySelector('figure').getBoundingClientRect().top - main.getBoundingClientRect().top - 8; });
            await article.evaluate((el, pinned) => { el.closest('main').scrollTop -= pinned; }, m.paper.pinned);
            writeFileSync(path.join(artifacts, `${variant}.json`), JSON.stringify(m, null, 2));
            await page.screenshot({ path: path.join(artifacts, `${variant}.png`) });
          }
          if (!baseline) {
            const [a, b, c, d] = m.cells;
            const label = `${name} ${width}x${height} q${no} ${JSON.stringify(m)}`;
            assert.equal(m.cells.length, 4, label);
            assert.ok(Math.abs(a.y - b.y) < 1 && Math.abs(c.y - d.y) < 1, label);
            assert.ok(b.x > a.right - 1 && d.x > c.right - 1, label);
            // each picture stays large enough to see its details
            assert.ok(m.cells.every(cell => cell.w >= 150), label);
            if (Math.abs(c.y - a.y) < 1) {
              // one row of four, only on a wide full-width paper
              assert.ok(no === 2 && m.grid.w >= 900 && c.x > b.right - 1, label);
            } else {
              // 2x2: A|B on the first row, C|D on the second, never 1-wide or 3+1
              assert.ok(c.y >= a.bottom - 1 && Math.abs(c.x - a.x) < 1, label);
            }
            // pictures plus the answer row fit in one screen of the paper,
            // below the pinned listening console
            assert.ok(m.row.bottom - m.grid.y <= m.paper.clientHeight - m.paper.pinned, label);
            assert.ok(m.paper.scrollWidth <= m.paper.clientWidth, label);
            // the answer letters stay readable and are real touch targets
            assert.ok(m.letters >= 14, label);
            for (const button of m.buttons) assert.ok(button.w >= 44 && button.h >= 44, label);
          }
        }
        // a tap on (C) marks it
        if (!baseline) await paper.locator('article').first().getByRole('button', { name: '(C)' }).click();
        if (!baseline) await page.waitForFunction(() => window.saves.some(save => save.no === 1 && save.answer === 2));
        assert.deepEqual(errors, []);
        await page.close();
      }
    } finally {
      await browser.close();
    }
  });
}
