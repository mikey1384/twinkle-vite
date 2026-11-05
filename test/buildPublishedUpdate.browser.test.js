import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const { chromium, webkit } = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const artifacts = process.env.BUILD_UPDATE_ARTIFACTS;
let bundle;

const fixture = `
import React, {useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter,useNavigate} from 'react-router-dom';
import Host from './src/containers/Build/Runtime/KeepAliveHost';
let now=1000000, visible='visible';
Date.now=()=>now;
window.advance=ms=>{now+=ms};
const realInterval=window.setInterval.bind(window);
window.setInterval=(fn,ms,...args)=>{if(ms>=120000&&ms<=150000)window.triggerPoll=fn;return realInterval(fn,ms,...args)};
Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>visible});
window.setVisible=value=>{visible=value?'visible':'hidden';document.dispatchEvent(new Event('visibilitychange'));};
window.answers={363:100,999:200}; window.loadedVersions={363:100,999:200}; window.calls=[]; window.mounts={};window.writerLoads={};window.snapshots=[];
window.loadVersion=async id=>{window.calls.push(id);if(window.deferredId===id){return await new Promise(resolve=>window.resolveFetch=resolve)}; const answer=window.answers[id];if(answer==='error')throw Error('offline');return answer==='bad'?{publishedArtifactVersionId:'bad'}:{publishedArtifactVersionId:answer};};
window.hostContext={requestHelpers:{loadBuildPublishedVersion:id=>window.loadVersion(id)}};
window.snapshot=async(id,reason)=>{window.snapshots.push({id,reason});if(window.deferSnapshot)await new Promise(resolve=>window.resolveSnapshot=resolve);return true};
function Navigation(){const navigate=useNavigate();useEffect(()=>{window.go=path=>navigate(path)},[navigate]);return null;}
createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={[window.initialPath || '/app/363']}><Navigation/><Host/></MemoryRouter>);
`;

async function compile() {
  if (bundle) return bundle;
  const stubs = {
    '~/contexts': `export const useAppContext=f=>f(window.hostContext); export const useKeyContext=f=>f({myState:{userId:1}}); export const useViewContext=f=>f({state:{killBuildAppSession:null,buildAppNavTabIds:null}});`,
    '~/helpers': 'export const isMobile=()=>false;',
    '~/contexts/Toast': 'export const useToast=()=>()=>{};',
    '~/helpers/analytics': 'export const trackEvent=()=>{};',
    '~/helpers/pageDeathTracker': 'export const notePageDeathApps=()=>{};',
    '~/helpers/buildAppLifecycle': `export const forgetAppLifecycleSnapshots=async()=>{};export const forgetRunningApp=()=>{};export const markAppClosed=()=>{};export const getAppLifecycleStatus=()=>({webgl:0,suspend:true});export const requestAppLifecycleSnapshot=(...a)=>window.snapshot(...a);export const subscribeAppLifecycleStatus=()=>()=>{};export const warmAppLifecycleStore=()=>{};`,
    './helpers/buildViewTracking': 'export const getActiveBuildViewEvent=()=>null;'
  };
  const runtimeStub = `import React,{useEffect} from 'react';
    export default function Runtime({buildIdOverride,locationOverride,onRuntimeBuildLoaded,initialLoadFromWriter}) {
      useEffect(()=>{const id=buildIdOverride; window.mounts[id]=(window.mounts[id]||0)+1;(window.writerLoads[id] ||= []).push(initialLoadFromWriter);
        const source=new URLSearchParams(locationOverride.search).get('runtimeSource')==='workspace'?'workspace':'published';
        const v=window.loadedVersions[id];if(v!==null)onRuntimeBuildLoaded({id,title:'Fixture',publishedArtifactVersionId:v},source);
      },[]);
      return <div data-runtime={buildIdOverride} style={{height:'100%',background:'#cfe6ff',padding:'6rem 1rem 1rem'}}><p>Running app {buildIdOverride}</p><input aria-label="Work in progress" /></div>;
    }`;
  const built = await build({
    stdin:{contents:fixture,resolveDir:repo,loader:'tsx'},bundle:true,write:false,format:'iife',platform:'browser',
    alias:{'~':path.join(repo,'src')},define:{'import.meta.env':'{}','process.env.NODE_ENV':'"development"'},
    plugins:[{name:'runtime-update-fixture',setup(b){
      b.onResolve({filter:/.*/},args=>{
        if(args.path==='.' && args.importer.endsWith('/Runtime/KeepAliveHost.tsx'))return {path:'runtime',namespace:'stub'};
        return stubs[args.path]?{path:args.path,namespace:'stub'}:undefined;
      });
      b.onLoad({filter:/.*/,namespace:'stub'},args=>({contents:args.path==='runtime'?runtimeStub:stubs[args.path],loader:'jsx',resolveDir:repo}));
    }}]
  });
  bundle = built.outputFiles[0].text;
  return bundle;
}

for (const [engine, type] of Object.entries({chromium,webkit})) {
  test(`published app update notice preserves the running session and updates on request (${engine})`, {timeout:90000}, async()=>{
    const browser=await type.launch();
    try {
      const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.route('http://localhost:3000/**',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{margin:0;width:100%;height:100%;font:16px system-ui}</style></head><body><div id="root"></div></body></html>'}));
      await page.goto('http://localhost:3000/');
      await page.addScriptTag({content:await compile()});
      await page.waitForFunction(()=>window.calls?.length===1 && window.mounts?.[363]===1);
      assert.equal(await page.getByRole('status').count(),0,'same version does not show a notice');
      await page.getByLabel('Work in progress').fill('unfinished work');
      await page.evaluate(()=>{answers[363]=101;advance(150000);window.triggerPoll();});
      await page.getByText('New update available',{exact:true}).waitFor();
      assert.equal(await page.getByLabel('Work in progress').inputValue(),'unfinished work');
      assert.equal(await page.evaluate(()=>mounts[363]),1,'detection does not reload the running app');
      const updateStyle=await page.getByRole('button',{name:'Update',exact:true}).evaluate(el=>{const s=getComputedStyle(el);return [s.userSelect||s.webkitUserSelect,s.getPropertyValue('-webkit-tap-highlight-color')];});
      assert.equal(updateStyle[0],'none','notice controls do not select on a long touch');
      if(updateStyle[1])assert.match(updateStyle[1],/^(transparent|rgba\(0, 0, 0, 0\))$/);
      for(const [width,height] of [[320,640],[360,780],[390,844],[667,375],[1024,768]]){
        await page.setViewportSize({width,height});
        const box=await page.getByRole('status').boundingBox();
        assert(box && box.x>=0 && box.x+box.width<=width+1 && box.y>=0 && box.y+box.height<=height,JSON.stringify({width,height,box}));
        for(const name of ['Later','Update']){const b=await page.getByRole('button',{name,exact:true}).boundingBox();assert(b && b.height>=44 && b.x>=0 && b.x+b.width<=width+1,JSON.stringify({name,width,b}));}
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
        if(artifacts && (width===320 || width===667)){mkdirSync(artifacts,{recursive:true});await page.screenshot({path:path.join(artifacts,`${engine}-${width}.png`)});}
      }
      await page.getByRole('button',{name:'Later'}).click();
      assert.equal(await page.getByRole('status').count(),0);
      await page.evaluate(()=>{advance(6000);window.dispatchEvent(new Event('online'));});
      await page.waitForTimeout(50);
      assert.equal(await page.getByRole('status').count(),0,'Later is respected for the same publication');
      await page.evaluate(()=>{setVisible(false);advance(6000);setVisible(true)});
      await page.getByText('New update available',{exact:true}).waitFor();
      await page.evaluate(()=>{deferSnapshot=true;loadedVersions[363]=101});
      await page.getByRole('button',{name:'Update',exact:true}).click();
      await page.waitForFunction(()=>typeof window.resolveSnapshot==='function');
      assert.equal(await page.evaluate(()=>mounts[363]),1,'wait for the snapshot before remount');
      assert.equal(await page.getByRole('button',{name:'Updating…'}).isDisabled(),true);
      assert.deepEqual(await page.evaluate(()=>snapshots),[{id:363,reason:'unload'}]);
      await page.evaluate(()=>resolveSnapshot());
      await page.waitForFunction(()=>mounts[363]===2);
      assert.deepEqual(await page.evaluate(()=>writerLoads[363]),[false,true],'the update reload uses the writer after a new publish');
      await page.waitForTimeout(50);
      assert.equal(await page.getByRole('status').count(),0,'updated version clears the notice');
      await page.evaluate(()=>{answers[363]='bad';advance(6000);window.dispatchEvent(new Event('online'))});
      await page.waitForTimeout(50);
      assert.equal(await page.evaluate(()=>mounts[363]),2,'malformed response cannot unpublish the app');
      assert.equal(await page.getByRole('status').count(),0);
      await page.evaluate(()=>{answers[363]='error';advance(6000);window.dispatchEvent(new Event('online'))});
      await page.waitForTimeout(50);
      assert.equal(await page.evaluate(()=>mounts[363]),2,'network failure leaves the app alone');
      await page.evaluate(()=>{answers[363]=102;advance(6000);window.dispatchEvent(new Event('online'))});
      await page.getByText('New update available',{exact:true}).waitFor();
      await page.evaluate(()=>{deferredId=363;advance(6000);window.dispatchEvent(new Event('online'))});
      await page.waitForFunction(()=>typeof window.resolveFetch==='function');
      await page.evaluate(()=>go('/app/999'));
      await page.waitForFunction(()=>mounts[999]===1);
      await page.evaluate(()=>{deferredId=null;resolveFetch({publishedArtifactVersionId:103})});
      await page.waitForTimeout(50);
      assert.equal(await page.getByRole('status').count(),0,'another app does not inherit the notice');
      await page.evaluate(()=>go('/app/363'));
      await page.getByText('New update available',{exact:true}).waitFor();
      assert.equal(await page.evaluate(()=>mounts[363]),2,'returning does not silently discard the old session');
      await page.evaluate(()=>{answers[363]=null;loadedVersions[363]=null;advance(6000);window.dispatchEvent(new Event('online'))});
      await page.waitForFunction(()=>mounts[363]===3);
      assert.deepEqual(errors,[]);
      for (const route of ['/app/363?runtimeSource=workspace','/app/363?appMcpSession=pinned']) {
        const other = await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
        try {
          await other.addInitScript((path)=>{window.initialPath=path;},route);
          await other.route('http://localhost:3000/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><div id="root"></div>'}));
          await other.goto('http://localhost:3000/');
          await other.addScriptTag({content:await compile()});
          await other.waitForFunction(()=>mounts?.[363]===1);
          await other.waitForTimeout(100);
          assert.deepEqual(await other.evaluate(()=>calls),[],`${route} must not check published updates`);
          assert.equal(await other.getByRole('status').count(),0);
        } finally { await other.close(); }
      }
    } finally { await browser.close(); }
  });
}
