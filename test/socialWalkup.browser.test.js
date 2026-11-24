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
// - the chat notice: Twinkle's words from each member's side, in the Build
//   card's frame, with Play again (or Join again) and Report, and the
//   first-chat note shown once.
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
import {faFlag} from '@fortawesome/pro-solid-svg-icons/faFlag';
import {faUserGroup} from '@fortawesome/pro-solid-svg-icons/faUserGroup';
import {faBan} from '@fortawesome/pro-solid-svg-icons/faBan';
import {FixtureProvider} from '~/contexts';
library.add(faPlay,faFlag,faUserGroup,faBan);
import TodayStats from './src/components/Notification/TodayStats';
import {container as notificationContainer} from './src/components/Notification/Styles';
import SocialWalkupOverlay from './src/containers/Build/Runtime/SocialWalkupOverlay';
import WalkupsItem from './src/containers/Home/Store/WalkupsItem';
import SocialTogetherCard from './src/containers/Chat/Message/MessageBody/SocialTogetherCard';
import {socialWalkupStore,socialJoinableStore} from './src/helpers/socialWalkups';
window.socialWalkupStore=socialWalkupStore;window.socialJoinableStore=socialJoinableStore;
window.walkups=[];window.seen=[];window.reports=[];window.settingsCalls=[];window.leaves=[];window.walkAways=[];
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
  reportSocialMoment:async args=>{window.reports.push(args);return {reportId:1,alreadyReported:false,message:'Thanks. Our team will look at this.'};}
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
// Drop-in rooms: an open lobby (Join puts you straight in) and one in a match.
// The busy room is what presence carries when the app goes busy without
// repeating its roomKey: mode 'room', no dropIn flag, no key.
const amongUs=(joinable)=>({kind:'app',id:2809,title:'Among Us',thumbnailUrl:'/thumbs/amongus.png',multiplayer:true,...(joinable?{joinable}:{})});
window.names[16]='dew';window.names[17]='Cloudstar';window.names[18]='mina2';
window.rooms={
  16:person(16,amongUs({state:'open',label:'Waiting for crews',mode:'room',dropIn:true})),
  17:person(17,amongUs({state:'busy',label:'In a match',mode:'room'})),
  18:person(18,amongUs())
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
function AmongScene(){
  return <div data-app-shell style={{position:'relative',width:'100%',height:560,background:'#0b1020',overflow:'hidden',display:'grid',placeItems:'center'}}>
    <div data-app-board style={{width:280,padding:18,borderRadius:14,background:'#1b2440',color:'#e8eefc',fontSize:15,fontWeight:700,textAlign:'center'}}>App frame (stand-in)<div style={{fontWeight:400,marginTop:8,color:'#a9b6d6'}}>Lobby ROOM-ABCD · 3/12</div></div>
    <SocialWalkupOverlay buildId={2809} active/>
  </div>;
}
function AppScene(){
  return <div data-app-shell style={{position:'relative',width:'100%',height:560,background:'#22324a',overflow:'hidden',display:'grid',placeItems:'center'}}>
    <div data-app-board style={{width:260,height:260,borderRadius:12,background:'#d8b56a',display:'grid',placeItems:'center',color:'#3b2a10',fontSize:18,fontWeight:700}}>Baduk board</div>
    <SocialWalkupOverlay buildId={5} active/>
  </div>;
}
const now=Math.floor(Date.now()/1000);
const cardBase={id:31,buildId:5,revision:1,appTitle:'Baduk',appThumbnailUrl:'/thumbs/baduk.png',appAvailable:true,activity:'played',action:'play',
  lines:{7:{headline:'You and KenGo played Baduk together',detail:'KenGo won'},11:{headline:'You and viewer played Baduk together',detail:'You won'}},
  count:1,isNewThread:true,users:[{id:7,username:'viewer',profilePicUrl:'/pictures/7.jpg'},{id:11,username:'KenGo',profilePicUrl:'/pictures/11.jpg'}],seenBy:[],createdAt:now-60,updatedAt:now-60};
window.cards={
  first:cardBase,
  again:{...cardBase,id:32,revision:3,isNewThread:false,count:3,lines:{7:{headline:'You and KenGo played Baduk together',detail:'3 games today · You 1, KenGo 2'},11:{headline:'You and viewer played Baduk together',detail:'3 games today · You 2, viewer 1'}},seenBy:[7]},
  coop:{...cardBase,id:33,buildId:8,appTitle:'Sketch Town',appThumbnailUrl:'/thumbs/sketch.png',activity:'drew',action:'join',isNewThread:false,lines:{7:{headline:'You and KenGo drew together in Sketch Town',detail:''},11:{headline:'You and viewer drew together in Sketch Town',detail:''}},seenBy:[7]}
};
function ChatScene({card}){
  return <div style={{background:'#fff',padding:'1rem 0',minHeight:300}}>
    <SocialTogetherCard card={window.cards[card]}/>
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
    {scene.name==='among'?<AmongScene/>:null}
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
        { buildId: 5, hostUserId: 11, intent: 'play', dropIn: true }
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
        { buildId: 5, hostUserId: 12, intent: 'watch', dropIn: true }
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

      // The row's button says what it does: Play walks up to whoever is
      // ready; a watch-only member (Sketch Town, mode 'watch') is Watch.
      await page.evaluate(() => {
        window.walkupAnswer = window.originalWalkupAnswer;
        window.walkups.length = 0;
      });
      await page.getByRole('button', { name: 'Play: Baduk' }).click();
      await page.waitForFunction(() => window.walkups.length === 1);
      assert.deepEqual(await page.evaluate(() => window.walkups[0]), {
        buildId: 5,
        hostUserId: 11,
        intent: 'play',
        dropIn: true
      });
      await page.evaluate(() => {
        window.walkups.length = 0;
      });
      await page.getByRole('button', { name: 'Watch: Sketch Town' }).click();
      await page.waitForFunction(() => window.lastLocation?.pathname === '/app/8');
      assert.deepEqual(await page.evaluate(() => window.walkups), [
        { buildId: 8, hostUserId: 14, intent: 'watch', dropIn: true }
      ]);

      await page.evaluate(() => window.setScene({ name: 'settings' }));
      const hostPreference = page.getByRole('switch', {
        name: 'Let people walk up while I play'
      });
      await hostPreference.waitFor();
      assert.equal(await hostPreference.getAttribute('aria-checked'), 'true');
      // SwitchButton's styled track (its label) sits over the input, as on
      // every switch on the site: a tap lands on the label, which toggles it.
      await hostPreference.click({ force: true });
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
  'chat notice: Twinkle\'s words in the Build card frame, Play again walks up, Report snapshots the revision on screen, the first-chat note shown once',
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
      await card.getByText('Played together', { exact: true }).waitFor();
      await card.getByText('You and KenGo played Baduk together', { exact: true }).waitFor();
      await card.getByText('KenGo won', { exact: true }).waitFor();
      await card.getByText('Baduk', { exact: true }).waitFor();
      // shown once: recorded by the server, which says this is a first chat
      await page.getByText('Be kind, and you can always block or report').waitFor();
      assert.deepEqual(await page.evaluate(() => window.seen), [31]);
      // both faces and the app's picture; two actions and no reply chips
      assert.equal(await card.locator('img[src="/thumbs/baduk.png"]').count(), 1);
      const buttons = (await card.getByRole('button').allInnerTexts()).map((t) => t.trim());
      assert.deepEqual(buttons, ['Play again', 'Report']);
      assert.equal(await card.locator('button svg').count(), 2);
      await page.waitForTimeout(300);
      await shot(page, 'chat-card-first-dm-phone.png');
      // every button stays inside the card and is big enough for a thumb
      const misfits = await page.evaluate(() => {
        const c = document.querySelector('[data-social-together] > div').getBoundingClientRect();
        return [...document.querySelectorAll('[data-social-together] button')]
          .map((b) => ({ text: b.innerText, rect: b.getBoundingClientRect() }))
          .filter(({ rect }) => rect.right > c.right + 0.5 || rect.left < c.left - 0.5 || rect.height < 32)
          .map(({ text, rect }) => `${text}: ${Math.round(rect.width)}x${Math.round(rect.height)}`);
      });
      assert.deepEqual(misfits, []);

      // Play again walks up to the other member (or just opens the app).
      await page.evaluate(() => {
        window.walkupAnswer = { status: 'unavailable' };
      });
      await card.getByRole('button', { name: 'Play again' }).click();
      await page.waitForFunction(() => window.lastLocation?.pathname === '/app/5');
      assert.deepEqual(await page.evaluate(() => window.walkups), [
        { buildId: 5, hostUserId: 11, intent: 'play', dropIn: true }
      ]);
      assert.equal(await page.evaluate(() => window.lastLocation.state), null);
      assert.equal(
        await page.evaluate(() => window.socialWalkupStore.get(5).visit.status),
        'unavailable'
      );

      // An existing thread, later the same day: the day's score, no note,
      // and the server is not told "seen" again.
      await page.evaluate(() => {
        window.firstChat = false;
        window.setScene({ name: 'chat', card: 'again' });
      });
      await page.getByText('3 games today · You 1, KenGo 2', { exact: true }).waitFor();
      await page.getByText('3 today', { exact: true }).waitFor();
      assert.equal(await page.getByText('Be kind').count(), 0);
      assert.deepEqual(await page.evaluate(() => window.seen), [31]);
      await page.waitForTimeout(200);
      await shot(page, 'chat-card-again-phone.png');

      // Report: the revision the member is looking at, reporting the other member.
      await page.getByRole('button', { name: 'Report' }).click();
      await page.getByText('Report this notice').waitFor();
      await page.getByText('Bullying or harassment').click();
      await page.waitForTimeout(200);
      await shot(page, 'chat-card-report-phone.png');
      await page.getByRole('button', { name: 'Send report' }).click();
      await page.getByText('Report sent').waitFor();
      assert.deepEqual(await page.evaluate(() => window.reports), [
        { momentId: 32, revision: 3, reason: 'harassment', note: undefined }
      ]);
      await page.getByRole('button', { name: 'Done' }).click();

      // Not a game: its own template, Join again, no result line.
      await page.evaluate(() => window.setScene({ name: 'chat', card: 'coop' }));
      await page.getByText('You and KenGo drew together in Sketch Town', { exact: true }).waitFor();
      await page.getByText('Drew together', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Join again' }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Play again' }).count(), 0);
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

test(
  'drop-in rooms: one tap on Join lands the visitor in the host\'s room; a room in a match offers no Join; the host sees a passing toast',
  { timeout: 120000 },
  async () => {
    const browser = await chromium.launch();
    try {
      const { page, errors } = await openPage(browser, { width: 390, height: 900 });
      await page.evaluate(() => {
        window.walkups.length = 0;
        window.walkupAnswer = {
          status: 'drop-in',
          host: { id: 16, username: 'dew', profilePicUrl: '/pictures/16.jpg' },
          joinable: { state: 'open', label: 'Waiting for crews', mode: 'room', dropIn: true },
          matchKey: 'meet-0123456789abcdef01234567',
          roomKey: 'room-ABCD',
          mode: 'room'
        };
        window.setScene({ name: 'live' });
        window.setChatStatus({ ...window.live, ...window.rooms });
      });
      const row = page.locator('li', { hasText: 'Among Us' });
      await row.locator('.live-join').first().waitFor();
      assert.deepEqual(
        (await row.locator('.live-join').allInnerTexts()).map((line) => line.trim()),
        ['dew · Waiting for crews', 'Cloudstar · In a match']
      );
      await page.waitForTimeout(500);
      await shot(page.locator('[data-column]'), 'dropin-live-now-phone.png');

      // A room in a match: its popup says so and offers nothing to tap.
      await row.locator('.live-join', { hasText: 'Cloudstar' }).click();
      const busyPanel = page.locator('[data-social-join]');
      await busyPanel.waitFor();
      assert.match(await busyPanel.innerText(), /In a match/);
      assert.doesNotMatch(await busyPanel.innerText(), /next/i);
      assert.equal(await busyPanel.locator('button').count(), 0);
      await page.waitForTimeout(350);
      await shot(page, 'dropin-popup-busy-phone.png');
      await page.keyboard.press('Escape');
      await row.locator('.live-join', { hasText: 'Cloudstar' }).click();
      await page.waitForFunction(() => !document.querySelector('[data-social-join]'));

      // The open room's popup: one Join.
      await row.locator('.live-join', { hasText: 'dew' }).click();
      const joinDew = page.getByRole('button', { name: 'Join dew in Among Us' });
      await joinDew.waitFor();
      await page.waitForTimeout(350);
      await shot(page, 'dropin-popup-open-phone.png');
      await row.locator('.live-join', { hasText: 'dew' }).click();
      await page.waitForFunction(() => !document.querySelector('[data-social-join]'));

      // One tap on the row's Join: straight into dew's room.
      await page.getByRole('button', { name: 'Join: Among Us' }).click();
      await page.waitForFunction(() => window.lastLocation?.pathname === '/app/2809');
      assert.deepEqual(await page.evaluate(() => window.walkups), [
        { buildId: 2809, hostUserId: 16, intent: 'play', dropIn: true }
      ]);
      const target = await page.evaluate(() => window.lastLocation.state.buildLaunchTarget);
      assert.deepEqual(target, {
        source: 'social',
        buildId: 2809,
        target: {
          kind: 'social',
          hostUserId: 16,
          hostUsername: 'dew',
          status: 'drop-in',
          hostJoinable: { state: 'open', label: 'Waiting for crews', mode: 'room', dropIn: true },
          roomKey: 'room-ABCD',
          matchKey: 'meet-0123456789abcdef01234567'
        }
      });
      const state = await page.evaluate(() => window.socialWalkupStore.get(2809));
      assert.equal(state.visit, null);
      assert.equal(state.match.dropIn, true);
      assert.equal(state.match.roomKey, 'room-ABCD');

      // The visitor's app page: nothing drawn over the app (no note, no banner).
      await page.evaluate(() => window.setScene({ name: 'among' }));
      await page.locator('[data-app-board]').waitFor();
      await page.waitForTimeout(300);
      assert.equal(await page.locator('[data-social-overlay]').count(), 0);
      await shot(page.locator('[data-app-shell]'), 'dropin-visitor-lands-phone.png');

      // A refusal is the neutral walk-up answer: the app opens as always.
      await page.evaluate(() => {
        window.socialWalkupStore.clear(2809);
        window.walkupAnswer = { status: 'unavailable' };
        window.setScene({ name: 'live' });
      });
      await page.getByRole('button', { name: 'Join: Among Us' }).click();
      await page.waitForFunction(() => window.lastLocation?.state === null);
      assert.equal(await page.evaluate(() => window.socialWalkupStore.get(2809).match), null);

      // Only a busy room in Among Us: Live now shows it busy with no button,
      // and the row just opens the app. Nobody is walked up to or queued.
      // (a fresh card: Live now holds what it showed while the pointer is on it)
      await page.mouse.move(380, 890);
      await page.evaluate(() => {
        window.walkups.length = 0;
        window.lastLocation = null;
        window.setScene({ name: 'none' });
        window.setChatStatus({ ...window.live, 17: window.rooms[17] });
      });
      await page.evaluate(() => window.setScene({ name: 'live' }));
      // A row with nothing to tap sorts below rows that have something to
      // tap, so it can sit behind "+N more" (Mikey 11-24).
      const more = page.getByRole('button', { name: /^\+\d+ more$/ });
      if (await more.count()) await more.click();
      const busyRow = page.locator('li', { hasText: 'Among Us' });
      await page.waitForFunction(() => {
        const row = [...document.querySelectorAll('li')].find((li) => li.textContent.includes('Among Us'));
        return row && row.querySelectorAll('.live-join').length === 1;
      });
      assert.deepEqual(
        (await busyRow.locator('.live-join').allInnerTexts()).map((line) => line.trim()),
        ['Cloudstar · In a match']
      );
      assert.equal(await busyRow.locator('.live-join').first().getAttribute('data-state'), 'busy');
      // nothing to join: the default Play (opens the app), never Join
      assert.deepEqual(
        (await busyRow.getByRole('button', { name: /: Among Us$/ }).allInnerTexts()).map((t) => t.trim()),
        ['Play']
      );
      await busyRow.locator('.live-title').click();
      await page.waitForFunction(() => window.lastLocation?.pathname === '/app/2809');
      assert.deepEqual(await page.evaluate(() => window.walkups), []);
      assert.equal(await page.evaluate(() => window.lastLocation.state), null);
      assert.deepEqual(errors, []);

      // The host's side: a tiny toast that takes no taps and goes by itself.
      const host = await openPage(browser, { width: 390, height: 640 });
      await host.page.evaluate(() => window.setScene({ name: 'among' }));
      await host.page.locator('[data-app-board]').waitFor();
      await host.page.evaluate(() =>
        window.socialWalkupStore.apply({
          type: 'dropIn',
          buildId: 2809,
          matchKey: 'meet-0123456789abcdef01234567',
          mode: 'room',
          visitor: { id: 7, username: 'viewer', profilePicUrl: '/pictures/7.jpg' }
        })
      );
      const toast = host.page.locator('[data-social-arrival]');
      await toast.waitFor();
      assert.equal((await toast.innerText()).trim(), 'viewer joined from Live now');
      assert.equal(await host.page.locator('[data-social-banner]').count(), 0);
      assert.equal(await toast.locator('button').count(), 0);
      assert.equal(await toast.evaluate((node) => getComputedStyle(node).pointerEvents), 'none');
      await host.page.waitForTimeout(700);
      await shot(host.page.locator('[data-app-shell]'), 'dropin-host-toast-phone.png');
      await host.page.waitForFunction(() => !document.querySelector('[data-social-arrival]'), null, { timeout: 6000 });
      assert.deepEqual(host.errors, []);
    } finally {
      await browser.close();
    }
  }
);

test(
  'the row button says what tapping does: Join a room, Play someone ready, Watch a game or a watch-only player',
  { timeout: 120000 },
  async () => {
    const browser = await chromium.launch();
    try {
      const { page, errors } = await openPage(browser, { width: 390, height: 1000 });
      await page.evaluate(() => {
        window.names[21] = 'Lemon';
        window.names[22] = 'Hur';
        window.names[23] = 'Heo';
        const red = (joinable) => ({ kind: 'app', id: 2, title: 'The Adventure of a Red Square', thumbnailUrl: '/thumbs/redsquare.png', multiplayer: false, ...(joinable ? { joinable } : {}) });
        const baduk = (joinable) => ({ kind: 'app', id: 2915, title: 'Baduk', thumbnailUrl: '/thumbs/baduk.png', multiplayer: true, ...(joinable ? { joinable } : {}) });
        const among = (joinable) => ({ kind: 'app', id: 2809, title: 'Among Us', thumbnailUrl: '/thumbs/amongus.png', multiplayer: true, ...(joinable ? { joinable } : {}) });
        const person = (id, activity) => ({ id, username: window.names[id], profilePicUrl: '/pictures/' + id + '.jpg', isOnline: true, isAway: false, activity });
        window.labelScenes = {
          ready: {
            16: person(16, among({ state: 'open', label: 'Waiting for crews', mode: 'room', dropIn: true })),
            11: person(11, baduk({ state: 'open', label: 'Looking for a game', mode: '1v1' })),
            21: person(21, red({ state: 'busy-watchable', label: 'Playing World 3-2', mode: 'watch' }))
          },
          busy: {
            // Among Us full / no seat left: a watchable room (Mikey 11-24)
            17: person(17, among({ state: 'busy-watchable', label: 'Room full · come watch', mode: 'room', dropIn: true })),
            12: person(12, baduk({ state: 'busy-watchable', label: 'In a game, come watch', mode: '1v1' })),
            22: person(22, baduk({ state: 'busy', label: 'Playing the AI', mode: '1v1' })),
            23: person(23, red())
          }
        };
        window.walkups.length = 0;
        window.walkupAnswer = { status: 'unavailable' };
        window.setScene({ name: 'live' });
        window.setChatStatus(window.labelScenes.ready);
      });
      const rowButtons = async () =>
        page.evaluate(() =>
          [...document.querySelectorAll('section[aria-label="Live now"] li')].map((li) => [
            li.querySelector('.live-title').textContent,
            li.querySelector(':scope > button')?.textContent.trim() || null
          ])
        );
      const expandAll = async () => {
        const more = page.getByRole('button', { name: /more$/ });
        if (await more.count()) await more.click();
      };
      await page.getByText('Live now', { exact: true }).waitFor();
      await expandAll();
      await page.waitForFunction(() => document.querySelectorAll('section[aria-label="Live now"] li').length === 3);
      assert.deepEqual(new Map(await rowButtons()), new Map([
        ['Among Us', 'Join'],
        ['Baduk', 'Play'],
        ['The Adventure of a Red Square', 'Watch']
      ]));
      await page.mouse.move(385, 995);
      await page.waitForTimeout(500);
      await shot(page.locator('[data-column]'), 'labels-join-play-watch-phone.png');

      // Watch on a watch-only player: the walk-up watch path, no queue
      await page.getByRole('button', { name: 'Watch: The Adventure of a Red Square' }).click();
      await page.waitForFunction(() => window.walkups.length === 1);
      assert.deepEqual(await page.evaluate(() => window.walkups[0]), {
        buildId: 2, hostUserId: 21, intent: 'watch', dropIn: true
      });

      // Busy: Baduk online game = Watch, a full Among Us room = Watch,
      // Baduk vs the AI alone and a closed Red Square = the default Play
      // (opens the app; "Join" only for real joinable moments).
      // (a fresh card: Live now holds what it showed while the pointer is on it)
      await page.mouse.move(385, 995);
      await page.evaluate(() => {
        window.walkups.length = 0;
        window.setScene({ name: 'none' });
        window.setChatStatus(window.labelScenes.busy);
      });
      await page.evaluate(() => window.setScene({ name: 'live' }));
      await page.getByText('Live now', { exact: true }).waitFor();
      await page.waitForFunction(() => document.body.textContent.includes('Room full'));
      await expandAll();
      await page.waitForFunction(() => document.querySelectorAll('section[aria-label="Live now"] li').length === 3);
      assert.deepEqual(new Map(await rowButtons()), new Map([
        ['Among Us', 'Watch'],
        ['Baduk', 'Watch'],
        ['The Adventure of a Red Square', 'Play']
      ]));
      await page.mouse.move(385, 995);
      await page.waitForTimeout(500);
      await shot(page.locator('[data-column]'), 'labels-busy-watch-phone.png');
      await page.getByRole('button', { name: 'Watch: Among Us' }).click();
      await page.waitForFunction(() => window.walkups.length === 1);
      assert.deepEqual(await page.evaluate(() => window.walkups[0]), {
        buildId: 2809, hostUserId: 17, intent: 'watch', dropIn: true
      });

      // Only the AI game: nothing to join, so Baduk shows the default Play
      await page.mouse.move(385, 995);
      await page.evaluate(() => {
        window.setScene({ name: 'none' });
        window.setChatStatus({ 22: window.labelScenes.busy[22] });
      });
      await page.evaluate(() => window.setScene({ name: 'live' }));
      await page.getByText('Live now', { exact: true }).waitFor();
      await page.waitForFunction(() => !document.body.textContent.includes('Room full'));
      assert.deepEqual(await rowButtons(), [['Baduk', 'Play']]);
      assert.deepEqual(errors, []);
    } finally {
      await browser.close();
    }
  }
);
