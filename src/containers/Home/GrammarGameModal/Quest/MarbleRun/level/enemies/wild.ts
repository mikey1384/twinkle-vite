import { makeSprite, disc, line, rect, poly, INK, type Put } from '../../pixel';
import { registerEnemy } from './registry';

// Wild critters for the meadow, sea, sky, cave, desert and snow worlds.
// Frames face left (toward the marble); makeSprite adds the dark outline.

// inside the same ellipse disc() fills (for stripes and patterned bodies)
function inE(x: number, y: number, cx: number, cy: number, rx: number, ry: number) {
  const dx = (x + 0.5 - cx) / rx;
  const dy = (y + 0.5 - cy) / ry;
  return dx * dx + dy * dy <= 1;
}

// a 2x2 eye looking left: white with the pupil on the left column
function eye(put: Put, x: number, y: number, pupil = INK) {
  rect(put, x, y, 2, 2, '#fff');
  put(x, y, pupil);
  put(x, y + 1, pupil);
}

// a closed (blinking) eye
function shut(put: Put, x: number, y: number, w = 2) {
  line(put, x, y + 1, x + w - 1, y + 1, INK);
}

// a little 4-point sparkle
function sparkle(put: Put, x: number, y: number, col = '#fff6a0') {
  put(x, y, '#fff');
  put(x - 1, y, col);
  put(x + 1, y, col);
  put(x, y - 1, col);
  put(x, y + 1, col);
}

const frames = (n: number, w: number, h: number, draw: (put: Put, f: number) => void) =>
  Array.from({ length: n }, (_, f) => makeSprite(w, h, (put) => draw(put, f)));

// ---- meadow -------------------------------------------------------------

registerEnemy('bee', {
  motion: 'hover',
  height: 80,
  frameMs: 90,
  frames: frames(2, 20, 16, (put, f) => {
    // wings behind the body, buzzing up / out
    if (f === 0) {
      disc(put, 10, 3.5, 3, 3.5, '#e4f6ff', '#b0d8f0');
      disc(put, 14, 4, 2.5, 3, '#e4f6ff', '#b0d8f0');
    } else {
      disc(put, 11, 6, 4.5, 2, '#e4f6ff', '#b0d8f0');
      disc(put, 15, 6.5, 3, 1.5, '#e4f6ff', '#b0d8f0');
    }
    disc(put, 12, 10, 6.5, 4.5, '#ffd23a', '#e0a020', '#fff3a0');
    for (let y = 4; y < 16; y++) {
      for (const x of [10, 11, 14, 15]) if (inE(x, y, 12, 10, 6.5, 4.5)) put(x, y, '#2a2236');
    }
    put(19, 10, INK);
    disc(put, 5, 10, 3.5, 3.5, '#2a2236');
    eye(put, 3, 9);
    put(5, 12, '#ff8fb0');
    line(put, 4, 6, 2, 3, INK);
    put(1, 2, '#ffd23a');
  })
});

registerEnemy('shroom', {
  motion: 'walk',
  frameMs: 200,
  frames: frames(2, 20, 20, (put, f) => {
    // stubby feet shuffle
    disc(put, 6 + f, 18, 3, 1.6, '#5a3a28');
    disc(put, 14 - f, 18, 3, 1.6, '#5a3a28');
    // cream stem with the face
    disc(put, 10, 13, 6, 4.5, '#f6e2c0', '#d8b890');
    // violet cap with spots, a bit droopy at the rim
    for (let y = 0; y <= 9; y++) {
      for (let x = 0; x < 20; x++) {
        if (!inE(x, y, 10, 8, 9.5, 7.5)) continue;
        let c = '#9a4ad8';
        if (y >= 7) c = '#6e2aa8';
        else if (inE(x, y, 6, 3, 2.5, 1.5)) c = '#c88af0';
        put(x, y, c);
      }
    }
    disc(put, 6, 4, 1.8, 1.5, '#fff4e0');
    disc(put, 13, 3, 1.5, 1.2, '#fff4e0');
    disc(put, 16, 7, 1.2, 1.2, '#fff4e0');
    disc(put, 3, 8, 1, 1, '#fff4e0');
    // grumpy eyes looking left, with brows
    rect(put, 5, 11, 2, 3, '#fff');
    rect(put, 9, 11, 2, 3, '#fff');
    rect(put, 5, 12, 1, 2, INK);
    rect(put, 9, 12, 1, 2, INK);
    line(put, 4, 10, 7, 11, INK);
    line(put, 11, 10, 8, 11, INK);
    line(put, 6, 15, 9, 15, '#8a5a3a');
  })
});

registerEnemy('worm', {
  motion: 'hop',
  frameMs: 260,
  frames: frames(2, 18, 20, (put, f) => {
    // the apple it lives in
    disc(put, 10, 13, 7.5, 6.5, '#e0403a', '#a02828', '#ff9a8a');
    put(9, 7, '#a02828');
    put(10, 7, '#a02828');
    line(put, 10, 6, 11, 3, '#6a3a1a');
    disc(put, 14, 4, 2.5, 1.3, '#5ac850', '#2e8a3a');
    disc(put, 5, 11, 1.6, 1.6, '#5a1a1a');
    // the worm pokes out of its hole, then peeks back
    const segs: [number, number][] =
      f === 0
        ? [[5, 11], [4, 9], [3, 7], [3, 5]]
        : [[5, 11], [4, 10], [4, 8]];
    segs.forEach(([x, y], i) => disc(put, x, y, 1.8, 1.8, i % 2 ? '#a8e070' : '#8ad050'));
    const [hx, hy] = segs[segs.length - 1];
    disc(put, hx, hy - 1, 2.5, 2.2, '#a8e070', '#7ab84a');
    put(hx - 1, hy - 2, INK);
    put(hx + 1, hy - 2, INK);
    put(hx - 1, hy, '#ff7a9a');
    // a tiny blue cap
    put(hx, hy - 4, '#3a7ad0');
    put(hx - 1, hy - 3, '#3a7ad0');
    put(hx + 1, hy - 3, '#3a7ad0');
  })
});

registerEnemy('frog', {
  motion: 'hop',
  frameMs: 260,
  frames: frames(2, 20, 16, (put, f) => {
    // back leg: crouched, then kicked out for the leap
    if (f === 0) {
      disc(put, 15, 12, 3.5, 3, '#4ab040', '#2e8a3a');
      rect(put, 12, 15, 5, 1, '#2e8a3a');
    } else {
      line(put, 15, 12, 18, 15, '#4ab040', 2);
      rect(put, 17, 15, 3, 1, '#2e8a3a');
    }
    disc(put, 10, 10, 8, 5, '#5ac850', '#2e8a3a', '#a8f090');
    disc(put, 8, 12, 5, 2.5, '#e8f8c0');
    // eye bumps on top
    disc(put, 5, 4.5, 2.6, 2.6, '#5ac850');
    disc(put, 11, 4.5, 2.6, 2.6, '#5ac850');
    rect(put, 4, 4, 2, 2, '#fff');
    rect(put, 10, 4, 2, 2, '#fff');
    put(4, 4, INK);
    put(4, 5, INK);
    put(10, 4, INK);
    put(10, 5, INK);
    // big grin and pink cheek
    line(put, 2, 9, 7, 10, '#1e5a26');
    put(8, 9, '#1e5a26');
    put(7, 8, '#ff9ab0');
    // front foot
    rect(put, 4, 15, 3, 1, '#2e8a3a');
  })
});

registerEnemy('bird', {
  motion: 'hover',
  height: 90,
  frameMs: 120,
  frames: frames(2, 20, 16, (put, f) => {
    poly(put, [[16, 8], [20, 5], [20, 11]], '#2a70b8');
    disc(put, 11, 9, 7, 5.5, '#4aa8f0', '#2a70b8', '#a0d8ff');
    disc(put, 9, 11.5, 4, 3, '#fff0d0');
    poly(put, [[1, 9], [5, 7], [5, 11]], '#ff9a2a');
    put(2, 9, '#d06a10');
    eye(put, 6, 6);
    put(6, 9, '#ff9ab0');
    // wing flaps up, then down
    if (f === 0) poly(put, [[10, 8], [14, 1], [17, 8]], '#3a8ad8');
    else poly(put, [[10, 9], [14, 15], [17, 9]], '#3a8ad8');
    put(9, 2, '#2a70b8');
    put(10, 3, '#2a70b8');
  })
});

registerEnemy('owl', {
  motion: 'hover',
  height: 95,
  frameMs: 170,
  frames: frames(4, 22, 20, (put, f) => {
    // wings beat; the last frame is a slow blink
    const up = f % 2 === 0;
    if (up) {
      poly(put, [[4, 10], [0, 4], [3, 14]], '#7a5030');
      poly(put, [[18, 10], [21, 4], [19, 14]], '#7a5030');
    } else {
      poly(put, [[4, 9], [0, 17], [5, 15]], '#7a5030');
      poly(put, [[18, 9], [21, 17], [17, 15]], '#7a5030');
    }
    disc(put, 11, 11, 7.5, 8, '#a0703e', '#6e4a28', '#c89a68');
    poly(put, [[4, 5], [5, 0], [8, 4]], '#6e4a28');
    poly(put, [[18, 5], [17, 0], [14, 4]], '#6e4a28');
    disc(put, 11, 9, 6.5, 4.5, '#f0d8a8');
    // speckled chest
    for (const [x, y] of [[9, 15], [12, 16], [14, 14], [8, 17], [11, 13]]) put(x, y, '#6e4a28');
    if (f === 3) {
      line(put, 5, 9, 9, 9, INK);
      line(put, 13, 9, 17, 9, INK);
    } else {
      disc(put, 7.5, 9, 2.8, 2.8, '#fff');
      disc(put, 14.5, 9, 2.8, 2.8, '#fff');
      rect(put, 6, 8, 2, 3, INK);
      rect(put, 13, 8, 2, 3, INK);
      put(6, 8, '#fff');
      put(13, 8, '#fff');
    }
    put(10, 11, '#ff9a2a');
    put(11, 11, '#ff9a2a');
    put(10, 12, '#d06a10');
    rect(put, 8, 19, 2, 1, '#ff9a2a');
    rect(put, 12, 19, 2, 1, '#ff9a2a');
  })
});

registerEnemy('squirrel', {
  motion: 'hop',
  frameMs: 240,
  frames: frames(2, 22, 20, (put, f) => {
    // big fluffy tail curling over its back, swishing
    const ty = f ? 9 : 8;
    disc(put, 16, ty, 5.5, 7.5, '#e08a48', '#b05a28', '#ffc890');
    disc(put, 14, ty - 5, 3, 2.5, '#e08a48');
    put(17, ty - 2, '#ffc890');
    put(18, ty + 1, '#ffc890');
    disc(put, 9, 13, 5, 5, '#d07a3a', '#a05020', '#f0a870');
    disc(put, 8, 15, 3, 3, '#f8dcb0');
    disc(put, 6, 7, 4.2, 4, '#d07a3a', '#a05020', '#f0a870');
    poly(put, [[6, 4], [8, 0], [9, 4]], '#d07a3a');
    put(8, 2, '#ffb0a0');
    eye(put, 3, 6);
    put(2, 8, INK);
    put(4, 9, '#ff9ab0');
    // holding an acorn
    disc(put, 4, 14, 2, 2.2, '#b07a3a', '#7a4a20');
    rect(put, 2, 12, 5, 1, '#6a4020');
    put(4, 11, '#6a4020');
    put(5 + f, 13, '#d07a3a');
    // feet
    rect(put, 7 - f, 19, 3, 1, '#a05020');
    rect(put, 11 + f, 19, 3, 1, '#a05020');
  })
});

registerEnemy('chick', {
  motion: 'hop',
  frameMs: 220,
  frames: frames(2, 16, 17, (put, f) => {
    disc(put, 8, 8, 6.5, 6, '#ffe04a', '#e0b020', '#fff8b0');
    // tuft
    put(8, 1, '#ffe04a');
    put(9, 0, '#ffe04a');
    put(7, 1, '#ffe04a');
    eye(put, 4, 6);
    put(4, 9, '#ff9ab0');
    poly(put, [[0, 8], [3, 7], [3, 10]], '#ff9a2a');
    // little wing flaps
    if (f) disc(put, 11, 8, 2.5, 1.5, '#f0c830');
    else disc(put, 11, 10, 2, 2.5, '#f0c830');
    // still wearing its eggshell
    for (let x = 2; x <= 14; x++) {
      const top = 11 + ((x % 3 === 0 ? 0 : x % 3 === 1 ? 1 : 2));
      for (let y = top; y <= 15; y++) {
        if (y === 15 && (x === 2 || x === 14)) continue;
        put(x, y, x > 11 ? '#e4e0d4' : '#fffaf0');
      }
    }
    put(5, 13, '#d8d0c0');
    put(10, 14, '#d8d0c0');
    rect(put, 5, 16, 2, 1, '#ff9a2a');
    rect(put, 10, 16, 2, 1, '#ff9a2a');
  })
});

registerEnemy('pixie', {
  motion: 'hover',
  height: 100,
  frameMs: 130,
  frames: frames(3, 20, 22, (put, f) => {
    // gauzy wings flutter
    const wy = [3, 5, 4][f];
    disc(put, 13, wy + 2, 4, 3.5 - (f === 1 ? 1.5 : 0), '#d8f4ff', '#a8d8f8');
    disc(put, 15, wy + 6, 3, 2.5, '#e8f8ff', '#b8e0f8');
    // petal dress
    poly(put, [[7, 11], [12, 11], [15, 18], [4, 18]], '#5ad0b0');
    put(6, 17, '#3aa890');
    put(9, 18, '#3aa890');
    put(12, 17, '#3aa890');
    line(put, 8, 18, 8, 20, '#ffe0c8');
    line(put, 11, 18, 11, 20 - (f === 1 ? 1 : 0), '#ffe0c8');
    // head and pink hair
    disc(put, 9, 7, 3.6, 3.6, '#ffe0c8');
    disc(put, 10, 4.5, 4, 2.5, '#ff7ad0', '#d050a8');
    put(13, 7, '#ff7ad0');
    put(13, 8, '#d050a8');
    put(7, 7, INK);
    put(7, 8, INK);
    put(8, 9, '#ff9ab0');
    // wand forward, star tip
    line(put, 6, 12, 3, 8, '#c08a40');
    rect(put, 2, 6, 3, 1, '#ffe04a');
    rect(put, 3, 5, 1, 3, '#ffe04a');
    put(3, 6, '#fff');
    // sparkles twinkle in and out
    const spots: [number, number][][] = [
      [[1, 2], [17, 1], [16, 20]],
      [[4, 2], [18, 13], [2, 15]],
      [[1, 11], [16, 17], [6, 1]]
    ];
    for (const [x, y] of spots[f]) sparkle(put, x, y);
  })
});

registerEnemy('hedgehog', {
  motion: 'walk',
  spiky: true,
  frameMs: 180,
  frames: frames(2, 22, 16, (put, f) => {
    // a fan of spikes over the back
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (0.98 - i * 0.12);
      const bx = 12 + Math.cos(a) * 6;
      const by = 10 - Math.sin(a) * 4;
      const tx = 12 + Math.cos(a) * 10.5;
      const ty = 10 - Math.sin(a) * 9.5;
      poly(put, [[bx - 1.5, by + 1], [tx, ty], [bx + 1.5, by + 1]], i % 2 ? '#6a4a30' : '#8a6040');
    }
    disc(put, 13, 10, 8, 5, '#7a5a40', '#5a3e28');
    // creamy face and belly
    disc(put, 5, 11, 4.5, 3.6, '#f0d0a0', '#d0a878');
    poly(put, [[0, 11], [3, 9], [3, 13]], '#f0d0a0');
    put(0, 11, INK);
    eye(put, 4, 9);
    put(5, 12, '#ff9ab0');
    // feet
    rect(put, 6 + f, 15, 2, 1, '#5a3e28');
    rect(put, 15 - f, 15, 2, 1, '#5a3e28');
  })
});

// ---- sea ----------------------------------------------------------------

registerEnemy('fish', {
  motion: 'swim',
  height: 95,
  frameMs: 160,
  frames: frames(3, 24, 21, (put, f) => {
    // puffer: breathes in and out, tail flicks
    const r = [7, 8, 7.5][f];
    const tw = [4, 2, 0][f];
    poly(put, [[17, 10], [23, 10 - tw - 2], [23, 10 + tw + 2]], '#ffb02a');
    put(22, 10, '#d08010');
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + 0.2;
      line(
        put,
        11 + Math.cos(a) * (r - 0.5),
        10 + Math.sin(a) * (r - 0.5),
        11 + Math.cos(a) * (r + 1.5),
        10 + Math.sin(a) * (r + 1.5),
        '#b07a20'
      );
    }
    disc(put, 11, 10, r, r - 0.5, '#ffd04a', '#d09a20', '#fff0a0');
    disc(put, 11, 13, r - 3, 2.5, '#fff6d8');
    for (const [x, y] of [[13, 6], [16, 9], [10, 5], [15, 12]]) put(x, y, '#c08020');
    disc(put, 7, 8, 2.5, 2.5, '#fff');
    rect(put, 5, 7, 2, 3, INK);
    put(6, 7, '#fff');
    // puckered lips
    put(11 - r + 1, 11, '#ff7a9a');
    put(11 - r + 1, 12, '#ff7a9a');
    put(11 - r, 11, '#d0507f');
    disc(put, 13, 11, 1.5, 2 - (f % 2), '#ffb02a');
  })
});

registerEnemy('jelly', {
  motion: 'swim',
  height: 100,
  frameMs: 170,
  frames: frames(3, 18, 24, (put, f) => {
    // bell pulses; tentacles wave
    const rx = [8, 7, 7.5][f];
    const ry = [6, 7, 6.5][f];
    for (let t = 0; t < 4; t++) {
      const x0 = 4 + t * 3.3;
      for (let y = 10; y < 23; y++) {
        const x = x0 + Math.round(Math.sin(y * 0.6 + f * 2.1 + t) * 1.2);
        put(x, y, t % 2 ? '#ffb8f0' : '#e080d8');
      }
    }
    for (let y = 0; y <= 10; y++) {
      for (let x = 0; x < 18; x++) {
        if (!inE(x, y, 9, 8, rx, ry) || y > 9) continue;
        const inner = inE(x, y, 9, 7, rx - 2.5, ry - 2.5);
        put(x, y, y >= 8 ? '#c058c0' : inner ? '#ffb8f4' : '#ff8ae0');
      }
    }
    // frilly rim
    for (let x = 9 - Math.floor(rx) + 1; x <= 9 + Math.floor(rx) - 1; x += 2) put(x, 10, '#ff8ae0');
    // the glow: a bright core that pulses
    const g = ['#ffffff', '#fff6ff', '#ffe0fa'][f];
    disc(put, 7, 5, 2, 1.5, g);
    put(12, 3, '#fff');
    put(11, 6, g);
    put(5, 7, INK);
    put(9, 7, INK);
    put(4, 8, '#ff5aa8');
    put(10, 8, '#ff5aa8');
  })
});

registerEnemy('crab', {
  motion: 'walk',
  patrol: 30,
  frameMs: 140,
  frames: frames(2, 24, 16, (put, f) => {
    // legs scuttle
    for (let i = 0; i < 3; i++) {
      const lx = 7 + i * 2;
      const rxx = 17 - i * 2;
      const up = (i + f) % 2;
      line(put, lx, 12, lx - 2, 15 - up, '#b03020');
      line(put, rxx, 12, rxx + 2, 15 - up, '#b03020');
    }
    disc(put, 12, 10, 8, 4.5, '#f05a3a', '#b03020', '#ff9a7a');
    // eye stalks
    line(put, 9, 6, 9, 3, '#b03020');
    line(put, 14, 6, 14, 3, '#b03020');
    disc(put, 9, 2.5, 1.8, 1.8, '#fff');
    disc(put, 14, 2.5, 1.8, 1.8, '#fff');
    put(8, 2, INK);
    put(13, 2, INK);
    line(put, 10, 12, 13, 12, '#7a1a10');
    // pincers snap open and shut
    for (const [cx, side] of [[3, -1], [21, 1]] as const) {
      line(put, cx - side * 2, 9, cx + side * 0, 8, '#f05a3a');
      disc(put, cx, 6, 2.6, 2.6, '#f05a3a', '#b03020', '#ff9a7a');
      if (f === 0) {
        put(cx + side * 1, 4, null);
        put(cx + side * 2, 4, null);
        put(cx + side * 2, 5, null);
      }
    }
  })
});

registerEnemy('gull', {
  motion: 'hover',
  height: 105,
  frameMs: 140,
  frames: frames(3, 26, 16, (put, f) => {
    poly(put, [[18, 8], [23, 6], [23, 11]], '#d0d8e0');
    disc(put, 13, 9, 7.5, 4, '#ffffff', '#d0d8e0');
    disc(put, 6, 7, 3.6, 3.4, '#ffffff', '#e0e6ee');
    poly(put, [[0, 7], [3, 6], [3, 8]], '#ffd02a');
    put(1, 8, '#ff5a3a');
    put(4, 6, INK);
    line(put, 4, 5, 6, 5, '#a8b0c0');
    rect(put, 13, 13, 2, 1, '#ff9a2a');
    // wings: up V, gliding flat, down
    const tip = [1, 7, 13][f];
    poly(put, [[10, 8], [15, tip], [19, tip + 1], [17, 8]], '#b8c4d4');
    put(15, tip, INK);
    put(16, tip, INK);
    put(18, tip + 1, INK);
  })
});

registerEnemy('starfish', {
  motion: 'walk',
  patrol: 12,
  frameMs: 340,
  frames: frames(2, 20, 20, (put, f) => {
    // rocks from tip to tip as it tiptoes along
    const rot = f ? 0.14 : -0.14;
    const pts: [number, number][] = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + rot + (i * Math.PI) / 5;
      const r = i % 2 ? 4 : 9.4;
      pts.push([10 + Math.cos(a) * r, 10.5 + Math.sin(a) * r]);
    }
    poly(put, pts, '#ff9a4a');
    disc(put, 10, 10.5, 4, 4, '#ff9a4a', '#e07a2a');
    for (const [x, y] of [[10, 4], [5, 9], [15, 9], [7, 15], [13, 15]]) put(x, y, '#ffd0a0');
    put(7, 9, INK);
    put(7, 10, INK);
    put(11, 9, INK);
    put(11, 10, INK);
    put(6, 11, '#ff6a7a');
    line(put, 8, 12, 10, 12, '#b04a20');
  })
});

registerEnemy('eel', {
  motion: 'swim',
  height: 85,
  frameMs: 150,
  frames: frames(3, 26, 14, (put, f) => {
    // a body wave travels down to the tail
    for (let x = 25; x >= 6; x--) {
      const y = 7 + Math.sin(x * 0.5 - f * 2.1) * 2;
      const r = 2.6 - ((x - 6) / 20) * 1.6;
      disc(put, x, y, 1, r, '#3a9a8a');
      put(x, Math.round(y + r - 0.5), '#bff0d8');
      if (x % 2 === 0 && x > 8) put(x, Math.round(y - r - 0.5), '#8af0d0');
    }
    disc(put, 5, 7, 4.5, 3.4, '#3aaa98', '#2a7a6e', '#7ad8c8');
    // gaping mouth and a yellow eye
    line(put, 1, 8, 4, 8, '#1a3a3a');
    put(0, 8, null);
    put(1, 9, '#ff9ab0');
    rect(put, 3, 5, 2, 2, '#ffe04a');
    put(3, 5, INK);
    put(3, 6, INK);
    put(7, 8, '#2a7a6e');
  })
});

registerEnemy('seal', {
  motion: 'walk',
  patrol: 20,
  frameMs: 240,
  frames: frames(2, 24, 14, (put, f) => {
    // scoots: body bunches up, then stretches
    const rx = f ? 8 : 9.5;
    const cx = f ? 13 : 13.5;
    poly(put, [[cx + rx - 2, 10], [23, 7 + f], [23, 13]], '#7a90aa');
    disc(put, cx, 9.5, rx, 4.2 + f * 0.5, '#9ab0c8', '#6a809a', '#d0e0f0');
    disc(put, cx - 1, 11, rx - 3, 2, '#c8d8e8');
    disc(put, 5, 7, 4.5, 4.2, '#9ab0c8', '#6a809a', '#d0e0f0');
    disc(put, 2.5, 8.5, 2.5, 1.8, '#c8d8e8');
    put(1, 7, INK);
    eye(put, 4, 5);
    put(2, 9, '#6a809a');
    put(3, 9, '#6a809a');
    put(6, 8, '#ff9ab0');
    // whiskers
    put(0, 9, '#e8f0f8');
    put(0, 10, '#e8f0f8');
    // front flipper paddles
    if (f) poly(put, [[8, 11], [6, 13], [10, 13]], '#7a90aa');
    else poly(put, [[8, 11], [10, 13], [12, 12]], '#7a90aa');
  })
});

// ---- cave ---------------------------------------------------------------

registerEnemy('bat', {
  motion: 'hover',
  height: 90,
  frameMs: 110,
  frames: frames(2, 24, 15, (put, f) => {
    const wing = '#4a2a6a';
    if (f === 0) {
      poly(put, [[9, 7], [0, 1], [2, 5], [4, 4], [6, 8]], wing);
      poly(put, [[15, 7], [23, 1], [22, 5], [20, 4], [18, 8]], wing);
    } else {
      poly(put, [[9, 6], [0, 12], [3, 10], [5, 12], [8, 9]], wing);
      poly(put, [[15, 6], [23, 12], [21, 10], [19, 12], [16, 9]], wing);
    }
    disc(put, 12, 8, 4.2, 4.5, '#6a4a8a', '#4a2a6a', '#9a7aba');
    poly(put, [[8, 5], [9, 0], [11, 4]], '#6a4a8a');
    poly(put, [[13, 4], [15, 0], [16, 5]], '#6a4a8a');
    put(9, 2, '#ff9ab0');
    put(15, 2, '#ff9ab0');
    rect(put, 9, 6, 2, 2, '#ffe04a');
    rect(put, 13, 6, 2, 2, '#ffe04a');
    put(9, 6, INK);
    put(9, 7, INK);
    put(13, 6, INK);
    put(13, 7, INK);
    put(10, 10, '#fff');
    put(12, 10, '#fff');
    put(11, 10, '#3a1a4a');
  })
});

registerEnemy('mole', {
  motion: 'walk',
  patrol: 18,
  frameMs: 200,
  frames: frames(2, 20, 18, (put, f) => {
    disc(put, 11, 11, 8, 6.5, '#8a6248', '#5e3e2a', '#b08a6a');
    disc(put, 9, 13, 4.5, 3, '#c8a080');
    // goggles pushed up on the face, with a strap
    line(put, 4, 7, 18, 7, '#5a4a3a');
    for (const gx of [5, 10]) {
      disc(put, gx, 7.5, 2.4, 2.4, '#c0c0c8');
      disc(put, gx, 7.5, 1.5, 1.5, '#9ad8ff');
      put(gx - 1, 7, '#fff');
    }
    // pink snout and whiskers
    disc(put, 2, 11, 2, 1.6, '#ff9ab0', '#e06a8a');
    put(0, 10, '#e0c8b0');
    put(0, 12, '#e0c8b0');
    put(5, 12, INK);
    put(6, 12, INK);
    // digging paws paddle
    disc(put, 5 - f, 15 + f, 2, 1.5, '#ffc8b0');
    disc(put, 14 + f, 16 - f, 2, 1.5, '#e0a890');
    put(3 - f, 16 + f, '#fff');
  })
});

registerEnemy('spider', {
  motion: 'hover',
  bodyTop: 13,
  height: 75,
  frameMs: 200,
  frames: frames(2, 20, 26, (put, f) => {
    // its silk thread, running up off the top
    line(put, 10, 0, 10, 13, '#e8e8f4');
    // legs paddle the air
    for (let i = 0; i < 4; i++) {
      const y = 15 + i * 2;
      const k = (i + f) % 2;
      line(put, 7, y, 2, y - 2 + k * 2, '#3a2a4a');
      put(1, y - 1 + k * 2, '#3a2a4a');
      line(put, 13, y, 18, y - 2 + k * 2, '#3a2a4a');
      put(19, y - 1 + k * 2, '#3a2a4a');
    }
    disc(put, 10, 18, 5.5, 5, '#5a4a7a', '#3a2a5a', '#8a7aaa');
    // a little pattern on the back
    put(12, 15, '#ff7ad0');
    put(13, 16, '#ff7ad0');
    // big googly eyes, looking left
    disc(put, 7.5, 18, 2, 2, '#fff');
    disc(put, 11.5, 18, 2, 2, '#fff');
    rect(put, 6, 18, 2, 2, INK);
    rect(put, 10, 18, 2, 2, INK);
    put(8, 21, '#fff');
    put(10, 21, '#fff');
  })
});

// ---- desert -------------------------------------------------------------

registerEnemy('lizard', {
  motion: 'walk',
  patrol: 28,
  frameMs: 150,
  frames: frames(3, 26, 13, (put, f) => {
    // tail curls up behind
    line(put, 18, 8, 22, 7, '#3a9a2a', 2);
    line(put, 22, 7, 25, 3, '#3a9a2a');
    put(24, 2, '#3a9a2a');
    // legs trot
    const a = f % 2;
    line(put, 8, 9, 7 - a, 12, '#3a9a2a');
    line(put, 16, 9, 17 + a, 12, '#3a9a2a');
    line(put, 10, 9, 11 + a, 12, '#4ab03a');
    line(put, 14, 9, 13 - a, 12, '#4ab03a');
    disc(put, 13, 7.5, 7, 3.2, '#6ad04a', '#3a9a2a', '#b0f090');
    for (const x of [10, 13, 16]) put(x, 6, '#ffb02a');
    disc(put, 5, 7, 4, 2.8, '#6ad04a', '#3a9a2a', '#b0f090');
    disc(put, 4, 5, 1.6, 1.6, '#fff');
    put(3, 5, INK);
    put(3, 6, INK);
    line(put, 2, 8, 5, 8, '#2a6a1a');
    // a tongue flick on the last frame
    if (f === 2) {
      line(put, 0, 8, 1, 8, '#ff5a7a');
      put(0, 9, '#ff5a7a');
    }
  })
});

registerEnemy('cactus', {
  motion: 'still',
  spiky: true,
  frameMs: 420,
  frames: frames(3, 20, 24, (put, f) => {
    // arms sway a touch; blinks on the last frame
    const lift = f === 1 ? 1 : 0;
    rect(put, 1, 13, 5, 3, '#4ab04a');
    disc(put, 2.5, 9 - lift, 1.8, 4.5, '#4ab04a', '#2e8a3a');
    rect(put, 14, 10, 5, 3, '#4ab04a');
    disc(put, 17.5, 6 + lift, 1.8, 4, '#4ab04a', '#2e8a3a');
    disc(put, 10, 6, 5, 5, '#5ac850', '#2e8a3a');
    rect(put, 5, 6, 10, 17, '#5ac850');
    rect(put, 13, 6, 2, 17, '#3aa03a');
    for (const x of [7, 10]) line(put, x, 3, x, 22, '#48b048');
    // little white spines poking out
    for (const [x, y] of [[4, 8], [4, 16], [15, 12], [15, 19], [0, 9], [19, 5], [8, 1], [12, 1], [4, 21]]) {
      put(x, y, '#fffbe0');
    }
    // pink flower on top
    disc(put, 10, 1, 2, 1.2, '#ff7ab0');
    put(10, 1, '#ffe04a');
    // face
    if (f === 2) {
      shut(put, 6, 9);
      shut(put, 10, 9);
    } else {
      eye(put, 6, 9);
      eye(put, 10, 9);
    }
    put(5, 12, '#ff9ab0');
    line(put, 7, 13, 10, 13, '#1e5a26');
    put(11, 12, '#1e5a26');
    rect(put, 4, 23, 12, 1, '#c08a50');
  })
});

registerEnemy('scorpion', {
  motion: 'walk',
  patrol: 22,
  frameMs: 170,
  frames: frames(2, 24, 18, (put, f) => {
    // legs
    for (let i = 0; i < 3; i++) {
      const x = 8 + i * 3;
      line(put, x, 14, x - 1 + ((i + f) % 2) * 2, 17, '#8a5a20');
    }
    // tail arcs over the back, stinger aimed forward and bobbing
    const s = f ? 1 : 0;
    const segs: [number, number][] = [[16, 13], [19, 11], [21, 8], [20, 5 - s], [17, 3 - s]];
    segs.forEach(([x, y], i) => disc(put, x, y, 2.3 - i * 0.15, 2, i % 2 ? '#d09a48' : '#c08a3a'));
    poly(put, [[15, 3 - s], [12, 2 - s], [15, 1 - s]], '#5a3a1a');
    disc(put, 10, 13, 6.5, 3.5, '#c08a3a', '#8a5a20', '#e8b870');
    for (const x of [9, 12, 15]) line(put, x, 11, x, 15, '#a8742a');
    // pincers
    line(put, 5, 12, 3, 10, '#c08a3a');
    disc(put, 2, 9, 2, 2, '#c08a3a', '#8a5a20');
    if (f === 0) {
      put(0, 9, null);
      put(1, 9, null);
    }
    eye(put, 5, 11);
  })
});

registerEnemy('mummy', {
  motion: 'walk',
  patrol: 16,
  frameMs: 260,
  frames: frames(2, 18, 24, (put, f) => {
    // the whole body sways a pixel side to side
    const w = f ? 1 : 0;
    // a loose bandage end flutters behind
    line(put, 13 + w, 9, 17, 11 + f * 2, '#e8dcb8');
    put(17, 12 + f * 2, '#d8c8a0');
    // legs shuffle
    rect(put, 6 + w, 19, 3, 4 + f, '#e8dcb8');
    rect(put, 10 + w, 19, 3, 5 - f, '#e8dcb8');
    rect(put, 5 + w, 8, 9, 12, '#f0e6c8');
    disc(put, 9 + w, 5, 4.5, 4.5, '#f0e6c8', '#d8c8a0');
    // arms out, zombie style
    rect(put, 0 + w, 10, 6, 2, '#f0e6c8');
    rect(put, 1 + w, 13 - f, 5, 2, '#e8dcb8');
    // bandage wraps, slanted
    for (const y of [3, 9, 12, 15, 18]) line(put, 5 + w, y + 1, 13 + w, y, '#c8b88e');
    put(1 + w, 10, '#c8b88e');
    put(3 + w, 13 - f, '#c8b88e');
    // one glowing eye peeking out
    rect(put, 6 + w, 5, 2, 2, '#ffe04a');
    put(6 + w, 5, '#fff');
    put(10 + w, 6, '#5a4a3a');
  })
});

registerEnemy('fireblob', {
  motion: 'hop',
  spiky: true,
  frameMs: 110,
  frames: frames(3, 18, 21, (put, f) => {
    // flame tongues flicker
    const tips: [number, number][][] = [
      [[3, 6], [7, 0], [11, 4], [15, 2]],
      [[2, 4], [8, 2], [12, 0], [16, 5]],
      [[4, 3], [6, 1], [10, 3], [14, 0]]
    ];
    for (const [tx, ty] of tips[f]) poly(put, [[tx - 3, 13], [tx, ty], [tx + 3, 13]], '#ff5a1a');
    disc(put, 9, 14, 7.5, 6, '#ff7a1a', '#e04a10');
    for (const [tx, ty] of tips[f]) if (ty < 3) poly(put, [[tx - 1.5, 12], [tx, ty + 4], [tx + 1.5, 12]], '#ffb02a');
    disc(put, 9, 15, 5, 4, '#ffd04a');
    disc(put, 9, 16, 2.5, 2, '#fff6c0');
    // cheeky face
    rect(put, 5, 12, 2, 3, INK);
    rect(put, 10, 12, 2, 3, INK);
    put(5, 12, '#fff');
    put(10, 12, '#fff');
    line(put, 6, 17, 9, 17, '#a02810');
    put(5, 16, '#a02810');
    // embers
    put([1, 16, 3][f], [10, 8, 14][f], '#ffe04a');
  })
});

// ---- snow ---------------------------------------------------------------

registerEnemy('penguin', {
  motion: 'walk',
  patrol: 20,
  frameMs: 200,
  frames: frames(2, 16, 21, (put, f) => {
    // waddle: lean one way then the other, lifting a foot
    const lean = f ? 1 : -1;
    rect(put, 3, 19 - (f ? 1 : 0), 4, 2, '#ff9a2a');
    rect(put, 9, 19 - (f ? 0 : 1), 4, 2, '#ff9a2a');
    disc(put, 8, 12, 6.5, 7.5, '#2a2a4a', '#1a1a32', '#4a4a70');
    disc(put, 7, 14, 4.5, 5.5, '#ffffff', '#e0e6f0');
    disc(put, 8 + lean, 6, 5, 4.5, '#2a2a4a', '#1a1a32', '#4a4a70');
    disc(put, 6 + lean, 6.5, 2.5, 2.2, '#ffffff');
    eye(put, 5 + lean, 5);
    poly(put, [[1 + lean, 7], [4 + lean, 6], [4 + lean, 8]], '#ff9a2a');
    // red scarf with a fluttering end
    rect(put, 3, 10, 10, 2, '#e0403a');
    rect(put, 12, 11, 2, 3 + f, '#c02828');
    // flipper flaps
    poly(put, [[13, 12], [15, 16 - f * 2], [13, 17]], '#2a2a4a');
  })
});

registerEnemy('snowman', {
  motion: 'hop',
  frameMs: 260,
  frames: frames(2, 18, 24, (put, f) => {
    // twig arms wave
    line(put, 4, 13, 0, 10 - f * 2, '#7a4a20');
    put(0, 9 - f * 2, '#7a4a20');
    line(put, 13, 13, 17, 10 + f * 2, '#7a4a20');
    disc(put, 9, 18, 6.5, 5.5, '#ffffff', '#c8d8f0', '#ffffff');
    disc(put, 9, 10, 4.8, 4.5, '#ffffff', '#c8d8f0');
    // coal buttons
    put(7, 16, INK);
    put(7, 19, INK);
    // top hat with a band
    rect(put, 5, 1, 7, 4, '#2a2236');
    rect(put, 3, 5, 11, 1, '#2a2236');
    rect(put, 5, 4, 7, 1, '#e0403a');
    // coal eyes, carrot nose pointing left, smile
    put(6, 8, INK);
    put(9, 8, INK);
    poly(put, [[1, 10], [6, 9], [6, 11]], '#ff8a2a');
    put(5, 12, INK);
    put(7, 13, INK);
    put(9, 12, INK);
    // scarf
    rect(put, 5, 13, 9, 2, '#3a8ad8');
    rect(put, 12, 14, 2, 4 - f, '#2a6ab8');
  })
});

registerEnemy('fox', {
  motion: 'walk',
  patrol: 30,
  frameMs: 130,
  frames: frames(4, 26, 17, (put, f) => {
    // trotting legs, four-step cycle
    const legs = [
      [0, 2, 2, 0],
      [1, 1, 1, 1],
      [2, 0, 0, 2],
      [1, 1, 1, 1]
    ][f];
    [8, 11, 15, 18].forEach((x, i) => line(put, x, 11, x - 1 + legs[i], 16, i % 2 ? '#c8d0e8' : '#e8ecf8'));
    // big fluffy tail
    disc(put, 22, 7 + (f % 2), 3.6, 4.5, '#f4f6ff', '#c8d0e8');
    disc(put, 24, 4 + (f % 2), 1.6, 1.6, '#c8d0e8');
    disc(put, 14, 9.5, 7.5, 3.8, '#f4f6ff', '#c8d0e8', '#ffffff');
    // head, ears and snout
    poly(put, [[4, 4], [5, 0], [7, 3]], '#e8ecf8');
    poly(put, [[7, 4], [9, 0], [10, 4]], '#e8ecf8');
    put(5, 2, '#ffb0c0');
    put(9, 2, '#ffb0c0');
    disc(put, 7, 7, 4, 3.5, '#f4f6ff', '#c8d0e8');
    poly(put, [[0, 8], [5, 6], [5, 10]], '#f4f6ff');
    put(0, 8, INK);
    rect(put, 5, 6, 1, 2, INK);
    put(6, 6, '#7ab8f0');
    put(6, 9, '#ffb0c0');
  })
});

registerEnemy('yeti', {
  motion: 'walk',
  patrol: 18,
  frameMs: 220,
  frames: frames(4, 22, 22, (put, f) => {
    const step = f % 2;
    // big feet
    disc(put, 7 - step, 20.5, 3, 1.5, '#a8b8d8');
    disc(put, 15 + step, 20.5, 3, 1.5, '#a8b8d8');
    disc(put, 11, 12, 8.5, 8, '#f0f4ff', '#c0cce8', '#ffffff');
    // shaggy fur tufts round the edge
    for (const [x, y] of [[4, 4], [7, 2], [11, 3], [15, 2], [18, 5], [20, 10], [19, 16], [2, 8], [3, 15]]) {
      put(x, y, '#f0f4ff');
    }
    put(11, 2, '#f0f4ff');
    // arms swing
    disc(put, 3, 13 + step, 2, 3.5, '#e0e8f8', '#c0cce8');
    disc(put, 19, 14 - step, 2, 3.5, '#e0e8f8', '#c0cce8');
    // blue face, looking left
    disc(put, 8, 10, 4.5, 3.6, '#8ac0f0', '#6aa0d8');
    if (f === 3) {
      shut(put, 5, 8);
      shut(put, 9, 8);
    } else {
      eye(put, 5, 8);
      eye(put, 9, 8);
    }
    line(put, 6, 12, 10, 12, '#2a4a7a');
    put(6, 13, '#fff');
    put(10, 13, '#fff');
    // little horns
    put(5, 3, '#c8b890');
    put(14, 3, '#c8b890');
  })
});
