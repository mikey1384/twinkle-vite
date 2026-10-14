const { assert, test, compile, driver, css, nodes, deferred, settle } = require('./helpers/chatDialogHarness.cjs');

function pendingHook(app) {
  return compile('src/helpers/hooks/usePendingAction.ts', { react: app.hooks }).default;
}

test('pending actions prevent same-frame duplicate intents and recover after rejection', async () => {
  const app = driver(), usePendingAction = pendingHook(app), work = deferred();
  let calls = 0;
  const action = app.render(() => usePendingAction());
  const first = action.runAction('save:7', () => { calls++; return work.promise; });
  const failed = assert.rejects(first, /offline/);
  await action.runAction('save:7', async () => { calls++; });
  await action.runAction('delete:7', async () => { calls++; });
  assert.equal(calls, 1);
  assert.equal(app.render(() => usePendingAction()).pendingAction, 'save:7');
  work.reject(new Error('offline'));
  await failed;
  const retry = app.render(() => usePendingAction());
  assert.equal(retry.pendingAction, null);
  assert.deepEqual(await retry.runAction('save:7', async () => ({ saved: 7 })), { saved: 7 });
  assert.equal(app.render(() => usePendingAction()).pendingAction, null);
});

test('a completed request cannot update an unmounted control or restart through a stale handler', async () => {
  const app = driver(), usePendingAction = pendingHook(app), work = deferred();
  const action = app.render(() => usePendingAction());
  const first = action.runAction('save', () => work.promise);
  app.dispose();
  work.resolve();
  await first;
  let restarted = false;
  await action.runAction('save', async () => { restarted = true; });
  assert.equal(restarted, false);
  assert.equal(app.lateUpdates, 0);
});

test('crew actions stay pending through canonical reload, then expose errors and allow retry', async () => {
  const app = driver(), usePendingAction = pendingHook(app), reload = deferred();
  const useQuestAction = compile('src/containers/BridgeBuilderQuest/useQuestAction.ts', {
    react: app.hooks,
    '~/helpers/hooks/usePendingAction': usePendingAction
  }).default;
  let calls = 0;
  const render = () => app.render(() => useQuestAction(() => reload.promise));
  const action = render();
  const first = action.run(async () => { calls++; }, 'withdraw:8');
  await settle();
  assert.equal(render().busy, true);
  assert.equal(render().pendingAction, 'withdraw:8');
  assert.equal(await action.run(async () => { calls++; }, 'accept:8'), false);
  assert.equal(calls, 1);
  reload.resolve();
  assert.equal(await first, true);
  assert.equal(render().busy, false);
  assert.equal(await render().run(async () => { throw new Error('Please retry'); }, 'accept:8'), false);
  assert.equal(render().error, 'Please retry');
  assert.equal(render().pendingAction, null);
  assert.equal(await render().run(async () => {}, 'accept:8'), true);
  assert.equal(render().error, '');
});

test('only the submitted review decision spins while every decision stays disabled; failure restores the controls', async () => {
  const app = driver(), usePendingAction = pendingHook(app), work = deferred(), calls = [];
  const Button = () => null;
  const Detail = compile('src/containers/Management/Main/ReviewRequestDetail.tsx', {
    react: app.hooks,
    '@emotion/css': { css },
    'react-router-dom': { useNavigate: () => () => {} },
    '~/components/Button': Button,
    '~/components/Icon': () => null,
    '~/contexts': { useAppContext: selector => selector({ requestHelpers: {
      loadBuildReviewRequest: async () => ({}),
      decideBuildReviewRequest: payload => { calls.push(payload); return work.promise; }
    } }) },
    '~/theme/hooks/useRoleColor': { useRoleColor: () => ({ colorKey: 'green' }) },
    '~/constants/css': { Color: new Proxy({}, { get: () => () => '#123' }), mobileMaxWidth: '767px' },
    '~/helpers/timeStampHelpers': { timeSince: () => 'now' },
    '~/helpers/buildReviewRequests': { formatReviewBytes: String },
    '~/helpers/hooks/usePendingAction': usePendingAction
  }).default;
  const render = () => app.render(() => Detail({
    item: { id: 7, type: 'project-limit', summary: 'More room', decisions: ['approve', 'reject', 'revoke'] },
    onDecided() {}
  }));
  const buttons = tree => nodes(tree, n => n.type === Button);
  let controls = buttons(render());
  const submitting = controls[0].props.onClick();
  await controls[1].props.onClick();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].decision, 'approve');
  controls = buttons(render());
  assert.deepEqual(controls.map(b => b.props.loading), [true, false, false]);
  assert.ok(controls.every(b => b.props.disabled));
  work.reject(new Error('Server unavailable'));
  await submitting;
  const tree = render();
  assert.ok(buttons(tree).every(b => !b.props.loading));
  assert.equal(nodes(tree, n => n.props?.role === 'alert')[0].props.children, 'Server unavailable');
});

test('Lumine follow-up choices await their callbacks and block opposite intents until retry or completion', async () => {
  const app = driver(), usePendingAction = pendingHook(app), requests = [];
  const Prompt = compile('src/containers/Build/Editor/ChatPanel/FollowUpPromptBubble.tsx', {
    react: app.hooks,
    '@emotion/css': { css },
    '~/components/Icon': () => null,
    '~/constants/css': { Color: new Proxy({}, { get: () => () => '#123' }) },
    '~/helpers/hooks/usePendingAction': usePendingAction
  }).default;
  const request = choice => { const work = deferred(); requests.push({ choice, ...work }); return work.promise; };
  const render = () => app.render(() => Prompt({ question: 'Switch model?', onceLabel: 'Just this once',
    onYes: () => request('yes'), onOnce: () => request('once'), onNo: () => request('no'), onRedirect: () => request('redirect')
  }));
  const buttons = tree => nodes(tree, node => node.type === 'button');
  let controls = buttons(render());
  const first = controls[0].props.onClick();
  const failed = assert.rejects(first, /offline/);
  await controls[1].props.onClick();
  await controls[2].props.onClick();
  assert.deepEqual(requests.map(r => r.choice), ['yes']);
  controls = buttons(render());
  assert.ok(controls.every(b => b.props.disabled));
  assert.deepEqual(controls.slice(0, 2).map(b => b.props['aria-busy']), [true, false]);
  requests[0].reject(new Error('offline'));
  await failed;
  controls = buttons(render());
  assert.ok(controls.slice(0, 2).every(b => !b.props.disabled));
  const retry = controls[1].props.onClick();
  assert.deepEqual(requests.map(r => r.choice), ['yes', 'once']);
  assert.deepEqual(buttons(render()).slice(0, 2).map(b => b.props['aria-busy']), [false, true]);
  requests[1].resolve();
  await retry;
  assert.ok(buttons(render()).slice(0, 2).every(b => !b.props.disabled));
});

test('Lumine plan cancellation waits for its request and prevents simultaneous continue or redirect', async () => {
  const app = driver(), usePendingAction = pendingHook(app), work = deferred(), calls = [];
  const Prompt = compile('src/containers/Build/Editor/ChatPanel/FollowUpPromptBubble.tsx', {
    react: app.hooks,
    '@emotion/css': { css },
    '~/components/Icon': () => null,
    '~/constants/css': { Color: new Proxy({}, { get: () => () => '#123' }) },
    '~/helpers/hooks/usePendingAction': usePendingAction
  }).default;
  const render = () => app.render(() => Prompt({ question: 'Continue plan?',
    onYes: () => calls.push('yes'),
    onNo: () => { calls.push('no'); return work.promise; },
    onRedirect: () => calls.push('redirect')
  }));
  const buttons = tree => nodes(tree, node => node.type === 'button');
  let controls = buttons(render());
  const cancellation = controls[1].props.onClick();
  await controls[0].props.onClick();
  await controls[2].props.onClick();
  assert.deepEqual(calls, ['no']);
  controls = buttons(render());
  assert.ok(controls.every(b => b.props.disabled));
  assert.deepEqual(controls.map(b => b.props['aria-busy']), [false, true, false]);
  work.resolve();
  await cancellation;
  assert.ok(buttons(render()).every(b => !b.props.disabled));
  await buttons(render())[2].props.onClick();
  assert.deepEqual(calls, ['no', 'redirect']);
});
