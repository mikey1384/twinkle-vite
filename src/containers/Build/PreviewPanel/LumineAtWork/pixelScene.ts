// Lumine at work (Mikey 11-24): the pixel scene shown in the Workspace while
// Lumine builds. Lumine is the canonical "Star Lantern Golem"
// (src/components/ZeroPic/CHARACTERS.md, lumine-full.png): a rounded navy
// head with a gold-rimmed cyan visor and two oval eyes, round cyan side lenses
// and a gold cap; a gold-barred glass cage on the chest holding the golden
// four-point star with sparks; huge navy shoulder balls with gold bands; white
// blocky fists. Here Lumine sits at a desk and types on a keyboard while two
// holo screens float beside her: code on the left, the app on the right.
//
// Everything is drawn pixel by pixel into one small ImageData each tick (no
// image files), with the same ink outline and top-left light as the word
// monsters. A scene is about 20k pixels, so a full redraw costs well under a
// millisecond.

export type LuminePose =
  | 'type'
  | 'burst'
  | 'think'
  | 'sip'
  | 'stretch'
  | 'glance'
  | 'celebrate'
  | 'wave'
  | 'rest'
  // Typing variations: an Enter-key slam, and vibing to music.
  | 'slam'
  | 'flow'
  // Trying the app on the side screen (Lumine's preview tests).
  | 'test';

export interface LumineSceneState {
  pose: LuminePose;
  // Ticks since the scene started (10 a second) and since this pose began.
  frame: number;
  poseFrame: number;
  // Code on the main holo screen: how many art pixels of code have been
  // "typed" so far. Grows while Lumine types; the screen scrolls with it.
  typed: number;
  // Shown on the main screen while celebrating a save.
  savedLabel?: boolean;
  // The idle scene (nothing built yet): the screens show a prompt cursor.
  idle?: boolean;
  // The small corner badge: Lumine, desk and keyboard only.
  compact?: boolean;
}

export const SCENE_H = 100;
export const SCENE_MIN_W = 160;
export const SCENE_MAX_W = 232;

// ---------------------------------------------------------------------------
// Colour
// ---------------------------------------------------------------------------

function rgba(hex: string, alpha = 255) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return ((alpha << 24) | (b << 16) | (g << 8) | r) >>> 0;
}

const C = {
  ink: rgba('#120e26'),
  // room
  wall: rgba('#1b1734'),
  wallDark: rgba('#15112b'),
  wallLine: rgba('#221d40'),
  star: rgba('#fff3c4'),
  starDim: rgba('#6d6491'),
  // desk
  deskTop: rgba('#6e4a6b'),
  deskTopHi: rgba('#8c6386'),
  deskFront: rgba('#4a3050'),
  deskFrontLo: rgba('#38233f'),
  deskEdge: rgba('#2a1a31'),
  // Lumine armour (navy, a touch of violet like the reference)
  navyHi: rgba('#4a55b0'),
  navy: rgba('#2c3378'),
  navyLo: rgba('#1b1f4f'),
  navySpec: rgba('#9fb0ff'),
  goldHi: rgba('#ffe27a'),
  gold: rgba('#f4b43a'),
  goldLo: rgba('#b8741e'),
  goldSpec: rgba('#fff6cf'),
  whiteHi: rgba('#ffffff'),
  white: rgba('#e6e3f2'),
  whiteLo: rgba('#a8a2c6'),
  joint: rgba('#c9c5de'),
  jointLo: rgba('#8d87ad'),
  visorHi: rgba('#7fe6ff'),
  visor: rgba('#2fa9ea'),
  visorLo: rgba('#1a6fc0'),
  eye: rgba('#ffffff'),
  eyeGlow: rgba('#c8f6ff'),
  lensHi: rgba('#b4f6ff'),
  lens: rgba('#3fd4f5'),
  lensLo: rgba('#1d8fc4'),
  glassHi: rgba('#a0603a'),
  glass: rgba('#73402c'),
  glassLo: rgba('#4c2820'),
  starCore: rgba('#fffdf0'),
  starHi: rgba('#fff3a0'),
  starBase: rgba('#ffd640'),
  starLo: rgba('#f3a024'),
  spark: rgba('#fff0b0'),
  // keyboard and props
  kbBody: rgba('#2a2944'),
  kbBodyHi: rgba('#3c3b60'),
  key: rgba('#4d4c74'),
  keyHi: rgba('#6e6d9c'),
  keyLit: rgba('#8ff4ff'),
  mug: rgba('#ef6a86'),
  mugHi: rgba('#ff9fb3'),
  mugLo: rgba('#b8405c'),
  coffee: rgba('#5a3422'),
  steam: rgba('#e8e4ff'),
  leaf: rgba('#4fbf6a'),
  leafHi: rgba('#8fe08f'),
  leafLo: rgba('#2e7d4a'),
  pot: rgba('#d9824a'),
  potLo: rgba('#9c5530'),
  bookA: rgba('#5f8de8'),
  bookB: rgba('#e8a33a'),
  bookC: rgba('#c85c9c'),
  // holo screens
  holo: rgba('#58dcff'),
  holoDim: rgba('#2a8fbf'),
  holoBar: rgba('#163a5e'),
  // code colours (VS Code Dark+)
  codeKeyword: rgba('#569cd6'),
  codeControl: rgba('#c586c0'),
  codeString: rgba('#ce9178'),
  codeFunc: rgba('#dcdcaa'),
  codeVar: rgba('#9cdcfe'),
  codeType: rgba('#4ec9b0'),
  codeComment: rgba('#6a9955'),
  codeNum: rgba('#b5cea8'),
  caret: rgba('#ffffff'),
  ok: rgba('#4ade80'),
  okLo: rgba('#15803d'),
  confetti: [
    rgba('#ffd34d'),
    rgba('#58dcff'),
    rgba('#ff7aa8'),
    rgba('#ffffff'),
    rgba('#8bf08b')
  ]
};

// ---------------------------------------------------------------------------
// Raster
// ---------------------------------------------------------------------------

type Mask = (x: number, y: number) => boolean;
type Box = [number, number, number, number]; // inclusive x0 y0 x1 y1

interface Ramp {
  hi: number;
  base: number;
  lo: number;
  spec?: number;
}

const NAVY: Ramp = { hi: C.navyHi, base: C.navy, lo: C.navyLo, spec: C.navySpec };
const GOLD: Ramp = { hi: C.goldHi, base: C.gold, lo: C.goldLo, spec: C.goldSpec };
const WHITE: Ramp = { hi: C.whiteHi, base: C.white, lo: C.whiteLo };
const LENS: Ramp = { hi: C.lensHi, base: C.lens, lo: C.lensLo };
const GLASS: Ramp = { hi: C.glassHi, base: C.glass, lo: C.glassLo };
const STAR: Ramp = { hi: C.starHi, base: C.starBase, lo: C.starLo, spec: C.starCore };
const MUG: Ramp = { hi: C.mugHi, base: C.mug, lo: C.mugLo };
const LEAF: Ramp = { hi: C.leafHi, base: C.leaf, lo: C.leafLo };

class Raster {
  data: Uint32Array;
  constructor(
    public w: number,
    public h: number
  ) {
    this.data = new Uint32Array(w * h);
  }

  set(x: number, y: number, c: number) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.data[y * this.w + x] = c;
  }

  // Lay a colour over what is there at `alpha` (0..1).
  blend(x: number, y: number, c: number, alpha: number) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = y * this.w + x;
    const d = this.data[i];
    const mix = (shift: number) =>
      Math.round(
        ((d >>> shift) & 255) * (1 - alpha) + ((c >>> shift) & 255) * alpha
      );
    this.data[i] =
      ((255 << 24) | (mix(16) << 16) | (mix(8) << 8) | mix(0)) >>> 0;
  }

  rect(x: number, y: number, w: number, h: number, c: number) {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
    }
  }

  blendRect(x: number, y: number, w: number, h: number, c: number, a: number) {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) this.blend(x + i, y + j, c, a);
    }
  }
}

const ellipse =
  (cx: number, cy: number, rx: number, ry: number): Mask =>
  (x, y) => {
    const u = (x + 0.5 - cx) / rx;
    const v = (y + 0.5 - cy) / ry;
    return u * u + v * v <= 1;
  };

const roundRect =
  (x0: number, y0: number, x1: number, y1: number, r: number): Mask =>
  (x, y) => {
    if (x < x0 || x > x1 || y < y0 || y > y1) return false;
    const cx = x < x0 + r ? x0 + r : x > x1 - r ? x1 - r : x;
    const cy = y < y0 + r ? y0 + r : y > y1 - r ? y1 - r : y;
    const dx = x - cx;
    const dy = y - cy;
    return dx * dx + dy * dy <= r * r + r * 0.6;
  };

// The Lumine star: a four-point star with curved sides (an astroid).
const starMask =
  (cx: number, cy: number, r: number): Mask =>
  (x, y) => {
    const u = Math.abs(x + 0.5 - cx) / r;
    const v = Math.abs(y + 0.5 - cy) / r;
    return Math.pow(u, 0.48) + Math.pow(v, 0.48) <= 1;
  };

function boxOf(cx: number, cy: number, rx: number, ry: number): Box {
  return [
    Math.floor(cx - rx) - 1,
    Math.floor(cy - ry) - 1,
    Math.ceil(cx + rx) + 1,
    Math.ceil(cy + ry) + 1
  ];
}

// Paint one shape with an ink outline and toon shading: lit from the top
// left, a darker band toward the bottom right, a small glint.
function part(
  r: Raster,
  mask: Mask,
  box: Box,
  ramp: Ramp,
  { outline = C.ink as number | null, glint = 0.03 } = {}
) {
  const [x0, y0, x1, y1] = box;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (!mask(x, y)) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (minX === Infinity) return;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const rx = Math.max(1, (maxX - minX) / 2);
  const ry = Math.max(1, (maxY - minY) / 2);
  if (outline !== null) {
    for (let y = minY - 1; y <= maxY + 1; y++) {
      for (let x = minX - 1; x <= maxX + 1; x++) {
        if (mask(x, y)) continue;
        if (mask(x - 1, y) || mask(x + 1, y) || mask(x, y - 1) || mask(x, y + 1)) {
          r.set(x, y, outline);
        }
      }
    }
  }
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (!mask(x, y)) continue;
      const u = (x - cx) / rx;
      const v = (y - cy) / ry;
      const s = u * 0.45 + v * 0.85;
      let c = ramp.base;
      if (s > 0.6 || (s > 0.15 && !mask(x + 1, y + 1))) c = ramp.lo;
      else if (s < -0.5 || (s < 0 && (!mask(x, y - 1) || !mask(x - 1, y)))) {
        c = ramp.hi;
      }
      if (ramp.spec && glint > 0) {
        const gu = u + 0.45;
        const gv = v + 0.55;
        if (gu * gu * 0.7 + gv * gv * 1.4 < glint) c = ramp.spec;
      }
      r.set(x, y, c);
    }
  }
}

function fill(r: Raster, mask: Mask, box: Box, c: number) {
  const [x0, y0, x1, y1] = box;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) if (mask(x, y)) r.set(x, y, c);
  }
}

function line(
  r: Raster,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  thick: number,
  c: number
) {
  const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay), 1);
  for (let i = 0; i <= steps; i++) {
    const x = Math.round(ax + ((bx - ax) * i) / steps);
    const y = Math.round(ay + ((by - ay) * i) / steps);
    r.rect(x - Math.floor(thick / 2), y - Math.floor(thick / 2), thick, thick, c);
  }
}

// Deterministic noise so every frame of a given moment looks the same.
function hash(n: number) {
  let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

// 3x5 letters for the few words the screens show.
const FONT: Record<string, string[]> = {
  S: ['111', '100', '111', '001', '111'],
  A: ['010', '101', '111', '101', '101'],
  V: ['101', '101', '101', '101', '010'],
  E: ['111', '100', '110', '100', '111'],
  D: ['110', '101', '101', '101', '110'],
  '!': ['1', '1', '1', '0', '1']
};

function text(r: Raster, x: number, y: number, word: string, c: number) {
  let cx = x;
  for (const ch of word) {
    const glyph = FONT[ch];
    if (!glyph) {
      cx += 2;
      continue;
    }
    glyph.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) if (row[i] === '1') r.set(cx + i, y + j, c);
    });
    cx += glyph[0].length + 1;
  }
}

// ---------------------------------------------------------------------------
// Layout (depends on the scene width; Lumine stays centred)
// ---------------------------------------------------------------------------

interface Layout {
  w: number;
  cx: number;
  deskY: number;
  main: Box;
  side: Box;
}

function layout(w: number): Layout {
  const cx = Math.floor(w / 2);
  // Shoulders reach cx ± 46; the screens fill the space beside them.
  const mainRight = cx - 49;
  const mainLeft = Math.max(4, mainRight - 52);
  const sideLeft = cx + 49;
  const sideRight = Math.min(w - 5, sideLeft + 46);
  return {
    w,
    cx,
    deskY: 80,
    main: [mainLeft, 16, mainRight, 64],
    side: [sideLeft, 22, sideRight, 58]
  };
}

// ---------------------------------------------------------------------------
// Pose geometry
// ---------------------------------------------------------------------------

type Eyes = 'open' | 'blink' | 'happy' | 'focus' | 'closed';
type FistKind = 'flat' | 'up' | 'side';

interface ArmPose {
  fore: [number, number];
  fist: [number, number];
  kind: FistKind;
}

interface PoseGeometry {
  bob: number;
  eyes: Eyes;
  look: [number, number];
  left: ArmPose;
  right: ArmPose;
  mugInHand: boolean;
  litKeys: number[];
  // Sideways sway of the head and body (flow).
  sway?: number;
  // The keyboard jumps on a slam.
  kbShake?: number;
}

function typingArms(
  cx: number,
  phase: number,
  fast: boolean
): { left: ArmPose; right: ArmPose; litKeys: number[] } {
  const leftUp = phase % 2 === 0;
  const jitter = fast ? (phase % 3) - 1 : 0;
  const left: ArmPose = {
    fore: [cx - 31, 68],
    fist: [cx - 16 + (fast ? jitter : 0), leftUp ? 73 : 76],
    kind: 'flat'
  };
  const right: ArmPose = {
    fore: [cx + 31, 68],
    fist: [cx + 16 - (fast ? jitter : 0), leftUp ? 76 : 73],
    kind: 'flat'
  };
  // Keys under the fist that is down light up.
  const seed = phase * 7 + (fast ? 3 : 0);
  const litKeys = [Math.floor(hash(seed) * 14) + (leftUp ? 14 : 0)];
  if (fast) litKeys.push(Math.floor(hash(seed + 1) * 28));
  return { left, right, litKeys };
}

function restingArm(cx: number, side: -1 | 1): ArmPose {
  return {
    fore: [cx + side * 31, 68],
    fist: [cx + side * 16, 76],
    kind: 'flat'
  };
}

function geometry(state: LumineSceneState, lay: Layout): PoseGeometry {
  const { cx } = lay;
  const f = state.poseFrame;
  const blinkNow = state.frame % 47 === 0 || state.frame % 47 === 1;
  const base: PoseGeometry = {
    bob: 0,
    eyes: blinkNow ? 'blink' : 'open',
    look: [-2, 0],
    left: restingArm(cx, -1),
    right: restingArm(cx, 1),
    mugInHand: false,
    litKeys: []
  };
  switch (state.pose) {
    case 'type': {
      const arms = typingArms(cx, Math.floor(f / 2), false);
      return { ...base, ...arms, bob: Math.floor(f / 4) % 2 ? 0 : 1 };
    }
    case 'burst': {
      const arms = typingArms(cx, f, true);
      return {
        ...base,
        ...arms,
        eyes: blinkNow ? 'blink' : 'focus',
        look: [-2, 1],
        bob: f % 2
      };
    }
    case 'think': {
      // Right fist to the chin, eyes up; the left hand rests.
      const tap = Math.floor(f / 5) % 2;
      return {
        ...base,
        look: [1, -2],
        right: { fore: [cx + 27, 56], fist: [cx + 16, 47 + tap], kind: 'up' },
        litKeys: []
      };
    }
    case 'sip': {
      const lift = f < 6 ? f : f > 30 ? Math.max(0, 36 - f) : 6;
      const t = lift / 6;
      return {
        ...base,
        eyes: lift >= 5 ? 'happy' : base.eyes,
        look: [0, 0],
        right: {
          fore: [Math.round(cx + 31 - 4 * t), Math.round(68 - 14 * t)],
          fist: [Math.round(cx + 26 - 5 * t), Math.round(74 - 32 * t)],
          kind: 'side'
        },
        mugInHand: true
      };
    }
    case 'stretch': {
      const up = f < 4 ? f / 4 : f > 26 ? Math.max(0, (32 - f) / 6) : 1;
      const sway = up === 1 ? (Math.floor(f / 4) % 2 ? 1 : -1) : 0;
      return {
        ...base,
        bob: up === 1 ? -1 : 0,
        eyes: up > 0.5 ? 'closed' : base.eyes,
        look: [0, 0],
        left: {
          fore: [Math.round(cx - 31 - 10 * up), Math.round(68 - 26 * up)],
          fist: [Math.round(cx - 16 - 22 * up) + sway, Math.round(76 - 52 * up)],
          kind: up > 0.5 ? 'up' : 'flat'
        },
        right: {
          fore: [Math.round(cx + 31 + 10 * up), Math.round(68 - 26 * up)],
          fist: [Math.round(cx + 16 + 22 * up) + sway, Math.round(76 - 52 * up)],
          kind: up > 0.5 ? 'up' : 'flat'
        }
      };
    }
    case 'slam': {
      // Type, type, type... wind up... ENTER!
      const beat = f % 12;
      const arms = typingArms(cx, Math.floor(f / 2), false);
      if (beat < 8) return { ...base, ...arms, bob: Math.floor(f / 4) % 2 ? 0 : 1 };
      if (beat < 10) {
        return {
          ...base,
          left: arms.left,
          eyes: 'focus',
          look: [1, 1],
          right: { fore: [cx + 37, 54], fist: [cx + 30, 44], kind: 'up' },
          litKeys: []
        };
      }
      return {
        ...base,
        bob: 1,
        eyes: beat === 10 ? 'closed' : 'happy',
        look: [0, 0],
        left: arms.left,
        right: { fore: [cx + 31, 69], fist: [cx + 18, 78], kind: 'flat' },
        litKeys: [26, 27, 12, 13],
        kbShake: beat === 10 ? 1 : 0
      };
    }
    case 'flow': {
      // Easy typing, swaying to a tune only Lumine can hear.
      const arms = typingArms(cx, Math.floor(f / 3), false);
      const sway = Math.floor(f / 6) % 2 ? 1 : -1;
      return { ...base, ...arms, sway, eyes: blinkNow ? 'blink' : 'happy', look: [sway, 0] };
    }
    case 'test': {
      // Reach over and tap the app on the side screen; the other hand types
      // now and then.
      const tap = Math.floor(f / 4) % 2;
      return {
        ...base,
        look: [2, -1],
        left: { fore: [cx - 31, 68], fist: [cx - 16, tap ? 73 : 76], kind: 'flat' },
        right: { fore: [cx + 43, 50], fist: [cx + 50 + tap, 40 - tap], kind: 'up' },
        litKeys: tap ? [] : [Math.floor(hash(f + 5) * 10) + 1]
      };
    }
    case 'glance': {
      // Peek at the app on the right screen, typing slowly with one hand.
      const tap = Math.floor(f / 3) % 2;
      return {
        ...base,
        look: [2, 0],
        left: {
          fore: [cx - 31, 68],
          fist: [cx - 16, tap ? 73 : 76],
          kind: 'flat'
        },
        litKeys: tap ? [] : [Math.floor(hash(f) * 10) + 2]
      };
    }
    case 'celebrate': {
      const hop = f % 6 < 3 ? -2 : 0;
      return {
        ...base,
        bob: hop,
        eyes: 'happy',
        look: [0, 0],
        left: { fore: [cx - 41, 42], fist: [cx - 42, 29 + (f % 6 < 3 ? 0 : 2)], kind: 'up' },
        right: { fore: [cx + 41, 42], fist: [cx + 42, 29 + (f % 6 < 3 ? 2 : 0)], kind: 'up' }
      };
    }
    case 'wave': {
      const swing = Math.floor(f / 3) % 2 ? 3 : -2;
      return {
        ...base,
        eyes: blinkNow ? 'blink' : 'happy',
        look: [0, 0],
        right: { fore: [cx + 41, 42], fist: [cx + 42 + swing, 29], kind: 'up' }
      };
    }
    case 'rest':
    default:
      return { ...base, look: [0, 0] };
  }
}

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

function drawRoom(r: Raster, lay: Layout, state: LumineSceneState) {
  r.rect(0, 0, r.w, r.h, C.wall);
  // Soft wall panels.
  for (let x = 12; x < r.w; x += 36) r.rect(x, 0, 1, lay.deskY, C.wallLine);
  r.rect(0, 0, r.w, 3, C.wallDark);
  // Twinkling stars on the wall (Twinkle's sky behind Lumine).
  for (let i = 0; i < 18; i++) {
    const x = Math.floor(hash(i * 13 + 1) * r.w);
    const y = 4 + Math.floor(hash(i * 13 + 2) * 60);
    const on = (Math.floor(state.frame / 6) + i) % 5 !== 0;
    r.set(x, y, on ? C.starDim : C.wallLine);
    if (i % 6 === 0 && on) {
      r.set(x, y, C.star);
      r.set(x - 1, y, C.starDim);
      r.set(x + 1, y, C.starDim);
      r.set(x, y - 1, C.starDim);
      r.set(x, y + 1, C.starDim);
    }
  }
}

// Light from the desk projectors up to each screen.
function drawBeam(r: Raster, box: Box, deskY: number) {
  const [x0, , x1, y1] = box;
  const mid = Math.floor((x0 + x1) / 2);
  for (let y = y1 + 1; y < deskY; y++) {
    const t = (y - y1) / (deskY - y1);
    const half = Math.round((x1 - x0) / 2 - t * ((x1 - x0) / 2 - 2));
    for (let x = mid - half; x <= mid + half; x++) r.blend(x, y, C.holo, 0.07);
  }
  r.rect(mid - 3, deskY - 2, 7, 2, C.goldLo);
  r.rect(mid - 2, deskY - 3, 5, 1, C.gold);
  r.set(mid, deskY - 3, C.lensHi);
}

function holoFrame(r: Raster, box: Box, bright: number) {
  const [x0, y0, x1, y1] = box;
  r.blendRect(x0, y0, x1 - x0 + 1, y1 - y0 + 1, rgba('#0b2a4a'), 0.72 * bright);
  r.blendRect(x0, y0, x1 - x0 + 1, y1 - y0 + 1, C.holo, 0.08 * bright);
  // Title bar with three window dots.
  r.blendRect(x0, y0, x1 - x0 + 1, 4, C.holoBar, 0.9 * bright);
  r.set(x0 + 2, y0 + 1, rgba('#ff6b6b'));
  r.set(x0 + 4, y0 + 1, rgba('#ffd34d'));
  r.set(x0 + 6, y0 + 1, rgba('#4ade80'));
  // Edges, with brighter corner brackets.
  for (let x = x0; x <= x1; x++) {
    r.blend(x, y0, C.holo, 0.85 * bright);
    r.blend(x, y1, C.holo, 0.85 * bright);
  }
  for (let y = y0; y <= y1; y++) {
    r.blend(x0, y, C.holo, 0.85 * bright);
    r.blend(x1, y, C.holo, 0.85 * bright);
  }
  const bracket = (x: number, y: number, dx: number, dy: number) => {
    for (let i = 0; i < 4; i++) {
      r.set(x + dx * i, y, C.lensHi);
      r.set(x, y + dy * i, C.lensHi);
    }
  };
  bracket(x0, y0, 1, 1);
  bracket(x1, y0, -1, 1);
  bracket(x0, y1, 1, -1);
  bracket(x1, y1, -1, -1);
  // Scan line drifting down the glass.
  for (let x = x0 + 1; x < x1; x++) r.blend(x, y0 + 5, C.holo, 0.05);
}

const CODE_COLOURS = [
  C.codeKeyword,
  C.codeVar,
  C.codeFunc,
  C.codeString,
  C.codeControl,
  C.codeType,
  C.codeNum
];

// One line of pretend code: an indent and a few coloured words.
function codeLine(n: number) {
  const indent = [0, 1, 2, 2, 1, 3, 1, 0][Math.floor(hash(n * 3 + 5) * 8)];
  if (hash(n * 11) < 0.1) return { indent: 0, words: [] as Array<[number, number]> };
  const comment = hash(n * 17 + 1) < 0.12;
  const count = comment ? 1 : 1 + Math.floor(hash(n * 7 + 2) * 4);
  const words: Array<[number, number]> = [];
  for (let i = 0; i < count; i++) {
    const width = comment ? 10 + Math.floor(hash(n + i) * 14) : 2 + Math.floor(hash(n * 5 + i * 3) * 8);
    const colour = comment ? C.codeComment : CODE_COLOURS[Math.floor(hash(n * 13 + i * 7) * CODE_COLOURS.length)];
    words.push([width, colour]);
  }
  return { indent, words };
}

function lineWidth(n: number) {
  const { indent, words } = codeLine(n);
  return indent * 3 + words.reduce((sum, [w]) => sum + w + 1, 0);
}

function drawCodeScreen(r: Raster, box: Box, state: LumineSceneState, bright: number) {
  holoFrame(r, box, bright);
  const [x0, y0, x1, y1] = box;
  const left = x0 + 6;
  const right = x1 - 2;
  const rows = Math.floor((y1 - y0 - 7) / 3);
  // Line numbers gutter.
  for (let y = y0 + 6; y < y1 - 1; y += 3) r.blend(x0 + 2, y, C.holoDim, 0.9 * bright);
  if (state.idle) {
    // A prompt and a blinking cursor: ready when you are.
    r.rect(left, y0 + 6, 2, 2, C.codeFunc);
    r.rect(left + 3, y0 + 6, 3, 2, C.codeVar);
    if (Math.floor(state.frame / 5) % 2) r.rect(left + 7, y0 + 5, 2, 4, C.caret);
    return;
  }
  // Work out which line the typing is on.
  let remaining = state.typed;
  let current = 0;
  for (;;) {
    const width = lineWidth(current) + 4;
    if (remaining < width) break;
    remaining -= width;
    current += 1;
  }
  const first = Math.max(0, current - rows + 1);
  for (let row = 0; row < rows; row++) {
    const n = first + row;
    if (n > current) break;
    const y = y0 + 6 + row * 3;
    const { indent, words } = codeLine(n);
    let x = left + indent * 3;
    let budget = n === current ? remaining : Infinity;
    for (const [width, colour] of words) {
      const shown = Math.min(width, budget);
      for (let i = 0; i < shown && x + i < right; i++) {
        r.set(x + i, y, colour);
        r.set(x + i, y + 1, colour);
      }
      budget -= width + 1;
      x += width + 1;
      if (budget <= 0) break;
    }
    if (n === current) {
      const caretX = Math.min(right - 1, left + indent * 3 + Math.max(0, remaining));
      if (Math.floor(state.frame / 3) % 2 === 0 || state.pose === 'burst' || state.pose === 'type') {
        r.rect(caretX, y - 1, 1, 4, C.caret);
      }
    }
  }
  if (state.savedLabel) {
    // A green "SAVED" stamp with a tick.
    const midX = Math.floor((x0 + x1) / 2);
    const midY = Math.floor((y0 + y1) / 2);
    r.blendRect(x0 + 1, y0 + 5, x1 - x0 - 1, y1 - y0 - 5, rgba('#06231a'), 0.65);
    const tick = [
      [0, 2],
      [1, 3],
      [2, 4],
      [3, 3],
      [4, 2],
      [5, 1],
      [6, 0]
    ];
    // Narrow screens (phones) get the tick alone.
    const wide = x1 - x0 >= 40;
    const half = wide ? 17 : 8;
    r.rect(midX - half, midY - 6, half * 2 + 2, 13, C.okLo);
    r.rect(midX - half + 1, midY - 5, half * 2, 11, C.ok);
    const tickX = wide ? midX - 14 : midX - 3;
    tick.forEach(([dx, dy]) => {
      r.rect(tickX + dx, midY - 3 + dy, 1, 2, C.whiteHi);
    });
    if (wide) text(r, midX - 5, midY - 2, 'SAVED', C.whiteHi);
  }
}

// The app on the side screen: a little hero hopping over a crate.
function drawAppScreen(r: Raster, box: Box, state: LumineSceneState, bright: number) {
  holoFrame(r, box, bright);
  const [x0, y0, x1, y1] = box;
  const ground = y1 - 6;
  if (state.idle) {
    const midX = Math.floor((x0 + x1) / 2);
    const midY = Math.floor((y0 + y1) / 2) + 2;
    // An empty canvas with a sparkle: nothing to show yet.
    const on = Math.floor(state.frame / 4) % 2;
    r.set(midX, midY, C.star);
    if (on) {
      r.set(midX - 1, midY, C.starDim);
      r.set(midX + 1, midY, C.starDim);
      r.set(midX, midY - 1, C.starDim);
      r.set(midX, midY + 1, C.starDim);
      r.set(midX - 2, midY, C.holoDim);
      r.set(midX + 2, midY, C.holoDim);
      r.set(midX, midY - 2, C.holoDim);
      r.set(midX, midY + 2, C.holoDim);
    }
    return;
  }
  for (let x = x0 + 2; x < x1 - 1; x++) {
    r.blend(x, ground, C.leaf, 0.9 * bright);
    r.blend(x, ground + 1, C.leafLo, 0.9 * bright);
  }
  const span = x1 - x0 - 12;
  const crateX = x0 + 6 + span - ((state.frame * 2) % (span + 10));
  if (crateX > x0 + 2 && crateX < x1 - 5) {
    r.rect(crateX, ground - 4, 4, 4, C.bookB);
    r.rect(crateX, ground - 4, 4, 1, C.goldHi);
  }
  const heroX = x0 + 9;
  const dist = crateX - heroX;
  const jump = dist > -3 && dist < 9 ? Math.round(5 * Math.sin(((dist + 3) / 12) * Math.PI)) : 0;
  r.rect(heroX, ground - 5 - jump, 4, 5, C.codeControl);
  r.rect(heroX + 2, ground - 4 - jump, 1, 1, C.whiteHi);
  // A coin and a score bar.
  if (Math.floor(state.frame / 3) % 2) r.set(x1 - 6, y0 + 8, C.goldHi);
  r.rect(x0 + 3, y0 + 7, 8, 1, C.holoDim);
  if (state.pose === 'test') {
    // A test sweep down the screen, then a green tick.
    const height = y1 - y0 - 6;
    const scanY = y0 + 5 + ((state.poseFrame * 2) % height);
    for (let x = x0 + 1; x < x1; x++) {
      r.blend(x, scanY, C.ok, 0.75);
      r.blend(x, scanY - 1, C.ok, 0.25);
    }
    if (state.poseFrame > 26) {
      const bx = x1 - 12;
      const by = y0 + 10;
      r.rect(bx - 1, by - 1, 10, 9, C.okLo);
      r.rect(bx, by, 8, 7, C.ok);
      [[1, 3], [2, 4], [3, 5], [4, 4], [5, 3], [6, 2], [7, 1]].forEach(([dx, dy]) =>
        r.set(bx + dx - 0.5, by + dy - 0.5, C.whiteHi)
      );
    }
  }
}

function drawDesk(r: Raster, lay: Layout) {
  const { deskY } = lay;
  r.rect(0, deskY - 1, r.w, 1, C.deskEdge);
  r.rect(0, deskY, r.w, 3, C.deskTop);
  r.rect(0, deskY, r.w, 1, C.deskTopHi);
  r.rect(0, deskY + 3, r.w, 1, C.deskEdge);
  r.rect(0, deskY + 4, r.w, r.h - deskY - 4, C.deskFront);
  for (let x = 0; x < r.w; x += 2) r.set(x, deskY + 4, C.deskFrontLo);
  // Wood grain.
  for (let i = 0; i < 9; i++) {
    const x = Math.floor(hash(i * 5 + 50) * r.w);
    const y = deskY + 8 + Math.floor(hash(i * 5 + 51) * (r.h - deskY - 12));
    r.rect(x, y, 6 + Math.floor(hash(i) * 10), 1, C.deskFrontLo);
  }
}

function drawProps(r: Raster, lay: Layout, state: LumineSceneState, mugInHand: boolean) {
  const { cx, deskY } = lay;
  // Books stacked on the left.
  const bx = cx - 66;
  if (bx > 2) {
    r.rect(bx - 1, deskY - 10, 16, 10, C.ink);
    r.rect(bx, deskY - 3, 14, 2, C.bookA);
    r.rect(bx + 1, deskY - 6, 12, 2, C.bookB);
    r.rect(bx, deskY - 9, 13, 2, C.bookC);
    r.rect(bx, deskY - 1, 14, 1, C.ink);
    r.rect(bx + 1, deskY - 4, 12, 1, C.ink);
    r.rect(bx, deskY - 7, 13, 1, C.ink);
  }
  // A little plant on the right.
  const px = cx + 58;
  if (px < r.w - 8) {
    part(r, roundRect(px, deskY - 6, px + 7, deskY - 1, 1), [px - 1, deskY - 7, px + 8, deskY], {
      hi: C.pot,
      base: C.pot,
      lo: C.potLo
    });
    const leaf = (x: number, y: number) =>
      part(r, ellipse(x, y, 2.6, 1.6), boxOf(x, y, 3, 2), LEAF, { glint: 0 });
    leaf(px + 1, deskY - 9);
    leaf(px + 7, deskY - 10);
    leaf(px + 4, deskY - 13);
  }
  // The mug on the desk (unless Lumine is holding it).
  if (!mugInHand) drawMug(r, cx + 31, deskY - 9, state, false);
}

function drawMug(r: Raster, x: number, y: number, state: LumineSceneState, lifted: boolean) {
  part(r, roundRect(x, y, x + 7, y + 8, 1), [x - 1, y - 1, x + 8, y + 9], MUG, { glint: 0 });
  // Handle.
  r.rect(x + 8, y + 2, 2, 1, C.ink);
  r.rect(x + 10, y + 3, 1, 3, C.ink);
  r.rect(x + 8, y + 6, 2, 1, C.ink);
  r.rect(x + 9, y + 3, 1, 3, C.mugLo);
  r.rect(x + 1, y, 6, 1, C.coffee);
  // A heart on the mug.
  r.set(x + 3, y + 3, C.whiteHi);
  r.set(x + 5, y + 3, C.whiteHi);
  r.rect(x + 3, y + 4, 3, 1, C.whiteHi);
  r.set(x + 4, y + 5, C.whiteHi);
  // Steam.
  const puffs = lifted ? 3 : 2;
  for (let i = 0; i < puffs; i++) {
    const t = (state.frame + i * 5) % 15;
    const sx = x + 2 + i * 2 + (Math.floor(t / 3) % 2);
    const sy = y - 2 - Math.floor(t / 2);
    r.blend(sx, sy, C.steam, Math.max(0, 0.7 - t * 0.05));
    r.blend(sx, sy - 1, C.steam, Math.max(0, 0.5 - t * 0.04));
  }
}

function drawKeyboard(r: Raster, lay: Layout, litKeys: number[], shake = 0) {
  const { cx, deskY } = lay;
  const x0 = cx - 24;
  const y0 = deskY - 4 - shake;
  r.rect(x0 - 1, y0 - 1, 50, 7, C.ink);
  r.rect(x0, y0, 48, 5, C.kbBody);
  r.rect(x0, y0, 48, 1, C.kbBodyHi);
  // Two rows of 14 keys, 3 px apart, plus a space bar.
  for (let row = 0; row < 2; row++) {
    for (let k = 0; k < 14; k++) {
      const index = row * 14 + k;
      const lit = litKeys.includes(index);
      const kx = x0 + 3 + k * 3;
      const ky = y0 + 1 + row * 2;
      r.rect(kx, ky, 2, 1, lit ? C.keyLit : row === 0 ? C.keyHi : C.key);
      if (lit) r.blend(kx, ky - 1, C.keyLit, 0.35);
    }
  }
}

function drawFist(r: Raster, pose: ArmPose) {
  const [fx, fy] = pose.fist;
  if (pose.kind === 'flat') {
    // Seen from above on the keys: a wide block with four knuckles.
    part(r, roundRect(fx - 6, fy - 4, fx + 6, fy + 3, 2), [fx - 7, fy - 5, fx + 7, fy + 4], WHITE);
    for (let i = -3; i <= 3; i += 3) r.rect(fx + i, fy - 3, 1, 3, C.whiteLo);
  } else if (pose.kind === 'up') {
    // A raised fist from the front: four knuckles, the thumb across.
    part(r, roundRect(fx - 5, fy - 5, fx + 5, fy + 5, 3), [fx - 6, fy - 6, fx + 6, fy + 6], WHITE);
    for (let i = -2; i <= 3; i += 2.5) r.rect(Math.round(fx + i - 0.5), fy - 4, 1, 4, C.whiteLo);
    r.rect(fx - 4, fy + 1, 7, 1, C.whiteLo);
    r.rect(fx - 4, fy + 2, 6, 1, C.whiteHi);
  } else {
    // Side grip (holding the mug).
    part(r, roundRect(fx - 4, fy - 5, fx + 4, fy + 5, 2), [fx - 5, fy - 6, fx + 5, fy + 6], WHITE);
    for (let j = -3; j <= 3; j += 2) r.rect(fx - 2, fy + j, 4, 1, C.whiteLo);
  }
}

function drawArm(
  r: Raster,
  shoulder: [number, number],
  pose: ArmPose,
  bob: number,
  state: LumineSceneState,
  holdingMug: boolean
) {
  const [ex, ey] = [pose.fore[0], pose.fore[1] + (pose.kind === 'flat' ? 0 : bob)];
  const [fx, fy] = pose.fist;
  void shoulder;
  // White wrist cylinder (like the reference's), inked.
  line(r, ex, ey, fx, fy, 6, C.ink);
  line(r, ex, ey, fx, fy, 4, C.joint);
  line(r, ex + 1, ey + 1, fx + 1, fy + 1, 1, C.jointLo);
  // Forearm ball with a gold band.
  const fore = ellipse(ex, ey, 7.5, 7);
  part(r, fore, boxOf(ex, ey, 8, 7), NAVY);
  fill(r, (x, y) => fore(x, y) && y >= ey + 1 && y <= ey + 3, boxOf(ex, ey, 8, 7), C.gold);
  fill(r, (x, y) => fore(x, y) && y === ey + 1, boxOf(ex, ey, 8, 7), C.goldHi);
  fill(r, (x, y) => fore(x, y) && y === ey + 3, boxOf(ex, ey, 8, 7), C.goldLo);
  if (holdingMug) drawMug(r, fx - 11, fy - 6, state, true);
  drawFist(r, { ...pose, fist: [fx, fy] });
}

function drawStar(r: Raster, cx: number, cy: number, state: LumineSceneState) {
  const pulse = state.pose === 'celebrate' ? 1 : (Math.floor(state.frame / 4) % 4 === 0 ? 1 : 0);
  // Warm glow in the glass around the star.
  const glowR = 16 + pulse;
  for (let y = cy - glowR; y <= cy + glowR; y++) {
    for (let x = cx - glowR; x <= cx + glowR; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / glowR;
      if (d < 1) r.blend(x, y, C.starHi, (1 - d) * (state.pose === 'celebrate' ? 0.75 : 0.45));
    }
  }
  const radius = 14 + (state.pose === 'celebrate' && state.poseFrame % 4 < 2 ? 1 : 0);
  part(r, starMask(cx, cy, radius), boxOf(cx, cy, radius, radius), STAR, {
    outline: C.starLo,
    glint: 0
  });
  r.rect(cx - 1, cy - 1, 3, 3, C.starCore);
  r.set(cx, cy - 2, C.starCore);
  r.set(cx, cy + 2, C.starCore);
}

function drawLumine(r: Raster, lay: Layout, g: PoseGeometry, state: LumineSceneState) {
  const cx = lay.cx + (g.sway || 0);
  const b = g.bob;
  // ---- Body: the star cage ----
  const cageTop = 46 + b;
  const cageBottom = 86;
  const cage = roundRect(cx - 24, cageTop, cx + 24, cageBottom, 9);
  part(r, cage, [cx - 26, cageTop - 1, cx + 26, cageBottom + 1], GOLD, { glint: 0 });
  const glass = roundRect(cx - 21, cageTop + 3, cx + 21, cageBottom - 2, 7);
  part(r, glass, [cx - 22, cageTop + 2, cx + 22, cageBottom - 1], GLASS, { outline: C.goldLo, glint: 0 });
  // Glassy shine on the left of the cage.
  for (let y = cageTop + 6; y < cageTop + 22; y++) r.blend(cx - 17, y, C.whiteHi, 0.35);
  for (let y = cageTop + 8; y < cageTop + 14; y++) r.blend(cx - 15, y, C.whiteHi, 0.25);
  const starY = cageTop + 17;
  drawStar(r, cx, starY, state);
  // Floating sparks inside the cage.
  for (let i = 0; i < 7; i++) {
    const t = (state.frame + i * 9) % 30;
    const sx = cx - 17 + Math.floor(hash(i * 3 + 100) * 34);
    const sy = cageBottom - 4 - Math.floor((t / 30) * 26);
    if (glass(sx, sy) && !(Math.abs(sx - cx) < 6 && Math.abs(sy - starY) < 6)) {
      r.blend(sx, sy, C.spark, t < 24 ? 0.95 : 0.4);
    }
  }
  // Gold bars in front of the glass.
  for (const dx of [-17, -10, 9, 16]) {
    const barX = cx + dx;
    for (let y = cageTop + 2; y <= cageBottom - 1; y++) {
      if (!cage(barX, y) || !cage(barX + 1, y)) continue;
      r.set(barX - 1, y, C.ink);
      r.set(barX, y, C.goldHi);
      r.set(barX + 1, y, C.gold);
      r.set(barX + 2, y, C.goldLo);
    }
  }
  // Collar band with the cyan gem.
  const collar = roundRect(cx - 26, cageTop - 2, cx + 26, cageTop + 3, 2);
  part(r, collar, [cx - 27, cageTop - 3, cx + 27, cageTop + 4], GOLD, { glint: 0 });
  part(r, ellipse(cx, cageTop + 1, 4.5, 4.5), boxOf(cx, cageTop + 1, 5, 5), GOLD, { glint: 0 });
  part(r, ellipse(cx, cageTop + 1, 2.6, 2.6), boxOf(cx, cageTop + 1, 3, 3), LENS, { outline: C.goldLo, glint: 0 });
  r.set(cx - 1, cageTop, C.lensHi);

  // ---- Head ----
  const hx = cx;
  const hy = 29 + b;
  // Gold cap.
  part(r, ellipse(hx, hy - 15, 6.5, 5), boxOf(hx, hy - 15, 7, 5), GOLD, { glint: 0.05 });
  r.rect(hx - 6, hy - 13, 13, 1, C.goldLo);
  // Side lenses (behind the dome edge).
  for (const side of [-1, 1]) {
    const lx = hx + side * 20;
    part(r, ellipse(lx, hy + 1, 6, 6.5), boxOf(lx, hy + 1, 6, 7), GOLD, { glint: 0 });
    part(r, ellipse(lx + side * 0.5, hy + 1, 3.6, 4), boxOf(lx, hy + 1, 4, 4), LENS, { outline: C.goldLo, glint: 0 });
    r.set(lx - 1, hy - 1, C.lensHi);
  }
  // The dome.
  const dome = ellipse(hx, hy, 19, 15.5);
  part(r, dome, boxOf(hx, hy, 19, 16), NAVY, { glint: 0.04 });
  // Visor: gold rim, glowing glass, two oval eyes.
  const vy = hy - 2;
  const rim = roundRect(hx - 15, vy - 6, hx + 15, vy + 7, 6);
  part(r, rim, [hx - 16, vy - 7, hx + 16, vy + 8], GOLD, { glint: 0 });
  const glassMask = roundRect(hx - 13, vy - 4, hx + 13, vy + 5, 5);
  for (let y = vy - 4; y <= vy + 5; y++) {
    for (let x = hx - 13; x <= hx + 13; x++) {
      if (!glassMask(x, y)) continue;
      const t = (y - (vy - 4)) / 9;
      r.set(x, y, t < 0.25 ? C.visorHi : t < 0.75 ? C.visor : C.visorLo);
    }
  }
  // Visor shine.
  for (let i = 0; i < 5; i++) r.blend(hx - 11 + i, vy - 4, C.whiteHi, 0.55);
  r.blend(hx - 12, vy - 3, C.whiteHi, 0.45);
  drawEyes(r, hx + g.look[0], vy + g.look[1], g.eyes);

  // ---- Shoulders and arms ----
  for (const side of [-1, 1] as const) {
    const sx = cx + side * 34;
    const sy = 56 + b;
    const arm = side < 0 ? g.left : g.right;
    // The upper arm: a white cylinder that the shoulder ball covers.
    const [ex, ey] = arm.fore;
    line(r, sx, sy, ex, ey, 8, C.ink);
    line(r, sx, sy, ex, ey, 6, C.joint);
    line(r, sx + 1, sy + 2, ex + 1, ey + 2, 2, C.jointLo);
    const shoulder = ellipse(sx, sy, 12.5, 12);
    part(r, shoulder, boxOf(sx, sy, 13, 12), NAVY, { glint: 0.05 });
    // Gold band around the lower part of the ball.
    const band = (x: number, y: number) => shoulder(x, y) && y >= sy + 3 && y <= sy + 6;
    fill(r, band, boxOf(sx, sy, 13, 12), C.gold);
    fill(r, (x, y) => band(x, y) && y === sy + 3, boxOf(sx, sy, 13, 12), C.goldHi);
    fill(r, (x, y) => band(x, y) && y === sy + 6, boxOf(sx, sy, 13, 12), C.goldLo);
    // Cyan lens on the outer side.
    const lx = sx + side * 6;
    part(r, ellipse(lx, sy - 4, 3.2, 3.2), boxOf(lx, sy - 4, 4, 4), GOLD, { glint: 0 });
    part(r, ellipse(lx, sy - 4, 1.8, 1.8), boxOf(lx, sy - 4, 2, 2), LENS, { outline: null, glint: 0 });
    drawArm(r, [sx, sy + 7], arm, 0, state, side > 0 && g.mugInHand);
  }
}

function drawEyes(r: Raster, cx: number, cy: number, eyes: Eyes) {
  for (const side of [-1, 1]) {
    const ex = cx + side * 6;
    // Soft glow behind each eye.
    for (let y = cy - 4; y <= cy + 5; y++) {
      for (let x = ex - 3; x <= ex + 3; x++) r.blend(x, y, C.eyeGlow, 0.18);
    }
    switch (eyes) {
      case 'blink':
        r.rect(ex - 2, cy + 1, 5, 1, C.eye);
        break;
      case 'focus':
        // Narrowed with concentration.
        r.rect(ex - 2, cy, 5, 2, C.eye);
        r.rect(ex - 1, cy + 2, 3, 1, C.eyeGlow);
        break;
      case 'happy':
        // ^ ^
        r.set(ex - 2, cy + 1, C.eye);
        r.set(ex - 1, cy, C.eye);
        r.set(ex, cy - 1, C.eye);
        r.set(ex + 1, cy, C.eye);
        r.set(ex + 2, cy + 1, C.eye);
        break;
      case 'closed':
        // > <
        r.set(ex - side, cy - 1, C.eye);
        r.set(ex, cy, C.eye);
        r.set(ex + side, cy + 1, C.eye);
        r.set(ex, cy + 2, C.eye);
        r.set(ex - side, cy + 3, C.eye);
        break;
      default: {
        // Tall white ovals, a little cyan at the bottom.
        r.rect(ex - 1, cy - 2, 3, 1, C.eye);
        r.rect(ex - 2, cy - 1, 5, 4, C.eye);
        r.rect(ex - 1, cy + 3, 3, 1, C.eyeGlow);
      }
    }
  }
}

function drawEffects(r: Raster, lay: Layout, g: PoseGeometry, state: LumineSceneState) {
  const { cx, deskY } = lay;
  const f = state.poseFrame;
  if (state.pose === 'burst') {
    // Keys and sparks fly off the keyboard; speed lines by the fists.
    for (let i = 0; i < 6; i++) {
      const life = (f + i * 2) % 8;
      const seed = Math.floor((f + i * 2) / 8) * 31 + i;
      const sx = cx - 20 + Math.floor(hash(seed) * 40) + Math.round((hash(seed + 1) - 0.5) * life * 3);
      const sy = deskY - 5 - life * 2;
      const colour = i % 3 === 0 ? C.keyLit : i % 3 === 1 ? C.spark : C.keyHi;
      if (i % 3 === 2) {
        r.rect(sx, sy, 2, 2, colour);
        r.set(sx, sy, C.whiteHi);
      } else {
        r.blend(sx, sy, colour, Math.max(0.2, 1 - life / 8));
      }
    }
    for (const side of [-1, 1]) {
      const x = cx + side * 30;
      for (let j = 0; j < 3; j++) r.blend(x + side * (j % 2), deskY - 10 + j * 3, C.whiteHi, 0.5);
    }
  }
  if (state.pose === 'think') {
    // Thought bubble: dots appear one by one, then an idea lights up.
    const bx = cx + 26;
    const by = 4;
    r.blendRect(cx + 21, 18, 2, 2, C.whiteHi, 0.85);
    r.blendRect(cx + 24, 13, 3, 3, C.whiteHi, 0.9);
    part(r, roundRect(bx, by, bx + 20, by + 10, 4), [bx - 1, by - 1, bx + 21, by + 11], WHITE, { glint: 0 });
    if (f >= 24) {
      // Light bulb.
      const lx = bx + 10;
      const lit = f % 4 < 2;
      part(r, ellipse(lx, by + 4, 3, 3), boxOf(lx, by + 4, 3, 3), {
        hi: C.starCore,
        base: lit ? C.starHi : C.starBase,
        lo: C.starLo
      }, { glint: 0 });
      r.rect(lx - 1, by + 7, 3, 2, C.whiteLo);
      if (lit) {
        r.set(lx - 5, by + 2, C.starBase);
        r.set(lx + 5, by + 2, C.starBase);
        r.set(lx, by - 1, C.starBase);
      }
    } else {
      const dots = 1 + (Math.floor(f / 4) % 3);
      for (let i = 0; i < dots; i++) r.rect(bx + 5 + i * 4, by + 5, 2, 2, C.navy);
    }
  }
  if (state.pose === 'stretch' && f > 4 && f < 26) {
    for (const side of [-1, 1]) {
      const x = cx + side * 38;
      const t = f % 6;
      r.set(x + side * t, 8 - (t >> 1), C.spark);
    }
  }
  if (state.pose === 'glance' && !state.compact) {
    // A tiny "!" pops over the app screen when Lumine spots something.
    if (f > 8 && f < 20) {
      const [x0, y0, x1] = lay.side;
      const midX = Math.floor((x0 + x1) / 2);
      text(r, midX, y0 - 7, '!', C.goldHi);
    }
  }
  if (state.pose === 'celebrate') {
    for (let i = 0; i < 22; i++) {
      const vx = (hash(i * 7 + 3) - 0.5) * 7;
      const vy = -2.2 - hash(i * 7 + 4) * 2;
      const t = f * 0.9;
      const x = cx + vx * t;
      const y = 58 + vy * t + 0.18 * t * t;
      if (y > deskY) continue;
      const colour = C.confetti[i % C.confetti.length];
      r.set(x, y, colour);
      if (i % 2) r.set(x + 1, y, colour);
    }
    // Sparkles round the star.
    const starY = 46 + g.bob + 17;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + f * 0.4;
      r.set(cx + Math.cos(a) * 19, starY + Math.sin(a) * 15, C.starCore);
    }
  }
  if (state.pose === 'slam') {
    const beat = f % 12;
    if (beat === 8 || beat === 9) {
      // Wind-up marks over the raised fist.
      r.set(cx + 37, 36, C.whiteHi);
      r.set(cx + 38, 34, C.whiteHi);
      r.set(cx + 23, 36, C.whiteHi);
      r.set(cx + 22, 34, C.whiteHi);
    }
    if (beat === 10 || beat === 11) {
      // Impact burst on the Enter key.
      const ix = cx + 18;
      const iy = deskY - 5;
      const reach = beat === 10 ? 7 : 10;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const x = ix + Math.round(Math.cos(a) * reach);
        const y = iy + Math.round(Math.sin(a) * reach * 0.6) - 2;
        if (y < deskY) {
          r.set(x, y, i % 2 ? C.keyLit : C.spark);
          if (beat === 10) r.set(x + Math.sign(Math.cos(a)), y, C.whiteHi);
        }
      }
    }
  }
  if (state.pose === 'flow') {
    // Music notes drifting up from Lumine's head.
    for (let i = 0; i < 3; i++) {
      const t = (f + i * 7) % 21;
      const x = cx + 24 + i * 5 + (Math.floor(t / 4) % 2);
      const y = 22 - t;
      if (y < 2) continue;
      const colour = i === 1 ? C.lensHi : C.goldHi;
      r.rect(x, y, 2, 2, colour);
      r.rect(x + 1, y - 4, 1, 4, colour);
      if (i !== 1) r.set(x + 2, y - 4, colour);
    }
  }
  if (state.pose === 'wave') {
    // Little motion marks beside the waving hand.
    if (Math.floor(f / 3) % 2) {
      r.set(cx + 47, 20, C.whiteHi);
      r.set(cx + 48, 23, C.whiteHi);
    } else {
      r.set(cx + 31, 20, C.whiteHi);
      r.set(cx + 30, 23, C.whiteHi);
    }
  }
}

// ---------------------------------------------------------------------------
// Entry points
// ---------------------------------------------------------------------------

export function sceneWidthFor(availableWidth: number, scale: number) {
  return Math.max(
    SCENE_MIN_W,
    Math.min(SCENE_MAX_W, Math.floor(availableWidth / Math.max(1, scale)))
  );
}

// Render one frame into a fresh pixel buffer (RGBA bytes, row-major).
export function renderScene(width: number, state: LumineSceneState) {
  const r = new Raster(width, SCENE_H);
  const lay = layout(width);
  const g = geometry(state, lay);
  const screenBright = state.idle ? 0.7 : 1;
  drawRoom(r, lay, state);
  if (!state.compact) {
    drawBeam(r, lay.main, lay.deskY);
    drawBeam(r, lay.side, lay.deskY);
    drawCodeScreen(r, lay.main, state, screenBright);
    drawAppScreen(
      r,
      lay.side,
      state,
      state.pose === 'glance' || state.pose === 'test' ? 1 : screenBright * 0.85
    );
  }
  drawLumine(r, lay, g, state);
  drawDesk(r, lay);
  drawKeyboard(r, lay, g.litKeys, g.kbShake || 0);
  if (state.compact) {
    if (!g.mugInHand) drawMug(r, lay.cx + 31, lay.deskY - 9, state, false);
  } else {
    drawProps(r, lay, state, g.mugInHand);
  }
  // Fists resting on the keyboard sit in front of it.
  for (const side of [-1, 1] as const) {
    const arm = side < 0 ? g.left : g.right;
    if (arm.kind === 'flat') drawFist(r, arm);
  }
  drawEffects(r, lay, g, state);
  return new Uint8ClampedArray(r.data.buffer);
}

// How many code pixels a pose types per tick.
export function typingSpeed(pose: LuminePose) {
  switch (pose) {
    case 'burst':
      return 5;
    case 'type':
      return 2;
    case 'glance':
      return 1;
    case 'flow':
      return 2;
    case 'slam':
      return 3;
    default:
      return 0;
  }
}
