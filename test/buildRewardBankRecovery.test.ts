import test from 'node:test';
import assert from 'node:assert/strict';
import { runRewardBankGeneration } from '../src/helpers/buildRewardBankRecovery';

test('lost reply recovers the original challenge without a second paid call', async () => {
  let paidCalls = 0,
    reads = 0,
    time = 64_524;
  const result = await runRewardBankGeneration({
    generate: async () => {
      paidCalls++;
      throw new Error('network');
    },
    readResult: async () =>
      ++reads < 3
        ? { generationPending: true }
        : {
            generationPending: false,
            challengeId: 'original',
            recovered: true
          },
    transient: () => true,
    now: () => time,
    sleep: async (ms) => {
      time += ms;
    }
  });
  assert.equal(paidCalls, 1);
  assert.equal(reads, 3);
  assert.equal(result.challengeId, 'original');
});

test('normal response avoids recovery; denied generation never polls', async () => {
  let reads = 0;
  const options = {
    readResult: async () => {
      reads++;
      return {};
    },
    transient: () => false
  };
  assert.deepEqual(
    await runRewardBankGeneration({
      ...options,
      generate: async () => ({ challengeId: 'ok' })
    }),
    { challengeId: 'ok' }
  );
  await assert.rejects(
    runRewardBankGeneration({
      ...options,
      generate: async () => {
        throw new Error('denied');
      }
    }),
    /denied/
  );
  assert.equal(reads, 0);
});

test('missing or failed job ends recovery without regenerating; unavailable network is bounded', async () => {
  let time = 0,
    calls = 0;
  const generate = async () => {
    calls++;
    throw new Error('network');
  };
  await assert.rejects(
    runRewardBankGeneration({
      generate,
      readResult: async () => {
        throw new Error('not found');
      },
      transient: (e) => (e as Error).message === 'network'
    }),
    /not found/
  );
  await assert.rejects(
    runRewardBankGeneration({
      generate,
      readResult: async () => {
        throw new Error('network');
      },
      transient: () => true,
      now: () => time,
      sleep: async (ms) => {
        time += ms;
      },
      timeoutMs: 5000
    }),
    /network/
  );
  assert.equal(calls, 2);
  assert.equal(time, 5000);
});
