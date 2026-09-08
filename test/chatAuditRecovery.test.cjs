const {
  assert,
  test,
  compile,
  driver,
  css,
  nodes,
  deferred,
  settle
} = require('./helpers/chatDialogHarness.cjs');
const leaf = () => null;
const colors = new Proxy({}, { get: () => () => '#345' });
const timeout = (fn) => Promise.resolve().then(fn);
function environment() {
  const d = driver(),
    timers = new Map();
  let id = 0;
  const scoped = compile(
    'src/helpers/hooks/useScopedRead.ts',
    {
      react: d.hooks,
      '../readWithTimeout': timeout
    },
    {
      setTimeout: (fn) => {
        timers.set(++id, fn);
        return id;
      },
      clearTimeout: (id) => timers.delete(id)
    }
  ).default;
  return {
    d,
    scoped,
    async tick() {
      const callbacks = [...timers.values()];
      timers.clear();
      callbacks.forEach((fn) => fn());
      await settle();
    }
  };
}
const text = (tree) => {
  if (Array.isArray(tree)) return tree.map(text).join('');
  if (typeof tree === 'string' || typeof tree === 'number') return String(tree);
  return text(tree?.props?.children || '');
};

test('scoped reads recover from failures and discard old scope, retry and unmounted results', async () => {
  const f = environment();
  let scope = 'a',
    request = deferred();
  const render = () => f.d.render(() => f.scoped(scope, () => request.promise));
  assert.equal(render().loading, true);
  await f.tick();
  request.reject(Error());
  await settle();
  assert.equal(render().error, true);
  render().retry();
  request = deferred();
  render();
  await f.tick();
  const old = request;
  scope = 'b';
  request = deferred();
  render();
  await f.tick();
  old.resolve('old');
  await settle();
  assert.equal(render().data, undefined);
  request.resolve('current');
  await settle();
  assert.equal(render().data, 'current');
  scope = 'c';
  request = deferred();
  render();
  await f.tick();
  f.d.dispose();
  request.resolve('late');
  await settle();
  assert.equal(f.d.lateUpdates, 0);
});

test('read timeout settles a hung request and clears its timer', async () => {
  let expire,
    cleared = 0;
  const read = compile(
    'src/helpers/readWithTimeout.ts',
    {},
    {
      setTimeout: (fn) => {
        expire = fn;
        return 1;
      },
      clearTimeout: () => cleared++
    }
  ).default;
  const pending = read(() => new Promise(() => {}));
  expire();
  await assert.rejects(pending, /timed out/);
  assert.equal(cleared, 1);
  assert.equal(await read(async () => 7), 7);
  assert.equal(cleared, 2);
});

function videos() {
  const f = environment(),
    requests = [],
    Form = () => null,
    Button = () => null;
  const calls = [];
  const ctx = {
    theme: { done: { color: 'blue' } },
    requestHelpers: {
      loadUploads: (args) => {
        const r = deferred();
        requests.push({ ...r, args });
        return r.promise;
      },
      searchContent: (args) => {
        const r = deferred();
        requests.push({ ...r, args });
        return r.promise;
      }
    },
    actions: { onInitContent: (value) => calls.push(value) }
  };
  const C = compile('src/containers/Chat/Modals/SelectVideoModal.tsx', {
    react: f.d.hooks,
    '~/components/Modal': leaf,
    '~/components/Button': Button,
    '~/components/Forms/SelectUploadsForm': Form,
    '~/contexts': Object.fromEntries(
      ['useKeyContext', 'useAppContext', 'useContentContext'].map((k) => [
        k,
        (fn) => fn(ctx)
      ])
    ),
    '~/helpers/hooks/useScopedRead': f.scoped,
    '~/helpers/readWithTimeout': timeout
  }).VideoPicker;
  const render = () =>
    f.d.render(() =>
      C({
        onDone: (value) => calls.push(value),
        onHide: () => calls.push('hide')
      })
    );
  return {
    ...f,
    requests,
    calls,
    render,
    form: () => nodes(render(), (n) => n.type === Form)[0]?.props,
    input: () => nodes(render(), (n) => n.type === 'input')[0].props,
    button: (label) =>
      nodes(render(), (n) => n.type === Button && text(n) === label)[0]?.props
  };
}
const page = (ids, more = false) => ({
  results: ids.map((id) => ({ id, title: 'Video ' + id })),
  loadMoreButton: more
});

test('video picker initial failure retries and page failure preserves results with duplicate lock', async () => {
  const f = videos();
  f.render();
  await f.tick();
  f.requests[0].reject(Error());
  await settle();
  assert.match(text(f.render()), /Could not load videos/);
  f.button('Try again').onClick();
  f.render();
  await f.tick();
  f.requests[1].resolve(page([1], true));
  await settle();
  assert.deepEqual(f.form().uploads, [1]);
  const more = f.form().loadMoreUploads;
  more();
  more();
  await settle();
  assert.equal(f.requests.length, 3);
  f.requests[2].reject(Error());
  await settle();
  assert.equal(f.form().loadingMore, false);
  assert.deepEqual(f.form().uploads, [1]);
  f.button('Try loading more again').onClick();
  await settle();
  f.requests[3].resolve(page([1, 2]));
  await settle();
  assert.deepEqual(f.form().uploads, [1, 2]);
  assert.equal(f.form().loadMoreButton, false);
});

test('video search ignores older queries and old pagination after query changes', async () => {
  const f = videos();
  f.render();
  await f.tick();
  f.requests[0].resolve(page([1], true));
  await settle();
  f.form().loadMoreUploads();
  await settle();
  f.input().onChange({ target: { value: 'old' } });
  f.render();
  await f.tick();
  f.input().onChange({ target: { value: 'new' } });
  f.render();
  await f.tick();
  f.requests[3].resolve(page([3]));
  await settle();
  assert.deepEqual(f.form().uploads, [3]);
  f.requests[1].resolve(page([2]));
  f.requests[2].resolve(page([4]));
  await settle();
  assert.deepEqual(f.form().uploads, [3]);
  assert.deepEqual(f.calls, []);
  f.input().onChange({ target: { value: '' } });
  f.render();
  await f.tick();
  f.d.dispose();
  f.requests[4].resolve(page([8]));
  await settle();
  assert.equal(f.d.lateUpdates, 0);
});

test('video search malformed response shows recovery instead of false empty results', async () => {
  const f = videos();
  f.render();
  await f.tick();
  f.requests[0].resolve({ results: null });
  await settle();
  assert.match(text(f.render()), /Could not load videos/);
  assert.equal(f.form(), undefined);
});

test('Top Scorers failure retries, keyboard buttons preserve tabs, and channel changes fence data', async () => {
  const f = environment(),
    requests = [],
    tabs = [];
  let channelId = 2;
  const Button = () => null,
    Row = () => null;
  const ctx = {
    myState: { userId: 1 },
    requestHelpers: {
      loadWordleRankings: () => {
        const r = deferred();
        requests.push(r);
        return r.promise;
      }
    }
  };
  const C = compile('src/containers/Chat/Modals/WordleModal/Rankings.tsx', {
    react: f.d.hooks,
    '~/components/Button': Button,
    '~/components/FilterBar': leaf,
    '~/components/RankingsListItem': Row,
    '~/components/Loading': leaf,
    '~/components/LeaderboardList': leaf,
    '~/helpers/hooks/useScopedRead': f.scoped,
    '@emotion/css': { css },
    '~/contexts': {
      useAppContext: (fn) => fn(ctx),
      useKeyContext: (fn) => fn(ctx)
    }
  }).default;
  const render = () =>
    f.d.render(() =>
      C({
        channelId,
        rankingsTab: 'all',
        onSetRankingsTab: (tab) => tabs.push(tab)
      })
    );
  render();
  await f.tick();
  requests[0].reject(Error());
  await settle();
  assert.match(text(render()), /Could not load Top Scorers/);
  nodes(render(), (n) => n.type === Button)[0].props.onClick();
  render();
  await f.tick();
  requests[1].resolve({ all: [{ id: 1 }], top30s: [], myRank: 1 });
  await settle();
  const buttons = nodes(render(), (n) => n.type === 'button');
  assert.equal(buttons[0].props['aria-pressed'], true);
  buttons[1].props.onClick();
  assert.deepEqual(tabs, ['top30']);
  channelId = 3;
  assert.equal(nodes(render(), (n) => n.type === Row).length, 0);
  await f.tick();
  requests[2].resolve({ all: [], top30s: [], myRank: null });
  await settle();
  assert.match(text(render()), /No scores yet/);
});

test('statistics handle zero, missing and invalid values and retain normal rounding', () => {
  const C = compile(
    'src/containers/Chat/Modals/WordleModal/OverviewModal/StatBar.tsx',
    {
      react: require('react'),
      '~/components/ErrorBoundary': leaf,
      '../constants/strings': {
        TOTAL_TRIES_TEXT: 'Played',
        SUCCESS_RATE_TEXT: 'Rate',
        CURRENT_STREAK_TEXT: 'Current',
        BEST_STREAK_TEXT: 'Best'
      }
    }
  ).default;
  const values = (stats) =>
    nodes(C({ stats, isGameOver: false }), (n) => n.props?.label).map(
      (n) => n.props.value
    );
  assert.deepEqual(values({ totalGames: 0, numSuccess: 0 }), [0, '0%', 0, 0]);
  assert.deepEqual(values(undefined), [0, '0%', 0, 0]);
  assert.deepEqual(values({ totalGames: NaN, numSuccess: Infinity }), [
    0,
    '0%',
    0,
    0
  ]);
  assert.equal(values({ totalGames: 3, numSuccess: 2 })[1], '66.7%');
});

test('thumbnail progress fences viewer/video changes, handles failures and clamps invalid values', async () => {
  const f = environment(),
    requests = [];
  let videoId = 2;
  const Progress = () => null;
  const ctx = {
    myState: { userId: 1 },
    theme: {},
    requestHelpers: {
      loadVideoWatchPercentage: () => {
        const r = deferred();
        requests.push(r);
        return r.promise;
      }
    }
  };
  const C = compile(
    'src/components/VideoThumbImage/index.tsx',
    {
      react: f.d.hooks,
      '~/helpers/hooks/useScopedRead': f.scoped,
      '~/contexts': {
        useAppContext: (fn) => fn(ctx),
        useKeyContext: (fn) => fn(ctx)
      },
      '~/components/Icon': leaf,
      './WatchProgressBar': Progress,
      '~/constants/css': { Color: colors },
      '@emotion/css': { css },
      '~/helpers': { isMobile: () => false }
    },
    { navigator: {} }
  ).default;
  const render = () =>
    f.d.render(() => C({ videoId, rewardLevel: -2, src: 'image' }));
  render();
  await f.tick();
  videoId = 3;
  render();
  await f.tick();
  requests[0].resolve(80);
  await settle();
  assert.equal(nodes(render(), (n) => n.type === Progress).length, 0);
  requests[1].resolve(150);
  await settle();
  assert.equal(
    nodes(render(), (n) => n.type === Progress)[0].props.percentage,
    100
  );
  ctx.myState.userId = 2;
  render();
  await f.tick();
  requests[2].reject(Error());
  await settle();
  assert.equal(nodes(render(), (n) => n.type === Progress).length, 0);
});

test('video selection supports Enter/Space once and communicates selected state', () => {
  const f = environment(),
    calls = [];
  const C = compile(
    'src/components/Forms/SelectUploadsForm/Selectable.tsx',
    {
      react: f.d.hooks,
      '~/components/Texts/FullTextReveal': leaf,
      '~/components/VideoThumbImage': leaf,
      '~/components/Embedly': leaf,
      '~/components/ErrorBoundary': leaf,
      '~/helpers': { isMobile: () => false },
      '~/constants/css': { Color: colors, mobileMaxWidth: '767px' },
      '@emotion/css': { css },
      '~/theme/hooks/useRoleColor': {
        useRoleColor: () => ({ getColor: () => '#345' })
      }
    },
    { navigator: {} }
  ).default;
  const render = (selected) =>
    f.d.render(() =>
      C({
        item: { id: 3, title: 'Long video title' },
        selected,
        onSelect: (id) => calls.push(id),
        onDeselect: (id) => calls.push(-id)
      })
    );
  const control = nodes(render(false), (n) => n.props?.role === 'button')[0]
    .props;
  assert.equal(control.tabIndex, 0);
  assert.equal(control['aria-label'], 'Select Long video title');
  const target = {};
  const event = {
    target,
    currentTarget: target,
    nativeEvent: {},
    preventDefault() {},
    key: 'Enter'
  };
  control.onKeyDown(event);
  control.onKeyDown({ ...event, repeat: true });
  nodes(render(true), (n) => n.props?.role === 'button')[0].props.onKeyDown({
    ...event,
    key: ' '
  });
  assert.deepEqual(calls, [3, -3]);
});

test('user-list chat actions are named, deduplicated, retryable and ignore close/unmount', async () => {
  const f = environment(),
    requests = [],
    nav = [];
  const Button = () => null;
  const ctx = {
    state: { chatStatus: {} },
    myState: { userId: 1 },
    actions: {},
    requestHelpers: {
      loadDMChannel: () => {
        const r = deferred();
        requests.push(r);
        return r.promise;
      }
    }
  };
  const C = compile('src/components/Modals/UserListModal.tsx', {
    react: f.d.hooks,
    '~/helpers/readWithTimeout': timeout,
    '~/components/Modal': leaf,
    '~/components/Modal/LegacyModalLayout': leaf,
    '~/components/Button': Button,
    '~/components/RoundList': leaf,
    '~/components/Icon': leaf,
    '~/components/ProfilePic': leaf,
    '~/components/Loading': leaf,
    '~/components/Buttons/LoadMoreButton': leaf,
    '~/constants/css': { Color: colors },
    'react-router-dom': { useNavigate: () => (path) => nav.push(path) },
    '~/contexts': Object.fromEntries(
      ['useAppContext', 'useChatContext', 'useKeyContext'].map((k) => [
        k,
        (fn) => fn(ctx)
      ])
    )
  }).default;
  const render = () =>
    f.d.render(() =>
      C({ users: [{ id: 2, username: 'Friend' }], onHide() {} })
    );
  const chat = () =>
    nodes(
      render(),
      (n) => n.type === Button && n.props['aria-label'] === 'Chat with Friend'
    )[0].props;
  assert.ok(
    nodes(render(), (n) => n.props?.['aria-label'] === "View Friend's profile")
      .length
  );
  const click = chat().onClick;
  click();
  click();
  await settle();
  assert.equal(requests.length, 1);
  requests[0].reject(Error());
  await settle();
  assert.match(text(render()), /Could not open this chat/);
  assert.equal(chat().disabled, false);
  chat().onClick();
  await settle();
  render().props.onClose();
  requests[1].resolve({ channelId: 2, pathId: 333 });
  await settle();
  assert.deepEqual(nav, []);
  f.d.dispose();
  assert.equal(f.d.lateUpdates, 0);
});
