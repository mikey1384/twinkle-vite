import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AxiosError, AxiosHeaders } from 'axios';
import { toBuildRewardRequestError } from '../src/helpers/buildRewardRequestError';

function serverError(status: number, data: unknown) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError(
    `Request failed with status code ${status}`,
    'ERR_BAD_REQUEST',
    config,
    null,
    { status, statusText: '', headers: {}, config, data }
  );
}

test('a reward refusal keeps the server message, code and status', () => {
  const error = toBuildRewardRequestError(
    serverError(409, {
      error: 'You have earned all you can from this app today. Come back tomorrow.',
      code: 'build_reward_budget_reached'
    })
  );
  assert.equal(
    error.message,
    'You have earned all you can from this app today. Come back tomorrow.'
  );
  assert.equal(error.code, 'build_reward_budget_reached');
  assert.equal(error.status, 409);
});

test('a server error without a code keeps its status and no code', () => {
  const error = toBuildRewardRequestError(
    serverError(500, { error: 'Could not complete the reward request.' })
  );
  assert.equal(error.message, 'Could not complete the reward request.');
  assert.equal(error.code, undefined);
  assert.equal(error.status, 500);
});

test('a network failure keeps the axios message; other errors get the generic one', () => {
  const network = toBuildRewardRequestError(
    new AxiosError('Network Error', 'ERR_NETWORK')
  );
  assert.equal(network.message, 'Network Error');
  assert.equal(network.code, undefined);
  assert.equal(network.status, undefined);
  const other = toBuildRewardRequestError(new TypeError('boom'));
  assert.equal(other.message, 'Could not complete reward request.');
  assert.equal(other.code, undefined);
});

test('requestBuildRewards throws the coded error, and the host bridge forwards code and status to the app', () => {
  const helpers = readFileSync(
    new URL('../src/contexts/requestHelpers/build.ts', import.meta.url),
    'utf8'
  );
  const start = helpers.indexOf('async requestBuildRewards(');
  const end = helpers.indexOf('async requestBuildCardCraft(', start);
  assert.ok(start > 0 && end > start);
  assert.match(
    helpers.slice(start, end),
    /throw toBuildRewardRequestError\(error\)/
  );
  const bridge = readFileSync(
    new URL(
      '../src/containers/Build/PreviewPanel/hooks/useHostBridge.ts',
      import.meta.url
    ),
    'utf8'
  );
  // The reply to the app iframe: errorCode from error.code, and errorDetails
  // carrying status, which the in-app SDK copies onto error.code/error.status.
  assert.match(bridge, /errorCode: getPreviewBridgeErrorCode\(error\)/);
  assert.match(
    bridge,
    /typeof error\.status === 'number'\s*\?\s*\{ status: error\.status \}/
  );
});
