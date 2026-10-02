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
const app = { kind: 'app', id: 2, title: 'Red Square', thumbnailUrl: null };
const otherApp = { ...app, id: 3, title: 'Another App' };
const fixture = `
import React, {useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import ProfilePic from './src/components/ProfilePic';
import useUserActivityRefresh from './src/containers/App/Header/hooks/useAPISocket/useUserActivityRefresh';
import {applyUserActivityEvent} from './src/helpers/userActivity';
import {applyPresenceSnapshot} from './src/contexts/Chat/presenceSnapshot';
import {markSocketAuthReady} from './src/helpers/socketAuthReady';
import {socket} from '~/constants/sockets/api';
window.fixtureReads=0;
window.fixturePending=[];
window.fixtureServer={onlineUsers:{},isComplete:true};
window.fixtureVisible=true;
document.hasFocus=() => window.fixtureVisible;
Object.defineProperty(document,'visibilityState',{get:() => window.fixtureVisible?'visible':'hidden'});
function Fixture() {
  const [chatStatus,setChatStatus] = useState({2:{id:2,isOnline:true,isAway:false,isBusy:false}});
  window.fixtureChat={state:{chatStatus},actions:{onSetOnlinePresenceSnapshot:({onlineUsers,isComplete,requestedAt}) => {
    setChatStatus(previous => applyPresenceSnapshot({chatStatus:previous,onlineUsers,requestedAt,reconcileOffline:isComplete}));
  }}};
  window.cacheActivity=activity => setChatStatus(previous => ({...previous,
    2:applyUserActivityEvent(previous[2],{activity,observedAt:Date.now()})
  }));
  window.setCanonicalActivity=activity => {
    window.fixtureServer={onlineUsers:{2:{id:2,isOnline:true,isAway:false,activity,activityObservedAt:Date.now()}},isComplete:true};
  };
  window.setForeground=visible => {
    window.fixtureVisible=visible;
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event(visible?'focus':'blur'));
  };
  window.disconnectSocket=() => {socket.connected=false;socket.fire('disconnect');};
  window.reconnectSocket=() => {socket.id+=':next';socket.connected=true;markSocketAuthReady(1);};
  useEffect(() => {markSocketAuthReady(1);},[]);
  useUserActivityRefresh();
  return <MemoryRouter><main><h1>Profile activity</h1><p>Player's profile</p>
    <ProfilePic userId={2} online statusShown size={100}/>
  </main></MemoryRouter>;
}
const root=createRoot(document.getElementById('root'));
root.render(<Fixture/>);
window.unmountFixture=() => root.unmount();
`;
let bundle;
async function compileFixture() {
  if (bundle) return bundle;
  const stubs = {
    '~/contexts': `
      export const useKeyContext=select => select({myState:{userId:1}});
      export const useChatContext=select => select(window.fixtureChat);
      export const useAppContext=select => select({user:{state:{userObj:{}},actions:{}}});
      export const useHomeContext=select => select({actions:{}});`,
    '~/helpers':
      'export const isMobile=() => false; export const isPhone=() => false;',
    './ChangePicture': 'export default () => null;',
    '~/constants/sockets/api': `
      const listeners=new Map();
      export const socket={id:'fixture',connected:true,
        on(name,callback){const values=listeners.get(name)||new Set();values.add(callback);listeners.set(name,values);},
        off(name,callback){listeners.get(name)?.delete(callback);},
        fire(name){for(const callback of listeners.get(name)||[])callback();},
        timeout(ms){this.ackTimeout=ms;return this;},
        emit(name,callback){
          if(name!=='check_user_activity')throw new Error('Unexpected fixture event '+name);
          window.fixtureReads++;
          const response=structuredClone(window.fixtureServer);
          if(window.fixtureFailReads){callback(new Error('Synthetic transport failure'));return this;}
          if(window.fixtureHoldReads){
            const timer=setTimeout(() => callback(new Error('Synthetic acknowledgement timeout')),this.ackTimeout);
            window.fixturePending.push(() => {clearTimeout(timer);callback(null,response);});
          } else callback(null,response);
          return this;
        }
      };`
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
        name: 'activity-refresh-fixture',
        setup(builder) {
          builder.onResolve({ filter: /.*/ }, ({ path }) =>
            stubs[path] ? { path, namespace: 'fixture' } : undefined
          );
          builder.onLoad(
            { filter: /.*/, namespace: 'fixture' },
            ({ path }) => ({
              contents: stubs[path],
              loader: 'js',
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
    `missed activity clears recover while valid activity on another device survives (${engine})`,
    { timeout: 30000 },
    async () => {
      await withFixture(browserType, async (page) => {
        const badge = page.getByRole('button', {
          name: 'Using Red Square',
          exact: true
        });
        await cache(page, app);
        await page.evaluate(() => window.setCanonicalActivity(null));
        await badge.waitFor();
        await screenshot(page, `${engine}-missed-clear-before`);
        await page.clock.runFor(89_999);
        assert.equal(await reads(page), 0);
        await page.clock.runFor(1);
        await badge.waitFor({ state: 'detached' });
        assert.equal(await reads(page), 1);
        await screenshot(page, `${engine}-missed-clear-recovered`);
        await page.clock.runFor(180_000);
        assert.equal(
          await reads(page),
          1,
          'cleared badges must not keep polling'
        );

        await cache(page, app);
        await page.evaluate(
          (activity) => window.setCanonicalActivity(activity),
          otherApp
        );
        await page.clock.runFor(90_000);
        await page
          .getByRole('button', { name: 'Using Another App', exact: true })
          .waitFor();
        assert.equal(
          await reads(page),
          2,
          'the server owns activity across devices'
        );

        await page.clock.runFor(89_000);
        await cache(page, otherApp);
        await page.clock.runFor(1000);
        assert.equal(
          await reads(page),
          2,
          'fresh activity events must postpone recovery reads'
        );
      });
    }
  );

  test(
    `activity recovery pauses when hidden, retries failures, and ignores old socket replies (${engine})`,
    { timeout: 30000 },
    async () => {
      await withFixture(browserType, async (page) => {
        const badge = page.getByRole('button', {
          name: 'Using Red Square',
          exact: true
        });
        await cache(page, app);
        await page.evaluate(() => {
          window.setCanonicalActivity(null);
          window.setForeground(false);
        });
        await page.clock.runFor(180_000);
        assert.equal(await reads(page), 0);
        await page.evaluate(() => window.setForeground(true));
        await page.clock.runFor(1);
        await badge.waitFor({ state: 'detached' });
        assert.equal(await reads(page), 1);

        await cache(page, app);
        await page.evaluate(() => {
          window.setCanonicalActivity(null);
          window.fixtureFailReads = true;
        });
        await page.clock.runFor(90_000);
        assert.equal(await reads(page), 2);
        assert.equal(
          await badge.count(),
          1,
          'a failed read must not invent a clear'
        );
        await page.clock.runFor(14_999);
        assert.equal(await reads(page), 2);
        await page.evaluate(() => {
          window.fixtureFailReads = false;
        });
        await page.clock.runFor(1);
        await badge.waitFor({ state: 'detached' });
        assert.equal(await reads(page), 3);

        await cache(page, app);
        await page.evaluate(() => {
          window.fixtureServer = { onlineUsers: {}, isComplete: false };
        });
        await page.clock.runFor(90_000);
        assert.equal(
          await badge.count(),
          1,
          'incomplete reads cannot infer offline activity'
        );
        await page.evaluate(() => {
          window.setCanonicalActivity(null);
          window.fixtureHoldReads = true;
        });
        await page.clock.runFor(15_000);
        await page.evaluate((activity) => {
          window.disconnectSocket();
          window.fixtureHoldReads = false;
          window.setCanonicalActivity(activity);
          window.reconnectSocket();
        }, otherApp);
        await page.clock.runFor(1);
        const otherBadge = page.getByRole('button', {
          name: 'Using Another App',
          exact: true
        });
        await otherBadge.waitFor();
        await page.evaluate(() => window.fixturePending.shift()());
        assert.equal(
          await otherBadge.count(),
          1,
          'a reply from the old connection cannot erase current activity'
        );
      });
    }
  );
}

async function withFixture(browserType, check) {
  const script = await compileFixture();
  const browser = await browserType.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 900, height: 600 }
    });
    page.setDefaultTimeout(5000);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/img/default-avatar-4.png', (route) =>
      route.fulfill({
        contentType: 'image/png',
        body: readFileSync(path.join(repo, 'public/img/default-avatar-4.png'))
      })
    );
    await page.setContent(
      '<base href="http://activity-fixture.test/"><style>body{font:16px sans-serif;background:#f4f7fb;margin:32px}main{background:white;padding:24px}h1{font-size:22px}</style><div id="root"></div>'
    );
    const time = new Date('2026-10-02T00:00:00Z');
    await page.clock.install({ time });
    await page.clock.pauseAt(new Date(time.getTime() + 1000));
    await page.addScriptTag({ content: script });
    await page.getByRole('heading', { name: 'Profile activity' }).waitFor();
    await check(page);
    await page.evaluate(() => window.unmountFixture());
    const before = await reads(page);
    await page.clock.runFor(180_000);
    assert.equal(
      await reads(page),
      before,
      'unmount must stop recovery timers'
    );
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
}
async function cache(page, activity) {
  await page.evaluate((activity) => window.cacheActivity(activity), activity);
  await page
    .getByRole('button', { name: `Using ${activity.title}`, exact: true })
    .waitFor();
}
async function reads(page) {
  return page.evaluate(() => window.fixtureReads);
}
async function screenshot(page, name) {
  const directory = process.env.USER_ACTIVITY_REFRESH_SCREENSHOTS;
  if (!directory) return;
  mkdirSync(directory, { recursive: true });
  await page.screenshot({ path: path.join(directory, `${name}.png`) });
}
