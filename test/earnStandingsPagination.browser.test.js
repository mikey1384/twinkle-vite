import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { build, stop } from 'esbuild';
const require = createRequire(import.meta.url);
const {
  chromium,
  webkit
} = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const out = '/private/tmp/twinkle-earner-pagination-2026-09-14';
const contexts = `
import {useSyncExternalStore} from 'react';
const listeners = new Set();
const key = {myState: {userId: 25, profileTheme: 'logoBlue'}};
const hubs = [], pages = [];
const app = {requestHelpers: {
 loadRewardEarnHub({period}) {return new Promise((resolve,reject)=>hubs.push({period,resolve,reject}));},
 loadRewardEarnStandings(args) {return new Promise((resolve,reject)=>pages.push({...args,resolve,reject}));}
}};
export const useAppContext = select => select(app);
export const useKeyContext = select => useSyncExternalStore(
 fn=>{listeners.add(fn);return()=>listeners.delete(fn)},()=>select(key)
);
const row = rank => ({rank,userId:rank,username:rank===1?'_Hanwha_Eagles':rank===25?'mikey':'member'+rank,
 profilePicUrl:null,xp:168400-rank*1000,coins:11000,claims:25,apps:2});
window.hubs=hubs;window.pages=pages;
window.resolveHub=(index, total=27)=>{const {period,resolve}=hubs[index];resolve({
 dayKey:'2026-09-14',period,apps:[],
 standings:{period,entries:Array.from({length:Math.min(total,10)},(_,i)=>row(i+1)),me:total>=25?row(25):null,nextCursor:total>10?period+'-10':null},
 creators:{period,entries:[{rank:1,userId:5,username:'creator',xp:123,coins:0,players:3,apps:['Math Lab']}]}
})};
window.resolvePage=(index,start,end,more)=>pages[index].resolve({period:pages[index].period,
 entries:Array.from({length:end-start+1},(_,i)=>row(i+start)),nextCursor:more?pages[index].period+'-'+end:null});
window.rejectPage=index=>pages[index].reject(new Error('Temporary failure'));
window.setUser=userId=>{key.myState.userId=userId;listeners.forEach(fn=>fn())};
`;
const fixture = `
import React,{useState} from 'react';import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import RewardBoards from './src/containers/Home/Earn/Leaderboards/RewardBoards';
function Fixture(){const [kind,setKind]=useState('apps');window.setKind=setKind;
 return <MemoryRouter><RewardBoards kind={kind}/></MemoryRouter>}
const root=createRoot(document.getElementById('root'));root.render(<Fixture/>);
window.unmount=()=>root.unmount();
`;

test(
  'XP & KP app standings load more with bounded requests and keep canonical pages separate',
  { timeout: 90000 },
  async () => {
    fs.mkdirSync(out, { recursive: true });
    const bundle = await build({
      stdin: { contents: fixture, resolveDir: repo, loader: 'tsx' },
      bundle: true,
      write: false,
      format: 'iife',
      platform: 'browser',
      jsx: 'transform',
      define: {
        'process.env.NODE_ENV': '"development"',
        'import.meta.env': '{}'
      },
      plugins: [
        {
          name: 'standings-fixture',
          setup(b) {
            b.onResolve({ filter: /^~\/contexts$/ }, () => ({
              path: 'contexts',
              namespace: 'fixture'
            }));
            b.onResolve({ filter: /RootThemeProvider$/ }, () => ({
              path: 'theme',
              namespace: 'fixture'
            }));
            b.onResolve(
              { filter: /^~\/components\/(ProfilePic|ErrorBoundary|Icon)$/ },
              (args) => ({
                path: args.path.split('/').at(-1),
                namespace: 'fixture'
              })
            );
            b.onLoad({ filter: /.*/, namespace: 'fixture' }, (args) => ({
              loader: 'jsx',
              resolveDir: repo,
              contents:
                args.path === 'contexts'
                  ? contexts
                  : args.path === 'theme'
                    ? `export const useRootTheme=()=>({themeName:'logoBlue',themeRoles:{}});export const useOptionalRootTheme=useRootTheme;`
                    : args.path === 'ProfilePic'
                      ? `import React from 'react';export default function P(){return <div style={{width:'100%',aspectRatio:1,borderRadius:'50%',background:'#dceaf7'}}/>}`
                      : args.path === 'ErrorBoundary'
                        ? `export default function E({children}){return children}`
                        : `import React from 'react';export default function Icon(){return <span aria-hidden="true">↻</span>}`
            }));
            b.onResolve({ filter: /^~\// }, (args) =>
              b.resolve(path.join(repo, 'src', args.path.slice(2)), {
                resolveDir: repo,
                kind: args.kind
              })
            );
          }
        }
      ]
    });
    stop();
    const errors = [];
    let browser;
    try {
      for (const [name, engine] of [
        ['chromium', chromium],
        ['webkit', webkit]
      ]) {
        browser = await engine.launch({ headless: true, timeout: 10000 });
        for (const width of [390, 320, 1280]) {
          const page = await browser.newPage({
            viewport: { width, height: 850 },
            hasTouch: width < 600
          });
          page.setDefaultTimeout(4000);
          page.on('pageerror', (e) => errors.push(e.message));
          await page.route('**/*', (r) => r.abort());
          await page.setContent(
            '<style>html{font-size:10px}*{box-sizing:border-box}body{margin:0;background:#fffbee;font-family:Arial;color:#333;--ui-border:#b5b5b5}#root{max-width:1000px;margin:auto;padding:16px}a{color:#0074b8}button{font-family:inherit}</style><div id="root"></div>'
          );
          await page.addScriptTag({ content: bundle.outputFiles[0].text });
          await page.waitForFunction(() => window.hubs.length === 1);
          await page.evaluate(() => resolveHub(0));
          await page
            .getByRole('button', { name: 'Load more', exact: true })
            .waitFor();
          const ranks = () =>
            page
              .locator('ol>li')
              .evaluateAll((els) =>
                els
                  .filter((e) => e.textContent.trim() !== '…')
                  .map((e) => Number(e.firstElementChild.textContent.slice(1)))
              );
          assert.deepEqual(await ranks(), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 25]);
          const more = page.getByRole('button', {
            name: 'Load more',
            exact: true
          });
          await more.scrollIntoViewIfNeeded();
          await page.screenshot({
            path: path.join(out, `${name}-${width}-before.png`)
          });
          await more.click();
          await page.waitForFunction(() => pages.length === 1);
          assert(
            await page
              .getByRole('button', { name: 'Loading', exact: true })
              .isDisabled()
          );
          await page
            .getByRole('button', { name: 'Loading', exact: true })
            .evaluate((el) => {
              el.click();
              el.click();
            });
          assert.equal(
            await page.evaluate(() => pages.length),
            1,
            'rapid clicks never duplicate a page request'
          );
          await page.evaluate(() => resolvePage(0, 11, 20, true));
          await page
            .getByRole('button', { name: 'Load more', exact: true })
            .waitFor();
          assert.deepEqual(await ranks(), [
            ...Array.from({ length: 20 }, (_, i) => i + 1),
            25
          ]);
          assert.equal(
            await page.evaluate(() => hubs.length),
            1,
            'load more does not reload the shelf'
          );
          await page
            .getByRole('button', { name: 'Load more', exact: true })
            .click();
          await page.waitForFunction(() => pages.length === 2);
          await page.evaluate(() => rejectPage(1));
          await page
            .getByRole('button', { name: 'Try again', exact: true })
            .waitFor();
          assert.equal(
            (await ranks()).length,
            21,
            'failed request keeps every visible entry'
          );
          await page
            .getByRole('button', { name: 'Try again', exact: true })
            .click();
          await page.waitForFunction(() => pages.length === 3);
          assert.equal(
            await page.evaluate(() => pages[2].cursor),
            await page.evaluate(() => pages[1].cursor)
          );
          await page.evaluate(() => resolvePage(2, 21, 27, false));
          await page.waitForFunction(
            () => document.querySelectorAll('ol>li').length === 27
          );
          assert.deepEqual(
            await ranks(),
            Array.from({ length: 27 }, (_, i) => i + 1)
          );
          assert.equal(
            await page
              .getByRole('button', { name: 'Load more', exact: true })
              .count(),
            0
          );
          assert.equal(
            await page
              .locator('ol')
              .getByRole('link', { name: 'mikey', exact: true })
              .count(),
            1,
            'own row joins the list without a duplicate'
          );
          await page.locator('ol>li').nth(10).scrollIntoViewIfNeeded();
          await page.screenshot({
            path: path.join(out, `${name}-${width}-expanded.png`)
          });
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth
            ),
            false,
            'no horizontal overflow'
          );
          if (width === 390) {
            await page.getByRole('tab', { name: 'Today', exact: true }).click();
            await page.waitForFunction(() => hubs.length === 2);
            await page.evaluate(() => resolveHub(1));
            await page
              .getByRole('button', { name: 'Load more', exact: true })
              .click();
            await page.waitForFunction(() => pages.length === 4);
            await page
              .getByRole('tab', { name: 'All time', exact: true })
              .click();
            await page.waitForFunction(() => hubs.length === 3);
            await page.evaluate(() => resolveHub(2, 5));
            await page.waitForFunction(
              () => document.querySelectorAll('ol>li').length === 5
            );
            await page.evaluate(() => resolvePage(3, 11, 20, true));
            assert.deepEqual(
              await ranks(),
              [1, 2, 3, 4, 5],
              'late previous-period page is ignored'
            );
            await page.evaluate(() => setKind('creators'));
            await page
              .getByText('Whose apps paid the most', { exact: true })
              .waitFor();
            assert.equal(
              await page
                .getByRole('button', { name: 'Load more', exact: true })
                .count(),
              0
            );
            await page.evaluate(() => setKind('apps'));
            await page.getByText('Earned from apps', { exact: true }).waitFor();
            // A foreground refresh replaces both the snapshot and its in-flight continuation.
            await page.evaluate(() => window.dispatchEvent(new Event('focus')));
            await page.waitForFunction(() => hubs.length === 4);
            await page.evaluate(() => resolveHub(3));
            await page
              .getByRole('button', { name: 'Load more', exact: true })
              .click();
            await page.waitForFunction(() => pages.length === 5);
            await page.evaluate(() => window.dispatchEvent(new Event('focus')));
            await page.waitForFunction(() => hubs.length === 5);
            await page.evaluate(() => resolveHub(4, 3));
            await page.waitForFunction(
              () => document.querySelectorAll('ol>li').length === 3
            );
            await page.evaluate(() => resolvePage(4, 11, 20, true));
            assert.deepEqual(await ranks(), [1, 2, 3]);
            await page.evaluate(() => setUser(6));
            await page.waitForFunction(() => hubs.length === 6);
            assert.equal(await page.locator('ol').count(), 0);
            await page.evaluate(() => resolveHub(5));
            await page
              .getByRole('button', { name: 'Load more', exact: true })
              .click();
            await page.waitForFunction(() => pages.length === 6);
            await page.evaluate(() => setUser(0));
            await page.waitForFunction(() => !document.querySelector('ol'));
            await page.evaluate(() => resolvePage(5, 11, 20, true));
            assert.equal(await page.locator('ol').count(), 0);
          }
          await page.evaluate(() => unmount());
          await page.close();
        }
        await browser.close();
        browser = null;
      }
      assert.deepEqual(errors, []);
    } finally {
      await browser?.close();
      stop();
    }
  }
);
