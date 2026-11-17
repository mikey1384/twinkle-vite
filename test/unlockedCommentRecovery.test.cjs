const assert = require('node:assert/strict');
const test = require('node:test');
const React = require('react');
const { compile, redacted, canonical } = require('./helpers/blankCommentFixture.cjs');

function environment() {
  let viewerId = 18933;
  let shown = false;
  let active;
  const requests = [], received = [];
  const hooks = {
    ...React,
    useRef(initial) {
      const i = active.cursor++;
      return active.slots[i] ||= { current: initial };
    },
    useEffect(effect, deps) {
      const i = active.cursor++;
      const old = active.slots[i];
      if (!old || deps.some((v, index) => !Object.is(v, old.deps[index]))) {
        old?.cleanup?.();
        active.slots[i] = { deps, cleanup: effect() };
      }
    }
  };
  const context = {
    useKeyContext: select => select({ myState: { userId: viewerId }, helpers: { checkUserChange: id => id !== viewerId } }),
    useContentContext: select => select({ state: { subject37294: { secretShown: shown } }, actions: { onInitContent: data => received.push(data) } }),
    useAppContext: select => select({ requestHelpers: { loadContent: args => new Promise((resolve, reject) => requests.push({ args, resolve, reject })) } })
  };
  const useRefresh = compile('src/helpers/hooks/useRefreshUnlockedComment.ts', name => {
    if (name === 'react') return hooks;
    if (name === '~/contexts') return context;
    throw new Error(name);
  }).default;
  function consumer() {
    const instance = { slots: [], cursor: 0 };
    return {
      render(comment = redacted) { active = instance; instance.cursor = 0; useRefresh(comment); },
      dispose() { for (const slot of instance.slots) slot?.cleanup?.(); instance.slots = []; }
    };
  }
  return { consumer, requests, received, unlock() { shown = true; }, setViewer(id) { viewerId = id; } };
}
const settle = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); };

test('unlock reloads the canonical body even when a redacted comment is already loaded', async () => {
  const env = environment(), panel = env.consumer();
  panel.render();
  await settle();
  assert.equal(env.requests.length, 0);
  env.unlock(); panel.render(); await settle();
  assert.equal(env.requests.length, 1);
  assert.deepEqual(env.requests[0].args, { contentId: 350899, contentType: 'comment' });
  env.requests[0].resolve(canonical); await settle();
  assert.deepEqual(env.received, [canonical]);
  panel.render({ ...canonical, secretHidden: false }); await settle();
  assert.equal(env.requests.length, 1);
  panel.dispose();
});

test('panel, list and StrictMode replay share one read, and still-redacted responses cannot loop', async () => {
  const env = environment(), panel = env.consumer(), list = env.consumer();
  env.unlock(); panel.render(); panel.dispose(); panel.render(); list.render();
  await settle();
  assert.equal(env.requests.length, 1);
  env.requests[0].resolve(redacted); await settle();
  assert.equal(env.received.length, 2);
  panel.render({ ...redacted }); list.render({ ...redacted }); await settle();
  assert.equal(env.requests.length, 1);
  panel.dispose(); list.dispose();
});

test('logout and unmount discard responses for the previous viewer', async () => {
  for (const change of ['logout', 'unmount']) {
    const env = environment(), panel = env.consumer();
    env.unlock(); panel.render(); await settle();
    if (change === 'logout') env.setViewer(0); else panel.dispose();
    env.requests[0].resolve(canonical); await settle();
    assert.equal(env.received.length, 0);
    panel.dispose();
  }
});

test('a failed read stays bounded and can be retried by revisiting the surface', async () => {
  const env = environment(), panel = env.consumer();
  env.unlock(); panel.render(); await settle();
  // Dispose before rejection also verifies there is no post-unmount logging.
  panel.dispose(); env.requests[0].reject(new Error('network')); await settle();
  panel.render(); await settle();
  assert.equal(env.requests.length, 2);
  env.requests[1].resolve(canonical); await settle();
  assert.deepEqual(env.received, [canonical]);
  panel.dispose();
});

test('unredacted text, legitimate empty attachments, and logged-out viewers are not refetched', async () => {
  const env = environment(), panel = env.consumer();
  env.unlock();
  panel.render(canonical); await settle();
  panel.render({ ...canonical, content: '', filePath: 'photo.jpg' }); await settle();
  env.setViewer(0); panel.render(redacted); await settle();
  assert.equal(env.requests.length, 0);
  panel.dispose();
});
