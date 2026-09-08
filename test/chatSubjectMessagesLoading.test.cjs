const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { transformSync } = require('esbuild');

// Render the actual dialog's state/effects with controlled promises. No app,
// account, network, timer, or shared modal behavior is exercised here.
function fixture() {
  const slots = [], effects = [], requests = [];
  let cursor = 0, dirty = false, disposed = false, updatesAfterDispose = 0;
  let props = { subjectId: 1, subjectTitle: 'Community plans', onHide() {} };
  const hooks = {
    ...React,
    useMemo: fn => fn(),
    useRef(initial) {
      const index = cursor++;
      slots[index] ??= { current: initial };
      return slots[index];
    },
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], next => {
        if (disposed) updatesAfterDispose++;
        const value = typeof next === 'function' ? next(slots[index]) : next;
        if (!Object.is(value, slots[index])) { slots[index] = value; dirty = true; }
      }];
    },
    useEffect(effect, deps) {
      const index = cursor++;
      const previous = slots[index];
      if (!previous || !deps || deps.some((value, i) => !Object.is(value, previous.deps[i]))) {
        slots[index] = { deps, cleanup: previous?.cleanup };
        effects.push(() => { slots[index].cleanup?.(); slots[index].cleanup = effect(); });
      }
    }
  };
  const Button = ({ children, onClick, loading, disabled, ...props }) => React.createElement('button', { onClick, disabled: loading || disabled, 'aria-label': props['aria-label'], style: props.style }, children);
  const LoadMore = ({ onClick, loading }) => React.createElement(Button, { onClick, loading }, 'Load earlier messages');
  const load = args => new Promise((resolve, reject) => requests.push({ args, resolve, reject }));
  const dependencies = {
    react: hooks,
    '~/components/Modal': ({ children, ...props }) => React.createElement('section', { role: 'dialog', 'aria-label': props['aria-label'] }, children),
    '~/components/Modal/LegacyModalLayout': ({ children }) => React.createElement('div', null, children),
    '~/components/Button': Button,
    '~/components/Icon': () => null,
    './Message': ({ id, content }) => React.createElement('p', { 'data-message': id }, content),
    '~/components/Loading': () => React.createElement('span', null, 'Loading preview'),
    '~/components/Buttons/LoadMoreButton': LoadMore,
    '~/constants/css': { Color: { logoBlue: () => '#418ceb' } },
    '~/contexts': {
      useAppContext: selector => selector({ requestHelpers: { loadChatSubjectMessages: load } }),
      useKeyContext: selector => selector({ myState: { profileTheme: 'logoBlue' } })
    },
    '~/theme/hooks/useRoleColor': { useRoleColor: () => ({ colorKey: 'logoBlue' }) },
    '../../typography': { chatTextClass: 'chat-text' }
  };
  const source = readFileSync(path.resolve(__dirname, '../src/containers/Chat/Modals/SubjectMsgsModal/index.tsx'), 'utf8');
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', 'console', transformSync(source, { loader: 'tsx', format: 'cjs', jsx: 'transform' }).code)(name => {
    assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
    return dependencies[name];
  }, mod, mod.exports, { error() {} });
  let tree;
  function render(overrides = {}) {
    props = { ...props, ...overrides };
    for (let pass = 0; pass < 10; pass++) {
      cursor = 0; dirty = false;
      tree = mod.exports.default(props);
      while (effects.length) effects.shift()();
      if (!dirty) return renderToStaticMarkup(tree);
    }
    throw new Error('Unexpected render loop');
  }
  function nodes(value = tree) {
    if (!React.isValidElement(value)) return [];
    return [value, ...React.Children.toArray(value.props.children).flatMap(child => nodes(child))];
  }
  return {
    requests, render,
    loadingProps() { return nodes().find(node => node.type === dependencies['~/components/Loading'])?.props; },
    button(text) {
      const node = nodes().find(node => (node.type === LoadMore && text === 'Load earlier messages') ||
        (node.type === Button && node.props.children === text));
      assert.ok(node, `Button exists: ${text}`);
      return node.props;
    },
    dispose() { disposed = true; for (const slot of slots) slot?.cleanup?.(); },
    get updatesAfterDispose() { return updatesAfterDispose; }
  };
}
async function settle() { await Promise.resolve(); await Promise.resolve(); }

test('an empty completed topic shows an empty state instead of a permanent spinner', async () => {
  const app = fixture();
  assert.match(app.render(), /Loading preview/);
  assert.equal(app.loadingProps().text, 'Loading topic messages');
  app.requests[0].resolve({ messages: [], loadMoreButtonShown: false });
  await settle();
  const html = app.render();
  assert.match(html, /No messages in this topic yet/);
  assert.doesNotMatch(html, /Loading preview/);
  assert.match(html, /aria-label="Topic messages: Community plans"/);
  assert.match(html, /aria-label="Close topic messages"/);
  assert.match(html, /min-height:44px/);
  assert.match(html, /color:#334155/);
});

test('initial failure offers a working retry and then renders the loaded messages', async () => {
  const app = fixture(); app.render();
  app.requests[0].reject(new Error('Local test failure')); await settle();
  assert.match(app.render(), /role="alert"/);
  app.button('Retry').onClick(); app.render();
  assert.equal(app.requests.length, 2);
  app.requests[1].resolve({ messages: [{ id: 2, content: 'Ready now' }], loadMoreButtonShown: false });
  await settle();
  assert.match(app.render(), /Ready now/);
  assert.doesNotMatch(app.render(), /role="alert"|Loading preview/);
});

test('load-more failure keeps messages, stops loading, and retries the same canonical IDs', async () => {
  const app = fixture(); app.render();
  app.requests[0].resolve({ messages: [{ id: 2, content: 'Recent message' }], loadMoreButtonShown: true });
  await settle(); app.render();
  assert.deepEqual(app.button('Load earlier messages').style,
    { minHeight: 44, fontSize: '14px', color: '#334155' });
  app.button('Load earlier messages').onClick(); app.render();
  assert.equal(app.button('Load earlier messages').loading, true);
  app.requests[1].reject(new Error('Local test failure')); await settle();
  assert.match(app.render(), /Recent message/);
  assert.equal(app.button('Load earlier messages').loading, false);
  app.button('Retry').onClick(); app.render();
  assert.deepEqual(app.requests[2].args, { subjectId: 1, messageIds: [2] });
  app.requests[2].resolve({ messages: [{ id: 1, content: 'Earlier message' }], loadMoreButtonShown: false });
  await settle();
  const html = app.render();
  assert.ok(html.indexOf('Earlier message') < html.indexOf('Recent message'));
  assert.doesNotMatch(html, /role="alert"|Loading preview/);
});

test('late requests cannot replace a different topic or update a closed dialog', async () => {
  const app = fixture(); app.render(); app.render({ subjectId: 2 });
  assert.equal(app.requests.length, 2);
  app.requests[1].resolve({ messages: [{ id: 9, content: 'Current topic' }], loadMoreButtonShown: true });
  await settle(); app.render();
  app.requests[0].resolve({ messages: [{ id: 1, content: 'Old topic' }], loadMoreButtonShown: false });
  await settle();
  assert.match(app.render(), /Current topic/);
  assert.doesNotMatch(app.render(), /Old topic/);
  app.button('Load earlier messages').onClick(); app.render(); app.dispose();
  app.requests[2].resolve({ messages: [], loadMoreButtonShown: false });
  await settle();
  assert.equal(app.updatesAfterDispose, 0);
});
