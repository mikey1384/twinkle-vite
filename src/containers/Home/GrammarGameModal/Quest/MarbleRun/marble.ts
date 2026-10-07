import { makeSprite, rect, disc, line, poly, Sprite, U, INK, canvas } from './pixel';

// Classic's exact grade colours (theme grammarGameScoreS..F) and points.
export type Grade = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
export const GRADE: Record<Grade, [string, number]> = {
  S: ['#ffcb32', 100],
  A: ['#df3296', 90],
  B: ['#ff8c00', 70],
  C: ['#ff69b4', 50],
  D: ['#418ceb', 30],
  F: ['#999999', 10]
};
// practice promotes the marble up this ladder, one grade per obstacle
export const LADDER: Grade[] = ['D', 'C', 'B', 'A', 'S'];

export const PX = 24;
export const MSCALE = 3;
export const MR = (PX * MSCALE) / 2;

const FONT: Record<Grade, string[]> = {
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000']
};

// A real ball, not a card (Mikey 10-07: the coin-flip spin felt like paper).
// Each pixel is a point on a sphere. The light, shading and glint stay fixed
// on screen; only what is inside the glass (swirls and the grade letter)
// turns with the roll, around an axis tilted a little toward the viewer, so
// the letter rolls over the top and comes back round. Angle 0 is the rest
// pose: letter facing you, upright.
const TILT = 0.45;
const AXIS = [0, -Math.sin(TILT), Math.cos(TILT)];
const LIGHT = norm3([-0.55, -0.65, 0.55]);
function norm3([x, y, z]: number[]) {
  const l = Math.hypot(x, y, z);
  return [x / l, y / l, z / l];
}
function rgbOf(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}
function toBody([x, y, z]: number[], angle: number) {
  const c = Math.cos(-angle);
  const s = Math.sin(-angle);
  const [kx, ky, kz] = AXIS;
  const dot = kx * x + ky * y + kz * z;
  const cx = ky * z - kz * y;
  const cy = kz * x - kx * z;
  const cz = kx * y - ky * x;
  return [
    x * c + cx * s + kx * dot * (1 - c),
    y * c + cy * s + ky * dot * (1 - c),
    z * c + cz * s + kz * dot * (1 - c)
  ];
}

export type Face = 'happy' | 'steady' | 'strained';
const ANGLE_STEPS = 48;
const cache = new Map<string, Sprite>();

export function marbleSprite(grade: Grade | null, face: Face, angle: number) {
  const q =
    ((Math.round((angle / (Math.PI * 2)) * ANGLE_STEPS) % ANGLE_STEPS) +
      ANGLE_STEPS) %
    ANGLE_STEPS;
  const key = `${grade || 'glass'}|${face}|${q}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const turn = (q / ANGLE_STEPS) * Math.PI * 2;
  const c = canvas(PX, PX);
  const p = c.getContext('2d')!;
  const base = rgbOf(grade ? GRADE[grade][0] : '#bcdcfa');
  const rows = grade ? FONT[grade] : null;
  const letterAt = (col: number, row: number) =>
    !!rows && row >= 0 && row < 7 && col >= 0 && col < 5 && rows[row][col] === '1';
  const R = 11.4;
  for (let y = 0; y < PX; y++) {
    for (let x = 0; x < PX; x++) {
      const u = (x + 0.5 - 12) / R;
      const v = (y + 0.5 - 12) / R;
      const d2 = u * u + v * v;
      if (d2 > 1) continue;
      const n = [u, v, Math.sqrt(1 - d2)];
      let col: number[];
      if (d2 > 0.84) col = [34, 49, 77];
      else {
        const lit = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
        const band = [0.58, 0.8, 1, 1.16][Math.min(3, Math.floor(lit * 4))];
        col = base.map((ch) => ch * band);
        const bp = toBody(n, turn);
        const swirl = Math.sin(Math.atan2(bp[1], bp[0]) * 2 + bp[2] * 5);
        const front = bp[2] > 0.35;
        const lc = Math.floor(bp[0] * R + 2);
        const lr = Math.floor(bp[1] * R + 3);
        if (front && letterAt(lc, lr)) col = [255, 255, 255];
        else if (front && letterAt(lc - 1, lr - 1)) col = [34, 49, 77];
        else if (
          Math.abs(swirl) > 0.86 &&
          !(front && rows && Math.abs(bp[0]) < 0.35 && Math.abs(bp[1]) < 0.42)
        ) {
          col = col.map((ch) => ch + (255 - ch) * 0.38);
        }
        if (Math.hypot(u + 0.38, v + 0.42) < 0.2) col = [255, 255, 255];
        else if (Math.hypot(u + 0.5, v + 0.18) < 0.08) col = [255, 255, 255];
        else if (Math.hypot(u - 0.42, v - 0.5) < 0.12) {
          col = col.map((ch) => ch + (255 - ch) * 0.3);
        }
      }
      p.fillStyle = `rgb(${col.map((ch) => Math.max(0, Math.min(255, Math.round(ch)))).join(',')})`;
      p.fillRect(x, y, 1, 1);
    }
  }
  if (!grade) {
    // the glass marble's face rides on the front, upright
    p.fillStyle = '#22314d';
    const eyeY = face === 'strained' ? 9 : 8;
    p.fillRect(8, eyeY, 2, 2);
    p.fillRect(14, eyeY, 2, 2);
    if (face === 'happy') {
      p.fillRect(9, 14, 1, 1);
      p.fillRect(10, 15, 4, 1);
      p.fillRect(14, 14, 1, 1);
    } else if (face === 'steady') p.fillRect(10, 15, 4, 1);
    else {
      p.fillRect(9, 15, 2, 1);
      p.fillRect(11, 14, 2, 1);
      p.fillRect(13, 15, 2, 1);
      p.fillRect(7, 7, 2, 1);
      p.fillRect(15, 7, 2, 1);
    }
  }
  cache.set(key, c);
  return c;
}

// ---- gear for the movement modes (drawn around the marble)
// wings for sky levels: two flap frames
export const WINGS = [0, 1].map((f) =>
  makeSprite(14, 12, (put) => {
    const tip = f ? 1 : 8;
    poly(put, [[0, 10], [5, tip], [13, 3 + f * 3], [13, 11]], '#ffffff');
    line(put, 4, 9, 11, 4 + f * 3, '#c9d6ea');
    line(put, 6, 11, 12, 7 + f * 2, '#c9d6ea');
  })
);
// a bubble for underwater levels (drawn as a ring, not filled)
export function bubbleRing(g: CanvasRenderingContext2D, cx: number, cy: number, t: number) {
  const r = MR + 9 + Math.sin(t / 300) * 2;
  const steps = 40;
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    g.fillStyle = i % 9 === 0 ? '#ffffff' : 'rgba(200,240,255,.7)';
    g.fillRect(
      Math.round((cx + Math.cos(a) * r) / U) * U,
      Math.round((cy + Math.sin(a) * r) / U) * U,
      U,
      U
    );
  }
  g.fillStyle = 'rgba(255,255,255,.85)';
  g.fillRect(Math.round((cx - r * 0.55) / U) * U, Math.round((cy - r * 0.6) / U) * U, U * 2, U);
}
// a mine cart for rail levels
export const CART = makeSprite(30, 14, (put) => {
  rect(put, 0, 0, 30, 2, '#8a8f99');
  rect(put, 1, 2, 28, 8, '#b06a3a');
  rect(put, 1, 2, 28, 1, '#d98a50');
  for (const x of [6, 14, 22]) rect(put, x, 3, 1, 7, '#7a4826');
  rect(put, 0, 9, 30, 2, '#5a5f69');
  disc(put, 7, 11.5, 2.6, 2.6, '#3a3f49', undefined, '#8a8f99');
  disc(put, 23, 11.5, 2.6, 2.6, '#3a3f49', undefined, '#8a8f99');
});
// a little space helmet visor ring for low-gravity levels
export const HELMET = makeSprite(28, 28, (put) => {
  for (let a = 0; a < 64; a++) {
    const x = 14 + Math.round(Math.cos((a / 64) * Math.PI * 2) * 13.5);
    const y = 14 + Math.round(Math.sin((a / 64) * Math.PI * 2) * 13.5);
    put(x, y, a % 16 < 3 ? '#ffffff' : '#bfe8ff');
  }
  rect(put, 9, 26, 10, 2, '#d0d6e0');
}, { outline: false });
export { INK };
