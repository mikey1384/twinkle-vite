import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const { chromium, webkit } = require(
  process.env.PLAYWRIGHT_MODULE ||
    '/Users/mikey/.npm-packages/lib/node_modules/playwright'
);
const repo = fileURLToPath(new URL('..', import.meta.url));
const artifacts = process.env.BUILD_CHAT_LAYOUT_ARTIFACTS;
const baseline = process.env.BUILD_CHAT_LAYOUT_BASELINE === '1';
const fixture = `
import React, {useState, useRef} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import {library} from '@fortawesome/fontawesome-svg-core';
import {faBolt, faRobot, faLock, faUsers, faGlobe, faChevronDown, faChevronRight, faArrowLeft, faSliders, faSparkles, faCheck, faFlag, faTimes, faWrench, faHourglassHalf, faWandMagicSparkles, faInfoCircle, faUpload, faPaperPlane, faLayerGroup, faGear, faCompress, faExpand, faSpinner} from '@fortawesome/pro-solid-svg-icons';
import ChatPanel from './src/containers/Build/Editor/ChatPanel';
library.add(faBolt, faRobot, faLock, faUsers, faGlobe, faChevronDown, faChevronRight, faArrowLeft, faSliders, faSparkles, faCheck, faFlag, faTimes, faWrench, faHourglassHalf, faWandMagicSparkles, faInfoCircle, faUpload, faPaperPlane, faLayerGroup, faGear, faCompress, faExpand, faSpinner);
const noop = () => {};
const options = ['auto', 'light', 'medium', 'heavy'].map((mode,i) => ({model:['auto','gpt-6-luna','gpt-6.1-sol','claude-opus-5-5'][i], mode, label:mode, description:mode, defaultReasoningEffort:'medium', supportedReasoningEfforts:['medium'], typicalCallEnergyUnits:1000, handoffReserveEnergyUnits:1000}));
const policy = {energyPercent:57, energySegments:5, energySegmentsRemaining:2.85, energyUnitsRemaining:684000, dailyEnergyUnits:1200000};
const copilot = {limits:{maxProjectBytes:10000000,maxPublishedBuildStorageBytes:100000000,maxRuntimeFileStorageBytes:10000000,maxFilesPerProject:100,maxFileLines:2000,maxRuntimeFileBytes:1000000},usage:{currentProjectBytes:2000,projectBytesRemaining:9998000,publishedBuildStorageBytes:10000,publishedBuildStorageRemaining:99990000,publishedBuildCount:1,runtimeFileStorageBytes:1000,runtimeFileStorageRemaining:9999000,runtimeFileCount:2,projectFileCount:4}};
function makePlan(config) {
 return {buildId:42,mode:'large',status:config.proposal?'awaiting_confirmation':'running',summary:'Word Search adventure',createdByUserId:1,createdAt:500,updatedAt:900,currentBigChunkId:'m3',currentChunkId:'s3',plan:{version:1,mode:'large',kind:'roadmap',title:config.long?'The Super Ultimate Word Search Adventure With Daily Challenges And A Community Collection':'Word Search: Adventure',energyDays:6,chunks:Array.from({length:7},(_,i)=>({id:'m'+(i+1),kind:'big_chunk',title:['Find your first words','A new adventure map','Daily puzzles and rewards','More worlds to discover','A collection of words','A polished title screen','Play with friends'][i],playable:'A complete puzzle you can play',energyDays:0.75,status:config.proposal?'pending':i<2?'completed':i===2?'in_progress':'pending',completedAt:!config.proposal&&i<2?800+i:null,stall:i===2&&config.stalled?{at:900,reason:'unverified'}:null,chunks:[{id:'s'+(i+1),kind:'chunk',title:'Complete the puzzle, save progress and collect rewards without losing your place.',status:config.proposal?'pending':i<2?'completed':'in_progress',chunks:[]}]}))}};
}
function Fixture() {
 const [config,setConfig]=useState({width:320,height:490,stalled:false,long:false,owner:true,generating:false});
 const [draft,setDraft]=useState('Please keep the adventure map colorful.');
 const [refs,setRefs]=useState([]), [feedback,setFeedback]=useState([]);
 const [mode,setMode]=useState({model:'auto',mode:'auto',reasoningEffort:'medium'});
 const [visibility,setVisibility]=useState('private');
 const chatScrollRef=useRef(null), chatEndRef=useRef(null);
 window.setLayoutCase=patch=>setConfig(previous=>({...previous,...patch}));
 window.chatGeometry=()=>({height:chatScrollRef.current.clientHeight,top:chatScrollRef.current.scrollTop,scrollHeight:chatScrollRef.current.scrollHeight});
 window.scrollChat=top=>{chatScrollRef.current.scrollTop=top;};
 window.actions ||= [];
 window.fixtureContext={requestHelpers:{setLumineHeaderMinimized:async value=>({lumineHeaderMinimized:value}),prepareBuildChatAppReferences:async()=>({apps:[]})},user:{state:{myState:{lumineHeaderMinimized:false}},actions:{onSetLumineHeaderMinimized:noop}}};
 return <MemoryRouter><main style={{height:config.height,width:config.width,display:'grid',gridTemplateRows:'minmax(0,1fr)',border:'1px solid #e3e7ef',borderRadius:12,overflow:'hidden'}}>
 <ChatPanel buildId={42} isOwner={config.owner} runMode="user" generating={config.generating} generatingStatus={null} assistantStatusSteps={[]} runEvents={[]} pageFeedbackEvents={[]} runError={null} activeStreamMessageIds={[]}
 messages={Array.from({length:10},(_,i)=>({id:i+1,role:i%2?'assistant':'user',content:i%2?'I saved the daily puzzle and the adventure map. The next step is the reward screen.':'Please keep going with the next part.',createdAt:800+i,codeGenerated:null}))}
 executionPlan={makePlan(config)} copilotPolicy={copilot} aiUsagePolicy={policy}
 lumineModelSelectionControl={{value:mode,savedValue:mode,modelOptions:options,loading:false,error:'',onSave:value=>{window.actions.push(['mode',value]);setMode(value);}}}
 lumineChatVisibilityControl={{value:visibility,savedValue:visibility,loading:false,error:'',choiceRecorded:true,onSave:value=>{window.actions.push(['visibility',value]);setVisibility(value);}}}
 chatScrollRef={chatScrollRef} chatEndRef={chatEndRef} onChatScroll={noop} draftMessage={draft} onDraftMessageChange={setDraft}
 draftAppReferences={refs} onDraftAppReferencesChange={setRefs} draftCommentFeedback={feedback} onDraftCommentFeedbackChange={setFeedback}
 onSendMessage={async message=>{window.actions.push(['message',message]);return true;}} onContinueScopedPlan={noop} onCancelScopedPlan={noop} onRoadmapAction={async request=>{window.actions.push(['plan',request]);setConfig(previous=>({...previous,generating:true}));}}
 onAcceptFollowUpPrompt={noop} onDismissFollowUpPrompt={noop} onOpenBuildChatUpload={noop} uploadInFlight={false} runtimeUploadsModalShown={false} runtimeUploadAssets={[]} runtimeUploadsNextCursor={null} runtimeUploadsLoading={false} runtimeUploadsLoadingMore={false} runtimeUploadsError="" runtimeUploadDeletingId={null} onOpenRuntimeUploadsManager={()=>window.actions.push(['uploads'])} onCloseRuntimeUploadsManager={noop} onLoadMoreRuntimeUploads={noop} onDeleteRuntimeUpload={noop} onCreateGeneratedRuntimeAsset={noop} twinkleCoins={10000} purchasingGenerationReset={false} generationResetError="" onPurchaseGenerationReset={noop} onStopGeneration={noop} onFixRuntimeObservationMessage={noop} onDeleteMessage={noop}/>
 </main></MemoryRouter>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);
`;

let compiled;
async function bundle() {
  if (compiled) return compiled;
  // The layout owners, Header/Energy, plan, composer, Modal and controls are real.
  // Services, unopened auxiliary panels and message rendering have no live effects.
  const nullComponent = 'export default function Empty(){return null;}';
  const stubs = {
    '~/contexts': `export const useAppContext=fn=>fn(window.fixtureContext); export const useKeyContext=fn=>fn({myState:{userId:1}}); export const useViewContext=fn=>fn({state:{aiFeaturesDisabled:false,aiDisabledNotice:''}});`,
    '~/helpers': `export const isMobile=()=>false; export const isTablet=()=>false;`,
    '~/theme/hooks/useRoleColor': `export const useRoleColor=()=>({color:'blue',rgba:'#2563eb',getColor:()=> '#2563eb'});`,
    '~/components/ErrorBoundary': `export default function ErrorBoundary({children}){return children;}`,
    '~/components/LumineRescueEntry': nullComponent,
    '~/components/AiEnergyDashboardModal': nullComponent,
    '~/components/Modals/RechargeAiEnergyConfirmModal': nullComponent,
    './RuntimeUploadsModal': nullComponent,
    './BranchSendToOwnerStrip': nullComponent,
    '../BranchMainUpdateNotice': nullComponent,
    '../ThreeVendorUpgradeNotice': nullComponent,
    './AppReferencePicker': nullComponent,
    './Transcript': `import React from 'react';export default function Transcript({messages,chatEndRef,roadmapCard}){return <div>{messages.map(m=><p key={m.id} style={{padding:12,border:'1px solid #e3e7ef',borderRadius:12,background:m.role==='assistant'?'#f8fafc':'#eef6ff',lineHeight:1.5}}>{m.content}</p>)}{roadmapCard}<div ref={chatEndRef}/></div>;}`
  };
  const result = await build({
    stdin: { contents: fixture, resolveDir: repo, loader: 'tsx' },
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    jsx: 'transform',
    define: {
      'process.env.NODE_ENV': '"development"',
      'import.meta.env': '{}'
    },
    plugins: [
      {
        name: 'workspace-fixture',
        setup(builder) {
          if (baseline)
            builder.onLoad(
              {
                filter:
                  /ChatPanel\/(index\.tsx|Header\.tsx|Composer\.tsx|Roadmap\/index\.tsx|Roadmap\/RoadmapPanel\.tsx)$/
              },
              (args) => ({
                contents: execFileSync(
                  'git',
                  ['show', 'HEAD:' + path.relative(repo, args.path)],
                  { cwd: repo, encoding: 'utf8' }
                ),
                loader: 'tsx'
              })
            );
          builder.onResolve({ filter: /.*/ }, (args) => {
            if (args.path in stubs)
              return { path: args.path, namespace: 'fixture' };
            if (args.path.startsWith('~/'))
              return builder.resolve(
                path.join(repo, 'src', args.path.slice(2)),
                { resolveDir: repo, kind: args.kind }
              );
          });
          builder.onLoad({ filter: /.*/, namespace: 'fixture' }, (args) => ({
            contents: stubs[args.path],
            loader: 'jsx',
            resolveDir: repo
          }));
        }
      }
    ]
  });
  compiled = result.outputFiles[0].text;
  return compiled;
}

async function settle(page, config) {
  await page.evaluate((config) => window.setLayoutCase(config), config);
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      )
  );
}

for (const [engine, browserType] of Object.entries({ chromium, webkit })) {
  test(
    `Lumine gives chat and plan usable space and preserves actions (${engine})`,
    { timeout: 90000 },
    async () => {
      const script = await bundle();
      const browser = await browserType.launch({
        headless: true,
        timeout: 10000
      });
      const measurements = [];
      try {
        const page = await browser.newPage({
          viewport: { width: 1280, height: 800 }
        });
        page.setDefaultTimeout(5000);
        const errors = [];
        page.on('pageerror', (error) => {
          errors.push(error.message);
          process.stderr.write(error.stack + '\n');
        });
        await page.route('**/*', (route) =>
          route.request().url() === 'http://localhost:3000/'
            ? route.fulfill({
                contentType: 'text/html',
                body: '<!doctype html><html><head></head><body><div id="root"></div><div id="outer-layer"></div></body></html>'
              })
            : route.abort()
        );
        await page.goto('http://localhost:3000/');
        await page.addStyleTag({
          content:
            readFileSync(path.join(repo, 'src/styles.css'), 'utf8') +
            'body{margin:0;padding:12px;background:#f1f5f9;font-family:Arial}*{box-sizing:border-box}'
        });
        await page.addScriptTag({ content: script });
        if (baseline) {
          await page.getByRole('textbox', { name: 'Message Lumine' }).waitFor();
          const before = await page.evaluate(() => ({
            chat: window.chatGeometry(),
            scrollAreas: [...document.querySelectorAll('main *')]
              .filter(
                (el) =>
                  getComputedStyle(el).overflowY === 'auto' &&
                  el.scrollHeight > el.clientHeight
              )
              .map((el) => ({
                label: el.getAttribute('aria-label'),
                height: el.clientHeight,
                scrollHeight: el.scrollHeight
              }))
          }));
          assert.deepEqual(errors, []);
          mkdirSync(artifacts, { recursive: true });
          writeFileSync(
            path.join(artifacts, engine + '-before.json'),
            JSON.stringify(before, null, 2)
          );
          await page.locator('main').screenshot({
            path: path.join(artifacts, engine + '-before-320.png')
          });
          return;
        }
        await page.getByRole('button', { name: /Open build plan/ }).waitFor();
        for (const config of [
          { width: 320, height: 490, viewport: [1280, 800] },
          { width: 336, height: 600, viewport: [360, 780] },
          { width: 366, height: 400, viewport: [390, 540] },
          { width: 380, height: 330, viewport: [844, 390] },
          { width: 620, height: 720, viewport: [1440, 900] }
        ]) {
          await page.setViewportSize({
            width: config.viewport[0],
            height: config.viewport[1]
          });
          await settle(page, {
            ...config,
            stalled: false,
            long: true,
            generating: false
          });
          const geometry = await page.evaluate(() => window.chatGeometry());
          measurements.push({
            ...config,
            chatHeight: geometry.height,
            scrollTop: geometry.top,
            scrollHeight: geometry.scrollHeight
          });
          assert.ok(
            geometry.height >= (config.height <= 330 ? 85 : 160),
            `chat too short: ${JSON.stringify(measurements.at(-1))}`
          );
          assert.equal(
            await page
              .locator('main')
              .evaluate((el) => el.scrollWidth > el.clientWidth + 1),
            false,
            'no horizontal overflow'
          );
          const input = page.getByRole('textbox', { name: 'Message Lumine' });
          assert.equal(
            await input.inputValue(),
            'Please keep the adventure map colorful.'
          );
          const box = await input.boundingBox(),
            main = await page.locator('main').boundingBox();
          assert.ok(
            box.y + box.height <= main.y + main.height,
            'composer stays in the workspace'
          );
          await page.evaluate(() => window.scrollChat(35));
          const oldTop = (await page.evaluate(() => window.chatGeometry())).top;
          const open = page.getByRole('button', { name: /Open build plan/ });
          await open.click();
          const plan = page.getByRole('region', {
            name: 'Build plan workspace'
          });
          await plan.waitFor();
          const planScroll = plan.locator('section').first();
          assert.ok(
            (await planScroll.evaluate((el) => el.clientHeight)) >
              config.height - 60,
            'plan gets the whole workspace'
          );
          assert.match(
            await plan.locator('h3').innerText(),
            /^The Super Ultimate Word Search/
          );
          assert.equal(
            await input.isVisible(),
            false,
            'chat input does not compete with the plan'
          );
          await plan
            .getByRole('button', { name: 'Stop build plan', exact: true })
            .scrollIntoViewIfNeeded();
          await plan
            .getByRole('button', { name: 'Stop build plan', exact: true })
            .click();
          await plan
            .getByRole('button', { name: 'Keep it', exact: true })
            .click();
          if (artifacts && config.width === 320) {
            mkdirSync(artifacts, { recursive: true });
            await planScroll.evaluate((el) => (el.scrollTop = 0));
            await page.locator('main').screenshot({
              path: path.join(artifacts, engine + '-plan-320.png')
            });
          }
          await plan
            .getByRole('button', { name: 'Back to conversation' })
            .click();
          assert.equal(
            await input.inputValue(),
            'Please keep the adventure map colorful.'
          );
          assert.equal(
            (await page.evaluate(() => window.chatGeometry())).top,
            oldTop,
            'chat scroll is preserved'
          );
          assert.equal(
            await open.evaluate((el) => el === document.activeElement),
            true,
            'focus returns to the opener'
          );
          if (config.width < 480) {
            await page
              .getByRole('button', { name: 'Settings', exact: true })
              .click();
            const dialog = page.getByRole('dialog', {
              name: 'Lumine settings'
            });
            await dialog.waitFor();
            await dialog
              .getByRole('button', { name: 'Expand', exact: true })
              .click();
            await dialog
              .getByRole('button', { name: 'Manage uploads', exact: true })
              .scrollIntoViewIfNeeded();
            await page.keyboard.press('Escape');
            await dialog.waitFor({ state: 'hidden' });
            assert.equal(
              await input.isVisible(),
              true,
              'settings never remove the composer'
            );
          }
          if (artifacts && config.width === 320) {
            await page.locator('main').screenshot({
              path: path.join(artifacts, engine + '-chat-320.png')
            });
          }
        }
        await settle(page, { width: 320, height: 490 });
        await page
          .getByRole('button', { name: 'Settings', exact: true })
          .click();
        await page
          .getByRole('dialog', { name: 'Lumine settings' })
          .getByRole('button', { name: 'Expand', exact: true })
          .click();
        await settle(page, { width: 620, height: 720 });
        await page
          .getByRole('dialog', { name: 'Lumine settings' })
          .waitFor({ state: 'hidden' });
        assert.equal(
          await page
            .getByRole('textbox', { name: 'Message Lumine' })
            .isVisible(),
          true
        );
        await settle(page, { width: 320, height: 490 });
        assert.equal(
          await page.getByRole('dialog', { name: 'Lumine settings' }).count(),
          0,
          'closed settings do not reappear after resize'
        );
        // Settings reuse the existing controls. Nesting the sharing dialog
        // must keep its save/cancel behavior and close only the top dialog.
        await page
          .getByRole('combobox', { name: 'Mode', exact: true })
          .selectOption('light');
        assert.equal(
          await page.evaluate(
            () => window.actions.filter((a) => a[0] === 'mode').length
          ),
          1
        );
        await page
          .getByRole('button', { name: 'Settings', exact: true })
          .click();
        const settings = page.getByRole('dialog', { name: 'Lumine settings' });
        await settings
          .getByRole('button', { name: 'Change Lumine chat sharing' })
          .click();
        let sharing = page.getByRole('dialog').last();
        await sharing.getByRole('button', { name: /^Team/ }).click();
        await page.keyboard.press('Escape');
        await page.waitForFunction(
          () => document.querySelectorAll('[role="dialog"]').length === 1
        );
        assert.equal(
          await settings.isVisible(),
          true,
          'Escape preserves the underlying settings'
        );
        assert.equal(
          await page.evaluate(
            () => window.actions.filter((a) => a[0] === 'visibility').length
          ),
          0,
          'cancelling never saves sharing'
        );
        await settings
          .getByRole('button', { name: 'Change Lumine chat sharing' })
          .click();
        sharing = page.getByRole('dialog').last();
        assert.equal(
          await sharing
            .getByRole('button', { name: 'Save', exact: true })
            .isDisabled(),
          true,
          'cancelled choice is reset'
        );
        await sharing.getByRole('button', { name: /^Team/ }).click();
        await sharing
          .getByRole('button', { name: 'Save', exact: true })
          .click();
        await page.waitForFunction(
          () => document.querySelectorAll('[role="dialog"]').length === 1
        );
        await page.keyboard.press('Escape');
        await settings.waitFor({ state: 'hidden' });
        await page
          .getByRole('button', {
            name: 'Share Lumine chat with Team',
            exact: true
          })
          .waitFor();
        assert.equal(
          await page.evaluate(
            () => window.actions.filter((a) => a[0] === 'visibility').length
          ),
          1,
          'saving sharing sends exactly one request'
        );
        await settle(page, {
          width: 336,
          height: 600,
          stalled: true,
          long: false,
          owner: true
        });
        await page
          .getByRole('button', { name: /Open build plan.*Needs your choice/ })
          .click();
        await page
          .getByRole('button', { name: 'It works, mark it done', exact: true })
          .click();
        await page
          .getByRole('region', { name: 'Build plan workspace' })
          .waitFor({ state: 'hidden' });
        assert.equal(
          await page.evaluate(
            () => window.actions.filter((a) => a[0] === 'plan').length
          ),
          1
        );
        await settle(page, { owner: false, generating: false });
        await page
          .getByRole('button', {
            name: /Open build plan.*Waiting for the owner/
          })
          .click();
        assert.equal(
          await page
            .getByRole('button', {
              name: 'It works, mark it done',
              exact: true
            })
            .count(),
          0
        );
        await page.keyboard.press('Escape');
        await page
          .getByRole('region', { name: 'Build plan workspace' })
          .waitFor({ state: 'hidden' });
        await settle(page, {
          owner: true,
          proposal: true,
          generating: true,
          width: 320,
          height: 490
        });
        const proposal = page.getByRole('region', {
          name: 'Your build plan is ready'
        });
        await proposal.waitFor();
        assert.equal(
          await page
            .locator('main')
            .evaluate((el) => el.scrollWidth > el.clientWidth + 1),
          false
        );
        await proposal
          .getByRole('button', { name: 'View', exact: true })
          .click();
        await page
          .getByRole('region', { name: 'Build plan workspace' })
          .waitFor();
        await page.keyboard.press('Escape');
        assert.deepEqual(errors, []);
        if (artifacts)
          writeFileSync(
            path.join(artifacts, engine + '-measurements.json'),
            JSON.stringify(measurements, null, 2)
          );
      } finally {
        await browser.close();
      }
    }
  );
}
