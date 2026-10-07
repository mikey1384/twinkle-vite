import { makeSprite, disc, line, rect, poly, ring, INK, Put } from '../../pixel';
import { registerEnemy } from './registry';

// Worlds of the sky library, stormy citadel, academy and the logic tower in
// space. Same kit as village.ts: frames face left (toward the marble), the
// dark outline comes from makeSprite, every sprite is built once here.

const anim = (n: number, w: number, h: number, draw: (put: Put, f: number) => void) =>
  Array.from({ length: n }, (_, f) => makeSprite(w, h, (put) => draw(put, f)));

// 2×2 cartoon eye, pupil on the left so it looks at the marble
function eye(put: Put, x: number, y: number, blink = false) {
  if (blink) {
    put(x, y + 1, INK);
    put(x + 1, y + 1, INK);
    return;
  }
  put(x, y, INK);
  put(x, y + 1, INK);
  put(x + 1, y, '#fff');
  put(x + 1, y + 1, '#fff');
}

// 3×4 big eye with a shine, for critters that need to read from far away
function bigEye(put: Put, x: number, y: number) {
  rect(put, x, y, 3, 4, '#fff');
  rect(put, x, y + 1, 2, 2, INK);
  put(x, y + 1, '#fff');
}

// Snapping-plant jaws: hinge at (hx, hy), each jaw `a` radians off level,
// a dark mouth wedge between them, lining + teeth along the inner rims so
// closed jaws read as interlocked. Returns a point on the upper jaw (for
// eyes and spots): t along the jaw, k across its bulge.
function maw(
  put: Put,
  hx: number,
  hy: number,
  len: number,
  wid: number,
  a: number,
  col: string,
  dark: string,
  lining: string,
  tooth: string,
  mouth: string
) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  poly(put, [[hx, hy], [hx - c * len * 0.6, hy - s * len * 0.6], [hx - c * len * 0.6, hy + s * len * 0.6]], mouth);
  let pt = (_t: number, _k: number): [number, number] => [hx, hy];
  for (const up of [false, true]) {
    const dx = -c;
    const dy = up ? -s : s;
    const nx = up ? -dy : dy;
    const ny = up ? dx : -dx;
    const w = up ? wid : wid * 0.85;
    const pts: [number, number][] = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const b = w * Math.pow(Math.sin(Math.PI * t), 0.7);
      pts.push([hx + dx * len * t + nx * b, hy + dy * len * t + ny * b]);
    }
    poly(put, pts, up ? col : dark);
    let n = 0;
    for (let t = 0.14; t < 0.94; t += 0.08) {
      put(hx + dx * len * t + nx * 0.6, hy + dy * len * t + ny * 0.6, n++ % 2 ? lining : tooth);
    }
    if (up) {
      pt = (t, k) => [Math.round(hx + dx * len * t + nx * w * k), Math.round(hy + dy * len * t + ny * w * k)];
    }
  }
  return pt;
}

// 4×4 round-ish glasses lens with an eye inside
function lens(put: Put, x: number, y: number) {
  for (let i = 0; i < 4; i++) {
    put(x + i, y, INK);
    put(x + i, y + 3, INK);
    put(x, y + i, INK);
    put(x + 3, y + i, INK);
  }
  rect(put, x + 1, y + 1, 2, 2, '#fff');
  put(x + 1, y + 1, INK);
  put(x + 1, y + 2, INK);
}

// ---------------------------------------------------------------- sky library

registerEnemy('bookworm', {
  motion: 'walk',
  patrol: 18,
  frameMs: 260,
  frames: anim(2, 22, 20, (put, f) => {
    // little feet scooting the book along
    rect(put, 4 + f * 2, 18, 2, 2, '#5a3020');
    rect(put, 15 - f * 2, 18, 2, 2, '#5a3020');
    rect(put, 1, 14, 20, 4, '#b8402e');
    rect(put, 1, 17, 20, 1, '#842a1e');
    rect(put, 1, 14, 1, 3, '#d8604a');
    rect(put, 2, 12, 8, 3, '#f6eedb');
    rect(put, 12, 12, 8, 3, '#f6eedb');
    rect(put, 10, 12, 2, 3, '#ddd0b0');
    rect(put, 3, 13, 6, 1, '#cfc2a2');
    rect(put, 13, 13, 6, 1, '#cfc2a2');
    // a page flutters as it walks
    if (f) {
      rect(put, 14, 11, 6, 1, '#fffaf0');
      rect(put, 16, 10, 4, 1, '#fffaf0');
    }
    // ribbon bookmark
    put(18, 18, '#e04070');
    put(18, 19, '#e04070');
    // worm rising from the gutter, swaying, glasses on
    const hx = 8 - f;
    disc(put, 11.5, 11, 2.8, 2.5, '#8ad84a', '#5aa02a');
    put(11, 11, '#5aa02a');
    disc(put, 10.5 - f * 0.5, 9, 2.8, 2.2, '#8ad84a', '#5aa02a');
    disc(put, hx, 5.5, 5.5, 4.8, '#9ae25a', '#5aa02a', '#d4ffa0');
    lens(put, hx - 5, 3);
    lens(put, hx - 1, 3);
    put(hx - 3, 8, INK);
    put(hx - 2, 9, INK);
    put(hx - 1, 9, INK);
    put(hx, 8, INK);
    put(hx + 3, 8, '#ff9ab8');
    put(hx + 3, 2, '#d4ffa0');
  })
});

registerEnemy('quill', {
  motion: 'hover',
  height: 90,
  frameMs: 200,
  frames: anim(4, 22, 24, (put, f) => {
    // vane ripples back and forth while the ink drop gathers and falls
    const w = [0, 1, 2, 1][f];
    poly(put, [[21, 0], [14 - w, 2], [9 - w, 7], [6, 14], [8, 15], [13 + w, 12], [19 + w, 7 + w]], '#f4f0ff');
    poly(put, [[21, 0], [8, 15], [13 + w, 12], [19 + w, 7 + w]], '#cfc6ec');
    line(put, 21, 0, 7, 15, '#9a88c8');
    // barb notches
    put(12, 4, null);
    put(16, 10, null);
    // nib and ink
    line(put, 7, 15, 4, 18, '#4a4060', 2);
    put(3, 19, INK);
    put(3, 20, '#3a4ad0');
    if (f === 1) rect(put, 3, 21, 1, 2, '#3a4ad0');
    if (f === 2) put(3, 23, '#3a4ad0');
    eye(put, 10, 7);
    eye(put, 13, 5);
    put(15, 8, '#ffa0c0');
    put(11, 10, INK);
  })
});

registerEnemy('paperplane', {
  motion: 'hover',
  height: 100,
  patrol: 34,
  frameMs: 240,
  frames: anim(2, 24, 16, (put, f) => {
    poly(put, [[0, 8], [13, 9], [23, f], [17, 14 + f]], '#c4cce6');
    poly(put, [[0, 8], [23, f], [12, 9]], '#ffffff');
    line(put, 1, 8, 22, 1 + f, '#9aa4c8');
    // determined little face near the nose
    eye(put, 6, 6);
    put(5, 5, INK);
    put(6, 4 + f, INK);
    // speed streaks
    put(23, 10 + f, '#e8ecff');
    put(22, 12 + f, '#e8ecff');
  })
});

registerEnemy('cloudling', {
  motion: 'hover',
  height: 80,
  frameMs: 200,
  frames: anim(3, 22, 19, (put, f) => {
    const c = '#eef0fa';
    const d = '#bcc4dc';
    rect(put, 3, 9, 16, 4, c);
    disc(put, 6, 9, 5, 4.5, c, d);
    disc(put, 17, 9, 4.5, 4, c, d);
    disc(put, 12, 6, 6, 5.5, c, d, '#ffffff');
    rect(put, 4, 12, 15, 1, d);
    // grumpy: slanted brows and a frown
    line(put, 4, 6, 6, 7, INK);
    line(put, 9, 7, 11, 6, INK);
    eye(put, 5, 8);
    eye(put, 9, 8);
    put(6, 11, INK);
    put(7, 10, INK);
    put(8, 10, INK);
    put(9, 11, INK);
    // a little rain under it
    [6, 11, 16].forEach((x, i) => put(x, 14 + ((f + i) % 3) * 2, '#5aa8ff'));
  })
});

registerEnemy('eraser', {
  motion: 'hop',
  frameMs: 260,
  frames: anim(2, 20, 16, (put, f) => {
    const top = f ? 6 : 3;
    const x0 = f ? 0 : 1;
    const x1 = f ? 19 : 18;
    const h = 15 - top;
    rect(put, x0, top, 11 - x0, h, '#ff9ec0');
    rect(put, 11, top, x1 - 10, h, '#4a78d8');
    rect(put, x0, top, 11 - x0, 1, '#ffc8dc');
    rect(put, 11, top, x1 - 10, 1, '#7aa0f0');
    rect(put, x0, 14, 11 - x0, 1, '#e07098');
    rect(put, 11, 14, x1 - 10, 1, '#2e58b0');
    rect(put, 13, top + 2, 1, h - 3, '#9ab8ff');
    eye(put, x0 + 2, top + 3);
    eye(put, x0 + 6, top + 3);
    put(x0 + 1, top + 6, '#ff6a9a');
    put(x0 + 9, top + 6, '#ff6a9a');
    put(x0 + 4, top + 6, INK);
    put(x0 + 5, top + 6, INK);
    // rubber crumbs on landing
    if (f) {
      put(0, 4, '#ffc8dc');
      put(3, 2, '#ffc8dc');
    }
  })
});

registerEnemy('inkfish', {
  motion: 'swim',
  height: 95,
  frameMs: 320,
  frames: anim(2, 20, 22, (put, f) => {
    const c = '#5a4ab8';
    poly(put, [[10, 0], [3, 9], [17, 9]], c);
    disc(put, 10, 9, 7, 5 - f, c, '#3a2c88', '#a090f0');
    put(10, 1, '#a090f0');
    put(9, 3, '#a090f0');
    bigEye(put, 5, 7);
    bigEye(put, 10, 7);
    put(8, 12 - f, '#ff9ad0');
    // tentacles: together, then spread for a push (Blooper style)
    for (let i = 0; i < 4; i++) {
      const x0 = 6 + i * 2.7;
      if (f) line(put, x0, 13, 2 + i * 5.3, 19, '#7a68d8');
      else line(put, x0, 13, x0 + (i % 2), 20, '#7a68d8');
    }
    // ink puffs trailing behind
    if (f) {
      disc(put, 18, 3, 1.5, 1.5, '#2a2440');
      put(18, 7, '#2a2440');
    }
  })
});

// ------------------------------------------------------------ stormy citadel

registerEnemy('gearbot', {
  motion: 'walk',
  patrol: 20,
  frameMs: 240,
  frames: anim(2, 22, 24, (put, f) => {
    rect(put, 6, 19 + f, 2, 3 - f, '#5a6070');
    rect(put, 13, 20 - f, 2, 2 + f, '#5a6070');
    rect(put, 5, 22, 3, 1, '#3a3f4e');
    rect(put, 12, 22, 3, 1, '#3a3f4e');
    rect(put, 4, 10, 13, 9, '#b8c0d0');
    rect(put, 15, 10, 2, 9, '#8890a8');
    rect(put, 4, 18, 13, 1, '#8890a8');
    ring(put, 10, 14, 2.5, '#e0a030', 12);
    put(10, 14, '#c07818');
    // arm swing
    rect(put, 2, 12 + f, 2, 3, '#8890a8');
    // head, antenna light blinks
    rect(put, 5, 3, 11, 7, '#c8d0e0');
    rect(put, 14, 3, 2, 7, '#98a0b8');
    line(put, 10, 0, 10, 2, '#5a6070');
    put(10, 0, f ? '#ff5a5a' : '#ffd0d0');
    rect(put, 6, 5, 2, 2, '#5af0ff');
    rect(put, 10, 5, 2, 2, '#5af0ff');
    put(6, 5, '#1a6a90');
    put(10, 5, '#1a6a90');
    put(7, 8, '#5a6070');
    put(9, 8, '#5a6070');
    put(11, 8, '#5a6070');
    // wind-up key turning on its back
    rect(put, 17, 13, 2, 1, '#c8a040');
    if (f) rect(put, 19, 12, 3, 3, '#e8c060');
    else {
      rect(put, 19, 10, 2, 3, '#e8c060');
      rect(put, 19, 14, 2, 3, '#e8c060');
    }
  })
});

registerEnemy('knight', {
  motion: 'walk',
  patrol: 22,
  frameMs: 240,
  frames: anim(2, 18, 22, (put, f) => {
    // legs
    rect(put, 6, 17, 2, 4 - f, '#7a8298');
    rect(put, 11, 17, 2, 3 + f, '#7a8298');
    rect(put, 5, 21 - f, 3, 1, '#4a5060');
    rect(put, 11, 20 + f, 3, 1, '#4a5060');
    // sword raised behind
    line(put, 15, 5, 15, 12, '#eef2ff');
    rect(put, 14, 12, 3, 1, '#c89a3a');
    rect(put, 14, 13, 2, 2, '#a8b0c4');
    rect(put, 5, 12, 9, 5, '#a8b0c4');
    rect(put, 12, 12, 2, 5, '#8890a8');
    rect(put, 5, 15, 9, 1, '#6a4a2a');
    // helmet with glowing eyes in the visor slit
    disc(put, 9, 7, 6, 5, '#c0c8d8', '#8890a8', '#ffffff');
    rect(put, 4, 6, 8, 2, '#2a2236');
    put(5, 6 + f, '#ffe060');
    put(8, 6 + f, '#ffe060');
    put(13, 9, '#8890a8');
    // red plume flutters
    disc(put, 9, 1.5, 3, 1.5, '#e04050', '#b02838');
    put(13, 2 + f, '#e04050');
    put(14, 3 - f, '#e04050');
    // shield in front with a diamond crest
    disc(put, 4, 14, 3, 3.5, '#3a6ad8', '#2848a8', '#7aa0ff');
    put(4, 13, '#ffd23a');
    put(3, 14, '#ffd23a');
    put(5, 14, '#ffd23a');
    put(4, 15, '#ffd23a');
  })
});

registerEnemy('gargoyle', {
  motion: 'hover',
  height: 85,
  frameMs: 160,
  frames: anim(3, 22, 18, (put, f) => {
    const wing = '#6e6e88';
    const wings: [number, number][][] = [
      [[13, 7], [21, 0], [20, 6], [17, 9]],
      [[13, 7], [21, 4], [20, 9], [16, 11]],
      [[13, 8], [21, 12], [18, 14], [15, 12]]
    ];
    poly(put, wings[f], wing);
    const tip = wings[f][1];
    line(put, 14, 8, tip[0] - 1, tip[1] + 1, '#4e4e66');
    line(put, 15, 14, 19, 16, '#5e5e78');
    put(20, 16, '#5e5e78');
    put(20, 15, '#5e5e78');
    disc(put, 11, 10, 5, 5, '#8a8aa0', '#5e5e78', '#b8b8cc');
    put(9, 15, '#5e5e78');
    put(12, 15, '#5e5e78');
    disc(put, 8, 6, 4, 3.5, '#9a9ab0', '#6e6e88', '#c8c8dc');
    // little ivory horns
    put(5, 2, '#e8e0c8');
    put(6, 3, '#e8e0c8');
    put(10, 2, '#e8e0c8');
    put(10, 3, '#e8e0c8');
    rect(put, 5, 5, 2, 2, '#ffd23a');
    rect(put, 8, 5, 2, 2, '#ffd23a');
    put(5, 5, INK);
    put(8, 5, INK);
    put(3, 7, '#6e6e88');
    put(6, 9, '#fff');
    put(8, 9, '#fff');
  })
});

registerEnemy('ghost', {
  motion: 'hover',
  height: 75,
  frameMs: 520,
  frames: anim(2, 18, 17, (put, f) => {
    const c = '#f8f8ff';
    const d = '#d0d4ec';
    disc(put, 9, 8, 7, 7, c, d, '#ffffff');
    rect(put, 2, 8, 14, 6, c);
    rect(put, 14, 8, 2, 6, d);
    // wavy hem
    for (let x = 2; x <= 15; x++) if ((x + f * 2) % 4 < 2) put(x, 14, x > 12 ? d : c);
    put(2, 10, '#ffa8c8');
    put(10, 10, '#ffa8c8');
    // stubby paws over the eyes; one drops so an eye can peek
    const paw = (x: number, y: number) => disc(put, x, y, 2, 1.6, '#d4d8f0', '#9ea4c8');
    if (f) {
      eye(put, 3, 7);
      paw(3.5, 11);
      put(5, 12, INK);
    } else paw(3.5, 8);
    paw(8.5, 8);
  })
});

registerEnemy('skeleton', {
  motion: 'walk',
  patrol: 18,
  frameMs: 220,
  frames: anim(2, 18, 22, (put, f) => {
    const b = '#f0ecdc';
    // bony legs
    line(put, 7, 18, 6 + f * 2, 20, b);
    line(put, 11, 18, 12 - f * 2, 20, b);
    rect(put, 5 + f * 2, 21, 2, 1, b);
    rect(put, 11 - f * 2, 21, 2, 1, b);
    rect(put, 7, 16, 5, 2, b);
    line(put, 9, 11, 9, 16, '#e0dac8');
    rect(put, 6, 12, 7, 1, b);
    rect(put, 6, 14, 7, 1, b);
    // arms dangle and rattle
    line(put, 6, 12, 3, 15 + f, b);
    line(put, 12, 12, 15, 14 - f, b);
    // skull with a chattering jaw
    rect(put, 4, 9 + f, 7, 2, '#e8e4d8');
    put(5, 9 + f, INK);
    put(7, 9 + f, INK);
    put(9, 9 + f, INK);
    disc(put, 8, 4.5, 5.5, 4.5, '#f4f0e4', '#c8c0ac', '#ffffff');
    rect(put, 4, 3, 2, 3, INK);
    rect(put, 8, 3, 2, 3, INK);
    put(5, 4, '#fff');
    put(9, 4, '#fff');
    put(7, 6, INK);
  })
});

// ------------------------------------------------------------------ academy

registerEnemy('pencil', {
  motion: 'walk',
  patrol: 20,
  frameMs: 200,
  frames: anim(2, 14, 26, (put, f) => {
    poly(put, [[7, 0], [2, 7], [12, 7]], '#f2c890');
    poly(put, [[7, 0], [5, 3], [9, 3]], '#4a4a5a');
    rect(put, 2, 7, 10, 10, '#ffd23a');
    rect(put, 3, 7, 1, 10, '#fff0a0');
    rect(put, 5, 7, 1, 10, '#f0b020');
    rect(put, 9, 7, 1, 10, '#f0b020');
    rect(put, 11, 7, 1, 10, '#d89a10');
    eye(put, 3, 10);
    eye(put, 6, 10);
    put(4, 13, INK);
    put(5, 14, INK);
    put(6, 14, INK);
    put(7, 13, INK);
    rect(put, 2, 17, 10, 2, '#b8bcc8');
    rect(put, 2, 18, 10, 1, '#8890a0');
    rect(put, 2, 19, 10, 2, '#ff9ab8');
    rect(put, 11, 19, 1, 2, '#e07098');
    // marching: arms and legs swap
    line(put, 1, 11, 0, 13 + f, INK);
    line(put, 12, 11, 13, 14 - f, INK);
    rect(put, 4 - f, 21, 1, 4, INK);
    rect(put, 9 + f, 21, 1, 4, INK);
    rect(put, 3 - f, 25, 2, 1, INK);
    rect(put, 8 + f, 25, 2, 1, INK);
  })
});

registerEnemy('blob', {
  motion: 'hop',
  frameMs: 180,
  frames: anim(3, 18, 16, (put, f) => {
    const [cx, cy, rx, ry] = [
      [9, 10, 7, 5.5],
      [9, 12, 8.5, 3.5],
      [9, 8, 5.5, 7.5]
    ][f];
    disc(put, cx, cy, rx, ry, '#5ad890', '#2fa868', '#d0ffe8');
    put(cx - rx + 2, cy - 1, '#d0ffe8');
    eye(put, cx - 4, cy - 1);
    eye(put, cx - 1, cy - 1);
    put(cx - 3, cy + 2, '#1a7a48');
    put(cx - 2, cy + 2, '#1a7a48');
    put(cx + 3, cy + 1, '#9af0c0');
  })
});

registerEnemy('drum', {
  motion: 'hop',
  frameMs: 200,
  frames: anim(2, 18, 21, (put, f) => {
    // sticks: raised, then striking the head
    if (f) {
      line(put, 3, 3, 8, 6, '#c89a6a');
      line(put, 15, 3, 10, 6, '#c89a6a');
      put(3, 3, '#fff');
      put(15, 3, '#fff');
    } else {
      line(put, 5, 0, 8, 5, '#c89a6a');
      line(put, 13, 0, 10, 5, '#c89a6a');
      put(5, 0, '#fff');
      put(13, 0, '#fff');
    }
    rect(put, 5, 16, 2, 3, '#3a2a4a');
    rect(put, 11, 16, 2, 3, '#3a2a4a');
    rect(put, 4 - f, 19, 3, 1, '#3a2a4a');
    rect(put, 11 + f, 19, 3, 1, '#3a2a4a');
    rect(put, 2, 7, 15, 9, '#e04050');
    rect(put, 16, 8, 1, 7, '#a02838');
    rect(put, 2, 8, 15, 1, '#ffd23a');
    rect(put, 2, 15, 15, 1, '#ffd23a');
    for (let x = 9; x <= 16; x++) put(x, 9 + Math.abs((x % 4) - 2) * 2, '#fff');
    disc(put, 9, 7, 7, 2, '#f4ecd8', '#d8ccb0');
    eye(put, 3, 10);
    eye(put, 6, 10);
    put(4, 13, INK);
    put(5, 13, INK);
    if (f) put(6, 12, '#ffe060');
  })
});

registerEnemy('note', {
  motion: 'hover',
  height: 70,
  frameMs: 180,
  frames: anim(3, 16, 22, (put, f) => {
    const c = '#6a48d0';
    const flags: [number, number][][] = [
      [[11, 2], [15, 5], [15, 9], [11, 6]],
      [[11, 2], [15, 7], [14, 11], [11, 6]],
      [[11, 2], [15, 4], [15, 8], [11, 6]]
    ];
    poly(put, flags[f], c);
    rect(put, 9, 2, 2, 15, c);
    rect(put, 10, 2, 1, 15, '#4a30a0');
    disc(put, 5, 17, 5, 3.8, c, '#4a30a0', '#a890ff');
    eye(put, 2, 15);
    eye(put, 5, 15);
    put(1, 18, '#ff90c0');
    put(2, 19, '#2a1a5a');
    put(3, 20, '#2a1a5a');
    put(4, 20, '#2a1a5a');
    put(5, 19, '#2a1a5a');
  })
});

registerEnemy('ball', {
  motion: 'hop',
  frameMs: 260,
  frames: anim(2, 18, 18, (put, f) => {
    const cx = 9;
    const cy = f ? 11 : 9;
    const rx = f ? 9 : 8;
    const ry = f ? 6 : 8;
    disc(put, cx, cy, rx, ry, '#ff5a4a', '#c83a30', '#ffb0a0');
    disc(put, cx, cy + 0.5, rx - 0.3, 1.1, '#fff4d0');
    eye(put, cx - 5, cy - 4 + f);
    eye(put, cx - 1, cy - 4 + f);
    put(cx - 4, cy + 3, INK);
    put(cx - 3, cy + 4 - f, INK);
    put(cx - 2, cy + 3, INK);
  })
});

registerEnemy('flytrap', {
  motion: 'still',
  spiky: true,
  frameMs: 260,
  frames: anim(3, 22, 28, (put, f) => {
    // pot
    poly(put, [[6, 22], [16, 22], [15, 27], [7, 27]], '#d0703a');
    rect(put, 14, 22, 2, 5, '#a0502a');
    rect(put, 5, 21, 12, 2, '#e88a4a');
    // stem and leaves
    line(put, 15, 12, 11, 20, '#3a9a3a', 2);
    disc(put, 8, 17, 2.8, 1.2, '#5ac85a', '#3a9a3a');
    disc(put, 16, 18, 2.8, 1.2, '#5ac85a', '#3a9a3a');
    // jaws snap: wide, half, shut
    const a = [0.6, 0.32, 0.04][f];
    const at = maw(put, 16, 11, 12, 4.5, a, '#5ac85a', '#3fa83f', '#ff7aa0', '#ffffff', '#8a2048');
    const [ex, ey] = at(0.4, 0.55);
    eye(put, ex - 1, ey - 1);
    const [sx, sy] = at(0.7, 0.6);
    put(sx, sy, '#9af08a');
  })
});

// ------------------------------------------------------- logic tower in space

registerEnemy('alien', {
  motion: 'walk',
  patrol: 22,
  frameMs: 220,
  frames: anim(2, 16, 22, (put, f) => {
    const g = '#8ae05a';
    const gd = '#5ab03a';
    rect(put, 5, 17, 2, 4 - f, gd);
    rect(put, 9, 17, 2, 3 + f, gd);
    rect(put, 4, 21 - f, 3, 1, gd);
    rect(put, 9, 20 + f, 3, 1, gd);
    rect(put, 5, 12, 6, 5, '#c0c8e0');
    rect(put, 10, 12, 1, 5, '#8890a8');
    rect(put, 5, 15, 6, 1, '#ffd23a');
    line(put, 4, 13, 2, 15 - f, g);
    line(put, 11, 13, 13, 14 + f, g);
    // antennae with blinking tips
    line(put, 5, 3, 4, 0, gd);
    line(put, 11, 3, 12, 0, gd);
    put(4, 0, f ? '#ff6ad8' : '#ffd0f0');
    put(12, 0, f ? '#ffd0f0' : '#ff6ad8');
    disc(put, 8, 7, 6.5, 5, g, gd, '#d0ffb0');
    rect(put, 3, 6, 3, 3, INK);
    rect(put, 8, 6, 3, 3, INK);
    put(3, 6, '#fff');
    put(8, 6, '#fff');
    put(5, 11, '#3a7a2a');
    put(6, 11, '#3a7a2a');
  })
});

// 5-point star, rotated a touch per frame so it twinkles in place
function starPts(cx: number, cy: number, R: number, r: number, rot: number): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + rot + (i * Math.PI) / 5;
    const rr = i % 2 ? r : R;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return pts;
}

registerEnemy('star', {
  motion: 'hover',
  height: 95,
  spiky: true,
  frameMs: 160,
  frames: anim(3, 20, 20, (put, f) => {
    const rot = [-0.07, 0, 0.07][f];
    poly(put, starPts(10, 10.5, 9.8, 4.3, rot), '#e89a10');
    poly(put, starPts(9.4, 9.9, 8.8, 3.8, rot), '#ffd23a');
    put(8, 6, '#fff6c0');
    put(7, 7, '#fff6c0');
    rect(put, 7, 8, 1, 3, INK);
    rect(put, 10, 8, 1, 3, INK);
    put(5, 11, '#ff9a5a');
    put(12, 11, '#ff9a5a');
    if (f === 1) put(18, 1, '#fff6c0');
  })
});

registerEnemy('sheep', {
  motion: 'hop',
  frameMs: 300,
  frames: anim(2, 22, 18, (put, f) => {
    const w = '#fbf8f0';
    const wd = '#d8d2c4';
    rect(put, 9, 14, 2, 3 - f, '#3a3040');
    rect(put, 15, 14, 2, 3 - f, '#3a3040');
    disc(put, 13, 10, 7, 5, w, wd);
    disc(put, 17, 7, 3, 3, w, wd);
    disc(put, 12, 6, 3.5, 3, w, wd, '#ffffff');
    disc(put, 19, 11, 2.5, 3, w, wd);
    disc(put, 9, 11, 3, 3, w, wd);
    // dark face, sleepy closed eyes
    disc(put, 5, 10, 3.5, 3.8, '#3a3040', '#2a2236');
    put(9, 9, '#3a3040');
    put(10, 10, '#3a3040');
    put(3, 10, '#d8d0f0');
    put(4, 10, '#d8d0f0');
    if (f) put(6, 9, '#ffe060');
    else {
      put(6, 10, '#d8d0f0');
      put(7, 10, '#d8d0f0');
    }
    put(3, 12, '#ff9ab8');
    // nightcap flopping, star dots, pom-pom
    poly(put, [[1, 7], [9, 7], [7, 3], [4, 2]], '#4a60d8');
    line(put, 7, 3, 11, 1 + f, '#4a60d8');
    disc(put, 12, 1.5 + f, 1.2, 1.2, '#ffe060');
    put(5, 4, '#ffe060');
    put(7, 5, '#ffe060');
    rect(put, 1, 7, 9, 1, '#f0f0ff');
  })
});

registerEnemy('spark', {
  motion: 'hover',
  height: 75,
  spiky: true,
  frameMs: 90,
  frames: anim(3, 18, 18, (put, f) => {
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + f * 0.35;
      const ux = Math.cos(a);
      const uy = Math.sin(a);
      const kx = 9 + ux * 6 - uy * 1.2;
      const ky = 9 + uy * 6 + ux * 1.2;
      const col = i % 2 ? '#7af0ff' : '#ffe24a';
      line(put, 9 + ux * 4, 9 + uy * 4, kx, ky, col);
      line(put, kx, ky, 9 + ux * 8.5, 9 + uy * 8.5, col);
    }
    disc(put, 9, 9, 4.5, 4.5, '#fff6a0', '#ffd23a', '#ffffff');
    put(6, 8, INK);
    put(6, 9, INK);
    put(9, 8, INK);
    put(9, 9, INK);
    put(7, 11, INK);
    put(8, 11, INK);
  })
});

registerEnemy('bit', {
  motion: 'hop',
  frameMs: 140,
  frames: anim(3, 16, 16, (put, f) => {
    poly(put, [[1, 4], [4, 1], [15, 1], [12, 4]], '#9af4ff');
    poly(put, [[12, 4], [15, 1], [15, 12], [12, 15]], '#1a90b8');
    rect(put, 1, 4, 11, 11, '#3ad8f0');
    // pixel grid on its face
    for (let y = 4; y < 15; y++) for (let x = 1; x < 12; x++) if (x % 3 === 0 && y % 3 === 0) put(x, y, '#2ab8d8');
    rect(put, 3, 7, 2, 2, INK);
    rect(put, 7, 7, 2, 2, INK);
    put(4, 7, '#fff');
    put(8, 7, '#fff');
    rect(put, 4, 11, 4, 1, INK);
    put(3, 10, INK);
    put(8, 10, INK);
    // glitch: a row slips, stray pixels flicker
    if (f === 1) {
      rect(put, 1, 12, 2, 1, null);
      rect(put, 3, 12, 11, 1, '#ff4ad8');
      put(14, 0, '#ff4ad8');
    } else if (f === 2) {
      rect(put, 0, 6, 3, 1, '#ffe24a');
      rect(put, 9, 13, 3, 1, null);
      put(0, 2, '#3ad8f0');
    }
  })
});

registerEnemy('drone', {
  motion: 'hover',
  height: 105,
  patrol: 30,
  frameMs: 70,
  frames: anim(2, 24, 16, (put, f) => {
    line(put, 3, 5, 9, 7, '#5a6070');
    line(put, 21, 5, 15, 7, '#5a6070');
    put(3, 4, INK);
    put(21, 4, INK);
    // spinning blades: wide, then edge-on
    if (f) {
      rect(put, 2, 3, 3, 1, '#c8d0e0');
      rect(put, 20, 3, 3, 1, '#c8d0e0');
    } else {
      rect(put, 0, 3, 7, 1, '#c8d0e0');
      rect(put, 18, 3, 6, 1, '#c8d0e0');
    }
    disc(put, 12, 10, 6, 4, '#e8ecf4', '#a8b0c4', '#ffffff');
    disc(put, 8, 10, 2, 2, INK);
    put(7, 9, '#5af0ff');
    put(8, 10, '#2a8ab0');
    put(15, 8, f ? '#ff4a4a' : '#7a2020');
    rect(put, 9, 15, 7, 1, '#5a6070');
  })
});

registerEnemy('ufo', {
  motion: 'hover',
  height: 100,
  patrol: 30,
  frameMs: 200,
  frames: anim(2, 24, 22, (put, f) => {
    // tractor beam in pale stripes
    for (let y = 14; y < 22; y++) {
      const half = 3 + (y - 14) * 0.8;
      rect(put, Math.round(12 - half), y, Math.round(half * 2), 1, (y + f) % 2 ? '#fff6b0' : '#ffe680');
    }
    disc(put, 12, 5, 5, 4.5, '#9af0ff', '#5ac8e8', '#ffffff');
    disc(put, 11, 6, 2.5, 2, '#8ae05a');
    put(10, 6, INK);
    put(12, 6, INK);
    put(14, 3, '#fff');
    disc(put, 12, 10, 11.5, 3, '#c0c8d8', '#808aa0', '#ffffff');
    for (let i = 0; i < 5; i++) put(3 + i * 4.5, 11, (i + f) % 2 ? '#ffe24a' : '#ff5ad0');
    rect(put, 8, 13, 8, 1, '#606880');
  })
});

registerEnemy('gummy', {
  motion: 'hop',
  frameMs: 260,
  frames: anim(2, 16, 20, (put, f) => {
    const c = '#ff5a6a';
    const d = '#d03048';
    const l = '#ffb0b8';
    disc(put, 5 - f, 18, 2, 1.5, c, d);
    disc(put, 11 + f, 18, 2, 1.5, c, d);
    // arms out, then up in a cheer
    disc(put, 2, 11 - f * 3, 2, 1.5, c, d);
    disc(put, 14, 11 - f * 3, 2, 1.5, c, d);
    disc(put, 8, 13, 5.5, 5.5, c, d, l);
    disc(put, 8, 14, 2.5, 2.5, '#ff8a96');
    disc(put, 4, 2, 2, 2, c, d);
    disc(put, 12, 2, 2, 2, c, d);
    disc(put, 8, 5.5, 5.5, 4.5, c, d, l);
    eye(put, 4, 4);
    eye(put, 7, 4);
    put(5, 8, '#a02038');
    put(6, 8, '#a02038');
  })
});

registerEnemy('mirror', {
  motion: 'still',
  frameMs: 320,
  frames: anim(3, 16, 26, (put, f) => {
    rect(put, 7, 16, 3, 8, '#c08a2a');
    rect(put, 7, 16, 1, 8, '#e8b840');
    disc(put, 8, 24, 2, 1.5, '#e8b840', '#b08020');
    disc(put, 8, 8, 7.5, 8, '#e8b840', '#b08020', '#fff0a0');
    disc(put, 8, 8, 5.5, 6, '#c8e8ff', '#9ac8f0');
    // a glint sweeps across the glass
    const o = [-4, 0, 4][f];
    for (let i = 0; i < 9; i++) {
      for (const k of [0, 1]) {
        const x = 3 + o + i * 0.6 + k;
        const y = 13 - i * 1.1;
        if (((x + 0.5 - 8) / 5.5) ** 2 + ((y + 0.5 - 8) / 6) ** 2 < 0.85) put(x, y, '#ffffff');
      }
    }
    eye(put, 4, 7, f === 2);
    eye(put, 8, 7, f === 2);
    put(5, 11, INK);
    put(6, 12, INK);
    put(7, 12, INK);
    put(8, 11, INK);
    put(3, 10, '#ffb0c8');
    put(10, 10, '#ffb0c8');
    put(8, 0, '#ff5ad0');
    put(0, 8, '#ff5ad0');
    put(15, 8, '#ff5ad0');
  })
});

registerEnemy('pawn', {
  motion: 'walk',
  patrol: 16,
  frameMs: 260,
  frames: anim(2, 16, 22, (put, f) => {
    const c = '#f4ead4';
    const d = '#c8b894';
    const hx = f ? 1 : 0; // waddle: the head leans side to side
    rect(put, 3 - f, 21, 3, 1, '#8a6a4a');
    rect(put, 10 + f, 21, 3, 1, '#8a6a4a');
    disc(put, 8, 18.5, 6.5, 2, c, d);
    poly(put, [[5, 11], [11, 11], [13, 17], [3, 17]], c);
    line(put, 11, 11, 13, 17, d);
    disc(put, 8 + hx * 0.5, 10.5, 4.5, 1.2, c, d);
    disc(put, 8 + hx, 5, 4, 4, c, d, '#ffffff');
    eye(put, 5 + hx, 4);
    eye(put, 8 + hx, 4);
    put(6 + hx, 7, '#8a6a4a');
    put(7 + hx, 7, '#8a6a4a');
    put(4 + hx, 6, '#ffb0b0');
  })
});

registerEnemy('knightpiece', {
  motion: 'hop',
  frameMs: 280,
  frames: anim(2, 18, 22, (put, f) => {
    const c = '#4a3a6a';
    const d = '#2e2448';
    const l = '#8a7ab0';
    const s = f; // leans forward on the hop
    disc(put, 9, 19, 7.5, 2, c, d);
    rect(put, 3, 16, 13, 2, c);
    rect(put, 3, 16, 13, 1, l);
    poly(
      put,
      [[11 - s, 0], [13 - s, 3], [15, 6], [15, 15], [4, 15], [8, 10], [4 - s, 11], [2 - s, 10], [2 - s, 8], [6 - s, 3], [9 - s, 2]],
      c
    );
    line(put, 15, 6, 15, 15, d);
    // mane ridge
    for (let i = 0; i < 4; i++) put(13 - s + i * 0.6, 3 + i * 2, l);
    put(14, 4 + f, l);
    put(5 - s, 4, l);
    eye(put, 5 - s, 5);
    put(3 - s, 9, INK);
    put(10 - s, 1, '#ff90c0');
  })
});

registerEnemy('plant', {
  motion: 'still',
  spiky: true,
  frameMs: 300,
  frames: anim(2, 22, 30, (put, f) => {
    // pipe
    rect(put, 4, 23, 14, 7, '#2aa84a');
    rect(put, 5, 23, 2, 7, '#8af0a0');
    rect(put, 15, 23, 3, 7, '#1a7a3a');
    rect(put, 2, 20, 18, 3, '#3ac85a');
    rect(put, 3, 20, 2, 3, '#a0ffb0');
    rect(put, 17, 20, 3, 3, '#1a7a3a');
    line(put, 11, 14, 11, 19, '#3a9a3a', 2);
    disc(put, 7, 17, 3, 1.2, '#4ac84a', '#2a8a3a');
    disc(put, 16, 16, 3, 1.2, '#4ac84a', '#2a8a3a');
    // red spotted head with white lips, snapping open and shut
    const a = f ? 0.06 : 0.55;
    const at = maw(put, 15, 9, 11, 6, a, '#e83e3e', '#c02c2c', '#ffffff', '#ffffff', '#6a1a2a');
    for (const [t, k] of [[0.3, 0.55], [0.6, 0.7], [0.75, 0.3]]) {
      const [x, y] = at(t, k);
      put(x, y, '#ffffff');
      put(x + 1, y, '#ffffff');
    }
    if (f) put(3, 9, '#ff9a9a');
  })
});
