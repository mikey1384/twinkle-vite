import { U, H, W, INK, r3, hash2 } from '../pixel';
import type { GroundPiece } from './types';
import type { Light, Terrain } from './themes';

// Pixel ground, one 3px column at a time: a top layer (grass, sand, snow,
// cloud fluff...), a body with a texture (pebbles, bricks, planks, ice
// cracks, circuit traces...), lips at gaps, and gaps drawn as deep shafts
// whose bands darken with depth (Mikey 10-07: pure black looked cheap).

interface Palette {
  top: string;
  topLight: string;
  body: string;
  dark: string;
  light: string;
  pattern: 'pebbles' | 'bricks' | 'planks' | 'ice' | 'cloud' | 'crystal' | 'candy' | 'metal' | 'circuit' | 'book' | 'coral' | 'moon' | 'strata';
  topRows: number;
  shaft: string[]; // gap bands, top to bottom
}

const EARTH_SHAFT = ['#8a5a30', '#76492a', '#623b25', '#4f2f21', '#40261d', '#35201b', '#2c1b19'];
const STONE_SHAFT = ['#6f6a78', '#5d5867', '#4c4757', '#3e3a48', '#332f3d', '#2a2734'];
const ICE_SHAFT = ['#7fb7e0', '#6aa2cf', '#568dbd', '#4579a8', '#386692', '#2d567c'];
const SPACE_SHAFT = ['#3a3460', '#2f2a52', '#262245', '#1f1c3a', '#1a1731', '#16142a'];
const CANDY_SHAFT = ['#e889b8', '#d7739f', '#c36089', '#a94f76', '#904366', '#793858'];

export const PALETTES: Record<Terrain, Palette> = {
  grass: { top: '#5cb83f', topLight: '#9be05e', body: '#c98f4e', dark: '#a26e38', light: '#e0b070', pattern: 'pebbles', topRows: 3, shaft: EARTH_SHAFT },
  meadow: { top: '#7fd65a', topLight: '#c8f58a', body: '#e7b874', dark: '#c99555', light: '#f6d9a0', pattern: 'pebbles', topRows: 3, shaft: EARTH_SHAFT },
  autumn: { top: '#d9822b', topLight: '#f5b44c', body: '#a9703e', dark: '#87552c', light: '#c99260', pattern: 'pebbles', topRows: 3, shaft: EARTH_SHAFT },
  sand: { top: '#f2d27a', topLight: '#fff0b0', body: '#e3b860', dark: '#c99a45', light: '#f6dc96', pattern: 'strata', topRows: 2, shaft: ['#c99a45', '#b4853a', '#9c7131', '#835e2a', '#6d4e25', '#5b4222'] },
  beach: { top: '#fbe3a0', topLight: '#fff5d0', body: '#efcf86', dark: '#d6b26a', light: '#fff0c0', pattern: 'pebbles', topRows: 2, shaft: ['#d6b26a', '#c09c58', '#a8854a', '#8f703e', '#775d35', '#634e2e'] },
  dock: { top: '#a8784a', topLight: '#d09a64', body: '#8a5f3a', dark: '#6b4529', light: '#b5835a', pattern: 'planks', topRows: 2, shaft: ['#2f6f9e', '#28628c', '#22557b', '#1d4a6b', '#19405d', '#163851'] },
  mud: { top: '#6c9a3a', topLight: '#a5c760', body: '#8a6440', dark: '#6b4a2e', light: '#a88058', pattern: 'pebbles', topRows: 3, shaft: EARTH_SHAFT },
  stone: { top: '#9b97a3', topLight: '#c9c5cf', body: '#7d7987', dark: '#5f5b69', light: '#a8a4b0', pattern: 'bricks', topRows: 1, shaft: STONE_SHAFT },
  brick: { top: '#c26a4a', topLight: '#e8946e', body: '#a85438', dark: '#7e3c27', light: '#d27f5e', pattern: 'bricks', topRows: 1, shaft: STONE_SHAFT },
  snow: { top: '#ffffff', topLight: '#ffffff', body: '#cfe3f5', dark: '#a9c6e2', light: '#eaf4ff', pattern: 'pebbles', topRows: 4, shaft: ICE_SHAFT },
  ice: { top: '#d8f2ff', topLight: '#ffffff', body: '#8fd0f2', dark: '#5fb0e0', light: '#c4ecff', pattern: 'ice', topRows: 2, shaft: ICE_SHAFT },
  cloud: { top: '#ffffff', topLight: '#ffffff', body: '#eef4ff', dark: '#cdd9ef', light: '#ffffff', pattern: 'cloud', topRows: 2, shaft: [] },
  crystal: { top: '#c9a8ff', topLight: '#f0e2ff', body: '#7b5bc4', dark: '#5a3f9c', light: '#a989f0', pattern: 'crystal', topRows: 2, shaft: SPACE_SHAFT },
  candy: { top: '#ff9ccf', topLight: '#ffd6ec', body: '#fff0f7', dark: '#ff7fb8', light: '#ffffff', pattern: 'candy', topRows: 3, shaft: CANDY_SHAFT },
  moon: { top: '#c9ccd6', topLight: '#eceef4', body: '#a4a8b5', dark: '#7f8392', light: '#c4c8d2', pattern: 'moon', topRows: 1, shaft: SPACE_SHAFT },
  metal: { top: '#9aa4b2', topLight: '#d4dbe5', body: '#6f7a8a', dark: '#525c6b', light: '#8f9aab', pattern: 'metal', topRows: 1, shaft: STONE_SHAFT },
  circuit: { top: '#29e0d0', topLight: '#b4fff6', body: '#1c2440', dark: '#121830', light: '#ff4fd8', pattern: 'circuit', topRows: 1, shaft: SPACE_SHAFT },
  book: { top: '#c0392b', topLight: '#e8705f', body: '#f4ead2', dark: '#c9b98f', light: '#ffffff', pattern: 'book', topRows: 2, shaft: EARTH_SHAFT },
  wood: { top: '#b8854f', topLight: '#dca86c', body: '#966a3c', dark: '#74502c', light: '#b98a55', pattern: 'planks', topRows: 1, shaft: EARTH_SHAFT },
  coral: { top: '#ff8fa3', topLight: '#ffc1cc', body: '#e8c58a', dark: '#c9a46a', light: '#f5dcaa', pattern: 'coral', topRows: 2, shaft: ['#2b6f9a', '#255f86', '#1f5174', '#1a4564', '#163a55', '#133049'] },
  rock: { top: '#b46a46', topLight: '#d99068', body: '#9a5636', dark: '#77402a', light: '#bf7550', pattern: 'strata', topRows: 1, shaft: ['#77402a', '#663725', '#552e20', '#47271c', '#3b2119', '#311c16'] }
};

// materials for single stretches (stone steps, bridges, pipes...)
const MATERIAL: Record<string, Palette> = {
  block: { ...PALETTES.stone, top: '#bdb7ad', topLight: '#e2ddd2', body: '#a9a39a', dark: '#7d776f', light: '#d2ccc0' },
  bridge: { ...PALETTES.wood, pattern: 'planks' },
  pipe: { top: '#3fbf4f', topLight: '#9cf2a3', body: '#2e9a3c', dark: '#1f6f2a', light: '#6fdc7c', pattern: 'metal', topRows: 3, shaft: STONE_SHAFT },
  lava: { top: '#ff8a2a', topLight: '#ffd84a', body: '#d8401e', dark: '#9c2412', light: '#ff6a2a', pattern: 'strata', topRows: 2, shaft: STONE_SHAFT },
  water: { top: '#7fd3ff', topLight: '#d6f3ff', body: '#3c9fd6', dark: '#2b7fb3', light: '#9fe0ff', pattern: 'ice', topRows: 1, shaft: ICE_SHAFT }
};

// the terrain sits in the backdrop's light
const LIGHT_TINT: Record<Light, string | null> = {
  day: null,
  sunset: 'rgba(255,120,60,.14)',
  night: 'rgba(20,30,90,.38)',
  dark: 'rgba(14,8,30,.34)',
  dream: 'rgba(170,110,255,.14)'
};

export function paletteOf(terrain: Terrain, material?: GroundPiece['material']): Palette {
  if (material && MATERIAL[material]) return MATERIAL[material];
  if (material && (PALETTES as any)[material]) return (PALETTES as any)[material];
  return PALETTES[terrain];
}

function bodyPixel(p: Palette, cx: number, row: number, depth: number, t: number) {
  const h = hash2(cx, row);
  switch (p.pattern) {
    case 'bricks': {
      const course = Math.floor(depth / 6);
      if (depth % 6 === 0) return p.dark;
      if ((cx + (course % 2) * 4) % 8 === 0) return p.dark;
      if (depth % 6 === 1) return p.light;
      return (h & 31) === 0 ? p.dark : null;
    }
    case 'planks': {
      if (depth % 5 === 0) return p.dark;
      if ((cx + Math.floor(depth / 5) * 7) % 13 === 0) return p.dark;
      return (h & 63) === 0 ? p.light : null;
    }
    case 'ice':
      if ((cx + depth * 2) % 23 === 0 || (cx - depth) % 31 === 0) return p.light;
      return (h & 63) === 0 ? '#ffffff' : null;
    case 'cloud':
      return (h & 15) === 0 ? p.dark : null;
    case 'crystal':
      if ((cx + depth) % 11 === 0 || (cx - depth) % 13 === 0) return p.light;
      return (h & 31) === 0 ? p.top : null;
    case 'candy':
      return Math.floor((cx + depth) / 4) % 2 === 0 ? p.dark : null;
    case 'metal':
      if (depth % 8 === 0) return p.dark;
      if (cx % 12 === 0) return p.dark;
      if (cx % 12 === 2 && depth % 8 === 2) return p.light;
      return null;
    case 'circuit':
      if (depth % 7 === 3 && (h & 3) !== 0) return (Math.floor(t / 120) + cx) % 24 === 0 ? '#ffffff' : p.top;
      if (cx % 9 === 0 && depth % 7 > 3) return p.light;
      return null;
    case 'book':
      if (depth % 4 === 0) return p.dark;
      return null;
    case 'coral':
      return (h & 15) === 0 ? p.top : (h & 31) === 1 ? p.dark : null;
    case 'moon':
      if ((h & 127) === 0) return p.dark;
      return (h & 63) === 1 ? p.light : null;
    case 'strata':
      if (Math.floor(depth / 4 + Math.sin(cx / 9)) % 3 === 0) return p.dark;
      return (h & 63) === 0 ? p.light : null;
    default:
      if ((h & 15) === 0) return p.dark;
      if ((h & 31) === 1) return p.light;
      return null;
  }
}

export interface TerrainView {
  pieces: GroundPiece[];
  terrain: Terrain;
  light: Light;
  groundAt(x: number): number | null;
  pieceAt(x: number): GroundPiece | undefined;
}

export function drawTerrain(g: CanvasRenderingContext2D, lv: TerrainView, cam: number, t: number) {
  const tint = LIGHT_TINT[lv.light];
  for (let sx = 0; sx < W; sx += U) {
    const wx = sx + cam;
    const pc = lv.pieceAt(wx);
    const gy = lv.groundAt(wx);
    const pal = paletteOf(lv.terrain, pc?.material);
    if (gy === null) {
      // a gap: a deep shaft (sky shows through cloud gaps)
      const base = paletteOf(lv.terrain);
      if (!base.shaft.length) continue;
      const top = pc ? pc.y0 : 309;
      const inL = pc ? wx - pc.x0 : 99;
      const inR = pc ? pc.x1 - wx : 99;
      for (let y = top; y < H; y += U) {
        const depth = y - top;
        const band = Math.min(base.shaft.length - 1, Math.floor(depth / (U * 5)));
        const dither = depth % (U * 5) === U * 4 && (Math.floor(wx / U) + Math.floor(y / U)) % 2 === 0;
        let col = base.shaft[Math.min(base.shaft.length - 1, band + (dither ? 1 : 0))];
        if (inL < U * 3) col = base.shaft[Math.max(0, band - 2)];
        else if (inR < U * 3) col = base.shaft[Math.min(base.shaft.length - 1, band + 1)];
        g.fillStyle = col;
        g.fillRect(sx, y, U, U);
      }
      if (tint) {
        g.fillStyle = tint;
        g.fillRect(sx, top, U, H - top);
      }
      continue;
    }
    g.fillStyle = pal.body;
    g.fillRect(sx, gy, U, H - gy);
    const cx = Math.floor(wx / U);
    for (let y = gy + U * pal.topRows; y < H; y += U) {
      const col = bodyPixel(pal, cx, Math.floor(y / U), (y - gy) / U, t);
      if (col) {
        g.fillStyle = col;
        g.fillRect(sx, y, U, U);
      }
    }
    // the top layer, with a few tufts dripping over the edge
    g.fillStyle = pal.top;
    g.fillRect(sx, gy, U, U * pal.topRows);
    g.fillStyle = pal.topLight;
    g.fillRect(sx, gy, U, U);
    if (pal.topRows >= 2 && hash2(cx, 7) % 5 === 0) {
      g.fillStyle = pal.top;
      g.fillRect(sx, gy + U * pal.topRows, U, U);
    }
    if (tint) {
      g.fillStyle = tint;
      g.fillRect(sx, gy, U, H - gy);
    }
  }
  // edges: dark lines down the sides of raised stretches and around gaps
  for (const pc of lv.pieces) {
    if (pc.x1 < cam - 40 || pc.x0 > cam + W + 40) continue;
    const l = r3(pc.x0 - cam);
    const r = r3(pc.x1 - cam);
    if (pc.kind === 'raised') {
      g.fillStyle = INK;
      g.fillRect(l - U, pc.y0, U, H);
      g.fillRect(r, pc.y0, U, H);
    }
    if (pc.kind === 'gap') {
      const pal = paletteOf(lv.terrain);
      if (!pal.shaft.length) continue;
      g.fillStyle = pal.top;
      g.fillRect(l, pc.y0, U * 2, U * 4);
      g.fillRect(r - U * 2, pc.y0, U * 2, U * 4);
      g.fillStyle = pal.topLight;
      g.fillRect(l, pc.y0, U * 2, U);
      g.fillRect(r - U * 2, pc.y0, U * 2, U);
      // roots / icicles / drips hanging from the lips
      for (const [dx, len] of [[4, 4], [9, 7], [15, 3], [-6, 5], [-11, 8], [-17, 3]]) {
        const x = dx > 0 ? l + dx * U : r + dx * U;
        if (x < l || x > r) continue;
        for (let k = 0; k < len; k++) {
          g.fillStyle = k < 2 ? pal.top : pal.dark;
          g.fillRect(x + (k > 3 ? U : 0), pc.y0 + U * 3 + k * U, U, U);
        }
      }
      // dust motes drifting up the shaft
      for (let i = 0; i < 5; i++) {
        const span = r - l - U * 8;
        const ph = (t / 40 + i * 37) % 90;
        g.fillStyle = `rgba(255,214,150,${0.35 * (1 - ph / 90)})`;
        g.fillRect(r3(l + U * 4 + ((i * 53) % Math.max(1, span))), r3(H - ph * 0.9), U, U);
      }
    }
  }
}
