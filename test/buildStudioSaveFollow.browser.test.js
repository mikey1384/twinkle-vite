import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

// The real useStudioSaveFollow (Build Studio follows saves made elsewhere),
// driven like EditorRoute drives it: the files hash the workspace shows, the
// editor's unsaved edits and its saving state, and a refresh that reads the
// saved files again. Re-review R1: this tab's own slow save must never leave
// a "New version" pill behind.
const require = createRequire(import.meta.url);
const { chromium } = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const hash = (digit) => String(digit).repeat(64);

const fixture = `
import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {useStudioSaveFollow} from './src/containers/Build/Editor/hooks/useStudioSaveFollow';
window.refreshes=0;window.counts=[];window.emitted=[];window.serverHash='${hash(1)}';
const listeners=new Map();
window.fakeSocket={connected:true,on(n,f){(listeners.get(n)||listeners.set(n,new Set()).get(n)).add(f)},off(n,f){listeners.get(n)?.delete(f)},emit(n,p){window.emitted.push([n,p])}};
window.signal=(filesHash)=>{for(const f of listeners.get('build_version_saved')||[])f({buildId:42,artifactVersionId:1,filesHash,source:'save',serverTime:Date.now()})};
function Harness(){
  const [p,setP]=useState({hash:'${hash(1)}',unsaved:false,saving:false});
  window.setProps=(n)=>setP((c)=>({...c,...n}));
  const follow=useStudioSaveFollow({workspaceBuildId:42,currentFilesHash:p.hash,unsavedEdits:p.unsaved,saving:p.saving,
    refresh:async()=>{window.refreshes+=1;await new Promise((r)=>setTimeout(r,100));setP((c)=>({...c,hash:window.serverHash}));},
    onReloadCounted:(id,kind)=>window.counts.push(kind)});
  return <div style={{padding:'60px 12px'}}>{follow.pillShown?<button onClick={follow.loadNow}>New version · Reload</button>:null}<p data-shown>shown {p.hash.slice(0,1)}</p><input aria-label="Code"/></div>;
}
createRoot(document.getElementById('root')).render(<Harness/>);
`;

async function compile() {
  const stubs = {
    '~/constants/sockets/api': 'export const socket={get connected(){return window.fakeSocket.connected},on:(...a)=>window.fakeSocket.on(...a),off:(...a)=>window.fakeSocket.off(...a),emit:(...a)=>window.fakeSocket.emit(...a)};'
  };
  const built = await build({
    stdin: { contents: fixture, resolveDir: repo, loader: 'tsx' }, bundle: true, write: false, format: 'iife', platform: 'browser',
    alias: { '~': path.join(repo, 'src') }, define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"development"' },
    plugins: [{ name: 'stub', setup(b) {
      b.onResolve({ filter: /.*/ }, (args) => (stubs[args.path] ? { path: args.path, namespace: 'stub' } : undefined));
      b.onLoad({ filter: /.*/, namespace: 'stub' }, (args) => ({ contents: stubs[args.path], loader: 'js' }));
    } }]
  });
  return built.outputFiles[0].text;
}

test('Build Studio follows outside saves and never shows a pill for its own slow save', { timeout: 90000 }, async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 600 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route('http://localhost:3000/**', (route) => route.fulfill({ contentType: 'text/html', body: '<!doctype html><div id="root"></div>' }));
    await page.goto('http://localhost:3000/');
    await page.addScriptTag({ content: await compile() });
    await page.getByText('shown 1').waitFor();
    assert.deepEqual(await page.evaluate(() => window.emitted), [['build_preview_updates_join', { buildId: 42 }]]);
    const pill = page.getByRole('button', { name: 'New version · Reload' });
    const state = () => page.evaluate(() => ({ refreshes: window.refreshes, counts: window.counts }));

    // 1. This tab's own save, slower than the 1.2 s settle: the signal comes
    // first, the response (with the same hash) 3 s later. Never a pill.
    await page.evaluate((h) => { window.setProps({ saving: true }); window.serverHash = h; window.signal(h); }, hash(2));
    await page.waitForTimeout(3000);
    assert.equal(await pill.count(), 0, 'no pill while this tab is saving');
    await page.evaluate((h) => window.setProps({ hash: h, saving: false }), hash(2));
    await page.waitForTimeout(2500);
    assert.equal(await pill.count(), 0, 'no pill once the own save returned');
    assert.deepEqual(await state(), { refreshes: 0, counts: [] }, 'and nothing was read');

    // The same with unsaved edits made while the save was in flight.
    await page.evaluate((h) => { window.setProps({ saving: true, unsaved: true }); window.serverHash = h; window.signal(h); }, hash(3));
    await page.waitForTimeout(2600);
    assert.equal(await pill.count(), 0);
    await page.evaluate((h) => window.setProps({ hash: h, saving: false, unsaved: true }), hash(3));
    await page.waitForTimeout(2500);
    assert.equal(await pill.count(), 0, 'own save plus newer local edits: still no pill');
    assert.equal((await state()).refreshes, 0);

    // 2. An outside save while the editor holds unsaved edits: the pill, and
    // nothing replaced.
    await page.evaluate((h) => { window.serverHash = h; window.signal(h); }, hash(4));
    await pill.waitFor({ timeout: 4000 });
    assert.equal((await state()).refreshes, 0, 'unsaved edits are not replaced');
    await page.getByText('shown 3').waitFor();

    // 3. The viewer saves their edits; the server takes them (H5). The
    // signal for their save arrives before the response; the pill clears
    // and nothing is read.
    await page.evaluate((h) => { window.setProps({ saving: true }); window.serverHash = h; window.signal(h); }, hash(5));
    await page.waitForTimeout(300);
    assert.equal(await pill.count(), 0, 'the pill steps aside while saving');
    await page.evaluate((h) => window.setProps({ hash: h, saving: false, unsaved: false }), hash(5));
    await page.waitForTimeout(2500);
    assert.equal(await pill.count(), 0);
    assert.equal((await state()).refreshes, 0);

    // 3b. Pill for an outside save, then the viewer drops their edits while
    // idle: the new save loads by itself, once.
    await page.evaluate(() => window.setProps({ unsaved: true }));
    await page.evaluate((h) => { window.serverHash = h; window.signal(h); }, hash(6));
    await pill.waitFor({ timeout: 4000 });
    await page.evaluate(() => window.setProps({ unsaved: false }));
    await page.getByText('shown 6').waitFor({ timeout: 6000 });
    assert.equal(await pill.count(), 0);
    assert.deepEqual(await state(), { refreshes: 1, counts: ['auto'] });

    // 4. Clean editor, but the viewer is using the page (playing the
    // preview): the pill, not a refresh mid-game; tapping it loads.
    await page.getByLabel('Code').click();
    await page.evaluate((h) => { window.serverHash = h; window.signal(h); }, hash(7));
    await pill.waitFor({ timeout: 4000 });
    assert.equal((await state()).refreshes, 1);
    await pill.click();
    await page.getByText('shown 7').waitFor({ timeout: 4000 });
    assert.deepEqual(await state(), { refreshes: 2, counts: ['auto', 'pill'] });

    // 5. Clean and idle (20 s window over): loads by itself; a signal whose
    // files the read did not find is used up, never a loop.
    await page.evaluate(() => document.activeElement?.blur());
    await page.waitForTimeout(20500);
    await page.evaluate(([shown, signalled]) => { window.serverHash = shown; window.signal(signalled); }, [hash(8), hash(9)]);
    await page.getByText('shown 8').waitFor({ timeout: 8000 });
    await page.waitForTimeout(6000);
    assert.deepEqual(await state(), { refreshes: 3, counts: ['auto', 'pill', 'auto'] });
    assert.equal(await pill.count(), 0);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
