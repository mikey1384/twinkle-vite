import { makeSprite, disc, rect, line, poly, eyesX, canvas, pxEllipse, whiteOf, seeded, U, W, H, r3, type Put, type Sprite } from '../../pixel';
import { registerBoss } from '../registry';
import type { BossApi, BossState } from '../types';

// The final boss, the summit of the Logic Tower: a cosmic crowned titan made
// of dark stone and glowing runes (abstract glyphs, never letters), with
// two great floating hands and a ring of rune shields orbiting it.
//
// Three stages. The engine only knows two phases (phase 2 at half health),
// so this module tracks the third itself (it can't read health directly):
//   stage 1  phase 1: rune lasers (low/high) from charging sigils, rune
//            shields flung from its orbit, pillars of judgement.
//   stage 2  phase 2 begins: the arena turns to SPACE (drawExtra paints a
//            drifting starfield and nebula over the room, then redraws the
//            titan and its own warning marks on top), meteor rain, a black
//            hole that drinks the light and flings debris, a two-handed
//            nova beam.
//   stage 3  the first hit taken in stage 2 (health is then lower still; a
//            fallback starts it 16 s into stage 2 if no hit lands): the crown
//            cracks, the screen pulses like a heartbeat and every attack
//            brings a second one overlapping it; the cataclysm move ends in a
//            huge burst.
// The dramatic intro adds its own presence over the engine's dark screen:
// a beam of light from above, runes converging, the halo and crown igniting.

const S = 3;
const STONE = '#1c1a3a';
const STONED = '#100e26';
const STONEL = '#3a3474';
const GOLD = '#ffcb32';
const GOLDD = '#c99a20';
const RUNE = '#7fe8ff';
const ROBE = '#2a1f5c';
const FURY = '#ff3c8c';

// abstract glyphs (5x5), chosen to read as runes, not letters
const GLYPHS = [
  ['.###.', '#...#', '#.#.#', '#...#', '.###.'],
  ['..#..', '.....', '#...#', '.....', '#####'],
  ['#####', '.#.#.', '..#..', '.#.#.', '#####'],
  ['.....', '.###.', '#.#.#', '.###.', '.....'],
  ['..#..', '.#.#.', '#.#.#', '.#.#.', '..#..'],
  ['#.#.#', '.###.', '##.##', '.###.', '#.#.#']
];
function glyph(put: Put, i: number, x: number, y: number, col: string) {
  GLYPHS[i % GLYPHS.length].forEach((row, j) => {
    for (let k = 0; k < 5; k++) if (row[k] === '#') put(x + k, y + j, col);
  });
}

// ---- per-fight state
let clock = 0;
let stage = 1;
let stage2At = 0;
let stage3At = 0;
let hurtAt = -1e9;
let introAt = 0;
let lastState: BossState = 'intro';
let lastFrame: Sprite | null = null;
let lastTilt = 0;
let handsUpUntil = 0;
let beatAt = 0;
let shieldsGone: number[] = [0, 0, 0, 0]; // per shield: back in orbit at
let emitters: { x: number; y: number; at: number; fire: number; until: number; g: number }[] = [];
let pillars: { x: number; at: number }[] = [];
let marks: { x: number; at: number; until: number; width: number; kind: 'column' | 'shadow' | 'ring'; color: string }[] = [];
let hole: { x: number; y: number; at: number; dur: number } | null = null;
let burstAt = -1e9;

type Eyes = 'open' | 'x' | 'glow' | 'fury';
function titan(hands: 'down' | 'up', eyes: Eyes, cracked: boolean) {
  return makeSprite(100, 72, (put) => {
    const rnd = seeded('sovereign');
    const hy = hands === 'up' ? -12 : 0;
    // the robe trails off into nebula
    poly(put, [[28, 48], [72, 48], [68, 60], [58, 71], [50, 64], [42, 71], [33, 61]], ROBE);
    for (let k = 0; k < 5; k++) line(put, 34 + k * 7, 52, 38 + k * 6, 64 + (k % 2) * 4, '#4a36a0');
    for (let k = 0; k < 14; k++) put(32 + Math.floor(rnd() * 36), 50 + Math.floor(rnd() * 18), rnd() < 0.5 ? '#ffffff' : RUNE);
    // the back hand
    disc(put, 88, 46 + hy, 7, 8, STONED, '#08061a', STONE);
    for (let k = 0; k < 4; k++) rect(put, 90 + k * 2 - 4, 37 + hy, 2, 4, STONED);
    glyph(put, 3, 86, 44 + hy, '#3fa8c0');
    // torso and shoulders
    disc(put, 50, 44, 24, 13, STONE, STONED, STONEL);
    for (const sx of [26, 74]) {
      disc(put, sx, 35, 10, 8, STONEL, STONE, '#5a54a8');
      for (let k = 0; k < 20; k++) {
        const a = (k / 20) * Math.PI * 2;
        put(sx + Math.round(Math.cos(a) * 9), 35 + Math.round(Math.sin(a) * 7), GOLDD);
      }
      glyph(put, sx === 26 ? 4 : 5, sx - 2, 33, RUNE);
    }
    // gold chest trim and the great rune
    line(put, 36, 36, 50, 53, GOLD);
    line(put, 64, 36, 50, 53, GOLD);
    line(put, 37, 37, 50, 52, GOLDD);
    disc(put, 50, 43, 5, 5, '#0a0820');
    glyph(put, 0, 48, 41, cracked ? FURY : RUNE);
    glyph(put, 2, 38, 44, '#4fa0d0');
    glyph(put, 5, 57, 44, '#4fa0d0');
    // neck and head
    rect(put, 44, 28, 12, 6, STONED);
    disc(put, 48, 20, 10, 11, STONE, STONED, STONEL);
    poly(put, [[39, 15], [55, 15], [53, 27], [41, 27]], '#2c2858');
    line(put, 38, 15, 56, 15, GOLD);
    // star eyes, looking left
    if (eyes === 'x') {
      eyesX(put, 39, 17, RUNE);
      eyesX(put, 47, 17, RUNE);
    } else {
      const c = eyes === 'fury' ? FURY : eyes === 'glow' ? '#ffffff' : '#fff3a8';
      for (const ex of [41, 49]) {
        rect(put, ex - 1, 19, 3, 1, c);
        rect(put, ex, 18, 1, 3, c);
        put(ex, 19, eyes === 'open' ? GOLD : '#ffffff');
        if (eyes !== 'open') {
          put(ex - 2, 19, c);
          put(ex + 2, 19, c);
          put(ex, 17, c);
          put(ex, 21, c);
        }
      }
    }
    // a beard of light: rune strokes falling from the jaw
    for (let k = 0; k < 7; k++) {
      const x = 41 + k * 2;
      const len = 4 + ((k * 5) % 4) + (k === 3 ? 4 : 0);
      for (let j = 0; j < len; j++) if ((j + k) % 3) put(x, 27 + j, j % 2 ? RUNE : '#c8f8ff');
    }
    glyph(put, 1, 45, 38, RUNE);
    // the crown
    rect(put, 36, 8, 25, 4, GOLD);
    rect(put, 36, 11, 25, 1, GOLDD);
    const pts: [number, number][] = [[37, 3], [43, 1], [48, -1], [53, 1], [59, 3]];
    for (const [px, py] of pts) poly(put, [[px - 2.5, 8], [px, py + 1], [px + 2.5, 8]], GOLD);
    for (const [px, py] of pts) put(px, py + 2, '#fff3b0');
    const gems = ['#ff5ac8', RUNE, '#ff3c5a', RUNE, '#ff5ac8'];
    pts.forEach(([px], i) => rect(put, px - 1, 9, 2, 2, gems[i]));
    put(48, 2, '#ffffff');
    // the front hand, a rune in its palm
    disc(put, 12, 46 + hy, 7.5, 8.5, STONE, STONED, STONEL);
    for (let k = 0; k < 4; k++) rect(put, 7 + k * 3, 36 + hy, 2, 5, STONE);
    rect(put, 18, 44 + hy, 4, 2, STONE);
    for (let k = 0; k < 4; k++) put(7 + k * 3, 41 + hy, GOLD);
    glyph(put, hands === 'up' ? 5 : 3, 10, 44 + hy, hands === 'up' ? '#ffffff' : RUNE);
    if (cracked) {
      // glowing cracks through the stone and a chipped crown
      line(put, 30, 40, 38, 48, FURY);
      line(put, 38, 48, 36, 54, FURY);
      line(put, 62, 38, 68, 46, FURY);
      line(put, 52, 12, 55, 22, FURY);
      line(put, 55, 22, 53, 27, FURY);
      put(59, 3, null);
      put(59, 4, null);
      put(58, 5, null);
    }
  });
}

const cache = new Map<string, Sprite>();
function frame(hands: 'down' | 'up', eyes: Eyes, cracked: boolean) {
  const key = hands + eyes + cracked;
  let s = cache.get(key);
  if (!s) {
    s = titan(hands, eyes, cracked);
    cache.set(key, s);
  }
  return s;
}

const shields = GLYPHS.map((_, i) =>
  makeSprite(11, 11, (put) => {
    rect(put, 0, 0, 11, 11, GOLDD);
    rect(put, 1, 1, 9, 9, STONE);
    rect(put, 1, 1, 9, 1, STONEL);
    glyph(put, i, 3, 3, RUNE);
  })
);
const sigil = (i: number) =>
  makeSprite(13, 13, (put) => {
    for (let k = 0; k < 28; k++) {
      const a = (k / 28) * Math.PI * 2;
      put(6 + Math.round(Math.cos(a) * 6), 6 + Math.round(Math.sin(a) * 6), GOLD);
    }
    glyph(put, i, 4, 4, '#ffffff');
  }, { outline: false });
const SIGILS = GLYPHS.map((_, i) => sigil(i));
const meteor = [0, 1].map((f) =>
  makeSprite(18, 26, (put) => {
    poly(put, [[4, 0], [14, 0], [12 + f, 12], [6 - f, 12]], '#ff8c3a');
    poly(put, [[7, 2], [11, 2], [10, 12], [8, 12]], '#ffe08a');
    disc(put, 9, 17, 8, 8, '#4a3a6a', '#2a1f40', '#7a68a8');
    glyph(put, 4, 7, 15, RUNE);
  })
);
const debris = makeSprite(12, 10, (put) => {
  disc(put, 6, 5, 6, 5, '#4a3a6a', '#2a1f40', '#7a68a8');
  put(5, 4, RUNE);
});

// the space backdrop, painted once
let SPACE: Sprite | null = null;
function space() {
  if (SPACE) return SPACE;
  const c = canvas(W / U, H / U);
  const p = c.getContext('2d')!;
  const gr = p.createLinearGradient(0, 0, 0, c.height);
  gr.addColorStop(0, '#05030f');
  gr.addColorStop(0.6, '#120a30');
  gr.addColorStop(1, '#241048');
  p.fillStyle = gr;
  p.fillRect(0, 0, c.width, c.height);
  const rnd = seeded('space');
  // nebula: soft blobs of colour (blocky once scaled up)
  const neb = ['rgba(255,90,200,.10)', 'rgba(110,80,255,.12)', 'rgba(80,220,255,.08)'];
  for (let i = 0; i < 26; i++) {
    p.fillStyle = neb[i % 3];
    const x = rnd() * c.width;
    const y = rnd() * c.height * 0.8;
    const r = 8 + rnd() * 26;
    p.beginPath();
    p.ellipse(x, y, r * 1.6, r, rnd() * 3, 0, Math.PI * 2);
    p.fill();
  }
  // a far spiral galaxy
  for (let i = 0; i < 160; i++) {
    const a = i * 0.18;
    const r = i * 0.12;
    p.fillStyle = i % 4 ? 'rgba(255,240,200,.6)' : 'rgba(180,200,255,.8)';
    p.fillRect(Math.round(60 + Math.cos(a) * r * 1.6), Math.round(26 + Math.sin(a) * r * 0.7), 1, 1);
  }
  for (let i = 0; i < 260; i++) {
    const b = rnd();
    p.fillStyle = b < 0.7 ? 'rgba(255,255,255,.55)' : b < 0.85 ? '#9ff3ff' : '#fff3a8';
    p.fillRect(Math.floor(rnd() * c.width), Math.floor(rnd() * c.height), 1, 1);
  }
  SPACE = c;
  return c;
}

function at(api: BossApi, ax: number, ay: number): [number, number] {
  return [api.bossX - api.bossW / 2 + (ax + 1) * S, api.bossTop + (ay + 1) * S];
}
function away(api: BossApi, n: number, from = 90, to = W * 0.66) {
  const xs: number[] = [];
  for (let i = 0; i < n; i++) xs.push(from + ((to - from) * (i + 0.5)) / n + (Math.random() - 0.5) * 40);
  return xs.filter((x) => Math.abs(x - api.marbleX) > 85);
}
// warnings that stay visible over the space backdrop
function mark(api: BossApi, x: number, ms: number, fn: () => void, opts: { width: number; kind: 'column' | 'shadow' | 'ring'; color?: string }) {
  marks.push({ x, at: clock, until: clock + ms, width: opts.width, kind: opts.kind, color: opts.color || '#ff4d6d' });
  api.warn(x, ms, fn, opts);
}

// ---- the moves (functions so stage 3 can overlap them)
function runeLasers(api: BossApi, n: number) {
  const ex = api.bossX - api.bossW * 0.62;
  for (let i = 0; i < n; i++) {
    const low = i % 2 === 0;
    const y = low ? api.floorY - 15 : api.floorY - 98;
    const fire = clock + 450 + i * 620;
    emitters.push({ x: ex - (i % 2) * 30, y, at: clock + i * 620, fire, until: fire + (low ? 400 : 500), g: i });
    api.after(450 + i * 620, () => {
      api.beam(y, low ? 400 : 500, { color: low ? GOLD : RUNE, height: low ? 14 : 12, dodge: low ? 'hop' : 'duck' });
      api.shake(5, 200);
      api.sound.whoosh(0.1, 0.4, 0, low ? 1400 : 3600, low ? 500 : 1800);
      api.sound.note(low ? 62 : 74, { instrument: 'bell', level: 0.06 });
    });
  }
  api.sound.note(86, { instrument: 'glock', level: 0.05 });
}

function shieldVolley(api: BossApi, n: number) {
  handsUpUntil = clock + 700;
  let k = 0;
  for (let i = 0; i < 4 && k < n; i++) {
    if (shieldsGone[i] > clock) continue;
    const idx = i;
    const order = k++;
    shieldsGone[idx] = clock + 2600 + order * 280;
    api.after(order * 280, () => {
      const high = order % 2 === 1;
      const [hx, hy] = at(api, 12, 40);
      api.spawn({
        frames: [shields[idx]],
        x: hx - 18,
        y: hy - 20,
        vx: -9,
        vy: 0,
        spin: 0.35,
        dodge: high ? 'duck' : 'hop',
        glow: RUNE,
        update(s, _t, a) {
          if (s.hit) return;
          s.vy = ((high ? a.floorY - 104 : a.floorY - 36) - s.y) * 0.12;
        }
      });
      api.sound.note(79 + order * 2, { instrument: 'glock', level: 0.05 });
      api.sound.whoosh(0.07, 0.3, 0, 2600, 800);
    });
  }
}

function judgement(api: BossApi, n: number) {
  api.sound.note(55, { instrument: 'pad', level: 0.1, hold: 0.6 });
  const xs = away(api, n);
  if (api.aim) xs.unshift(api.marbleX);
  xs.forEach((x, i) => {
    mark(api, x, 700 + i * 160, () => {
      pillars.push({ x, at: clock });
      api.flash(60, 'rgba(255,240,180,.3)');
      api.shake(6, 180);
      api.sound.thump(0.7);
      api.sound.note(79 + (i % 3) * 4, { instrument: 'bell', level: 0.06 });
      api.fx.burst('spark', 14, x, api.floorY - 6, { color: GOLD, speed: 1.2 });
      if (Math.abs(x - api.marbleX) < 50) api.strikeMarble();
    }, { kind: 'column', width: 46, color: GOLD });
  });
}

function meteors(api: BossApi, n: number) {
  api.shake(8, 1400);
  api.tint(1400, 'rgba(255,120,40,.08)');
  api.sound.thump(1);
  const xs = away(api, n, 70, W * 0.72);
  if (api.aim) xs.unshift(api.marbleX);
  xs.forEach((x, i) => {
    mark(api, x, 700 + i * 170, () => {
      api.spawn({ frames: meteor, x: x - 27, y: -80, vy: 14, dodge: 'none', life: 560, glow: '#ff8c3a', frameMs: 70 });
      api.after(380, () => {
        api.shake(6, 160);
        api.sound.thump(0.6);
        api.fx.burst('ember', 12, x, api.floorY - 6);
        api.fx.burst('spark', 6, x, api.floorY - 6, { color: RUNE });
      });
      if (Math.abs(x - api.marbleX) < 50) api.strikeMarble();
    }, { kind: 'shadow', width: 72 });
  });
}

function blackHole(api: BossApi, dur: number) {
  const hx = Math.max(api.marbleX + 250, W * 0.48);
  hole = { x: hx, y: 130, at: clock, dur };
  api.sound.note(31, { instrument: 'pad', level: 0.16, hold: dur / 1000 });
  api.sound.whoosh(0.12, dur / 1000, 0, 200, 1400);
  // it flings what it can't swallow: debris low (hop), then high (duck)
  for (let i = 0; i < 3; i++) {
    api.after(500 + i * 420, () => {
      const high = i === 1;
      api.spawn({
        frames: [debris],
        x: hx - 20,
        y: 130,
        vx: -7.5,
        vy: 0,
        spin: 0.3,
        dodge: high ? 'duck' : 'hop',
        glow: '#8a5cff',
        update(s, _t, a) {
          if (s.hit) return;
          s.vy = ((high ? a.floorY - 102 : a.floorY - 33) - s.y) * 0.1;
        }
      });
      api.sound.note(48 + i * 3, { instrument: 'marimba', level: 0.08 });
    });
  }
  api.after(dur, () => {
    api.flash(110, 'rgba(220,200,255,.5)');
    api.shake(10, 400);
    api.sound.thump(1.1);
    api.fx.burst('star', 14, hx, 130, { color: '#ffc8f0', speed: 1.3 });
  });
}

function nova(api: BossApi) {
  handsUpUntil = clock + 1300;
  api.sound.note(43, { instrument: 'pad', level: 0.14, hold: 1 });
  [67, 71, 74, 79].forEach((m, i) => api.sound.note(m, { at: i * 0.12, instrument: 'bell', level: 0.05 }));
  const [hx, hy] = at(api, 12, 40);
  emitters.push({ x: hx - 20, y: hy, at: clock, fire: clock + 700, until: clock + 700, g: 5 });
  api.after(700, () => {
    api.beam(api.floorY - 98, 600, { color: '#ffffff', height: 16, dodge: 'duck' });
    api.flash(90, 'rgba(255,255,255,.4)');
    api.shake(11, 600);
    api.sound.thump(1.2);
    api.sound.whoosh(0.18, 0.7, 0, 3400, 600);
  });
  api.after(1450, () => {
    api.beam(api.floorY - 15, 420, { color: '#ff5ac8', height: 15, dodge: 'hop' });
    api.shake(8, 300);
    api.sound.whoosh(0.14, 0.4, 0, 1600, 400);
  });
}

// stage 3: every attack brings a second one overlapping it
function overlap(api: BossApi) {
  if (stage < 3 || api.aim) return;
  const extras = [() => meteors(api, 3), () => runeLasers(api, 2), () => shieldVolley(api, 2), () => judgement(api, 2)];
  api.after(650, extras[Math.floor(Math.random() * extras.length)]);
}

registerBoss({
  id: 'sovereign-of-syntax',
  scale: S,
  hover: 12,
  intro: 'fade',
  frames() {
    clock = 0;
    stage = 1;
    stage2At = 0;
    stage3At = 0;
    hurtAt = -1e9;
    introAt = 0;
    lastState = 'intro';
    handsUpUntil = 0;
    beatAt = 0;
    shieldsGone = [0, 0, 0, 0];
    emitters = [];
    pillars = [];
    marks = [];
    hole = null;
    burstAt = -1e9;
    space();
    return { idle: [frame('down', 'open', false)] };
  },
  pose(t, state) {
    const cracked = stage >= 3;
    const eyes: Eyes = stage >= 3 ? 'fury' : stage === 2 ? 'glow' : 'open';
    let f: Sprite;
    let p: { dx?: number; dy?: number; tilt?: number } = {};
    if (state === 'hurt' || state === 'dazed' || state === 'dying') {
      f = frame('down', 'x', cracked);
      p = { dx: state === 'hurt' ? 3 * U : 0, tilt: state === 'hurt' ? 0.04 : 0 };
    } else if (state === 'wind' || t < handsUpUntil) {
      f = frame('up', stage === 1 ? 'glow' : eyes, cracked);
      p = { dy: -2 * U + (stage >= 3 ? Math.round(Math.random() - 0.5) * U : 0) };
    } else if (state === 'laugh') {
      f = frame('up', eyes, cracked);
      p = { dy: Math.floor(t / 120) % 2 ? -U : 0 };
    } else {
      // a slow, heavy float; in desperation it trembles
      f = frame('down', eyes, cracked);
      p = { dy: Math.round(Math.sin(t / 700) * 3) * U, dx: stage >= 3 ? Math.round(Math.sin(t / 37)) * U : 0 };
    }
    lastFrame = f;
    lastTilt = p.tilt || 0;
    return { frame: f, ...p };
  },
  moves: [
    {
      id: 'rune-lasers',
      windup: 560,
      phase: 1,
      weight: 1.2,
      run(api) {
        runeLasers(api, 3);
      }
    },
    {
      id: 'shield-volley',
      windup: 500,
      phase: 1,
      run(api) {
        shieldVolley(api, 4);
      }
    },
    {
      id: 'judgement',
      windup: 640,
      run(api) {
        judgement(api, api.phase === 2 ? 4 : 3);
        overlap(api);
      }
    },
    {
      id: 'meteor-rain',
      windup: 720,
      phase: 2,
      weight: 1.2,
      run(api) {
        meteors(api, stage >= 3 ? 7 : 5);
        overlap(api);
      }
    },
    {
      id: 'black-hole',
      windup: 760,
      phase: 2,
      run(api) {
        blackHole(api, 1900);
        overlap(api);
      }
    },
    {
      id: 'nova',
      windup: 820,
      phase: 2,
      run(api) {
        nova(api);
        overlap(api);
      }
    },
    {
      id: 'cataclysm',
      windup: 900,
      phase: 2,
      weight: 0.8,
      run(api) {
        // stage 2: lasers under a meteor shower; stage 3: everything at
        // once, then a huge burst
        runeLasers(api, 2);
        api.after(300, () => meteors(api, 4));
        if (stage < 3) return;
        api.after(500, () => shieldVolley(api, 2));
        api.after(700, () => blackHole(api, 1500));
        api.after(2400, () => {
          burstAt = clock;
          api.flash(220, 'rgba(255,255,255,.75)');
          api.shake(16, 800);
          api.sound.thump(1.4);
          [48, 55, 60, 64, 67, 72].forEach((m, i) => api.sound.note(m, { at: i * 0.03, instrument: i < 2 ? 'pad' : 'bell', level: 0.08, hold: 0.8 }));
          const [cx, cy] = at(api, 50, 40);
          for (let i = 0; i < 24; i++) {
            const a = (i / 24) * Math.PI * 2;
            api.fx.add({ kind: 'star', x: cx, y: cy, vx: Math.cos(a) * 8, vy: Math.sin(a) * 8, color: i % 2 ? GOLD : RUNE });
          }
          api.spawn({ frames: [shields[0]], x: cx - 60, y: 0, vx: -9, onFloor: true, spin: 0.4, glow: GOLD });
        });
      }
    }
  ],
  drawExtra(g, t, api, state) {
    clock = t;
    if (!introAt) introAt = t;
    // ---- stage tracking
    if (api.phase === 2 && stage === 1 && state !== 'dying') {
      stage = 2;
      stage2At = t;
      api.flash(240, 'rgba(255,255,255,.7)');
      api.shake(14, 900);
      api.sound.thump(1.3);
      api.sound.note(36, { instrument: 'pad', level: 0.16, hold: 1.6 });
      [60, 67, 72, 79, 84].forEach((m, i) => api.sound.note(m, { at: 0.2 + i * 0.09, instrument: 'bell', level: 0.06 }));
    }
    if (state === 'hurt' && lastState !== 'hurt') hurtAt = t;
    if (stage === 2 && state !== 'dying' && ((hurtAt > stage2At + 300) || t - stage2At > 16000)) {
      stage = 3;
      stage3At = t;
      api.flash(200, 'rgba(255,60,140,.55)');
      api.shake(16, 900);
      api.sound.thump(1.4);
      api.sound.note(34, { instrument: 'pad', level: 0.18, hold: 1.8 });
      api.fx.burst('shard', 24, api.bossX, api.bossTop + 30, { color: GOLD, speed: 1.4 });
    }
    lastState = state;
    g.imageSmoothingEnabled = false;
    const cx = api.bossX;
    const top = api.bossTop;
    const [hcx, hcy] = at(api, 48, 6); // crown centre
    const [bcx, bcy] = at(api, 50, 40); // body centre

    // ---- the arena turns to space (stage 2+): paint it, then put the
    // titan and the warnings back on top
    if (stage >= 2) {
      const k = Math.min(1, (t - stage2At) / 1400);
      const sp = space();
      const drift = ((t / 60) % W);
      g.save();
      g.beginPath();
      g.rect(-40, -40, W + 80, api.floorY + 40);
      g.clip();
      g.globalAlpha = k * 0.94;
      g.drawImage(sp, -drift, 0, W, H);
      g.drawImage(sp, W - drift, 0, W, H);
      // twinkling stars
      g.globalAlpha = k;
      for (let i = 0; i < 30; i++) {
        const tw = Math.sin(t / (200 + i * 17) + i);
        if (tw < 0.3) continue;
        g.fillStyle = i % 3 ? '#ffffff' : '#9ff3ff';
        const sx = r3((i * 131 + t / (30 + (i % 4) * 20)) % W);
        const sy = r3((i * 71) % (api.floorY - 20));
        g.fillRect(sx, sy, U, U);
        if (tw > 0.85) {
          g.fillRect(sx - U, sy, U * 3, U);
          g.fillRect(sx, sy - U, U, U * 3);
        }
      }
      // falling star streaks
      for (let i = 0; i < 3; i++) {
        const q = ((t / 1600 + i * 0.37) % 1);
        if (q > 0.4) continue;
        const sx = ((i * 307) % W) + 200 - q * 900;
        const sy = 20 + i * 40 + q * 260;
        g.globalAlpha = k * (1 - q / 0.4);
        g.fillStyle = '#ffffff';
        for (let j = 0; j < 8; j++) g.fillRect(r3(sx + j * 6), r3(sy - j * 2.6), U, U);
      }
      g.restore();
      // the floor's edge becomes a glowing rune rim
      g.globalAlpha = k;
      g.fillStyle = Math.floor(t / 300) % 2 ? RUNE : '#4fa0d0';
      for (let x = (t / 20) % 36; x < W; x += 36) g.fillRect(r3(x), api.floorY - U, U * 4, U);
      g.globalAlpha = 1;
      // a glowing rune platform under the titan
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = 0.5 * k;
      pxEllipse(g, cx, api.ledgeY + U, api.bossW * 0.45, U * 3, '#8a5cff');
      g.globalCompositeOperation = 'source-over';
      g.globalAlpha = 1;
      // its own warning marks, visible over space
      for (const m of marks) {
        const q = (t - m.at) / (m.until - m.at);
        if (q > 1) continue;
        g.globalAlpha = 0.35 + Math.abs(Math.sin(t / (90 - q * 50))) * 0.45;
        g.fillStyle = m.color;
        if (m.kind === 'column') {
          g.fillRect(r3(m.x - m.width / 2), 0, r3(m.width), api.floorY);
        } else if (m.kind === 'shadow') {
          pxEllipse(g, m.x, api.floorY - U, (m.width / 2) * (0.4 + q * 0.6), U * 3, 'rgba(0,0,0,.6)');
          g.globalAlpha *= 0.6;
          pxEllipse(g, m.x, api.floorY - U, (m.width / 2) * (0.4 + q * 0.6) + U * 2, U * 4, '#ff8c3a');
        }
        g.globalAlpha = 1;
      }
      // the titan, redrawn over the sky (same pose, flash and daze tilt)
      if (lastFrame) {
        const white = t - hurtAt < 120 || (state === 'dying' && Math.floor(t / 70) % 2 === 0);
        const img = white ? whiteOf(lastFrame) : lastFrame;
        g.save();
        g.translate(r3(cx), r3(top + api.bossH));
        const tilt = lastTilt + (state === 'dazed' ? Math.sin(t / 300) * 0.12 : 0);
        if (tilt) g.rotate(tilt);
        g.drawImage(img, Math.round(-api.bossW / 2), Math.round(-api.bossH), Math.round(api.bossW), Math.round(api.bossH));
        g.restore();
      }
    }
    marks = marks.filter((m) => t < m.until);

    // ---- intro presence: a beam from above, runes converging
    if (state === 'intro') {
      const q = Math.min(1, (t - introAt) / 2600);
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = (1 - q) * 0.4;
      g.fillStyle = '#c8f8ff';
      g.fillRect(r3(cx - api.bossW * 0.25), 0, r3(api.bossW * 0.5), r3(api.ledgeY));
      g.globalAlpha = 0.8;
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * Math.PI * 2 + t / 900;
        const r = (1 - q) * 420 + 40;
        const s = SIGILS[i % SIGILS.length];
        if (i % 2) g.drawImage(s, r3(bcx + Math.cos(a) * r - 13), r3(bcy + Math.sin(a) * r * 0.6 - 13), 26, 26);
        else {
          g.fillStyle = GOLD;
          g.fillRect(r3(bcx + Math.cos(a) * r), r3(bcy + Math.sin(a) * r * 0.6), U * 2, U * 2);
        }
      }
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
    }
    if (state === 'dying') return;

    g.globalCompositeOperation = 'lighter';
    // ---- the halo and the crown's glow
    const halo = state === 'intro' ? Math.min(1, (t - introAt) / 2000) : 1;
    const hr = 54 + Math.sin(t / 400) * 3;
    const haloCol = stage >= 3 ? FURY : GOLD;
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2 + t / 2400;
      g.globalAlpha = 0.55 * halo;
      g.fillStyle = i % 5 === 0 ? '#ffffff' : haloCol;
      g.fillRect(r3(hcx + 6 + Math.cos(a) * hr) - U, r3(hcy + 18 + Math.sin(a) * hr * 0.9) - U, i % 5 === 0 ? U * 3 : U * 2, i % 5 === 0 ? U * 3 : U * 2);
    }
    g.globalAlpha = (0.3 + Math.sin(t / 180) * 0.12) * halo;
    pxEllipse(g, hcx, hcy, 46, 18, stage >= 3 ? FURY : GOLD);
    // eyes
    const [ex, ey] = at(api, 45, 19);
    g.globalAlpha = (stage >= 2 ? 0.6 : 0.35) + Math.sin(t / 90) * 0.12;
    pxEllipse(g, ex, ey, 36, 10, stage >= 3 ? FURY : '#fff3a8');
    // palms glow while raised
    if (t < handsUpUntil || state === 'wind') {
      const [px, py] = at(api, 12, 34);
      g.globalAlpha = 0.5 + Math.sin(t / 60) * 0.2;
      pxEllipse(g, px, py, 30, 30, RUNE);
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';

    // ---- rune shields orbit the titan (gone while flung, back later)
    for (let i = 0; i < 4; i++) {
      if (shieldsGone[i] > t) continue;
      const a = t / (stage >= 3 ? 500 : 900) + (i * Math.PI) / 2;
      const z = Math.sin(a);
      const sz = z > 0 ? 36 : 27;
      g.globalAlpha = z > 0 ? 1 : 0.55;
      const back = t - shieldsGone[i] < 300 && shieldsGone[i] > 0;
      const sx = bcx + Math.cos(a) * api.bossW * 0.62;
      const sy = bcy + z * 20 - 10;
      g.drawImage(shields[i], r3(sx - sz / 2), r3(sy - sz / 2), sz, sz);
      if (back) api.fx.burst('sparkle', 1, sx, sy);
    }
    g.globalAlpha = 1;

    // ---- laser sigils charging, then firing
    g.globalCompositeOperation = 'lighter';
    for (const e of emitters) {
      if (t < e.at || t > e.until + 120) continue;
      const q = Math.min(1, (t - e.at) / Math.max(1, e.fire - e.at));
      const s = SIGILS[e.g % SIGILS.length];
      const sz = Math.round(26 + q * 26);
      g.save();
      g.translate(r3(e.x), r3(e.y));
      g.rotate(Math.round((t / 200) / (Math.PI / 4)) * (Math.PI / 4));
      g.globalAlpha = 0.6 + q * 0.4;
      g.drawImage(s, -sz / 2, -sz / 2, sz, sz);
      g.restore();
      g.globalAlpha = 0.3 * q;
      pxEllipse(g, e.x, e.y, 20 + q * 22, 20 + q * 22, t > e.fire ? '#ffffff' : RUNE);
    }
    emitters = emitters.filter((e) => t < e.until + 120);
    // pillars of judgement
    for (const p of pillars) {
      const q = (t - p.at) / 380;
      if (q > 1) continue;
      g.globalAlpha = 1 - q;
      g.fillStyle = GOLD;
      g.fillRect(r3(p.x - 22 * (1 - q * 0.5)), 0, r3(44 * (1 - q * 0.5)), api.floorY);
      g.fillStyle = '#ffffff';
      g.fillRect(r3(p.x - 9), 0, U * 6, api.floorY);
    }
    pillars = pillars.filter((p) => t - p.at < 380);
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';

    // ---- the black hole: an accretion disk, a lensing ring, light pulled in
    if (hole) {
      const q = (t - hole.at) / hole.dur;
      if (q > 1) hole = null;
      else {
        const grow = Math.min(1, q * 4) * (q > 0.9 ? (1 - q) * 10 : 1);
        const r = 14 + grow * 40;
        g.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 48; i++) {
          const a = t / 140 + (i / 48) * Math.PI * 2;
          const rr = r * (1.4 + (i % 4) * 0.18);
          g.globalAlpha = 0.55;
          g.fillStyle = i % 3 === 0 ? '#ffe08a' : i % 3 === 1 ? '#ff8c3a' : '#ff5ac8';
          g.fillRect(r3(hole.x + Math.cos(a) * rr), r3(hole.y + Math.sin(a) * rr * 0.3), U * 2, U);
        }
        for (let i = 0; i < 26; i++) {
          const a = i * 2.39;
          const d = 1 - ((t / 600 + i / 26) % 1);
          g.globalAlpha = 0.8 * (1 - d);
          g.fillStyle = i % 2 ? '#ffffff' : '#9ff3ff';
          // spiralling inward
          const sa = a + (1 - d) * 3;
          g.fillRect(r3(hole.x + Math.cos(sa) * d * 360), r3(hole.y + Math.sin(sa) * d * 200), U, U);
        }
        g.globalCompositeOperation = 'source-over';
        g.globalAlpha = 1;
        pxEllipse(g, hole.x, hole.y, r, r, '#000000');
        g.fillStyle = '#ffe08a';
        for (let i = 0; i < 28; i++) {
          const a = (i / 28) * Math.PI * 2;
          g.globalAlpha = 0.7;
          g.fillRect(r3(hole.x + Math.cos(a) * (r + U)) - U, r3(hole.y + Math.sin(a) * (r + U)) - U, U * 2, U);
        }
        g.globalAlpha = 1;
      }
    }

    // ---- stage 3: the screen pulses like a heartbeat
    if (stage >= 3) {
      const beat = Math.floor((t - stage3At) / 900);
      if (beat !== beatAt) {
        beatAt = beat;
        api.sound.thump(0.35);
      }
      const q = ((t - stage3At) % 900) / 900;
      const pulse = Math.max(0, 1 - q * 3);
      g.save();
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = `rgba(255,40,130,${0.04 + pulse * 0.12})`;
      g.fillRect(0, 0, g.canvas.width, g.canvas.height);
      g.restore();
      // the ring of the heartbeat around the titan
      g.globalAlpha = pulse * 0.8;
      g.fillStyle = FURY;
      const rr = 60 + q * 160;
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        g.fillRect(r3(bcx + Math.cos(a) * rr) - U, r3(bcy + Math.sin(a) * rr * 0.7) - U, U * 2, U * 2);
      }
      g.globalAlpha = 1;
      if (Math.random() < 0.3) api.fx.add({ kind: 'ember', x: cx + (Math.random() - 0.5) * api.bossW, y: top + api.bossH });
    }
    // the final burst's shock ring
    const bq = (t - burstAt) / 700;
    if (bq >= 0 && bq < 1) {
      g.globalAlpha = 1 - bq;
      g.fillStyle = '#ffffff';
      const rr = bq * 700;
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * Math.PI * 2;
        g.fillRect(r3(bcx + Math.cos(a) * rr) - U, r3(bcy + Math.sin(a) * rr * 0.6) - U, U * 3, U * 3);
      }
      g.globalAlpha = 1;
    }
  }
});

