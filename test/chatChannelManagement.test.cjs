const { assert, test, React, base, source, compile, driver, css, nodes, find, deferred, settle, callback } = require('./helpers/chatDialogHarness.cjs');
const Button = () => null, Modal = () => null, Leaf = () => null;
const Name = () => null, Owner = () => null, ImageEditor = () => null, Thumbnail = () => null, Colors = () => null;
const mina = { id: 2, username: 'Mina', level: 5 };
const noah = { id: 3, username: 'Noah', level: 1 };
const button = (tree, label) => find(tree, node => node.type === Button && (node.props['aria-label'] === label || node.props.children === label));
const searchField = tree => find(tree, node => node.type === 'input' && node.props.type === 'search');
const alerts = tree => nodes(tree, node => node.props?.role === 'alert');

function environment(file = 'SelectNewOwnerModal.tsx', initial = {}) {
  const runtime = driver(), searches = [], saves = [], uploads = [], transfers = [], fetches = [], revoked = [], events = [], timers = new Map();
  let timerId = 0, userId = 1, objectId = 0, hides = 0, props;
  const request = array => payload => { const work = deferred(); array.push({ ...work, payload }); return work.promise; };
  const requests = { searchChannelMembers: request(searches), createThumbnailUpload: request(uploads) };
  const contexts = {
    useKeyContext: fn => fn({ myState: { userId, twinkleCoins: 1000 }, theme: { done: { color: 'blue' } } }),
    useAppContext: fn => fn({ requestHelpers: requests, user: { actions: { onSetUserState(value) { events.push(['user', value]); } } } }),
    useChatContext: fn => fn({ state: { customChannelNames: props?.customNames || {}, channelsObj: {} }, actions: { onSetChannelState: value => events.push(['channel', value]), onEnableChatSubject: value => events.push(['topics', value]) } })
  };
  const hook = compile(base + 'useChatDialogRequest.ts', { react: runtime.hooks }).default;
  const helpers = { isSupermod: level => level >= 5, returnImageFileFromUrl: () => ({ size: 100 }) };
  const strings = { stringIsEmpty: value => !String(value || '').trim(), exceedsCharLimit: ({ inputType, text }) => (text || '').length > (inputType === 'description' ? 1000 : 200) ? { message: 'Long' } : null };
  const deps = {
    react: runtime.hooks, '@emotion/css': { css }, '~/contexts': contexts,
    '~/components/Button': Button, '~/components/Modal': Modal, '~/components/UserSearchResultRow': Leaf,
    '~/components/Loading': Leaf, '~/components/Icon': Leaf, '~/components/Modals/ConfirmModal': Leaf,
    '~/components/Modals/ImageEditModal': ImageEditor, '../SelectNewOwnerModal': Owner,
    './NameChanger': Name, './GroupThumbnail': Thumbnail, './ColorSelector': Colors, './PurchaseModal': Leaf,
    './useDeletedTopicsList': compile(base + 'SettingsModal/useDeletedTopicsList.ts', { react: runtime.hooks }).default,
    './useDeletedTopicAction': compile(base + 'SettingsModal/useDeletedTopicAction.ts', { react: runtime.hooks, '../useChatDialogRequest': hook }).default,
    '~/helpers': helpers, '~/helpers/stringHelpers': strings, '../helpers': {},
    '~/constants/defaultValues': { cloudFrontURL: '', priceTable: { chatSubject: 500, chatTheme: 100 } },
    '~/constants/css': { Color: new Proxy({}, { get: () => () => '#418ceb' }) },
    uuid: { v1: () => 'upload-id' },
    './useChatDialogRequest': hook, '../useChatDialogRequest': hook,
    './chatFormStyles': {}, '../chatFormStyles': {}
  };
  const Component = compile(base + file, deps, {
    setTimeout: fn => { const id = ++timerId; timers.set(id, fn); return id; }, clearTimeout: id => timers.delete(id),
    URL: { createObjectURL: () => 'blob:sample-' + ++objectId, revokeObjectURL: value => revoked.push(value) },
    fetch: (...args) => { const work = deferred(); fetches.push({ ...work, args }); return work.promise; }
  }).default;
  props = { channelId: 7, channelName: 'Study room', members: [mina, noah], isClass: false,
    isPublic: false, isClosed: false, onlyOwnerCanPost: false, description: 'Study together',
    canChangeSubject: 'all', theme: 'green', unlockedThemes: [], thumbPath: '', userIsChannelOwner: true,
    onHide: () => hides++, onDone: request(saves), onSubmit: request(transfers), onSelectNewOwner: request(transfers), ...initial };
  return {
    runtime, requests, searches, saves, uploads, transfers, fetches, revoked, deps, timers, events,
    get hides() { return hides; }, viewer(value) { userId = value; },
    render(next = {}) { props = { ...props, ...next }; return runtime.render(() => Component(props)); },
    tick() { const tasks = [...timers.values()]; timers.clear(); tasks.forEach(fn => fn()); }
  };
}
const radio = (tree, name) => find(tree, node => node.type === 'input' && node.props['aria-label'] === 'Select ' + name);

const deletedDialog = tree => find(tree, node => node.type === Modal && node.props['aria-label'] === 'Deleted topics');
const openDeleted = tree => find(tree, node => node.type === Button && Array.isArray(node.props.children) && node.props.children.includes(' Deleted topics'));
const restore = tree => find(tree, node => node.type === Button && Array.isArray(node.props.children) && node.props.children.some(child => child?.props?.children === 'Restore'));
async function deletedEnvironment() {
  const env = environment('SettingsModal/index.tsx');
  env.requests.loadDeletedTopics = async () => [{ id: 9, content: 'Recover me', username: 'Mina' }];
  await openDeleted(env.render()).props.onClick();
  env.render();
  return env;
}
test('Settings restore acknowledgement survives refresh failure and rejects malformed canonical state', async () => {
  const env = await deletedEnvironment(); let writes = 0, reads = 0;
  env.requests.restoreDeletedTopic = async payload => { assert.deepEqual(payload, { channelId: 7, topicId: 9 }); writes++; return { success: true }; };
  env.requests.loadChatChannel = async payload => { assert.equal(payload.fromWriter, true); reads++; return {}; };
  await restore(env.render()).props.onClick();
  let tree = env.render(); assert.equal(env.events.length, 0); assert.match(alerts(tree)[0].props.children, /Topic restored/);
  assert.equal(button(tree, 'Retry updating').props.variant, 'soft');
  assert.equal(button(tree, 'Retry updating').props.color, 'logoBlue');
  assert.equal(deletedDialog(tree).props.header.props.style.fontSize, 20);
  assert.equal(restore(tree).props.disabled, true);
  env.requests.loadChatChannel = async () => { reads++; return { channel: { id: 7, pinnedTopicIds: [], topicObj: {} } }; };
  await button(env.render(), 'Retry updating').props.onClick(); tree = env.render();
  assert.equal(writes, 1); assert.equal(reads, 2); assert.equal(alerts(tree).length, 0);
  assert.equal(env.events[0][1].channelId, 7);
});
test('Settings deletion guards dismissal while pending and closes both dialogs after an acknowledged refresh error', async () => {
  const env = await deletedEnvironment(), pending = deferred(); let writes = 0;
  env.requests.permanentlyDeleteTopic = () => { writes++; return pending.promise; };
  env.requests.loadChatChannel = async () => { throw new Error('offline'); };
  button(env.render(), 'Permanently delete topic: Recover me').props.onClick();
  const work = button(env.render(), 'Delete permanently').props.onClick();
  let tree = env.render(); const confirmation = find(tree, node => node.type === Modal && node.props['aria-label'] === 'Permanently delete topic');
  confirmation.props.onClose(); deletedDialog(tree).props.onClose();
  assert.equal(confirmation.props.closeOnEscape, false); assert.equal(nodes(env.render(), node => node.type === Modal).length, 3);
  pending.resolve({ success: true }); await work; tree = env.render();
  assert.match(alerts(tree)[0].props.children, /Topic permanently deleted/);
  assert.equal(button(tree, 'Retry updating').props.color, 'logoBlue');
  assert.ok(nodes(tree, node => node.type === 'h2' && node.props.children === 'Topic permanently deleted').length);
  find(tree, node => node.type === Modal && node.props['aria-label'] === 'Permanently delete topic').props.onClose();
  assert.equal(nodes(env.render(), node => node.type === Modal).length, 1); assert.equal(writes, 1);
});

test('Settings ignores a canonical refresh finishing after account change or unmount', async () => {
  for (const unmount of [false, true]) {
    const env = await deletedEnvironment(), pending = deferred(); let listReads = 0;
    env.requests.restoreDeletedTopic = async () => ({ success: true });
    env.requests.loadChatChannel = () => pending.promise;
    env.requests.loadDeletedTopics = async () => { listReads++; return []; };
    const work = restore(env.render()).props.onClick(); await settle();
    if (unmount) env.runtime.dispose(); else { env.viewer(2); env.render(); }
    pending.resolve({ channel: { id: 7, pinnedTopicIds: [], topicObj: {} } }); await work;
    assert.equal(env.events.length, 0); assert.equal(listReads, 0); assert.equal(env.runtime.lateUpdates, 0);
  }
});

test('Settings restores lost topic-action focus without stealing focus from another control', async () => {
  for (const movedFocus of [false, true]) {
    const env = await deletedEnvironment(), pending = deferred(); let focused = 0;
    const body = {}, doc = { body, documentElement: {}, activeElement: movedFocus ? {} : body };
    const heading = deletedDialog(env.render()).props.header;
    assert.equal(heading.props.tabIndex, -1);
    heading.props.ref.current = { ownerDocument: doc, focus(options) { assert.equal(options.preventScroll, true); focused++; } };
    env.requests.restoreDeletedTopic = () => pending.promise;
    const work = restore(env.render()).props.onClick(); env.render();
    pending.reject(new Error('offline')); await work; env.render();
    assert.equal(focused, movedFocus ? 0 : 1);
  }
});

test('Settings restores lost focus after a failed-list retry replaces its button', async () => {
  const env = environment('SettingsModal/index.tsx');
  env.requests.loadDeletedTopics = async () => { throw new Error('offline'); };
  await openDeleted(env.render()).props.onClick();
  const pending = deferred(); env.requests.loadDeletedTopics = () => pending.promise;
  const tree = env.render(), body = {}; let focused = 0;
  deletedDialog(tree).props.header.props.ref.current = { ownerDocument: { body, activeElement: body }, focus() { focused++; } };
  const retry = button(tree, 'Retry loading topics').props.onClick(); env.render();
  pending.resolve([]); await retry; env.render(); assert.equal(focused, 1);
});

test('theme purchase preserves canonical payloads, validates the chosen unlock and selects it only after acknowledgement', async () => {
  const env = environment('SettingsModal/index.tsx');
  const calls = [], receipt = { coins: 900, unlockedThemes: ['rose'] };
  env.requests.buyChatTheme = async value => { calls.push(value); return receipt; };
  find(env.render(), node => node.type === Colors).props.onSetColor('rose');
  let tree = env.render(); const purchase = find(tree, node => node.props?.scope === '1:7:theme:rose');
  assert.equal(purchase.key, '1:7:theme:rose'); assert.equal(calls.length, 0);
  assert.equal(find(tree, node => node.type === Colors).props.selectedColor, 'green');
  assert.deepEqual(await purchase.props.onPurchase(), receipt); assert.deepEqual(calls, [{ channelId: 7, theme: 'rose' }]);
  assert.equal(purchase.props.validateReceipt(receipt), true);
  assert.equal(purchase.props.validateReceipt({ coins: 900, unlockedThemes: ['pink'] }), false);
  assert.equal(purchase.props.validateReceipt({ coins: 900, unlockedThemes: ['rose', {}] }), false);
  purchase.props.onApply(receipt);
  assert.deepEqual(env.events, [['channel', { channelId: 7, newState: { unlockedThemes: ['rose'] } }], ['user', { userId: 1, newState: { twinkleCoins: 900 } }]]);
  tree = env.render(); assert.equal(find(tree, node => node.type === Colors).props.selectedColor, 'rose');
  assert.equal(env.hides, 0, 'unlocking does not silently save or dismiss the outer settings draft');
  purchase.props.onHide(); assert.equal(nodes(env.render(), node => node.props?.scope).length, 0);
});

test('topics purchase keeps owner-only eligibility, validates the receipt and applies acknowledged owner permissions', async () => {
  const env = environment('SettingsModal/index.tsx', { canChangeSubject: '', onScrollToBottom() {} });
  const calls = [], receipt = { coins: 500, topic: { id: 30, content: 'Welcome' } };
  env.requests.buyChatSubject = async value => { calls.push(value); return receipt; };
  const open = tree => find(tree, node => node.type === Button && Array.isArray(node.props.children) && node.props.children.join('').includes('Enable topics'));
  open(env.render()).props.onClick(); const purchase = find(env.render(), node => node.props?.scope === '1:7:topics');
  assert.equal(purchase.props.price, 500); assert.deepEqual(await purchase.props.onPurchase(), receipt); assert.deepEqual(calls, [7]);
  assert.equal(purchase.props.validateReceipt(receipt), true); assert.equal(purchase.props.validateReceipt({ topic: { id: 0 } }), false);
  purchase.props.onApply(receipt);
  assert.deepEqual(env.events, [['topics', { channelId: 7, topic: receipt.topic }], ['user', { userId: 1, newState: { twinkleCoins: 500 } }]]);
  const switches = nodes(env.render(), node => node.props?.role === 'switch');
  assert.equal(switches.at(-1).props.checked, false, 'purchase grants owner-only topic permission, not everyone');
  assert.equal(nodes(env.render({ userIsChannelOwner: false }), node => node.props?.scope).length, 0);
});

test('owner choices use native radios, normalize IDs, exclude self/invalid rows and retain teacher-only eligibility', () => {
  const env = environment();
  const tree = env.render({ isClass: true, members: [null, { id: 1, username: 'Me', level: 5 }, noah, { ...mina, id: '2', realName: {}, profilePicUrl: [] }, { id: 5, username: '' }] });
  assert.equal(nodes(tree, node => node.props?.type === 'radio').length, 1);
  assert.equal(radio(tree, 'Mina').props.value, 2);
  const row = find(tree, node => node.type === Leaf && node.props.username === 'Mina');
  assert.equal(row.props.realName, undefined); assert.equal(row.props.profilePicUrl, undefined);
  assert.equal(button(tree, 'Confirm new owner').props.disabled, true);
  assert.ok(find(tree, node => node.type === 'label' && node.props.htmlFor === searchField(tree).props.id));
});

test('owner search is case-insensitive locally, debounced remotely and ignores out-of-order replies', async () => {
  const env = environment(); searchField(env.render()).props.onChange({ target: { value: 'MI' } });
  assert.ok(radio(env.render(), 'Mina')); env.tick(); assert.equal(env.searches.length, 0);
  searchField(env.render()).props.onChange({ target: { value: 'Mina' } }); env.render(); env.tick();
  searchField(env.render()).props.onChange({ target: { value: 'Noah' } }); env.render(); env.tick();
  assert.deepEqual(env.searches[0].payload, { channelId: 7, searchText: 'Mina' });
  env.searches[1].resolve([noah]); await settle(); assert.ok(radio(env.render(), 'Noah'));
  env.searches[0].resolve([mina]); await settle();
  assert.equal(nodes(env.render(), node => node.props?.['aria-label'] === 'Select Mina').length, 0);
});

test('owner search errors retain loaded matches and retry; an empty remote result is not a failure', async () => {
  const env = environment(); searchField(env.render()).props.onChange({ target: { value: 'Mina' } }); env.render(); env.tick();
  env.searches[0].reject(new Error('offline')); await settle();
  let tree = env.render(); assert.equal(alerts(tree).length, 1); assert.ok(radio(tree, 'Mina'));
  button(tree, 'Try member search again').props.onClick(); env.render(); env.tick();
  env.searches[1].resolve([]); await settle(); tree = env.render();
  assert.equal(alerts(tree).length, 0); assert.equal(nodes(tree, node => node.props?.type === 'radio').length, 0);
});

test('owner query respects IME, Enter does not transfer, and first Escape only clears the query', () => {
  const env = environment(); let field = searchField(env.render());
  field.props.onCompositionStart(); field.props.onChange({ target: { value: 'Mina' } }); env.render(); env.tick();
  assert.equal(env.searches.length, 0);
  searchField(env.render()).props.onCompositionEnd({ currentTarget: { value: 'Mina' } }); env.render(); env.tick();
  assert.equal(env.searches.length, 1);
  const events = [], key = searchField(env.render()).props.onKeyDown;
  key({ key: 'Enter', nativeEvent: {}, preventDefault: () => events.push('enter') });
  key({ key: 'Enter', nativeEvent: { isComposing: true }, preventDefault: () => events.push('bad') });
  key({ key: 'Escape', nativeEvent: {}, preventDefault: () => events.push('clear'), stopPropagation: () => events.push('stop') });
  assert.deepEqual(events, ['enter', 'clear', 'stop']); assert.equal(searchField(env.render()).props.value, ''); assert.equal(env.transfers.length, 0);
});

test('ownership transfer waits for acknowledgement, guards duplicates and preserves selection after failure', async () => {
  const env = environment(); radio(env.render(), 'Mina').props.onChange();
  const submit = button(env.render(), 'Confirm new owner'); submit.props.onClick(); submit.props.onClick();
  assert.equal(env.transfers.length, 1); let tree = env.render();
  assert.equal(find(tree, node => node.type === Modal).props.closeOnEscape, false);
  assert.equal(radio(tree, 'Mina').props.disabled, true); assert.equal(env.hides, 0);
  env.transfers[0].reject(new Error('offline')); await settle(); tree = env.render();
  assert.equal(alerts(tree).length, 1); assert.equal(radio(tree, 'Mina').props.checked, true); assert.equal(env.hides, 0);
  button(tree, 'Confirm new owner').props.onClick(); env.transfers[1].resolve(); await settle(); assert.equal(env.hides, 1);
});

test('a confirmed transfer with failed leave locks the chosen owner and offers Retry leaving without misreporting failure', async () => {
  const env = environment('SelectNewOwnerModal.tsx', { andLeave: true });
  radio(env.render(), 'Mina').props.onChange(); button(env.render(), 'Transfer ownership and leave').props.onClick();
  env.transfers[0].payload.onTransferred(); env.transfers[0].reject(new Error('leave failed')); await settle();
  const tree = env.render(); assert.match(alerts(tree)[0].props.children, /Ownership has changed/);
  assert.equal(radio(tree, 'Mina').props.disabled, true); assert.equal(searchField(tree).props.disabled, true);
  assert.ok(button(tree, 'Stay in group')); assert.ok(button(tree, 'Retry leaving group'));
});

test('owner searches and transfers ignore old channel/account/unmount completions and reset selections', async () => {
  for (const change of ['viewer', 'channel', 'unmount']) {
    const env = environment(); radio(env.render(), 'Mina').props.onChange(); button(env.render(), 'Confirm new owner').props.onClick();
    const data = env.transfers[0].payload;
    if (change === 'viewer') { env.viewer(9); env.render(); } else if (change === 'channel') env.render({ channelId: 8 }); else env.runtime.dispose();
    assert.equal(data.canApply(), false); data.onTransferred(); env.transfers[0].resolve(); await settle();
    assert.equal(env.hides, 0); assert.equal(env.runtime.lateUpdates, 0);
    if (change !== 'unmount') assert.equal(button(env.render(), 'Confirm new owner').props.disabled, true);
  }
});

test('settings enforce name/description limits and treat an unchanged custom nickname as unchanged', () => {
  const env = environment('SettingsModal/index.tsx'); let tree = env.render();
  assert.equal(button(tree, 'Save channel settings').props.disabled, true);
  const name = find(tree, node => node.type === Name); name.props.onSetEditedChannelName('x'.repeat(201));
  assert.equal(button(env.render(), 'Save channel settings').props.disabled, true);
  name.props.onSetEditedChannelName('New name'); tree = env.render();
  find(tree, node => node.type === 'textarea').props.onChange({ target: { value: 'x'.repeat(1001) } });
  assert.equal(button(env.render(), 'Save channel settings').props.disabled, true);
  const custom = environment('SettingsModal/index.tsx', { customNames: { 7: 'My study place' }, userIsChannelOwner: false });
  assert.equal(button(custom.render(), 'Save channel settings').props.disabled, true);
  assert.equal(nodes(custom.render(), node => node.type === 'textarea' || node.props?.role === 'switch' || node.type === Colors).length, 0);
});

test('settings await saving, guard duplicate requests and keep a failed draft ready to retry', async () => {
  const env = environment('SettingsModal/index.tsx'); find(env.render(), node => node.type === Name).props.onSetEditedChannelName('New room');
  const save = button(env.render(), 'Save channel settings'); save.props.onClick(); save.props.onClick();
  assert.equal(env.saves.length, 1); assert.equal(env.saves[0].payload.editedChannelName, 'New room');
  assert.equal(find(env.render(), node => node.type === Modal).props.closeOnEscape, false);
  env.saves[0].reject(new Error('offline')); await settle();
  let tree = env.render(); assert.equal(alerts(tree).length, 1); assert.equal(find(tree, node => node.type === Name).props.editedChannelName, 'New room');
  button(tree, 'Save channel settings').props.onClick(); assert.equal(env.saves.length, 2);
});

function setPicture(env) {
  find(env.render(), node => node.type === 'input' && node.props.type === 'file').props.onChange({ target: { files: [{}] } });
  find(env.render(), node => node.type === ImageEditor).props.onEditDone({ croppedImageUrl: 'data:image/png;base64,example' });
}

test('thumbnail upload errors unlock settings and preserve the cropped picture', async () => {
  const env = environment('SettingsModal/index.tsx'); setPicture(env); button(env.render(), 'Save channel settings').props.onClick();
  env.uploads[0].resolve({ signedRequest: 'local-test', path: 'canonical-thumb' }); await settle();
  env.fetches[0].resolve({ ok: false }); await settle(); const tree = env.render();
  assert.equal(alerts(tree).length, 1); assert.equal(find(tree, node => node.type === Thumbnail).props.thumbUrl, 'data:image/png;base64,example');
  assert.equal(env.saves.length, 0); assert.equal(button(tree, 'Save channel settings').props['aria-busy'], false);
});

test('retrying a failed settings write reuses an acknowledged thumbnail upload', async () => {
  const env = environment('SettingsModal/index.tsx'); setPicture(env); button(env.render(), 'Save channel settings').props.onClick();
  env.uploads[0].resolve({ signedRequest: 'local-test', path: 'canonical-thumb' }); await settle(); env.fetches[0].resolve({ ok: true }); await settle();
  assert.equal(env.saves[0].payload.newThumbPath, 'canonical-thumb'); env.saves[0].reject(new Error('offline')); await settle();
  button(env.render(), 'Save channel settings').props.onClick(); await settle();
  assert.equal(env.uploads.length, 1); assert.equal(env.fetches.length, 1); assert.equal(env.saves.length, 2);
});

test('settings request scope invalidates after account/channel/unmount and revokes owned source URLs', async () => {
  for (const change of ['viewer', 'channel', 'unmount']) {
    const env = environment('SettingsModal/index.tsx'); setPicture(env); button(env.render(), 'Save channel settings').props.onClick();
    if (change === 'viewer') { env.viewer(9); env.render(); } else if (change === 'channel') env.render({ channelId: 8 }); else env.runtime.dispose();
    env.uploads[0].resolve({ signedRequest: 'local-test', path: 'canonical-thumb' }); await settle();
    assert.equal(env.fetches.length, 0); assert.equal(env.saves.length, 0); assert.equal(env.runtime.lateUpdates, 0);
    if (change === 'unmount') assert.deepEqual(env.revoked, ['blob:sample-1']);
  }
});

test('settings keep the nested ownership dialog open on failure and wait before closing on success', async () => {
  const env = environment('SettingsModal/index.tsx'); button(env.render(), 'Change owner').props.onClick();
  const owner = find(env.render(), node => node.type === Owner), data = { newOwner: mina, andLeave: false, canApply: () => true };
  const failed = owner.props.onSubmit(data); assert.equal(env.hides, 0); env.transfers[0].reject(new Error('offline')); await assert.rejects(failed);
  assert.equal(env.hides, 0); const work = owner.props.onSubmit(data); env.transfers[1].resolve(); await work; assert.equal(env.hides, 1);
});

test('name, picture and theme controls are named native inputs/buttons with explicit lock costs', () => {
  const env = environment('SettingsModal/index.tsx');
  const NameField = compile(base + 'SettingsModal/NameChanger.tsx', env.deps).default;
  const tree = env.runtime.render(() => NameField({ editedChannelName: 'Study', onSetEditedChannelName() {}, userIsChannelOwner: true }));
  const input = find(tree, node => node.type === 'input'); assert.ok(find(tree, node => node.type === 'label' && node.props.htmlFor === input.props.id));
  const ThemePicker = compile(base + 'SettingsModal/ColorSelector.tsx', env.deps).default;
  const colors = ThemePicker({ colors: ['green', 'red'], unlocked: [], selectedColor: 'green', onSetColor() {} });
  const red = find(colors, node => node.type === 'button' && /Red theme/.test(node.props['aria-label']));
  assert.match(red.props['aria-label'], /locked, 100 coins/); assert.equal(red.props.type, 'button');
  assert.equal(find(colors, node => node.type === 'button' && node.props['aria-label'] === 'Green theme').props['aria-pressed'], true);
});

function ownerCallback() {
  const requests = [], updates = [], relays = [], leaves = [], busy = [], progress = { current: null }, lock = { current: false };
  const channel = { current: 7 }, viewer = { current: 1 };
  const fn = callback('src/containers/Chat/Body/MessagesContainer/index.tsx', 'handleSelectNewOwner', {
    selectingNewOwnerRef: lock, ownerTransferProgressRef: progress, setSelectingNewOwner: value => busy.push(value),
    selectedChannelId: 7, userId: 1, selectedChannelIdRef: channel, userIdRef: viewer,
    changeChannelOwner: payload => { const work = deferred(); requests.push({ ...work, payload }); return work.promise; },
    onChangeChannelOwner: value => updates.push(value), socket: { emit: (...args) => relays.push(args) },
    handleLeaveChannel: canApply => { const work = deferred(); leaves.push({ ...work, canApply }); return work.promise; },
    username: 'Mikey', profilePicUrl: '', channelName: 'Study', currentChannel: { pathId: 70 }
  });
  return { fn, requests, updates, relays, leaves, busy, progress, lock, channel, viewer };
}

test('parent ownership errors propagate to the dialog and release the duplicate lock', async () => {
  const env = ownerCallback(); const work = env.fn({ newOwner: mina });
  await assert.rejects(env.fn({ newOwner: mina }), /already pending/); assert.equal(env.requests.length, 1);
  env.requests[0].reject(new Error('offline')); await assert.rejects(work, /offline/);
  assert.deepEqual(env.busy, [true, false]); assert.equal(env.lock.current, false); assert.equal(env.updates.length, 0);
});

test('canonical and legacy ownership transfers are not repeated when only leaving needs retry', async () => {
  for (const canonical of [true, false]) {
    const env = ownerCallback(); let transferred = 0;
    const data = { newOwner: mina, andLeave: true, canApply: () => true, onTransferred: () => transferred++ };
    const first = env.fn(data); env.requests[0].resolve(canonical ? { changed: true, creatorId: 2, newOwner: mina, message: { id: 8 } } : { messageId: 8, notificationMsg: 'owner changed' }); await settle();
    env.leaves[0].reject(new Error('leave failed')); await assert.rejects(first, /leave failed/);
    assert.equal(transferred, 1); const retry = env.fn(data); await settle();
    assert.equal(env.requests.length, 1); assert.equal(env.updates.length, 1); assert.equal(env.relays.length, canonical ? 0 : 1);
    env.leaves[1].resolve(); await retry; assert.equal(env.progress.current, null);
  }
});

test('parent ownership completion cannot mutate or leave a different account/channel or closed dialog', async () => {
  for (const change of ['viewer', 'channel', 'closed']) {
    const env = ownerCallback(); let current = true, confirmed = 0;
    const work = env.fn({ newOwner: mina, andLeave: true, canApply: () => current, onTransferred: () => confirmed++ });
    if (change === 'viewer') env.viewer.current = 9; else if (change === 'channel') env.channel.current = 9; else current = false;
    env.requests[0].resolve({ changed: true, newOwner: mina }); await work;
    assert.equal(env.updates.length + env.relays.length + env.leaves.length + confirmed, 0);
  }
});

test('parent settings awaits the canonical response and does not close or hydrate an obsolete dialog', async () => {
  const pending = [], updates = [], closes = []; let current = true;
  const fn = callback('src/containers/Chat/Body/MessagesContainer/index.tsx', 'handleEditSettings', {
    selectedChannelId: 7, userId: 1, selectedChannelIdRef: { current: 7 }, userIdRef: { current: 1 },
    editChannelSettings: payload => { const work = deferred(); pending.push({ ...work, payload }); return work.promise; },
    onEditChannelSettings: value => updates.push(value), setSettingsModalShown: value => closes.push(value)
  });
  const work = fn({ editedChannelName: 'Study', editedTheme: 'green', newThumbPath: 'pic', canApply: () => current });
  assert.equal(updates.length + closes.length, 0); assert.equal(pending[0].payload.channelId, 7);
  assert.equal(Object.hasOwn(pending[0].payload, 'canApply'), false);
  current = false; pending[0].resolve({ channelSettings: { thumbPath: 'canonical-pic' } }); await work;
  assert.equal(updates.length + closes.length, 0);
  current = true; const success = fn({ editedChannelName: 'Study', canApply: () => current });
  pending[1].resolve({ channelSettings: { thumbPath: 'canonical-pic' } }); await success;
  assert.equal(updates[0].newThumbPath, 'canonical-pic'); assert.deepEqual(closes, [false]);
});

test('settings and owner dialogs are keyed by account/channel in the actual modal host', () => {
  const body = source('src/containers/Chat/Body/MessagesContainer/Modals.tsx');
  assert.match(body, /<SettingsModal\s+key=\{userId \+ ':' \+ selectedChannelId\}/);
  assert.match(body, /<SelectNewOwnerModal\s+key=\{userId \+ ':' \+ selectedChannelId\}/);
});
