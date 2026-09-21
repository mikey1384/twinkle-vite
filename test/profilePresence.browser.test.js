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

// Render the actual member row, shared avatar and status badge. Only identity
// services and unrelated controls are stand-ins; presence is a server snapshot.
const fixture = `
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faBook, faCardsBlank } from '@fortawesome/pro-solid-svg-icons';
import ProfilePic from './src/components/ProfilePic';
import MemberListItem from './src/containers/Chat/RightMenu/ChatInfo/Members/MemberListItem';
import Collect from './src/containers/Chat/Body/Collect';
import useUserActivity, { userActivityRegistry } from './src/helpers/hooks/useUserActivity';
import { Color } from './src/constants/css';
library.add(faBook, faCardsBlank);
function RouteProbe() { window.fixtureLocation = useLocation(); return null; }
function ActivityOverlay({activity}) { useUserActivity(activity); return null; }
function Fixture() {
  const [presence, setPresence] = useState({
    id: 2, username: 'programmer', isOnline: true, isAway: true, isBusy: true
  });
  window.setServerPresence = patch => setPresence(previous => ({...previous, ...patch}));
  window.fixtureChatStatus = {2: presence};
  window.presenceColors = {Away: Color.orange(), Busy: Color.red(), Online: Color.green()};
  const [collectPage, setCollectPage] = useState(null);
  const [overlay, setOverlay] = useState(undefined);
  window.setCollectPage = setCollectPage;
  window.setActivityOverlay = value => setOverlay(value);
  window.readRegisteredActivity = () => userActivityRegistry.get(1);
  return <MemoryRouter><RouteProbe/><main>
    <section id="member"><MemberListItem member={{id: 2, username: 'programmer'}}
      creatorId={0} onlineMemberObj={presence.isOnline ? {2: presence} : {}}/></section>
    <section id="profile"><ProfilePic userId={2} online={presence.isOnline}
      isAway={presence.isAway} isBusy={presence.isBusy} statusShown statusSize="large" size={80}/></section>
    <section id="self"><ProfilePic userId={1} isAway isBusy online statusShown size={40}/></section>
    {collectPage && <Collect displayedThemeColor="logoBlue" {...collectPage}/>}
    {overlay !== undefined && <ActivityOverlay activity={overlay}/>}
  </main></MemoryRouter>;
}
const root = createRoot(document.getElementById('root'));
root.render(<Fixture/>);
window.unmountFixture = () => root.unmount();
`;

let bundle;
async function compileFixture() {
  if (bundle) return bundle;
  const stubs = {
    '~/contexts': `
      export const useAppContext = select => select({user: {state: {userObj: {}}, actions: {
        onSetCollectType: value => {window.fixtureCollectType = value;}
      }}});
      export const useKeyContext = select => select({myState: {userId: 1}});
      export const useChatContext = select => select({state: {chatStatus: window.fixtureChatStatus}, actions: {
        onUpdateSelectedChannelId: value => {window.fixtureSelectedChannel = value;}
      }});
      export const useHomeContext = select => select({actions: {}});
    `,
    '~/helpers':
      'export const isMobile = () => false; export const isPhone = () => false;',
    '~/components/Texts/UsernameText':
      'import React from "react"; export default ({user, ...props}) => <strong {...props}>{user.username}</strong>;',
    './AICards': 'import React from "react"; export default ({loadingAICardChat}) => <div>{loadingAICardChat ? "Loading AI Cards" : "AI Cards collection"}</div>;',
    './Vocabulary': 'import React from "react"; export default ({loadingVocabulary}) => <div>{loadingVocabulary ? "Loading Word Master" : "Word Master collection"}</div>;',
    './ChangePicture': 'export default () => null;'
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
        name: 'presence-fixture',
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

for (const [engine, browserType] of Object.entries({ chromium, webkit })) {
  test(
    `away overrides outside-chat busy status in member dots and profile labels (${engine})`,
    { timeout: 30000 },
    async () => {
      const script = await compileFixture();
      const browser = await browserType.launch();
      try {
        const page = await browser.newPage({
          viewport: { width: 1280, height: 800 }
        });
        page.setDefaultTimeout(5000);
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.setContent(`<style>${readFileSync(path.join(repo, 'src/styles.css'), 'utf8')}
        main{padding:24px;max-width:400px}section{margin-bottom:32px}#member{background:#f7f9fc}
      </style><div id="root"></div>`);
        await page.addScriptTag({ content: script });
        await page.waitForFunction(
          () => typeof window.setServerPresence === 'function'
        );
        for (const width of [1280, 390]) {
          await page.setViewportSize({ width, height: 800 });
          // This is also the state a newly opened/reconnected observer receives
          // when a user left Home open and then became hidden or idle.
          await setPresence(
            { isOnline: true, isBusy: true, isAway: true },
            'Away'
          );
          if (process.env.PROFILE_PRESENCE_SCREENSHOTS) {
            mkdirSync(process.env.PROFILE_PRESENCE_SCREENSHOTS, {
              recursive: true
            });
            await page.screenshot({
              path: path.join(
                process.env.PROFILE_PRESENCE_SCREENSHOTS,
                `${engine}-${width}-away.png`
              )
            });
          }
          await setPresence({ isBusy: false }, 'Away');
          await setPresence({ isBusy: true }, 'Away');
          await setPresence({ isAway: false }, 'Busy');
          await setPresence({ isBusy: false }, 'Online');
          await setPresence(
            { activity: { kind: 'app', id: 2460, title: 'Math Lab' } },
            'Online'
          );
          const badge = page.locator(
            '#profile button[aria-label="Using Math Lab"]'
          );
          await badge.click();
          await page
            .getByRole('button', { name: 'Open app', exact: true })
            .waitFor();
          if (process.env.PROFILE_PRESENCE_SCREENSHOTS)
            await page.screenshot({
              path: path.join(
                process.env.PROFILE_PRESENCE_SCREENSHOTS,
                `${engine}-${width}-activity.png`
              )
            });
          await page.keyboard.press('Escape');
          for (const [id, title, route] of [
            ['word-master', 'Word Master', 'vocabulary'],
            ['ai-cards', 'AI Cards', 'ai-cards']
          ]) {
            await setPresence({ activity: { kind: 'game', id, title, thumbnailUrl: null } }, 'Online');
            const collectionBadge = page.locator(`#profile button[aria-label="Playing ${title}"]`);
            await collectionBadge.click();
            assert.equal(await collectionBadge.locator('svg').count(), 1);
            const openCollection = page.getByRole('button', { name: `Open ${title}`, exact: true });
            await openCollection.waitFor();
            if (process.env.PROFILE_PRESENCE_SCREENSHOTS)
              await page.screenshot({ path: path.join(process.env.PROFILE_PRESENCE_SCREENSHOTS, `${engine}-${width}-${id}.png`) });
            await openCollection.click();
            await page.waitForFunction(expected => window.fixtureLocation.pathname === expected, `/chat/${route}`);
            assert.equal(await page.evaluate(() => window.fixtureCollectType), route);
            assert.equal(await page.evaluate(() => window.fixtureSelectedChannel), undefined);
          }
          await setPresence({ activity: { kind: 'app', id: 2460, title: 'Math Lab' } }, 'Online');
          await setPresence({ isAway: true }, 'Away');
          assert.equal(await badge.count(), 0);
          await setPresence({ isOnline: false, isBusy: true }, null);
          assert.equal(
            await page.locator('#self [aria-label="Online"]').count(),
            1
          );
        }
        for (const [id, chatType] of [['word-master', 'vocabulary'], ['ai-cards', 'ai-cards']]) {
          const collectPage = { chatType, loadingVocabulary: true, loadingAICardChat: true };
          await page.evaluate(props => window.setCollectPage(props), collectPage);
          await page.getByText(chatType === 'vocabulary' ? 'Loading Word Master' : 'Loading AI Cards', { exact: true }).waitFor();
          assert.equal(await page.evaluate(() => window.readRegisteredActivity()), null);
          await page.evaluate(props => window.setCollectPage({ ...props, loadingVocabulary: false, loadingAICardChat: false }), collectPage);
          await waitForRegisteredActivity({ kind: 'game', id });
          await page.evaluate(() => window.setActivityOverlay({ kind: 'game', id: 'chess' }));
          await waitForRegisteredActivity({ kind: 'game', id: 'chess' });
          // A refreshed collection beneath the modal must not reclaim priority.
          await page.evaluate(props => window.setCollectPage(props), collectPage);
          await page.evaluate(props => window.setCollectPage({ ...props, loadingVocabulary: false, loadingAICardChat: false }), collectPage);
          await waitForRegisteredActivity({ kind: 'game', id: 'chess' });
          await page.evaluate(() => window.setActivityOverlay(null));
          await waitForRegisteredActivity(null);
          await page.evaluate(() => window.setActivityOverlay(undefined));
          await waitForRegisteredActivity({ kind: 'game', id });
          await page.evaluate(() => window.setCollectPage(null));
          await waitForRegisteredActivity(null);
        }
        await page.evaluate(() => window.unmountFixture());
        assert.deepEqual(errors, []);

        async function waitForRegisteredActivity(expected) {
          await page.waitForFunction(value => JSON.stringify(window.readRegisteredActivity()) === JSON.stringify(value), expected);
        }

        async function setPresence(patch, label) {
          await page.evaluate(
            (patch) => window.setServerPresence(patch),
            patch
          );
          await page.waitForFunction((expected) => {
            return ['member', 'profile'].every((id) => {
              const tag = document.querySelector('#' + id + ' [aria-label]');
              return expected
                ? tag?.getAttribute('aria-label') === expected
                : !tag;
            });
          }, label);
          if (!label) return;
          const colors = await page.evaluate((expected) => {
            const normalize = document.createElement('span');
            normalize.style.color = window.presenceColors[expected];
            document.body.appendChild(normalize);
            const expectedColor = getComputedStyle(normalize).color;
            normalize.remove();
            return {
              expectedColor,
              shown: ['member', 'profile'].map(
                (id) =>
                  getComputedStyle(
                    document.querySelector('#' + id + ' [aria-label] > div')
                  ).backgroundColor
              )
            };
          }, label);
          assert.deepEqual(colors.shown, [
            colors.expectedColor,
            colors.expectedColor
          ]);
        }
      } finally {
        await browser.close();
      }
    }
  );
}
