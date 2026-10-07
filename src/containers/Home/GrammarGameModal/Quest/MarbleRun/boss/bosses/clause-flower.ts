import { makeSprite, disc, rect, line, poly, eyesX, INK, U } from '../../pixel';
import { registerBoss } from '../registry';
import type { Shot } from '../types';

// Fort 2 of World 4: Clauseflower, a giant venus flytrap with a sunny petal
// crown. It cracks a thorny vine that slithers low across the floor, spits
// seeds in a three-way spread, and snaps its jaws forward.

const G = '#4fb84a';
const GD = '#2a7a3a';
const GL = '#9be36a';
const STEM = '#3e9a44';
const PINK = '#e8456b';
const PINK_D = '#a82450';
const PINK_L = '#ff8fa8';
const TOOTH = '#fff7d6';
const PETAL = '#ffcf3a';
const PETAL_D = '#f08a24';
const SOIL = '#6b4a2e';
const SOIL_D = '#4a3020';

// jaw: how wide the trap is open (0 shut, 9 wide); eyes: open / x / squint
function flytrap(jaw: number, eyes: 'open' | 'x' | 'squint') {
  return makeSprite(56, 60, (put) => {
    // soil mound and broad base leaves
    disc(put, 36, 58, 16, 3, SOIL, SOIL_D);
    for (const x of [26, 31, 43, 47]) put(x, 57, '#8a6a46');
    poly(put, [[36, 54], [12, 44], [8, 47], [20, 57]], G);
    line(put, 34, 54, 13, 46, GD);
    poly(put, [[38, 54], [54, 40], [55, 45], [46, 57]], GD);
    line(put, 39, 53, 53, 42, G);
    poly(put, [[34, 55], [24, 50], [30, 58]], GL);

    // stem: a thick curve from the mound up to the head
    for (let i = 0; i <= 20; i++) {
      const k = i / 20;
      const x = 36 - Math.sin(k * Math.PI * 0.7) * 10 - k * 4;
      const y = 55 - k * 24;
      rect(put, Math.round(x) - 1, Math.round(y), 4, 2, STEM);
      put(Math.round(x) + 2, Math.round(y), GD);
    }
    poly(put, [[27, 44], [18, 38], [22, 46]], GL);

    // petal crown behind the head
    const pc = [26, 22 - jaw * 0.2];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      disc(put, pc[0] + Math.cos(a) * 15, pc[1] + Math.sin(a) * 14, 4.5, 4.5, i % 2 ? PETAL : PETAL_D, i % 2 ? PETAL_D : '#c86414');
    }
    disc(put, pc[0], pc[1], 13, 12, '#ffe58a', PETAL);

    // the trap: pink mouth inside, then the two lobes
    const cx = 21;
    const cy = 22;
    const ux = cy - 6 - jaw * 0.5;
    const lx = cy + 7 + jaw * 0.5;
    if (jaw > 0) {
      disc(put, cx - 1, cy + 1, 13, 3 + jaw * 0.7, PINK, PINK_D);
      disc(put, cx + 3, cy + 1, 6, 1 + jaw * 0.35, '#7a1438');
    }
    disc(put, cx, ux, 14, 8, G, GD, GL);
    disc(put, cx, lx, 13, 6, G, GD);
    // pink lip just inside each lobe
    for (let x = cx - 12; x <= cx + 11; x++) {
      const k = (x - cx) / 14;
      const by = Math.round(ux + 8 * Math.sqrt(Math.max(0, 1 - k * k)));
      put(x, by, PINK_L);
      const k2 = (x - cx) / 13;
      const ty = Math.round(lx - 6 * Math.sqrt(Math.max(0, 1 - k2 * k2)));
      put(x, ty, PINK);
    }
    // teeth: pale spikes along both lips
    for (let x = cx - 12; x <= cx + 9; x += 3) {
      const k = (x - cx) / 14;
      const by = Math.round(ux + 8 * Math.sqrt(Math.max(0, 1 - k * k)));
      put(x, by + 1, TOOTH);
      put(x, by + 2, TOOTH);
      const k2 = (x + 1 - cx) / 13;
      const ty = Math.round(lx - 6 * Math.sqrt(Math.max(0, 1 - k2 * k2)));
      put(x + 1, ty - 1, TOOTH);
      put(x + 1, ty - 2, TOOTH);
    }
    // a few freckles on the lobes
    for (const [x, y] of [[26, ux - 3], [30, ux], [24, lx + 2], [29, lx + 1]]) put(x, y, GD);

    // eyes up on the top lobe
    const ey = Math.round(ux - 5);
    if (eyes === 'x') {
      eyesX(put, 11, ey);
      eyesX(put, 19, ey - 1);
    } else if (eyes === 'squint') {
      line(put, 11, ey + 2, 15, ey + 1, INK, 1);
      line(put, 19, ey + 1, 23, ey, INK, 1);
      line(put, 10, ey - 1, 15, ey + 1, GD);
      line(put, 24, ey - 2, 19, ey, GD);
    } else {
      rect(put, 11, ey, 5, 5, '#fff');
      rect(put, 19, ey - 1, 5, 5, '#fff');
      rect(put, 11, ey + 2, 2, 3, INK);
      rect(put, 19, ey + 1, 2, 3, INK);
      put(11, ey + 2, '#fff');
      put(19, ey + 1, '#fff');
      line(put, 10, ey - 2, 16, ey, GD);
      line(put, 25, ey - 3, 19, ey - 1, GD);
    }
    // the drooling tongue when knocked silly
    if (eyes === 'x') {
      rect(put, 9, lx - 4, 3, 5, PINK_L);
      put(10, lx + 1, PINK_L);
    }
  });
}

const vine = [0, 1].map((f) =>
  makeSprite(12, 8, (put) => {
    disc(put, 6, 4 + (f ? -1 : 1) * 0.5, 6, 3, STEM, GD, GL);
    put(3, 1, TOOTH);
    put(8, 7, TOOTH);
    put(9, 1 + f, TOOTH);
  })
);
const vineTip = makeSprite(14, 10, (put) => {
  disc(put, 8, 5, 6, 4, STEM, GD, GL);
  poly(put, [[0, 5], [5, 2], [5, 8]], G);
  disc(put, 3, 5, 2.5, 2, PINK, PINK_D);
  put(1, 5, TOOTH);
  put(7, 0, TOOTH);
  put(10, 9, TOOTH);
});
const seed = makeSprite(7, 9, (put) => {
  disc(put, 3.5, 4.5, 3.5, 4.5, '#8a5a2a', '#5a3818', '#c8904a');
  line(put, 3, 1, 3, 7, '#f0d090');
});
const chomp = [0, 1].map((f) =>
  makeSprite(14, 14, (put) => {
    // a pink bite-shaped gust with teeth marks
    disc(put, 8, 7, 6, 7, PINK, PINK_D, PINK_L);
    disc(put, 11, 7, 5, 6, null);
    for (let y = 2; y <= 12; y += 3) put(4 - (f && y === 5 ? 1 : 0), y, TOOTH);
  })
);

// the jaw lunge (snap move)
let snapAt = -1e9;

registerBoss({
  id: 'clause-flower',
  scale: 3.5,
  intro: 'rise',
  frames: () => ({
    idle: [flytrap(4, 'open')],
    shut: [flytrap(0, 'open')],
    wide: [flytrap(9, 'open')],
    snap: [flytrap(0, 'squint')],
    hurt: [flytrap(6, 'x')]
  }),
  pose(t, state, f) {
    if (state === 'hurt' || state === 'dazed' || state === 'dying') return { frame: f.hurt[0], tilt: 0.05 };
    const sn = t - snapAt;
    if (sn >= 0 && sn < 420) {
      // a fast lunge forward, then an easy pull back
      const k = sn < 120 ? sn / 120 : 1 - (sn - 120) / 300;
      return { frame: f.snap[0], dx: -Math.round(k * 14) * U, tilt: -0.14 * k, sx: 1 + k * 0.08 };
    }
    if (state === 'wind') return { frame: f.wide[0], dy: -U * 2, tilt: 0.08, sy: 1.04 };
    if (state === 'laugh') return { frame: Math.floor(t / 120) % 2 ? f.wide[0] : f.idle[0] };
    // idle: a lazy sway with a hungry chomp every few seconds
    const cycle = t % 3200;
    const chomping = cycle > 2600 && Math.floor(cycle / 110) % 2 === 0;
    return { frame: chomping ? f.shut[0] : f.idle[0], tilt: Math.sin(t / 650) * 0.05, sy: 1 + Math.sin(t / 325) * 0.02 };
  },
  moves: [
    {
      id: 'vine-whip',
      windup: 520,
      run(api) {
        // the vine bursts out of the soil and slithers low across the floor
        const x0 = api.bossX - api.bossW * 0.3;
        api.fx.burst('dust', 10, x0, api.floorY - 4, { color: '#8a6a46' });
        api.fx.burst('leaf', 6, x0, api.floorY - 10, { color: G });
        api.sound.whoosh(0.14, 0.5, 0, 600, 2400);
        api.sound.thump(0.4);
        const n = 7;
        for (let i = 0; i < n; i++) {
          api.after(i * 55, () => {
            const s: Shot = {
              frames: i === 0 ? [vineTip] : vine,
              x: x0,
              y: 0,
              vx: -8.5,
              onFloor: true,
              frameMs: 100,
              update(sh, t) {
                if (sh.hit) return;
                // a gentle sideways wiggle down the chain
                sh.x += Math.sin(t / 70 + i * 0.9) * 0.8;
              }
            };
            api.spawn(s);
          });
        }
        api.after(n * 55, () => api.sound.note(84, { instrument: 'marimba', level: 0.06 }));
      }
    },
    {
      id: 'seed-spread',
      windup: 460,
      run(api) {
        // three seeds fan out: one straight at duck height, one landing short
        // of the marble, one arcing high over it to land behind
        const x0 = api.bossX - api.bossW * 0.42;
        const y0 = api.bossTop + api.bossH * 0.36;
        [79, 83, 86].forEach((m, i) => api.sound.note(m, { at: i * 0.05, instrument: 'marimba', level: 0.06 }));
        api.sound.whoosh(0.06, 0.25, 0, 1600, 900);
        const seedH = seed.height * U;
        api.spawn({ frames: [seed], x: x0, y: api.floorY - 74, vx: -9, dodge: 'duck', spin: 0.3 });
        const lob = (tx: number, N: number) => {
          const gr = 0.3;
          const yLand = api.floorY - seedH;
          const s: Shot = {
            frames: [seed],
            x: x0,
            y: y0,
            vx: (tx - x0) / N,
            vy: (yLand - y0 - 0.5 * gr * N * N) / N,
            g: gr,
            spin: 0.25,
            dodge: 'none',
            update(sh, _t, a) {
              if (sh.done || sh.y + seedH < a.floorY) return;
              // it lands and pops up a little sprout
              sh.done = true;
              a.fx.burst('leaf', 5, sh.x + 10, a.floorY - 6, { color: GL, speed: 0.6 });
              a.fx.burst('dust', 4, sh.x + 10, a.floorY - 4, { color: '#8a6a46' });
              a.sound.note(91, { instrument: 'glock', level: 0.04 });
            }
          };
          api.spawn(s);
        };
        lob(api.marbleX + 170 + Math.random() * 60, 40);
        lob(Math.max(14, api.marbleX - 120), 62);
      }
    },
    {
      id: 'snap',
      windup: 380,
      weight: 0.7,
      run(api) {
        // the jaws lunge and clamp; the bite sends a pink gust low across
        snapAt = api.t;
        api.after(110, () => {
          api.sound.thump(0.5);
          api.sound.note(50, { instrument: 'marimba', level: 0.12 });
          api.shake(5, 160);
          api.fx.burst('sparkle', 6, api.bossX - api.bossW * 0.5, api.bossTop + api.bossH * 0.4, { color: PINK_L });
          for (let i = 0; i < 2; i++) {
            api.after(i * 260, () => {
              api.spawn({ frames: chomp, x: api.bossX - api.bossW * 0.5, y: 0, vx: -7.5, onFloor: true, frameMs: 90 });
              api.sound.whoosh(0.07, 0.3, 0, 1800, 700);
            });
          }
        });
      }
    }
  ]
});
