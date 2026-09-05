import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const { chromium } = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));

const contexts = `
import {useSyncExternalStore} from 'react';
const listeners=new Set();
const emit=()=>listeners.forEach(fn=>fn());
const fullPolicy={energyRemaining:680000,energyPercent:80,dayKey:'2026-09-05'};
const key={myState:{userId:7,canGenerateAICard:true,banned:null}};
const chat={state:{numCardSummonedToday:0,isGeneratingAICard:false,aiCardStatusMessage:'',aiCardErrorMessage:''},actions:{
 onUpdateNumSummoned:value=>{chat.state.numCardSummonedToday=value;emit()},
 onSetIsGeneratingAICard:value=>{chat.state.isGeneratingAICard=value;emit()},
 onSetAICardStatusMessage:value=>{chat.state.aiCardStatusMessage=value;emit()},
 onPostAICardFeed:()=>{}
}};
const noti={state:{todayStats:{aiUsagePolicy:fullPolicy}},actions:{onUpdateTodayStats:({newStats})=>{Object.assign(noti.state.todayStats,newStats);emit()}}};
const view={state:{aiFeaturesDisabled:false,aiDisabledNotice:''}};
window.summonRequests=0;
const app={requestHelpers:{
 getAiEnergyPolicy:async()=>({aiUsagePolicy:noti.state.todayStats.aiUsagePolicy}),
 generateAICard:()=>{window.summonRequests++;return new Promise(resolve=>{window.finishSummon=()=>resolve({numCardSummoned:1,coins:100,feed:{},card:{ownerId:7},aiUsagePolicy:fullPolicy})})}
},user:{actions:{onSetUserState:()=>{},onSetCollectType:()=>{}}}};
function useSelected(bag,select){return useSyncExternalStore(fn=>{listeners.add(fn);return()=>listeners.delete(fn)},()=>select(bag))}
export const useKeyContext=fn=>useSelected(key,fn);
export const useChatContext=fn=>useSelected(chat,fn);
export const useNotiContext=fn=>useSelected(noti,fn);
export const useViewContext=fn=>useSelected(view,fn);
export const useAppContext=fn=>useSelected(app,fn);
window.deliverPolicy=policy=>{noti.state.todayStats.aiUsagePolicy=policy;emit()};
window.setRestrictions=({licensed=true,banned=false,maxed=false,disabled=false}={})=>{
 key.myState.canGenerateAICard=licensed;key.myState.banned=banned?{aiCards:true}:null;
 chat.state.numCardSummonedToday=maxed?100000:0;view.state.aiFeaturesDisabled=disabled;emit();
};
`;
const fixture = `
import React from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import {library} from '@fortawesome/fontawesome-svg-core';
import {faBolt,faBatteryEmpty,faSpinner} from '@fortawesome/pro-solid-svg-icons';
import AICards from './src/containers/Chat/Body/Collect/AICards';
library.add(faBolt,faBatteryEmpty,faSpinner);
const root=createRoot(document.getElementById('root'));
root.render(<MemoryRouter><AICards displayedThemeColor="logoBlue" loadingAICardChat={false}/></MemoryRouter>);
window.unmountFixture=()=>root.unmount();
`;

// Render the actual AI Cards controller, summon button and status display.
// Isolate the unrelated activity feed and shared payment dialog: this checks
// navigation into charging and canonical policy updates without purchasing.
async function compileFixture() {
  return build({
    stdin: { contents: fixture, resolveDir: repo, loader: 'tsx' },
    bundle: true, write: false, format: 'iife', platform: 'browser',
    jsx: 'transform',
    define: { 'process.env.NODE_ENV': '"development"', 'import.meta.env': '{}' },
    plugins: [{
      name: 'isolated-ai-card-controls',
      setup(builder) {
        const stubs = {
          '~/contexts': contexts,
          '~/components/FilterBar': 'import React from "react";export default function FilterBar({children}){return <div style={{display:"flex",gap:20,height:45}}>{children}</div>}',
          '~/components/Loading': 'import React from "react";export default function Loading(){return <div>Loading</div>}',
          './ActivitiesContainer': 'import React from "react";export default function Activities(){return <div data-testid="activity-feed" style={{flex:1,padding:20}}>Card activity</div>}',
          '~/components/AiEnergyDashboardModal': 'import React from "react";export default function Dashboard({onHide}){return <div role="dialog" aria-label="AI Energy dashboard"><button onClick={onHide}>Close dashboard</button></div>}',
          '~/helpers/analytics': 'export function trackEvent(){}'
        };
        builder.onResolve({ filter: /.*/ }, args => {
          if (args.path in stubs) return { path: args.path, namespace: 'fixture' };
          if (args.path.startsWith('~/')) return builder.resolve(path.join(repo, 'src', args.path.slice(2)), { resolveDir: repo, kind: args.kind });
        });
        builder.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: stubs[args.path], loader: 'jsx', resolveDir: repo }));
      }
    }]
  });
}

function ownProcessTree() {
  const rows = execFileSync('ps', ['-axo', 'pid=,ppid='], { encoding: 'utf8' }).trim().split('\n').map(line => line.trim().split(/\s+/).map(Number));
  const ids = new Set([process.pid]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const [pid, ppid] of rows) if (ids.has(ppid) && !ids.has(pid)) { ids.add(pid); changed = true; }
  }
  return [...ids];
}

test('AI Cards has one summon control, with accessible recharge and canonical recovery', { timeout: 45000 }, async () => {
  const result = await compileFixture();
  const output = process.env.AI_CARD_CONTROLS_SCREENSHOTS;
  if (output) mkdirSync(output, { recursive: true });
  let browser;
  const errors = [];
  try {
    browser = await chromium.launch({ headless: true, timeout: 10000 });
    for (const width of [900, 390, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 620 } });
      page.setDefaultTimeout(3000);
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/*', route => route.abort());
      await page.setContent('<div id="root"></div>');
      await page.addStyleTag({ content: '*{box-sizing:border-box}html{font-size:10px}body{margin:0;font-family:Arial}#root{height:560px;--ui-border:#cbd5e1;--chat-text:#334155}nav{font-size:16px}' });
      await page.addScriptTag({ content: result.outputFiles[0].text });
      const summon = page.getByRole('button', { name: 'Summon Card', exact: true });
      await summon.waitFor();
      assert.equal(await summon.isEnabled(), true);
      assert.equal(await page.getByRole('meter').count(), 0);
      assert.equal(await page.locator('time').count(), 0);
      const buttonBox = await summon.boundingBox();
      const tray = summon.locator('xpath=../../..');
      const trayBox = await tray.boundingBox();
      assert.ok(buttonBox.y + buttonBox.height <= 560);
      assert.ok(trayBox.height < 90, 'removed display must not leave a tall empty tray');
      assert.ok((await page.getByTestId('activity-feed').boundingBox()).height > 400);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      if (output) await page.screenshot({ path: path.join(output, `cards-${width}.png`) });

      await page.evaluate(() => window.deliverPolicy({ energyRemaining: 0, energyPercent: 0, dayKey: '2026-09-05' }));
      const recharge = page.getByRole('button', { name: 'Recharge Energy', exact: true });
      await recharge.waitFor();
      assert.equal(await recharge.isEnabled(), true);
      await recharge.click();
      await page.getByRole('dialog', { name: 'AI Energy dashboard', exact: true }).waitFor();
      assert.equal(await page.evaluate(() => window.summonRequests), 0);
      await page.getByRole('button', { name: 'Close dashboard' }).click();
      assert.equal(await recharge.isVisible(), true, 'opening charging must not invent restored energy');
      await page.evaluate(() => window.deliverPolicy({ energyRemaining: 4553, energyPercent: 0, dayKey: '2026-09-05' }));
      await summon.waitFor();
      assert.equal(await summon.isEnabled(), true, 'a positive canonical remainder may summon even if the rounded percent is zero');
      await summon.click();
      await page.getByRole('button', { name: 'Summoning...', exact: true }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Summoning...', exact: true }).isDisabled(), true);
      assert.equal(await page.evaluate(() => window.summonRequests), 1);
      await page.evaluate(() => window.finishSummon());
      await summon.waitFor();

      for (const [restriction, label] of [[{licensed:false}, 'Need License'], [{banned:true}, 'Restricted'], [{maxed:true}, 'Daily Limit Reached']]) {
        await page.evaluate(value => window.setRestrictions(value), restriction);
        const control = page.getByRole('button', { name: label, exact: true });
        await control.waitFor();
        assert.equal(await control.isDisabled(), true);
      }
      await page.evaluate(() => window.setRestrictions({ disabled: true }));
      await page.getByText('AI Card Generation Is Unavailable', { exact: true }).waitFor();
      assert.equal(await page.getByRole('button').count(), 0);
      await page.evaluate(() => window.unmountFixture());
      await page.close();
    }
    assert.deepEqual(errors, []);
  } finally {
    try { if (output) writeFileSync(path.join(output, 'processes.json'), JSON.stringify(ownProcessTree())); }
    finally { await browser?.close(); }
  }
});
