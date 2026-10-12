import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  DISC_AIR,
  MOUSE_DISCS,
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
  const layouts = (world: MapWorld) =>
    [
      [undefined, undefined],
      [bigStopsOf(world), 'wide'],
      [bigStopsOf(world), 'narrow']
    ] as const;
  for (const world of QUEST_MAP)
    for (const [mouseBigStops, fit] of layouts(world)) {
      const bigStops = mouseBigStops && [...mouseBigStops];
      computed[stopTableKey(world.key, world.nodes.length, bigStops, fit)] =
        spaceWorldStops(world.key, world.nodes.length, bigStops, fit).map(
          ([x, y]): Point => [round(x), round(y)]
        );
    }
  if (process.env.WRITE_STOP_TABLE) {
    const rows = Object.entries(computed).map(
      ([key, points]) =>
        `  '${key}': [\n${points.map(([x, y]) => `    [${x}, ${y}]`).join(',\n')}\n  ]`
    );
    writeFileSync(
      STOP_TABLE,
      `// generated by test/grammarQuestStopSpacing.test.ts (WRITE_STOP_TABLE=1):
// each world's map stops, spacedStops worked out ahead (the even layout for
// touch screens, the ':mouse:' one that gives forts and castles room, and
// ':mouse-narrow:', the same for a narrow window's smaller discs)
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
// every pair of a world's stops, drawn `width` × `height`, at least a whole
// 28px tap box apart, and its discs (each one hovered too) a pixel clear
function assertMarblesClear(
  label: string,
  points: Point[],
  bigStops: number[],
  [width, height]: [number, number],
  sizes: { stop: number; boss: number; hover: number[] }
) {
  const big = new Set(bigStops);
  const disc = (i: number) => (big.has(i) ? sizes.boss : sizes.stop);
  const px = points.map(([x, y]) => [(x / 100) * width, (y / 100) * height]);
  for (let i = 0; i < points.length; i++)
    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      const dx = Math.abs(px[i][0] - px[j][0]);
      const dy = Math.abs(px[i][1] - px[j][1]);
      assert.ok(Math.max(dx, dy) >= MOUSE_TAP - 1e-6, `${label} ${i}-${j} box`);
      const clear =
        Math.hypot(dx, dy) - (disc(i) * sizes.hover[i]) / 2 - disc(j) / 2;
      assert.ok(
        clear >= DISC_AIR - 1e-6,
        `${label}: ${i} hovered and ${j} ${clear.toFixed(2)}px clear`
      );
    }
}

test('on a mouse no two marbles overlap, and the desktop map stays whole', () => {
  for (const world of QUEST_MAP) {
    const count = world.nodes.length;
    const bigStops = bigStopsOf(world);
    const per = mapHeightPerGapPx(world.key, count, bigStops, 'wide');
    const least = Math.max(per.tap, per.big) * MOUSE_TAP;
    assert.ok(least <= 503, `${world.key}: the mouse map needs ${least}px`);
    const points = stopsAlongPath(world.key, count, bigStops);
    for (const height of [least, 400, 503, 570]) {
      if (height < least) continue;
      const width = (height * 16) / 9;
      const sizes = mouseDiscSizes(points, bigStops, [width, height]);
      assert.ok(
        sizes.stop >= MOUSE_MIN_STOP && sizes.stop <= MOUSE_DISCS.wide.stop,
        `${world.key} stop ${sizes.stop}`
      );
      assert.ok(
        sizes.boss >= MOUSE_MIN_BOSS && sizes.boss <= MOUSE_DISCS.wide.boss,
        `${world.key} boss ${sizes.boss}`
      );
      assertMarblesClear(
        `${world.key} at ${height}px`,
        points,
        bigStops,
        [width, height],
        sizes
      );
    }
  }
});

// r31 review SF-1: a window up to 767px wide has an 8px root font, so its
// discs are 24px and 28.8px (3rem, 3.6rem), not 30/36. A mouse there gets
// a layout made for those sizes and draws every marble at exactly them (a
// floor never exceeds its design size), clear of each other, hovered too,
// at any height the map is drawn. Its map needs no more room than r30b's
// (which drew the same sizes on the even layout, needing --tap-need and
// --big-need 28px as plain gaps, and the narrow --edge-need 22px and
// --big-edge-need 24.4px), except Sky Library's, 1.3% more: r30b let its
// hovered marbles touch there, and a pixel of air costs that. 700×800
// draws the map about 380px tall, 760×600 about 300px.
const NARROW_EDGE = 22;
const NARROW_BIG_EDGE = 24.4;
const NARROW_OVER_R30B: Record<string, number> = { 'sky-library': 1.014 };
const leastHeight = (
  per: ReturnType<typeof mapHeightPerGapPx>,
  tap: number,
  big: number
) =>
  Math.max(
    per.tap * tap,
    per.big * big,
    per.edge * NARROW_EDGE,
    per.bigEdge * NARROW_BIG_EDGE
  );
test('a narrow mouse window draws its design-size marbles, clear, zoomed no more than r30b', () => {
  const narrow = MOUSE_DISCS.narrow;
  assert.equal(narrow.stop, 24);
  assert.equal(narrow.boss, 28.8);
  for (const discs of Object.values(MOUSE_DISCS))
    assert.ok(discs.minStop <= discs.stop && discs.minBoss <= discs.boss);
  for (const world of QUEST_MAP) {
    const count = world.nodes.length;
    const bigStops = bigStopsOf(world);
    const per = mapHeightPerGapPx(world.key, count, bigStops, 'narrow');
    const least = leastHeight(per, MOUSE_TAP, MOUSE_TAP);
    const r30b = leastHeight(
      mapHeightPerGapPx(world.key, count, bigStops),
      MOUSE_TAP,
      MOUSE_TAP
    );
    assert.ok(
      least <= r30b * (NARROW_OVER_R30B[world.key] || 1) + 1e-6,
      `${world.key}: the narrow mouse map needs ${least}px (r30b ${r30b}px)`
    );
    const points = stopsAlongPath(world.key, count, bigStops, 'narrow');
    for (const height of [least, 300, 380, 450]) {
      if (height < least) continue;
      const width = (height * 16) / 9;
      const sizes = mouseDiscSizes(points, bigStops, [width, height], narrow);
      assert.equal(sizes.stop, 24, `${world.key} at ${height}px stop`);
      assert.equal(sizes.boss, 28.8, `${world.key} at ${height}px boss`);
      assertMarblesClear(
        `${world.key} narrow at ${height}px`,
        points,
        bigStops,
        [width, height],
        sizes
      );
    }
  }
});

test('mouse disc sizes: a 0×0 map gets the design sizes, and crowded forts and castles still clear', () => {
  const points: Point[] = [
    [10, 50],
    [30, 50],
    [50, 50],
    [52, 50]
  ];
  // not laid out yet: nothing is worked out from a zero-size map
  for (const size of [
    [0, 0],
    [0, 300],
    [500, 0]
  ] as [number, number][])
    assert.deepEqual(mouseDiscSizes(points, [2, 3], size), {
      stop: MOUSE_DISCS.wide.stop,
      boss: MOUSE_DISCS.wide.boss,
      hover: [1, 1, 1, 1]
    });
  // two forts 10px apart (closer than the 34px floor) on a map too small
  // for them (r31 review N-3): they get the room between them, and the
  // stops give way, so every pair still clears
  const size: [number, number] = [500, 300];
  const sizes = mouseDiscSizes(points, [2, 3], size);
  assert.equal(sizes.boss, 9);
  const big = new Set([2, 3]);
  const px = points.map(([x, y]) => [(x / 100) * size[0], (y / 100) * size[1]]);
  const disc = (i: number) => (big.has(i) ? sizes.boss : sizes.stop);
  for (let i = 0; i < points.length; i++)
    for (let j = i + 1; j < points.length; j++)
      assert.ok(
        Math.hypot(px[i][0] - px[j][0], px[i][1] - px[j][1]) -
          disc(i) / 2 -
          disc(j) / 2 >=
          DISC_AIR - 1e-6,
        `${i}-${j}`
      );
});
