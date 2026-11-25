import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

// Twinkle's blocked-site list on posted links in real browsers: the real
// page guard (components/PostedLinkGuard) and its note, the real Embedly
// preview, on phone and desktop sizes. The comment links are the markup the
// RichText renderer produces for an outside link (target _blank, rel
// noopener noreferrer), plus a same-tab link.
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
// e.g. POSTED_LINK_SHOTS_DIR=../shots to keep screenshots of the note
const SHOTS = process.env.POSTED_LINK_SHOTS_DIR || '';
const HOST = 'http://twinkle.test';

const fixture = `
import React from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import PostedLinkGuard from './src/components/PostedLinkGuard';
import Embedly from './src/components/Embedly';
function Fixture(){
 return <MemoryRouter>
  <div className="page">
   <div className="comment">
    <b>Sky_Painter</b>
    <p>Look at this: <a id="blocked" href="https://bad.example.com/free-stuff" target="_blank" rel="noopener noreferrer">bad.example.com/free-stuff</a></p>
    <p>And the Moon page: <a id="allowed" href="https://en.example.com/wiki/Moon" target="_blank" rel="noopener noreferrer">en.example.com/wiki/Moon</a></p>
    <p>Same tab: <a id="sametab" href="https://www.bad.example.com/x">www.bad.example.com/x</a> · <a id="internal" href="/subjects/3">a subject</a></p>
    <p>Own handlers: <a id="pdf" href="https://testcdn.cloudfront.net/attachments/1/notes.pdf" target="_blank" onClick={(e)=>{e.preventDefault();window.pdfViewer=(window.pdfViewer||0)+1;}}>notes.pdf</a> · <a id="handled" href="https://en.example.com/handled" target="_blank" rel="noopener noreferrer" onClick={()=>{window.handlerRan=(window.handlerRan||0)+1;}}>handled link</a></p>
    <p><svg width="120" height="24"><a id="svglink" href="https://bad.example.com/svg"><text x="0" y="18">svg link</text></a></svg>
     <img id="mapimg" alt="map" width="120" height="24" useMap="#linkmap" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" style={{background:'#dde'}}/>
     <map name="linkmap"><area id="arealink" shape="rect" coords="0,0,120,24" href="https://bad.example.com/area" alt="area link"/></map></p>
   </div>
   <div className="preview" id="blockedPreview"><Embedly contentId={1} contentType="url"/></div>
   <div className="preview" id="allowedPreview"><Embedly contentId={2} contentType="url"/></div>
  </div>
  <PostedLinkGuard/>
 </MemoryRouter>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);
window.fixtureReady=true;
`;

let bundle;
async function compileFixture() {
  if (bundle) return bundle;
  const stubs = {
    '~/contexts':
      'const noop=()=>null;const actions=new Proxy({},{get:()=>noop});' +
      'const state={requestHelpers:{recordPostedLinkEvents:(event)=>{(window.posts=window.posts||[]).push(event);return Promise.resolve();},' +
      'makeThumbnailSecure:noop,updateUrlEmbedData:()=>new Promise(()=>null),' +
      'loadLinkBlocklist:()=>{window.listLoads=(window.listLoads||0)+1;const c=window.listConfig||{};return new Promise((resolve,reject)=>setTimeout(()=>c.status!==undefined?reject(Object.assign(new Error("list"),{status:c.status})):resolve({hosts:c.hosts||[]}),c.delayMs||0));}}};' +
      'export const useAppContext=select=>select(state);' +
      'export const useKeyContext=select=>select({myState:{userId:5}});' +
      'export const useContentContext=select=>select({actions});',
    '~/helpers/hooks':
      'const states={"url:1":{loaded:true,content:"https://bad.example.com/free-stuff",actualTitle:"Free stuff, click now",actualDescription:"From the blocked site",siteUrl:"bad.example.com",thumbUrl:""},' +
      '"url:2":{loaded:true,content:"https://en.example.com/wiki/Moon",actualTitle:"Moon - Wikipedia",actualDescription:"The Moon is Earth\'s only natural satellite.",siteUrl:"en.example.com",thumbUrl:""}};' +
      'export const useContentState=({contentType,contentId})=>states[contentType+":"+contentId]||{};',
    './TwinkleVideo': 'export default ()=>null;',
    '~/theme/hooks/useRoleColor':
      'export const useRoleColor=()=>({getColor:()=>"#126bb5",color:"#126bb5",colorKey:"logoBlue",themeName:"logoBlue"});',
    '~/helpers':
      'export const isMobile=(nav)=>/iPhone|Android/.test(nav.userAgent);export const isTablet=()=>false;',
    '~/components/Icon':
      'import React from "react";export default ({icon})=> <span aria-hidden="true">{icon==="times"?"×":"⦸"}</span>;',
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
      'import.meta.env': '{"VITE_CLOUDFRONT_KEY":"testcdn"}',
      'process.env.NODE_ENV': '"development"'
    },
    plugins: [
      {
        name: 'posted-link-fixture',
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
.page{box-sizing:border-box;max-width:720px;margin:0 auto;padding:16px;font-size:15px}
.comment{background:#fff;border-radius:10px;padding:14px 16px;margin-bottom:14px;line-height:1.6}
.comment p{margin:6px 0}.preview{background:#fff;border-radius:10px;padding:12px;margin-bottom:14px}
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

async function open(browser, view, listConfig) {
  const context = await browser.newContext(view.options);
  const styles = readFileSync(path.join(repo, 'src/styles.css'), 'utf8');
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.origin === HOST) {
      return route.fulfill({ contentType: 'text/html', body: HOST_PAGE.replace('__STYLES__', styles) });
    }
    if (url.hostname.endsWith('example.com') || url.hostname.endsWith('cloudfront.net')) {
      return route.fulfill({ contentType: 'text/html', body: OUTSIDE_PAGE });
    }
    return route.abort();
  });
  // the blocked-site list the page downloads (GET /build/link-blocklist)
  await context.addInitScript((config) => { window.listConfig = config; }, listConfig);
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${HOST}/comments/12`);
  await page.addScriptTag({ content: await compileFixture() });
  await page.waitForFunction(() => window.fixtureReady === true);
  let popups = 0;
  context.on('page', () => (popups += 1));
  return { context, page, errors, popups: () => popups };
}

const note = (page) => page.locator('[role="dialog"]');
const shot = async (page, name) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`) });
};
const settle = (page, ms) => page.waitForTimeout(ms);
const skip = !browsers && 'Install existing Playwright tooling or set PLAYWRIGHT_MODULE_PATH';

for (const engine of ['chromium', 'webkit']) {
  for (const view of VIEWS) {
    test(
      `a posted link to a blocked site stays on Twinkle with a note; others open (${engine}, ${view.name})`,
      { skip, timeout: 120000 },
      async () => {
        const browser = await browsers[engine].launch();
        try {
          const { context, page, errors, popups } = await open(browser, view, { hosts: ['bad.example.com'] });
          // the blocked site's preview is replaced; the other one shows
          await page.locator('[data-testid="blocked-link-preview"]').waitFor();
          const blockedPreview = (await page.locator('#blockedPreview').innerText()).replace(/\s+/g, ' ');
          assert.match(blockedPreview, /This site is blocked on Twinkle\. bad\.example\.com/);
          assert.doesNotMatch(blockedPreview, /Free stuff/);
          assert.equal(await page.locator('#blockedPreview a').count(), 0, 'no link left in the blocked preview');
          assert.match(await page.locator('#allowedPreview').innerText(), /Moon - Wikipedia/);
          assert.equal(await page.evaluate(() => window.listLoads), 1, 'one list for the page');

          // tap the blocked link: no tab, the note names the site
          await page.locator('#blocked').click();
          await note(page).waitFor();
          const text = (await note(page).innerText()).replace(/\s+/g, ' ');
          assert.match(text, /This site is blocked on Twinkle\./);
          assert.match(text, /bad\.example\.com/);
          const box = await note(page).boundingBox();
          const viewport = page.viewportSize();
          assert.ok(box.x >= 0 && box.x + box.width <= viewport.width && box.y >= 0 && box.y + box.height <= viewport.height, 'on screen');
          await settle(page, 400);
          await shot(page, `posted-blocked-${engine}-${view.name}`);
          assert.equal(popups(), 0);
          await note(page).getByRole('button', { name: 'OK' }).click();
          await note(page).waitFor({ state: 'detached' });

          // the blocked preview has no link to follow, and a same-tab link to
          // a subdomain of the blocked site stays here
          await page.locator('#sametab').click();
          await note(page).waitFor();
          await settle(page, 300);
          assert.equal(page.url(), `${HOST}/comments/12`);
          await page.keyboard.press('Escape');
          await note(page).waitFor({ state: 'detached' });
          if (!view.options.isMobile) {
            // a middle click or a Cmd/Ctrl click does not open it either
            await page.locator('#blocked').click({ button: 'middle' });
            await note(page).waitFor();
            await page.keyboard.press('Escape');
            await note(page).waitFor({ state: 'detached' });
            await page.locator('#blocked').click({ modifiers: ['ControlOrMeta'] });
            await note(page).waitFor();
            await page.keyboard.press('Escape');
            await note(page).waitFor({ state: 'detached' });
          }
          // the Enter key on a focused link, a real SVG link and an <area>
          await page.locator('#blocked').focus();
          await page.keyboard.press('Enter');
          await note(page).waitFor();
          await page.keyboard.press('Escape');
          await note(page).waitFor({ state: 'detached' });
          await page.locator('#svglink').click();
          await note(page).waitFor();
          assert.match(await note(page).innerText(), /bad\.example\.com/);
          await page.keyboard.press('Escape');
          await note(page).waitFor({ state: 'detached' });
          await page.locator('#mapimg').click();
          await note(page).waitFor();
          await page.keyboard.press('Escape');
          await note(page).waitFor({ state: 'detached' });
          // Twinkle's own attachment host is never guarded: the in-app viewer runs
          await page.locator('#pdf').click();
          assert.equal(await page.evaluate(() => window.pdfViewer), 1);
          await settle(page, 300);
          assert.equal(popups(), 0);
          assert.equal(await note(page).count(), 0);

          // an allowed link opens normally, in a new tab, with no referrer
          const popupPromise = context.waitForEvent('page');
          await page.locator('#allowed').click();
          const popup = await popupPromise;
          await popup.waitForLoadState();
          await popup.waitForFunction(() => document.title.startsWith('{'));
          const outside = JSON.parse(await popup.title());
          assert.equal(outside.href, 'https://en.example.com/wiki/Moon');
          assert.equal(outside.referrer, '');
          assert.equal(await note(page).count(), 0);
          await popup.close();

          // counts only, sent when the page hides
          await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
          const posts = await page.evaluate(() => window.posts || []);
          assert.equal(posts.length, 1);
          assert.equal(posts[0].keepalive, true);
          assert.ok(posts[0].counts.blocked >= 5 && !posts[0].counts.unchecked, JSON.stringify(posts[0]));
          assert.deepEqual(errors, []);
        } finally {
          await browser.close();
        }
      }
    );
  }

  test(
    `the list rules: a tap is held only before any list loads; a 4xx then refuses, a 503 opens (${engine})`,
    { skip, timeout: 120000 },
    async () => {
      const browser = await browsers[engine].launch();
      try {
        // a list that takes 600 ms, tapped at once. Playwright does not
        // enforce the browser's popup tap window, so this shows the decision,
        // not that iPhone Safari opens the tab (that is the real-device check
        // in HANDOFF).
        let run = await open(browser, VIEWS[0], { hosts: ['bad.example.com'], delayMs: 600 });
        // a Twinkle file link keeps its own handler even while the list loads
        await run.page.locator('#pdf').click();
        assert.equal(await run.page.evaluate(() => window.pdfViewer), 1);
        // an outside link with its own handler: held, its handler skipped, one tab
        const popupPromise = run.context.waitForEvent('page');
        await run.page.locator('#handled').click();
        const popup = await popupPromise;
        await popup.waitForLoadState();
        assert.equal(new URL(popup.url()).pathname, '/handled');
        await popup.close();
        await settle(run.page, 300);
        assert.equal(run.popups(), 1, 'one tab');
        assert.equal(await run.page.evaluate(() => window.handlerRan || 0), 0, 'a held tap skips the link handler');
        await run.context.close();
        // the same slow list, a blocked link: the note, no tab
        run = await open(browser, VIEWS[0], { hosts: ['bad.example.com'], delayMs: 600 });
        await run.page.locator('#blocked').click();
        await note(run.page).waitFor();
        assert.equal(run.popups(), 0);
        await run.context.close();

        // no list ever loaded and the server refuses it (4xx): never opened,
        // "Couldn't check"; previews still show
        for (const status of [400, 429]) {
          run = await open(browser, VIEWS[1], { status });
          await run.page.locator('#allowed').click();
          await note(run.page).waitFor();
          const text = (await note(run.page).innerText()).replace(/\s+/g, ' ');
          assert.match(text, /Couldn't check this site\. Try again in a moment\./);
          if (status === 400) await shot(run.page, `posted-unchecked-${engine}-desktop`);
          await settle(run.page, 300);
          assert.equal(run.popups(), 0, `status ${status}`);
          assert.equal(await run.page.locator('[data-testid="blocked-link-preview"]').count(), 0);
          assert.match(await run.page.locator('#allowedPreview').innerText(), /Moon - Wikipedia/);
          await run.context.close();
        }

        // a 503 with no list ever loaded: the link opens unchecked
        run = await open(browser, VIEWS[1], { status: 503 });
        const unchecked = run.context.waitForEvent('page');
        await run.page.locator('#blocked').click();
        await (await unchecked).close();
        await run.context.close();
      } finally {
        await browser.close();
      }
    }
  );
}
