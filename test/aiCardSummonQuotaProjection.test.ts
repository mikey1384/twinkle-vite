import assert from 'node:assert/strict';
import test from 'node:test';
import {
  acceptAICardSummonQuotaMutationProjection,
  acceptAICardSummonQuotaReadProjection,
  captureAICardSummonQuotaProjectionRequest,
  invalidateAICardSummonQuotaProjection
} from '../src/helpers/aiCardSummonQuotaProjection';

test('quota projections reject older reads and every request invalidated by canonical mutation state', () => {
  const olderRead = captureAICardSummonQuotaProjectionRequest();
  const newerRead = captureAICardSummonQuotaProjectionRequest();
  assert.equal(acceptAICardSummonQuotaReadProjection(newerRead), true);
  assert.equal(acceptAICardSummonQuotaReadProjection(olderRead), false);

  const readBeforeSocket = captureAICardSummonQuotaProjectionRequest();
  invalidateAICardSummonQuotaProjection();
  assert.equal(acceptAICardSummonQuotaReadProjection(readBeforeSocket), false);

  const mutation = captureAICardSummonQuotaProjectionRequest();
  const readBeforeMutationCompletes =
    captureAICardSummonQuotaProjectionRequest();
  assert.equal(acceptAICardSummonQuotaMutationProjection(mutation), true);
  assert.equal(
    acceptAICardSummonQuotaReadProjection(readBeforeMutationCompletes),
    false
  );
});

test('an account transition invalidates in-flight quota reads from the prior user', () => {
  const priorAccountRead = captureAICardSummonQuotaProjectionRequest();
  invalidateAICardSummonQuotaProjection();
  assert.equal(acceptAICardSummonQuotaReadProjection(priorAccountRead), false);
  assert.equal(
    acceptAICardSummonQuotaReadProjection(
      captureAICardSummonQuotaProjectionRequest()
    ),
    true
  );
});
