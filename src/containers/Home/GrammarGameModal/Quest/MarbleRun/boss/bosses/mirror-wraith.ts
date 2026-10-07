import { makeSprite, disc, line, poly, eyesX, seeded, canvas, drawSprite, pxEllipse, star, r3, U, W, H } from '../../pixel';
import type { Sprite } from '../../pixel';
import { registerBoss } from '../registry';
import type { BossApi, Shot } from '../types';

// Fort 2 of the Passive Glacier: a smug ice spirit with a crystal crown and a
// hand mirror. It splits into reflections that all look alike; only one is
// real, and the fakes' shards crack in mid-air. It fans ice shards, skims a
// frost ray along the floor, and the screen frosts over at the edges. Phase 2
// fills the room with mirrors and drops an icicle curtain.

const SCALE = 3;
const L = '#d6f0ff';
const M = '#93c4ee';
const D = '#5576c4';
const DD = '#2f3f86';
const DEEP = '#141a3d';
const ICE = '#e8fbff';
const CY = '#7ff6ff';
const VI = '#9b7bff';
const SIL = '#cfd3ec';
const GLASS = '#a8d8ff';

function wraith(arms: 'low' | 'up', eyes: 'open' | 'x', sway: number) {
  return makeSprite(60, 64, (put) => {
    const s = sway;
    // back arm, behind the robe
    if (arms === 'up') {
      poly(put, [[42, 32], [47, 30], [54, 16], [50, 15]], D);
      line(put, 50, 15, 49, 11, ICE);
      line(put, 53, 15, 55, 11, ICE);
    } else {
      poly(put, [[42, 32], [48, 33], [55, 46], [50, 47]], D);
      line(put, 50, 47, 49, 51, ICE);
      line(put, 54, 46, 56, 50, ICE);
    }
    // the robe flows down and trails back to the right in tatters
    poly(put, [[12, 30], [46, 28], [53, 42], [59, 52 + s], [53, 61], [47, 56 - s], [41, 63], [35, 57 + s], [29, 63], [23, 57], [17, 61 - s], [14, 46]], M);
    poly(put, [[38, 29], [46, 28], [53, 42], [59, 52 + s], [53, 61], [47, 56 - s], [41, 63], [38, 50]], D);
    line(put, 30, 40, 32, 58, D);
    line(put, 15, 34, 18, 58, VI);
    line(put, 16, 34, 19, 58, '#c7b5ff');
    for (const [x, y] of [[20, 55], [26, 58], [33, 55], [44, 57], [50, 56]]) put(x, y, ICE);
    // hood with a pale rim
    poly(put, [[10, 24], [14, 14], [22, 8], [34, 7], [42, 10], [47, 18], [46, 34], [12, 34]], L);
    poly(put, [[36, 8], [42, 10], [47, 18], [46, 34], [38, 34], [40, 18]], M);
    line(put, 10, 24, 14, 14, ICE);
    line(put, 14, 14, 22, 8, ICE);
    // crystal crown
    poly(put, [[15, 15], [17, 5], [21, 12]], ICE);
    poly(put, [[22, 10], [25, 1], [28, 9]], ICE);
    poly(put, [[29, 8], [33, 2], [36, 9]], ICE);
    poly(put, [[37, 10], [41, 5], [42, 12]], ICE);
    line(put, 17, 7, 18, 11, CY);
    line(put, 25, 3, 25, 8, CY);
    line(put, 33, 4, 33, 8, CY);
    put(41, 7, CY);
    // the empty hood: a deep face with diamond eyes and an icy grin
    disc(put, 20, 23, 7.5, 8.5, DD);
    disc(put, 20.5, 23.5, 6, 7, DEEP);
    if (eyes === 'x') {
      eyesX(put, 14, 20, ICE);
      eyesX(put, 21, 20, ICE);
    } else {
      for (const x of [16, 23]) {
        put(x, 21, ICE);
        put(x - 1, 22, ICE);
        put(x, 22, CY);
        put(x + 1, 22, ICE);
        put(x, 23, ICE);
      }
      for (let i = 0; i < 5; i++) put(17 + i, 27 + (i % 2), M);
    }
    // chest brooch
    poly(put, [[27, 35], [30, 38], [27, 41], [24, 38]], CY);
    put(26, 37, '#fff');
    put(27, 42, VI);
    put(27, 34, VI);
    // front arm and the hand mirror
    if (arms === 'up') {
      poly(put, [[16, 34], [24, 36], [14, 29], [10, 28]], L);
      line(put, 9, 25, 12, 29, SIL, 2);
      disc(put, 13, 30, 2.2, 2, ICE);
      disc(put, 7, 18, 6, 7.5, SIL);
      disc(put, 7, 18, 4.3, 5.8, '#f2feff');
      line(put, 5, 15, 8, 21, CY);
      put(9, 14, '#fff');
    } else {
      poly(put, [[16, 34], [26, 38], [18, 52], [12, 50]], L);
      line(put, 18, 40, 15, 48, M);
      line(put, 9, 50, 13, 53, SIL, 2);
      disc(put, 14, 52, 2.2, 2, ICE);
      disc(put, 7, 43, 6, 7.5, SIL);
      disc(put, 7, 43, 4.3, 5.8, GLASS);
      line(put, 5, 40, 8, 46, ICE);
      put(9, 39, '#fff');
      if (eyes === 'x') {
        line(put, 4, 39, 10, 47, DD);
        line(put, 7, 43, 4, 46, DD);
      }
    }
  });
}

const shardImg = makeSprite(13, 5, (put) => {
  poly(put, [[0, 1], [8, 0], [13, 2], [8, 4], [0, 3]], '#bff4ff');
  line(put, 1, 2, 11, 2, ICE);
  put(12, 2, '#fff');
});
// a reflection's shard: paler, and it never lands
const paleShard = makeSprite(13, 5, (put) => {
  poly(put, [[0, 1], [8, 0], [13, 2], [8, 4], [0, 3]], '#eef6ff');
  line(put, 1, 2, 11, 2, '#c9d6ee');
});
const icicle = [0, 1].map((f) =>
  makeSprite(10, 24, (put) => {
    poly(put, [[0, 0], [10, 0], [5, 24]], '#bfeaff');
    poly(put, [[5, 0], [10, 0], [5, 24]], '#7fc4ec');
    line(put, 3, 1, 5, 14 + f * 4, '#fff');
  })
);

let built: Record<string, Sprite[]> | null = null;
function frames() {
  if (!built) {
    built = {
      idle: [wraith('low', 'open', -1), wraith('low', 'open', 0), wraith('low', 'open', 1)],
      wind: [wraith('up', 'open', 0)],
      hurt: [wraith('low', 'x', 0)]
    };
  }
  return built;
}

// ---- per-fight state (reset at the intro)
interface Mirror {
  at: number;
  until: number;
  real: number;
  slots: [number, number][];
}
let mirror: Mirror | null = null;
let frostAt = -1e9;
let frostPeak = 0;
let angry = false;
let introAt = 0;
let lastIntro = -1e9;
function reset() {
  mirror = null;
  frostAt = -1e9;
  frostPeak = 0;
  angry = false;
}
function frostUp(t: number, peak: number) {
  frostAt = t;
  frostPeak = peak;
}

function mirrorK(t: number) {
  if (!mirror || t < mirror.at || t > mirror.until) return 0;
  return Math.max(0, Math.min(1, (t - mirror.at) / 300, (mirror.until - t) / 300));
}
function realOffset(t: number): [number, number] {
  const k = mirrorK(t);
  if (!k || !mirror) return [0, 0];
  const s = mirror.slots[mirror.real];
  return [r3(s[0] * k), r3(s[1] * k)];
}
// every image (real or not) shimmers the same way, so they can't be told apart
const shimmer = (t: number, i: number) => 0.78 + Math.sin(t / 70 + i * 1.7) * 0.1;

// the screen's frosted rim, painted once at 1/U size
let frostLayer: HTMLCanvasElement | null = null;
function frostImg() {
  if (frostLayer) return frostLayer;
  const w = Math.ceil(W / U);
  const h = Math.ceil(H / U);
  const c = canvas(w, h);
  const p = c.getContext('2d')!;
  const rnd = seeded('mirror-wraith-frost');
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const n = Math.min(x, y, w - 1 - x, h - 1 - y) + rnd() * 7;
      if (n > 13) continue;
      p.fillStyle = n < 4 ? 'rgba(240,252,255,.9)' : n < 8 ? 'rgba(190,235,255,.6)' : 'rgba(150,210,255,.3)';
      p.fillRect(x, y, 1, 1);
    }
  }
  // fern-like crystals grow in from the edges
  p.fillStyle = 'rgba(255,255,255,.85)';
  for (let i = 0; i < 34; i++) {
    const side = i % 4;
    let x = side === 0 ? 0 : side === 1 ? w - 1 : rnd() * w;
    let y = side === 2 ? 0 : side === 3 ? h - 1 : rnd() * h;
    let a = [0, Math.PI, Math.PI / 2, -Math.PI / 2][side] + (rnd() - 0.5) * 0.9;
    const len = 8 + rnd() * 16;
    for (let k = 0; k < len; k++) {
      x += Math.cos(a);
      y += Math.sin(a);
      a += (rnd() - 0.5) * 0.25;
      p.fillRect(Math.round(x), Math.round(y), 1, 1);
      if (k % 3 === 2) {
        for (const b of [-1, 1]) {
          const ba = a + b * 1.05;
          for (let j = 1; j <= Math.max(1, 4 - k / 6); j++) p.fillRect(Math.round(x + Math.cos(ba) * j), Math.round(y + Math.sin(ba) * j), 1, 1);
        }
      }
    }
  }
  frostLayer = c;
  return c;
}

function shardShot(api: BossApi, x: number, y: number, tx: number, ty: number, speed: number, fake: boolean): Shot {
  const d = Math.hypot(tx - x, ty - y) || 1;
  const sw = shardImg.width * SCALE;
  const sh = shardImg.height * SCALE;
  const crackAt = 340 + Math.random() * 220;
  return api.spawn({
    frames: [fake ? paleShard : shardImg],
    x: x - sw / 2,
    y: y - sh / 2,
    vx: ((tx - x) / d) * speed,
    vy: ((ty - y) / d) * speed,
    scale: SCALE,
    // a hair of spin turns on rotated drawing; the angle follows the flight
    spin: 1e-6,
    angle: Math.atan2(ty - y, tx - x),
    dodge: fake ? 'none' : 'hop',
    glow: fake ? undefined : '#7ff6ff',
    update(s, t, a) {
      s.angle = Math.atan2(s.vy || 0, s.vx || 0);
      if (fake && t - (s.born || t) > crackAt) {
        s.done = true;
        a.fx.burst('shard', 6, s.x + sw / 2, s.y + sh / 2, { color: '#eef6ff', speed: 0.5 });
        return;
      }
      if (!s.hit && s.y + sh >= a.floorY) {
        s.done = true;
        a.fx.burst('shard', 5, s.x + sw / 2, a.floorY - 6, { color: '#bff4ff', speed: 0.6 });
      }
    }
  });
}

// split into reflections; only one of them is the boss
function startMirror(api: BossApi, slots: [number, number][], ms: number) {
  const real = Math.floor(Math.random() * slots.length);
  mirror = { at: api.t, until: api.t + ms, real, slots };
  frostUp(api.t, 0.75);
  api.sound.whoosh(0.08, 0.5, 0, 3200, 1200);
  [88, 91, 95, 100].forEach((m, i) => api.sound.note(m, { at: i * 0.06, instrument: 'glock', level: 0.05 }));
  const baseX = api.bossX;
  const baseTop = api.bossTop;
  const marbleX = api.marbleX;
  api.after(820, () => {
    // all of them fire; the real one first (so an aimed shard is its own)
    const order = [real, ...slots.map((_, i) => i).filter((i) => i !== real)];
    order.forEach((i, n) => {
      const [sx, sy] = slots[i];
      const mx = baseX + sx - api.bossW / 2 + 8 * SCALE;
      const my = baseTop + sy + 44 * SCALE;
      api.fx.burst('sparkle', 4, mx, my);
      for (let j = 0; j < (api.phase === 2 ? 3 : 2); j++) {
        shardShot(api, mx, my, marbleX + 90 + j * 70 + n * 26, api.floorY, 7.5, i !== real);
      }
    });
    api.sound.note(84, { instrument: 'bell', level: 0.08 });
    api.sound.whoosh(0.08, 0.35, 0, 2600, 900);
  });
  api.after(ms - 320, () => {
    // the fakes shatter and the real one glides home
    slots.forEach(([sx, sy], i) => {
      if (i === real) return;
      const cx = baseX + sx;
      const cy = baseTop + sy + api.bossH * 0.5;
      api.fx.burst('shard', 14, cx, cy, { color: '#d6f0ff', speed: 0.9 });
      api.fx.burst('sparkle', 5, cx, cy);
    });
    [96, 91, 88, 84].forEach((m, i) => api.sound.note(m, { at: i * 0.05, instrument: 'bell', level: 0.06 }));
  });
}

function icicles(api: BossApi, count: number) {
  // icicles drop around the marble, never on it unless this answers a miss
  const xs = Array.from({ length: count }, (_, i) => 70 + ((i * 151 + 40) % 560)).filter((x) => Math.abs(x - api.marbleX) > 80);
  if (api.aim) xs.unshift(api.marbleX);
  xs.forEach((x, i) => {
    api.warn(x, 620 + i * 140, () => {
      api.spawn({
        frames: icicle,
        x: x - 15,
        y: -80,
        vy: 13,
        dodge: 'none',
        scale: SCALE,
        glow: '#bfeaff',
        update(s, _t, a) {
          // shatters where it meets the floor
          if (s.y + icicle[0].height * SCALE < a.floorY) return;
          s.done = true;
          a.fx.burst('shard', 9, x, a.floorY - 6, { color: '#d6f0ff', speed: 0.7 });
          a.sound.note(91 - (i % 3) * 5, { instrument: 'glock', level: 0.05 });
        }
      });
      if (Math.abs(x - api.marbleX) < 50) api.strikeMarble();
    }, { kind: 'shadow', width: 56, color: '#7fc4ec' });
  });
}

registerBoss({
  id: 'mirror-wraith',
  scale: SCALE,
  hover: 30,
  intro: 'fade',
  frames,
  pose(t, state, f) {
    if (state === 'intro') {
      // it fades in out of the cold air
      // (pose is also asked for 'idle' during the intro, so a gap means a new fight)
      if (t - lastIntro > 1000) {
        reset();
        introAt = t;
      }
      lastIntro = t;
      return { frame: f.idle[1], alpha: Math.min(1, Math.max(0, (t - introAt - 200) / 900)), dy: Math.round(Math.sin(t / 420) * 3) * U };
    }
    const [ox, oy] = realOffset(t);
    const alpha = mirrorK(t) > 0 ? shimmer(t, mirror ? mirror.real : 0) : 1;
    const bob = Math.round(Math.sin(t / 420) * 3) * U;
    if (state === 'hurt' || state === 'dazed' || state === 'dying') return { frame: f.hurt[0], dx: ox, dy: oy, alpha };
    if (state === 'wind') return { frame: f.wind[0], dx: ox, dy: oy + bob - 2 * U, alpha };
    const seq = [0, 1, 2, 1][Math.floor(t / 180) % 4];
    return { frame: f.idle[seq], dx: ox, dy: oy + bob, alpha, tilt: Math.sin(t / 700) * 0.03 };
  },
  moves: [
    {
      id: 'shard-fan',
      windup: 480,
      run(api) {
        // a fan of ice shards from the raised mirror; the low ones shatter on the floor
        const x = api.bossX - api.bossW / 2 + 8 * SCALE;
        const y = api.bossTop + 19 * SCALE;
        const n = api.phase === 2 ? 7 : 5;
        frostUp(api.t, 0.5);
        for (let i = 0; i < n; i++) {
          const a = Math.PI - 0.28 + (i / (n - 1)) * 0.62;
          shardShot(api, x, y, x + Math.cos(a) * 400, y + Math.sin(a) * 400, 7.2, false);
        }
        api.fx.burst('sparkle', 6, x, y);
        api.sound.whoosh(0.09, 0.4, 0, 3000, 1000);
        [86, 90, 93].forEach((m, i) => api.sound.note(m, { at: i * 0.04, instrument: 'glock', level: 0.05 }));
      }
    },
    {
      id: 'reflections',
      windup: 600,
      weight: 1.1,
      run(api) {
        startMirror(api, [[0, 0], [-200, 66], [-390, 54]], 2500);
      }
    },
    {
      id: 'frost-ray',
      windup: 650,
      weight: 0.8,
      run(api) {
        // the mirror catches the light: a ray of frost skims the floor
        frostUp(api.t, 0.9);
        api.beam(api.floorY - 15, 420, { color: '#9ff0ff', height: 12, dodge: 'hop' });
        api.flash(90, 'rgba(220,250,255,.5)');
        api.sound.whoosh(0.13, 0.5, 0, 4000, 1600);
        api.sound.note(79, { instrument: 'pad', level: 0.08, hold: 0.5 });
        for (let i = 0; i < 6; i++) api.fx.burst('snow', 4, 80 + i * 130, api.floorY - 10, { speed: 0.6 });
      }
    },
    {
      id: 'hall-of-mirrors',
      windup: 700,
      phase: 2,
      run(api) {
        api.tint(2600, 'rgba(120,180,255,.10)');
        startMirror(api, [[0, 0], [-150, 76], [-300, 34], [-450, 78]], 2900);
      }
    },
    {
      id: 'icicle-curtain',
      windup: 720,
      phase: 2,
      run(api) {
        frostUp(api.t, 1);
        api.shake(6, 900);
        api.sound.thump(0.7);
        api.sound.note(43, { instrument: 'pad', level: 0.1, hold: 0.8 });
        icicles(api, 6);
      }
    }
  ],
  drawExtra(g, t, api, state) {
    angry = api.phase === 2;
    const f = frames();
    const [ox, oy] = realOffset(t);
    const baseX = api.bossX - ox;
    const baseTop = api.bossTop - oy;
    // the reflections
    const k = mirrorK(t);
    if (mirror && k > 0) {
      const m = mirror;
      m.slots.forEach(([sx, sy], i) => {
        if (i === m.real) return;
        const fr = f.idle[(Math.floor(t / 180) + i) % 3];
        drawSprite(g, fr, baseX + sx * k - (fr.width * SCALE) / 2, baseTop + sy * k, SCALE, { alpha: shimmer(t, i) });
      });
    }
    // snowflakes orbit the spirit
    if (state !== 'dying') {
      for (let i = 0; i < 6; i++) {
        const a = t / (angry ? 600 : 900) + (i * Math.PI * 2) / 6;
        const front = Math.sin(a) > 0;
        g.globalAlpha = front ? 0.95 : 0.45;
        g.fillStyle = i % 2 ? ICE : CY;
        star(g, api.bossX + Math.cos(a) * api.bossW * 0.55, api.bossTop + api.bossH * 0.5 + Math.sin(a) * api.bossH * 0.22, front ? 6 : 4);
      }
      g.globalAlpha = 1;
    }
    // phase 2: violet eyes and cold mist
    if (angry && state !== 'hurt' && state !== 'dazed' && state !== 'dying') {
      g.globalCompositeOperation = 'lighter';
      for (const ax of [16, 23]) {
        const ex = api.bossX - api.bossW / 2 + (ax + 1.5) * SCALE;
        const ey = api.bossTop + 23.5 * SCALE;
        g.globalAlpha = 0.45 + Math.sin(t / 120) * 0.2;
        pxEllipse(g, ex, ey, 12, 9, '#b07bff');
      }
      for (let i = 0; i < 3; i++) {
        const k2 = ((t / 1400 + i / 3) % 1);
        g.globalAlpha = 0.25 * (1 - k2);
        pxEllipse(g, api.bossX + 30 - k2 * 60, api.bossTop + api.bossH + 6 + k2 * 10, 30 + k2 * 30, 9, '#9fc8ff');
      }
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
    }
    // the screen frosts at the edges (always a little; more in moves and phase 2)
    const lvl = Math.max(angry ? 0.5 : 0.24, frostPeak * Math.max(0, 1 - (t - frostAt) / 2600));
    g.globalAlpha = Math.min(1, lvl);
    g.imageSmoothingEnabled = false;
    const fr = frostImg();
    g.drawImage(fr, 0, 0, fr.width * U, fr.height * U);
    g.globalAlpha = 1;
  }
});
