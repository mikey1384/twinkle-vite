import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createUnauthorizedSessionResolver } from '../src/helpers/sessionUnauthorizedGuard';

const canonicalSessionUrl = 'https://api.twinkle.network/user/session';

function unauthorizedError({
  token,
  url = 'https://api.twinkle.network/build/42/api/private-db/get',
  includeAuthorization = true
}: {
  token?: string;
  url?: string;
  includeAuthorization?: boolean;
} = {}) {
  return {
    config: {
      url,
      headers: includeAuthorization ? { Authorization: token || '' } : undefined
    },
    response: { status: 401, data: {} }
  };
}

test('a route-specific 401 preserves a canonically valid session', async () => {
  let validationCalls = 0;
  const resolve = createUnauthorizedSessionResolver({
    canonicalSessionUrl,
    getCurrentToken: () => 'interactive-token',
    validateSessionToken: async () => {
      validationCalls += 1;
      return 'valid';
    }
  });

  assert.equal(
    await resolve(unauthorizedError({ token: 'interactive-token' })),
    null
  );
  assert.equal(validationCalls, 1);
});

test('a late 401 from an older token cannot invalidate a new login', async () => {
  let validationCalls = 0;
  const resolve = createUnauthorizedSessionResolver({
    canonicalSessionUrl,
    getCurrentToken: () => 'new-login-token',
    validateSessionToken: async () => {
      validationCalls += 1;
      return 'invalid';
    }
  });

  assert.equal(await resolve(unauthorizedError({ token: 'old-token' })), null);
  assert.equal(validationCalls, 0);
});

test('the canonical session 401 invalidates only its matching token', async () => {
  let validationCalls = 0;
  const resolve = createUnauthorizedSessionResolver({
    canonicalSessionUrl,
    getCurrentToken: () => 'interactive-token',
    validateSessionToken: async () => {
      validationCalls += 1;
      return 'valid';
    }
  });

  assert.equal(
    await resolve(
      unauthorizedError({
        token: 'Bearer interactive-token',
        url: `${canonicalSessionUrl}?_retry=1`
      })
    ),
    'interactive-token'
  );
  assert.equal(validationCalls, 0);
});

test('an unowned 401 uses canonical validation instead of guessing', async () => {
  const results: Array<'valid' | 'invalid' | 'unknown'> = [
    'valid',
    'invalid',
    'unknown'
  ];
  const resolve = createUnauthorizedSessionResolver({
    canonicalSessionUrl,
    getCurrentToken: () => 'interactive-token',
    validateSessionToken: async () => results.shift() || 'unknown'
  });
  const error = unauthorizedError({ includeAuthorization: false });

  assert.equal(await resolve(error), null);
  assert.equal(await resolve(error), 'interactive-token');
  assert.equal(await resolve(error), null);
});

test('concurrent 401s share one canonical validation', async () => {
  let currentToken = 'interactive-token';
  let validationCalls = 0;
  let finishValidation: (result: 'invalid') => void = () => undefined;
  const validationResult = new Promise<'invalid'>((resolve) => {
    finishValidation = resolve;
  });
  const resolve = createUnauthorizedSessionResolver({
    canonicalSessionUrl,
    getCurrentToken: () => currentToken,
    validateSessionToken: async () => {
      validationCalls += 1;
      return validationResult;
    }
  });
  const error = unauthorizedError({ token: currentToken });

  const first = resolve(error);
  const second = resolve(error);
  await Promise.resolve();
  assert.equal(validationCalls, 1);

  currentToken = 'new-login-token';
  finishValidation('invalid');
  assert.deepEqual(await Promise.all([first, second]), [null, null]);
});

test('transport uncertainty never destroys the current session', async () => {
  const resolve = createUnauthorizedSessionResolver({
    canonicalSessionUrl,
    getCurrentToken: () => 'interactive-token',
    validateSessionToken: async () => {
      throw new Error('network unavailable');
    }
  });

  assert.equal(
    await resolve(unauthorizedError({ token: 'interactive-token' })),
    null
  );
});

test('the global 401 boundary clears only the resolver-confirmed current token', () => {
  const appContext = readFileSync(
    new URL('../src/contexts/AppContext.tsx', import.meta.url),
    'utf8'
  );

  assert.match(appContext, /await resolveInvalidSessionToken\(error\)/);
  assert.match(appContext, /getStoredItem\('token'\) === invalidSessionToken/);
  assert.doesNotMatch(
    appContext,
    /if \(status === 401\) \{\s*removeStoredItem\('token'\)/
  );
  assert.match(appContext, /\/user\/session\/validate/);
  assert.match(appContext, /response\.data\?\.valid === true/);
});
