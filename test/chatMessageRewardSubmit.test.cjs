const {
  assert,
  test,
  ModalFooter,
  compile,
  driver,
  css,
  nodes,
  deferred,
  settle
} = require('./helpers/chatDialogHarness.cjs');
function fixture(onSubmit) {
  const d = driver(),
    Button = () => null,
    Reason = () => null,
    Level = () => null,
    Modal = () => null,
    leaf = () => null;
  const ctx = {
    theme: { done: { color: 'green' } },
    myState: { twinkleCoins: 1000 }
  };
  let closes = 0;
  const Component = compile(
    'src/containers/Chat/Modals/MessageRewardModal/index.tsx',
    {
      react: d.hooks,
      '~/components/Modal': Modal,
      '~/components/Modal/LegacyModalLayout': leaf,
      '~/components/Button': Button,
      './RewardReason': Reason,
      './RewardAmountPicker': {
        default: Level,
        __esModule: true,
        rewardLevels: [1, 2, 3, 4, 5, 25, 50]
      },
      '~/constants/defaultValues': {
        rewardReasons: { 1: { message: 'Helpful' } }
      },
      '~/helpers/stringHelpers': { addCommasToNumber: String },
      '~/contexts': { useKeyContext: (fn) => fn(ctx) },
      '~/constants/css': { Color: { darkerGray: () => '#333' } },
      '@emotion/css': { css }
    }
  ).default;
  const render = () =>
    d.render(() =>
      Component({
        onHide: () => closes++,
        userToReward: { id: 2, username: 'Preview' },
        onSubmit
      })
    );
  const submit = (t) =>
    nodes(t, (n) => n.type === Button && n.props.children === 'Submit')[0];
  const select = (amount = 1) => {
    const t = render();
    nodes(t, (n) => n.type === Level)[0].props.onSetRewardLevel(amount);
    nodes(t, (n) => n.type === Reason)[0].props.onSelectReasonId(1);
  };
  return { d, ctx, render, submit, select, closes: () => closes };
}
test('reward submits once, blocks dismissal pending and prevents unsafe retry after uncertainty', async () => {
  const p = deferred();
  let calls = 0;
  const f = fixture(() => {
    calls++;
    return p.promise;
  });
  f.select();
  let t = f.render();
  f.submit(t).props.onClick();
  f.submit(t).props.onClick();
  t = f.render();
  t.props.onClose();
  assert.equal(f.closes(), 0);
  assert.equal(calls, 1);
  p.reject(Error('uncertain'));
  await settle();
  t = f.render();
  assert.equal(nodes(t, (n) => n.props?.role === 'alert').length, 1);
  const footer = nodes(t, n => n.type === ModalFooter)[0];
  assert.equal(nodes(footer, n => n.props?.role === 'alert').length, 1);
  assert.equal(nodes(footer, n => n.props?.children === 'Close').length, 1);
  assert.equal(nodes(footer, n => n.props?.children === 'Cancel').length, 0);
  assert.equal(f.submit(t).props.disabled, true);
  f.submit(t).props.onClick();
  assert.equal(calls, 1);
  t.props.onClose();
  assert.equal(f.closes(), 1);
  f.d.dispose();
});
test('reward validates levels and balance and ignores completion after unmount', async () => {
  let calls = 0;
  const p = deferred(),
    f = fixture(() => {
      calls++;
      return p.promise;
    });
  for (const amount of [-1, 1.5, 999, NaN]) {
    f.select(amount);
    const t = f.render();
    assert.equal(f.submit(t).props.disabled, true);
    f.submit(t).props.onClick();
  }
  f.select(1);
  f.ctx.myState.twinkleCoins = 0;
  let t = f.render();
  f.submit(t).props.onClick();
  assert.equal(calls, 0);
  f.ctx.myState.twinkleCoins = 1000;
  t = f.render();
  f.submit(t).props.onClick();
  f.d.dispose();
  p.resolve();
  await settle();
  assert.equal(f.d.lateUpdates, 0);
});
