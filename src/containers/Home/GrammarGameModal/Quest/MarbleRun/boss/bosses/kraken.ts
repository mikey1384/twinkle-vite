import { makeSprite, disc, rect, line, poly, ring, eyesX, INK, U, W, r3, Put, Sprite } from '../../pixel';
import { registerBoss } from '../registry';
import type { Shot } from '../types';

// Castle of Harbor Town: the Ink Kraken, a huge violet octopus wallowing in
// the harbour, sipping from a tiny teacup with one tentacle. Tentacles burst
// up out of the floor (a ripple warns where first), it squirts an ink bomb
// that darkens the whole screen for a moment, and it stirs up a whirlpool
// that spins along the floor.

const P = '#8a4fc9';
const D = '#5a2d8f';
const L = '#c49bff';
const SPOT = '#3fd0c0';
const SUCK = '#ffb3d1';
const INKC = '#2a1a44';

let inkUntil = -1e9;

// a tapering tentacle along a curve from (x0,y0) to (x1,y1), bent toward (cx,cy)
function arm(put: Put, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, r0: number, col = P, dark = D) {
  const n = 22;
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    const x = (1 - s) * (1 - s) * x0 + 2 * (1 - s) * s * cx + s * s * x1;
    const y = (1 - s) * (1 - s) * y0 + 2 * (1 - s) * s * cy + s * s * y1;
    pts.push([x, y, Math.max(1, r0 * (1 - s * 0.72))]);
  }
  for (const [x, y, r] of pts) disc(put, x, y, r, r, col, dark);
  // suckers along the underside
  for (let i = 2; i < n - 1; i += 3) {
    const [x, y, r] = pts[i];
    put(x, y + r - 0.5, SUCK);
  }
  // the tip curls up
  const [ex, ey] = pts[n];
  put(ex, ey - 1, col);
  put(ex + (x1 < x0 ? 1 : -1), ey - 2, col);
}

function kraken(curl: 0 | 1, eyes: 'open' | 'angry' | 'x', mouth: 'smile' | 'puff' | 'x') {
  return makeSprite(74, 50, (put) => {
    const c = curl ? 2 : 0;
    // back tentacles (darker, behind the head)
    arm(put, 52, 32, 64, 36, 71, 24 - c, 4.5, D, '#3f1f6a');
    arm(put, 46, 35, 52, 46, 68, 46, 4, D, '#3f1f6a');
    // the teacup tentacle, pinky up
    arm(put, 56, 26, 66, 22, 64, 9 + c, 4);
    rect(put, 60, 3 + c, 8, 5, '#fff');
    rect(put, 60, 5 + c, 8, 1, '#ff7bac');
    rect(put, 61, 8 + c, 6, 1, '#d8d8e8');
    ring(put, 69, 5 + c, 1.6, '#fff', 10);
    rect(put, 61, 3 + c, 6, 1, '#b07a4a');
    put(63, 1 + c, '#e8f4ff');
    put(64, 0 + c, '#e8f4ff');
    put(66, 1 + c, '#e8f4ff');
    // the great head
    disc(put, 38, 17, 19, 16, P, D, L);
    for (const [x, y, r] of [[46, 7, 2.2], [53, 15, 1.8], [30, 6, 1.6], [41, 3, 1.4], [50, 25, 1.6], [24, 12, 1.2]]) disc(put, x, y, r, r, SPOT);
    put(45, 6, '#b8fff4');
    put(29, 5, '#b8fff4');
    // front tentacles sprawled over the ledge
    arm(put, 24, 30, 10, 30 - c, 1, 40 + c, 5);
    arm(put, 31, 33, 24, 44, 14, 47, 5);
    arm(put, 39, 34, 40, 42, 34, 48, 4.5);
    arm(put, 47, 33, 52, 42, 60, 47 - c, 4.5);
    // big yellow eyes with slit pupils, looking at the marble
    const iris = eyes === 'angry' ? '#ff7b3a' : '#ffd84a';
    if (eyes === 'x') {
      eyesX(put, 23, 17);
      eyesX(put, 38, 18);
    } else {
      disc(put, 26, 20, 5.5, 6, '#fff');
      disc(put, 40, 21, 4.5, 5, '#fff');
      disc(put, 25, 20, 4, 4.5, iris);
      disc(put, 39, 21, 3.4, 3.8, iris);
      rect(put, 22, 20, 5, 2, INK);
      rect(put, 37, 21, 4, 2, INK);
      put(24, 17, '#fff');
      put(38, 18, '#fff');
      if (eyes === 'angry') {
        line(put, 19, 12, 30, 15, INK, 2);
        line(put, 46, 14, 37, 16, INK, 2);
      } else {
        line(put, 21, 13, 29, 13, D);
        line(put, 37, 15, 44, 15, D);
      }
    }
    // mouth
    if (mouth === 'puff') {
      disc(put, 22, 28, 3, 2.4, L);
      disc(put, 44, 29, 3, 2.4, L);
      disc(put, 33, 30, 2.6, 2.4, INKC);
      put(33, 29, '#6a4a9a');
    } else if (mouth === 'x') {
      line(put, 29, 31, 37, 29, INK);
      rect(put, 34, 31, 3, 2, '#ff7bac');
    } else {
      rect(put, 29, 30, 8, 1, INK);
      put(28, 29, INK);
      put(37, 29, INK);
      put(32, 31, '#fff');
    }
  });
}

// a tentacle rising out of the floor: frames grow from a tip to full height
const TENT_H = [8, 16, 24, 32, 40, 46];
function rising(h: number, wig: number) {
  return makeSprite(18, h, (put) => {
    for (let y = 0; y < h; y++) {
      const fromTip = y;
      const r = Math.min(6, 2 + fromTip * 0.14);
      const x = 9 + Math.sin(fromTip / 6 + wig) * 2;
      for (let i = -r; i <= r; i++) put(x + i, y, i > r * 0.4 ? D : P);
      if (fromTip > 4 && fromTip % 4 === 0) put(x - r + 1, y, SUCK);
    }
    // the curled tip
    disc(put, 7, 2, 2.4, 2.4, P);
    disc(put, 6, 2, 1, 1, null);
    put(10, 1, L);
  });
}
const tentRise = TENT_H.map((h) => rising(h, 0));
const tentWiggle = [rising(46, 0.8), rising(46, -0.8)];

const inkBall = makeSprite(12, 12, (put) => {
  disc(put, 6, 6, 6, 6, INKC, '#140a24', '#6a4a9a');
  put(3, 3, '#b8a0e0');
});
const inkDrop = makeSprite(12, 9, (put) => {
  disc(put, 6, 5, 6, 4, INKC, '#140a24', '#6a4a9a');
  poly(put, [[4, 2], [6, -1], [8, 2]], INKC);
});
const swirl = [0, 1, 2].map((f) =>
  makeSprite(28, 10, (put) => {
    disc(put, 14, 5, 14, 5, '#2f7fc4', '#1f5a94');
    for (let k = 0; k < 3; k++) {
      const r = 3 + k * 4;
      for (let a = 0; a < 18; a++) {
        if ((a + f * 3 + k * 5) % 9 > 4) continue;
        const ang = (a / 18) * Math.PI * 2;
        put(14 + Math.cos(ang) * r, 5 + Math.sin(ang) * r * 0.36, k === 1 ? '#fff' : '#9fe4ff');
      }
    }
    rect(put, 12, 4, 4, 2, '#0f3c6a');
  })
);

registerBoss({
  id: 'kraken',
  scale: 3.5,
  intro: 'rise',
  frames: () => ({
    idle: [kraken(0, 'open', 'smile'), kraken(1, 'open', 'smile')],
    wind: [kraken(1, 'angry', 'smile')],
    puff: [kraken(1, 'angry', 'puff')],
    hurt: [kraken(0, 'x', 'x')]
  }),
  pose(t, state, f) {
    // timers from an earlier fight on another clock: forget them
    if (inkUntil > t + 1000) inkUntil = -1e9;
    if (state === 'hurt' || state === 'dazed' || state === 'dying') return { frame: f.hurt[0], tilt: 0.04 };
    if (t < inkUntil) return { frame: f.puff[0], sx: 1.08, sy: 0.94 };
    if (state === 'wind') return { frame: f.wind[0], dy: -2 * U, sy: 1.04 };
    if (state === 'laugh') return { frame: f.idle[1], sy: 1 + Math.abs(Math.sin(t / 100)) * 0.06 };
    // bobbing in the swell, tentacles slowly curling
    return { frame: f.idle[Math.floor(t / 520) % 2], dy: Math.round(Math.sin(t / 700) * 2) * U, sx: 1 + Math.sin(t / 350) * 0.015 };
  },
  drawExtra(g, t, api) {
    // the harbour water lapping around its base
    const half = api.bossW / 2 + 24;
    for (let x = api.bossX - half; x < Math.min(W, api.bossX + half); x += U * 2) {
      const y = api.ledgeY - 10 + Math.round(Math.sin(x / 22 + t / 320) * 1.5) * U;
      g.fillStyle = 'rgba(40,120,190,.78)';
      g.fillRect(r3(x), r3(y), U * 2, r3(api.ledgeY - y + U * 3));
      g.fillStyle = (Math.floor(x / (U * 2)) + Math.floor(t / 200)) % 5 === 0 ? '#ffffff' : '#9fe4ff';
      g.fillRect(r3(x), r3(y), U * 2, U);
    }
  },
  moves: [
    {
      id: 'tentacles',
      windup: 520,
      run(api) {
        // ripples first, then tentacles burst up there (not under the marble
        // unless this answers a wrong pick)
        const xs = [0, 1, 2].map((i) => 120 + i * 190 + Math.random() * 60).filter((x) => Math.abs(x - api.marbleX) > 90);
        if (api.aim) xs.unshift(api.marbleX);
        api.sound.note(43, { instrument: 'pad', level: 0.1, hold: 0.6 });
        for (let i = 0; i < xs.length; i++) {
          const x = xs[i];
          api.warn(x, 750 + i * 200, () => {
            const s: Shot = {
              frames: [tentRise[0]],
              x: x - 10 * U,
              y: api.floorY,
              dodge: 'none',
              update(sh, t) {
                const a = t - (sh.born || 0);
                let fr: Sprite;
                if (a < 220) fr = tentRise[Math.min(tentRise.length - 1, Math.floor((a / 220) * tentRise.length))];
                else if (a < 950) fr = tentWiggle[Math.floor(a / 130) % 2];
                else if (a < 1200) fr = tentRise[Math.max(0, tentRise.length - 1 - Math.floor(((a - 950) / 250) * tentRise.length))];
                else {
                  sh.done = true;
                  return;
                }
                sh.frames = [fr];
                sh.vy = 0;
                sh.y = api.floorY - fr.height * U + U * 2;
              }
            };
            api.spawn(s);
            api.fx.burst('splash', 14, x, api.floorY - 6, { color: '#9fe4ff', speed: 0.9 });
            api.shake(4, 160);
            api.sound.thump(0.5);
            api.sound.whoosh(0.08, 0.3, 0, 500, 1800);
            if (Math.abs(x - api.marbleX) < 60) api.strikeMarble();
          }, { kind: 'ring', width: 70, color: '#7ad7ff' });
        }
      }
    },
    {
      id: 'ink',
      windup: 600,
      run(api) {
        // puff up, squirt an ink bomb, everything goes dark for a moment and
        // inky drops splat along the floor
        inkUntil = api.t + 450;
        api.sound.whoosh(0.12, 0.5, 0, 300, 1200);
        const ball = api.spawn({ frames: [inkBall], x: api.bossX - api.bossW * 0.35, y: api.bossTop + api.bossH * 0.55, vx: -6.5, vy: -7, g: 0.25, dodge: 'none' });
        api.after(520, () => {
          ball.done = true;
          const bx = ball.x + 18;
          const by = ball.y + 18;
          api.tint(1500, 'rgba(18,8,40,.62)');
          api.fx.burst('puff', 22, bx, by, { color: INKC, speed: 1.4 });
          api.fx.burst('bubble', 8, bx, by, { color: '#6a4a9a' });
          api.sound.thump(0.6);
          api.sound.note(38, { instrument: 'pad', level: 0.12, hold: 1 });
          for (let i = 0; i < 2; i++) {
            api.after(i * 260, () => {
              api.spawn({ frames: [inkDrop], x: bx, y: by, vx: -3.8 - i, vy: -2, g: 0.3, bounce: 0.45 });
              api.sound.note(60 - i * 5, { instrument: 'marimba', level: 0.07 });
            });
          }
        });
      }
    },
    {
      id: 'whirlpool',
      windup: 560,
      weight: 0.8,
      run(api) {
        // a stirred-up whirlpool spins along the floor, tugging bubbles in
        api.sound.whoosh(0.12, 1.4, 0, 400, 900);
        api.shake(3, 600);
        const s: Shot = {
          frames: swirl,
          frameMs: 80,
          x: api.bossX - api.bossW * 0.55,
          y: 0,
          vx: -4.6,
          onFloor: true,
          glow: '#2f7fc4',
          update(sh, t, a) {
            if (sh.hit) return;
            if (Math.floor(t / 50) % 3 === 0) a.fx.add({ kind: 'bubble', x: sh.x + 42 + (Math.random() - 0.5) * 70, y: sh.y + 6, vx: (Math.random() - 0.5) * 1.5, vy: -1.6, color: '#bfe9ff' });
          }
        };
        api.spawn(s);
      }
    }
  ]
});
