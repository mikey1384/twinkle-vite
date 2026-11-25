import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { transformSync } from 'esbuild';
import { isMutatingPreviewRequestType } from '../src/containers/Build/PreviewPanel/helpers/previewRequestPolicy';
import { createSocialWalkupStore } from '../src/helpers/socialWalkups';

// Twinkle.social.decline from the app frame: the page passes it to the API
// with a social:write token, the same way as accept, and its queue follows
// the answer. The real bridge cases run here with fakes around them.

const source = readFileSync(
  new URL('../src/containers/Build/PreviewPanel/hooks/useHostBridge.ts', import.meta.url),
  'utf8'
);
const start = source.indexOf("          case 'social:accept':");
const end = source.indexOf("          case 'soundtracks:sources':", start);
assert.ok(start > 0 && end > start);
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const execute = new AsyncFunction(
  'type',
  'payload',
  'activeBuild',
  'isSocialAvailable',
  'createPreviewBridgeError',
  'ensureBuildApiToken',
  'previewAuth',
  'requestRefs',
  'socialWalkupStore',
  `${
    transformSync(
      `async function bridgeCase() { let response; switch(type) { ${source.slice(start, end)} } return response; }`,
      { loader: 'ts' }
    ).code
  }
   return bridgeCase();`
);

function harness({ available = true, answer = {} as any } = {}) {
  const calls: any[] = [];
  const scopes: any[] = [];
  const store = createSocialWalkupStore();
  store.setWaiting(2915, [
    { id: 'wabc1234567', user: { id: 21, username: 'Jun', profilePicUrl: null }, queuePosition: 1, expiresAt: 9e15 }
  ]);
  const invoke = (type: string, payload: any) =>
    execute(
      type,
      payload,
      { id: 2915 },
      () => available,
      (message: string, code: string) => Object.assign(new Error(message), { code }),
      async (requested: string[]) => {
        scopes.push(requested);
        return 'scoped-token';
      },
      {},
      {
        requestBuildSocialRef: {
          current: async (request: any) => {
            calls.push(request);
            if (answer instanceof Error) throw answer;
            return answer;
          }
        }
      },
      store
    );
  return { invoke, calls, scopes, store };
}

test('decline goes to the API with a social:write token and the queue follows the answer', async () => {
  const h = harness({ answer: { declined: true, waiting: [] } });
  const response = await h.invoke('social:decline', { visitorId: 'wabc1234567', reason: 'timeout' });
  assert.deepEqual(response, { declined: true, waiting: [] });
  assert.deepEqual(h.scopes, [['social:write']]);
  assert.deepEqual(h.calls, [
    {
      buildId: 2915,
      action: 'decline',
      payload: { visitorId: 'wabc1234567', reason: 'timeout' },
      token: 'scoped-token'
    }
  ]);
  // the chip and banner drop the declined visitor at once
  assert.deepEqual(h.store.get(2915).waiting, []);
});

test('decline where social is off is refused before any request', async () => {
  const h = harness({ available: false });
  await assert.rejects(h.invoke('social:decline', { visitorId: 'wabc1234567' }), {
    code: 'social_unavailable'
  });
  assert.deepEqual(h.calls, []);
});

test('decline is a mutating request, and the page tells the SDK it can pass it on', () => {
  assert.equal(isMutatingPreviewRequestType('social:decline'), true);
  assert.match(source, /hostFeatures: isSocialAvailable\(\) \? \['social', 'social-decline'\] : \[\]/);
});
