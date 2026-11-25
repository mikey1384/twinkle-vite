import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  authorizeAppLinkRequest,
  createAppLinkGate,
  decodePunycodeLabel,
  describeAppLinkSite,
  labelMixesScripts
} from '../src/containers/Build/PreviewPanel/helpers/appLinkPolicy';
import { isMutatingPreviewRequestType } from '../src/containers/Build/PreviewPanel/helpers/previewRequestPolicy';
import { runAppLinkBridgeRequest } from '../src/containers/Build/PreviewPanel/helpers/appLinkBridge';

// Twinkle.app.openLink: the Twinkle page's own check of the link an app asks
// to open, the site name its sheet shows, and one sheet at a time.
const ORIGIN = 'https://www.twin-kle.com';
const tap = { isActive: true };
const decide = (target: unknown, extra: Record<string, any> = {}) =>
  authorizeAppLinkRequest({ currentOrigin: ORIGIN, target, userActivation: tap, ...extra });

test('only a tap opens a link; a browser that cannot tell still gets the sheet for outside sites', () => {
  const refused = authorizeAppLinkRequest({
    currentOrigin: ORIGIN,
    target: 'https://example.com',
    userActivation: { isActive: false }
  });
  assert.equal(!refused.allowed && refused.code, 'USER_ACTIVATION_REQUIRED');
  // no user-activation API (Safari before 16.4): outside links still reach
  // the sheet, whose own tap is the consent; Twinkle pages (no sheet) do not
  const unknown = authorizeAppLinkRequest({
    currentOrigin: ORIGIN,
    target: 'https://example.com',
    userActivation: null
  });
  assert.equal(unknown.allowed && unknown.kind, 'external');
  const unknownTwinkle = authorizeAppLinkRequest({
    currentOrigin: ORIGIN,
    target: `${ORIGIN}/subjects/1`,
    userActivation: null
  });
  assert.equal(!unknownTwinkle.allowed && unknownTwinkle.code, 'USER_ACTIVATION_REQUIRED');
});

test('only full http(s) addresses, without credentials, up to 2048 characters', () => {
  const refusals: Array<[unknown, string]> = [
    ['javascript:alert(1)', 'LINK_SCHEME_NOT_ALLOWED'],
    ['JavaScript:alert(1)', 'LINK_SCHEME_NOT_ALLOWED'],
    ['data:text/html,<b>hi</b>', 'LINK_SCHEME_NOT_ALLOWED'],
    ['blob:https://preview.lumine.app/1', 'LINK_SCHEME_NOT_ALLOWED'],
    ['file:///etc/passwd', 'LINK_SCHEME_NOT_ALLOWED'],
    ['mailto:a@example.com', 'LINK_SCHEME_NOT_ALLOWED'],
    ['https://user:pw@example.com/', 'LINK_HAS_CREDENTIALS'],
    ['https://user@example.com/', 'LINK_HAS_CREDENTIALS'],
    [`https://example.com/${'a'.repeat(2100)}`, 'LINK_TOO_LONG'],
    ['', 'INVALID_LINK_TARGET'],
    [42, 'INVALID_LINK_TARGET'],
    ['/subjects/1x', 'INVALID_LINK_TARGET'],
    ['example.com', 'INVALID_LINK_TARGET']
  ];
  for (const [target, code] of refusals) {
    const decision = decide(target);
    assert.equal(decision.allowed ? 'allowed' : decision.code, code, String(target).slice(0, 40));
  }
  const external = decide('  https://Example.com/moon?x=1#top ');
  assert.deepEqual(external, {
    allowed: true,
    kind: 'external',
    url: 'https://example.com/moon?x=1#top',
    site: { displayHost: 'example.com', asciiHost: null, mixedScripts: false }
  });
  const bare = decide('www.example.com/page');
  assert.equal(bare.allowed && bare.url, 'https://www.example.com/page');
  const plainHttp = decide('http://example.com:8080/');
  assert.equal(plainHttp.allowed && plainHttp.kind === 'external' && plainHttp.site.displayHost, 'example.com:8080');
});

test('Twinkle content opens in place; other Twinkle pages and the app preview are refused', () => {
  assert.deepEqual(decide('https://twin-kle.com/subjects/432?buildApiToken=x'), {
    allowed: true,
    kind: 'twinkle',
    url: `${ORIGIN}/subjects/432`
  });
  assert.deepEqual(decide(`${ORIGIN}/app/884/level-2`), {
    allowed: true,
    kind: 'twinkle',
    url: `${ORIGIN}/app/884/level-2`
  });
  for (const target of [`${ORIGIN}/settings`, 'https://www.twinkle.network/', 'http://www.twin-kle.com/subjects/1']) {
    const decision = decide(target);
    assert.equal(decision.allowed ? 'allowed' : decision.code, 'UNSUPPORTED_TWINKLE_LINK', target);
  }
  const preview = decide('https://preview.lumine.app/build/preview/build/884/current', {
    isAppPreviewUrl: (url: URL) => url.hostname === 'preview.lumine.app'
  });
  assert.equal(preview.allowed ? 'allowed' : preview.code, 'INVALID_LINK_TARGET');
});

test('the sheet shows the real host, decoded, and warns when one name mixes alphabets', () => {
  assert.equal(decodePunycodeLabel('mnchen-3ya'), 'münchen');
  assert.equal(decodePunycodeLabel('wgv71a119e'), '日本語');
  assert.equal(decodePunycodeLabel('80ak6aa92e'), 'аррӏе');
  assert.equal(decodePunycodeLabel('!!'), null);

  assert.deepEqual(describeAppLinkSite(new URL('https://xn--mnchen-3ya.de/')), {
    displayHost: 'münchen.de',
    asciiHost: 'xn--mnchen-3ya.de',
    mixedScripts: false
  });
  // a Cyrillic "а" in an otherwise Latin name
  const lookalike = describeAppLinkSite(new URL('https://xn--pple-43d.com/'));
  assert.equal(lookalike.displayHost, 'аpple.com');
  assert.equal(lookalike.asciiHost, 'xn--pple-43d.com');
  assert.equal(lookalike.mixedScripts, true);
  // an all-Cyrillic look-alike is one alphabet, but the address-bar form shows
  const cyrillic = describeAppLinkSite(new URL('https://xn--80ak6aa92e.com/'));
  assert.equal(cyrillic.asciiHost, 'xn--80ak6aa92e.com');

  assert.equal(labelMixesScripts('example'), false);
  assert.equal(labelMixesScripts('日本語abc'), false);
  assert.equal(labelMixesScripts('한국어'), false);
  assert.equal(labelMixesScripts('pаypal'), true);
  assert.equal(labelMixesScripts('αβγabc'), true);
});

test('one sheet at a time, a short pause after each, and a few per minute per app', () => {
  const gate = createAppLinkGate({ perMinute: 3, cooldownMs: 1500 });
  assert.deepEqual(gate.begin('1', 0), { allowed: true });
  const busy = gate.begin('2', 10);
  assert.equal(!busy.allowed && busy.code, 'LINK_CONFIRM_IN_PROGRESS');
  gate.end('1', 100);
  const tooSoon = gate.begin('1', 900);
  assert.equal(!tooSoon.allowed && tooSoon.code, 'LINK_RATE_LIMITED');
  // another app is not held back by this one's pause
  assert.deepEqual(gate.begin('2', 900), { allowed: true });
  gate.end('2', 950);
  assert.deepEqual(gate.begin('1', 1700), { allowed: true });
  gate.end('1', 1800);
  assert.deepEqual(gate.begin('1', 3400), { allowed: true });
  gate.end('1', 3500);
  const fourth = gate.begin('1', 5100);
  assert.equal(!fourth.allowed && fourth.code, 'LINK_RATE_LIMITED');
  assert.deepEqual(gate.begin('1', 61_000), { allowed: true });
});

test('the bridge: captures answer "not opened" with no sheet; the tap is read as this page sees it', async () => {
  assert.equal(isMutatingPreviewRequestType('app:open-link'), true);
  const calls: any[] = [];
  const handleAppLink = async (request: any) => {
    calls.push(request);
    return { navigateUrl: null, response: { opened: true, target: 'external' as const } };
  };
  assert.deepEqual(
    await runAppLinkBridgeRequest({ payload: { url: 'https://example.com' }, capture: true, userActivationApi: { isActive: true }, handleAppLink }),
    { navigateUrl: null, response: { opened: false, target: 'external' } }
  );
  assert.equal(calls.length, 0, 'no sheet, no count in a capture');
  await runAppLinkBridgeRequest({ payload: { url: 'https://example.com' }, capture: false, userActivationApi: { isActive: true }, handleAppLink });
  await runAppLinkBridgeRequest({ payload: { url: 'https://example.com' }, capture: false, userActivationApi: undefined, handleAppLink });
  assert.deepEqual(calls.map((call) => call.userActivation), [{ isActive: true }, null]);
  await assert.rejects(
    runAppLinkBridgeRequest({ payload: {}, capture: false, userActivationApi: { isActive: true }, handleAppLink: null }),
    (error: any) => error.code === 'LINK_UNAVAILABLE'
  );
  const source = readFileSync(
    new URL('../src/containers/Build/PreviewPanel/hooks/useHostBridge.ts', import.meta.url),
    'utf8'
  );
  assert.match(
    source,
    /case 'app:open-link': \{[\s\S]*?runAppLinkBridgeRequest\(\{[\s\S]*?capture: Boolean\(captureScratchStore\)[\s\S]*?userActivationApi: navigator\.userActivation[\s\S]*?requestBuildAppLinkRef\?\.current[\s\S]*?normalizeAllowedBuildPreviewFrameSrc[\s\S]*?pendingHostNavigationUrl = linkResult\.navigateUrl[\s\S]*?response = linkResult\.response;/
  );
});
