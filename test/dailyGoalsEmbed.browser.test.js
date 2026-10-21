import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const { chromium, webkit } = require(
  process.env.PLAYWRIGHT_MODULE || '/Users/mikey/.npm-packages/lib/node_modules/playwright'
);
const repo = fileURLToPath(new URL('..', import.meta.url));
const artifacts = process.env.DAILY_GOALS_ARTIFACTS;
let bundle;

// Actual routing/guard, embed, reward preview/chips, card thumbnail, username
// and member popup. Only services and unrelated content types are fixtures.
const fixture = `
import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter, useLocation} from 'react-router-dom';
import {FixtureContentContext} from '~/contexts';
import {library} from '@fortawesome/fontawesome-svg-core';
import {faBolt,faCoins,faBan,faUser,faCardsBlank,faComment,faUserPlus} from '@fortawesome/pro-solid-svg-icons';
import InternalComponent from './src/components/Texts/RichText/Markdown/EmbeddedComponent/InternalComponent';
library.add(faBolt,faCoins,faBan,faUser,faCardsBlank,faComment,faUserPlus);
function Probe(){window.fixtureLocation=useLocation();return null;}
function Fixture(){
 const [config,setConfig]=useState({});
 const [loaded,setLoaded]=useState(null);
 window.setCase=value=>{setLoaded(null);setConfig({...value,sequence:(window.sequence=(window.sequence||0)+1)});window.parentClicks=0;window.parentKeys=0;window.contentRequests=0;};
 const user={id:2,username:config.username||'FixtureMember',profileTheme:'logoBlue',loaded:true,level:5,twinkleXP:1000,unlockedAchievementIds:[],friendStatus:{eligible:true,state:'none'}};
 const card={id:9,word:'cherry',level:2,quality:'superior',isBurned:0,imagePath:'/fixture-card.png'};
 const content={id:42,contentId:42,contentType:'xpChange',target:'dailyBonus',loaded:true,word:'cherry',card,uploader:user,xpEarned:50000,coinEarned:50000,
  bonusQuestion:{question:'Which meaning matches cherry?',choices:['A fruit','A place','A feeling','A tool']},dailyTaskReward:{finalMultiplier:config.multiplier||50},...config.content};
 window.fixtureContent=loaded||{...content,loaded:!config.remote};
 window.fixtureUserId=config.signedOut?0:1;
 window.fixtureApp={user:{state:{userObj:{2:user}},actions:{onSetUserState:()=>{}}},requestHelpers:{
  loadContent:async()=>{window.contentRequests=(window.contentRequests||0)+1;return content;},
  loadProfile:async()=>user,loadFriendStatus:async()=>user.friendStatus,loadAICard:async()=>({card})
 }};
 window.initContent=data=>setLoaded({...data,loaded:true});
 return <FixtureContentContext.Provider value={window.fixtureContent}><MemoryRouter key={config.sequence}><Probe/><main onClick={()=>window.parentClicks++} onKeyDown={()=>window.parentKeys++}>
  <InternalComponent src="/daily-rewards/42" isProfileComponent={config.profile} isPreview={config.preview}/>
 </main></MemoryRouter></FixtureContentContext.Provider>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);
`;

async function compile() {
  if (bundle) return bundle;
  const empty = 'export default ()=>null;';
  const stubs = {
    '~/contexts': `import {createContext} from 'react';
      export const FixtureContentContext=createContext({});
      export const useAppContext=fn=>fn(window.fixtureApp);
      export const useKeyContext=fn=>fn({myState:{userId:window.fixtureUserId,username:'viewer',profileTheme:'logoBlue'}});
      export const useContentContext=fn=>fn({actions:{onInitContent:window.initContent}});
      export const useChatContext=fn=>fn({state:{cardObj:{},chatStatus:{}},actions:{onUpdateAICard:()=>{},onUpdateSelectedChannelId:()=>{},onOpenNewChatTab:()=>{}}});`,
    '~/helpers': `export const isMobile=()=>window.innerWidth<768; export const getSectionFromPathname=()=>({section:'home'});`,
    '~/helpers/hooks': `import {useContext} from 'react'; import {FixtureContentContext} from '~/contexts';
      export const useContentState=()=>useContext(FixtureContentContext); export const useOutsideClick=()=>{};`,
    '~/helpers/hooks/useScrollAnchorRestoration': 'export const saveScrollAnchorForElement=()=>{};',
    '~/helpers/hooks/useContributionInviteStatusUpdater': 'export const useContributionInviteStatusUpdater=()=>()=>{};',
    '~/helpers/analytics': 'export const trackEvent=()=>{};',
    '~/components/ErrorBoundary': `import React from 'react'; export default ({children,style})=><div style={style}>{children}</div>;`,
    '~/components/ProfilePic': `import React from 'react'; export default ({style})=><div style={{aspectRatio:'1',background:'#ddd',...style}}/>;`,
    '~/components/Texts/UserTitle': empty,
    '~/components/Texts/RichText': empty,
    '~/components/AchievementBadges': empty,
    '~/components/ChessLevelBadge': empty,
    '~/components/RankBadge': empty,
    '~/components/Loading': `import React from 'react'; export default ()=> <span>Loading fixture</span>;`,
    '~/components/Modals/UsernameHistoryModal': empty,
    '~/components/Button': `import React from 'react'; export default ({children,onClick})=><button onClick={onClick}>{children}</button>;`,
    '~/components/Build/Cards': 'export const BuildMiniCard=()=>null; export const BuildStatusCard=()=>null; export const BuildWideCard=()=>null;',
    '~/components/Build/Cards/BuildStatusCard': 'export const BUILD_STATUS_CARD_HEIGHT=50;',
    '~/components/XPVideoPlayer': empty,
    '~/components/ContentListItem': empty,
    '~/components/Modals/BuildForkHistoryModal': empty,
    '~/components/Comments/CompactCommentEmbedPreview': empty,
    '~/components/Subjects/CompactSubjectEmbedPreview': empty,
    '~/components/Subjects/WideSubjectEmbedPreview': empty,
    '~/components/ContentListItem/VideoThumbnail': empty,
    '~/components/VideoThumb': empty,
    './MissionComponent': empty,
    './UserComponent': empty,
    './AICardComponent': empty,
    './SharedPromptComponent': empty,
    './AchievementUnlockComponent': empty,
    './AchievementComponent': empty
  };
  const result = await build({
    stdin:{contents:fixture,resolveDir:repo,loader:'tsx'},bundle:true,write:false,
    format:'iife',platform:'browser',alias:{'~':path.join(repo,'src'),'react-sanitized-html':path.join(repo,'src/shims/react-sanitized-html.tsx')},
    define:{'import.meta.env':'{}','process.env.NODE_ENV':'"development"'},
    plugins:[{name:'daily-goals-fixture-services',setup(builder){
      builder.onResolve({filter:/.*/},({path})=>stubs[path]?{path,namespace:'fixture'}:undefined);
      builder.onLoad({filter:/.*/,namespace:'fixture'},({path})=>({contents:stubs[path],loader:'jsx',resolveDir:repo}));
    }}]
  });
  bundle=result.outputFiles[0].text;
  return bundle;
}

async function setCase(page, value={}) {
  await page.evaluate(value=>window.setCase(value),value);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}

for (const [engine,browserType] of Object.entries({chromium,webkit})) {
  test(`daily bonus guard, native navigation and member popup (${engine})`,{timeout:90000},async()=>{
    const script=await compile();
    const browser=await browserType.launch();
    try {
      const context=await browser.newContext({viewport:{width:360,height:844},serviceWorkers:'block'});
      await context.route('**/*',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html><head><style>${readFileSync(path.join(repo,'src/styles.css'),'utf8')}main{padding:16px;max-width:600px;margin:auto}</style></head><body><div id="root"></div><div id="outer-layer"></div></body></html>`}));
      const page=await context.newPage();page.setDefaultTimeout(5000);
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto('http://localhost:3000/fixture');
      await page.addScriptTag({content:script});
      await page.waitForFunction(()=>typeof window.setCase==='function');
      const link=page.getByRole('link',{name:'Open daily goals bonus',exact:true});
      for(const content of [{target:'video'},{target:'aiStory'},{target:undefined},{notFound:true},{word:null,card:null}]) {
        await setCase(page,{content});
        assert.equal(await link.count(),0,'invalid or non-bonus records must not render reward cards');
        assert.equal(await page.getByText('Invalid Content',{exact:true}).count(),1);
      }
      await setCase(page,{profile:true});
      assert.equal(await link.count(),0);
      assert.equal(await page.locator('a[href="/daily-rewards/42"]').count(),1);
      assert.equal(await page.evaluate(()=>window.contentRequests),0);
      await setCase(page,{remote:true});await link.waitFor();
      assert.equal(await page.evaluate(()=>window.contentRequests),1);
      assert.equal(await link.getAttribute('href'),'/daily-rewards/42');
      await setCase(page,{signedOut:true});
      assert.equal(await link.getAttribute('href'),'/daily-rewards/42');
      for(const width of [360,390,1280]) {
        await page.setViewportSize({width,height:844});
        for(const multiplier of [1,2,5,10,25,50]) {
          await setCase(page,{multiplier,preview:true,username:'WWWWWWWWWWWWWWWWWWWW'});
          assert.equal(await page.getByLabel('Daily goals reward multiplier x'+multiplier,{exact:true}).count(),1);
          const box=await link.evaluate(el=>el.closest('[class]').parentElement.getBoundingClientRect().toJSON());
          assert.ok(box.left>=0&&box.right<=width);
          assert.equal(await page.locator('.home-feed-card__choice-list span').count(),4);
        }
        if(artifacts){mkdirSync(artifacts,{recursive:true});await page.screenshot({path:path.join(artifacts,engine+'-'+width+'.png')});}
      }
      await page.setViewportSize({width:390,height:844});
      for(const selector of ['.home-feed-card__daily-goals-card','.home-feed-card__choice-list','.home-feed-card__reward-chips']) {
        await setCase(page);
        const box=await page.locator(selector).boundingBox();
        await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
        await page.waitForFunction(()=>window.fixtureLocation.pathname==='/daily-rewards/42');
        assert.equal(await page.evaluate(()=>window.parentClicks),0);
      }
      for(const key of ['Enter',' ']) {
        await setCase(page);
        await link.press(key);
        await page.waitForFunction(()=>window.fixtureLocation.pathname==='/daily-rewards/42');
        assert.equal(await page.evaluate(()=>window.fixtureLocation.pathname),'/daily-rewards/42');
        assert.equal(await page.evaluate(()=>window.parentKeys),0);
      }
      // Headless WebKit navigates even a plain anchor in the current tab for
      // a middle click. Verify that gesture in Chromium, and Cmd-click in both.
      const newTabClicks=[{modifiers:['ControlOrMeta']}];
      if(engine==='chromium') newTabClicks.push({button:'middle'});
      for(const click of newTabClicks) {
        await setCase(page);
        const before=await page.evaluate(()=>window.fixtureLocation.pathname);
        // Modifier/middle clicks open background tabs without an opener, so
        // observe the browser context rather than only this page's popups.
        const opened=context.waitForEvent('page');
        await link.click(click);
        const tab=await opened;
        // This headless WebKit opens a background page but never requests its
        // URL, including for a plain native anchor. Chromium covers the actual
        // new-tab destination; both engines must preserve the original page.
        if(engine==='chromium') {
          await tab.waitForURL('**/daily-rewards/42',{waitUntil:'domcontentloaded',timeout:5000});
          assert.equal(new URL(tab.url()).pathname,'/daily-rewards/42');
        }
        assert.equal(await page.evaluate(()=>window.fixtureLocation.pathname),before);
        assert.equal(await page.evaluate(()=>window.parentClicks),0);
        await tab.close();
      }
      await setCase(page);
      const before=await page.evaluate(()=>window.fixtureLocation.pathname);
      await page.getByText('FixtureMember',{exact:true}).click();
      await page.getByRole('link',{name:'Profile',exact:true}).waitFor();
      assert.equal(await page.getByRole('button',{name:'Add friend',exact:true}).count(),1);
      assert.equal(await page.evaluate(()=>window.fixtureLocation.pathname),before);
      await page.getByRole('link',{name:'Profile',exact:true}).press('Enter');
      await page.waitForFunction(()=>window.fixtureLocation.pathname==='/users/FixtureMember');
      assert.equal(await page.evaluate(()=>window.fixtureLocation.pathname),'/users/FixtureMember');
      assert.equal(await page.evaluate(()=>window.parentClicks),0);
      assert.deepEqual(errors,[]);
    } finally {await browser.close();}
  });
}
