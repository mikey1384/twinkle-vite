import { makeSprite, disc, rect, line, poly, eyesX, pxEllipse, seeded, INK, U, W, H, r3, type Put, type Sprite } from '../../pixel';
import { registerBoss } from '../registry';
import type { BossApi, BossState, Shot } from '../types';

// Fort 4 of the Logic Tower: a serpent made of void and stars. Its coils
// rear up on the ledge while the rest of its starry body wraps around the
// whole arena (over the ceiling and down the far wall), slithering. Void
// orbs drift over the marble and pull at it, it spits bouncing stars and
// whips its tail along the floor. Phase 2: the coil tightens, the screen
// glitches, null zones erupt as void pillars, and an event horizon opens
// mid-air, swallows the light, then bursts.

const S = 3;
const VOID = '#170d33';
const VOIDD = '#0b0620';
const VOIDL = '#3d2a80';
const RIM = '#8a5cff';
const STARS = ['#ffffff', '#fff3a8', '#9ff3ff', '#ffc8f0'];

// ---- per-fight state
let clock = 0;
let p2At = 0;
let orbs: Shot[] = [];
let pillars: { x: number; at: number }[] = [];
let horizon: { x: number; y: number; at: number; dur: number } | null = null;
let glitchUntil = 0;
let lastState: BossState = 'intro';

// body pixels get star specks sprinkled over them after drawing
function starry(draw: (body: Put, put: Put) => void, w: number, h: number, seed: string) {
  return makeSprite(w, h, (put) => {
    const mask: [number, number][] = [];
    const body: Put = (x, y, c) => {
      put(x, y, c);
      if (c && c !== INK) mask.push([Math.round(x), Math.round(y)]);
    };
    draw(body, put);
    const rnd = seeded(seed);
    const n = Math.floor(mask.length / 26);
    for (let i = 0; i < n; i++) {
      const [x, y] = mask[Math.floor(rnd() * mask.length)];
      put(x, y, STARS[Math.floor(rnd() * STARS.length)]);
    }
  });
}

function tube(put: Put, a: [number, number], c: [number, number], b: [number, number], r0: number, r1: number) {
  const n = 30;
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    const x = (1 - k) * (1 - k) * a[0] + 2 * (1 - k) * k * c[0] + k * k * b[0];
    const y = (1 - k) * (1 - k) * a[1] + 2 * (1 - k) * k * c[1] + k * k * b[1];
    const r = r0 + (r1 - r0) * k;
    disc(put, x, y, r, r, VOID, VOIDD, VOIDL);
  }
}

function serpent(open: boolean, eyes: 'open' | 'x' | 'glow', sway: number) {
  return starry(
    (put, raw) => {
      const hy = sway;
      // the tail, curling up behind, tipped with a star
      tube(put, [84, 60], [99, 50], [89, 30], 4.5, 1.6);
      // coil pile
      disc(put, 64, 64, 28, 8, VOID, VOIDD, VOIDL);
      line(raw, 40, 60, 88, 60, RIM);
      disc(put, 60, 56, 23, 7, VOID, VOIDD, VOIDL);
      line(raw, 40, 52, 80, 52, RIM);
      disc(put, 66, 49, 17, 6, VOID, VOIDD, VOIDL);
      // neck: an S rising to the head
      tube(put, [60, 48], [80, 24], [42, 24 + hy], 7.5, 5);
      // the hood behind the head, with two ring markings
      disc(put, 41, 22 + hy, 12, 17, VOID, VOIDD, VOIDL);
      for (const yy of [14, 28]) {
        for (let k = 0; k < 12; k++) {
          const a = (k / 12) * Math.PI * 2;
          raw(44 + Math.round(Math.cos(a) * 3), yy + hy + Math.round(Math.sin(a) * 3), '#5fe0ff');
        }
      }
      // belly band down the neck
      for (let k = 0; k < 8; k++) rect(raw, 50 + k * 1.4, 30 + k * 2.4, 3, 1, '#5a3cb0');
      // horns swept back
      line(raw, 28, 15 + hy, 37, 6 + hy, '#d8c8ff', 2);
      line(raw, 37, 6 + hy, 44, 4 + hy, '#d8c8ff');
      line(raw, 31, 18 + hy, 44, 12 + hy, '#b4a0f0', 2);
      // head and snout
      disc(put, 25, 22 + hy, 10, 7.5, VOID, VOIDD, VOIDL);
      poly(put, [[5, 21 + hy], [17, 15 + hy], [22, 28 + hy], [7, 26 + hy]], VOID);
      line(raw, 6, 21 + hy, 17, 16 + hy, RIM);
      raw(8, 21 + hy, '#9ff3ff');
      if (open) {
        poly(raw, [[5, 26 + hy], [22, 27 + hy], [20, 34 + hy], [8, 32 + hy]], '#05020f');
        poly(put, [[7, 31 + hy], [21, 30 + hy], [20, 36 + hy], [9, 35 + hy]], VOID);
        for (const [x, y] of [[10, 28], [14, 29], [17, 28], [12, 30]]) raw(x, y + hy, STARS[(x + y) % 4]);
        raw(9, 27 + hy, '#ffffff');
        raw(18, 27 + hy, '#ffffff');
      } else {
        line(raw, 6, 26 + hy, 21, 27 + hy, RIM);
      }
      if (eyes === 'x') eyesX(raw, 15, 17 + hy, '#d8c8ff');
      else {
        const e = eyes === 'glow' ? '#ff5ac8' : '#9ff3ff';
        rect(raw, 15, 18 + hy, 5, 3, e);
        rect(raw, 16, 18 + hy, 2, 3, '#ffffff');
        line(raw, 13, 16 + hy, 21, 17 + hy, RIM);
      }
      // the tail-tip star
      for (const [dx, dy] of [[0, -3], [0, 3], [-3, 0], [3, 0], [0, -2], [0, 2], [-2, 0], [2, 0], [-1, -1], [1, 1], [1, -1], [-1, 1], [0, 0]]) {
        raw(89 + dx, 28 + dy, dx === 0 && dy === 0 ? '#ffffff' : '#fff3a8');
      }
    },
    96,
    72,
    `null${open}${eyes}${sway}`
  );
}

const cache = new Map<string, Sprite>();
function frame(open: boolean, eyes: 'open' | 'x' | 'glow', sway: number) {
  const key = `${open}${eyes}${sway}`;
  let s = cache.get(key);
  if (!s) {
    s = serpent(open, eyes, sway);
    cache.set(key, s);
  }
  return s;
}

// a body segment of the arena-wide coil
const SEG = starry((put, raw) => {
  disc(put, 8, 8, 8, 8, VOID, VOIDD, VOIDL);
  line(raw, 3, 2, 12, 2, RIM);
}, 16, 16, 'seg');
const SEG2 = starry((put, raw) => {
  disc(put, 8, 8, 8, 8, VOID, VOIDD, VOIDL);
  line(raw, 3, 2, 12, 2, RIM);
}, 16, 16, 'seg2');
const voidOrb = [0, 1].map((f) =>
  makeSprite(18, 18, (put) => {
    disc(put, 9, 9, 8.5, 8.5, f ? '#8a5cff' : '#5fe0ff');
    disc(put, 9, 9, 6.5, 6.5, '#05020f');
    put(6 + f * 4, 7, '#ffffff');
    put(11 - f * 4, 12, '#fff3a8');
  })
);
const starShot = [0, 1].map((f) =>
  makeSprite(14, 14, (put) => {
    const c = f ? '#fff3a8' : '#ffffff';
    poly(put, [[7, 0], [9, 5], [14, 7], [9, 9], [7, 14], [5, 9], [0, 7], [5, 5]], '#ffcb32');
    rect(put, 5, 5, 4, 4, c);
  })
);
const shard = makeSprite(16, 8, (put) => {
  poly(put, [[0, 4], [6, 0], [16, 4], [6, 8]], '#9ff3ff');
  line(put, 2, 4, 14, 4, '#ffffff');
});

function at(api: BossApi, ax: number, ay: number): [number, number] {
  return [api.bossX - api.bossW / 2 + (ax + 1) * S, api.bossTop + (ay + 1) * S];
}

// the coil around the arena: a path from behind the boss, up and over the
// ceiling, down the far wall; tighter (lower, further in) in phase 2
function coilPoint(k: number, t: number, api: BossApi, tight: number): [number, number] {
  const inset = 24 + tight * 26;
  const x0 = api.bossX + api.bossW * 0.3;
  const pts: [number, number][] = [
    [x0, api.ledgeY - 30],
    [W - inset, api.ledgeY - 120],
    [W - inset - 60, inset + 6],
    [W * 0.5, inset - 6 + tight * 10],
    [inset + 40, inset + 10],
    [inset, H * 0.45],
    [inset + 10, api.floorY - 120 + tight * 20]
  ];
  const f = k * (pts.length - 1);
  const i = Math.min(pts.length - 2, Math.floor(f));
  const q = f - i;
  // smooth through the points (Catmull-Rom)
  const p0 = pts[Math.max(0, i - 1)];
  const p1 = pts[i];
  const p2 = pts[i + 1];
  const p3 = pts[Math.min(pts.length - 1, i + 2)];
  const cr = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (-a + c) * q + (2 * a - 5 * b + 4 * c - d) * q * q + (-a + 3 * b - 3 * c + d) * q * q * q);
  const x = cr(p0[0], p1[0], p2[0], p3[0]);
  const y = cr(p0[1], p1[1], p2[1], p3[1]);
  // slither: a travelling wave across the path
  const wv = Math.sin(k * 26 - t / 260) * 9;
  return [x + wv * 0.4, y + wv];
}

function glitch(g: CanvasRenderingContext2D, n: number, mag: number) {
  const c = g.canvas;
  const k = c.width / W;
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  for (let i = 0; i < n; i++) {
    const h = Math.max(2, Math.floor((2 + Math.random() * 14) * k));
    const y = Math.floor(Math.random() * (c.height - h));
    g.drawImage(c, 0, y, c.width, h, Math.round((Math.random() - 0.5) * 2 * mag * k), y, c.width, h);
  }
  // null blocks: little holes of starry void
  for (let i = 0; i < n / 2; i++) {
    const w = Math.floor((10 + Math.random() * 50) * k);
    const h = Math.floor((3 + Math.random() * 8) * k);
    const x = Math.floor(Math.random() * c.width);
    const y = Math.floor(Math.random() * c.height);
    g.fillStyle = VOIDD;
    g.fillRect(x, y, w, h);
    g.fillStyle = '#ffffff';
    g.fillRect(x + Math.floor(w / 3), y + Math.floor(h / 2), Math.ceil(k * 2), Math.ceil(k * 2));
  }
  g.restore();
}

function voidOrbs(api: BossApi, n: number) {
  const [x, y] = at(api, 10, 28);
  for (let i = 0; i < n; i++) {
    api.after(i * 520, () => {
      // drifts over the marble, hangs there pulling (the marble crouches
      // and holds on), then collapses into itself
      let hangAt = 0;
      const hx = api.marbleX - 27 + i * 34;
      const s: Shot = {
        frames: voidOrb,
        x: x - 30,
        y: y - 30,
        vx: -6,
        vy: 0,
        frameMs: 110,
        glow: '#8a5cff',
        update(sh, t, a) {
          if (sh.hit) return;
          sh.vy = (a.floorY - 134 - sh.y) * 0.1;
          if (!hangAt && sh.x <= hx) {
            hangAt = t;
            sh.vx = 0;
          }
          if (hangAt && t - hangAt > 750) {
            sh.done = true;
            a.fx.burst('spark', 18, sh.x + 27, sh.y + 27, { color: '#8a5cff', speed: 1.3 });
            a.fx.burst('sparkle', 5, sh.x + 27, sh.y + 27);
            a.sound.note(45, { instrument: 'pad', level: 0.06, hold: 0.3 });
            a.sound.note(93, { instrument: 'glock', level: 0.04 });
          }
        }
      };
      api.spawn(s);
      orbs.push(s);
      api.sound.whoosh(0.1, 0.8, 0, 400, 1600);
    });
  }
}

registerBoss({
  id: 'null-serpent',
  scale: S,
  intro: 'rise',
  frames() {
    clock = 0;
    p2At = 0;
    orbs = [];
    pillars = [];
    horizon = null;
    glitchUntil = 0;
    lastState = 'intro';
    return { idle: [frame(false, 'open', 0)] };
  },
  pose(t, state) {
    const eyes = p2At ? 'glow' : 'open';
    if (state === 'hurt' || state === 'dazed' || state === 'dying') return { frame: frame(true, 'x', 0), dx: state === 'hurt' ? 3 * U : 0, tilt: state === 'hurt' ? 0.05 : 0 };
    if (state === 'wind') return { frame: frame(true, eyes, 0), dy: -2 * U, sx: 1.02, sy: 1.03 };
    if (state === 'laugh') return { frame: frame(Math.floor(t / 140) % 2 === 0, eyes, 1) };
    // a slow sway of the raised head, the coils breathing
    const sway = Math.round(Math.sin(t / 500));
    return { frame: frame(false, eyes, sway + 1 > 1 ? 1 : 0), dy: Math.round(Math.sin(t / 650) * 2) * U, tilt: Math.sin(t / 900) * 0.025 };
  },
  moves: [
    {
      id: 'void-orbs',
      windup: 560,
      weight: 1.1,
      run(api) {
        voidOrbs(api, api.phase === 2 ? 3 : 2);
      }
    },
    {
      id: 'star-spit',
      windup: 480,
      run(api) {
        const [x, y] = at(api, 10, 28);
        const n = api.phase === 2 ? 6 : 4;
        for (let i = 0; i < n; i++) {
          api.after(i * 120, () => {
            api.spawn({
              frames: starShot,
              x: x - 30,
              y: y - 20,
              vx: -3.6 - i * 0.55,
              vy: -6 + (i % 2) * 2,
              g: 0.24,
              bounce: 0.6,
              spin: 0.2,
              frameMs: 100,
              glow: '#ffcb32',
              update(s, _t, a) {
                if (Math.random() < 0.25) a.fx.add({ kind: 'spark', x: s.x + 21, y: s.y + 21, color: '#fff3a8' });
              }
            });
            api.sound.note(84 + i * 2, { instrument: 'glock', level: 0.05 });
          });
        }
        api.sound.whoosh(0.1, 0.4, 0, 2000, 900);
      }
    },
    {
      id: 'tail-whip',
      windup: 620,
      run(api) {
        // the coil's tail lashes along the floor: a train of starry
        // segments, tipped with a star (hop)
        api.shake(5, 600);
        api.sound.whoosh(0.16, 0.8, 0, 900, 200);
        const n = 5;
        for (let i = 0; i < n; i++) {
          api.after(i * 70, () => {
            api.spawn({
              frames: [i === n - 1 ? starShot[0] : i % 2 ? SEG2 : SEG],
              x: W + 10,
              y: 0,
              vx: -9.5,
              onFloor: true,
              scale: i === n - 1 ? U : U * (1 - i * 0.12),
              glow: i === n - 1 ? '#ffcb32' : undefined
            });
          });
        }
      }
    },
    {
      id: 'null-zones',
      windup: 680,
      phase: 2,
      run(api) {
        // the screen glitches, rings mark null zones, void pillars erupt
        glitchUntil = clock + 500;
        api.sound.note(38, { instrument: 'pad', level: 0.14, hold: 1 });
        api.sound.whoosh(0.08, 0.3, 0, 5000, 3000);
        const xs: number[] = [];
        for (let i = 0; i < 4; i++) xs.push(110 + i * 150 + Math.random() * 40);
        const safe = xs.filter((x) => Math.abs(x - api.marbleX) > 90);
        if (api.aim) safe.unshift(api.marbleX);
        safe.forEach((x, i) => {
          api.warn(x, 750 + i * 160, () => {
            pillars.push({ x, at: clock });
            api.shake(7, 200);
            api.sound.thump(0.7);
            api.sound.note(50 - i, { instrument: 'marimba', level: 0.08 });
            api.fx.burst('spark', 14, x, api.floorY - 10, { color: '#8a5cff', speed: 1.2 });
            glitchUntil = clock + 120;
            if (Math.abs(x - api.marbleX) < 50) api.strikeMarble();
          }, { kind: 'ring', width: 60, color: '#8a5cff' });
        });
      }
    },
    {
      id: 'event-horizon',
      windup: 760,
      phase: 2,
      weight: 0.9,
      run(api) {
        // a hole opens mid-air and drinks the light, then bursts: a wave of
        // shards low along the floor (hop), then high (duck)
        const hx = Math.max(api.marbleX + 230, W * 0.46);
        horizon = { x: hx, y: 120, at: clock, dur: 1500 };
        api.tint(1500, 'rgba(10,0,30,.25)');
        api.sound.note(33, { instrument: 'pad', level: 0.16, hold: 1.4 });
        api.sound.whoosh(0.12, 1.4, 0, 200, 1200);
        api.after(1500, () => {
          api.flash(120, 'rgba(200,170,255,.5)');
          api.shake(12, 500);
          api.sound.thump(1.2);
          for (let i = 0; i < 16; i++) {
            const a = (i / 16) * Math.PI * 2;
            api.fx.add({ kind: 'star', x: hx, y: 120, vx: Math.cos(a) * 6, vy: Math.sin(a) * 6, color: STARS[i % 4] });
          }
          api.spawn({ frames: [shard], x: hx - 24, y: 0, vx: -9, onFloor: true, glow: '#9ff3ff' });
          api.after(500, () => api.spawn({ frames: [shard], x: hx - 24, y: api.floorY - 104, vx: -10, dodge: 'duck', glow: '#9ff3ff' }));
          [72, 79, 84, 91].forEach((m, i) => api.sound.note(m, { at: i * 0.05, instrument: 'bell', level: 0.06 }));
        });
      }
    }
  ],
  drawExtra(g, t, api, state) {
    clock = t;
    if (api.phase === 2 && !p2At) {
      p2At = t;
      glitchUntil = t + 600;
    }
    if (state === 'hurt' && lastState !== 'hurt') {
      glitchUntil = Math.max(glitchUntil, t + 120);
      api.fx.burst('sparkle', 5, api.bossX - api.bossW * 0.3, api.bossTop + api.bossH * 0.3);
    }
    lastState = state;
    g.imageSmoothingEnabled = false;
    // the coil around the arena (it fades in during the intro)
    if (state !== 'dying') {
      const tight = p2At ? Math.min(1, (t - p2At) / 1200) : 0;
      const segs = 46;
      g.globalAlpha = state === 'intro' ? 0.5 : 0.92;
      for (let i = segs - 1; i >= 0; i--) {
        const k = i / segs;
        const [x, y] = coilPoint(k, t, api, tight);
        const sc = (1 - k * 0.6) * (3 + tight);
        const s = i % 2 ? SEG2 : SEG;
        const sz = Math.round(s.width * sc);
        g.drawImage(s, r3(x - sz / 2), r3(y - sz / 2), sz, sz);
      }
      // the tail tip glints
      const [tx, ty] = coilPoint(1, t, api, tight);
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = 0.6 + Math.sin(t / 150) * 0.3;
      pxEllipse(g, tx, ty, 12, 12, '#fff3a8');
      g.globalCompositeOperation = 'source-over';
      g.globalAlpha = 1;
    }
    g.globalCompositeOperation = 'lighter';
    // eyes: a cold glow, a trail in phase 2
    if (state !== 'dying') {
      const [ex, ey] = at(api, 17, 19);
      g.globalAlpha = (p2At || state === 'wind' ? 0.55 : 0.25) + Math.sin(t / 100) * 0.1;
      pxEllipse(g, ex, ey, 22, 9, p2At ? '#ff5ac8' : '#5fe0ff');
      if (p2At) {
        g.globalAlpha = 0.3;
        g.fillStyle = '#ff5ac8';
        for (let i = 1; i < 6; i++) g.fillRect(r3(ex + i * 9), r3(ey + Math.sin(t / 200 - i) * 4), U * 2, U);
      }
    }
    // void orbs: rings of light spiralling in, and a pull line from the
    // marble's floor while they hang over it
    for (const o of orbs) {
      if (o.done) continue;
      const ox = o.x + 27;
      const oy = o.y + 27;
      for (let i = 0; i < 10; i++) {
        const a = t / 160 + (i * Math.PI * 2) / 10;
        const r = 50 - ((t / 9 + i * 13) % 44);
        g.globalAlpha = 0.6;
        g.fillStyle = i % 2 ? '#8a5cff' : '#9ff3ff';
        g.fillRect(r3(ox + Math.cos(a) * r), r3(oy + Math.sin(a) * r * 0.7), U, U);
      }
      if (o.vx === 0) {
        g.globalAlpha = 0.45;
        g.fillStyle = '#8a5cff';
        for (let i = 0; i < 14; i++) {
          const k = ((t / 300 + i / 14) % 1);
          g.fillRect(r3(ox + Math.sin(i * 2.3 + t / 90) * 30 * (1 - k)), r3(api.floorY - 6 + (oy - api.floorY + 6) * k), U, U * 2);
        }
      }
    }
    orbs = orbs.filter((o) => !o.done);
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    // void pillars erupting from the null zones
    for (const p of pillars) {
      const k = (t - p.at) / 600;
      if (k > 1) continue;
      const h = api.floorY * Math.min(1, k * 4);
      const w = 44 * (k < 0.7 ? 1 : (1 - k) / 0.3);
      g.fillStyle = VOIDD;
      g.fillRect(r3(p.x - w / 2), r3(api.floorY - h), r3(w), r3(h));
      g.fillStyle = RIM;
      g.fillRect(r3(p.x - w / 2), r3(api.floorY - h), U, r3(h));
      g.fillRect(r3(p.x + w / 2) - U, r3(api.floorY - h), U, r3(h));
      g.fillStyle = '#ffffff';
      for (let i = 0; i < 6; i++) g.fillRect(r3(p.x - w / 3 + ((i * 37) % Math.max(1, w * 0.66))), r3(api.floorY - ((i * 53 + t / 4) % Math.max(1, h))), U, U);
    }
    pillars = pillars.filter((p) => t - p.at < 600);
    // the event horizon
    if (horizon) {
      const k = (t - horizon.at) / horizon.dur;
      if (k > 1.05) horizon = null;
      else {
        const r = 20 + Math.min(1, k * 3) * 46 * (k > 0.95 ? (1.05 - k) * 10 : 1);
        g.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 36; i++) {
          const a = t / 120 + (i / 36) * Math.PI * 2;
          const rr = r * (1.3 + ((i * 7) % 5) * 0.12);
          g.globalAlpha = 0.5;
          g.fillStyle = i % 3 ? '#8a5cff' : '#ffc8f0';
          g.fillRect(r3(horizon.x + Math.cos(a) * rr), r3(horizon.y + Math.sin(a) * rr * 0.4), U * 2, U);
        }
        // the light of the room streaming in
        for (let i = 0; i < 18; i++) {
          const a = (i / 18) * Math.PI * 2 + i;
          const q = 1 - ((t / 700 + i / 18) % 1);
          g.globalAlpha = 0.7 * (1 - q);
          g.fillStyle = STARS[i % 4];
          g.fillRect(r3(horizon.x + Math.cos(a) * q * 300), r3(horizon.y + Math.sin(a) * q * 160), U, U);
        }
        g.globalCompositeOperation = 'source-over';
        g.globalAlpha = 1;
        pxEllipse(g, horizon.x, horizon.y, r, r * 0.95, '#05020f');
        g.fillStyle = RIM;
        g.globalAlpha = 0.8;
        for (let i = 0; i < 24; i++) {
          const a = (i / 24) * Math.PI * 2;
          g.fillRect(r3(horizon.x + Math.cos(a) * r) - U, r3(horizon.y + Math.sin(a) * r * 0.95) - U, U * 2, U * 2);
        }
        g.globalAlpha = 1;
      }
    }
    // screen glitch
    if (state !== 'dying' && p2At && Math.random() < 0.004) glitchUntil = t + 140;
    if (t < glitchUntil) glitch(g, 8, 20);
  }
});
