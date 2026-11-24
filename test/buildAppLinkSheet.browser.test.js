import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

// Twinkle.app.openLink's sheet in real browsers: the real hook, Modal and
// Button, the real link checks, on phone and desktop sizes. An app's request
// is played through the same handler the bridge calls (useHostBridge
// `app:open-link`); the app side is covered in twinkle-api
// test/buildPreviewOpenLink.browser.test.ts.
const require = createRequire(import.meta.url);
let browsers = null;
try {
  browsers = require(
    process.env.PLAYWRIGHT_MODULE_PATH ||
      path.join(homedir(), '.npm-packages/lib/node_modules/playwright')
  );
} catch (error) {
  if (process.env.PLAYWRIGHT_MODULE_PATH) throw error;
}
const repo = fileURLToPath(new URL('..', import.meta.url));
// e.g. APP_LINK_SHOTS_DIR=../shots to keep screenshots of the sheet
const SHOTS = process.env.APP_LINK_SHOTS_DIR || '';
const HOST = 'http://twinkle.test';

const fixture = `
import React, {useRef} from 'react';
import {createRoot} from 'react-dom/client';
import useAppLinkConfirm from './src/components/Build/AppLink/useAppLinkConfirm';
window.recorded=[];
function Fixture(){
 const frameRootRef=useRef(null);
 const {appLinkModal,handleAppLinkRequest}=useAppLinkConfirm({buildId:884,frameRootRef});
 window.requestLink=(target,active=true)=>handleAppLinkRequest({target,userActivation:{isActive:active}})
   .then(result=>({ok:result}),error=>({code:error.code,message:error.message}));
 return <div className="page">
  <div ref={frameRootRef} id="frameRoot" className="app">
   <h1>Moon Facts</h1>
   <p>The Moon is about 384,400 km away. Want to read more?</p>
   <button className="app-link">Read on Wikipedia</button>
  </div>
  {appLinkModal}
 </div>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);
`;

let bundle;
async function compileFixture() {
  if (bundle) return bundle;
  const stubs = {
    '~/contexts':
      'const state={requestHelpers:{recordBuildAppLinkEvent:(event)=>{window.recorded.push(event);return Promise.resolve();}}};export const useAppContext=select=>select(state);',
    '~/theme/hooks/useRoleColor':
      'export const useRoleColor=()=>({getColor:()=>"#126bb5",color:"#126bb5",colorKey:"logoBlue",themeName:"logoBlue"});',
    '~/helpers':
      'export const isMobile=(nav)=>/iPhone|Android/.test(nav.userAgent);export const isTablet=()=>false;',
    '~/components/Icon':
      'import React from "react";export default ()=> <span aria-hidden="true">×</span>;',
    '~/components/ErrorBoundary': 'export default ({children})=>children;'
  };
  const result = await build({
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
        name: 'app-link-fixture',
        setup(builder) {
          builder.onResolve({ filter: /.*/ }, ({ path: request }) =>
            stubs[request] ? { path: request, namespace: 'fixture' } : undefined
          );
          builder.onLoad({ filter: /.*/, namespace: 'fixture' }, ({ path: request }) => ({
            contents: stubs[request],
            loader: 'jsx',
            resolveDir: repo
          }));
        }
      }
    ]
  });
  bundle = result.outputFiles[0].text;
  return bundle;
}

const HOST_PAGE = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>__STYLES__
html{font-size:62.5%}body{margin:0;background:#f4f6fb;font-family:system-ui,sans-serif}
.app{box-sizing:border-box;min-height:100vh;padding:24px;background:#1c2a44;color:#e2e8f0;font-size:16px}
.app h1{margin:0 0 12px;font-size:24px}.app-link{padding:12px 16px;border-radius:10px;border:0;background:#f5c542;font-weight:700}
</style></head><body><div id="root"></div><div id="modal"></div></body></html>`;

const OUTSIDE_PAGE = `<!doctype html><title>outside</title><script>
document.title = JSON.stringify({ referrer: document.referrer, opener: window.opener !== null, href: location.href });
</script>`;

const VIEWS = [
  {
    name: 'phone',
    options: {
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
    }
  },
  { name: 'desktop', options: { viewport: { width: 1280, height: 800 } } }
];

async function open(browser, view) {
  const context = await browser.newContext(view.options);
  const styles = readFileSync(path.join(repo, 'src/styles.css'), 'utf8');
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.origin === HOST) {
      return route.fulfill({ contentType: 'text/html', body: HOST_PAGE.replace('__STYLES__', styles) });
    }
    if (url.hostname.endsWith('example.com') || url.hostname.startsWith('xn--')) {
      return route.fulfill({ contentType: 'text/html', body: OUTSIDE_PAGE });
    }
    return route.abort();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${HOST}/app/884`);
  await page.addScriptTag({ content: await compileFixture() });
  await page.waitForFunction(() => typeof window.requestLink === 'function');
  return { context, page, errors };
}

const sheet = (page) => page.locator('[role="dialog"]');
const shot = async (page, name) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`) });
};

for (const engine of ['chromium', 'webkit']) {
  for (const view of VIEWS) {
    test(
      `the open-link sheet names the site, opens a new tab only on Open, and cancels cleanly (${engine}, ${view.name})`,
      { skip: !browsers && 'Install existing Playwright tooling or set PLAYWRIGHT_MODULE_PATH', timeout: 90000 },
      async () => {
        const browser = await browsers[engine].launch();
        try {
          const { context, page, errors } = await open(browser, view);

          // Open: the sheet names the site; Open needs a moment, then opens a
          // new tab with no referrer and no opener
          let pending = page.evaluate(() => window.requestLink('https://en.example.com/wiki/Moon?ref=app'));
          await sheet(page).waitFor();
          const text = (await sheet(page).innerText()).replace(/\s+/g, ' ');
          assert.match(text, /Open en\.example\.com\?/);
          assert.match(text, /This link leaves Twinkle\./);
          assert.equal(await page.locator('#frameRoot').getAttribute('inert'), '', 'the app is inert under the sheet');
          const openButton = sheet(page).getByRole('button', { name: 'Open' });
          const cancelButton = sheet(page).getByRole('button', { name: 'Cancel' });
          // the sheet fits the screen with both buttons reachable
          const box = await sheet(page).boundingBox();
          const viewport = page.viewportSize();
          assert.ok(box.x >= 0 && box.x + box.width <= viewport.width && box.y >= 0 && box.y + box.height <= viewport.height);
          for (const button of [openButton, cancelButton]) {
            const b = await button.boundingBox();
            assert.ok(b && b.height >= 30 && b.x + b.width <= viewport.width, 'tappable');
          }
          // a quick second tap meant for the app does nothing
          let popups = 0;
          context.on('page', () => (popups += 1));
          await openButton.click({ force: true });
          await page.waitForTimeout(100);
          assert.equal(popups, 0);
          assert.equal(await sheet(page).count(), 1);
          await page.waitForTimeout(500);
          await shot(page, `sheet-${engine}-${view.name}`);
          const popupPromise = context.waitForEvent('page');
          await openButton.click();
          const popup = await popupPromise;
          await popup.waitForLoadState();
          await popup.waitForFunction(() => document.title.startsWith('{'));
          const outside = JSON.parse(await popup.title());
          assert.equal(outside.href, 'https://en.example.com/wiki/Moon?ref=app', 'the exact link, nothing of Twinkle added');
          assert.equal(outside.referrer, '', 'no referrer');
          assert.equal(outside.opener, false, 'no opener');
          assert.deepEqual(await pending, { ok: { navigateUrl: null, response: { opened: true, target: 'external' } } });
          assert.equal(await sheet(page).count(), 0);
          assert.equal(await page.locator('#frameRoot').getAttribute('inert'), null);
          await popup.close();

          // Cancel: no tab, opened false
          await page.waitForTimeout(1600);
          pending = page.evaluate(() => window.requestLink('https://example.com/'));
          await sheet(page).waitFor();
          const before = popups;
          await cancelButton.click();
          assert.deepEqual(await pending, { ok: { navigateUrl: null, response: { opened: false, target: 'external' } } });
          assert.equal(popups, before);

          // right after: too soon for the same app; and one sheet at a time
          assert.equal((await page.evaluate(() => window.requestLink('https://example.com/again'))).code, 'LINK_RATE_LIMITED');
          await page.waitForTimeout(1600);
          pending = page.evaluate(() => window.requestLink('https://example.com/one'));
          await sheet(page).waitFor();
          assert.equal((await page.evaluate(() => window.requestLink('https://example.com/two'))).code, 'LINK_CONFIRM_IN_PROGRESS');
          await page.keyboard.press('Escape');
          assert.equal((await pending).ok.response.opened, false);

          // refused before any sheet: no tap, bad schemes, credentials
          const refused = await page.evaluate(async () => [
            (await window.requestLink('https://example.com/', false)).code,
            (await window.requestLink('javascript:alert(1)')).code,
            (await window.requestLink('data:text/html,hi')).code,
            (await window.requestLink('https://a:b@example.com/')).code
          ]);
          assert.deepEqual(refused, ['USER_ACTIVATION_REQUIRED', 'LINK_SCHEME_NOT_ALLOWED', 'LINK_SCHEME_NOT_ALLOWED', 'LINK_HAS_CREDENTIALS']);
          assert.equal(await sheet(page).count(), 0);

          // a look-alike name: decoded, with the address-bar form and a warning
          await page.waitForTimeout(1600);
          pending = page.evaluate(() => window.requestLink('https://xn--pple-43d.com/login'));
          await sheet(page).waitFor();
          const warned = (await sheet(page).innerText()).replace(/\s+/g, ' ');
          assert.match(warned, /Open аpple\.com\?/);
          assert.match(warned, /Address bar: xn--pple-43d\.com/);
          assert.match(warned, /mixes letters from different alphabets/);
          await page.waitForTimeout(500);
          await shot(page, `sheet-lookalike-${engine}-${view.name}`);
          await sheet(page).getByRole('button', { name: 'Cancel' }).click();
          await pending;

          // Twinkle content: no sheet, opened in place by the bridge
          assert.deepEqual(await page.evaluate(() => window.requestLink('https://www.twin-kle.com/subjects/432')), {
            ok: { navigateUrl: `${HOST}/subjects/432`, response: { opened: true, target: 'twinkle' } }
          });

          // counts only
          const recorded = await page.evaluate(() => window.recorded);
          assert.ok(recorded.every((event) => event.buildId === 884 && Object.keys(event).length === 2));
          const kinds = recorded.map((event) => event.kind);
          assert.deepEqual(
            ['shown', 'opened', 'cancelled', 'rejected'].map((kind) => kinds.filter((k) => k === kind).length),
            [4, 1, 3, 6]
          );
          assert.deepEqual(errors, []);
        } finally {
          await browser.close();
        }
      }
    );
  }
}
