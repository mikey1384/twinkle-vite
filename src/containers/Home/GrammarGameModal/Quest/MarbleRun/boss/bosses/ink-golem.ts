import { makeSprite, disc, rect, line, poly, eyesX, pxEllipse, r3, U, INK, type Sprite } from '../../pixel';
import { registerBoss } from '../registry';
import type { BossApi, Shot } from '../types';

// Fort 2 of the Sky Library: a hulking, dripping giant of ink with a gold
// pen nib for a crest and a glass inkwell for a heart. It flings ink that
// pools on the floor and erupts as spikes (each puddle bubbles and its column
// glows first), melts into blobs that scatter and slither back to recombine,
// and slams a wave of ink along the floor. Phase 2: the inkwell heart glows
// magenta, ink wisps rise off it, and spikes erupt in a march.

const SCALE = 3.5;
const K = '#2a2350';
const KD = '#17122e';
const KL = '#4a3f8a';
const KG = '#8d82e0';
const GOLD = '#e8b84a';
const GOLDD = '#a8762a';
const GLASS = '#9fe0ff';

type Arms = 'down' | 'up';
function golem(arms: Arms, eyes: 'open' | 'x' | 'glare', drip: number) {
  return makeSprite(66, 62, (put) => {
    // a puddle base the body grows out of
    disc(put, 34, 58, 30, 4, KD);
    // back arm
    if (arms === 'up') {
      disc(put, 56, 18, 7, 9, KD);
      disc(put, 58, 9, 6, 5, KD);
    } else {
      disc(put, 56, 38, 7, 12, KD);
      disc(put, 57, 50, 6, 6, KD);
    }
    // the great blob body
    disc(put, 34, 34, 24, 23, K, KD, KL);
    disc(put, 34, 50, 22, 9, K, KD);
    // glossy streaks
    line(put, 18, 22, 16, 32, KL, 2);
    line(put, 22, 16, 26, 14, KG);
    put(19, 20, '#fff');
    // stubby legs melting into the puddle
    disc(put, 22, 56, 7, 4, K, KD);
    disc(put, 44, 56, 7, 4, K, KD);
    // the gold pen nib crest
    poly(put, [[30, 1], [38, 1], [40, 9], [34, 16], [28, 9]], GOLD);
    poly(put, [[34, 1], [38, 1], [40, 9], [34, 16]], GOLDD);
    line(put, 34, 6, 34, 15, KD);
    disc(put, 34, 6, 1.4, 1.4, KD);
    put(31, 3, '#fff3b0');
    // the glass inkwell heart, half full of swirling ink
    disc(put, 40, 37, 6, 6, GLASS);
    rect(put, 38, 29, 4, 3, GLASS);
    disc(put, 40, 39, 4.5, 3.5, '#5a2a9a');
    put(38, 34, '#fff');
    put(37, 35, '#fff');
    // eyes: big glossy and grumpy
    for (const ex of [20, 30]) {
      if (eyes === 'x') eyesX(put, ex - 2, 20, '#fff');
      else {
        disc(put, ex, 22, 3.6, 4.2, '#fff');
        rect(put, ex - 3, 21, 2, eyes === 'glare' ? 2 : 3, INK);
        put(ex + 1, 20, '#fff');
      }
    }
    line(put, 15, 16, 23, 18, KD, 2);
    line(put, 27, 18, 34, 16, KD, 2);
    // mouth: a wobbly frown (wide open when winding up)
    if (arms === 'up') {
      disc(put, 25, 31, 6, 3.5, '#120c24');
      rect(put, 21, 29, 8, 1, '#fff');
    } else if (eyes === 'x') {
      line(put, 19, 31, 30, 30, KD);
      line(put, 22, 32, 24, 30, KD);
    } else {
      line(put, 19, 31, 23, 29, KD);
      line(put, 23, 29, 28, 30, KD);
      line(put, 28, 30, 31, 32, KD);
    }
    // front arm: a heavy dripping fist
    if (arms === 'up') {
      disc(put, 10, 20, 7, 10, K, KD, KL);
      disc(put, 8, 9, 7, 6, K, KD, KL);
      put(5, 6, KG);
    } else {
      disc(put, 10, 38, 7, 13, K, KD, KL);
      disc(put, 9, 50, 7, 6, K, KD);
      put(6, 47, KG);
    }
    // drips running down the body (they move between frames)
    for (const [x, y, n] of [[14, 40, 4], [26, 44, 3], [48, 40, 5], [56, 30, 3], [4, 52, 2]]) {
      const len = n + ((drip + x) % 3);
      line(put, x, y, x, y + len, K);
      disc(put, x, y + len + 1, 1.2, 1.4, K);
      put(x, y + 1, KL);
    }
  });
}

// the melted form: a puddle with eyes peeking up and the nib floating
const puddleForm = makeSprite(66, 62, (put) => {
  disc(put, 34, 56, 30, 6, K, KD, KL);
  disc(put, 22, 51, 4, 4, '#fff');
  disc(put, 32, 51, 4, 4, '#fff');
  rect(put, 19, 50, 2, 3, INK);
  rect(put, 29, 50, 2, 3, INK);
  poly(put, [[44, 44], [50, 44], [51, 50], [47, 54], [43, 50]], GOLD);
  line(put, 47, 46, 47, 53, KD);
  line(put, 10, 56, 58, 56, KL);
});

const blob = [0, 1].map((f) =>
  makeSprite(16, 14, (put) => {
    disc(put, 8, 8 + f, 8 - f, 6 - f, K, KD, KL);
    disc(put, 5, 7 + f, 2, 2.4, '#fff');
    disc(put, 10, 7 + f, 2, 2.4, '#fff');
    put(4, 7 + f, INK);
    put(9, 7 + f, INK);
    put(3, 4, KG);
  })
);
const fling = makeSprite(10, 9, (put) => {
  disc(put, 5, 5, 5, 4, K, KD, KL);
  poly(put, [[6, 0], [10, 2], [8, 4]], K);
});
const spike = makeSprite(14, 36, (put) => {
  poly(put, [[0, 36], [3, 18], [7, 0], [11, 18], [14, 36]], K);
  poly(put, [[7, 0], [11, 18], [14, 36], [8, 36]], KD);
  line(put, 5, 8, 3, 32, KL);
  put(6, 4, KG);
  for (const y of [14, 24]) put(10, y, KL);
});
const wave = [0, 1].map((f) =>
  makeSprite(24, 16, (put) => {
    poly(put, [[0, 16], [2, 8], [6 + f, 2], [12, 0], [18, 4 - f], [22, 10], [24, 16]], K);
    poly(put, [[12, 0], [18, 4 - f], [22, 10], [24, 16], [14, 16]], KD);
    line(put, 4, 10, 9 + f, 3, KL);
    put(3 + f, 1, K);
    put(8, 2, KG);
  })
);

let built: Record<string, Sprite[]> | null = null;
function frames() {
  if (!built) {
    built = {
      idle: [0, 1, 2].map((d) => golem('down', 'open', d)),
      wind: [golem('up', 'open', 0)],
      angryWind: [golem('up', 'glare', 1)],
      hurt: [golem('down', 'x', 1)],
      puddle: [puddleForm]
    };
  }
  return built;
}

// ---- per-fight state (reset at the intro)
interface Puddle {
  x: number;
  at: number;
  until: number;
  erupt: number;
}
let puddles: Puddle[] = [];
let split: { at: number; until: number } | null = null;
let angry = false;
let lastIntro = -1e9;
function reset() {
  puddles = [];
  split = null;
  angry = false;
}
const art = (api: BossApi, ax: number, ay: number): [number, number] => [
  api.bossX - api.bossW / 2 + (ax + 1) * SCALE,
  api.bossTop + (ay + 1) * SCALE
];

function eruptSpike(api: BossApi, x: number, i: number) {
  const sh = spike.height * 3.5;
  api.spawn({
    frames: [spike],
    x: x - 26,
    y: api.floorY,
    scale: 3.5,
    dodge: 'none',
    life: 700,
    glow: '#8a5cff',
    update(s, t) {
      const k = (t - (s.born || t)) / 700;
      const up = k < 0.12 ? k / 0.12 : k > 0.7 ? (1 - k) / 0.3 : 1;
      s.y = api.floorY - sh * up + U * 2;
    }
  });
  api.fx.burst('frag', 8, x, api.floorY - 10, { color: K, speed: 0.8 });
  api.fx.burst('spark', 6, x, api.floorY - 20, { color: '#b49cff', speed: 0.7 });
  api.sound.thump(0.45);
  api.sound.note(50 + (i % 4) * 3, { instrument: 'marimba', level: 0.1 });
}

// fling ink that pools, bubbles, then erupts as a spike
function puddleSpikes(api: BossApi, count: number) {
  const [hx, hy] = art(api, 8, 8);
  const xs: number[] = [];
  for (let i = 0; i < count; i++) xs.push(api.marbleX + 120 + i * ((api.bossX - api.bossW * 0.6 - api.marbleX - 120) / Math.max(1, count - 1)));
  if (api.aim) xs.unshift(api.marbleX);
  xs.forEach((x, i) => {
    const T = 34; // frames in the air
    const g = 0.4;
    api.after(i * 110, () => {
      api.spawn({
        frames: [fling],
        x: hx - 18,
        y: hy - 16,
        vx: (x - hx) / T,
        vy: (api.floorY - 10 - hy - (g * T * T) / 2) / T,
        g,
        scale: 3.5,
        spin: 0.3,
        dodge: 'none',
        update(s, _t, a) {
          if (s.y + 30 < a.floorY) return;
          s.done = true;
          a.fx.burst('splash', 6, x, a.floorY - 6, { speed: 0.5 });
        }
      });
      api.sound.whoosh(0.05, 0.25, 0, 1200, 600);
    });
    const land = i * 110 + T * 16.7;
    const pop = land + 700 + i * 140;
    api.after(land, () => {
      // the puddle is the first warning; its column glows until it erupts
      puddles.push({ x, at: api.t + land, until: api.t + pop + 500, erupt: api.t + pop });
      api.sound.note(45, { instrument: 'marimba', level: 0.08 });
      api.warn(x, pop - land, () => {
        eruptSpike(api, x, i);
        if (Math.abs(x - api.marbleX) < 50) api.strikeMarble();
      }, { kind: 'column', width: 48, color: '#8a5cff' });
    });
  });
}

registerBoss({
  id: 'ink-golem',
  scale: SCALE,
  intro: 'rise',
  frames,
  pose(t, state, f) {
    if (state === 'intro') {
      if (t - lastIntro > 1000) reset();
      lastIntro = t;
    }
    if (split && t < split.until + 450) {
      // melted into a puddle, then pulls itself back up
      if (t < split.until) return { frame: f.puddle[0], dy: Math.round(Math.sin(t / 120)) * U };
      const k = (t - split.until) / 450;
      return { frame: f.idle[0], sx: 1.25 - 0.25 * k, sy: 0.4 + 0.6 * k };
    }
    if (state === 'hurt' || state === 'dazed' || state === 'dying') return { frame: f.hurt[0], sx: 1.05, sy: 0.95 };
    if (state === 'wind') return { frame: angry ? f.angryWind[0] : f.wind[0], sy: 1.05, sx: 0.96, dy: -U };
    // a slow, heavy wobble
    const d = Math.floor(t / 260) % 3;
    const w = Math.sin(t / 380);
    return { frame: f.idle[d], sx: 1 + w * 0.025, sy: 1 - w * 0.025 };
  },
  moves: [
    {
      id: 'puddle-spikes',
      windup: 560,
      run(api) {
        puddleSpikes(api, api.phase === 2 ? 4 : 3);
      }
    },
    {
      id: 'split-blobs',
      windup: 620,
      run(api) {
        // melts into blobs that scatter toward the marble and slither back
        split = { at: api.t, until: api.t + 2700 };
        api.sound.whoosh(0.08, 0.5, 0, 500, 200);
        api.fx.burst('splash', 14, api.bossX, api.ledgeY - 20, { speed: 0.8 });
        const n = api.phase === 2 ? 5 : 4;
        const home = api.bossX - 30;
        for (let i = 0; i < n; i++) {
          api.after(i * 120, () => {
            let turned = false;
            const turnAt = api.marbleX + 100 + i * 34;
            const s: Shot = {
              frames: blob,
              x: api.bossX - 40 - i * 10,
              y: api.ledgeY - 50,
              vx: -4.6 - i * 0.5,
              vy: -6,
              g: 0.38,
              bounce: 0.72,
              scale: 3.5,
              frameMs: 120,
              update(sh, _t, a) {
                if (sh.hit) return;
                if (!turned && sh.x < turnAt) {
                  turned = true;
                  sh.vx = 4.2 + i * 0.3;
                  sh.vy = -7;
                  a.sound.note(62 + i * 3, { instrument: 'marimba', level: 0.06 });
                }
                if (turned && sh.x > home) {
                  sh.done = true;
                  a.fx.burst('splash', 5, home + 20, a.ledgeY - 20, { speed: 0.4 });
                  a.sound.note(55 + i * 2, { instrument: 'marimba', level: 0.07 });
                }
                // keep the bounce lively
                if (sh.vy && Math.abs(sh.vy) < 2 && sh.y > a.floorY - 70) sh.vy = -6;
              }
            };
            api.spawn(s);
            api.sound.note(67 - i * 2, { instrument: 'marimba', level: 0.07 });
          });
        }
        api.after(2700, () => {
          // recombine
          api.shake(5, 200);
          api.sound.thump(0.6);
          [55, 60, 64].forEach((m, i) => api.sound.note(m, { at: i * 0.06, instrument: 'marimba', level: 0.1 }));
        });
      }
    },
    {
      id: 'ink-wave',
      windup: 520,
      weight: 0.9,
      run(api) {
        // slams both fists: a wave of ink rolls along the floor
        api.shake(8, 260);
        api.sound.thump(0.9);
        api.sound.whoosh(0.1, 0.7, 0, 700, 200);
        const x0 = api.bossX - api.bossW * 0.5;
        const n = api.phase === 2 ? 2 : 1;
        for (let i = 0; i < n; i++) {
          api.after(i * 520, () => {
            api.spawn({ frames: wave, x: x0, y: 0, vx: -7.2, onFloor: true, scale: 3, frameMs: 90 });
            api.fx.burst('splash', 8, x0 + 20, api.floorY - 10, { speed: 0.6 });
          });
        }
      }
    },
    {
      id: 'spike-march',
      windup: 700,
      phase: 2,
      run(api) {
        // spikes burst up in a march toward the marble, stopping short
        api.tint(1400, 'rgba(40,10,70,.16)');
        api.sound.note(38, { instrument: 'pad', level: 0.12, hold: 1 });
        const from = api.bossX - api.bossW * 0.55;
        const stop = api.marbleX + 100;
        const xs: number[] = [];
        for (let x = from; x > stop; x -= 70) xs.push(x);
        if (api.aim) xs.push(api.marbleX);
        xs.forEach((x, i) => {
          puddles.push({ x, at: api.t, until: api.t + 420 + i * 110 + 500, erupt: api.t + 420 + i * 110 });
          api.warn(x, 420 + i * 110, () => {
            eruptSpike(api, x, i);
            if (Math.abs(x - api.marbleX) < 50) api.strikeMarble();
          }, { kind: 'column', width: 44, color: '#b04cff' });
        });
      }
    }
  ],
  drawExtra(g, t, api, state) {
    angry = api.phase === 2;
    puddles = puddles.filter((p) => t < p.until);
    // the puddles on the floor, bubbling harder as they're about to erupt
    for (const p of puddles) {
      if (t < p.at) continue;
      const grow = Math.min(1, (t - p.at) / 200);
      const fade = t > p.erupt ? Math.max(0, 1 - (t - p.erupt) / 500) : 1;
      g.globalAlpha = fade;
      pxEllipse(g, p.x, api.floorY - U, 30 * grow, U * 2, KD);
      pxEllipse(g, p.x, api.floorY - U, 24 * grow, U, K);
      g.fillStyle = KG;
      g.fillRect(r3(p.x - 12), api.floorY - U * 2, U * 2, U);
      if (t < p.erupt) {
        const near = 1 - Math.min(1, (p.erupt - t) / 700);
        for (let i = 0; i < 3; i++) {
          const k = ((t / (260 - near * 140) + i / 3) % 1);
          g.fillStyle = i % 2 ? KL : K;
          g.fillRect(r3(p.x - 12 + i * 12), r3(api.floorY - 6 - k * (10 + near * 16)), U * 2, U * 2);
        }
      }
      g.globalAlpha = 1;
    }
    if (state === 'dying' || (split && t < split.until)) return;
    // ink drips off the body and patters onto the ledge
    for (let i = 0; i < 4; i++) {
      const k = ((t / 900 + i * 0.29) % 1);
      const [x, y0] = art(api, [6, 18, 47, 57][i], [52, 50, 48, 46][i]);
      const y = y0 + k * k * (api.ledgeY - y0);
      g.fillStyle = K;
      g.fillRect(r3(x), r3(y), U * 2, U * (k < 0.9 ? 3 : 1));
    }
    // phase 2: the inkwell heart glows, eyes burn, ink wisps rise
    if (angry && state !== 'hurt' && state !== 'dazed') {
      g.globalCompositeOperation = 'lighter';
      const [hx, hy] = art(api, 40, 37);
      g.globalAlpha = 0.45 + Math.sin(t / 140) * 0.2;
      pxEllipse(g, hx, hy, 30, 30, '#d23cff');
      for (const ex of [20, 30]) {
        const [x, y] = art(api, ex - 2, 22);
        g.globalAlpha = 0.5;
        pxEllipse(g, x, y, 10, 8, '#ff4fd8');
      }
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 5; i++) {
        const k = ((t / 1300 + i / 5) % 1);
        const x = api.bossX - api.bossW * 0.35 + i * api.bossW * 0.17 + Math.sin(t / 200 + i) * 6;
        g.globalAlpha = 0.6 * (1 - k);
        pxEllipse(g, x, api.bossTop + 30 - k * 60, 6 + k * 6, 6 + k * 4, KD);
      }
      g.globalAlpha = 1;
    }
  }
});
