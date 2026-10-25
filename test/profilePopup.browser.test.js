import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || '/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const artifacts = process.env.PROFILE_POPUP_ARTIFACTS;
const photoA = 'http://localhost:3000/cover-a.svg';
const photoB = 'http://localhost:3000/cover-b.svg';
const base = {id:2,username:'PlatinumMember',profileTheme:'platinum',profileFirstRow:'A member’s cover should follow their current profile.',twinkleXP:102471854,level:4,rank:3,xpThisMonth:12811265,userType:'moderator',unlockedAchievementIds:[],chessMaxLevelUnlocked:11,loaded:true,friendStatus:{eligible:true,state:'friends'}};
const full = {...base,profileCoverUrl:photoA,profileCoverPosition:'23,71',profileCoverShine:0};
const compact = {id:2,username:base.username,profileTheme:'platinum'};
const noPhoto = {...full,profileCoverUrl:null,profileCoverPosition:null};
const cases = [
  {name:'cold-compact-profile',user:compact,response:full,photo:photoA,fetches:1,screenshot:true},
  {name:'warm-cache-compact-profile',user:compact,cache:full,response:full,photo:photoA,fetches:0},
  {name:'full-prop-control',user:full,cache:full,response:full,photo:photoA,fetches:0},
  {name:'minimal-id-and-name',user:{id:2,username:base.username},response:full,photo:photoA,fetches:1},
  {name:'fresh-cover-overrides-old-prop',user:full,cache:{...full,profileCoverUrl:photoB},photo:photoB,fetches:0},
  {name:'new-platinum-overrides-old-gold',user:{...full,profileTheme:'gold'},cache:full,photo:photoA,fetches:0},
  {name:'new-gold-overrides-old-platinum',user:full,cache:{...full,profileTheme:'gold'},photo:null,fetches:0,platinum:false},
  {name:'removed-cover-overrides-old-prop',user:full,cache:noPhoto,photo:null,fetches:0},
  {name:'fetched-settings-win',user:full,cache:{...full,profileCoverPosition:'81,91',profileCoverShine:1},photo:photoA,fetches:0,position:'81% 91%',sheen:true},
  {name:'unloaded-cache-fetches-cover',user:compact,cache:{...base,loaded:false},cacheFresh:false,response:full,photo:photoA,fetches:1},
  {name:'achievement-direct-popup',direct:true,user:compact,cache:full,photo:photoA,fetches:0},
  {name:'zero-focal-point',user:full,cache:{...full,profileCoverPosition:'0,0'},photo:photoA,fetches:0,position:'0% 0%',screenshot:true},
  {name:'platinum-without-photo',user:base,cache:noPhoto,response:noPhoto,photo:null,fetches:0},
  {name:'non-platinum-with-stored-photo',user:full,cache:{...full,profileTheme:'gold'},photo:null,fetches:0,platinum:false},
  {name:'legacy-api-clear-with-omitted-fields',user:full,cache:full,cacheFresh:false,response:base,photo:null,fetches:1},
  {name:'default-theme-is-known',user:compact,response:{...base,profileTheme:null},photo:null,fetches:1,platinum:false}
];

let bundle;
async function compileFixture() {
  if(bundle) return bundle;
  const stubs = {
    '~/contexts': `import React,{createContext,useContext} from 'react';const Context=createContext(null);export const FixtureProvider=Context.Provider;
      export const useAppContext=fn=>fn(useContext(Context));
      export const useKeyContext=fn=>fn({myState:{userId:1,username:'viewer',profilePicUrl:''}});
      export const useChatContext=fn=>fn({state:{chatStatus:{}},actions:{onUpdateSelectedChannelId:()=>{},onOpenNewChatTab:()=>{}}});`,
    '../AppContext':'export const initialMyState={userId:1};',
    '~/helpers':`export const isMobile=()=>window.innerWidth<768;export const getSectionFromPathname=()=>({section:'home'});export const returnImageFileFromUrl=()=>{throw Error('No upload in fixture');};`,
    '~/helpers/hooks':'export const useOutsideClick=()=>{};',
    '~/helpers/hooks/useScrollAnchorRestoration':'export const saveScrollAnchorForElement=()=>{};',
    '~/helpers/stringHelpers':`export const addCommasToNumber=n=>Number(n).toLocaleString();`,
    '~/components/ErrorBoundary':`import React from 'react';export default ({children,style})=><div style={style}>{children}</div>;`,
    '~/components/ProfilePic':`import React from 'react';export default ({style})=><div style={{aspectRatio:'1',background:'#ffdd40',borderRadius:'50%',...style}}/>;`,
    '~/components/Texts/UserTitle':`import React from 'react';export default ({style,className})=><span style={style} className={className}>moderator (lv 4)</span>;`,
    '~/components/Texts/RichText':`import React from 'react';export default ({children,style})=><div style={style}>{children}</div>;`,
    '~/components/AchievementItem':`export {default} from '${path.join(repo,'src/components/AchievementItem/Small/index.tsx')}';`,
    '~/components/Texts/FullTextRevealFromOuterLayer':'export default ()=>null;',
    '~/components/ChessLevelBadge':'export default ()=>null;',
    '~/components/Loading':`import React from 'react';export default ()=><span data-loading>Loading</span>;`,
    '~/components/Modals/UsernameHistoryModal':'export default ()=>null;',
    '~/components/Button':`import React from 'react';export default ({children,onClick})=><button onClick={onClick}>{children}</button>;`
  };
  const result = await build({
    stdin:{contents:readFileSync(path.join(repo,'test/fixtures/profilePopup.tsx'),'utf8'),resolveDir:repo,loader:'tsx'},
    bundle:true,write:false,format:'iife',platform:'browser',alias:{'~':path.join(repo,'src')},
    define:{'import.meta.env':'{}','process.env.NODE_ENV':'"development"'},
    loader:{'.png':'dataurl','.webp':'dataurl','.jpg':'dataurl','.svg':'dataurl'},
    plugins:[{name:'profile-fixture-services',setup(builder){
      builder.onResolve({filter:/.*/},({path:specifier})=>stubs[specifier]?{path:specifier,namespace:'fixture'}:undefined);
      builder.onLoad({filter:/.*/,namespace:'fixture'},({path:specifier})=>({contents:stubs[specifier],loader:'jsx',resolveDir:repo}));
    }}]
  });
  bundle=result.outputFiles[0].text;
  return bundle;
}

async function setCase(page, entry) {
  await page.mouse.move(1,890);
  await page.evaluate(entry=>window.setCase(entry),entry);
  await page.locator('[data-case-label]').filter({hasText:entry.name}).waitFor();
}

async function openPopup(page,width) {
  const trigger=page.locator('[data-trigger]').getByText(base.username,{exact:true});
  if(width<768) await trigger.click(); else await trigger.hover();
  await page.locator('[data-portal="user-popup"] a').first().waitFor();
}

async function closePopup(page,width) {
  if(width<768) await page.locator('[data-trigger]').getByText(base.username,{exact:true}).click();
  else await page.mouse.move(1,890);
  await page.locator('[data-portal="user-popup"]').waitFor({state:'detached'});
}

async function appearance(page) {
  return page.evaluate(()=>{
    const popup=document.querySelector('[data-portal="user-popup"]');
    const photo=popup.querySelector('[class*="pt-layer-photo"]');
    return {
      photo:photo?getComputedStyle(photo).backgroundImage:null,
      position:photo?getComputedStyle(photo).backgroundPosition:null,
      platinum:!!popup.querySelector('[data-platinum-surface]'),
      sheen:!!popup.querySelector('[class*="pt-layer-sheen"]'),
      fetches:window.profileFetches,
      badges:popup.querySelectorAll('img[alt="Badge"]').length
    };
  });
}

for(const [engine,browserType] of Object.entries({chromium,webkit})) {
  test(`Platinum hover cards use canonical covers, refresh and survive failures (${engine})`,{timeout:120000},async()=>{
    const script=await compileFixture();
    const browser=await browserType.launch();
    const observations=[];
    try {
      for(const width of [1280,360]) {
        const page=await browser.newPage({viewport:{width,height:900}});
        const errors=[];
        page.on('pageerror',error=>errors.push(error.message));
        page.setDefaultTimeout(7000);
        await page.route('**/*',route=>{
          const url=route.request().url();
          if(url===photoA || url===photoB) return route.fulfill({contentType:'image/svg+xml',body:`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="300"><rect width="900" height="300" fill="${url===photoA?'#147d93':'#b94cad'}"/><circle cx="100" cy="100" r="80" fill="#ffdc64"/><path d="M300 300L600 20L900 300" fill="#74d8bb"/></svg>`});
          if(url==='http://localhost:3000/') return route.fulfill({contentType:'text/html',body:`<!doctype html><html><head><style>${readFileSync(path.join(repo,'src/styles.css'),'utf8')}main{padding:24px}h1{font-size:24px}p{font-size:16px}</style></head><body><div id="root"></div><div id="outer-layer"></div></body></html>`});
          return route.abort();
        });
        await page.goto('http://localhost:3000/');
        await page.addScriptTag({content:script});
        await page.waitForFunction(()=>typeof window.setCase==='function');
        for(const entry of cases) {
          await setCase(page,entry);
          if(!entry.direct) await openPopup(page,width);
          else await page.locator('[data-portal="user-popup"] a').first().waitFor();
          if(entry.fetches) await page.waitForFunction(()=>window.auditUserState.userObj[2]?.profileAppearanceLoadedAt>0);
          const observed=await appearance(page);
          assert.equal(!!observed.photo,!!entry.photo,`${width}/${entry.name}`);
          if(entry.photo) assert.ok(observed.photo.includes(entry.photo),`${width}/${entry.name}: photo URL`);
          assert.equal(observed.fetches,entry.fetches,`${width}/${entry.name}: fetch count`);
          if(entry.position) assert.equal(observed.position,entry.position);
          if(entry.platinum!==undefined) assert.equal(observed.platinum,entry.platinum);
          if(entry.sheen!==undefined) assert.equal(observed.sheen,entry.sheen);
          assert.equal(observed.badges,5);
          assert.equal(await page.locator('[data-portal="user-popup"]').getByText('Profile',{exact:true}).count(),1);
          assert.equal(await page.locator('[data-portal="user-popup"]').getByText('Cards',{exact:true}).count(),1);
          observations.push({width,case:entry.name,...observed});
          if(entry.screenshot && artifacts) {
            mkdirSync(artifacts,{recursive:true});
            await page.screenshot({path:path.join(artifacts,`${engine}-${width}-${entry.name}.png`)});
          }
        }

        // Time advances without remounting: freshness must be checked on the
        // next interaction, not captured forever in a memo from the last render.
        await setCase(page,{name:'bounded-refresh',user:compact,cache:full,response:noPhoto});
        await openPopup(page,width);
        assert.equal((await appearance(page)).fetches,0);
        await closePopup(page,width);
        await page.evaluate(()=>window.advanceProfileClock(61000));
        await openPopup(page,width);
        await page.waitForFunction(()=>window.auditUserState.userObj[2].profileCoverUrl===null);
        assert.equal((await appearance(page)).photo,null);
        assert.equal((await appearance(page)).fetches,1);
        await closePopup(page,width);
        await openPopup(page,width);
        assert.equal((await appearance(page)).fetches,1,'known no-photo stays cached');

        // An existing card reacts to canonical writes while it stays open.
        await page.evaluate(url=>window.patchCache({profileCoverUrl:url,profileCoverPosition:'0,100',profileCoverShine:1}),photoB);
        await page.locator('[class*="pt-layer-photo"]').waitFor();
        assert.ok((await appearance(page)).photo.includes(photoB));
        assert.equal((await appearance(page)).position,'0% 100%');

        // Read started before a removal; a slow completion cannot restore it.
        await setCase(page,{name:'late-response-after-removal',user:full,cache:full,cacheFresh:false,response:full,defer:true,viewerId:2});
        await openPopup(page,width);
        await page.waitForFunction(()=>typeof window.finishProfileRequest==='function');
        await page.evaluate(()=>window.patchCache({profileCoverUrl:null,profileCoverPosition:null}));
        await page.evaluate(()=>window.finishProfileRequest());
        await page.waitForFunction(()=>window.auditUserState.userObj[2].loaded===true);
        await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        assert.equal((await appearance(page)).photo,null);
        assert.equal(await page.evaluate(()=>window.auditUserState.myState.profileCoverUrl),null,'owner session state also keeps the removal');

        await setCase(page,{name:'failed-request-retries',user:compact,response:full,fail:true});
        await openPopup(page,width);
        assert.equal((await appearance(page)).photo,null);
        assert.equal(await page.locator('[data-loading]').count(),0);
        await closePopup(page,width);
        await openPopup(page,width);
        await page.locator('[class*="pt-layer-photo"]').waitFor();
        assert.equal((await appearance(page)).fetches,2);

        // Shine changes only once the canonical mutation reply succeeds.
        await setCase(page,{name:'shine-save-is-canonical',user:full,cache:full,response:full});
        await openPopup(page,width);
        await page.evaluate(()=>{window.coverSavePromise=window.saveCoverSettings({shine:true});});
        assert.equal(await page.evaluate(()=>window.auditUserState.userObj[2].profileCoverShine),0);
        await page.evaluate(url=>window.finishCoverSave({userId:2,profileCoverUrl:url,profileCoverPosition:'23,71',profileCoverShine:true}),photoA);
        assert.equal(await page.evaluate(()=>window.coverSavePromise),true);
        assert.equal((await appearance(page)).sheen,true);
        await page.evaluate(()=>{window.coverSavePromise=window.saveCoverSettings({shine:false});});
        await page.evaluate(()=>window.failCoverSave(Error('Synthetic save failure')));
        assert.equal(await page.evaluate(()=>window.coverSavePromise),false);
        assert.equal((await appearance(page)).sheen,true,'failed saves preserve server state');
        assert.deepEqual(errors,[]);
        await page.close();
      }
      if(artifacts) writeFileSync(path.join(artifacts,`${engine}-results.json`),JSON.stringify(observations,null,2)+'\n');
    } finally {await browser.close();}
  });
}
