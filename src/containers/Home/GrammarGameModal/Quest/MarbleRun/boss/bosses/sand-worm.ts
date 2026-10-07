import { makeSprite, disc, rect, line, poly, eyesX, pxEllipse, INK, U } from '../../pixel';
import { registerBoss } from '../registry';
import type { BossApi, BossState, Shot } from '../types';

// Fort 1 of World 5: the Dune Worm, a plum-banded sandworm with a round,
// tooth-ringed mouth. It burrows into its mound and bursts up somewhere
// else in a spray of sand, spits a rainbow of sand clumps high over the
// marble, and slaps sand waves along the floor. Phase 2: sand geysers.

const BODY = '#c0607a';
const BODY_D = '#8a3a5a';
const BODY_L = '#e890a0';
const BELLY = '#f0d2a0';
const BELLY_D = '#c8a070';
const SPIKE = '#ff9a3a';
const SAND = '#e8c27a';
const SAND_D = '#c09050';
const SAND_L = '#fff0b8';
const MOUTH = '#5a1430';
const TOOTH = '#fff7e0';

function worm(mouth: 'half' | 'wide' | 'shut' | 'x') {
  return makeSprite(54, 58, (put) => {
    // body: a fat S-curve of banded segments rising from the mound
    const segs: [number, number, number][] = [
      [36, 50, 10],
      [39, 43, 10],
      [39, 36, 9.5],
      [36, 30, 9.5],
      [31, 25, 9.5]
    ];
    for (const [x, y, r] of segs) {
      disc(put, x, y, r, 6.5, BODY, BODY_D, BODY_L);
      line(put, x - r + 2, y + 5, x + r - 2, y + 5, BODY_D);
      // belly plates face front (left)
      rect(put, Math.round(x - r + 1), Math.round(y - 3), 3, 6, BELLY);
      put(Math.round(x - r + 1), Math.round(y + 2), BELLY_D);
    }
    // back spikes
    for (const [x, y] of [[46, 41], [48, 34], [45, 27], [40, 21], [33, 14]] as [number, number][]) {
      poly(put, [[x - 2, y + 2], [x + 3, y - 2], [x + 1, y + 3]], SPIKE);
    }

    // the head: big and round, mouth facing the marble
    disc(put, 22, 20, 14, 13, BODY, BODY_D, BODY_L);
    for (let k = 0; k < 3; k++) line(put, 28 + k * 3, 8 + k, 32 + k * 3, 30 - k, BODY_D);
    const mx = 12;
    const my = 21;
    if (mouth === 'shut') {
      // puckered lips
      disc(put, mx, my, 4, 5, BODY_L, BODY_D);
      for (let k = 0; k < 5; k++) put(mx - 2 + k % 2, my - 3 + k * 1.5, BODY_D);
    } else {
      const ry = mouth === 'wide' ? 10 : 7;
      const rx = mouth === 'wide' ? 8 : 6;
      disc(put, mx, my, rx, ry, BELLY_D);
      disc(put, mx, my, rx - 1.5, ry - 1.5, MOUTH);
      disc(put, mx + 1, my, rx - 4, ry - 4, '#2a0818');
      // a ring of teeth pointing in
      const n = mouth === 'wide' ? 12 : 9;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const tx = mx + Math.cos(a) * (rx - 2);
        const ty = my + Math.sin(a) * (ry - 2);
        put(tx, ty, TOOTH);
        put(mx + Math.cos(a) * (rx - 3.2), my + Math.sin(a) * (ry - 3.2), TOOTH);
      }
      if (mouth === 'x') {
        rect(put, mx - 2, my + 2, 3, 5, BODY_L);
        put(mx - 1, my + 7, BODY_L);
      }
    }
    // eyes up top, with a grumpy brow
    if (mouth === 'x') {
      eyesX(put, 18, 6);
      eyesX(put, 26, 8);
    } else {
      disc(put, 20, 8, 3, 3, '#fff6c0');
      disc(put, 28, 10, 2.6, 2.6, '#fff6c0');
      rect(put, 19, 8, 2, 2, INK);
      rect(put, 27, 10, 2, 2, INK);
      line(put, 16, 4, 23, 6, BODY_D);
      line(put, 25, 7, 31, 7, BODY_D);
    }
    // a little feeler
    line(put, 33, 9, 37, 2, BODY_D);
    disc(put, 37, 2, 1.5, 1.5, SPIKE);

    // the sand mound it lives in
    disc(put, 36, 55, 17, 4, SAND, SAND_D, SAND_L);
    for (const [x, y] of [[24, 55], [30, 57], [44, 54], [49, 56]]) put(x, y, SAND_D);
    put(28, 53, SAND_L);
  });
}

const clumpColors = ['#ff6b5a', '#ff9a3a', '#ffcb32', '#e8c27a', '#c0607a', '#f0a0c0'];
const clumps = clumpColors.map((c) =>
  makeSprite(8, 7, (put) => {
    disc(put, 4, 3.5, 4, 3.5, c, SAND_D, SAND_L);
    put(2, 4, SAND_D);
  })
);
const wave = [0, 1].map((f) =>
  makeSprite(18, 12, (put) => {
    poly(put, [[0, 12], [5, 3 + f], [9, 0], [14, 4], [18, 12]], SAND);
    poly(put, [[9, 0], [14, 4], [18, 12], [12, 12]], SAND_D);
    for (let k = 0; k < 4; k++) put(4 + k * 3, 1 + f + (k % 2), SAND_L);
    put(7, 8, SAND_D);
  })
);
// a sand geyser in growth stages (bottom aligned)
const GEY_H = 30;
const geyser = [6, 14, 22, 30].map((hgt) =>
  makeSprite(16, GEY_H, (put) => {
    const top = GEY_H - hgt;
    poly(put, [[2, GEY_H], [5, top + 3], [11, top + 3], [14, GEY_H]], SAND);
    disc(put, 8, top + 3, 6, 3, SAND_L, SAND);
    line(put, 9, top + 4, 11, GEY_H - 1, SAND_D);
    for (let y = top + 6; y < GEY_H; y += 5) put(5 + (y % 3), y, SAND_L);
  })
);

// the burrow: when it started, where it surfaces (dx from home), how far
// below the ledge the arena floor is
const DIG = { at: -1e9, dx: 0, floor: 0 };
const SINK = 420;
const UNDER = 520;
const RISE = 380;
const STAY = 1500;
const DIG_TOTAL = SINK + UNDER + RISE + STAY + SINK + UNDER + RISE;

// where the worm is in its burrow trip: offsets plus how much of it shows
function dig(t: number) {
  const s = t - DIG.at;
  if (s < 0 || s >= DIG_TOTAL) return { dx: 0, dy: 0, alpha: 1, mound: 0 };
  const sinkIn = (k: number, dx: number, base: number) => ({ dx, dy: base + k * 30, alpha: 1 - k, mound: 1 });
  const riseUp = (k: number, dx: number, base: number) => ({ dx, dy: base + (1 - k) * 30, alpha: k, mound: 1 - k * 0.6 });
  const a = SINK;
  const b = a + UNDER;
  const c = b + RISE;
  const d = c + STAY;
  const e = d + SINK;
  const f = e + UNDER;
  if (s < a) return sinkIn(s / SINK, 0, 0);
  if (s < b) return { dx: 0, dy: 30, alpha: 0, mound: 0 };
  if (s < c) return riseUp((s - b) / RISE, DIG.dx, DIG.floor);
  if (s < d) return { dx: DIG.dx, dy: DIG.floor, alpha: 1, mound: 0.4 };
  if (s < e) return sinkIn((s - d) / SINK, DIG.dx, DIG.floor);
  if (s < f) return { dx: DIG.dx, dy: DIG.floor + 30, alpha: 0, mound: 0 };
  return riseUp((s - f) / RISE, 0, 0);
}

function sandSpray(api: BossApi, x: number, y: number) {
  // clumps fly out both ways but land well clear of the marble
  api.fx.burst('dust', 16, x, y, { color: SAND, speed: 1.4 });
  api.fx.burst('shard', 10, x, y - 10, { color: SAND_L, speed: 1.2, dir: -Math.PI / 2, spread: Math.PI * 0.9 });
  for (let i = 0; i < 5; i++) {
    const vx = (i - 1.5) * 2.2;
    if (x + vx * 40 < api.marbleX + 80) continue;
    api.spawn({ frames: [clumps[i % clumps.length]], x, y: y - 20, vx, vy: -7 - Math.random() * 3, g: 0.35, bounce: 0.2, dodge: 'none', life: 1400, spin: 0.2 });
  }
}

function rainbow(api: BossApi, tx: number, delay: number) {
  // a long stream of coloured sand along one high arc: a rainbow
  const x0 = api.bossX - api.bossW * 0.42;
  const y0 = api.bossTop + api.bossH * 0.32;
  const N = 70;
  const gr = 0.3;
  const yLand = api.floorY - 21;
  const vx = (tx - x0) / N;
  const vy = (yLand - y0 - 0.5 * gr * N * N) / N;
  for (let i = 0; i < 16; i++) {
    api.after(delay + i * 40, () => {
      const s: Shot = {
        frames: [clumps[Math.floor(i / 3) % clumps.length]],
        x: x0,
        y: y0,
        vx,
        vy,
        g: gr,
        dodge: 'none',
        update(sh, _t, a) {
          if (sh.done || sh.y + 21 < a.floorY) return;
          sh.done = true;
          if (i % 3 === 0) a.fx.burst('dust', 4, sh.x + 12, a.floorY - 4, { color: SAND });
        }
      };
      api.spawn(s);
      if (i % 4 === 0) api.sound.note(76 + i, { instrument: 'glock', level: 0.04 });
    });
  }
}

registerBoss({
  id: 'sand-worm',
  scale: 3.5,
  intro: 'rise',
  frames: () => ({
    idle: [worm('half')],
    shut: [worm('shut')],
    wide: [worm('wide')],
    hurt: [worm('x')]
  }),
  pose(t, state, f) {
    const d = dig(t);
    const base = { dx: d.dx, dy: d.dy, alpha: d.alpha };
    if (state === 'hurt' || state === 'dazed' || state === 'dying') return { frame: f.hurt[0], ...base, tilt: 0.05 };
    if (state === 'wind') return { frame: f.wide[0], ...base, dy: base.dy - 2 * U, sy: 1.06, tilt: 0.05 };
    if (state === 'laugh') return { frame: f.wide[0], ...base, sy: 1 + Math.abs(Math.sin(t / 100)) * 0.05 };
    // idle: a slow serpentine sway and a gulp every few seconds
    const gulp = t % 2800 > 2400;
    return { frame: gulp ? f.shut[0] : f.idle[0], ...base, tilt: Math.sin(t / 520) * 0.06, sy: 1 + Math.sin(t / 260) * 0.025 };
  },
  moves: [
    {
      id: 'burrow',
      windup: 400,
      weight: 1.2,
      run(api) {
        const busy = api.t - DIG.at < DIG_TOTAL;
        if (busy) {
          // already underway: just spray sand where it is
          sandSpray(api, api.bossX, api.floorY - 6);
          if (api.aim) api.spawn({ frames: [clumps[2]], x: api.bossX, y: api.floorY - 80, vx: -6, vy: -3, g: 0.2 });
          api.sound.whoosh(0.1, 0.5, 0, 600, 1800);
          return;
        }
        const home = api.bossX;
        const target = api.marbleX + 240 + Math.random() * 90;
        DIG.at = api.t;
        DIG.dx = Math.min(0, target - home);
        DIG.floor = api.floorY - api.ledgeY;
        api.sound.whoosh(0.14, 0.5, 0, 1200, 200);
        api.sound.thump(0.4);
        api.fx.burst('dust', 14, home, api.ledgeY - 6, { color: SAND });
        // a ring warns where it will burst up
        api.after(SINK, () => {
          api.warn(home + DIG.dx, UNDER, () => {
            api.shake(9, 360);
            api.sound.thump(0.9);
            api.sound.whoosh(0.16, 0.6, 0, 200, 1800);
            sandSpray(api, home + DIG.dx, api.floorY - 6);
            if (api.aim) api.spawn({ frames: [clumps[0]], x: home + DIG.dx, y: api.floorY - 80, vx: -6, vy: -3, g: 0.2 });
          }, { kind: 'ring', width: 120, color: SAND });
        });
        // back home later, with a smaller puff
        api.after(DIG_TOTAL - RISE, () => {
          api.sound.thump(0.5);
          api.fx.burst('dust', 12, home, api.ledgeY - 6, { color: SAND });
        });
      }
    },
    {
      id: 'sand-rainbow',
      windup: 620,
      run(api) {
        // a rainbow of sand high over the marble, landing behind it
        api.sound.whoosh(0.12, 0.9, 0, 400, 1600);
        if (api.aim) api.spawn({ frames: [clumps[1]], x: api.bossX - api.bossW * 0.42, y: api.bossTop + api.bossH * 0.32, vx: -6, vy: -2, g: 0.2 });
        rainbow(api, Math.max(10, api.marbleX - 130), 0);
        if (api.phase === 2) rainbow(api, api.marbleX + 170, 500);
      }
    },
    {
      id: 'dune-wave',
      windup: 480,
      run(api) {
        // a slam that sends sand waves rolling along the floor
        const n = api.phase === 2 ? 2 : 1;
        for (let i = 0; i < n; i++) {
          api.after(i * 560, () => {
            api.shake(6, 220);
            api.sound.thump(0.7);
            api.fx.burst('dust', 10, api.bossX - api.bossW * 0.4, api.floorY - 4, { color: SAND });
            api.spawn({ frames: wave, x: api.bossX - api.bossW * 0.5, y: 0, vx: -6.8, onFloor: true, frameMs: 120 });
          });
        }
      }
    },
    {
      id: 'geysers',
      windup: 640,
      phase: 2,
      run(api) {
        // sand geysers burst out of the floor around the marble, never under it
        api.shake(6, 900);
        api.tint(1200, 'rgba(255,190,80,.12)');
        api.sound.thump(0.8);
        const xs: number[] = [];
        for (let i = 0; i < 10 && xs.length < 4; i++) {
          const x = 60 + Math.random() * (api.bossX - api.bossW * 0.5 - 60);
          if (Math.abs(x - api.marbleX) > 90 && xs.every((o) => Math.abs(o - x) > 60)) xs.push(x);
        }
        if (api.aim) xs.unshift(api.marbleX);
        xs.forEach((x, i) => {
          api.warn(x, 520 + i * 160, () => {
            const sw = geyser[0].width * U;
            api.spawn({
              frames: [geyser[0]],
              x: x - sw / 2,
              y: api.floorY - GEY_H * U - U,
              dodge: 'none',
              life: 820,
              update(sh, t) {
                const age = t - (sh.born || 0);
                const k = age < 160 ? age / 160 : age < 520 ? 1 : Math.max(0, 1 - (age - 520) / 300);
                sh.frames = [geyser[Math.min(geyser.length - 1, Math.round(k * (geyser.length - 1)))]];
              }
            });
            api.fx.burst('dust', 10, x, api.floorY - 6, { color: SAND, speed: 1.2 });
            api.sound.whoosh(0.09, 0.4, 0, 300, 1400);
            if (Math.abs(x - api.marbleX) < 50) api.strikeMarble();
          }, { kind: 'ring', width: 70, color: SAND });
        });
      }
    }
  ],
  drawExtra(g, t, api, state: BossState) {
    if (state === 'dying' || state === 'intro') return;
    const d = dig(t);
    const homeX = api.bossX - d.dx;
    // the sand mound that hides its tail while it sinks and rises
    if (d.mound > 0) {
      const groundY = d.dx !== 0 ? api.floorY : api.ledgeY;
      const x = api.bossX;
      const r = api.bossW * 0.4 * (0.7 + d.mound * 0.3);
      pxEllipse(g, x, groundY, r, 6 * U, SAND_D);
      pxEllipse(g, x, groundY - U, r * 0.9, 5 * U, SAND);
      g.fillStyle = SAND_L;
      for (let i = 0; i < 4; i++) g.fillRect(Math.round((x - r * 0.6 + i * r * 0.4) / U) * U, Math.round((groundY - 5 * U) / U) * U, U * 2, U);
      if (Math.random() < 0.3) api.fx.add({ kind: 'dust', x: x + (Math.random() - 0.5) * r * 1.4, y: groundY - 10, vx: (Math.random() - 0.5) * 2, vy: -1.5, color: SAND, life: 0.6 });
    }
    // underground: a rolling bump in the sand shows where it is heading
    const s = t - DIG.at;
    const out = s >= SINK && s < SINK + UNDER;
    const back = s >= DIG_TOTAL - RISE - UNDER && s < DIG_TOTAL - RISE;
    if (out || back) {
      const k = out ? (s - SINK) / UNDER : 1 - (s - (DIG_TOTAL - RISE - UNDER)) / UNDER;
      const x = homeX + DIG.dx * k;
      const y = k < 0.12 ? api.ledgeY : api.floorY;
      pxEllipse(g, x, y - U, 14 * U, 3 * U, SAND_D);
      pxEllipse(g, x, y - 2 * U, 10 * U, 2 * U, SAND);
      if (Math.random() < 0.5) api.fx.add({ kind: 'dust', x, y: y - 4, vx: (Math.random() - 0.5) * 2, vy: -1.2, color: SAND, life: 0.5 });
    }
  }
});
