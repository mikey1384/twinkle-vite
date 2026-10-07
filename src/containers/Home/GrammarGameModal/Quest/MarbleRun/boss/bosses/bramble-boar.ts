import { makeSprite, disc, rect, line, poly, ring, eyesX, INK, U, r3, Put } from '../../pixel';
import { registerBoss } from '../registry';
import type { Shot } from '../types';

// Fort 2 of World 3: the Bramble Boar, a stocky wild boar with a mohawk of
// thorny brambles, blackberries tangled in it and a big snorty snout. It paws
// the ground before every attack; its charge is the boar itself barrelling
// across the floor (the marble hops clean over its back) before it comes
// skidding back in from the right. It also lobs a volley of thorns and makes
// bramble bushes sprout out of the floor.

const B = '#6b4a3a';
const BD = '#4a3226';
const BL = '#9a7058';
const SNOUT = '#e8a0a0';
const SNOUTD = '#c07878';
const IVORY = '#fff4d6';
const VINE = '#3f7a3a';
const VINED = '#2f5a2a';
const THORN = '#c8e08a';
const HOOF = '#2a1a12';

// the charge hides the boss while the shot runs, then it skids back in
let chargeAt = -1e9;
const CHARGE_GONE = 1050;
const CHARGE_BACK = 520;

function thornRidge(put: Put, x0: number, x1: number, yAt: (x: number) => number) {
  for (let x = x0; x <= x1; x++) {
    const y = yAt(x) + Math.round(Math.sin(x / 2.2));
    put(x, y, VINE);
    put(x, y + 1, VINED);
    if (x % 4 === 0) {
      put(x, y - 1, THORN);
      put(x, y - 2, THORN);
    }
  }
}

function boar(leg: 'stand' | 'paw', eyes: 'open' | 'x') {
  return makeSprite(66, 44, (put) => {
    // curly tail
    ring(put, 62, 19, 2, BD, 10);
    line(put, 58, 21, 60, 20, BD);
    // legs (back pair darker), with hooves
    for (const [x, c] of [[48, BD], [55, B]] as [number, string][]) {
      rect(put, x, 33, 5, 9, c);
      rect(put, x, 41, 5, 2, HOOF);
    }
    rect(put, 24, 34, 5, 8, BD);
    rect(put, 24, 41, 5, 2, HOOF);
    // body
    disc(put, 38, 24, 23, 13, B, BD, BL);
    disc(put, 36, 32, 15, 4, BL);
    for (const [x, y] of [[30, 18], [44, 22], [50, 16], [38, 28], [26, 26]]) line(put, x, y, x + 2, y + 1, BD);
    // the front leg: planted, or raised to paw the ground
    if (leg === 'paw') {
      line(put, 18, 33, 13, 37, B, 5);
      rect(put, 10, 37, 5, 2, HOOF);
    } else {
      rect(put, 16, 34, 5, 8, B);
      rect(put, 16, 41, 5, 2, HOOF);
    }
    // bramble mohawk along the back, a vine wrapped round the middle, berries
    thornRidge(put, 20, 58, (x) => Math.round(24 - Math.sqrt(Math.max(0, 1 - ((x - 38) / 23) ** 2)) * 13) - 1);
    for (let k = 0; k < 10; k++) {
      const x = 40 + k;
      const y = 13 + k * 2;
      put(x, y, VINE);
      put(x + 1, y, VINED);
      if (k % 3 === 1) put(x + 2, y - 1, THORN);
    }
    for (const [x, y, c] of [[28, 9, '#5a2a7a'], [45, 9, '#d93a4a'], [52, 13, '#5a2a7a'], [36, 7, '#d93a4a']] as [number, number, string][]) {
      disc(put, x, y, 1.6, 1.6, c);
      put(x - 0.5, y - 0.8, '#fff');
    }
    // head, ear, snout, tusks
    disc(put, 15, 25, 11, 10, B, BD, BL);
    poly(put, [[17, 15], [22, 7], [26, 17]], B);
    poly(put, [[19, 15], [22, 10], [24, 16]], SNOUTD);
    disc(put, 6, 30, 6, 4.5, SNOUT, SNOUTD);
    put(3, 30, INK);
    put(7, 30, INK);
    line(put, 9, 35, 4, 25, IVORY, 2);
    put(3, 24, IVORY);
    line(put, 4, 35, 0, 29, IVORY);
    // eye and brow (or X)
    if (eyes === 'x') {
      eyesX(put, 10, 19);
      rect(put, 9, 35, 4, 3, '#ff7bac');
    } else {
      rect(put, 11, 20, 4, 3, '#ff8a2e');
      rect(put, 11, 21, 2, 2, INK);
      put(14, 20, '#ffe08a');
      line(put, 9, 17, 17, 20, INK, 1);
      line(put, 9, 18, 16, 20, INK, 1);
    }
    rect(put, 10, 36, 7, 1, BD);
  });
}

// the low, stretched charging pose (short enough for the marble to hop)
const run = [0, 1].map((f) =>
  makeSprite(40, 18, (put) => {
    if (f) {
      line(put, 30, 12, 37, 17, BD, 3);
      line(put, 12, 12, 4, 16, B, 3);
    } else {
      line(put, 30, 12, 26, 17, BD, 3);
      line(put, 14, 12, 16, 17, B, 3);
    }
    disc(put, 23, 10, 16, 6.5, B, BD, BL);
    disc(put, 22, 14, 10, 2.5, BL);
    thornRidge(put, 10, 36, (x) => Math.round(10 - Math.sqrt(Math.max(0, 1 - ((x - 23) / 16) ** 2)) * 6.5) - 1);
    put(30, 2, '#d93a4a');
    put(19, 2, '#5a2a7a');
    ring(put, 39, 7, 1.4, BD, 8);
    disc(put, 8, 12, 7, 5, B, BD);
    disc(put, 2.5, 14, 3, 2.6, SNOUT, SNOUTD);
    put(1, 14, INK);
    line(put, 4, 16, 0, 11, IVORY, 1);
    poly(put, [[9, 7], [13, 3], [14, 8]], B);
    rect(put, 6, 9, 2, 2, '#ff8a2e');
    put(6, 9, INK);
  })
);

const thorn = makeSprite(10, 6, (put) => {
  poly(put, [[0, 3], [7, 0], [10, 3], [7, 6]], '#7a5a2a');
  line(put, 1, 3, 9, 3, '#a8803e');
  put(0, 3, THORN);
});

const bush = makeSprite(20, 16, (put) => {
  disc(put, 10, 10, 9, 6, VINE, VINED, '#6aa84a');
  disc(put, 5, 11, 4, 4, VINE, VINED);
  disc(put, 15, 9, 4.5, 4.5, VINE, VINED);
  for (const [x, y] of [[3, 5], [10, 3], [17, 4], [1, 10], [19, 11], [8, 6], [13, 6]]) {
    put(x, y, THORN);
    put(x, y - 1, THORN);
  }
  for (const [x, y] of [[7, 11], [13, 12]]) {
    disc(put, x, y, 1.4, 1.4, '#5a2a7a');
  }
});

let lastDust = 0;

registerBoss({
  id: 'bramble-boar',
  scale: 3,
  intro: 'drop',
  frames: () => ({
    idle: [boar('stand', 'open')],
    paw: [boar('paw', 'open')],
    hurt: [boar('stand', 'x')],
    run
  }),
  pose(t, state, f) {
    // timers from an earlier fight on another clock: forget them
    if (chargeAt > t) chargeAt = -1e9;
    if (lastDust > t) lastDust = 0;
    if (state === 'hurt' || state === 'dazed' || state === 'dying') return { frame: f.hurt[0], tilt: 0.06 };
    const c = t - chargeAt;
    if (c >= 0 && c < CHARGE_GONE) return { frame: f.idle[0], alpha: 0 };
    if (c >= CHARGE_GONE && c < CHARGE_GONE + CHARGE_BACK) {
      // back in from the right, skidding to a stop
      const k = (c - CHARGE_GONE) / CHARGE_BACK;
      return { frame: f.run[Math.floor(t / 70) % 2], dx: (1 - k) * (1 - k) * 360, tilt: k > 0.7 ? 0.08 : 0 };
    }
    if (state === 'wind') {
      // paw, paw, snort
      const paw = Math.floor(t / 140) % 2;
      return { frame: paw ? f.paw[0] : f.idle[0], dy: paw ? -U : 0, tilt: -0.04 };
    }
    if (state === 'laugh') return { frame: f.paw[0], dy: -Math.abs(Math.sin(t / 100)) * 9 };
    // heavy breathing
    return { frame: f.idle[0], sy: 1 + Math.sin(t / 380) * 0.025, sx: 1 - Math.sin(t / 380) * 0.015 };
  },
  drawExtra(g, t, api, state) {
    const c = t - chargeAt;
    if (c >= 0 && c < CHARGE_GONE + CHARGE_BACK) {
      if (c > CHARGE_GONE && t - lastDust > 60) {
        lastDust = t;
        api.fx.burst('dust', 2, api.bossX + 20, api.ledgeY - 6);
      }
      return;
    }
    const left = api.bossX - api.bossW / 2;
    const nx = left + 2 * 3;
    const ny = api.bossTop + 31 * 3;
    if (state === 'wind') {
      // dust kicked up by the pawing hoof
      if (t - lastDust > 140) {
        lastDust = t;
        api.fx.burst('dust', 3, left + 12 * 3, api.ledgeY - 6, { speed: 0.8 });
      }
      return;
    }
    if (state !== 'idle') return;
    // snort: two little puffs from the snout every couple of seconds
    const k = (t % 2200) / 420;
    if (k > 1) return;
    g.globalAlpha = 1 - k;
    g.fillStyle = '#f4f0ea';
    for (const dy of [-6, 6]) {
      const x = nx - k * 30;
      const y = ny + dy - k * 6;
      const s = r3(6 + k * 8);
      g.fillRect(r3(x - s / 2), r3(y - s / 2), s, s);
    }
    g.globalAlpha = 1;
  },
  moves: [
    {
      id: 'charge',
      windup: 760,
      run(api) {
        // the boar leaps off its ledge and barrels along the floor
        chargeAt = api.t;
        api.shake(5, 900);
        api.sound.thump(0.9);
        api.sound.whoosh(0.14, 0.9, 0, 300, 900);
        // galloping hoofbeats
        for (let i = 0; i < 6; i++) api.sound.note(40 + (i % 2) * 3, { at: 0.12 + i * 0.12, instrument: 'marimba', level: 0.08 });
        let landed = false;
        const s: Shot = {
          frames: run,
          frameMs: 70,
          x: api.bossX - 60,
          y: api.ledgeY - 18 * U,
          vx: -16,
          vy: -3,
          update(sh, t, a) {
            if (sh.hit) return;
            if (!landed) {
              sh.vy = (sh.vy || 0) + 0.8;
              if (sh.y + 20 * U >= a.floorY) {
                landed = true;
                sh.onFloor = true;
                sh.vy = 0;
                a.shake(4, 120);
                a.fx.burst('dust', 10, sh.x + 30, a.floorY - 6);
              }
            } else if (Math.floor(t / 50) % 2 === 0) {
              a.fx.add({ kind: 'dust', x: sh.x + 110, y: a.floorY - 8, vx: 1.5, vy: -1 });
            }
          }
        };
        api.spawn(s);
      }
    },
    {
      id: 'thorns',
      windup: 560,
      run(api) {
        // a shake of the mohawk sends thorns flying in an arc; they stick in
        // the floor around the marble, never on it unless this answers a
        // wrong pick
        api.sound.whoosh(0.1, 0.5, 0, 2200, 800);
        const xs = [0, 1, 2, 3, 4].map((i) => 110 + i * 120 + Math.random() * 30).filter((x) => Math.abs(x - api.marbleX) > 70);
        if (api.aim) xs.unshift(api.marbleX);
        for (let i = 0; i < xs.length; i++) {
          const sx = api.bossX;
          const sy = api.bossTop + 20;
          const n = 46 + i * 3;
          const g = 0.32;
          const tx = xs[i] - 15;
          const ty = api.floorY - 8 * U;
          let stuck = false;
          api.spawn({
            frames: [thorn],
            x: sx,
            y: sy,
            vx: (tx - sx) / n,
            vy: (ty - sy - (g * n * n) / 2) / n,
            g,
            life: 2400,
            dodge: api.aim && i === 0 ? 'hop' : 'none',
            update(sh, t, a) {
              if (sh.hit || stuck) return;
              if (sh.y + 8 * U >= a.floorY) {
                stuck = true;
                sh.vx = 0;
                sh.vy = 0;
                sh.g = 0;
                sh.y = a.floorY - 7 * U;
                a.fx.burst('leaf', 3, sh.x + 15, a.floorY - 4, { color: THORN, speed: 0.5 });
                a.sound.note(86, { instrument: 'glock', level: 0.03 });
              }
            }
          });
        }
      }
    },
    {
      id: 'brambles',
      windup: 620,
      weight: 0.8,
      run(api) {
        // a stomp, and thorny bushes sprout up out of the floor
        api.shake(4, 200);
        api.sound.thump(0.7);
        const xs = [0, 1, 2].map((i) => 130 + i * 200 + Math.random() * 50).filter((x) => Math.abs(x - api.marbleX) > 90);
        if (api.aim) xs.unshift(api.marbleX);
        for (let i = 0; i < xs.length; i++) {
          const x = xs[i];
          api.warn(x, 650 + i * 150, () => {
            api.spawn({ frames: [bush], x: x - 11 * U, y: api.floorY - 17 * U, dodge: 'none', life: 900 });
            api.fx.burst('leaf', 10, x, api.floorY - 20, { color: '#6aa84a', speed: 0.9 });
            api.fx.burst('dust', 6, x, api.floorY - 6);
            api.sound.whoosh(0.06, 0.25, 0, 600, 2000);
            api.sound.note(57 + i * 4, { instrument: 'marimba', level: 0.08 });
            if (Math.abs(x - api.marbleX) < 60) api.strikeMarble();
          }, { kind: 'column', width: 60, color: '#6aa84a' });
        }
      }
    }
  ]
});
