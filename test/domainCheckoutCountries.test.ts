import assert from 'node:assert/strict';
import test from 'node:test';
import {
  COUNTRY_CODES,
  countryInStateField,
  guessCountry,
  isAutofillChange,
  isKnownCountry,
  matchCountry
} from '../src/components/Build/AppAddress/checkout/countries';
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

test('countryInStateField moves autofilled countries but preserves typed values, US territories, and country-named provinces', () => {
  // Autofilled country names move to Country
  assert.equal(countryInStateField('South Korea', { autofilled: true }), 'KR');
  assert.equal(countryInStateField('대한민국', { autofilled: true }), 'KR');
  assert.equal(countryInStateField('United States', { autofilled: true }), 'US');

  // Typing never switches countries (e.g. typing "India" on the way to "Indiana")
  assert.equal(countryInStateField('India', { autofilled: false }), '');
  assert.equal(countryInStateField('South Korea', { autofilled: false }), '');

  // Two-letter state codes and UK nations stay in State
  assert.equal(countryInStateField('CA', { autofilled: true }), '');
  assert.equal(countryInStateField('IN', { autofilled: true }), '');
  assert.equal(countryInStateField('Scotland', { autofilled: true }), '');

  // US states/territories and country-named provinces stay in State
  for (const state of [
    'Georgia',
    'Jersey',
    'Puerto Rico',
    'Guam',
    'American Samoa',
    'Northern Mariana Islands',
    'U.S. Virgin Islands',
    'Mexico',
    'Luxembourg',
    'Panama',
    'Guatemala'
  ]) {
    assert.equal(countryInStateField(state, { autofilled: true }), '', state);
  }
});

test('isAutofillChange accepts browser autofill and rejects typing or focused mobile autocorrect', () => {
  assert.equal(isAutofillChange(null), false);
  assert.equal(isAutofillChange(undefined), false);
  // Chrome/Firefox autofill has no inputType
  assert.equal(isAutofillChange({ inputType: undefined } as unknown as Event), true);
  assert.equal(isAutofillChange({ inputType: '' } as unknown as Event), true);
  // Typing / pasting / deleting are not autofill
  assert.equal(isAutofillChange({ inputType: 'insertText' } as unknown as Event), false);
  assert.equal(isAutofillChange({ inputType: 'insertFromPaste' } as unknown as Event), false);

  const prevDoc = (globalThis as any).document;
  try {
    const focusedInput = { matches: () => false };
    const otherInput = { matches: () => false };
    const autofilledInput = { matches: (sel: string) => sel === ':-webkit-autofill' };
    (globalThis as any).document = { activeElement: focusedInput };

    // Mobile autocorrect / spellcheck on focused input: must NOT count as autofill
    assert.equal(
      isAutofillChange({ inputType: 'insertReplacementText', target: focusedInput } as unknown as Event),
      false
    );
    // Safari form-wide autofill on an unfocused input: counts as autofill
    assert.equal(
      isAutofillChange({ inputType: 'insertReplacementText', target: otherInput } as unknown as Event),
      true
    );
    // Safari autofill matching :-webkit-autofill even when focused: counts as autofill
    (globalThis as any).document = { activeElement: autofilledInput };
    assert.equal(
      isAutofillChange({ inputType: 'insertReplacementText', target: autofilledInput } as unknown as Event),
      true
    );
  } finally {
    if (prevDoc === undefined) delete (globalThis as any).document;
    else (globalThis as any).document = prevDoc;
  }
});

test('matchCountry maps names, aliases, and ISO codes for mobile autofill input', () => {
  assert.equal(matchCountry('United States'), 'US');
  assert.equal(matchCountry('US'), 'US');
  assert.equal(matchCountry('대한민국'), 'KR');
  assert.equal(matchCountry('UK'), 'GB');
  assert.equal(matchCountry('Indiana'), '');
});
