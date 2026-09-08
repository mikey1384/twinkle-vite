import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isMutatingPreviewRequestType } from '../src/containers/Build/PreviewPanel/helpers/previewRequestPolicy';
import { rewardHelpMessage } from '../src/components/Build/Rewards/approvalPresentation';

test('reward help carries the actual admin feedback into the creator’s Lumine request', () => {
  const note = 'Lower the daily Coin budget to 10 and keep the current rule IDs.';
  assert.ok(rewardHelpMessage(note).endsWith(`Admin feedback on the rewards proposal:\n${note}`));
  assert.ok(!rewardHelpMessage('').includes('Admin feedback on the rewards proposal:'));
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
  changeUser = false
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
            return { awarded: true, balances: { xp: 120, coins: 15 } };
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
      payload: { ruleId: undefined, challengeId: 'challenge', answers: [720] },
      token: 'scoped-token',
      runtimeGrant: 'server-published-grant'
    }
  ]);
  assert.deepEqual(h.balances, [
    { userId: 2, newState: { twinkleXP: 120, twinkleCoins: 15 } }
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
});
