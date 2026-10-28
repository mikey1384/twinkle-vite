import test from 'node:test';
import assert from 'node:assert/strict';
import {
  queueRewardDiagnostic,
  rewardClientDiagnostic,
  observeRewardBankLifecycle,
  type RewardClientDiagnostic
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
test('bank lifecycle keeps bounded in-flight exit/offline evidence and removes listeners', () => {
  const documentTarget = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  const windowTarget = new EventTarget();
  const reports: RewardClientDiagnostic[] = []; let time = 1000, connected = true;
  const stop = observeRewardBankLifecycle({ requestId: id,
    payload: { requestId: 'bank-request-0123456789', answer: 'SECRET', completionToken: 'SECRET' },
    beganAt: time, now: () => time, online: () => connected, report: e => reports.push(e),
    documentTarget: documentTarget as any, windowTarget: windowTarget as any });
  assert.equal(reports[0].lifecycle, 'started');
  time += 159000; documentTarget.visibilityState = 'hidden';
  documentTarget.dispatchEvent(new Event('visibilitychange'));
  connected = false; windowTarget.dispatchEvent(new Event('offline'));
  for (let i=0;i<20;i++) documentTarget.dispatchEvent(new Event('visibilitychange'));
  windowTarget.dispatchEvent(Object.assign(new Event('pagehide'), { persisted: true }));
  assert.equal(reports.length, 8);
  assert.equal(reports.at(-1)?.lifecycle, 'pagehide');
  assert.equal(reports.at(-1)?.pagePersisted, true);
  assert.equal(reports.at(-1)?.durationMs, 159000);
  assert.equal(reports.at(-1)?.online, false);
  assert.ok(reports.every(e => e.bankRequestId === 'bank-request-0123456789' && e.httpStatus === null));
  assert.ok(!JSON.stringify(reports).includes('SECRET'));
  stop(); windowTarget.dispatchEvent(new Event('online'));
  assert.equal(reports.length, 8);
});
test('outbox drains lifecycle and terminal events with the same request without losing either', async () => {
  const storage = memory(); const sent: RewardClientDiagnostic[] = [];
  let release!: () => void;
  const waiting = new Promise<void>(r => { release = r; });
  const start: RewardClientDiagnostic = { ...sample(), operation: 'bank-generate', outcome: 'lifecycle', lifecycle: 'started', httpStatus: null };
  const common = { userId: 5, buildId: 2799, storage,
    send: async (event: RewardClientDiagnostic) => { sent.push(event); if (sent.length === 1) await waiting; } };
  const first = queueRewardDiagnostic({ ...common, event: start });
  await queueRewardDiagnostic({ ...common, event: { ...start, lifecycle: 'pagehide', pagePersisted: false } });
  await queueRewardDiagnostic({ ...common, event: { ...start, outcome: 'response', lifecycle: null, httpStatus: 200 } });
  release(); await first;
  assert.deepEqual(sent.map(e => e.lifecycle || e.outcome), ['started','pagehide','response']);
  assert.equal(storage.getItem(key), '[]');
});
test('outbox rejects invented lifecycle strings and never rehydrates arbitrary text', async () => {
  const storage = memory();
  storage.setItem(key, JSON.stringify([{ ...sample(), operation:'bank-generate', outcome:'lifecycle', lifecycle:'private answer SECRET', extra:'SECRET' }]));
  const sent: RewardClientDiagnostic[] = [];
  await queueRewardDiagnostic({ userId:5, buildId:2799, storage, event:sample(), send:async e => { sent.push(e); } });
  assert.equal(sent.length, 1); assert.ok(!JSON.stringify(sent).includes('SECRET'));
});
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
test('recovery joins a separate HTTP request to its bank job and preserves only fixed transport metadata', async () => {
  const storage = memory();
  const event = rewardClientDiagnostic({ requestId: id, operation: 'bank-generate',
    payload: { requestId: 'bank-request-0123456789', answer: 'SECRET' },
    error: { code: 'ECONNABORTED' }, durationMs: 64_500 });
  assert.equal(event.transport, 'timeout');
  assert.equal(event.transportCode, 'ECONNABORTED');
  assert.equal(event.bankRequestId, 'bank-request-0123456789');
  storage.setItem(key, JSON.stringify([{ ...event, visibility: 'hidden', online: false, unexpected: 'SECRET' }]));
  const sent: any[] = [];
  await queueRewardDiagnostic({ userId: 5, buildId: 2799,
    event: { ...event, requestId: '8361b22b-ddc7-4ca5-be5d-fe8f0253a7d5', operation: 'bank-result', outcome: 'response' },
    storage, send: async e => { sent.push(e); } });
  assert.equal(sent.length, 2);
  assert.equal(sent[0].visibility, 'hidden');
  assert.equal(sent[0].online, false);
  assert.equal(sent[0].transportCode, 'ECONNABORTED');
  assert.equal(sent[1].bankRequestId, event.bankRequestId);
  assert.ok(!JSON.stringify(sent).includes('SECRET'));
});
