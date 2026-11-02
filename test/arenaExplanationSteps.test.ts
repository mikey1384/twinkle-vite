import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import katex from 'katex';
import {
  equationPieces,
  explanationSteps,
  stepParts
} from '../src/containers/Arena/explanationSteps';
import { shouldNudge } from '../src/containers/Arena/helpNudgeRule';

// The step-by-step Arena review (Mikey 11-02). The vectors are shared with
// twinkle-api test/arenaGuidance.test.ts, so "step 2" is the same step on
// screen and for Zero/Ciel.

test('explanations split into the same steps as the API (shared vectors)', () => {
  const vectors = JSON.parse(
    readFileSync(new URL('./fixtures/arenaExplanationSteps.json', import.meta.url), 'utf8')
  );
  assert.ok(vectors.length >= 8);
  for (const vector of vectors) {
    const steps = explanationSteps(vector.text);
    assert.deepEqual(steps, vector.steps, vector.name);
    assert.equal(steps.join('').replace(/\s+/g, ''), vector.text.replace(/\s+/g, ''), vector.name);
  }
});

test('a calculation builds up at its top-level = signs and joins back exactly', () => {
  const tex = ' 2\\frac{1}{4}\\div\\frac{3}{8}=\\frac{9}{4}\\times\\frac{8}{3}=6 ';
  const pieces = equationPieces(tex);
  assert.deepEqual(pieces, [' 2\\frac{1}{4}\\div\\frac{3}{8}', '=\\frac{9}{4}\\times\\frac{8}{3}', '=6 ']);
  assert.equal(pieces.join(''), tex);
  // every piece is valid TeX on its own (the renderer falls back otherwise)
  for (const piece of pieces) katex.renderToString(piece, { throwOnError: true, output: 'mathml' });
  assert.deepEqual(equationPieces(' 24 '), [' 24 ']);
  assert.deepEqual(equationPieces('\\left( a=b \\right)+1'), ['\\left( a=b \\right)+1']);
  assert.deepEqual(equationPieces('\\text{a=b}=c'), ['\\text{a=b}', '=c']);
  assert.deepEqual(equationPieces('\\begin{aligned}a&=b\\\\&=c\\end{aligned}'), ['\\begin{aligned}a&=b\\\\&=c\\end{aligned}']);
  assert.deepEqual(equationPieces('=5'), ['=5']);
});

test('a step keeps its words and math in order', () => {
  const parts = stepParts('앞부분은 \\( 4-1=3 \\)이다.');
  assert.deepEqual(parts.map((p) => p.math), [false, true, false]);
  assert.equal(parts.map((p) => p.text).join(''), '앞부분은 \\( 4-1=3 \\)이다.');
  assert.equal(parts[1].tex, ' 4-1=3 ');
});

test('the stuck nudge waits for real thinking time', () => {
  const base = { limit: 25 * 60, total: 10 };
  assert.equal(shouldNudge({ ...base, elapsed: 3 * 60, answered: 0 }), false);
  assert.equal(shouldNudge({ ...base, elapsed: 4 * 60, answered: 0 }), true);
  assert.equal(shouldNudge({ ...base, elapsed: 6 * 60, answered: 1 }), false);
  assert.equal(shouldNudge({ ...base, elapsed: 13 * 60, answered: 2 }), true);
  assert.equal(shouldNudge({ ...base, elapsed: 13 * 60, answered: 3 }), false);
  assert.equal(shouldNudge({ ...base, elapsed: 20 * 60, answered: 10 }), false);
  assert.equal(shouldNudge({ limit: null, total: 10, elapsed: 30 * 60, answered: 1 }), false);
});
