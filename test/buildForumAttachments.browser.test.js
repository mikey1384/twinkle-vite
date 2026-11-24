// Team Forum attachments (Mikey, 11-24; projects/forum-attachments).
// Renders the real Forum thread view, RichText and the shared embed upload
// hook in Chromium, attaches files through the attach button, a paste and a
// drop, and writes desktop and phone screenshots to
// work/forum-attachments/shots/.
import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const { chromium } = require(
  '/Users/mikey/.npm-packages/lib/node_modules/playwright'
);
const repo = fileURLToPath(new URL('..', import.meta.url));
const shots = path.resolve(repo, '../shots');
const CDN = 'https://d3jvoamd2k4p0s.cloudfront.net/attachments/embed';
const imageUrl = `${CDN}/0f8e3a5c-a9f1-11f0-8de9-0242ac120002/1763950000000-k3j9qz.png`;
const pdfUrl = `${CDN}/1a2b3c4d-a9f1-11f0-8de9-0242ac120002/1763950000001-p0d9xa.pdf`;
const replyImageUrl = `${CDN}/2b3c4d5e-a9f1-11f0-8de9-0242ac120002/1763950000002-r8s7tu.png`;

const fixture = `
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faArrowLeft, faComment, faComments, faExternalLinkAlt, faFile, faFileAlt,
  faFileImage, faFilePdf, faPaperclip, faReply, faThumbsUp, faTimes,
  faTrashAlt, faSpinner
} from '@fortawesome/pro-solid-svg-icons';
import Forum from './src/containers/Build/Editor/CollaborationPanel/Forum';
library.add(faArrowLeft, faComment, faComments, faExternalLinkAlt, faFile,
  faFileAlt, faFileImage, faFilePdf, faPaperclip, faReply, faThumbsUp, faTimes,
  faTrashAlt, faSpinner);

const now = Math.floor(Date.now() / 1000);
const thread = {
  id: 7, buildId: 884, userId: 2, username: 'minji', title: 'Level 2 door does not open',
  body: 'When I walk into the blue door on level 2 nothing happens. Screenshot and my notes:\\n![level-2 door.png](${imageUrl})\\n![door bug notes.pdf](${pdfUrl})',
  replyCount: 2, likeCount: 1, createdAt: now - 3600
};
const replies = [
  { id: 31, threadId: 7, buildId: 884, userId: 1, username: 'mikey', body: 'Found it. Here is the fixed door:\\n![](${replyImageUrl})', createdAt: now - 1200 },
  { id: 32, threadId: 7, buildId: 884, userId: 2, username: 'minji', replyToReplyId: 31, replyToUserId: 1, replyToUsername: 'mikey', replyToBody: '![](${replyImageUrl})', body: 'It works now, thanks!', createdAt: now - 600 }
];

function App() {
  const [replyInput, setReplyInput] = useState('');
  const [selected, setSelected] = useState(true);
  window.getReplyInput = () => replyInput;
  window.showList = () => setSelected(false);
  return <MemoryRouter><div className="panel">
    <Forum
      actionLoading="" bodyInput="" canModerate={false} error="" isBranchScope={false}
      loading={false} recentlyCreatedThreadId={0} replyInput={replyInput}
      replyTarget={null} replies={replies} selectedThread={selected ? thread : null}
      showScopeTags={false} threads={[thread, { ...thread, id: 8, title: 'Only a picture', body: '![](${replyImageUrl})' }]}
      titleInput="" userId={1}
      onBackToThreads={() => setSelected(false)} onBodyInputChange={() => {}}
      onCreateReply={() => {}} onCreateThread={() => {}} onDeleteReply={() => {}}
      onDeleteThread={() => {}} onNewsAction={() => {}} onOpenThreadBranch={() => {}}
      onOpenThread={() => setSelected(true)} onReplyInputChange={setReplyInput}
      onReplyTargetChange={() => {}} onTitleInputChange={() => {}}
      onToggleReplyLike={() => {}} onToggleThreadLike={() => {}}
    />
  </div></MemoryRouter>;
}
createRoot(document.getElementById('root')).render(<App/>);
`;

const contextsStub = `
const state = {
  myState: { userId: 1, username: 'mikey', profileTheme: 'logoBlue', fileUploadLvl: 3 },
  requestHelpers: {
    uploadFile: async ({ filePath, fileName, onUploadCompletedMeta, onUploadProgress }) => {
      (window.uploads ||= []).push({ filePath, fileName });
      onUploadProgress?.({ loaded: 1, total: 2 });
      onUploadCompletedMeta?.({ uploadId: 'u1', uploadToken: 't1' });
    },
    saveFileData: async (data) => { (window.savedFiles ||= []).push(data); return {}; }
  },
  state: {}, actions: {}
};
const select = (selector) => selector(state);
export const useKeyContext = select;
export const useAppContext = select;
export const useViewContext = select;
export const useContentContext = select;
export const useChatContext = select;
export const useMissionContext = select;
export const useInputContext = select;
`;

async function compileFixture() {
  const stubs = {
    '~/contexts': contextsStub,
    '~/components/ProfilePic':
      'import React from "react"; export default function ProfilePic({className}) {return <div className={className} style={{aspectRatio:"1",borderRadius:"50%",background:"#c7d7f5"}}/>}',
    '~/components/Texts/UsernameText':
      'import React from "react"; export default function UsernameText({user,className}) {return <b className={className}>{user.username}</b>}',
    '~/components/Modals/ImageModal':
      'import React from "react"; export default function ImageModal({src}) {return <div id="image-modal" data-src={src}/>}',
    './AIAudioButton': 'export default function AIAudioButton() {return null}',
    './ChatMessageTools':
      'export default function ChatMessageTools() {return null}',
    './LazyCodeBlockWrapper':
      'import React from "react"; export default function Code({children}) {return <pre>{children}</pre>}',
    './InternalComponent':
      'export default function InternalComponent() {return null}',
    './YouTubeVideo': 'export default function YouTubeVideo() {return null}'
  };
  const result = await build({
    stdin: { contents: fixture, resolveDir: repo, loader: 'tsx' },
    absWorkingDir: repo,
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    alias: { '~': path.join(repo, 'src') },
    define: {
      'import.meta.env': '{"VITE_CLOUDFRONT_KEY":"d3jvoamd2k4p0s"}',
      'process.env.NODE_ENV': '"development"'
    },
    loader: { '.svg': 'dataurl', '.png': 'dataurl', '.mp3': 'dataurl' },
    plugins: [
      {
        name: 'fixture-stubs',
        setup(b) {
          b.onResolve({ filter: /\?url$/ }, (args) => ({
            path: args.path,
            namespace: 'fixture-url'
          }));
          b.onLoad({ filter: /.*/, namespace: 'fixture-url' }, () => ({
            contents: 'export default "/fixture-asset";'
          }));
          b.onResolve({ filter: /.*/ }, (args) =>
            stubs[args.path]
              ? { path: args.path, namespace: 'fixture-stub' }
              : undefined
          );
          b.onLoad({ filter: /.*/, namespace: 'fixture-stub' }, (args) => ({
            contents: stubs[args.path],
            loader: 'jsx',
            resolveDir: repo
          }));
        }
      }
    ]
  });
  return result.outputFiles[0].text;
}

async function makeScreenshotPng(browser) {
  const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
  await page.setContent(`<body style="margin:0;font-family:sans-serif">
    <div style="width:640px;height:360px;background:linear-gradient(#7cc4ff,#d9f0ff);position:relative">
      <div style="position:absolute;bottom:0;width:100%;height:70px;background:#4caf50"></div>
      <div style="position:absolute;left:420px;bottom:70px;width:70px;height:120px;background:#2f6fde;border:6px solid #173d7a"></div>
      <div style="position:absolute;left:250px;bottom:70px;width:44px;height:44px;background:#ffcc33;border-radius:8px"></div>
      <div style="position:absolute;left:20px;top:16px;font-size:26px;font-weight:800;color:#173d7a">Level 2</div>
    </div></body>`);
  const png = await page.screenshot();
  await page.close();
  return png;
}

test('forum helpers summarize attachment-only posts', async () => {
  const helperBundle = await build({
    entryPoints: [
      path.join(
        repo,
        'src/containers/Build/Editor/CollaborationPanel/helpers/forumAttachments.ts'
      )
    ],
    absWorkingDir: repo,
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'browser',
    alias: { '~': path.join(repo, 'src') },
    define: { 'import.meta.env': '{}' },
    loader: { '.svg': 'dataurl', '.png': 'dataurl', '.mp3': 'dataurl' }
  });
  const {
    summarizeForumBody: summarizeForumBodyForTest,
    buildForumAttachmentMarkup
  } = await import(
    `data:text/javascript;base64,${Buffer.from(helperBundle.outputFiles[0].text).toString('base64')}`
  );
  assert.equal(
    buildForumAttachmentMarkup({ fileName: 'my [cool]\nshot.png', url: imageUrl }),
    `![my cool shot.png](${imageUrl})`
  );
  assert.equal(
    buildForumAttachmentMarkup({ fileName: 'secret', url: imageUrl }),
    `![secret file](${imageUrl})`
  );
  assert.equal(summarizeForumBodyForTest(`![](${imageUrl})`), 'sent an image');
  assert.equal(summarizeForumBodyForTest(`![a.pdf](${pdfUrl})`), 'sent a file');
  assert.equal(
    summarizeForumBodyForTest(`![](${imageUrl}) ![](${pdfUrl})`),
    'sent 2 attachments'
  );
  assert.equal(summarizeForumBodyForTest(`hi\n![](${imageUrl})`), 'hi');
});

test(
  'Team Forum shows images inline, files as cards, and attaches by button, paste and drop',
  { timeout: 120000 },
  async () => {
    mkdirSync(shots, { recursive: true });
    const script = await compileFixture();
    const browser = await chromium.launch();
    try {
      const png = await makeScreenshotPng(browser);
      for (const device of [
        { name: 'desktop', viewport: { width: 1280, height: 1000 }, panel: 560 },
        { name: 'phone', viewport: { width: 390, height: 844 }, panel: 0, mobile: true }
      ]) {
        const context = await browser.newContext({
          viewport: device.viewport,
          deviceScaleFactor: 2,
          isMobile: !!device.mobile,
          hasTouch: !!device.mobile
        });
        await context.route(/^https:\/\/d3jvoamd2k4p0s\.cloudfront\.net\//, (route) =>
          route.fulfill({
            status: 200,
            contentType: route.request().url().endsWith('.pdf')
              ? 'application/pdf'
              : 'image/png',
            body: png
          })
        );
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.setContent(`<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1">
          <style>${readFileSync(path.join(repo, 'src/styles.css'), 'utf8')}
          html,body{height:auto!important;overflow:visible!important} html{font-size:62.5%} body{margin:0;background:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:1.5rem;--chat-text:#1f2937;--ui-border:#d5dbe5;--ui-border-strong:#9fb3cf}
          .panel{box-sizing:border-box;width:100%;max-width:${device.panel ? `${device.panel}px` : 'none'};margin:${device.panel ? '24px auto' : '0'};padding:${device.panel ? '0' : '8px'}}
          </style><div id="root"></div><script>${script}</script>`);
        await page.waitForSelector('img[src*="1763950000000"]');
        await page.waitForFunction(() =>
          Array.from(document.images).every((img) => img.complete && img.naturalWidth > 0)
        );

        // Image inline, the PDF as a download card named by the member.
        const fileCard = page.locator('.rich-text-file-card:visible');
        assert.equal(await fileCard.count(), 1);
        assert.match(await fileCard.innerText(), /door bug notes\.pdf/);
        assert.equal(await fileCard.getAttribute('href'), pdfUrl);
        assert.equal(
          await page.locator(`img[src="${replyImageUrl}"]:visible`).count(),
          1
        );
        // The quoted image-only reply reads as words, not markup.
        assert.ok((await page.innerText('body')).includes('sent an image'));
        assert.ok(!(await page.innerText('body')).includes('![]('));

        await page.screenshot({
          path: path.join(shots, `forum-thread-${device.name}.png`),
          fullPage: true
        });

        // Tap an image to view it full size (the shared ImageModal).
        await page.locator(`img[src="${imageUrl}"]:visible`).click();
        assert.equal(
          await page.locator('#image-modal').getAttribute('data-src'),
          imageUrl
        );

        if (device.name === 'desktop') {
          await page.fill('textarea', 'Look at this:');
          // Attach button -> shared embed upload -> ![name](url) in the body.
          await page.setInputFiles('input[type=file]', {
            name: 'button pick.png',
            mimeType: 'image/png',
            buffer: png
          });
          await page.waitForFunction(() => /button pick\.png/.test(window.getReplyInput()));
          // Paste a screenshot.
          await page.evaluate(async () => {
            const blob = await (await fetch(document.querySelector('img').src)).blob();
            const data = new DataTransfer();
            data.items.add(new File([blob], '', { type: 'image/png' }));
            const textarea = document.querySelector('textarea');
            textarea.dispatchEvent(
              new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true })
            );
          });
          await page.waitForFunction(() => /pasted-image\.png/.test(window.getReplyInput()));
          // Drop a file onto the box.
          await page.evaluate(() => {
            const data = new DataTransfer();
            data.items.add(new File(['hello'], 'level plan.txt', { type: 'text/plain' }));
            const textarea = document.querySelector('textarea');
            textarea.dispatchEvent(new DragEvent('drop', { dataTransfer: data, bubbles: true, cancelable: true }));
          });
          await page.waitForFunction(() => /level plan\.txt/.test(window.getReplyInput()));
          const value = await page.evaluate(() => window.getReplyInput());
          const [typed, ...lines] = value.split('\n');
          assert.equal(typed, 'Look at this:');
          // The box shows only the words; files show as chips.
          assert.equal(await page.inputValue('textarea'), 'Look at this:');
          assert.equal(await page.locator('button[aria-label^="Remove "]').count(), 3);
          assert.equal(lines.length, 3);
          for (const line of lines) {
            assert.match(
              line,
              /^!\[[^\]]+\]\(https:\/\/d3jvoamd2k4p0s\.cloudfront\.net\/attachments\/embed\/[0-9a-f-]{36}\/[^)]+\)$/
            );
          }
          const saved = await page.evaluate(() => window.savedFiles);
          assert.deepEqual(
            saved.map((file) => file.rootType),
            ['embed', 'embed', 'embed']
          );
          // Typing keeps the attachments after the words.
          await page.fill('textarea', 'Look at these:');
          assert.match(
            await page.evaluate(() => window.getReplyInput()),
            /^Look at these:\n!\[button pick\.png\]/
          );
          await page.screenshot({
            path: path.join(shots, 'forum-composer-desktop.png'),
            fullPage: true
          });
          await page.click('button[aria-label="Remove pasted-image.png"]');
          const afterRemove = await page.evaluate(() => window.getReplyInput());
          assert.ok(!afterRemove.includes('pasted-image.png'));
          assert.equal(afterRemove.split('\n').length, 3);
          // Topic list previews read as words.
          await page.evaluate(() => window.showList());
          await page.waitForSelector('text=Only a picture');
          assert.ok((await page.innerText('body')).includes('sent an image'));
          await page.screenshot({
            path: path.join(shots, 'forum-topics-desktop.png'),
            fullPage: true
          });
        }
        assert.deepEqual(errors, []);
        await context.close();
      }
    } finally {
      await browser.close();
    }
  }
);
