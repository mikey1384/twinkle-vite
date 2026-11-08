import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  createLandGrantKeeper,
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
    publicRead: false
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
    publicRead: false
  });
  assert.deepEqual(
    planLandRequest('land:history', { key: 'fw3:0:0', order: 'newest', sinceAt: 5, before: 9, viewerId: 2 }, { signedIn: true, publicApp: true }).body,
    { key: 'fw3:0:0', order: 'newest', sinceAt: 5, before: 9 }
  );
});

test('signed-out visitors read cells and plots of a public app through the public route only', () => {
  const guest = { signedIn: false, publicApp: true };
  assert.equal(planLandRequest('land:cells', { region: 'fw3' }, guest).publicRead, true);
  assert.equal(planLandRequest('land:plots', { region: 'fw3' }, guest).publicRead, true);
  for (const type of ['land:edit', 'land:set-rules', 'land:check', 'land:history', 'land:mine'])
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
  for (const type of ['land:edit', 'land:set-rules', 'world:edit']) assert.equal(isMutatingPreviewRequestType(type), true, type);
  assert.equal(isMutatingPreviewRequestType('land:cells'), false);
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
  assert.equal(
    landReviewText(land),
    'Land. Twinkle holds the land in these worlds: mountains1, fw3. Inside a plot someone holds, Twinkle refuses block changes from anyone except its holder and the players they allow (only me / friends / everyone), plus tnt and fluids only when the holder switches them on. Plots are 16×16, full height, named by their corner (key group "plots"). No plots within 24 blocks of spawn (49, 57).'
  );
  assert.equal(
    formatBuildLandLine(land),
    'Land in 2 worlds: inside a 16×16 plot someone holds, only they and the players they allow can change blocks; tnt and fluids only when the holder turns them on.'
  );
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
