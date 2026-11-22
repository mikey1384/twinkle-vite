import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

// Today's Progress switches to its compact layout while anyone is live in an
// app. The switch must only change CSS: AchievementProgress loads
// /user/achievements on mount, so a remount on every switch made every viewer
// refetch whenever someone opened or left an app (review 11-15). A profile
// popup opened from a Live now face must also survive the app emptying.
const require = createRequire(import.meta.url);
const {
  chromium
} = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));

const fixture = `
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import {FixtureProvider} from '~/contexts';
import TodayStats from '__CARD__';
import {container as notificationContainer} from './src/components/Notification/Styles';
window.achievementLoads=0;window.profileLoads=0;
const achievements={mission:{type:'mission',title:'Mission'},gold:{type:'gold',title:'Gold'},grammar:{type:'grammar',title:'Grammar'},donor:{type:'donor',title:'Donor'},chess_legend:{type:'chess_legend',title:'Chess'}};
const app=(id,title)=>({kind:'app',id,title,thumbnailUrl:null});
const person=(id,activity)=>({id,username:'member'+id,profilePicUrl:'',isOnline:true,isAway:false,activity});
window.live={11:person(11,app(5,'Minecraft World')),12:person(12,app(5,'Minecraft World'))};
const requestHelpers={
  loadMyAchievements:async()=>{window.achievementLoads++;return {mission:{isUnlocked:false,progressObj:{currentValue:1,targetValue:2}}};},
  loadProfile:async id=>{window.profileLoads++;return {id,username:'member'+id};},
  loadTodayRankings:async()=>({myTodayRank:null}),
  loadClassSummary:async()=>null
};
const longApp=(id,title)=>({kind:'app',id,title,thumbnailUrl:null,multiplayer:true});
window.crowded={};
for(let i=0;i<1234;i++)window.crowded[100+i]=person(100+i,longApp(8,'The Extremely Long Adventure of the Brave Little Robot'));
window.crowded[20]=person(20,app(9,'우리 반 친구들과 함께하는 아주 긴 이름의 영어 단어 퀴즈'));
window.crowded[21]=person(21,app(10,'Groove Lab'));
function Root(){
  const [chatStatus,setChatStatus]=useState({});window.setChatStatus=setChatStatus;
  const [width,setWidth]=useState(null);window.setWidth=setWidth;
  const [amounts,setAmounts]=useState(null);window.setAmounts=setAmounts;
  const [myAchievementsObj,setMyAchievementsObj]=useState({});
  // The card sits in the real Notification column styles at a given width.
  return <FixtureProvider value={{chatStatus,requestHelpers,achievements,amounts}}>
    <div className={notificationContainer} style={width?{width}:undefined} data-column>
      <section style={{width:'100%',display:'flex',flexDirection:'column'}}>
        <TodayStats isDailyRewardChecked={false} isDailyBonusButtonShown={false} myAchievementsObj={myAchievementsObj} onSetMyAchievementsObj={setMyAchievementsObj}/>
      </section>
    </div>
  </FixtureProvider>;
}
createRoot(document.getElementById('root')).render(<MemoryRouter><Root/></MemoryRouter>);
`;

// Every context the card reads, from one fixture value. Unknown actions and
// request helpers are no-ops so the card's other parts render quietly.
const contexts = `
import React,{createContext,useContext,useMemo} from 'react';
const Context=createContext(null);
export const FixtureProvider=Context.Provider;
const noop=()=>undefined;const asyncNoop=async()=>undefined;
const bag=(known={},fallback=noop)=>new Proxy(known,{get:(t,k)=>k in t?t[k]:k==='then'?undefined:fallback});
const actions=bag();
// Stable like the real contexts: effects that depend on these must not re-run
// just because the fixture re-rendered.
const myState={userId:7,username:'viewer',isAchievementsLoaded:true,twinkleCoins:10,communityFunds:0,communityFundsLoaded:true,profileTheme:'logoBlue'};
const keyHelpers=bag({},noop);const missionState={myAttempts:{}};const userObj={};
const todayStats={loaded:true,xpEarned:1250,coinsEarned:85,achievedDailyGoals:['W'],aiUsagePolicy:{dayIndex:1,energyPercent:64,energySegments:5,energyRemaining:64,resetCost:1000,currentMode:'full_quality'},showXPRankings:false};
function useValues(){
  const f=useContext(Context);
  return useMemo(()=>({
    key:{myState,helpers:keyHelpers},
    app:{requestHelpers:bag(f.requestHelpers,asyncNoop),user:{state:{userObj,achievementsObj:f.achievements},actions}},
    noti:{state:{todayStats:f.amounts?{...todayStats,...f.amounts}:todayStats,countdownCompleted:true},actions},
    chat:{state:{chatStatus:f.chatStatus,loaded:true},actions},
    home:{state:{},actions},mission:{state:missionState,actions},
    view:{state:{},actions},content:{state:{},actions},profile:{state:{},actions},
    explore:{state:{},actions},input:{state:{},actions},build:{state:{},actions},
    chess:{state:{},actions},interactive:{state:{},actions},management:{state:{},actions}
  }),[f]);
}
const make=name=>select=>{const v=useValues();try{return select(v[name]);}catch{return undefined;}};
export const useKeyContext=make('key');export const useAppContext=make('app');
export const useNotiContext=make('noti');export const useChatContext=make('chat');
export const useHomeContext=make('home');export const useMissionContext=make('mission');
export const useViewContext=make('view');export const useContentContext=make('content');
export const useProfileContext=make('profile');export const useExploreContext=make('explore');
export const useInputContext=make('input');export const useBuildContext=make('build');
export const useChessContext=make('chess');export const useInteractiveContext=make('interactive');
export const useManagementContext=make('management');
`;

let bundle;
async function compileFixture() {
  if (bundle) return bundle;
  const stubs = { '~/contexts': contexts, '~/contexts/hooks': contexts };
  // LIVE_NOW_CARD points the fixture at another copy of the card (used once as
  // a positive control: a copy that remounts on the switch must fail).
  const card =
    process.env.LIVE_NOW_CARD || './src/components/Notification/TodayStats';
  const result = await build({
    stdin: {
      contents: fixture.replace('__CARD__', card),
      resolveDir: repo,
      loader: 'tsx'
    },
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    alias: {
      '~': path.join(repo, 'src'),
      'react-sanitized-html': path.join(
        repo,
        'src/shims/react-sanitized-html.tsx'
      )
    },
    loader: {
      '.png': 'dataurl',
      '.jpg': 'dataurl',
      '.svg': 'dataurl',
      '.webp': 'empty',
      '.gif': 'empty',
      '.mp3': 'empty',
      '.wav': 'empty',
      '.css': 'empty'
    },
    define: {
      'import.meta.env': '{"VITE_CLOUDFRONT_KEY":"fixture"}',
      'process.env.NODE_ENV': '"development"'
    },
    logLevel: 'silent',
    plugins: [
      {
        name: 'live-now-fixture',
        setup(builder) {
          // Vite-only "?url" imports (pdf.js worker) are never used by the card.
          builder.onResolve({ filter: /\?url$/ }, ({ path: p }) => ({
            path: p,
            namespace: 'url'
          }));
          builder.onLoad({ filter: /.*/, namespace: 'url' }, () => ({
            contents: 'export default "";',
            loader: 'js'
          }));
          builder.onResolve({ filter: /.*/ }, ({ path: p }) =>
            stubs[p] ? { path: p, namespace: 'fixture' } : undefined
          );
          builder.onLoad(
            { filter: /.*/, namespace: 'fixture' },
            ({ path: p }) => ({
              contents: stubs[p],
              loader: 'jsx',
              resolveDir: repo
            })
          );
        }
      }
    ]
  });
  bundle = result.outputFiles[0].text;
  return bundle;
}

test(
  'switching Live now on and off never remounts or refetches achievements; a face opens the profile card and holds the row',
  { timeout: 90000 },
  async () => {
    const script = await compileFixture();
    const browser = await chromium.launch();
    let page;
    const errors = [];
    try {
      page = await browser.newPage({
        viewport: { width: 390, height: 900 },
        hasTouch: true
      });
      page.setDefaultTimeout(8000);
      page.on('pageerror', (error) => errors.push(error.message));
      await page.route('**/*', (route) => {
        if (route.request().url() === 'http://localhost:3000/') {
          return route.fulfill({
            contentType: 'text/html',
            body: `<style>${readFileSync(path.join(repo, 'src/styles.css'), 'utf8')}</style><div id="root"></div><div id="outer-layer"></div>`
          });
        }
        return route.abort();
      });
      await page.goto('http://localhost:3000/');
      await page.addScriptTag({ content: script });
      await page.locator('img[alt="Badge"]').first().waitFor();
      await page.waitForFunction(() => window.achievementLoads === 1);
      // Remember the exact badge element: a remount would replace it.
      await page.evaluate(() => {
        window.firstBadge = document.querySelector('img[alt="Badge"]');
      });
      assert.equal(
        await page.getByText('Live now', { exact: true }).count(),
        0
      );

      for (let round = 0; round < 3; round++) {
        await page.evaluate(() => window.setChatStatus(window.live));
        await page.getByText('Live now', { exact: true }).waitFor();
        assert.equal(
          await page.evaluate(
            () =>
              document.querySelector('img[alt="Badge"]') === window.firstBadge
          ),
          true,
          'compact must not remount the badges'
        );
        await page.evaluate(() => window.setChatStatus({}));
        await page
          .getByText('Live now', { exact: true })
          .waitFor({ state: 'detached' });
        assert.equal(
          await page.evaluate(
            () =>
              document.querySelector('img[alt="Badge"]') === window.firstBadge
          ),
          true,
          'leaving compact must not remount the badges'
        );
      }
      await page.waitForTimeout(300);
      assert.equal(
        await page.evaluate(() => window.achievementLoads),
        1,
        'achievements load once, not on each switch'
      );

      // A face's profile popup keeps the row while it is open, even after the
      // app empties; the update lands when the popup closes.
      await page.evaluate(() => window.setChatStatus(window.live));
      await page.getByText('Live now', { exact: true }).waitFor();
      const face = page.locator('.live-face').first();
      const popup = page.locator('[data-portal="user-popup"]');
      // On a phone a tap opens the site's profile card (and never joins).
      await face.tap();
      await popup.getByText('member11').first().waitFor();
      assert.equal(
        await page.evaluate(() => window.profileLoads >= 1),
        true,
        'opening the card loads the profile'
      );
      // Move the mouse off the card so only the open popup is holding.
      await page.mouse.move(380, 880);
      await page.evaluate(() => window.setChatStatus({}));
      await page.waitForTimeout(400);
      assert.equal(
        await page.getByText('Live now', { exact: true }).count(),
        1,
        'open popup holds the row'
      );
      await page.mouse.click(380, 880);
      await page
        .getByText('Live now', { exact: true })
        .waitFor({ state: 'detached', timeout: 5000 });
      assert.equal(await page.evaluate(() => window.achievementLoads), 1);
      assert.deepEqual(errors, []);
    } catch (error) {
      const state = page
        ? await page
            .evaluate(() => ({
              achievementLoads: window.achievementLoads,
              profileLoads: window.profileLoads,
              text: document.body.innerText.slice(0, 300)
            }))
            .catch(() => null)
        : null;
      error.message += `\nfixture state: ${JSON.stringify(state)}\npage errors: ${JSON.stringify(errors)}`;
      throw error;
    } finally {
      await browser.close();
    }
  }
);

test(
  'on desktop, hovering a Live now face shows the profile card, like a username',
  { timeout: 60000 },
  async () => {
    const script = await compileFixture();
    const browser = await chromium.launch();
    const errors = [];
    try {
      const page = await browser.newPage({
        viewport: { width: 1280, height: 900 }
      });
      page.setDefaultTimeout(8000);
      page.on('pageerror', (error) => errors.push(error.message));
      await page.route('**/*', (route) => {
        if (route.request().url() === 'http://localhost:3000/') {
          return route.fulfill({
            contentType: 'text/html',
            body: `<style>${readFileSync(path.join(repo, 'src/styles.css'), 'utf8')}</style><div id="root"></div><div id="outer-layer"></div>`
          });
        }
        return route.abort();
      });
      await page.goto('http://localhost:3000/');
      await page.addScriptTag({ content: script });
      await page.evaluate(() => window.setChatStatus(window.live));
      await page.getByText('Live now', { exact: true }).waitFor();
      assert.equal(
        await page.locator('.live-face[title]').count(),
        0,
        'no username-only tooltip on faces'
      );
      const popup = page.locator('[data-portal="user-popup"]');
      await page.locator('.live-face').first().hover();
      await popup.getByText('member11').first().waitFor();
      await page.mouse.move(1270, 890);
      await popup.getByText('member11').first().waitFor({ state: 'detached' });
      assert.deepEqual(errors, []);
    } finally {
      await browser.close();
    }
  }
);

test(
  'the whole card fits real columns down to 185px, live or not, with +1,000,000 XP and Coins',
  { timeout: 90000 },
  async () => {
    const script = await compileFixture();
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage({
        viewport: { width: 1280, height: 1200 }
      });
      page.setDefaultTimeout(8000);
      await page.route('**/*', (route) => {
        if (route.request().url() === 'http://localhost:3000/') {
          return route.fulfill({
            contentType: 'text/html',
            body: `<style>${readFileSync(path.join(repo, 'src/styles.css'), 'utf8')}</style><div id="root"></div><div id="outer-layer"></div>`
          });
        }
        return route.abort();
      });
      await page.goto('http://localhost:3000/');
      await page.addScriptTag({ content: script });
      await page.locator('img[alt="Badge"]').first().waitFor();
      await page.evaluate(() =>
        window.setAmounts({ xpEarned: 1000000, coinsEarned: 1000000 })
      );
      // Third pass: empty energy (the Charge button replaces the Energy badge).
      for (const [live, width, empty] of [
        [true, false],
        [false, false],
        [true, true],
        [false, true]
      ].flatMap(([l, e]) => [185, 241, 253, 420].map((w) => [l, w, e]))) {
        await page.evaluate(
          ([l, w, e]) => {
            window.setAmounts({
              xpEarned: 1000000,
              coinsEarned: 1000000,
              ...(e
                ? {
                    aiUsagePolicy: {
                      dayIndex: 1,
                      energyPercent: 0,
                      energySegments: 5,
                      energyRemaining: 0,
                      resetCost: 1000,
                      currentMode: 'full_quality'
                    }
                  }
                : {})
            });
            window.setChatStatus(l ? window.crowded : {});
            window.setWidth(w);
          },
          [live, width, empty]
        );
        await page
          .getByText('Live now', { exact: true })
          .waitFor({ state: live ? 'visible' : 'detached' });
        await page.waitForTimeout(150);
        const report = await page.evaluate(() => {
          const column = document.querySelector('[data-column]');
          const card = column.querySelector('section > div');
          const box = card.getBoundingClientRect();
          const outside = [];
          const tooWide = [];
          const hidden = (el) => {
            for (let n = el; n && n !== card; n = n.parentElement)
              if (
                getComputedStyle(n).opacity === '0' ||
                getComputedStyle(n).display === 'none'
              )
                return true;
            return false;
          };
          for (const el of card.querySelectorAll('*')) {
            if (el.closest('svg') || hidden(el)) continue;
            const r = el.getBoundingClientRect();
            if (!r.width && !r.height) continue;
            if (r.left < box.left - 0.5 || r.right > box.right + 0.5)
              outside.push(el.className + ' ' + el.textContent.slice(0, 20));
          }
          for (const sel of [
            '.today-goals-row',
            '.today-badges',
            '.today-titles',
            'li'
          ]) {
            // Every visible box in the row (not the clipped text of an
            // ellipsized title) must sit inside the row.
            for (const row of card.querySelectorAll(sel)) {
              const r = row.getBoundingClientRect();
              for (const el of row.querySelectorAll('*')) {
                if (el.closest('svg') || hidden(el)) continue;
                const c = el.getBoundingClientRect();
                if (!c.width && !c.height) continue;
                if (c.left < r.left - 1 || c.right > r.right + 1)
                  tooWide.push(
                    `${sel} > ${el.className || el.tagName} [${Math.round(c.left - r.left)}..${Math.round(c.right - r.left)} of ${Math.round(r.width)}]`
                  );
              }
            }
          }
          // Empty energy: Charge must sit on the bar's line, not straddle two.
          const charge = [...card.querySelectorAll('button')].find(
            (button) => button.textContent.trim() === 'Charge'
          );
          const percent = [...card.querySelectorAll('span')].find((span) =>
            /^\d+%$/.test(span.textContent.trim())
          );
          const middle = (el) => {
            const r = el.getBoundingClientRect();
            return (r.top + r.bottom) / 2;
          };
          return {
            chargeOffset:
              charge && percent
                ? Math.abs(middle(charge) - middle(percent))
                : null,
            scroll: card.scrollWidth - card.clientWidth,
            text: card.textContent,
            cardWidth: Math.round(box.width),
            outside,
            tooWide,
            amounts: card.querySelector('.today-amounts')?.textContent
          };
        });
        assert.equal(report.cardWidth, width);
        assert.deepEqual(
          report.outside,
          [],
          `nothing may pass the card edge at ${width}px (live: ${live}, empty energy: ${empty})`
        );
        assert.ok(
          report.scroll <= 0,
          `no horizontal scroll at ${width}px (live: ${live}, empty energy: ${empty})`
        );
        assert.deepEqual(
          report.tooWide,
          [],
          `no row may overflow at ${width}px (live: ${live}, empty energy: ${empty})`
        );
        assert.match(report.text, /\+1\.0M/);
        if (empty) {
          assert.notEqual(
            report.chargeOffset,
            null,
            'Charge shows when energy is empty'
          );
          assert.ok(
            report.chargeOffset < 6,
            `Charge sits beside the bar at ${width}px (offset ${report.chargeOffset})`
          );
        }
      }
    } finally {
      await browser.close();
    }
  }
);
