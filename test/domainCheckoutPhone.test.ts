import assert from 'node:assert/strict';
import test from 'node:test';
import { draftFromPhone, splitInternational, toE164 } from '../src/components/Build/AppAddress/checkout/phone';

// The API's registrant rule (twinkle-api helpers/build/appHosting/registrar.ts)
const API_E164 = /^\+[1-9]\d{7,14}$/;

const cases: Array<[string, string, string]> = [
  ['KR', '010-1234-5678', '+821012345678'],
  ['KR', '10 1234 5678', '+821012345678'],
  ['US', '(415) 555-0100', '+14155550100'],
  ['US', '1 415 555 0100', '+14155550100'],
  ['CA', '604 555 0100', '+16045550100'],
  ['IL', '050-123-4567', '+972501234567'],
  ['IT', '02 1234 5678', '+390212345678'],
  ['GB', '07911 123456', '+447911123456'],
  ['RU', '8 912 345 67 89', '+79123456789'],
  ['JP', '090-1234-5678', '+819012345678'],
  ['HU', '06 20 123 4567', '+36201234567'],
  ['HU', '20 123 4567', '+36201234567'],
  ['CI', '07 07 12 34 56', '+2250707123456'],
  ['KR', '02-123-4567', '+8221234567']
];

test('a calling code plus the number as typed makes exactly the E.164 number meant', () => {
  for (const [country, national, expected] of cases) {
    const number = toE164({ country, national });
    assert.equal(number, expected, `${country} ${national}`);
    assert.match(number, API_E164);
  }
});

test('an incomplete number is not a number yet', () => {
  assert.equal(toE164({ country: 'KR', national: '' }), '');
  assert.equal(toE164({ country: 'KR', national: '010' }), '');
  assert.equal(toE164({ country: 'US', national: '555 01' }), '');
  // +141555501: a +1 number is always 10 digits
  assert.equal(toE164({ country: 'US', national: '41555501' }), '');
  assert.equal(toE164(splitInternational('+141555501', 'KR')!), '');
  assert.equal(toE164({ country: 'GB', national: '07911 1234' }), '');
});

test('a pasted international number moves its code to the picker, without a second prefix', () => {
  assert.deepEqual(splitInternational('+1 415 555 0100', 'KR'), { country: 'US', national: '4155550100' });
  assert.deepEqual(splitInternational('+1 604 555 0100', 'CA'), { country: 'CA', national: '6045550100' });
  assert.deepEqual(splitInternational('+82 10-1234-5678', 'US'), { country: 'KR', national: '1012345678' });
  assert.deepEqual(splitInternational('0044 20 7946 0958', 'KR'), { country: 'GB', national: '2079460958' });
  assert.deepEqual(splitInternational('+972 50 123 4567', 'KR'), { country: 'IL', national: '501234567' });
  assert.equal(splitInternational('010 1234 5678', 'KR'), null);
  const pasted = splitInternational('+1 415 555 0100', 'KR');
  assert.equal(toE164(pasted!), '+14155550100');
});

test('choosing +1 on an empty field keeps +1 for the number typed next', () => {
  const draft = { country: 'US', national: '' };
  assert.equal(toE164({ ...draft, national: '415 555 0100' }), '+14155550100');
});

test('an earlier answer comes back as the same draft', () => {
  assert.deepEqual(draftFromPhone('+821012345678', 'US'), { country: 'KR', national: '1012345678' });
  assert.deepEqual(draftFromPhone('', 'KR'), { country: 'KR', national: '' });
});
