import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

// Photo choices (한국사 심화 #17, 2026-10-31): five titled photos lay out 3+2
// (never 2+2+1 with the fifth alone), and because the photos ARE the answer
// choices each caption starts with its choice number ①-⑤. A second item shows
// the same five photos as context only (its choices are text of their own):
// no numbers there.

const require = createRequire(import.meta.url);
const { chromium, webkit } = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const artifacts = process.env.ARENA_PHOTO_CHOICES_ARTIFACTS;
const items = JSON.parse(readFileSync(path.join(repo, 'test/fixtures/arenaPhotoChoices.json'), 'utf8'));
const CIRCLED = ['①', '②', '③', '④', '⑤'];
// five photos of different proportions (tall tower, wide, square)
const SIZES = [[300, 520], [480, 320], [300, 500], [400, 400], [280, 540]];
const svg = i => `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZES[i][0]}" height="${SIZES[i][1]}"><rect width="100%" height="100%" fill="#8aa"/></svg>`;

const fixture = `
import React from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import {library} from '@fortawesome/fontawesome-svg-core';
import {faArrowLeft,faClock,faCheck,faChevronUp,faChevronDown,faSpinner,faTrophy,faPlay,faHeadphones,faVolumeHigh} from '@fortawesome/pro-solid-svg-icons';
import BattleRunner from './src/containers/Arena/BattleRunner';
library.add(faArrowLeft,faClock,faCheck,faChevronUp,faChevronDown,faSpinner,faTrophy,faPlay,faHeadphones,faVolumeHigh);
const items=${JSON.stringify(items)};
function data(){const now=Math.floor(Date.now()/1000);return {
 battle:{id:71,companion:'Ciel',exam:{key:'khist-cert-advanced',name:'한국사 능력 검정 심화',nameEn:'Korean History',language:'ko',code:'K',codeLabel:null,pointTags:'none',optionMarkers:'circled',choices:5},length:'full',difficulty:'easy',mode:'battle',status:'open',minutes:50,serverNow:now,startedAt:now,deadlineAt:now+3000,finishedAt:null,rawPoints:0,maxPoints:100,grade:null,estimate:null,won:false,winAt:60,rewardOffer:{target:60,max:100},reward:null},
 passages:{},
 items:items.map(p=>({no:p.no,type:'khist.goryeo',section:'reading',points:1,passageId:null,stem:p.stem,body:null,choices:p.choices,answer:null,visual:p.visual}))
};}
window.requests={loadArenaBattle:async()=>data(),saveArenaAnswer:async()=>({saved:true}),submitArenaBattle:async()=>data(),loadArenaParentPrompt:async()=>({eligible:false})};
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
    plugins: [{ name: 'photo-fixture-services', setup(builder) {
      builder.onResolve({ filter: /.*/ }, ({ path }) => stubs[path] ? { path, namespace: 'fixture' } : undefined);
      builder.onLoad({ filter: /.*/, namespace: 'fixture' }, ({ path }) => ({ contents: stubs[path], loader: 'jsx', resolveDir: repo }));
    } }]
  });
  bundle = result.outputFiles[0].text;
  return bundle;
}

for (const [name, engine] of Object.entries({ chromium, webkit })) {
  test(`five photo choices lay out 3+2 and carry their numbers (${name})`, { timeout: 90000 }, async () => {
    const script = await compile();
    const browser = await engine.launch();
    try {
      for (const [width, height] of [[360, 740], [390, 844], [768, 1024], [1024, 768], [1280, 844]]) {
        const page = await browser.newPage({ viewport: { width, height }, hasTouch: width < 1100 });
        page.setDefaultTimeout(6000);
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/*', route => {
          const url = route.request().url();
          if (url === 'http://localhost:3000/') return route.fulfill({ contentType: 'text/html', body: `<meta name="viewport" content="width=device-width, initial-scale=1"><style>${readFileSync(path.join(repo, 'src/styles.css'), 'utf8')}</style><div id="react-view"></div>` });
          const m = url.match(/\/arena\/img\/fixture\/p(\d)\.svg$/);
          return m ? route.fulfill({ contentType: 'image/svg+xml', body: svg(Number(m[1])) }) : route.abort();
        });
        await page.goto('http://localhost:3000/');
        await page.addScriptTag({ content: script });
        const paper = page.locator('fieldset main');
        await paper.waitFor();
        await paper.locator('article img').first().waitFor();
        await page.waitForFunction(() => [...document.images].every(i => i.complete));
        for (const item of items) {
          const article = paper.locator('article').filter({ has: page.locator('b', { hasText: new RegExp(`^${item.no}\\.$`) }) });
          await article.scrollIntoViewIfNeeded();
          const m = await article.evaluate(el => {
            const box = r => { const b = r.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height, bottom: b.bottom, right: b.right }; };
            const grid = el.querySelector('figure > div');
            const cells = [...grid.children].map(cell => ({ ...box(cell), img: box(cell.querySelector('img')), caption: cell.querySelector('figcaption')?.textContent ?? '' }));
            const main = el.closest('main');
            return { grid: box(grid), cells, paper: { clientWidth: main.clientWidth, scrollWidth: main.scrollWidth } };
          });
          if (artifacts) {
            mkdirSync(artifacts, { recursive: true });
            await article.evaluate(el => { const main = el.closest('main'); main.scrollTop += el.getBoundingClientRect().top - main.getBoundingClientRect().top - 8; });
            const variant = `${name}-${width}x${height}-q${item.no}`;
            writeFileSync(path.join(artifacts, `${variant}.json`), JSON.stringify(m, null, 2));
            await page.screenshot({ path: path.join(artifacts, `${variant}.png`) });
          }
          const label = `${name} ${width}x${height} q${item.no} ${JSON.stringify(m)}`;
          const [a, b, c, d, e] = m.cells;
          assert.equal(m.cells.length, 5, label);
          // 3 + 2: three on the first row, two on the second, never a lone fifth
          assert.ok(Math.abs(a.y - b.y) < 1 && Math.abs(b.y - c.y) < 1, label);
          assert.ok(Math.abs(d.y - e.y) < 1 && d.y >= a.bottom - 1 && e.x > d.right - 1, label);
          assert.ok(a.x < b.x && b.x < c.x, label);
          // the two below are centred under the three
          assert.ok(Math.abs((d.x - m.grid.x) - (m.grid.right - e.right)) < 2, label);
          // every photo stays readable (no narrower than the old smallest, ~84px) and inside its cell
          for (const cell of m.cells) assert.ok(cell.w >= 84 && cell.img.w >= 84 - 1 && cell.img.right <= cell.right + 1, label);
          assert.ok(m.paper.scrollWidth <= m.paper.clientWidth, label);
          if (item.no === 17) {
            // the photos are the choices: ① to ⑤ in order, before each title
            m.cells.forEach((cell, i) => assert.ok(cell.caption.startsWith(CIRCLED[i]) && cell.caption.includes(item.choices[i]), label));
          } else {
            // context pictures are not numbered
            for (const cell of m.cells) assert.ok(!CIRCLED.some(mark => cell.caption.includes(mark)), label);
          }
        }
        assert.deepEqual(errors, []);
        await page.close();
      }
    } finally {
      await browser.close();
    }
  });
}
