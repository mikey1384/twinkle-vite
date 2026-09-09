const {
  assert,
  test,
  compile,
  driver,
  css,
  nodes,
  deferred,
  settle,
  source
} = require('./helpers/chatDialogHarness.cjs');
function fixture(onDone) {
  const d = driver(),
    Switch = () => null,
    Button = () => null,
    leaf = () => null;
  const ctx = {
    myState: { twinkleCoins: 10000, userId: 1 },
    user: { actions: { onSetUserState: () => {} } },
    requestHelpers: {
      buyChatSubject: () => {
        throw Error('Unexpected purchase');
      }
    },
    actions: { onEnableChatSubject: () => {} }
  };
  const Component = compile('src/containers/Chat/Modals/BuyTopicsModal.tsx', {
    react: d.hooks,
    '~/components/Modal': leaf,
    '~/components/Button': Button,
    './SettingsModal/PurchaseModal': leaf,
    './chatFormStyles': { chatFormModalClass: '' },
    '~/components/Buttons/SwitchButton': Switch,
    '~/components/Icon': leaf,
    '~/constants/defaultValues': { priceTable: { chatSubject: 1000 } },
    '~/contexts': {
      useAppContext: (fn) => fn(ctx),
      useChatContext: (fn) => fn(ctx),
      useKeyContext: (fn) => fn(ctx)
    },
    '~/constants/css': {
      Color: { logoBlue: () => '#123', gold: () => '#fc2' },
      mobileMaxWidth: '767px'
    },
    '@emotion/css': { css }
  }).default;
  const props = {
    channelId: 2,
    canChangeSubject: 'owner',
    userIsChannelOwner: true,
    onDone,
    onScrollToBottom: () => {}
  };
  return {
    d,
    props,
    ctx,
    Button,
    Switch,
    render: () => d.render(() => Component(props))
  };
}

test('topic purchase wiring validates its receipt and reveals permissions without waiting for context refresh', async () => {
  const f = fixture(() => {}),
    updates = [];
  f.props.canChangeSubject = '';
  f.ctx.requestHelpers.buyChatSubject = async (id) => {
    assert.equal(id, 2);
    return { coins: 9000, topic: { id: 4, content: 'Topic' } };
  };
  f.ctx.actions.onEnableChatSubject = (v) => updates.push(v);
  f.ctx.user.actions.onSetUserState = (v) => updates.push(v);
  nodes(
    f.render().props.footer,
    (n) => n.type === f.Button && n.props.children === 'Enable topics'
  )[0].props.onClick();
  let t = f.render(),
    purchase = nodes(t, (n) => typeof n.props?.onPurchase === 'function')[0]
      .props;
  assert.equal(purchase.scope, '1:2:topics');
  assert.equal(purchase.price, 1000);
  assert.equal(purchase.balance, 10000);
  for (const topic of [
    null,
    {},
    { id: 0, content: 'x' },
    { id: 4, content: [] }
  ])
    assert.equal(purchase.validateReceipt({ coins: 1, topic }), false);
  const receipt = await purchase.onPurchase();
  assert.equal(purchase.validateReceipt(receipt), true);
  purchase.onApply(receipt);
  purchase.onHide();
  t = f.render();
  assert.equal(updates[0].topic.id, 4);
  assert.equal(updates[1].newState.twinkleCoins, 9000);
  assert.equal(
    nodes(
      t.props.footer,
      (n) => n.type === f.Button && n.props.children === 'Enable topics'
    ).length,
    0
  );
  assert.equal(nodes(t, (n) => n.type === f.Switch).length, 1);
  f.d.dispose();
});

test('topic purchase rechecks ownership and channel validity at confirmation time', async () => {
  const f = fixture(() => {});
  f.props.canChangeSubject = '';
  let calls = 0;
  f.ctx.requestHelpers.buyChatSubject = async () => {
    calls++;
  };
  nodes(
    f.render().props.footer,
    (n) => n.type === f.Button && n.props.children === 'Enable topics'
  )[0].props.onClick();
  f.props.userIsChannelOwner = false;
  let purchase = nodes(
    f.render(),
    (n) => typeof n.props?.onPurchase === 'function'
  )[0].props;
  await assert.rejects(purchase.onPurchase());
  assert.equal(calls, 0);
  f.props.userIsChannelOwner = true;
  f.props.channelId = 0;
  purchase = nodes(
    f.render(),
    (n) => typeof n.props?.onPurchase === 'function'
  )[0].props;
  await assert.rejects(purchase.onPurchase());
  assert.equal(calls, 0);
  f.d.dispose();
});
test('close awaits permission save, locks duplicates, retains selection on failure and recovers', async () => {
  const p = deferred();
  let calls = 0,
    choice;
  const f = fixture((v) => {
    choice = v;
    return ++calls === 1 ? p.promise : Promise.resolve();
  });
  let t = f.render();
  nodes(t, (n) => n.type === f.Switch)[0].props.onChange();
  t = f.render();
  t.props.onClose();
  t.props.onClose();
  assert.equal(calls, 1);
  assert.equal(choice, 'all');
  assert.equal(
    nodes(f.render(), (n) => n.type === f.Switch)[0].props.disabled,
    true
  );
  p.reject(Error('offline'));
  await settle();
  t = f.render();
  assert.equal(
    nodes(t.props.footer, (n) => n.props?.role === 'alert').length,
    1
  );
  assert.equal(nodes(t, (n) => n.type === f.Switch)[0].props.checked, true);
  await t.props.onClose();
  assert.equal(calls, 2);
  assert.equal(
    nodes(f.render().props.footer, (n) => n.props?.role === 'alert').length,
    0
  );
  f.d.dispose();
});
test('late save completion does not update an unmounted topic dialog', async () => {
  const p = deferred(),
    f = fixture(() => p.promise);
  f.render().props.onClose();
  f.d.dispose();
  p.reject(Error('offline'));
  await settle();
  assert.equal(f.d.lateUpdates, 0);
});
test('topic modal caller skips unchanged permission writes and keys viewer/channel identity', () => {
  const text = source('src/containers/Chat/Body/MessagesContainer/Modals.tsx');
  assert.match(text, /if \(canChange !== currentChannel.canChangeSubject\)/);
  assert.match(
    text,
    /<BuyTopicsModal\s+key=\{`\$\{userId\}:\$\{selectedChannelId\}`\}/
  );
});
