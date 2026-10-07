import { INK, PIXEL_FONT } from './MarbleRun/pixel';
import { marbleSprite, type Face, type Grade } from './MarbleRun/marble';

// The pixel-adventure kit for Quest's screens around the game (10-07: the
// map, cards and results should look like the marble run and the painted
// worlds). Everything is drawn as tiny SVG pixel grids: frames go on as
// border-images, so panels get stepped pixel corners at any size; icons and
// map nodes are the same grids drawn bigger. Static only, no canvas.

export { INK, PIXEL_FONT };

// rows of characters, one per pixel; '.' is see-through
export function pixelSvg(rows: string[], palette: Record<string, string>) {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  let body = '';
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let run = 1;
      while (row[x + run] === ch) run++;
      const fill = palette[ch];
      if (ch !== '.' && fill) {
        body += `<rect x="${x}" y="${y}" width="${run}" height="1" fill="${fill}"/>`;
      }
      x += run;
    }
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${body}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export interface Palette {
  k: string; // outline
  l: string; // top-left highlight
  f: string; // face
  s: string; // bottom-right shade
}

// 9x9 frame, sliced 3/3/3: notched pixel corners, a light bevel on the top
// and left, a shade on the bottom and right
const FRAME = [
  '..kkkkk..',
  '.klllllk.',
  'klfffffsk',
  'klfffffsk',
  'klfffffsk',
  'klfffffsk',
  'klfffffsk',
  '.ksssssk.',
  '..kkkkk..'
];

const frameCache = new Map<string, string>();
function frameUri(p: Palette) {
  const key = `${p.k}|${p.l}|${p.f}|${p.s}`;
  let uri = frameCache.get(key);
  if (!uri) {
    uri = pixelSvg(FRAME, { ...p });
    frameCache.set(key, uri);
  }
  return uri;
}

// CSS for a framed box; `scale` is how many screen pixels one art pixel is
// (fill = false keeps the element's own background inside the frame)
export function frame(p: Palette, scale = 3, fill = true) {
  const b = 3 * scale;
  return `
    border: ${b}px solid transparent;
    border-image: url("${frameUri(p)}") 3 ${fill ? 'fill ' : ''}/ ${b}px stretch;
    ${fill ? 'background: none;' : 'background-clip: padding-box;'}
    border-radius: 0;
  `;
}

export const PARCHMENT: Palette = {
  k: INK,
  l: '#fffbea',
  f: '#f6e6bf',
  s: '#d6b46f'
};
export const WOOD: Palette = {
  k: INK,
  l: '#e0a25f',
  f: '#b06a35',
  s: '#6e3d1b'
};
export const GOLD: Palette = {
  k: INK,
  l: '#fff1a8',
  f: '#ffcb32',
  s: '#d18b00'
};
export const BLUE: Palette = {
  k: INK,
  l: '#a9d4ff',
  f: '#418ceb',
  s: '#2a5fb0'
};
export const GREY: Palette = {
  k: '#4a4458',
  l: '#e6e8ee',
  f: '#b8bec9',
  s: '#8a909c'
};
export const STONE: Palette = {
  k: INK,
  l: '#8d93a3',
  f: '#5a6072',
  s: '#3a3f4d'
};
export const PLATE: Palette = {
  k: INK,
  l: 'rgba(255,255,255,0.22)',
  f: 'rgba(26,20,38,0.8)',
  s: 'rgba(0,0,0,0.4)'
};
export const TAG: Palette = {
  k: INK,
  l: '#ffffff',
  f: '#fffdf5',
  s: '#e2cf9e'
};
export const ROSE: Palette = {
  k: INK,
  l: '#ffe9ee',
  f: '#ffd3dd',
  s: '#e8899d'
};
export const NIGHT: Palette = {
  k: '#0d0816',
  l: '#5b3a7e',
  f: '#1d1430',
  s: '#120c1f'
};

// A chunky game button: framed face, a solid pixel drop below, pressed down
// on tap. Disabled buttons turn to grey stone.
export function button(p: Palette, depth: string, text = '#3b2200') {
  return `
    ${frame(p, 3)}
    font-family: ${PIXEL_FONT};
    color: ${text};
    line-height: 1.4;
    cursor: pointer;
    filter: drop-shadow(0 4px 0 ${depth});
    transition: transform 0.06s;
    &:hover:not(:disabled) {
      transform: translateY(-1px);
    }
    &:active:not(:disabled) {
      transform: translateY(4px);
      filter: none;
    }
    &:disabled {
      ${frame(GREY, 3)}
      color: #5b6270;
      text-shadow: none;
      filter: drop-shadow(0 4px 0 #6b7080);
      cursor: default;
    }
  `;
}

// Pixel text shadow, like the canvas HUD's ink outline
export const inkShadow = (n = 2, col = INK) =>
  `text-shadow: ${n}px 0 0 ${col}, -${n}px 0 0 ${col}, 0 ${n}px 0 ${col}, 0 -${n}px 0 ${col}, ${n}px ${n}px 0 ${col};`;

// A shaded round disc, `n` art pixels wide: ink rim, bevel ring, glint.
// Map nodes are coins and stones; marbles add the sphere's banded light.
export function discRows(
  n: number,
  {
    sphere = false,
    dotted = false
  }: { sphere?: boolean; dotted?: boolean } = {}
) {
  const r = n / 2;
  const rows: string[] = [];
  for (let y = 0; y < n; y++) {
    let row = '';
    for (let x = 0; x < n; x++) {
      const u = (x + 0.5 - r) / r;
      const v = (y + 0.5 - r) / r;
      const d = Math.hypot(u, v);
      const edge = 1 - 1.15 / r;
      if (d > 1) row += '.';
      else if (d > edge) row += dotted && (x + y) % 2 ? 'f' : 'k';
      else if (Math.hypot(u + 0.36, v + 0.4) < (n > 10 ? 0.2 : 0.26))
        row += 'g';
      else if (sphere) {
        // light from the top left, in bands like marbleSprite
        const z = Math.sqrt(Math.max(0, 1 - d * d));
        const lit = -0.55 * u - 0.65 * v + 0.55 * z;
        row += lit > 0.75 ? 'l' : lit > 0.25 ? 'f' : lit > -0.1 ? 's' : 'd';
      } else if (d > edge - 2 / r) row += u + v < 0 ? 'l' : 's';
      else row += 'f';
    }
    rows.push(row);
  }
  return rows;
}

// Small pixel icons for chips, rewards and markers (k = ink outline)
const ICONS: Record<
  string,
  { rows: string[]; palette: Record<string, string> }
> = {
  coin: {
    rows: [
      '..kkkk..',
      '.kyyyyk.',
      'kywyyyok',
      'kywoyyok',
      'kywoyyok',
      'kyyyyyok',
      '.kooook.',
      '..kkkk..'
    ],
    palette: { k: INK, y: '#ffcb32', w: '#fff6b0', o: '#c98a00' }
  },
  star: {
    rows: [
      '....k....',
      '...kyk...',
      '...kyk...',
      'kkkywykkk',
      '.kyyyyyk.',
      '..kyyyk..',
      '.kyyoyyk.',
      '.kyk.kyk.',
      '.kk...kk.'
    ],
    palette: { k: INK, y: '#ffd84a', w: '#fffbe0', o: '#e0a000' }
  },
  ghost: {
    rows: [
      '..kkkk..',
      '.kwwwwk.',
      'kwwwwwwk',
      'kwkwwkwk',
      'kwkwwkwk',
      'kwwwwwwk',
      'kwwwwwgk',
      'kwgwwgwk',
      'kk.kk.kk'
    ],
    palette: { k: INK, w: '#f3eefc', g: '#c4b5e0' }
  },
  book: {
    rows: [
      '.kkkkkkk',
      'kbbbbbbk',
      'kbyyyybk',
      'kbbbbbbk',
      'kbbbbbbk',
      'kbbbbbbk',
      'kbbbbbbk',
      'kppppppk',
      '.kkkkkkk'
    ],
    palette: { k: INK, b: '#418ceb', y: '#ffcb32', p: '#fff6dc' }
  },
  soundOn: {
    rows: [
      '....k.....',
      '...kk...c.',
      'kkkwk.c..c',
      'kwwwk..c.c',
      'kwwwk..c.c',
      'kkkwk.c..c',
      '...kk...c.',
      '....k.....'
    ],
    // light outline: these sit on the dark status-bar plates
    palette: { k: '#e8ecf6', w: '#7f8bb0', c: '#9fe0ff' }
  },
  soundOff: {
    rows: [
      '....k.....',
      '...kk.....',
      'kkkwk.r..r',
      'kwwwk..rr.',
      'kwwwk..rr.',
      'kkkwk.r..r',
      '...kk.....',
      '....k.....'
    ],
    palette: { k: '#e8ecf6', w: '#7f8bb0', r: '#ff6b81' }
  },
  musicOn: {
    rows: [
      '...kkkkk',
      '...kyyyk',
      '...k...k',
      '...k...k',
      '.kkk.kkk',
      'kyyk.kyy',
      'kyyk.kyy',
      '.kk...kk'
    ],
    palette: { k: '#e8ecf6', y: '#ffcb32' }
  },
  musicOff: {
    rows: [
      '...kkkkk..',
      '...kyyyk..',
      '...k...k..',
      '...k...k.r',
      '.kkk.kkkr.',
      'kyyk.kyr..',
      'kyyk.kr...',
      '.kk..r....'
    ],
    palette: { k: '#9aa3bd', y: '#7f8bb0', r: '#ff6b81' }
  },
  tower: {
    rows: [
      'kkk.kkk.kkk',
      'kak.kak.kak',
      'kakkkakkkak',
      'kaaaaaaaaak',
      '.kasssssak.',
      '.kasdsdsak.',
      '.kasssssak.',
      '.kaskkksak.',
      '.kaskdksak.',
      '.kaskdksak.',
      '.kkkkkkkkk.'
    ],
    palette: { k: INK, a: '#efe6d6', s: '#c9bda8', d: '#3a2a4a' }
  },
  crown: {
    rows: [
      'k....k....k',
      'kk..kyk..kk',
      'kyk.kyk.kyk',
      'kyykyyykyyk',
      'kyyyyyyyyyk',
      'kyryybyyryk',
      'kyyyyyyyyyk',
      'koooooooook',
      'kkkkkkkkkkk'
    ],
    palette: { k: INK, y: '#ffd84a', o: '#c98a00', r: '#ff4f6d', b: '#5ab8ff' }
  },
  lock: {
    rows: [
      '..kkkkk..',
      '.kgggggk.',
      '.kgk.kgk.',
      '.kgk.kgk.',
      'kkkkkkkkk',
      'kyyyyyyyk',
      'kyyykyyyk',
      'kyyykyyyk',
      'koooooook',
      'kkkkkkkkk'
    ],
    palette: { k: INK, g: '#d6dae2', y: '#ffcb32', o: '#c98a00' }
  },
  flag: {
    rows: [
      '.k.....',
      'kpkkkk.',
      'kprrrrk',
      'kprrrk.',
      'kpkkk..',
      'kpk....',
      'kpk....',
      'kpk....',
      'kkk....'
    ],
    palette: { k: INK, p: '#f3eefc', r: '#ff4f6d' }
  },
  check: {
    rows: [
      '......kk',
      '.....kgk',
      'kk..kgk.',
      'kgkkgk..',
      '.kggk...',
      '..kk....'
    ],
    palette: { k: INK, g: '#4fd17c' }
  },
  arrow: {
    rows: ['kkkkkkk', 'kyyyyyk', '.kyyyk.', '..kyk..', '...k...'],
    palette: { k: INK, y: '#ffd84a' }
  },
  sparkle: {
    rows: ['..w..', '..w..', 'wwwww', '..w..', '..w..'],
    palette: { w: '#ffffff' }
  }
};

export type IconName = keyof typeof ICONS;

const iconCache = new Map<string, { uri: string; w: number; h: number }>();
export function iconUri(name: IconName) {
  let hit = iconCache.get(name);
  if (!hit) {
    const { rows, palette } = ICONS[name];
    hit = {
      uri: pixelSvg(rows, palette),
      w: Math.max(...rows.map((r) => r.length)),
      h: rows.length
    };
    iconCache.set(name, hit);
  }
  return hit;
}

// the marble run's own pixel marble (24x24), drawn once and kept as an image
const spriteCache = new Map<string, string>();
export function spriteUri(grade: Grade | null, face: Face = 'happy') {
  const key = `${grade || 'glass'}|${face}`;
  let uri = spriteCache.get(key);
  if (!uri) {
    uri = marbleSprite(grade, face, 0).toDataURL();
    spriteCache.set(key, uri);
  }
  return uri;
}
