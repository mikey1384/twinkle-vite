import assert from 'node:assert/strict';
import test from 'node:test';
import { countryInStateField, matchCountry, searchCountries, stateOrCity } from '../src/components/Build/AppAddress/checkout/countries';

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

test('a country name autofilled into State moves to Country; real states stay', () => {
  assert.equal(countryInStateField('South Korea'), 'KR');
  assert.equal(countryInStateField('대한민국'), 'KR');
  assert.equal(countryInStateField('Seoul'), '');
  assert.equal(countryInStateField('Georgia'), '');
  assert.equal(countryInStateField('CA'), '');
  assert.equal(countryInStateField('California'), '');
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
