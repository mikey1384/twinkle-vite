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
const artifacts = '/private/tmp/twinkle-ai-card-collection-20260914';

// Actual Home Body, sizing, RichText, collection parser and card thumbnails.
// Only account/data services, unrelated embeds and modal contents are stubs.
const fixture = `
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { css } from '@emotion/css';
import { Color, borderRadius, desktopMinWidth, mobileMaxWidth, tabletMaxWidth } from './src/constants/css';
import Body from './src/containers/Home/Stories/FeedCard/Body';
import Actions from './src/containers/Home/Stories/FeedCard/Actions';
import { getFeedCardSizing } from './src/containers/Home/Stories/FeedCard/helpers/sizing';
const SHOWCASE_CARD_CLASS = 'home-feed-card--showcase';
${cardStyles}
const ids = [25978, 17461, 9228, 600, 26787, 31000];
const cards = ids.map((id, i) => ({id, level: i % 5 + 1, quality: i === 1 ? 'rare' : 'common',
  word: ['forest', 'windows', 'dragons', 'ocean', 'stars', 'moonlight'][i], imagePath: '/fixture-art/' + id + '.svg'}));
window.collectionCards = cards;
window.collectionCardObj = Object.fromEntries(cards.map(card => [card.id, card]));
window.parentOpens = 0;
function Location() { const location = useLocation(); window.currentPath = location.pathname + location.search; return null; }
function Fixture() {
  const [state, setState] = useState({ count: 6, locked: true, longTitle: false, src: '/chat/ai-cards/?search[engine]=DALL-E%203', revision: 0 });
  window.configureCollection = patch => setState(previous => ({...previous, ...patch, revision: previous.revision + 1}));
  window.collectionIds = state.count === null ? undefined : ids.slice(0, state.count);
  const src = state.longTitle ? '/ai-cards/?search[word]=' + 'Supercalifragilisticexpialidocious'.repeat(5) : state.src;
  const content = { id: 1, contentType: 'subject', uploader: {id: 2, username: 'Chu_xn'}, rewardLevel: 2,
    title: 'AI Card Models', description: 'I noticed that there is a new update on cards too. There is image 2.5 now!! I just generated my mystery cards and realized that there are image 2.5 cards...\\n\\n![cards](' + src + ')',
    hasSecretAnswer: state.locked, secretAnswer: state.locked ? 'Hidden answer' : '', secretShown: false };
  const sizing = getFeedCardSizing({content, userId: 1});
  ${sizingStyle};
  const noop = () => {};
  return <MemoryRouter><Location/><main className="fixture">
    <article className={cardClass} style={sizingStyle} onClick={() => window.parentOpens++}>
      <header className="heading"><div><b><span style={{color: Color.logoBlue()}}>Chu_xn</span> started a subject</b><small>a day ago</small></div></header>
      <Body key={state.revision} content={content} loading={false} onNavigate={() => window.parentOpens++} rootObj={{}} sizing={sizing} userId={1}/>
      <Actions commentsCount={2} likesCount={0} recommendationsCount={0} rewardsCount={0} commentLabel="Respond"
        onComment={noop} onLike={noop} onOpen={noop} onReward={noop} onRecommend={noop} openProminent rewardShown={false} recommendShown={false}/>
    </article>
  </main></MemoryRouter>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);
`;

let bundle;
async function compileFixture() {
  if (bundle) return bundle;
  const stubs = {
    '~/contexts': `
      const state = {myState:{userId:1}, theme:{xpNumber:{color:'logoGreen'}},
        actions: {onUpdateAICard:()=>{},onSetDisplayedCardIds:()=>{}},
        requestHelpers: {loadFilteredAICards: () => window.collectionIds === undefined ? new Promise(()=>{}) : Promise.resolve({cards: window.collectionCards.filter(card => window.collectionIds.includes(card.id))})}};
      export const useAppContext = select => select(state);
      export const useContentContext = select => select(state);
      export const useKeyContext = select => select(state);
      export const useChatContext = select => select({...state,state:{cardObj:window.collectionCardObj}});
    `,
    '~/helpers': 'export const isMobile = () => false;',
    '~/helpers/hooks':
      'export const useLiveComment = value => value; export const useContentState = () => ({cardIds:window.collectionIds});',
    '~/theme/hooks/useRoleColor':
      'export const useRoleColor = () => ({getColor:()=>"#126bb5", color:"#126bb5",colorKey:"logoBlue",themeName:"logoBlue"});',
    '~/theme/hooks/useThemedCardVars':
      'export const useThemedCardVars = () => ({accentColor:"#418ceb",borderColor:"#ccc"});',
    '~/components/Texts/RichText/Markdown/EmbeddedComponent/InternalComponent': `export {default} from './src/components/Texts/RichText/Markdown/EmbeddedComponent/InternalComponent/AICardComponent';`,
    '~/components/Modals/AICardModal': `import React from 'react'; import {createPortal} from 'react-dom'; export default ({cardId,onHide}) => createPortal(<div role="dialog" aria-label={'Card '+cardId}><button onClick={onHide}>Close card</button></div>,document.body);`,
    '~/components/Link': 'export { Link as default } from "react-router-dom";',
    '~/components/Icon':
      'import React from "react"; export default ({icon,style}) => <span aria-hidden="true" style={style}>{icon === "arrow-right" ? "→" : icon === "star" ? "★" : "●"}</span>;',
    '~/components/ErrorBoundary': 'export default ({children}) => children;',
    '~/components/Button':
      'import React from "react"; export default ({children,onClick,style}) => <button onClick={onClick} style={style}>{children}</button>;',
    '~/components/Texts/UsernameText':
      'import React from "react"; export default ({user}) => <strong>{user.username}</strong>;',
    '~/components/ProfilePic': 'export default () => null;',
    '~/components/Build/Cards': 'export const BuildMiniCard = () => null;',
    '~/components/AchievementItem': 'export default () => null;',
    '~/components/SharedPromptBlock': 'export default () => null;',
    '~/components/SecretComment':
      'import React from "react"; export default ({label,style}) => <div style={style}>{label}</div>;',
    '~/components/Comments/AiEnergySponsorButton':
      'export const getAiEnergyPlaceholderName = () => null; export const shouldRenderAiEnergySponsorNotice = () => false; export default () => null;',
    '~/components/ContentFileViewer': 'export default () => null;',
    '~/components/Embedly': 'export default () => null;',
    '~/components/VideoThumbImage': 'export default () => null;',
    '~/components/Texts/FullTextReveal': 'export default () => null;',
    '~/components/Texts/RichText/Markdown/EmbeddedComponent/FileDownload':
      'export default () => null;',
    '~/components/Texts/RichText/Markdown/EmbeddedComponent/YouTubeVideo':
      'export default () => null;',
    './ProfilePanelPreview': 'export default () => null;',
    './SingleCardComponent': 'export default () => null;',
    './MoreAICardsModal': 'export default () => null;',
    '../DefaultComponent': 'export default () => null;',
    './DailyGoalsPreview': 'export default () => null;',
    './VideoPreview': 'export default () => null;',
    './AIAudioButton': 'export default () => null;',
    './ChatMessageTools': 'export default () => null;',
    './EmbeddedComponent': 'export default () => null;',
    './LazyCodeBlockWrapper':
      'import React from "react"; export default ({children}) => <pre>{children}</pre>;'
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
        name: 'collection-fixture',
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
    `AI card collection stays readable and each action works (${engine})`,
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
        await page.route('**/fixture-art/**', (route) =>
          route.fulfill({
            contentType: 'image/svg+xml',
            body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="140"><rect width="100" height="140" fill="#225276"/><circle cx="75" cy="32" r="17" fill="#ffd978"/><path d="M0 110L45 50L90 110L100 90V140H0Z" fill="#75b09b"/></svg>'
          })
        );
        await page.setContent(`<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><style>${readFileSync(path.join(repo, 'src/styles.css'), 'utf8')}
        body{background:#fffbee}.fixture{width:100%;max-width:660px;margin:20px auto}.heading{font-size:16px}.heading small{display:block;color:#999;font-size:13px}
        [role=dialog]{position:fixed;inset:30%;background:white;border:1px solid #ccc;padding:20px;z-index:2000}
        </style><div id="root"></div>`);
        await page.addScriptTag({ content: await compileFixture() });
        await page.locator('.compact-ai-card-multi__card').first().waitFor();
        mkdirSync(artifacts, { recursive: true });
        for (const width of [320, 390, 767, 768, 820, 1280]) {
          await page.setViewportSize({ width, height: 1000 });
          for (const longTitle of [false, true]) {
            await page.evaluate(
              (longTitle) =>
                window.configureCollection({
                  longTitle,
                  count: 6,
                  locked: true
                }),
              longTitle
            );
            await page.locator('.compact-ai-card-multi__card').last().waitFor();
            await page.evaluate(
              () =>
                new Promise((resolve) =>
                  requestAnimationFrame(() => requestAnimationFrame(resolve))
                )
            );
            const layout = await page
              .locator('.compact-ai-card-multi')
              .evaluate((embed) => {
                const rail = embed.querySelector(
                  '.compact-ai-card-multi__preview'
                );
                const title = embed.querySelector(
                  '.compact-ai-card-multi__title'
                );
                const link = embed.querySelector(
                  '.compact-ai-card-multi__browse'
                );
                const slot = embed.parentElement;
                const panel = embed.closest('.home-feed-card__panel-preview');
                const secret = panel.querySelector(
                  '.home-feed-card__subject-secret-answer'
                );
                const rect = (element) =>
                  element.getBoundingClientRect().toJSON();
                return {
                  embed: rect(embed),
                  rail: rect(rail),
                  title: rect(title),
                  link: rect(link),
                  slot: rect(slot),
                  panel: rect(panel),
                  secret: secret && rect(secret),
                  cards: [...rail.children].map(rect),
                  scrollWidth: rail.scrollWidth,
                  clientWidth: rail.clientWidth,
                  pageOverflow:
                    document.documentElement.scrollWidth > innerWidth,
                  slotBorder: getComputedStyle(slot).borderTopWidth,
                  embedBorder: getComputedStyle(embed).borderTopWidth
                };
              });
            assert.equal(
              layout.pageOverflow,
              false,
              JSON.stringify({ width, longTitle, layout })
            );
            assert.equal(layout.slotBorder, '0px');
            assert.equal(layout.embedBorder, '1px');
            assert.ok(
              layout.title.top >= layout.embed.top &&
                layout.title.bottom <= layout.rail.top
            );
            assert.ok(
              layout.link.height >= 44 &&
                layout.link.right <= layout.embed.right,
              JSON.stringify({ width, longTitle, layout })
            );
            assert.ok(
              layout.cards.every(
                (card) =>
                  card.top >= layout.rail.top &&
                  card.bottom <= layout.rail.bottom
              ),
              JSON.stringify({ width, longTitle, layout })
            );
            assert.ok(
              layout.embed.bottom <= layout.slot.bottom + 1 &&
                layout.embed.top >= layout.slot.top - 1
            );
            assert.ok(
              layout.embed.bottom <= layout.panel.bottom + 1,
              JSON.stringify({ width, longTitle, layout })
            );
            assert.ok(
              layout.secret &&
                layout.secret.top >= layout.embed.bottom &&
                layout.secret.bottom <= layout.panel.bottom + 1,
              JSON.stringify({ width, longTitle, layout })
            );
            if ([320, 390].includes(width))
              assert.ok(layout.scrollWidth > layout.clientWidth);
            if (!longTitle && [390, 820, 1280].includes(width))
              await page.screenshot({
                path: path.join(artifacts, `${engine}-${width}.png`),
                fullPage: true
              });
          }
        }
        // Native keyboard activation opens the selected card, never its parent
        // collection/subject. Focusing the last item reveals it in the scroller.
        await page.setViewportSize({ width: 390, height: 1000 });
        await page.evaluate(() =>
          window.configureCollection({
            longTitle: false,
            src: '/ai-cards?search[engine]=DALL-E%203'
          })
        );
        const first = page.getByRole('button', {
          name: 'View AI card #25978: forest'
        });
        await first.waitFor();
        assert.equal(
          await page
            .locator(
              '.home-feed-card__subject-embed-preview.home-feed-card__rich-embed-internal--ai-card'
            )
            .count(),
          1
        );
        for (const key of ['Enter', 'Space']) {
          await first.focus();
          await page.keyboard.press(key);
          await page.getByRole('dialog', { name: 'Card 25978' }).waitFor();
          assert.equal(await page.evaluate(() => window.currentPath), '/');
          assert.equal(await page.evaluate(() => window.parentOpens), 0);
          await page.getByRole('button', { name: 'Close card' }).click();
          assert.equal(await page.evaluate(() => window.currentPath), '/');
          assert.equal(await page.evaluate(() => window.parentOpens), 0);
        }
        const last = page.getByRole('button', {
          name: 'View AI card #31000: moonlight'
        });
        await last.focus();
        const reachedEnd = await last.evaluate((button) => {
          const rail = button.parentElement;
          return (
            rail.scrollLeft > 0 &&
            button.getBoundingClientRect().right <=
              rail.getBoundingClientRect().right + 1
          );
        });
        assert.equal(reachedEnd, true);
        await last.tap();
        await page.getByRole('dialog', { name: 'Card 31000' }).waitFor();
        await page.getByRole('button', { name: 'Close card' }).click();
        await page.getByRole('link', { name: 'View all cards' }).press('Enter');
        await page.waitForFunction(
          () => window.currentPath === '/ai-cards?search[engine]=DALL-E%203'
        );
        assert.equal(
          await page.evaluate(() => window.currentPath),
          '/ai-cards?search[engine]=DALL-E%203'
        );
        assert.equal(await page.evaluate(() => window.parentOpens), 0);
        for (const count of [0, 1, null]) {
          await page.evaluate(
            (count) => window.configureCollection({ count, locked: false }),
            count
          );
          const selector =
            count === null
              ? '.compact-ai-card-multi__loading'
              : count === 0
                ? '.compact-ai-card-multi__empty'
                : '.compact-ai-card-multi__card';
          await page.locator(selector).waitFor();
          assert.equal(
            await page.getByRole('link', { name: 'View all cards' }).count(),
            1
          );
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth
            ),
            false
          );
        }
        assert.deepEqual(errors, []);
      } finally {
        await browser.close();
      }
    }
  );
}
