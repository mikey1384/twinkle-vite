import assert from 'node:assert/strict';
import test from 'node:test';
import { COUNTRY_CODES, guessCountry, isKnownCountry } from '../src/components/Build/AppAddress/checkout/countries';
import { CALLING_CODES } from '../src/components/Build/AppAddress/checkout/phone';

test('the time zone picks the country, an ambiguous or unknown one falls back to the browser region', () => {
  assert.equal(guessCountry('Asia/Seoul', 'en-US'), 'KR');
  assert.equal(guessCountry('America/Santiago', 'en-US'), 'CL');
  assert.equal(guessCountry('America/Chicago', 'ko-KR'), 'US');
  assert.equal(guessCountry('America/Toronto', 'en-US'), 'CA');
  assert.equal(guessCountry('Europe/Rome', 'en-US'), 'IT');
  assert.equal(guessCountry('America/Somewhere_New', 'es-MX'), 'MX');
  assert.equal(guessCountry('', 'en-GB'), 'GB');
  assert.equal(guessCountry('', ''), 'KR');
});

test('only real ISO countries can be chosen', () => {
  assert.equal(isKnownCountry('KR'), true);
  assert.equal(isKnownCountry('kr'), true);
  assert.equal(isKnownCountry('ZZ'), false);
  assert.equal(isKnownCountry(''), false);
  assert.ok(COUNTRY_CODES.length > 230);
  for (const code of COUNTRY_CODES) assert.match(CALLING_CODES[code], /^[1-9]\d{0,3}$/);
});
