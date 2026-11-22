import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

// The app activity report (useUserActivityReporting) under the generous
// presence rules (Mikey, 11-22: "do you want this live thing to go off
// everytime user de-focuses from the website so they can multitask?").
// Window focus never withdraws the activity; a hidden page keeps it and the
// server ends it after its grace (twinkle-api socket/userActivity.ts, tested
// there); a real page close or an account switch clears it at once.

const repo = fileURLToPath(new URL('..', import.meta.url));

const stubs: Record<string, string> = {
  react: `
    export function useRef(value) { return { current: value }; }
    export function useEffect(effect) {
      const cleanup = effect();
      if (typeof cleanup === 'function') globalThis.__fixture.cleanups.push(cleanup);
    }`,
  '~/contexts': `
    export const useKeyContext = (select) =>
      select({ myState: { userId: globalThis.__fixture.userId, settings: {} } });`,
  '~/helpers/socketAuthReady': `
    export const isSocketAuthReadyForUser = () => true;`,
  '~/constants/sockets/api': `
    const listeners = new Map();
    export const socket = {
      on(name, callback) { listeners.set(name, callback); },
      off(name) { listeners.delete(name); },
      timeout() { return this; },
      emit(name, value, ack) {
        globalThis.__fixture.emits.push({ name, value: value ?? null });
        if (typeof ack === 'function') ack(null, { ok: true });
        return this;
      }
    };`
};

const entry = `
import useUserActivityReporting from './src/containers/App/Header/hooks/useAPISocket/useUserActivityReporting';
import { userActivityRegistry } from './src/helpers/hooks/useUserActivity';
import { socialJoinableStore } from './src/helpers/socialWalkups';
import { USER_ACTIVITY_INPUT_EVENT } from './src/helpers/userActivity';
globalThis.__fixture.api = {
  mount: () => useUserActivityReporting(),
  enterApp: (userId, id) => userActivityRegistry.set(globalThis.__fixture, userId, { kind: 'app', id }, 0),
  setJoinable: (id, joinable) => socialJoinableStore.set(id, joinable),
  inputEvent: USER_ACTIVITY_INPUT_EVENT
};
`;

let bundled: string | undefined;
async function loadFixture() {
  if (!bundled) {
    const result = await build({
      stdin: { contents: entry, resolveDir: repo, loader: 'ts' },
      bundle: true,
      write: false,
      format: 'iife',
      platform: 'neutral',
      alias: { '~': path.join(repo, 'src') },
      define: { 'import.meta.env': '{}' },
      plugins: [
        {
          name: 'reporting-fixture',
          setup(builder) {
            builder.onResolve({ filter: /.*/ }, ({ path: id }) =>
              stubs[id] ? { path: id, namespace: 'fixture' } : undefined
            );
            builder.onLoad({ filter: /.*/, namespace: 'fixture' }, ({ path: id }) => ({
              contents: stubs[id],
              loader: 'js',
              resolveDir: repo
            }));
          }
        }
      ]
    });
    bundled = result.outputFiles[0].text;
  }
  const page = { visible: true, focused: true };
  const windowTarget = new EventTarget();
  const documentTarget = new EventTarget();
  const fixture: any = { userId: 7, emits: [], cleanups: [] };
  const globals = globalThis as any;
  globals.__fixture = fixture;
  globals.window = windowTarget;
  globals.document = Object.defineProperties(documentTarget, {
    visibilityState: { get: () => (page.visible ? 'visible' : 'hidden') },
    hasFocus: { value: () => page.focused }
  });
  new Function(bundled)();
  const api = fixture.api;
  const activityEmits = () =>
    fixture.emits.filter((emit: any) => emit.name === 'set_user_activity');
  return {
    page,
    fixture,
    api,
    activityEmits,
    lastActivity: () => activityEmits().at(-1)?.value ?? null,
    windowEvent: (name: string, init: object = {}) =>
      windowTarget.dispatchEvent(Object.assign(new Event(name), init)),
    setVisible(visible: boolean) {
      page.visible = visible;
      if (!visible) page.focused = false;
      documentTarget.dispatchEvent(new Event('visibilitychange'));
    },
    unmount: () => fixture.cleanups.splice(0).forEach((cleanup: () => void) => cleanup())
  };
}

const app = (id: number) => ({ kind: 'app', id });

test('blur keeps the app activity, its joinable state and its heartbeat', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
  const f = await loadFixture();
  f.api.enterApp(7, 2809);
  f.api.setJoinable(2809, { state: 'open', mode: 'room' });
  f.api.mount();
  assert.deepEqual(f.lastActivity(), {
    ...app(2809),
    joinable: { state: 'open', mode: 'room' }
  });

  // Another window takes focus; this one stays visible beside it.
  f.page.focused = false;
  f.windowEvent('blur');
  t.mock.timers.tick(5000);
  assert.equal(
    f.activityEmits().some((emit: any) => emit.value === null),
    false,
    'blur must not withdraw the activity'
  );
  // The heartbeat keeps renewing it while unfocused.
  const before = f.activityEmits().length;
  t.mock.timers.tick(25_000);
  assert.equal(f.activityEmits().length, before + 1);
  assert.deepEqual(f.lastActivity(), {
    ...app(2809),
    joinable: { state: 'open', mode: 'room' }
  });
  f.unmount();
  f.api.setJoinable(2809, null);
});

test('input in a visible but unfocused window still counts as presence', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
  const f = await loadFixture();
  f.api.enterApp(7, 2809);
  f.api.mount();
  f.page.focused = false;
  (globalThis as any).window.dispatchEvent(
    new CustomEvent(f.api.inputEvent, { detail: { buildId: 2809 } })
  );
  assert.equal(
    f.fixture.emits.filter((emit: any) => emit.name === 'presence_user_action').length,
    1
  );
  f.unmount();
});

test('a hidden page keeps its activity, stops heartbeating, and renews at once on return', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
  const f = await loadFixture();
  f.api.enterApp(7, 2809);
  f.api.mount();
  const visibleReports = f.activityEmits().length;

  f.setVisible(false);
  t.mock.timers.tick(3 * 60_000);
  // Nothing sent while hidden: no clear, and no heartbeat. The server holds
  // the activity through its grace and ends it after (server-side test).
  assert.equal(f.activityEmits().length, visibleReports);

  // The app changes while hidden (its room filled): that is still reported.
  f.api.setJoinable(2809, { state: 'busy', mode: 'room' });
  t.mock.timers.tick(200);
  assert.deepEqual(f.lastActivity(), {
    ...app(2809),
    joinable: { state: 'busy', mode: 'room' }
  });
  const hiddenReports = f.activityEmits().length;

  // Back within the grace: renewed at once, same activity.
  f.setVisible(true);
  assert.equal(f.activityEmits().length, hiddenReports + 1);
  assert.deepEqual(f.lastActivity(), {
    ...app(2809),
    joinable: { state: 'busy', mode: 'room' }
  });
  assert.equal(
    f.activityEmits().some((emit: any) => emit.value === null),
    false
  );
  // and the heartbeat resumes
  t.mock.timers.tick(25_000);
  assert.equal(f.activityEmits().length, hiddenReports + 2);
  f.unmount();
  f.api.setJoinable(2809, null);
});

test('closing the page clears at once; a back-forward restore reports again', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
  const f = await loadFixture();
  f.api.enterApp(7, 2809);
  f.api.mount();
  f.windowEvent('pagehide', { persisted: false });
  assert.equal(f.lastActivity(), null);

  f.windowEvent('pageshow', { persisted: true });
  assert.deepEqual(f.lastActivity(), app(2809));
  f.unmount();
});

test('an account switch (unmount) clears the activity at once', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
  const f = await loadFixture();
  f.api.enterApp(7, 2809);
  f.api.mount();
  assert.deepEqual(f.lastActivity(), app(2809));
  f.unmount();
  assert.equal(f.lastActivity(), null);
});
