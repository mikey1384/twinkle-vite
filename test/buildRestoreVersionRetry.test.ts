import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getRestoreErrorMessage,
  RESTORE_FAILED_TEXT,
  RESTORE_STILL_STOPPING_FAILED_TEXT,
  restoreWithStoppingRetry
} from '../src/containers/Build/PreviewPanel/helpers/restoreVersion';

const stopping = { status: 409, code: 'build_lumine_run_stopping' };

test('retries the still-stopping answer, then succeeds', async () => {
  let calls = 0;
  const waits: number[] = [];
  const result = await restoreWithStoppingRetry({
    restore: async () => {
      calls++;
      if (calls < 3) throw stopping;
      return { success: true };
    },
    wait: async (ms) => {
      waits.push(ms);
    },
    delayMs: 10
  });
  assert.deepEqual(result, { success: true });
  assert.equal(calls, 3);
  assert.deepEqual(waits, [10, 10]);
});

test('gives up after the bounded attempts', async () => {
  let calls = 0;
  await assert.rejects(
    restoreWithStoppingRetry({
      restore: async () => {
        calls++;
        throw stopping;
      },
      wait: async () => {},
      maxAttempts: 3
    }),
    (error: any) => error === stopping
  );
  assert.equal(calls, 3);
});

test('does not retry other errors', async () => {
  let calls = 0;
  const other = { status: 409, code: 'build_lumine_run_active', message: 'x' };
  await assert.rejects(
    restoreWithStoppingRetry({
      restore: async () => {
        calls++;
        throw other;
      },
      wait: async () => {}
    })
  );
  assert.equal(calls, 1);
});

test('error messages are plain', () => {
  assert.equal(
    getRestoreErrorMessage(stopping),
    RESTORE_STILL_STOPPING_FAILED_TEXT
  );
  assert.equal(
    getRestoreErrorMessage({ status: 403, message: 'Not authorized' }),
    'Not authorized'
  );
  assert.equal(getRestoreErrorMessage({}), RESTORE_FAILED_TEXT);
});
