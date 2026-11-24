import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

// "Preview follows new saves" (Mikey 11-24): a draft or branch preview
// (/app/<id>?runtimeSource=workspace) loads each new save without a browser
// reload: by itself when the viewer is idle, from a "New version · Reload"
// pill while they use the app, at most once per few seconds for rapid saves,
// always ending on the newest. The published view never follows saves.
const require = createRequire(import.meta.url);
const { chromium, webkit } = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const shots = process.env.PREVIEW_FOLLOW_SHOTS;
let bundle;

const fixture = `
import React, {useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter,useNavigate} from 'react-router-dom';
import Host from './src/containers/Build/Runtime/KeepAliveHost';
window.mounts={};window.writerLoads={};window.snapshots=[];window.reloads=[];window.emitted=[];
window.serverHash={501:'${'1'.repeat(64)}'};
const listeners=new Map();
window.fakeSocket={connected:true,
  on(name,fn){(listeners.get(name)||listeners.set(name,new Set()).get(name)).add(fn)},
  off(name,fn){listeners.get(name)?.delete(fn)},
  emit(name,payload){window.emitted.push([name,payload])}};
window.serverSaved=(buildId,filesHash,serverTime=Date.now())=>{window.serverHash[buildId]=filesHash;for(const fn of listeners.get('build_version_saved')||[])fn({buildId,artifactVersionId:1,filesHash,source:'save',serverTime})};
window.signalOnly=(buildId,filesHash,serverTime=Date.now())=>{for(const fn of listeners.get('build_version_saved')||[])fn({buildId,artifactVersionId:1,filesHash,source:'save',serverTime})};
window.hostContext={requestHelpers:{loadBuildPublishedVersion:async()=>({publishedArtifactVersionId:5}),loadBuildUpdateNoteForVersion:async()=>({note:null}),recordBuildUpdateNoteWhatsNewTap:async()=>{},recordBuildPreviewReload:async(id,kind)=>{window.reloads.push([id,kind])}}};
window.snapshot=async(id,reason)=>{window.snapshots.push({id,reason});return true};
function Navigation(){const navigate=useNavigate();useEffect(()=>{window.go=p=>navigate(p)},[navigate]);return null;}
createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={[window.initialPath || '/app/501?runtimeSource=workspace']}><Navigation/><Host/></MemoryRouter>);
`;

async function compile() {
  if (bundle) return bundle;
  const stubs = {
    '~/contexts': `export const useAppContext=f=>f(window.hostContext); export const useKeyContext=f=>f({myState:{userId:1}}); export const useInputContext=f=>f({getInputState:()=>null}); export const useViewContext=f=>f({state:{killBuildAppSession:null,buildAppNavTabIds:null}});`,
    // Module bodies run before the fixture's own code: read the fake late.
    '~/constants/sockets/api': 'export const socket={get connected(){return window.fakeSocket.connected},on:(...a)=>window.fakeSocket.on(...a),off:(...a)=>window.fakeSocket.off(...a),emit:(...a)=>window.fakeSocket.emit(...a)};',
    '~/helpers': 'export const isMobile=()=>false;',
    '~/contexts/Toast': 'export const useToast=()=>()=>{};',
    '~/helpers/analytics': 'export const trackEvent=()=>{};',
    '~/helpers/pageDeathTracker': 'export const notePageDeathApps=()=>{};',
    '~/helpers/buildAppLifecycle': `export const forgetAppLifecycleSnapshots=async()=>{};export const forgetRunningApp=()=>{};export const markAppClosed=()=>{};export const getAppLifecycleStatus=()=>({webgl:0,suspend:true});export const requestAppLifecycleSnapshot=(...a)=>window.snapshot(...a);export const subscribeAppLifecycleStatus=()=>()=>{};export const warmAppLifecycleStore=()=>{};`,
    './helpers/buildViewTracking': 'export const getActiveBuildViewEvent=()=>null;'
  };
  // The runtime loads the saved workspace the server has now and reports its
  // files hash, as GET /build/:id/runtime?runtimeSource=workspace does.
  const runtimeStub = `import React,{useEffect,useState} from 'react';
    export default function Runtime({buildIdOverride,locationOverride,onRuntimeBuildLoaded,initialLoadFromWriter}) {
      const [hash,setHash]=useState('');
      useEffect(()=>{const id=buildIdOverride; window.mounts[id]=(window.mounts[id]||0)+1;(window.writerLoads[id] ||= []).push(initialLoadFromWriter);
        const source=new URLSearchParams(locationOverride.search).get('runtimeSource')==='workspace'?'workspace':'published';
        const loaded=window.serverHash[id]; setHash(loaded);
        setTimeout(()=>onRuntimeBuildLoaded({id,title:'Fixture',publishedArtifactVersionId:5,projectFilesHash:source==='workspace'?loaded:null},source),30);
      },[]);
      return <div data-runtime={buildIdOverride} style={{height:'100%',background:'#eef4fb',padding:'5rem 1rem 1rem',boxSizing:'border-box'}}><p data-version>Showing save {hash.slice(0,1)}</p><iframe title="App" srcDoc="<button>Play</button>" style={{width:'100%',height:'60%',border:'1px solid #b8c8e2'}}/></div>;
    }`;
  const built = await build({
    stdin: { contents: fixture, resolveDir: repo, loader: 'tsx' }, bundle: true, write: false, format: 'iife', platform: 'browser',
    alias: { '~': path.join(repo, 'src') }, define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"development"' },
    plugins: [{ name: 'preview-follow-fixture', setup(b) {
      b.onResolve({ filter: /.*/ }, (args) => {
        if (args.path === '.' && args.importer.endsWith('/Runtime/KeepAliveHost.tsx')) return { path: 'runtime', namespace: 'stub' };
        return stubs[args.path] ? { path: args.path, namespace: 'stub' } : undefined;
      });
      b.onLoad({ filter: /.*/, namespace: 'stub' }, (args) => ({ contents: args.path === 'runtime' ? runtimeStub : stubs[args.path], loader: 'jsx', resolveDir: repo }));
    } }]
  });
  bundle = built.outputFiles[0].text;
  return bundle;
}

async function open(browser, initialPath) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  if (initialPath) await page.addInitScript((p) => { window.initialPath = p; }, initialPath);
  await page.route('http://localhost:3000/**', (route) => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{margin:0;width:100%;height:100%}html{font-size:8px}body{font:16px system-ui}</style></head><body><div id="root"></div></body></html>' }));
  await page.goto('http://localhost:3000/');
  await page.addScriptTag({ content: await compile() });
  return { page, errors };
}
const hash = (digit) => String(digit).repeat(64);
const pill = (page) => page.getByRole('button', { name: 'New version saved. Reload' });

for (const [engine, type] of Object.entries({ chromium, webkit })) {
  test(`saved-workspace preview follows saves: idle auto reload, pill while active, throttled to the newest (${engine})`, { timeout: 90000 }, async () => {
    const browser = await type.launch();
    try {
      const { page, errors } = await open(browser);
      await page.waitForFunction(() => window.mounts[501] === 1);
      await page.waitForTimeout(80);
      assert.deepEqual(await page.evaluate(() => window.emitted), [['build_preview_updates_join', { buildId: 501 }]], 'joins the build preview room');

      // Idle viewer (nothing touched): the new save loads by itself, with a
      // lifecycle snapshot first and a writer read.
      await page.evaluate((h) => window.serverSaved(501, h), hash(2));
      await page.waitForFunction(() => window.mounts[501] === 2);
      await page.getByText('Showing save 2').waitFor();
      assert.deepEqual(await page.evaluate(() => window.snapshots), [{ id: 501, reason: 'unload' }]);
      assert.deepEqual(await page.evaluate(() => window.writerLoads[501]), [false, true]);
      assert.deepEqual(await page.evaluate(() => window.reloads), [[501, 'auto']]);

      // The save it already shows (or an older one arriving late) does nothing.
      await page.waitForTimeout(100);
      await page.evaluate((h) => window.serverSaved(501, h), hash(2));
      await page.evaluate((h) => window.serverSaved(501, h, 1), hash(9));
      await page.waitForTimeout(300);
      assert.equal(await page.evaluate(() => window.mounts[501]), 2);

      // Rapid saves: one reload per gap, ending on the newest.
      await page.waitForTimeout(4200);
      const startedAt = Date.now();
      await page.evaluate((h) => window.serverSaved(501, h), hash(3));
      await page.waitForFunction(() => window.mounts[501] === 3);
      await page.waitForTimeout(150);
      for (const digit of [4, 5, 6]) {
        await page.evaluate((h) => window.serverSaved(501, h), hash(digit));
        await page.waitForTimeout(250);
      }
      assert.equal(await page.evaluate(() => window.mounts[501]), 3, 'no reload inside the gap');
      await page.waitForFunction(() => window.mounts[501] === 4, null, { timeout: 8000 });
      assert.ok(Date.now() - startedAt >= 3500, 'the next reload waited for the gap');
      await page.getByText('Showing save 6').waitFor();
      await page.waitForTimeout(4500);
      assert.equal(await page.evaluate(() => window.mounts[501]), 4, 'the newest save needs no further reload');

      // Loop guard: each signal causes at most one reload, even when the
      // files the reload finds differ from the signal's hash.
      // (a) A writer changed the files without a signal: the signal says 7,
      // the server has 8.
      await page.evaluate(([shown, signalled]) => { window.serverHash[501] = shown; window.signalOnly(501, signalled); }, [hash(8), hash(7)]);
      await page.waitForFunction(() => window.mounts[501] === 5, null, { timeout: 8000 });
      await page.getByText('Showing save 8').waitFor();
      // (b) Out of order across API processes: a stale signal with the larger
      // server time wins over the newest save's own signal.
      await page.waitForTimeout(4200);
      await page.evaluate(([newest, stale]) => {
        window.serverHash[501] = newest;
        window.signalOnly(501, stale, Date.now() + 60000);
        window.signalOnly(501, newest, Date.now());
      }, [hash(2), hash(5)]);
      await page.waitForFunction(() => window.mounts[501] === 6, null, { timeout: 8000 });
      await page.getByText('Showing save 2').waitFor();
      await page.waitForTimeout(9000);
      assert.equal(await page.evaluate(() => window.mounts[501]), 6, 'no reload loop after a mismatched load');

      // Active viewer (just tapped the page): the pill waits for their tap.
      await page.mouse.click(200, 120);
      await page.evaluate((h) => window.serverSaved(501, h), hash(7));
      await pill(page).waitFor();
      assert.equal(await page.evaluate(() => window.mounts[501]), 6, 'no reload while active');
      assert.equal((await pill(page).textContent()).replace(/\s+/g, ' ').trim(), 'New version · Reload');
      await page.waitForTimeout(250); // entry animation
      const box = await pill(page).boundingBox();
      assert.ok(box && Math.round(box.height) >= 44 && box.x >= 0 && box.x + box.width <= 391, JSON.stringify(box));
      if (shots) { mkdirSync(shots, { recursive: true }); await page.screenshot({ path: path.join(shots, `pill-${engine}.png`) }); }
      await pill(page).click();
      await page.waitForFunction(() => window.mounts[501] === 7);
      await page.getByText('Showing save 7').waitFor();
      assert.equal(await pill(page).count(), 0);
      assert.deepEqual((await page.evaluate(() => window.reloads)).map((r) => r[1]), ['auto', 'auto', 'auto', 'auto', 'auto', 'pill']);

      // Focus inside the app frame on a focused window counts as playing.
      await page.waitForTimeout(4200);
      await page.frameLocator('iframe').getByRole('button', { name: 'Play' }).click();
      await page.evaluate((h) => window.serverSaved(501, h), hash(9));
      await pill(page).waitFor();
      assert.equal(await page.evaluate(() => window.mounts[501]), 7);

      // Leaving the preview leaves the room.
      await page.evaluate(() => window.go('/build'));
      await page.waitForTimeout(50);
      assert.deepEqual((await page.evaluate(() => window.emitted)).at(-1), ['build_preview_updates_leave', { buildId: 501 }]);
      assert.deepEqual(errors, []);
      await page.close();

      // The published view never joins the room or reloads for a draft save.
      const published = await open(browser, '/app/501');
      await published.page.waitForFunction(() => window.mounts[501] === 1);
      await published.page.evaluate((h) => window.serverSaved(501, h), hash(4));
      await published.page.waitForTimeout(400);
      assert.equal(await published.page.evaluate(() => window.mounts[501]), 1);
      assert.deepEqual(await published.page.evaluate(() => window.emitted.filter((e) => e[0].startsWith('build_preview'))), []);
      assert.equal(await pill(published.page).count(), 0);
      assert.deepEqual(published.errors, []);
    } finally {
      await browser.close();
    }
  });
}
