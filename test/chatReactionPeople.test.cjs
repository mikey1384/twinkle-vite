const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { transformSync } = require('esbuild');
const base = 'src/containers/Chat/Message/MessageBody/Reactions/';
function load(file, dependencies) {
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', 'navigator', transformSync(readFileSync(path.resolve(__dirname, '..', file), 'utf8'), { loader: 'tsx', format: 'cjs', jsx: 'transform' }).code)(name => { assert.ok(Object.hasOwn(dependencies, name), name); return dependencies[name]; }, mod, mod.exports, {});
  return mod.exports.default;
}
function driver() {
  const slots = [], effects = [];
  let cursor = 0, dirty = false, disposed = false, lateUpdates = 0;
  const hooks = { ...React, memo: fn => fn, useId: () => 'reaction-people-test', useMemo: fn => fn(), useContext: () => ({}), useRef(value) { const i = cursor++; return slots[i] ||= { current: value }; }, useState(value) { const i = cursor++; if (!(i in slots)) slots[i] = typeof value === 'function' ? value() : value; return [slots[i], next => { if (disposed) lateUpdates++; const value = typeof next === 'function' ? next(slots[i]) : next; if (!Object.is(slots[i], value)) { slots[i] = value; dirty = true; } }]; }, useEffect(effect, deps) { const i = cursor++, old = slots[i]; if (!old || deps.some((v, j) => !Object.is(v, old.deps[j]))) { slots[i] = { deps, cleanup: old?.cleanup }; effects.push(() => { slots[i].cleanup?.(); slots[i].cleanup = effect(); }); } } };
  hooks.useLayoutEffect = hooks.useEffect;
  return { hooks, get lateUpdates() { return lateUpdates; }, render(fn) { for (let n = 0; n < 30; n++) { cursor = 0; dirty = false; const result = fn(); while (effects.length) effects.shift()(); if (!dirty) return result; } throw new Error('Render loop'); }, dispose() { disposed = true; for (const slot of slots) slot?.cleanup?.(); } };
}
async function settle() { for (let i = 0; i < 12; i++) await Promise.resolve(); }
function profiles(initial = {}) {
  const runtime = driver(), requests = [], writes = [];
  let props = { userIds: [1, 2, 3, 4], viewer: { id: 1, username: 'Mikey' }, userObj: {}, mode: 'closed', ...initial };
  const usePeople = load(base + 'useReactionPeople.ts', { react: runtime.hooks });
  props.loadProfile = id => new Promise((resolve, reject) => requests.push({ id, resolve, reject }));
  props.onSetUserState = value => { writes.push(value); props.userObj = { ...props.userObj, [value.userId]: value.newState }; };
  return { ...runtime, requests, writes, render(next = {}) { props = { ...props, ...next }; return runtime.render(() => usePeople(props)); }, get lateUpdates() { return runtime.lateUpdates; } };
}
const person = id => ({ id, username: `Person${id}`, profilePicUrl: `/person${id}.png` });

test('reaction people do not fetch until details are requested; preview fetches only two other people', async () => {
  const app = profiles(); assert.equal(app.render().loading, false); await settle(); assert.equal(app.requests.length, 0);
  assert.equal(app.render({ mode: 'preview' }).loading, true); await settle(); assert.deepEqual(app.requests.map(r => r.id), [2, 3]);
  app.requests.forEach(r => r.resolve(person(r.id))); await settle(); const result = app.render();
  assert.equal(result.loading, false); assert.equal(result.failed, false); assert.deepEqual(result.people.slice(0, 3).map(p => p.username), ['Mikey', 'Person2', 'Person3']);
});

test('opening all people shares preview requests and loads remaining users in parallel', async () => {
  const app = profiles(); app.render({ mode: 'preview' }); await settle(); app.render({ mode: 'all' }); await settle();
  assert.deepEqual(app.requests.map(r => r.id), [2, 3, 4]);
  app.requests[1].resolve(person(3)); await settle(); assert.equal(app.render().people[2].username, 'Person3'); assert.equal(app.render().loading, true);
  app.requests[0].resolve(person(2)); app.requests[2].resolve(person(4)); await settle(); assert.equal(app.render().loading, false);
  assert.equal(app.writes.length, 3); assert.deepEqual(app.writes.find(w => w.userId === 2), { userId: 2, newState: { ...person(2), loaded: true } });
});

test('large people lists limit parallel requests and stop queued work when closed', async () => {
  const app = profiles({ userIds: [2, 3, 4, 5, 6, 7, 8, 9] }); app.render({ mode: 'all' }); await settle();
  assert.deepEqual(app.requests.map(r => r.id), [2, 3, 4, 5]);
  app.requests[0].resolve(person(2)); await settle(); assert.deepEqual(app.requests.map(r => r.id), [2, 3, 4, 5, 6]);
  app.render({ mode: 'closed' }); app.requests.slice(1).forEach(r => r.resolve(person(r.id))); await settle();
  assert.equal(app.requests.length, 5); assert.equal(app.writes.length, 1);
});

test('failed or malformed profiles keep successful rows and retry only missing profiles', async () => {
  const app = profiles({ userIds: [1, 2, 3] }); app.render({ mode: 'all' }); await settle(); app.requests[0].resolve(person(2)); app.requests[1].reject(new Error('Offline')); await settle();
  let result = app.render(); assert.equal(result.failed, true); assert.equal(result.loading, false); assert.equal(result.people[1].username, 'Person2');
  result.retry(); app.render(); await settle(); assert.deepEqual(app.requests.map(r => r.id), [2, 3, 3]);
  app.requests[2].resolve({ id: 999, username: 'Wrong profile' }); await settle(); result = app.render(); assert.equal(result.failed, true); assert.equal(app.writes.length, 1);
  result.retry(); app.render(); await settle(); app.requests[3].resolve(person(3)); await settle(); assert.equal(app.render().failed, false);
});

test('closing, changing reaction users, and unmounting ignore stale responses without cache writes', async () => {
  const app = profiles(); app.render({ mode: 'all' }); await settle(); app.render({ mode: 'closed' }); app.requests.forEach(r => r.resolve(person(r.id))); await settle();
  assert.equal(app.writes.length, 0); assert.equal(app.render().loading, false);
  app.render({ mode: 'all', userIds: [8] }); await settle(); app.render({ userIds: [9] }); await settle();
  app.requests.find(r => r.id === 8).resolve(person(8)); await settle(); assert.equal(app.writes.length, 0);
  app.dispose(); app.requests.find(r => r.id === 9).resolve(person(9)); await settle(); assert.equal(app.writes.length, 0); assert.equal(app.lateUpdates, 0);
});

test('cached and duplicate people do not refetch; viewer identity changes start a new request generation', async () => {
  const cached = profiles({ userIds: [2, 1, 2], userObj: { 2: person(2) } }); const result = cached.render({ mode: 'all' }); await settle(); assert.equal(cached.requests.length, 0); assert.deepEqual(result.people.map(p => p.id), [1, 2]);
  const app = profiles({ userIds: [2] }); app.render({ mode: 'all' }); await settle(); app.render({ viewer: { id: 9, username: 'Other account' } }); await settle(); assert.equal(app.requests.length, 2);
  app.requests[0].resolve(person(2)); await settle(); assert.equal(app.writes.length, 0);
  app.requests[1].resolve(person(2)); await settle(); assert.equal(app.render().loading, false); assert.equal(app.writes.length, 1);
});

const emotion = { css: () => 'fixture-css' };
const icon = () => React.createElement('span', { 'aria-hidden': true });
const registry = { getChatReaction: reaction => ({ label: reaction === 'fire' ? 'Fire' : 'Thumbs up' }) };
function findAll(tree, predicate) { if (!tree || typeof tree !== 'object') return []; return [...(predicate(tree) ? [tree] : []), ...React.Children.toArray(tree.props?.children).flatMap(child => findAll(child, predicate))]; }
function chip(pendingMutation) {
  const runtime = driver(); runtime.hooks.useContext = () => ({ actions: { onSetUserState() {} }, state: { userObj: {} } });
  const mutations = [], detailProps = [];
  const People = () => null;
  const Reaction = load(base + 'Reaction.tsx', { react: runtime.hooks, './Tooltip': () => null, './PeopleModal': People, './useReactionPeople': props => { detailProps.push(props); return { people: [person(2)], loading: false, failed: false, retry() {} }; }, '../../../Context': {}, '~/contexts': { useKeyContext: fn => fn({ myState: { userId: 1, username: 'Mikey' } }), useAppContext: fn => fn({ requestHelpers: { loadProfile() {} } }) }, '~/components/ChatReactionEmoji': icon, '~/constants/chatReactions': registry, '@emotion/css': emotion, '~/constants/css': { Color: new Proxy({}, { get: () => () => '#eee' }) }, '~/helpers': { isMobile: () => false }, '~/helpers/hooks': { useOutsideClick() {} }, '~/theme/hooks/useRoleColor': { useRoleColor: () => ({ color: '#aa0', getColor: () => '#ffa', token: {} }) }, '~/components/Icon': icon });
  return { mutations, render: () => runtime.render(() => Reaction({ reaction: 'fire', reactionCount: 2, reactedUserIds: [1, 2], pendingMutation, theme: 'gold', reactionsMenuShown: false, onAddReaction: () => mutations.push('add'), onRemoveReaction: () => mutations.push('remove') })), People, detailProps };
}

test('the count is a named dialog control and never adds/removes a reaction', () => {
  const app = chip(), first = app.render(), buttons = findAll(first, el => el.type === 'button');
  assert.equal(buttons.length, 2); assert.match(buttons[1].props['aria-label'], /See 2 people who reacted with fire/); assert.equal(buttons[1].props['aria-haspopup'], 'dialog');
  buttons[1].props.onClick({ stopPropagation() {} }); const opened = app.render(); assert.equal(app.mutations.length, 0); assert.equal(findAll(opened, el => el.type === app.People).length, 1); assert.equal(app.detailProps.at(-1).mode, 'all');
  findAll(opened, el => el.type === app.People)[0].props.onHide(); app.render(); assert.equal(app.detailProps.at(-1).mode, 'closed');
});

test('reaction mutation remains on the emoji button and pending mutation does not block viewing people', () => {
  const app = chip(), buttons = findAll(app.render(), el => el.type === 'button'); buttons[0].props.onClick({ stopPropagation() {} }); assert.deepEqual(app.mutations, ['remove']);
  const pending = chip('remove'), busyButtons = findAll(pending.render(), el => el.type === 'button'); assert.equal(busyButtons[0].props.disabled, true); assert.equal(busyButtons[1].props.disabled, false); busyButtons[0].props.onClick({ stopPropagation() {} }); assert.equal(pending.mutations.length, 0);
});

test('unknown prototype-like reaction keys safely render and do not inherit pending mutations', () => {
  const Row = () => null;
  const Reactions = load(base + 'index.tsx', { react: { ...React, useMemo: fn => fn() }, './Reaction': Row });
  const tree = Reactions({ reactions: ['__proto__', 'constructor', 'future-reaction'].map(type => ({ type, userId: 2 })), pendingReactionMutations: {}, onAddReaction() {}, onRemoveReaction() {}, reactionsMenuShown: false, theme: 'gold' });
  const rows = findAll(tree, el => el.type === Row); assert.equal(rows.length, 3); for (const row of rows) { assert.equal(row.props.reactionCount, 1); assert.deepEqual(row.props.reactedUserIds, [2]); assert.equal(row.props.pendingMutation, undefined); }
});

function peopleDialog() {
  const runtime = driver(), requests = [], actions = [], routes = [];
  let viewer = { userId: 1, username: 'Mikey', profilePicUrl: '/me.png' }, hides = 0;
  const Modal = ({ children }) => React.createElement('div', { role: 'dialog' }, children);
  const Component = load(base + 'PeopleModal.tsx', { react: runtime.hooks, 'react-router-dom': { useNavigate: () => value => routes.push(value), Link: ({ to, ...props }) => React.createElement('a', { href: to, ...props }) }, '@emotion/css': emotion, '~/components/Modal': Modal, '~/components/ProfilePic': icon, '~/components/ChatReactionEmoji': icon, '~/components/Icon': icon, '~/constants/chatReactions': registry, '~/contexts': { useKeyContext: fn => fn({ myState: viewer }), useChatContext: fn => fn({ state: { chatStatus: {} }, actions: { onOpenNewChatTab: value => actions.push(['open', value]), onUpdateSelectedChannelId: value => actions.push(['select', value]) } }), useAppContext: fn => fn({ requestHelpers: { loadDMChannel: value => new Promise((resolve, reject) => requests.push({ value, resolve, reject })) } }) } });
  let props = { reaction: 'fire', people: [{ id: 1, username: 'Mikey' }, person(2)], loading: false, failed: false, onRetry() {}, onHide: () => hides++ };
  return { ...runtime, requests, actions, routes, get hides() { return hides; }, render(next = {}) { props = { ...props, ...next }; return runtime.render(() => Component(props)); }, viewer(value) { viewer = value; } };
}

test('people dialog provides named profiles and chat actions without a bogus /users/You link', () => {
  const app = peopleDialog(); const markup = renderToStaticMarkup(app.render()); assert.match(markup, /href="\/users\/Mikey"/); assert.doesNotMatch(markup, /\/users\/You/); assert.match(markup, /View Person2&#x27;s profile/); assert.match(markup, /Chat with Person2/); assert.match(markup, /Close reaction details/);
  const failed = renderToStaticMarkup(app.render({ failed: true, people: [{ id: 3 }] })); assert.match(failed, /Some profiles couldn/); assert.match(failed, /Try again/); assert.match(failed, /Profile unavailable/); assert.doesNotMatch(failed, /Chat with/);
});

test('retry restores focus before its temporary button disappears, and loading is not labeled unavailable', () => {
  const app = peopleDialog(), events = [];
  const tree = app.render({ failed: true, onRetry: () => events.push('retry') });
  const close = findAll(tree, el => el.type === 'button' && el.props['aria-label'] === 'Close reaction details')[0];
  close.ref.current = { focus: options => events.push(['focus', options]) };
  findAll(tree, el => el.type === 'button' && el.props.children === 'Try again')[0].props.onClick();
  assert.deepEqual(events, [['focus', { preventScroll: true }], 'retry']);
  const loading = renderToStaticMarkup(app.render({ people: [{ id: 8 }], loading: true, failed: false }));
  assert.match(loading, /Loading profile…/); assert.doesNotMatch(loading, /Profile unavailable/);
});

test('chat opening handles failure, prevents duplicates, and preserves existing/new channel routing payloads', async () => {
  const app = peopleDialog(); let button = findAll(app.render(), el => el.type === 'button' && el.props['aria-label'] === 'Chat with Person2')[0]; button.props.onClick(); button.props.onClick(); assert.equal(app.requests.length, 1);
  app.requests[0].reject(new Error('Offline')); await settle(); assert.match(renderToStaticMarkup(app.render()), /Couldn’t open that chat/);
  button = findAll(app.render(), el => el.type === 'button' && el.props['aria-label'] === 'Chat with Person2')[0]; button.props.onClick(); app.requests[1].resolve({ channelId: 0, pathId: null }); await settle();
  assert.deepEqual(app.actions, [['open', { user: { username: 'Mikey', id: 1, profilePicUrl: '/me.png' }, recipient: person(2) }], ['select', 0]]); assert.deepEqual(app.routes, ['/chat/new']); assert.equal(app.hides, 1);
  const existing = peopleDialog(); findAll(existing.render(), el => el.type === 'button' && el.props['aria-label'] === 'Chat with Person2')[0].props.onClick(); existing.requests[0].resolve({ channelId: 8, pathId: 157435493 }); await settle(); assert.deepEqual(existing.routes, ['/chat/157435493']); assert.equal(existing.actions.length, 0);
});

test('closing a people dialog or changing viewers prevents late chat navigation and state writes', async () => {
  const app = peopleDialog(); findAll(app.render(), el => el.type === 'button' && el.props['aria-label'] === 'Chat with Person2')[0].props.onClick(); app.dispose(); app.requests[0].resolve({ channelId: 0, pathId: null }); await settle(); assert.equal(app.actions.length, 0); assert.equal(app.routes.length, 0);
  const changed = peopleDialog(); findAll(changed.render(), el => el.type === 'button' && el.props['aria-label'] === 'Chat with Person2')[0].props.onClick(); changed.viewer({ userId: 9, username: 'Other' }); changed.render(); changed.requests[0].resolve({ channelId: 5, pathId: 15 }); await settle(); assert.equal(changed.routes.length, 0);
});

test('tooltip is a bounded non-interactive description, with no inaccessible link or hover timers', () => {
  const runtime = driver();
  const Tooltip = load(base + 'Tooltip.tsx', { react: runtime.hooks, 'react-dom': { createPortal: children => children }, '@emotion/css': emotion, '../reactionPickerLayout': { positionReactionPicker: () => ({ top: 0, left: 0 }) } });
  const originalDocument = global.document; global.document = { getElementById: () => ({}), body: {} };
  try { const tree = runtime.render(() => Tooltip({ id: 'tip', parentContext: {}, displayedReactedUsers: [{ id: 1, username: 'You' }, { id: 2, username: 'Mina' }], total: 3, loading: false })); assert.equal(tree.props.role, 'tooltip'); assert.equal(tree.props.id, 'tip'); assert.equal(tree.props.children, 'You, Mina and 1 other'); assert.equal(findAll(tree, el => el.type === 'a' || el.type === 'button').length, 0); } finally { global.document = originalDocument; }
  const source = readFileSync(path.resolve(__dirname, '..', base + 'Reaction.tsx'), 'utf8'); assert.doesNotMatch(source, /setTimeout|hideTimer/); assert.match(source, /onFocusCapture/); assert.match(source, /event.key === 'Escape'/);
});
