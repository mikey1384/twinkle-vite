import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  DISC_AIR,
  MOUSE_MIN_BOSS,
  MOUSE_MIN_STOP,
  MOUSE_TAP,
  closestGap,
  mouseDiscSizes,
  spacedStops,
  stopGap,
  type Point
} from '../src/containers/Home/GrammarGameModal/Quest/stopSpacing';
import {
  mapHeightPerGapPx,
  spaceWorldStops,
  stopTableKey,
  stopsAlongPath
} from '../src/containers/Home/GrammarGameModal/Quest/worldPaths';
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
// each world's forts' and castle's places among its nodes
const bigStopsOf = (world: MapWorld) =>
  world.nodes.flatMap((node, i) => (node.kind === 'stop' ? [] : [i]));
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

test('the worked-out stops table matches spacedStops for every world, touch and mouse', () => {
  const computed: Record<string, Point[]> = {};
  for (const world of QUEST_MAP)
    for (const mouseBigStops of [undefined, bigStopsOf(world)])
      computed[stopTableKey(world.key, world.nodes.length, mouseBigStops)] =
        spaceWorldStops(world.key, world.nodes.length, mouseBigStops).map(
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
// each world's map stops, spacedStops worked out ahead (the even layout for
// touch screens, and the ':mouse:' one that gives forts and castles room)
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

// Decided 10-12 (r29 review SF-2): on a mouse no two marbles overlap. The
// mouse map is drawn at least as tall as its stops need (WorldMap's mouse
// --tap-need and --big-need, both MOUSE_TAP, times mapHeightPerGapPx), and
// there and on bigger maps every pair is still a whole 28px tap box apart,
// the discs mouseDiscSizes picks (never under the smallest sizes) clear
// each other by a pixel, and so does a hovered disc. The 1280×800 desktop
// draws the map 503px tall inside its frame: every world's mouse map fits
// that whole.
test('on a mouse no two marbles overlap, and the desktop map stays whole', () => {
  for (const world of QUEST_MAP) {
    const count = world.nodes.length;
    const bigStops = bigStopsOf(world);
    const big = new Set(bigStops);
    const per = mapHeightPerGapPx(world.key, count, bigStops, true);
    const least = Math.max(per.tap, per.big) * MOUSE_TAP;
    assert.ok(least <= 503, `${world.key}: the mouse map needs ${least}px`);
    const points = stopsAlongPath(world.key, count, bigStops);
    for (const height of [least, 400, 503, 570]) {
      if (height < least) continue;
      const width = (height * 16) / 9;
      const sizes = mouseDiscSizes(points, bigStops, [width, height]);
      assert.ok(
        sizes.stop >= MOUSE_MIN_STOP,
        `${world.key} stop ${sizes.stop}`
      );
      assert.ok(
        sizes.boss >= MOUSE_MIN_BOSS,
        `${world.key} boss ${sizes.boss}`
      );
      const disc = (i: number) => (big.has(i) ? sizes.boss : sizes.stop);
      const px = points.map(([x, y]) => [
        (x / 100) * width,
        (y / 100) * height
      ]);
      for (let i = 0; i < count; i++)
        for (let j = 0; j < count; j++) {
          if (i === j) continue;
          const dx = Math.abs(px[i][0] - px[j][0]);
          const dy = Math.abs(px[i][1] - px[j][1]);
          assert.ok(
            Math.max(dx, dy) >= MOUSE_TAP - 1e-6,
            `${world.key} ${i}-${j} box`
          );
          const clear =
            Math.hypot(dx, dy) - (disc(i) * sizes.hover[i]) / 2 - disc(j) / 2;
          assert.ok(
            clear >= DISC_AIR - 1e-6,
            `${world.key} at ${height}px: ${i} hovered and ${j} ${clear.toFixed(2)}px clear`
          );
        }
    }
  }
});
