import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const {
  chromium,
  webkit
} = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const artifacts = process.env.PICTURE_DAY_ARTIFACTS;
const contexts = `
import {useSyncExternalStore} from 'react';
const listeners=new Set();
window.fixtureUser=1;
const state={user:{state:{userId:1}},requestHelpers:{
 generateDailyPicture:args=>window.generate(args),loadDailyPicture:id=>window.loadPicture(id)
}};
function useSelected(select){return useSyncExternalStore(fn=>{listeners.add(fn);return()=>listeners.delete(fn)},()=>select(state));}
export const useAppContext=useSelected;
export const useKeyContext=select=>useSelected(v=>select({myState:{userId:v.user.state.userId,profileTheme:'logoBlue'}}));
window.switchUser=id=>{window.fixtureUser=id;state.user.state.userId=id;listeners.forEach(fn=>fn());};
`;
const fixture = `
import React from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter,Routes,Route,useNavigate,useLocation} from 'react-router-dom';
import {library} from '@fortawesome/fontawesome-svg-core';
import {faPalette,faImage,faArrowRight,faTimes,faCheck,faRedo,faGift,faBolt,faPencilAlt,faChevronUp,faChevronDown,faSpinner} from '@fortawesome/pro-solid-svg-icons';
import {ToastProvider,useToast} from './src/contexts/Toast';
import DailyPictureNotifications from './src/containers/App/DailyPictureNotifications';
import PictureDayScreen from './src/components/Modals/DailyQuestionModal/DailyQuestionPanel/PictureDayScreen';
import {dailyPictureJobs} from './src/helpers/dailyPictureJobs';
library.add(faPalette,faImage,faArrowRight,faTimes,faCheck,faRedo,faGift,faBolt,faPencilAlt,faChevronUp,faChevronDown,faSpinner);
window.jobs=dailyPictureJobs;
const empty={prompt:'',style:'',chosenPath:'',freeAvailable:true,candidates:[]};
window.server=JSON.parse(localStorage.getItem('fixtureServer')||'null')||{questionId:42,userId:1,isToday:true,picture:empty};
window.reads=[];window.submits=[];
window.generate=args=>{
 localStorage.setItem('fixtureRequest',JSON.stringify({...args,userId:window.fixtureUser}));
 localStorage.setItem('fixturePosts',String(Number(localStorage.getItem('fixturePosts')||0)+1));
 return new Promise((resolve,reject)=>{window.resolve=resolve;window.reject=reject;});
};
window.loadPicture=async id=>{window.reads.push(id);if(window.readFailure)throw new Error('Fixture offline');return JSON.parse(localStorage.getItem('fixtureServer')||JSON.stringify(window.server));};
window.finish=({socket=true,http=true,isToday=true,other=false}={})=>{
 const args=JSON.parse(localStorage.getItem('fixtureRequest'));
 const candidate={path:'daily-reflection/'+(other?'other':'finished')+'.png',prompt:args.prompt,style:args.style,quality:args.quality,paidBy:'site',requestId:other?'another-request':args.requestId};
 window.server={userId:args.userId,questionId:args.questionId,requestId:candidate.requestId,isToday,path:candidate.path,picture:{...empty,prompt:args.prompt,style:args.style,freeAvailable:false,candidates:[candidate]}};
 localStorage.setItem('fixtureServer',JSON.stringify(window.server));
 if(socket)window.socketFire('daily_picture_ready',structuredClone(window.server));
 if(http)window.resolve?.(structuredClone(window.server));
};
window.fail=()=>{
 const args=JSON.parse(localStorage.getItem('fixtureRequest'));
 window.server={...window.server,picture:empty,generationFailure:{requestId:args.requestId,message:'Fixture image could not be made.'}};
 localStorage.setItem('fixtureServer',JSON.stringify(window.server));
 window.reject?.({status:502,message:'Fixture image could not be made.'});
};
window.setHidden=hidden=>{Object.defineProperty(document,'hidden',{configurable:true,value:hidden});document.dispatchEvent(new Event('visibilitychange'));};
function Page(){
 const navigate=useNavigate();const location=useLocation();window.where=location.pathname+location.search;
 const toast=useToast();window.message=message=>toast({message,duration:60000});
 return <><DailyPictureNotifications/><header>Daily Reflection</header><main><Routes>
  <Route path="/daily-reflection" element={<section><PictureDayScreen questionId={42} question="Picture Day: describe a picture you have in mind — or anything at all" initialPicture={window.server.picture} submitting={false} onDone={value=>window.submits.push(value)} onClose={()=>navigate('/browse')}/></section>}/>
  <Route path="*" element={<div><h1>Explore Twinkle</h1><button onClick={()=>navigate('/daily-reflection?mode=classic')}>Open Picture Day</button></div>}/>
 </Routes></main><nav>Home · Search · Chat · Daily Reflection</nav></>;
}
createRoot(document.getElementById('root')).render(<BrowserRouter><ToastProvider><Page/></ToastProvider></BrowserRouter>);
`;

let script;
async function compile() {
  if (script) return script;
  const stubs = {
    '~/contexts': contexts,
    '~/components/ErrorBoundary': 'export default ({children})=>children;',
    '~/components/AiImageEstimate': 'export default ()=>"Battery estimate";',
    '~/constants/sockets/api': `const listeners=new Map();export const socket={on:(name,fn)=>{if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(fn);},off:(name,fn)=>listeners.get(name)?.delete(fn)};window.socketFire=(name,value)=>listeners.get(name)?.forEach(fn=>fn(value));`
  };
  const bundle = await build({
    stdin: { contents: fixture, resolveDir: repo, loader: 'tsx' },
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    alias: { '~': path.join(repo, 'src') },
    define: {
      'import.meta.env': '{}',
      'process.env.NODE_ENV': '"development"'
    },
    plugins: [
      {
        name: 'local-picture-services',
        setup(builder) {
          builder.onResolve({ filter: /.*/ }, ({ path }) =>
            stubs[path] ? { path, namespace: 'fixture' } : undefined
          );
          builder.onLoad(
            { filter: /.*/, namespace: 'fixture' },
            ({ path }) => ({
              contents: stubs[path],
              loader: 'jsx',
              resolveDir: repo
            })
          );
        }
      }
    ]
  });
  script = bundle.outputFiles[0].text;
  return script;
}

const html = `<style>
*{box-sizing:border-box}html{font-size:10px;--px:1px;--mobile-nav-footprint:6.4rem}body{margin:0;font-family:Arial;background:#f6f1e8;color:#2f2a24}
header{padding:2rem;font-size:1.5rem;font-weight:bold}main{min-height:calc(100svh - 14rem);display:flex;align-items:center;justify-content:center;padding:2rem 1rem 9rem}section{width:100%;max-width:820px;background:#fffdf8;border:1px solid rgba(120,98,70,.18);border-radius:16px;padding:.4rem}nav{position:fixed;bottom:0;background:white;width:100%;height:6.4rem;padding:2rem;font-size:1.3rem}button{font-family:inherit}
</style><div id="root"></div>`;

for (const [name, engine] of Object.entries({ chromium, webkit })) {
  test(
    `Picture Day background completion and recovery (${name})`,
    { timeout: 90000 },
    async () => {
      const bundle = await compile();
      const browser = await engine.launch();
      try {
        async function open(width = 360) {
          const context = await browser.newContext({
            viewport: { width, height: 800 }
          });
          const page = await context.newPage();
          page.setDefaultTimeout(5000);
          const errors = [];
          page.on('pageerror', (error) => errors.push(error.message));
          await context.route('**/*', (route) => {
            const url = route.request().url();
            if (url.startsWith('http://localhost:3000/'))
              return route.fulfill({ contentType: 'text/html', body: html });
            if (
              url.includes('/daily-reflection/finished.png') ||
              url.includes('/daily-reflection/other.png')
            )
              return route.fulfill({
                contentType: 'image/jpeg',
                body: readFileSync(
                  path.join(
                    repo,
                    'public/img/daily-reflection/cover-picture-day.jpg'
                  )
                )
              });
            return route.abort();
          });
          await page.addInitScript({
            content: `window.addEventListener('DOMContentLoaded',()=>{${bundle}\n});`
          });
          await page.goto(
            'http://localhost:3000/daily-reflection?mode=classic'
          );
          await page.getByRole('textbox').waitFor();
          return { page, context, errors };
        }
        async function start(page) {
          await page
            .getByRole('textbox')
            .fill('A fox reading beneath a tall tree at sunset.');
          await page
            .getByRole('button', { name: 'Make my picture', exact: true })
            .evaluate((button) => {
              button.click();
              button.click();
            });
          await page
            .getByRole('heading', { name: 'Painting your picture' })
            .waitFor();
          assert.equal(
            await page.evaluate(() => localStorage.getItem('fixturePosts')),
            '1'
          );
        }

        for (const width of [360, 1280]) {
          const { page, context, errors } = await open(width);
          try {
            await start(page);
            assert.match(
              await page.locator('main').innerText(),
              /This can take a few minutes/
            );
            assert.ok(
              await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth
              )
            );
            assert.ok(
              await page.evaluate(() =>
                document.getAnimations().some((a) => a.playState === 'running')
              ),
              'waiting must visibly animate'
            );
            if (artifacts) {
              mkdirSync(artifacts, { recursive: true });
              await page.screenshot({
                path: path.join(artifacts, `${name}-${width}-painting.png`),
                fullPage: true
              });
            }
            await page
              .getByRole('button', { name: 'Continue browsing' })
              .click();
            await page
              .getByRole('heading', { name: 'Explore Twinkle' })
              .waitFor();
            await page
              .getByRole('button', { name: 'Open Picture Day' })
              .click();
            await page
              .getByRole('heading', { name: 'Painting your picture' })
              .waitFor();
            await page
              .getByRole('button', { name: 'Continue browsing' })
              .click();
            await page.evaluate(() => {
              window.setHidden(true);
              window.finish();
            });
            await page.waitForFunction(
              () => window.jobs.getSnapshot().jobs[0]?.status === 'ready'
            );
            assert.equal(
              await page
                .getByRole('complementary', { name: 'Your picture is ready' })
                .count(),
              0
            );
            await page.evaluate(() => window.setHidden(false));
            const banner = page.getByRole('complementary', {
              name: 'Your picture is ready'
            });
            await banner.waitFor();
            assert.equal(await banner.count(), 1);
            assert.ok(
              await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth
              )
            );
            if (artifacts)
              await page.screenshot({
                path: path.join(artifacts, `${name}-${width}-ready.png`),
                animations: 'disabled',
                fullPage: true
              });
            await page
              .getByRole('button', { name: 'View picture', exact: true })
              .focus();
            await page.keyboard.press('Enter');
            await page
              .getByRole('button', { name: 'Done', exact: true })
              .waitFor();
            assert.match(
              await page.evaluate(() => window.where),
              /mode=classic&picture=/
            );
            await page
              .getByRole('button', { name: 'Done', exact: true })
              .click();
            assert.equal(
              await page.evaluate(() => window.submits[0].picturePath),
              'daily-reflection/finished.png'
            );
            await page.evaluate(() =>
              window.socketFire('daily_picture_ready', window.server)
            );
            assert.equal(
              await banner.count(),
              0,
              'HTTP and repeated socket must not duplicate the banner'
            );
            assert.deepEqual(errors, []);
          } finally {
            await context.close();
          }
        }

        // Reload loses the POST response. Recovery reads the exact saved request
        // without a second generation, even when another image arrives first.
        {
          const { page, context, errors } = await open();
          try {
            await start(page);
            await page.reload();
            await page
              .getByRole('heading', { name: 'Checking on your picture' })
              .waitFor();
            await page.evaluate(() => {
              window.finish({ other: true, socket: false, http: false });
              window.dispatchEvent(new Event('online'));
            });
            await page.waitForFunction(() => window.reads.length >= 2);
            assert.equal(
              await page.getByRole('button', { name: 'View picture' }).count(),
              0
            );
            await page.evaluate(() => {
              window.finish({ isToday: false, socket: false, http: false });
              window.dispatchEvent(new Event('online'));
            });
            await page.getByRole('button', { name: 'View picture' }).click();
            assert.match(
              await page.evaluate(() => window.where),
              /mode=pictures&picture=/
            );
            assert.equal(
              await page.evaluate(() => localStorage.getItem('fixturePosts')),
              '1'
            );
            assert.ok(
              (await page.evaluate(() => window.reads)).every((id) => id === 42)
            );
            assert.deepEqual(errors, []);
          } finally {
            await context.close();
          }
        }

        // A banner can stay open over the site day boundary. Its action checks
        // the destination when clicked, and a lost connection leaves it usable.
        {
          const { page, context, errors } = await open();
          try {
            await start(page);
            await page.evaluate(() => window.finish());
            await page.getByRole('button', { name: 'View picture' }).waitFor();
            await page.evaluate(() => {
              window.readFailure = true;
            });
            await page.getByRole('button', { name: 'View picture' }).click();
            await page
              .getByRole('alert')
              .filter({ hasText: 'Couldn’t open it' })
              .waitFor();
            assert.equal(
              await page
                .getByRole('button', { name: 'View picture' })
                .isEnabled(),
              true
            );
            await page.evaluate(() => {
              window.readFailure = false;
              const result = JSON.parse(localStorage.getItem('fixtureServer'));
              localStorage.setItem(
                'fixtureServer',
                JSON.stringify({ ...result, isToday: false })
              );
            });
            await page.getByRole('button', { name: 'View picture' }).click();
            await page.waitForFunction(() =>
              window.where.includes('mode=pictures&picture=')
            );
            assert.equal(
              await page.evaluate(() => localStorage.getItem('fixturePosts')),
              '1'
            );
            assert.deepEqual(errors, []);
          } finally {
            await context.close();
          }
        }

        // Showing a queued notification must not replace the member's chosen
        // picture with the latest generated one.
        {
          const { page, context, errors } = await open();
          try {
            await start(page);
            await page.evaluate(() => {
              window.message('Earlier notification');
              window.finish({ socket: false, http: false });
              window.server.picture.candidates.unshift({
                ...window.server.picture.candidates[0],
                path: 'daily-reflection/other.png',
                prompt: 'An earlier picture',
                requestId: 'older-request'
              });
              window.resolve(window.server);
            });
            const earlier = page.getByRole('button', {
              name: 'An earlier picture',
              exact: true
            });
            await earlier.click();
            await page
              .getByRole('status')
              .filter({ hasText: 'Earlier notification' })
              .click();
            await page.getByRole('button', { name: 'View picture' }).waitFor();
            assert.equal(await earlier.getAttribute('aria-pressed'), 'true');
            await page
              .getByRole('button', { name: 'Done', exact: true })
              .click();
            assert.equal(
              await page.evaluate(() => window.submits[0].picturePath),
              'daily-reflection/other.png'
            );
            assert.deepEqual(errors, []);
          } finally {
            await context.close();
          }
        }

        // A queued result is not acknowledged before it is actually shown. A
        // reload while another banner is ahead of it must recover that result.
        {
          const { page, context, errors } = await open();
          try {
            await start(page);
            await page.evaluate(() => window.message('Earlier notification'));
            await page
              .getByRole('button', { name: 'Continue browsing' })
              .click();
            await page.evaluate(() => window.finish());
            await page.waitForFunction(
              () => window.jobs.getSnapshot().jobs[0]?.status === 'ready'
            );
            assert.equal(
              await page.getByRole('button', { name: 'View picture' }).count(),
              0
            );
            assert.equal(
              await page.evaluate(
                () =>
                  JSON.parse(localStorage.getItem('daily-picture-jobs:1')).jobs
                    .length
              ),
              1
            );
            await page.reload();
            await page.getByRole('button', { name: 'View picture' }).waitFor();
            assert.equal(
              await page.evaluate(() => localStorage.getItem('fixturePosts')),
              '1'
            );
            await page.evaluate(() => window.switchUser(2));
            await page.waitForFunction(
              () => window.jobs.getSnapshot().userId === 2
            );
            assert.equal(
              await page.getByRole('button', { name: 'View picture' }).count(),
              0
            );
            assert.deepEqual(errors, []);
          } finally {
            await context.close();
          }
        }

        // Unknown transport outcomes stay recoverable, including after the
        // normal wait window. A manual status check never submits another image.
        {
          const { page, context, errors } = await open();
          try {
            await start(page);
            await page.evaluate(() =>
              window.reject({
                status: 500,
                isTransportError: true,
                message: 'Fixture disconnected'
              })
            );
            await page
              .getByRole('heading', { name: 'Checking on your picture' })
              .waitFor();
            await page.evaluate(() => {
              const saved = JSON.parse(
                localStorage.getItem('daily-picture-jobs:1')
              );
              saved.jobs[0].startedAt -= 11 * 60 * 1000;
              localStorage.setItem(
                'daily-picture-jobs:1',
                JSON.stringify(saved)
              );
            });
            await page.reload();
            await page
              .getByRole('button', { name: 'Check again', exact: true })
              .waitFor();
            assert.equal(
              await page
                .getByRole('button', { name: 'Make my picture' })
                .count(),
              0
            );
            await page.evaluate(() =>
              window.finish({ socket: false, http: false })
            );
            await page
              .getByRole('button', { name: 'Check again', exact: true })
              .click();
            await page.getByRole('button', { name: 'View picture' }).waitFor();
            assert.equal(
              await page.evaluate(() => localStorage.getItem('fixturePosts')),
              '1'
            );
            assert.deepEqual(errors, []);
          } finally {
            await context.close();
          }
        }

        // A request that never reached the server must not trap the editor.
        // Returning after the extended wait is not itself a billable retry.
        {
          const { page, context, errors } = await open();
          try {
            await start(page);
            await page.evaluate(() => {
              const saved = JSON.parse(
                localStorage.getItem('daily-picture-jobs:1')
              );
              saved.jobs[0].startedAt -= 11 * 60 * 1000;
              localStorage.setItem(
                'daily-picture-jobs:1',
                JSON.stringify(saved)
              );
            });
            await page.reload();
            await page
              .getByRole('button', { name: 'Return to editor', exact: true })
              .click();
            await page.getByRole('textbox').fill('A different idea');
            await page.evaluate(() =>
              window.dispatchEvent(new Event('online'))
            );
            await page.waitForFunction(() => window.reads.length >= 2);
            assert.equal(
              await page.getByRole('textbox').inputValue(),
              'A different idea'
            );
            assert.equal(
              await page.evaluate(() => localStorage.getItem('fixturePosts')),
              '1'
            );
            await page.reload();
            await page
              .getByRole('button', { name: 'Make my picture', exact: true })
              .click();
            await page
              .getByRole('heading', { name: 'Painting your picture' })
              .waitFor();
            assert.equal(
              await page.evaluate(() => localStorage.getItem('fixturePosts')),
              '2'
            );
            await page.evaluate(() => window.finish());
            await page.getByRole('button', { name: 'View picture' }).waitFor();
            assert.deepEqual(errors, []);
          } finally {
            await context.close();
          }
        }

        // A second tab that was already open learns about pending work through
        // storage, then recovers the result without needing the initiating tab.
        {
          const { page, context, errors } = await open();
          try {
            const second = await context.newPage();
            second.setDefaultTimeout(5000);
            await second.addInitScript({
              content: `window.addEventListener('DOMContentLoaded',()=>{${bundle}\n});`
            });
            await second.goto(
              'http://localhost:3000/daily-reflection?mode=classic'
            );
            await second.getByRole('textbox').waitFor();
            await start(page);
            await second
              .getByRole('heading', { name: 'Checking on your picture' })
              .waitFor();
            assert.equal(
              await second
                .getByRole('button', { name: 'Make my picture' })
                .count(),
              0
            );
            await page.evaluate(() => window.finish());
            await second
              .getByRole('button', { name: 'Done', exact: true })
              .waitFor();
            assert.equal(
              await second.evaluate(() => localStorage.getItem('fixturePosts')),
              '1'
            );
            assert.deepEqual(errors, []);
          } finally {
            await context.close();
          }
        }

        // A definite failure unlocks retry using canonical cost/picture state.
        {
          const { page, context, errors } = await open();
          try {
            await start(page);
            await page.evaluate(() => window.fail());
            await page
              .getByRole('button', { name: 'Make my picture', exact: true })
              .waitFor();
            assert.equal(
              await page
                .getByRole('button', { name: 'Make my picture', exact: true })
                .isEnabled(),
              true
            );
            assert.match(
              await page.locator('main').innerText(),
              /Fixture image could not be made/
            );
            assert.match(
              await page.locator('main').innerText(),
              /first picture is on Twinkle/
            );
            assert.equal(
              await page.evaluate(() => localStorage.getItem('fixturePosts')),
              '1'
            );
            assert.deepEqual(errors, []);
          } finally {
            await context.close();
          }
        }

        // The old account's late reply/event must not show private content.
        {
          const { page, context, errors } = await open();
          try {
            await start(page);
            await page
              .getByRole('button', { name: 'Continue browsing' })
              .click();
            await page.evaluate(() => window.switchUser(2));
            await page.waitForFunction(
              () => window.jobs.getSnapshot().userId === 2
            );
            await page.evaluate(() => window.finish());
            assert.equal(
              await page.getByRole('button', { name: 'View picture' }).count(),
              0
            );
            assert.equal(
              await page.evaluate(() => window.jobs.getSnapshot().jobs.length),
              0
            );
            assert.deepEqual(errors, []);
          } finally {
            await context.close();
          }
        }
      } finally {
        await browser.close();
      }
    }
  );
}
