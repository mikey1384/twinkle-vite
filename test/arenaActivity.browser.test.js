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
const artifacts = process.env.ARENA_ACTIVITY_ARTIFACTS;
const art = process.env.ARENA_ACTIVITY_BOSS_ART;
const fixture = `
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter,useLocation,useNavigate,useSearchParams} from 'react-router-dom';
import {library} from '@fortawesome/fontawesome-svg-core';
import {faTrophy,faArrowLeft} from '@fortawesome/pro-solid-svg-icons';
import {FixtureProvider} from '~/contexts';
import ActivityBadge from './src/components/ProfilePic/ActivityBadge';
import Battles from './src/containers/Arena/Battles';
library.add(faTrophy,faArrowLeft);
const exam=(key,name)=>({key,code:'C3-3',codeLabel:null,name,nameEn:name,language:'en',difficulties:['easy','normal','hard'].map(difficulty=>({difficulty,ready:true,slain:false})),lengths:[{length:'short',items:20,minutes:30},{length:'full',items:50,minutes:90}]});
const exams=[exam('c1-advanced','C1 Advanced'),exam('ielts-academic','IELTS Academic')];
window.starts=[];window.prepares=[];window.signins=0;window.avatarClicks=0;
const requests={loadArenaState:async()=>({exams,recent:[],paidBattlesToday:0,paidBattlesPerDay:5}),
 prepareArenaBattle:async args=>{window.prepares.push(args);return {preview:{token:'confirmed-preview',xp:1000,coins:100,target:40,max:50}};},
 startArenaBattle:async args=>{window.starts.push(args);return {battle:{id:77,status:'open'}};}};
function Route(){
 const [params,setParams]=useSearchParams();const location=useLocation();const navigate=useNavigate();
 const [viewer,setViewer]=useState(1);window.setViewer=setViewer;
 const [activity,setActivity]=useState({kind:'arena',id:'c1-advanced',title:'C1 Advanced',thumbnailUrl:null});window.setActivity=setActivity;
 window.fixtureLocation=location;window.openExam=key=>navigate('/arena?mode=arena&exam='+encodeURIComponent(key));
 return <FixtureProvider value={{viewer,requestHelpers:requests,user:{actions:{onOpenSigninModal:()=>window.signins++}},actions:{}}}>
  <header><div data-avatar onClick={()=>window.avatarClicks++} style={{position:'relative',width:60,height:60,background:'#bdc8d8',borderRadius:'50%',marginLeft:'auto'}}><ActivityBadge activity={activity}/></div></header>
  {location.pathname==='/arena'&&<main><Battles examKey={params.get('exam')||''} onBrowseExams={()=>setParams({mode:'arena'})} onStart={id=>{window.started=id;}} onOpenRecords={()=>{}}/></main>}
 </FixtureProvider>;
}createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={['/chat/general']}><Route/></MemoryRouter>);
`;
let bundle;
async function compileFixture() {
  if (bundle) return bundle;
  const stubs = {
    '~/contexts': `import React,{createContext,useContext} from 'react';const Context=createContext(null);export const FixtureProvider=Context.Provider;export const useAppContext=select=>select(useContext(Context));export const useKeyContext=select=>select({myState:{userId:useContext(Context).viewer}});export const useChatContext=select=>select({actions:{}});export const useHomeContext=select=>select({actions:{}});`,
    '~/components/Buttons/AskAgentButton': 'export default ()=>null;',
    './League': 'export default ()=>null;',
    './Rising': 'export default ()=>null;',
    './Records': 'export default ()=>null;',
    './RewardOffer': 'export default ()=>null;',
    './AIStory/Game/ArenaGoals': 'export const TodayArenaGoals=()=>null;'
  };
  const result = await build({stdin:{contents:fixture,resolveDir:repo,loader:'tsx'},bundle:true,write:false,format:'iife',platform:'browser',alias:{'~':path.join(repo,'src')},define:{'import.meta.env':'{"VITE_CLOUDFRONT_KEY":"fixture"}','process.env.NODE_ENV':'"development"'},plugins:[{name:'arena-activity-services',setup(builder){builder.onResolve({filter:/.*/},({path})=>stubs[path]?{path,namespace:'fixture'}:undefined);builder.onLoad({filter:/.*/,namespace:'fixture'},({path})=>({contents:stubs[path],loader:'jsx',resolveDir:repo}));}}]});
  bundle=result.outputFiles[0].text;
  return bundle;
}

for (const [engine, browserType] of Object.entries({ chromium, webkit })) {
  test(`Arena activity shows the boss and opens exam choices without starting (${engine})`, { timeout: 60000 }, async () => {
    const script = await compileFixture();
    const browser = await browserType.launch();
    try {
      for (const width of [1280, 360]) {
        const page = await browser.newPage({ viewport: { width, height: 850 }, hasTouch: width === 360 });
        page.setDefaultTimeout(7000);
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        let failArt = false;
        await page.route('**/*', route => {
          const url = route.request().url();
          if (url.includes('/arena/img/bosses/')) {
            if (failArt) return route.abort();
            return route.fulfill(art
              ? { contentType: 'image/jpeg', body: readFileSync(art) }
              : { contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="140"><rect width="100" height="140" fill="#467c77"/><circle cx="50" cy="45" r="30" fill="#ffe0ba"/></svg>' });
          }
          if (url === 'http://localhost:3000/') return route.fulfill({ contentType: 'text/html', body: `<style>${readFileSync(path.join(repo,'src/styles.css'),'utf8')}header{padding:30px}main{padding:20px}body{background:#fff}</style><div id="root"></div><div id="outer-layer"></div>` });
          return route.abort();
        });
        await page.goto('http://localhost:3000/');
        await page.addScriptTag({ content: script });
        let badge = page.getByRole('button', { name: 'Taking C1 Advanced', exact: true });
        await badge.waitFor();
        if (width === 1280) await badge.hover(); else await badge.tap();
        let popup = page.getByRole('dialog', { name: 'Taking C1 Advanced' });
        await popup.waitFor();
        assert.match(await popup.locator('img').getAttribute('src'), /\/arena\/img\/bosses\/c1-advanced\.jpg$/);
        await popup.locator('img').evaluate(image => image.decode());
        const bounds = await popup.boundingBox();
        assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width);
        if (artifacts) { mkdirSync(artifacts,{recursive:true}); await page.screenshot({path:path.join(artifacts,`${engine}-${width}-card.png`)}); }
        await popup.getByRole('button',{name:'View exam',exact:true}).click();
        await page.waitForFunction(()=>window.fixtureLocation.search==='?mode=arena&exam=c1-advanced');
        assert.deepEqual(await page.evaluate(()=>Object.fromEntries(new URLSearchParams(window.fixtureLocation.search))), {mode:'arena',exam:'c1-advanced'});
        await page.getByText('C1 Advanced',{exact:true}).waitFor();
        assert.equal(await page.getByText('IELTS Academic',{exact:true}).count(),0);
        assert.deepEqual(await page.evaluate(()=>window.starts),[]);
        assert.deepEqual(await page.evaluate(()=>window.prepares),[]);
        assert.equal(await page.evaluate(()=>window.avatarClicks),0);
        if (artifacts) await page.screenshot({path:path.join(artifacts,`${engine}-${width}-exam.png`)});
        await page.getByRole('radio',{name:'Hard',exact:true}).click();
        await page.getByRole('button',{name:/Full exam/}).click();
        const cover=page.getByRole('dialog',{name:'Exam cover'});await cover.waitFor();
        const start=cover.getByRole('button',{name:'Start',exact:true});await start.waitFor();
        await page.waitForFunction(()=>window.prepares.length===1);
        assert.deepEqual(await page.evaluate(()=>window.starts),[],'Reading the cover must not start the exam');
        await start.click();await page.waitForFunction(()=>window.started===77);
        assert.deepEqual(await page.evaluate(()=>window.starts),[{examKey:'c1-advanced',length:'full',difficulty:'hard',previewToken:'confirmed-preview'}]);
        await page.getByRole('button',{name:/Full exam/}).click();await cover.waitFor();
        await page.evaluate(()=>window.openExam('ielts-academic'));
        await cover.waitFor({state:'detached'});await page.getByText('IELTS Academic',{exact:true}).waitFor();
        assert.equal(await page.getByText('C1 Advanced',{exact:true}).count(),0);
        await page.getByRole('button',{name:'All exams',exact:true}).click();
        await page.getByText('C1 Advanced',{exact:true}).waitFor();
        await page.getByText('IELTS Academic',{exact:true}).waitFor();
        await page.evaluate(()=>window.openExam('unknown-exam'));
        await page.getByText('This exam is not available. Choose All exams to find another.').waitFor();
        assert.equal(await page.evaluate(()=>window.starts.length),1);
        failArt=true;
        await page.evaluate(()=>window.setActivity({kind:'arena',id:'sat-rw',title:'International English Language Testing System Academic Examination',thumbnailUrl:null}));
        badge=page.getByRole('button',{name:/Taking International English/});await badge.click();
        popup=page.getByRole('dialog',{name:/Taking International English/});await popup.locator('[data-icon="trophy"]').waitFor();
        const longBounds=await popup.boundingBox();assert.ok(longBounds.x>=0&&longBounds.x+longBounds.width<=width&&longBounds.y+longBounds.height<=850);
        failArt=false;
        await page.evaluate(()=>window.setActivity({kind:'arena',id:'c1-advanced',title:'C1 Advanced',thumbnailUrl:null}));
        popup=page.getByRole('dialog',{name:'Taking C1 Advanced'});await popup.locator('img').waitFor();
        await popup.locator('img').evaluate(image=>image.decode());
        await page.evaluate(()=>window.setViewer(0));
        await popup.getByRole('button',{name:'View exam',exact:true}).click();
        await page.waitForFunction(()=>window.fixtureLocation.search==='?mode=arena&exam=c1-advanced');
        assert.equal(await page.evaluate(()=>window.signins),1);
        assert.equal(await page.evaluate(()=>window.fixtureLocation.search),'?mode=arena&exam=c1-advanced');
        assert.equal(await page.evaluate(()=>window.starts.length),1,'Guest action must not start a sitting');
        assert.deepEqual(errors,[]);
        await page.close();
      }
    } finally { await browser.close(); }
  });
}
