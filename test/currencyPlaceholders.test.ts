import test from 'node:test';
import assert from 'node:assert/strict';

import {
  protectCurrencyLiteralsOutsideMath,
  restoreCurrencyPlaceholders
} from '../src/components/Texts/RichText/Markdown/currencyPlaceholders';

test('protects currency before later inline math on the same line', () => {
  const input = 'It costs $100 (approx) and formula is $x$';
  const protectedText = protectCurrencyLiteralsOutsideMath(input);

  assert.equal(
    protectedText,
    'It costs TWINKLECURRENCY100ENDTWINKLECURRENCY (approx) and formula is $x$'
  );
  assert.equal(restoreCurrencyPlaceholders(protectedText), input);
});

test('leaves numeric and algebra inline math protected as math', () => {
  assert.equal(
    protectCurrencyLiteralsOutsideMath('Math $100$ stays math'),
    'Math $100$ stays math'
  );
  assert.equal(
    protectCurrencyLiteralsOutsideMath('Math $2(a+b)$ stays math'),
    'Math $2(a+b)$ stays math'
  );
});
