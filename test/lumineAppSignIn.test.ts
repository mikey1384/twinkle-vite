// "Sign in with Twinkle" for Lumine apps on their own address (review fix B1,
// 11-25): a code only ever goes to the app's own origin, and the lite host
// binds and trades it with its exact return URL; two tabs refreshing at once
// share the winner's tokens instead of signing the member out.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  cancelRedirectTarget,
  codeRedirectTarget,
  sameOriginUrl
} from '../src/containers/LumineAppSignIn/handBack';

const ORIGIN = 'https://cool-game.lumine.app';

test('return URLs are compared by parsed origin, never by prefix', () => {
  assert.equal(sameOriginUrl(`${ORIGIN}/play?x=1#frag`, ORIGIN)?.toString(), `${ORIGIN}/play?x=1`);
  for (const bad of [
    'https://cool-game.lumine.app.evil.example/',
    'https://cool-game.lumine.app@evil.example/',
    'https://user:pw@cool-game.lumine.app/',
    'http://cool-game.lumine.app/',
    'https://cool-game.lumine.app:8443/',
    'javascript:alert(1)',
    '//evil.example/',
    ''
  ]) {
    assert.equal(sameOriginUrl(bad, ORIGIN), null, bad);
  }
});

test('the code redirect is built only from the API’s normalized origin and bound return URL', () => {
  assert.equal(
    codeRedirectTarget({ requestedOrigin: ORIGIN, apiOrigin: ORIGIN, apiReturnUrl: `${ORIGIN}/play` })?.toString(),
    `${ORIGIN}/play`
  );
  // the API answered for another origin than this page was opened for
  assert.equal(codeRedirectTarget({ requestedOrigin: ORIGIN, apiOrigin: 'https://evil.example', apiReturnUrl: 'https://evil.example/' }), null);
  // an API return URL that is not on its origin is never followed
  assert.equal(codeRedirectTarget({ requestedOrigin: ORIGIN, apiOrigin: ORIGIN, apiReturnUrl: 'https://cool-game.lumine.app.evil.example/' }), null);
  assert.equal(codeRedirectTarget({ requestedOrigin: ORIGIN, apiOrigin: ORIGIN, apiReturnUrl: 'https://cool-game.lumine.app@evil.example/' }), null);
  assert.equal(codeRedirectTarget({ requestedOrigin: ORIGIN, apiOrigin: ORIGIN, apiReturnUrl: '' })?.toString(), `${ORIGIN}/`);
});

test('cancel goes back to the app only', () => {
  assert.equal(cancelRedirectTarget({ origin: ORIGIN, returnUrl: `${ORIGIN}/play` })?.toString(), `${ORIGIN}/play`);
  assert.equal(cancelRedirectTarget({ origin: ORIGIN, returnUrl: 'https://cool-game.lumine.app.evil.example/' })?.toString(), `${ORIGIN}/`);
  assert.equal(cancelRedirectTarget({ origin: 'not a url', returnUrl: 'https://evil.example/' }), null);
});

test('the sign-in page never reads a mode or a raw return URL to deliver a code', () => {
  const source = readFileSync(new URL('../src/containers/LumineAppSignIn/index.tsx', import.meta.url), 'utf8');
  assert.ok(!/params\.get\('mode'\)/.test(source));
  assert.ok(!/startsWith\(origin\)/.test(source));
  assert.match(source, /codeRedirectTarget\(/);
  assert.match(source, /authorizeAppSignin\(\{ buildId, origin, codeChallenge: challenge, returnUrl \}\)/);
});

// --- lite host session store ----------------------------------------------

function installBrowser({ responses }: { responses: Array<(body: any) => { status: number; body: any }> }) {
  const store = new Map<string, string>();
  const requests: Array<{ path: string; body: any }> = [];
  const g: any = globalThis;
  const previous = { window: g.window, fetch: g.fetch, history: g.history };
  g.window = {
    localStorage: {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => store.set(k, String(v)),
      removeItem: (k: string) => store.delete(k)
    },
    location: { href: `${ORIGIN}/play#lumine_code=c1&state=s1`, origin: ORIGIN, hash: '#lumine_code=c1&state=s1', pathname: '/play', search: '' },
    setTimeout: (fn: () => void) => setTimeout(fn, 0)
  };
  g.history = { replaceState: () => undefined };
  g.fetch = async (url: string, init: any) => {
    const body = JSON.parse(init.body || '{}');
    requests.push({ path: new URL(url).pathname, body });
    const next = responses.shift();
    const answer = next ? next(body) : { status: 500, body: {} };
    return { ok: answer.status < 400, status: answer.status, json: async () => answer.body };
  };
  return {
    store,
    requests,
    restore() {
      g.window = previous.window;
      g.fetch = previous.fetch;
      g.history = previous.history;
    }
  };
}

const config: any = { buildId: 42, apiOrigin: 'https://api.example', siteOrigin: 'https://www.twin-kle.com' };
const sessionFor = (refreshToken: string, expiresAt: number) => ({
  accessToken: `a-${refreshToken}`,
  expiresAt,
  refreshToken,
  user: { id: 7, username: 'kid' },
  scopes: []
});

test('a redirect sign-in trades the code with the exact return URL it was bound to', async () => {
  const browser = installBrowser({
    responses: [() => ({ status: 200, body: sessionFor('r1', Math.floor(Date.now() / 1000) + 3600) })]
  });
  try {
    browser.store.set('lumine-app-pkce:42', JSON.stringify({ verifier: 'v', state: 's1', returnUrl: `${ORIGIN}/play` }));
    const { createSessionStore } = await import('../src/liteHost/session');
    const session = await createSessionStore(config).completeRedirect();
    assert.equal(session?.refreshToken, 'r1');
    assert.deepEqual(browser.requests[0], {
      path: '/build/app-session/token',
      body: { buildId: 42, code: 'c1', codeVerifier: 'v', redirectUri: `${ORIGIN}/play` }
    });
  } finally {
    browser.restore();
  }
});

test('two tabs refreshing: the loser (409) picks up the winner’s tokens and stays signed in', async () => {
  const now = Math.floor(Date.now() / 1000);
  let browser: ReturnType<typeof installBrowser>;
  browser = installBrowser({
    responses: [
      () => {
        // the other tab won a moment ago and saved its new session
        browser.store.set('lumine-app-session:42', JSON.stringify(sessionFor('r2', now + 3600)));
        return { status: 409, body: { error: 'Already refreshed', code: 'refresh_raced' } };
      }
    ]
  });
  try {
    browser.store.set('lumine-app-session:42', JSON.stringify(sessionFor('r1', now - 10)));
    const { createSessionStore } = await import('../src/liteHost/session');
    const store = createSessionStore(config);
    const token = await store.accessToken();
    assert.equal(token, 'a-r2');
    assert.equal(store.get()?.refreshToken, 'r2');
    assert.equal(browser.requests.length, 1);
    assert.equal(JSON.parse(browser.store.get('lumine-app-session:42')!).refreshToken, 'r2');
  } finally {
    browser.restore();
  }
});
