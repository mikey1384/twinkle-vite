// Two-host parity: the same Twinkle SDK calls from an app frame, answered by
// (A) the twin-kle.com app frame's wiring (PreviewPanel: useAppRequests,
// useHostConfirmations, useHostBridge, nonce in the frame's name) and
// (B) the lumine.app lite host (src/liteHost/react: the same hooks, the
// `lumine-host` nonce handshake, the app-pass socket bind and the Coins
// confirmation gate), with the same mock request helpers and socket. The
// answers must be identical; on (B) a Coins spend must also carry the
// server's one-time confirmation of exactly what the member confirmed.
import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
const require = createRequire(import.meta.url);
const { chromium } = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));

const BUILD_ID = 4242;
const VERSION_ID = 777;
const VIEWER = { id: 18933, username: 'mira', profilePicUrl: 'https://cdn.test/mira.png', ageTier: 'teen' };

const fakeSocket = `
const handlers = new Map();
const emitted = [];
window.__socketEmits = emitted;
function on(event, fn) { if (!handlers.has(event)) handlers.set(event, new Set()); handlers.get(event).add(fn); return socket; }
function off(event, fn) { handlers.get(event)?.delete(fn); return socket; }
function ackFor(event, payload) {
  if (event === 'bind_uid_to_socket') return { chatRoomCount: 0, userId: payload.userId };
  if (event === 'build_app_world_join') return { ok: true, session: { sessionId: 'world-s1', worldKey: payload.worldKey || 'default', roomKey: payload.roomKey || 'main' }, room: { worldKey: payload.worldKey || 'default', roomKey: payload.roomKey || 'main', players: [{ name: payload.player?.name }] } };
  return { ok: true };
}
function emit(event, ...args) {
  const ack = typeof args[args.length - 1] === 'function' ? args.pop() : null;
  emitted.push({ event, payload: args[0] });
  if (ack) setTimeout(() => ack(ackFor(event, args[0] || {})), 0);
  return socket;
}
export const socket = {
  id: 'sock-1', connected: true,
  on, off, once: on, emit,
  timeout() { return { emit(event, payload, ack) { emitted.push({ event, payload }); setTimeout(() => ack(null, ackFor(event, payload || {})), 0); } }; },
  get volatile() { return socket; },
  connect() { return socket; }, disconnect() { return socket; },
  io: { engine: { transport: { writable: true } }, on() {}, off() {} }
};
export const socketKeepalive = { connected() {}, disconnected() {}, ping() {}, visibilityChanged() {}, subscribe() { return () => {}; } };
`;

// Deterministic request helpers; every call is recorded in window.__calls.
const mockHelpers = `
export function createMockHelpers() {
  const calls = [];
  window.__calls = calls;
  const answers = {
    getBuildApiToken: (a) => ({ token: 'tok-' + a.buildId, scopes: a.scopes, expiresAt: 4102444800 }),
    getPrivateDbItem: (a) => ({ item: { key: a.key, value: 7, updatedAt: 1 } }),
    setPrivateDbItem: (a) => ({ item: { key: a.key, value: a.value, updatedAt: 2 } }),
    getSharedDbEntries: () => ({ entries: [{ id: 1, data: { note: 'hi' }, userId: 5 }], hasMore: false }),
    addSharedDbEntry: (a) => ({ entry: { id: 2, data: a.data, userId: ${VIEWER.id} } }),
    callBuildRuntimeAiChat: (a) => ({ text: 'Echo: ' + a.message, model: 'test-model' }),
    createLumineAppCoinConfirmation: () => ({ nonce: 'confirm-nonce-1', expiresAt: 4102444800 }),
    requestBuildCoins: (a) => {
      if (a.operation === 'balance') return { coins: 100 };
      if (a.operation === 'quote') return { mode: 'live', available: true, canAfford: true, coins: 5, priceCoins: 5, balance: 100, destination: 'owner', recipient: { id: 9, username: 'maker' }, price: { title: 'Star gem' }, appTitle: 'Fixture App', key: null, builders: [] };
      if (a.operation === 'charge') return { mode: 'live', receipt: { id: 'rcpt-1', coins: 5, priceId: a.payload.priceId }, balance: 95 };
      return { ok: true };
    }
  };
  const helpers = new Proxy({}, {
    get(_t, prop) {
      if (prop === 'then' || typeof prop !== 'string') return undefined;
      return async (args) => {
        calls.push({ method: prop, args: JSON.parse(JSON.stringify(args ?? null, (k, v) => typeof v === 'function' ? undefined : v)) });
        const answer = answers[prop];
        return answer ? answer(args || {}) : { ok: true, method: prop };
      };
    }
  });
  return helpers;
}
`;

const fixture = `
import React, { useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AppContext } from './src/contexts/AppContext';
import { KeyContext } from './src/contexts/KeyContext';
import useAppRequests from './src/containers/Build/PreviewPanel/hooks/useAppRequests';
import useHostConfirmations from './src/containers/Build/PreviewPanel/hooks/useHostConfirmations';
import { buildEmptyRuntimeObservationState, useHostBridge } from './src/containers/Build/PreviewPanel/hooks/useHostBridge';
import { buildPreviewFrameWindowName } from './src/helpers/buildPreviewOriginHelpers';
import { markSocketAuthReady } from './src/helpers/socketAuthReady';
import { getThemeRoles } from './src/theme';
import { createLiteFrameMetaRef, installLiteFrameReloadWatch, LiteHostBridge, LiteHostProviders } from './src/liteHost/react/LiteHost';
import { createLiteSocketBinder } from './src/liteHost/react/liteSocket';
import { createMockHelpers } from 'mock-helpers';

const host = new URLSearchParams(location.search).get('host');
const helpers = createMockHelpers();
const viewer = { ...${JSON.stringify(VIEWER)}, rewardRuntimeGrant: 'grant-1', cardCraftRuntimeGrant: null, capabilitySnapshot: { build: { isPublic: true } } };
const appOrigin = 'http://app.test';

function PreviewPanelHost({ frame, nonce, loadId }) {
  // PreviewPanel/index.tsx's runtime wiring, verbatim in shape.
  const { getBuildApiTokenRef, previewRequestRefs } = useAppRequests({});
  const build = useMemo(() => ({ id: ${BUILD_ID}, title: 'Fixture App', userId: 9, username: 'maker', isPublic: 1, publishedArtifactVersionId: ${VERSION_ID}, currentArtifactVersionId: ${VERSION_ID}, rewardRuntimeGrant: 'grant-1', cardCraftRuntimeGrant: null }), []);
  const previewRootRef = useRef(frame);
  const confirmations = useHostConfirmations({ build, keyUserId: viewer.id, previewRootRef });
  const r = (v) => ({ current: v });
  const previewAuth = useRef({ buildRef: r(build), isOwnerRef: r(false), userIdRef: r(viewer.id), usernameRef: r(viewer.username), profilePicUrlRef: r(viewer.profilePicUrl), ageTierRef: r(viewer.ageTier), guestSessionIdRef: r(null), buildApiTokenRef: r(null), getBuildApiTokenRef, setGuestRestrictionBannerVisible: () => {} }).current;
  const metaRef = useRef({ primary: { buildId: ${BUILD_ID}, codeSignature: null, messageNonce: nonce, viewerKey: 'user:' + viewer.id, bridgeLoadId: loadId, bridgeConfirmed: false, bridgeNonceRequestOpen: true, bridgeNonceRequestExpiresAt: Date.now() + 35000, hasLoaded: false }, secondary: { buildId: null, codeSignature: null, messageNonce: null, viewerKey: null, bridgeLoadId: null, bridgeConfirmed: false, bridgeNonceRequestOpen: false, bridgeNonceRequestExpiresAt: null, hasLoaded: false } });
  const sources = useMemo(() => ({ primary: frame.getAttribute('src'), secondary: null }), []);
  const [, setObs] = useState(() => buildEmptyRuntimeObservationState({ buildId: ${BUILD_ID}, codeSignature: null }));
  useHostBridge({
    runtimeOnly: true, appLifecycleSource: 'published', captureScratch: null, previewSrcOverride: null, appMcpSessionId: null,
    appHelperRelayStateRef: useRef({ announcement: null, paired: null }), appHelperBridgeRef: useRef(null), appHelperEventsRef: useRef(null),
    buildId: build.id, buildIsPublic: 1, isOwner: false, userId: viewer.id, username: viewer.username, ageTier: viewer.ageTier, profilePicUrl: viewer.profilePicUrl,
    resolvedCapabilitySnapshot: viewer.capabilitySnapshot, resolvedRuntimeExplorationPlan: null, audioMuted: false, mountContext: null, launchTarget: null,
    capabilitySnapshotRef: useRef(viewer.capabilitySnapshot), runtimeExplorationPlanRef: useRef(null), messageTargetFrameRef: useRef('primary'),
    navigateHostContentRef: useRef(() => {}), navigatePreviewFrameRef: useRef(null), previewCodeSignatureRef: useRef(null), previewFrameMetaRef: metaRef,
    previewFrameReady: useMemo(() => ({ primary: true, secondary: false }), []), previewFrameSources: sources, previewFrameSourcesRef: useRef(sources),
    previewTransitioningRef: useRef(false), onPreviewFrameRetiredRef: useRef(null), primaryIframeRef: useRef(frame), secondaryIframeRef: useRef(null),
    setRuntimeObservationState: setObs, previewAuth, requestRefs: previewRequestRefs, runtimeUploadsSyncRef: useRef(null), onAiUsagePolicyUpdateRef: useRef(null),
    requestBuildImageGenerationConfirmationRef: confirmations.requestBuildImageGenerationConfirmationRef,
    requestBuildMusicGenerationConfirmationRef: confirmations.requestBuildMusicGenerationConfirmationRef,
    requestBuildMediaActionConfirmationRef: confirmations.requestBuildMediaActionConfirmationRef,
    requestBuildCoinConfirmationRef: confirmations.requestBuildCoinConfirmationRef,
    requestBuildAppLinkRef: confirmations.requestBuildAppLinkRef,
    requestCardCraftSelectionRef: confirmations.requestCardCraftSelectionRef,
    onBuildLiveSafetyHostSessionsChange: confirmations.setActiveBuildLiveSafetyHostSessions,
    requestBuildLiveSafetyStopRef: confirmations.requestBuildLiveSafetyStopRef,
    onAppTextEntryRef: useRef(null)
  });
  return confirmations.hostConfirmationModals;
}

const defaults = AppContext._defaultStore.snapshot.value;
const root = document.createElement('div');
const modal = document.createElement('div');
modal.id = 'modal';
document.body.append(root, modal);
const frame = document.createElement('iframe');
frame.id = 'app';
if (host === 'preview') {
  const nonce = 'pp' + Math.random().toString(36).slice(2);
  const loadId = 'load' + Math.random().toString(36).slice(2);
  frame.name = buildPreviewFrameWindowName(nonce);
  frame.src = appOrigin + '/frame.html?twinkleBridgeLoadId=' + loadId;
  document.body.append(frame);
  markSocketAuthReady(viewer.id);
  createRoot(root).render(
    <AppContext.Provider value={{ ...defaults, requestHelpers: helpers }}>
      <KeyContext.Provider value={{ myState: { userId: viewer.id, username: viewer.username, settings: {} }, theme: getThemeRoles('logoBlue'), helpers: {} }}>
        <PreviewPanelHost frame={frame} nonce={nonce} loadId={loadId} />
      </KeyContext.Provider>
    </AppContext.Provider>
  );
} else {
  // As hostShell.ts writes it: the frame in the HTML with the lumine-host load id.
  frame.src = appOrigin + '/frame.html?twinkleBridgeLoadId=lumine-host';
  document.body.append(frame);
  const metaRef = createLiteFrameMetaRef(${BUILD_ID});
  const retiredRef = { current: null };
  installLiteFrameReloadWatch({ frame, buildId: ${BUILD_ID}, metaRef, retiredRef });
  createLiteSocketBinder().setIdentity({ userId: viewer.id, username: viewer.username, profilePicUrl: viewer.profilePicUrl, token: 'app-pass' });
  const info = { buildId: ${BUILD_ID}, versionId: ${VERSION_ID}, title: 'Fixture App', owner: { id: 9, username: 'maker' }, siteOrigin: 'http://site.test' };
  createRoot(root).render(
    <LiteHostProviders requestHelpers={helpers} viewer={viewer} onOpenSignin={() => {}}>
      <LiteHostBridge info={info} frame={frame} viewer={viewer} metaRef={metaRef} retiredRef={retiredRef} onGuestRestricted={() => {}} />
    </LiteHostProviders>
  );
}
`;

// A small Twinkle SDK stand-in in the app frame: the real handshake (nonce
// from the frame's name, else bridge:request-nonce with the load id) and
// request/answer protocol of twinkle-api's preview SDK.
const frameHtml = `<!doctype html><script>
const loadId = new URLSearchParams(location.search).get('twinkleBridgeLoadId');
let nonce = (String(window.name).match(/^twinkle-build-preview:([^:]+)/) || [])[1] || null;
const pending = new Map(); let seq = 0; window.events = [];
let readyResolve; const ready = new Promise((r) => (readyResolve = r));
window.addEventListener('message', (e) => {
  const d = e.data; if (!d || d.source !== 'twinkle-parent') return;
  if (d.type === 'bridge:nonce') { nonce = d.previewNonce; readyResolve(); return; }
  if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); p(d.error ? { error: d.error, errorCode: d.errorCode || null } : { payload: d.payload }); return; }
  if (d.type) window.events.push(d.type);
});
if (nonce) readyResolve(); else parent.postMessage({ source: 'twinkle-build', type: 'bridge:request-nonce', payload: { bridgeLoadId: loadId } }, '*');
function call(type, payload) { const id = 'r' + ++seq; return new Promise((resolve) => { pending.set(id, resolve); parent.postMessage({ source: 'twinkle-build', id, type, payload, previewNonce: nonce }, '*'); }); }
window.results = {};
(async () => {
  await ready;
  const steps = [
    ['init', {}], ['viewer:get', {}],
    ['private-db:get', { key: 'best' }], ['private-db:set', { key: 'best', value: 12 }],
    ['shared-db:get-entries', { topicKey: 'notes' }], ['shared-db:add-entry', { topicKey: 'notes', data: { note: 'yo' } }],
    ['coins:balance', {}], ['coins:charge', { priceId: 'gem', requestId: 'req_12345678' }],
    ['ai:chat', { promptId: 1, message: 'hello' }],
    ['chat:subscribe', { roomKey: 'lobby' }],
    ['world:join', { worldKey: 'park', roomKey: 'main', player: { name: 'Mira' } }]
  ];
  for (const [type, payload] of steps) window.results[type] = await call(type, payload);
  window.done = true;
})();
</script>`;

async function bundle() {
  const stubs = {
    '~/constants/sockets/api': fakeSocket,
    'mock-helpers': mockHelpers
  };
  const output = await build({
    stdin: { contents: fixture, resolveDir: repo, loader: 'tsx' },
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    alias: { '~': path.join(repo, 'src'), buffer: 'buffer/', util: 'util/' },
    define: { 'import.meta.env': '{"VITE_URL":"http://api.test"}', 'process.env.NODE_ENV': '"development"', global: 'window' },
    loader: { '.png': 'empty', '.jpg': 'empty', '.gif': 'empty', '.webp': 'empty', '.svg': 'empty', '.mp3': 'empty', '.wav': 'empty', '.woff2': 'empty', '.woff': 'empty', '.ttf': 'empty' },
    logLevel: 'error',
    plugins: [
      {
        name: 'parity-fixture',
        setup(b) {
          b.onResolve({ filter: /.*/ }, (args) => {
            if (stubs[args.path]) return { path: args.path, namespace: 'stub' };
            if (/\?(url|worker|raw|inline)$/.test(args.path)) return { path: args.path, namespace: 'empty' };
            // the lite host's build swaps the website's error boundary
            // (vite.lite-host.config.ts); both hosts use the small one here
            if (/components\/ErrorBoundary$/.test(args.path) && !args.importer.includes('/shims/'))
              return { path: path.join(repo, 'src/liteHost/react/shims/ErrorBoundary.tsx') };
            return null;
          });
          b.onLoad({ filter: /.*/, namespace: 'stub' }, (args) => ({ contents: stubs[args.path], loader: 'jsx', resolveDir: repo }));
          b.onLoad({ filter: /.*/, namespace: 'empty' }, () => ({ contents: 'export default ""', loader: 'js' }));
        }
      }
    ]
  });
  return output.outputFiles[0].text;
}

async function runHost(browser, script, host) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  await page.route('http://host.test/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<!doctype html><meta charset="utf-8"><style>html{font-size:10px}iframe{width:100%;height:300px;border:0}</style>' })
  );
  await page.route('http://app.test/**', (route) => route.fulfill({ contentType: 'text/html', body: frameHtml }));
  await page.goto(`http://host.test/?host=${host}`);
  await page.addScriptTag({ content: script });
  const frame = await (await page.waitForSelector('#app')).contentFrame();
  // Twinkle's Coins box on the top page: confirm it like a member would.
  const buy = page.getByRole('button', { name: /Buy for 5 Coins/ });
  await buy.waitFor({ timeout: 20000 });
  // Buy turns on after the box has been visible a moment and the website saw
  // the mouse over it (useCoinConfirm.tsx).
  const box = await buy.boundingBox();
  await page.mouse.move(box.x + 2, box.y + 2);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 5 });
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => /Buy for 5 Coins/.test(b.textContent) && b.getAttribute('aria-disabled') !== 'true'), null, { timeout: 10000 });
  await buy.click();
  await frame.waitForFunction(() => window.done === true, null, { timeout: 20000 });
  const results = await frame.evaluate(() => window.results);
  const calls = await page.evaluate(() => window.__calls);
  const emits = await page.evaluate(() => window.__socketEmits);
  await page.close();
  return { results, calls, emits, errors };
}

test('the lite host answers every SDK call exactly like the twin-kle.com app frame', { timeout: 120000 }, async () => {
  const script = await bundle();
  const browser = await chromium.launch();
  try {
    const a = await runHost(browser, script, 'preview');
    const b = await runHost(browser, script, 'lite');
    assert.deepEqual(a.errors, []);
    assert.deepEqual(b.errors, []);
    const matrix = Object.keys(a.results).map((type) => ({
      type,
      same: JSON.stringify(a.results[type]) === JSON.stringify(b.results[type]),
      ok: !a.results[type].error
    }));
    console.log('PARITY ' + JSON.stringify(matrix));
    for (const type of Object.keys(a.results)) {
      assert.ok(!a.results[type].error, `${type} failed on the website host: ${JSON.stringify(a.results[type])}`);
      assert.deepEqual(b.results[type], a.results[type], `${type} differs`);
    }
    assert.equal(a.results['coins:charge'].payload.receipt.id, 'rcpt-1');
    assert.equal(b.results['world:join'].payload.session.sessionId, 'world-s1');

    // The same requests reached the server, except the lite host's
    // confirmation step for the spend.
    const strip = (calls) => calls.filter((c) => c.method !== 'createLumineAppCoinConfirmation').map((c) => {
      if (c.method !== 'requestBuildCoins') return c;
      const { coinConfirmation, ...args } = c.args;
      void coinConfirmation;
      return { ...c, args };
    });
    assert.deepEqual(strip(b.calls), strip(a.calls));
    const charge = (calls) => calls.find((c) => c.method === 'requestBuildCoins' && c.args.operation === 'charge');
    assert.equal(charge(a.calls).args.coinConfirmation, undefined);
    assert.equal(charge(b.calls).args.coinConfirmation, 'confirm-nonce-1');
    const confirmations = b.calls.filter((c) => c.method === 'createLumineAppCoinConfirmation');
    assert.equal(confirmations.length, 1);
    assert.deepEqual(confirmations[0].args, {
      buildId: BUILD_ID,
      operation: 'charge',
      payload: charge(b.calls).args.payload
    });
    // the confirmation came after the box and before the spend
    const order = b.calls.map((c) => (c.method === 'requestBuildCoins' ? c.args.operation : c.method));
    assert.ok(order.indexOf('quote') < order.indexOf('createLumineAppCoinConfirmation'));
    assert.ok(order.indexOf('createLumineAppCoinConfirmation') < order.indexOf('charge'));

    // The app-pass socket was bound before the world join, and both hosts
    // sent the same runtime socket events.
    assert.equal(b.emits[0].event, 'bind_uid_to_socket');
    assert.equal(b.emits[0].payload.token, 'app-pass');
    const runtimeEvents = (emits) => emits.filter((e) => e.event.startsWith('build_app_')).map((e) => [e.event, e.payload]);
    assert.deepEqual(runtimeEvents(b.emits), runtimeEvents(a.emits));
  } finally {
    await browser.close();
  }
});

test('the lite host never spends without its own box confirming', async () => {
  const { createLiteCoinGate } = await import('../src/liteHost/react/liteCoins.ts');
  const sent = [];
  const gate = createLiteCoinGate({
    createConfirmation: async (input) => {
      sent.push(['confirm', input.operation]);
      return { nonce: 'n1' };
    }
  });
  const request = gate.wrapRequest(() => async (args) => {
    sent.push(['request', args.operation, args.coinConfirmation || null]);
    return { ok: true };
  });
  // reads pass straight through
  await request({ buildId: 1, operation: 'quote', payload: {} });
  // a spend with no confirmed box is refused before anything is sent
  await assert.rejects(request({ buildId: 1, operation: 'charge', payload: {} }), { code: 'build_coin_cancelled' });
  // a declined box: still refused
  const declined = gate.wrapConfirm(() => async () => false);
  assert.equal(await declined({}), false);
  await assert.rejects(request({ buildId: 1, operation: 'charge', payload: {} }), { code: 'build_coin_cancelled' });
  // a confirmed box allows exactly one spend
  const confirmed = gate.wrapConfirm(() => async () => true);
  assert.equal(await confirmed({}), true);
  await request({ buildId: 1, operation: 'charge', payload: { priceId: 'gem' } });
  await assert.rejects(request({ buildId: 1, operation: 'charge', payload: {} }), { code: 'build_coin_cancelled' });
  assert.deepEqual(sent, [
    ['request', 'quote', null],
    ['confirm', 'charge'],
    ['request', 'charge', 'n1']
  ]);
});
