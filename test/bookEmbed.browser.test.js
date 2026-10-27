import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
const require = createRequire(import.meta.url);
const { chromium, webkit } = require(
  process.env.PLAYWRIGHT_MODULE ||
    '/Users/mikey/.npm-packages/lib/node_modules/playwright'
);
const repo = fileURLToPath(new URL('..', import.meta.url));
const artifacts = process.env.BOOK_EMBED_ARTIFACTS;
const feedSource = readFileSync(
  path.join(repo, 'src/containers/Home/Stories/FeedCard/index.tsx'),
  'utf8'
);
const cardStyles = feedSource.match(/const cardClass = css`[\s\S]*?\n`;/)[0];
const sizingStyle = feedSource.match(/const sizingStyle = \{[\s\S]*?\n  \}/)[0];
const fixture = `
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter,useLocation} from 'react-router-dom';
import {css} from '@emotion/css';
import {Color,borderRadius,desktopMinWidth,mobileMaxWidth,tabletMaxWidth} from './src/constants/css';
import InternalComponent from './src/components/Texts/RichText/Markdown/EmbeddedComponent/InternalComponent';
import RichText from './src/components/Texts/RichText';
import Body from './src/containers/Home/Stories/FeedCard/Body';
import {getFeedCardSizing} from './src/containers/Home/Stories/FeedCard/helpers/sizing';
import {getSubjectDisplayDescription} from './src/helpers/bookEmbedHelpers';
const SHOWCASE_CARD_CLASS='home-feed-card--showcase';
${cardStyles}
function Probe(){window.currentPath=useLocation().pathname;return null;}
function Fixture(){
 const [config,setConfig]=useState({});
 window.update=value=>setConfig(previous=>({...previous,...value}));
 window.configure=value=>{window.parentClicks=0;window.parentKeys=0;window.requests=[];setConfig({...value,sequence:(window.sequence=(window.sequence||0)+1)});};
 window.fixtureSubject={id:37177,contentId:37177,contentType:'subject',loaded:true,title:'3 stories',bookAvailable:1,description:'',uploader:{id:11107,username:'ReinaByun'}};
 window.loadBook=async id=>{window.requests.push(id);if(config.delay)await new Promise(r=>setTimeout(r,config.delay));if(config.error)throw Error('offline');return {book:config.unavailable?null:{subjectId:id,title:config.long?'어느 여름밤에 시작된 아주 길고도 놀라운 모험 이야기 The extraordinarily long title of this book':'3 stories',description:config.long?'A surprising adventure. '.repeat(30):'',coverUrl:config.noCover?null:config.broken?'/broken-cover.png':'/cover.png',author:{id:11107,username:config.long?'a_very_long_username_01234567890123456789':'ReinaByun'}}};};
 const content={...window.fixtureSubject,...config.subject},rootObj={};
 const sizing=getFeedCardSizing({content,rootObj,userId:1});
 ${sizingStyle};
 const url='https://www.twin-kle.com/app/884/'+(config.id||37177)+'-3-stories';
 return <MemoryRouter key={config.sequence}><Probe/><main className="fixture" onClick={()=>window.parentClicks++} onKeyDown={()=>window.parentKeys++}>
 {config.feed?<article className={cardClass} style={sizingStyle}><header className="heading"><b>ReinaByun shared a book</b></header><Body content={content} rootObj={rootObj} loading={false} sizing={sizing} userId={1} onNavigate={url=>window.parentTarget=url}/></article>
 :config.raw?<RichText contentType="comment" contentId={20}>{url}</RichText>
 :config.subjectMode?<RichText>{getSubjectDisplayDescription(content)}</RichText>
 :<InternalComponent src={config.appRoot?'/app/884':'/app/884/'+(config.id||37177)+'-3-stories'} isProfileComponent={config.profile} buildPreviewVariant={config.compact?'compact':'wide'} />}
 </main></MemoryRouter>;
}
window.requests=[];
createRoot(document.getElementById('root')).render(<Fixture/>);
`;
let bundle;
async function compile() {
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
  delete stubs[
    '~/components/Texts/RichText/Markdown/EmbeddedComponent/InternalComponent'
  ];
  delete stubs['./EmbeddedComponent'];
  stubs['~/contexts'] =
    `const state={myState:{userId:1},helpers:{checkUserChange:()=>false},requestHelpers:{loadBookPreview:id=>window.loadBook(id)},actions:{}};export const useAppContext=select=>select(state);export const useContentContext=select=>select(state);export const useKeyContext=select=>select(state);`;
  stubs['~/helpers/hooks/useScrollAnchorRestoration'] =
    'export const saveScrollAnchorForElement=()=>{};';
  stubs['./MainContentComponent'] =
    'import React from "react"; export const LazyProfileAppEmbed=()=>null;export default ()=> <span>App preview</span>;';
  for (const name of [
    'MissionComponent',
    'UserComponent',
    'AICardComponent',
    'SharedPromptComponent',
    'AchievementUnlockComponent',
    'AchievementComponent',
    'ImageComponent',
    'FileDownload',
    'YouTubeVideo'
  ])
    stubs['./' + name] = 'export default ()=>null;';
  stubs['~/components/AICardSummonContent'] = 'export default ()=>null;';
  stubs['~/components/AICardDetails'] = 'export default ()=>null;';
  stubs['~/components/AICard'] = 'export default ()=>null;';
  const result = await build({
    stdin: { contents: fixture, resolveDir: repo, loader: 'tsx' },
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    loader: { '.webp': 'dataurl', '.gif': 'dataurl', '.png': 'dataurl' },
    alias: {
      '~': path.join(repo, 'src'),
      'react-sanitized-html': path.join(
        repo,
        'src/shims/react-sanitized-html.tsx'
      )
    },
    define: {
      'import.meta.env': '{}',
      'process.env.NODE_ENV': '"development"'
    },
    plugins: [
      {
        name: 'book-fixture',
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
async function configure(page, value) {
  await page.evaluate((value) => window.configure(value), value);
  await page.evaluate(
    () =>
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  );
}
for (const [engine, browserType] of Object.entries({ chromium, webkit }))
  test(
    'book embeds: rendering, direct navigation and recovery (' + engine + ')',
    { timeout: 60000 },
    async () => {
      const script = await compile();
      const browser = await browserType.launch();
      try {
        const context = await browser.newContext({
          viewport: { width: 900, height: 850 },
          serviceWorkers: 'block'
        });
        const cover = artifacts
          ? readFileSync(path.join(artifacts, 'real-cover.png'))
          : Buffer.from(
              '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400"><rect width="300" height="400" fill="#495a82"/></svg>'
            );
        const html =
          '<!doctype html><html><head><style>' +
          readFileSync(path.join(repo, 'src/styles.css'), 'utf8') +
          'body{background:#f0f3f5}.fixture{width:100%;max-width:660px;margin:30px auto;padding:16px} article{background:white} .heading{padding:14px;font-size:16px}</style></head><body><div id="root"></div></body></html>';
        await context.route('**/*', (route) => {
          const url = new URL(route.request().url());
          if (url.pathname === '/cover.png')
            return route.fulfill({
              contentType: artifacts ? 'image/png' : 'image/svg+xml',
              body: cover
            });
          if (url.pathname === '/broken-cover.png')
            return route.fulfill({ status: 404, body: '' });
          return route.fulfill({ contentType: 'text/html', body: html });
        });
        const page = await context.newPage();
        page.setDefaultTimeout(5000);
        const errors = [];
        page.on('pageerror', (e) => {
          errors.push(e.message);
          console.log('Page error:', e.message);
        });
        await page.goto('http://localhost:3000/fixture');
        await page.addScriptTag({ content: script });
        await page.waitForFunction(
          () => typeof window.configure === 'function'
        );
        await page
          .getByRole('link', { name: 'Read 3 stories', exact: true })
          .waitFor();
        assert.equal(await page.locator('.book-embed').count(), 1);
        for (const config of [
          {},
          { compact: true },
          { raw: true },
          { subjectMode: true },
          { feed: true }
        ]) {
          await configure(page, config);
          await page
            .getByRole('link', { name: 'Read 3 stories', exact: true })
            .waitFor();
          assert.equal(
            await page.locator('.book-embed').count(),
            1,
            JSON.stringify(config)
          );
          await page
            .getByRole('link', { name: 'Read 3 stories', exact: true })
            .click();
          await page.waitForFunction(() =>
            window.currentPath.startsWith('/app/884/37177')
          );
          assert.equal(await page.evaluate(() => window.parentClicks), 0);
        }
        for (const width of [360, 900]) {
          await page.setViewportSize({ width, height: 1000 });
          for (const config of [
            {},
            { compact: true, long: true, noCover: true },
            { subjectMode: true },
            { feed: true },
            { feed: true, long: true, noCover: true },
            {
              feed: true,
              subject: { filePath: 'fixture', fileName: 'cover.png' }
            },
            {
              feed: true,
              long: true,
              noCover: true,
              subject: { filePath: 'fixture', fileName: 'cover.png' }
            },
            { broken: true }
          ]) {
            await configure(page, config);
            const card = page.locator('.book-embed');
            await card.waitFor();
            await page.waitForFunction(() =>
              document.querySelector('.book-embed[aria-busy="false"]')
            );
            if (!config.noCover && !config.broken) {
              await page.waitForFunction(() => {
                const img = document.querySelector('.book-embed__cover img');
                return img?.complete && img.naturalWidth > 0;
              });
              assert.ok(
                await page
                  .locator('.book-embed__cover img')
                  .evaluate((el) => el.clientHeight > 40 && el.clientWidth > 40)
              );
            }
            const geometry = await card.evaluate((el) => {
              const b = el.getBoundingClientRect();
              return {
                left: b.left,
                right: b.right,
                scroll: el.scrollWidth,
                width: el.clientWidth,
                height: b.height
              };
            });
            assert.ok(
              geometry.left >= 0 && geometry.right <= width + 1,
              JSON.stringify(geometry)
            );
            assert.ok(
              geometry.scroll <= geometry.width + 1,
              JSON.stringify(geometry)
            );
            if (config.broken)
              await page.waitForFunction(
                () => !document.querySelector('.book-embed__cover img')
              );
            if (config.feed) {
              const visible = await card
                .locator('.book-embed__read')
                .evaluate((el) => {
                  const b = el.getBoundingClientRect();
                  return (
                    document
                      .elementFromPoint(b.x + b.width / 2, b.y + b.height / 2)
                      ?.closest('.book-embed') != null
                  );
                });
              assert.equal(
                visible,
                true,
                'Read action must not be clipped by the feed panel'
              );
            }
            if (artifacts && !config.broken) {
              mkdirSync(artifacts, { recursive: true });
              if (!config.feed && !config.compact && !config.subjectMode)
                await card.screenshot({
                  path: path.join(
                    artifacts,
                    engine + '-book-card-' + width + '.png'
                  )
                });
              await page.screenshot({
                path: path.join(
                  artifacts,
                  engine +
                    '-' +
                    width +
                    '-' +
                    (config.feed
                      ? (config.subject ? 'feed-attachment' : 'feed') +
                        (config.long ? '-long' : '')
                      : config.subjectMode
                        ? 'subject'
                        : config.compact
                          ? 'long'
                          : 'book') +
                    '.png'
                )
              });
            }
          }
        }
        await configure(page, { delay: 200, id: 111 });
        await page.waitForFunction(() => window.requests.includes(111));
        await page.evaluate(() => window.update({ delay: 0, id: 222 }));
        await page
          .getByRole('link', { name: 'Read 3 stories', exact: true })
          .waitFor();
        await page.waitForTimeout(250);
        assert.equal(
          await page.locator('.book-embed').getAttribute('href'),
          '/app/884/222-3-stories'
        );
        await configure(page, { profile: true });
        assert.equal(await page.locator('.book-embed').count(), 0);
        await configure(page, { appRoot: true });
        await page.getByText('App preview', { exact: true }).waitFor();
        assert.equal(await page.locator('.book-embed').count(), 0);
        await configure(page, { unavailable: true });
        await page.getByText('This book is unavailable').waitFor();
        assert.equal(await page.locator('.book-embed__title').count(), 0);
        await configure(page, { error: true });
        await page.getByRole('button', { name: 'Try again' }).waitFor();
        const before = await page.evaluate(() => window.requests.length);
        await page.getByRole('button', { name: 'Try again' }).press('Enter');
        assert.equal(await page.evaluate(() => window.parentKeys), 0);
        await page.waitForFunction(
          (before) => window.requests.length > before,
          before
        );
        assert.equal(await page.evaluate(() => window.parentClicks), 0);
        await configure(page, {});
        await page
          .getByRole('link', { name: 'Read 3 stories', exact: true })
          .press('Enter');
        await page.waitForFunction(() =>
          window.currentPath.startsWith('/app/884/37177')
        );
        await configure(page, {});
        const beforePath = await page.evaluate(() => window.currentPath);
        const opened = context.waitForEvent('page');
        await page
          .getByRole('link', { name: 'Read 3 stories', exact: true })
          .click({ modifiers: ['ControlOrMeta'] });
        const tab = await opened;
        if (engine === 'chromium')
          await tab.waitForURL('**/app/884/37177-3-stories');
        assert.equal(await page.evaluate(() => window.currentPath), beforePath);
        await tab.close();
        assert.deepEqual(errors, []);
        if (artifacts) {
          writeFileSync(path.join(artifacts, 'preview.js'), script);
          writeFileSync(
            path.join(artifacts, 'preview.html'),
            html.replace('</body>', '<script src="preview.js"></script></body>')
          );
        }
      } finally {
        await browser.close();
      }
    }
  );
