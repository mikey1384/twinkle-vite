// Word battle pixel art: original icons and three battle backdrops, drawn as
// tiny SVG pixel grids (no image files, no gradients). Backdrops get tougher
// with the word: a sunny meadow, a dusk forest, a lava keep for bosses.
import { pixelSvg } from '~/containers/Home/GrammarGameModal/Quest/pixelUi';

const INK = '#1a1426';

export const HEART = pixelSvg(
  [
    '.kk.kk.',
    'krrkrhk',
    'krrrrrk',
    'krrrrrk',
    '.krrrk.',
    '..krk..',
    '...k...'
  ],
  { k: INK, r: '#ff3b5c', h: '#ffd1da' }
);
export const HEART_EMPTY = pixelSvg(
  [
    '.kk.kk.',
    'kddkddk',
    'kdddddk',
    'kdddddk',
    '.kdddk.',
    '..kdk..',
    '...k...'
  ],
  { k: INK, d: '#4a3f5e' }
);

// Word battles v2: half a heart, the card's shield and its sparkle.
export const HEART_HALF = pixelSvg(
  [
    '.kk.kk.',
    'krrkddk',
    'krrdddk',
    'krrdddk',
    '.krddk.',
    '..kdk..',
    '...k...'
  ],
  { k: INK, r: '#ff3b5c', d: '#4a3f5e' }
);
export const SHIELD = pixelSvg(
  [
    '.kkkkkkk.',
    'kwwwwwwwk',
    'kwbbbbbwk',
    'kwbwwwbwk',
    'kwbwwwbwk',
    'kwbbbbbwk',
    '.kwbbbwk.',
    '..kwbwk..',
    '...kwk...',
    '....k....'
  ],
  { k: INK, w: '#ffffff', b: '#5aa9ff' }
);
// A related card's block: the shield holds, but cracks (half the hit gets
// through).
export const SHIELD_CRACKED = pixelSvg(
  [
    '.kkkkkkk.',
    'kwwwkwwwk',
    'kwbbkbbwk',
    'kwbwwkbwk',
    'kwbwkwbwk',
    'kwbbkbbwk',
    '.kwbbkwk.',
    '..kwbwk..',
    '...kwk...',
    '....k....'
  ],
  { k: INK, w: '#ffffff', b: '#5aa9ff' }
);
export const SWORD = pixelSvg(
  [
    '......kkk',
    '.....kwwk',
    '....kwwk.',
    '...kwwk..',
    'kk.kwk...',
    'kykwk....',
    '.kyk.....',
    'kykyk....',
    'kk.kk....'
  ],
  { k: INK, w: '#ffffff', y: '#ffd34d' }
);
export const STAR = pixelSvg(
  ['...y...', '...y...', '..yyy..', 'yyywyyy', '..yyy..', '...y...', '...y...'],
  { y: '#ffd34d', w: '#ffffff' }
);

export const LOOT_ICONS = {
  xp: pixelSvg(
    [
      '....kk....',
      '...kyyk...',
      '..kyhyyk..',
      '.kyhyyyyk.',
      'kyyyyyyyyk',
      '.kyyyyyok.',
      '..kyyyok..',
      '...kyok...',
      '....kk....'
    ],
    { k: INK, y: '#7ef0a8', h: '#e9fff1', o: '#2fb869' }
  ),
  battery: pixelSvg(
    [
      '...kkkk...',
      '..kkkkkk..',
      '.kwwwwwwk.',
      '.kggggggk.',
      '.kggyyggk.',
      '.kgyyyggk.',
      '.kggyyygk.',
      '.kggyyggk.',
      '.kggggggk.',
      '.kggggggk.',
      '..kkkkkk..'
    ],
    { k: INK, w: '#ffffff', g: '#3ad16f', y: '#fff36b' }
  ),
  card: pixelSvg(
    [
      'kkkkkkkkkkkk',
      'kggggggggggk',
      'kgbbbbbbbbgk',
      'kgbbbbsbbbgk',
      'kgbbbbsbbbgk',
      'kgbbbswsbbgk',
      'kgbssswsssgk',
      'kgbbbswsbbgk',
      'kgbbbbsbbbgk',
      'kgbbbbsbbbgk',
      'kgbbbbbbbbgk',
      'kgbpbbbbpbgk',
      'kgbbbbbbbbgk',
      'kggggggggggk',
      'kkkkkkkkkkkk'
    ],
    { k: '#000000', b: '#15121c', g: '#ffd34d', s: '#b9a6ff', w: '#ffffff', p: '#ffd34d' }
  ),
  dust: pixelSvg(
    [
      '..........',
      '...dd.....',
      '..dddd.d..',
      '.dddddddd.',
      '..dddddd..',
      '...d..d...',
      '..........'
    ],
    { d: '#b9b2c8' }
  )
} as const;

export type LootIcon = keyof typeof LOOT_ICONS;

export const SPEAKER = pixelSvg(
  ['...k..', '..kk.w', 'kkkk..', 'kkkk.w', 'kkkk..', '..kk.w', '...k..'],
  { k: '#ffffff', w: '#ffd34d' }
);
export const SCROLL = pixelSvg(
  ['.kkkkk.', 'kpppppk', '.kpkpk.', '.kpppk.', '.kpkpk.', 'kpppppk', '.kkkkk.'],
  { k: '#ffffff', p: '#f6e6bf' }
);

interface Scene {
  sky: string;
  far: string;
  near: string;
  ground: string;
  groundLine: string;
  accent: string;
  stars: boolean;
}

const SCENES: Record<'meadow' | 'forest' | 'keep', Scene> = {
  meadow: {
    sky: '#8fd3ff',
    far: '#b6e3a0',
    near: '#5fb36a',
    ground: '#d9b77a',
    groundLine: '#b8925a',
    accent: '#ffffff',
    stars: false
  },
  forest: {
    sky: '#3b2d63',
    far: '#4b3f7a',
    near: '#24493d',
    ground: '#5d4a3f',
    groundLine: '#463529',
    accent: '#ffe9a8',
    stars: true
  },
  keep: {
    sky: '#1c0f22',
    far: '#3a1830',
    near: '#2a1420',
    ground: '#3d2226',
    groundLine: '#ff6a2a',
    accent: '#ffb347',
    stars: true
  }
};

export function sceneFor(level: number) {
  return level >= 5 ? 'keep' : level >= 3 ? 'forest' : 'meadow';
}

const backdropCache = new Map<string, string>();
// 96 x 54 pixels, scaled up with image-rendering: pixelated.
export function backdropUri(level: number) {
  const key = sceneFor(level);
  const hit = backdropCache.get(key);
  if (hit) return hit;
  const s = SCENES[key];
  const W = 96;
  const H = 54;
  const rects: string[] = [];
  const rect = (x: number, y: number, w: number, h: number, fill: string) =>
    rects.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`);
  rect(0, 0, W, H, s.sky);
  if (s.stars) {
    const stars = [
      [6, 4], [15, 9], [27, 3], [38, 7], [52, 2], [61, 10], [73, 5], [84, 8], [91, 3], [44, 12], [20, 14], [80, 14]
    ];
    for (const [x, y] of stars) rect(x, y, 1, 1, s.accent);
    rect(78, 4, 4, 4, s.accent); // moon
    rect(79, 3, 2, 1, s.accent);
    rect(79, 8, 2, 1, s.accent);
  } else {
    // clouds
    for (const [x, y, w] of [[8, 6, 12], [11, 4, 6], [60, 9, 14], [64, 7, 7]] as const) {
      rect(x, y, w, 2, s.accent);
    }
  }
  // far hills / peaks: stepped silhouette
  const far = key === 'keep'
    ? [20, 18, 15, 13, 16, 19, 22, 17, 12, 10, 14, 18, 21, 19, 16, 18]
    : [26, 24, 22, 21, 22, 24, 25, 23, 21, 20, 21, 23, 25, 24, 23, 24];
  far.forEach((top, i) => rect(i * 6, top, 6, 40 - top, s.far));
  // near hills or tree line
  const near = key === 'forest'
    ? [30, 27, 29, 26, 30, 28, 25, 29, 27, 30, 26, 28, 29, 27, 30, 28]
    : [33, 31, 32, 30, 31, 33, 32, 30, 31, 32, 33, 31, 30, 32, 31, 33];
  near.forEach((top, i) => rect(i * 6, top, 6, 40 - top, s.near));
  if (key === 'forest') {
    for (let x = 2; x < W; x += 9) {
      rect(x + 2, 22 + (x % 4), 1, 6, s.groundLine); // trunks peeking out
    }
  }
  if (key === 'keep') {
    // a far tower with a lit window
    rect(10, 12, 6, 24, '#120812');
    rect(9, 10, 8, 3, '#120812');
    rect(12, 16, 2, 2, s.accent);
  }
  // ground
  rect(0, 38, W, H - 38, s.ground);
  rect(0, 38, W, 1, s.groundLine);
  for (let y = 42; y < H; y += 5) {
    for (let x = (y % 10 === 2 ? 0 : 6); x < W; x += 12) rect(x, y, 5, 1, s.groundLine);
  }
  // the monster's patch of ground
  rect(30, 44, 36, 3, 'rgba(0,0,0,0.18)');
  rect(34, 43, 28, 1, 'rgba(0,0,0,0.12)');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">${rects.join('')}</svg>`;
  const uri = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  backdropCache.set(key, uri);
  return uri;
}
