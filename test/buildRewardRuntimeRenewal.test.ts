import assert from 'node:assert/strict';
import test from 'node:test';
import { createRewardRuntimeRenewal } from '../src/helpers/buildRewardRuntimeRenewal';

const expired = Object.assign(new Error('expired runtime'), { code: 'runtime-required' });
const options = () => ({
  sessionKey: 'viewer-session', isCurrentSession: () => true,
  userId: 15402, buildId: 884, artifactVersionId: 16297, runtimeGrant: 'original',
  isRuntimeRequired: (error: unknown) => error === expired,
  renew: async () => ({ runtimeGrant: 'renewed', artifactVersionId: 16297 })
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(r => { resolve = r; });
  return { promise, resolve };
}

test('one-hour auth expiry renews once without changing mounted artifact', async () => {
  const run = createRewardRuntimeRenewal();
  const sent: string[] = []; let renewals = 0;
  const send = async (grant: string) => { sent.push(grant); if (grant === 'original') throw expired; return { receiptId: 1 }; };
  const call = () => run({ ...options(), send, renew: async () => { renewals++; return { runtimeGrant: 'renewed', artifactVersionId: 16297 }; } });
  assert.deepEqual(await call(), { receiptId: 1 });
  assert.deepEqual(await call(), { receiptId: 1 });
  assert.deepEqual(sent, ['original', 'renewed', 'renewed']); assert.equal(renewals, 1);
});

test('simultaneous expiry shares renewal and each original authorization refusal retries once', async () => {
  const run = createRewardRuntimeRenewal(), gate = deferred<{ runtimeGrant: string; artifactVersionId: number }>();
  const began = deferred<void>(); let renewals = 0, decisions = 0;
  const args = { ...options(), send: async (grant: string) => { if (grant === 'original') throw expired; decisions++; return 'ok'; },
    renew: async () => { renewals++; began.resolve(); return gate.promise; } };
  const a = run(args), b = run(args); await began.promise;
  gate.resolve({ runtimeGrant: 'renewed', artifactVersionId: 16297 });
  assert.deepEqual(await Promise.all([a,b]), ['ok','ok']); assert.equal(renewals, 1); assert.equal(decisions, 2);
});

test('canonical revocation, different artifact and second refusal do not loop', async () => {
  for (const renew of [
    async () => { throw new Error('revoked'); },
    async () => ({ runtimeGrant: 'other-release', artifactVersionId: 16300 }),
    async () => ({ runtimeGrant: 'renewed', artifactVersionId: 16297 })
  ]) {
    const run = createRewardRuntimeRenewal(); let sends = 0;
    await assert.rejects(run({ ...options(), renew, send: async () => { sends++; throw expired; } }));
    assert.ok(sends <= 2);
  }
});

test('lost mutation response never renews/replays; only explicit pre-decision403 may retry', async () => {
  const run = createRewardRuntimeRenewal(); let sends = 0, renewals = 0;
  await assert.rejects(run({ ...options(), send: async () => { sends++; throw new Error('network response lost'); },
    renew: async () => { renewals++; return { runtimeGrant: 'renewed', artifactVersionId: 16297 }; } }));
  assert.equal(sends, 1); assert.equal(renewals, 0);
  const second = createRewardRuntimeRenewal(); let paid = 0;
  await assert.rejects(second({ ...options(), send: async grant => {
    if (grant === 'original') throw expired; paid++; throw new Error('paid generation response lost');
  } }));
  assert.equal(paid, 1);
});

test('logout/token change during renewal cancels the retry and drops previous cached grants', async () => {
  const run = createRewardRuntimeRenewal(), gate = deferred<{ runtimeGrant: string; artifactVersionId: number }>();
  const began = deferred<void>(); let current = true, sends = 0;
  const pending = run({ ...options(), isCurrentSession: () => current,
    send: async () => { sends++; throw expired; }, renew: async () => { began.resolve(); return gate.promise; } });
  await began.promise; current = false;
  gate.resolve({ runtimeGrant: 'renewed', artifactVersionId: 16297 });
  await assert.rejects(pending, /sign-in changed/); assert.equal(sends, 1);
  current = true;
  const seen: string[] = [];
  await run({ ...options(), sessionKey: 'new-viewer-session', userId: 5, send: async grant => { seen.push(grant); return 'ok'; } });
  assert.deepEqual(seen, ['original']);
});

test('bounded cache eviction cannot share renewed grants across builds or artifacts', async () => {
  const run = createRewardRuntimeRenewal(1); const seen: string[] = [];
  const first = { ...options(), send: async (grant: string) => { seen.push(grant); if (grant === 'original') throw expired; return 'ok'; } };
  await run(first);
  await run({ ...options(), buildId: 316, runtimeGrant: 'breadface', send: async grant => { assert.equal(grant,'breadface'); return 'ok'; } });
  await run(first);
  assert.deepEqual(seen, ['original','renewed','original','renewed']);
});

test('workspace/missing mounted artifact gets the original refusal without renewal', async () => {
  const run = createRewardRuntimeRenewal(); let renewals = 0;
  await assert.rejects(run({ ...options(), artifactVersionId: null,
    send: async () => { throw expired; }, renew: async () => { renewals++; return { runtimeGrant: 'new', artifactVersionId: 16297 }; } }));
  assert.equal(renewals, 0);
});
