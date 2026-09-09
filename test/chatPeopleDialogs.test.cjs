const assert = require('node:assert/strict');
const test = require('node:test');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { transformSync } = require('esbuild');
const ts = require('typescript');
const React = require('react');
const root = path.resolve(__dirname, '..');
const base = 'src/containers/Chat/Modals/';
const source = file => readFileSync(path.join(root, file), 'utf8');
function compile(file, deps, globals = {}) {
  const module = { exports: {} };
  const code = transformSync(source(file), { loader: 'tsx', format: 'cjs', jsx: 'transform' }).code;
  new Function('require', 'module', 'exports', ...Object.keys(globals), code)(name => {
    assert.ok(Object.hasOwn(deps, name), `Unexpected import ${name}`);
    return deps[name];
  }, module, module.exports, ...Object.values(globals));
  return module.exports;
}
function driver() {
  const slots = [], effects = [];
  let cursor = 0, dirty = false, disposed = false, late = 0;
  const hooks = {
    ...React, useMemo: fn => fn(), memo: fn => fn,
    useId() { const i = cursor++; return slots[i] ||= `field-${i}`; },
    useRef(value) { const i = cursor++; return slots[i] ||= { current: value }; },
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
      return [slots[i], next => {
        if (disposed) late++;
        const value = typeof next === 'function' ? next(slots[i]) : next;
        if (!Object.is(value, slots[i])) { slots[i] = value; dirty = true; }
      }];
    },
    useEffect(effect, deps) {
      const i = cursor++, previous = slots[i];
      if (!previous || deps.some((value, j) => !Object.is(value, previous.deps[j]))) {
        slots[i] = { deps, cleanup: previous?.cleanup };
        effects.push(() => { slots[i].cleanup?.(); slots[i].cleanup = effect(); });
      }
    }
  };
  return {
    hooks, get lateUpdates() { return late; },
    render(fn) {
      for (let i = 0; i < 30; i++) {
        cursor = 0; dirty = false;
        const tree = fn();
        while (effects.length) effects.shift()();
        if (!dirty) return tree;
      }
      throw new Error('Render loop');
    },
    dispose() { disposed = true; slots.forEach(value => value?.cleanup?.()); }
  };
}
const Leaf = () => null;
const Button = () => null;
const Picker = () => null;
const Modal = () => null;
const SelectScreen = () => null;
const Classroom = () => null;
const Regular = () => null;
const css = (parts, ...values) => parts.reduce((s, part, i) => s + part + (values[i] ?? ''), '');
function nodes(tree, predicate) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(item => nodes(item, predicate));
  return [...(predicate(tree) ? [tree] : []), ...nodes(tree.props?.children, predicate)];
}
const find = (tree, predicate) => { const result = nodes(tree, predicate); assert.equal(result.length, 1); return result[0]; };
const button = (tree, label) => find(tree, n => n.type === Button && n.props['aria-label'] === label);
const input = tree => find(tree, n => n.type === 'input' && n.props.type === 'text');
const alert = tree => nodes(tree, n => n.props?.role === 'alert');
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const settle = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
const person = { id: 2, username: 'Mina' };
const response = { message: { id: 55, channelId: 42 }, members: [person], pathId: 400, favoriteState: true };

function environment() {
  let active, userId = 1, level = 5;
  const requests = [], invites = [], updates = [], emissions = [], navigations = [], done = [];
  const requestHelpers = {
    createNewChat: payload => { const d = deferred(); requests.push({ ...d, payload }); return d.promise; },
    inviteUsersToChannel: payload => { const d = deferred(); invites.push({ ...d, payload }); return d.promise; }
  };
  const contexts = {
    useKeyContext: fn => fn({ myState: { userId, level }, theme: { done: { color: 'blue' } } }),
    useAppContext: fn => fn({ requestHelpers }),
    useChatContext: fn => fn({ actions: {
      onCreateNewChannel: data => updates.push(data), onInviteUsersToChannel: data => updates.push(data)
    } })
  };
  const react = new Proxy(React, { get: (_, name) => active?.hooks[name] ?? React[name] });
  const hook = compile(base + 'useChatDialogRequest.ts', { react }).default;
  const common = {
    react, '~/components/Button': Button, '~/components/Icon': Leaf, '~/components/Modal': Modal,
    '~/components/Modal/Footer': Leaf,
    '~/components/ErrorBoundary': Leaf, '~/contexts': contexts,
    '../useChatDialogRequest': hook, '../../useChatDialogRequest': hook, './useChatDialogRequest': hook,
    '../chatFormStyles': {}, '../../chatFormStyles': {}, './chatFormStyles': {},
    '../../ChatPeoplePicker': Picker, './ChatPeoplePicker': Picker,
    '~/constants/sockets/api': { socket: { emit: (...args) => emissions.push(args) } },
    'react-router-dom': { useNavigate: () => url => navigations.push(url) },
    '~/helpers/chatGroupMembership': compile('src/helpers/chatGroupMembership.ts', {}),
    '~/helpers': { isSupermod: level => level >= 5 }, './RegularMenu': Leaf, './TeacherMenu': Leaf,
    './SelectScreen': SelectScreen, './ClassroomChatForm': Classroom, '../RegularMenu': Regular
  };
  return {
    requests, invites, updates, emissions, navigations, done, requestHelpers,
    viewer(value) { userId = value; },
    level(value) { level = value; },
    mount(file, initial = {}) {
      const runtime = driver(), Component = compile(base + file, common).default;
      let props = initial;
      return { render(next = {}) { props = { ...props, ...next }; active = runtime; return runtime.render(() => Component(props)); }, dispose: runtime.dispose, get lateUpdates() { return runtime.lateUpdates; } };
    }
  };
}

test('regular group rejects whitespace and over-limit names and keeps a native named field', () => {
  const env = environment(), calls = [], app = env.mount('CreateNewChat/RegularMenu.tsx', { creatingChat: false, onDone: v => calls.push(v) });
  let tree = app.render();
  assert.equal(button(tree, 'Create group').props.disabled, true);
  const field = input(tree);
  assert.equal(find(tree, n => n.type === 'label' && n.props.htmlFor === field.props.id).props.children, 'Group name');
  for (const text of ['   ', 'x'.repeat(151)]) {
    field.props.onChange({ target: { value: text } }); tree = app.render();
    assert.equal(button(tree, 'Create group').props.disabled, true);
    button(tree, 'Create group').props.onClick();
  }
  assert.equal(calls.length, 0);
});

test('regular creation guards rapid submits, preserves a failed draft and retries its canonical payload', async () => {
  const env = environment(), calls = [];
  const app = env.mount('CreateNewChat/RegularMenu.tsx', { creatingChat: false, onDone: data => { const d = deferred(); calls.push({ data, ...d }); return d.promise; } });
  input(app.render()).props.onChange({ target: { value: '  Study group  ' } });
  let tree = app.render();
  find(tree, n => n.type === 'input' && n.props.role === 'switch').props.onChange({ target: { checked: false } });
  tree = app.render(); const create = button(tree, 'Create group');
  create.props.onClick(); create.props.onClick();
  assert.equal(calls.length, 1);
  assert.deepEqual({ ...calls[0].data, canApply: undefined }, { userId: 1, channelName: 'Study group', isClosed: true, canApply: undefined });
  assert.equal(button(app.render(), 'Creating group').props.disabled, false);
  calls[0].reject(new Error('offline')); await settle(); tree = app.render();
  assert.equal(input(tree).props.value, '  Study group  '); assert.equal(alert(tree).length, 1);
  button(tree, 'Create group').props.onClick(); assert.equal(calls.length, 2);
});

test('regular completion is invalidated by unmount or viewer change without late state updates', async () => {
  for (const change of ['unmount', 'viewer']) {
    const env = environment(), d = deferred(); let payload;
    const app = env.mount('CreateNewChat/RegularMenu.tsx', { creatingChat: false, onDone: value => { payload = value; return d.promise; } });
    input(app.render()).props.onChange({ target: { value: 'Group' } }); button(app.render(), 'Create group').props.onClick();
    if (change === 'unmount') app.dispose(); else { env.viewer(9); app.render(); }
    assert.equal(payload.canApply(), false);
    d.reject(new Error('late')); await settle(); assert.equal(app.lateUpdates, 0);
  }
});

test('classroom requires a name and members, locks duplicates and recovers without losing selections', async () => {
  const env = environment(), app = env.mount('CreateNewChat/TeacherMenu/ClassroomChatForm.tsx', { channelId: 7, onHide: () => {} });
  let tree = app.render(); button(tree, 'Create classroom').props.onClick(); assert.equal(env.requests.length, 0);
  input(tree).props.onChange({ target: { value: '  Art class  ' } }); tree = app.render();
  button(tree, 'Create classroom').props.onClick(); assert.equal(env.requests.length, 0);
  find(tree, n => n.type === Picker).props.onChange([person]); tree = app.render();
  const create = button(tree, 'Create classroom'); create.props.onClick(); create.props.onClick();
  assert.equal(env.requests.length, 1); assert.equal(button(app.render(), 'Creating classroom').props.disabled, false);
  assert.deepEqual(env.requests[0].payload, { userId: 1, channelName: 'Art class', isClass: true, isClosed: true, selectedUsers: [person] });
  env.requests[0].reject(new Error('offline')); await settle(); tree = app.render();
  assert.equal(alert(tree).length, 1); assert.deepEqual(find(tree, n => n.type === Picker).props.selected, [person]);
  button(tree, 'Create classroom').props.onClick(); env.requests[1].resolve(response); await settle();
  assert.equal(env.updates.length, 1); assert.equal(env.updates[0].favoriteState, true);
  assert.deepEqual(env.emissions.map(v => v[0]), ['join_chat_group', 'send_group_chat_invitation']);
  assert.deepEqual(env.emissions[1][1], [2]); assert.deepEqual(env.navigations, ['/chat/400']);
});

test('classroom stale responses cannot hydrate, emit invitations or navigate after close/account/channel change', async () => {
  for (const change of ['unmount', 'viewer', 'channel']) {
    const env = environment(), app = env.mount('CreateNewChat/TeacherMenu/ClassroomChatForm.tsx', { channelId: 7, onHide: () => {} });
    input(app.render()).props.onChange({ target: { value: 'Class' } }); find(app.render(), n => n.type === Picker).props.onChange([person]);
    button(app.render(), 'Create classroom').props.onClick();
    if (change === 'unmount') app.dispose(); else if (change === 'viewer') { env.viewer(9); app.render(); } else app.render({ channelId: 8 });
    env.requests[0].resolve(response); await settle();
    assert.equal(env.updates.length + env.emissions.length + env.navigations.length, 0); assert.equal(app.lateUpdates, 0);
  }
});

test('an acknowledged classroom is not created again if its local completion callback fails', async () => {
  const env = environment(); let fail = true;
  const app = env.mount('CreateNewChat/TeacherMenu/ClassroomChatForm.tsx', { onHide: () => { if (fail) { fail = false; throw new Error('local close'); } } });
  input(app.render()).props.onChange({ target: { value: 'Class' } }); find(app.render(), n => n.type === Picker).props.onChange([person]);
  button(app.render(), 'Create classroom').props.onClick(); env.requests[0].resolve(response); await settle();
  let tree = app.render(); assert.equal(alert(tree).length, 1); assert.equal(find(tree, n => n.type === Picker).props.disabled, true);
  await button(tree, 'Open created classroom').props.onClick(); assert.equal(env.requests.length, 1);
  assert.equal(env.updates.length, 1); assert.equal(env.emissions.length, 2); assert.equal(env.navigations.length, 1);
});

test('ordinary invitation waits for onDone, blocks duplicate Enter/click intents and offers recovery', async () => {
  const env = environment(), calls = [], app = env.mount('InviteUsers.tsx', { selectedChannelId: 7, currentChannel: {}, onDone: data => { const d = deferred(); calls.push({ ...d, data }); return d.promise; } });
  let tree = app.render(); button(tree, 'Invite selected people').props.onClick(); assert.equal(calls.length, 0);
  assert.equal(find(tree, n => n.type === Picker).props.autoFocus, true);
  find(tree, n => n.type === Picker).props.onChange([person]); tree = app.render();
  const invite = button(tree, 'Invite selected people'); invite.props.onClick(); invite.props.onClick();
  assert.equal(calls.length, 1); assert.deepEqual(calls[0].data.users, [person]);
  assert.equal(env.invites.length, 0); tree = app.render();
  assert.equal(find(tree, n => n.type === Modal).props.closeOnEscape, false);
  calls[0].reject(new Error('offline')); await settle(); tree = app.render();
  assert.equal(alert(tree).length, 1); assert.equal(find(tree, n => n.type === Picker).props.disabled, false);
  button(tree, 'Invite selected people').props.onClick(); assert.equal(calls.length, 2);
});

test('class invites keep canonical versus legacy membership contracts and do not repeat an acknowledged request', async () => {
  for (const canonical of [true, false]) {
    const env = environment(), calls = []; let attempt = 0;
    const app = env.mount('InviteUsers.tsx', { selectedChannelId: 7, currentChannel: { isClass: true }, isOwner: true,
      onDone: async data => { calls.push(data); if (++attempt === 1) throw new Error('local finish'); } });
    find(app.render(), n => n.type === Picker).props.onChange([person]); button(app.render(), 'Invite selected people').props.onClick();
    env.invites[0].resolve(canonical ? { changed: true, newMembers: [person], message: response.message } : { message: response.message });
    await settle(); let tree = app.render(); assert.equal(alert(tree).length, 1);
    assert.equal(calls[0].relayLegacyMembership, !canonical); assert.equal(calls[0].isClass, true);
    await button(tree, 'Invite selected people').props.onClick();
    assert.equal(env.invites.length, 1); assert.equal(env.updates.length, 1); assert.equal(calls.length, 2);
  }
});

test('unchanged canonical class response avoids synthetic membership updates and stale invite replies are ignored', async () => {
  const env = environment(), done = [], app = env.mount('InviteUsers.tsx', { selectedChannelId: 7, currentChannel: { isClass: true }, isOwner: true, onDone: value => done.push(value) });
  find(app.render(), n => n.type === Picker).props.onChange([person]); button(app.render(), 'Invite selected people').props.onClick();
  env.invites[0].resolve({ changed: false, newMembers: [], message: null }); await settle();
  assert.equal(env.updates.length, 0); assert.deepEqual(done[0].users, []);
  const stale = environment(), old = stale.mount('InviteUsers.tsx', { selectedChannelId: 7, currentChannel: { isClass: true }, isOwner: true, onDone: value => done.push(value) });
  find(old.render(), n => n.type === Picker).props.onChange([person]); button(old.render(), 'Invite selected people').props.onClick();
  old.render({ selectedChannelId: 9 }); stale.invites[0].resolve({ changed: true, newMembers: [person], message: response.message }); await settle();
  assert.equal(stale.updates.length, 0); assert.equal(done.length, 1);
});

function pickerEnvironment() {
  const runtime = driver(), pending = [], timers = new Map(); let nextTimer = 1, userId = 1;
  const search = payload => { const d = deferred(); pending.push({ ...d, payload }); return d.promise; };
  const Component = compile(base + 'ChatPeoplePicker.tsx', {
    react: runtime.hooks, '@emotion/css': { css }, '~/components/Icon': Leaf, '~/components/UserSearchResultRow': Leaf,
    '~/contexts': { useAppContext: fn => fn({ requestHelpers: { searchUserToInvite: search } }), useKeyContext: fn => fn({ myState: { userId } }) }
  }, { setTimeout: fn => { const id = nextTimer++; timers.set(id, fn); return id; }, clearTimeout: id => timers.delete(id), document: { getElementById: () => ({ querySelector: () => ({ focus() {} }) }) } }).default;
  let props = { channelId: 7, selected: [], onChange: values => { props.selected = values; } };
  return { pending, timers, runtime, viewer(id) { userId = id; }, render(next = {}) { props = { ...props, ...next }; return runtime.render(() => Component(props)); }, tick() { const tasks = [...timers.values()]; timers.clear(); tasks.forEach(fn => fn()); } };
}
const searchField = tree => find(tree, n => n.type === 'input' && n.props.type === 'search');

test('people search is local, debounced, clears obsolete results and ignores out-of-order replies', async () => {
  const env = pickerEnvironment(); let tree = env.render(); assert.equal(env.timers.size, 0);
  searchField(tree).props.onChange({ target: { value: 'm' } }); env.render(); env.tick(); assert.equal(env.pending.length, 0);
  searchField(env.render()).props.onChange({ target: { value: 'mi' } }); env.render(); env.tick();
  searchField(env.render()).props.onChange({ target: { value: 'no' } }); env.render(); env.tick();
  env.pending[1].resolve([{ id: 3, username: 'Noah' }]); await settle();
  assert.equal(nodes(env.render(), n => n.props?.['aria-label'] === 'Add Noah').length, 1);
  env.pending[0].resolve([person]); await settle();
  assert.equal(nodes(env.render(), n => n.props?.['aria-label'] === 'Add Mina').length, 0);
});

test('people search reports failures instead of empty matches and retries without mutating shared search state', async () => {
  const env = pickerEnvironment(); searchField(env.render()).props.onChange({ target: { value: 'mi' } }); env.render(); env.tick();
  env.pending[0].reject(new Error('offline')); await settle(); let tree = env.render(); assert.equal(alert(tree).length, 1);
  find(tree, n => n.type === 'button' && n.props.children === 'Try again').props.onClick(); env.render(); env.tick();
  env.pending[1].resolve([person]); await settle(); assert.equal(alert(env.render()).length, 0);
  assert.equal(nodes(env.render(), n => n.props?.['aria-label'] === 'Add Mina').length, 1);
});

test('people results normalize IDs, remove duplicates/members/self/selected and expose named native add/remove buttons', async () => {
  const env = pickerEnvironment(); let tree = env.render({ excludedIds: ['4'], selected: [{ id: 5, username: 'Sora' }] });
  searchField(tree).props.onChange({ target: { value: 'mi' } }); env.render(); env.tick();
  env.pending[0].resolve([null, { id: -2, username: 'Bad' }, { id: 1, username: 'Me' }, { id: 4, username: 'Member' }, { id: 5, username: 'Sora' }, { ...person, id: '2' }, { ...person, realName: {}, profilePicUrl: [] }, { id: 8, username: {} }]);
  await settle(); tree = env.render();
  assert.equal(nodes(tree, n => n.type === 'button' && n.props['aria-label']?.startsWith('Add ')).length, 1);
  const row = find(tree, n => n.type === Leaf && n.props.username === 'Mina');
  assert.equal(row.props.realName, undefined); assert.equal(row.props.profilePicUrl, undefined);
  find(tree, n => n.props?.['aria-label'] === 'Add Mina').props.onClick(); tree = env.render();
  assert.equal(searchField(tree).props.value, '');
  const remove = find(tree, n => n.props?.['aria-label'] === 'Remove Mina'); assert.equal(remove.type, 'button'); remove.props.onClick();
  assert.equal(nodes(env.render(), n => n.props?.['aria-label'] === 'Remove Mina').length, 0);
});

test('people input Enter cannot submit invitations, composition is respected and Escape clears before dismissing', () => {
  const env = pickerEnvironment(); searchField(env.render()).props.onChange({ target: { value: 'mi' } });
  const key = searchField(env.render()).props.onKeyDown;
  const events = [];
  key({ key: 'Enter', nativeEvent: {}, preventDefault: () => events.push('prevent') });
  key({ key: 'Enter', nativeEvent: { isComposing: true }, preventDefault: () => events.push('composing') });
  key({ key: 'Escape', nativeEvent: {}, preventDefault: () => events.push('escape'), stopPropagation: () => events.push('stop') });
  assert.deepEqual(events, ['prevent', 'escape', 'stop']); assert.equal(searchField(env.render()).props.value, '');
});

test('IME composition defers people search until confirmed text is available', () => {
  const env = pickerEnvironment(); let field = searchField(env.render());
  field.props.onCompositionStart(); field.props.onChange({ target: { value: 'mi' } }); env.render(); env.tick();
  assert.equal(env.pending.length, 0);
  field = searchField(env.render()); field.props.onCompositionEnd({ currentTarget: { value: 'Mina' } }); env.render(); env.tick();
  assert.equal(env.pending.length, 1); assert.equal(env.pending[0].payload.searchText, 'Mina');
});

test('people request timers and completions are canceled for unmount, disabled, channel and viewer changes', async () => {
  for (const change of ['unmount', 'disabled', 'channel', 'viewer']) {
    const env = pickerEnvironment(); searchField(env.render()).props.onChange({ target: { value: 'mi' } }); env.render(); env.tick();
    if (change === 'unmount') env.runtime.dispose();
    else if (change === 'disabled') env.render({ disabled: true });
    else if (change === 'channel') env.render({ channelId: 9 });
    else { env.viewer(8); env.render(); }
    env.pending[0].resolve([person]); await settle(); assert.equal(env.runtime.lateUpdates, 0);
    if (change !== 'unmount') assert.equal(nodes(env.render(), n => n.props?.['aria-label'] === 'Add Mina').length, 0);
  }
});

test('create modal preserves teacher gating and busy dismissal guards', () => {
  const env = environment(), hides = [], app = env.mount('CreateNewChat/index.tsx', { creatingChat: false, onHide: () => hides.push(1), onDone: () => {} });
  let tree = app.render(); const modal = find(tree, n => n.type === Modal);
  assert.equal(modal.props['aria-label'], 'Create a chat'); modal.props.onClose(); assert.equal(hides.length, 1);
  tree = app.render({ creatingChat: true }); find(tree, n => n.type === Modal).props.onClose(); assert.equal(hides.length, 1);
  assert.equal(find(tree, n => n.type === Modal).props.showCloseButton, false);
  assert.equal(nodes(tree, n => n.type === Leaf && n.props.onCreateRegularChat !== undefined).length, 1);
  env.level(4); tree = app.render();
  assert.equal(nodes(tree, n => n.type === Leaf && n.props.onCreateRegularChat !== undefined).length, 0);
  assert.equal(nodes(tree, n => n.type === Leaf && n.props.onDone !== undefined).length, 1);
  assert.match(source(base + 'CreateNewChat/index.tsx'), /isSupermod\(level\)/);
  assert.match(source(base + 'chatFormStyles.ts'), /width: 44px/);
});

test('teacher Back restores focus to the choice that opened its form', () => {
  const env = environment(), app = env.mount('CreateNewChat/TeacherMenu/index.tsx', { onHide: () => {} });
  let choice = find(app.render(), n => n.type === SelectScreen);
  assert.equal(choice.props.focusChoice, 'regular'); choice.props.onSetSection('classroom');
  find(app.render(), n => n.type === Classroom).props.onBackClick();
  choice = find(app.render(), n => n.type === SelectScreen); assert.equal(choice.props.focusChoice, 'classroom');
  choice.props.onSetSection('regular'); find(app.render(), n => n.type === Regular).props.onBackClick();
  assert.equal(find(app.render(), n => n.type === SelectScreen).props.focusChoice, 'regular');
});

test('dialog errors are associated with their submit control and revealed without moving focus', async () => {
  const runtime = driver(), hook = compile(base + 'useChatDialogRequest.ts', { react: runtime.hooks }).default;
  const revealed = [];
  let request = runtime.render(() => hook('dialog'));
  request.errorRef.current = { scrollIntoView: value => revealed.push(value) };
  await request.run('Try again', async () => { throw new Error('offline'); });
  request = runtime.render(() => hook('dialog'));
  assert.deepEqual(revealed, [{ block: 'nearest' }]); assert.equal(request.error, 'Try again');
  for (const file of ['CreateNewChat/RegularMenu.tsx', 'CreateNewChat/TeacherMenu/ClassroomChatForm.tsx', 'InviteUsers.tsx']) {
    assert.match(source(base + file), /ref=\{request.errorRef\} id=\{request.errorId\}/);
    assert.match(source(base + file), /aria-describedby=\{request.error \? request.errorId : undefined\}/);
  }
});

test('an empty people result is distinct from a malformed response and clearing cancels queued search', async () => {
  const env = pickerEnvironment(); searchField(env.render()).props.onChange({ target: { value: 'none' } }); env.render(); env.tick();
  env.pending[0].resolve([]); await settle();
  assert.equal(alert(env.render()).length, 0);
  assert.equal(nodes(env.render(), n => n.props?.role === 'status' && /No other people/.test(n.props.children)).length, 1);
  searchField(env.render()).props.onChange({ target: { value: 'bad' } }); env.render(); env.tick(); env.pending[1].resolve({ people: [] }); await settle();
  assert.equal(alert(env.render()).length, 1);
  searchField(env.render()).props.onChange({ target: { value: 'queued' } }); env.render();
  searchField(env.render()).props.onChange({ target: { value: '' } }); env.render(); env.tick(); assert.equal(env.pending.length, 2);
});

function callback(file, name, dependencies) {
  const text = source(file), ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let expression;
  function visit(node) { if (ts.isVariableDeclaration(node) && node.name.getText(ast) === name) expression = node.initializer.arguments[0].getText(ast); ts.forEachChild(node, visit); }
  visit(ast); assert.ok(expression);
  const code = transformSync('module.exports = ' + expression, { loader: 'ts', format: 'cjs' }).code;
  const module = { exports: {} }; new Function('module', ...Object.keys(dependencies), code)(module, ...Object.values(dependencies)); return module.exports;
}

test('actual parent creation callback clears its lock after failure and rejects stale navigation', async () => {
  const busy = [], requests = [], updates = [], navigation = [], lock = { current: false }, mounted = { current: true }, viewer = { current: 1 };
  const fn = callback('src/containers/Chat/Main.tsx', 'handleCreateNewChannel', {
    creatingChatRequest: lock, setCreatingChat: value => busy.push(value), isMounted: mounted, userIdRef: viewer,
    createNewChat: data => { const d = deferred(); requests.push({ ...d, data }); return d.promise; },
    onCreateNewChannel: data => updates.push(data), socket: { emit() {} }, navigate: url => navigation.push(url), setCreateNewChatModalShown() {}
  });
  const data = { userId: 1, channelName: 'Group', isClosed: false, canApply: () => true };
  const first = fn(data); await fn(data); assert.equal(requests.length, 1);
  requests[0].reject(new Error('offline')); await assert.rejects(first); assert.deepEqual(busy, [true, false]); assert.equal(lock.current, false);
  const second = fn(data); viewer.current = 2; requests[1].resolve(response); await second;
  assert.equal(updates.length + navigation.length, 0); assert.equal(lock.current, false);
});

test('actual parent invitation callback does not hydrate or close a different dialog after its request', async () => {
  const d = deferred(), updates = [], closes = [];
  const fn = callback('src/containers/Chat/Body/MessagesContainer/index.tsx', 'handleInviteUsersDone', {
    selectedChannelId: 7, sendInvitationMessage: () => d.promise, onReceiveMessageOnDifferentChannel: value => updates.push(value), setInviteUsersModalShown: value => closes.push(value)
  });
  const work = fn({ users: [person], canApply: () => false });
  d.resolve({ channels: [{ channel: { id: 9 } }], messages: [response.message] }); await work;
  assert.deepEqual(updates, []); assert.deepEqual(closes, []);
});
