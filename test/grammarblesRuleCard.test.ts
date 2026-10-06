import test from 'node:test';
import assert from 'node:assert/strict';
import { mistakeText } from '../src/helpers/grammarblesRuleCard';

test('a label that quotes the choice is shown as is', () => {
  assert.equal(
    mistakeText({ choice: 'whom', error: '"whom" for a thing' }),
    '"whom" for a thing'
  );
  assert.equal(
    mistakeText({ choice: 'Whom', error: '“whom” for a thing' }),
    '“whom” for a thing'
  );
});

test('a bare substring never hides the choice', () => {
  assert.equal(
    mistakeText({ choice: 'a', error: 'Uses a plural verb' }),
    '“a”: Uses a plural verb'
  );
  assert.equal(
    mistakeText({ choice: 'in', error: 'on instead of in for months' }),
    '“in”: on instead of in for months'
  );
});
