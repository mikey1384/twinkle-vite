import test from 'node:test';
import assert from 'node:assert/strict';
import { runRewardBankGeneration } from '../src/helpers/buildRewardBankRecovery';

// A stand-in for the server's job table: bank-generate admits one job per
// request ID (the paid work) and answers at once; the same ID again reads it.
function fakeBankServer({ doneAfterReads = 3, fail = null as null | Error } = {}) {
  const jobs = new Map<string, { reads: number }>();
  let paid = 0;
  return {
    get paid() {
      return paid;
    },
    submit(requestId: string) {
      if (!jobs.has(requestId)) {
        paid++;
        jobs.set(requestId, { reads: 0 });
      }
      return { requestId, generationPending: true };
    },
    progress(requestId: string) {
      const job = jobs.get(requestId);
      if (!job) return { phase: 'pending' };
      job.reads++;
      if (job.reads < doneAfterReads) return { phase: 'write-thinking' };
      return { phase: fail ? 'failed' : 'done' };
    },
    result(requestId: string) {
      if (fail) throw fail;
      return { generationPending: false, challengeId: `challenge-for-${requestId}` };
    }
  };
}
const clock = () => {
  let time = 0;
  return {
    now: () => time,
    sleep: async (ms: number) => {
      time += ms;
    },
    get time() {
      return time;
    }
  };
};
const httpError = (status: number, code?: string) =>
  Object.assign(new Error(code || `HTTP ${status}`), {
    response: { status, data: code ? { code } : {} }
  });
const isHttp = (e: unknown) => !!(e as any)?.response;
const transient = (e: unknown) =>
  (e as Error).message === 'network' || ((e as any)?.response?.status || 0) >= 500;
const canonicalFailure = (e: unknown) =>
  isHttp(e) && typeof (e as any).response.data?.code === 'string';

test('a lost submit reply is sent again with the same ID and pays once', async () => {
  const server = fakeBankServer();
  const time = clock();
  let submits = 0;
  const result = await runRewardBankGeneration({
    generate: async () => {
      submits++;
      const answer = server.submit('req-1');
      // The first reply is lost on the way back to the phone.
      if (submits === 1) throw new Error('network');
      return answer;
    },
    readProgress: async () => server.progress('req-1'),
    readResult: async () => server.result('req-1'),
    transient,
    canonicalFailure,
    now: time.now,
    sleep: time.sleep
  });
  assert.equal(server.paid, 1);
  assert.equal(submits, 2);
  assert.equal(result.challengeId, 'challenge-for-req-1');
});

test('waits past the old five-minute limit while the job runs', async () => {
  // Observed generations took up to 467 s; the old SDK gave up at 300 s.
  const server = fakeBankServer({ doneAfterReads: 240 });
  const time = clock();
  const result = await runRewardBankGeneration({
    generate: async () => server.submit('req-long'),
    readProgress: async () => server.progress('req-long'),
    readResult: async () => server.result('req-long'),
    transient,
    canonicalFailure,
    now: time.now,
    sleep: time.sleep
  });
  assert.equal(result.challengeId, 'challenge-for-req-long');
  assert.ok(time.time >= 467_000, `${time.time}`);
  assert.equal(server.paid, 1);
});

test('an immediate answer needs no wait; a refused submit never polls', async () => {
  let reads = 0;
  const options = {
    readProgress: async () => {
      reads++;
      return { phase: 'done' };
    },
    readResult: async () => {
      reads++;
      return {};
    },
    transient,
    canonicalFailure
  };
  assert.deepEqual(
    await runRewardBankGeneration({
      ...options,
      generate: async () => ({ needsQuestion: false })
    }),
    { needsQuestion: false }
  );
  await assert.rejects(
    runRewardBankGeneration({
      ...options,
      generate: async () => {
        throw httpError(429, 'ai_energy_depleted');
      }
    }),
    /ai_energy_depleted/
  );
  assert.equal(reads, 0);
});

test("a failed job's own error ends the wait at once, even a 503", async () => {
  const server = fakeBankServer({
    fail: httpError(503, 'build_reward_bank_unverified')
  });
  const time = clock();
  let resultReads = 0;
  await assert.rejects(
    runRewardBankGeneration({
      generate: async () => server.submit('req-2'),
      readProgress: async () => server.progress('req-2'),
      readResult: async () => {
        resultReads++;
        return server.result('req-2');
      },
      transient,
      canonicalFailure,
      now: time.now,
      sleep: time.sleep
    }),
    /build_reward_bank_unverified/
  );
  assert.equal(resultReads, 1);
  assert.equal(server.paid, 1);
});

test('lost progress and result reads are retried but bounded', async () => {
  const time = clock();
  await assert.rejects(
    runRewardBankGeneration({
      generate: async () => ({ generationPending: true }),
      readProgress: async () => {
        throw new Error('network');
      },
      readResult: async () => ({ generationPending: false }),
      transient,
      canonicalFailure,
      now: time.now,
      sleep: time.sleep,
      timeoutMs: 10_000
    }),
    /network/
  );
  assert.equal(time.time, 10_000);

  let resultReads = 0;
  await assert.rejects(
    runRewardBankGeneration({
      generate: async () => ({ generationPending: true }),
      readProgress: async () => ({ phase: 'done' }),
      readResult: async () => {
        resultReads++;
        throw httpError(502);
      },
      transient,
      canonicalFailure,
      now: clock().now,
      sleep: async () => {},
      resultReads: 3
    }),
    /HTTP 502/
  );
  assert.equal(resultReads, 3);
});
