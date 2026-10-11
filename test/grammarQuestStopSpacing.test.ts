import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  closestGap,
  spacedStops,
  stopGap,
  type Point
} from '../src/containers/Home/GrammarGameModal/Quest/stopSpacing';
import { stopPath } from '../src/containers/Home/GrammarGameModal/Quest/worldPaths';
import { PLACED_STOPS } from '../src/containers/Home/GrammarGameModal/Quest/worldStops.generated';

// distance from a point to the nearest place on a path (in height percent)
function offPath(p: Point, path: Point[]) {
  let best = Infinity;
  for (let i = 1; i < path.length; i++) {
    const [ax, ay] = path[i - 1];
    const [bx, by] = path[i];
    const dx = bx - ax;
    const dy = by - ay;
    const t = Math.max(
      0,
      Math.min(
        1,
        ((p[0] - ax) * dx + (p[1] - ay) * dy) / (dx * dx + dy * dy || 1)
      )
    );
    best = Math.min(
      best,
      Math.hypot(p[0] - (ax + dx * t), p[1] - (ay + dy * t))
    );
  }
  return best;
}

// windmill-hills' painted path (layout.ts): it doubles back on itself, so
// stops spread evenly along it bunch up where it turns
const HAIRPIN: Point[] = [
  [38, 94],
  [27, 89],
  [23, 86],
  [23, 83],
  [28, 79],
  [37, 76],
  [45, 72],
  [50, 70],
  [49, 67],
  [46, 64],
  [51, 61],
  [59, 58],
  [67, 56],
  [68, 53],
  [62, 50],
  [56, 48],
  [57, 46],
  [64, 45],
  [70, 44],
  [76, 42],
  [82, 38],
  [87, 35],
  [88, 33],
  [84, 30],
  [81, 28],
  [82, 27],
  [85, 25]
];

test('two stops are as far apart as their larger axis gap, on the painting’s 16:9 shape', () => {
  assert.equal(stopGap([10, 10], [19, 12]), 16);
  assert.equal(stopGap([10, 10], [11, 30]), 20);
  assert.equal(
    closestGap([
      [0, 0],
      [90, 0],
      [0, 50]
    ]),
    50
  );
});

test('stops stay on the painted path, in order, from its start to its end', () => {
  const stops = spacedStops(HAIRPIN, 11);
  assert.equal(stops.length, 11);
  assert.deepEqual(stops[0], HAIRPIN[0]);
  assert.deepEqual(stops[10], HAIRPIN[HAIRPIN.length - 1]);
  for (const stop of stops) assert.ok(offPath(stop, HAIRPIN) < 1e-6);
  assert.deepEqual(spacedStops(HAIRPIN, 1), [HAIRPIN[HAIRPIN.length - 1]]);
  assert.deepEqual(spacedStops(HAIRPIN, 0), []);
});

test('stops a hairpin crowds together are pushed apart along the path', () => {
  const count = 11;
  // evenly along the path (the old layout) for comparison
  const lengths = [0];
  for (let i = 1; i < HAIRPIN.length; i++)
    lengths.push(
      lengths[i - 1] +
        Math.hypot(
          ((HAIRPIN[i][0] - HAIRPIN[i - 1][0]) * 16) / 9,
          HAIRPIN[i][1] - HAIRPIN[i - 1][1]
        )
    );
  const total = lengths[lengths.length - 1];
  const even = Array.from({ length: count }, (_, n): Point => {
    const d = (total * n) / (count - 1);
    let i = 1;
    while (i < HAIRPIN.length - 1 && lengths[i] < d) i++;
    const t = (d - lengths[i - 1]) / (lengths[i] - lengths[i - 1] || 1);
    return [
      HAIRPIN[i - 1][0] + (HAIRPIN[i][0] - HAIRPIN[i - 1][0]) * t,
      HAIRPIN[i - 1][1] + (HAIRPIN[i][1] - HAIRPIN[i - 1][1]) * t
    ];
  });
  const spaced = spacedStops(HAIRPIN, count);
  assert.ok(closestGap(spaced) > closestGap(even) * 2);
  // and it is worked out the same way every time
  assert.deepEqual(spacedStops(HAIRPIN, count), spaced);
});

test('a straight path keeps its stops evenly spread', () => {
  const line: Point[] = [
    [10, 90],
    [90, 10]
  ];
  const stops = spacedStops(line, 5);
  const gaps = stops.slice(1).map((p, i) => stopGap(p, stops[i]));
  for (const gap of gaps) assert.ok(Math.abs(gap - gaps[0]) < 0.01);
});

// Each world's nodes (its stops, forts and castle) come from one place: the
// website's snapshot of the api's QUEST_MAP (test/fixtures/grammarQuestMap.json,
// which the Quest browser test renders too). The next test checks that
// snapshot against the api's own helpers/english/questMap.ts whenever an api
// checkout sits beside this one, so a world that gains a stop can't drift
// silently. The map reads its stops from worldStops.generated.ts; run this
// file with WRITE_STOP_TABLE=1 to rewrite it after a path or a count changes
// (refresh the snapshot first).
interface MapWorld {
  key: string;
  nodes: { id: string; kind: string }[];
}
const QUEST_MAP: MapWorld[] = JSON.parse(
  readFileSync(
    new URL('./fixtures/grammarQuestMap.json', import.meta.url),
    'utf8'
  )
);
const WORLD_NODE_COUNTS: Record<string, number> = Object.fromEntries(
  QUEST_MAP.map((world) => [world.key, world.nodes.length])
);
const shapeOf = (worlds: MapWorld[]) =>
  worlds.map((world) => ({
    key: world.key,
    nodes: world.nodes.map((node) => `${node.id}:${node.kind}`)
  }));

// the api checkout beside this one: work trees keep it at ../api, the main
// checkouts at ../twinkle-api (GRAMMAR_QUEST_API_MAP names another file)
const API_QUEST_MAP = [
  process.env.GRAMMAR_QUEST_API_MAP,
  fileURLToPath(
    new URL('../../api/helpers/english/questMap.ts', import.meta.url)
  ),
  fileURLToPath(
    new URL('../../twinkle-api/helpers/english/questMap.ts', import.meta.url)
  )
].find((file): file is string => !!file && existsSync(file));

test(
  'the quest map snapshot has the api’s worlds and nodes',
  {
    skip: API_QUEST_MAP
      ? false
      : 'no api checkout beside this one (../api or ../twinkle-api); set GRAMMAR_QUEST_API_MAP to its helpers/english/questMap.ts to compare'
  },
  async () => {
    const api: { QUEST_MAP: MapWorld[] } = await import(
      pathToFileURL(API_QUEST_MAP!).href
    );
    assert.deepEqual(
      shapeOf(QUEST_MAP),
      shapeOf(api.QUEST_MAP),
      `test/fixtures/grammarQuestMap.json is out of date with ${API_QUEST_MAP}: refresh it, then rerun this file with WRITE_STOP_TABLE=1`
    );
  }
);
const STOP_TABLE = new URL(
  '../src/containers/Home/GrammarGameModal/Quest/worldStops.generated.ts',
  import.meta.url
);
const round = (n: number) => Math.round(n * 1000) / 1000;

test('the worked-out stops table matches spacedStops for every world', () => {
  const computed: Record<string, Point[]> = {};
  for (const [key, count] of Object.entries(WORLD_NODE_COUNTS))
    computed[`${key}:${count}`] = spacedStops(stopPath(key), count).map(
      ([x, y]): Point => [round(x), round(y)]
    );
  if (process.env.WRITE_STOP_TABLE) {
    const rows = Object.entries(computed).map(
      ([key, points]) =>
        `  '${key}': [\n${points.map(([x, y]) => `    [${x}, ${y}]`).join(',\n')}\n  ]`
    );
    writeFileSync(
      STOP_TABLE,
      `// generated by test/grammarQuestStopSpacing.test.ts (WRITE_STOP_TABLE=1):
// each world's map stops, spacedStops worked out ahead
import type { Point } from './stopSpacing';

export const PLACED_STOPS: Record<string, Point[]> = {
${rows.join(',\n')}
};
`
    );
    return;
  }
  assert.deepEqual(PLACED_STOPS, computed);
});
