const { assert, test, base, compile, driver, deferred } = require('./helpers/chatDialogHarness.cjs');
function environment() {
  const runtime = driver();
  const request = compile(base + 'useChatDialogRequest.ts', { react: runtime.hooks }).default;
  const hook = compile(base + 'SettingsModal/useDeletedTopicAction.ts', { react: runtime.hooks, '../useChatDialogRequest': request }).default;
  let scope = '1:7:true:true';
  return { runtime, render(next = scope) { scope = next; return runtime.render(() => hook(scope)); } };
}
test('acknowledged restore/delete retries only refresh and serializes other actions', async () => {
  for (const kind of ['restore', 'delete']) {
    const env = environment(); let writes = 0, reads = 0;
    const action = { id: 7, kind };
    const mutate = async () => { writes++; return { success: true }; };
    const refresh = async () => { if (++reads === 1) throw new Error('offline'); };
    await env.render().runAction(action, mutate, refresh);
    assert.equal(env.render().confirmed, true); assert.ok(env.render().error);
    await env.render().runAction({ id: 8, kind }, mutate, refresh); assert.equal(writes, 1);
    await env.render().runAction(action, mutate, refresh);
    assert.equal(writes, 1); assert.equal(reads, 2); assert.equal(env.render().confirmed, false);
  }
});
test('duplicate pending actions and missing acknowledgements cannot refresh state', async () => {
  const env = environment(), pending = deferred(); let writes = 0, reads = 0;
  const mutate = () => { writes++; return pending.promise; }, refresh = async () => { reads++; };
  const first = env.render().runAction({ id: 1, kind: 'restore' }, mutate, refresh);
  await env.render().runAction({ id: 2, kind: 'delete' }, mutate, refresh);
  assert.equal(writes, 1); pending.resolve({}); await first;
  assert.equal(reads, 0); assert.equal(env.render().confirmed, false); assert.ok(env.render().error);
});
test('scope changes and unmount discard late acknowledgements', async () => {
  for (const unmount of [false, true]) {
    const env = environment(), pending = deferred(); let reads = 0;
    const work = env.render().runAction({ id: 1, kind: 'delete' }, () => pending.promise, async () => { reads++; });
    if (unmount) env.runtime.dispose(); else env.render('2:8:true:true');
    pending.resolve({ success: true }); await work;
    assert.equal(reads, 0); assert.equal(env.runtime.lateUpdates, 0);
  }
});
