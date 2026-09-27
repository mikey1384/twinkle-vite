import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isMutatingPreviewRequestType } from '../src/containers/Build/PreviewPanel/helpers/previewRequestPolicy';

// Twinkle.cardCraft through the host bridge: the app names a card at most;
// Twinkle's own screen confirms, only the published runtime sends the
// server-minted grant, and nothing app-supplied beyond ids is forwarded.

const source = readFileSync(
  new URL(
    '../src/containers/Build/PreviewPanel/hooks/useHostBridge.ts',
    import.meta.url
  ),
  'utf8'
);
const casesStart = source.indexOf("          case 'cardCraft:status':");
const casesEnd = source.indexOf("          case 'rewards:status':", casesStart);
const flowStart = source.indexOf('    async function craftCardThroughHost(');
const flowEnd = source.indexOf(
  '    requestBuildLiveSafetyStopRef.current = async (',
  flowStart
);
assert.ok(casesStart > 0 && casesEnd > casesStart);
assert.ok(flowStart > 0 && flowEnd > flowStart);
const flow = source
  .slice(flowStart, flowEnd)
  // Strip the TypeScript annotations so the slice runs as plain JS.
  .replace(/\}: \{\n[\s\S]*?\n {4}\}\) \{/, '}) {')
  .replace(/let cardId: number \| null = null;/, 'let cardId = null;')
  .replace(/\(level: unknown\)/g, '(level)')
  .replace(/\(level: number\)/g, '(level)');

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const execute = new AsyncFunction(
  'type',
  'payload',
  'runtimeOnly',
  'appMcpSessionId',
  'activeBuild',
  'ensureBuildApiToken',
  'previewAuth',
  'requestRefs',
  'requestCardCraftSelectionRef',
  'navigator',
  `function createPreviewBridgeError(message, code) {
     const error = new Error(message); error.code = code; return error;
   }
   let cardCraftSelectionOpen = false;
   ${flow}
   let response; switch(type) { ${source.slice(casesStart, casesEnd)} } return response;`
);

function harness({
  runtimeOnly = true,
  automated = false,
  grant = 'server-cardcraft-grant',
  signedIn = true,
  activated = true,
  status = {
    mode: 'live',
    available: true,
    recipe: { acceptedLevels: [4, 5] }
  },
  pick = 77 as number | null
}: any = {}) {
  const calls: any[] = [];
  const tokens: string[][] = [];
  const selections: any[] = [];
  const invoke = (type: string, payload: any = {}) =>
    execute(
      type,
      payload,
      runtimeOnly,
      automated ? 'app-mcp' : null,
      { id: 2610, title: 'Pet Village', cardCraftRuntimeGrant: grant },
      async (scopes: string[]) => {
        tokens.push(scopes);
        return 'scoped-token';
      },
      { userIdRef: { current: signedIn ? 5 : null } },
      {
        requestBuildCardCraftRef: {
          current: async (request: any) => {
            calls.push(request);
            return request.operation === 'status'
              ? status
              : { asset: { assetId: 1 }, duplicate: false };
          }
        },
        requestBuildCardCraftPreviewRef: {
          current: async (request: any) => {
            calls.push({ preview: true, ...request });
            return { mode: 'preview', asset: { assetId: null } };
          }
        }
      },
      {
        current: async (request: any) => {
          selections.push(request);
          return pick;
        }
      },
      { userActivation: { isActive: activated } }
    );
  return { invoke, calls, tokens, selections };
}

test('crafting and saving progress are mutating preview requests', () => {
  assert.equal(isMutatingPreviewRequestType('cardCraft:craft'), true);
  assert.equal(isMutatingPreviewRequestType('cardCraft:set-state'), true);
  assert.equal(isMutatingPreviewRequestType('cardCraft:list'), false);
});

test('a published craft asks the player, then sends only cardId, requestId and the host grant', async () => {
  const h = harness();
  const result = await h.invoke('cardCraft:craft', {
    cardId: 77,
    requestId: 'req-12345678',
    tier: { rank: 30 },
    ownerId: 1,
    grant: 'forged'
  });
  assert.deepEqual(result, { asset: { assetId: 1 }, duplicate: false });
  assert.deepEqual(h.selections, [
    {
      mode: 'live',
      appTitle: 'Pet Village',
      cardId: 77,
      acceptedLevels: [4, 5]
    }
  ]);
  assert.deepEqual(h.tokens, [['cardCraft:read'], ['cardCraft:craft']]);
  assert.deepEqual(h.calls[1], {
    buildId: 2610,
    operation: 'craft',
    payload: { cardId: 77, requestId: 'req-12345678' },
    token: 'scoped-token',
    runtimeGrant: 'server-cardcraft-grant'
  });
});

test('without a cardId the player picks one; cancelling crafts nothing', async () => {
  const picked = harness({ pick: 91 });
  await picked.invoke('cardCraft:craft', { requestId: 'req-12345678' });
  assert.equal(picked.selections[0].cardId, null);
  assert.equal(picked.calls[1].payload.cardId, 91);

  const cancelled = harness({ pick: null });
  await assert.rejects(
    cancelled.invoke('cardCraft:craft', { cardId: 77, requestId: 'req-1' }),
    (error: any) => error.code === 'card_craft_cancelled'
  );
  assert.equal(
    cancelled.calls.some((call) => call.operation === 'craft'),
    false
  );
});

test('crafting needs a real tap in the app', async () => {
  const idle = harness({ activated: false });
  await assert.rejects(
    idle.invoke('cardCraft:craft', { cardId: 77 }),
    (error: any) => error.code === 'USER_ACTIVATION_REQUIRED'
  );
  assert.equal(idle.selections.length, 0);
});

test('drafts, editors and automated sessions never send the grant or craft for real', async () => {
  for (const options of [
    { runtimeOnly: false },
    { grant: null },
    { automated: true }
  ]) {
    const h = harness({
      ...options,
      status: { mode: 'preview', available: true, recipe: { acceptedLevels: [1] } }
    });
    const result = await h.invoke('cardCraft:craft', { cardId: 77, requestId: 'req-12345678' });
    assert.equal(result.mode, 'preview');
    assert.equal(h.selections[0].mode, 'preview');
    assert.equal(h.calls[0].runtimeGrant, null);
    assert.deepEqual(h.calls[1], { preview: true, buildId: 2610, cardId: 77 });
    assert.equal(
      h.tokens.some((scopes) => scopes.includes('cardCraft:craft')),
      false
    );
  }
});

test('an unapproved app refuses before showing any confirmation', async () => {
  const h = harness({
    status: { mode: 'live', available: false, reason: 'not_approved', recipe: null }
  });
  await assert.rejects(
    h.invoke('cardCraft:craft', { cardId: 77 }),
    (error: any) => error.code === 'card_craft_not_approved'
  );
  assert.equal(h.selections.length, 0);
});

test('reads and progress writes use their own scopes; guests get empty answers', async () => {
  const h = harness();
  await h.invoke('cardCraft:set-state', {
    assetId: 4,
    state: { nickname: 'Blaze' },
    expectedRevision: 2,
    ownerId: 1
  });
  assert.deepEqual(h.tokens, [['cardCraft:write']]);
  assert.deepEqual(h.calls[0].payload, {
    assetId: 4,
    state: { nickname: 'Blaze' },
    expectedRevision: 2
  });
  assert.equal(h.calls[0].runtimeGrant, null);
  await h.invoke('cardCraft:status');
  assert.equal(h.calls[1].runtimeGrant, 'server-cardcraft-grant');

  const guest = harness({ signedIn: false });
  assert.equal((await guest.invoke('cardCraft:status')).reason, 'sign_in_required');
  assert.deepEqual(await guest.invoke('cardCraft:list'), { assets: [], cursor: null });
  await assert.rejects(
    guest.invoke('cardCraft:craft', { cardId: 77 }),
    (error: any) => error.code === 'card_craft_auth'
  );
  assert.equal(guest.calls.length, 0);
});
