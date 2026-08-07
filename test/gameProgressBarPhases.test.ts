import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameProgressBar, {
  PHASE_MESSAGES
} from '../src/components/GameProgressBar';

function shownLine(html: string) {
  const allLines = PHASE_MESSAGES.flat();
  return allLines.find((line) => html.includes(escapeHtml(line))) || null;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

test('three phase pools of 20 unique lines each', () => {
  assert.equal(PHASE_MESSAGES.length, 3);
  for (const pool of PHASE_MESSAGES) {
    assert.equal(pool.length, 20);
  }
  const allLines = PHASE_MESSAGES.flat();
  assert.equal(new Set(allLines).size, allLines.length);
});

test('status line comes from the pool matching the progress phase', () => {
  const phaseByProgress: Array<[number, number]> = [
    [10, 0],
    [60, 1],
    [90, 2]
  ];
  for (const [progress, expectedPhase] of phaseByProgress) {
    const html = renderToStaticMarkup(
      React.createElement(GameProgressBar, { progress })
    );
    const line = shownLine(html);
    assert.ok(line, `no known status line rendered at ${progress}%`);
    assert.ok(
      PHASE_MESSAGES[expectedPhase].includes(line as string),
      `at ${progress}% expected a phase-${expectedPhase + 1} line, got "${line}"`
    );
  }
});

test('mounts do not always open with the same line', () => {
  // Shuffle-per-mount makes 12 consecutive first lines from a 20-line pool
  // collide with probability (1/20)^11 — treat repetition as a regression.
  const firstLines = new Set(
    Array.from({ length: 12 }, () =>
      shownLine(
        renderToStaticMarkup(React.createElement(GameProgressBar, { progress: 5 }))
      )
    )
  );
  assert.ok(firstLines.size > 1, 'every mount rendered the identical line');
});

test('explicit messages and label overrides still win', () => {
  const custom = renderToStaticMarkup(
    React.createElement(GameProgressBar, {
      progress: 10,
      messages: ['Custom loading line']
    })
  );
  assert.ok(custom.includes('Custom loading line'));
  const labeled = renderToStaticMarkup(
    React.createElement(GameProgressBar, {
      progress: 10,
      label: 'Exact label'
    })
  );
  assert.ok(labeled.includes('Exact label'));
});

test('explicit empty overrides suppress loading copy instead of falling back', () => {
  const emptyMessages = renderToStaticMarkup(
    React.createElement(GameProgressBar, { progress: 10, messages: [] })
  );
  assert.equal(
    shownLine(emptyMessages),
    null,
    'messages=[] must render no phase line'
  );
  const emptyLabel = renderToStaticMarkup(
    React.createElement(GameProgressBar, { progress: 10, label: '' })
  );
  assert.equal(
    shownLine(emptyLabel),
    null,
    "label='' must render no phase line"
  );
  const zeroLabel = renderToStaticMarkup(
    React.createElement(GameProgressBar, { progress: 10, label: 0 })
  );
  assert.equal(shownLine(zeroLabel), null);
  assert.match(zeroLabel, />0</, 'label=0 must render the literal 0');
});
