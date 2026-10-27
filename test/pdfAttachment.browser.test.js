import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const {
  chromium,
  webkit
} = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const PDFDocument = require('../../twinkle-api/node_modules/pdfkit');
const repo = fileURLToPath(new URL('..', import.meta.url));
const out = path.resolve(
  repo,
  '../work/companion-file-sharing-20261027/browser'
);
mkdirSync(out, { recursive: true });
const pdfName =
  'Báo cáo học tập_학습 보고서_very-long-file-name-for-a-phone.pdf';
const pdfUrl = `https://d3jvoamd2k4p0s.cloudfront.net/attachments/edited-image/chat/123/test/${encodeURIComponent(pdfName)}`;
const pdfRoot = path.join(repo, 'node_modules/pdfjs-dist');
const pdfVersion = JSON.parse(
  readFileSync(path.join(pdfRoot, 'package.json'))
).version;
const fixture = `
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {library} from '@fortawesome/fontawesome-svg-core';
import {faTimes,faFilePdf,faExternalLinkAlt,faSpinner} from '@fortawesome/pro-solid-svg-icons';
import FileInfo from './src/containers/Chat/Message/MessageBody/FileAttachment/FileInfo';
import FileDownload from './src/components/Texts/RichText/Markdown/EmbeddedComponent/FileDownload';
import PdfAttachmentLink from './src/components/PdfAttachment/Link';
import AttachmentDialog from './src/containers/Chat/SharedMedia/AttachmentDialog';
import {getPdfAttachmentName,loadPdfAttachment} from './src/helpers/pdfAttachment';
library.add(faTimes,faFilePdf,faExternalLinkAlt,faSpinner);
window.getPdfAttachmentName=getPdfAttachmentName;
window.loadPdfAttachment=loadPdfAttachment;
function App(){
 const [config,setConfig]=useState({});
 window.setCase=value=>setConfig({...value,sequence:Math.random()});
 const url=config.url||${JSON.stringify(pdfUrl)};
 const name=${JSON.stringify(pdfName)};
 return <main key={config.sequence} data-website-agent-ui={config.floating ? 'true' : undefined} onClick={()=>window.parentClicks++}>
  <h1>{config.agent||'Zero'}</h1>
  {config.kind==='shared' && <AttachmentDialog item={{id:1,fileType:'file',url,name}} action={config.action||''} error={config.error||''} onClose={()=>setConfig({})} onDownload={()=>window.sharedDownloads++} onJump={()=>window.sharedJumps++}/>}
  {config.kind==='link'?<p>Here is your <PdfAttachmentLink href={url} target="_blank" rel="noopener noreferrer">PDF report</PdfAttachmentLink>.</p>:
   config.kind==='preview'?<FileDownload fileName={name} fileType="pdf" src={url} openFile={false}/>:
   <FileInfo fileName={name} fileType="pdf" fileSize={1024} src={url} theme="logoBlue"/>}
 </main>;
}
createRoot(document.getElementById('root')).render(<App/>);
`;
let script;
export async function compile() {
  if (script) return script;
  const stubs = {
    '~/helpers': `export const isMobile=()=>/iPhone/.test(navigator.userAgent); export const isTablet=()=>false;`,
    '~/helpers/stringHelpers': `export const renderFileSize=n=>n+' bytes';`,
    '~/theme/hooks/useRoleColor': `export const useRoleColor=()=>({color:'#2466c3'});`,
    '~/helpers/ownerTrace': `export const recordOwnerTrace=(type,data)=>{(window.traceEvents||=[]).push({type,data});};`,
    '~/components/ErrorBoundary': `import React from 'react';export default({children,style})=><div style={style}>{children}</div>;`,
    './Browser': `export const sharedMediaModalClass='';`,
    '~/components/Modals/ImageModal': `export default()=>null;`,
    '~/components/VideoPlayer': `export default()=>null;`
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
        name: 'fixture-services',
        setup(builder) {
          builder.onResolve({ filter: /\?url$/ }, ({ path }) => ({
            path,
            namespace: 'url'
          }));
          builder.onLoad({ filter: /.*/, namespace: 'url' }, () => ({
            contents: `export default ${JSON.stringify(process.env.PDF_ATTACHMENT_PREVIEW ? '/pdf.worker.min.mjs' : 'https://pdf-release.twinkle.test/assets/pdf.worker.min.mjs')};`
          }));
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

export async function makePdf() {
  const document = new PDFDocument({ size: 'A4', margin: 44 });
  if (process.env.PDF_ATTACHMENT_PREVIEW) {
    document.font(require.resolve('../../twinkle-api/node_modules/@expo-google-fonts/noto-sans/400Regular/NotoSans_400Regular.ttf'));
  }
  const chunks = [];
  const complete = new Promise((resolve, reject) => {
    document.on('data', (chunk) => chunks.push(chunk));
    document.on('end', () => resolve(Buffer.concat(chunks)));
    document.on('error', reject);
  });
  document.fontSize(25).text('Your learning report');
  document
    .moveDown()
    .fontSize(14)
    .text(
      'Zero and Ciel can prepare a PDF, preview every page and share a copy.'
    );
  document.moveDown().text('A fixture document. No member information.');
  document.rect(44, 230, 500, 70).fill('#dbeafe');
  document.fillColor('#163153').fontSize(19).text('Ready to share', 60, 252);
  if (!process.env.PDF_ATTACHMENT_PREVIEW) {
    // Symbol requires PDF.js's standard-font asset rather than a system font.
    document.font('Symbol').fontSize(12).text('abc', 44, 700);
    document.font('Helvetica');
  }
  document.addPage().fontSize(25).text('Second page');
  document
    .moveDown()
    .fontSize(14)
    .text('This page verifies that the preview does not stop after page one.');
  document.end();
  const bytes = await complete;
  writeFileSync(path.join(out, 'fixture.pdf'), bytes);
  return bytes;
}

async function setCase(page, value = {}) {
  await page.evaluate((value) => {
    window.setCase(value);
    window.parentClicks = 0;
  }, value);
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      )
  );
}

for (const [engine, browserType] of Object.entries(process.env.PDF_ATTACHMENT_PREVIEW ? {} : { chromium, webkit })) {
  test(
    `PDF preview and actual file sharing (${engine})`,
    { timeout: 120000 },
    async () => {
      const [bundle, pdf] = await Promise.all([compile(), makePdf()]);
      const browser = await browserType.launch();
      const errors = [];
      let fileRequests = 0;
      const pdfAssetOrigins = [];
      let responseMode = 'pdf';
      let hold;
      const diagnostics = [];
      let page;
      try {
        const context = await browser.newContext({
          viewport: { width: 390, height: 844 },
          userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile Safari/604.1',
          serviceWorkers: 'block'
        });
        // WebKit also routes blob: requests through **/*. Leave generated
        // worker bootstraps to the browser rather than serving fixture HTML.
        await context.route(/^https?:\/\//, async (route) => {
          const url = new URL(route.request().url());
          if (url.hostname === 'd3jvoamd2k4p0s.cloudfront.net') {
            fileRequests++;
            if (responseMode === 'hold')
              await new Promise((resolve) => {
                hold = resolve;
              });
            return route.fulfill({
              status: responseMode === 'fail' ? 503 : 200,
              headers: {
                'access-control-allow-origin': '*',
                'content-disposition': 'attachment; filename="old.pdf"'
              },
              contentType:
                responseMode === 'html' ? 'text/html' : 'application/pdf',
              body:
                responseMode === 'html' ? '<h1>Expired attachment</h1>' : pdf
            });
          }
          if (url.pathname === '/assets/pdf.worker.min.mjs')
            return route.fulfill({
              headers: { 'access-control-allow-origin': '*' },
              contentType: 'text/javascript',
              body: readFileSync(
                path.join(pdfRoot, 'legacy/build/pdf.worker.min.mjs')
              )
            });
          if (url.pathname.startsWith(`/assets/pdfjs/${pdfVersion}/`)) {
            pdfAssetOrigins.push(url.origin);
            const relative = url.pathname.slice(
              `/assets/pdfjs/${pdfVersion}/`.length
            );
            return route.fulfill({
              headers: { 'access-control-allow-origin': '*' },
              contentType: relative.endsWith('.wasm')
                ? 'application/wasm'
                : 'application/octet-stream',
              body: readFileSync(path.join(pdfRoot, relative))
            });
          }
          return route.fulfill({
            contentType: 'text/html',
            body: `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"/><style>${readFileSync(path.join(repo, 'src/styles.css'), 'utf8')}main{padding:16px;max-width:640px;margin:auto}body{margin:0}</style></head><body><div id="root"></div><div id="outer-layer"></div></body></html>`
          });
        });
        page = await context.newPage();
        page.setDefaultTimeout(10000);
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('console', message => { if (['error','warning'].includes(message.type())) diagnostics.push(message.text()); });
        page.on('requestfailed', request => diagnostics.push(`${request.url()}: ${request.failure()?.errorText}`));
        await page.goto('http://localhost:3000/pdf-fixture');
        await page.evaluate(() => {
          window.shareMode = 'success';
          window.shares = [];
          window.activeUrls = [];
          window.revokedUrls = [];
          window.urlTypes = {};
          window.activeWorkers = new Set();
          window.Worker = class extends window.Worker {
            constructor(...args) {
              super(...args);
              window.activeWorkers.add(this);
            }
            terminate() {
              window.activeWorkers.delete(this);
              super.terminate();
            }
          };
          const create = URL.createObjectURL.bind(URL),
            revoke = URL.revokeObjectURL.bind(URL);
          URL.createObjectURL = (blob) => {
            const url = create(blob);
            window.activeUrls.push(url);
            window.urlTypes[url] = blob.type;
            return url;
          };
          URL.revokeObjectURL = (url) => {
            window.revokedUrls.push(url);
            revoke(url);
          };
          Object.defineProperty(navigator, 'canShare', {
            configurable: true,
            value: ({ files }) =>
              window.shareMode !== 'unsupported' && files?.length === 1
          });
          Object.defineProperty(navigator, 'share', {
            configurable: true,
            value: async (data) => {
              window.shares.push({
                keys: Object.keys(data),
                name: data.files[0].name,
                type: data.files[0].type,
                size: data.files[0].size,
                active: navigator.userActivation?.isActive
              });
              if (window.shareMode === 'cancel')
                throw new DOMException('Canceled', 'AbortError');
              if (window.shareMode === 'fail')
                throw new DOMException('No target', 'NotAllowedError');
            }
          });
        });
        await page.addScriptTag({ content: bundle });
        await page.waitForFunction(() => typeof window.setCase === 'function');
        assert.equal(
          fileRequests,
          0,
          'chat scrolling must not fetch every PDF'
        );
        for (const [agent, width] of [
          ['Zero', 360],
          ['Ciel', 390],
          ['Ciel', 1280]
        ]) {
          await page.setViewportSize({ width, height: 844 });
          await setCase(page, { agent, floating: true });
          await page.getByRole('link', { name: `Open ${pdfName}` }).click();
          await page.waitForFunction(() =>
            document.querySelector('[data-pdf-page="1"] canvas')
          );
          assert.match(
            await page.getByLabel('Page 1 text').textContent(),
            /Your learning report/
          );
          assert.equal(await page.evaluate(() => window.parentClicks), 0);
          const bounds = await page.getByRole('dialog').boundingBox();
          assert.ok(
            bounds.x >= -1 && bounds.x + bounds.width <= width + 1,
            'dialog fits phone'
          );
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth
            ),
            false,
            'no horizontal page overflow'
          );
          assert.equal(
            await page
              .getByRole('dialog')
              .evaluate(
                (el) =>
                  Number(getComputedStyle(el.parentElement).zIndex) > 2147482999
              ),
            true,
            'preview opens above the companion dock'
          );
          await page.getByRole('button', { name: 'Next', exact: true }).click();
          await page.waitForFunction(() =>
            document.querySelector('[data-pdf-page="2"] canvas')
          );
          assert.match(
            await page.getByLabel('Page 2 text').textContent(),
            /Second page/
          );
          await page
            .getByRole('button', { name: 'Previous', exact: true })
            .click();
          await page.waitForFunction(() =>
            document.querySelector('[data-pdf-page="1"] canvas')
          );
          await page.screenshot({
            path: path.join(out, `${engine}-${width}.png`)
          });
          await page
            .getByRole('button', { name: 'Share a copy', exact: true })
            .click();
          const shared = await page.evaluate(() => window.shares.at(-1));
          assert.deepEqual(shared, {
            keys: ['files'],
            name: pdfName,
            type: 'application/pdf',
            size: pdf.length,
            active: true
          });
          const downloaded = page.waitForEvent('download');
          await page
            .getByRole('link', { name: 'Download', exact: true })
            .click();
          // WebKit/macOS normalizes saved filenames to decomposed Unicode.
          assert.equal(
            (await downloaded).suggestedFilename().normalize('NFC'),
            pdfName.normalize('NFC')
          );
          await page.getByRole('button', { name: 'Close modal' }).click();
          await page.getByRole('dialog').waitFor({ state: 'detached' });
        }
        // Ordinary Markdown-style links use the same viewer, from the keyboard.
        await page.setViewportSize({ width: 390, height: 844 });
        await setCase(page, { kind: 'link' });
        await page.getByRole('link', { name: 'PDF report' }).press('Enter');
        await page.getByRole('button', { name: 'Share a copy' }).waitFor();
        assert.equal(
          await page.getByRole('dialog').evaluate(el =>
            Number(getComputedStyle(el.parentElement).zIndex) < 2147482999
          ),
          true,
          'ordinary-page previews keep the shared modal layer'
        );
        await page.evaluate(() => {
          window.shareMode = 'cancel';
        });
        await page.getByRole('button', { name: 'Share a copy' }).click();
        assert.equal(await page.getByRole('dialog').count(), 1);
        assert.equal(await page.getByRole('alert').count(), 0);
        await page.evaluate(() => {
          window.shareMode = 'fail';
        });
        await page.getByRole('button', { name: 'Share a copy' }).click();
        await page
          .getByText('Could not share this copy. Try again, or download it.')
          .waitFor();
        await page.keyboard.press('Escape');
        await page.getByRole('dialog').waitFor({ state: 'detached' });
        await page.evaluate(() => {
          window.shareMode = 'unsupported';
        });
        await setCase(page);
        await page.getByRole('link', { name: `Open ${pdfName}` }).click();
        await page
          .getByText(
            'File sharing is not available in this browser. You can still download a copy.'
          )
          .waitFor();
        assert.equal(
          await page.getByRole('button', { name: 'Share a copy' }).count(),
          0
        );
        assert.equal(
          await page
            .getByRole('link', { name: 'Download', exact: true })
            .count(),
          1
        );
        await page.keyboard.press('Escape');
        await page.getByRole('dialog').waitFor({ state: 'detached' });
        responseMode = 'html';
        await setCase(page);
        await page.getByRole('link', { name: `Open ${pdfName}` }).click();
        await page
          .getByText('This attachment is not a readable PDF.')
          .waitFor();
        responseMode = 'pdf';
        await page.getByRole('button', { name: 'Try again' }).click();
        await page.waitForFunction(() =>
          document.querySelector('[data-pdf-page="1"] canvas')
        );
        await page.keyboard.press('Escape');
        await page.getByRole('dialog').waitFor({ state: 'detached' });
        // Shared-media controls keep their canonical access-checked callbacks.
        await page.evaluate(() => { window.sharedDownloads=0; window.sharedJumps=0; });
        await setCase(page, {kind:'shared'});
        await page.getByRole('button', {name:'Download',exact:true}).click();
        await page.getByRole('button', {name:'Show in chat',exact:true}).click();
        assert.deepEqual(await page.evaluate(() => [window.sharedDownloads,window.sharedJumps]), [1,1]);
        await setCase(page, {kind:'shared',action:'jump',error:'Attachment was removed.'});
        assert.equal(await page.getByRole('button', {name:'Download',exact:true}).isDisabled(), true);
        await page.getByRole('alert').filter({hasText:'Attachment was removed.'}).waitFor();
        await page.keyboard.press('Escape');
        await page.getByRole('dialog').waitFor({ state: 'detached' });
        // Closing a slow request cannot reopen a stale viewer or leak a blob URL.
        responseMode = 'hold';
        await setCase(page);
        await page.getByRole('link', { name: `Open ${pdfName}` }).click();
        await page.getByText('Opening PDF…').waitFor();
        await page.keyboard.press('Escape');
        if (hold) hold();
        await page.getByRole('dialog').waitFor({ state: 'detached' });
        responseMode = 'pdf';
        const before = fileRequests;
        await setCase(page, { kind: 'preview' });
        assert.equal(await page.getByRole('link').count(), 0);
        assert.equal(
          fileRequests,
          before,
          'Home static previews stay non-interactive'
        );
        const hostChecks = await page.evaluate(
          ({ pdfUrl }) => [
            window.getPdfAttachmentName(pdfUrl),
            ...[
              'https://example.com/attachments/a.pdf',
              'https://d3jvoamd2k4p0s.cloudfront.net.evil.test/attachments/a.pdf',
              'https://user@d3jvoamd2k4p0s.cloudfront.net/attachments/a.pdf',
              'javascript:alert(1)',
              'https://d3jvoamd2k4p0s.cloudfront.net/attachments/a.pdf.exe'
            ].map(window.getPdfAttachmentName)
          ],
          { pdfUrl }
        );
        assert.deepEqual(hostChecks, [pdfName, null, null, null, null, null]);
        await page.waitForFunction(() => window.activeWorkers.size === 0);
        const unrevoked = await page.evaluate(() =>
          window.activeUrls.filter((url) => !window.revokedUrls.includes(url)).map(url => window.urlTypes[url])
        );
        assert.deepEqual(unrevoked, ['text/javascript'],
          'all PDF URLs and workers are released; only the reusable module bootstrap remains');
        const traces = await page.evaluate(() => window.traceEvents);
        assert.ok(
          traces.some(
            (e) => e.data.phase === 'render' && e.data.result === 'ready'
          )
        );
        assert.ok(
          traces.some(
            (e) => e.data.phase === 'share' && e.data.result === 'canceled'
          )
        );
        assert.equal(
          JSON.stringify(traces).includes(pdfName),
          false,
          'diagnostics contain no filenames or document text'
        );
        assert.deepEqual(errors, []);
        assert.ok(pdfAssetOrigins.length > 0, 'the sample loads standard font assets');
        assert.deepEqual([...new Set(pdfAssetOrigins)], ['https://pdf-release.twinkle.test'],
          'an old tab loads fonts and decoders from its worker deployment');
      } catch (error) {
        writeFileSync(path.join(out, `${engine}-failure.json`), JSON.stringify({
          diagnostics, errors, body: await page?.locator('body').innerText().catch(()=>'')
        }, null, 2));
        throw error;
      } finally {
        if (hold) hold();
        await browser.close();
      }
    }
  );
}
