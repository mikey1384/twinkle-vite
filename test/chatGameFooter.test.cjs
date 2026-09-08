const {
  assert,
  test,
  compile,
  driver,
  nodes,
  deferred,
  settle
} = require('./helpers/chatDialogHarness.cjs');
function fixture(onDone) {
  const d = driver(),
    Button = () => null;
  const Component = compile(
    'src/containers/Chat/Modals/GameModals/GameModalFooter.tsx',
    { react: d.hooks, '~/components/Button': Button }
  ).default;
  const props = { onClose: () => {}, showDoneButton: true, onDone };
  const render = () => d.render(() => Component(props));
  return {
    d,
    props,
    render,
    done: (tree) =>
      nodes(tree, (n) => n.type === Button && n.props.children === 'Done')[0]
  };
}
test('unready board disables mutation controls without trapping Close', () => {
  let calls = 0;
  const f = fixture(() => calls++);
  Object.assign(f.props, {
    actionsDisabled: true,
    showGameEndButton: true,
    showOfferDraw: true,
    showCancelMove: true
  });
  const tree = f.render();
  for (const label of ['Resign', 'Offer draw', 'Cancel', 'Done'])
    assert.equal(
      nodes(tree, (n) => n.props?.children === label)[0].props.disabled,
      true
    );
  assert.notEqual(
    nodes(tree, (n) => n.props?.children === 'Close')[0].props.disabled,
    true
  );
  f.done(tree).props.onClick();
  assert.equal(calls, 0);
  f.d.dispose();
});
test('Done locks duplicate submissions and clears busy state after success', async () => {
  const p = deferred();
  let calls = 0;
  const f = fixture(() => {
    calls++;
    return p.promise;
  });
  const button = f.done(f.render());
  button.props.onClick();
  button.props.onClick();
  assert.equal(calls, 1);
  assert.equal(f.done(f.render()).props.disabled, true);
  p.resolve();
  await settle();
  assert.equal(f.done(f.render()).props.loading, false);
  f.d.dispose();
});
test('Done exposes uncertain failure, permits retry and respects unavailable actions', async () => {
  let calls = 0;
  const f = fixture(async () => {
    if (++calls === 1) throw Error('offline');
  });
  f.done(f.render()).props.onClick();
  await settle();
  let tree = f.render();
  assert.equal(nodes(tree, (n) => n.props?.role === 'alert').length, 1);
  f.done(tree).props.onClick();
  await settle();
  assert.equal(nodes(f.render(), (n) => n.props?.role === 'alert').length, 0);
  f.props.doneDisabled = true;
  f.done(f.render()).props.onClick();
  assert.equal(calls, 2);
  f.d.dispose();
  const g = fixture(undefined);
  assert.equal(g.done(g.render()).props.disabled, true);
  g.d.dispose();
});
test('Done completion does not update an unmounted footer', async () => {
  const p = deferred(),
    f = fixture(() => p.promise);
  f.done(f.render()).props.onClick();
  f.d.dispose();
  p.reject(Error('offline'));
  await settle();
  assert.equal(f.d.lateUpdates, 0);
});
