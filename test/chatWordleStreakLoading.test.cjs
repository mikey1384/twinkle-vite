const {
  assert,
  test,
  compile,
  driver,
  nodes,
  deferred,
  settle
} = require('./helpers/chatDialogHarness.cjs');
function fixture(load) {
  const d = driver(),
    Button = () => null,
    Loading = () => null,
    Item = () => null;
  let timeout;
  const Component = compile(
    'src/containers/Chat/Modals/WordleModal/Streaks/StreakLeaderboard.tsx',
    {
      react: d.hooks,
      '~/components/Button': Button,
      '~/components/Loading': Loading,
      '~/components/LeaderboardList': () => null,
      './StreakItem': Item
    },
    {
      setTimeout: (fn) => {
        timeout = fn;
        return 1;
      },
      clearTimeout: () => {}
    }
  );
  const props = {
    channelId: 2,
    myId: 1,
    theme: 'gold',
    label: 'Win Streaks',
    load
  };
  return {
    d,
    props,
    Button,
    Loading,
    Item,
    timeout: () => timeout(),
    render: () => d.render(() => Component.default(props))
  };
}
const valid = {
  bestStreaks: [3],
  bestStreakObj: { 3: [{ id: 2, username: 'Player', currentStreak: 3 }] }
};
test('streak failures leave loading, offer retry and recover; empty is not a spinner', async () => {
  let calls = 0;
  const f = fixture(async () => {
    if (++calls === 1) throw Error('offline');
    return valid;
  });
  assert.equal(f.render().type, f.Loading);
  await settle();
  let tree = f.render();
  assert.equal(nodes(tree, (n) => n.props?.role === 'alert').length, 1);
  nodes(tree, (n) => n.type === f.Button)[0].props.onClick();
  f.render();
  await settle();
  assert.equal(nodes(f.render(), (n) => n.type === f.Item).length, 1);
  f.d.dispose();
  const empty = fixture(async () => ({ bestStreaks: [], bestStreakObj: {} }));
  empty.render();
  await settle();
  assert.equal(empty.render().props.role, 'status');
  empty.d.dispose();
});
test('malformed streak data is recoverable rather than crashing list rendering', async () => {
  for (const response of [
    undefined,
    {},
    { bestStreaks: [3], bestStreakObj: {} },
    { bestStreaks: [3], bestStreakObj: { 3: [null] } },
    { bestStreaks: [3, 3], bestStreakObj: valid.bestStreakObj }
  ]) {
    const f = fixture(async () => response);
    f.render();
    await settle();
    assert.equal(nodes(f.render(), (n) => n.props?.role === 'alert').length, 1);
    f.d.dispose();
  }
});
test('timeout ignores late responses; scope changes and unmount ignore old completions', async () => {
  const pending = deferred(),
    f = fixture(() => pending.promise);
  f.render();
  f.timeout();
  assert.equal(nodes(f.render(), (n) => n.props?.role === 'alert').length, 1);
  pending.resolve(valid);
  await settle();
  assert.equal(nodes(f.render(), (n) => n.type === f.Item).length, 0);
  f.d.dispose();
  const old = deferred(),
    next = deferred(),
    g = fixture((id) => (id === 2 ? old.promise : next.promise));
  g.render();
  g.props.channelId = 3;
  assert.equal(g.render().type, g.Loading);
  old.resolve(valid);
  await settle();
  assert.equal(g.render().type, g.Loading);
  next.resolve(valid);
  await settle();
  assert.equal(nodes(g.render(), (n) => n.type === g.Item).length, 1);
  g.props.myId = 9;
  assert.equal(g.render().type, g.Loading);
  g.d.dispose();
  await settle();
  assert.equal(g.d.lateUpdates, 0);
});
