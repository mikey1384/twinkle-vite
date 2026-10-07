import { makeSprite, disc, rect, line, poly, eyesX, ring, pxEllipse, INK, U, W, r3, type Put, type Sprite } from '../../pixel';
import { registerBoss } from '../registry';
import type { BossApi } from '../types';

// Fort 1 of the Logic Tower: a brass clockwork spider hanging on a silver
// thread, a ticking clock face on its back. A laser grid sweeps high and low
// (duck, hop, duck...), gear bombs roll in, and it scuttles up off screen to
// drop in on a new spot with a slam. Phase 2: a red alarm beacon spins, its
// eyes fire a sweeping laser and the ceiling sheds gears.

const S = 3;
const BR = '#c9973a';
const BD = '#7d5a1f';
const BL = '#ffe08a';
const CU = '#b8662f';
const CUD = '#7a3d1a';
const ST = '#4a4f63';
const STD = '#2c3040';

// ---- per-fight state
let clock = 0;
let drop: { start: number; dx: number; landed: boolean } | null = null;
let lasers: { y: number; at: number; until: number; color: string }[] = [];
let sweep: { at: number; dur: number; from: number; to: number } | null = null;
let alarmAt = 0;

function leg(put: Put, ax: number, ay: number, kx: number, ky: number, tx: number, ty: number, col: string, dark: string) {
  line(put, ax, ay, kx, ky, col, 2);
  line(put, kx, ky, tx, ty, col, 2);
  line(put, kx, ky + 1, tx, ty + 1, dark);
  disc(put, kx + 0.5, ky + 0.5, 2, 2, dark);
  put(kx, ky, BL);
  rect(put, tx - 1, ty, 3, 2, STD);
}

function spider(pose: 'a' | 'b' | 'wind', eyes: 'open' | 'x' | 'glow', hand: number) {
  return makeSprite(94, 58, (put) => {
    const up = pose === 'wind' ? -6 : 0;
    const tw = pose === 'b' ? 1 : 0;
    // far legs (darker), behind the body
    const far: [number, number, number, number, number, number][] = [
      [34, 34, 18, 8 + tw, 2, 40],
      [40, 34, 30, 4, 18, 50],
      [48, 34, 62, 4 - tw, 76, 52],
      [54, 34, 78, 10, 92, 44]
    ];
    for (const [ax, ay, kx, ky, tx, ty] of far) leg(put, ax, ay, kx, ky, tx, ty, BD, STD);
    // the wind-up key at the back
    rect(put, 84, 22, 4, 6, BD);
    disc(put, 90, 20, 3, 4, BR, BD);
    disc(put, 90, 30, 3, 4, BR, BD);
    rect(put, 88, 24, 4, 2, BL);
    // abdomen: a brass sphere with a clock face
    disc(put, 66, 26, 20, 18, BR, BD, BL);
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      put(66 + Math.round(Math.cos(a) * 17), 26 + Math.round(Math.sin(a) * 15.5), k % 2 ? BD : BL);
    }
    disc(put, 66, 26, 12, 12, '#f3e6c0', '#d9c48f');
    ring(put, 66, 26, 12, BD, 40);
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      put(66 + Math.round(Math.cos(a) * 10), 26 + Math.round(Math.sin(a) * 10), k % 3 ? BD : '#c0204a');
    }
    const ha = hand * Math.PI * 2 - Math.PI / 2;
    line(put, 66, 26, 66 + Math.cos(ha) * 8, 26 + Math.sin(ha) * 8, INK);
    const ma = hand * Math.PI * 24 - Math.PI / 2;
    line(put, 66, 26, 66 + Math.cos(ma) * 6, 26 + Math.sin(ma) * 6, '#c0204a');
    put(66, 26, BL);
    // spinneret ring where the thread attaches
    rect(put, 62, 5, 8, 3, ST);
    rect(put, 63, 4, 6, 1, '#9aa3bd');
    // thorax: copper plates and a little gear
    disc(put, 40, 32, 13, 10, CU, CUD, '#e39a5f');
    line(put, 31, 28, 49, 28, CUD);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      put(42 + Math.round(Math.cos(a) * 4), 35 + Math.round(Math.sin(a) * 4), BL);
    }
    disc(put, 42, 35, 2.5, 2.5, BD);
    for (const x of [33, 38, 46]) put(x, 30, BL);
    // head: steel with six eyes
    disc(put, 24, 33, 10, 9, ST, STD, '#7b84a3');
    poly(put, [[15, 39], [11, 45], [17, 43]], BR);
    poly(put, [[21, 41], [18, 47], [24, 44]], BR);
    if (eyes === 'x') {
      eyesX(put, 15, 28);
      eyesX(put, 23, 28);
    } else {
      const e = eyes === 'glow' ? '#ff3c5a' : '#ff6a3a';
      const s = eyes === 'glow' ? '#ffd0d8' : '#ffe08a';
      rect(put, 15, 28, 4, 4, e);
      rect(put, 23, 28, 4, 4, e);
      put(15, 28, s);
      put(23, 28, s);
      for (const [x, y] of [[13, 34], [19, 25], [27, 25], [21, 34]]) {
        rect(put, x, y, 2, 2, eyes === 'glow' ? '#ff3c5a' : '#6ff0ff');
      }
      line(put, 14, 26, 27, 24, STD);
    }
    // near legs (bright), in front
    const near: [number, number, number, number, number, number][] = [
      [32, 38, 14, 14 + up - tw, 0, 52 + up],
      [38, 40, 24, 16 - tw, 10, 56],
      [48, 40, 60, 14 + tw, 72, 56],
      [54, 38, 74, 18, 86, 54]
    ];
    for (const [ax, ay, kx, ky, tx, ty] of near) leg(put, ax, ay, kx, ky, tx, ty, BR, BD);
  });
}

const gearBomb = [0, 1].map((f) =>
  makeSprite(16, 16, (put) => {
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      rect(put, 7 + Math.round(Math.cos(a) * 7), 7 + Math.round(Math.sin(a) * 7), 2, 2, BD);
    }
    disc(put, 8, 8, 6, 6, BR, BD, BL);
    disc(put, 8, 8, 2.5, 2.5, f ? '#ff3c5a' : '#7a1a2a');
    if (f) put(7, 7, '#fff');
  })
);
const bigGear = makeSprite(24, 24, (put) => {
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    rect(put, 11 + Math.round(Math.cos(a) * 11), 11 + Math.round(Math.sin(a) * 11), 3, 3, BD);
  }
  disc(put, 12, 12, 10, 10, BR, BD, BL);
  disc(put, 12, 12, 6, 6, BD);
  for (let k = 0; k < 4; k++) line(put, 12, 12, 12 + Math.cos((k * Math.PI) / 2) * 6, 12 + Math.sin((k * Math.PI) / 2) * 6, BR, 2);
  disc(put, 12, 12, 2, 2, ST);
});
const shock = [0, 1].map((f) =>
  makeSprite(20, 12, (put) => {
    poly(put, [[0, 12], [6 - f, 2], [10, 7], [14 + f, 0], [20, 12]], '#ff6a3a');
    poly(put, [[4, 12], [8, 6], [11, 9], [15, 4], [17, 12]], '#ffe08a');
  })
);

const frameCache = new Map<string, Sprite>();
function frame(pose: 'a' | 'b' | 'wind', eyes: 'open' | 'x' | 'glow', hand: number) {
  const key = pose + eyes + hand;
  let s = frameCache.get(key);
  if (!s) {
    s = spider(pose, eyes, hand / 12);
    frameCache.set(key, s);
  }
  return s;
}

function at(api: BossApi, ax: number, ay: number): [number, number] {
  return [api.bossX - api.bossW / 2 + (ax + 1) * S, api.bossTop + (ay + 1) * S];
}
function away(api: BossApi, n: number, from = 90, to = W * 0.66) {
  const xs: number[] = [];
  for (let i = 0; i < n; i++) xs.push(from + ((to - from) * (i + 0.5)) / n + (Math.random() - 0.5) * 40);
  return xs.filter((x) => Math.abs(x - api.marbleX) > 85);
}

// drop-in timeline (ms): climb 0-450, gone, fall 950-1150, sit, climb
// 1750-2150, fall home 2150-2450
const CLIMB = 340;
function dropOffset(t: number): { dx: number; dy: number } | null {
  if (!drop) return null;
  const e = t - drop.start;
  if (e > 2450) {
    drop = null;
    return null;
  }
  const ease = (k: number) => k * k;
  if (e < 450) return { dx: 0, dy: -ease(e / 450) * CLIMB };
  if (e < 950) return { dx: drop.dx, dy: -CLIMB };
  if (e < 1150) return { dx: drop.dx, dy: -(1 - ease((e - 950) / 200)) * CLIMB };
  if (e < 1750) return { dx: drop.dx, dy: Math.sin((e - 1150) / 60) * U };
  if (e < 2150) return { dx: drop.dx, dy: -ease((e - 1750) / 400) * CLIMB };
  return { dx: 0, dy: -(1 - ease((e - 2150) / 300)) * CLIMB };
}

function laserGrid(api: BossApi, n: number, gap: number) {
  api.sound.note(81, { instrument: 'glock', level: 0.06 });
  for (let i = 0; i < n; i++) {
    api.after(i * gap, () => {
      const low = i % 2 === 0;
      const y = low ? api.floorY - 15 : api.floorY - 96;
      const ms = low ? 400 : 520;
      const color = low ? '#ff3c5a' : '#6ff0ff';
      api.beam(y, ms, { color, height: low ? 13 : 11, dodge: low ? 'hop' : 'duck' });
      lasers.push({ y, at: clock, until: clock + ms, color });
      api.sound.whoosh(0.09, 0.35, 0, low ? 1400 : 3400, low ? 700 : 2200);
      api.sound.note(low ? 69 : 81, { instrument: 'bell', level: 0.05 });
      api.shake(3, 140);
    });
  }
}

function lobGears(api: BossApi, n: number, fromX: number, fromY: number) {
  for (let i = 0; i < n; i++) {
    api.after(i * 230, () => {
      api.spawn({
        frames: gearBomb,
        x: fromX,
        y: fromY,
        vx: -4.6 - i * 0.6,
        vy: -4 + i * 0.6,
        g: 0.2,
        bounce: 0.45,
        spin: -0.25,
        frameMs: 120,
        update(s, _t, a) {
          // they tick across and pop against the far wall
          if (s.x < 24) {
            s.done = true;
            a.fx.burst('spark', 14, s.x + 24, s.y + 24, { color: '#ffb43a' });
            a.fx.burst('puff', 4, s.x + 24, s.y + 24);
            a.sound.thump(0.4);
          }
        }
      });
      api.sound.note(76 + i * 2, { instrument: 'marimba', level: 0.07 });
    });
  }
}

registerBoss({
  id: 'clockwork-spider',
  scale: S,
  hover: 40,
  intro: 'drop',
  frames() {
    clock = 0;
    drop = null;
    lasers = [];
    sweep = null;
    alarmAt = 0;
    return { idle: [frame('a', 'open', 0)] };
  },
  pose(t, state) {
    const hand = Math.floor(t / 1000) % 12;
    const glow = alarmAt ? 'glow' : 'open';
    const d = dropOffset(t);
    if (state === 'hurt' || state === 'dazed' || state === 'dying') {
      // the clock hands spin when it's hit
      return { frame: frame('b', 'x', (hand + Math.floor(t / 60)) % 12), dx: d?.dx, dy: d?.dy, tilt: state === 'hurt' ? 0.08 : 0 };
    }
    if (d) return { frame: frame(Math.floor(t / 80) % 2 ? 'a' : 'b', glow, hand), dx: d.dx, dy: d.dy };
    if (state === 'wind') return { frame: frame('wind', glow, hand), dy: -3 * U, tilt: Math.sin(t / 50) * 0.02 };
    return {
      frame: frame(Math.floor(t / 320) % 2 ? 'a' : 'b', glow, hand),
      dy: Math.round(Math.sin(t / 520) * 2) * U,
      tilt: Math.sin(t / 900) * 0.035
    };
  },
  moves: [
    {
      id: 'laser-grid',
      windup: 560,
      weight: 1.2,
      run(api) {
        laserGrid(api, api.phase === 2 ? 5 : 3, api.phase === 2 ? 560 : 680);
      }
    },
    {
      id: 'gear-bombs',
      windup: 480,
      run(api) {
        const [x, y] = at(api, 20, 40);
        lobGears(api, api.phase === 2 ? 4 : 3, x - 30, y - 20);
      }
    },
    {
      id: 'drop-in',
      windup: 420,
      weight: 0.9,
      run(api) {
        // up the thread and off screen, then down on a new spot (a shadow
        // first), far from the marble; a shockwave runs both ways
        const tx = Math.max(api.marbleX + 300, Math.min(W * 0.55, api.bossX - 220));
        drop = { start: clock, dx: tx - api.bossX, landed: false };
        api.sound.whoosh(0.12, 0.5, 0, 600, 2400);
        [64, 66, 68].forEach((m, i) => api.sound.note(m, { at: 0.1 + i * 0.1, instrument: 'marimba', level: 0.06 }));
        api.warn(tx, 1150, () => {
          api.shake(12, 380);
          api.sound.thump(1.1);
          api.fx.burst('dust', 18, tx, api.floorY - 6);
          api.fx.burst('spark', 12, tx, api.floorY - 6, { color: '#ffe08a' });
          api.spawn({ frames: shock, x: tx - 110, y: 0, vx: -7, onFloor: true, glow: '#ff6a3a', frameMs: 70 });
          api.spawn({ frames: shock, x: tx + 60, y: 0, vx: 7, onFloor: true, glow: '#ff6a3a', frameMs: 70, dodge: 'none' });
          if (api.phase === 2) lobGears(api, 2, tx - 100, api.floorY - 120);
        }, { kind: 'shadow', width: 200 });
      }
    },
    {
      id: 'eye-laser',
      windup: 700,
      phase: 2,
      run(api) {
        // a thin red laser scorches the floor from under the spider toward
        // the marble, stops short, then flares into a full low beam
        const from = api.bossX - api.bossW * 0.3;
        sweep = { at: clock, dur: 900, from, to: api.marbleX + 120 };
        api.sound.whoosh(0.1, 0.9, 0, 3000, 1800);
        api.after(950, () => {
          api.beam(api.floorY - 15, 420, { color: '#ff3c5a', height: 15, dodge: 'hop' });
          lasers.push({ y: api.floorY - 15, at: clock, until: clock + 420, color: '#ff3c5a' });
          api.flash(80, 'rgba(255,60,90,.3)');
          api.shake(8, 300);
          api.sound.thump(0.9);
        });
      }
    },
    {
      id: 'gear-storm',
      windup: 620,
      phase: 2,
      run(api) {
        api.shake(9, 900);
        api.tint(900, 'rgba(255,120,40,.08)');
        api.sound.thump(1);
        const xs = away(api, 5);
        if (api.aim) xs.unshift(api.marbleX);
        xs.forEach((gx, i) => {
          api.warn(gx, 650 + i * 140, () => {
            api.spawn({ frames: gearBomb, x: gx - 24, y: -50, vy: 13, spin: 0.4, dodge: 'none', life: 600 });
            api.after(330, () => {
              api.fx.burst('spark', 10, gx, api.floorY - 6, { color: '#ffb43a' });
              api.sound.note(72 + i, { instrument: 'marimba', level: 0.06 });
            });
            if (Math.abs(gx - api.marbleX) < 50) api.strikeMarble();
          }, { kind: 'shadow', width: 56 });
        });
        if (!api.aim) api.after(1500, () => {
          const [x] = at(api, 20, 40);
          api.spawn({ frames: [bigGear], x: x - 40, y: 0, vx: -6, onFloor: true, spin: -0.3, scale: 4 });
          api.sound.whoosh(0.1, 0.6, 0, 900, 300);
        });
      }
    }
  ],
  drawExtra(g, t, api, state) {
    clock = t;
    if (api.phase === 2 && !alarmAt) alarmAt = t;
    const [ax, ay] = at(api, 66, 4);
    // the silver thread
    if (state !== 'dying') {
      g.fillStyle = '#c8d0e8';
      g.fillRect(r3(ax) - U / 2, -20, U, r3(ay) + 20);
      g.fillStyle = '#ffffff';
      g.globalAlpha = 0.6;
      for (let y = (t / 12) % 24; y < ay; y += 24) g.fillRect(r3(ax) - U / 2, r3(y), U, U);
      g.globalAlpha = 1;
    }
    const [ex, ey] = at(api, 19, 30);
    g.globalCompositeOperation = 'lighter';
    // eyes glow (red in phase 2, always on during wind)
    if (state === 'wind' || alarmAt) {
      g.globalAlpha = 0.45 + Math.sin(t / 70) * 0.25;
      pxEllipse(g, ex, ey, 26, 12, '#ff3c5a');
    }
    // steam puffs from the wind-up key
    for (let i = 0; i < 3; i++) {
      const k = (t / 1100 + i / 3) % 1;
      g.globalAlpha = (1 - k) * 0.35;
      const [kx, ky] = at(api, 90, 24);
      pxEllipse(g, kx + k * 30, ky - k * 50, 6 + k * 12, 6 + k * 12, '#ffffff');
    }
    // laser emitters: a line from the eyes to each beam's start
    for (const l of lasers) {
      if (t > l.until) continue;
      g.globalAlpha = 0.85;
      g.fillStyle = l.color;
      const n = 20;
      const sx = api.bossX - api.bossW * 0.5;
      for (let i = 0; i <= n; i++) g.fillRect(r3(ex + ((sx - ex) * i) / n), r3(ey + ((l.y - ey) * i) / n), U * 2, U * 2);
      pxEllipse(g, ex, ey, 14, 14, '#ffffff');
    }
    lasers = lasers.filter((l) => t < l.until);
    // the sweeping eye laser
    if (sweep) {
      const k = Math.min(1, (t - sweep.at) / sweep.dur);
      const fx = sweep.from + (sweep.to - sweep.from) * (k * k * (3 - 2 * k));
      const fy = api.floorY - U;
      g.globalAlpha = 0.9;
      g.fillStyle = '#ff3c5a';
      const n = 28;
      for (let i = 0; i <= n; i++) g.fillRect(r3(ex + ((fx - ex) * i) / n), r3(ey + ((fy - ey) * i) / n), U, U);
      // the scorch trail
      g.globalAlpha = 0.5;
      g.fillRect(r3(Math.min(fx, sweep.from)), r3(fy - U), r3(Math.abs(sweep.from - fx)), U * 2);
      pxEllipse(g, fx, fy, 12, 6, '#ffd0d8');
      if (Math.random() < 0.6) api.fx.burst('spark', 1, fx, fy - 4, { color: '#ff6a3a', speed: 0.6 });
      if (t - sweep.at > sweep.dur + 100) sweep = null;
    }
    // phase 2: a spinning alarm beacon on its back, the room pulsing red
    if (alarmAt && state !== 'dying') {
      const [bx, by] = at(api, 66, 2);
      const a = t / 260;
      g.globalAlpha = 0.18;
      g.fillStyle = '#ff2d55';
      g.beginPath();
      g.moveTo(bx, by);
      g.lineTo(bx + Math.cos(a - 0.25) * 900, by + Math.sin(a - 0.25) * 900);
      g.lineTo(bx + Math.cos(a + 0.25) * 900, by + Math.sin(a + 0.25) * 900);
      g.closePath();
      g.fill();
      g.globalAlpha = 0.8;
      pxEllipse(g, bx, by - U, 9, 6, Math.floor(t / 180) % 2 ? '#ff2d55' : '#ff9db0');
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    if (alarmAt && state !== 'dying') {
      const [bx, by] = at(api, 66, 2);
      g.fillStyle = STD;
      g.fillRect(r3(bx) - U * 3, r3(by), U * 6, U * 2);
    }
    // sparks off the gears while hurt
    if (state === 'hurt' && Math.random() < 0.5) api.fx.burst('spark', 2, ax + (Math.random() - 0.5) * 80, ay + 60, { color: '#ffe08a' });
  }
});

