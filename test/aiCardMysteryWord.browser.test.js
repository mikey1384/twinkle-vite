import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const {
  chromium,
  webkit
} = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const artifacts = fileURLToPath(
  new URL('../../work/ai-card-hidden-word-20261002', import.meta.url)
);

// Real card renderers and formatting, with local account/data services. Start
// with the old cached payload from the report: hidden quality, exposed word.
const fixture = `
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import AICard from './src/components/AICard';
import AICardDetails from './src/components/AICardDetails';
import CardThumb from './src/components/CardThumb';
import AICardSummonContent from './src/components/AICardSummonContent';
import CardItem from './src/containers/Chat/RightMenu/AICardInfo/CardItem';
import CompactPreview from './src/components/Texts/RichText/Markdown/EmbeddedComponent/InternalComponent/AICardComponent/CompactPreview';
import CardStrip from './src/components/Texts/RichText/Markdown/EmbeddedComponent/InternalComponent/AICardComponent/CardStrip';
function Fixture() {
  const [patch, setPatch] = useState({});
  window.updateFixtureCard = setPatch;
  const card = {id:78978,word:'air',prompt:'???',quality:'???',isTotalMystery:1,isMysteryCard:true,
    imagePath:'',isBurned:0,level:1,style:'???',timeStamp:1790850000,
    ownerId:17,owner:{id:17,username:'owner'},creator:{id:17,username:'owner'},...patch};
  window.fixtureCard=card;
  return <MemoryRouter><main>
    <section data-surface="embedded"><h2>Embedded card</h2><CompactPreview card={card}/></section>
    <section data-surface="sidebar"><h2>Chat sidebar</h2><CardItem card={card} isOverflown={false} isLast/></section>
    <section data-surface="thumbnail"><h2>Profile and picker thumbnail</h2><CardThumb card={card} detailed/></section>
    <section data-surface="collection"><h2>Collection preview</h2><CardStrip cardIds={[card.id]} onSelect={()=>{}}/></section>
    <section data-surface="summon"><h2>Summon post</h2><AICardSummonContent card={card}/></section>
    <section data-surface="home"><h2>Home summon preview</h2><AICardSummonContent card={card} compact/></section>
    <section data-surface="modal"><h2>Modal details</h2><AICardDetails card={card}/></section>
    <section data-surface="card"><h2>Card detail overlay</h2><AICard card={card} detailShown/></section>
  </main></MemoryRouter>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);
`;

let bundle;
async function compileFixture() {
  if (bundle) return bundle;
  const stubs = {
    '~/contexts': `
      const account={myState:{userId:17},theme:{userLink:{color:'logoBlue'},chatUnread:{color:'logoBlue'},xpNumber:{color:'logoGreen'}}};
      const actions={onUpdateAICard:()=>{}};
      export const useKeyContext=select=>select(account);
      export const useAppContext=select=>select({requestHelpers:{loadAICard:async()=>({card:window.fixtureCard})}});
      export const useChatContext=select=>select({state:{cardObj:{[window.fixtureCard.id]:window.fixtureCard}},actions});
    `,
    '~/helpers':
      'export const isMobile=()=>false; export const isTablet=()=>false;',
    '~/theme/hooks/useRoleColor':
      'export const useRoleColor=()=>({getColor:()=>"#418ceb"});',
    '~/components/Icon': 'export default ()=>null;',
    '~/components/ErrorBoundary': 'export default ({children})=>children;',
    '~/components/Loading': 'export default ()=>null;',
    '~/components/Texts/UsernameText':
      'export default ({user})=><b>{user?.username}</b>;',
    '~/components/Button':
      'export default ({children,onClick,style})=><button onClick={onClick} style={style}>{children}</button>;',
    '~/components/Modals/AICardModal': 'export default ()=>null;'
  };
  const result = await build({
    stdin: { contents: fixture, resolveDir: repo, loader: 'tsx' },
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    jsx: 'automatic',
    alias: {
      '~': path.join(repo, 'src'),
      'react-sanitized-html': path.join(
        repo,
        'src/shims/react-sanitized-html.tsx'
      )
    },
    loader: { '.webp': 'dataurl', '.gif': 'dataurl' },
    define: {
      'import.meta.env': '{}',
      'process.env.NODE_ENV': '"development"'
    },
    plugins: [
      {
        name: 'mystery-word-fixture',
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
  bundle = result.outputFiles[0].text;
  return bundle;
}

for (const engine of ['chromium', 'webkit']) {
  test(
    `total mystery words stay hidden across card surfaces (${engine})`,
    { timeout: 300000 },
    async () => {
      const script = await compileFixture();
      console.log(engine + ': fixture compiled');
      const browser = await { chromium, webkit }[engine].launch();
      console.log(engine + ': browser launched');
      try {
        const page = await browser.newPage({
          viewport: { width: 1280, height: 1000 }
        });
        page.setDefaultTimeout(30000);
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.route('**/revealed.png', (route) =>
          route.fulfill({
            contentType: 'image/svg+xml',
            body: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300"><rect width="200" height="300" fill="#418ceb"/></svg>'
          })
        );
        await page.setContent(
          `<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><style>${readFileSync(path.join(repo, 'src/styles.css'), 'utf8')}
        body{background:#fffbee}main{max-width:1100px;margin:20px auto;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
        section{background:white;border:1px solid #ddd;padding:16px;min-width:0}h2{font-size:1.5rem;margin-bottom:16px}
        @media(max-width:600px){main{grid-template-columns:1fr}}
      </style><div id="animation"></div><div id="root"></div>`,
          { waitUntil: 'domcontentloaded' }
        );
        await page.addScriptTag({ content: script });
        console.log(engine + ': fixture mounted');
        await page
          .locator('[data-surface="embedded"] .compact-ai-card-preview__word')
          .waitFor();
        async function assertHidden() {
          const surfaces = await page.evaluate(async () => {
            await new Promise(requestAnimationFrame);
            return [...document.querySelectorAll('[data-surface]')].map(
              (el) => ({
                name: el.dataset.surface,
                text: el.innerText,
                html: el.outerHTML
              })
            );
          });
          assert.equal(surfaces.length, 8);
          for (const { name, text, html } of surfaces) {
            assert.doesNotMatch(text, /\bair\b/i, name);
            assert.match(text, /\?\?\?/, name);
            assert.doesNotMatch(html, /\bair\b/i, name + ' attributes');
          }
        }
        await assertHidden();
        console.log(engine + ': cached mystery payload checked');
        // Streamed image previews must not finish the mystery's text reveal.
        await page.evaluate(() =>
          window.updateFixtureCard({
            imagePath: 'generating...',
            imageGenerationPreviewUrl:
              'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
            isTotalMystery: true
          })
        );
        await assertHidden();
        // The API mask is safe for shipping clients that compile the word as
        // a regular expression. The current renderer presents it as ???.
        await page.evaluate(() => window.updateFixtureCard({ word: '•••' }));
        await assertHidden();
        // Tolerate old/local ??? payloads without compiling the placeholder.
        await page.evaluate(() => window.updateFixtureCard({ word: '???' }));
        await assertHidden();
        mkdirSync(artifacts, { recursive: true });
        for (const width of [1280, 390]) {
          await page.setViewportSize({ width, height: 1000 });
          await page.evaluate(() => window.updateFixtureCard({}));
          await assertHidden();
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.screenshot({
            path: path.join(artifacts, engine + '-' + width + '.png')
          });
          await page.locator('[data-surface="modal"]').scrollIntoViewIfNeeded();
          await page.screenshot({
            path: path.join(artifacts, engine + '-' + width + '-details.png')
          });
        }
        for (const visible of [
          {
            isTotalMystery: 0,
            quality: 'rare',
            prompt: 'Fresh air filled the room.',
            style: 'watercolor'
          },
          {
            isTotalMystery: 1,
            imagePath: '/revealed.png',
            quality: 'rare',
            prompt: 'Fresh air filled the room.',
            style: 'watercolor',
            isMysteryCard: false
          }
        ]) {
          await page.evaluate(
            (patch) => window.updateFixtureCard(patch),
            visible
          );
          await page.waitForFunction(
            () =>
              document.querySelector('.compact-ai-card-preview__word')
                .textContent === 'air'
          );
          const surfaces = await page.evaluate(() =>
            [...document.querySelectorAll('[data-surface]')].map((el) => ({
              name: el.dataset.surface,
              text: el.innerText
            }))
          );
          for (const { name, text } of surfaces) {
            assert.match(text, /\bair\b/i, name);
          }
        }
        await page.evaluate(() =>
          window.updateFixtureCard({
            isTotalMystery: 1,
            isBurned: 1,
            quality: 'rare',
            prompt: 'Fresh air filled the room.'
          })
        );
        await page.waitForFunction(
          () =>
            document.querySelector('.compact-ai-card-preview__word')
              .textContent === 'air'
        );
        assert.deepEqual(errors, []);
      } finally {
        await browser.close();
      }
    }
  );
}
