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

// Read off each painting with a percent grid (quest/render/grid, 10-06).
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
    [18, 94],
    [22, 78],
    [30, 66],
    [40, 56],
    [50, 46],
    [57, 38],
    [66, 34],
    [74, 28],
    [82, 22],
    [86, 16]
  ],
  'windmill-hills': [
    [20, 94],
    [26, 80],
    [30, 66],
    [40, 58],
    [52, 54],
    [60, 46],
    [64, 40],
    [74, 38],
    [84, 32],
    [90, 24],
    [89, 17]
  ],
  'forest-of-clauses': [
    [22, 94],
    [26, 80],
    [30, 66],
    [40, 60],
    [52, 58],
    [64, 56],
    [72, 46],
    [78, 40],
    [86, 34],
    [92, 24],
    [90, 17]
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
    [8, 94],
    [22, 88],
    [36, 80],
    [46, 66],
    [56, 56],
    [62, 46],
    [70, 40],
    [78, 34],
    [86, 26],
    [91, 18]
  ],
  'sky-library': [
    [10, 94],
    [16, 80],
    [22, 66],
    [34, 74],
    [44, 72],
    [48, 56],
    [56, 46],
    [64, 42],
    [74, 38],
    [82, 32],
    [88, 22]
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

// Spread `count` nodes evenly by distance along the world's path.
export function nodePositions(worldKey: string, count: number): Point[] {
  const path = WORLD_PATHS[worldKey] || DEFAULT_PATH;
  if (count <= 0) return [];
  if (count === 1) return [path[path.length - 1]];
  const lengths = [0];
  for (let i = 1; i < path.length; i++) {
    const [x1, y1] = path[i - 1];
    const [x2, y2] = path[i];
    lengths.push(lengths[i - 1] + Math.hypot(x2 - x1, y2 - y1));
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
