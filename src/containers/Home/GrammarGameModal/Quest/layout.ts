import { gqMedia } from '../media';

// Where map nodes sit on each world painting: points along the painted path,
// in percent of the image (x from the left, y from the top). Every painting
// was made with the path running from the bottom-left foreground to the
// castle at the top-right; a world can override the default curve once its
// painting is in.

type Point = [number, number];

const DEFAULT_PATH: Point[] = [
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

export const WORLD_IMAGES: Record<string, string> = {
  'starter-village': gqMedia('img/grammar-quest/starter-village.jpg'),
  'harbor-town': gqMedia('img/grammar-quest/harbor-town.jpg'),
  'windmill-hills': gqMedia('img/grammar-quest/windmill-hills.jpg'),
  'forest-of-clauses': gqMedia('img/grammar-quest/forest-of-clauses.jpg'),
  'tense-canyon': gqMedia('img/grammar-quest/tense-canyon.jpg'),
  'passive-glacier': gqMedia('img/grammar-quest/passive-glacier.jpg'),
  'sky-library': gqMedia('img/grammar-quest/sky-library.jpg'),
  'the-citadel': gqMedia('img/grammar-quest/the-citadel.jpg'),
  'the-academy': gqMedia('img/grammar-quest/the-academy.jpg'),
  'logic-tower': gqMedia('img/grammar-quest/logic-tower.jpg')
};

// small copies for the world tiles under the map (the full paintings are
// ~400KB each; ten tiles must not cost a phone 4MB)
export const WORLD_THUMBS: Record<string, string> = Object.fromEntries(
  Object.keys(WORLD_IMAGES).map((key) => [
    key,
    gqMedia(`img/grammar-quest/thumbs/${key}.jpg`)
  ])
);

// Spread nodes by distance on the 16:9 painting. A horizontal percentage
// covers more pixels than a vertical one; equal percent distances crowded
// nodes together on steep sections of a route.
export function nodePositions(worldKey: string, count: number): Point[] {
  const path = WORLD_PATHS[worldKey] || DEFAULT_PATH;
  if (count <= 0) return [];
  if (count === 1) return [path[path.length - 1]];
  const lengths = [0];
  for (let i = 1; i < path.length; i++) {
    const [x1, y1] = path[i - 1];
    const [x2, y2] = path[i];
    lengths.push(lengths[i - 1] + Math.hypot((x2 - x1) * (16 / 9), y2 - y1));
  }
  const total = lengths[lengths.length - 1];
  return Array.from({ length: count }, (_, n) => {
    const d = (total * n) / (count - 1);
    let i = 1;
    while (i < path.length - 1 && lengths[i] < d) i++;
    const t = (d - lengths[i - 1]) / (lengths[i] - lengths[i - 1] || 1);
    const [x1, y1] = path[i - 1];
    const [x2, y2] = path[i];
    return [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t] as Point;
  });
}
