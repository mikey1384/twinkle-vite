import { makeSprite, disc, rect, line, poly, eyesX, pxEllipse, INK, U, W, r3 } from '../../pixel';
import type { Put, Sprite } from '../../pixel';
import { registerBoss } from '../registry';
import type { BossApi, Shot } from '../types';

// Fort 3 of the Logic Tower: a cardboard box holding two cats at once, one
// dark, one pale; whichever is "real" keeps flickering between them, their
// tails tied in an infinity loop. Cats pounce from BOTH sides of the arena
// (only one is real; the other dissolves mid-leap), yarn balls phase through
// the walls and come round again, and a laser dot sends a cat pouncing.
// Phase 2: a rain of maybe-cats (only some land) and an entangled pair of
// yarn balls, one low, one high, bound by a glowing thread.

const S = 3;
const A = { fur: '#3b2a5c', dark: '#24183c', light: '#6a52a0', eye: '#b4ff5a' };
const B = { fur: '#e8e0ff', dark: '#b4a8e0', light: '#ffffff', eye: '#6ff0ff' };
const BOX = '#b98a52';
const BOXD = '#8a6236';
const BOXL = '#d9ab70';

// ---- per-fight state
let clock = 0;
let p2 = false;
let dot: { at: number; path: [number, number][]; dur: number } | null = null;
let yarns: { s: Shot; color: string }[] = [];
let links: { a: Shot; b: Shot }[] = [];
let swapAt = 0;
let swapIdx = 0;
let lastFrame: Sprite | null = null;

// a put that only lays every other pixel: the "maybe" cat
const ghostly = (put: Put): Put => (x, y, c) => {
  if ((Math.round(x) + Math.round(y)) % 2 === 0) put(x, y, c);
};

type Eyes = 'open' | 'x' | 'glow' | 'grin';
function catHead(put: Put, cx: number, cy: number, c: typeof A, eyes: Eyes) {
  rect(put, cx - 6, cy + 6, 12, 8, c.dark);
  disc(put, cx, cy, 11, 9, c.fur, c.dark, c.light);
  poly(put, [[cx - 11, cy - 3], [cx - 9, cy - 16], [cx - 2, cy - 8]], c.fur);
  poly(put, [[cx + 2, cy - 8], [cx + 8, cy - 16], [cx + 11, cy - 3]], c.fur);
  poly(put, [[cx - 9, cy - 5], [cx - 8, cy - 12], [cx - 5, cy - 8]], '#ff9db0');
  poly(put, [[cx + 5, cy - 8], [cx + 8, cy - 12], [cx + 9, cy - 5]], '#ff9db0');
  // cheek fluff
  put(cx - 11, cy + 3, c.fur);
  put(cx - 12, cy + 4, c.fur);
  put(cx + 11, cy + 3, c.fur);
  if (eyes === 'x') {
    eyesX(put, cx - 8, cy - 3);
    eyesX(put, cx + 1, cy - 3);
  } else if (eyes === 'grin') {
    line(put, cx - 8, cy - 1, cx - 5, cy - 3, INK);
    line(put, cx - 5, cy - 3, cx - 3, cy - 1, INK);
    line(put, cx + 1, cy - 1, cx + 3, cy - 3, INK);
    line(put, cx + 3, cy - 3, cx + 6, cy - 1, INK);
  } else {
    const e = eyes === 'glow' ? '#ffffff' : c.eye;
    rect(put, cx - 8, cy - 4, 5, 5, c.eye);
    rect(put, cx + 1, cy - 4, 5, 5, c.eye);
    if (eyes === 'glow') {
      rect(put, cx - 7, cy - 3, 3, 3, e);
      rect(put, cx + 2, cy - 3, 3, 3, e);
    }
    rect(put, cx - 7, cy - 4, 1, 5, INK);
    rect(put, cx + 2, cy - 4, 1, 5, INK);
    put(cx - 5, cy - 4, '#fff');
    put(cx + 4, cy - 4, '#fff');
  }
  put(cx - 2, cy + 2, '#ff6f9a');
  put(cx - 1, cy + 2, '#ff6f9a');
  for (const [x, y] of [[-5, 4], [-4, 5], [-3, 4], [-2, 5], [-1, 4]]) put(cx + x, cy + y, INK);
  if (eyes === 'grin') rect(put, cx - 4, cy + 5, 3, 2, '#c0204a');
  line(put, cx - 9, cy + 2, cx - 17, cy, c.light);
  line(put, cx - 9, cy + 4, cx - 17, cy + 5, c.light);
  line(put, cx + 8, cy + 2, cx + 15, cy, c.light);
}

function catBox(real: 'a' | 'b', eyes: Eyes, flap: number) {
  return makeSprite(96, 68, (put) => {
    const gp = ghostly(put);
    // tails rising behind the box, tied in an infinity loop
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      const pa = real === 'a' ? put : gp;
      const pb = real === 'b' ? put : gp;
      rect(pa, 80 + Math.cos(a) * 5, 12 + Math.sin(a) * 5, 2, 2, A.fur);
      rect(pb, 90 + Math.cos(a) * 5, 12 + Math.sin(a) * 5, 2, 2, B.fur);
    }
    line(real === 'a' ? put : gp, 78, 34, 80, 17, A.fur, 2);
    line(real === 'b' ? put : gp, 84, 34, 90, 17, B.fur, 2);
    // the inside of the box
    rect(put, 18, 30, 70, 5, '#4a3420');
    // the two cats: one real, one only maybe
    catHead(real === 'a' ? put : gp, 34, 20, A, eyes);
    catHead(real === 'b' ? put : gp, 62, 18, B, eyes);
    // paws on the rim
    for (const [x, c, r] of [[27, A, 'a'], [39, A, 'a'], [55, B, 'b'], [67, B, 'b']] as const) {
      disc(r === real ? put : gp, x, 34, 3, 2, c.fur, c.dark);
      put(x - 1, 35, c.dark);
      put(x + 1, 35, c.dark);
    }
    // flaps
    poly(put, [[18, 34], [6 - flap, 27 - flap], [14, 24 - flap], [28, 33]], BOXL);
    poly(put, [[86, 33], [95, 26 + flap], [94, 32], [90, 36]], BOXD);
    // front and side faces
    rect(put, 16, 34, 70, 33, BOX);
    poly(put, [[86, 34], [94, 30], [94, 61], [86, 67]], BOXD);
    rect(put, 16, 34, 70, 2, BOXL);
    rect(put, 47, 34, 9, 7, '#e8d49a');
    line(put, 16, 46, 86, 46, BOXD);
    line(put, 22, 58, 30, 62, BOXD);
    put(74, 52, BOXD);
    put(75, 53, BOXD);
    // a glowing orbit mark on the front (no letters)
    for (let k = 0; k < 28; k++) {
      const a = (k / 28) * Math.PI * 2;
      put(51 + Math.cos(a) * 10, 54 + Math.sin(a) * 3.5, '#6ff0ff');
      put(51 + Math.cos(a) * 4 * Math.cos(1) - Math.sin(a) * 9 * Math.sin(1), 54 + Math.cos(a) * 4 * Math.sin(1) + Math.sin(a) * 9 * Math.cos(1) * 0.5, '#b4ff5a');
    }
    rect(put, 50, 53, 3, 3, '#ffffff');
    // up arrows in the corner
    for (const x of [22, 28]) {
      line(put, x, 42, x, 38, INK);
      put(x - 1, 39, INK);
      put(x + 1, 39, INK);
    }
  });
}

const cache = new Map<string, Sprite>();
function frame(real: 'a' | 'b', eyes: Eyes, flap: number) {
  const key = real + eyes + flap;
  let s = cache.get(key);
  if (!s) {
    s = catBox(real, eyes, flap);
    cache.set(key, s);
  }
  return s;
}

function pouncer(c: typeof A, f: number, ghost: boolean) {
  return makeSprite(34, 20, (put0) => {
    const put = ghost ? ghostly(put0) : put0;
    // stretched mid-leap, facing the way it flies (left)
    line(put, 28, 9, 33, 2 + f * 3, c.fur, 2);
    disc(put, 18, 10, 10, 5, c.fur, c.dark, c.light);
    line(put, 11, 13, 3, 17 - f * 3, c.fur, 2);
    line(put, 24, 13, 31, 18 - f * 2, c.fur, 2);
    disc(put, 7, 7, 6, 5, c.fur, c.dark);
    poly(put, [[3, 4], [4, -2 + 2], [7, 3]], c.fur);
    poly(put, [[8, 3], [10, 0], [11, 4]], c.fur);
    rect(put, 3, 6, 2, 2, c.eye);
    rect(put, 7, 6, 2, 2, c.eye);
    put(1, 9, '#ff6f9a');
  });
}
const POUNCE_A = [0, 1].map((f) => pouncer(A, f, false));
const POUNCE_B = [0, 1].map((f) => pouncer(B, f, false));
const GHOST_A = [0, 1].map((f) => pouncer(A, f, true));
const GHOST_B = [0, 1].map((f) => pouncer(B, f, true));
const yarn = (col: string, dark: string, ghost: boolean) =>
  makeSprite(16, 16, (put0) => {
    const put = ghost ? ghostly(put0) : put0;
    disc(put, 8, 8, 7.5, 7.5, col, dark);
    line(put, 2, 5, 12, 2, dark);
    line(put, 3, 10, 14, 6, dark);
    line(put, 5, 14, 14, 10, dark);
    put(5, 4, '#fff');
  });
const YARN_PINK = [yarn('#ff7fb5', '#c0407a', false), yarn('#ff7fb5', '#c0407a', true)];
const YARN_TEAL = [yarn('#5fe0c8', '#2a9a86', false), yarn('#5fe0c8', '#2a9a86', true)];
const shock = makeSprite(18, 10, (put) => {
  poly(put, [[0, 10], [5, 2], [9, 6], [13, 0], [18, 10]], '#b4ff5a');
  poly(put, [[4, 10], [8, 5], [12, 8], [14, 10]], '#ffffff');
});

function at(api: BossApi, ax: number, ay: number): [number, number] {
  return [api.bossX - api.bossW / 2 + (ax + 1) * S, api.bossTop + (ay + 1) * S];
}

// a cat leaps in from one side of the arena; the fake one dissolves
function pounceFrom(api: BossApi, side: 'left' | 'right', real: boolean, look: 'a' | 'b') {
  const frames = look === 'a' ? POUNCE_A : POUNCE_B;
  const poof = (s: Shot, a: BossApi) => {
    s.done = true;
    a.fx.burst('spark', 18, s.x + 51, s.y + 30, { color: look === 'a' ? '#b4ff5a' : '#6ff0ff', speed: 1 });
    a.fx.burst('puff', 6, s.x + 51, s.y + 30);
    a.sound.note(98, { instrument: 'glock', level: 0.05 });
    a.sound.note(91, { at: 0.05, instrument: 'glock', level: 0.04 });
  };
  if (side === 'right') {
    const [x] = at(api, 20, 40);
    api.spawn({
      frames,
      x: x - 60,
      y: 0,
      vx: -8,
      onFloor: true,
      frameMs: 90,
      glow: real ? undefined : '#6ff0ff',
      update(s, _t, a) {
        if (s.hit) return;
        if (!real && s.x < a.marbleX + 190) poof(s, a);
      }
    });
  } else {
    // from behind: a high leap clean over the marble
    let landed = false;
    api.spawn({
      frames: frames.map((f) => f),
      x: -90,
      y: api.floorY - 60,
      vx: 7,
      vy: -12.5,
      g: 0.45,
      frameMs: 90,
      dodge: 'none',
      update(s, _t, a) {
        if (s.hit) return;
        if (!real && (s.vy || 0) > -1) return poof(s, a);
        if (!landed && s.y > a.floorY - 60) {
          landed = true;
          s.y = a.floorY - 60;
          s.vy = 0;
          s.g = 0;
          a.fx.burst('dust', 6, s.x + 51, a.floorY - 4);
        }
        // scampers back into the box
        if (landed && s.x > a.bossX - a.bossW * 0.45) {
          s.done = true;
          a.fx.burst('puff', 6, s.x + 51, s.y + 30);
        }
      }
    });
  }
  api.sound.whoosh(0.1, 0.5, 0, 2000, 500);
}

function phasingYarn(api: BossApi, color: 'pink' | 'teal', vx: number, laps: number) {
  const [x, y] = at(api, 30, 34);
  let wraps = 0;
  let phaseAt = -1e9;
  const solid = color === 'pink' ? YARN_PINK : YARN_TEAL;
  const s: Shot = {
    frames: [solid[0]],
    x: x - 30,
    y: y - 30,
    vx,
    vy: -5,
    g: 0.3,
    bounce: 0.62,
    spin: -0.3,
    update(sh, t, a) {
      if (sh.hit) return;
      // keep bouncing: a gentle kick each time it settles
      if (sh.y > a.floorY - 52 && Math.abs(sh.vy || 0) < 1.2) sh.vy = -5.5;
      if (sh.x < -40) {
        if (wraps >= laps) {
          sh.done = true;
          return;
        }
        // phases through the wall and comes round from the other side
        wraps++;
        phaseAt = t;
        sh.x = W + 10;
        sh.y = a.floorY - 210;
        sh.vy = 0;
        a.fx.burst('spark', 10, 10, a.floorY - 40, { color: '#ff7fb5' });
        a.sound.note(93, { instrument: 'glock', level: 0.04 });
      }
      sh.frames = t - phaseAt < 500 || sh.x > W - 60 ? [solid[0], solid[1]] : [solid[0]];
    }
  };
  api.spawn(s);
  yarns.push({ s, color: color === 'pink' ? '#ff7fb5' : '#5fe0c8' });
  return s;
}

registerBoss({
  id: 'quantum-cat',
  scale: S,
  intro: 'drop',
  frames() {
    clock = 0;
    p2 = false;
    dot = null;
    yarns = [];
    links = [];
    swapAt = 0;
    return { idle: [frame('a', 'open', 0)] };
  },
  pose(t, state) {
    const real = Math.floor(t / 1600) % 2 ? 'b' : 'a';
    let f: Sprite;
    let pose: { dx?: number; dy?: number; sx?: number; sy?: number; tilt?: number } = {};
    if (state === 'hurt' || state === 'dazed' || state === 'dying') {
      f = frame(real, 'x', 2);
      pose = { sx: 1.04, sy: 0.94, dx: state === 'hurt' ? 3 * U : 0 };
    } else if (state === 'laugh') f = frame(real, 'grin', Math.floor(t / 100) % 2 ? 2 : 0);
    else if (state === 'wind') {
      f = frame(real, 'glow', 2);
      pose = { dy: -U, sx: 1.03, sy: 0.97 };
    } else {
      const flap = Math.floor(t / 500) % 2;
      f = frame(real, p2 ? 'glow' : 'open', flap);
      // the box hops now and then, like something inside shifted
      const hop = t % 2400 < 200 ? -Math.sin(((t % 2400) / 200) * Math.PI) * 4 * U : 0;
      pose = { dy: hop, tilt: hop ? -0.03 : 0 };
    }
    lastFrame = f;
    return { frame: f, ...pose };
  },
  moves: [
    {
      id: 'two-sides',
      windup: 560,
      weight: 1.2,
      run(api) {
        // rings flash at both edges; one cat is real, one only maybe
        const realSide = Math.random() < 0.5 ? 'left' : 'right';
        const look = Math.random() < 0.5 ? 'a' : 'b';
        api.warn(30, 420, () => {}, { kind: 'ring', width: 70, color: '#b4ff5a' });
        api.warn(api.bossX - api.bossW * 0.5, 420, () => {}, { kind: 'ring', width: 70, color: '#6ff0ff' });
        api.sound.note(79, { instrument: 'bell', level: 0.05 });
        api.sound.note(78, { at: 0.03, instrument: 'bell', level: 0.05 });
        api.after(420, () => {
          // the real one first (an aimed move sends the real one at the marble)
          pounceFrom(api, realSide, true, look);
          pounceFrom(api, realSide === 'left' ? 'right' : 'left', false, look === 'a' ? 'b' : 'a');
        });
        if (api.phase === 2) {
          api.after(1500, () => {
            const side = Math.random() < 0.5 ? 'left' : 'right';
            pounceFrom(api, side, true, 'b');
            pounceFrom(api, side === 'left' ? 'right' : 'left', false, 'a');
          });
        }
      }
    },
    {
      id: 'yarn-phase',
      windup: 480,
      run(api) {
        const n = api.phase === 2 ? 3 : 2;
        for (let i = 0; i < n; i++) {
          api.after(i * 420, () => {
            phasingYarn(api, i % 2 ? 'teal' : 'pink', -4.4 - i * 0.4, 1);
            api.sound.note(72 + i * 4, { instrument: 'marimba', level: 0.07 });
          });
        }
      }
    },
    {
      id: 'laser-pointer',
      windup: 500,
      run(api) {
        // a red dot darts about the floor, the cats' eyes follow it... and
        // one pounces where it stops (far from the marble unless aimed)
        const end = api.aim ? api.marbleX : Math.max(api.marbleX + 180, 280 + Math.random() * 200);
        const path: [number, number][] = [[api.bossX - 160, api.floorY - 4]];
        for (let i = 0; i < 4; i++) path.push([api.marbleX + 120 + Math.random() * 420, api.floorY - 4 - Math.random() * 80]);
        path.push([end, api.floorY - 4]);
        dot = { at: clock, path, dur: 1400 };
        for (let i = 0; i < 5; i++) api.sound.note(86 + (i % 2) * 3, { at: i * 0.28, instrument: 'glock', level: 0.03 });
        api.warn(end, 1650, () => {
          api.shake(10, 300);
          api.sound.thump(1);
          api.fx.burst('dust', 14, end, api.floorY - 6);
          api.fx.burst('star', 6, end, api.floorY - 40, { color: '#b4ff5a' });
          if (Math.abs(end - api.marbleX) < 50) api.strikeMarble();
          else api.spawn({ frames: [shock], x: end - 80, y: 0, vx: -7, onFloor: true, glow: '#b4ff5a' });
          api.spawn({ frames: [shock], x: end + 30, y: 0, vx: 7, onFloor: true, dodge: 'none' });
        }, { kind: 'shadow', width: 110 });
        api.after(1350, () => {
          api.spawn({ frames: POUNCE_A, x: end - 51, y: -80, vy: 16, dodge: 'none', life: 330, frameMs: 60 });
          api.sound.whoosh(0.12, 0.3, 0, 2400, 400);
        });
      }
    },
    {
      id: 'probability-cloud',
      windup: 700,
      phase: 2,
      run(api) {
        // maybe-cats rain down; only half of them are real and land
        api.tint(1500, 'rgba(110,240,255,.08)');
        api.shake(6, 1000);
        api.sound.note(44, { instrument: 'pad', level: 0.12, hold: 0.8 });
        const xs: number[] = [];
        for (let i = 0; i < 6; i++) xs.push(90 + i * 100 + Math.random() * 30);
        const safe = xs.filter((x) => Math.abs(x - api.marbleX) > 85);
        if (api.aim) safe.unshift(api.marbleX);
        safe.forEach((cx, i) => {
          const real = i % 2 === 0;
          const ms = 700 + i * 130;
          if (real) {
            api.warn(cx, ms, () => {
              api.fx.burst('dust', 8, cx, api.floorY - 6);
              api.sound.thump(0.5);
              if (Math.abs(cx - api.marbleX) < 50) api.strikeMarble();
            }, { kind: 'shadow', width: 64 });
          }
          api.after(ms - 330, () => {
            api.spawn({
              frames: i % 4 < 2 ? GHOST_A : GHOST_B,
              x: cx - 51,
              y: -70,
              vy: 15,
              dodge: 'none',
              life: 330,
              frameMs: 60,
              update(s, _t, a) {
                if (!real && s.y > a.floorY - 200) {
                  s.done = true;
                  a.fx.burst('spark', 12, s.x + 51, s.y + 30, { color: '#6ff0ff' });
                  a.sound.note(100, { instrument: 'glock', level: 0.03 });
                }
              }
            });
          });
        });
      }
    },
    {
      id: 'entangled-yarn',
      windup: 620,
      phase: 2,
      run(api) {
        // two yarn balls bound by one glowing thread: one rolls low (hop),
        // its twin sails high a moment later (duck)
        const low = phasingYarn(api, 'pink', -6, 0);
        low.bounce = 0;
        low.g = 0;
        low.onFloor = true;
        low.vy = 0;
        const [x, y] = at(api, 62, 18);
        const high: Shot = {
          frames: YARN_TEAL,
          x: x - 30,
          y: y,
          vx: -6,
          spin: 0.3,
          frameMs: 120,
          dodge: 'duck',
          update(s, _t, a) {
            if (s.hit) return;
            // trails behind the low one, then dips to head height
            s.vy = (a.floorY - 118 - s.y) * 0.08;
            if (s.x < -40) s.done = true;
          }
        };
        api.after(600, () => {
          api.spawn(high);
          links.push({ a: low, b: high });
          api.sound.note(84, { instrument: 'bell', level: 0.06 });
          api.sound.note(91, { instrument: 'bell', level: 0.05 });
        });
        api.sound.whoosh(0.1, 0.6, 0, 1200, 400);
      }
    }
  ],
  drawExtra(g, t, api, state) {
    clock = t;
    if (api.phase === 2 && !p2) {
      p2 = true;
      swapAt = t;
    }
    const f = lastFrame;
    const cx = api.bossX;
    const top = api.bossTop;
    g.imageSmoothingEnabled = false;
    // superposition: faint copies of the box a little to either side
    if (f && state !== 'dying') {
      const k = Math.sin(t / 300);
      g.globalAlpha = 0.16 + Math.abs(k) * 0.1;
      g.drawImage(f, r3(cx - api.bossW / 2 - 6 * U - k * 3 * U), r3(top), api.bossW, api.bossH);
      g.drawImage(f, r3(cx - api.bossW / 2 + 6 * U + k * 3 * U), r3(top), api.bossW, api.bossH);
      g.globalAlpha = 1;
    }
    // electron orbits around the box
    if (state !== 'dying') {
      g.globalCompositeOperation = 'lighter';
      const [ox, oy] = at(api, 51, 40);
      for (let o = 0; o < 2; o++) {
        const tilt = o ? 0.5 : -0.5;
        for (let i = 0; i < 24; i++) {
          const a = (i / 24) * Math.PI * 2;
          const ex = Math.cos(a) * api.bossW * 0.62;
          const ey = Math.sin(a) * 26;
          g.globalAlpha = 0.18;
          g.fillStyle = o ? '#6ff0ff' : '#b4ff5a';
          g.fillRect(r3(ox + ex * Math.cos(tilt) - ey * Math.sin(tilt)), r3(oy + ex * Math.sin(tilt) + ey * Math.cos(tilt)), U, U);
        }
        const a = t / (o ? 380 : 460) + o * 2;
        const ex = Math.cos(a) * api.bossW * 0.62;
        const ey = Math.sin(a) * 26;
        g.globalAlpha = 0.9;
        pxEllipse(g, ox + ex * Math.cos(tilt) - ey * Math.sin(tilt), oy + ex * Math.sin(tilt) + ey * Math.cos(tilt), 7, 7, o ? '#6ff0ff' : '#b4ff5a');
      }
      // eyes glow; brighter when angry
      const real = Math.floor(t / 1600) % 2 ? 'b' : 'a';
      const [ex, ey] = real === 'a' ? at(api, 32, 18) : at(api, 60, 16);
      g.globalAlpha = (p2 || state === 'wind' ? 0.5 : 0.22) + Math.sin(t / 110) * 0.1;
      pxEllipse(g, ex, ey, 30, 12, real === 'a' ? A.eye : B.eye);
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
    }
    // the swap between which cat is real: a sparkle burst
    if (state !== 'dying' && Math.floor(t / 1600) !== swapIdx) {
      swapIdx = Math.floor(t / 1600);
      api.fx.burst('sparkle', 4, cx, top + api.bossH * 0.3);
      api.sound.note(96, { instrument: 'glock', level: 0.02 });
    }
    // the laser dot
    if (dot) {
      const k = Math.min(1, (t - dot.at) / dot.dur);
      const seg = Math.min(dot.path.length - 2, Math.floor(k * (dot.path.length - 1)));
      const q = k * (dot.path.length - 1) - seg;
      const e = q * q * (3 - 2 * q);
      const [x0, y0] = dot.path[seg];
      const [x1, y1] = dot.path[seg + 1];
      const x = x0 + (x1 - x0) * e;
      const y = y0 + (y1 - y0) * e;
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = 0.5;
      pxEllipse(g, x, y, 14, 8, '#ff2d55');
      g.globalAlpha = 1;
      pxEllipse(g, x, y, 5, 4, '#ffd0d8');
      g.globalCompositeOperation = 'source-over';
      if (t - dot.at > dot.dur + 300) dot = null;
    }
    // yarn threads unspool from the box
    const [bx, by] = at(api, 30, 32);
    for (const y of yarns) {
      if (y.s.done || y.s.x > W - 40) continue;
      g.fillStyle = y.color;
      const sx = y.s.x + 24;
      const sy = y.s.y + 24;
      for (let i = 0; i <= 24; i++) {
        const k = i / 24;
        g.fillRect(r3(bx + (sx - bx) * k), r3(by + (sy - by) * k + Math.sin(k * Math.PI) * 30), U, U);
      }
    }
    yarns = yarns.filter((y) => !y.s.done);
    // entangled pairs share one glowing thread
    for (const l of links) {
      if (l.a.done || l.b.done) continue;
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = Math.floor(t / 80) % 2 ? '#ffffff' : '#ff7fb5';
      const ax = l.a.x + 24;
      const ay = l.a.y + 24;
      const bx2 = l.b.x + 24;
      const by2 = l.b.y + 24;
      for (let i = 0; i <= 16; i++) {
        const k = i / 16;
        g.fillRect(r3(ax + (bx2 - ax) * k + Math.sin(t / 60 + k * 9) * 4), r3(ay + (by2 - ay) * k), U, U);
      }
      g.globalCompositeOperation = 'source-over';
    }
    links = links.filter((l) => !l.a.done && !l.b.done);
    // phase 2: the room itself can't decide (slices slip sideways)
    if (p2 && state !== 'dying' && (t - swapAt < 400 || Math.random() < 0.012)) {
      if (t - swapAt >= 400) swapAt = t - 250;
      const c = g.canvas;
      const k = c.width / W;
      g.save();
      g.setTransform(1, 0, 0, 1, 0, 0);
      for (let i = 0; i < 5; i++) {
        const h = Math.max(2, Math.floor((4 + Math.random() * 14) * k));
        const y = Math.floor(Math.random() * (c.height - h));
        g.drawImage(c, 0, y, c.width, h, Math.round((Math.random() - 0.5) * 30 * k), y, c.width, h);
      }
      g.restore();
    }
  }
});

