// A refused invitation card (deploy review G3, 2026-10-10): the server now
// refuses a card whose sender has left the group. The Accept button used to
// spin forever with no message; it must show the server's reason and be
// usable again.
const assert = require('node:assert/strict');
const test = require('node:test');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { transformSync } = require('esbuild');
const React = require('react');

const root = path.resolve(__dirname, '..');
const file = 'src/containers/Chat/Message/MessageBody/Invitation/index.tsx';

function driver() {
  const slots = [];
  const effects = [];
  let cursor = 0;
  let dirty = false;
  const hooks = {
    ...React,
    useMemo: (fn) => fn(),
    useCallback: (fn) => fn,
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = initial;
      return [
        slots[i],
        (next) => {
          const value = typeof next === 'function' ? next(slots[i]) : next;
          if (!Object.is(value, slots[i])) {
            slots[i] = value;
            dirty = true;
          }
        }
      ];
    },
    useEffect(effect, deps) {
      const i = cursor++;
      const previous = slots[i];
      if (!previous || deps.some((v, j) => !Object.is(v, previous.deps[j]))) {
        slots[i] = { deps };
        effects.push(effect);
      }
    }
  };
  return {
    hooks,
    render(fn) {
      for (let i = 0; i < 20; i++) {
        cursor = 0;
        dirty = false;
        const tree = fn();
        while (effects.length) effects.shift()();
        if (!dirty) return tree;
      }
      throw new Error('Render loop');
    }
  };
}

const Button = () => null;
const ChannelDetail = () => null;
const css = (parts, ...values) =>
  parts.reduce((s, part, i) => s + part + (values[i] ?? ''), '');

function mount(onAcceptGroupInvitation) {
  const d = driver();
  const deps = {
    react: d.hooks,
    './ChannelDetail': ChannelDetail,
    '~/components/Button': Button,
    '~/constants/css': { Color: { rose: () => 'rose' }, mobileMaxWidth: '1px' },
    '@emotion/css': { css },
    '~/helpers': { parseChannelPath: () => 5 },
    '~/contexts': {
      useAppContext: (select) =>
        select({ requestHelpers: { loadChatChannel: async () => ({}) } }),
      useChatContext: (select) =>
        select({
          state: {
            channelPathIdHash: {},
            channelsObj: {
              5: { channelName: 'Group', members: [], allMemberIds: [] }
            }
          },
          actions: {
            onSetChatInvitationDetail() {},
            onUpdateChannelPathIdHash() {}
          }
        }),
      useKeyContext: (select) =>
        select({
          myState: { userId: 9 },
          theme: { chatInvitation: { color: 'blue' } }
        })
    }
  };
  const module = { exports: {} };
  const code = transformSync(readFileSync(path.join(root, file), 'utf8'), {
    loader: 'tsx',
    format: 'cjs',
    jsx: 'transform'
  }).code;
  new Function('require', 'module', 'exports', code)(
    (name) => {
      assert.ok(Object.hasOwn(deps, name), `Unexpected import ${name}`);
      return deps[name];
    },
    module,
    module.exports
  );
  const Invitation = module.exports.default;
  const props = {
    invitationChannelId: 5,
    invitePath: 'abc',
    channelId: 1,
    messageId: 2,
    sender: { id: 3, username: 'Mina' },
    onAcceptGroupInvitation
  };
  return () => d.render(() => Invitation(props));
}

function nodes(tree, predicate) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap((item) => nodes(item, predicate));
  return [
    ...(predicate(tree) ? [tree] : []),
    ...nodes(tree.props?.children, predicate)
  ];
}
const settle = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
};
const acceptButton = (tree) => nodes(tree, (n) => n.type === Button)[0];
const alerts = (tree) => nodes(tree, (n) => n.props?.role === 'alert');

test('a refused card shows the server reason and the button works again', async () => {
  let calls = 0;
  const render = mount(() => {
    calls += 1;
    return Promise.reject({
      status: 403,
      message: 'This invitation is no longer valid.'
    });
  });
  let tree = render();
  assert.equal(alerts(tree).length, 0);
  const clicked = acceptButton(tree).props.onClick();
  tree = render();
  assert.equal(acceptButton(tree).props.loading, true, 'spins while asking');
  await clicked;
  await settle();
  tree = render();
  assert.equal(acceptButton(tree).props.loading, false, 'not stuck loading');
  const [message] = alerts(tree);
  assert.ok(message, 'the reason is shown');
  assert.equal(message.props.children, 'This invitation is no longer valid.');
  // usable again, and a retry clears the old message while it runs
  const retry = acceptButton(tree).props.onClick();
  tree = render();
  assert.equal(alerts(tree).length, 0);
  await retry;
  assert.equal(calls, 2);
});

test('a server or network failure shows a generic line, never raw error text', async () => {
  for (const failure of [
    { status: 500, message: 'ER_LOCK_DEADLOCK: Deadlock found when trying to get lock' },
    { status: 500, message: 'Network Error', isTransportError: true }
  ]) {
    const render = mount(() => Promise.reject(failure));
    let tree = render();
    await acceptButton(tree).props.onClick();
    await settle();
    tree = render();
    const [message] = alerts(tree);
    assert.equal(message.props.children, 'Something went wrong. Please try again.');
    assert.equal(acceptButton(tree).props.loading, false);
  }
});

test('a shown message lets the card grow instead of clipping it', async () => {
  const render = mount(() =>
    Promise.reject({ status: 403, message: 'This invitation is no longer valid.' })
  );
  let tree = render();
  assert.match(tree.props.className, /height: 13rem;/);
  await acceptButton(tree).props.onClick();
  await settle();
  tree = render();
  assert.match(tree.props.className, /height: auto;/);
  assert.match(tree.props.className, /min-height: 13rem;/);
  assert.doesNotMatch(tree.props.className, /calc\(/);
});

test('an accepted card shows no error', async () => {
  const render = mount(() => Promise.resolve());
  let tree = render();
  await acceptButton(tree).props.onClick();
  await settle();
  tree = render();
  assert.equal(acceptButton(tree).props.loading, false);
  assert.equal(alerts(tree).length, 0);
});
