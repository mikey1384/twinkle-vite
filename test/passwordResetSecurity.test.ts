import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const requestHelpersSource = readFileSync(
  new URL('../src/contexts/requestHelpers/user.ts', import.meta.url),
  'utf8'
);
const contentSource = readFileSync(
  new URL('../src/containers/ResetPassword/Content.tsx', import.meta.url),
  'utf8'
);
const passwordFormSource = readFileSync(
  new URL('../src/containers/ResetPassword/PasswordForm.tsx', import.meta.url),
  'utf8'
);

test('password recovery submits the email proof instead of a public user id', () => {
  const helperStart = requestHelpersSource.indexOf('async changePassword({');
  const helperEnd = requestHelpersSource.indexOf(
    'async changePasswordFromStore',
    helperStart
  );
  const helperSource = requestHelpersSource.slice(helperStart, helperEnd);

  assert.match(helperSource, /\/user\/password\/reset/);
  assert.match(helperSource, /resetToken/);
  assert.doesNotMatch(helperSource, /\/user\/password[`'"]/);
  assert.doesNotMatch(helperSource, /userId/);
});

test('reset form retains the verified link and hydrates login from reset response', () => {
  assert.match(contentSource, /const resetToken = token\.replace/);
  assert.match(contentSource, /<PasswordForm resetToken=\{resetToken\}/);
  assert.match(
    passwordFormSource,
    /const \{ profilePicUrl, userId, username \} = await changePassword/
  );
  assert.match(passwordFormSource, /password,\s*resetToken/);
  assert.match(passwordFormSource, /onLogin\(\{ userId, username \}\)/);
});
