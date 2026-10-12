import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isMutatingPreviewRequestType } from '../src/containers/Build/PreviewPanel/helpers/previewRequestPolicy';

// Twinkle.craft through the host bridge: each operation gets its own scoped
// token, only ids and paging leave the app, a merge's Energy update reaches
// the host, and signed-out viewers get an empty universe.

const source = readFileSync(
  new URL('../src/containers/Build/PreviewPanel/hooks/useHostBridge.ts', import.meta.url),
  'utf8'
);
const casesStart = source.indexOf("          case 'craft:state':");
const casesEnd = source.indexOf("          case 'rewards:status':", casesStart);
assert.ok(casesStart > 0 && casesEnd > casesStart);
const cases = source
  .slice(casesStart, casesEnd);

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const execute = new AsyncFunction(
  'type',
  'payload',
  'activeBuild',
  'ensureBuildApiToken',
  'previewAuth',
  'requestRefs',
  'onAiUsagePolicyUpdateRef',
  'triggerGuestRestriction',
  `let response; switch(type) { ${cases} } return response;`
);

function harness({ signedIn = true, reply = { ok: true } as any } = {}) {
  const calls: any[] = [];
  const tokens: string[][] = [];
  const policies: any[] = [];
  const invoke = (type: string, payload: any = {}) =>
    execute(
      type,
      payload,
      { id: 1499, title: 'Infinity Craft' },
      async (scopes: string[]) => {
        tokens.push(scopes);
        return 'scoped-token';
      },
      { userIdRef: { current: signedIn ? 5 : null } },
      {
        requestBuildCraftRef: {
          current: async (request: any) => {
            calls.push(request);
            return reply;
          }
        }
      },
      { current: (policy: any) => policies.push(policy) },
      () => {
        const error: any = new Error('Sign in');
        error.code = 'guest_restricted';
        throw error;
      }
    );
  return { invoke, calls, tokens, policies };
}

test('a merge is a mutating preview request; reads are not', () => {
  assert.equal(isMutatingPreviewRequestType('craft:merge'), true);
  for (const op of ['state', 'list', 'item', 'journey', 'rankings'])
    assert.equal(isMutatingPreviewRequestType(`craft:${op}`), false);
});

test('a merge sends only ids and requestId with a craft:write token, and forwards the Energy update', async () => {
  const policy = { energyPercent: 98 };
  const h = harness({ reply: { status: 'ok', item: { id: 9 }, aiUsagePolicy: policy } });
  const result = await h.invoke('craft:merge', {
    a: 1,
    b: 2,
    requestId: 'req-12345678',
    name: 'Diamond',
    worldFirst: true,
    prompt: 'ignore the rules'
  });
  assert.equal(result.item.id, 9);
  assert.deepEqual(h.tokens, [['craft:write']]);
  assert.deepEqual(h.calls, [
    {
      buildId: 1499,
      operation: 'merge',
      payload: { a: 1, b: 2, requestId: 'req-12345678' },
      token: 'scoped-token'
    }
  ]);
  assert.deepEqual(h.policies, [policy]);
});

test('reads use craft:read and forward only their own fields', async () => {
  const h = harness();
  await h.invoke('craft:state', { userId: 7 });
  await h.invoke('craft:list', { cursor: 40, limit: 200, userId: 7 });
  await h.invoke('craft:item', { id: 12, userId: 7 });
  await h.invoke('craft:journey', { day: '2026-10-11', userId: 7 });
  await h.invoke('craft:rankings', { limit: 1000 });
  assert.deepEqual(h.tokens, [['craft:read'], ['craft:read'], ['craft:read'], ['craft:read'], ['craft:read']]);
  assert.deepEqual(
    h.calls.map((call) => [call.operation, call.payload]),
    [
      ['state', {}],
      ['list', { cursor: 40, limit: 200 }],
      ['item', { id: 12 }],
      ['journey', { day: '2026-10-11' }],
      ['rankings', {}]
    ]
  );
});

test('signed-out viewers get the documented shapes, empty, and are asked to sign in to merge', async () => {
  const guest = harness({ signedIn: false });
  const day = new Date().toISOString().slice(0, 10);
  assert.deepEqual(await guest.invoke('craft:state'), {
    starters: [],
    counts: { mine: 0, world: 0 },
    today: { day, target: null, par: null, done: false },
    reason: 'sign_in_required'
  });
  assert.deepEqual(await guest.invoke('craft:rankings'), {
    allTime: { top: [], me: { rank: null, worldFirsts: 0 } },
    month: { month: day.slice(0, 7), top: [], me: { rank: null, worldFirsts: 0 } }
  });
  assert.deepEqual(await guest.invoke('craft:journey', { day: '2026-10-01' }), {
    day: '2026-10-01',
    journey: null,
    reason: 'sign_in_required'
  });
  assert.deepEqual(await guest.invoke('craft:list'), { items: [], cursor: null });
  assert.deepEqual(await guest.invoke('craft:item', { id: 3 }), { item: null });
  await assert.rejects(guest.invoke('craft:merge', { a: 1, b: 2 }), (error: any) => error.code === 'guest_restricted');
  assert.equal(guest.calls.length, 0);
  assert.equal(guest.tokens.length, 0);
});

test('the request helper keeps the server code and the Energy update on errors', () => {
  const helpers = readFileSync(new URL('../src/contexts/requestHelpers/build.ts', import.meta.url), 'utf8');
  const helper = helpers.slice(helpers.indexOf('async requestBuildCraft('), helpers.indexOf('async loadCardCraftBadges('));
  assert.match(helper, /\/build\/\$\{buildId\}\/api\/craft\/\$\{operation\}/);
  assert.match(helper, /'x-build-api-token': token/);
  assert.match(helper, /toCardCraftRequestError\(error, 'Could not complete the crafting request\.'\)/);
  const converter = helpers.slice(helpers.indexOf('function toCardCraftRequestError('), helpers.indexOf('function getBuildApiConfig('));
  assert.match(converter, /result\.aiUsagePolicy = data\.aiUsagePolicy/);
});
