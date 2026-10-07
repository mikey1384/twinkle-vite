import { makeSprite, disc, rect, line, poly, eyesX, pxEllipse, star, r3, U, W, H, type Sprite } from '../../pixel';
import { registerBoss } from '../registry';
import type { BossApi } from '../types';

// Castle of the Passive Glacier: a colossal frost mammoth with a glacier on
// its back and curling tusks. It trumpets an avalanche across the arena,
// slams its tusks for an ice shockwave, and breathes frost that glazes the
// floor. Phase 2: its eyes and crystals glow, a blizzard howls through the
// hall with icicle rain, and ice pillars burst up in a line.

const SCALE = 3.5;
const F = '#6e7fa8';
const FD = '#47557e';
const FL = '#9fb0d4';
const FDD = '#323c5e';
const SNOW = '#f4f8ff';
const ICE = '#bfeaff';
const ICED = '#6fb7e0';
const TUSK = '#f3ead2';
const TUSKD = '#c9b98f';

type Trunk = 'down' | 'up' | 'forward';
function mammoth(trunk: Trunk, eye: 'open' | 'x' | 'shut', sway: number) {
  return makeSprite(80, 62, (put) => {
    // far legs (darker, behind)
    rect(put, 30, 44, 8, 16, FDD);
    rect(put, 64, 44, 8, 16, FDD);
    // tail
    line(put, 76, 30, 79, 38, FD, 2);
    disc(put, 79, 39, 1.5, 2, FDD);
    // the great woolly body
    disc(put, 47, 32, 30, 22, F, FD, FL);
    // shaggy fringe hanging from the belly
    for (let i = 0; i < 9; i++) {
      const x = 22 + i * 6;
      const h = 5 + ((i * 7) % 3) + (i % 2 ? sway : -sway);
      poly(put, [[x, 46], [x + 6, 46], [x + 3 + (i % 2 ? 1 : -1), 46 + h]], i % 2 ? FD : F);
    }
    // near legs: thick pillars with toenails
    for (const x of [22, 56]) {
      rect(put, x, 46, 10, 15, F);
      rect(put, x + 7, 46, 3, 15, FD);
      rect(put, x - 1, 58, 12, 3, FD);
      for (const n of [x, x + 4, x + 8]) rect(put, n, 59, 2, 2, TUSK);
    }
    // a glacier rides on its back: blue crystals with snow at their feet
    const crystals: [number, number, number, number][] = [
      [30, 13, 4, 12],
      [37, 10, 5, 18],
      [45, 9, 6, 22],
      [54, 10, 5, 17],
      [62, 14, 4, 11]
    ];
    for (const [x, y, w, h] of crystals) {
      poly(put, [[x - w, y + 4], [x, y - h + 6], [x + w, y + 4]], ICE);
      poly(put, [[x, y - h + 6], [x + w, y + 4], [x + 1, y + 4]], ICED);
      line(put, x - 1, y - h + 9, x - w + 2, y + 2, '#fff');
    }
    disc(put, 46, 14, 20, 4, SNOW);
    disc(put, 40, 13, 6, 2.5, '#fff');
    for (const [x, y] of [[28, 17], [62, 17], [70, 22], [24, 22]]) disc(put, x, y, 3, 1.6, SNOW);
    // ear flap
    disc(put, 32, 28, 7, 10, FD, FDD);
    disc(put, 31, 27, 4, 6, '#8a6f88');
    // head: a high domed skull with a snowy tuft
    disc(put, 20, 26, 15, 16, F, FD, FL);
    disc(put, 18, 11, 7, 3, SNOW);
    put(15, 9, '#fff');
    // shaggy brow over the eye
    poly(put, [[8, 22], [24, 19], [22, 24], [10, 25]], FD);
    for (const x of [10, 14, 18, 22]) put(x, 25, FDD);
    if (eye === 'x') eyesX(put, 12, 25, '#14102a');
    else if (eye === 'shut') line(put, 12, 27, 16, 27, '#14102a');
    else {
      rect(put, 12, 25, 5, 4, '#14102a');
      put(13, 25, '#fff');
      put(16, 28, '#4a7fd0');
    }
    // far tusk (behind the trunk)
    for (const [x0, y0, x1, y1] of [[16, 38, 11, 45], [11, 45, 6, 47], [6, 47, 3, 44], [3, 44, 3, 39]]) line(put, x0 + 4, y0, x1 + 4, y1, TUSKD, 3);
    // trunk
    if (trunk === 'down') {
      line(put, 12, 32, 10, 44, F, 5);
      line(put, 10, 44, 9, 52, F, 4);
      line(put, 9, 52, 12, 56, F, 3);
      line(put, 13, 55, 14, 53, FD, 2);
      for (const y of [36, 40, 44, 48]) put(10, y, FD);
    } else if (trunk === 'up') {
      line(put, 10, 32, 6, 22, F, 5);
      line(put, 6, 22, 4, 12, F, 4);
      line(put, 4, 12, 7, 6, F, 3);
      disc(put, 8, 5, 2.5, 2.5, FD);
      disc(put, 8, 5, 1.2, 1.2, '#2a1f45');
      for (const y of [28, 24, 18]) put(7, y, FD);
      // open mouth, trumpeting
      poly(put, [[12, 34], [20, 34], [16, 40]], '#5a1e3a');
      put(15, 35, '#e06a8a');
    } else {
      line(put, 12, 32, 6, 36, F, 5);
      line(put, 6, 36, 1, 36, F, 4);
      disc(put, 1, 36, 1.6, 2.6, FD);
      for (const x of [9, 6, 3]) put(x, 35, FD);
    }
    // near tusk: a big curl forward and up
    line(put, 16, 38, 11, 45, TUSK, 3);
    line(put, 11, 45, 5, 48, TUSK, 3);
    line(put, 5, 48, 1, 45, TUSK, 3);
    line(put, 1, 45, 1, 39, TUSK, 2);
    line(put, 12, 47, 7, 49, TUSKD, 1);
    put(1, 38, '#fff');
    // frost tips on the fur
    for (const [x, y] of [[40, 40], [52, 42], [64, 38], [70, 30], [36, 24], [8, 34]]) put(x, y, SNOW);
  });
}

const snowWall = [0, 1].map((f) =>
  makeSprite(28, 18, (put) => {
    disc(put, 14, 12, 14, 7, '#e8f2ff', '#b8c9e8');
    disc(put, 8 + f * 2, 8, 6, 5, '#f4f8ff', '#c8d6ee');
    disc(put, 18 - f, 6, 7, 6, '#fff', '#d6e2f6');
    disc(put, 24, 10, 4, 4, '#f4f8ff');
    for (const [x, y] of [[4 + f, 6], [12, 2], [22 - f, 3], [26, 7]]) put(x, y, '#fff');
    put(10 + f * 3, 14, '#9fb0d4');
    put(20 - f * 2, 15, '#9fb0d4');
  })
);
const snowball = makeSprite(10, 10, (put) => disc(put, 5, 5, 5, 5, '#f4f8ff', '#b8c9e8', '#fff'));
const iceCrest = [0, 1].map((f) =>
  makeSprite(22, 16, (put) => {
    poly(put, [[0, 16], [4, 6 - f], [7, 10], [11, 0 + f], [15, 8], [18, 4 - f], [22, 16]], ICE);
    poly(put, [[11, 0 + f], [15, 8], [18, 4 - f], [22, 16], [12, 16]], ICED);
    line(put, 10, 3, 6, 14, '#fff');
    put(4, 8, '#fff');
  })
);
const frostPuff = [0, 1, 2].map((f) =>
  makeSprite(18, 14, (put) => {
    disc(put, 9, 8, 8 - f, 6 - f * 0.5, '#d6f0ff', '#9fd0f0');
    disc(put, 6, 6, 4, 3, '#f4fbff');
    put(12 + f, 4, '#fff');
    put(4, 10 - f, '#fff');
  })
);
const icicle = [0, 1].map((f) =>
  makeSprite(10, 26, (put) => {
    poly(put, [[0, 0], [10, 0], [5, 26]], ICE);
    poly(put, [[5, 0], [10, 0], [5, 26]], ICED);
    line(put, 3, 1, 5, 14 + f * 4, '#fff');
    rect(put, 0, 0, 10, 2, '#fff');
  })
);
const pillar = makeSprite(16, 40, (put) => {
  poly(put, [[0, 40], [2, 12], [8, 0], [14, 12], [16, 40]], ICE);
  poly(put, [[8, 0], [14, 12], [16, 40], [9, 40]], ICED);
  line(put, 6, 4, 4, 36, '#fff');
  for (const y of [16, 26, 34]) line(put, 3, y, 13, y - 3, '#9fd8f6');
});

let built: Record<string, Sprite[]> | null = null;
function frames() {
  if (!built) {
    built = {
      idle: [mammoth('down', 'open', -1), mammoth('down', 'open', 1)],
      blink: [mammoth('down', 'shut', 0)],
      wind: [mammoth('up', 'open', 0)],
      breath: [mammoth('forward', 'open', 0)],
      hurt: [mammoth('down', 'x', 0)]
    };
  }
  return built;
}

// ---- per-fight state (reset at the intro)
let act: { kind: 'slam' | 'breath'; at: number; until: number } | null = null;
let iceUntil = 0;
let iceAt = 0;
let blizzardUntil = 0;
let blizzardAt = 0;
let lastIntro = -1e9;
function reset() {
  act = null;
  iceUntil = 0;
  blizzardUntil = 0;
}
const art = (api: BossApi, ax: number, ay: number): [number, number] => [
  api.bossX - api.bossW / 2 + (ax + 1) * SCALE,
  api.bossTop + (ay + 1) * SCALE
];

function slam(api: BossApi, waves: number) {
  act = { kind: 'slam', at: api.t, until: api.t + 420 };
  api.after(160, () => {
    api.shake(12, 380);
    api.sound.thump(1.1);
    api.sound.note(36, { instrument: 'pad', level: 0.12, hold: 0.5 });
    const [tx] = art(api, 4, 48);
    api.fx.burst('shard', 14, tx, api.floorY - 6, { color: ICE, speed: 0.9 });
    api.fx.burst('dust', 10, tx, api.floorY - 4);
    for (let i = 0; i < waves; i++) {
      api.after(i * 380, () => {
        api.spawn({ frames: iceCrest, x: tx - 30, y: 0, vx: -7.2, onFloor: true, scale: 3, frameMs: 80, glow: '#9fe0ff' });
        api.sound.note(79 + i * 5, { instrument: 'glock', level: 0.05 });
      });
    }
  });
}

function icicleRain(api: BossApi, count: number) {
  // the ceiling sheds icicles around the marble, never on it unless aimed
  const xs = Array.from({ length: count }, (_, i) => 60 + ((i * 137 + 30) % 600)).filter((x) => Math.abs(x - api.marbleX) > 80);
  if (api.aim) xs.unshift(api.marbleX);
  xs.forEach((x, i) => {
    api.warn(x, 640 + i * 150, () => {
      api.spawn({
        frames: icicle,
        x: x - 18,
        y: -100,
        vy: 14,
        dodge: 'none',
        scale: 3.5,
        glow: '#bfeaff',
        update(s, _t, a) {
          // shatters where it meets the floor
          if (s.y + icicle[0].height * 3.5 < a.floorY) return;
          s.done = true;
          a.fx.burst('shard', 10, x, a.floorY - 6, { color: '#d6f0ff', speed: 0.8 });
          a.shake(4, 120);
          a.sound.note(88 - (i % 4) * 4, { instrument: 'glock', level: 0.05 });
        }
      });
      if (Math.abs(x - api.marbleX) < 50) api.strikeMarble();
    }, { kind: 'shadow', width: 60, color: '#6fb7e0' });
  });
}

registerBoss({
  id: 'glacier-mammoth',
  scale: SCALE,
  intro: 'drop',
  frames,
  pose(t, state, f) {
    if (state === 'intro') {
      if (t - lastIntro > 1000) reset();
      lastIntro = t;
    }
    if (state === 'hurt' || state === 'dazed' || state === 'dying') return { frame: f.hurt[0] };
    if (act && t < act.until) {
      const k = (t - act.at) / (act.until - act.at);
      if (act.kind === 'slam') return { frame: f.idle[0], tilt: -Math.sin(Math.min(1, k * 1.6) * Math.PI) * 0.09, dy: k < 0.4 ? 0 : U };
      return { frame: f.breath[0], dx: -U * 2, dy: Math.round(Math.sin(t / 60)) * U };
    }
    // rears up on its hind legs, trunk raised
    if (state === 'wind') return { frame: f.wind[0], tilt: 0.07, dy: -U };
    const step = Math.floor(t / 520) % 2;
    const blink = t % 3700 < 140;
    return { frame: blink ? f.blink[0] : f.idle[step], dy: step ? U : 0 };
  },
  moves: [
    {
      id: 'avalanche',
      windup: 720,
      run(api) {
        // a trumpet blast, the hall shakes, and a wall of snow sweeps the floor
        [45, 52, 57].forEach((m, i) => api.sound.note(m, { at: i * 0.05, instrument: 'marimba', level: 0.16 }));
        api.sound.note(33, { instrument: 'pad', level: 0.14, hold: 1 });
        api.sound.whoosh(0.16, 1.2, 0.15, 600, 140);
        api.shake(9, 1100);
        api.tint(900, 'rgba(230,242,255,.14)');
        for (let i = 0; i < 12; i++) api.fx.burst('snow', 3, 40 + i * 70, 4, { speed: 0.4, up: -1 });
        const x0 = api.bossX - api.bossW * 0.5;
        const n = api.phase === 2 ? 4 : 3;
        for (let i = 0; i < n; i++) {
          api.after(i * 70, () => {
            api.spawn({ frames: snowWall, x: x0 - i * 20, y: 0, vx: -7.4, onFloor: true, scale: 3, frameMs: 100 });
          });
        }
        // snowballs tumble ahead of the wave
        for (let i = 0; i < 3; i++) {
          api.after(240 + i * 160, () => {
            api.spawn({ frames: [snowball], x: x0 - 30, y: api.floorY - 120, vx: -6.6 - i * 0.4, vy: -2, g: 0.35, bounce: 0.5, scale: 3, spin: 0.25 });
          });
        }
      }
    },
    {
      id: 'tusk-slam',
      windup: 640,
      run(api) {
        slam(api, api.phase === 2 ? 2 : 1);
      }
    },
    {
      id: 'freezing-breath',
      windup: 600,
      weight: 0.9,
      run(api) {
        // frost rolls along the floor and glazes it with ice
        act = { kind: 'breath', at: api.t, until: api.t + 900 };
        api.sound.whoosh(0.14, 1, 0, 2600, 500);
        api.sound.note(76, { instrument: 'pad', level: 0.07, hold: 0.8 });
        const [bx, by] = art(api, 0, 36);
        for (let i = 0; i < 7; i++) {
          api.after(i * 100, () => {
            api.spawn({ frames: frostPuff, x: bx - 50, y: 0, vx: -6.4, onFloor: true, scale: 3, frameMs: 110, glow: '#bfeaff', life: 2600 });
            api.fx.burst('snow', 3, bx, by, { speed: 0.6, dir: Math.PI, spread: 0.6 });
          });
        }
        api.after(500, () => {
          iceAt = api.t + 500;
          iceUntil = api.t + 4200;
          api.iceFloor(3700);
          api.sound.note(91, { instrument: 'glock', level: 0.05 });
          api.sound.note(96, { at: 0.08, instrument: 'glock', level: 0.04 });
        });
      }
    },
    {
      id: 'blizzard',
      windup: 820,
      phase: 2,
      run(api) {
        blizzardAt = api.t;
        blizzardUntil = api.t + 2800;
        api.tint(2800, 'rgba(210,230,255,.16)');
        api.shake(5, 2400);
        api.sound.whoosh(0.18, 2.6, 0, 1800, 300);
        api.sound.note(40, { instrument: 'pad', level: 0.12, hold: 2 });
        icicleRain(api, 6);
      }
    },
    {
      id: 'glacier-spikes',
      windup: 700,
      phase: 2,
      weight: 0.8,
      run(api) {
        // ice pillars burst up in a line toward the marble, stopping short
        slam(api, 0);
        const from = api.bossX - api.bossW * 0.55;
        const stop = api.aim ? api.marbleX : api.marbleX + 110;
        const xs: number[] = [];
        for (let x = from; x > stop; x -= 74) xs.push(x);
        if (api.aim) xs.push(api.marbleX);
        xs.forEach((x, i) => {
          api.warn(x, 380 + i * 120, () => {
            const ph = pillar.height * 3;
            api.spawn({
              frames: [pillar],
              x: x - 24,
              y: api.floorY,
              scale: 3,
              dodge: 'none',
              life: 800,
              glow: '#9fe0ff',
              update(s, t) {
                const k = (t - (s.born || t)) / 800;
                const up = k < 0.15 ? k / 0.15 : k > 0.75 ? (1 - k) / 0.25 : 1;
                s.y = api.floorY - ph * up + U;
              }
            });
            api.fx.burst('shard', 8, x, api.floorY - 8, { color: ICE, speed: 0.8 });
            api.sound.note(72 + i * 2, { instrument: 'glock', level: 0.05 });
            api.sound.thump(0.4);
            if (Math.abs(x - api.marbleX) < 50) api.strikeMarble();
          }, { kind: 'column', width: 50, color: '#7fd0ff' });
        });
      }
    }
  ],
  drawExtra(g, t, api, state) {
    const angry = api.phase === 2;
    const alive = state !== 'dying';
    // frosty breath puffs from the trunk tip
    if (alive) {
      for (let i = 0; i < 3; i++) {
        const k = ((t / 1600 + i / 3) % 1);
        const [x, y] = art(api, 10, 55);
        g.globalAlpha = 0.5 * (1 - k);
        pxEllipse(g, x - k * 30, y - k * 40, 6 + k * 14, 4 + k * 8, '#e8f4ff');
      }
      g.globalAlpha = 1;
    }
    // the glacier's crystals glint (and glow in phase 2)
    const tips: [number, number][] = [[30, 7], [37, -2], [45, -7], [54, -1], [62, 9]];
    tips.forEach(([ax, ay], i) => {
      const [x, y] = art(api, ax, ay + 2);
      if (angry) {
        g.globalCompositeOperation = 'lighter';
        g.globalAlpha = 0.25 + Math.sin(t / 160 + i) * 0.12;
        pxEllipse(g, x, y + 12, 14, 18, '#5fd8ff');
        g.globalCompositeOperation = 'source-over';
      }
      const tw = Math.sin(t / 240 + i * 1.9);
      if (tw > 0.6 || angry) {
        g.globalAlpha = angry ? 0.9 : (tw - 0.6) * 2.5;
        g.fillStyle = '#fff';
        star(g, x, y, 6);
      }
      g.globalAlpha = 1;
    });
    // phase 2: icy glowing eye
    if (angry && state !== 'hurt' && state !== 'dazed' && alive) {
      const [ex, ey] = art(api, 14.5, 27);
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = 0.55 + Math.sin(t / 110) * 0.2;
      pxEllipse(g, ex, ey, 15, 10, '#4fe0ff');
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = '#e8fdff';
      g.fillRect(r3(ex) - U, r3(ey) - U, U * 2, U * 2);
    }
    // the glazed floor: a sheet of ice with glints sliding along it
    if (t < iceUntil && t > iceAt) {
      const k = Math.min(1, (t - iceAt) / 300, (iceUntil - t) / 600);
      const right = api.bossX - api.bossW * 0.4;
      g.globalAlpha = 0.45 * k;
      g.fillStyle = '#bfeaff';
      g.fillRect(0, api.floorY - U, r3(right), U * 3);
      g.globalAlpha = 0.8 * k;
      g.fillStyle = '#fff';
      g.fillRect(0, api.floorY - U, r3(right), U);
      for (let i = 0; i < 6; i++) {
        const x = (t / 3 + i * 157) % right;
        star(g, x, api.floorY, 5);
      }
      g.globalAlpha = 1;
    }
    // the blizzard: snow streaks driven across the whole hall
    if (t < blizzardUntil) {
      const k = Math.min(1, (t - blizzardAt) / 400, (blizzardUntil - t) / 500);
      g.fillStyle = '#f4f8ff';
      for (let i = 0; i < 70; i++) {
        const sp = 0.5 + ((i * 37) % 10) / 10;
        const x = W - ((t * sp * 0.9 + i * 211) % (W + 60));
        const y = ((t * sp * 0.25 + i * 53) % (H + 20)) - 10;
        g.globalAlpha = k * (0.5 + (i % 3) * 0.2);
        g.fillRect(r3(x), r3(y), U * (2 + (i % 3)), U);
      }
      g.globalAlpha = 1;
    }
  }
});
