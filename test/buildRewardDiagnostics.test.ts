import test from 'node:test';
import assert from 'node:assert/strict';
import {
  queueRewardDiagnostic,
  rewardClientDiagnostic
} from '../src/helpers/buildRewardDiagnostics';
const id = '8361b22b-ddc7-4ca5-be5d-fe8f0253a7d4';
const key = 'twinkle.rewardDiagnostics.v1.5.2799';
const sample = () =>
  rewardClientDiagnostic({
    requestId: id,
    operation: 'claim',
    payload: {
      challengeId: id,
      completionToken: 'SECRET',
      answers: ['SECRET']
    },
    error: { code: 'ERR_NETWORK' },
    durationMs: 50
  });
const memory = () => {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) || null,
    setItem: (k: string, v: string) => {
      data.set(k, v);
    }
  };
};
test('lost reply is metadata only and survives until a later successful send', async () => {
  const storage = memory();
  let sent: any[] = [];
  await queueRewardDiagnostic({
    userId: 5,
    buildId: 2799,
    event: sample(),
    storage,
    send: async () => {
      throw new Error('offline');
    }
  });
  assert.ok(!storage.getItem(key)?.includes('SECRET'));
  assert.equal(JSON.parse(storage.getItem(key)!).length, 1);
  await queueRewardDiagnostic({
    userId: 5,
    buildId: 2799,
    event: { ...sample(), requestId: '8361b22b-ddc7-4ca5-be5d-fe8f0253a7d5' },
    storage,
    send: async (e) => {
      sent.push(e);
    }
  });
  assert.equal(sent.length, 2);
  assert.equal(sent[0].outcome, 'transport_error');
  assert.equal(storage.getItem(key), '[]');
});
test('per-viewer outbox does not upload another signed-in viewer’s events', async () => {
  const storage = memory();
  let sent = 0;
  storage.setItem(key, JSON.stringify([sample()]));
  await queueRewardDiagnostic({
    userId: 6,
    buildId: 2799,
    event: sample(),
    storage,
    send: async () => {
      sent++;
    }
  });
  assert.equal(sent, 1);
  assert.equal(JSON.parse(storage.getItem(key)!).length, 1);
});
test('oversized queue reports loss and strips unexpected stored fields', async () => {
  const storage = memory();
  const rows = Array.from({ length: 105 }, (_, n) => ({
    ...sample(),
    requestId: `8361b22b-ddc7-4ca5-be5d-${String(n).padStart(12, '0')}`,
    answer: 'SECRET'
  }));
  storage.setItem(key, JSON.stringify(rows));
  await queueRewardDiagnostic({
    userId: 5,
    buildId: 2799,
    event: sample(),
    storage,
    send: async () => {
      throw new Error('offline');
    }
  });
  const saved = JSON.parse(storage.getItem(key)!);
  assert.equal(saved.length, 100);
  assert.equal(saved[99].outboxDropped, 6);
  assert.ok(!storage.getItem(key)?.includes('SECRET'));
});
test('storage denial falls back without breaking the reward caller', async () => {
  let sent = 0;
  await queueRewardDiagnostic({
    userId: 5,
    buildId: 2799,
    event: sample(),
    storage: {
      getItem: () => null,
      setItem: () => {
        throw new Error('denied');
      }
    },
    send: async () => {
      sent++;
    }
  });
  assert.equal(sent, 1);
});
test('HTTP refusals retain a fixed error code without a free-form error body', () => {
  const report = rewardClientDiagnostic({
    requestId: id, operation: 'claim', durationMs: 50,
    error: { response: { status: 429, data: { code: 'build_api_rate_limited' } } }
  });
  assert.equal(report.outcome, 'http_error');
  assert.equal(report.errorCode, 'build_api_rate_limited');
  assert.equal(rewardClientDiagnostic({
    requestId: id, operation: 'claim', durationMs: 50,
    error: { response: { status: 400, data: { code: 'private answer: 42' } } }
  }).errorCode, null);
});
