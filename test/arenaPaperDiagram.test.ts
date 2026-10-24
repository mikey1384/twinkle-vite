import assert from 'node:assert/strict';
import test from 'node:test';
import { compileDiagramExpr } from '../src/containers/Arena/diagramExpr';
import { labelRuns } from '../src/containers/Arena/PaperDiagram';
import { mapToDiagram } from '../src/containers/Arena/PaperMap';

test('the paper plots the same whitelist the API checks, and nothing else', () => {
  assert.equal(compileDiagramExpr('x^2-2x')!(3), 3);
  assert.equal(compileDiagramExpr('log_2(x)')!(4), 2);
  assert.ok(Number.isNaN(compileDiagramExpr('log_2(x)')!(-1)));
  for (const expr of [
    'alert(1)',
    'window',
    'x.constructor',
    '2**x',
    'tan(x)'
  ]) {
    assert.equal(compileDiagramExpr(expr), null, expr);
  }
});

test('labels set capitals upright, single letters italic, and _ ^ as sub and superscripts', () => {
  assert.deepEqual(labelRuns('P_1'), [
    { text: 'P', italic: false, shift: 0 },
    { text: '1', italic: false, shift: -1 }
  ]);
  assert.deepEqual(
    labelRuns('y=log_2 x').map((r) => [r.text, r.italic, r.shift]),
    [
      ['y', true, 0],
      ['=', false, 0],
      ['log', false, 0],
      ['2', false, -1],
      [' ', false, 0],
      ['x', true, 0]
    ]
  );
  assert.deepEqual(
    labelRuns('A_{k+1}').map((r) => [r.text, r.shift]),
    [
      ['A', 0],
      ['k', -1],
      ['+1', -1]
    ]
  );
});

test('a map becomes a diagram whose markers sit at their projected places', () => {
  const diagram = mapToDiagram({
    kind: 'map',
    base: 'nile',
    width: 240,
    shade: [{ area: 'egypt' }],
    rivers: ['nile'],
    markers: [{ lat: 26.8, lon: 30.8, label: 'B국', mark: 'none' }]
  })!;
  const k = Math.cos(((3 + 34) / 2) * (Math.PI / 180));
  assert.equal(diagram.height, Math.round((240 * 31) / (22 * k)));
  const marker = diagram.elements.find(
    (e) => e.type === 'point' && e.id === 'm0'
  ) as any;
  assert.ok(Math.abs(marker.x - (30.8 - 24) * k) < 1e-9);
  assert.equal(marker.y, 26.8);
  assert.equal(marker.dot, false);
  assert.equal(
    mapToDiagram({ kind: 'map', base: 'atlantis', width: 240 }),
    null
  );
});
