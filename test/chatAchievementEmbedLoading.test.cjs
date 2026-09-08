const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { transformSync } = require('esbuild');

const gold = { type: 'gold', title: 'Gold achievement', ap: 100 };
const sage = { type: 'sage', title: 'Sage achievement', ap: 200 };
const unlock = (achievement = gold) => ({
  rootType: 'achievement', rootObj: achievement, uploader: { id: 9 }
});

// Source-backed hook driver with controlled requests and inspected canonical
// action arguments. Cache merges and leaf UI are simulated, not full reducers.
function fixture(mode, initial = {}) {
  const slots = [], effects = [], requests = [], writes = [];
  let cursor = 0, dirty = false, disposed = false, lateUpdates = 0, tree;
  let definitions = initial.definitions || {}, contents = initial.contents || {};
  let viewer = 5;
  let props = {
    src: mode === 'definitions' ? '/achievements/gold' : '/achievement-unlocks/7',
    isPreview: true
  };
  const hooks = {
    ...React,
    useMemo: fn => fn(),
    useRef(value) { const i = cursor++; return slots[i] ||= { current: value }; },
    useState(value) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = typeof value === 'function' ? value() : value;
      return [slots[i], next => {
        if (disposed) lateUpdates++;
        const value = typeof next === 'function' ? next(slots[i]) : next;
        if (!Object.is(slots[i], value)) { slots[i] = value; dirty = true; }
      }];
    },
    useEffect(effect, deps) {
      const i = cursor++, old = slots[i];
      if (!old || deps.some((value, j) => !Object.is(value, old.deps[j]))) {
        slots[i] = { deps, cleanup: old?.cleanup };
        effects.push(() => { slots[i].cleanup?.(); slots[i].cleanup = effect(); });
      }
    }
  };
  const request = args => new Promise((resolve, reject) => requests.push({ args, resolve, reject }));
  const loadAllAchievements = () => request('definitions');
  const loadContent = args => request(args);
  const onSetAchievementsObj = data => { writes.push({ type: 'definitions', data }); definitions = data; dirty = true; };
  const onInitContent = data => { writes.push({ type: 'content', data }); contents = { ...contents, [data.contentId]: { ...data, loaded: true } }; dirty = true; };
  const ErrorState = ({ onRetry }) => React.createElement('button', { onClick: onRetry }, 'Retry attachment');
  const dependencies = {
    react: hooks,
    'react-router-dom': { useNavigate: () => () => {} },
    '@emotion/css': require('@emotion/css'),
    '~/helpers': { isMobile: () => false },
    '~/helpers/hooks': { useContentState: ({ contentId }) => contents[contentId] || {} },
    '~/helpers/timeStampHelpers': { timeSince: () => 'Today' },
    '~/theme/hooks/useRoleColor': { useRoleColor: () => ({ getColor: () => '#333' }) },
    '~/constants/css': { Color: { gray: () => '#777' }, borderRadius: '8px', mobileMaxWidth: '767px' },
    '~/contexts': {
      useAppContext: selector => selector({ requestHelpers: { loadAllAchievements, loadContent }, user: { state: { achievementsObj: definitions }, actions: { onSetAchievementsObj } } }),
      useKeyContext: selector => selector({ myState: { userId: viewer } }),
      useContentContext: selector => selector({ actions: { onInitContent } })
    },
    '~/components/AchievementItem': ({ achievement }) => React.createElement('span', null, achievement.title),
    './CompactAchievementCard': ({ achievement }) => React.createElement('button', null, achievement.title),
    '~/components/ProfilePic': () => null,
    '~/components/Texts/UsernameText': () => null,
    '~/components/Loading': () => React.createElement('span', null, 'Loading attachment'),
    '../InvalidContent': () => React.createElement('span', null, 'Invalid Content'),
    '../EmbedLoadError': ErrorState
  };
  const name = mode === 'definitions' ? 'AchievementComponent' : 'AchievementUnlockComponent';
  const source = readFileSync(path.resolve(__dirname, `../src/components/Texts/RichText/Markdown/EmbeddedComponent/InternalComponent/${name}.tsx`), 'utf8');
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', 'navigator', transformSync(source, { loader: 'tsx', format: 'cjs', jsx: 'transform' }).code)(name => {
    assert.ok(Object.hasOwn(dependencies, name), name); return dependencies[name];
  }, mod, mod.exports, {});
  const Component = mod.exports.default;
  return {
    requests, writes,
    get lateUpdates() { return lateUpdates; },
    render(next = {}) {
      props = { ...props, ...next };
      for (let i = 0; i < 20; i++) {
        dirty = false; cursor = 0; tree = Component(props);
        while (effects.length) effects.shift()();
        if (!dirty) return renderToStaticMarkup(tree);
      }
      throw new Error('Render loop');
    },
    retry() { assert.equal(tree.type, ErrorState); tree.props.onRetry(); },
    viewer(value) { viewer = value; },
    dispose() { disposed = true; for (const slot of slots) slot?.cleanup?.(); }
  };
}
async function settle() { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); }

test('achievement definitions offer Retry after a transport failure and hydrate the canonical cache', async () => {
  const app = fixture('definitions'); app.render();
  app.requests[0].reject(new Error('Offline')); await settle();
  assert.match(app.render(), /Retry attachment/); assert.equal(app.writes.length, 0);
  app.retry(); app.render(); app.requests[1].resolve({ gold }); await settle();
  assert.match(app.render(), /Gold achievement/);
  assert.deepEqual(app.writes, [{ type: 'definitions', data: { gold } }]);
});

test('achievement empty, missing, cached and malformed-definition responses settle without repeated requests', async () => {
  const empty = fixture('definitions'); empty.render(); empty.requests[0].resolve({}); await settle();
  assert.match(empty.render(), /Invalid Content/); assert.equal(empty.requests.length, 1);
  const cached = fixture('definitions', { definitions: { gold } });
  assert.match(cached.render(), /Gold achievement/); assert.equal(cached.requests.length, 0);
  assert.match(cached.render({ src: '/achievements/unknown' }), /Invalid Content/);
  const malformed = fixture('definitions'); malformed.render(); malformed.requests[0].resolve(null); await settle();
  assert.match(malformed.render(), /Retry attachment/); assert.equal(malformed.writes.length, 0);
});

test('achievement target changes ignore old results and do not retain a prior target error', async () => {
  const app = fixture('definitions'); app.render(); app.render({ src: '/achievements/sage?from=chat#more' });
  assert.equal(app.requests.length, 2);
  app.requests[0].resolve({ gold }); await settle(); assert.equal(app.writes.length, 0);
  app.requests[1].reject(new Error('Offline')); await settle(); assert.match(app.render(), /Retry attachment/);
  assert.match(app.render({ src: '/achievements/gold#more' }), /Loading attachment/);
  app.requests[2].resolve({ gold }); await settle(); assert.match(app.render(), /Gold achievement/);
});

test('achievement definitions reject empty routes and ignore completion after unmount', async () => {
  const invalid = fixture('definitions'); assert.match(invalid.render({ src: '/achievements/' }), /Invalid Content/); assert.equal(invalid.requests.length, 0);
  const app = fixture('definitions'); app.render(); app.dispose(); app.requests[0].resolve({ gold }); await settle();
  assert.equal(app.writes.length, 0); assert.equal(app.lateUpdates, 0);
});

test('achievement unlock failure retries its canonical pass request and keeps root content intact', async () => {
  const app = fixture('unlock'); app.render(); app.requests[0].reject(new Error('Offline')); await settle();
  assert.match(app.render(), /Retry attachment/); app.retry(); app.render();
  assert.deepEqual(app.requests[1].args, { contentId: 7, contentType: 'pass', rootType: 'achievement' });
  app.requests[1].resolve(unlock()); await settle(); assert.match(app.render(), /Gold achievement/);
  assert.deepEqual(app.writes, [{ type: 'content', data: { ...unlock(), contentType: 'pass', contentId: 7 } }]);
});

test('a missing achievement unlock cannot latch onto a later valid pass', async () => {
  const app = fixture('unlock'); app.render(); app.requests[0].resolve({ notFound: true }); await settle();
  assert.match(app.render(), /Invalid Content/); assert.equal(app.writes.length, 0);
  assert.match(app.render({ src: '/achievement-unlocks/8' }), /Loading attachment/);
  app.requests[1].resolve(unlock(sage)); await settle(); assert.match(app.render(), /Sage achievement/);
});

test('slow achievement unlocks do not block a different pass or overwrite it later', async () => {
  const app = fixture('unlock'); app.render(); app.render({ src: '/achievement-unlocks/8' });
  assert.equal(app.requests.length, 2); app.requests[1].resolve(unlock(sage)); await settle();
  assert.match(app.render(), /Sage achievement/);
  app.requests[0].resolve(unlock()); await settle(); assert.match(app.render(), /Sage achievement/);
  assert.equal(app.writes.length, 1); assert.equal(app.writes[0].data.contentId, 8);
});

test('viewer changes and unmount ignore obsolete achievement unlock responses', async () => {
  const app = fixture('unlock'); app.render(); app.viewer(0); app.render(); assert.equal(app.requests.length, 2);
  app.requests[0].reject(new Error('Old viewer')); await settle(); assert.match(app.render(), /Loading attachment/);
  app.requests[1].resolve(unlock()); await settle(); assert.match(app.render(), /Gold achievement/);
  const closed = fixture('unlock'); closed.render(); closed.dispose(); closed.requests[0].resolve(unlock()); await settle();
  assert.equal(closed.writes.length, 0); assert.equal(closed.lateUpdates, 0);
});

test('achievement pass IDs strip query and fragment and reject non-positive or unsafe IDs without requests', () => {
  for (const id of ['', '0', '-1', '1.5', 'abc', 'Infinity', '9007199254740992']) {
    const app = fixture('unlock'); assert.match(app.render({ src: `/achievement-unlocks/${id}` }), /Invalid Content/, id); assert.equal(app.requests.length, 0, id);
  }
  const valid = fixture('unlock'); valid.render({ src: '/achievement-unlocks/7?from=chat#more' }); assert.equal(valid.requests[0].args.contentId, 7);
  const fragment = fixture('unlock'); fragment.render({ src: '/achievement-unlocks/8#more' }); assert.equal(fragment.requests[0].args.contentId, 8);
});

test('cached achievement unlocks avoid redundant requests and invalid roots remain unavailable', () => {
  const cached = fixture('unlock', { contents: { 7: { ...unlock(), loaded: true } } });
  assert.match(cached.render(), /Gold achievement/); assert.equal(cached.requests.length, 0);
  const wrong = fixture('unlock', { contents: { 7: { rootType: 'mission', rootObj: gold, loaded: true } } });
  assert.match(wrong.render(), /Invalid Content/); assert.equal(wrong.requests.length, 0);
});
