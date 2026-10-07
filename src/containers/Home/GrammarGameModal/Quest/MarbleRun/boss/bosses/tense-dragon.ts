import { makeSprite, disc, rect, line, poly, eyesX, INK, U, W } from '../../pixel';
import { registerBoss } from '../registry';
import type { Shot } from '../types';

// Castle of Tense Canyon: a red dragon. Arcing fireballs and a fire-breath
// sweep along the floor; in phase 2 it rears up and calls a meteor rain
// (warning shadows first).

function dragon(wing: 'up' | 'down', mouth: 'shut' | 'open' | 'x') {
  return makeSprite(76, 60, (put) => {
    const R = '#d9423a';
    const D = '#8f2230';
    const L = '#ff8a6b';
    const B = '#ffd27a';
    const BD = '#e0a850';
    const Wm = '#6a2c8f';
    const WD = '#45195e';
    const tip: [number, number][] =
      wing === 'up' ? [[36, 26], [48, 2], [64, 8], [60, 28]] : [[36, 28], [52, 44], [70, 46], [58, 30]];
    poly(put, tip, Wm);
    line(put, 36, 27, tip[1][0], tip[1][1], WD);
    line(put, 36, 27, tip[2][0], tip[2][1], WD);
    disc(put, 60, 50, 7, 5, R, D);
    disc(put, 67, 46, 5, 4, R, D);
    disc(put, 72, 41, 3.5, 3, R, D);
    poly(put, [[73, 34], [76, 40], [70, 40]], '#ffcb32');
    disc(put, 42, 42, 19, 14, R, D, L);
    disc(put, 37, 46, 11, 8, B, BD);
    for (let k = 0; k < 4; k++) rect(put, 31 + k * 5, 40 + k, 4, 1, BD);
    rect(put, 30, 52, 7, 7, D);
    rect(put, 47, 52, 7, 7, D);
    for (const x of [30, 32, 47, 49]) put(x, 59, '#fff');
    for (let k = 0; k < 4; k++) poly(put, [[40 + k * 6, 29 + k], [43 + k * 6, 23 + k], [46 + k * 6, 30 + k]], '#ffcb32');
    disc(put, 28, 32, 7, 8, R, D);
    disc(put, 22, 25, 7, 7, R, D);
    disc(put, 17, 18, 12, 9, R, D, L);
    rect(put, 1, 17, 12, 7, R);
    rect(put, 1, 22, 12, 2, D);
    put(4, 18, INK);
    put(5, 18, INK);
    line(put, 18, 10, 25, 1, '#ffcb32', 2);
    line(put, 24, 11, 31, 4, '#e0a850', 2);
    if (mouth === 'open') {
      poly(put, [[0, 24], [13, 23], [13, 30], [2, 30]], '#5a0e1e');
      rect(put, 1, 25, 10, 2, '#ff8c00');
      put(3, 23, '#fff');
      put(7, 23, '#fff');
      put(5, 29, '#fff');
    } else {
      rect(put, 1, 24, 13, 1, INK);
      put(4, 25, '#fff');
      put(9, 25, '#fff');
    }
    if (mouth === 'x') eyesX(put, 14, 13);
    else {
      rect(put, 14, 14, 4, 4, '#ffeb3b');
      rect(put, 15, 14, 1, 4, INK);
      line(put, 12, 12, 19, 13, D);
    }
  });
}
const fireball = [0, 1].map((f) =>
  makeSprite(14, 10, (put) => {
    disc(put, 5, 5, 5, 5, '#ff8c00');
    disc(put, 5, 5, 3, 3, '#ffd84a');
    put(4, 4, '#fff');
    poly(put, f ? [[8, 2], [14, 4], [9, 6]] : [[8, 4], [14, 7], [9, 8]], '#ff5a1f');
  })
);
const flame = [0, 1, 2].map((f) =>
  makeSprite(16, 14, (put) => {
    poly(put, [[0, 14], [3 + f, 4], [6, 9], [8, 0 + f], [11, 7], [13, 3], [16, 14]], '#ff5a1f');
    poly(put, [[3, 14], [6, 7], [8, 10], [10, 5 + f], [13, 14]], '#ffb43a');
    rect(put, 6, 11, 4, 3, '#fff3b0');
  })
);
const meteor = [0, 1].map((f) =>
  makeSprite(16, 22, (put) => {
    poly(put, [[4, 0], [12, 0], [10 + f, 10], [6 - f, 10]], '#ff8c00');
    disc(put, 8, 15, 7, 7, '#7a3a2a', '#4f2218', '#b0603f');
    rect(put, 5, 12, 2, 2, '#ffd84a');
  })
);

registerBoss({
  id: 'tense-dragon',
  scale: 3.5,
  intro: 'drop',
  frames: () => ({
    up: [dragon('up', 'shut')],
    down: [dragon('down', 'shut')],
    open: [dragon('down', 'open')],
    hurt: [dragon('down', 'x')]
  }),
  pose(t, state, f) {
    if (state === 'hurt' || state === 'dazed' || state === 'dying') return { frame: f.hurt[0] };
    if (state === 'wind') return { frame: f.open[0], dy: -6, tilt: -0.05 };
    const flap = Math.floor(t / 320) % 2;
    return { frame: flap ? f.up[0] : f.down[0], dy: Math.round(Math.sin(t / 500) * 2) * U };
  },
  moves: [
    {
      id: 'fireballs',
      windup: 420,
      run(api) {
        for (let i = 0; i < (api.phase === 2 ? 3 : 2); i++) {
          api.after(i * 240, () => {
            api.spawn({ frames: fireball, x: api.bossX - api.bossW * 0.45, y: api.bossTop + api.bossH * 0.35, vx: -5.6 - i * 0.4, vy: -3.4 + i * 0.6, g: 0.14, bounce: 0.35, glow: '#ff8c00' });
            api.sound.whoosh(0.07, 0.3, 0, 1400, 500);
          });
        }
      }
    },
    {
      id: 'breath',
      windup: 650,
      run(api) {
        // a wall of flame rolls along the floor toward the marble
        api.shake(5, 600);
        api.sound.whoosh(0.16, 1.1, 0, 900, 200);
        for (let i = 0; i < 6; i++) {
          api.after(i * 90, () => {
            const s: Shot = { frames: flame, x: api.bossX - api.bossW * 0.5 - i * 4, y: 0, vx: -7, onFloor: true, glow: '#ff5a1f', frameMs: 70 };
            api.spawn(s);
          });
        }
      }
    },
    {
      id: 'meteors',
      windup: 800,
      phase: 2,
      run(api) {
        api.tint(1600, 'rgba(255,80,20,.12)');
        api.shake(8, 1400);
        api.sound.thump(1);
        // rain lands around the marble, never on it, unless this answers a
        // wrong pick: then the first one is aimed right at it
        const xs = Array.from({ length: 5 }, (_, i) => 80 + ((i * 167) % (W * 0.6))).filter((x) => Math.abs(x - api.marbleX) > 80);
        if (api.aim) xs.unshift(api.marbleX);
        for (let i = 0; i < xs.length; i++) {
          const x = xs[i];
          api.warn(x, 700 + i * 180, () => {
            api.spawn({ frames: meteor, x: x - 24, y: -60, vy: 12, dodge: 'none', life: 900, glow: '#ff8c00' });
            api.after(400, () => {
              api.shake(6, 160);
              api.sound.thump(0.6);
              api.fx.burst('ember', 10, x, api.floorY - 6);
            });
            if (Math.abs(x - api.marbleX) < 50) api.strikeMarble();
          }, { kind: 'shadow', width: 70 });
        }
      }
    }
  ]
});
