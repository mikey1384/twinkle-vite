import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { build, stop } from 'esbuild';

const require = createRequire(import.meta.url);
const { chromium } = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const contexts = `
import {useSyncExternalStore} from 'react';
import reducer, {createInitialBuildStudioState} from './src/contexts/Build/reducer';
let state = {buildStudio:createInitialBuildStudioState()};
const listeners = new Set();
const noop = () => {};
const actions = new Proxy({}, {get(target, key) {
  return target[key] ||= key === 'onSetBuildStudioTodayTopViewedBuild'
    ? buildStudio => {
        state = reducer(state, {type:'SET_BUILD_STUDIO_TODAY_TOP_VIEWED_BUILD', buildStudio});
        listeners.forEach(fn => fn());
      } : noop;
}});
const requests = [];
const app = {user:{actions}, requestHelpers:{
  loadTodayTopViewedBuild: () => new Promise((resolve, reject) => requests.push({resolve,reject})),
  loadRecentlyUsedBuilds: async () => ({builds:[]}),
  loadFavoriteBuilds: async () => ({builds:[]})
}};
export const useAppContext = select => select(app);
export const useBuildContext = select => useSyncExternalStore(
  fn => {listeners.add(fn); return () => listeners.delete(fn)},
  () => select({state, actions})
);
export const useKeyContext = select => select({myState:{userId:7}});
export const useContentContext = select => select({actions});
export const useViewContext = select => select({actions});
window.discoveryRequests = requests;
window.resolveDiscovery = (index, data) => requests[index].resolve(data);
window.rejectDiscovery = index => requests[index].reject(new Error('offline'));
`;
const fixture = `
import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {library} from '@fortawesome/fontawesome-svg-core';
import {faTrophy,faLaptopCode,faChevronRight,faEye,faUser,faPlus,faExternalLinkAlt,faStar,faRocketLaunch,faWandMagicSparkles} from '@fortawesome/pro-solid-svg-icons';
import {faStar as emptyStar} from '@fortawesome/pro-regular-svg-icons';
import useQuickAccess from './src/containers/Build/List/hooks/useQuickAccess';
import Hero from './src/containers/Build/List/Hero';
library.add(faTrophy,faLaptopCode,faChevronRight,faEye,faUser,faPlus,faExternalLinkAlt,faStar,faRocketLaunch,faWandMagicSparkles,emptyStar);
const noop = () => {};
function Fixture() {
  const [userId,setUserId] = useState(7);
  window.setDiscoveryUser = setUserId;
  const data = useQuickAccess({normalizedUserId:userId,buildQuickAccessMode:'recent',
    buildStudio:{},onPatchBuildStudioMyBuild:noop,onSetBuildStudioBrowseBuilds:noop});
  return <Hero topViewedBuild={data.todayTopViewedBuild} topBuilds={data.todayTopBuilds}
    topViewedPending={data.todayTopViewedPending} discoveryFailed={data.todayTopViewedFailed}
    onRetryDiscovery={data.onRetryDiscovery} onOpenTopBuild={data.onOpenTodayTopBuild}
    onOpenTopViewedBuild={data.onOpenTodayTopViewedBuild} onFavoriteChange={noop}
    onFavoriteError={noop} onFavoriteStart={noop} onNewBuild={noop}/>;
}
const root = createRoot(document.getElementById('root'));
root.render(<Fixture/>);
window.unmountDiscovery = () => root.unmount();
`;

test('discovery renders responsively, refreshes at midnight, retries, and rejects stale user responses', {timeout:60000}, async () => {
  const stubs = {
    '~/contexts':contexts,
    '~/constants/sockets/api':'export const socket = {on(){},off(){}};',
    '../QuickAccess':'export const QUICK_ACCESS_FETCH_LIMIT = 12;',
    'react-router-dom':`export const useLocation = () => ({pathname:'/build',search:'',hash:''});
      export const useNavigate = () => (to, options) => {window.discoveryNavigation = {to,options}};`,
    '~/components/Texts/UsernameText':`import React from 'react';
      export default function Username({user,textStyle}) {return <span style={textStyle}>{user.username}</span>}`
  };
  const bundle = await build({
    stdin:{contents:fixture,resolveDir:repo,loader:'tsx'},bundle:true,write:false,
    format:'iife',platform:'browser',jsx:'transform',
    define:{'process.env.NODE_ENV':'"development"'},
    plugins:[{name:'discovery-fixture',setup(builder) {
      builder.onResolve({filter:/.*/}, args => {
        if (Object.hasOwn(stubs,args.path)) return {path:args.path,namespace:'fixture'};
        if (args.path.startsWith('~/')) return builder.resolve(path.join(repo,'src',args.path.slice(2)),{resolveDir:repo,kind:args.kind});
      });
      builder.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:stubs[args.path],loader:'jsx',resolveDir:repo}));
    }}]
  });
  stop();
  const browser = await chromium.launch({headless:true,timeout:10000});
  try {
    const page = await browser.newPage({viewport:{width:1100,height:900}});
    page.setDefaultTimeout(5000);
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/*',route=>route.abort());
    await page.clock.install({time:new Date('2026-09-20T23:59:58Z')});
    await page.clock.pauseAt(new Date('2026-09-20T23:59:58Z'));
    await page.setContent('<meta name="viewport" content="width=device-width,initial-scale=1"><main id="root" style="padding:16px;max-width:1000px;margin:auto"></main>');
    await page.addStyleTag({content:readFileSync(path.join(repo,'src/styles.css'),'utf8')});
    await page.addScriptTag({content:bundle.outputFiles[0].text});
    const requested = count=>page.waitForFunction(n=>window.discoveryRequests.length===n,count);
    const resolve = (index,data)=>page.evaluate(({index,data})=>window.resolveDiscovery(index,data),{index,data});
    const midnight = Date.parse('2026-09-21T00:00:00Z');
    const builds = Array.from({length:10},(_,i)=>({id:30+i,title:i===0?'A very long app title that should wrap without hiding its rank':`Daily app ${i+1}`,username:'Creator',todayViewCount:20-i,isPublic:true}));
    await requested(1);
    await resolve(0,{build:builds[1],topBuilds:builds,nextDay:midnight});
    const list=page.getByRole('list',{name:"Apps ranked by today's unique views"});
    await list.waitFor();
    assert.equal(await list.getByRole('listitem').count(),3);
    await page.getByRole('button',{name:'See all'}).click();
    assert.equal(await list.getByRole('listitem').count(),10);
    await page.getByRole('button',{name:'Show less'}).click();
    const firstLink=list.getByRole('link').first();
    assert.equal(await firstLink.getAttribute('href'),'/app/30?viewSource=build_today_top');
    await firstLink.click();
    assert.equal(await page.evaluate(()=>window.discoveryNavigation.to),'/app/30?viewSource=build_today_top');
    for (const width of [1100,820,390]) {
      await page.setViewportSize({width,height:900});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`no horizontal overflow at ${width}`);
      const boxes=await page.evaluate(()=>{
        const trending=document.querySelector('aside[aria-label]')?.getBoundingClientRect();
        const list=document.querySelector('ol')?.getBoundingClientRect();
        return {trending,list};
      });
      assert.ok(boxes.list.width>0 && boxes.trending.width>0);
      if (process.env.BUILD_DISCOVERY_SCREENSHOTS) {
        mkdirSync(process.env.BUILD_DISCOVERY_SCREENSHOTS,{recursive:true});
        await page.screenshot({path:path.join(process.env.BUILD_DISCOVERY_SCREENSHOTS,`discovery-${width}.png`),fullPage:true});
      }
    }
    await page.clock.runFor(2100);
    await requested(2);
    assert.equal(await list.count(),0,'yesterday disappears while the new response is pending');
    await resolve(1,{build:null,topBuilds:[],nextDay:midnight+86400000});
    await page.getByText('Today’s top apps will appear as people open them.').waitFor();
    await page.evaluate(()=>window.setDiscoveryUser(8));
    await requested(3);
    await page.evaluate(()=>window.rejectDiscovery(2));
    await page.getByRole('button',{name:'Try again'}).click();
    await requested(4);
    await page.evaluate(()=>window.setDiscoveryUser(9));
    await requested(5);
    await resolve(3,{build:builds[0],topBuilds:builds,nextDay:midnight+86400000});
    assert.equal(await list.count(),0,'another account’s late response cannot hydrate this account');
    await resolve(4,{build:null,topBuilds:[],nextDay:midnight+86400000});
    await page.getByText('Today’s top apps will appear as people open them.').waitFor();
    await page.evaluate(()=>window.unmountDiscovery());
    await page.clock.runFor(1800001);
    assert.equal(await page.evaluate(()=>window.discoveryRequests.length),5,'unmount cancels refresh timers');
    assert.deepEqual(errors,[]);
  } finally {
    await browser.close();
  }
});
