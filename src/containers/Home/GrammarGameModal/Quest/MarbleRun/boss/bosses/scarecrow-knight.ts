import { makeSprite, disc, rect, line, poly, ring, eyesX, INK } from '../../pixel';
import { registerBoss } from '../registry';
import type { Shot } from '../types';

// Castle of Starter Village: Sir Scarecrow, a straw knight on a stick with a
// bucket for a helmet, a feather plume and a pet crow on his arm. He sways on
// his pole, rolls hay bales, sends a wave of three crows, and twirls his
// pitchfork so fast he kicks up a storm of straw.

const STRAW = '#f2c94c';
const STRAWD = '#c99a2e';
const STRAWL = '#fff0a0';
const CROW = '#2e2a3d';
const CROWL = '#55506e';

// set by the spin move; the pose twirls him until then
let spinUntil = -1e9;

function knight(eyes: 'open' | 'angry' | 'x', forkUp: boolean) {
  return makeSprite(48, 52, (put) => {
    const SACK = '#d9b98a';
    const SACKD = '#a8865a';
    const POLE = '#8a5a33';
    const POLED = '#5e3b20';
    const TAB = '#3f6fd1';
    const TABD = '#2a4c99';
    const TABL = '#7aa2ff';
    const SHIRT = '#c8423a';
    const SHIRTD = '#8f2a2a';
    const IRON = '#a9b3bf';
    const IROND = '#6d7683';
    const IRONL = '#e4ecf3';
    const PLUME = '#ff5a7a';
    const PLUMED = '#c22e55';
    // dirt mound and the pole stuck in it
    disc(put, 24, 50, 10, 2.5, '#6b4a2b', '#4a321c');
    rect(put, 22, 30, 4, 20, POLE);
    rect(put, 25, 30, 1, 20, POLED);
    // crossbar with plaid sleeves
    rect(put, 3, 21, 42, 2, POLE);
    rect(put, 3, 22, 42, 1, POLED);
    for (const [x0, x1] of [[6, 15], [33, 42]]) {
      rect(put, x0, 19, x1 - x0, 6, SHIRT);
      for (let x = x0 + 1; x < x1; x += 3) rect(put, x, 19, 1, 6, SHIRTD);
      rect(put, x0, 22, x1 - x0, 1, SHIRTD);
      put(x0 + 2, 20, '#e8c03a'); // a patch
    }
    // the pitchfork in his front (left) hand
    const fy = forkUp ? 0 : 6;
    line(put, 3, fy + 6, 3, fy + 44, '#9b6b3f');
    line(put, 4, fy + 6, 4, fy + 44, '#6e4826');
    rect(put, 0, fy + 4, 8, 2, IROND);
    for (const x of [0, 3, 7]) {
      rect(put, x, fy, 1, 5, IRON);
      put(x, fy, IRONL);
    }
    // straw hands
    poly(put, [[6, 18], [1, 17], [2, 21], [0, 23], [3, 26], [6, 25]], STRAW);
    line(put, 1, 18, 5, 20, STRAWD);
    line(put, 1, 24, 5, 23, STRAWD);
    poly(put, [[42, 18], [47, 17], [46, 21], [47, 25], [42, 25]], STRAW);
    line(put, 43, 20, 46, 19, STRAWD);
    // tabard with a gold star, rope belt and a straw hem
    rect(put, 14, 18, 20, 18, TAB);
    rect(put, 29, 18, 5, 18, TABD);
    rect(put, 14, 18, 20, 1, TABL);
    for (let i = 0; i < 3; i++) {
      put(23, 22 + i, '#ffcb32');
      put(22 + i, 23, '#ffcb32');
    }
    put(23, 21, '#ffcb32');
    put(21, 23, '#ffcb32');
    put(25, 23, '#ffcb32');
    rect(put, 14, 30, 20, 2, STRAWD);
    put(16, 32, STRAWD);
    put(16, 33, STRAWD);
    for (let x = 14; x < 34; x++) {
      const len = 3 + ((x * 7) % 4);
      line(put, x, 36, x + ((x % 3) - 1), 36 + len, x % 2 ? STRAW : STRAWD);
    }
    // sack head tied at the neck
    disc(put, 24, 12, 9, 8, SACK, SACKD);
    for (const [x, y] of [[17, 9], [21, 6], [29, 14], [25, 17], [19, 15]]) put(x, y, SACKD);
    rect(put, 18, 18, 12, 2, STRAWD);
    poly(put, [[18, 18], [14, 16], [15, 20]], STRAW);
    poly(put, [[30, 18], [34, 15], [33, 20]], STRAW);
    put(15, 17, STRAWL);
    // a little green patch with stitches
    rect(put, 28, 8, 3, 3, '#7a9a4a');
    put(27, 8, INK);
    put(31, 10, INK);
    // stitched grin
    for (let x = 18; x <= 28; x++) put(x, 15 + (x % 2), INK);
    if (eyes === 'x') {
      eyesX(put, 17, 8);
      eyesX(put, 25, 8);
    } else {
      const c = eyes === 'angry' ? '#ff4d4d' : INK;
      rect(put, 18, 9, 3, 3, c);
      rect(put, 26, 9, 3, 3, c);
      put(18, 9, eyes === 'angry' ? '#ffd0d0' : '#fff');
      put(26, 9, eyes === 'angry' ? '#ffd0d0' : '#fff');
      if (eyes === 'angry') {
        line(put, 16, 6, 21, 8, INK);
        line(put, 30, 6, 25, 8, INK);
      }
    }
    // bucket helmet with rivets and a plume
    rect(put, 16, 1, 16, 5, IRON);
    rect(put, 28, 1, 4, 5, IROND);
    rect(put, 17, 1, 3, 1, IRONL);
    rect(put, 15, 5, 18, 2, IROND);
    for (const x of [18, 23, 28]) put(x, 3, IROND);
    disc(put, 36, 2, 5, 2, PLUME, PLUMED);
    line(put, 31, 3, 40, 1, PLUMED);
    put(41, 0, PLUME);
    // the pet crow perched on his back arm
    disc(put, 41, 14, 3, 2.6, CROW);
    disc(put, 39, 11, 2, 2, CROW);
    put(37, 11, '#ffb02e');
    put(36, 11, '#ffb02e');
    put(39, 10, '#fff');
    line(put, 43, 15, 46, 16, CROWL);
    put(40, 17, '#ffb02e');
    put(42, 17, '#ffb02e');
  });
}

const bale = makeSprite(16, 16, (put) => {
  disc(put, 8, 8, 8, 8, STRAW, STRAWD, STRAWL);
  ring(put, 8, 8, 5, STRAWD, 22);
  ring(put, 8, 8, 2.5, STRAWD, 12);
  put(8, 8, '#a8782a');
  for (const [x, y] of [[2, 4], [13, 3], [14, 11], [3, 13]]) put(x, y, STRAWL);
});

const crow = [0, 1].map((f) =>
  makeSprite(16, 11, (put) => {
    disc(put, 9, 6, 5, 3, CROW);
    disc(put, 4, 4, 2.6, 2.4, CROW);
    poly(put, [[0, 4], [2, 3], [2, 5]], '#ffb02e');
    put(4, 3, '#fff');
    poly(put, [[13, 5], [16, 3], [16, 8]], CROW);
    if (f) poly(put, [[7, 5], [10, 0], [13, 5]], CROWL);
    else poly(put, [[7, 6], [10, 11], [13, 6]], CROWL);
  })
);

const straw = makeSprite(10, 6, (put) => {
  for (let x = 0; x < 10; x++) line(put, x, 5, x + (x % 3) - 1, 1 + (x % 2), x % 2 ? STRAW : STRAWD);
  put(4, 2, STRAWL);
});

registerBoss({
  id: 'scarecrow-knight',
  scale: 4,
  intro: 'rise',
  frames: () => ({
    idle: [knight('open', false)],
    wind: [knight('angry', true)],
    hurt: [knight('x', false)]
  }),
  pose(t, state, f) {
    // timers from an earlier fight on another clock: forget them
    if (spinUntil > t + 2000) spinUntil = -1e9;
    if (state === 'hurt' || state === 'dazed' || state === 'dying') return { frame: f.hurt[0], tilt: 0.08 };
    if (t < spinUntil) {
      // a twirl: mirror back and forth while squeezing, like a spinning top
      const k = Math.abs(Math.cos(t / 60));
      return { frame: f.wind[0], flip: Math.floor(t / 94) % 2 === 1, sx: 0.35 + k * 0.65, dy: -6 };
    }
    if (state === 'wind') return { frame: f.wind[0], tilt: -0.07, dy: -3 };
    if (state === 'laugh') return { frame: f.idle[0], tilt: Math.sin(t / 90) * 0.12 };
    // swaying on his pole in the breeze
    return { frame: f.idle[0], tilt: Math.sin(t / 650) * 0.05, sy: 1 + Math.sin(t / 330) * 0.015 };
  },
  moves: [
    {
      id: 'hay-bale',
      windup: 450,
      run(api) {
        api.spawn({ frames: [bale], x: api.bossX - api.bossW * 0.45, y: api.bossTop + api.bossH * 0.55, vx: -5, vy: -3, g: 0.35, bounce: 0.35, spin: -0.22 });
        api.sound.thump(0.45);
        api.sound.note(55, { instrument: 'marimba', level: 0.1 });
        api.fx.burst('leaf', 6, api.bossX - api.bossW * 0.3, api.ledgeY - 10, { color: STRAW, speed: 0.6 });
      }
    },
    {
      id: 'crow-wave',
      windup: 520,
      run(api) {
        // three crows ride a wave across the room, high enough to duck under
        for (let i = 0; i < 3; i++) {
          api.after(i * 220, () => {
            const base = api.floorY - 150;
            const s: Shot = {
              frames: crow,
              frameMs: 110,
              x: api.bossX - api.bossW * 0.2,
              y: base,
              vx: -6.2,
              dodge: 'duck',
              update(sh, t) {
                if (sh.hit) return;
                sh.vy = 0;
                sh.y = base + Math.sin((t - (sh.born || 0)) / 150 + i) * 28;
              }
            };
            api.spawn(s);
            api.sound.note(79 - i * 3, { instrument: 'marimba', level: 0.08 });
            api.sound.note(76 - i * 3, { at: 0.07, instrument: 'marimba', level: 0.07 });
          });
        }
        api.sound.whoosh(0.07, 0.5, 0, 1800, 700);
      }
    },
    {
      id: 'pitchfork-spin',
      windup: 600,
      weight: 0.8,
      run(api) {
        spinUntil = api.t + 950;
        api.shake(3, 900);
        for (let i = 0; i < 4; i++) api.sound.whoosh(0.08, 0.22, i * 0.22, 2200, 900);
        // straw flies everywhere; a few clumps tumble along the floor
        for (let i = 0; i < 6; i++) {
          api.after(i * 150, () => {
            api.fx.burst('leaf', 5, api.bossX, api.bossTop + api.bossH * 0.6, { color: i % 2 ? STRAW : STRAWD, speed: 1.2 });
          });
        }
        for (let i = 0; i < 3; i++) {
          api.after(200 + i * 260, () => {
            api.spawn({ frames: [straw], x: api.bossX - api.bossW * 0.4, y: api.ledgeY - 30, vx: -5.5 - i * 0.5, vy: -2, g: 0.3, bounce: 0.4 });
          });
        }
      }
    }
  ]
});
