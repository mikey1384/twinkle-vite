import assert from 'node:assert/strict';
import test from 'node:test';
import { countryInStateField, isAutofillChange, matchCountry, searchCountries, stateOrCity } from '../src/components/Build/AppAddress/checkout/countries';

test('autofill country names and codes land on the right country', () => {
  for (const value of ['South Korea', 'Korea, Republic of', 'Republic of Korea', '대한민국', '한국', 'KR', 'kr', 'Korea']) {
    assert.equal(matchCountry(value), 'KR', value);
  }
  assert.equal(matchCountry('United States'), 'US');
  assert.equal(matchCountry('USA'), 'US');
  assert.equal(matchCountry('United Kingdom'), 'GB');
  assert.equal(matchCountry('Britain'), 'GB');
  assert.equal(matchCountry("Côte d'Ivoire"), 'CI');
  assert.equal(matchCountry('Thailand'), 'TH');
  assert.equal(matchCountry('Seoul'), '');
});

test('a country name autofilled into State moves to Country; real states and typing stay', () => {
  const auto = { autofilled: true };
  assert.equal(countryInStateField('South Korea', auto), 'KR');
  assert.equal(countryInStateField('대한민국', auto), 'KR');
  assert.equal(countryInStateField('Seoul', auto), '');
  assert.equal(countryInStateField('Georgia', auto), '');
  assert.equal(countryInStateField('CA', auto), '');
  assert.equal(countryInStateField('California', auto), '');
  // the UK's nations are regions, never a country to move
  for (const region of ['Scotland', 'England', 'Wales', 'Northern Ireland']) {
    assert.equal(countryInStateField(region, auto), '', region);
  }
  // what a person types (or pastes) is never moved
  assert.equal(countryInStateField('South Korea'), '');
  assert.equal(countryInStateField('Scotland'), '');
});

test('only a whole-value browser change counts as autofill', () => {
  assert.equal(isAutofillChange({ inputType: undefined } as unknown as Event), true);
  assert.equal(isAutofillChange({ inputType: 'insertReplacementText' } as unknown as Event), true);
  for (const inputType of ['insertText', 'insertFromPaste', 'deleteContentBackward', 'insertCompositionText']) {
    assert.equal(isAutofillChange({ inputType } as unknown as Event), false, inputType);
  }
  assert.equal(isAutofillChange(undefined), false);
});

test('the search finds countries by English or Korean name and common aliases', () => {
  assert.equal(searchCountries('korea')[0], 'KR');
  assert.equal(searchCountries('대한')[0], 'KR');
  assert.equal(searchCountries('한국')[0], 'KR');
  assert.equal(searchCountries('usa')[0], 'US');
  assert.equal(searchCountries('america')[0], 'US');
  assert.equal(searchCountries('uk')[0], 'GB');
  assert.equal(searchCountries('britain')[0], 'GB');
  assert.ok(searchCountries('zzzz').length === 0);
});

test('state is optional for Korea: the city goes in its place', () => {
  assert.equal(stateOrCity('KR', '', 'Seoul'), 'Seoul');
  assert.equal(stateOrCity('KR', 'Gyeonggi-do', 'Suwon'), 'Gyeonggi-do');
  assert.equal(stateOrCity('US', '', 'Chicago'), '');
});

test('typing a state letter by letter never passes through a country (Indiana -> India)', () => {
  for (const state of ['Indiana', 'Puerto Rico', 'Guam', 'Niger State', 'Mexico City', 'Georgia']) {
    for (let end = 1; end <= state.length; end += 1) {
      const typed = state.slice(0, end);
      assert.equal(countryInStateField(typed), '', typed);
    }
  }
  // a whole autofilled value that is a state stays too
  assert.equal(countryInStateField('Indiana', { autofilled: true }), '');
});
