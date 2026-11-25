import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

// Live now's "Who do you want to watch?" picker in real (headless) browsers,
// Chromium and WebKit, with the real Today's Progress card and a fixture
// standing in for the contexts:
// - two watchable people in one app: the row's Watch opens the picker, and
//   choosing the second walks up to the second;
// - a line whose person stops being watchable while it is open is disabled
//   and does nothing; Escape, the backdrop and Close dismiss it;
// - one watchable person: Watch walks up at once; nobody joinable: the
//   default Play opens the app, never the picker;
// - desktop: a popover next to the button, driven by the keyboard.
// Set LIVE_NOW_PICKER_SHOTS_DIR to also save screenshots there.
const require = createRequire(import.meta.url);
const {
  chromium,
  webkit
} = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const shotsDir = process.env.LIVE_NOW_PICKER_SHOTS_DIR || '';
if (shotsDir) mkdirSync(shotsDir, { recursive: true });

const fixture = `
import React,{useState,useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter,useLocation} from 'react-router-dom';
import {library} from '@fortawesome/fontawesome-svg-core';
import {faTimes} from '@fortawesome/pro-solid-svg-icons/faTimes';
import {FixtureProvider} from '~/contexts';
library.add(faTimes);
import TodayStats from './src/components/Notification/TodayStats';
import {container as notificationContainer} from './src/components/Notification/Styles';
window.walkups=[];
const achievements={mission:{type:'mission',title:'Mission'},gold:{type:'gold',title:'Gold'},grammar:{type:'grammar',title:'Grammar'},donor:{type:'donor',title:'Donor'},chess_legend:{type:'chess_legend',title:'Chess'}};
const requestHelpers={
  loadMyAchievements:async()=>({mission:{isUnlocked:false,progressObj:{currentValue:1,targetValue:2}}}),
  loadProfile:async id=>({id,username:window.names[id]||'member'+id}),
  loadTodayRankings:async()=>({myTodayRank:null}),
  loadClassSummary:async()=>null,
  loadBlockedUsers:async()=>({blockedUsers:[]}),
  walkUpToMember:async args=>{window.walkups.push(args);return {status:'watch',host:{id:args.hostUserId,username:window.names[args.hostUserId]},joinable:{state:'busy-watchable',label:'',mode:'watch'}};},
  walkAwayFromMember:async()=>undefined
};
window.names={11:'KenGo',12:'ana',13:'dodo',14:'mina',15:'Cloudstar',16:'dew'};
const redSquare=(joinable)=>({kind:'app',id:2,title:'The Adventure of a Red Square',thumbnailUrl:'/thumbs/redsquare.png',...(joinable?{joinable}:{})});
const sketch=(joinable)=>({kind:'app',id:8,title:'Sketch Town',thumbnailUrl:'/thumbs/sketch.png',multiplayer:true,...(joinable?{joinable}:{})});
const words={kind:'app',id:9,title:'Word Search Adventure',thumbnailUrl:null};
const person=(id,activity)=>({id,username:window.names[id]||'member'+id,profilePicUrl:'/pictures/'+id+'.jpg',isOnline:true,isAway:false,activity});
const watchable=(label)=>({state:'busy-watchable',label,mode:'watch'});
window.watchable=watchable;window.person=person;window.redSquare=redSquare;
window.live={
  11:person(11,redSquare(watchable('Playing level 12'))),
  12:person(12,redSquare(watchable('Playing level 3'))),
  13:person(13,redSquare()),
  14:person(14,sketch(watchable('Drawing, come watch'))),
  15:person(15,words),
  16:person(16,words)
};
function LocationProbe(){const location=useLocation();useEffect(()=>{window.lastLocation={pathname:location.pathname,state:location.state};},[location]);return null;}
function LiveScene({width}){
  const [myAchievementsObj,setMyAchievementsObj]=useState({});
  return <div className={notificationContainer} style={width?{width}:undefined} data-column>
    <section style={{width:'100%',display:'flex',flexDirection:'column'}}>
      <TodayStats isDailyRewardChecked={false} isDailyBonusButtonShown={false} myAchievementsObj={myAchievementsObj} onSetMyAchievementsObj={setMyAchievementsObj}/>
    </section>
  </div>;
}
function Root(){
  const [scene,setScene]=useState({name:'none'});window.setScene=setScene;
  const [chatStatus,setChatStatus]=useState({});window.setChatStatus=setChatStatus;
  return <FixtureProvider value={{chatStatus,requestHelpers,achievements,settings:{}}}>
    <LocationProbe/>
    {scene.name==='live'?<LiveScene width={scene.width}/>:null}
  </FixtureProvider>;
}
createRoot(document.getElementById('root')).render(<MemoryRouter><Root/></MemoryRouter>);
`;

const contexts = `
import React,{createContext,useContext,useMemo} from 'react';
const Context=createContext(null);
export const FixtureProvider=Context.Provider;
const noop=()=>undefined;const asyncNoop=async()=>undefined;
const bag=(known={},fallback=noop)=>new Proxy(known,{get:(t,k)=>k in t?t[k]:k==='then'?undefined:fallback});
const keyHelpers=bag({},noop);const missionState={myAttempts:{}};const userObj={};
const todayStats={loaded:true,xpEarned:1250,coinsEarned:85,achievedDailyGoals:['W'],aiUsagePolicy:{dayIndex:1,energyPercent:64,energySegments:5,energyRemaining:64,resetCost:1000,currentMode:'full_quality'},showXPRankings:false};
function useValues(){
  const f=useContext(Context);
  return useMemo(()=>{
    const actions=bag({onSetUserState:f.onSetUserState||noop});
    const myState={userId:7,username:'viewer',isAchievementsLoaded:true,twinkleCoins:10,communityFunds:0,communityFundsLoaded:true,profileTheme:'logoBlue',settings:f.settings||{}};
    return {
    key:{myState,helpers:keyHelpers},
    app:{requestHelpers:bag(f.requestHelpers,asyncNoop),user:{state:{userObj,achievementsObj:f.achievements,myState},actions}},
    noti:{state:{todayStats,countdownCompleted:true},actions},
    chat:{state:{chatStatus:f.chatStatus,loaded:true},actions},
    home:{state:{},actions},mission:{state:missionState,actions},
    view:{state:{},actions},content:{state:{},actions},profile:{state:{},actions},
    explore:{state:{},actions},input:{state:{},actions},build:{state:{},actions},
    chess:{state:{},actions},interactive:{state:{},actions},management:{state:{},actions}
  };},[f]);
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
  const result = await build({
    stdin: { contents: fixture, resolveDir: repo, loader: 'tsx' },
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    alias: {
      '~': path.join(repo, 'src'),
      'react-sanitized-html': path.join(repo, 'src/shims/react-sanitized-html.tsx')
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
        name: 'live-now-picker-fixture',
        setup(builder) {
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
          builder.onLoad({ filter: /.*/, namespace: 'fixture' }, ({ path: p }) => ({
            contents: stubs[p],
            loader: 'jsx',
            resolveDir: repo
          }));
        }
      }
    ]
  });
  bundle = result.outputFiles[0].text;
  return bundle;
}

async function openPage(browser, viewport) {
  const page = await browser.newPage({ viewport, hasTouch: viewport.width < 600 });
  page.setDefaultTimeout(8000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/*', (route) => {
    if (route.request().url() === 'http://localhost:3000/') {
      return route.fulfill({
        contentType: 'text/html',
        body: `<style>${readFileSync(path.join(repo, 'src/styles.css'), 'utf8')}</style><div id="root"></div><div id="outer-layer"></div>`
      });
    }
    // Profile pictures: a drawn face per member, so screenshots read like
    // the real thing.
    const thumb = /\/thumbs\/(\w+)\.png/.exec(route.request().url());
    if (thumb) {
      if (thumb[1] === 'amongus') {
        return route.fulfill({
          contentType: 'image/svg+xml',
          body: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#14213d"/><circle cx="12" cy="14" r="1.5" fill="#fff"/><circle cx="66" cy="10" r="1.2" fill="#fff"/><circle cx="58" cy="66" r="1.4" fill="#fff"/><rect x="24" y="22" width="32" height="42" rx="16" fill="#e04848"/><rect x="18" y="34" width="8" height="18" rx="4" fill="#b83232"/><rect x="34" y="28" width="22" height="12" rx="6" fill="#9ed8f0"/><rect x="28" y="58" width="9" height="12" rx="3" fill="#e04848"/><rect x="43" y="58" width="9" height="12" rx="3" fill="#e04848"/></svg>`
        });
      }
      if (thumb[1] === 'redsquare') {
        return route.fulfill({
          contentType: 'image/svg+xml',
          body: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#6cb8f0"/><rect y="62" width="80" height="18" fill="#3c9a3c"/><rect y="62" width="80" height="4" fill="#2b7a2b"/><rect x="46" y="30" width="18" height="10" fill="#c8722c"/><rect x="22" y="40" width="20" height="20" fill="#e02f2f"/><rect x="34" y="45" width="4" height="4" fill="#fff"/></svg>`
        });
      }
      const board = thumb[1] === 'baduk';
      return route.fulfill({
        contentType: 'image/svg+xml',
        body: board
          ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#d8b56a"/>${[16, 32, 48, 64].map((p) => `<path d="M${p} 8v64M8 ${p}h64" stroke="#5b4320" stroke-width="1.5"/>`).join('')}<circle cx="32" cy="32" r="6" fill="#111"/><circle cx="48" cy="48" r="6" fill="#fff" stroke="#333"/><circle cx="48" cy="32" r="6" fill="#111"/></svg>`
          : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#fde8d0"/><path d="M10 60c14-30 26-30 34-12s18 10 26-14" stroke="#e0567a" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="58" cy="20" r="8" fill="#5aa0e6"/></svg>`
      });
    }
    const picture = /\/pictures\/(\d+)\.jpg/.exec(route.request().url());
    if (picture) {
      const hue = (Number(picture[1]) * 67) % 360;
      return route.fulfill({
        contentType: 'image/svg+xml',
        body: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="hsl(${hue} 70% 82%)"/><circle cx="40" cy="32" r="15" fill="hsl(${hue} 45% 45%)"/><path d="M12 80c2-20 14-28 28-28s26 8 28 28z" fill="hsl(${hue} 45% 45%)"/></svg>`
      });
    }
    return route.abort();
  });
  await page.goto('http://localhost:3000/');
  await page.addScriptTag({ content: await compileFixture() });
  await page.waitForFunction(() => typeof window.setScene === 'function');
  return { page, errors };
}

async function shot(page, name) {
  if (!shotsDir) return;
  await page.screenshot({ path: path.join(shotsDir, name) });
}

const picker = (page) => page.locator('[data-live-now-picker]');

for (const engine of ['chromium', 'webkit']) {
  // Screenshots come from Chromium only (WebKit checks behaviour).
  const shoot = engine === 'chromium' ? shot : async () => {};

  test(`${engine}: phone: two watchable people open the picker; choosing the second walks up to the second`, { timeout: 120000 }, async () => {
    const browser = await { chromium, webkit }[engine].launch();
    try {
      for (const width of [390, 320]) {
        const { page, errors } = await openPage(browser, { width, height: 844 });
        await page.evaluate(() => {
          window.setScene({ name: 'live' });
          window.setChatStatus(window.live);
        });
        const row = page.getByRole('button', { name: 'Watch: The Adventure of a Red Square' });
        await row.waitFor();
        await page.waitForTimeout(400);
        await shoot(page, `row-phone-${width}.png`);
        await row.click();
        await picker(page).waitFor();
        // the sheet, in the verb's words, listing both watchable people (not
        // dodo, who offers nothing), each with their own Watch
        assert.equal(await picker(page).getAttribute('data-mode'), 'sheet');
        await page.getByRole('heading', { name: 'Who do you want to watch?' }).waitFor();
        assert.deepEqual(
          (await picker(page).locator('.live-picker-line').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim()),
          ['KenGo Playing level 12 Watch', 'ana Playing level 3 Watch']
        );
        assert.deepEqual(await page.evaluate(() => window.walkups), []);
        await page.waitForTimeout(400); // the slide-up
        // the sheet sits on the bottom edge and fits the screen
        const box = await picker(page).boundingBox();
        assert.ok(Math.abs(box.y + box.height - 844) < 1.5, `sheet bottom ${box.y + box.height}`);
        assert.ok(box.x >= 0 && box.x + box.width <= width + 0.5, `sheet x ${box.x} w ${box.width}`);
        const overflow = await page.evaluate(() =>
          [...document.querySelectorAll('[data-live-now-picker] *')].filter((node) => {
            const r = node.getBoundingClientRect();
            return r.width && (r.right > window.innerWidth + 0.5 || r.left < -0.5);
          }).length
        );
        assert.equal(overflow, 0);
        await shoot(page, `picker-phone-${width}.png`);
        await picker(page).getByRole('button', { name: 'Watch: ana' }).click();
        await page.waitForFunction(() => window.walkups.length === 1);
        assert.deepEqual(await page.evaluate(() => window.walkups), [
          { buildId: 2, hostUserId: 12, intent: 'watch', dropIn: true }
        ]);
        await page.waitForFunction(() => window.lastLocation?.pathname === '/app/2');
        await picker(page).waitFor({ state: 'detached' });
        assert.deepEqual(errors, []);
        await page.close();
      }
    } finally {
      await browser.close();
    }
  });

  test(`${engine}: phone: a stale line is disabled; backdrop, Close and Escape dismiss; one person walks up directly; default Play opens the app`, { timeout: 120000 }, async () => {
    const browser = await { chromium, webkit }[engine].launch();
    try {
      const { page, errors } = await openPage(browser, { width: 390, height: 844 });
      await page.evaluate(() => {
        window.setScene({ name: 'live' });
        window.setChatStatus(window.live);
      });
      const row = page.getByRole('button', { name: 'Watch: The Adventure of a Red Square' });
      await row.click();
      await picker(page).waitFor();
      // ana's run ends while the picker is open: her line is disabled and
      // tapping it walks up to nobody; KenGo's label follows his game.
      await page.evaluate(() => {
        window.setChatStatus({
          ...window.live,
          11: window.person(11, window.redSquare(window.watchable('Playing level 13'))),
          12: window.person(12, window.redSquare())
        });
      });
      await picker(page).getByText('Not available right now').waitFor();
      await picker(page).getByText('Playing level 13').waitFor();
      const gone = picker(page).getByRole('button', { name: 'ana: not available' });
      assert.equal(await gone.isDisabled(), true);
      await picker(page).locator('.live-picker-line[data-gone]').click();
      await page.waitForTimeout(300);
      assert.deepEqual(await page.evaluate(() => window.walkups), []);
      await shoot(page, 'picker-stale-phone.png');
      // a tap on the backdrop closes it without reaching what is under it
      await page.mouse.click(195, 120);
      await picker(page).waitFor({ state: 'detached' });
      assert.deepEqual(await page.evaluate(() => window.walkups), []);
      assert.equal(await page.evaluate(() => window.lastLocation?.pathname), '/');

      // Back to two watchable people: Close, then Escape.
      await page.evaluate(() => window.setChatStatus(window.live));
      await page.waitForTimeout(2700); // past the touch hold
      await row.click();
      await picker(page).waitFor();
      await picker(page).getByRole('button', { name: 'Close' }).click();
      await picker(page).waitFor({ state: 'detached' });
      await row.click();
      await picker(page).waitFor();
      await page.keyboard.press('Escape');
      await picker(page).waitFor({ state: 'detached' });
      assert.deepEqual(await page.evaluate(() => window.walkups), []);

      // One watchable person: one tap, as before.
      await page.getByRole('button', { name: 'Watch: Sketch Town' }).click();
      await page.waitForFunction(() => window.walkups.length === 1);
      assert.equal(await picker(page).count(), 0);
      assert.deepEqual(await page.evaluate(() => window.walkups), [
        { buildId: 8, hostUserId: 14, intent: 'watch', dropIn: true }
      ]);

      // Two people, nobody joinable: the default Play opens the app.
      await page.getByRole('button', { name: '+1 more' }).click();
      await page.getByRole('button', { name: 'Play: Word Search Adventure' }).click();
      await page.waitForFunction(() => window.lastLocation?.pathname === '/app/9');
      assert.equal(await picker(page).count(), 0);
      assert.equal(await page.evaluate(() => window.walkups.length), 1);
      assert.deepEqual(errors, []);
    } finally {
      await browser.close();
    }
  });

  test(`${engine}: desktop: a popover next to the button, keyboard to the second line`, { timeout: 120000 }, async () => {
    const browser = await { chromium, webkit }[engine].launch();
    try {
      const { page, errors } = await openPage(browser, { width: 1280, height: 860 });
      await page.evaluate(() => {
        window.setScene({ name: 'live', width: 420 });
        window.setChatStatus(window.live);
      });
      const row = page.getByRole('button', { name: 'Watch: The Adventure of a Red Square' });
      await row.waitFor();
      await row.focus();
      await page.keyboard.press('Enter');
      await picker(page).waitFor();
      assert.equal(await picker(page).getAttribute('data-mode'), 'popover');
      // right-aligned under (or above) the row's button, inside the window
      const [panel, button] = [await picker(page).boundingBox(), await row.boundingBox()];
      assert.ok(Math.abs(panel.x + panel.width - (button.x + button.width)) < 1.5, 'right edges line up');
      assert.ok(panel.y >= button.y + button.height || panel.y + panel.height <= button.y, 'beside the button, not over it');
      // focus starts on the first line; ArrowDown, Enter picks the second
      assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Watch: KenGo');
      await page.waitForTimeout(400);
      await shoot(page, 'picker-desktop.png');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => window.walkups.length === 1);
      assert.equal(await page.evaluate(() => window.walkups[0].hostUserId), 12);
      await picker(page).waitFor({ state: 'detached' });
      // a click elsewhere closes it; the row's button toggles it
      await row.click();
      await picker(page).waitFor();
      await page.mouse.click(1200, 800);
      await picker(page).waitFor({ state: 'detached' });
      await row.click();
      await picker(page).waitFor();
      await row.click();
      await picker(page).waitFor({ state: 'detached' });
      assert.equal(await page.evaluate(() => window.walkups.length), 1);
      assert.deepEqual(errors, []);
    } finally {
      await browser.close();
    }
  });
}
