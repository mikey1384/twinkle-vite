import assert from 'node:assert/strict';
import test from 'node:test';
import {
  lessonSteps,
  questionParts,
  stepIndexOf
} from '../src/containers/Home/GrammarGameModal/Quest/lessonText';

test('a worked question splits at its blank', () => {
  assert.deepEqual(questionParts('Who _____ the window?'), [
    'Who ',
    ' the window?'
  ]);
  assert.deepEqual(questionParts('  It was ___.\n'), ['It was ', '.']);
  assert.deepEqual(questionParts('No blank here'), ['No blank here']);
  assert.deepEqual(questionParts('a __ b'), ['a __ b']);
});

test('a lesson too tall for the screen pages in two; one with no question never does', () => {
  const lessons = [{ question: {} }, { question: null }, { question: {} }];
  assert.deepEqual(lessonSteps(lessons, new Set()), [
    { lesson: 0, part: 'whole' },
    { lesson: 1, part: 'whole' },
    { lesson: 2, part: 'whole' }
  ]);
  assert.deepEqual(lessonSteps(lessons, new Set([1, 2])), [
    { lesson: 0, part: 'whole' },
    { lesson: 1, part: 'whole' },
    { lesson: 2, part: 'rule' },
    { lesson: 2, part: 'worked' }
  ]);
});

test('the page stays on its lesson when the pages change', () => {
  const split = lessonSteps([{ question: {} }, { question: {} }], new Set([1]));
  // just split: the whole lesson becomes its rule page
  assert.equal(stepIndexOf(split, { lesson: 1, part: 'whole' }), 1);
  assert.equal(stepIndexOf(split, { lesson: 1, part: 'worked' }), 2);
  // the screen turned and nothing is split: its worked page is the lesson
  const whole = lessonSteps([{ question: {} }, { question: {} }], new Set());
  assert.equal(stepIndexOf(whole, { lesson: 1, part: 'worked' }), 1);
});
