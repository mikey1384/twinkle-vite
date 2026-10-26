import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const { chromium, webkit } = require(
  process.env.PLAYWRIGHT_MODULE ||
    '/Users/mikey/.npm-packages/lib/node_modules/playwright'
);
const repo = fileURLToPath(new URL('..', import.meta.url));
const feedSource = readFileSync(
  path.join(repo, 'src/containers/Home/Stories/FeedCard/index.tsx'),
  'utf8'
);
const cardStyles = feedSource.match(/const cardClass = css`[\s\S]*?\n`;/)[0];
const sizingStyle = feedSource.match(/const sizingStyle = \{[\s\S]*?\n  \}/)[0];
const artifacts = process.env.FEED_MEDIA_ARTIFACTS ||
  path.join(repo, '../work/home-feed-subject-media');

const hooksSource = readFileSync(path.join(repo, 'src/helpers/hooks/index.tsx'), 'utf8');
const lazyLoadHook = hooksSource.slice(
  hooksSource.indexOf('export function useLazyLoad({'),
  hooksSource.indexOf('export function useMyState')
);
const helpersSource = readFileSync(path.join(repo, 'src/helpers/index.ts'), 'utf8');
const throttleSource = helpersSource.slice(
  helpersSource.indexOf('export function throttle<'),
  helpersSource.indexOf('/**', helpersSource.indexOf('export function throttle<'))
);

// Render the real feed Body, ImagePreview, RichText, footer and frame styles.
// Isolate services and the image modal; no server-owned state is changed.
const fixture = `
import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import {css} from '@emotion/css';
import {Color,borderRadius,desktopMinWidth,mobileMaxWidth,tabletMaxWidth} from './src/constants/css';
import Body from './src/containers/Home/Stories/FeedCard/Body';
import HomeFeedCard from './src/containers/Home/Stories/FeedCard';
import Actions from './src/containers/Home/Stories/FeedCard/Actions';
import {getFeedCardSizing} from './src/containers/Home/Stories/FeedCard/helpers/sizing';
const SHOWCASE_CARD_CLASS='home-feed-card--showcase';
${cardStyles}
window.actions=[];
function Fixture(){
 const [sample,setSample]=useState('wide');
 window.configureSubject=setSample;
 const filename=sample==='file'?'worksheet.pdf':'photo.svg';
 const subject={id:2,contentId:2,contentType:'subject',loaded:true,title:'epic photo that i found',rewardLevel:1,
  description:'? : How many times have u watched this?\\nMe : yes',
  secretAnswer:sample==='no-secret'?'':'If u know it, u know it.\\nIf u don’t, u don’t.',
  secretShown:sample!=='locked',isSecret:sample==='locked',hasSecretAnswer:sample!=='no-secret',
  filePath:'fixture/'+sample,fileName:filename,
  uploader:{id:2,username:'Kiwi_Da_Bird'}};
 if(sample==='markdown'){subject.description+='\\n\\n![Full image](https://cdn.example.com/wide/photo.svg)';delete subject.filePath;delete subject.fileName;}
 if(sample==='long'){subject.title='A much longer title that wraps across several lines on a narrow phone';subject.description='A detailed description with enough words to fill the preview. '.repeat(20);subject.secretAnswer='A longer secret message with a useful response. '.repeat(10);}
 if(sample==='secret-attachment'){subject.secretAnswer='';subject.secretAttachment={filePath:'fixture/portrait',fileName:'photo.svg'};}
 if(sample==='scroll-essay'){
  subject.title='Do you think this is enough for JLee? Which parts should I practice more?';
  subject.description='@Zero @Ciel @AdorableBunny @mikey @livv @Laserkwi @OverClassified\\nI tagged the smartest users I know';
  subject.rewardLevel=4;subject.filePath='fixture/portrait';
  subject.secretAnswer='Conclusion';subject.secretAttachment={filePath:'fixture/portrait',fileName:'photo.svg'};
  subject.commentsLoaded=true;subject.commentsCount=32;subject.comments=[{id:3,content:'Practice learning more vocabulary and more complex sentences.',uploader:{id:3,username:'adle'}}];
 }
 window.scrollSubject=sample==='scroll-essay'?subject:null;
 const content=subject,rootObj={};
 const sizing=getFeedCardSizing({content,rootObj,userId:1});
 ${sizingStyle};
 const action=name=>event=>{event.stopPropagation();window.actions.push(name)};
 if(sample==='scroll-essay')return <MemoryRouter><main className="fixture">
  <div style={{height:1800}}/><div data-tracked-card><HomeFeedCard feed={subject} index={0} totalCount={1}/></div>
  <div data-following-card style={{height:2200,background:'#edf3fb'}}>Following post</div>
 </main></MemoryRouter>;
 return <MemoryRouter><main className="fixture"><article className={cardClass} style={sizingStyle}>
  <header className="heading"><div><b>Kiwi_Da_Bird started a subject</b><small>2 days ago</small></div></header>
  <Body content={content} rootObj={rootObj} loading={false} sizing={sizing} userId={1} onNavigate={action('navigate')}/>
  <Actions commentsCount={10} likesCount={0} recommendationsCount={4} rewardsCount={5} commentLabel="Respond" onComment={action('comment')} onLike={action('like')} onReward={action('reward')} onRecommend={action('recommend')} onOpen={action('open')} openProminent/>
 </article></main></MemoryRouter>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);
`;

let bundle;
async function compileFixture() {
  if (bundle) return bundle;
  const stubs = {
    '~/contexts': `const state={myState:{userId:1,level:20},user:{actions:{}},helpers:{checkUserChange:()=>false},requestHelpers:{},actions:{onSyncServerComments:()=>{}}};export const useAppContext=select=>select(state);export const useContentContext=select=>select(state);export const useKeyContext=select=>select(state);`,
    '~/helpers': 'export const isMobile=()=>false;export const determineUserCanRewardThis=()=>true;export const determineXpButtonDisabled=()=>false;export const scrollElementToCenter=()=>{};',
    '~/helpers/hooks': `
      import React,{useCallback,useEffect,useRef,useSyncExternalStore} from 'react';
      import {lazyLoadStore} from '${repo}/src/helpers/hooks/lazyLoadStore';
      ${throttleSource}${lazyLoadHook}
      export const useLiveComment=value=>value;
      export const useContentState=({contentId})=>contentId===2&&window.scrollSubject?window.scrollSubject:{};
      export const useMyLevel=()=>({canReward:true});`,
    '~/components/ContentPanel/Heading':
      'import React from "react";export default ()=> <header className="heading"><div><b>dew started a subject</b><small>A day ago</small></div></header>;',
    '~/components/Buttons/AskAgentButton': 'export default ()=>null;',
    '~/helpers/hooks/useOwnerTrace': 'export const useOwnerFeedCardFrameCount=()=>{};',
    '~/helpers/ownerTrace': 'export const isOwnerTraceActive=()=>false;export const measureOwnerFeedText=fn=>fn();export const measureOwnerLayout=fn=>fn();export const noteOwnerTraceTap=()=>{};export const recordOwnerTrace=()=>{};export const takeOwnerTraceTap=()=>null;',
    '~/helpers/analytics': 'export const trackEvent=()=>{};',
    '~/helpers/hooks/useScrollAnchorRestoration': 'export const saveScrollAnchorForElement=()=>{};',
    '~/theme/hooks/useRoleColor':
      'export const useRoleColor=()=>({getColor:()=>"#126bb5",color:"#126bb5",colorKey:"logoBlue",themeName:"logoBlue"});',
    '~/theme/hooks/useThemedCardVars':
      'export const useThemedCardVars=()=>({accentColor:"#418ceb",borderColor:"#ccc"});',
    '~/components/Texts/RichText/Markdown/EmbeddedComponent/InternalComponent':
      'export default ()=>null;',
    '~/components/Link': 'export {Link as default} from "react-router-dom";',
    '~/components/Icon':
      'import React from "react";export default ({icon,style})=><span aria-hidden="true" style={style}>{icon==="star"?"★":icon==="file-pdf"?"▤":icon==="arrow-right"?"→":"●"}</span>;',
    '~/components/ErrorBoundary': 'export default ({children})=>children;',
    '~/components/Button':
      'import React from "react";export default ({children,onClick,style})=><button onClick={onClick} style={style}>{children}</button>;',
    '~/components/Texts/UsernameText':
      'import React from "react";export default ({user})=><strong>{user.username}</strong>;',
    '~/components/ProfilePic': 'export default ()=>null;',
    '~/components/Build/Cards': 'export const BuildMiniCard=()=>null;',
    '~/components/AICardSummonContent': 'export default ()=>null;',
    '~/components/CardThumb': 'export default ()=>null;',
    '~/components/AchievementItem': 'export default ()=>null;',
    '~/components/SharedPromptBlock': 'export default ()=>null;',
    '~/components/SecretComment':
      'import React from "react";export default ({label,style})=><div style={style}>{label}</div>;',
    '~/components/Comments/AiEnergySponsorButton':
      'export const getAiEnergyPlaceholderName=()=>null;export const shouldRenderAiEnergySponsorNotice=()=>false;export default ()=>null;',
    '~/components/Modals/ImageModal':
      'import React from "react";export default ({onHide})=><button data-image-modal onClick={onHide}>Close image</button>;',
    './FileInfo': 'export default ()=>null;',
    './MediaPlayer': 'export default ()=>null;',
    '~/components/Embedly': 'export default ()=>null;',
    '~/components/VideoThumbImage': 'export default ()=>null;',
    '~/components/Texts/FullTextReveal': 'export default ()=>null;',
    '~/components/Texts/RichText/Markdown/EmbeddedComponent/YouTubeVideo':
      'export default ()=>null;',
    './ProfilePanelPreview': 'export default ()=>null;',
    './DailyGoalsPreview': 'export default ()=>null;',
    './VideoPreview': 'export default ()=>null;',
    './AIAudioButton': 'export default ()=>null;',
    './ChatMessageTools': 'export default ()=>null;',
    './EmbeddedComponent': 'export default ()=>null;',
    './LazyCodeBlockWrapper':
      'import React from "react";export default ({children})=><pre>{children}</pre>;'
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
        name: 'subject-media-fixture',
        setup(builder) {
          builder.onResolve({ filter: /.*/ }, ({ path }) =>
            stubs[path] ? { path, namespace: 'fixture' } : undefined
          );
          builder.onLoad(
            { filter: /.*/, namespace: 'fixture' },
            ({ path }) => ({
              contents: stubs[path],
              loader: 'tsx',
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
    `subject photos remain whole and readable on phones (${engine})`,
    { timeout: 240000 },
    async () => {
      const browser = await { chromium, webkit }[engine].launch();
      try {
        const page = await browser.newPage({
          viewport: { width: 390, height: 1000 },
          hasTouch: true
        });
        page.setDefaultTimeout(15000);
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.route('**/*', (route) => {
          if (
            route.request().url().startsWith('https://cdn.example.com/') ||
            route.request().url().includes('/attachments/feed/fixture/')
          ) {
            const portrait = route.request().url().includes('/portrait/');
            return route.fulfill({
              contentType: 'image/svg+xml',
              body: `<svg xmlns="http://www.w3.org/2000/svg" width="${portrait ? 300 : 600}" height="${portrait ? 600 : 360}" viewBox="0 0 600 360"><rect width="600" height="360" fill="#edf3fb"/><rect x="8" y="8" width="584" height="344" rx="12" fill="none" stroke="#418ceb" stroke-width="8"/><circle cx="300" cy="170" r="95" fill="#f3b74e"/><text x="300" y="315" text-anchor="middle" font-family="sans-serif" font-size="26">Keep the whole picture</text></svg>`
            });
          }
          return route.abort();
        });
        await page.setContent(
          `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>${readFileSync(path.join(repo, 'src/styles.css'), 'utf8')}body{background:#fffbee}.fixture{width:100%;max-width:660px;margin:20px auto}.heading{font-size:16px}.heading small{display:block;color:#999;font-size:13px}</style><div id="root"></div>`
        );
        await page.addScriptTag({ content: await compileFixture() });
        await page.locator('.home-feed-card__subject-main').waitFor();
        mkdirSync(artifacts, { recursive: true });
        for (const width of [320, 390, 767, 820, 1280]) {
          await page.setViewportSize({ width, height: 1100 });
          for (const sample of [
            'wide',
            'portrait',
            'markdown',
            'no-secret',
            'locked',
            'long',
            'secret-attachment',
            'file'
          ]) {
            await page.evaluate(
              (sample) => window.configureSubject(sample),
              sample
            );
            const media = page.locator(
              '.home-feed-card__subject-main > .home-feed-card__attachment-preview'
            );
            await media.waitFor();
            await page.evaluate(
              () =>
                new Promise((resolve) =>
                  requestAnimationFrame(() => requestAnimationFrame(resolve))
                )
            );
            if (sample !== 'file')
              await media.evaluate((el) =>
                (el.matches('img') ? el : el.querySelector('img')).decode()
              );
            const layout = await media.evaluate((media) => {
              const main = media.parentElement,
                copy = main.querySelector(
                  '.home-feed-card__subject-text-stack'
                ),
                secret = main.querySelector(
                  '.home-feed-card__subject-secret-answer'
                ),
                panel = main.closest('section'),
                card = main.closest('article'),
                actions = card.querySelector('.home-feed-card__actions');
              const rect = (el) => el?.getBoundingClientRect().toJSON();
              return {
                media: rect(media),
                copy: rect(copy),
                secret: rect(secret),
                panel: rect(panel),
                card: rect(card),
                actions: rect(actions),
                fit: media.matches('img')
                  ? getComputedStyle(media).objectFit
                  : media.querySelector('img')
                    ? getComputedStyle(media.querySelector('img')).objectFit
                    : null,
                overflow: document.documentElement.scrollWidth > innerWidth
              };
            });
            const detail = JSON.stringify({ width, sample, layout });
            if (sample === 'wide' && [390, 820, 1280].includes(width))
              await page.screenshot({
                path: path.join(artifacts, `${engine}-${sample}-${width}.png`),
                fullPage: true
              });
            assert.equal(layout.overflow, false, detail);
            assert.ok(layout.actions.top >= layout.panel.bottom - 1, detail);
            assert.ok(layout.media.bottom <= layout.panel.bottom + 1, detail);
            if (layout.secret)
              assert.ok(
                layout.secret.bottom <= layout.panel.bottom + 1,
                detail
              );
            if (width <= 767) {
              assert.ok(layout.media.top >= layout.copy.bottom - 1, detail);
              if (sample !== 'file') {
                assert.equal(layout.fit, 'contain', detail);
                assert.ok(layout.media.height >= 160, detail);
              }
              if (layout.secret)
                assert.ok(layout.secret.top >= layout.media.bottom - 1, detail);
            } else
              assert.ok(layout.media.left >= layout.copy.right - 1, detail);
            if (sample === 'locked') {
              assert.equal(
                await page
                  .locator('.home-feed-card__subject-secret-text')
                  .count(),
                0
              );
              assert.match(
                await page
                  .locator('.home-feed-card__subject-secret-answer')
                  .innerText(),
                /Submit your response/
              );
            }
          }
        }
        await page.setViewportSize({ width: 390, height: 1100 });
        await page.evaluate(() => window.configureSubject('wide'));
        await page
          .locator(
            '.home-feed-card__subject-main > .home-feed-card__attachment-preview img'
          )
          .click();
        await page.locator('[data-image-modal]').click();
        for (const kind of ['like', 'comment', 'reward', 'recommend'])
          await page.locator('.home-feed-card__action-button.' + kind).click();
        await page.locator('.home-feed-card__open').click();
        assert.deepEqual(await page.evaluate(() => window.actions), [
          'like',
          'comment',
          'reward',
          'recommend',
          'open'
        ]);
        assert.deepEqual(errors, []);
      } finally {
        await browser.close();
      }
    }
  );
}

// The media layout can grow beyond its estimate. Exercise the actual card,
// pooled intersection observer, lazy-load store and measured placeholder through
// the bottom-edge re-entry that made Safari replace a 665px card with ~535px.
for (const engine of ['webkit', 'chromium']) {
  test(`subject attachment height survives scroll re-entry (${engine})`, { timeout: 90000 }, async () => {
    const browser = await { chromium, webkit }[engine].launch();
    try {
      for (const width of [390, 1280]) {
        const page = await browser.newPage({ viewport: { width, height: 844 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/*', async route => {
          if (route.request().url().includes('/attachments/feed/fixture/')) {
            // Loading the essay is deliberately later than the card layout.
            await new Promise(resolve => setTimeout(resolve, 150));
            return route.fulfill({ contentType: 'image/svg+xml', body:
              '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="600"><rect width="300" height="600" fill="#754b36"/><rect x="20" y="20" width="260" height="560" fill="beige"/></svg>' });
          }
          return route.abort();
        });
        await page.setContent(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>${readFileSync(path.join(repo, 'src/styles.css'), 'utf8')}
          html,body{height:auto!important;overflow:visible!important}html{overflow-anchor:none}
          .fixture{width:100%;max-width:660px;margin:0 auto}.heading small{display:block}
          </style><div id="root"></div>`);
        await page.addScriptTag({ content: await compileFixture() });
        await page.locator('.home-feed-card__subject-main').waitFor();
        await page.evaluate(() => window.configureSubject('scroll-essay'));
        const tracked = page.locator('[data-tracked-card]');
        await tracked.waitFor();
        await page.evaluate(() => scrollTo(0, 1600));
        await tracked.locator('article').waitFor();
        const beforeLoad = await tracked.evaluate(el => el.getBoundingClientRect().height);
        await tracked.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
        const height = await tracked.evaluate(el => el.getBoundingClientRect().height);
        assert.ok(Math.abs(height - beforeLoad) <= 1, `${engine}/${width}: image loading moved the card`);
        const top = await tracked.evaluate(el => el.getBoundingClientRect().top + scrollY);
        for (let cycle = 0; cycle < 2; cycle++) {
          // Let the real one-second virtualization delay finish below the card.
          await page.evaluate(y => scrollTo(0, y), top + height + 300);
          await tracked.locator('article').waitFor({ state: 'detached' });
          assert.ok(Math.abs((await tracked.boundingBox()).height - height) <= 1);
          await page.evaluate(() => {
            window.heightSamples = [];
            const card = document.querySelector('[data-tracked-card]');
            window.heightObserver = new ResizeObserver(() => window.heightSamples.push(card.getBoundingClientRect().height));
            window.heightObserver.observe(card);
          });
          // Only the bottom 16px re-enter. Safari used to skip the new article's
          // contents, measure its estimate and move this card out of view again.
          await page.evaluate(y => scrollTo(0, y), top + height - 16);
          await page.waitForTimeout(1200);
          const tail = await tracked.boundingBox();
          const samples = await page.evaluate(() => { window.heightObserver.disconnect(); return window.heightSamples; });
          assert.ok(samples.length > 0);
          assert.ok(samples.every(value => Math.abs(value - height) <= 1),
            JSON.stringify({ engine, width, cycle, height, samples }));
          assert.ok(Math.abs(tail.height - height) <= 1);
          assert.equal(await tracked.locator('article').count(), 1);
          await page.evaluate(y => scrollTo(0, y), top - 200);
          await tracked.locator('article').waitFor();
          assert.ok(Math.abs((await tracked.boundingBox()).height - height) <= 1);
          // Leaving above and returning from the other direction is stable too.
          await page.evaluate(() => scrollTo(0, 0));
          await tracked.locator('article').waitFor({ state: 'detached' });
          await page.evaluate(y => scrollTo(0, y), top - 200);
          await tracked.locator('article').waitFor();
          assert.ok(Math.abs((await tracked.boundingBox()).height - height) <= 1);
        }
        mkdirSync(artifacts, { recursive: true });
        await page.screenshot({ path: path.join(artifacts, `${engine}-scroll-essay-${width}.png`) });
        assert.deepEqual(errors, []);
        await page.close();
      }
    } finally { await browser.close(); }
  });
}
