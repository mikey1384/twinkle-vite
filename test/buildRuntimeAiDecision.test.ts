import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  normalizeBuildRuntimeAiDecisionError,
  normalizeHttpRequestError,
  parseRetryAfterSeconds
} from '../src/helpers/errorMessageHelpers';
import {
  buildPreviewBridgeErrorDetails,
  isAiAccountBridgeRequestType
} from '../src/containers/Build/PreviewPanel/helpers/previewBridgeErrors';

test('parseRetryAfterSeconds reads positive body values and Retry-After headers', () => {
  assert.equal(parseRetryAfterSeconds(5), 5);
  assert.equal(parseRetryAfterSeconds('12'), 12);
  assert.equal(parseRetryAfterSeconds(0, { 'retry-after': '7' }), 7);
  assert.equal(parseRetryAfterSeconds(undefined, { 'Retry-After': '9' }), 9);
  assert.equal(
    parseRetryAfterSeconds(undefined, {
      get: (name: string) => (name === 'retry-after' ? '15' : undefined)
    }),
    15
  );
  assert.equal(parseRetryAfterSeconds(true, { 'retry-after': '4' }), 4);
  assert.equal(parseRetryAfterSeconds(undefined, { 'retry-after': '0' }), undefined);
  assert.equal(parseRetryAfterSeconds(undefined, {}), undefined);
});

test('normalizeBuildRuntimeAiDecisionError preserves 429 retryAfterSeconds, retryable, requestId, and reason', () => {
  const requestId = '12345678-1234-1234-1234-123456789abc';
  const normalized = normalizeBuildRuntimeAiDecisionError({
    isAxiosError: true,
    code: 'ERR_BAD_REQUEST',
    message: 'Request failed with status code 429',
    response: {
      status: 429,
      headers: { 'retry-after': '8' },
      data: {
        code: 'ai_decision_rate_limited',
        error: 'Too many decision requests',
        retryable: true,
        retryAfterSeconds: 5,
        requestId,
        reason: 'rate_limited'
      }
    }
  });

  assert.deepEqual(normalized, {
    status: 429,
    message: 'Too many decision requests',
    code: 'ai_decision_rate_limited',
    retryable: true,
    retryAfterSeconds: 5,
    requestId,
    reason: 'rate_limited'
  });

  const fromHeader = normalizeBuildRuntimeAiDecisionError({
    isAxiosError: true,
    code: 'ERR_BAD_REQUEST',
    message: 'Request failed with status code 429',
    response: {
      status: 429,
      headers: { 'Retry-After': '6' },
      data: {
        code: 'ai_decision_rate_limited',
        error: 'Slow down',
        retryable: true
      }
    }
  });

  assert.equal(fromHeader.retryAfterSeconds, 6);
  assert.equal(fromHeader.retryable, true);
});

test('fallback 429 without code and transport errors are normalized without Axios internals', () => {
  const edge429 = normalizeBuildRuntimeAiDecisionError({
    isAxiosError: true,
    code: 'ERR_BAD_REQUEST',
    message: 'Request failed with status code 429',
    response: {
      status: 429,
      headers: { 'Retry-After': '10' },
      data: { error: 'Too many requests' }
    }
  });

  assert.deepEqual(edge429, {
    status: 429,
    message: 'Too many requests',
    retryAfterSeconds: 10
  });
  assert.equal('code' in edge429, false);

  const transport = normalizeHttpRequestError({
    isAxiosError: true,
    code: 'ERR_NETWORK',
    message: 'Network Error'
  });

  assert.deepEqual(transport, {
    status: 500,
    message: 'Network Error',
    isTransportError: true
  });
  assert.equal('code' in transport, false);
});

test('buildPreviewBridgeErrorDetails forwards retryable, retryAfterSeconds, and reason for ai:decide and ai:decide-images', () => {
  const requestId = '12345678-1234-1234-1234-123456789abc';
  for (const type of ['ai:decide', 'ai:decide-images']) {
    const details = buildPreviewBridgeErrorDetails(type, {
      status: 429,
      code: 'ai_decision_rate_limited',
      retryable: true,
      retryAfterSeconds: 5,
      requestId,
      reason: 'rate_limited'
    });
    assert.deepEqual(details, {
      status: 429,
      code: 'ai_decision_rate_limited',
      retryable: true,
      retryAfterSeconds: 5,
      requestId,
      reason: 'rate_limited'
    });
  }

  const nonRetryable = buildPreviewBridgeErrorDetails('ai:decide', {
    status: 400,
    code: 'invalid_ai_decision',
    retryable: false,
    reason: 'bad reason with spaces',
    requestId: 'not-a-uuid'
  });
  assert.deepEqual(nonRetryable, {
    status: 400,
    code: 'invalid_ai_decision',
    retryable: false
  });
});

test('isAiAccountBridgeRequestType excludes plain ai:decide while keeping ai:decide-images and other AI calls', () => {
  assert.equal(isAiAccountBridgeRequestType('ai:decide'), false);
  for (const type of [
    'ai:decide-images',
    'ai:chat',
    'ai:generate-object',
    'ai:generate-image',
    'ai:generate-music',
    'ai:generate-speech',
    'ai:transcribe-audio',
    'ai:get-usage-policy',
    'characters:chat',
    'news:generate',
    'content:word-master:korean-definition',
    'content:word-master:generate-entry'
  ]) {
    assert.equal(isAiAccountBridgeRequestType(type), true, type);
  }
});

test('bridge and lite host wiring preserve decision error contract, guest image error code, and post-sign-in viewer sync', () => {
  const bridgeSource = readFileSync(
    new URL('../src/containers/Build/PreviewPanel/hooks/useHostBridge.ts', import.meta.url),
    'utf8'
  );
  const decideBlock = bridgeSource.slice(
    bridgeSource.indexOf("case 'ai:decide':"),
    bridgeSource.indexOf("case 'ai:generate-object':")
  );
  assert.match(
    decideBlock,
    /if \(type === 'ai:decide-images'\) \{\s*triggerGuestRestriction\(previewAuth,\s*\{\s*code:\s*'twinkle_account_required'/
  );
  assert.match(bridgeSource, /const aiRequest = isAiAccountBridgeRequestType\(type\);/);
  assert.match(
    bridgeSource,
    /const rawErrorDetails = buildPreviewBridgeErrorDetails\(type, error\);/
  );

  const buildRequestSource = readFileSync(
    new URL('../src/contexts/requestHelpers/build.ts', import.meta.url),
    'utf8'
  );
  const decisionHelperBlock = buildRequestSource.slice(
    buildRequestSource.indexOf('async callBuildRuntimeAiDecision('),
    buildRequestSource.indexOf('async callBuildRuntimeAiObject(')
  );
  assert.match(
    decisionHelperBlock,
    /return Promise\.reject\(normalizeBuildRuntimeAiDecisionError\(error\)\);/
  );

  const liteMainSource = readFileSync(
    new URL('../src/liteHost/react/main.tsx', import.meta.url),
    'utf8'
  );
  assert.match(
    liteMainSource,
    /requestHelpersFactory\(\(error\) =>\s*Promise\.reject\(normalizeHttpRequestError\(error\)\)\s*\)/
  );
  const subscribeStart = liteMainSource.indexOf(
    'const unsubscribe = session.subscribe((next) => {'
  );
  assert.notEqual(subscribeStart, -1);
  const bodyStart = liteMainSource.indexOf('{', subscribeStart);
  assert.notEqual(bodyStart, -1);
  let depth = 0;
  let subscribeEnd = -1;
  for (let i = bodyStart; i < liteMainSource.length; i += 1) {
    const ch = liteMainSource[i];
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        subscribeEnd = i + 1;
        break;
      }
    }
  }
  assert.notEqual(subscribeEnd, -1);
  const subscribeBlock = liteMainSource.slice(subscribeStart, subscribeEnd);
  assert.match(
    subscribeBlock,
    /setViewer\(\(previous\) => nextViewerForSession\(previous, next\)\);/
  );
});
