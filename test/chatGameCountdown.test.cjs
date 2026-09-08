const { assert, test, compile, driver } = require('./helpers/chatDialogHarness.cjs');
test('board countdown follows channel/game identity and clears when the channel disappears', () => {
  const runtime = driver();
  const { countdownStore, useCountdownValue } = compile('src/contexts/GameCountdown.tsx', { react: runtime.hooks });
  countdownStore.set(7, 'chess', 100); countdownStore.set(8, 'chess', 200); countdownStore.set(8, 'omok', 300);
  const render = (id, game = 'chess') => runtime.render(() => useCountdownValue(id, game));
  assert.equal(render(7), 100); assert.equal(countdownStore.listeners.size, 1);
  assert.equal(render(8), 200); assert.equal(render(8, 'omok'), 300);
  assert.equal(countdownStore.listeners.size, 1);
  assert.equal(render(undefined), null); assert.equal(countdownStore.listeners.size, 0);
  countdownStore.set(8, 'omok', 10); assert.equal(render(undefined), null);
  assert.equal(render(8, 'omok'), 10);
  runtime.dispose(); assert.equal(countdownStore.listeners.size, 0);
  countdownStore.set(8, 'omok', 0); assert.equal(runtime.lateUpdates, 0);
});
test('countdown updates notify only on changed values and preserve zero', () => {
  const runtime = driver();
  const { countdownStore } = compile('src/contexts/GameCountdown.tsx', { react: runtime.hooks });
  let notifications = 0; const unsubscribe = countdownStore.subscribe(() => notifications++);
  countdownStore.set(7, 'chess', 0); countdownStore.set(7, 'chess', 0);
  assert.equal(notifications, 1); assert.equal(countdownStore.get(7, 'chess'), 0);
  assert.equal(countdownStore.get(7, 'omok'), null);
  unsubscribe(); countdownStore.set(7, 'chess', null); assert.equal(notifications, 1);
});
