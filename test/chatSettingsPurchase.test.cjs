const { assert, test, base, compile, driver, nodes, find, deferred, settle, ModalFooter } = require('./helpers/chatDialogHarness.cjs');
const Button = () => null, Modal = () => null, Icon = () => null;
const buttons = tree => nodes(tree, node => node.type === Button);
const confirm = tree => buttons(tree).at(-1);
const alert = tree => nodes(tree, node => node.props?.role === 'alert')[0];
function environment(initial = {}) {
  const runtime = driver(), purchases = [], applied = [];
  let hides = 0, props;
  const request = compile(base + 'useChatDialogRequest.ts', { react: runtime.hooks }).default;
  const Component = compile(base + 'SettingsModal/PurchaseModal.tsx', {
    react: runtime.hooks, '~/components/Modal': Modal, '~/components/Button': Button, '~/components/Icon': Icon,
    '../useChatDialogRequest': request, '../chatFormStyles': { chatFormClass: 'form', chatFormModalClass: 'modal', chatFormActionStyle: { minHeight: 44 } }
  }).default;
  props = { scope: '1:7:theme:rose', title: 'Unlock channel color', description: 'Unlock rose.', price: 100, balance: 1000,
    onPurchase() { const work = deferred(); purchases.push(work); return work.promise; },
    validateReceipt: receipt => Array.isArray(receipt.unlockedThemes) && receipt.unlockedThemes.includes('rose'),
    onApply: value => { applied.push(value); }, onHide: () => hides++, ...initial };
  return { runtime, purchases, applied, get hides() { return hides; }, render(next = {}) { props = { ...props, ...next }; return runtime.render(() => Component(props)); } };
}
const receipt = { coins: 900, unlockedThemes: ['rose'] };

test('purchase confirmation states the exact price, balance and named dialog with shared footer actions', () => {
  const env = environment(), tree = env.render();
  assert.equal(tree.type, Modal); assert.equal(tree.props['aria-label'], 'Unlock channel color'); assert.equal(tree.props.modalLevel, 2);
  assert.equal(confirm(tree).props.children, 'Buy for 100 coins');
  assert.equal(confirm(find(tree, node => node.type === ModalFooter)), confirm(tree));
  assert.equal(env.purchases.length, 0);
  assert.ok(nodes(tree, node => node.type === 'p').some(node => node.props.children === 'Your balance: 1,000 coins'));
});

test('pending purchase stays focused, guards duplicate clicks and all dismissal paths', async () => {
  const env = environment(); const submit = confirm(env.render());
  submit.props.onClick(); submit.props.onClick(); assert.equal(env.purchases.length, 1);
  const tree = env.render(); assert.equal(confirm(tree).props['aria-busy'], true); assert.equal(confirm(tree).props.disabled, false);
  assert.equal(confirm(tree).props.loading, undefined); assert.equal(tree.props.closeOnEscape, false); assert.equal(tree.props.showCloseButton, false);
  assert.equal(tree.props.closeOnBackdropClick, false); assert.equal(buttons(tree)[0].props.disabled, true);
  tree.props.onClose(); buttons(tree)[0].props.onClick(); assert.equal(env.hides, 0);
  env.purchases[0].resolve(receipt); await settle(); assert.deepEqual(env.applied, [receipt]); assert.equal(env.hides, 1);
});

test('purchase failure retains confirmation, shows linked error and allows explicit retry', async () => {
  const env = environment(); confirm(env.render()).props.onClick(); env.purchases[0].reject(new Error('offline')); await settle();
  let tree = env.render(); assert.equal(env.hides, 0); assert.equal(env.applied.length, 0);
  assert.match(alert(tree).props.children, /Couldn’t confirm/); assert.equal(confirm(tree).props['aria-describedby'], alert(tree).props.id);
  confirm(tree).props.onClick(); tree = env.render(); assert.equal(alert(tree), undefined);
  env.purchases[1].resolve(receipt); await settle(); assert.equal(env.hides, 1); assert.deepEqual(env.applied, [receipt]);
});

test('confirmed purchase with failed local hydration retries the cached receipt without buying again', async () => {
  let attempts = 0;
  const env = environment({ onApply() { if (++attempts === 1) throw new Error('local hydration'); } });
  confirm(env.render()).props.onClick(); env.purchases[0].resolve(receipt); await settle();
  const tree = env.render({ balance: 0 }); assert.match(alert(tree).props.children, /purchase was confirmed/);
  assert.equal(confirm(tree).props.children, 'Retry updating'); assert.equal(confirm(tree).props.disabled, false);
  assert.equal(buttons(tree)[0].props.children, 'Close'); assert.equal(env.hides, 0);
  confirm(tree).props.onClick(); await settle(); assert.equal(env.purchases.length, 1); assert.equal(attempts, 2); assert.equal(env.hides, 1);
});

test('insufficient funds disables purchase and a newly lowered balance prevents submitting', () => {
  const env = environment({ balance: 90 }); let tree = env.render();
  assert.equal(confirm(tree).props.disabled, true); confirm(tree).props.onClick(); assert.equal(env.purchases.length, 0);
  assert.match(find(tree, node => node.props?.role === 'status').props.children.join(''), /10 more coins/);
  tree = env.render({ balance: 100 }); assert.equal(confirm(tree).props.disabled, false);
  tree = env.render({ balance: 0 }); confirm(tree).props.onClick(); assert.equal(env.purchases.length, 0);
});

test('invalid and mismatched receipts never overwrite canonical coins or unlock state', async () => {
  for (const value of [null, {}, { coins: -1, unlockedThemes: ['rose'] }, { coins: NaN, unlockedThemes: ['rose'] }, { coins: '900', unlockedThemes: ['rose'] }, { coins: 900, unlockedThemes: ['orange'] }]) {
    const env = environment(); confirm(env.render()).props.onClick(); env.purchases[0].resolve(value); await settle();
    assert.ok(alert(env.render())); assert.equal(env.applied.length, 0); assert.equal(env.hides, 0);
  }
});

test('old account, channel or purchase-item completions cannot hydrate or dismiss the new dialog', async () => {
  for (const scope of ['2:7:theme:rose', '1:8:theme:rose', '1:7:theme:pink']) {
    const env = environment(); confirm(env.render()).props.onClick(); env.render({ scope });
    env.purchases[0].resolve(receipt); await settle(); assert.equal(env.applied.length, 0); assert.equal(env.hides, 0); assert.equal(alert(env.render()), undefined);
  }
});

test('unmounted purchase ignores late success and failure without state updates', async () => {
  for (const failure of [false, true]) {
    const env = environment(); confirm(env.render()).props.onClick(); env.runtime.dispose();
    if (failure) env.purchases[0].reject(new Error('late failure')); else env.purchases[0].resolve(receipt);
    await settle(); assert.equal(env.runtime.lateUpdates, 0); assert.equal(env.applied.length, 0); assert.equal(env.hides, 0);
  }
});

test('a new purchase scope cannot reuse the previous acknowledged receipt', async () => {
  const env = environment({ onApply() { throw new Error('local'); } });
  confirm(env.render()).props.onClick(); env.purchases[0].resolve(receipt); await settle();
  assert.equal(confirm(env.render()).props.children, 'Retry updating');
  const tree = env.render({ scope: '1:8:theme:rose' }); assert.equal(confirm(tree).props.children, 'Buy for 100 coins');
  assert.equal(alert(tree), undefined); confirm(tree).props.onClick(); assert.equal(env.purchases.length, 2);
  env.purchases[1].reject(new Error('local fixture cleanup')); await settle();
});

test('completion waits for local hydration and ignores dismissal after a scope change', async () => {
  const hydration = deferred(), env = environment({ onApply: () => hydration.promise });
  confirm(env.render()).props.onClick(); env.purchases[0].resolve(receipt); await settle();
  assert.equal(confirm(env.render()).props.children, 'Updating…'); assert.equal(env.hides, 0);
  env.render({ scope: '2:7:theme:rose' }); hydration.resolve(); await settle(); assert.equal(env.hides, 0);
});
