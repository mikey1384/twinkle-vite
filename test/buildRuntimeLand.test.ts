import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  attachWorldAckDetails,
  createLandGrantKeeper,
  createLandGuestTokens,
  stripLandGuestToken,
  LAND_REQUEST_TYPES,
  landEventTargetWindows,
  landGrantExpiresAt,
  planLandRequest,
  shouldShowAppReloadBanner,
  worldEditPayload,
  worldJoinLand
} from '../src/containers/Build/PreviewPanel/helpers/buildRuntimeLand';
import { isMutatingPreviewRequestType } from '../src/containers/Build/PreviewPanel/helpers/previewRequestPolicy';
import {
  buildCoinPricePersonWarning,
  formatBuildLandLine,
  LAND_TALLY_PLAIN_WORDS,
  landReviewText
} from '../src/helpers/buildRewardReviewCard';

// Twinkle.land, website side (phase 2, 11-08). The frame packs cells; the
// host only forwards documented fields, adds the token/grant, routes
// Twinkle's events and draws the reload banner.

const fakeGrant = (exp: number) =>
  `h.${Buffer.from(JSON.stringify({ purpose: 'build-published-rewards', exp })).toString('base64url')}.s`;

test('land requests forward only documented fields, with the right scope', () => {
  assert.deepEqual([...LAND_REQUEST_TYPES].sort(), [
    'land:cells',
    'land:check',
    'land:edit',
    'land:history',
    'land:mine',
    'land:plots',
    'land:set-rules'
  ]);
  const edit = planLandRequest(
    'land:edit',
    { region: 'fw3', cells: 'AgI=', format: 1, cause: 'tnt', at: 5, userId: 9, grant: 'x', credit: true },
    { signedIn: true, publicApp: true }
  );
  assert.deepEqual(edit, {
    operation: 'edit',
    scope: 'land:write',
    body: { region: 'fw3', cells: 'AgI=', format: 1, cause: 'tnt', at: 5 },
    publicRead: false,
    guestToken: null
  });
  const rules = planLandRequest('land:set-rules', { key: 'fw3:0:0', build: 'friends', holderId: 2 }, { signedIn: true, publicApp: true });
  assert.equal(rules.operation, 'set-rules');
  assert.deepEqual(rules.body, { key: 'fw3:0:0', build: 'friends' });
  assert.equal(planLandRequest('land:check', { key: 'k', priceId: 'p', coins: 0 }, { signedIn: true, publicApp: false }).scope, 'land:read');
  assert.throws(() => planLandRequest('land:grant', {}, { signedIn: true, publicApp: true }), /Unknown land request/);
  // Phase 3b: the player's own blocks (identity from the token only) and a plot's history newest first.
  assert.deepEqual(planLandRequest('land:mine', { region: 'fw3', ignore: [8], userId: 9 }, { signedIn: true, publicApp: true }), {
    operation: 'mine',
    scope: 'land:read',
    body: { region: 'fw3', ignore: [8] },
    publicRead: false,
    guestToken: null
  });
  assert.deepEqual(
    planLandRequest('land:history', { key: 'fw3:0:0', order: 'newest', sinceAt: 5, before: 9, viewerId: 2 }, { signedIn: true, publicApp: true }).body,
    { key: 'fw3:0:0', order: 'newest', sinceAt: 5, before: 9 }
  );
});

test('signed-out visitors use the public route: reads, and (as their land guest) edits and one cell\'s history (review L5)', () => {
  const guest = { signedIn: false, publicApp: true, guestToken: 'gabc.123.sig' };
  assert.equal(planLandRequest('land:cells', { region: 'fw3' }, guest).publicRead, true);
  assert.equal(planLandRequest('land:plots', { region: 'fw3' }, guest).publicRead, true);
  // A world switch's flush and "who changed this block?" never ask a guest to sign in.
  const edit = planLandRequest('land:edit', { region: 'fw3', cells: 'AgI=', at: 5 }, guest);
  assert.equal(edit.publicRead, true);
  assert.equal(edit.guestToken, 'gabc.123.sig');
  assert.deepEqual(edit.body, { region: 'fw3', cells: 'AgI=' }, 'a guest never sends a carried-over time');
  const who = planLandRequest('land:history', { region: 'fw3', x: 1, y: 2, z: 3 }, guest);
  assert.equal(who.publicRead, true);
  assert.equal(who.guestToken, null);
  // Plot history, rules, prices and "my blocks" stay members-only.
  assert.equal(planLandRequest('land:history', { key: 'fw3:0:0', order: 'newest' }, guest).publicRead, false);
  for (const type of ['land:set-rules', 'land:check', 'land:mine'])
    assert.equal(planLandRequest(type, { region: 'fw3' }, guest).publicRead, false, type);
  assert.equal(planLandRequest('land:cells', { region: 'fw3' }, { signedIn: false, publicApp: false }).publicRead, false);
  assert.equal(planLandRequest('land:cells', { region: 'fw3' }, { signedIn: true, publicApp: true }).publicRead, false);
});

test('world edits and joins carry only the session, cells, cause and the website grant', () => {
  assert.deepEqual(
    worldEditPayload({ sessionId: 's1', cells: 'AgI=', format: 2, cause: 'fluid', actorId: 4, region: 'x' }, 'g'),
    { sessionId: 's1', cells: 'AgI=', format: 2, cause: 'fluid', grant: 'g' }
  );
  assert.deepEqual(worldEditPayload({ sessionId: 's1', cells: 'AgI=', cause: '' }, null), { sessionId: 's1', cells: 'AgI=' });
  assert.equal(worldJoinLand({}, 'g'), undefined);
  assert.deepEqual(worldJoinLand({ land: { region: 'fw3', grant: 'forged' } }, null), { region: 'fw3' });
  assert.deepEqual(worldJoinLand({ land: { region: 'fw3' } }, 'g'), { region: 'fw3', grant: 'g' });
  // A guest's land token from the previous join goes back; the frame never sees it (review H1).
  assert.deepEqual(worldJoinLand({ land: { region: 'fw3', guest: 'forged' } }, null, 'gtoken'), { region: 'fw3', guest: 'gtoken' });
  assert.deepEqual(stripLandGuestToken({ ok: true, land: { region: 'fw3', credit: false, guest: 'gtoken' } }), { ok: true, land: { region: 'fw3', credit: false } });
  const stored = new Map<string, string>();
  const tokens = createLandGuestTokens({ getItem: (k) => stored.get(k) ?? null, setItem: (k, v) => void stored.set(k, v) });
  assert.equal(tokens.get(363), null);
  tokens.set(363, 'gtoken');
  assert.equal(createLandGuestTokens({ getItem: (k) => stored.get(k) ?? null, setItem: () => {} }).get(363), 'gtoken', 'kept for the next visit');
  const blocked = createLandGuestTokens({ getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } });
  blocked.set(363, 'gmem');
  assert.equal(blocked.get(363), 'gmem', 'blocked storage keeps it for this page');
  for (const type of ['land:edit', 'land:set-rules', 'world:edit']) assert.equal(isMutatingPreviewRequestType(type), true, type);
  assert.equal(isMutatingPreviewRequestType('land:cells'), false);
});

test('review L1: a world socket refusal carries the server\'s retry time to the frame', () => {
  const error = attachWorldAckDetails(new Error('Blocks are changing too fast.'), { ok: false, code: 'land_throttled', details: { retryAfterSeconds: 34 } }) as any;
  assert.deepEqual(error.details, { retryAfterSeconds: 34 });
  assert.equal(error.retryAfterSeconds, 34);
  assert.equal((attachWorldAckDetails(new Error('x'), { ok: false }) as any).details, undefined);
  const bridge = readFileSync(new URL('../src/containers/Build/PreviewPanel/hooks/useHostBridge.ts', import.meta.url), 'utf8');
  assert.ok(bridge.includes('attachWorldAckDetails(serverError, response);'));
});

test('Twinkle land events go to each frame bound to that world once', () => {
  const a = { name: 'a' } as unknown as Window;
  const b = { name: 'b' } as unknown as Window;
  const sessions = [
    { sourceWindow: a, buildId: 363, landRegion: 'fw3' },
    { sourceWindow: a, buildId: 363, landRegion: 'fw3' },
    { sourceWindow: b, buildId: 363, landRegion: 'mountains1' },
    { sourceWindow: b, buildId: 9, landRegion: 'fw3' },
    { sourceWindow: b, buildId: 363, landRegion: null }
  ];
  const event = { type: 'cells.changed', fromSeq: 1, toSeq: 1, cells: 'AgI=' };
  assert.deepEqual(landEventTargetWindows(sessions, { buildId: 363, region: 'fw3', event }), [a]);
  assert.deepEqual(landEventTargetWindows(sessions, { buildId: 363, region: 'mountains1', event }), [b]);
  assert.deepEqual(landEventTargetWindows(sessions, { buildId: 363, region: 'fw3' }), []);
});

test('the grant is renewed shortly before it ends, once, and kept when renewal fails', async () => {
  let clock = 1_000_000;
  const calls: string[] = [];
  let fail = false;
  const keeper = createLandGrantKeeper({
    now: () => clock,
    renew: async (grant) => {
      calls.push(grant);
      if (fail) throw new Error('offline');
      return fakeGrant(clock + 3600);
    }
  });
  const first = fakeGrant(clock + 3600);
  assert.equal(landGrantExpiresAt(first), clock + 3600);
  assert.equal(await keeper(first), first);
  assert.equal(calls.length, 0);
  clock += 3400;
  const [x, y] = await Promise.all([keeper(first), keeper(first)]);
  assert.equal(x, y);
  assert.equal(calls.length, 1, 'one renewal for parallel calls');
  assert.equal(landGrantExpiresAt(x), clock + 3600);
  assert.equal(await keeper(first), x, 'the renewed grant is reused');
  clock += 3500;
  fail = true;
  assert.equal(await keeper(first), x, 'a failed renewal keeps the last grant');
  assert.equal(await keeper(null), null);
  assert.equal(landGrantExpiresAt('not-a-jwt'), null);
});

test('the reload banner shows only on a published tab running another version', () => {
  const event = { buildId: 363, artifactVersionId: 9002, askReload: true };
  assert.equal(shouldShowAppReloadBanner({ event, buildId: 363, mountedArtifactVersionId: 9001 }), true);
  assert.equal(shouldShowAppReloadBanner({ event, buildId: 363, mountedArtifactVersionId: 9002 }), false);
  assert.equal(shouldShowAppReloadBanner({ event, buildId: 364, mountedArtifactVersionId: 9001 }), false);
  assert.equal(shouldShowAppReloadBanner({ event, buildId: 363, mountedArtifactVersionId: null }), false, 'drafts never');
  assert.equal(shouldShowAppReloadBanner({ event: { ...event, askReload: false }, buildId: 363, mountedArtifactVersionId: 1 }), false);
  // A rollback asks newer tabs to reload too.
  assert.equal(shouldShowAppReloadBanner({ event: { ...event, artifactVersionId: 9000 }, buildId: 363, mountedArtifactVersionId: 9001 }), true);
});

test('review words: the land sentence matches the API and land changes the builder words', () => {
  const land = {
    keyGroup: 'plots',
    plotSize: 16,
    keyFormat: 'region:x:z',
    regions: ['mountains1', 'fw3'],
    reserved: [{ x: 49, z: 57, radius: 24, why: 'spawn' }],
    switches: [
      { name: 'tnt', cause: 'tnt', values: [0] },
      { name: 'fluids', cause: 'fluid', values: [8, 2, 10, 32] }
    ]
  };
  // Review L3: a switch lets anyone (guests too) set any block of the plot to its values; free worlds named.
  assert.equal(
    landReviewText({ ...land, freeRegions: ['tnt-world-fw3'] }),
    'Land. Twinkle holds the land in these worlds: mountains1, fw3; players also build in tnt-world-fw3 (no plots). Inside a plot someone holds, Twinkle refuses block changes from anyone except its holder and the players they allow (only me / friends / everyone). When the holder turns on tnt or fluids, anyone, guests too, may set any block in the plot to tnt 0, fluids 8/2/10/32. Plots are 16×16, full height, named by their corner (key group "plots"). No plots within 24 blocks of spawn (49, 57).'
  );
  assert.equal(
    formatBuildLandLine(land),
    'Land in 2 worlds: inside a 16×16 plot someone holds, only they and the players they allow can change blocks; turning on tnt or fluids lets anyone set blocks there to their values.'
  );
  assert.match(LAND_TALLY_PLAIN_WORDS, /bought from Twinkle \(then those builders are paid, once\); a Sell, a takeover or a grant does not use it up\. A player earns credit for at most 20,000 new blocks a day\./);
  const prices = [{ id: 'plot', title: 'Plot', coins: 0, destination: 'removed' as const, builders: { coinsPerUnit: 50 } }];
  const withLand = buildCoinPricePersonWarning(prices, null, land) || '';
  assert.ok(withLand.includes(LAND_TALLY_PLAIN_WORDS));
  assert.doesNotMatch(withLand, /tally-clear/);
  assert.match(buildCoinPricePersonWarning(prices, null) || '', /tally-clear/);
});

test('the host bridge wires land through the documented pieces', () => {
  const bridge = readFileSync(new URL('../src/containers/Build/PreviewPanel/hooks/useHostBridge.ts', import.meta.url), 'utf8');
  for (const piece of [
    "case 'world:edit':",
    "'build_app_world_edit'",
    "case 'land:edit':",
    "socket.on('build_app_land_event', handleBuildRuntimeLandEvent)",
    "socket.off('build_app_land_event', handleBuildRuntimeLandEvent)",
    "type: 'land:event'",
    '...(joinLand ? { land: joinLand } : {})'
  ])
    assert.ok(bridge.includes(piece), piece);
  const helpers = readFileSync(new URL('../src/contexts/requestHelpers/index.ts', import.meta.url), 'utf8');
  for (const name of ['requestBuildLand', 'requestBuildLandPublic', 'renewBuildRuntimeGrant'])
    assert.ok(helpers.includes(`'${name}'`), name);
});
