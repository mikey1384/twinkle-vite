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

// the widest gap `count` stops can all keep on this path, walking it from the
// first stop and dropping each next one at the first spot far enough from
// every stop already down (a loop or a hairpin can't crowd them either)
function widestGap(path: Point[], count: number) {
  const { total, at } = walk(path);
  const step = total / 2000;
  const fits = (gap: number) => {
    const placed: Point[] = [at(0)];
    for (let d = step; placed.length < count; d += step) {
      if (d > total + step / 2) return false;
      const p = at(Math.min(d, total));
      if (placed.every((q) => stopGap(p, q) >= gap)) placed.push(p);
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
// `count` stops. The first stop stays at the path's start and the last (the
// castle) at its end; stops never pass each other.
export function spacedStops(path: Point[], count: number): Point[] {
  if (count <= 0) return [];
  if (count === 1) return [path[path.length - 1]];
  const { total, at } = walk(path);
  const along = Array.from(
    { length: count },
    (_, n) => (total * n) / (count - 1)
  );
  const target = widestGap(path, count) * 0.97;
  const nudge = total / 3000;
  const minStep = total / 10000;
  for (let round = 0; round < 6000; round++) {
    const points = along.map(at);
    let moved = false;
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        if (stopGap(points[i], points[j]) >= target) continue;
        along[i] -= nudge;
        along[j] += nudge;
        moved = true;
      }
    }
    if (!moved) break;
    along[0] = 0;
    along[count - 1] = total;
    for (let k = 1; k < count - 1; k++)
      along[k] = Math.max(along[k], along[k - 1] + minStep);
    for (let k = count - 2; k >= 0; k--)
      along[k] = Math.min(along[k], along[k + 1] - minStep);
    along[0] = 0;
  }
  return along.map(at);
}
