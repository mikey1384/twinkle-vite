import { makeSprite, disc, rect, line, poly, eyesX, pxEllipse, star, INK, U, W, r3 } from '../../pixel';
import type { Put, Sprite } from '../../pixel';
import { registerBoss } from '../registry';
import type { BossApi, BossState } from '../types';

// Castle of the Academy: a three-headed hydra, every head in a mortarboard.
// Each head has its own element (fire spits bouncing fireballs, ice breathes
// a high frost beam and drops icicles, lightning calls strikes on warning
// columns); they take turns, then blast together. Phase 2: heads doze off one
// by one, tossing their caps in a fireworks burst (graduation-style), until
// only the headmaster's lightning head is left.

const S = 3;
type El = 'fire' | 'ice' | 'bolt';
const ELS: El[] = ['ice', 'bolt', 'fire']; // back to front
// skull centres and neck roots in art px
const HEAD: Record<El, [number, number]> = { fire: [21, 39], bolt: [37, 17], ice: [70, 21] };
const ROOT: Record<El, [number, number]> = { fire: [50, 50], bolt: [57, 44], ice: [70, 44] };
const CTRL: Record<El, [number, number]> = { fire: [34, 54], bolt: [44, 34], ice: [78, 32] };
const DOZE: Record<El, [number, number]> = { fire: [41, 55], bolt: [52, 40], ice: [83, 41] };
const COL: Record<El, { base: string; dark: string; light: string; eye: string; glow: string }> = {
  fire: { base: '#d2532f', dark: '#8e2a22', light: '#ff9a62', eye: '#ffe14a', glow: '#ff7a1f' },
  ice: { base: '#5c9ee0', dark: '#2f5c9a', light: '#b4e2ff', eye: '#e9fbff', glow: '#7fe3ff' },
  bolt: { base: '#7d5bd6', dark: '#47309a', light: '#b59cff', eye: '#fff36a', glow: '#ffe94a' }
};
const GOLD = '#ffcb32';

// ---- per-fight state (reset when the fight builds its frames)
let alive: Record<El, boolean> = { fire: true, ice: true, bolt: true };
let openUntil: Record<El, number> = { fire: 0, ice: 0, bolt: 0 };
let chargeUntil = 0;
let clock = 0;
let p2At = 0;
let lastState: BossState = 'intro';
let bolts: { x: number; at: number }[] = [];
let dropFx: { el: El; at: number }[] = [];

// a curved tube of discs (necks, tail)
function tube(put: Put, a: [number, number], c: [number, number], b: [number, number], r0: number, r1: number, col: string, dark: string) {
  const n = 24;
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    const x = (1 - k) * (1 - k) * a[0] + 2 * (1 - k) * k * c[0] + k * k * b[0];
    const y = (1 - k) * (1 - k) * a[1] + 2 * (1 - k) * k * c[1] + k * k * b[1];
    disc(put, x, y, r0 + (r1 - r0) * k, r0 + (r1 - r0) * k, col, dark);
  }
}

function head(put: Put, el: El, hx: number, hy: number, open: boolean, eyes: 'open' | 'x' | 'glow') {
  const c = COL[el];
  // element crest behind the skull
  if (el === 'fire') {
    poly(put, [[hx + 2, hy - 3], [hx + 8, hy - 12], [hx + 7, hy - 3]], '#ff8c1a');
    poly(put, [[hx + 5, hy - 1], [hx + 13, hy - 8], [hx + 9, hy + 1]], '#ffb43a');
    poly(put, [[hx + 6, hy + 2], [hx + 13, hy + 1], [hx + 7, hy + 5]], '#ff5a1f');
    put(hx + 7, hy - 9, '#fff3b0');
  } else if (el === 'ice') {
    poly(put, [[hx + 2, hy - 3], [hx + 6, hy - 13], [hx + 7, hy - 3]], '#c8f1ff');
    poly(put, [[hx + 6, hy - 1], [hx + 13, hy - 9], [hx + 9, hy + 1]], '#8fd6ff');
    poly(put, [[hx + 7, hy + 2], [hx + 14, hy + 2], [hx + 8, hy + 5]], '#c8f1ff');
    line(put, hx + 4, hy - 4, hx + 6, hy - 11, '#ffffff');
  } else {
    line(put, hx + 3, hy - 4, hx + 7, hy - 9, '#ffe94a', 2);
    line(put, hx + 7, hy - 9, hx + 6, hy - 12, '#ffe94a', 2);
    line(put, hx + 6, hy - 12, hx + 11, hy - 16, '#fff7a8', 2);
    line(put, hx + 7, hy, hx + 12, hy - 3, '#ffe94a', 2);
    line(put, hx + 12, hy - 3, hx + 15, hy - 1, '#fff7a8', 1);
  }
  disc(put, hx, hy, 7.5, 6.5, c.base, c.dark, c.light);
  // snout and jaw
  poly(put, [[hx - 15, hy - 1], [hx - 3, hy - 5], [hx - 1, hy + 3], [hx - 14, hy + 3]], c.base);
  line(put, hx - 14, hy - 1, hx - 4, hy - 4, c.light);
  put(hx - 13, hy - 1, INK);
  put(hx - 12, hy - 2, INK);
  if (open) {
    poly(put, [[hx - 14, hy + 3], [hx - 1, hy + 2], [hx, hy + 7], [hx - 12, hy + 11]], '#3a0d1e');
    poly(put, [[hx - 13, hy + 9], [hx - 1, hy + 6], [hx, hy + 9], [hx - 11, hy + 13]], c.dark);
    rect(put, hx - 10, hy + 5, 6, 3, c.glow);
    rect(put, hx - 9, hy + 6, 3, 1, '#ffffff');
    put(hx - 13, hy + 4, '#fff');
    put(hx - 7, hy + 3, '#fff');
    put(hx - 11, hy + 10, '#fff');
  } else {
    rect(put, hx - 14, hy + 3, 13, 3, c.dark);
    line(put, hx - 14, hy + 3, hx - 2, hy + 3, INK);
    put(hx - 12, hy + 4, '#fff');
    put(hx - 6, hy + 4, '#fff');
  }
  // cheek scales
  put(hx + 2, hy + 2, c.dark);
  put(hx + 4, hy, c.dark);
  put(hx + 3, hy + 4, c.dark);
  if (eyes === 'x') eyesX(put, hx - 6, hy - 4);
  else {
    const e = eyes === 'glow' ? '#ffffff' : c.eye;
    rect(put, hx - 6, hy - 3, 4, 3, e);
    if (eyes === 'glow') rect(put, hx - 7, hy - 3, 1, 3, c.glow);
    rect(put, hx - 5, hy - 3, 1, 3, INK);
    line(put, hx - 8, hy - 6, hx - 1, hy - 4, c.dark);
  }
  if (el === 'bolt') {
    // half-moon spectacles: the headmaster
    rect(put, hx - 8, hy - 1, 6, 1, GOLD);
    put(hx - 8, hy - 2, GOLD);
    put(hx - 3, hy - 2, GOLD);
    line(put, hx - 2, hy - 1, hx + 3, hy - 3, GOLD);
  }
}

function cap(put: Put, hx: number, hy: number, big: boolean, swing: number) {
  const k = big ? 1.35 : 1;
  const cx = hx + 1;
  const top = hy - 7 * k;
  rect(put, cx - 5 * k, top + 1, 10 * k + 1, 3 * k, '#1d1b30');
  rect(put, cx - 5 * k, top + 1, 10 * k + 1, 1, '#3a3660');
  poly(put, [[cx - 11 * k, top], [cx, top - 4 * k], [cx + 11 * k, top], [cx, top + 4 * k]], '#24223b');
  line(put, cx - 11 * k, top, cx, top - 4 * k, '#4a4570');
  put(cx, top, GOLD);
  // the tassel hangs off the front corner
  line(put, cx, top, cx - 9 * k, top + 1, GOLD);
  line(put, cx - 9 * k, top + 1, cx - 9 * k + swing, top + 6 * k, GOLD);
  rect(put, cx - 10 * k + swing, top + 6 * k, 3, 3, '#ffe27a');
}

function hydra(live: Record<El, boolean>, open: Record<El, boolean>, eyes: 'open' | 'x' | 'glow', sway: number) {
  return makeSprite(96, 72, (put) => {
    const B = '#2e7d6b';
    const BD = '#1c4f45';
    const BL = '#59b39a';
    // tail curling up behind
    tube(put, [82, 60], [99, 64], [92, 42], 4, 2, B, BD);
    poly(put, [[89, 41], [94, 33], [96, 42]], '#24264a');
    // feet
    for (const fx of [48, 72]) {
      rect(put, fx, 63, 9, 8, BD);
      for (let k = 0; k < 3; k++) put(fx + k * 3, 71, '#fff');
    }
    disc(put, 64, 55, 25, 15, B, BD, BL);
    // scale arcs
    for (let y = 46; y < 66; y += 5) for (let x = 46 + (y % 2) * 3; x < 86; x += 7) {
      const dx = (x - 64) / 24;
      const dy = (y - 55) / 14;
      if (dx * dx + dy * dy < 0.8) {
        put(x, y, BD);
        put(x + 1, y + 1, BD);
        put(x + 2, y, BD);
      }
    }
    // the headmaster's gown over the back, gold trim
    poly(put, [[54, 42], [86, 44], [91, 62], [78, 57], [66, 60], [58, 52]], '#24264a');
    line(put, 58, 52, 66, 60, GOLD);
    line(put, 66, 60, 78, 57, GOLD);
    line(put, 78, 57, 91, 62, GOLD);
    line(put, 62, 44, 84, 46, '#3a3d70');
    // belly plates and a medal
    disc(put, 50, 60, 11, 7, '#f0deb0', '#cdb27a');
    for (let k = 0; k < 4; k++) line(put, 41 + k * 5, 55 + k, 43 + k * 5, 66, '#cdb27a');
    line(put, 52, 47, 50, 53, '#c0204a');
    line(put, 56, 47, 52, 53, '#418ceb');
    disc(put, 51, 55, 2.6, 2.6, GOLD, '#c99a20', '#fff3b0');
    // necks and heads, back to front; dozing heads lie low without caps
    for (const el of ELS) {
      const c = COL[el];
      if (!live[el]) {
        const [dx, dy] = DOZE[el];
        tube(put, ROOT[el], [(ROOT[el][0] + dx) / 2, ROOT[el][1] - 3], [dx, dy], 4, 3.5, c.base, c.dark);
        disc(put, dx, dy, 5, 4, c.base, c.dark, c.light);
        rect(put, dx - 9, dy, 6, 3, c.base);
        line(put, dx - 4, dy - 1, dx - 1, dy - 1, INK);
        put(dx - 8, dy + 1, INK);
        continue;
      }
      const s = sway * (el === 'bolt' ? -1 : 1);
      const [hx, hy] = HEAD[el];
      tube(put, ROOT[el], CTRL[el], [hx + 4, hy + 4 + s], 5.5, 4, c.base, c.dark);
      // little dorsal fins down the neck
      for (let k = 1; k < 4; k++) {
        const kk = k / 4;
        const nx = (1 - kk) * (1 - kk) * ROOT[el][0] + 2 * (1 - kk) * kk * CTRL[el][0] + kk * kk * (hx + 4);
        const ny = (1 - kk) * (1 - kk) * ROOT[el][1] + 2 * (1 - kk) * kk * CTRL[el][1] + kk * kk * (hy + 4 + s);
        poly(put, [[nx + 2, ny - 4], [nx + 6, ny - 8], [nx + 5, ny - 2]], c.dark);
      }
      head(put, el, hx, hy + s, open[el], eyes);
      cap(put, hx, hy + s, el === 'bolt', sway);
    }
  });
}

const cache = new Map<string, Sprite>();
function frame(open: Record<El, boolean>, eyes: 'open' | 'x' | 'glow', sway: number) {
  const key = ELS.map((e) => `${+alive[e]}${+open[e]}`).join('') + eyes + sway;
  let s = cache.get(key);
  if (!s) {
    s = hydra({ ...alive }, open, eyes, sway);
    cache.set(key, s);
  }
  return s;
}

const fireball = [0, 1].map((f) =>
  makeSprite(14, 12, (put) => {
    poly(put, f ? [[7, 2], [14, 3], [9, 7]] : [[7, 4], [14, 7], [9, 9]], '#ff5a1f');
    disc(put, 6, 6, 5.5, 5.5, '#ff8c00');
    disc(put, 5.5, 5.5, 3.5, 3.5, '#ffd84a');
    put(4, 4, '#fff');
  })
);
const icicle = makeSprite(9, 20, (put) => {
  poly(put, [[0, 0], [9, 0], [4.5, 20]], '#a9dcff');
  line(put, 2, 1, 4, 14, '#ffffff');
  rect(put, 0, 0, 9, 2, '#e9fbff');
});
const iceShard = makeSprite(18, 8, (put) => {
  poly(put, [[0, 4], [6, 0], [18, 2], [18, 6], [6, 8]], '#8fd6ff');
  line(put, 2, 4, 16, 3, '#ffffff');
});
const sparkBall = [0, 1].map((f) =>
  makeSprite(12, 12, (put) => {
    disc(put, 6, 6, 4, 4, '#fff36a');
    put(6, 6, '#fff');
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + (f ? Math.PI / 4 : 0);
      line(put, 6 + Math.cos(a) * 3, 6 + Math.sin(a) * 3, 6 + Math.cos(a) * 6, 6 + Math.sin(a) * 6, '#ffe94a');
    }
  })
);
const capShot = makeSprite(20, 10, (put) => cap(put, 9, 9, false, 0));
const rocket = [0, 1].map((f) =>
  makeSprite(6, 12, (put) => {
    rect(put, 1, 0, 4, 7, '#ff4d6d');
    rect(put, 1, 0, 4, 2, '#ffffff');
    rect(put, 2, 7, 2, 3 + f, '#ffd84a');
    put(2, 11, '#ff8c00');
  })
);
const FIREWORK = ['#ff4d6d', '#ffcb32', '#7fe3ff', '#b59cff', '#7dff9a', '#ffffff'];

// art px → screen px
function at(api: BossApi, ax: number, ay: number): [number, number] {
  return [api.bossX - api.bossW / 2 + (ax + 1) * S, api.bossTop + (ay + 1) * S];
}
const mouth = (api: BossApi, el: El) => at(api, HEAD[el][0] - 12, HEAD[el][1] + 6);
// a head that's dozed off hands its turn to one still awake
const awake = (el: El): El => (alive[el] ? el : alive.ice ? 'ice' : 'bolt');
function away(api: BossApi, n: number, from = 90, to = W * 0.68) {
  const xs: number[] = [];
  for (let i = 0; i < n; i++) xs.push(from + ((to - from) * (i + 0.5)) / n + (Math.random() - 0.5) * 40);
  return xs.filter((x) => Math.abs(x - api.marbleX) > 85);
}

function fireVolley(api: BossApi, n: number) {
  openUntil.fire = clock + 300 + n * 220;
  const [x, y] = mouth(api, 'fire');
  for (let i = 0; i < n; i++) {
    api.after(i * 210, () => {
      api.spawn({
        frames: fireball,
        x: x - 24,
        y: y - 16,
        vx: -5 - i * 0.55,
        vy: -2.6 + i * 0.5,
        g: 0.16,
        bounce: 0.55,
        glow: '#ff7a1f',
        frameMs: 80,
        update(s) {
          if (Math.random() < 0.35) api.fx.burst('ember', 1, s.x + 18, s.y + 16, { speed: 0.3 });
        }
      });
      api.sound.whoosh(0.08, 0.3, 0, 1300, 400);
      api.sound.note(62 - i * 2, { instrument: 'marimba', level: 0.08 });
    });
  }
}

function frostBreath(api: BossApi, icicles: number) {
  openUntil.ice = clock + 900;
  const [x, y] = mouth(api, 'ice');
  api.fx.burst('snow', 22, x, y, { speed: 1.2, dir: Math.PI, spread: 1.2 });
  api.sound.whoosh(0.14, 0.8, 0, 3200, 900);
  api.sound.note(88, { instrument: 'glock', level: 0.06 });
  api.tint(600, 'rgba(140,220,255,.1)');
  // a frost beam high across the hall (duck), shards riding it
  api.beam(api.floorY - 96, 560, { color: '#7fe3ff', height: 12, dodge: 'duck' });
  for (let i = 0; i < 3; i++) {
    api.after(i * 90, () => api.spawn({ frames: [iceShard], x: x - 50, y: api.floorY - 110 + i * 4, vx: -11, dodge: api.aim ? 'none' : 'duck', glow: '#7fe3ff' }));
  }
  const xs = away(api, icicles);
  // (aimed: the beam above already lands the hit)
  xs.forEach((ix, i) => {
    api.warn(ix, 700 + i * 150, () => {
      api.spawn({ frames: [icicle], x: ix - 14, y: -60, vy: 14, dodge: 'none', life: 700 });
      api.after(320, () => {
        api.fx.burst('shard', 8, ix, api.floorY - 8, { color: '#bfe9ff', speed: 0.7 });
        api.sound.note(91 + i, { instrument: 'glock', level: 0.05 });
      });
      if (Math.abs(ix - api.marbleX) < 50) api.strikeMarble();
    }, { kind: 'shadow', width: 54 });
  });
}

function lightning(api: BossApi, n: number) {
  openUntil.bolt = clock + 400 + n * 180;
  api.sound.note(76, { instrument: 'bell', level: 0.06 });
  const xs = away(api, n);
  if (api.aim) xs.unshift(api.marbleX);
  xs.forEach((bx, i) => {
    api.warn(bx, 650 + i * 170, () => {
      bolts.push({ x: bx, at: clock });
      api.flash(70, 'rgba(255,250,200,.35)');
      api.shake(5, 160);
      api.sound.thump(0.7);
      api.sound.note(84 + (i % 3) * 3, { instrument: 'glock', level: 0.06 });
      api.fx.burst('spark', 16, bx, api.floorY - 6, { color: '#fff36a', speed: 1.2 });
      if (Math.abs(bx - api.marbleX) < 50) api.strikeMarble();
      // in phase 2 a strike right of the marble sends a crackle ball rolling
      if (api.phase === 2 && !api.aim && bx > api.marbleX + 140 && i % 2 === 0) {
        api.spawn({ frames: sparkBall, x: bx - 18, y: 0, vx: -5.5, onFloor: true, glow: '#ffe94a', frameMs: 60 });
      }
    }, { kind: 'column', color: '#ffe94a', width: 44 });
  });
}

function triBlast(api: BossApi) {
  const heads = ELS.filter((e) => alive[e]);
  for (const e of heads) openUntil[e] = clock + 1500;
  chargeUntil = clock + 750;
  api.sound.note(43, { instrument: 'pad', level: 0.14, hold: 0.9 });
  heads.forEach((e, i) => api.sound.note(67 + i * 4, { at: 0.1 * i, instrument: 'bell', level: 0.06 }));
  api.after(750, () => {
    const col = heads.length === 3 ? '#ffffff' : COL[heads[heads.length - 1]].glow;
    api.beam(api.floorY - 16, 440, { color: col, height: 15, dodge: 'hop' });
    api.shake(10, 520);
    api.flash(90, 'rgba(255,255,255,.45)');
    api.sound.thump(1.1);
    api.sound.whoosh(0.18, 0.7, 0, 2600, 300);
    for (let k = 0; k < 8; k++) api.fx.burst('spark', 3, 60 + k * 90, api.floorY - 12, { color: COL[heads[k % heads.length]].glow });
    if (api.phase === 2) {
      api.after(700, () => {
        api.beam(api.floorY - 96, 460, { color: COL.bolt.glow, height: 12, dodge: 'duck' });
        api.shake(7, 300);
        api.sound.whoosh(0.14, 0.5, 0, 3000, 600);
      });
    }
  });
}

function launchFirework(api: BossApi, x: number, y: number, color: string) {
  api.spawn({
    frames: rocket,
    x,
    y,
    vx: (Math.random() - 0.5) * 3,
    vy: -9 - Math.random() * 2,
    g: 0.25,
    dodge: 'none',
    frameMs: 60,
    update(s, _t, a) {
      a.fx.add({ kind: 'ember', x: s.x + 9, y: s.y + 34 });
      if ((s.vy || 0) > -1.2) {
        s.done = true;
        a.fx.burst('star', 10, s.x + 9, s.y, { color, speed: 0.9, up: 0.5 });
        a.fx.burst('spark', 22, s.x + 9, s.y, { color, speed: 1.1, up: 0.5 });
        a.sound.note(84 + Math.floor(Math.random() * 8), { instrument: 'glock', level: 0.06 });
        a.sound.thump(0.3);
      }
    }
  });
}

// a head dozes off: cap tossed high, fireworks
function doze(api: BossApi, el: El) {
  if (!alive[el]) return;
  const [hx, hy] = at(api, HEAD[el][0], HEAD[el][1]);
  alive[el] = false;
  dropFx.push({ el, at: clock });
  api.spawn({ frames: [capShot], x: hx - 30, y: hy - 40, vx: -1.5, vy: -10, g: 0.3, spin: 0.3, dodge: 'none', life: 2200 });
  api.fx.burst('star', 18, hx, hy, { color: COL[el].glow, speed: 1.2 });
  api.fx.burst('puff', 10, hx, hy);
  api.flash(110, 'rgba(255,255,255,.4)');
  api.shake(8, 400);
  for (let i = 0; i < 4; i++) api.after(150 + i * 220, () => launchFirework(api, hx - 60 + i * 40, hy, FIREWORK[(i + ELS.indexOf(el)) % FIREWORK.length]));
  [72, 76, 79, 84].forEach((m, i) => api.sound.note(m, { at: i * 0.08, instrument: 'bell', level: 0.08 }));
}

function zigzag(g: CanvasRenderingContext2D, x: number, y0: number, y1: number, seed: number, w: number) {
  let px = x;
  let py = y0;
  const steps = 9;
  for (let i = 1; i <= steps; i++) {
    const ny = y0 + ((y1 - y0) * i) / steps;
    const nx = x + (i === steps ? 0 : Math.sin(seed * 7.3 + i * 2.1) * 18);
    const n = Math.max(1, Math.ceil(Math.abs(ny - py) / U));
    for (let k = 0; k <= n; k++) g.fillRect(r3(px + ((nx - px) * k) / n - w / 2), r3(py + ((ny - py) * k) / n), w, U);
    px = nx;
    py = ny;
  }
}

registerBoss({
  id: 'headmaster-hydra',
  scale: S,
  intro: 'rise',
  frames() {
    alive = { fire: true, ice: true, bolt: true };
    openUntil = { fire: 0, ice: 0, bolt: 0 };
    chargeUntil = 0;
    p2At = 0;
    lastState = 'intro';
    bolts = [];
    dropFx = [];
    cache.clear();
    const shut = { fire: false, ice: false, bolt: false };
    return { idle: [frame(shut, 'open', 0)] };
  },
  pose(t, state) {
    const open: Record<El, boolean> = { fire: t < openUntil.fire, ice: t < openUntil.ice, bolt: t < openUntil.bolt };
    const eyes = p2At ? 'glow' : 'open';
    if (state === 'hurt' || state === 'dazed' || state === 'dying') {
      return { frame: frame({ fire: false, ice: false, bolt: false }, 'x', 0), dx: state === 'hurt' ? 2 * U : 0 };
    }
    if (state === 'wind') return { frame: frame({ fire: true, ice: true, bolt: true }, eyes, 1), dy: -2 * U };
    if (state === 'laugh') return { frame: frame({ fire: true, ice: true, bolt: true }, eyes, Math.floor(t / 120) % 2) };
    const sway = Math.floor(t / 460) % 2;
    return { frame: frame(open, eyes, sway), dy: Math.floor(t / 700) % 2 ? U : 0 };
  },
  moves: [
    {
      id: 'fire-volley',
      windup: 480,
      run(api) {
        const el = awake('fire');
        if (el === 'fire') fireVolley(api, api.phase === 2 ? 4 : 3);
        else if (el === 'ice') frostBreath(api, 3);
        else lightning(api, 4);
      }
    },
    {
      id: 'frost-breath',
      windup: 560,
      run(api) {
        if (awake('ice') === 'ice') frostBreath(api, api.phase === 2 ? 4 : 3);
        else lightning(api, 4);
      }
    },
    {
      id: 'lightning-call',
      windup: 620,
      run(api) {
        lightning(api, api.phase === 2 ? 5 : 3);
      }
    },
    {
      id: 'roll-call',
      windup: 500,
      phase: 1,
      weight: 1.2,
      run(api) {
        // the heads attack in turn, front to back
        fireVolley(api, 1);
        api.after(800, () => frostBreath(api, 0));
        api.after(1600, () => lightning(api, 2));
      }
    },
    {
      id: 'tri-blast',
      windup: 760,
      weight: 0.9,
      run(api) {
        triBlast(api);
      }
    },
    {
      id: 'cap-toss',
      windup: 600,
      phase: 2,
      weight: 1.1,
      run(api) {
        // the headmaster flings mortarboards like boomerangs (duck), then
        // fireworks pop over the hall
        openUntil.bolt = clock + 900;
        const [x, y] = mouth(api, 'bolt');
        for (let i = 0; i < 3; i++) {
          api.after(i * 260, () => {
            api.spawn({
              frames: [capShot],
              x: x - 40,
              y: Math.min(y, api.floorY - 140),
              vx: -9,
              vy: 0,
              spin: 0.4,
              dodge: 'duck',
              update(s) {
                // dip to head height, then curve back home
                s.y += (api.floorY - 112 - s.y) * 0.06;
                s.vx = (s.vx || 0) + 0.17;
                if ((s.vx || 0) > 0 && s.x > api.bossX - 60) s.done = true;
              }
            });
            api.sound.whoosh(0.08, 0.4, 0, 2400, 900);
          });
        }
        for (let i = 0; i < 3; i++) api.after(900 + i * 240, () => launchFirework(api, 180 + Math.random() * 420, api.floorY - 40, FIREWORK[i * 2]));
      }
    }
  ],
  drawExtra(g, t, api, state) {
    clock = t;
    // phase 2 starts: the fire head dozes off; the next hit sends the ice head
    if (api.phase === 2 && !p2At && state !== 'dying') {
      p2At = t;
      doze(api, 'fire');
    }
    if (state === 'hurt' && lastState !== 'hurt' && p2At && t - p2At > 400) doze(api, 'ice');
    lastState = state;
    if (state === 'dying' || state === 'intro') {
      if (state === 'intro') {
        // a golden graduation glow rising behind it
        g.globalCompositeOperation = 'lighter';
        g.globalAlpha = 0.25 + Math.sin(t / 200) * 0.08;
        pxEllipse(g, api.bossX, api.bossTop + api.bossH * 0.5, api.bossW * 0.6, api.bossH * 0.55, '#ffcb32');
        g.globalAlpha = 1;
        g.globalCompositeOperation = 'source-over';
      }
    }
    const sway = state === 'idle' ? (Math.floor(t / 460) % 2) : 0;
    // element auras per waking head
    g.globalCompositeOperation = 'lighter';
    for (const el of ELS) {
      if (!alive[el] || state === 'dying') continue;
      const [hx, hy] = at(api, HEAD[el][0], HEAD[el][1] + sway * (el === 'bolt' ? -1 : 1));
      const c = COL[el];
      g.globalAlpha = (p2At ? 0.3 : 0.18) + Math.sin(t / 240 + hx) * 0.06;
      pxEllipse(g, hx - 6, hy, 30, 24, c.glow);
      g.globalAlpha = 1;
      if (el === 'fire') {
        for (let i = 0; i < 5; i++) {
          const k = (t / 700 + i / 5) % 1;
          g.globalAlpha = 1 - k;
          g.fillStyle = k < 0.4 ? '#ffd84a' : '#ff6a2a';
          g.fillRect(r3(hx + 18 + Math.sin(t / 150 + i * 2) * 6), r3(hy - 10 - k * 46), U, U);
        }
      } else if (el === 'ice') {
        for (let i = 0; i < 3; i++) {
          const a = t / 900 + (i * Math.PI * 2) / 3;
          g.globalAlpha = 0.7;
          g.fillStyle = '#e9fbff';
          star(g, hx + Math.cos(a) * 40, hy + Math.sin(a) * 22, 5);
        }
      } else if (Math.floor(t / 90) % 3 !== 0) {
        g.globalAlpha = 0.9;
        g.fillStyle = '#fff36a';
        zigzag(g, hx + 24 + ((t / 90) % 3) * 6, hy - 42, hy - 6, Math.floor(t / 90), U);
      }
      // charging orbs at each mouth before the joint blast
      if (t < chargeUntil || state === 'wind') {
        const [mx, my] = mouth(api, el);
        const k = t < chargeUntil ? 1 - (chargeUntil - t) / 750 : 0.4;
        g.globalAlpha = 0.6;
        pxEllipse(g, mx, my, 9 + k * 18, 9 + k * 18, c.glow);
        g.globalAlpha = 1;
        pxEllipse(g, mx, my, 3 + k * 8, 3 + k * 8, '#ffffff');
        if (t < chargeUntil) {
          g.globalAlpha = 0.5;
          g.fillStyle = c.glow;
          const tx = api.bossX - api.bossW * 0.75;
          const ty = api.floorY - 16;
          for (let s = 0; s < 12; s++) {
            const q = ((s / 12 + t / 400) % 1) * k;
            g.fillRect(r3(mx + (tx - mx) * q), r3(my + (ty - my) * q), U * 2, U * 2);
          }
        }
      }
      // phase 2: eyes blaze
      if (p2At) {
        const [ex, ey] = at(api, HEAD[el][0] - 4, HEAD[el][1] - 2 + sway * (el === 'bolt' ? -1 : 1));
        g.globalAlpha = 0.5 + Math.sin(t / 90) * 0.3;
        pxEllipse(g, ex, ey, 12, 6, c.glow);
      }
      g.globalAlpha = 1;
    }
    // lightning strikes
    for (const b of bolts) {
      const k = (t - b.at) / 240;
      if (k > 1) continue;
      g.globalAlpha = 1 - k;
      g.fillStyle = '#ffe94a';
      zigzag(g, b.x, -10, api.floorY, b.at, U * 4);
      g.fillStyle = '#ffffff';
      zigzag(g, b.x, -10, api.floorY, b.at, U * 2);
      pxEllipse(g, b.x, api.floorY - U, 50 * (0.5 + k), U * 3, '#fff36a');
    }
    bolts = bolts.filter((b) => t - b.at < 260);
    // a halo where a head just dozed off
    for (const d of dropFx) {
      const k = (t - d.at) / 900;
      if (k > 1) continue;
      const [hx, hy] = at(api, HEAD[d.el][0], HEAD[d.el][1]);
      g.globalAlpha = 1 - k;
      g.fillStyle = COL[d.el].glow;
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        g.fillRect(r3(hx + Math.cos(a) * k * 110) - U, r3(hy + Math.sin(a) * k * 80) - U, U * 2, U * 2);
      }
    }
    dropFx = dropFx.filter((d) => t - d.at < 900);
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    // dozing heads breathe little bubbles
    for (const el of ['fire', 'ice'] as El[]) {
      if (alive[el] || state === 'dying') continue;
      const [dx, dy] = at(api, DOZE[el][0] - 8, DOZE[el][1] - 4);
      const k = (t / 1400 + (el === 'ice' ? 0.5 : 0)) % 1;
      g.globalAlpha = 1 - k;
      g.fillStyle = INK;
      const r = r3(3 + k * 6);
      g.fillRect(r3(dx - 6 - k * 14) - r, r3(dy - k * 40) - r, r * 2, r * 2);
      g.fillStyle = '#e9fbff';
      g.fillRect(r3(dx - 6 - k * 14) - r + U, r3(dy - k * 40) - r + U, r * 2 - U * 2, r * 2 - U * 2);
      g.globalAlpha = 1;
    }
  }
});

