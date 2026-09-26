import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isMutatingPreviewRequestType } from '../src/containers/Build/PreviewPanel/helpers/previewRequestPolicy';
import { rewardApprovalPresentation } from '../src/components/Build/Rewards/approvalPresentation';

// Creators never prepare anything: every state explains itself and points at
// one action (send, wait, publish, or fix and send again). No Lumine step.
test('creator-facing reward status never asks the creator or Lumine to prepare rules', () => {
  const base = {
    policy: null,
    approvalRequired: true,
    configured: true,
    canSubmit: true,
    isUpdate: false,
    liveActive: false,
    reviewId: null,
    reviewNote: '',
    sourceVersionId: 3,
    summary: [],
    approvalMatches: false,
    canPublish: false
  } as const;
  for (const state of [
    'needs_review',
    'in_review',
    'approved',
    'published',
    'changes_requested',
    'paused'
  ] as const) {
    const text = JSON.stringify(rewardApprovalPresentation({ ...base, state }));
    assert.ok(!/prepare|Lumine/i.test(text), `${state}: ${text}`);
  }
  const sending = rewardApprovalPresentation({
    ...base,
    state: 'needs_review'
  });
  assert.match(sending.detail, /checked by a Twinkle admin first/);
  // Unsaved edits on an approved version fall back to "needs approval".
  assert.equal(
    rewardApprovalPresentation({ ...base, state: 'approved' }, true).state,
    'needs_review'
  );
  // A removed SDK with unsaved edits is checked at publish time, not blocked.
  assert.equal(
    rewardApprovalPresentation(
      { ...base, approvalRequired: false, state: 'removed' },
      true
    ).state,
    'check_changes'
  );
  // An app that never had rewards is told how to add them, not that they
  // were removed, and is never offered a review to send.
  const never = rewardApprovalPresentation({
    ...base,
    approvalRequired: false,
    canSubmit: false,
    neverHadRewards: true,
    state: 'removed'
  });
  assert.equal(never.state, 'removed');
  assert.match(never.title, /doesn’t give XP or Coins/);
  assert.doesNotMatch(never.detail, /removed|no longer/);
});

const source = readFileSync(
  new URL(
    '../src/containers/Build/PreviewPanel/hooks/useHostBridge.ts',
    import.meta.url
  ),
  'utf8'
);
const start = source.indexOf("          case 'rewards:status':");
const end = source.indexOf(
  "          case 'notifications:get-subject-update-subscription':",
  start
);
assert.ok(start > 0 && end > start);
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const execute = new AsyncFunction(
  'type',
  'payload',
  'runtimeOnly',
  'appMcpSessionId',
  'activeBuild',
  'ensureBuildApiToken',
  'previewAuth',
  'requestRefs',
  'onSetUserStateRef',
  `let response; switch(type) { ${source.slice(start, end)} } return response;`
);
function harness({
  runtimeOnly = true,
  automated = false,
  grant = 'server-published-grant',
  changeUser = false,
  result = { awarded: true, balances: { xp: 120, coins: 15 } }
}: any = {}) {
  const calls: any[] = [],
    balances: any[] = [];
  const auth = { userIdRef: { current: 2 } };
  const invoke = (type: string, payload: any = {}) =>
    execute(
      type,
      payload,
      runtimeOnly,
      automated ? 'app-mcp' : null,
      { id: 2460, rewardRuntimeGrant: grant },
      async () => 'scoped-token',
      auth,
      {
        requestBuildRewardsRef: {
          current: async (request: any) => {
            calls.push(request);
            if (changeUser) auth.userIdRef.current = 3;
            return result;
          }
        }
      },
      { current: (value: any) => balances.push(value) }
    );
  return { invoke, calls, balances };
}
test('editor, workspace and automated preview requests cannot reach the award API', async () => {
  for (const options of [
    { runtimeOnly: false },
    { grant: null },
    { automated: true }
  ]) {
    const h = harness(options);
    assert.equal((await h.invoke('rewards:status')).mode, 'preview');
    assert.deepEqual(
      await h.invoke('rewards:receipt', { challengeId: 'old' }),
      {
        mode: 'preview',
        status: 'not_found',
        receipt: null,
        message: 'Real rewards require the approved published app.'
      }
    );
    await assert.rejects(h.invoke('rewards:start', { ruleId: 'angles' }));
    await assert.rejects(
      h.invoke('rewards:claim', { challengeId: 'fake', answers: [720] })
    );
    assert.equal(h.calls.length, 0);
    assert.equal(h.balances.length, 0);
  }
});
test('published bridge uses only the host grant, strips award controls and applies confirmed balances', async () => {
  const h = harness();
  await h.invoke('rewards:claim', {
    challengeId: 'challenge',
    answers: [720],
    runtimeGrant: 'forged',
    buildId: 7,
    userId: 99,
    xp: 9999,
    coins: 999
  });
  assert.deepEqual(h.calls, [
    {
      buildId: 2460,
      operation: 'claim',
      payload: {
        ruleId: undefined,
        challengeId: 'challenge',
        answers: [720],
        metric: undefined,
        period: undefined,
        limit: undefined
      },
      token: 'scoped-token',
      runtimeGrant: 'server-published-grant'
    }
  ]);
  assert.deepEqual(h.balances, [
    { userId: 2, newState: { twinkleXP: 120, twinkleCoins: 15 } }
  ]);
});

test('completion progress and claims forward evidence without trusting client identities or wins', async () => {
  const h = harness({
    result: { completion: { token: 'confirmed', completed: false } }
  });
  const frames = [[0.05, 0, 0, 0, -1, 0, 0, 1]];
  await h.invoke('rewards:progress', {
    challengeId: 'challenge',
    completionToken: 'signed',
    frames,
    userId: 99,
    runtimeGrant: 'forged',
    won: true,
    position: { y: 230 }
  });
  assert.equal(h.calls[0].runtimeGrant, 'server-published-grant');
  assert.deepEqual(h.calls[0].payload.frames, frames);
  assert.equal(h.calls[0].payload.completionToken, 'signed');
  assert.equal('userId' in h.calls[0].payload, false);
  assert.equal('won' in h.calls[0].payload, false);
  assert.equal('position' in h.calls[0].payload, false);
  assert.equal(h.balances.length, 0);
  await h.invoke('rewards:claim', {
    challengeId: 'challenge',
    completionToken: 'finished'
  });
  assert.equal(h.calls[1].payload.completionToken, 'finished');
  assert.equal(isMutatingPreviewRequestType('rewards:progress'), true);
  await assert.rejects(
    harness({ automated: true }).invoke('rewards:progress', { frames })
  );
});
test('receipt recovery forwards the exact challenge and only applies canonical balances', async () => {
  const result = {
    mode: 'live',
    status: 'awarded',
    receipt: { challengeId: 'old' },
    balances: { xp: 140, coins: 19 }
  };
  const h = harness({ result });
  assert.deepEqual(
    await h.invoke('rewards:receipt', {
      challengeId: 'old',
      buildId: 7,
      userId: 99,
      xp: 9000,
      runtimeGrant: 'forged'
    }),
    result
  );
  assert.equal(h.calls[0].operation, 'receipt');
  assert.equal(h.calls[0].buildId, 2460);
  assert.equal(h.calls[0].runtimeGrant, 'server-published-grant');
  assert.deepEqual(h.calls[0].payload, {
    ruleId: undefined,
    challengeId: 'old',
    answers: undefined,
    metric: undefined,
    period: undefined,
    limit: undefined
  });
  assert.deepEqual(h.balances, [
    { userId: 2, newState: { twinkleXP: 140, twinkleCoins: 19 } }
  ]);
});
test('a sign-in change during a claim cannot replace the next viewer’s displayed balance', async () => {
  const h = harness({ changeUser: true });
  await h.invoke('rewards:claim', { challengeId: 'challenge', answers: [720] });
  assert.equal(h.balances.length, 0);
});
test('earning requests use the preview transition write guard', () => {
  assert.equal(isMutatingPreviewRequestType('rewards:start'), true);
  assert.equal(isMutatingPreviewRequestType('rewards:claim'), true);
  assert.equal(isMutatingPreviewRequestType('rewards:status'), false);
  assert.equal(isMutatingPreviewRequestType('rewards:timeline'), false);
  assert.equal(isMutatingPreviewRequestType('rewards:archived-problem'), false);
});

test('archive reads use the current host grant and forward no client clock or permission', async () => {
  const result = { mode: 'live', entries: [], nextCursor: null };
  const h = harness({ result });
  assert.deepEqual(
    await h.invoke('rewards:timeline', {
      ruleId: 'e1-daily',
      cursor: '4',
      now: 9999999999,
      runtimeGrant: 'fake'
    }),
    result
  );
  await h.invoke('rewards:archived-problem', {
    receiptId: 2,
    userId: 999,
    dayKey: '2099-01-01'
  });
  assert.equal(h.calls[0].operation, 'timeline');
  assert.equal(h.calls[0].payload.cursor, '4');
  assert.equal(h.calls[0].payload.now, undefined);
  assert.equal(h.calls[0].runtimeGrant, 'server-published-grant');
  assert.equal(h.calls[1].operation, 'archived-problem');
  assert.equal(h.calls[1].payload.receiptId, 2);
  assert.equal(h.calls[1].payload.dayKey, undefined);
  assert.equal(h.balances.length, 0);
  for (const options of [
    { runtimeOnly: false },
    { grant: null },
    { automated: true }
  ]) {
    const preview = harness(options);
    assert.equal((await preview.invoke('rewards:timeline')).mode, 'preview');
    assert.equal(
      (await preview.invoke('rewards:archived-problem', { receiptId: 2 }))
        .entry,
      null
    );
    assert.equal(preview.calls.length, 0);
  }
});
