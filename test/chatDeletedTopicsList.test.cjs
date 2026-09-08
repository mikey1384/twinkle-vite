const { assert, test, base, compile, driver, deferred } = require('./helpers/chatDialogHarness.cjs');
function environment() {
  const runtime = driver(), requests = [];
  const hook = compile(base + 'SettingsModal/useDeletedTopicsList.ts', { react: runtime.hooks }).default;
  let scope = '1:7:true';
  return { runtime, requests, render(next = scope) {
    scope = next;
    return runtime.render(() => hook(scope, () => {
      const request = deferred(); requests.push(request); return request.promise;
    }));
  } };
}
test('deleted topics distinguishes failed and malformed responses from a valid empty list, with retry', async () => {
  const env = environment();
  for (const value of [null, {}, [{ id: 0, content: 'bad' }], [{ id: 1 }]]) {
    const work = env.render().reload(); env.requests.at(-1).resolve(value); await work;
    assert.match(env.render().error, /Couldn’t load/); assert.equal(env.render().loading, false);
  }
  const failed = env.render().reload(); env.requests.at(-1).reject(new Error('offline')); await failed;
  assert.match(env.render().error, /try again/);
  const retry = env.render().reload(); assert.equal(env.render().error, '');
  env.requests.at(-1).resolve([]); await retry;
  assert.deepEqual(env.render().topics, []); assert.equal(env.render().error, '');
});
test('the latest list read wins and dismissed reads cannot replace it', async () => {
  const env = environment(); const first = env.render().reload(), second = env.render().reload();
  env.requests[1].resolve([{ id: 2, content: 'latest' }]); await second;
  env.requests[0].resolve([{ id: 1, content: 'old' }]); await first;
  assert.equal(env.render().topics[0].id, 2);
  const dismissed = env.render().reload(); env.render().invalidate();
  env.requests[2].reject(new Error('late')); await dismissed;
  assert.equal(env.render().error, ''); assert.equal(env.render().loading, false);
});
test('actor/channel/permission changes and unmount fence old successes and errors', async () => {
  for (const next of ['2:7:true', '1:8:true', '1:7:false']) {
    const env = environment(); const pending = env.render().reload(); env.render(next);
    env.requests[0].resolve([{ id: 1, content: 'old account' }]); await pending;
    assert.deepEqual(env.render().topics, []);
  }
  for (const fail of [false, true]) {
    const env = environment(); const pending = env.render().reload(); env.runtime.dispose();
    if (fail) env.requests[0].reject(new Error('late')); else env.requests[0].resolve([]);
    await pending; assert.equal(env.runtime.lateUpdates, 0);
  }
});
