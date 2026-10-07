import { makeSprite, disc, rect, line, poly, eyesX, pxEllipse, r3, INK, U, W, type Sprite } from '../../pixel';
import { registerBoss } from '../registry';
import type { BossApi, Pose } from '../types';

// Castle of the Citadel: a giant armoured knight wrapped in a thunderstorm.
// Lightning strikes on warning columns, a sword wave skims the floor, a
// shield bash shakes the hall. Phase 2: the armour cracks with blue light,
// the eyes blaze, lightning falls in threes and the sword throws a lance of
// lightning across the room.

const FW = 78;
const FH = 60;
const ST = '#8a9bb4';
const SD = '#4d5a73';
const SL = '#d0dcef';
const GOLD = '#e8b84a';
const CAPE = '#24305a';
const CAPEL = '#c0283c';
const PLUME = '#d8344a';
const VOLT = '#7fe8ff';
const VOLTW = '#e6fdff';

type Arm = 'rest' | 'raise' | 'swing' | 'bash';
type Eyes = 'open' | 'blaze' | 'x';

// where the blade runs in each pose (art px), for the sparks
const BLADE: Record<Arm, [number, number, number, number]> = {
  rest: [58, 37, 61, 59],
  raise: [52, 10, 76, 0],
  swing: [44, 44, 6, 56],
  bash: [60, 34, 72, 52]
};

function knight(arm: Arm, eyes: Eyes, cracked: boolean, flutter: number) {
  return makeSprite(FW, FH, (put) => {
    const lean = arm === 'bash' ? -4 : 0;
    // cape billowing behind
    poly(put, [[50, 20], [56, 20], [65 + flutter, 42], [71 - flutter, 59], [55, 59], [51, 42]], CAPE);
    line(put, 65 + flutter, 42, 71 - flutter, 59, CAPEL, 2);
    line(put, 56, 24, 62 + flutter, 54, '#18203f');
    line(put, 54, 30, 58, 56, '#33407a');
    // legs and sabatons
    rect(put, 30, 46, 8, 12, ST);
    rect(put, 42, 46, 8, 12, ST);
    rect(put, 35, 46, 3, 12, SD);
    rect(put, 47, 46, 3, 12, SD);
    rect(put, 30, 50, 8, 2, SL);
    rect(put, 42, 50, 8, 2, SL);
    rect(put, 25, 57, 14, 3, SD);
    rect(put, 40, 57, 12, 3, SD);
    // tassets
    poly(put, [[28 + lean, 40], [54 + lean, 40], [56, 48], [26, 48]], SD);
    for (let x = 29; x < 54; x += 6) rect(put, x + lean, 42, 4, 5, ST);
    // the sword, behind the body unless it is swinging
    const [bx0, by0, bx1, by1] = BLADE[arm];
    const blade = (front: boolean) => {
      if (front !== (arm === 'swing')) return;
      line(put, bx0, by0, bx1, by1, SL, 3);
      line(put, bx0, by0, bx1, by1, VOLT, 1);
      const nx = Math.sign(by1 - by0) || 1;
      line(put, bx0 - 3, by0 - nx, bx0 + 3, by0 + nx, GOLD, 2);
      disc(put, bx0 + (bx0 - bx1) * 0.08, by0 + (by0 - by1) * 0.08, 2, 2, GOLD);
    };
    blade(false);
    // breastplate with a gold storm emblem
    disc(put, 41 + lean, 32, 13, 11, ST, SD, SL);
    line(put, 41 + lean, 22, 41 + lean, 42, SL);
    poly(put, [[38 + lean, 26], [44 + lean, 26], [40 + lean, 31], [45 + lean, 31], [37 + lean, 39], [40 + lean, 33], [35 + lean, 33]], GOLD);
    rect(put, 29 + lean, 40, 25, 2, GOLD);
    // pauldrons
    disc(put, 53 + lean, 22, 7, 5, ST, SD, SL);
    for (let x = 48; x < 60; x += 3) put(x + lean, 25, GOLD);
    // helm with a slit visor and a long red plume
    const hx = 39 + lean;
    poly(put, [[hx + 2, 2], [hx + 14, 0], [hx + 22, 6], [hx + 24, 14], [hx + 14, 8]], PLUME);
    line(put, hx + 6, 2, hx + 20, 8, '#8f1a2c');
    disc(put, hx, 12, 8, 10, ST, SD, SL);
    rect(put, hx - 8, 18, 16, 3, SD);
    rect(put, hx - 1, 2, 2, 20, SL);
    rect(put, hx - 7, 11, 13, 3, INK);
    for (let y = 16; y < 20; y += 2) for (let x = hx - 6; x < hx - 1; x += 2) put(x, y, INK);
    if (eyes === 'x') {
      eyesX(put, hx - 7, 10, VOLT);
    } else if (eyes === 'blaze') {
      rect(put, hx - 7, 11, 4, 3, VOLTW);
      rect(put, hx - 2, 11, 4, 3, VOLTW);
      rect(put, hx - 6, 12, 2, 1, VOLT);
      rect(put, hx - 1, 12, 2, 1, VOLT);
    } else {
      rect(put, hx - 6, 12, 2, 1, VOLT);
      rect(put, hx - 1, 12, 2, 1, VOLT);
    }
    // the front pauldron and shield arm
    const sx = arm === 'bash' ? -6 : arm === 'raise' ? 2 : 0;
    disc(put, 30 + lean, 22, 7, 5, ST, SD, SL);
    rect(put, 26 + lean, 26, 6, 10, SD);
    poly(put, [[12 + sx, 22], [32 + sx, 22], [32 + sx, 40], [22 + sx, 54], [12 + sx, 40]], GOLD);
    poly(put, [[14 + sx, 24], [30 + sx, 24], [30 + sx, 39], [22 + sx, 51], [14 + sx, 39]], '#5a6a86');
    rect(put, 14 + sx, 24, 16, 2, '#8a9bb4');
    poly(put, [[23 + sx, 27], [18 + sx, 36], [22 + sx, 36], [19 + sx, 45], [27 + sx, 33], [23 + sx, 33], [26 + sx, 27]], VOLT);
    blade(true);
    if (arm === 'swing') disc(put, 46, 43, 3, 3, SD);
    if (arm === 'raise') disc(put, 52, 12, 3, 3, SD);
    if (cracked) {
      // cracks with storm light leaking through
      line(put, 34 + lean, 26, 38 + lean, 33, INK);
      line(put, 38 + lean, 33, 36 + lean, 38, INK);
      line(put, 48 + lean, 28, 45 + lean, 36, INK);
      line(put, hx + 3, 4, hx + 5, 10, INK);
      line(put, 18 + sx, 28, 21 + sx, 36, INK);
      for (const [x, y] of [[35, 28], [37, 32], [47, 31], [46, 34]]) put(x + lean, y, VOLT);
      put(hx + 4, 7, VOLT);
    }
  });
}

// lazily, per pose (the knight has many looks)
const cache = new Map<string, Sprite>();
function look(arm: Arm, eyes: Eyes, cracked: boolean, flutter: number) {
  const key = `${arm}|${eyes}|${cracked}|${flutter}`;
  let s = cache.get(key);
  if (!s) {
    s = knight(arm, eyes, cracked, flutter);
    cache.set(key, s);
  }
  return s;
}

const wave = [0, 1].map((f) =>
  makeSprite(20, 14, (put) => {
    poly(put, [[20, 14], [14, 2 + f], [8, 0], [2, 4], [0, 14]], VOLT);
    poly(put, [[16, 14], [12, 5], [7, 3], [4, 6], [3, 14]], VOLTW);
    for (let k = 0; k < 4; k++) put(4 + k * 4, 10 - ((k + f) % 2) * 3, '#fff');
  })
);
const shock = [0, 1].map((f) =>
  makeSprite(22, 11, (put) => {
    poly(put, [[0, 11], [4, 3], [8, 7], [11, 0 + f], [15, 6], [18, 2], [22, 11]], '#8a9bb4');
    poly(put, [[4, 11], [8, 6], [11, 9], [15, 5], [18, 11]], SL);
    put(11, 2, '#fff');
  })
);
const flier = makeSprite(20, 10, (put) => {
  poly(put, [[0, 5], [8, 0], [20, 2], [16, 5], [20, 8], [8, 10]], VOLT);
  line(put, 4, 5, 18, 5, VOLTW);
});

// ---- the storm's bookkeeping
let now = 0;
let phase = 1;
let swingUntil = 0;
let bashUntil = 0;
let stormUntil = 0;
let arm: Arm = 'rest';
const bolts: { x: number; at: number; seed: number }[] = [];
const lances: { at: number; y: number }[] = [];

const art = (api: BossApi, x: number, y: number) => ({ x: api.bossX - api.bossW / 2 + (x + 1) * (api.bossW / (FW + 2)), y: api.bossTop + (y + 1) * (api.bossH / (FH + 2)) });
const rnd = (n: number) => {
  const v = Math.sin(n * 12.9898) * 43758.5453;
  return v - Math.floor(v);
};

function strikeXs(api: BossApi, n: number) {
  const xs: number[] = [];
  for (let i = 0; i < n * 4 && xs.length < n; i++) {
    const x = 80 + Math.random() * (W * 0.64);
    if (Math.abs(x - api.marbleX) > 95 && xs.every((o) => Math.abs(o - x) > 90)) xs.push(x);
  }
  return xs;
}

// a volley of lightning bolts on warning columns; aimed volleys hit the marble
function volley(api: BossApi, n: number, delay: number, aim: boolean) {
  api.after(delay, () => {
    const xs = strikeXs(api, n);
    if (aim) xs[0] = api.marbleX;
    const ms = phase === 2 ? 620 : 760;
    xs.forEach((x, i) => {
      api.warn(x, ms + (n === 3 ? 0 : i * 260), () => {
        bolts.push({ x, at: now, seed: Math.random() * 1000 });
        api.flash(60, 'rgba(220,240,255,.5)');
        api.shake(9, 240);
        api.sound.thump(0.9);
        api.sound.whoosh(0.14, 0.35, 0, 6000, 900);
        api.fx.burst('spark', 14, x, api.floorY - 8, { color: VOLT });
        api.fx.burst('dust', 6, x, api.floorY - 4);
        if (Math.abs(x - api.marbleX) < 50) api.strikeMarble();
      }, { kind: 'column', color: VOLT, width: 50 });
    });
    api.sound.note(phase === 2 ? 50 : 55, { instrument: 'pad', level: 0.1, hold: 0.6 });
  });
}

registerBoss({
  id: 'storm-knight',
  scale: 3.2,
  intro: 'drop',
  frames: () => ({ idle: [look('rest', 'open', false, 0)], hurt: [look('rest', 'x', false, 0)] }),
  pose(t, state): Pose {
    const cracked = phase === 2;
    const flutter = Math.floor(t / 260) % 2 ? 2 : 0;
    const eyes: Eyes = cracked ? 'blaze' : 'open';
    if (state === 'hurt' || state === 'dazed' || state === 'dying') {
      arm = 'rest';
      return { frame: look('rest', 'x', cracked, 0), dy: U };
    }
    if (t < bashUntil) {
      // the lunge: in hard, then ease back to the ledge
      const k = 1 - (bashUntil - t) / 600;
      arm = 'bash';
      return { frame: look('bash', eyes, cracked, flutter), dx: -Math.round((k < 0.25 ? k / 0.25 : 1 - (k - 0.25) / 0.75) * 14) * U };
    }
    if (t < swingUntil) {
      arm = 'swing';
      return { frame: look('swing', eyes, cracked, flutter), dx: -2 * U };
    }
    if (state === 'wind') {
      arm = 'raise';
      return { frame: look('raise', eyes, cracked, 2), dy: -U, dx: Math.floor(t / 50) % 2 ? U : 0 };
    }
    arm = 'rest';
    // a slow, heavy breath in the armour
    return { frame: look('rest', eyes, cracked, flutter), dy: Math.floor(t / 1100) % 2 ? U : 0 };
  },
  moves: [
    {
      id: 'lightning',
      windup: 720,
      run(api) {
        api.tint(1300, 'rgba(20,30,90,.18)');
        if (api.phase === 2) {
          volley(api, 3, 0, api.aim);
          volley(api, 3, 760, false);
        } else volley(api, 2, 0, api.aim);
      }
    },
    {
      id: 'sword-wave',
      windup: 640,
      run(api) {
        // a crescent of lightning skims the floor (phase 2 adds a high one)
        swingUntil = now + 420;
        const from = art(api, 10, 52);
        api.spawn({ frames: wave, x: from.x - 40, y: 0, vx: -8.6, onFloor: true, glow: VOLT, frameMs: 70 });
        api.sound.whoosh(0.18, 0.5, 0, 3200, 400);
        api.shake(4, 200);
        api.fx.burst('spark', 10, from.x, api.floorY - 10, { color: VOLT });
        if (api.phase === 2) {
          api.after(520, () => {
            swingUntil = now + 380;
            const h = flier.height * U;
            api.spawn({ frames: [flier], x: from.x - 40, y: api.floorY - 58 - h, vx: -9.5, dodge: 'duck', glow: VOLT });
            api.sound.whoosh(0.16, 0.45, 0, 4200, 600);
          });
        }
      }
    },
    {
      id: 'shield-bash',
      windup: 820,
      run(api) {
        bashUntil = now + 600;
        api.after(150, () => {
          api.shake(15, 520);
          api.flash(90, 'rgba(255,255,255,.4)');
          api.sound.thump(1.3);
          api.sound.note(36, { instrument: 'pad', level: 0.16, hold: 0.5 });
          const p = art(api, 14, 56);
          api.fx.burst('dust', 22, p.x, api.floorY - 4);
          api.fx.burst('spark', 10, p.x, p.y - 40, { color: GOLD });
          api.spawn({ frames: shock, x: p.x - 50, y: 0, vx: -7.2, onFloor: true, frameMs: 80 });
          if (api.phase === 2) api.after(300, () => api.spawn({ frames: shock, x: p.x - 50, y: 0, vx: -7.8, onFloor: true, frameMs: 80 }));
        });
      }
    },
    {
      id: 'storm-call',
      windup: 900,
      phase: 2,
      run(api) {
        // the whole sky answers him: three volleys of three
        stormUntil = now + 2600;
        api.tint(2600, 'rgba(10,16,60,.3)');
        api.sound.note(31, { instrument: 'pad', level: 0.18, hold: 1.8 });
        for (let v = 0; v < 3; v++) volley(api, 3, v * 640, api.aim && v === 0);
      }
    },
    {
      id: 'thunder-lance',
      windup: 760,
      phase: 2,
      run(api) {
        // the sword levels and a lance of lightning crosses the room; duck!
        swingUntil = now + 700;
        const y = api.floorY - 74;
        lances.push({ at: now, y });
        api.beam(y, 650, { dodge: 'duck', color: VOLT, height: 14 });
        api.flash(70, 'rgba(200,250,255,.4)');
        api.shake(8, 600);
        api.sound.whoosh(0.2, 0.7, 0, 7000, 2000);
        api.sound.thump(0.7);
      }
    }
  ],
  drawExtra(g, t, api, state) {
    now = t;
    if (state === 'intro') {
      // a fresh fight: forget the last one's timers and effects
      swingUntil = 0;
      bashUntil = 0;
      stormUntil = 0;
      bolts.length = 0;
      lances.length = 0;
    }
    if (state !== 'dazed' && state !== 'dying') phase = api.phase;
    const hot = phase === 2 && state !== 'dazed' && state !== 'dying';

    // rain lashes the hall while the storm is called down
    if (t < stormUntil && stormUntil - t < 3000) {
      g.fillStyle = 'rgba(180,215,255,.45)';
      for (let i = 0; i < 60; i++) {
        const x = (i * 83 + t * 0.7) % (W + 80) - 40;
        const y = (i * 47 + t * 1.3) % (api.H + 60) - 40;
        g.fillRect(r3(x), r3(y), U, U * 5);
      }
    }

    // a storm-blue halo behind the cracked armour
    if (hot) {
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = 0.16 + Math.abs(Math.sin(t / 180)) * 0.12;
      pxEllipse(g, api.bossX - api.bossW * 0.06, api.bossTop + api.bossH * 0.5, api.bossW * 0.36, api.bossH * 0.5, VOLT);
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
    }

    // crackling arcs along the blade
    if (state !== 'dazed' && state !== 'dying' && state !== 'hurt') {
      const [x0, y0, x1, y1] = BLADE[arm];
      const n = hot ? 4 : 2;
      for (let i = 0; i < n; i++) {
        const k = rnd(Math.floor(t / 70) + i * 7.1);
        const p = art(api, x0 + (x1 - x0) * k, y0 + (y1 - y0) * k);
        let x = p.x;
        let y = p.y;
        g.fillStyle = i % 2 ? VOLTW : VOLT;
        for (let s = 0; s < 4; s++) {
          x += (rnd(t / 70 + i * 3 + s) - 0.5) * 18;
          y += (rnd(t / 70 + i * 5 + s * 2) - 0.5) * 18;
          g.fillRect(r3(x), r3(y), U, U);
        }
      }
    }

    // eyes blazing behind the visor, trailing light
    if (hot || state === 'wind') {
      const e = art(api, 33, 12);
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = `rgba(127,232,255,${hot ? 0.75 : 0.45})`;
      g.fillRect(r3(e.x - 6), r3(e.y - 6), r3(api.bossW * 0.09) + 6, 12);
      if (hot) for (let k = 1; k < 7; k++) g.fillRect(r3(e.x + 24 + k * 7), r3(e.y - 2 + Math.sin(t / 80 + k) * 4), U * 2, U);
      g.globalCompositeOperation = 'source-over';
    }

    // lightning bolts: jagged, re-forked every few frames
    for (let i = bolts.length - 1; i >= 0; i--) {
      const b = bolts[i];
      const age = t - b.at;
      if (age > 300 || age < -50) {
        bolts.splice(i, 1);
        continue;
      }
      const seed = b.seed + Math.floor(t / 50);
      const pts: [number, number][] = [];
      for (let y = -20, k = 0; y <= api.floorY; y += 26, k++) pts.push([b.x + (y >= api.floorY - 26 ? 0 : (rnd(seed + k) - 0.5) * 40), y]);
      pts.push([b.x, api.floorY]);
      g.globalAlpha = 1 - age / 300;
      for (const [width, col] of [[U * 5, 'rgba(127,232,255,.45)'], [U * 2, VOLTW]] as [number, string][]) {
        g.fillStyle = col;
        for (let k = 1; k < pts.length; k++) {
          const [ax, ay] = pts[k - 1];
          const [bx, by] = pts[k];
          const n = Math.ceil(Math.abs(by - ay) / U);
          for (let s = 0; s <= n; s++) g.fillRect(r3(ax + ((bx - ax) * s) / n - width / 2), r3(ay + ((by - ay) * s) / n), width, U);
        }
      }
      // a short fork off the middle
      const [mx, my] = pts[Math.floor(pts.length / 2)];
      g.fillStyle = VOLT;
      for (let s = 0; s < 10; s++) g.fillRect(r3(mx + s * 4 * (rnd(seed) > 0.5 ? 1 : -1)), r3(my + s * 5), U, U);
      g.globalAlpha = 1;
    }

    // the lance: a ragged edge of sparks crawling along the beam
    for (let i = lances.length - 1; i >= 0; i--) {
      const l = lances[i];
      if (t - l.at > 650 || t < l.at - 50) {
        lances.splice(i, 1);
        continue;
      }
      g.fillStyle = VOLTW;
      for (let x = 0; x < W; x += 18) g.fillRect(r3(x + ((t / 4) % 18)), r3(l.y + (rnd(x + Math.floor(t / 40)) - 0.5) * 30), U, U);
    }
  }
});
