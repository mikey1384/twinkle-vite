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
const artifacts = process.env.PARENT_EMAIL_ARTIFACTS;
const fixture = `
import React from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import {library} from '@fortawesome/fontawesome-svg-core';
import {faArrowLeft,faPaperPlane,faSpinner} from '@fortawesome/pro-solid-svg-icons';
import EmailsReviewPage from './src/containers/BridgeBuilderQuest/EmailsReviewPage';
library.add(faArrowLeft,faPaperPlane,faSpinner);
window.sent=[];window.saved=[];
window.data={review:true,drafts:[
 {id:1,crewId:0,kind:'arena',childUserId:11,childUsername:'fixture-child',addressSource:'known',to:'parent-with-a-long-address@example.com',subject:'[Twinkle 모의고사] fixture-child 학생 A2 Key for Schools 응시 결과',body:'Please verify your address.\\n\\nMy personal note.',status:'held',revision:'a',verificationChanged:true,suggestedBody:'Your address is registered.\\n\\nView the completed paper: https://example.com/exam-report?token=fixture',createdAt:1793000000,decidedAt:0},
 {id:2,crewId:0,kind:'arena',to:'parent-with-a-very-long-address@example.com',subject:'[Twinkle 모의고사] fixture-child 학생 A2 Key for Schools 응시 결과',body:'The exact sent message.\\n\\n<image-onerror> is plain text.\\nhttps://example.com/'+ 'a'.repeat(140),status:'sent',createdAt:1793000000,decidedAt:1793000001},
 {id:3,crewId:0,kind:'witness',to:'parent@example.com',subject:'Meetup invitation',body:'An invitation that was discarded.',status:'discarded',createdAt:1793000000,decidedAt:1793000002}
]};
const snapshot=()=>structuredClone(window.data);
window.requests={
 loadMeetupEmails:async()=>snapshot(),
 saveMeetupEmail:async args=>{window.saved.push(args);Object.assign(window.data.drafts[0],args,{body:args.body.trim(),verificationChanged:false,revision:'saved'});return snapshot();},
 sendMeetupEmail:async args=>{if(window.verifyOnSend){window.verifyOnSend=false;Object.assign(window.data.drafts[0],{revision:'new',verificationChanged:true,suggestedBody:'Latest verified message.'});throw new Error('This email changed. Review the latest message before sending; your edits have been kept.');}window.sent.push(args);Object.assign(window.data.drafts[0],args,{status:'sent',verificationChanged:false,decidedAt:1793000003});return snapshot();},
 discardMeetupEmail:async()=>{window.data.drafts[0].status='discarded';return snapshot();},
 setMeetupEmailReview:async on=>{window.data.review=on;return snapshot();}
};
createRoot(document.getElementById('root')).render(<MemoryRouter><EmailsReviewPage/></MemoryRouter>);
`;

let bundle;
async function compile() {
  if (bundle) return bundle;
  const stubs = {
    '~/contexts': 'export const useAppContext=select=>select({requestHelpers:window.requests}); export const useKeyContext=select=>select({myState:{userId:1}});',
    '~/components/ErrorBoundary': 'export default ({children})=>children;',
    '~/components/LoggedOutPrompt': 'export default ()=>null;',
    '~/components/Loading': 'export default ()=>null;'
  };
  const result = await build({
    stdin: { contents: fixture, resolveDir: repo, loader: 'tsx' }, bundle: true, write: false,
    format: 'iife', platform: 'browser', alias: { '~': path.join(repo, 'src') },
    define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"development"' },
    plugins: [{ name: 'fixture-services', setup(builder) {
      builder.onResolve({ filter: /.*/ }, ({ path }) => stubs[path] ? { path, namespace: 'fixture' } : undefined);
      builder.onLoad({ filter: /.*/, namespace: 'fixture' }, ({ path }) => ({ contents: stubs[path], loader: 'jsx', resolveDir: repo }));
    } }]
  });
  bundle = result.outputFiles[0].text;
  return bundle;
}

for (const [name, engine] of Object.entries({ chromium, webkit })) {
  test(`parent email review preserves edits and shows actual history (${name})`, { timeout: 60000 }, async () => {
    const script = await compile();
    const browser = await engine.launch();
    try {
      for (const width of [360, 1280]) {
        const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: width === 360 });
        page.setDefaultTimeout(6000);
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/*', route => route.request().url() === 'http://localhost:3000/'
          ? route.fulfill({ contentType: 'text/html', body: `<style>${readFileSync(path.join(repo, 'src/styles.css'), 'utf8')}body{background:#f1f2f5}</style><div id="root"></div>` })
          : route.abort());
        await page.goto('http://localhost:3000/');
        await page.addScriptTag({ content: script });
        const message = page.getByRole('textbox', { name: 'Message', exact: true });
        await message.waitFor();
        assert.match(await message.inputValue(), /My personal note/);
        await page.getByText('This parent address is now verified.', { exact: false }).waitFor();
        const sent = page.locator('details').filter({ hasText: 'A2 Key for Schools' });
        await sent.locator('summary').click();
        assert.match(await sent.innerText(), /The exact sent message/);
        assert.equal(await sent.locator('image-onerror').count(), 0);
        const discarded = page.locator('details').filter({ hasText: 'Meetup invitation' });
        await discarded.locator('summary').focus();
        await page.keyboard.press('Enter');
        assert.match(await discarded.innerText(), /this message was not sent/);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'mobile page must not overflow');
        if (artifacts) {
          mkdirSync(artifacts, { recursive: true });
          await page.screenshot({ path: path.join(artifacts, `${name}-${width}.png`), fullPage: true });
        }
        // A changed draft must not erase unsaved local edits on the reload.
        await message.fill('My unsaved note');
        await page.evaluate(() => { window.verifyOnSend = true; });
        await page.getByRole('button', { name: 'Send to the parent' }).click();
        await page.getByRole('button', { name: 'Keep my edits' }).waitFor();
        assert.equal(await message.inputValue(), 'My unsaved note');
        assert.equal(await page.getByRole('button', { name: 'Send to the parent' }).isDisabled(), true);
        await page.getByRole('button', { name: 'Keep my edits' }).click();
        await page.getByRole('button', { name: 'Save changes' }).click();
        await page.waitForFunction(() => window.saved.length === 1);
        assert.equal(await message.inputValue(), 'My unsaved note');
        const saved = await page.evaluate(() => window.saved[0]);
        assert.equal(saved.body, 'My unsaved note');
        assert.equal(saved.revision, 'new');
        // The new default is an explicit choice, not a silent overwrite.
        await page.evaluate(() => { window.verifyOnSend = true; });
        await page.getByRole('button', { name: 'Send to the parent' }).click();
        await page.getByRole('button', { name: 'Use updated message' }).click();
        assert.equal(await message.inputValue(), 'Latest verified message.');
        await page.getByRole('button', { name: 'Send to the parent' }).click();
        await page.waitForFunction(() => window.sent.length === 1);
        assert.equal((await page.evaluate(() => window.sent[0])).body, 'Latest verified message.');
        assert.deepEqual(errors, []);
        await page.close();
      }
    } finally { await browser.close(); }
  });
}
