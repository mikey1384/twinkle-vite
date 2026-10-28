import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const { chromium, webkit } = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const artifacts = process.env.PICTURE_POLISH_ARTIFACTS;
const raw = 'a fox readin under tree, no words in the picture';
const polished = 'A fox reading beneath a tree, with no words in the picture.';
const contexts = `
const state={
 requestHelpers:{
  refineDailyQuestionResponse:args=>{window.refines.push(args);return new Promise((resolve,reject)=>{window.finishPolish=resolve;window.failPolish=reject;});},
  shareDailyQuestionResponse:async args=>{window.shares.push(args);return {success:true,feed:{contentId:77},newCoins:1000};},
  shareDailyQuestionWithAI:async args=>{window.aiShares.push(args);return {channelId:3,newCoins:1000};}
 },
 user:{actions:{onSetUserState:()=>{}}},
 actions:{onLoadNewFeeds:()=>{}},
 myState:{userId:5,twinkleCoins:0},state:{thinkHard:{}}
};
export const useAppContext=select=>select(state);
export const useKeyContext=useAppContext;
export const useHomeContext=useAppContext;
export const useChatContext=useAppContext;
`;
const fixture = `
import React from 'react';
import {createRoot} from 'react-dom/client';
import {library} from '@fortawesome/fontawesome-svg-core';
import {faMagic,faShare,faCheck,faPencilAlt,faCopy,faSpinner,faFire} from '@fortawesome/pro-solid-svg-icons';
import GradingResult from './src/components/Modals/DailyQuestionModal/DailyQuestionPanel/GradingResult';
library.add(faMagic,faShare,faCheck,faPencilAlt,faCopy,faSpinner,faFire);
window.refines=[];window.shares=[];window.aiShares=[];
const root=createRoot(document.getElementById('root'));
let revision=0;
window.mount=(options={})=>{
 window.refines=[];window.shares=[];window.aiShares=[];
 root.render(<GradingResult key={++revision}
  question="Picture Day: describe a picture you have in mind — or anything at all"
  questionId={42} isKeywordDay={true} isPictureDay={true}
  picturePath="daily-reflection/fixture.png"
  response=${JSON.stringify(raw)} originalResponse=${JSON.stringify(raw)}
  initialRefinedResponse=${JSON.stringify(polished)} grade="Pass" xpAwarded={0}
  feedback="Anything counts today." responseId={77} streak={4} isShared={false}
  sharedWithZero={false} sharedWithCiel={false} onClose={()=>{}} {...options}/>);
};
window.mount();
`;

let script;
async function compile() {
  if (script) return script;
  const stubs = {
    '~/contexts': contexts,
    '~/theme/hooks/useRoleColor': 'export const useRoleColor=()=>({colorKey:"blue",getColor:()=>"#4682b4"});',
    '~/constants/sockets/api': 'export const socket={emit(){}};',
    './Preferences': 'export default ()=>null;',
    './ReflectionStatsPanel': 'export default ()=>null;'
  };
  const result = await build({
    stdin: { contents: fixture, resolveDir: repo, loader: 'tsx' },
    bundle: true, write: false, format: 'iife', platform: 'browser',
    alias: { '~': path.join(repo, 'src') }, loader: { '.png': 'dataurl' },
    define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"development"' },
    plugins: [{ name: 'local-services', setup(builder) {
      builder.onResolve({ filter: /.*/ }, ({ path }) => stubs[path] ? { path, namespace: 'fixture' } : undefined);
      builder.onLoad({ filter: /.*/, namespace: 'fixture' }, ({ path }) => ({ contents: stubs[path], loader: 'jsx', resolveDir: repo }));
    } }]
  });
  script = result.outputFiles[0].text;
  return script;
}

const html = `<style>
*{box-sizing:border-box}html{font-size:10px;--px:1px}body{margin:0;font-family:Arial;background:#f6f1e8;color:#2f2a24}#root{max-width:820px;margin:2rem auto;padding:1rem;background:#fffdf8;border:1px solid rgba(120,98,70,.18);border-radius:16px}button{font-family:inherit}p{margin:0} @media(max-width:500px){#root{margin:1rem}}
</style><div id="root"></div>`;

for (const [name, engine] of Object.entries({ chromium, webkit })) {
  test(`Picture Day uses the shared original/polished chooser (${name})`, { timeout: 60000 }, async () => {
    const bundle = await compile();
    const browser = await engine.launch();
    try {
      const context = await browser.newContext({ viewport: { width: 360, height: 800 } });
      const page = await context.newPage();
      page.setDefaultTimeout(5000);
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await context.route('**/*', route => {
        if (route.request().url().startsWith('http://localhost:3000/')) return route.fulfill({ contentType: 'text/html', body: html });
        if (route.request().url().includes('/daily-reflection/fixture.png')) return route.fulfill({ contentType: 'image/jpeg', body: readFileSync(path.join(repo, 'public/img/daily-reflection/cover-picture-day.jpg')) });
        return route.abort();
      });
      await page.addInitScript({ content: `window.addEventListener('DOMContentLoaded',()=>{${bundle}\n});` });
      await page.goto('http://localhost:3000/daily-reflection');
      await page.getByText('Your description', { exact: true }).waitFor();
      assert.equal(await page.getByText(polished, { exact: true }).isVisible(), true);
      const imageSource = await page.locator('img').first().getAttribute('src');
      await page.getByRole('button', { name: 'Share to Feed', exact: true }).click();
      await page.getByRole('button', { name: 'AI Polished', exact: true }).waitFor();
      assert.equal(await page.evaluate(() => window.shares.length), 0, 'opening chooser does not publish');
      assert.equal(await page.getByRole('button', { name: 'AI Polished', exact: true }).getAttribute('aria-pressed'), 'true');
      await page.getByRole('button', { name: 'My Original', exact: true }).focus();
      await page.keyboard.press('Enter');
      assert.equal(await page.getByText(raw, { exact: true }).isVisible(), true);
      assert.equal(await page.getByRole('button', { name: 'My Original', exact: true }).getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('img').first().getAttribute('src'), imageSource);
      await page.getByRole('button', { name: 'Go Back', exact: true }).click();
      assert.equal(await page.evaluate(() => window.shares.length), 0);
      await page.getByRole('button', { name: 'Share to Feed', exact: true }).click();
      await page.getByRole('button', { name: 'Share to Feed', exact: true }).click();
      await page.getByRole('button', { name: 'Shared to Feed', exact: true }).waitFor();
      assert.deepEqual(await page.evaluate(() => window.shares), [{ responseId: 77, responseText: raw, version: 'original' }]);

      // A new entry can explicitly publish the polished text. Screen widths
      // must not hide either choice or the confirmation action.
      for (const width of [360, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(() => window.mount());
        await page.getByRole('button', { name: 'Share to Feed', exact: true }).click();
        await page.getByRole('button', { name: 'AI Polished', exact: true }).waitFor();
        assert.equal(await page.getByText(polished, { exact: true }).isVisible(), true);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        if (artifacts) {
          mkdirSync(artifacts, { recursive: true });
          await page.screenshot({ path: path.join(artifacts, `${name}-${width}-share-choice.png`), fullPage: true });
        }
        await page.getByRole('button', { name: 'Share to Feed', exact: true }).click();
        await page.waitForFunction(() => window.shares.length === 1);
        assert.equal(await page.evaluate(() => window.shares[0].version), 'refined');
        assert.equal(await page.evaluate(() => window.shares[0].responseText), polished);
      }

      // Older entries that never ran polish use the existing lazy refinement.
      await page.evaluate(() => window.mount({ initialRefinedResponse: null }));
      await page.getByRole('button', { name: 'See AI Polished Version', exact: true }).click();
      await page.waitForFunction(() => window.refines.length === 1);
      assert.equal(await page.getByRole('button', { name: 'Polishing...', exact: true }).first().isDisabled(), true);
      assert.equal(await page.evaluate(() => window.shares.length), 0);
      await page.evaluate(text => window.finishPolish({ refinedText: text }), polished);
      await page.getByRole('button', { name: 'AI Polished', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Go Back', exact: true }).click();
      await page.getByRole('button', { name: 'Share to Feed', exact: true }).click();
      assert.equal(await page.evaluate(() => window.refines.length), 1);

      // Unchanged wording remains an honest original-only choice.
      await page.evaluate(text => window.mount({ initialRefinedResponse: text }), raw);
      await page.getByRole('button', { name: 'Share to Feed', exact: true }).click();
      await page.getByRole('button', { name: 'My Original', exact: true }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'AI Polished', exact: true }).count(), 0);
      await page.getByRole('button', { name: 'Share to Feed', exact: true }).click();
      await page.waitForFunction(() => window.shares.length === 1);
      assert.equal(await page.evaluate(() => window.shares[0].version), 'original');

      // Failed refinement keeps the entry and allows an explicit retry.
      await page.evaluate(() => window.mount({ initialRefinedResponse: null, picturePath: '' }));
      await page.getByRole('button', { name: 'See AI Polished Version', exact: true }).click();
      await page.waitForFunction(() => window.refines.length === 1);
      await page.evaluate(() => window.finishPolish({ error: 'Fixture polish unavailable. Please try again.' }));
      await page.getByText('Fixture polish unavailable. Please try again.', { exact: true }).waitFor();
      assert.equal(await page.getByText(raw, { exact: true }).isVisible(), true);
      assert.equal(await page.evaluate(() => window.shares.length), 0);
      await page.getByRole('button', { name: 'See AI Polished Version', exact: true }).click();
      await page.waitForFunction(() => window.refines.length === 2);
      await page.evaluate(text => window.finishPolish({ refinedText: text }), polished);
      await page.getByRole('button', { name: 'AI Polished', exact: true }).waitFor();

      // Picture Day companion shares use the same explicit version choice;
      // ordinary Word Day's direct canonical share remains unchanged.
      await page.evaluate(() => window.mount());
      await page.getByRole('button', { name: 'Zero Share with Zero', exact: true }).click();
      await page.getByRole('button', { name: 'Original (raw)', exact: true }).click();
      assert.equal(await page.evaluate(() => window.aiShares.length), 0);
      await page.getByRole('button', { name: 'Confirm Share with Zero', exact: true }).click();
      await page.waitForFunction(() => window.aiShares.length === 1);
      assert.equal(await page.evaluate(() => window.aiShares[0].version), 'original');
      await page.evaluate(() => window.mount({ isPictureDay: false, picturePath: '' }));
      await page.getByRole('button', { name: 'Zero Share with Zero', exact: true }).click();
      await page.waitForFunction(() => window.aiShares.length === 1);
      assert.equal(await page.evaluate(() => window.aiShares[0].version), 'refined');
      assert.deepEqual(errors, []);
      await context.close();
    } finally {
      await browser.close();
    }
  });
}
