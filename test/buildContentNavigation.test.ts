import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  authorizeTwinkleContentNavigation,
  createTwinkleContentNavigationConfirmationController,
  normalizeTwinkleContentNavigationUrl
} from '../src/containers/Build/PreviewPanel/helpers/twinkleContentNavigation';

const CURRENT_ORIGIN = 'https://www.twin-kle.com';

function readSource(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('Build content navigation authorizes only active gestures with valid content', () => {
  assert.deepEqual(
    authorizeTwinkleContentNavigation({
      currentOrigin: CURRENT_ORIGIN,
      target: '/subjects/42',
      userActivation: { isActive: false }
    }),
    {
      allowed: false,
      code: 'USER_ACTIVATION_REQUIRED',
      message: 'Twinkle content can only be opened from a user action'
    }
  );
  assert.deepEqual(
    authorizeTwinkleContentNavigation({
      currentOrigin: CURRENT_ORIGIN,
      target: '/build/preview/build/884/current',
      userActivation: { isActive: true }
    }),
    {
      allowed: false,
      code: 'INVALID_CONTENT_NAVIGATION_TARGET',
      message: 'Navigation target must be a Twinkle content URL'
    }
  );
  assert.deepEqual(
    authorizeTwinkleContentNavigation({
      currentOrigin: CURRENT_ORIGIN,
      target: '/subjects/42',
      userActivation: { isActive: true }
    }),
    { allowed: true, url: `${CURRENT_ORIGIN}/subjects/42` }
  );
});

test('Build content navigation requires destination-specific parent confirmation', async () => {
  const controller = createTwinkleContentNavigationConfirmationController();
  const url = `${CURRENT_ORIGIN}/subjects/42`;

  assert.deepEqual(
    await controller.request({
      requestConfirmation: async (request) => request.url === url,
      url
    }),
    { confirmed: true, url }
  );
  assert.deepEqual(
    await controller.request({
      requestConfirmation: async () => false,
      url
    }),
    {
      confirmed: false,
      code: 'CONTENT_NAVIGATION_CANCELLED',
      message: 'Content navigation was cancelled'
    }
  );
  assert.deepEqual(
    await controller.request({ requestConfirmation: null, url }),
    {
      confirmed: false,
      code: 'CONTENT_NAVIGATION_CONFIRMATION_UNAVAILABLE',
      message: 'Content navigation confirmation is unavailable'
    }
  );
});

test('Build content navigation cannot replace an active confirmation', async () => {
  const controller = createTwinkleContentNavigationConfirmationController();
  let resolveFirstConfirmation: ((confirmed: boolean) => void) | null = null;
  const displayedDestinations: string[] = [];
  const firstRequest = controller.request({
    requestConfirmation: ({ url }) => {
      displayedDestinations.push(url);
      return new Promise<boolean>((resolve) => {
        resolveFirstConfirmation = resolve;
      });
    },
    url: `${CURRENT_ORIGIN}/subjects/42`
  });

  assert.deepEqual(
    await controller.request({
      requestConfirmation: async ({ url }) => {
        displayedDestinations.push(url);
        return true;
      },
      url: `${CURRENT_ORIGIN}/comments/43`
    }),
    {
      confirmed: false,
      code: 'CONTENT_NAVIGATION_CONFIRMATION_PENDING',
      message: 'Another content navigation confirmation is already open'
    }
  );
  assert.deepEqual(displayedDestinations, [`${CURRENT_ORIGIN}/subjects/42`]);
  assert.ok(resolveFirstConfirmation);
  resolveFirstConfirmation(true);
  assert.deepEqual(await firstRequest, {
    confirmed: true,
    url: `${CURRENT_ORIGIN}/subjects/42`
  });
});

test('Build content navigation releases its confirmation lock after callback failure', async () => {
  const controller = createTwinkleContentNavigationConfirmationController();
  const url = `${CURRENT_ORIGIN}/subjects/42`;
  await assert.rejects(
    controller.request({
      requestConfirmation: async () => {
        throw new Error('Confirmation UI failed');
      },
      url
    }),
    /Confirmation UI failed/
  );
  assert.deepEqual(
    await controller.request({
      requestConfirmation: async () => true,
      url
    }),
    { confirmed: true, url }
  );
});

test('Build content navigation accepts every public content detail route', () => {
  const paths = [
    '/achievement-unlocks/1',
    '/achievements/teenager',
    '/ai-stories/2',
    '/app/3/book-slug',
    '/comments/4',
    '/daily-reflections/5',
    '/daily-rewards/6',
    '/links/7',
    '/mission-passes/8',
    '/missions/grammar/workshop',
    '/playlists/9/lesson',
    '/shared-prompts/10',
    '/subjects/11',
    '/users/mikey/books',
    '/videos/12/questions'
  ];

  for (const path of paths) {
    assert.equal(
      normalizeTwinkleContentNavigationUrl({
        currentOrigin: CURRENT_ORIGIN,
        target: path
      }),
      `${CURRENT_ORIGIN}${path}`
    );
  }
});

test('Build content navigation canonicalizes aliases and AI Card links', () => {
  for (const alias of ['apps', 'build', 'builds']) {
    assert.equal(
      normalizeTwinkleContentNavigationUrl({
        currentOrigin: CURRENT_ORIGIN,
        target: `/${alias}/1168/word-lab`
      }),
      `${CURRENT_ORIGIN}/app/1168/word-lab`
    );
  }
  assert.equal(
    normalizeTwinkleContentNavigationUrl({
      currentOrigin: CURRENT_ORIGIN,
      target: '/ai-cards/42'
    }),
    `${CURRENT_ORIGIN}/ai-cards/?cardId=42`
  );
  assert.equal(
    normalizeTwinkleContentNavigationUrl({
      currentOrigin: CURRENT_ORIGIN,
      target: '/ai-cards/42?cardId=not-the-canonical-card'
    }),
    `${CURRENT_ORIGIN}/ai-cards/?cardId=42`
  );
  assert.equal(
    normalizeTwinkleContentNavigationUrl({
      currentOrigin: CURRENT_ORIGIN,
      target: '/chat/ai-cards?cardId=43'
    }),
    `${CURRENT_ORIGIN}/ai-cards/?cardId=43`
  );
  assert.equal(
    normalizeTwinkleContentNavigationUrl({
      currentOrigin: CURRENT_ORIGIN,
      target:
        '/ai-cards/?search[owner]=mikey&search[isBuyNow]=true'
    }),
    `${CURRENT_ORIGIN}/ai-cards/?search%5Bowner%5D=mikey&search%5BisBuyNow%5D=true`
  );
  assert.equal(
    normalizeTwinkleContentNavigationUrl({
      currentOrigin: CURRENT_ORIGIN,
      target: '/chat/ai-cards?search[isMystery]=true'
    }),
    `${CURRENT_ORIGIN}/ai-cards/?search%5BisMystery%5D=true`
  );
});

test('Build content navigation accepts canonical public chat deep links', () => {
  for (const path of [
    '/chat/1000042',
    '/chat/1000042/project%20ideas',
    '/chat/1000042/topic/91',
    '/chat/1000042/project%20ideas/topic/91'
  ]) {
    assert.equal(
      normalizeTwinkleContentNavigationUrl({
        currentOrigin: CURRENT_ORIGIN,
        target: path
      }),
      `${CURRENT_ORIGIN}${path}`
    );
  }
});

test('confirmed Build content navigation stays inside the Twinkle SPA', () => {
  const previewPanelSource = readSource(
    'src/containers/Build/PreviewPanel/index.tsx'
  );
  const hostBridgeSource = readSource(
    'src/containers/Build/PreviewPanel/hooks/useHostBridge.ts'
  );

  assert.match(
    previewPanelSource,
    /const navigateHostContentRef = useRef[\s\S]*?navigateHostContentRef\.current = \(url: string\)[\s\S]*?navigate\(\s*`\$\{destination\.pathname\}\$\{destination\.search\}\$\{destination\.hash\}`/m
  );
  assert.match(
    hostBridgeSource,
    /if \(pendingHostNavigationUrl\) \{\s*window\.setTimeout\(\(\) => \{\s*navigateHostContentRef\.current\(pendingHostNavigationUrl\);/m
  );
  assert.doesNotMatch(
    hostBridgeSource,
    /window\.location\.assign\(pendingHostNavigationUrl\)/
  );
});

test('Build content navigation preserves the signed-in origin and strips preview controls', () => {
  assert.equal(
    normalizeTwinkleContentNavigationUrl({
      currentOrigin: 'http://localhost:5173',
      target:
        'https://twinkle.network/app/1168/word-lab?mode=read&embedded=1&buildApiToken=secret#page-2'
    }),
    'http://localhost:5173/app/1168/word-lab?mode=read#page-2'
  );
});

test('Build content navigation rejects preview, privileged, malformed, and external routes', () => {
  for (const target of [
    '/app',
    '/app/not-a-build',
    '/app-capture/1168',
    '/build/preview/build/1168/index.html',
    '/build/preview',
    '/cli/login',
    '/management/builds',
    '/settings/account',
    '/chat/not-a-channel',
    '/chat/1000042/topic/not-a-topic',
    '/chat/1000042/project-ideas/not-a-route',
    '/ai-cards/not-a-card',
    '/ai-cards?cardId=',
    '/ai-cards?cardId=not-a-card',
    '/ai-cards?cardId=42&cardId=43',
    '/subjects/not-an-id',
    'https://example.com/app/1168',
    'javascript:alert(1)'
  ]) {
    assert.equal(
      normalizeTwinkleContentNavigationUrl({
        currentOrigin: CURRENT_ORIGIN,
        target
      }),
      '',
      target
    );
  }
});
