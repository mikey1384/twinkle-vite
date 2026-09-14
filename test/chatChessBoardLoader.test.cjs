const {
  assert,
  test,
  compile,
  driver,
  nodes,
  deferred,
  settle
} = require('./helpers/chatDialogHarness.cjs');
function fixture(fetch) {
  const d = driver(),
    Chess = () => null,
    Button = () => null,
    BoardFrame = () => null,
    BoardWrapper = () => null,
    writes = [];
  const Component = compile(
    'src/containers/Chat/Modals/GameModals/ChessModal/ChessGame.tsx',
    {
      react: d.hooks,
      '~/contexts': {
        useAppContext: (fn) =>
          fn({ requestHelpers: { fetchCurrentChessState: fetch } })
      },
      '../../../Chess': Chess,
      '~/components/Button': Button,
      '../../../Chess/Game/BoardFrame': BoardFrame,
      '../../../BoardWrapper': BoardWrapper,
      '../../../Chess/helpers/theme': {
        getUserChatSquareColors: () => undefined
      },
      '~/containers/Chat/helpers/gameMessageIds': {
        getLatestGameBoundaryMessageId: () => null
      }
    }
  ).default;
  const props = {
    channelId: 2,
    myId: 1,
    currentChannel: {},
    onSetUserMadeLastMove: (v) => writes.push(v),
    onSetMessage: (v) => writes.push(v),
    onSetInitialState: (v) => writes.push(v)
  };
  return {
    d,
    props,
    writes,
    Chess,
    Button,
    BoardFrame,
    BoardWrapper,
    render: () => d.render(() => Component(props))
  };
}
const valid = { id: 20, userId: 2, chessState: { move: { number: 1 } } };
test('parent readiness remains false after failure and becomes true only after validated load', async () => {
  let calls = 0;
  const readiness = [],
    f = fixture(async () => {
      if (++calls === 1) throw Error('offline');
      return valid;
    });
  f.props.onLoadStateChange = (value) => readiness.push(value);
  f.render();
  await settle();
  assert.deepEqual(readiness, [false]);
  nodes(f.render(), (n) => n.type === f.Button)[0].props.onClick();
  f.render();
  await settle();
  assert.deepEqual(readiness, [false, false, true]);
  f.props.channelId = 3;
  f.render();
  assert.equal(readiness.at(-1), false);
  f.d.dispose();
  await settle();
  assert.equal(readiness.at(-1), false);
});
test('failed board load never exposes Chess; explicit retry recovers without automatic replay', async () => {
  let calls = 0;
  const f = fixture(async () => {
    if (++calls === 1) throw Error('offline');
    return valid;
  });
  const loading = f.render();
  assert.equal(loading.type, f.BoardWrapper);
  assert.equal(
    nodes(loading, (n) => n.type === f.BoardFrame)[0].props.loading,
    true
  );
  assert.equal(nodes(loading, (n) => n.type === f.Chess).length, 0);
  await settle();
  let tree = f.render();
  assert.equal(calls, 1);
  assert.equal(f.writes.length, 0);
  assert.equal(nodes(tree, (n) => n.props?.role === 'alert').length, 1);
  assert.equal(tree.type, f.BoardWrapper);
  assert.equal(
    nodes(tree, (n) => n.type === f.BoardFrame)[0].props.loading,
    false
  );
  nodes(tree, (n) => n.type === f.Button)[0].props.onClick();
  f.render();
  await settle();
  assert.equal(f.render().type, f.Chess);
  assert.equal(calls, 2);
  f.d.dispose();
});
test('scope changes and unmount prevent old board results from updating parent state', async () => {
  const old = deferred(),
    next = deferred(),
    f = fixture(({ channelId }) =>
      channelId === 2 ? old.promise : next.promise
    );
  f.render();
  f.props.channelId = 3;
  f.render();
  old.resolve(valid);
  await settle();
  assert.equal(f.writes.length, 0);
  next.resolve(valid);
  await settle();
  assert.equal(f.render().type, f.Chess);
  f.props.myId = 9;
  assert.equal(
    nodes(f.render(), (n) => n.type === f.BoardFrame)[0].props.loading,
    true
  );
  f.d.dispose();
  await settle();
  assert.equal(f.d.lateUpdates, 0);
});
test('empty history permits a fresh board but malformed stored records do not', async () => {
  for (const response of [null, '', undefined]) {
    const f = fixture(async () => response);
    f.render();
    await settle();
    assert.equal(f.render().type, f.Chess);
    f.d.dispose();
  }
  for (const response of [
    {},
    { ...valid, chessState: null },
    { ...valid, chessState: [] },
    { ...valid, userId: 0 }
  ]) {
    const f = fixture(async () => response);
    f.render();
    await settle();
    assert.equal(nodes(f.render(), (n) => n.props?.role === 'alert').length, 1);
    assert.equal(f.writes.length, 0);
    f.d.dispose();
  }
});
