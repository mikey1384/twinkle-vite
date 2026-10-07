import { makeSprite, disc, rect, line, poly, eyesX, pxEllipse, r3, U, type Put, type Sprite } from '../../pixel';
import { registerBoss } from '../registry';
import type { BossApi, Pose } from '../types';

// Fort 2 of the Academy: a ghost of chalk dust in a chalkboard-green scarf.
// Whatever it draws comes to life: chalk spikes sketched on the floor rise
// up, a circle drawn in the air drops as a rolling boulder. It fades out and
// back in, throwing chalk darts while unseen. Phase 2: its eyes go pink, its
// doodles march, and a giant board eraser wipes across the room.

const FW = 72;
const FH = 50;
const CH = '#f2f2ea';
const CHD = '#b8c4d0';
const CHL = '#ffffff';
const DUST = '#d8dee6';
const SCARF = '#3d6a52';
const SCARFD = '#28493a';
const STICK = '#fff27a';
const SLATE = '#2b3a4a';
const BLUE = '#7fd8ff';
const PINK = '#ff7ab6';

type Arm = 'low' | 'high';
type Eyes = 'open' | 'x';

// chalk is never solid: speckle it with dust so it reads as powder (no
// holes, which the outline would turn into dark dots)
const dusty = (put: Put): Put => (x, y, col) => {
  const h = (x * 7 + y * 13) % 17;
  put(x, y, col && (h === 0 || h === 5 || h === 11) ? DUST : col);
};

function ghost(arm: Arm, eyes: Eyes, pink: boolean, wisp: number) {
  return makeSprite(FW, FH, (put) => {
    const d = dusty(put);
    // the long wispy tail curling away behind
    poly(d, [[16, 20], [38, 18], [56, 30], [70, 40 + wisp], [62, 44 + wisp], [48, 42], [30, 46], [14, 40]], CH);
    poly(d, [[40, 30], [58, 34], [68, 41 + wisp], [56, 40], [42, 40]], CHD);
    // tattered hem along the bottom
    for (let x = 14; x < 48; x += 5) poly(d, [[x, 40], [x + 5, 40], [x + 2, 49 - ((x / 5) % 2) * 3]], x % 2 ? CHD : CH);
    disc(d, 26, 30, 14, 12, CH, CHD);
    disc(d, 24, 15, 13, 12, CH, CHD, CHL);
    // scribbled hair, like chalk loops
    for (let k = 0; k < 4; k++) {
      const x = 16 + k * 5;
      line(put, x, 4 - (k % 2), x + 3, 1 + (k % 2), CHD);
      line(put, x + 3, 1 + (k % 2), x + 5, 5, CH);
    }
    // scarf with a tail flying back
    rect(put, 15, 25, 20, 4, SCARF);
    rect(put, 15, 28, 20, 1, SCARFD);
    poly(put, [[33, 25], [44, 22 + wisp], [46, 26 + wisp], [34, 29]], SCARF);
    for (let x = 17; x < 34; x += 4) put(x, 26, '#5f9a7a');
    // big hollow eyes with a glint
    if (eyes === 'x') {
      eyesX(put, 14, 11, SLATE);
      eyesX(put, 24, 11, SLATE);
      disc(put, 21, 21, 2, 1.5, SLATE);
    } else {
      disc(put, 16, 13, 3, 4, SLATE);
      disc(put, 26, 13, 3, 4, SLATE);
      rect(put, 15, 12, 2, 2, pink ? PINK : BLUE);
      rect(put, 25, 12, 2, 2, pink ? PINK : BLUE);
      put(17, 11, CHL);
      put(27, 11, CHL);
      // a small round 'ooo' mouth
      disc(put, 21, 20, 1.6, 2, SLATE);
      if (pink) {
        line(put, 12, 8, 18, 10, SLATE);
        line(put, 30, 8, 24, 10, SLATE);
      }
    }
    // the chalk hand: at its chest, or high and scribbling
    const hx = arm === 'high' ? 6 : 8;
    const hy = arm === 'high' ? 6 : 30;
    line(d, 20, 30, hx + 3, hy + 3, CH, 3);
    disc(put, hx + 2, hy + 2, 3, 3, CH, CHD);
    line(put, hx, hy + 2, hx - 5, hy - (arm === 'high' ? 4 : 2), STICK, 2);
    put(hx - 6, hy - (arm === 'high' ? 5 : 3), CHL);
  });
}

const cache = new Map<string, Sprite>();
function look(arm: Arm, eyes: Eyes, pink: boolean, wisp: number) {
  const key = `${arm}|${eyes}|${pink}|${wisp}`;
  let s = cache.get(key);
  if (!s) {
    s = ghost(arm, eyes, pink, wisp);
    cache.set(key, s);
  }
  return s;
}

// a chalk spike at four heights as it grows out of the floor
const spike = [5, 11, 17, 22].map((h) =>
  makeSprite(14, h, (put) => {
    const d = dusty(put);
    poly(d, [[0, h], [7, 0], [14, h]], CH);
    line(put, 7, 1, 10, h - 1, CHD);
    line(put, 3, h - 2, 11, h - 2, CHD);
  })
);
const boulder = makeSprite(16, 16, (put) => {
  const d = dusty(put);
  disc(d, 8, 8, 8, 8, CH, CHD, CHL);
  line(put, 3, 6, 8, 4, CHD);
  line(put, 6, 11, 12, 9, CHD);
  // a little drawn-on face, because it was doodled
  rect(put, 5, 7, 1, 2, SLATE);
  rect(put, 9, 7, 1, 2, SLATE);
  line(put, 5, 11, 9, 11, SLATE);
});
const dart = [0, 1].map((f) =>
  makeSprite(18, 6, (put) => {
    rect(put, 0, 2, 6, 2, STICK);
    put(0, 2, CHL);
    for (let k = 0; k < 6; k++) put(7 + k * 2, 2 + ((k + f) % 2 ? 1 : 0), k < 3 ? CH : DUST);
  })
);
const doodle = [0, 1].map((f) =>
  makeSprite(14, 14, (put) => {
    const d = dusty(put);
    disc(d, 7, 6, 6, 6, CH, CHD);
    poly(d, [[1, 7], [13, 7], [12, 13], [9, 11 - f], [7, 13], [5, 11 - f], [2, 13]], CH);
    rect(put, 4, 5, 2, 2, SLATE);
    rect(put, 8, 5, 2, 2, SLATE);
    put(1, 3 + f, PINK);
  })
);
const boardEraser = makeSprite(34, 14, (put) => {
  rect(put, 0, 0, 34, 8, '#9a6a3a');
  rect(put, 0, 0, 34, 2, '#c09060');
  rect(put, 0, 8, 34, 6, '#4a4a52');
  for (let x = 1; x < 34; x += 3) put(x, 12, '#6a6a72');
  rect(put, 3, 3, 28, 2, '#7a4a20');
});

// ---- what it is drawing, and whether it is visible
let now = 0;
let phase = 1;
let fadeAt = -1e9;
let fadeMs = 0;
const sketches: { kind: 'spike' | 'circle'; x: number; y: number; at: number; ms: number }[] = [];
const art = (api: BossApi, x: number, y: number) => ({ x: api.bossX - api.bossW / 2 + (x + 1) * (api.bossW / (FW + 2)), y: api.bossTop + (y + 1) * (api.bossH / (FH + 2)) });

function fadeAlpha(t: number) {
  const k = t - fadeAt;
  if (k < 0 || k > fadeMs) return 1;
  if (k < 300) return 1 - (k / 300) * 0.9;
  if (k > fadeMs - 300) return 0.1 + ((k - (fadeMs - 300)) / 300) * 0.9;
  return 0.1;
}

// spikes sketched in a line toward the marble, then rising one by one
function spikeRipple(api: BossApi, delay: number, aim: boolean) {
  const xs: number[] = [];
  for (let x = api.bossX - api.bossW * 0.55; x > api.marbleX + 140 && xs.length < 6; x -= 72) xs.push(x);
  if (aim) xs.push(api.marbleX);
  xs.forEach((x, i) => {
    const wait = delay + 520 + i * 150;
    api.after(delay + i * 60, () => sketches.push({ kind: 'spike', x, y: api.floorY, at: now, ms: wait - delay - i * 60 }));
    api.warn(x, wait, () => {
      api.spawn({
        frames: [spike[0]],
        x: x - 21,
        y: 0,
        onFloor: true,
        dodge: 'none',
        update(sh, t) {
          const age = t - (sh.born || t);
          sh.frames = [spike[Math.min(3, Math.floor(age / 50))]];
          if (age > 760) {
            sh.done = true;
            api.fx.burst('dust', 6, x, api.floorY - 20);
          }
        }
      });
      api.sound.note(86 - (i % 4) * 2, { instrument: 'glock', level: 0.06 });
      api.sound.thump(0.25);
      api.fx.burst('puff', 3, x, api.floorY - 6);
      if (Math.abs(x - api.marbleX) < 50) api.strikeMarble();
    }, { kind: 'column', color: 'rgba(240,248,255,.7)', width: 36 });
  });
  api.sound.whoosh(0.05, 0.6, 0, 5000, 7000);
}

registerBoss({
  id: 'chalk-specter',
  scale: 3.2,
  hover: 28,
  intro: 'fade',
  frames: () => ({ idle: [look('low', 'open', false, 0)], hurt: [look('low', 'x', false, 0)] }),
  pose(t, state): Pose {
    const pink = phase === 2;
    const wisp = Math.floor(t / 300) % 2 ? 2 : 0;
    const bob = Math.round(Math.sin(t / 520) * 3) * U;
    // a chalky flicker, and whole fades when it hides
    const flicker = Math.floor(t / 90) % 11 === 0 ? 0.75 : 0.95;
    const alpha = Math.min(flicker, fadeAlpha(t));
    if (state === 'hurt' || state === 'dazed' || state === 'dying') return { frame: look('low', 'x', pink, wisp), dy: bob, alpha: 1 };
    if (state === 'wind') return { frame: look('high', 'open', pink, wisp), dy: bob - U * 2, sx: 1.04, sy: 0.97, alpha };
    return { frame: look('low', 'open', pink, wisp), dy: bob, sx: 1 + Math.sin(t / 400) * 0.02, alpha };
  },
  moves: [
    {
      id: 'chalk-spikes',
      windup: 700,
      run(api) {
        spikeRipple(api, 0, api.aim);
        if (api.phase === 2) spikeRipple(api, 900, false);
      }
    },
    {
      id: 'chalk-boulder',
      windup: 750,
      run(api) {
        // a circle drawn in the air becomes a boulder that drops and rolls
        const n = api.phase === 2 ? 2 : 1;
        for (let i = 0; i < n; i++) {
          const x = api.bossX - api.bossW * (0.6 + i * 0.35);
          const y = api.bossTop + 20 - i * 10;
          api.after(i * 700, () => {
            sketches.push({ kind: 'circle', x, y, at: now, ms: 420 });
            api.sound.whoosh(0.05, 0.4, 0, 6000, 8000);
          });
          api.after(i * 700 + 420, () => {
            api.spawn({ frames: [boulder], x: x - 24, y: y - 24, vx: -5.4, vy: 1, g: 0.42, bounce: 0.35, spin: 0.22 });
            api.fx.burst('puff', 5, x, y);
            api.sound.note(64, { instrument: 'marimba', level: 0.08 });
            api.after(380, () => {
              api.shake(5, 160);
              api.sound.thump(0.5);
            });
          });
        }
      }
    },
    {
      id: 'fade-darts',
      windup: 520,
      run(api) {
        // it fades away; darts of chalk fly out of thin air, then it returns
        fadeAt = now;
        fadeMs = 1500;
        api.sound.note(79, { instrument: 'pad', level: 0.08, hold: 0.8 });
        const n = api.phase === 2 ? 4 : 3;
        for (let i = 0; i < n; i++) {
          api.after(350 + i * 230, () => {
            const h = dart[0].height * U;
            const e = art(api, 16, 13);
            api.spawn({ frames: dart, x: e.x - 40, y: api.floorY - 58 - h, vx: -9.5, dodge: 'duck', frameMs: 60, glow: '#ffffff' });
            api.fx.burst('puff', 2, e.x - 20, api.floorY - 70);
            api.sound.whoosh(0.07, 0.25, 0, 4000, 1500);
          });
        }
        api.after(1350, () => api.fx.burst('puff', 8, api.bossX, api.bossTop + api.bossH * 0.4));
      }
    },
    {
      id: 'doodle-army',
      windup: 760,
      phase: 2,
      run(api) {
        // three chalk doodles step off the board and hop at the marble
        for (let i = 0; i < 3; i++) {
          api.after(i * 260, () => {
            const p = art(api, 8, 40);
            sketches.push({ kind: 'circle', x: p.x - 20, y: p.y, at: now, ms: 200 });
            api.spawn({
              frames: doodle,
              x: p.x - 50,
              y: api.floorY - 48,
              vx: -3.8 - i * 0.3,
              frameMs: 140,
              update(sh, t) {
                // skittering little hops, low enough that the marble hops them
                const age = t - (sh.born || t);
                if (!sh.hit) sh.y = api.floorY - 48 - Math.round(Math.abs(Math.sin(age / 110 + i)) * 3) * U;
                if (age > 2600) {
                  sh.done = true;
                  api.fx.burst('puff', 5, sh.x + 20, sh.y + 20);
                }
              }
            });
            api.sound.note(76 + i * 4, { instrument: 'marimba', level: 0.07 });
          });
        }
      }
    },
    {
      id: 'eraser-wipe',
      windup: 820,
      phase: 2,
      run(api) {
        // a giant board eraser wipes across the room at head height
        api.tint(1200, 'rgba(30,60,45,.22)');
        const h = boardEraser.height * U;
        api.spawn({
          frames: [boardEraser],
          x: api.bossX - api.bossW * 0.6,
          y: api.floorY - 58 - h,
          vx: -8,
          dodge: 'duck',
          update(sh) {
            if (!sh.hit && Math.random() < 0.5) api.fx.burst('dust', 1, sh.x + 100, sh.y + 30);
          }
        });
        api.sound.whoosh(0.18, 1.1, 0, 600, 300);
        api.shake(4, 900);
      }
    }
  ],
  drawExtra(g, t, api, state) {
    now = t;
    if (state === 'intro') {
      // a fresh fight: forget the last one's timers and effects
      fadeAt = -1e9;
      sketches.length = 0;
    }
    if (state !== 'dazed' && state !== 'dying') phase = api.phase;
    const pink = phase === 2;
    const a = fadeAlpha(t);

    // chalk dust drifts off its tail
    for (let i = 0; i < 14; i++) {
      const k = ((t / 1400 + i / 14) % 1);
      const p = art(api, 58 + i * 0.8, 40);
      g.globalAlpha = (1 - k) * 0.7 * a;
      g.fillStyle = i % 3 ? CH : DUST;
      g.fillRect(r3(p.x + k * 40 + Math.sin(i * 3 + t / 300) * 8), r3(p.y - k * 70 + i * 2), U, U);
    }
    g.globalAlpha = 1;

    // pink glowing eyes and a dusty aura once it is angry
    if (pink && state !== 'dazed' && state !== 'dying' && state !== 'hurt') {
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = (0.18 + Math.abs(Math.sin(t / 220)) * 0.12) * a;
      pxEllipse(g, api.bossX - api.bossW * 0.1, api.bossTop + api.bossH * 0.5, api.bossW * 0.42, api.bossH * 0.5, '#ffb0d4');
      g.globalAlpha = a;
      for (const ex of [16, 26]) {
        const e = art(api, ex, 13);
        g.fillStyle = 'rgba(255,122,182,.8)';
        g.fillRect(r3(e.x - 9), r3(e.y - 9), 18, 18);
      }
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
    }

    // sketches drawing themselves before they come to life
    g.fillStyle = CH;
    for (let i = sketches.length - 1; i >= 0; i--) {
      const s = sketches[i];
      const k = (t - s.at) / s.ms;
      if (k > 1 || k < -0.1) {
        sketches.splice(i, 1);
        continue;
      }
      g.globalAlpha = 0.9;
      if (s.kind === 'spike') {
        // a dashed triangle drawn stroke by stroke
        const pts: [number, number][] = [[s.x - 21, s.y], [s.x, s.y - 66], [s.x + 21, s.y]];
        const steps = 30;
        for (let j = 0; j < steps * Math.min(1, k * 1.4); j++) {
          if (j % 3 === 2) continue;
          const u = (j / steps) * 2;
          const seg = Math.min(1, Math.floor(u));
          const f = u - seg;
          const [ax, ay] = pts[seg];
          const [bx, by] = pts[seg + 1];
          g.fillRect(r3(ax + (bx - ax) * f), r3(ay + (by - ay) * f), U, U);
        }
      } else {
        // a circle sketched around in one go
        const steps = 28;
        for (let j = 0; j < steps * Math.min(1, k * 1.2); j++) {
          const ang = Math.PI * 0.5 + (j / steps) * Math.PI * 2;
          g.fillRect(r3(s.x + Math.cos(ang) * 26), r3(s.y + Math.sin(ang) * 26), U * 2, U * 2);
        }
      }
      g.globalAlpha = 1;
    }
    // the chalk tip leaves a little trail while it scribbles
    if (state === 'wind') {
      const p = art(api, 0, 1);
      g.fillStyle = STICK;
      for (let j = 0; j < 5; j++) g.fillRect(r3(p.x + Math.cos(t / 60 + j) * 14), r3(p.y + Math.sin(t / 45 + j * 2) * 10), U, U);
    }
  }
});
