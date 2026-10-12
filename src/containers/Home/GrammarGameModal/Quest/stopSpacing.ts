// Where a world's stops sit on its painted path, spaced for fingers (Mikey
// 10-11: on crowded worlds two stops nearly touched, so one of them got a
// tap box only 10-20px wide).
//
// Units: a point is [x, y] in percent of the painting (x from the left, y
// from the top). Distances are measured in "height percent": x is scaled by
// the painting's 16:9 shape, so one unit is 1% of the map's height in px on
// both axes. Tap boxes are squares, so two stops are as far apart as their
// larger axis gap (the Chebyshev distance): that is what decides whether
// their boxes can both be full size.

export type Point = [number, number];

const ASPECT = 16 / 9;

// the distance two stops' square tap boxes care about, in height percent
export function stopGap(a: Point, b: Point) {
  return Math.max(Math.abs(a[0] - b[0]) * ASPECT, Math.abs(a[1] - b[1]));
}

// the closest two stops of a layout, in height percent
export function closestGap(points: Point[]) {
  let best = Infinity;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      best = Math.min(best, stopGap(points[i], points[j]));
    }
  }
  return best;
}

// The path as a walk: its length so far at each corner, measured on the
// painting's real shape (a horizontal percent is wider than a vertical one).
function walk(path: Point[]) {
  const lengths = [0];
  for (let i = 1; i < path.length; i++) {
    const [x1, y1] = path[i - 1];
    const [x2, y2] = path[i];
    lengths.push(lengths[i - 1] + Math.hypot((x2 - x1) * ASPECT, y2 - y1));
  }
  const at = (d: number): Point => {
    let i = 1;
    while (i < path.length - 1 && lengths[i] < d) i++;
    const span = lengths[i] - lengths[i - 1] || 1;
    const t = Math.max(0, Math.min(1, (d - lengths[i - 1]) / span));
    const [x1, y1] = path[i - 1];
    const [x2, y2] = path[i];
    return [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t];
  };
  return { total: lengths[lengths.length - 1], at };
}

// How far apart two stops (i and j, at points a and b) count as being, in
// height percent: their stopGap, unless a layout weighs a pair differently
// (roomAround, for a mouse).
export type PairGap = (i: number, j: number, a: Point, b: Point) => number;
const PLAIN: PairGap = (_i, _j, a, b) => stopGap(a, b);

// the widest gap `count` stops can all keep on this path, walking it from
// the first stop and dropping each next one at the first spot far enough
// from every stop already down (a loop or a hairpin can't crowd them either)
function widestGap(path: Point[], count: number, pairGap: PairGap) {
  const { total, at } = walk(path);
  const step = total / 2000;
  const fits = (gap: number) => {
    const placed: Point[] = [at(0)];
    for (let d = step; placed.length < count; d += step) {
      if (d > total + step / 2) return false;
      const p = at(Math.min(d, total));
      const k = placed.length;
      if (placed.every((q, i) => pairGap(i, k, q, p) >= gap)) placed.push(p);
    }
    return true;
  };
  let lo = 0;
  let hi = 100;
  for (let k = 0; k < 24; k++) {
    const mid = (lo + hi) / 2;
    if (fits(mid)) lo = mid;
    else hi = mid;
  }
  return lo;
}

// Stops spread evenly along the path (the painting's look), then any two
// closer than the path allows are pushed apart along it, a little at a
// time, until every pair keeps nearly the widest gap the path can give
// `count` stops (`slack` of it). The first stop stays at the path's start
// and the last (the castle) at its end; stops never pass each other.
// `settled` says whether every pair got there.
function spreadStops(
  path: Point[],
  count: number,
  pairGap: PairGap,
  slack: number
): { points: Point[]; settled: boolean } {
  const { total, at } = walk(path);
  const along = Array.from(
    { length: count },
    (_, n) => (total * n) / (count - 1)
  );
  const target = widestGap(path, count, pairGap) * slack;
  const nudge = total / 3000;
  const minStep = total / 10000;
  for (let round = 0; round < 6000; round++) {
    const points = along.map(at);
    let moved = false;
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        if (pairGap(i, j, points[i], points[j]) >= target) continue;
        along[i] -= nudge;
        along[j] += nudge;
        moved = true;
      }
    }
    if (!moved) return { points, settled: true };
    along[0] = 0;
    along[count - 1] = total;
    for (let k = 1; k < count - 1; k++)
      along[k] = Math.max(along[k], along[k - 1] + minStep);
    for (let k = count - 2; k >= 0; k--)
      along[k] = Math.min(along[k], along[k + 1] - minStep);
    along[0] = 0;
  }
  return { points: along.map(at), settled: false };
}

// A world's stops on its path (spreadStops), keeping 97% of the widest gap.
// With a `pairGap`, a pair that needs more room (a fort or castle on a
// mouse: roomAround) is measured as needing it, and the other pairs share
// what is left; `slacks` are the shares of the widest gap to try, tightest
// first, keeping the first that every pair settles at (the mouse layout
// wants all it can get: the desktop map must stay whole).
export function spacedStops(
  path: Point[],
  count: number,
  pairGap: PairGap = PLAIN,
  slacks: number[] = [0.97]
): Point[] {
  if (count <= 0) return [];
  if (count === 1) return [path[path.length - 1]];
  let points: Point[] = [];
  for (const slack of slacks) {
    const spread = spreadStops(path, count, pairGap, slack);
    points = spread.points;
    if (spread.settled) break;
  }
  return points;
}

// On a mouse a stop's tap box is only 28px (MOUSE_TAP), smaller than its
// 36px disc, so two stops' discs (and a fort's or castle's 45px one beside
// them) overlapped on crowded maps (r29 review SF-2: Logic Tower's fort and
// castle by 16px). Decided 10-12: on a mouse no two marbles overlap. So on
// a mouse the discs are drawn as big as the drawn map's gaps allow
// (mouseDiscSizes), down to MOUSE_MIN_STOP and MOUSE_MIN_BOSS, and the
// mouse layout (roomAround) gives each pair with a fort or castle in it room
// for those smallest discs and a pixel of air, scaled to MOUSE_TAP: such a
// pair counts as 28px apart once its smallest discs clear each other (and
// its tap boxes still split a 28px gap). Ordinary pairs keep the plain gap:
// their 28px tap gap always has room for two smallest stop discs.
export const MOUSE_TAP = 28;
export const STOP_DISC = 36;
export const BOSS_DISC = 45;
export const MOUSE_MIN_STOP = 26;
export const MOUSE_MIN_BOSS = 34;
export const DISC_AIR = 1;
// the mouse layout's shares of the widest gap to try (spacedStops)
export const MOUSE_SLACKS = [1, 0.99, 0.98, 0.97];

// A mouse's disc sizes, in px: the design size of a stop's and a fort's or
// castle's disc, and the smallest each is ever drawn. `wide` is a desktop
// window (root font 10px: 3.6rem and 4.5rem discs); `narrow` is a window
// up to 767px wide, where styles.css drops the root font to 8px and the
// discs are 3rem and 3.6rem (r31 review SF-1: r31 drew them 30/36 there).
// A floor never exceeds its design size, so a narrow window's floors are
// its design sizes: its marbles never shrink, they are drawn as on a phone
// (r30b), on a mouse layout made for those sizes (worldPaths.ts), which
// gives every pair room for them.
export interface MouseDiscs {
  stop: number;
  boss: number;
  minStop: number;
  minBoss: number;
}
const mouseDiscs = (stop: number, boss: number): MouseDiscs => ({
  stop,
  boss,
  minStop: Math.min(MOUSE_MIN_STOP, stop),
  minBoss: Math.min(MOUSE_MIN_BOSS, boss)
});
export type MouseFit = 'wide' | 'narrow';
export const MOUSE_DISCS: Record<MouseFit, MouseDiscs> = {
  wide: mouseDiscs(STOP_DISC, BOSS_DISC),
  narrow: mouseDiscs(24, 28.8)
};

const straight = (a: Point, b: Point) =>
  Math.hypot((a[0] - b[0]) * ASPECT, a[1] - b[1]);
// what two smallest discs need, centre to centre, in px
function smallestRoom(bigI: boolean, bigJ: boolean, discs: MouseDiscs) {
  const disc = (big: boolean) => (big ? discs.minBoss : discs.minStop);
  return disc(bigI) / 2 + disc(bigJ) / 2 + DISC_AIR;
}
export function roomAround(
  bigStops: number[],
  discs: MouseDiscs = MOUSE_DISCS.wide
): PairGap {
  const big = new Set(bigStops);
  return (i, j, a, b) =>
    big.has(i) || big.has(j)
      ? Math.min(
          stopGap(a, b),
          (straight(a, b) * MOUSE_TAP) /
            smallestRoom(big.has(i), big.has(j), discs)
        )
      : stopGap(a, b);
}

// How big each disc is drawn on a mouse, on a map drawn `width` × `height`
// px, so no two overlap: stops at most `discs.stop`, forts and castles at
// most `discs.boss`, all of one kind the same size, every pair a pixel
// apart. Stops first; if that leaves the forts and castles under their
// floor, they keep it (as far as two forts or castles close together
// allow) and the stops give way. Whole px below the design size. `hover[i]`
// is how much stop i's disc may zoom under the mouse (up to 1.08) with its
// neighbours still a pixel clear. The map is never drawn smaller than the
// smallest discs need (WorldMap's mouse --big-need); a map not laid out
// yet (0×0) gets the design sizes, never sizes worked out from it.
const EPS = 1e-6;
export function mouseDiscSizes(
  points: Point[],
  bigStops: number[],
  [width, height]: [number, number],
  discs: MouseDiscs = MOUSE_DISCS.wide
) {
  if (!(width > 0 && height > 0))
    return {
      stop: discs.stop,
      boss: discs.boss,
      hover: points.map(() => 1)
    };
  const big = new Set(bigStops);
  const px = points.map(([x, y]) => [(x / 100) * width, (y / 100) * height]);
  const apart = (i: number, j: number) =>
    Math.hypot(px[i][0] - px[j][0], px[i][1] - px[j][1]) - DISC_AIR;
  const pairs: [number, number][] = [];
  for (let i = 0; i < px.length; i++)
    for (let j = i + 1; j < px.length; j++) pairs.push([i, j]);
  const mixed = pairs.filter(([i, j]) => big.has(i) !== big.has(j));
  let stop = discs.stop;
  let boss = discs.boss;
  let bossPair = Infinity;
  for (const [i, j] of pairs) {
    if (!big.has(i) && !big.has(j)) stop = Math.min(stop, apart(i, j));
    else if (big.has(i) && big.has(j))
      bossPair = Math.min(bossPair, apart(i, j));
  }
  boss = Math.min(boss, bossPair);
  for (const [i, j] of mixed) boss = Math.min(boss, 2 * apart(i, j) - stop);
  // (a hair under the floor is floating-point error, not a crowded map)
  if (boss < discs.minBoss - EPS) {
    // the floor, unless two forts or castles sit closer than it (r31
    // review N-3): then they get what is between them
    boss = Math.min(discs.minBoss, bossPair);
    for (const [i, j] of mixed) stop = Math.min(stop, 2 * apart(i, j) - boss);
  }
  // whole px below the design size (the design size as it is)
  const whole = (size: number, design: number) =>
    size >= design - EPS ? design : Math.max(1, Math.floor(size + EPS));
  stop = whole(stop, discs.stop);
  // a stop can't go under 1px: if one still crowds a fort or castle, the
  // fort or castle gives way too, so every pair stays clear
  for (const [i, j] of mixed) boss = Math.min(boss, 2 * apart(i, j) - stop);
  boss = whole(boss, discs.boss);
  const disc = (i: number) => (big.has(i) ? boss : stop);
  const hover = px.map((_, i) => {
    let zoom = 1.08;
    px.forEach((__, j) => {
      if (j !== i) zoom = Math.min(zoom, (2 * apart(i, j) - disc(j)) / disc(i));
    });
    return Math.max(1, zoom);
  });
  return { stop, boss, hover };
}
