import { spacedStops, type Point } from './stopSpacing';
import { PLACED_STOPS } from './worldStops.generated';

// Where map nodes sit on each world painting: points along the painted path,
// in percent of the image (x from the left, y from the top). Every painting
// was made with the path running from the bottom-left foreground to the
// castle at the top-right; a world can override the default curve once its
// painting is in.

export const DEFAULT_PATH: Point[] = [
  [8, 88],
  [24, 80],
  [40, 84],
  [56, 74],
  [44, 60],
  [28, 52],
  [40, 40],
  [60, 44],
  [76, 36],
  [66, 24],
  [84, 16]
];

// Follow each painting's actual path; revised worlds were aligned with
// the map overlays in work/grammarbles-review-music-20261009.
export const WORLD_PATHS: Record<string, Point[]> = {
  'starter-village': [
    [18, 92],
    [26, 80],
    [36, 70],
    [46, 64],
    [50, 54],
    [54, 46],
    [60, 40],
    [70, 38],
    [80, 32],
    [88, 26],
    [88, 18]
  ],
  'harbor-town': [
    [40, 94],
    [29, 88],
    [18, 81],
    [13, 74],
    [17, 67],
    [23, 60],
    [31, 55],
    [38, 49],
    [45, 45],
    [51, 40],
    [56, 37],
    [67, 35],
    [73, 31],
    [78, 26],
    [84, 22]
  ],
  'windmill-hills': [
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
  ],
  'forest-of-clauses': [
    [29, 94],
    [26, 89],
    [22, 84],
    [23, 80],
    [28, 75],
    [29, 72],
    [27, 70],
    [25, 67],
    [27, 64],
    [34, 61],
    [41, 59],
    [49, 61],
    [56, 60],
    [62, 58],
    [67, 54],
    [70, 49],
    [73, 46],
    [76, 43],
    [82, 40],
    [87, 37],
    [88, 35],
    [88, 32],
    [90, 30],
    [92, 27],
    [92, 25],
    [90, 22]
  ],
  'tense-canyon': [
    [36, 94],
    [28, 80],
    [26, 64],
    [34, 52],
    [44, 62],
    [56, 60],
    [68, 56],
    [76, 46],
    [72, 36],
    [84, 26],
    [90, 17]
  ],
  'passive-glacier': [
    [7, 94],
    [18, 87],
    [27, 80],
    [37, 73],
    [44, 67],
    [50, 62],
    [59, 57],
    [64, 52],
    [65, 49],
    [63, 46],
    [59, 44],
    [57, 42],
    [61, 40],
    [70, 39],
    [77, 36],
    [83, 34],
    [85, 31],
    [88, 27],
    [91, 24]
  ],
  'sky-library': [
    [28, 94],
    [21, 89],
    [12, 85],
    [10, 81],
    [10, 77],
    [14, 72],
    [21, 68],
    [22, 65],
    [20, 62],
    [20, 61],
    [27, 61],
    [32, 58],
    [39, 59],
    [44, 56],
    [49, 55],
    [55, 54],
    [62, 58],
    [68, 59],
    [73, 59],
    [74, 55],
    [74, 52],
    [77, 49],
    [80, 47],
    [81, 44],
    [79, 41],
    [77, 38],
    [76, 35],
    [78, 33],
    [80, 36],
    [84, 33],
    [83, 30],
    [84, 25]
  ],
  'the-citadel': [
    [16, 94],
    [28, 82],
    [40, 72],
    [52, 66],
    [62, 58],
    [66, 50],
    [70, 42],
    [76, 36],
    [82, 30],
    [83, 22]
  ],
  'the-academy': [
    [22, 94],
    [32, 82],
    [42, 72],
    [52, 64],
    [58, 56],
    [60, 46],
    [66, 40],
    [76, 36],
    [84, 30],
    [89, 18]
  ],
  'logic-tower': [
    [10, 90],
    [24, 82],
    [34, 72],
    [42, 62],
    [50, 55],
    [58, 52],
    [68, 46],
    [74, 38],
    [78, 30],
    [79, 22]
  ]
};

// Each world's stops along its painted path, spaced so no two crowd each
// other (stopSpacing.ts). Working that out takes 10-70 ms a world, so the
// worlds' stops are worked out ahead in worldStops.generated.ts (checked
// against spacedStops by test/grammarQuestStopSpacing.test.ts, which
// rewrites it when run with WRITE_STOP_TABLE=1); a stop count the table
// doesn't have is worked out on first open and kept.
const placed = new Map<string, Point[]>();
export function stopsAlongPath(worldKey: string, count: number): Point[] {
  const key = `${worldKey}:${count}`;
  let points = placed.get(key) || PLACED_STOPS[key];
  if (!points) {
    points = spacedStops(stopPath(worldKey), count);
    placed.set(key, points);
  }
  return points;
}

// The part of a world's painted path its stops use: most paths enter at the
// painting's bottom edge (y 94%), and a stop there needs the whole map drawn
// tall for its tap box to clear the edge (r29: a 667×375 phone drew The
// Citadel 2.2× its area just for stop 1). The first stop starts a little up
// the path instead, at most 90% down, still on the painted path.
const LOWEST_STOP = 90;
export function stopPath(worldKey: string): Point[] {
  const path = WORLD_PATHS[worldKey] || DEFAULT_PATH;
  const [[x1, y1], next] = path;
  if (y1 <= LOWEST_STOP || !next || next[1] >= y1) return path;
  const t = Math.min(1, (y1 - LOWEST_STOP) / (y1 - next[1]));
  return [[x1 + (next[0] - x1) * t, y1 + (next[1] - y1) * t], ...path.slice(1)];
}
