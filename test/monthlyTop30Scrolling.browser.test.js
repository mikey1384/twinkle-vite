import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { build, stop } from 'esbuild';
const require = createRequire(import.meta.url);
const {
  chromium,
  webkit,
  devices
} = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const out = '/private/tmp/twinkle-monthly-top30-2026-09-14';
const fixture = `
import React,{useState} from 'react';import {createRoot} from 'react-dom/client';
import Top30Modal from './src/containers/Home/Earn/Leaderboards/YearItem/Top30Modal';
import LeaderboardList from './src/components/LeaderboardList';
const users=Array.from({length:30},(_,i)=>({id:i+1,rank:i+1,username:'Member '+(i+1),twinkleXP:7562383-i*100000}));
function Fixture(){const [open,setOpen]=useState(false);return <>
 <button id="open" onClick={()=>setOpen(true)}>Show Top 30</button>
 {open&&<Top30Modal month="June" year="2025" users={users} onHide={()=>setOpen(false)}/>}
 <div id="self-scrolling" style={{height:240,display:'flex',marginTop:30}}><LeaderboardList height="100%" listRef={el=>window.innerList=el}>
 {users.map(user=><div key={user.id} data-inner-row={user.rank} style={{flexShrink:0,height:60}}>Rank {user.rank}</div>)}
 </LeaderboardList></div></>}
createRoot(document.getElementById('root')).render(<Fixture/>);
`;
function children() {
  const rows = execFileSync('ps', ['-axo', 'pid=,ppid='], { encoding: 'utf8' })
    .trim()
    .split('\n')
    .map((s) => s.trim().split(/\s+/).map(Number));
  const own = new Set([process.pid]);
  for (let more = true; more;) {
    more = false;
    for (const [pid, parent] of rows)
      if (own.has(parent) && !own.has(pid)) {
        own.add(pid);
        more = true;
      }
  }
  return [...own].filter((pid) => pid !== process.pid);
}
async function bundle(baseline) {
  const built = await build({
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
        name: 'monthly-modal-fixture',
        setup(b) {
          if (baseline)
            b.onLoad(
              { filter: /src\/components\/LeaderboardList\.tsx$/ },
              () => ({
                contents: fs.readFileSync(
                  out + '/LeaderboardList-before.tsx',
                  'utf8'
                ),
                loader: 'tsx'
              })
            );
          b.onResolve({ filter: /^~\/contexts$/ }, () => ({
            path: 'contexts',
            namespace: 'fixture'
          }));
          b.onResolve({ filter: /^~\/helpers$/ }, () => ({
            path: 'helpers',
            namespace: 'fixture'
          }));
          b.onResolve({ filter: /RootThemeProvider$/ }, () => ({
            path: 'theme',
            namespace: 'fixture'
          }));
          b.onResolve(
            {
              filter:
                /^~\/components\/(ProfilePic|ErrorBoundary|Icon|Texts\/UsernameText)$/
            },
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
                ? `export const useKeyContext=fn=>fn({myState:{userId:25,profileTheme:'logoBlue'}});`
                : args.path === 'helpers'
                  ? `export const isMobile=n=>/iPhone|Android/.test(n.userAgent);export const isTablet=n=>/iPad/.test(n.userAgent);`
                  : args.path === 'theme'
                    ? `export const useRootTheme=()=>({themeName:'logoBlue',themeRoles:{}});export const useOptionalRootTheme=useRootTheme;`
                    : args.path === 'ProfilePic'
                      ? `import React from 'react';export default function P({style}){return <div style={{...style,aspectRatio:1,borderRadius:'50%',background:'#dceaf7'}}/>}`
                      : args.path === 'UsernameText'
                        ? `import React from 'react';export default function U({user,className,color,onMenuShownChange}){return <button data-rank={user.rank} className={className} style={{color,border:0,background:'transparent',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}} onClick={()=>onMenuShownChange(true)}>{user.username}</button>}`
                        : args.path === 'ErrorBoundary'
                          ? `export default function E({children}){return children}`
                          : `import React from 'react';export default function I(){return <span aria-hidden="true">×</span>}`
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
  return built.outputFiles[0].text;
}
test(
  'monthly Top 30 is fully reachable through its host scroll area',
  { timeout: 60000 },
  async () => {
    fs.mkdirSync(out, { recursive: true });
    const baseline = process.env.TOP30_BASELINE === '1';
    const code = await bundle(baseline);
    const report = [];
    let browser;
    const errors = [];
    try {
      for (const [engine, type] of [
        ['chromium', chromium],
        ['webkit', webkit]
      ]) {
        browser = await type.launch({ headless: true, timeout: 10000 });
        for (const [name, options] of [
          ['desktop', { viewport: { width: 1280, height: 800 } }],
          [
            'phone',
            { ...devices['iPhone 13'], viewport: { width: 390, height: 720 } }
          ],
          [
            'short-phone',
            { ...devices['iPhone 13'], viewport: { width: 390, height: 460 } }
          ],
          ['tablet', { ...devices['iPad Mini'] }]
        ]) {
          const page = await browser.newPage(options);
          page.setDefaultTimeout(3500);
          page.on('pageerror', (e) => errors.push(e.message));
          await page.route('**/*', (r) => r.abort());
          await page.setContent(
            '<meta name="viewport" content="width=device-width,initial-scale=1"><style>html{font-size:10px}*{box-sizing:border-box}body{margin:0;font-family:Arial;background:#fffbee}button{font-family:inherit}#root{padding:30px}</style><div id="outer-layer"></div><div id="root"></div>'
          );
          await page.addScriptTag({ content: code });
          await page.locator('#open').focus();
          await page.keyboard.press('Enter');
          await page.getByRole('dialog').waitFor();
          await page.waitForTimeout(250);
          assert.equal(await page.locator('[data-rank]').count(), 30);
          const inspect = () =>
            page.evaluate(() => {
              const last = document.querySelector('[data-rank="30"]'),
                chain = [];
              let el = last;
              while (el) {
                const s = getComputedStyle(el),
                  r = el.getBoundingClientRect();
                chain.push({
                  tag: el.tagName,
                  overflow: s.overflowY,
                  height: r.height,
                  top: r.top,
                  bottom: r.bottom,
                  client: el.clientHeight,
                  scroll: el.scrollHeight,
                  scrollTop: el.scrollTop
                });
                el = el.parentElement;
              }
              return {
                chain,
                last: last.getBoundingClientRect().toJSON(),
                viewport: innerHeight
              };
            });
          const before = await inspect();
          // Scroll every actual scroll owner using its public scroll range; hidden wrappers are not owners.
          await page.evaluate(() => {
            let el = document.querySelector('[data-rank="30"]');
            while (el) {
              if (/auto|scroll/.test(getComputedStyle(el).overflowY))
                el.scrollTop = el.scrollHeight;
              el = el.parentElement;
            }
          });
          const after = await inspect();
          report.push({ engine, name, before, after });
          await page.screenshot({
            path: path.join(
              out,
              `${baseline ? 'before' : 'after'}-${engine}-${name}.png`
            )
          });
          if (!baseline) {
            const last = after.last;
            assert(
              last.top >= 0 && last.bottom <= after.viewport,
              engine + ' ' + name + ' rank 30 visible after scrolling'
            );
            assert(
              after.chain.every(
                (a) =>
                  a.overflow === 'visible' ||
                  a.tag === 'HTML' ||
                  (last.top >= a.top - 1 && last.bottom <= a.bottom + 1)
              ),
              engine + ' ' + name + ' no ancestor clips rank 30'
            );
            await page.locator('[data-rank="30"]').click();
            await page.mouse.click(3, 3);
            assert.equal(
              await page.getByRole('dialog').count(),
              1,
              'user menu keeps backdrop from closing the board'
            );
            await page
              .getByRole('button', { name: 'Close', exact: true })
              .click();
            await page.getByRole('dialog').waitFor({ state: 'detached' });
            assert.equal(
              await page.evaluate(() => document.activeElement.id),
              'open',
              'focus returns to opener'
            );
            await page.locator('#open').click();
            await page.getByRole('dialog').waitFor();
            await page.keyboard.press('Escape');
            await page.getByRole('dialog').waitFor({ state: 'detached' });
          }
          const inner = await page.evaluate(() => {
            innerList.scrollTop = innerList.scrollHeight;
            return {
              client: innerList.clientHeight,
              scroll: innerList.scrollHeight,
              top: innerList.scrollTop,
              wrapper: innerList.parentElement.clientHeight
            };
          });
          assert(
            inner.scroll > inner.client &&
              inner.top > 0 &&
              inner.wrapper <= 241,
            'default self-scrolling list keeps its fixed viewport'
          );
          await page.close();
        }
        const own = children();
        await browser.close();
        browser = null;
        for (const pid of own)
          assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' });
      }
      assert.deepEqual(errors, []);
    } finally {
      await browser?.close();
      stop();
      fs.writeFileSync(
        path.join(out, baseline ? 'baseline.json' : 'verification.json'),
        JSON.stringify({ report, errors }, null, 2)
      );
    }
  }
);
