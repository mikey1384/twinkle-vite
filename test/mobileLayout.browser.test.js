import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const { chromium, webkit } = require(
  process.env.PLAYWRIGHT_MODULE || '/Users/mikey/.npm-packages/lib/node_modules/playwright'
);
const repo = fileURLToPath(new URL('..', import.meta.url));
const artifacts = process.env.MOBILE_LAYOUT_ARTIFACTS;
const auditOnly = process.env.MOBILE_LAYOUT_AUDIT_ONLY === '1';
const widths = [320, 360, 390, 768, 1280];
const axes = ['building', 'adapting', 'thinking', 'connecting', 'self_awareness'];
let bundle;

// Real popup, friend controls, SVG chart, notification item/message and username.
// Only account services and unrelated subcomponents are replaced. No live writes.
const fixture = `
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faUser, faCardsBlank, faComment, faUserPlus, faUserCheck, faClock, faGear } from '@fortawesome/pro-solid-svg-icons';
import UserPopup from './src/components/UserPopup';
import ReflectionStatShape from './src/components/ReflectionStatShape';
import NotiItem from './src/components/Notification/MainFeeds/NotiItem';
library.add(faUser, faCardsBlank, faComment, faUserPlus, faUserCheck, faClock, faGear);
const initial = {view:'popup', state:'none', username:'programmer', title:'Twinkle Newspaper', summary:'replied to the Twinkle Newspaper: “Rrr”', x:12, y:120};
function RouteProbe() {window.fixtureLocation = useLocation(); return null;}
function Fixture() {
 const [config, setConfig] = useState(initial);
 const [patch, setPatch] = useState({});
 const [shown, setShown] = useState(true);
 window.setCase = value => {setPatch({}); setShown(true); setConfig({...initial, ...value});};
 const user = {id:2, username:config.username, realName:config.realName || '', profileTheme:'logoBlue', level:5, loaded:true, unlockedAchievementIds:[], friendStatus:{eligible:true,state:config.state}, ...patch};
 window.fixtureContext = {
  user:{state:{userObj:{2:user}},actions:{onSetUserState:({newState}) => setPatch(previous => ({...previous,...newState}))}},
  requestHelpers:{
   loadFriendStatus:async () => user.friendStatus,
   addFriend:async () => {window.friendWrites++; if(config.friendError) throw Error(config.friendError); return {eligible:true,state:config.state==='incoming'?'friends':'requested'};},
   removeFriend:async () => {window.friendWrites++; return {eligible:true,state:'none'};},
   loadDMChannel:async () => ({channelId:3,pathId:'fixture-chat'}),
   loadProfile:async () => user,
   reportError:error => {throw Error(JSON.stringify(error));}
  }
 };
 window.friendWrites ||= 0;
 return <MemoryRouter><RouteProbe/><main>
  {config.view==='popup' && shown && <UserPopup key={config.state+config.username} myId={1} user={user}
   popupContext={{x:config.x,y:config.y,width:60,height:20}} onHide={() => setShown(false)}
   onMouseEnter={() => {}} onMouseLeave={() => {}} onSetPopupContext={() => setShown(false)}/>}
  {config.view==='chart' && <section data-surface="chart" style={{padding:16,background:'#fffdf8',overflow:'hidden',fontFamily:config.font || 'inherit'}}>
   <ReflectionStatShape shape={['building','adapting','thinking','connecting','self_awareness'].map((axis,i)=>({axis,layer:0,fill:0.15+i*0.1}))}
    grownAxis={config.grownAxis || null} animate={config.animate}
    previous={config.animate ? ['building','adapting','thinking','connecting','self_awareness'].map(axis=>({axis,layer:0,fill:0.05})) : null}
    onAnimationEnd={()=>{window.chartAnimationDone=true;}}/>
  </section>}
  {config.view==='notification' && <section data-surface="notification" style={{fontSize:'1.5rem'}}>
   <NotiItem linkColor="logoBlue" userId={1} notification={{id:27, user, timeStamp:'1700000000',
    actionObj:{contentType:'buildApp',buildId:3543,eventKey:'reply',eventSummary:config.summary,target:{id:'thread-1'},payload:{replyId:3}},
    targetObj:{id:3543,content:config.title}}}/>
  </section>}
 </main></MemoryRouter>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);
`;

async function compileFixture() {
  if (bundle) return bundle;
  const stubs = {
    '~/contexts': `export const useAppContext = fn => fn(window.fixtureContext);
      export const useKeyContext = fn => fn({myState:{userId:1,username:'turtle',profilePicUrl:''}});
      export const useChatContext = fn => fn({state:{chatStatus:{}},actions:{onUpdateSelectedChannelId:()=>{},onOpenNewChatTab:()=>{}}});`,
    '~/helpers': `export const isMobile=()=>window.innerWidth<768; export const getSectionFromPathname=()=>({section:'home'});`,
    '~/helpers/hooks': 'export const useOutsideClick=()=>{};',
    '~/helpers/hooks/useScrollAnchorRestoration': 'export const saveScrollAnchorForElement=()=>{};',
    '~/helpers/hooks/useContributionInviteStatusUpdater': 'export const useContributionInviteStatusUpdater=()=>()=>{};',
    '~/helpers/stringHelpers': `export const addCommasToNumber=n=>Number(n).toLocaleString(); export const stringIsEmpty=s=>!s?.trim(); export const truncateText=({text,limit})=>String(text||'').slice(0,limit);`,
    '~/helpers/analytics': 'export const trackEvent=()=>{};',
    '~/components/ErrorBoundary': `import React from 'react'; export default ({children,style})=><div style={style}>{children}</div>;`,
    '~/components/ProfilePic': `import React from 'react'; export default ({style})=><div style={{aspectRatio:'1',background:'#ddd',borderRadius:'50%',...style}}/>;`,
    '~/components/Texts/UserTitle': `import React from 'react'; export default ({style,className})=><span style={style} className={className}>Explorer</span>;`,
    '~/components/Texts/RichText': `import React from 'react'; export default ({children,style})=><div style={style}>{children}</div>;`,
    '~/components/AchievementBadges': 'export default ()=>null;',
    '~/components/ChessLevelBadge': 'export default ()=>null;',
    '~/components/RankBadge': 'export default ()=>null;',
    '~/components/Loading': 'export default ()=>null;',
    '~/components/Modals/UsernameHistoryModal': 'export default ()=>null;',
    '~/components/Button': `import React from 'react'; export default ({children,onClick})=><button onClick={onClick}>{children}</button>;`,
    '~/components/ContentLink': 'export default ()=>null;',
    './BuildAppNotificationSettingsModal': `import React from 'react'; export default ({isOpen,onClose})=>isOpen?<div role="dialog"><button onClick={onClose}>Close settings</button></div>:null;`
  };
  const result = await build({
    stdin: {contents:fixture,resolveDir:repo,loader:'tsx'}, bundle:true, write:false,
    format:'iife', platform:'browser', alias:{'~':path.join(repo,'src')},
    define:{'import.meta.env':'{}','process.env.NODE_ENV':'"development"'},
    plugins:[{name:'mobile-layout-services',setup(builder){
      builder.onResolve({filter:/.*/},({path})=>stubs[path]?{path,namespace:'fixture'}:undefined);
      builder.onLoad({filter:/.*/,namespace:'fixture'},({path})=>({contents:stubs[path],loader:'jsx',resolveDir:repo}));
    }}]
  });
  bundle = result.outputFiles[0].text;
  return bundle;
}

async function setCase(page, config) {
  await page.evaluate(config => window.setCase(config), config);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

// Check the actual text fragments, not just their containing divs: a no-wrap
// span can paint outside a perfectly sized grid cell or an SVG viewport.
async function textOutside(page, rootSelector, boundarySelector) {
  return page.locator(rootSelector).evaluateAll((roots, boundarySelector) => {
    const result = [];
    for (const root of roots) {
      const boundary = boundarySelector ? root.closest(boundarySelector) : root;
      if (!boundary) throw Error('Missing layout boundary');
      const box = boundary.getBoundingClientRect();
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!node.textContent.trim() || node.parentElement.closest('style,script')) continue;
        const range = document.createRange(); range.selectNodeContents(node);
        for (const rect of range.getClientRects()) {
          if (!rect.width || !rect.height) continue;
          if (rect.left < box.left-1 || rect.right > box.right+1 || rect.top < box.top-1 || rect.bottom > box.bottom+1) {
            result.push({text:node.textContent.trim(),left:rect.left,right:rect.right,boundaryLeft:box.left,boundaryRight:box.right});
          }
        }
      }
    }
    return result;
  }, boundarySelector);
}

for (const [engine, browserType] of Object.entries({chromium, webkit})) {
  test(`popup, chart and app notifications fit phone widths and preserve actions (${engine})`, {timeout:120000}, async () => {
    const script = await compileFixture();
    const browser = await browserType.launch();
    const findings = [];
    try {
      const page = await browser.newPage({viewport:{width:390,height:844}});
      page.setDefaultTimeout(5000);
      const errors=[]; page.on('pageerror',error=>errors.push(error.message));
      await page.route('http://localhost:3000/**', route => route.fulfill({contentType:'text/html',body:`<!doctype html><html><head><style>${readFileSync(path.join(repo,'src/styles.css'),'utf8')}main{padding:16px;max-width:700px;margin:0 auto}</style></head><body><div id="root"></div><div id="outer-layer"></div></body></html>`}));
      await page.goto('http://localhost:3000/');
      await page.addScriptTag({content:script});
      await page.waitForFunction(()=>typeof window.setCase==='function');
      for (const width of widths) {
        await page.setViewportSize({width,height:844});
        for (const state of ['none','incoming','requested','friends']) {
          await setCase(page,{view:'popup',state,username:'WWWWWWWWWWWWWWWWWWWW',realName:'김하늘',x:12});
          const actionText = await textOutside(page,'[data-portal="user-popup"] a, [data-portal="user-popup"] [role="button"]');
          if(actionText.length) findings.push({surface:'popup-action',width,state,overflow:actionText});
          // The portal wrapper has zero width; use the actual white popup card below.
          const cardOverflow = await page.locator('[data-portal="user-popup"] a').first().evaluate(anchor=>{
            const card=anchor.closest('[style*="max-width"]'); if(!card) return false;
            return card.scrollWidth > card.clientWidth+1;
          });
          if(cardOverflow) findings.push({surface:'popup-card',width,state});
          if (artifacts && width===360 && state==='incoming') {
            mkdirSync(artifacts,{recursive:true}); await page.screenshot({path:path.join(artifacts,`${engine}-popup-360.png`)});
          }
        }
        for (const grownAxis of axes) {
          await setCase(page,{view:'chart',grownAxis});
          const chartText=await textOutside(page,'[data-surface="chart"] svg');
          if(chartText.length) findings.push({surface:'chart',width,grownAxis,overflow:chartText});
        }
        if(artifacts && width===360) await page.screenshot({path:path.join(artifacts,`${engine}-chart-360.png`)});
        await setCase(page,{view:'notification',username:'WWWWWWWWWWWWWWWWWWWW',summary:'replied to the Twinkle Newspaper: “'+ 'ExtraLongUnbrokenMemberMessage'.repeat(4)+'”'});
        const notificationText=await textOutside(page,'[data-surface="notification"] nav');
        if(notificationText.length) findings.push({surface:'notification',width,overflow:notificationText});
        if(artifacts && width===360) await page.screenshot({path:path.join(artifacts,`${engine}-notification-360.png`)});
      }
      await page.setViewportSize({width:360,height:844});
      await setCase(page,{view:'popup',state:'incoming',username:'WWWWWWWWWWWWWWWWWWWW',x:260});
      const rightPopup=await page.locator('[data-portal="user-popup"] a').first().evaluate(anchor=>{
        const card=anchor.closest('[style*="max-width"]');
        const box=card.getBoundingClientRect();
        return {left:box.left,right:box.right,viewport:innerWidth};
      });
      assert.ok(rightPopup.left>=0 && rightPopup.right<=rightPopup.viewport,'right-anchored popup stays on screen');
      await setCase(page,{view:'chart',grownAxis:'self_awareness',font:'Georgia, serif',animate:true});
      const growthShape=page.locator('[data-surface="chart"] polygon:not([fill="none"])').first();
      const startShape=await growthShape.getAttribute('points');
      await page.waitForFunction(()=>window.chartAnimationDone===true);
      assert.notEqual(await growthShape.getAttribute('points'),startShape,'stat growth still animates');
      assert.deepEqual(await textOutside(page,'[data-surface="chart"] svg'),[]);
      await setCase(page,{view:'popup',state:'incoming'});
      await page.getByRole('button',{name:'Accept friend request',exact:true}).click();
      await page.getByRole('button',{name:'Friends',exact:true}).waitFor();
      await page.getByRole('button',{name:'Friends',exact:true}).click();
      await page.getByRole('button',{name:'Unfriend',exact:true}).waitFor();
      assert.equal(await page.evaluate(()=>window.friendWrites),1,'opening undo must not change server state');
      assert.deepEqual(await textOutside(page,'[data-portal="user-popup"] [role="button"]'),[]);
      await setCase(page,{view:'popup',state:'requested'});
      await page.getByRole('button',{name:'Requested',exact:true}).press('Enter');
      await page.getByRole('button',{name:'Cancel request',exact:true}).waitFor();
      assert.deepEqual(await textOutside(page,'[data-portal="user-popup"] [role="button"]'),[]);
      assert.equal(await page.evaluate(()=>window.friendWrites),1,'opening cancel must not change server state');
      await setCase(page,{view:'popup',friendError:'You can have up to 30 friends. Remove someone first, then try again.'});
      await page.getByRole('button',{name:'Add friend',exact:true}).click();
      await page.getByText('You can have up to 30 friends.',{exact:false}).waitFor();
      const noteOverflow=await textOutside(page,'[data-portal="user-popup"] [role="button"]');
      if(noteOverflow.length) findings.push({surface:'popup-error',width:360,overflow:noteOverflow});
      await setCase(page,{view:'popup'});
      await page.getByRole('link',{name:'Cards',exact:true}).click();
      await page.waitForFunction(()=>window.fixtureLocation.pathname==='/ai-cards/');
      assert.equal(await page.evaluate(()=>window.fixtureLocation.pathname),'/ai-cards/');
      assert.match(await page.evaluate(()=>window.fixtureLocation.search),/owner.*programmer/);
      for (const [title, summary, expected] of [
        ['Go','got a new badge','got a new badge in Go'],
        ['AI: Friends','posted in AI: Friends: “Hello”','posted in AI: Friends: “Hello”'],
        ['Twinkle Newspaper','programmer replied to the Twinkle Newspaper: “Rrr”','replied to the Twinkle Newspaper: “Rrr”'],
        ['Go','replied: “I love Go”','replied: “I love Go” in Go']
      ]) {
        await setCase(page,{view:'notification',title,summary});
        const rendered=await page.locator('[data-surface="notification"] nav').innerText();
        assert.ok(rendered.includes(expected),rendered);
        if (title !== 'Go') assert.equal(rendered.split(title).length-1,1,'only the redundant app attribution is removed');
      }
      await setCase(page,{view:'notification'});
      await page.getByRole('button',{name:'Notification settings',exact:true}).click();
      await page.getByRole('dialog').waitFor();
      assert.equal(await page.evaluate(()=>window.fixtureLocation.pathname),'/ai-cards/','settings must not launch the app');
      await page.getByRole('button',{name:'Close settings'}).click();
      await page.locator('[data-surface="notification"] nav').click();
      await page.waitForFunction(()=>window.fixtureLocation.pathname==='/app/3543');
      assert.equal(await page.evaluate(()=>window.fixtureLocation.pathname),'/app/3543');
      assert.deepEqual(await page.evaluate(()=>window.fixtureLocation.state.buildLaunchTarget.payload),{replyId:3});
      assert.deepEqual(errors,[]);
      if(artifacts){mkdirSync(artifacts,{recursive:true});writeFileSync(path.join(artifacts,`${engine}-findings.json`),JSON.stringify(findings,null,2));}
      if(!auditOnly) assert.deepEqual(findings,[],'rendered labels must remain inside their controls and cards');
    } finally {await browser.close();}
  });
}
