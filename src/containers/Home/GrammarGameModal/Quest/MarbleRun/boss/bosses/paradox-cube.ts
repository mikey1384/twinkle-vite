import { makeSprite, disc, rect, line, eyesX, canvas, pxEllipse, INK, U, W, r3 } from '../../pixel';
import type { Put, Sprite } from '../../pixel';
import { registerBoss } from '../registry';
import type { BossApi, BossState, Shot } from '../types';

// Fort 2 of the Logic Tower: an impossible cube (one back edge always
// crosses in front, Escher-style) spinning around a single watchful eye. It
// teleports with a glitch, fires orbs that stop, rewind and come back the
// other way, and splits into holographic copies. Phase 2: little cubes
// rain and rewind mid-air, and a glitch storm blinks it across the room.

const S = 3;
const ROTS = 6; // frames over a quarter turn (the cube repeats every 90°)
const AX = ['#4fd6ff', '#b06bff', '#ff5ac8'];
const AXD = ['#2a7fa8', '#6532a8', '#a8287f'];
const AXL = ['#c8f4ff', '#e2c8ff', '#ffc8ec'];

// ---- per-fight state
let clock = 0;
let pos = { dx: 0, dy: 0 };
let tele: { at: number; fdx: number; fdy: number } | null = null;
let glitchUntil = 0;
let invertAt = -1e9;
let p2 = false;
let lastFrame: Sprite | null = null;
// where the cube's home spot and its current centre are (kept fresh by
// drawExtra, since a move's api is a snapshot from when the move started)
let homeX = 0;
let homeTop = 0;
let nowX = 0;
let nowY = 0;

type V3 = [number, number, number];
function project(rot: number, R: number, cx: number, cy: number) {
  const phi = 0.45;
  const verts: V3[] = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
    const xr = x * Math.cos(rot) - z * Math.sin(rot);
    const zr = x * Math.sin(rot) + z * Math.cos(rot);
    verts.push([cx + xr * R, cy + (y * Math.cos(phi) - zr * Math.sin(phi)) * R * 0.92, -zr * Math.cos(phi) - y * Math.sin(phi)]);
  }
  const edges: { a: V3; b: V3; axis: number; d: number }[] = [];
  for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) {
    const diff = i ^ j;
    if (diff !== 1 && diff !== 2 && diff !== 4) continue;
    const axis = diff === 4 ? 0 : diff === 2 ? 1 : 2;
    edges.push({ a: verts[i], b: verts[j], axis, d: (verts[i][2] + verts[j][2]) / 2 });
  }
  edges.sort((p, q) => p.d - q.d);
  return { verts, edges };
}

function bar(put: Put, e: { a: V3; b: V3; axis: number; d: number }, w: number) {
  const col = e.d < -0.2 ? AXD[e.axis] : AX[e.axis];
  line(put, e.a[0] - w / 2, e.a[1] - w / 2, e.b[0] - w / 2, e.b[1] - w / 2, col, w);
  if (e.d >= -0.2) line(put, e.a[0] - w / 2, e.a[1] - w / 2, e.b[0] - w / 2, e.b[1] - w / 2, AXL[e.axis]);
}

function drawCube(put: Put, rot: number, R: number, cx: number, cy: number, w: number, eye: ((put: Put) => void) | null) {
  const { verts, edges } = project(rot, R, cx, cy);
  // the farthest vertical edge is drawn LAST: the impossible crossing
  const vi = edges.findIndex((e) => e.axis === 1);
  const impossible = edges.splice(vi, 1)[0];
  const back = edges.filter((e) => e.d < 0);
  const front = edges.filter((e) => e.d >= 0);
  for (const e of back) bar(put, e, w);
  eye?.(put);
  for (const e of front) bar(put, e, w);
  bar(put, { ...impossible, d: 1 }, w);
  for (const v of verts) if (v[2] > 0) disc(put, v[0], v[1], w * 0.55, w * 0.55, '#ffe08a');
}

function cubeBoss(rot: number, eye: 'open' | 'x' | 'glow', big: boolean) {
  return makeSprite(82, 68, (put) => {
    const cx = 41;
    const cy = 34;
    drawCube(put, rot, big ? 25 : 22, cx, cy, big ? 5 : 4, (p) => {
      disc(p, cx, cy, 10, 9, '#ffe9f5', '#d9a6c8');
      if (eye === 'x') {
        eyesX(p, cx - 6, cy - 2, '#5a1440');
        eyesX(p, cx + 2, cy - 2, '#5a1440');
        return;
      }
      const iris = eye === 'glow' ? '#ff2d55' : '#c03cff';
      disc(p, cx - 3, cy, 5.5, 5.5, iris, eye === 'glow' ? '#a01030' : '#7a1ab0');
      rect(p, cx - 5, cy - 2, 2, 5, INK);
      p(cx - 6, cy - 3, '#fff');
      p(cx - 5, cy - 3, '#fff');
      // eyelids
      line(p, cx - 9, cy - 6, cx + 8, cy - 7, '#d9a6c8');
      line(p, cx - 9, cy + 7, cx + 8, cy + 6, '#d9a6c8');
    });
  });
}

const cache = new Map<string, Sprite>();
function frame(i: number, eye: 'open' | 'x' | 'glow', big: boolean) {
  const key = `${i}${eye}${big}`;
  let s = cache.get(key);
  if (!s) {
    s = cubeBoss((i / ROTS) * (Math.PI / 2) + 0.2, eye, big);
    cache.set(key, s);
  }
  return s;
}

// translucent scanlined hologram of a sprite (the copies)
const holoCache = new Map<Sprite, Sprite>();
function holo(s: Sprite) {
  const hit = holoCache.get(s);
  if (hit) return hit;
  const c = canvas(s.width, s.height);
  const p = c.getContext('2d')!;
  p.globalAlpha = 0.6;
  p.drawImage(s, 0, 0);
  p.globalAlpha = 0.5;
  p.globalCompositeOperation = 'source-atop';
  p.fillStyle = '#6ff0ff';
  p.fillRect(0, 0, c.width, c.height);
  p.globalCompositeOperation = 'destination-out';
  p.globalAlpha = 0.7;
  for (let y = 0; y < c.height; y += 3) p.fillRect(0, y, c.width, 1);
  holoCache.set(s, c);
  return c;
}
// one-colour copies for the chromatic split
const tintCache = new WeakMap<Sprite, Record<string, Sprite>>();
function tinted(s: Sprite, col: string) {
  const byCol = tintCache.get(s) || {};
  tintCache.set(s, byCol);
  const hit = byCol[col];
  if (hit) return hit;
  const c = canvas(s.width, s.height);
  const p = c.getContext('2d')!;
  p.drawImage(s, 0, 0);
  p.globalCompositeOperation = 'source-in';
  p.fillStyle = col;
  p.fillRect(0, 0, c.width, c.height);
  byCol[col] = c;
  return c;
}

const orb = [0, 1].map((f) =>
  makeSprite(14, 14, (put) => {
    disc(put, 7, 7, 6.5, 6.5, f ? '#6ff0ff' : '#ff5ac8');
    disc(put, 7, 7, 4, 4, f ? '#ff5ac8' : '#6ff0ff');
    disc(put, 7, 7, 2, 2, '#ffffff');
  })
);
const mini = [0, 1, 2].map((f) => makeSprite(18, 18, (put) => drawCube(put, (f / 3) * (Math.PI / 2), 6, 9, 9, 2, null)));
const holoFrames = Array.from({ length: ROTS }, (_, i) => holo(frame(i, 'open', false)));

function at(api: BossApi, ax: number, ay: number): [number, number] {
  return [api.bossX - api.bossW / 2 + (ax + 1) * S, api.bossTop + (ay + 1) * S];
}

function glitch(g: CanvasRenderingContext2D, n: number, mag: number) {
  const c = g.canvas;
  const k = c.width / W;
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  for (let i = 0; i < n; i++) {
    const h = Math.max(2, Math.floor((2 + Math.random() * 16) * k));
    const y = Math.floor(Math.random() * (c.height - h));
    const dx = Math.round((Math.random() - 0.5) * 2 * mag * k);
    g.drawImage(c, 0, y, c.width, h, dx, y, c.width, h);
  }
  g.restore();
}

// blink to a new spot (never toward the marble's side of the room)
// (dx, dy) from home; the sprite is tall, so it mostly moves sideways and down
const SPOTS: [number, number][] = [[0, 0], [-170, -12], [-320, 24], [-90, 30], [-250, -6]];
function teleport(api: BossApi, to?: [number, number]) {
  let next = to;
  if (!next) {
    const options = SPOTS.filter(([dx, dy]) => dx !== pos.dx || dy !== pos.dy);
    next = options[Math.floor(Math.random() * options.length)];
  }
  // keep the cube well right of the marble
  if (homeX + next[0] - api.bossW / 2 < api.marbleX + 140) next = [0, next[1]];
  tele = { at: clock, fdx: pos.dx, fdy: pos.dy };
  api.fx.burst('spark', 18, nowX, nowY, { color: '#6ff0ff', speed: 1.2 });
  pos = { dx: next[0], dy: next[1] };
  glitchUntil = clock + 320;
  api.fx.burst('spark', 18, homeX + next[0], homeTop + next[1] + api.bossH / 2, { color: '#ff5ac8', speed: 1.2 });
  api.sound.whoosh(0.1, 0.18, 0, 4000, 800);
  api.sound.note(96, { instrument: 'glock', level: 0.05 });
  api.sound.note(85, { at: 0.06, instrument: 'glock', level: 0.05 });
}

// an orb that flies at the marble, freezes, rewinds, then fast-forwards
// back over the marble's head (it ducks)
function rewindOrb(api: BossApi, x: number, y: number, delay: number) {
  api.after(delay, () => {
    let stage = 0;
    let since = clock;
    const stopX = api.marbleX + 150 + Math.random() * 60;
    const s: Shot = {
      frames: orb,
      x,
      y,
      vx: -7,
      vy: 0,
      frameMs: 70,
      glow: '#ff5ac8',
      update(sh, t, a) {
        if (sh.hit) return;
        if (stage === 0) {
          // swoop down to the floor lane
          sh.vy = (a.floorY - 46 - sh.y) * 0.08;
          if (sh.x < stopX) {
            stage = 1;
            since = t;
            sh.vx = 0;
            sh.vy = 0;
            a.fx.burst('spark', 6, sh.x + 21, sh.y + 21, { color: '#6ff0ff', speed: 0.6 });
            a.sound.note(91, { instrument: 'glock', level: 0.04 });
          }
        } else if (stage === 1) {
          sh.x += Math.sin(t / 20) * 2;
          if (t - since > 260) {
            stage = 2;
            since = t;
            sh.vx = 5;
            a.sound.whoosh(0.05, 0.25, 0, 800, 2400);
          }
        } else if (stage === 2) {
          sh.vy = (a.floorY - 150 - sh.y) * 0.1;
          if (t - since > 380) {
            stage = 3;
            sh.vx = -11;
            sh.dodge = 'duck';
            a.sound.whoosh(0.07, 0.3, 0, 2600, 600);
          }
        } else {
          sh.vy = (a.floorY - 114 - sh.y) * 0.12;
          if (Math.random() < 0.3) a.fx.add({ kind: 'spark', x: sh.x + 30, y: sh.y + 21, color: '#ff5ac8' });
        }
      }
    };
    api.spawn(s);
    api.sound.note(79 + Math.floor(delay / 100), { instrument: 'bell', level: 0.05 });
  });
}

function eyeAt(api: BossApi) {
  return at(api, 38, 34);
}

function currentFrame(t: number, state: BossState) {
  const i = Math.floor(t / (p2 ? 70 : 110)) % ROTS;
  if (state === 'hurt' || state === 'dazed' || state === 'dying') return frame(Math.floor(t / 40) % ROTS, 'x', false);
  if (state === 'wind') return frame(Math.floor(t / 40) % ROTS, p2 ? 'glow' : 'open', true);
  return frame(i, p2 ? 'glow' : 'open', false);
}

registerBoss({
  id: 'paradox-cube',
  scale: S,
  hover: 24,
  intro: 'fade',
  frames() {
    clock = 0;
    pos = { dx: 0, dy: 0 };
    tele = null;
    glitchUntil = 0;
    invertAt = -1e9;
    p2 = false;
    return { idle: [frame(0, 'open', false)] };
  },
  pose(t, state) {
    const f = currentFrame(t, state);
    lastFrame = f;
    const jitter = t < glitchUntil ? r3((Math.random() - 0.5) * 24) : 0;
    const bob = Math.round(Math.sin(t / 430) * 3) * U;
    if (state === 'hurt') return { frame: f, dx: pos.dx + 3 * U, dy: pos.dy, tilt: 0.1 };
    return { frame: f, dx: pos.dx + jitter, dy: pos.dy + bob, alpha: t < glitchUntil && Math.floor(t / 40) % 2 ? 0.45 : 1 };
  },
  moves: [
    {
      id: 'rewind-orbs',
      windup: 520,
      weight: 1.2,
      run(api) {
        const [x, y] = eyeAt(api);
        const n = api.phase === 2 ? 4 : 3;
        for (let i = 0; i < n; i++) rewindOrb(api, x - 30, y - 20, i * 220);
      }
    },
    {
      id: 'blink-beam',
      windup: 460,
      run(api) {
        // glitch to a new spot, then a beam from the eye (high, duck); in
        // phase 2 it blinks again and fires low too
        teleport(api);
        api.after(420, () => {
          api.beam(api.floorY - 98, 480, { color: '#c03cff', height: 12, dodge: 'duck' });
          api.shake(5, 240);
          api.sound.whoosh(0.12, 0.45, 0, 3600, 1600);
          api.sound.note(70, { instrument: 'bell', level: 0.06 });
        });
        if (api.phase === 2) {
          api.after(1150, () => {
            teleport(api);
            api.after(380, () => {
              api.beam(api.floorY - 15, 400, { color: '#4fd6ff', height: 14, dodge: 'hop' });
              api.shake(6, 240);
              api.sound.whoosh(0.12, 0.4, 0, 1600, 500);
            });
          });
        }
      }
    },
    {
      id: 'copies',
      windup: 600,
      weight: 0.9,
      run(api) {
        // two holographic copies flicker in; each (and the real one) fires
        // an orb, then the copies shatter
        if (pos.dx !== 0) teleport(api, [0, 0]);
        const spots: [number, number][] = [[api.marbleX + 260, 30], [api.marbleX + 430, 80]];
        glitchUntil = clock + 200;
        api.sound.note(84, { instrument: 'glock', level: 0.05 });
        api.sound.note(91, { at: 0.08, instrument: 'glock', level: 0.05 });
        spots.forEach(([cx, top], i) => {
          let fired = false;
          api.spawn({
            frames: holoFrames,
            x: cx - (82 * S) / 2,
            y: top,
            scale: S,
            frameMs: 110,
            dodge: 'none',
            life: 1900,
            update(sh, t, a) {
              sh.x += Math.random() < 0.08 ? (Math.random() - 0.5) * 18 : 0;
              const age = t - (sh.born || t);
              if (!fired && age > 500 + i * 250) {
                fired = true;
                rewindOrb(a, sh.x + 82 * S * 0.4, sh.y + 34 * S - 20, 0);
              }
              if (age > 1850) {
                a.fx.burst('shard', 14, sh.x + 41 * S, sh.y + 34 * S, { color: '#6ff0ff' });
                a.sound.note(96 - i * 5, { instrument: 'glock', level: 0.04 });
              }
            }
          });
        });
        const [x, y] = eyeAt(api);
        api.after(380, () => rewindOrb(api, x - 30, y - 20, 0));
      }
    },
    {
      id: 'paradox-rain',
      windup: 640,
      phase: 2,
      run(api) {
        // little cubes fall, freeze, rewind up, then slam down (shadows
        // first, never on the marble unless aimed)
        api.tint(1500, 'rgba(160,80,255,.1)');
        api.shake(6, 900);
        api.sound.thump(0.9);
        const xs: number[] = [];
        for (let i = 0; i < 5; i++) xs.push(120 + i * 110 + Math.random() * 40);
        const safe = xs.filter((x) => Math.abs(x - api.marbleX) > 85);
        if (api.aim) safe.unshift(api.marbleX);
        safe.forEach((cx, i) => {
          const land = 1100 + i * 160;
          api.after(i * 160, () => {
            let stage = 0;
            let since = clock;
            api.spawn({
              frames: mini,
              x: cx - 27,
              y: -60,
              vy: 6,
              scale: S,
              frameMs: 80,
              dodge: 'none',
              life: 1400,
              glow: '#b06bff',
              update(sh, t) {
                if (stage === 0 && sh.y > 60) {
                  stage = 1;
                  since = t;
                  sh.vy = -3;
                } else if (stage === 1 && t - since > 300) {
                  stage = 2;
                  sh.vy = 0;
                } else if (stage === 2) sh.vy = (sh.vy || 0) + 1.2;
                if (sh.y > api.floorY - 54) {
                  sh.y = api.floorY - 54;
                  sh.vy = 0;
                }
              }
            });
          });
          api.warn(cx, land, () => {
            api.fx.burst('spark', 10, cx, api.floorY - 6, { color: '#ff5ac8' });
            api.sound.thump(0.4);
            if (Math.abs(cx - api.marbleX) < 50) api.strikeMarble();
          }, { kind: 'shadow', width: 54 });
        });
      }
    },
    {
      id: 'glitch-storm',
      windup: 700,
      phase: 2,
      weight: 0.9,
      run(api) {
        invertAt = clock;
        api.shake(8, 1600);
        api.sound.note(40, { instrument: 'pad', level: 0.12, hold: 1 });
        for (let i = 0; i < 3; i++) {
          api.after(i * 560, () => {
            teleport(api, i === 2 ? [0, 0] : undefined);
            api.after(300, () => {
              const low = i % 2 === 0;
              api.beam(low ? api.floorY - 15 : api.floorY - 98, low ? 380 : 440, { color: low ? '#ff5ac8' : '#4fd6ff', height: 13, dodge: low ? 'hop' : 'duck' });
              api.sound.whoosh(0.1, 0.3, 0, low ? 1500 : 3500, 600);
            });
          });
        }
      }
    }
  ],
  drawExtra(g, t, api, state) {
    clock = t;
    if (api.phase === 2 && !p2) {
      p2 = true;
      glitchUntil = t + 500;
    }
    // occasional idle glitches, more often when angry
    if (state !== 'dying' && Math.random() < (p2 ? 0.006 : 0.002)) glitchUntil = t + 160;
    const f = lastFrame;
    const cx = api.bossX;
    const top = api.bossTop;
    if (t >= glitchUntil && state !== 'hurt') {
      homeX = cx - pos.dx;
      homeTop = top - pos.dy - Math.round(Math.sin(t / 430) * 3) * U;
    }
    nowX = cx;
    nowY = top + api.bossH / 2;
    g.imageSmoothingEnabled = false;
    // after-image left at the spot it teleported from
    if (tele && f) {
      const k = (t - tele.at) / 500;
      if (k < 1) {
        const ox = cx - pos.dx + tele.fdx;
        const oy = top - pos.dy + tele.fdy;
        g.globalAlpha = (1 - k) * 0.6;
        g.drawImage(holo(f), r3(ox - api.bossW / 2 + (Math.random() - 0.5) * 12), r3(oy), api.bossW, api.bossH);
        g.globalAlpha = 1;
      } else tele = null;
    }
    // chromatic split: a red and a cyan ghost either side
    if (f && state !== 'dying') {
      const split = (t < glitchUntil ? 4 : p2 ? 2 : 1) * U;
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = t < glitchUntil ? 0.5 : 0.22;
      g.drawImage(tinted(f, '#ff2d55'), r3(cx - api.bossW / 2 - split), r3(top), api.bossW, api.bossH);
      g.drawImage(tinted(f, '#2de1ff'), r3(cx - api.bossW / 2 + split), r3(top), api.bossW, api.bossH);
      g.globalAlpha = 1;
    }
    // orbiting mini-cubes (a ring of possibilities)
    g.globalCompositeOperation = 'source-over';
    if (state !== 'dying') {
      const ey = top + api.bossH / 2;
      for (let i = 0; i < 4; i++) {
        const a = t / 700 + (i * Math.PI) / 2;
        const z = Math.sin(a);
        const s = mini[Math.floor(t / 120 + i) % 3];
        const sz = Math.round(s.width * (z > 0 ? 2 : 1.4));
        g.globalAlpha = z > 0 ? 1 : 0.5;
        g.drawImage(s, r3(cx + Math.cos(a) * api.bossW * 0.62 - sz / 2), r3(ey + z * 18 - Math.cos(a) * 30 - sz / 2), sz, sz);
      }
      g.globalAlpha = 1;
      // the eye's glow
      const [ex, eyy] = eyeAt(api);
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = (p2 ? 0.4 : 0.22) + Math.sin(t / 120) * 0.1;
      pxEllipse(g, ex, eyy, 40, 36, p2 ? '#ff2d55' : '#c03cff');
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
    }
    // phase 2: static noise blocks around it
    if (p2 && state !== 'dying') {
      for (let i = 0; i < 6; i++) {
        if (Math.random() < 0.5) continue;
        g.fillStyle = Math.random() < 0.5 ? '#ff5ac8' : '#4fd6ff';
        g.globalAlpha = 0.6;
        g.fillRect(r3(cx + (Math.random() - 0.5) * api.bossW * 1.4), r3(top + Math.random() * api.bossH), r3(6 + Math.random() * 30), U * (1 + Math.floor(Math.random() * 2)));
      }
      g.globalAlpha = 1;
    }
    // screen glitch: shifted slices of the whole room
    if (t < glitchUntil) glitch(g, p2 ? 7 : 4, p2 ? 22 : 14);
    // a brief soft colour inversion as the glitch storm starts
    const ik = (t - invertAt) / 140;
    if (ik >= 0 && ik < 1) {
      g.save();
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = 'difference';
      g.globalAlpha = 0.55 * (1 - ik);
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, g.canvas.width, g.canvas.height);
      g.restore();
      glitchUntil = Math.max(glitchUntil, t + 60);
    }
  }
});
