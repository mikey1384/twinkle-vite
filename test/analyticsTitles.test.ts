import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { buildSync } from 'esbuild';
import { getBasePageTitle } from '../src/helpers/pageTitles';

test('page titles use readable names for routes and content details', () => {
  const cases = [
    ['/', 'Twinkle'],
    ['/daily-reflection', 'Daily Reflection | Twinkle'],
    ['/daily-reflections/12445', 'Daily Reflection | Twinkle'],
    ['/bridge-builder/stories/9', 'Bridge Builder | Twinkle'],
    ['/bridge-builder/grown-up?token=secret&lang=ko', 'Bridge Builder | Twinkle'],
    ['/bridge-steps/123', 'Bridge Step | Twinkle'],
    ['/achievements/bridge-builder/crew/9', 'Bridge Builder | Twinkle'],
    ['/achievements/bridge-builder/emails', 'Bridge Builder | Twinkle'],
    ['/bridge/c/secret-checkin-token', 'Bridge Builder Check-in | Twinkle'],
    ['/cli?code=ABCD-1234', 'Connect Lumine | Twinkle'],
    ['/reset/password/secret', 'Reset Password | Twinkle'],
    ['/verify/email/secret', 'Email Verification | Twinkle'],
    ['/signup/guardian?token=secret', 'Guardian Consent | Twinkle'],
    ['/ai-cards', 'Explore AI Cards | Twinkle'],
    ['/ai-cards/123', 'AI Card | Twinkle'],
    ['/ai-card-summons/123', 'AI Card Summon | Twinkle'],
    ['/ai-stories/123', 'AI Story | Twinkle'],
    ['/mission-passes/123', 'Mission Pass | Twinkle'],
    ['/achievement-unlocks/123', 'Achievement | Twinkle'],
    ['/daily-rewards/123', 'Daily Goal | Twinkle'],
    ['/shared-prompts/123', 'Shared Prompt | Twinkle'],
    ['/build/123/2', 'Build | Twinkle'],
    ['/app/123/game', 'Build App | Twinkle'],
    ['/chat/123/topic/456', 'Chat | Twinkle'],
    ['/management/ai-costs', 'Management | Twinkle'],
    ['/users/member-name', 'Users | Twinkle']
  ];
  for (const [path, expected] of cases) {
    assert.equal(getBasePageTitle(path), expected, path);
  }
});

test('trailing slashes, casing and query strings do not split a page title', () => {
  for (const path of ['/daily-reflection', '/ai-cards', '/videos', '/missions']) {
    const expected = getBasePageTitle(path);
    assert.equal(getBasePageTitle(`${path}/`), expected);
    assert.equal(getBasePageTitle(path.toUpperCase()), expected);
    assert.equal(getBasePageTitle(`${path}?q=example#section`), expected);
  }
  assert.equal(getBasePageTitle('/videos/123/'), 'Video | Twinkle');
  assert.equal(getBasePageTitle('/achievements/bridge-builderish'), 'Achievements | Twinkle');
});

test('unknown paths and legacy username redirects never become report titles', () => {
  for (const path of [
    '/member-name',
    '/another_member_name/profile',
    '/unmapped-internal-route',
    '/constructor',
    '/toString',
    '/__proto__'
  ]) {
    assert.equal(getBasePageTitle(path), 'Twinkle', path);
  }
});

test('every registered app route has a named title before async data loads', () => {
  const app = readFileSync(
    new URL('../src/containers/App/index.tsx', import.meta.url),
    'utf8'
  );
  const paths = [...app.matchAll(/<Route\b[^>]*\bpath="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((path) => path.startsWith('/') && path !== '/' && !path.startsWith('/:'));
  assert.ok(paths.length > 40, 'audit covers the registered outer app routes');
  for (const path of paths) {
    assert.notEqual(getBasePageTitle(path), 'Twinkle', `Add a readable title for ${path}`);
  }
});

// Exercise the real analytics sender with a local gtag recorder. No request
// leaves the test, and content/notification tab titles cannot affect the hit.
const analyticsBundle = buildSync({
  entryPoints: [fileURLToPath(new URL('../src/helpers/analytics.ts', import.meta.url))],
  tsconfig: fileURLToPath(new URL('../tsconfig.json', import.meta.url)),
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'analytics',
  define: { 'import.meta.env.PROD': 'true' }
}).outputFiles[0].text;

function createAnalyticsRecorder(hostname = 'www.twin-kle.com') {
  const calls: any[][] = [];
  const origin = `https://${hostname}`;
  const context = vm.createContext({
    URL,
    document: { referrer: '', title: 'Unrelated content title | Twinkle *' },
    window: {
      location: { hostname, origin },
      twinkleAnalyticsEnabled: true,
      twinkleAnalyticsIdentityReady: true,
      twinkleAnalyticsUrl: (input: string) => `${origin}${new URL(input, origin).pathname}`,
      gtag: (...args: any[]) => calls.push(JSON.parse(JSON.stringify(args)))
    }
  });
  vm.runInContext(analyticsBundle, context);
  return { calls, analytics: context.analytics };
}

test('page views and subsequent events share the readable title', () => {
  const { calls, analytics } = createAnalyticsRecorder();
  analytics.trackPageView({ path: '/daily-reflection?source=home' });
  analytics.trackEvent('daily_reflection_submit');
  analytics.trackPageView({ path: '/bridge-steps/123', referrerPath: '/daily-reflection' });

  assert.equal(calls[0][0], 'set');
  assert.equal(calls[0][1].page_title, 'Daily Reflection | Twinkle');
  assert.equal(calls[1][1], 'page_view');
  assert.equal(calls[1][2].page_title, calls[0][1].page_title);
  assert.equal(calls[1][2].page_path, '/daily-reflection');
  assert.equal(calls[2][1], 'daily_reflection_submit');
  assert.equal(calls[3][1].page_title, 'Bridge Step | Twinkle');
  assert.equal(calls[4][2].page_title, calls[3][1].page_title);
  assert.equal(calls[4][2].page_referrer, 'https://www.twin-kle.com/daily-reflection');
  assert.equal(calls.filter((call) => call[1] === 'page_view').length, 2);
});

test('Lumine titles keep their host branding and capture pages remain excluded', () => {
  const { calls, analytics } = createAnalyticsRecorder('www.lumine.network');
  analytics.trackPageView({ path: '/daily-reflection' });
  assert.equal(calls[0][1].page_title, 'Daily Reflection | Lumine');
  assert.equal(calls[1][2].page_title, 'Daily Reflection | Lumine');
  analytics.trackPageView({ path: '/app-capture/123' });
  assert.equal(calls.length, 2);
});
