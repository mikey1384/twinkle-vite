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

// Render the actual member row, shared avatar and status badge. Only identity
// services and unrelated controls are stand-ins; presence is a server snapshot.
const fixture = `
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import ProfilePic from './src/components/ProfilePic';
import MemberListItem from './src/containers/Chat/RightMenu/ChatInfo/Members/MemberListItem';
import { Color } from './src/constants/css';
function Fixture() {
  const [presence, setPresence] = useState({
    id: 2, username: 'programmer', isOnline: true, isAway: true, isBusy: true
  });
  window.setServerPresence = patch => setPresence(previous => ({...previous, ...patch}));
  window.fixtureChatStatus = {2: presence};
  window.presenceColors = {Away: Color.orange(), Busy: Color.red(), Online: Color.green()};
  return <main>
    <section id="member"><MemberListItem member={{id: 2, username: 'programmer'}}
      creatorId={0} onlineMemberObj={presence.isOnline ? {2: presence} : {}}/></section>
    <section id="profile"><ProfilePic userId={2} online={presence.isOnline}
      isAway={presence.isAway} isBusy={presence.isBusy} statusShown statusSize="large" size={80}/></section>
    <section id="self"><ProfilePic userId={1} isAway isBusy online statusShown size={40}/></section>
  </main>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);
`;

let bundle;
async function compileFixture() {
  if (bundle) return bundle;
  const stubs = {
    '~/contexts': `
      export const useAppContext = select => select({user: {state: {userObj: {}}}});
      export const useKeyContext = select => select({myState: {userId: 1}});
      export const useChatContext = select => select({state: {chatStatus: window.fixtureChatStatus}});
    `,
    '~/helpers':
      'export const isMobile = () => false; export const isPhone = () => false;',
    '~/components/Texts/UsernameText':
      'import React from "react"; export default ({user, ...props}) => <strong {...props}>{user.username}</strong>;',
    '~/components/Icon': 'export default () => null;',
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
          await setPresence({ isAway: true }, 'Away');
          await setPresence({ isOnline: false, isBusy: true }, null);
          assert.equal(
            await page.locator('#self [aria-label="Online"]').count(),
            1
          );
        }
        assert.deepEqual(errors, []);

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
