import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

// "Meet people in apps" in a real (headless) browser, with the real
// components and a fixture standing in for the contexts:
// - Live now shows who can be joined, in the app's own words, and a face's
//   popup offers Play / Watch; Play walks up, then opens the app aimed at
//   that member;
// - the runtime overlay: the host's banner and queue chip never cover the
//   app, "Play now" reaches the app, the opt-out is one tap; the visitor is
//   told where they stand;
// - the chat card: a warm first-thread introduction, one-tap chips sent as
//   the member's own message, the first-chat note shown once.
// Set SOCIAL_SHOTS_DIR to also save screenshots there.
const require = createRequire(import.meta.url);
const {
  chromium
} = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const shotsDir = process.env.SOCIAL_SHOTS_DIR || '';
if (shotsDir) mkdirSync(shotsDir, { recursive: true });

const fixture = `
import React,{useState,useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter,useLocation} from 'react-router-dom';
import {library} from '@fortawesome/fontawesome-svg-core';
import {faPlay} from '@fortawesome/pro-solid-svg-icons/faPlay';
import {FixtureProvider} from '~/contexts';
library.add(faPlay);
import TodayStats from './src/components/Notification/TodayStats';
import {container as notificationContainer} from './src/components/Notification/Styles';
import SocialWalkupOverlay from './src/containers/Build/Runtime/SocialWalkupOverlay';
import WalkupsItem from './src/containers/Home/Store/WalkupsItem';
import SocialTogetherCard from './src/containers/Chat/Message/MessageBody/SocialTogetherCard';
import {ChatQuickSendContext} from './src/containers/Chat/Message/MessageBody/ChatQuickSend';
import {socialWalkupStore,socialJoinableStore} from './src/helpers/socialWalkups';
window.socialWalkupStore=socialWalkupStore;window.socialJoinableStore=socialJoinableStore;
window.walkups=[];window.sent=[];window.seen=[];window.chipMarks=[];window.settingsCalls=[];window.leaves=[];window.walkAways=[];
window.walkupAnswer={status:'waiting',walkup:{id:'w21',queuePosition:1,expiresAt:Date.now()+9e5},host:{id:11,username:'KenGo',profilePicUrl:'/pictures/11.jpg'},joinable:{state:'open',label:'Looking for a game',mode:'1v1'}};
const achievements={mission:{type:'mission',title:'Mission'},gold:{type:'gold',title:'Gold'},grammar:{type:'grammar',title:'Grammar'},donor:{type:'donor',title:'Donor'},chess_legend:{type:'chess_legend',title:'Chess'}};
const requestHelpers={
  loadMyAchievements:async()=>({mission:{isUnlocked:false,progressObj:{currentValue:1,targetValue:2}}}),
  loadProfile:async id=>({id,username:window.names[id]||'member'+id}),
  loadTodayRankings:async()=>({myTodayRank:null}),
  loadClassSummary:async()=>null,
  loadBlockedUsers:async()=>({blockedUsers:[]}),
  walkUpToMember:async args=>{window.walkups.push(args);return window.walkupAnswer;},
  walkAwayFromMember:async args=>{window.walkAways.push(args);},
  leaveSocialHost:async args=>{window.leaves.push(args);},
  updateSocialSettings:async args=>{window.settingsCalls.push(args);return {success:true,settings:{social:{walkups:args.walkups}}};},
  markSocialMomentSeen:async args=>{window.seen.push(args.momentId);return {firstView:true,firstChat:window.firstChat===true};},
  markSocialMomentChip:async args=>{window.chipMarks.push(args);return {recorded:true};}
};
window.names={11:'KenGo',12:'ana',13:'dodo',14:'mina'};
const baduk=(joinable)=>({kind:'app',id:5,title:'Baduk',thumbnailUrl:null,multiplayer:true,...(joinable?{joinable}:{})});
const sketch=(joinable)=>({kind:'app',id:8,title:'Sketch Town',thumbnailUrl:null,multiplayer:true,...(joinable?{joinable}:{})});
const person=(id,activity)=>({id,username:window.names[id]||'member'+id,profilePicUrl:'/pictures/'+id+'.jpg',isOnline:true,isAway:false,activity});
window.live={
  11:person(11,baduk({state:'open',label:'Looking for a game',mode:'1v1'})),
  12:person(12,baduk({state:'busy-watchable',label:'',mode:'1v1'})),
  13:person(13,baduk()),
  14:person(14,sketch({state:'busy-watchable',label:'Drawing, come watch',mode:'watch'})),
  15:person(15,{kind:'app',id:9,title:'Word Search Adventure',thumbnailUrl:null})
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
// A stand-in for an app frame: the overlay must sit over it without covering it.
function AppScene(){
  return <div data-app-shell style={{position:'relative',width:'100%',height:560,background:'#22324a',overflow:'hidden',display:'grid',placeItems:'center'}}>
    <div data-app-board style={{width:260,height:260,borderRadius:12,background:'#d8b56a',display:'grid',placeItems:'center',color:'#3b2a10',fontSize:18,fontWeight:700}}>Baduk board</div>
    <SocialWalkupOverlay buildId={5} active/>
  </div>;
}
const cardBase={id:31,buildId:5,appTitle:'Baduk',appThumbnailUrl:null,appAvailable:true,mode:'1v1',isGame:true,text:'KenGo won by resignation',thumbnailUrl:null,linkPath:null,chips:['GG!','Rematch?','That was close!','How did you learn Go?'],count:1,isNewThread:true,users:[{id:7,username:'viewer',profilePicUrl:'/pictures/7.jpg'},{id:11,username:'KenGo',profilePicUrl:'/pictures/11.jpg'}],seenBy:[],chipBy:[],createdAt:Math.floor(Date.now()/1000)-60,updatedAt:Math.floor(Date.now()/1000)-60};
window.cards={
  first:cardBase,
  again:{...cardBase,id:32,isNewThread:false,count:3,text:'3 games · KenGo leads 2–1',seenBy:[7]},
  coop:{...cardBase,id:33,buildId:8,appTitle:'Sketch Town',mode:'coop',isGame:false,isNewThread:false,text:"You and KenGo drew 'Rainy Seoul'",chips:['That was fun!','Again sometime?','Hi!'],seenBy:[7]}
};
function ChatScene({card}){
  const quickSend=async content=>{window.sent.push(content);};
  return <div style={{background:'#fff',padding:'1rem 0',minHeight:300}}>
    <ChatQuickSendContext.Provider value={quickSend}>
      <SocialTogetherCard card={window.cards[card]} channelId={31} canReply/>
    </ChatQuickSendContext.Provider>
  </div>;
}
function Root(){
  const [scene,setScene]=useState({name:'none'});window.setScene=setScene;
  const [chatStatus,setChatStatus]=useState({});window.setChatStatus=setChatStatus;
  const [settings,setSettings]=useState({});window.setSettings=setSettings;window.settings=settings;
  return <FixtureProvider value={{chatStatus,requestHelpers,achievements,settings,onSetUserState:({newState})=>setSettings(newState.settings||{})}}>
    <LocationProbe/>
    {scene.name==='live'?<LiveScene width={scene.width}/>:null}
    {scene.name==='app'?<AppScene/>:null}
    {scene.name==='settings'?<WalkupsItem loading={false}/>:null}
    {scene.name==='chat'?<ChatScene key={scene.card} card={scene.card}/>:null}
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
        name: 'social-fixture',
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

async function shot(target, name) {
  if (!shotsDir) return;
  await target.screenshot({ path: path.join(shotsDir, name) });
}

test(
  'Live now shows who can be joined; the popup offers Play / Watch; Play walks up and opens the app at that member',
  { timeout: 120000 },
  async () => {
    const browser = await chromium.launch();
    try {
      const { page, errors } = await openPage(browser, { width: 390, height: 900 });
      await page.evaluate(() => {
        window.setScene({ name: 'live' });
        window.setChatStatus(window.live);
      });
      await page.getByText('Live now', { exact: true }).waitFor();
      // each joinable member has a line in the app's own words (or the default)
      const lines = await page.locator('.live-join').allInnerTexts();
      assert.deepEqual(
        lines.map((line) => line.trim()),
        ['KenGo · Looking for a game', 'ana · In a game, come watch', 'mina · Drawing, come watch']
      );
      // and a dot on their face; a member with nothing to join has none
      assert.equal(await page.locator('.live-face[data-joinable="open"]').count(), 1);
      assert.equal(await page.locator('.live-face[data-joinable="busy-watchable"]').count(), 2);
      assert.equal(await page.locator('[title="dodo"][data-joinable]').count(), 0);
      // an app nobody adopted this in looks as before
      const plainRow = page.locator('li', { hasText: 'Word Search Adventure' });
      assert.equal(await plainRow.locator('.live-join').count(), 0);
      // nothing overflows the phone-width card
      const overflow = await page.evaluate(() => {
        const section = document.querySelector('section[aria-label="Live now"]');
        const right = section.getBoundingClientRect().right;
        return [...section.querySelectorAll('.live-join, button, .live-title')].filter(
          (node) => node.getBoundingClientRect().right > right + 0.5
        ).length;
      });
      assert.equal(overflow, 0);
      await page.waitForTimeout(500);
      await shot(page.locator('[data-column]'), 'live-now-phone.png');

      // The popup for someone who is ready: one clear action.
      await page.locator('.live-join', { hasText: 'KenGo' }).click();
      const play = page.getByRole('button', { name: 'Play Baduk with KenGo' });
      await play.waitFor();
      await page.waitForTimeout(350);
      await shot(page, 'popup-play-phone.png');
      await play.click();
      await page.waitForFunction(() => window.lastLocation?.pathname === '/app/5');
      assert.deepEqual(await page.evaluate(() => window.walkups), [
        { buildId: 5, hostUserId: 11, intent: 'play' }
      ]);
      const target = await page.evaluate(() => window.lastLocation.state.buildLaunchTarget);
      assert.equal(target.source, 'social');
      assert.deepEqual(target.target, {
        kind: 'social',
        hostUserId: 11,
        hostUsername: 'KenGo',
        status: 'waiting',
        hostJoinable: { state: 'open', label: 'Looking for a game', mode: '1v1' }
      });
      assert.equal(
        await page.evaluate(() => window.socialWalkupStore.get(5).visit.status),
        'waiting'
      );

      // Someone busy: Watch (no queue) or Play next.
      await page.evaluate(() => {
        window.originalWalkupAnswer = window.walkupAnswer;
        window.walkupAnswer = { status: 'watch', host: { id: 12, username: 'ana' }, joinable: { state: 'busy-watchable', label: '', mode: '1v1' } };
        window.walkups.length = 0;
        window.socialWalkupStore.clear(5);
      });
      await page.locator('.live-join', { hasText: 'ana' }).click();
      const watch = page.getByRole('button', { name: 'Watch', exact: true });
      await watch.waitFor();
      await page.getByRole('button', { name: 'Play next' }).waitFor();
      await page.waitForTimeout(350);
      await shot(page, 'popup-watch-phone.png');
      await watch.click();
      await page.waitForFunction(
        () => window.lastLocation?.state?.buildLaunchTarget?.target?.hostUserId === 12
      );
      assert.deepEqual(await page.evaluate(() => window.walkups), [
        { buildId: 5, hostUserId: 12, intent: 'watch' }
      ]);
      assert.equal(
        await page.evaluate(() => window.lastLocation.state.buildLaunchTarget.target.status),
        'watch'
      );

      // A stale target that has become ineligible opens the app without
      // passing that member's identity to the frame.
      await page.evaluate(() => { window.walkupAnswer = { status: 'unavailable' }; });
      await page.locator('.live-join', { hasText: 'ana' }).click();
      await page.getByRole('button', { name: 'Watch', exact: true }).click();
      await page.waitForFunction(() => window.lastLocation?.state === null);
      assert.equal(await page.evaluate(() => window.socialWalkupStore.get(5).visit), null);

      // Join on the row walks up to whoever is ready; with nobody ready it
      // just opens the app (today's behavior).
      await page.evaluate(() => {
        window.walkupAnswer = window.originalWalkupAnswer;
        window.walkups.length = 0;
      });
      await page.getByRole('button', { name: 'Join Baduk' }).click();
      await page.waitForFunction(() => window.walkups.length === 1);
      assert.deepEqual(await page.evaluate(() => window.walkups[0]), {
        buildId: 5,
        hostUserId: 11,
        intent: 'play'
      });
      await page.evaluate(() => {
        window.walkups.length = 0;
      });
      await page.getByRole('button', { name: 'Join Sketch Town' }).click();
      await page.waitForFunction(() => window.lastLocation?.pathname === '/app/8');
      assert.deepEqual(await page.evaluate(() => window.walkups), []);
      assert.equal(await page.evaluate(() => window.lastLocation.state), null);
      await page.evaluate(() => window.setScene({ name: 'settings' }));
      const hostPreference = page.getByRole('switch', {
        name: 'Let people walk up while I play'
      });
      await hostPreference.waitFor();
      assert.equal(await hostPreference.getAttribute('aria-checked'), 'true');
      await hostPreference.click();
      await page.waitForFunction(() => window.settings?.social?.walkups === false);
      assert.equal(await hostPreference.getAttribute('aria-checked'), 'false');
      assert.deepEqual(errors, []);

      // A wide column (desktop side panel).
      const wide = await openPage(browser, { width: 1100, height: 900 });
      await wide.page.evaluate(() => {
        window.setScene({ name: 'live', width: 420 });
        window.setChatStatus(window.live);
      });
      await wide.page.locator('.live-join').first().waitFor();
      await wide.page.waitForTimeout(500);
      await shot(wide.page.locator('[data-column]'), 'live-now-desktop.png');
      assert.deepEqual(wide.errors, []);
    } finally {
      await browser.close();
    }
  }
);

test(
  'runtime overlay: banner and queue chip stay off the app, Play now reaches the app, opt-out is one tap, the visitor knows where they stand',
  { timeout: 120000 },
  async () => {
    const browser = await chromium.launch();
    try {
      const { page, errors } = await openPage(browser, { width: 390, height: 640 });
      await page.evaluate(() => window.setScene({ name: 'app' }));
      await page.locator('[data-app-board]').waitFor();
      // nothing social going on: nothing drawn
      assert.equal(await page.locator('[data-social-overlay]').count(), 0);

      const visitor = (id, username) => ({
        id: 'w' + id,
        user: { id, username, profilePicUrl: '/pictures/' + id + '.jpg' },
        queuePosition: 1,
        expiresAt: Date.now() + 9e5
      });
      await page.evaluate((entry) => {
        window.chosen = [];
        window.socialWalkupStore.onPlayNow((buildId, picked) => window.chosen.push(picked.id));
        window.socialJoinableStore.set(5, { state: 'busy-watchable', label: 'In a match', mode: '1v1' });
        window.socialWalkupStore.apply({ type: 'queue', buildId: 5, waiting: [entry], arrived: entry });
      }, visitor(21, 'mikey'));
      const banner = page.locator('[data-social-banner]');
      await banner.waitFor();
      assert.match(await banner.innerText(), /mikey walked up · next game\?/);
      // an edge banner: it does not cover the board, and taps on the app pass
      const cover = await page.evaluate(() => {
        const b = document.querySelector('[data-social-banner]').getBoundingClientRect();
        const board = document.querySelector('[data-app-board]').getBoundingClientRect();
        const hit = document.elementFromPoint(board.left + 20, board.top + 20);
        return { overlaps: b.bottom > board.top, hitBoard: !!hit.closest('[data-app-board]'), height: b.height };
      });
      assert.equal(cover.overlaps, false);
      assert.equal(cover.hitBoard, true);
      assert.ok(cover.height <= 64, `banner is ${cover.height}px tall`);
      await page.waitForTimeout(300);
      await shot(page.locator('[data-app-shell]'), 'host-banner-phone.png');

      // Play now tells the app which visitor; the banner steps aside for the chip.
      await banner.getByRole('button', { name: 'Play now' }).click();
      assert.deepEqual(await page.evaluate(() => window.chosen), ['w21']);
      const chip = page.locator('[data-social-chip]');
      await chip.waitFor();
      assert.match(await chip.innerText(), /1 person wants next/);

      // two waiting: the chip counts them and opens the list with the opt-out
      await page.evaluate(
        (entries) =>
          window.socialWalkupStore.apply({ type: 'queue', buildId: 5, waiting: entries, arrived: null }),
        [visitor(21, 'mikey'), { ...visitor(22, 'ana'), queuePosition: 2 }]
      );
      await page.getByText('2 people want next').waitFor();
      await shot(page.locator('[data-app-shell]'), 'host-queue-chip-phone.png');
      await chip.click();
      const list = page.locator('[data-social-list]');
      await list.waitFor();
      await page.waitForTimeout(200);
      await shot(page.locator('[data-app-shell]'), 'host-queue-list-phone.png');
      const optOut = list.getByRole('switch', { name: "Don't let people walk up while I play" });
      assert.equal(await optOut.getAttribute('aria-checked'), 'false');
      await optOut.click();
      await page.waitForFunction(() => window.settingsCalls.length === 1);
      assert.deepEqual(await page.evaluate(() => window.settingsCalls[0]), { walkups: false });
      // the server's answer turned it off: people waiting are released, the
      // queue goes, and one quiet chip remembers the choice
      await page.getByText('Walk-ups are off').waitFor();
      assert.deepEqual(await page.evaluate(() => window.leaves), [{ buildId: 5 }]);
      assert.equal(await page.locator('[data-social-chip]').count(), 0);
      await shot(page.locator('[data-app-shell]'), 'host-walkups-off-phone.png');
      // and it can be turned back on from there
      await page.getByText('Walk-ups are off').click();
      await page.getByRole('switch').click();
      await page.waitForFunction(() => window.settingsCalls.length === 2);
      assert.deepEqual(await page.evaluate(() => window.settingsCalls[1]), { walkups: true });
      await page.getByText('Walk-ups are off').waitFor({ state: 'detached' });

      // An ignored banner fades by itself (12 s); the visitor stays queued.
      await page.clock.install();
      await page.evaluate((entry) => {
        window.socialWalkupStore.apply({ type: 'queue', buildId: 5, waiting: [entry], arrived: entry });
      }, visitor(23, 'dodo'));
      await page.locator('[data-social-banner]').waitFor();
      await page.clock.fastForward(13000);
      await page.locator('[data-social-banner]').waitFor({ state: 'detached' });
      assert.match(await page.locator('[data-social-chip]').innerText(), /1 person wants next/);

      // The visitor's side, in a fresh page.
      const v = await openPage(browser, { width: 390, height: 640 });
      await v.page.evaluate(() => {
        window.setScene({ name: 'app' });
        window.socialWalkupStore.setVisit(5, {
          host: { id: 11, username: 'KenGo', profilePicUrl: '/pictures/11.jpg' },
          status: 'waiting',
          walkupId: 'w7',
          joinable: { state: 'busy-watchable', label: 'In a match', mode: '1v1' }
        });
      });
      const note = v.page.locator('[data-social-note]');
      await note.waitFor();
      assert.match(await note.innerText(), /You're next · KenGo is finishing up/);
      await v.page.waitForTimeout(300);
      await shot(v.page.locator('[data-app-shell]'), 'visitor-next-phone.png');
      await v.page.evaluate(() =>
        window.socialWalkupStore.setVisit(5, {
          host: { id: 11, username: 'KenGo', profilePicUrl: '/pictures/11.jpg' },
          status: 'later',
          walkupId: null,
          joinable: { state: 'busy', label: '', mode: '1v1' }
        })
      );
      await v.page.getByText("KenGo's still in a game. Play on your own while you wait?").waitFor();
      await v.page.waitForTimeout(300);
      await shot(v.page.locator('[data-app-shell]'), 'visitor-later-phone.png');
      assert.doesNotMatch(await note.innerText(), /declin|reject|refus/i);
      // the host let them in
      await v.page.evaluate(() => {
        window.socialWalkupStore.setVisit(5, {
          host: { id: 11, username: 'KenGo', profilePicUrl: '/pictures/11.jpg' },
          status: 'waiting',
          walkupId: 'w7',
          joinable: { state: 'open', label: '', mode: '1v1' }
        });
        window.socialWalkupStore.apply({
          type: 'matchReady',
          buildId: 5,
          matchKey: 'meet-aa',
          mode: '1v1',
          host: { id: 11, username: 'KenGo', profilePicUrl: '/pictures/11.jpg' }
        });
      });
      await v.page.getByText("You're playing with KenGo").waitFor();
      // waiting has a way out: hiding "You're next" walks away
      await v.page.evaluate(() =>
        window.socialWalkupStore.setVisit(5, {
          host: { id: 11, username: 'KenGo', profilePicUrl: '/pictures/11.jpg' },
          status: 'waiting',
          walkupId: 'w8',
          joinable: { state: 'busy', label: '', mode: '1v1' }
        })
      );
      await v.page.getByRole('button', { name: 'Stop waiting' }).click();
      await v.page.waitForFunction(() => window.walkAways.length === 1);
      await note.waitFor({ state: 'detached' });
      // leaving the app page while waiting walks away too
      await v.page.evaluate(() => {
        window.socialWalkupStore.setVisit(5, {
          host: { id: 11, username: 'KenGo', profilePicUrl: '/pictures/11.jpg' },
          status: 'waiting',
          walkupId: 'w9',
          joinable: null
        });
      });
      await note.waitFor();
      await v.page.evaluate(() => window.setScene({ name: 'none' }));
      await v.page.waitForFunction(() => window.walkAways.length === 2);
      assert.deepEqual(errors, []);
      assert.deepEqual(v.errors, []);
    } finally {
      await browser.close();
    }
  }
);

test(
  'chat card: a warm first-thread introduction, one-tap chips sent as your own message, the first-chat note shown once',
  { timeout: 120000 },
  async () => {
    const browser = await chromium.launch();
    try {
      const { page, errors } = await openPage(browser, { width: 390, height: 760 });
      await page.evaluate(() => {
        window.firstChat = true;
        window.setScene({ name: 'chat', card: 'first' });
      });
      const card = page.locator('[data-social-together]');
      await card.waitFor();
      await page.getByText('You and KenGo met over a game of Baduk').waitFor();
      await page.getByText('KenGo won by resignation').waitFor();
      // shown once: recorded by the server, which says this is a first chat
      await page.getByText('Be kind, and you can always block or report').waitFor();
      assert.deepEqual(await page.evaluate(() => window.seen), [31]);
      // both faces, no sender line, nothing that reads like a log
      assert.equal(await card.locator('.together-face').count(), 2);
      // the Rematch button is the rematch offer: no "Rematch?" chip above it
      assert.equal(await card.getByRole('button', { name: 'Rematch?' }).count(), 0);
      await card.getByRole('button', { name: 'Rematch' }).waitFor();
      assert.equal(await card.locator('.together-actions svg').count(), 1);
      await page.waitForTimeout(300);
      await shot(page, 'chat-card-first-dm-phone.png');
      // every button stays inside the card and is big enough for a thumb
      const misfits = await page.evaluate(() => {
        const c = document.querySelector('[data-social-together]').getBoundingClientRect();
        return [...document.querySelectorAll('[data-social-together] button')]
          .map((b) => ({ text: b.innerText, rect: b.getBoundingClientRect() }))
          .filter(({ rect }) => rect.right > c.right + 0.5 || rect.left < c.left - 0.5 || rect.height < 32)
          .map(({ text, rect }) => `${text}: ${Math.round(rect.width)}x${Math.round(rect.height)}`);
      });
      assert.deepEqual(misfits, []);

      // one tap sends it as the member's own ordinary message
      await card.getByRole('button', { name: 'GG!' }).click();
      await page.waitForFunction(() => window.sent.length === 1);
      assert.deepEqual(await page.evaluate(() => window.sent), ['GG!']);
      await page.waitForFunction(() => window.chipMarks.length === 1);
      assert.deepEqual(await page.evaluate(() => window.chipMarks[0]), {
        momentId: 31,
        chip: 'GG!'
      });
      await card.locator('.together-chip').first().waitFor({ state: 'detached' });

      // Rematch walks up to the other member (or just opens the app).
      await page.evaluate(() => {
        window.walkupAnswer = { status: 'unavailable' };
      });
      await card.getByRole('button', { name: 'Rematch' }).click();
      await page.waitForFunction(() => window.lastLocation?.pathname === '/app/5');
      assert.deepEqual(await page.evaluate(() => window.walkups), [
        { buildId: 5, hostUserId: 11, intent: 'play' }
      ]);
      assert.equal(await page.evaluate(() => window.lastLocation.state), null);
      assert.equal(
        await page.evaluate(() => window.socialWalkupStore.get(5).visit.status),
        'unavailable'
      );

      // An existing thread, later the same day: a memory, a count, no note,
      // and the server is not told "seen" again.
      await page.evaluate(() => {
        window.firstChat = false;
        window.setScene({ name: 'chat', card: 'again' });
      });
      await page.getByText('You and KenGo played Baduk', { exact: true }).waitFor();
      await page.getByText('3 games today', { exact: false }).waitFor();
      assert.equal(await page.getByText('Be kind').count(), 0);
      assert.deepEqual(await page.evaluate(() => window.seen), [31]);
      await page.waitForTimeout(200);
      await shot(page, 'chat-card-again-phone.png');

      // Not a game: other words, other chips.
      await page.evaluate(() => window.setScene({ name: 'chat', card: 'coop' }));
      await page.getByText('You and KenGo were in Sketch Town together').waitFor();
      await page.getByRole('button', { name: 'That was fun!' }).waitFor();
      await page.getByRole('button', { name: 'Open Sketch Town' }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'GG!' }).count(), 0);
      await page.waitForTimeout(200);
      await shot(page, 'chat-card-coop-phone.png');
      assert.deepEqual(errors, []);

      const wide = await openPage(browser, { width: 900, height: 700 });
      await wide.page.evaluate(() => {
        window.firstChat = true;
        window.setScene({ name: 'chat', card: 'first' });
      });
      await wide.page.getByText('Be kind').waitFor();
      await wide.page.waitForTimeout(200);
      await shot(wide.page, 'chat-card-first-dm-desktop.png');
      assert.deepEqual(wide.errors, []);
    } finally {
      await browser.close();
    }
  }
);
