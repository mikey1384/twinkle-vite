import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const { chromium, webkit } = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const items = JSON.parse(readFileSync(process.env.ARENA_SCENES_CONTENT || new URL('./fixtures/arenaReviewScenes.json', import.meta.url), 'utf8'));
const artifacts = process.env.ARENA_SCENES_ARTIFACTS;
const fixture = `
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import {PaperItem} from './src/containers/Arena/BattleRunner';
const DATA=${JSON.stringify(items)};
function Fixture(){const [selection,setSelection]=useState({n:DATA[0].number,run:0,correct:false,staticView:false});
 window.show=(n,correct=false,staticView=false)=>{localStorage.removeItem('arena-review-steps');setSelection(s=>({n,run:s.run+1,correct,staticView}));};
 window.revisit=()=>setSelection(s=>({...s,run:s.run+1}));
 const item=DATA.find(i=>i.number===selection.n);
 return <main style={{maxWidth:'72rem',margin:'0 auto',padding:'1rem'}}><h2>Question {item.number}</h2>
 <PaperItem key={selection.run} item={{...item,no:item.number,type:item.itemType,section:'math',points:5,typed:item.accepted?'number':undefined,key:item.answer??item.accepted?.[0],correct:selection.correct}}
 finished marked={null} reviewLang="ko" onMark={()=>{}} korean reviewOnly stepped={!selection.staticView}
 ask={{kind:'arenaBattleItem',id:11,no:item.number,label:'Question '+item.number}} assistant="Zero"/>
 </main>;
} createRoot(document.getElementById('react-view')).render(<MemoryRouter><Fixture/></MemoryRouter>);
`;
let bundle;
async function compile() {
  if (bundle) return bundle;
  const stubs = {
    '~/contexts': 'export const useAppContext=select=>select({requestHelpers:{}});export const useNotiContext=select=>select({actions:{}});',
    '~/helpers': 'export const buildTodayStatsPatchFromDailyTaskStatus=x=>x;',
    '~/helpers/hooks/useUserActivity': 'export default ()=>{};',
    '~/helpers/websiteAgentScreenState': 'export const useAgentScreenState=()=>{};',
    '~/constants/sockets/api': 'export const socket={emit(){},on(){},off(){}};',
    '~/components/Buttons/AskAgentButton': 'import React from "react";export default ({context,label})=><button onClick={()=>window.asked=context}>{label||"Ask Zero"}</button>;',
    './EssayAnswer': 'export default ()=>null;', './SpokenAnswer': 'export default ()=>null;', './MarkReview': 'export default ()=>null;'
  };
  const result = await build({ stdin:{contents:fixture,resolveDir:repo,loader:'tsx'},bundle:true,write:false,format:'iife',platform:'browser',alias:{'~':path.join(repo,'src')},define:{'import.meta.env':'{}','process.env.NODE_ENV':'"development"'},
    plugins:[{name:'scene-services',setup(builder){
      // Optional negative control: run these assertions against the original
      // renderer. It must fail because no authored scene reaches the screen.
      if (process.env.ARENA_SCENES_BASELINE_STEP) builder.onLoad({filter:/\/StepExplanation\.tsx$/},()=>({contents:readFileSync(process.env.ARENA_SCENES_BASELINE_STEP,'utf8'),loader:'tsx',resolveDir:path.join(repo,'src/containers/Arena')}));
      builder.onResolve({filter:/.*/},({path})=>stubs[path]?{path,namespace:'fixture'}:undefined);
      builder.onLoad({filter:/.*/,namespace:'fixture'},({path})=>({contents:stubs[path],loader:'jsx',resolveDir:repo}));
    }}] });
  return bundle=result.outputFiles[0].text;
}
for (const [name,engine] of Object.entries({chromium,webkit})) {
  test(`ordered authored scenes render and keep Ask/next/revisit/parent behavior (${name})`,{timeout:120000},async()=>{
    const browser=await engine.launch();
    try {
      for (const width of [320,1280]) {
        const page=await browser.newPage({viewport:{width,height:900},reducedMotion:width===1280?'reduce':'no-preference'});
        const errors=[];page.on('pageerror',e=>errors.push(e.message));
        await page.route('**/*',route=>route.request().url()==='http://localhost:3000/'
          ?route.fulfill({contentType:'text/html',body:`<style>${readFileSync(path.join(repo,'src/styles.css'),'utf8')}</style><div id="react-view"></div>`}) :route.abort());
        await page.goto('http://localhost:3000/');await page.addScriptTag({content:await compile()});
        await page.waitForFunction(()=>typeof window.show==='function');
        for (const item of items) {
          await page.evaluate(n=>window.show(n),item.number);
          const steps=page.locator('[data-arena-steps] li');
          await page.waitForFunction(()=>document.querySelectorAll('[data-arena-steps] li').length===1);
          assert.equal(await page.locator('[data-step-scene]').count(),1,'future scenes stay hidden');
          await page.getByRole('button',{name:/Next step/}).click();
          assert.equal(await steps.count(),2);
          await page.getByRole('button',{name:'Ask about step 2'}).click();
          assert.deepEqual(await page.evaluate(()=>({no:window.asked.no,step:window.asked.step,lang:window.asked.reviewLang})),{no:item.number,step:2,lang:'ko'});
          if(width===1280) assert.equal(await steps.nth(1).evaluate(e=>getComputedStyle(e).animationName),'none');
          await page.getByRole('button',{name:'Show all'}).click();
          assert.equal(await steps.count(),item.review.steps.length);
          assert.equal(await page.locator('[data-step-scene]').count(),item.review.steps.filter(s=>s.scene).length);
          assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),'no horizontal overflow');
          assert.ok(await page.locator('svg[role="img"]').count()>=item.review.steps.filter(s=>s.scene?.kind==='diagram').length,'actual geometry rendered');
          if(artifacts){mkdirSync(artifacts,{recursive:true});await page.screenshot({path:path.join(artifacts,`${name}-${width}-q${item.number}.png`),fullPage:true});}
          await page.evaluate(()=>window.revisit());
          assert.equal(await steps.count(),item.review.steps.length,'show-all preference survives revisit');
        }
        const first=items[0];
        await page.evaluate(n=>window.show(n,true),first.number);
        await page.waitForFunction(n=>document.querySelectorAll('[data-arena-steps] li').length===n,first.review.steps.length);
        await page.evaluate(n=>window.show(n,false,true),first.number);
        assert.equal(await page.getByRole('button',{name:'Step through again'}).count(),0,'parent copy is fully expanded without stepping controls');
        assert.deepEqual(errors,[]);
        await page.close();
      }
    } finally { await browser.close(); }
  });
}
