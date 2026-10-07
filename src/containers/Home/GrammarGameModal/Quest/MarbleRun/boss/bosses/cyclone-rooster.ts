import { makeSprite, disc, rect, line, poly, eyesX, INK, U, W } from '../../pixel';
import type { Put } from '../../pixel';
import { registerBoss } from '../registry';
import type { Shot } from '../types';

// Castle of World 3: a giant weathervane rooster, all copper plumage and
// teal sickle feathers, perched on its spinning arrow. It crows up a
// travelling tornado, lobs egg bombs that crack into running chicks, and
// spins like a weathervane to turn the wind around the arena.

const GOLD = '#f0a238';
const GOLD_D = '#b8641f';
const GOLD_L = '#ffd27a';
const CREAM = '#fff1c9';
const TEAL = '#2fa38c';
const TEAL_D = '#1b6560';
const NAVY = '#36397e';
const RED = '#e23b3b';
const RED_D = '#a8222c';
const BEAK = '#ffcb32';
const IRON = '#5b6270';
const IRON_L = '#9aa3b4';
const COPPER = '#c4733a';
const VERDI = '#5fc4a8';

// a quadratic curve (sickle feathers)
function curve(put: Put, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, col: string, w: number) {
  for (let i = 0; i <= 24; i++) {
    const k = i / 24;
    const x = (1 - k) * (1 - k) * x0 + 2 * (1 - k) * k * cx + k * k * x1;
    const y = (1 - k) * (1 - k) * y0 + 2 * (1 - k) * k * cy + k * k * y1;
    rect(put, Math.round(x), Math.round(y), w, w, col);
  }
}

function rooster(beak: 'shut' | 'open' | 'x', wing: 'down' | 'up') {
  return makeSprite(58, 60, (put) => {
    // the weathervane: pole, orb, and the arrow it perches on
    rect(put, 29, 50, 3, 10, IRON);
    rect(put, 29, 50, 1, 10, IRON_L);
    disc(put, 30.5, 55, 3, 2.5, COPPER, '#8a4a22', '#f2a46a');
    rect(put, 8, 48, 42, 2, IRON);
    rect(put, 8, 48, 42, 1, IRON_L);
    poly(put, [[1, 49], [9, 44], [9, 54]], COPPER);
    poly(put, [[3, 49], [8, 46], [8, 49]], '#f2a46a');
    poly(put, [[46, 49], [57, 42], [55, 49]], VERDI);
    poly(put, [[46, 49], [57, 56], [55, 49]], TEAL);
    line(put, 49, 49, 56, 44, TEAL_D);
    line(put, 49, 49, 56, 54, TEAL_D);

    // sickle tail: tall arcing feathers, teal and navy, fanned back
    const sickles: [number, number, number, number, number, number, string][] = [
      [40, 31, 40, -2, 52, 6, NAVY],
      [41, 32, 47, -1, 57, 13, TEAL],
      [41, 33, 52, 4, 57, 24, NAVY],
      [41, 35, 54, 16, 55, 32, TEAL],
      [40, 37, 52, 30, 50, 40, TEAL_D]
    ];
    for (const [x0, y0, cx, cy, x1, y1, c] of sickles) curve(put, x0, y0, cx, cy, x1, y1, c, 2);
    curve(put, 42, 31, 47, 4, 55, 12, VERDI, 1);
    curve(put, 42, 34, 53, 10, 56, 23, '#4fb8e0', 1);

    // legs down to the arrow
    rect(put, 25, 40, 2, 8, BEAK);
    rect(put, 33, 40, 2, 8, BEAK);
    rect(put, 22, 47, 6, 1, '#d99a1a');
    rect(put, 31, 47, 6, 1, '#d99a1a');

    // body, chest puff and folded wing
    disc(put, 31, 31, 13, 11, GOLD, GOLD_D, GOLD_L);
    disc(put, 22, 31, 7, 8, '#f6b84e', GOLD_D);
    for (let k = 0; k < 4; k++) line(put, 18 + k, 27 + k * 3, 22 + k, 28 + k * 3, GOLD_L);
    if (wing === 'up') {
      // raised wing: five fanned flight feathers
      for (let k = 0; k < 5; k++) {
        poly(put, [[28 + k * 2, 30], [30 + k * 3, 9 + k * 2], [34 + k * 3, 8 + k * 2], [33 + k * 2, 30]], k % 2 ? COPPER : '#d98a48');
      }
      for (let k = 0; k < 5; k++) line(put, 30 + k * 3, 10 + k * 2, 30 + k * 2, 28, '#8a4a22');
      disc(put, 33, 27, 6, 4, GOLD, GOLD_D);
    } else {
      disc(put, 34, 31, 9, 6, COPPER, '#8a4a22');
      for (let k = 0; k < 4; k++) line(put, 30 + k * 3, 34, 33 + k * 3, 37, '#8a4a22');
      line(put, 27, 28, 38, 27, '#f2a46a');
    }

    // neck hackles and head
    disc(put, 21, 22, 6, 8, '#f28a2a', '#c4521e');
    for (let k = 0; k < 5; k++) line(put, 17 + k * 2, 18, 18 + k * 2, 26, '#ffb347');
    disc(put, 16, 13, 7, 7, GOLD_L, GOLD);
    // comb: three proud bumps
    disc(put, 12, 6, 2.5, 2.5, RED, RED_D);
    disc(put, 16, 4.5, 2.8, 3, RED, RED_D);
    disc(put, 20, 6, 2.5, 2.5, RED, RED_D);
    rect(put, 11, 6, 11, 3, RED);
    put(15, 3, '#ff8a8a');
    // wattle
    disc(put, 10, 21, 2, 3, RED, RED_D);
    if (beak === 'open') {
      poly(put, [[10, 13], [1, 11], [10, 16]], BEAK);
      poly(put, [[10, 17], [3, 21], [10, 19]], '#e0a020');
      rect(put, 7, 16, 3, 1, '#7a1e2a');
    } else {
      poly(put, [[10, 13], [2, 16], [10, 18]], BEAK);
      line(put, 4, 16, 10, 16, '#c08010');
    }
    if (beak === 'x') eyesX(put, 12, 9);
    else {
      rect(put, 12, 10, 4, 4, CREAM);
      rect(put, 12, 11, 2, 2, INK);
      put(13, 11, '#fff');
      // fierce brow
      line(put, 11, 9, 16, 8, RED_D);
    }
  });
}

const tornado = [0, 1, 2].map((f) =>
  makeSprite(20, 18, (put) => {
    // a funnel: wide at the top, twisting down to a point, with swirl bands
    for (let y = 0; y < 18; y++) {
      const hw = 0.8 + Math.pow((18 - y) / 18, 1.3) * 9 - (y % 4 === 3 ? 0.8 : 0);
      const cx = 10 + Math.sin(y * 0.55 + f * 2.1) * 1.8 * (0.3 + y / 18);
      for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw); x++) {
        const band = (((x - cx + y * 0.9 + f * 2) % 6) + 6) % 6;
        const edge = Math.abs(x - cx) > hw - 1.2;
        put(x, y, band < 1 ? '#ffffff' : edge ? '#9fb2c8' : y % 4 === 3 ? '#b8c8da' : '#d8e4f0');
      }
    }
    // a leaf and a twig caught in it
    put(5 + f * 3, 3 + f, '#6fae4f');
    put(6 + f * 3, 3 + f, '#6fae4f');
    put(13 - f * 2, 8 + f, '#8a5a2a');
    put(14 - f * 2, 8 + f, '#8a5a2a');
  })
);
const egg = makeSprite(9, 11, (put) => {
  disc(put, 4.5, 6, 4.5, 5.5, CREAM, '#e6cf9c', '#ffffff');
  put(3, 5, '#d9a066');
  put(6, 8, '#d9a066');
  put(5, 3, '#d9a066');
});
const chick = [0, 1].map((f) =>
  makeSprite(10, 9, (put) => {
    disc(put, 5, 5, 4.5, 3.5, '#ffe14d', '#e6b820', '#fff6a8');
    disc(put, 3, 3, 2.5, 2.5, '#ffe14d', undefined, '#fff6a8');
    put(0, 3, '#ff9a1f');
    put(0, 4, '#ff9a1f');
    put(2, 3, INK);
    // a scrap of shell still on its head
    put(3, 0, '#fff1c9');
    put(4, 0, '#fff1c9');
    put(5, 1, '#fff1c9');
    rect(put, f ? 3 : 4, 8, 1, 1, '#ff9a1f');
    rect(put, f ? 6 : 5, 8, 1, 1, '#ff9a1f');
  })
);
const feather = makeSprite(12, 5, (put) => {
  line(put, 0, 3, 11, 1, '#8a4a22');
  poly(put, [[1, 3], [5, 0], [11, 0], [11, 2], [5, 4]], GOLD);
  line(put, 3, 2, 10, 1, GOLD_L);
});

// the weathervane spin: when it started and how many turns
let spinAt = -1e9;
const SPIN_MS = 900;

registerBoss({
  id: 'cyclone-rooster',
  scale: 3.5,
  intro: 'drop',
  frames: () => ({
    idle: [rooster('shut', 'down')],
    flap: [rooster('shut', 'up')],
    crow: [rooster('open', 'up')],
    hurt: [rooster('x', 'down')]
  }),
  pose(t, state, f) {
    if (state === 'hurt' || state === 'dazed' || state === 'dying') return { frame: f.hurt[0], tilt: 0.06 };
    if (state === 'intro') return { frame: f.idle[0] };
    // a weathervane turns: during the spin the whole bird rotates on its pole
    const sp = (t - spinAt) / SPIN_MS;
    if (sp >= 0 && sp < 1) {
      const c = Math.cos(sp * Math.PI * 4);
      return { frame: f.flap[0], sx: Math.max(0.12, Math.abs(c)), flip: c < 0, dy: -Math.sin(sp * Math.PI) * 9 };
    }
    if (state === 'wind') return { frame: f.crow[0], dy: -6, tilt: 0.06 };
    if (state === 'laugh') return { frame: f.crow[0], tilt: Math.sin(t / 90) * 0.05 };
    // idle: the breeze nudges the vane back and forth, a strut-bob, a flap now and then
    const flap = Math.floor(t / 2600) % 3 === 0 && Math.floor(t / 130) % 2 === 0;
    return {
      frame: flap ? f.flap[0] : f.idle[0],
      sx: 0.93 + Math.cos(t / 900) * 0.07,
      dy: Math.floor(t / 420) % 2 ? U : 0,
      tilt: Math.sin(t / 700) * 0.025
    };
  },
  moves: [
    {
      id: 'crow-tornado',
      windup: 560,
      run(api) {
        // COCK-A-DOODLE: a rising crow, then a tornado spins up and travels
        [76, 79, 83, 88].forEach((m, i) => api.sound.note(m, { at: i * 0.09, instrument: 'glock', level: 0.07 }));
        api.sound.whoosh(0.12, 1.2, 0.3, 300, 1400);
        api.shake(4, 300);
        api.fx.burst('dust', 10, api.bossX - api.bossW * 0.4, api.floorY - 4, { color: '#d6e4f0' });
        const count = api.menace >= 4 ? 2 : 1;
        for (let i = 0; i < count; i++) {
          api.after(300 + i * 900, () => {
            const x0 = api.bossX - api.bossW * 0.55;
            const s: Shot = {
              frames: tornado,
              x: x0,
              y: 0,
              vx: -4.6,
              onFloor: true,
              frameMs: 70,
              update(sh, t, a) {
                if (sh.hit) return;
                // a wobbling path and a dusty skirt
                sh.x += Math.sin((t - (sh.born || 0)) / 140) * 1.4;
                if (Math.floor(t / 60) % 3 === 0) a.fx.add({ kind: 'dust', x: sh.x + 30, y: a.floorY - 4, vx: (Math.random() - 0.5) * 3, vy: -1 - Math.random(), color: '#d8c8a8', life: 0.6 });
              }
            };
            api.spawn(s);
          });
        }
      }
    },
    {
      id: 'egg-bombs',
      windup: 480,
      run(api) {
        // three eggs lobbed short of the marble; each cracks into a chick
        const n = 3;
        for (let i = 0; i < n; i++) {
          api.after(i * 220, () => {
            const x0 = api.bossX - api.bossW * 0.25;
            const y0 = api.bossTop + api.bossH * 0.45;
            const tx = api.marbleX + 140 + i * 110 + Math.random() * 40;
            const N = 46;
            const gr = 0.28;
            const eggH = egg.height * U;
            const yLand = api.floorY - eggH;
            const s: Shot = {
              frames: [egg],
              x: x0,
              y: y0,
              vx: (tx - x0) / N,
              vy: (yLand - y0 - 0.5 * gr * N * N) / N,
              g: gr,
              spin: 0.25,
              dodge: api.aim && i === 0 ? 'hop' : 'none',
              update(sh, _t, a) {
                if (sh.hit || sh.done) return;
                if (sh.y + eggH >= a.floorY) {
                  sh.done = true;
                  const cx = sh.x + 16;
                  a.fx.burst('shard', 8, cx, a.floorY - 10, { color: CREAM, speed: 0.6 });
                  a.fx.burst('dust', 5, cx, a.floorY - 4);
                  a.sound.thump(0.25);
                  a.sound.note(91 + i * 2, { instrument: 'glock', level: 0.06 });
                  // the chick runs off toward the marble's side, bobbing
                  a.spawn({
                    frames: chick,
                    x: cx - 15,
                    y: 0,
                    vx: -3.2 - Math.random(),
                    onFloor: true,
                    frameMs: 110
                  });
                }
              }
            };
            api.spawn(s);
            api.sound.whoosh(0.05, 0.25, 0, 900, 1600);
          });
        }
      }
    },
    {
      id: 'wind-turn',
      windup: 420,
      weight: 0.8,
      run(api) {
        // the vane spins and the wind turns: feathers blow in low (duck),
        // then the gust swings around and streams back the other way
        spinAt = api.t;
        api.sound.whoosh(0.14, 0.9, 0, 500, 2200);
        api.tint(1400, 'rgba(200,230,255,.12)');
        for (let i = 0; i < 4; i++) {
          api.after(160 + i * 150, () => {
            api.spawn({
              frames: [feather],
              x: api.bossX - api.bossW * 0.4,
              y: api.floorY - 72 + (i % 2) * 6,
              vx: -8.5,
              dodge: 'duck',
              spin: 0.08
            });
          });
        }
        for (let i = 0; i < 14; i++) {
          api.fx.add({ kind: 'leaf', x: W + 10, y: 60 + Math.random() * 200, vx: -9 - Math.random() * 4, vy: 0, color: i % 3 ? '#6fae4f' : GOLD, life: 1.2 });
        }
        api.after(SPIN_MS, () => {
          // wind reversed: leaves now stream left to right high above
          api.sound.whoosh(0.1, 0.7, 0, 2200, 600);
          for (let i = 0; i < 16; i++) {
            api.fx.add({ kind: 'leaf', x: -10 - Math.random() * 60, y: 40 + Math.random() * 120, vx: 9 + Math.random() * 4, vy: 0, color: i % 3 ? '#a8d86a' : GOLD_L, life: 1.2 });
          }
        });
      }
    }
  ],
  drawExtra(g, t, api, state) {
    // a little sparkle glints on the copper arrow tip now and then
    if (state === 'dying' || state === 'intro' || t - spinAt < SPIN_MS) return;
    const k = (t % 2400) / 2400;
    if (k < 0.12) {
      const sc = api.bossW / 60;
      g.fillStyle = '#fff6c0';
      const x = api.bossX - api.bossW / 2 + 3 * sc;
      const y = api.bossTop + 50 * (api.bossH / 62);
      const r = Math.round(2 + Math.sin(k * Math.PI / 0.12) * 3) * U;
      g.fillRect(Math.round(x / U) * U - r, Math.round(y / U) * U, r * 2 + U, U);
      g.fillRect(Math.round(x / U) * U, Math.round(y / U) * U - r, U, r * 2 + U);
    }
  }
});
