// Word Monster generator (2026-11-22). No dependencies. Word + level in, composed sprite out.
// Approved art (Mikey 11-22); the source of record with its sheets and tools is
// work/word-monsters-20261122 in the Twinkle workspace.
// The readable rules live in RULES.md; `recipeFor` is their only implementation.
import {
  SIZE, CX, GROUND, PALETTES, SHARED_COLOURS, HEADS, BODIES, HEAD_OVERLAP, TOPPERS, MOUTHS, EYES,
  CLOSED_EYES, MOUTH_Y, ARMS, LEGS, TAILS, WINGS, BELLIES, SPIKES, CROWN, SIDEKICK, FLAME_PATTERN, BAYER4,
  type Blob, type Sprite
} from './kit';

const S = SIZE;
const N = S * S;

// ---------------------------------------------------------------------------------------------
// 1. Rules: spelling -> recipe
// ---------------------------------------------------------------------------------------------
const KEYPAD = ['abc', 'def', 'ghi', 'jkl', 'mno', 'pqrs', 'tuv', 'wxyz'];
const VOWELS = 'aeiou';
const TALL = 'bdfhklt';
const HANGING = 'gjpqy';
const DIGIT_LETTERS = 'jabcdefghi'; // 0->j, 1->a ... 9->i (only used when a word has no letters)

export interface MonsterRecipe {
  word: string; // as given
  letters: string; // a-z only, what the rules read
  level: number; // 1..5
  head: number; // 0..7  first letter's keypad key
  topper: number; // 0..3  first letter's place on that key
  body: number; // 0..7  number of letters
  eyes: number; // 0..5  number of vowels
  mouth: number; // 0..5  first vowel (a e i o u, none)
  palette: number; // 0..12 second letter on the colour chart
  arms: number; // 0..2  tall letters
  legs: number; // 0..2  hanging letters
  tail: number; // 0..7  last letter's keypad key
  belly: number; // 0..7  keypad key of the letter before the last
  wings: number; // -1 none, 0 bat, 1 feather
  sidekicks: number; // 0..2  extra words in a phrase
  spikes: number; // 0..3  level
  aura: number; // 0 none, 1 glow, 2 flames
  angry: boolean;
  crown: boolean;
}

const LEVEL_TOUCHES = [
  { spikes: 0, aura: 0, angry: false, crown: false, dark: 0 },
  { spikes: 0, aura: 0, angry: false, crown: false, dark: 0 },
  { spikes: 1, aura: 0, angry: false, crown: false, dark: 0 },
  { spikes: 2, aura: 0, angry: false, crown: false, dark: 0.1 },
  { spikes: 3, aura: 1, angry: true, crown: false, dark: 0.22 },
  { spikes: 3, aura: 2, angry: true, crown: true, dark: 0.38 }
];

/** Split a word or phrase into its a-z words. Accents are folded; everything else is dropped. */
export function wordChunks(word: string): string[] {
  const clean = String(word ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const chunks = clean.split(/[^a-z0-9']+/).map((c) => c.replace(/[^a-z]/g, '')).filter(Boolean);
  if (chunks.length) return chunks;
  const digits = clean.replace(/[^0-9]/g, '');
  if (digits) return [digits.split('').map((d) => DIGIT_LETTERS[Number(d)]).join('')];
  return ['zzz']; // nothing readable: a sleeping monster
}

function keyOf(letter: string): [number, number] {
  for (let k = 0; k < KEYPAD.length; k++) {
    const place = KEYPAD[k].indexOf(letter);
    if (place >= 0) return [k, place];
  }
  return [0, 0];
}
const countIn = (letters: string, set: string) => letters.split('').filter((c) => set.includes(c)).length;
const BODY_BY_LENGTH = (n: number) => (n <= 2 ? 0 : n === 3 ? 1 : n === 4 ? 2 : n === 5 ? 3 : n === 6 ? 4 : n <= 8 ? 5 : n <= 11 ? 6 : 7);

export function recipeFor(word: string, level: number): MonsterRecipe {
  const chunks = wordChunks(word);
  const letters = chunks.join('');
  const lv = Math.min(5, Math.max(1, Math.round(Number(level) || 1)));
  const first = letters[0];
  const second = letters[1] ?? first;
  const last = letters[letters.length - 1];
  const [headKey, headPlace] = keyOf(first);
  const [tailKey] = keyOf(last);
  const [bellyKey] = keyOf(letters[letters.length - 2] ?? first);
  const vowelCount = countIn(letters, VOWELS);
  const firstVowel = letters.split('').find((c) => VOWELS.includes(c));
  let wings = -1;
  for (const chunk of chunks) {
    for (let i = 1; i < chunk.length && wings < 0; i++) {
      if (chunk[i] === chunk[i - 1]) wings = VOWELS.includes(chunk[i]) ? 1 : 0;
    }
  }
  const touch = LEVEL_TOUCHES[lv];
  return {
    word, letters, level: lv,
    head: headKey,
    topper: headPlace,
    body: BODY_BY_LENGTH(letters.length),
    eyes: Math.min(5, vowelCount),
    mouth: firstVowel ? VOWELS.indexOf(firstVowel) : 5,
    palette: Math.max(0, PALETTES.findIndex((p) => p.letters.includes(second))),
    arms: Math.min(2, countIn(letters, TALL)),
    legs: Math.min(2, countIn(letters, HANGING)),
    tail: tailKey,
    belly: bellyKey,
    wings,
    sidekicks: Math.min(2, chunks.length - 1),
    spikes: touch.spikes, aura: touch.aura, angry: touch.angry, crown: touch.crown
  };
}

/** The recipe in words, one line per rule, for a "why does it look like this?" panel. */
export function explain(r: MonsterRecipe): string[] {
  const L = r.letters;
  const first = L[0].toUpperCase();
  const last = L[L.length - 1].toUpperCase();
  const second = (L[1] ?? L[0]).toUpperCase();
  const vowels = countIn(L, VOWELS);
  const out = [
    `Starts with ${first}: ${HEADS[r.head].name} head with ${TOPPERS[r.topper].name.toLowerCase()}`,
    `${L.length} letter${L.length === 1 ? '' : 's'}: ${BODIES[r.body].name} body`,
    `${vowels} vowel${vowels === 1 ? '' : 's'}: ${EYES[r.eyes].name.toLowerCase()}`,
    `Mouth: ${MOUTHS[r.mouth].name}`,
    `Second letter ${second}: ${PALETTES[r.palette].name} colours`,
    `Tall letters (b d f h k l t): ${countIn(L, TALL)} -> ${ARMS[r.arms].name.toLowerCase()}`,
    `Hanging letters (g j p q y): ${countIn(L, HANGING)} -> ${LEGS[r.legs].name.toLowerCase()}`,
    `Ends with ${last}: ${TAILS[r.tail].name.toLowerCase()} tail`,
    `Letter before the last is ${(L[L.length - 2] ?? L[0]).toUpperCase()}: ${BELLIES[r.belly].name.toLowerCase()} belly`
  ];
  if (r.wings >= 0) out.push(`Double letter: ${WINGS[r.wings].name.toLowerCase()}`);
  if (r.sidekicks) out.push(`${r.sidekicks + 1} words: ${r.sidekicks} sidekick${r.sidekicks > 1 ? 's' : ''}`);
  out.push(`Level ${r.level}: ${['', 'no extras', 'one pair of spikes', 'two pairs of spikes, deeper colours', 'three pairs of spikes, glow, fierce brows', 'boss: crown, flame aura, glowing eyes, darkest colours'][r.level]}`);
  return out;
}

// ---------------------------------------------------------------------------------------------
// 2. Palette: 24 indexed colours for a recipe (level deepens the body colour)
// ---------------------------------------------------------------------------------------------
function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  let out = 0;
  for (const shift of [16, 8, 0]) {
    const ca = (pa >> shift) & 255;
    const cb = (pb >> shift) & 255;
    out |= Math.round(ca + (cb - ca) * t) << shift;
  }
  return '#' + out.toString(16).padStart(6, '0');
}

export function paletteFor(r: MonsterRecipe): string[] {
  const p = PALETTES[r.palette];
  const dark = LEVEL_TOUCHES[r.level].dark;
  const deep = (c: string, k = 1) => mix(c, p.outline, dark * k);
  const boss = r.level === 5;
  return [
    '#00000000',
    mix(p.outline, '#000000', dark * 0.5),
    deep(p.primary[0]), deep(p.primary[1]), deep(p.primary[2]),
    deep(p.secondary[0], 0.5), deep(p.secondary[1], 0.5), deep(p.secondary[2], 0.5),
    p.accent[0], p.accent[1], p.accent[2],
    boss ? mix(SHARED_COLOURS.eyeWhite, p.aura[1], 0.35) : SHARED_COLOURS.eyeWhite,
    SHARED_COLOURS.pupil, SHARED_COLOURS.mouth, SHARED_COLOURS.tongue, SHARED_COLOURS.tooth,
    p.aura[0], p.aura[1],
    SHARED_COLOURS.gold[0], SHARED_COLOURS.gold[1], SHARED_COLOURS.gold[2],
    SHARED_COLOURS.shine, SHARED_COLOURS.gem,
    mix(p.primary[2], '#ff7a9c', 0.6)
  ];
}

// ---------------------------------------------------------------------------------------------
// 3. Compositor
// ---------------------------------------------------------------------------------------------
interface Cell { x: number; y: number; k: string }
const RAMP: Record<string, number> = { p: 3, s: 6, a: 9, g: 19 };
const FIXED: Record<string, number> = { P: 2, S: 5, A: 8, G: 18, k: 1, w: 11, e: 12, m: 13, t: 14, T: 15, h: 21, j: 22, b: 23 };

const hwOf = (b: Blob, row: number): number => {
  const v = b.rows[row];
  return v === undefined ? 0 : typeof v === 'number' ? v : v[0];
};
const gapOf = (b: Blob, row: number): number => {
  const v = b.rows[row];
  return v === undefined || typeof v === 'number' ? 0 : v[1];
};
/** first row of the blob that is filled, d pixels out from the middle line */
function topAt(b: Blob, d: number): number {
  for (let r = 0; r < b.rows.length; r++) if (hwOf(b, r) > d && gapOf(b, r) <= d) return r;
  return 0;
}

function blobCells(b: Blob, top: number, kind = 'p'): Cell[] {
  const cells: Cell[] = [];
  for (let r = 0; r < b.rows.length; r++) {
    const hw = hwOf(b, r);
    const gap = gapOf(b, r);
    for (let d = gap; d < hw; d++) {
      cells.push({ x: CX + d, y: top + r, k: kind }, { x: CX - 1 - d, y: top + r, k: kind });
    }
  }
  return cells;
}

/** place a sprite so its anchor lands on (X, Y); mirror flips it left-right around the anchor */
function spriteCells(s: Sprite, X: number, Y: number, mirror = false): Cell[] {
  const cells: Cell[] = [];
  for (let cy = 0; cy < s.rows.length; cy++) {
    const row = s.rows[cy];
    for (let cx = 0; cx < row.length; cx++) {
      const k = row[cx];
      if (k === '.') continue;
      cells.push({ x: mirror ? X - (cx - s.ax) : X + (cx - s.ax), y: Y + (cy - s.ay), k });
    }
  }
  return cells;
}
/** a left part and its mirror image on the right */
function pairCells(s: Sprite, leftX: number, Y: number): Cell[] {
  return [...spriteCells(s, leftX, Y), ...spriteCells(s, S - 1 - leftX, Y, true)];
}

/**
 * Stamp one part. Ramp colours are shaded from the part's own outline (light from the top left),
 * and `sep` draws a dark seam where the part sits on top of something already drawn.
 */
function stamp(cv: Uint8Array, cells: Cell[], opt: { sep?: boolean; depth?: number } = {}): void {
  const mask = new Uint8Array(N);
  const inside = (x: number, y: number) => x >= 0 && x < S && y >= 0 && y < S;
  for (const c of cells) if (inside(c.x, c.y)) mask[c.y * S + c.x] = 1;
  const M = (x: number, y: number) => inside(x, y) && mask[y * S + x] === 1;
  if (opt.sep) {
    for (const c of cells) {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const x = c.x + dx;
        const y = c.y + dy;
        if (inside(x, y) && !M(x, y) && cv[y * S + x] !== 0) cv[y * S + x] = 1;
      }
    }
  }
  const deep = (opt.depth ?? 1) >= 2;
  for (const c of cells) {
    if (!inside(c.x, c.y)) continue;
    let idx = FIXED[c.k];
    const base = RAMP[c.k];
    if (base !== undefined) {
      const { x, y } = c;
      const below = !M(x, y + 1) || (deep && (!M(x, y + 2) || !M(x + 1, y + 1)));
      const right = !M(x + 1, y) || (deep && !M(x + 2, y));
      if (below) idx = base - 1;
      else if (!M(x, y - 1)) idx = base + 1;
      else if (right) idx = base - 1;
      else if (!M(x - 1, y)) idx = base + 1;
      else idx = base;
    }
    if (idx !== undefined) cv[c.y * S + c.x] = idx;
  }
}

function eyeCells(cells: Cell[], x0: number, y0: number, w: number, h: number, r: MonsterRecipe, centreEye: boolean, leftSide: boolean): void {
  const round = w >= 5 && h >= 5;
  for (let y = -1; y <= h; y++) {
    for (let x = -1; x <= w; x++) {
      const edgeX = x === -1 || x === w;
      const edgeY = y === -1 || y === h;
      if (edgeX && edgeY) continue; // ring has no corners
      const corner = round && (x === 0 || x === w - 1) && (y === 0 || y === h - 1);
      cells.push({ x: x0 + x, y: y0 + y, k: edgeX || edgeY || corner ? 'k' : 'w' });
    }
  }
  // pupil: big eyes get a pupil with a glint, small eyes are shiny beads
  if (w < 5) {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) cells.push({ x: x0 + x, y: y0 + y, k: x === 0 && y === 0 ? 'h' : 'e' });
    return;
  }
  const pw = w >= 9 ? 4 : centreEye ? 2 : 3;
  const ph = w >= 9 ? 5 : 4;
  const px = w >= 9 ? (w - pw) / 2 : centreEye ? (w - pw) / 2 : w === 5 ? 1 : leftSide ? 2 : 1; // side eyes look slightly inward
  const py = h - ph - (w >= 9 ? 2 : 1);
  for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) cells.push({ x: x0 + px + x, y: y0 + py + y, k: 'e' });
  cells.push({ x: x0 + px, y: y0 + py, k: 'h' });
  if (w >= 9) cells.push({ x: x0 + px + 1, y: y0 + py, k: 'h' }, { x: x0 + px, y: y0 + py + 1, k: 'h' });
  // fierce brow: a slanted lid, lowest toward the middle of the face
  if (r.angry) {
    for (let x = 0; x < w; x++) {
      const t = centreEye ? 1 - Math.abs(x - (w - 1) / 2) / (w / 2) : leftSide ? (x + 1) / w : (w - x) / w;
      const cut = Math.floor(t * 2.6);
      for (let y = 0; y < cut; y++) cells.push({ x: x0 + x, y: y0 + y, k: y === cut - 1 ? 'k' : 'P' });
    }
  }
}

export interface ComposeOptions { bob?: boolean; blink?: boolean; flicker?: number }

/** Compose one frame as SIZE*SIZE palette indices. */
export function compose(r: MonsterRecipe, opt: ComposeOptions = {}): Uint8Array {
  const cv = new Uint8Array(N);
  const head = HEADS[r.head];
  const body = BODIES[r.body];
  const hH = head.rows.length;
  const bH = body.rows.length;
  const leg = LEGS[r.legs];
  const dip = opt.bob ? 1 : 0; // the head and arms sink 1 px on the second idle frame

  const bodyBottom = GROUND - leg.visible; // first row below the body
  const bodyTop = bodyBottom - bH;
  const headBottom0 = bodyTop + HEAD_OVERLAP[r.body];
  const headTop = headBottom0 - hH + dip;
  const headBottom = headBottom0 + dip;
  const bodyHw = (y: number) => hwOf(body, y - bodyTop);
  const headHw = (y: number) => (y >= headTop && y < headBottom ? hwOf(head, y - headTop) : 0);
  const sideHw = (y: number) => Math.max(bodyHw(y), headHw(y));
  const small = r.body <= 2;

  // --- behind the body: wings, tail, legs ---
  const shoulderY = headBottom0 - 2;
  if (r.wings >= 0) {
    const wy = shoulderY - 1 - dip;
    stamp(cv, pairCells(WINGS[r.wings], CX - Math.max(sideHw(wy), 9) + 2, wy), { sep: true });
  }
  {
    const ty = bodyBottom - 3; // low on the body so the arm does not hide it
    stamp(cv, spriteCells(TAILS[r.tail], CX + bodyHw(ty) - 2, ty), { sep: true });
  }
  {
    const fd = Math.max(3, Math.round(hwOf(body, bH - 2) * 0.5));
    stamp(cv, pairCells(leg.sprite, CX - 1 - fd, bodyBottom - 2), { sep: true });
  }

  // --- body with belly ---
  {
    const cells = blobCells(body, bodyTop);
    const at = new Map<number, Cell>();
    for (const c of cells) at.set(c.y * S + c.x, c);
    const set = (x: number, y: number, k: string) => { const c = at.get(y * S + x); if (c) c.k = k; };
    const ov = HEAD_OVERLAP[r.body];
    const start = Math.max(ov - 1, Math.round(bH * 0.35));
    const end = bH - 2;
    const patch = BELLIES[r.belly].patch;
    if (patch !== 'none') {
      for (let i = start; i <= end; i++) {
        const round = i === start || i === end ? 2 : i === start + 1 || i === end - 1 ? 1 : 0;
        const hw = hwOf(body, i) - 3 - round;
        const n = i - ov; // rows below the head, so the pattern starts where the belly shows
        for (let d = 0; d < hw; d++) {
          let kind = patch === 'accent' ? 'a' : 's';
          if (patch === 'hstripes' && ((n % 3) + 3) % 3 === 2) kind = 'S';
          if (patch === 'vstripes' && d % 3 === 1) kind = 'S';
          if (patch === 'scales' && ((n % 2) + 2) % 2 === 1 && (d + (((n - 1) / 2) % 2 ? 2 : 0)) % 4 === 1) kind = 'S';
          set(CX + d, bodyTop + i, kind);
          set(CX - 1 - d, bodyTop + i, kind);
        }
      }
    }
    const vis = bH - ov; // body rows that show below the head
    if (BELLIES[r.belly].name === 'Spots') {
      const spots: [number, number][] = [[-0.5, 0.3], [0.42, 0.55], [-0.2, 0.8], [0.1, 0.25], [-0.62, 0.7], [0.6, 0.2]];
      const count = vis < 6 ? 2 : vis < 12 ? 4 : 6;
      for (const [fx, fyy] of spots.slice(0, count)) {
        const y = bodyTop + ov + 1 + Math.round(fyy * (vis - 4));
        const x = CX + Math.round(fx * bodyHw(y));
        for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) set(x + dx, y + dy, 'A');
      }
    }
    if (BELLIES[r.belly].name === 'Badge') {
      const my = bodyTop + Math.round((Math.max(start, ov + 1) + end) / 2) - 1;
      const big: [number, number][] = [[-1, -1], [0, -1], [-2, 0], [-1, 0], [0, 0], [1, 0], [-2, 1], [-1, 1], [0, 1], [1, 1], [-1, 2], [0, 2]];
      const little: [number, number][] = [[-1, 0], [0, 0], [-1, 1], [0, 1]];
      for (const [dx, dy] of vis >= 8 ? big : little) set(CX + dx, my + dy, 'a');
    }
    stamp(cv, cells, { sep: true, depth: 2 });
  }

  // --- arms (in front of the body, behind the head) ---
  {
    const arm = small ? ARMS[r.arms].small : ARMS[r.arms].large;
    const ay = shoulderY + dip + (small ? 0 : 1);
    stamp(cv, pairCells(arm, CX - sideHw(ay) + 1, ay), { sep: true });
  }

  // --- behind the head: cheek spikes and toppers ---
  if (r.spikes) {
    const rows = r.spikes === 1 ? [0.56] : r.spikes === 2 ? [0.4, 0.68] : [0.3, 0.52, 0.74];
    const spike = r.spikes === 3 ? SPIKES.large : SPIKES.small;
    for (const f of rows) {
      const row = Math.round(f * hH);
      stamp(cv, pairCells(spike, CX - hwOf(head, row) + 1, headTop + row), { sep: true });
    }
  }
  {
    const top = TOPPERS[r.topper];
    if (r.topper === 3) {
      stamp(cv, spriteCells(top, CX, headTop + topAt(head, 3) + 2), { sep: true });
    } else {
      const d = head.topDx ?? 8;
      stamp(cv, pairCells(top, CX - 1 - d, headTop + topAt(head, d) + 2), { sep: true });
    }
  }

  // --- head and face ---
  {
    const cells = blobCells(head, headTop);
    const shineRow = (head.faceY ?? 4) - 1;
    const sx = CX - hwOf(head, shineRow) + 3;
    cells.push({ x: sx, y: headTop + shineRow, k: 'h' }, { x: sx + 1, y: headTop + shineRow, k: 'h' }, { x: sx - 1, y: headTop + shineRow + 1, k: 'h' });
    stamp(cv, cells, { sep: true, depth: 2 });
  }
  const fy = headTop + (head.faceY ?? 4);
  {
    const cells: Cell[] = [];
    if (r.eyes === 0 || opt.blink) {
      cells.push(...spriteCells(CLOSED_EYES, CX, fy));
    } else {
      for (const e of EYES[r.eyes].eyes) {
        const centre = e.x + e.w / 2 === 0;
        eyeCells(cells, CX + e.x, fy + e.y, e.w, e.h, r, centre, e.x < 0);
      }
    }
    if (r.level <= 2) { // rosy cheeks on the gentle levels
      for (const x of [CX - 12, CX - 11, CX + 10, CX + 11]) cells.push({ x, y: fy + 9, k: 'b' });
    }
    const m = MOUTHS[r.mouth];
    cells.push(...spriteCells(m, CX, fy + MOUTH_Y));
    stamp(cv, cells);
  }
  if (r.crown) stamp(cv, spriteCells(CROWN, CX, headTop + topAt(head, 5) + 1), { sep: true });

  // --- sidekicks ---
  if (r.sidekicks) {
    let widest = 0;
    for (let i = 0; i < bH; i++) widest = Math.max(widest, hwOf(body, i));
    widest = Math.max(widest, 12);
    stamp(cv, spriteCells(SIDEKICK, Math.max(1, CX - widest - 11), GROUND - 1), { sep: true });
    if (r.sidekicks > 1) stamp(cv, spriteCells(SIDEKICK, Math.min(S - 9, CX + widest + 3), GROUND - 1), { sep: true });
  }

  // --- outline around everything ---
  const filled = cv.slice();
  const F = (x: number, y: number) => x >= 0 && x < S && y >= 0 && y < S && filled[y * S + x] !== 0;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      if (filled[y * S + x] === 0 && (F(x + 1, y) || F(x - 1, y) || F(x, y + 1) || F(x, y - 1))) cv[y * S + x] = 1;
    }
  }

  // --- aura (levels 4 and 5) ---
  if (r.aura) {
    const flick = opt.flicker ?? (opt.bob ? 1 : 0);
    const solid = cv.slice();
    const O = (x: number, y: number) => x >= 0 && x < S && y >= 0 && y < S && solid[y * S + x] !== 0;
    const near = (x: number, y: number, d: number) => {
      for (let dy = -d; dy <= d; dy++) for (let dx = -d; dx <= d; dx++) if (Math.abs(dx) + Math.abs(dy) <= d && O(x + dx, y + dy)) return true;
      return false;
    };
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        if (solid[y * S + x] !== 0) continue;
        if (near(x, y, 1)) cv[y * S + x] = r.aura === 2 || flick ? 17 : 16;
        else if (r.aura === 2 && near(x, y, 2)) cv[y * S + x] = 16;
      }
    }
    if (r.aura === 2) {
      // flames: every upward-facing edge licks up by the pattern height
      const ring = cv.slice();
      for (let x = 0; x < S; x++) {
        const hgt = FLAME_PATTERN[(x + flick * 5) % FLAME_PATTERN.length];
        for (let y = 1; y < S; y++) {
          if (ring[y * S + x] !== 0 && ring[(y - 1) * S + x] === 0) {
            for (let k = 1; k <= hgt && y - k >= 0; k++) if (cv[(y - k) * S + x] === 0) cv[(y - k) * S + x] = k === hgt && hgt > 1 ? 17 : 16;
          }
        }
      }
    }
  }
  return cv;
}

// ---------------------------------------------------------------------------------------------
// 4. Sprite: frames + palette
// ---------------------------------------------------------------------------------------------
export interface MonsterSprite {
  width: number;
  height: number;
  /** 24 hex colours; index 0 is transparent */
  palette: string[];
  recipe: MonsterRecipe;
  frames: {
    /** two-frame idle bob */
    idle: [Uint8Array, Uint8Array];
    /** idle[0] with the eyes shut */
    blink: Uint8Array;
    /** flash, then dissolve and sink; play once at about 90 ms a frame */
    defeat: Uint8Array[];
  };
  /** CSS pixels per sprite pixel that suits the level: bosses are shown bigger */
  suggestedScale: number;
}

function defeatFrames(base: Uint8Array): Uint8Array[] {
  const flash = base.map((v) => (v > 1 && v !== 16 && v !== 17 ? 21 : v));
  const plain = base.map((v) => (v === 16 || v === 17 ? 0 : v));
  const frames = [flash, plain, flash];
  [4, 8, 12, 15].forEach((threshold, step) => {
    const f = new Uint8Array(N);
    const sink = (step + 1) * 2;
    for (let y = 0; y < S - sink; y++) {
      for (let x = 0; x < S; x++) {
        if (BAYER4[(y % 4) * 4 + (x % 4)] >= threshold) f[(y + sink) * S + x] = plain[y * S + x];
      }
    }
    for (let y = GROUND + 1; y < S; y++) for (let x = 0; x < S; x++) f[y * S + x] = 0; // sinks into the ground line
    frames.push(f);
  });
  frames.push(new Uint8Array(N));
  return frames;
}

/** The whole thing: same word and level always give the same sprite. */
export function generateMonster(word: string, level: number): MonsterSprite {
  const recipe = recipeFor(word, level);
  const idle0 = compose(recipe);
  return {
    width: S,
    height: S,
    palette: paletteFor(recipe),
    recipe,
    frames: {
      idle: [idle0, compose(recipe, { bob: true })],
      blink: compose(recipe, { blink: true }),
      defeat: defeatFrames(idle0)
    },
    suggestedScale: recipe.level >= 5 ? 5 : recipe.level >= 3 ? 4 : 3
  };
}

// ---------------------------------------------------------------------------------------------
// 5. Renderers (pick one; all are crisp at any whole-number scale)
// ---------------------------------------------------------------------------------------------
/** RGBA bytes at 1x, ready for `new ImageData(rgba, 64, 64)` and `putImageData`. */
export function toRGBA(frame: Uint8Array, palette: string[]): Uint8ClampedArray {
  const rgb = palette.map((c) => parseInt(c.slice(1, 7), 16));
  const out = new Uint8ClampedArray(N * 4);
  for (let i = 0; i < N; i++) {
    const v = frame[i];
    if (v === 0) continue;
    out[i * 4] = (rgb[v] >> 16) & 255;
    out[i * 4 + 1] = (rgb[v] >> 8) & 255;
    out[i * 4 + 2] = rgb[v] & 255;
    out[i * 4 + 3] = 255;
  }
  return out;
}

/** SVG string, one <path> per colour, run-length merged. Good for server rendering or <img>. */
export function toSVG(frame: Uint8Array, palette: string[], scale = 4): string {
  const paths = new Map<number, string>();
  for (let y = 0; y < S; y++) {
    let x = 0;
    while (x < S) {
      const v = frame[y * S + x];
      let run = 1;
      while (x + run < S && frame[y * S + x + run] === v) run++;
      if (v !== 0) paths.set(v, (paths.get(v) ?? '') + `M${x} ${y}h${run}v1h-${run}z`);
      x += run;
    }
  }
  let body = '';
  for (const [v, d] of paths) body += `<path fill="${palette[v]}" d="${d}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S * scale}" height="${S * scale}" viewBox="0 0 ${S} ${S}" shape-rendering="crispEdges">${body}</svg>`;
}

/** Draw at 1x into a 2D canvas context (style the canvas with image-rendering: pixelated). */
export function drawToCanvas(ctx: { createImageData(w: number, h: number): { data: Uint8ClampedArray }; putImageData(d: any, x: number, y: number): void }, frame: Uint8Array, palette: string[], x = 0, y = 0): void {
  const img = ctx.createImageData(S, S);
  img.data.set(toRGBA(frame, palette));
  ctx.putImageData(img, x, y);
}
