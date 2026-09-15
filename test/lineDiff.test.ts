import assert from 'node:assert/strict';
import test from 'node:test';
import {
  LINE_DIFF_MAX_LINES,
  buildLineDiffHunks,
  diffLines,
  splitLines
} from '../src/helpers/lineDiff';

test('identical files are all equal lines with matching numbers', () => {
  const { entries, truncated } = diffLines('a\nb\nc\n', 'a\nb\nc\n');
  assert.equal(truncated, false);
  assert.deepEqual(
    entries.map((e) => [e.op, e.before, e.after]),
    [
      ['equal', 1, 1],
      ['equal', 2, 2],
      ['equal', 3, 3]
    ]
  );
});

test('a changed line in the middle is a remove followed by an add, with context kept', () => {
  const before = ['const a = 1;', 'const b = 2;', 'const c = 3;', 'run();'].join(
    '\n'
  );
  const after = ['const a = 1;', 'const b = 20;', 'const c = 3;', 'run();'].join(
    '\n'
  );
  const { entries } = diffLines(before, after);
  assert.deepEqual(
    entries.map((e) => `${e.op}:${e.text}`),
    [
      'equal:const a = 1;',
      'remove:const b = 2;',
      'add:const b = 20;',
      'equal:const c = 3;',
      'equal:run();'
    ]
  );
  // Line numbers count independently on each side.
  assert.equal(entries[1].before, 2);
  assert.equal(entries[1].after, undefined);
  assert.equal(entries[2].after, 2);
  assert.equal(entries[3].before, 3);
  assert.equal(entries[3].after, 3);
});

test('additions and deletions at the ends are found without spurious changes', () => {
  const { entries: added } = diffLines('x\ny', 'x\ny\nz');
  assert.deepEqual(
    added.map((e) => e.op),
    ['equal', 'equal', 'add']
  );
  const { entries: removed } = diffLines('x\ny\nz', 'y\nz');
  assert.deepEqual(
    removed.map((e) => e.op),
    ['remove', 'equal', 'equal']
  );
  assert.deepEqual(splitLines(''), []);
  assert.deepEqual(splitLines('one\r\ntwo\r\n'), ['one', 'two']);
});

test('hunks carry three lines of context and merge nearby changes', () => {
  const before = Array.from({ length: 30 }, (_, i) => `line ${i + 1}`).join(
    '\n'
  );
  const after = before
    .replace('line 10', 'LINE 10')
    .replace('line 25', 'LINE 25');
  const hunks = buildLineDiffHunks(diffLines(before, after).entries);
  assert.equal(hunks.length, 2);
  assert.equal(hunks[0].beforeStart, 7);
  assert.equal(hunks[0].entries[0].text, 'line 7');
  assert.equal(hunks[0].entries[hunks[0].entries.length - 1].text, 'line 13');
  assert.equal(hunks[1].beforeStart, 22);
  const close = buildLineDiffHunks(
    diffLines(before, before.replace('line 10', 'A').replace('line 12', 'B'))
      .entries
  );
  assert.equal(close.length, 1);
});

test('oversized files fall back to a full replacement instead of hanging', () => {
  const big = Array.from({ length: LINE_DIFF_MAX_LINES + 1 }, (_, i) =>
    String(i)
  ).join('\n');
  const { entries, truncated } = diffLines(big, `${big}\nextra`);
  assert.equal(truncated, true);
  assert.equal(entries.filter((e) => e.op === 'equal').length, 0);
  // Wildly different files stay bounded by the edit-distance guard too.
  const left = Array.from({ length: 5000 }, (_, i) => `L${i}`).join('\n');
  const right = Array.from({ length: 5000 }, (_, i) => `R${i}`).join('\n');
  const result = diffLines(left, right);
  assert.equal(result.truncated, true);
  assert.equal(result.entries.length, 10000);
});
