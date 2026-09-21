const { assert, test, React, compile, driver, deferred } = require('./helpers/chatDialogHarness.cjs');

const attachment = compile('src/helpers/attachmentHelpers.ts', {
  '~/constants/defaultValues': { cloudFrontURL: 'https://files.example.test' }
});
const feedbackHelpers = compile('src/helpers/buildCommentFeedback.ts', {
  './attachmentHelpers': attachment
});
const { canUseBuildCommentInLumine, getBuildFeedbackComment,
  getBuildCommentFeedbackHandoff, addBuildCommentFeedback,
  formatBuildCommentFeedbackMessage } = feedbackHelpers;
const appReferences = compile('src/containers/Build/Editor/helpers/appReferences.ts', {});
const { createBuildChatDraftStore } = compile('src/containers/Build/Editor/helpers/chatDrafts.ts', {});
const build = { id: 30, userId: 1, title: 'Math Lab' };
const comment = { id: 80, content: 'The timer covers the answer on my phone.', uploader: { username: 'Alex' } };
const feedback = { buildId: 30, buildTitle: 'Math Lab', comment: getBuildFeedbackComment(comment) };

test('only the owner or an accepted contributor gets the app feedback action', () => {
  assert.equal(canUseBuildCommentInLumine(build, 1), true);
  assert.equal(canUseBuildCommentInLumine(build, 2), false);
  assert.equal(canUseBuildCommentInLumine({ ...build, hasActiveContributionInvite: true }, 2), true);
  assert.equal(canUseBuildCommentInLumine({ ...build, hasActiveContributionInvite: true }, 0), false);
  assert.equal(canUseBuildCommentInLumine({ ...build, contributionRootBuildId: 10 }, 1), false);
});

test('the same build comment has no action on Home, other roots, or after deletion', () => {
  let context = null;
  const { useLumineCommentMenuItem } = compile('src/components/Comments/LumineCommentContext.tsx', {
    react: { ...React, useContext: () => context },
    '~/components/Icon': () => null,
    '~/helpers/buildCommentFeedback': feedbackHelpers
  });
  const options = { comment, rootContent: { contentType: 'build', contentId: 30 } };
  assert.equal(useLumineCommentMenuItem(options), null);
  let selected;
  context = { buildId: 30, opening: false, onUseComment: (...args) => { selected = args; } };
  const parent = { ...comment, id: 79 };
  useLumineCommentMenuItem({ ...options, parentComment: parent }).onClick();
  assert.deepEqual(selected, [comment, parent]);
  assert.equal(useLumineCommentMenuItem({ ...options, rootContent: { contentType: 'subject', contentId: 30 } }), null);
  assert.equal(useLumineCommentMenuItem({ ...options, rootContent: { contentType: 'build', contentId: 31 } }), null);
  for (const flag of ['isDeleted', 'isNotification', 'isDeleteNotification']) {
    assert.equal(useLumineCommentMenuItem({ ...options, comment: { ...comment, [flag]: true } }), null);
  }
});

test('handoffs are bound to the account and app, including the contributor branch', () => {
  const value = { userId: 2, feedback };
  assert.deepEqual(getBuildCommentFeedbackHandoff({ value, userId: 2, buildId: 35, rootBuildId: 30 }), feedback);
  assert.equal(getBuildCommentFeedbackHandoff({ value, userId: 1, buildId: 30 }), null);
  assert.equal(getBuildCommentFeedbackHandoff({ value, userId: 2, buildId: 31 }), null);
  assert.equal(getBuildCommentFeedbackHandoff({ value: { userId: 2, feedback: { ...feedback, comment: { id: -1 } } }, userId: 2, buildId: 30 }), null);
  const current = [feedback];
  assert.equal(addBuildCommentFeedback(current, feedback), current);
});

test('the message keeps exact feedback, reply context, links and an attachment without requiring typed instructions', () => {
  const withReply = {
    ...feedback,
    parentComment: { id: 79, username: 'Mira', content: 'Which screen is affected?' },
    comment: { ...feedback.comment, content: 'The quiz.\n> On mobile.\n\nThanks!', filePath: 'image-123', fileName: 'timer (phone).png' }
  };
  const message = formatBuildCommentFeedbackMessage('', [withReply]);
  assert.match(message, /^Please help me address this app feedback\./);
  assert.ok(message.includes('[Math Lab](/app/30)'));
  assert.ok(message.includes('[Mira](/comments/79)'));
  assert.ok(message.includes('[Alex](/comments/80)'));
  assert.ok(message.includes('> The quiz.\n> > On mobile.\n> \n> Thanks!'));
  assert.ok(message.includes('https://files.example.test/attachments/feed/image-123/timer%20%28phone%29.png'));
  assert.equal(formatBuildCommentFeedbackMessage('ordinary message', []), 'ordinary message');
  assert.ok(getBuildFeedbackComment({ id: 80, fileName: 'screen.png', filePath: 'test' }));
  assert.equal(getBuildFeedbackComment({ id: 80, content: '  ' }), null);
});

test('leaving and reopening a workspace keeps its draft and references separate from other accounts and apps', () => {
  const store = createBuildChatDraftStore();
  const first = store.forWorkspace(1, 30);
  first.setField('message', 'Keep our colors.');
  first.setField('apps', [{ id: 20, title: 'My other app' }]);
  first.setField('feedback', (current) => addBuildCommentFeedback(current, feedback));
  assert.deepEqual(store.forWorkspace(1, 30).getSnapshot(), {
    message: 'Keep our colors.', apps: [{ id: 20, title: 'My other app' }], feedback: [feedback]
  });
  assert.equal(store.forWorkspace(2, 30).getSnapshot().message, '');
  assert.equal(store.forWorkspace(1, 31).getSnapshot().feedback.length, 0);
  let changes = 0;
  const unsubscribe = first.subscribe(() => changes++);
  first.setField('feedback', []);
  unsubscribe();
  assert.equal(changes, 1);
  assert.equal(first.getSnapshot().message, 'Keep our colors.');
});

function providerHarness({ userId = 1, ensure = async () => ({}) } = {}) {
  const d = driver();
  const navigations = [], errors = [];
  const Provider = compile('src/containers/Build/Runtime/CommentLumineProvider.tsx', {
    react: d.hooks,
    'react-router-dom': { useNavigate: () => (...args) => navigations.push(args) },
    '~/components/Comments/LumineCommentContext': { LumineCommentContext: React.createContext(null) },
    '~/contexts': { useAppContext: (select) => select({ requestHelpers: { ensureDefaultBuildContributionBranch: ensure } }) },
    '~/contexts/Toast': { useToast: () => ({ message }) => errors.push(message) },
    '~/helpers/buildNavigationHelpers': compile('src/helpers/buildNavigationHelpers.ts', {}),
    '~/helpers/buildCommentFeedback': feedbackHelpers
  }).default;
  const props = { build: { ...build, hasActiveContributionInvite: true }, userId, active: true, children: null };
  return { props, navigations, errors, d, render: () => d.render(() => Provider(props)).props.value };
}

test('owner opens Main with a draft attachment and never starts generation', async () => {
  const h = providerHarness({ ensure: () => { throw new Error('Owner must not create a branch'); } });
  const context = h.render();
  assert.equal(h.navigations.length, 0);
  await context.onUseComment(comment);
  assert.deepEqual(h.navigations, [['/build/30', { state: { commentFeedback: { userId: 1, feedback } } }]]);
  h.d.dispose();
});

test('contributor waits for the canonical private branch and duplicate clicks open only once', async () => {
  const pending = deferred();
  let requests = 0;
  const h = providerHarness({ userId: 2, ensure: () => { requests++; return pending.promise; } });
  const context = h.render();
  const opened = context.onUseComment(comment);
  await context.onUseComment(comment);
  assert.equal(requests, 1);
  assert.equal(h.navigations.length, 0);
  pending.resolve({ build: { id: 35, userId: 2, contributionRootBuildId: 30, contributionBranchNumber: 4 } });
  await opened;
  assert.equal(h.navigations[0][0], '/build/30/4');
  assert.equal(h.navigations[0][1].state.commentFeedback.feedback.comment.id, 80);
  h.d.dispose();
});

test('revoked membership, foreign branch responses and leaving the app never send feedback to Main', async () => {
  for (const ensure of [
    async () => { throw new Error('This Build is invite-only for contributors'); },
    async () => ({ build: { id: 36, userId: 9, contributionRootBuildId: 30 } })
  ]) {
    const h = providerHarness({ userId: 2, ensure });
    await h.render().onUseComment(comment);
    assert.equal(h.navigations.length, 0);
    assert.equal(h.errors.length, 1);
    h.d.dispose();
  }
  const pending = deferred();
  const h = providerHarness({ userId: 2, ensure: () => pending.promise });
  const opened = h.render().onUseComment(comment);
  h.props.active = false;
  h.render();
  pending.resolve({ build: { id: 35, userId: 2, contributionRootBuildId: 30, contributionBranchNumber: 4 } });
  await opened;
  assert.equal(h.navigations.length, 0);
  h.d.dispose();
});

function submitHarness(send, prepare = async () => ({ apps: [] })) {
  const d = driver();
  const draft = { message: '', apps: [], feedback: [feedback] };
  const hook = compile('src/containers/Build/Editor/ChatPanel/hooks/useAppReferences.ts', {
    react: d.hooks,
    '~/contexts': { useAppContext: (select) => select({ requestHelpers: { prepareBuildChatAppReferences: prepare } }) },
    '~/helpers/buildCommentFeedback': feedbackHelpers,
    '../../helpers/appReferences': appReferences
  }).default;
  const input = {
    buildId: 30, disabled: false, draftMessage: '', apps: [], feedback: [],
    onDraftMessageChange: (value) => { draft.message = value; },
    setApps: (value) => { draft.apps = typeof value === 'function' ? value(draft.apps) : value; },
    setFeedback: (value) => { draft.feedback = typeof value === 'function' ? value(draft.feedback) : value; },
    onSendMessage: send
  };
  return { d, draft, input, render: () => d.render(() => hook({ ...input, draftMessage: draft.message, apps: draft.apps, feedback: draft.feedback })) };
}

test('feedback alone is sent only on Send and cleared only after acceptance', async () => {
  const pending = deferred();
  const sent = [];
  const h = submitHarness((text) => { sent.push(text); return pending.promise; });
  const composer = h.render();
  assert.equal(sent.length, 0);
  const sending = composer.submitMessage();
  await composer.submitMessage();
  assert.equal(sent.length, 1);
  assert.match(sent[0], /The timer covers the answer/);
  assert.equal(h.draft.feedback.length, 1);
  pending.resolve(true);
  await sending;
  assert.equal(h.draft.feedback.length, 0);
  h.d.dispose();
});

test('failed and blocked sends preserve feedback and typed instructions', async () => {
  for (const send of [async () => false, async () => { throw new Error('Offline'); }]) {
    const h = submitHarness(send);
    h.draft.message = 'Fix just the timer.';
    await h.render().submitMessage();
    assert.equal(h.draft.feedback.length, 1);
    assert.equal(h.draft.message, 'Fix just the timer.');
    assert.ok(h.render().error);
    h.render().removeFeedback(80);
    assert.equal(h.draft.feedback.length, 0);
    assert.equal(h.draft.message, 'Fix just the timer.');
    assert.equal(h.render().error, '');
    h.d.dispose();
  }
});

test('a send in flight cannot erase a newer draft or newly attached feedback', async () => {
  const pending = deferred();
  const h = submitHarness(() => pending.promise);
  h.draft.message = 'Fix just the timer.';
  const sending = h.render().submitMessage();
  const next = { ...feedback, comment: { ...feedback.comment, id: 81 } };
  h.draft.message = 'Another idea';
  h.draft.feedback = [feedback, next];
  h.render();
  pending.resolve(true);
  await sending;
  assert.equal(h.draft.message, 'Another idea');
  assert.deepEqual(h.draft.feedback, [next]);
  h.d.dispose();
});

test('app references and feedback share a single message; switching workspaces during preparation cancels sending', async () => {
  const apps = [{ id: 20, title: 'Other app' }];
  const sent = [];
  const h = submitHarness(async (message) => { sent.push(message); return true; }, async () => ({ apps }));
  h.draft.apps = apps;
  h.draft.message = 'Use this layout.';
  await h.render().submitMessage();
  const parsed = appReferences.parseBuildAppReferenceMessage(sent[0]);
  assert.deepEqual(parsed.apps, apps);
  assert.match(parsed.text, /Use this layout\./);
  assert.match(parsed.text, /\/comments\/80/);
  h.d.dispose();
  const pending = deferred();
  const stale = submitHarness(() => { throw new Error('Must not send'); }, () => pending.promise);
  stale.draft.apps = apps;
  const sending = stale.render().submitMessage();
  stale.input.buildId = 31;
  stale.render();
  pending.resolve({ apps });
  await sending;
  assert.equal(stale.draft.feedback.length, 1);
  stale.d.dispose();
});
