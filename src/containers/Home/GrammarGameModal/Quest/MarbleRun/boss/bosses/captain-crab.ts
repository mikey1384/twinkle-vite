import { makeSprite, disc, rect, line, poly, ring, eyesX, INK } from '../../pixel';
import { registerBoss } from '../registry';
import type { Shot } from '../types';

// Fort 1 of Harbor Town: Captain Crab, a pompous little pirate with a tricorn
// hat, an eye patch and a curly moustache. His big claw snaps a shockwave
// along the floor, he blows a stream of bouncy bubbles, and he flings his hat
// like a boomerang (and looks very embarrassed until it comes back).

const RED = '#e2553a';
const REDD = '#a8302a';
const REDL = '#ff9a6e';
const HAT = '#2b2440';
const HATL = '#4a3f6a';
const GOLD = '#ffcb32';

let snapUntil = -1e9;
let hatBackAt = -1e9;

function crab(claw: 'rest' | 'open' | 'shut', eyes: 'open' | 'angry' | 'x', hat: boolean) {
  return makeSprite(58, 38, (put) => {
    const BELLY = '#ffd0a8';
    // legs: three pointy ones on each side
    for (let i = 0; i < 3; i++) {
      line(put, 18 + i * 4, 30, 12 + i * 4, 37, REDD, 2);
      line(put, 40 + i * 4, 30, 44 + i * 5, 37, REDD, 2);
    }
    // back claw (small, behind)
    disc(put, 51, 20, 5, 5, RED, REDD);
    poly(put, [[52, 15], [57, 12], [55, 18]], RED);
    line(put, 44, 24, 49, 22, REDD, 2);
    // body
    disc(put, 31, 25, 19, 10, RED, REDD, REDL);
    disc(put, 30, 30, 12, 4, BELLY);
    for (const x of [24, 30, 36]) put(x, 30, '#e8a880');
    for (const [x, y] of [[40, 20], [44, 24], [36, 18]]) put(x, y, REDL);
    // eye stalks
    rect(put, 19, 9, 2, 10, REDD);
    rect(put, 26, 8, 2, 11, REDD);
    // the eye with a patch sits further back
    disc(put, 27, 7, 3, 3, '#fff');
    rect(put, 25, 6, 5, 3, INK);
    line(put, 24, 4, 31, 10, INK);
    if (eyes === 'x') eyesX(put, 17, 4);
    else {
      disc(put, 19.5, 6, 3.2, 3.2, '#fff');
      rect(put, 17, 5, 2, 3, INK);
      put(19, 4, '#fff');
      if (eyes === 'angry') line(put, 16, 2, 22, 4, INK);
    }
    // curly brown moustache and a mouth
    rect(put, 15, 21, 12, 2, '#6b3a1f');
    put(14, 20, '#6b3a1f');
    put(13, 19, '#6b3a1f');
    put(27, 20, '#6b3a1f');
    put(28, 19, '#6b3a1f');
    rect(put, 18, 24, 6, 1, INK);
    // the big front claw (open, shut or resting) on a stubby arm
    line(put, 14, 26, 9, 22, REDD, 3);
    const cy = claw === 'open' ? 12 : 17;
    disc(put, 7, cy + 4, 7, 6, RED, REDD, REDL);
    if (claw === 'open') {
      poly(put, [[1, cy + 1], [5, cy - 7], [9, cy - 6], [6, cy + 1]], RED);
      poly(put, [[0, cy + 6], [-0.5, cy + 2], [5, cy + 3]], RED);
      disc(put, 3, cy + 1, 2, 2, null);
    } else if (claw === 'shut') {
      poly(put, [[0, cy + 1], [4, cy - 3], [8, cy], [4, cy + 3]], RED);
      line(put, 1, cy + 2, 6, cy + 1, INK);
    } else {
      poly(put, [[0, cy + 2], [3, cy - 3], [7, cy - 1], [3, cy + 3]], RED);
      put(1, cy + 3, INK);
      put(2, cy + 3, INK);
    }
    put(5, cy + 2, REDL);
    // the tricorn hat with a gold anchor, cocked over the back
    if (hat) {
      poly(put, [[24, 13], [30, 4], [44, 2], [50, 9], [52, 15], [38, 12]], HAT);
      rect(put, 23, 13, 30, 2, HAT);
      line(put, 24, 13, 52, 13, GOLD);
      line(put, 31, 5, 43, 3, HATL);
      rect(put, 39, 6, 1, 5, GOLD);
      rect(put, 37, 7, 5, 1, GOLD);
      put(37, 10, GOLD);
      put(41, 10, GOLD);
      put(38, 11, GOLD);
      put(40, 11, GOLD);
      disc(put, 47, 5, 2, 2, '#fff');
    } else {
      // bald and blushing, with a sweat drop
      for (const x of [33, 41]) rect(put, x, 19, 3, 1, '#ff7b9a');
      rect(put, 44, 10, 2, 3, '#7ad7ff');
      put(44, 9, '#7ad7ff');
    }
  });
}

const shock = [0, 1].map((f) =>
  makeSprite(14, 14, (put) => {
    for (let k = 0; k < 3; k++) {
      const r = 4 + k * 3 + f;
      for (let a = -1.1; a <= 1.1; a += 0.12) put(13 - Math.cos(a) * r, 13 - Math.abs(Math.sin(a)) * r * 0.9 - 0.5, k === 1 ? '#fff' : '#ffe08a');
    }
    rect(put, 0, 12, 14, 2, '#ffe08a');
  })
);

const bubble = makeSprite(12, 12, (put) => {
  disc(put, 6, 6, 6, 6, 'rgba(160,220,255,.55)');
  ring(put, 6, 6, 5.5, '#bfe9ff', 26);
  rect(put, 3, 3, 2, 2, '#fff');
  put(8, 9, '#fff');
});

const hatShot = [0, 1].map((f) =>
  makeSprite(20, 10, (put) => {
    if (f) poly(put, [[0, 9], [4, 2], [16, 0], [20, 9]], HAT);
    else poly(put, [[0, 9], [6, 0], [14, 1], [20, 9]], HAT);
    rect(put, 0, 8, 20, 2, HAT);
    line(put, 0, 8, 19, 8, GOLD);
    rect(put, 9, 3, 1, 4, GOLD);
    rect(put, 8, 4, 3, 1, GOLD);
  })
);

registerBoss({
  id: 'captain-crab',
  scale: 4,
  intro: 'drop',
  frames: () => ({
    idle: [crab('rest', 'open', true)],
    wind: [crab('open', 'angry', true)],
    snap: [crab('shut', 'angry', true)],
    bald: [crab('rest', 'open', false)],
    baldWind: [crab('open', 'angry', false)],
    hurt: [crab('rest', 'x', true)],
    baldHurt: [crab('rest', 'x', false)]
  }),
  pose(t, state, f) {
    // timers from an earlier fight on another clock: forget them
    if (snapUntil > t + 1000) snapUntil = -1e9;
    if (hatBackAt > t + 4000) hatBackAt = -1e9;
    const bald = t < hatBackAt;
    if (state === 'hurt' || state === 'dazed' || state === 'dying') return { frame: bald ? f.baldHurt[0] : f.hurt[0] };
    if (t < snapUntil) return { frame: f.snap[0], sx: 1.06, sy: 0.94 };
    if (state === 'wind') return { frame: bald ? f.baldWind[0] : f.wind[0], dy: -3, tilt: -0.04 };
    if (state === 'laugh') return { frame: f.wind[0], dx: Math.sin(t / 70) * 6 };
    // a sideways crab shuffle, step by step
    const step = Math.floor(t / 260) % 4;
    return { frame: bald ? f.bald[0] : f.idle[0], dx: [0, 6, 0, -6][step], dy: step % 2 ? -3 : 0 };
  },
  moves: [
    {
      id: 'claw-snap',
      windup: 480,
      run(api) {
        snapUntil = api.t + 260;
        api.shake(4, 180);
        api.sound.note(96, { instrument: 'glock', level: 0.09 });
        api.sound.thump(0.5);
        api.fx.burst('spark', 6, api.bossX - api.bossW * 0.42, api.bossTop + api.bossH * 0.4, { color: '#fff' });
        api.spawn({ frames: shock, frameMs: 80, x: api.bossX - api.bossW * 0.5, y: 0, vx: -7, onFloor: true, glow: '#ffe08a' });
      }
    },
    {
      id: 'bubbles',
      windup: 420,
      run(api) {
        // a stream of bubbles bouncing toward the marble; they pop after a while
        for (let i = 0; i < 5; i++) {
          api.after(i * 150, () => {
            const s: Shot = {
              frames: [bubble],
              x: api.bossX - api.bossW * 0.38,
              y: api.bossTop + api.bossH * 0.55,
              vx: -3.6 - (i % 3) * 0.6,
              vy: -3 - (i % 2) * 1.5,
              g: 0.16,
              bounce: 0.82,
              update(sh, t, a) {
                if (sh.hit || t - (sh.born || 0) < 3200) return;
                sh.done = true;
                a.fx.burst('bubble', 5, sh.x + 18, sh.y + 18, { color: '#bfe9ff', speed: 0.5 });
              }
            };
            api.spawn(s);
            api.sound.note(84 + (i % 3) * 3, { instrument: 'glock', level: 0.05 });
          });
        }
      }
    },
    {
      id: 'hat-toss',
      windup: 560,
      weight: 0.8,
      run(api) {
        // the hat skims at duck height, curves back up and lands on his head
        const home = api.bossX;
        hatBackAt = api.t + 3000;
        api.sound.whoosh(0.1, 0.8, 0, 1600, 600);
        api.sound.whoosh(0.08, 0.8, 1.3, 600, 1600);
        let turning = false;
        const s: Shot = {
          frames: hatShot,
          frameMs: 70,
          x: api.bossX - api.bossW * 0.3,
          y: api.floorY - 112,
          vx: -10,
          dodge: 'duck',
          update(sh, t) {
            if (sh.hit) return;
            // straight out past the marble, then a wide curve back home
            if (sh.x < 50) turning = true;
            if (turning) sh.vx = Math.min(10, (sh.vx || 0) + 0.45);
            sh.vy = (sh.vx || 0) > 0 ? -0.9 : 0;
            if ((sh.vx || 0) > 0 && sh.x > home - 60) {
              sh.done = true;
              hatBackAt = Math.min(hatBackAt, t);
            }
          }
        };
        api.spawn(s);
      }
    }
  ]
});
