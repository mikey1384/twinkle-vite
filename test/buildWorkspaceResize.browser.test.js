import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const { chromium } = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const baseline = process.env.WORKSPACE_RESIZE_BASELINE === '1';
const artifacts = process.env.WORKSPACE_RESIZE_ARTIFACTS;

const fixture = `
import React, {useLayoutEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import Workspace from './src/containers/Build/Editor/Workspace';
import useWorkspaceLayout from './src/containers/Build/Editor/hooks/useWorkspaceLayout';
function Fixture() {
  const [shown,setShown] = useState(true);
  const [draft,setDraft] = useState('Keep the saved draft.');
  const layout = useWorkspaceLayout({communicationPanelShown:shown});
  const previewRef = useRef(null);
  useLayoutEffect(() => {window.workspaceShell = layout.workspaceShellRef.current;});
  window.fixture = {setShown, state:{width:layout.buildChatPanelWidth, desktop:layout.isDesktopWorkspaceLayout, draft}};
  return <main style={{height:'100vh',display:'grid',gridTemplateRows:'minmax(0,1fr)'}}>
    <Workspace {...layout} communicationPanelShown={shown}
      onWorkspaceResizePointerDown={layout.handleWorkspaceResizePointerDown}
      onWorkspaceResizeKeyDown={layout.handleWorkspaceResizeKeyDown}
      chatPanelProps={{draft,onDraft:setDraft}} previewPanelProps={{}} previewPanelRef={previewRef}
      mobilePanelTabIntent={{tab:'lumine',version:0}} onMobilePanelTabChange={()=>{}}/>
  </main>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);
`;

async function bundle() {
  // The real hook, Workspace markup, media queries, grid and separator are
  // exercised. Children are inert: no API, app preview or member data.
  const stubs = {
    '~/helpers/userDataHelpers': `export const getStoredItem=k=>localStorage.getItem(k);export const setStoredItem=(k,v)=>localStorage.setItem(k,v);`,
    '~/constants/css': `export const mobileMaxWidth='767px';export const borderRadius='12px';`,
    '~/components/Buttons/SegmentedToggle': `import React from 'react';export default function Toggle({value,options,onChange}){return <div>{options.map(o=><button key={o.value} aria-pressed={o.value===value} onClick={()=>onChange(o.value)}>{o.label}</button>)}</div>}`,
    './MainProjectButton': `export default function MainProjectButton(){return null;}`,
    './useBranchSendToOwner': `export default function useBranchSendToOwner(){return {waitingToSend:false};}`,
    './ChatPanel': `import React from 'react';export default function Chat({draft,onDraft}){return <section data-chat style={{minHeight:0,minWidth:0,display:'grid',gridTemplateRows:'auto minmax(0,1fr) auto'}}><h2>Lumine</h2><div data-scroll style={{overflow:'auto'}}>{Array.from({length:40},(_,i)=><p key={i}>Saved message {i+1}</p>)}</div><textarea aria-label="Draft" value={draft} onChange={e=>onDraft(e.target.value)}/></section>}`,
    '../PreviewPanel': `import React from 'react';export default React.forwardRef(function Preview(p,ref){return <section ref={ref} data-preview style={{minHeight:0,minWidth:0,overflow:'auto'}}><h2>Workspace</h2><div style={{height:900}}>Preview remains available.</div></section>})`
  };
  const result = await build({
    stdin: { contents: fixture, resolveDir: repo, loader: 'tsx' },
    bundle: true, write: false, format: 'iife', platform: 'browser', jsx: 'transform',
    define: {'process.env.NODE_ENV':'"production"'},
    plugins: [{name:'workspace-resize-fixture',setup(builder){
      builder.onResolve({filter:/.*/},args=>{
        if (args.path in stubs) return {path:args.path,namespace:'fixture'};
        if (args.path.startsWith('~/')) return builder.resolve(path.join(repo,'src',args.path.slice(2)),{resolveDir:repo,kind:args.kind});
      });
      builder.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:stubs[args.path],loader:'jsx',resolveDir:repo}));
    }}]
  });
  return result.outputFiles[0].text;
}

async function settle(page) {
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}

async function snapshot(page, label) {
  return page.evaluate(label=>({label,...window.fixture.state,
    shellWidth:window.workspaceShell.getBoundingClientRect().width,
    shellClientWidth:window.workspaceShell.clientWidth,
    scrollTop:document.querySelector('[data-scroll]')?.scrollTop,
    panels:{chat:!!document.querySelector('[data-chat]'),preview:!!document.querySelector('[data-preview]')},
    separator:!!document.querySelector('[role=separator]'),
    storedWidth:localStorage.getItem('twinkle:build-workshop-chat-panel-width')
  }),label);
}

test('workspace resize preserves controls without synchronous resize geometry', {timeout:45000}, async()=>{
  const script = await bundle();
  const browser = await chromium.launch({headless:true,timeout:10000});
  const report = {baseline,cases:[],errors:[]};
  try {
    for (const observer of [true,false]) {
      const context = await browser.newContext({viewport:{width:1280,height:800}});
      const page = await context.newPage();
      page.setDefaultTimeout(5000);
      page.on('pageerror',error=>report.errors.push(error.message));
      await page.route('**/*',route=>route.request().url()==='http://localhost:3000/'
        ?route.fulfill({contentType:'text/html',body:'<!doctype html><style>*{box-sizing:border-box}html{font-size:10px}body{margin:0;font:16px Arial;--ui-border:#b7c1d0}h2,p{margin:12px}textarea{min-height:60px;width:100%}</style><div id="root"></div>'})
        :route.abort());
      await page.goto('http://localhost:3000/');
      await page.evaluate(observer=>{
        if(!observer) window.ResizeObserver=undefined;
        localStorage.setItem('twinkle:build-workshop-chat-panel-width','720');
        window.synchronousReads=0;
        const original=Element.prototype.getBoundingClientRect;
        Element.prototype.getBoundingClientRect=function(){
          if(window.inResizeDispatch && this===window.workspaceShell) window.synchronousReads++;
          return original.call(this);
        };
      },observer);
      await page.addScriptTag({content:script});
      await page.getByRole('separator').waitFor();
      await settle(page);
      const cases=[];
      cases.push(await snapshot(page,'initial'));
      assert.equal(cases.at(-1).width,720);
      await page.evaluate(()=>{document.querySelector('[data-scroll]').scrollTop=200;});
      const burstReads=await page.evaluate(()=>{
        const root=document.getElementById('root');
        window.inResizeDispatch=true;
        for(let i=0;i<30;i++){
          root.style.paddingRight=(i%2?4:0)+'px';
          window.dispatchEvent(new Event('resize'));
        }
        window.inResizeDispatch=false;
        root.style.paddingRight='0px';
        return window.synchronousReads;
      });
      assert.equal(burstReads,baseline||!observer?30:0);
      await settle(page);
      await page.setViewportSize({width:900,height:800});
      await settle(page);
      cases.push(await snapshot(page,'narrow-desktop'));
      assert.equal(cases.at(-1).width,Math.round(cases.at(-1).shellWidth-372));
      assert.equal(cases.at(-1).scrollTop,200);
      await page.setViewportSize({width:900,height:700});
      await settle(page);
      cases.push(await snapshot(page,'height-only'));
      assert.equal(cases.at(-1).width,cases.at(-2).width);
      assert.equal(cases.at(-1).scrollTop,200);
      await page.setViewportSize({width:1280,height:800});
      await settle(page);
      const beforeDrag=await snapshot(page,'before-drag');
      const separator=page.getByRole('separator');
      const box=await separator.boundingBox();
      await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
      await page.mouse.down();
      await page.mouse.move(box.x+box.width/2+100,box.y+box.height/2);
      await page.mouse.up();
      await settle(page);
      cases.push(await snapshot(page,'dragged'));
      assert.equal(cases.at(-1).width,beforeDrag.width+100);
      assert.equal(Number(cases.at(-1).storedWidth),cases.at(-1).width);
      await separator.press('Home');
      await settle(page);
      assert.equal((await snapshot(page,'home')).width,320);
      await separator.press('ArrowRight');
      await separator.press('Shift+ArrowRight');
      await settle(page);
      cases.push(await snapshot(page,'keyboard'));
      assert.equal(cases.at(-1).width,408);
      assert.equal(Number(cases.at(-1).storedWidth),408);
      if(artifacts&&observer){mkdirSync(artifacts,{recursive:true});await page.screenshot({path:path.join(artifacts,'desktop.png')});}
      await page.evaluate(()=>window.fixture.setShown(false));
      await settle(page);
      cases.push(await snapshot(page,'collapsed'));
      assert.deepEqual(cases.at(-1).panels,{chat:false,preview:true});
      assert.equal(cases.at(-1).separator,false);
      await page.evaluate(()=>window.fixture.setShown(true));
      await settle(page);
      await page.setViewportSize({width:360,height:780});
      await settle(page);
      cases.push(await snapshot(page,'compact'));
      assert.equal(cases.at(-1).desktop,false);
      assert.equal(cases.at(-1).separator,false);
      assert.deepEqual(cases.at(-1).panels,{chat:true,preview:false});
      assert.equal(await page.getByRole('textbox',{name:'Draft'}).inputValue(),'Keep the saved draft.');
      if(artifacts&&observer) await page.screenshot({path:path.join(artifacts,'compact.png')});
      await page.getByRole('button',{name:'Workspace',exact:true}).click();
      await settle(page);
      assert.deepEqual((await snapshot(page,'compact-preview')).panels,{chat:false,preview:true});
      await page.setViewportSize({width:1280,height:800});
      await settle(page);
      cases.push(await snapshot(page,'desktop-return'));
      assert.equal(cases.at(-1).width,408);
      assert.deepEqual(cases.at(-1).panels,{chat:true,preview:true});
      assert.equal(await page.getByRole('textbox',{name:'Draft'}).inputValue(),'Keep the saved draft.');
      // Keep the same viewport-relative border-box semantics under CSS zoom.
      await page.evaluate(()=>{document.body.style.zoom='1.25';window.dispatchEvent(new Event('resize'));});
      await settle(page);
      cases.push(await snapshot(page,'zoom'));
      assert.equal(cases.at(-1).width,408);
      report.cases.push({observer,burstReads,states:cases});
      await context.close();
    }
    assert.deepEqual(report.errors,[]);
  } finally {
    await browser.close();
    if(artifacts){mkdirSync(artifacts,{recursive:true});writeFileSync(path.join(artifacts,'result.json'),JSON.stringify(report,null,2));}
  }
});
