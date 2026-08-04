import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getUploadRetryDelayMs,
  isUploadClientRefreshRequired,
  shouldRetryUploadRequest
} from '../src/helpers/uploadRetryPolicy';

test('upload version errors always require the mandatory refresh flow', () => {
  assert.equal(
    isUploadClientRefreshRequired({ response: { status: 426, data: {} } }),
    true
  );
  assert.equal(
    isUploadClientRefreshRequired({
      response: { status: 400, data: { code: 'client_refresh_required' } }
    }),
    true
  );
  assert.equal(
    isUploadClientRefreshRequired({ response: { status: 400, data: {} } }),
    false
  );
});

test('upload retry policy does not repeat permanent client failures', () => {
  assert.equal(
    shouldRetryUploadRequest({
      response: { status: 413, data: { retryable: false } }
    }),
    false
  );
  assert.equal(
    shouldRetryUploadRequest({ response: { status: 400, data: {} } }),
    false
  );
  assert.equal(
    shouldRetryUploadRequest({ response: { status: 426, data: {} } }),
    false
  );
});

test('upload retry policy retries transient failures and honors Retry-After', () => {
  assert.equal(
    shouldRetryUploadRequest({
      response: { status: 503, data: { retryable: true } }
    }),
    true
  );
  assert.equal(shouldRetryUploadRequest({ code: 'ECONNRESET' }), true);
  assert.equal(
    getUploadRetryDelayMs(
      { response: { data: { retryAfterSeconds: 3 } } },
      2000
    ),
    3000
  );
  assert.equal(
    getUploadRetryDelayMs(
      { response: { headers: { 'retry-after': '120' } } },
      2000
    ),
    60_000
  );
});
