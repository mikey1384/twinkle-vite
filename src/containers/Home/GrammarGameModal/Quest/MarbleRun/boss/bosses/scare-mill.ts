import { makeSprite, disc, rect, line, poly, ring, eyesX, INK, U, Put, Sprite } from '../../pixel';
import { registerBoss } from '../registry';
import type { Shot } from '../types';

// Fort 1 of World 3: the Scare-Mill, a grumpy little windmill. Its windows
// are its eyes (the shutters are its eyebrows), its door is a frowning mouth
// and a tin rooster spins on its roof. Its sails turn all the time (faster
// when it's cross); it blows gusts across the room, flings flour sacks that
// burst into clouds of white dust, and rolls a millstone out of its door.

const SAIL = '#f4e6c8';
const SAILD = '#cbb48a';
const SPAR = '#7a4a2a';
const FLOUR = '#f8f4ea';
const STEPS = 6; // sail angles across a quarter turn (four sails repeat)
const HUB: [number, number] = [31, 17];

let rot = 0;
let lastT = 0;
let mood = 'idle';
let gustUntil = -1e9;

function sails(put: Put, a0: number) {
  for (let k = 0; k < 4; k++) {
    const a = a0 + (k * Math.PI) / 2;
    const ux = Math.cos(a);
    const uy = Math.sin(a);
    // the sail sits on the trailing side of each spar
    const px = -uy;
    const py = ux;
    const at = (d: number, w: number): [number, number] => [HUB[0] + ux * d + px * w, HUB[1] + uy * d + py * w];
    poly(put, [at(4, 0.5), at(16, 0.5), at(16, 5.5), at(4, 5.5)], SAIL);
    for (const d of [8, 12]) line(put, ...at(d, 0.5), ...at(d, 5), SAILD);
    line(put, ...at(4, 3), ...at(16, 3), SAILD);
    line(put, HUB[0], HUB[1], ...at(17, 0), SPAR);
  }
  disc(put, HUB[0], HUB[1], 2.4, 2.4, '#5a3520');
  put(HUB[0] - 1, HUB[1] - 1, '#b07a4a');
}

function mill(step: number, face: 'grump' | 'shout' | 'x') {
  return makeSprite(52, 64, (put) => {
    const Wl = '#efe3cf';
    const WlD = '#c9b89a';
    const ROOF = '#c8423a';
    const ROOFD = '#8f2a2a';
    // tower: a tapered stone-and-plaster body
    poly(put, [[19, 22], [43, 22], [48, 61], [14, 61]], Wl);
    poly(put, [[36, 22], [43, 22], [48, 61], [40, 61]], WlD);
    for (const [x, y] of [[18, 50], [24, 56], [42, 47], [20, 36], [44, 56]]) rect(put, x, y, 3, 1, WlD);
    rect(put, 13, 60, 36, 2, '#8a7a62');
    // conical roof and the tin rooster on top
    poly(put, [[31, 6], [45, 23], [17, 23]], ROOF);
    poly(put, [[31, 6], [45, 23], [36, 23]], ROOFD);
    for (let y = 11; y < 23; y += 4) line(put, 31 - (y - 6) * 0.82, y, 31 + (y - 6) * 0.82, y, ROOFD);
    line(put, 31, 0, 31, 6, '#6d7683');
    poly(put, [[28, 1], [31, 0], [34, 2], [32, 4], [29, 4]], '#a9b3bf');
    put(28, 0, '#d93a4a');
    put(27, 2, '#ffcb32');
    // window eyes with shutter brows
    const shout = face === 'shout';
    for (const [x, y] of [[21, 34], [34, 35]]) {
      rect(put, x, y, 7, 7, '#5a3520');
      if (face === 'x') eyesX(put, x + 1.5, y + 1.5, '#ffe7a0');
      else {
        rect(put, x + 1, y + 1, 5, 5, shout ? '#ff8a3a' : '#ffe7a0');
        rect(put, x + 1, y + 3, 3, 3, INK);
        put(x + 1, y + 1, '#fff');
      }
    }
    // shutters tilted into a scowl
    line(put, 19, 30, 28, 33, '#4f7a3a', 2);
    line(put, 43, 31, 34, 34, '#4f7a3a', 2);
    // the door is a frowning mouth (open wide when it shouts)
    if (shout) {
      disc(put, 31, 51, 5, 5, '#2a1a12');
      rect(put, 26, 51, 11, 6, '#2a1a12');
      rect(put, 28, 55, 7, 2, '#c8423a');
    } else {
      poly(put, [[26, 56], [26, 51], [31, 47], [36, 51], [36, 56]], '#6b4226');
      line(put, 31, 48, 31, 55, '#4a2c18');
      put(34, 52, '#ffcb32');
      line(put, 25, 46, 31, 44, INK);
      line(put, 37, 46, 31, 44, INK);
    }
    rect(put, 25, 56, 13, 4, '#8a7a62');
    // flour sacks piled by the door
    for (const [x, y] of [[8, 54], [13, 55], [10, 49]]) {
      disc(put, x, y + 3, 4, 3.6, '#e2d3b0', '#b8a47e');
      rect(put, x - 1, y - 1, 3, 1, '#8a6a42');
    }
    put(9, 56, '#5a7ec8');
    // the sails, drawn over the roof
    sails(put, (step / STEPS) * (Math.PI / 2) + 0.35);
  });
}

const sack = makeSprite(12, 13, (put) => {
  disc(put, 6, 8, 5.5, 5, '#e2d3b0', '#b8a47e', '#fff8e8');
  rect(put, 4, 1, 4, 3, '#e2d3b0');
  rect(put, 3, 3, 6, 1, '#8a6a42');
  put(5, 8, '#5a7ec8');
  put(6, 8, '#5a7ec8');
  put(6, 9, '#5a7ec8');
});

const millstone = makeSprite(16, 16, (put) => {
  disc(put, 8, 8, 8, 8, '#9a9488', '#6b665d', '#cfc9bb');
  ring(put, 8, 8, 5, '#6b665d', 24);
  disc(put, 8, 8, 1.6, 1.6, '#3a352e');
  for (let a = 0; a < 6; a++) line(put, 8 + Math.cos(a) * 2.5, 8 + Math.sin(a) * 2.5, 8 + Math.cos(a) * 7, 8 + Math.sin(a) * 7, '#837d71');
});

const puff = [0, 1].map((f) =>
  makeSprite(22, 12, (put) => {
    disc(put, 8, 6, 7, 5, '#e8f6ff');
    disc(put, 15, 6 + f, 6, 4.5, '#e8f6ff', '#bcd8ea');
    disc(put, 4, 7, 3, 3, '#ffffff');
    line(put, 0, 3 + f, 6, 3 + f, '#ffffff');
  })
);
const streak = makeSprite(26, 3, (put) => {
  line(put, 0, 1, 25, 1, '#e8f6ff');
  line(put, 4, 0, 14, 0, '#ffffff');
}, { outline: false });

function sailSpeed(t: number, state: string) {
  if (t < gustUntil) return 0.03;
  if (state === 'wind') return 0.012;
  if (state === 'hurt' || state === 'dazed' || state === 'dying') return 0.0004;
  return 0.0025;
}

registerBoss({
  id: 'scare-mill',
  scale: 3,
  intro: 'drop',
  frames() {
    const f: Record<string, Sprite[]> = { idle: [], wind: [], hurt: [] };
    for (let s = 0; s < STEPS; s++) {
      f.idle.push(mill(s, 'grump'));
      f.wind.push(mill(s, 'shout'));
      f.hurt.push(mill(s, 'x'));
    }
    return f;
  },
  pose(t, state, f) {
    // timers from an earlier fight on another clock: forget them
    if (gustUntil > t + 2000) gustUntil = -1e9;
    if (lastT > t) lastT = t;
    // sails keep turning; the speed follows its mood. The engine asks for
    // an idle pose first each frame (to size it), then the real one, so the
    // turn uses the real state remembered from the last frame.
    const dt = Math.min(100, Math.max(0, t - lastT));
    if (dt > 0) {
      rot += dt * sailSpeed(t, mood);
      lastT = t;
    }
    mood = state;
    const step = Math.floor((rot / (Math.PI / 2)) * STEPS) % STEPS;
    if (state === 'hurt' || state === 'dazed' || state === 'dying') return { frame: f.hurt[step], tilt: 0.05 };
    if (t < gustUntil) return { frame: f.wind[step], dx: Math.sin(t / 40) * 3, sy: 1.02 };
    if (state === 'wind') return { frame: f.wind[step], dy: -U, sy: 1.04, sx: 0.98 };
    if (state === 'laugh') return { frame: f.idle[step], dx: Math.sin(t / 60) * 5 };
    // a little indignant hop every few seconds
    const c = t % 3200;
    const hop = c < 300 ? Math.sin((c / 300) * Math.PI) * 12 : 0;
    return { frame: f.idle[step], dy: -hop, sy: c < 80 ? 0.94 : 1, tilt: Math.sin(t / 900) * 0.02 };
  },
  moves: [
    {
      id: 'gust',
      windup: 560,
      run(api) {
        // the sails roar; a gust blows across the room (the marble ducks and
        // braces; a wrong pick gets it shoved back)
        gustUntil = api.t + 1400;
        api.sound.whoosh(0.16, 1.4, 0, 700, 2600);
        api.sound.whoosh(0.1, 1.0, 0.3, 2600, 900);
        const top = api.bossTop + api.bossH * 0.2;
        api.spawn({ frames: puff, frameMs: 120, x: api.bossX - api.bossW * 0.5, y: api.floorY - 118, vx: -7, dodge: 'duck' });
        for (let i = 0; i < 9; i++) {
          api.after(i * 120, () => {
            const y = top + ((i * 53) % 150);
            api.spawn({ frames: [streak], x: api.bossX - api.bossW * 0.4, y, vx: -14 - (i % 3) * 2, dodge: 'none' });
            api.fx.add({ kind: 'leaf', x: api.bossX - api.bossW * 0.4, y: y + 10, vx: -8 - Math.random() * 4, vy: -0.5 + Math.random(), color: i % 2 ? '#8bc34a' : '#e0a850' });
          });
        }
      }
    },
    {
      id: 'flour',
      windup: 500,
      run(api) {
        // sacks fly in arcs and burst into flour clouds where they land (away
        // from the marble unless this answers a wrong pick)
        const xs = [0, 1, 2].map((i) => 180 + i * 170 + Math.random() * 40).filter((x) => Math.abs(x - api.marbleX) > 90).slice(0, 2);
        if (api.aim) xs.unshift(api.marbleX);
        for (let i = 0; i < xs.length; i++) {
          api.after(i * 280, () => {
            const sx = api.bossX - api.bossW * 0.25;
            const sy = api.bossTop + api.bossH * 0.4;
            const n = 54;
            const g = 0.3;
            const tx = xs[i] - 18;
            const ty = api.floorY - 15 * U;
            let burst = false;
            const pop = (x: number, y: number) => {
              burst = true;
              api.fx.burst('puff', 16, x, y, { color: FLOUR, speed: 1.2 });
              api.fx.burst('dust', 10, x, y, { color: FLOUR });
              api.flash(90, 'rgba(255,255,255,.22)');
              api.sound.thump(0.4);
              api.sound.whoosh(0.06, 0.4, 0, 1200, 300);
            };
            const s: Shot = {
              frames: [sack],
              x: sx,
              y: sy,
              vx: (tx - sx) / n,
              vy: (ty - sy - (g * n * n) / 2) / n,
              g,
              spin: -0.15,
              dodge: api.aim && i === 0 ? 'hop' : 'none',
              update(sh, t, a) {
                if (burst) return;
                if (sh.hit && Math.abs(sh.x + 18 - a.marbleX) < 48) pop(sh.x + 18, sh.y + 20);
                else if (!sh.hit && sh.y + 15 * U >= api.floorY) {
                  sh.done = true;
                  pop(sh.x + 18, api.floorY - 12);
                }
              }
            };
            api.spawn(s);
            api.sound.note(62 + i * 3, { instrument: 'marimba', level: 0.08 });
          });
        }
      }
    },
    {
      id: 'millstone',
      windup: 620,
      weight: 0.8,
      run(api) {
        // the door bangs open and a millstone rolls out
        api.shake(5, 300);
        api.sound.thump(0.8);
        api.fx.burst('dust', 10, api.bossX, api.ledgeY - 6, { color: FLOUR });
        api.spawn({ frames: [millstone], x: api.bossX - 24, y: api.ledgeY - 48, vx: -5.8, vy: -1, g: 0.4, bounce: 0.25, spin: -0.25 });
        api.sound.note(45, { instrument: 'marimba', level: 0.1 });
      }
    }
  ]
});
