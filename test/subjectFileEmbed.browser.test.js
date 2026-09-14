import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const {
  chromium,
  webkit
} = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const feedSource = readFileSync(
  path.join(repo, 'src/containers/Home/Stories/FeedCard/index.tsx'),
  'utf8'
);
const cardStyles = feedSource.match(/const cardClass = css`[\s\S]*?\n`;/)[0];
const sizingStyle = feedSource.match(/const sizingStyle = \{[\s\S]*?\n  \}/)[0];
const artifacts = '/private/tmp/twinkle-subject-file-preview-20260914';

// Real Body, both subject-placement paths, RichText, attachment tiles and
// layout budgets. Only services and unrelated media/controls are substituted.
const fixture = `
import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import {css} from '@emotion/css';
import {Color,borderRadius,desktopMinWidth,mobileMaxWidth,tabletMaxWidth} from './src/constants/css';
import Body from './src/containers/Home/Stories/FeedCard/Body';
import Actions from './src/containers/Home/Stories/FeedCard/Actions';
import {getFeedCardSizing} from './src/containers/Home/Stories/FeedCard/helpers/sizing';
const SHOWCASE_CARD_CLASS='home-feed-card--showcase';
${cardStyles}
window.openedSubjects=[];window.parentOpens=0;
function Fixture(){
 const [state,setState]=useState({mode:'target',longName:false,attached:false});
 window.configureSubject=patch=>setState(previous=>({...previous,...patch}));
 const filename=state.longName ? 'A very long lesson worksheet filename that should remain contained.pdf' : '1780890278703-pj7ti3.pdf';
 const subject={id:2,contentId:2,contentType:'subject',loaded:true,title:'let me think of something',rewardLevel:4,
  description:'Inktober is a drawing challenge where you have to create a drawing each day. Share your work with everyone.\\n\\n!['+filename+'](https://cdn.example.com/'+encodeURIComponent(filename)+')',uploader:{id:1,username:'mikey'},
  ...(state.attached ? {actualFilePath:'/artwork',actualFileName:'drawing.png'} : {})};
 window.fixtureSubject=subject;
 const rootObj=state.mode==='target'?subject:{};
 const content=state.mode==='target'?{id:1,contentType:'comment',rootId:2,rootType:'subject',uploader:{id:3,username:'dev_user'},content:'Hello everyone!\\n\\nWe are excited to introduce R.T.B, officially known as the Royal Test Bank!\\n\\nWe would love for you to join us. Feel free to ask any questions.'}
  :{id:1,contentType:'subject',title:'A subject shared in the description',description:'Take a look at this drawing challenge.\\n\\n![Subject](/subjects/2)',uploader:{id:3,username:'dev_user'}};
 const sizing=getFeedCardSizing({content,rootObj,userId:1});
 ${sizingStyle};
 const noop=()=>{};
 return <MemoryRouter><main className="fixture"><article className={cardClass} style={sizingStyle} onClick={()=>window.parentOpens++}>
  <header className="heading"><div><b>dev_user answered: let me think of something</b><small>2 months ago</small></div></header>
  <Body content={content} rootObj={rootObj} loading={false} sizing={sizing} userId={1} onNavigate={url=>window.openedSubjects.push(url)}/>
  <Actions commentsCount={0} likesCount={0} recommendationsCount={1} rewardsCount={0} commentLabel="Reply" onComment={noop} onLike={noop} onReward={noop} onRecommend={noop} onOpen={noop} openProminent/>
 </article></main></MemoryRouter>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);
`;

let bundle;
async function compileFixture() {
  if (bundle) return bundle;
  const stubs = {
    '~/contexts': `const state={myState:{userId:1},helpers:{checkUserChange:()=>false},requestHelpers:{},actions:{}};export const useAppContext=select=>select(state);export const useContentContext=select=>select(state);export const useKeyContext=select=>select(state);`,
    '~/helpers': 'export const isMobile=()=>false;',
    '~/helpers/hooks':
      'export const useLiveComment=value=>value;export const useContentState=({contentId})=>contentId===2?window.fixtureSubject:{};',
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
    '~/components/CardThumb': 'export default ()=>null;',
    '~/components/AchievementItem': 'export default ()=>null;',
    '~/components/SharedPromptBlock': 'export default ()=>null;',
    '~/components/SecretComment':
      'import React from "react";export default ({label,style})=><div style={style}>{label}</div>;',
    '~/components/Comments/AiEnergySponsorButton':
      'export const getAiEnergyPlaceholderName=()=>null;export const shouldRenderAiEnergySponsorNotice=()=>false;export default ()=>null;',
    '~/components/ContentFileViewer':
      'import React from "react";export default ()=> <div data-native-attachment style={{background:"#edf3fb"}}>Drawing</div>;',
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
        name: 'subject-file-fixture',
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
    `subject Markdown files occupy the right attachment column (${engine})`,
    { timeout: 60000 },
    async () => {
      const browser = await { chromium, webkit }[engine].launch();
      try {
        const page = await browser.newPage({
          viewport: { width: 390, height: 1000 },
          hasTouch: true
        });
        page.setDefaultTimeout(5000);
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.setContent(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>${readFileSync(path.join(repo, 'src/styles.css'), 'utf8')}
    body{background:#fffbee}.fixture{width:100%;max-width:660px;margin:20px auto}.heading{font-size:16px}.heading small{display:block;color:#999;font-size:13px}
   </style><div id="root"></div>`);
        await page.addScriptTag({ content: await compileFixture() });
        mkdirSync(artifacts, { recursive: true });
        for (const width of [320, 390, 767, 768, 820, 1280]) {
          await page.setViewportSize({ width, height: 1000 });
          for (const mode of ['target', 'nested']) {
            for (const longName of [false, true]) {
              await page.evaluate((state) => window.configureSubject(state), {
                mode,
                longName,
                attached: false
              });
              const tile = page.locator(
                '.home-feed-card__target-file-embed-preview'
              );
              await tile.waitFor();
              await page.evaluate(
                () =>
                  new Promise((resolve) =>
                    requestAnimationFrame(() => requestAnimationFrame(resolve))
                  )
              );
              const layout = await tile.evaluate((tile) => {
                const subject = tile.closest('.home-feed-card__target-subject');
                const copy = subject.querySelector(
                  '.home-feed-card__target-copy'
                );
                const card = tile.querySelector(
                  '.home-feed-card__attachment-card'
                );
                const description = subject.querySelector(
                  '[data-rich-text-body]'
                );
                const descriptionSlot = subject.querySelector(
                  '.home-feed-card__target-subject-description-slot'
                );
                const rect = (element) =>
                  element.getBoundingClientRect().toJSON();
                const clipping = [];
                for (let el = tile.parentElement; el; el = el.parentElement) {
                  if (
                    ['hidden', 'clip', 'auto'].includes(
                      getComputedStyle(el).overflowY
                    )
                  )
                    clipping.push({ className: el.className, rect: rect(el) });
                }
                return {
                  tile: rect(tile),
                  copy: rect(copy),
                  card: rect(card),
                  clipping,
                  contents: [...card.children].map(rect),
                  description: rect(description),
                  descriptionSlot: rect(descriptionSlot),
                  descriptionLineHeight: parseFloat(
                    getComputedStyle(description).lineHeight
                  ),
                  pageOverflow:
                    document.documentElement.scrollWidth > innerWidth,
                  frameBorder: getComputedStyle(tile).borderTopWidth,
                  cardBorder: getComputedStyle(card).borderTopWidth
                };
              });
              const detail = JSON.stringify({ width, mode, longName, layout });
              assert.equal(layout.pageOverflow, false, detail);
              assert.ok(layout.tile.left > layout.copy.right, detail);
              assert.ok(
                Math.abs(layout.tile.width - layout.tile.height) < 1,
                detail
              );
              assert.equal(layout.frameBorder, '0px');
              assert.equal(layout.cardBorder, '1px');
              assert.ok(
                layout.contents.every(
                  (rect) =>
                    rect.top >= layout.card.top &&
                    rect.bottom <= layout.card.bottom
                ),
                detail
              );
              assert.ok(
                layout.clipping.every(
                  ({ rect }) =>
                    layout.tile.top >= rect.top - 1 &&
                    layout.tile.bottom <= rect.bottom + 1
                ),
                detail
              );
              assert.ok(
                layout.description.bottom <= layout.descriptionSlot.bottom + 1,
                detail
              );
              assert.ok(
                layout.description.height >= layout.descriptionLineHeight - 1,
                detail
              );
              assert.equal(
                await page.locator('.rich-text-file-card').count(),
                0
              );
              if (!longName && [390, 820, 1280].includes(width))
                await page.screenshot({
                  path: path.join(artifacts, `${engine}-${mode}-${width}.png`),
                  fullPage: true
                });
            }
          }
        }
        // The preview still opens its subject, and a native attachment is never
        // overwritten by a second file embedded in the description.
        for (const mode of ['target', 'nested']) {
          await page.evaluate(
            (mode) => window.configureSubject({ mode, attached: false }),
            mode
          );
          await page
            .locator('.home-feed-card__target-file-embed-preview')
            .click();
          assert.equal(
            await page.evaluate(() => window.openedSubjects.at(-1)),
            '/subjects/2'
          );
          assert.equal(await page.evaluate(() => window.parentOpens), 0);
          await page.evaluate(() =>
            window.configureSubject({ attached: true })
          );
          await page.locator('[data-native-attachment]').waitFor();
          await page.locator('.rich-text-file-card').waitFor();
          assert.equal(
            await page
              .locator('.home-feed-card__target-file-embed-preview')
              .count(),
            0
          );
        }
        assert.deepEqual(errors, []);
      } finally {
        await browser.close();
      }
    }
  );
}
