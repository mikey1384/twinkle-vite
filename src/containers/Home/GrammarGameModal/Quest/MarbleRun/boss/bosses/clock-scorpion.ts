import { makeSprite, disc, rect, line, poly, eyesX, pxEllipse, INK, U } from '../../pixel';
import { registerBoss } from '../registry';
import type { BossApi } from '../types';

// Fort 2 of World 5: the Tick-Tock Scorpion, a brass clockwork scorpion with
// an alarm clock on its back (its hands really tick). Every sting is counted
// down with ticks first; its tail fires a laser low, then high; it sheds
// spinning gears. Phase 2: the alarm bells ring and it stings three times.

const BRASS = '#d4a24a';
const BRASS_D = '#946a2a';
const BRASS_L = '#ffe08a';
const COPPER = '#c4733a';
const COPPER_D = '#8a4a22';
const FACE = '#fff6dc';
const STEEL = '#6a7288';
const LENS = '#6ff0b0';
const RED = '#ff4d6d';

const ART_W = 70;
const ART_H = 50;
// art-pixel anchors used by drawExtra (clock centre, tail root, tail tip)
const CLOCK: [number, number] = [36, 23];
const TAIL_ROOT: [number, number] = [55, 30];
const TAIL_TIP: [number, number] = [44, 7];

function scorpion(claws: 'shut' | 'open', eyes: 'open' | 'x' | 'glare', tail: 'up' | 'none', legs: 0 | 1) {
  return makeSprite(ART_W, ART_H, (put) => {
    // legs: four thin bent pairs, alternating for the scuttle
    for (let i = 0; i < 4; i++) {
      const x = 26 + i * 8;
      const lift = (i + legs) % 2 ? 1 : 0;
      line(put, x, 37, x - 3, 42 - lift, BRASS_D);
      line(put, x - 3, 42 - lift, x - 5, 47, STEEL);
      line(put, x + 3, 37, x + 6, 42 - (1 - lift), BRASS_D);
      line(put, x + 6, 42 - (1 - lift), x + 7, 47, STEEL);
    }

    // tail: a segmented brass arc up and over, stinger forward
    if (tail === 'up') {
      const segs: [number, number, number][] = [[56, 29, 4.5], [61, 22, 4.2], [63, 14, 4], [60, 7, 3.8], [53, 3, 3.6], [47, 4, 3.2]];
      for (const [x, y, r] of segs) {
        disc(put, x, y, r, r, BRASS, BRASS_D, BRASS_L);
        put(x, y, COPPER_D);
      }
      poly(put, [[45, 3], [38, 10], [44, 9], [47, 7]], STEEL);
      disc(put, 42, 8, 2, 2, RED, '#a8223c');
      put(41, 7, '#ffd0d8');
    } else {
      disc(put, 56, 29, 4.5, 4.5, BRASS, BRASS_D, BRASS_L);
    }

    // body: a long brass shell with riveted plates
    disc(put, 37, 33, 19, 7, BRASS, BRASS_D, BRASS_L);
    for (const x of [26, 33, 40, 47]) line(put, x, 28, x + 1, 39, BRASS_D);
    for (const x of [29, 36, 43, 50]) put(x, 31, BRASS_L);

    // the alarm clock on its back: bells, hammer, rim and face
    disc(put, 29, 13, 4, 3.5, COPPER, COPPER_D, '#f2a46a');
    disc(put, 43, 13, 4, 3.5, COPPER, COPPER_D, '#f2a46a');
    rect(put, 35, 11, 2, 3, STEEL);
    disc(put, CLOCK[0], CLOCK[1], 10, 9, BRASS_D);
    disc(put, CLOCK[0], CLOCK[1], 9, 8, BRASS, BRASS_D, BRASS_L);
    disc(put, CLOCK[0], CLOCK[1], 7, 6.5, FACE, '#e8dcc0');
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      put(CLOCK[0] + Math.round(Math.cos(a) * 5.6), CLOCK[1] + Math.round(Math.sin(a) * 5.2), i % 3 ? '#b0a080' : INK);
    }
    put(CLOCK[0], CLOCK[1], INK);
    // little winding key on the side
    rect(put, 46, 21, 3, 1, STEEL);
    rect(put, 48, 19, 2, 5, STEEL);

    // claws: copper arms ending in big pincers
    const open = claws === 'open';
    line(put, 22, 33, 12, 27, COPPER, 2);
    line(put, 22, 36, 12, 41, COPPER, 2);
    for (const [cx, cy] of [[7, 25], [7, 41]] as [number, number][]) {
      disc(put, cx + 3, cy, 5, 3.6, COPPER, COPPER_D, '#f2a46a');
      if (open) {
        poly(put, [[cx, cy - 1], [cx - 6, cy - 5], [cx - 4, cy - 1]], COPPER);
        poly(put, [[cx, cy + 1], [cx - 6, cy + 5], [cx - 4, cy + 1]], COPPER_D);
      } else {
        poly(put, [[cx, cy - 2], [cx - 6, cy], [cx, cy]], COPPER);
        poly(put, [[cx, cy], [cx - 6, cy + 1], [cx, cy + 2]], COPPER_D);
      }
    }

    // head: a copper dome with big goggle eyes and mandibles
    disc(put, 17, 32, 7, 5.5, COPPER, COPPER_D, '#f2a46a');
    line(put, 10, 36, 13, 38, STEEL);
    line(put, 10, 33, 12, 36, STEEL);
    if (eyes === 'x') {
      eyesX(put, 11, 27);
      eyesX(put, 17, 27);
    } else {
      const c = eyes === 'glare' ? RED : LENS;
      for (const ex of [13, 19]) {
        disc(put, ex, 29, 3, 3, STEEL, '#4a5068');
        disc(put, ex, 29, 1.9, 1.9, c);
        put(ex - 1, 28, '#fff');
      }
      if (eyes === 'glare') {
        line(put, 10, 25, 15, 26, INK);
        line(put, 22, 25, 17, 26, INK);
      }
    }
  });
}

const gear = makeSprite(13, 13, (put) => {
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    rect(put, Math.round(6 + Math.cos(a) * 5.5) - 1, Math.round(6 + Math.sin(a) * 5.5) - 1, 2, 2, BRASS_D);
  }
  disc(put, 6.5, 6.5, 4.8, 4.8, BRASS, BRASS_D, BRASS_L);
  disc(put, 6.5, 6.5, 1.6, 1.6, INK);
});
const spark = [0, 1].map((f) =>
  makeSprite(12, 8, (put) => {
    poly(put, [[0, 8], [3, 2 + f], [6, 5], [9, 0 + f], [12, 8]], BRASS_L);
    poly(put, [[3, 8], [6, 5], [9, 8]], '#fff');
  })
);

// module state for the drawn tail strike, ticking and laser
const STATE = { stingAt: -1e9, stingX: 0, stingY: 0, tickAt: -1e9, tickN: 0, laserAt: -1e9, laserY: 0, laserMs: 0, ringAt: -1e9 };
const STING_MS = 520;

function anchor(api: BossApi, p: [number, number]) {
  const sx = api.bossW / (ART_W + 2);
  const sy = api.bossH / (ART_H + 2);
  return [api.bossX - api.bossW / 2 + (p[0] + 1.5) * sx, api.bossTop + (p[1] + 1.5) * sy];
}

// tick, tock... STING: the ticks are the warning, then the tail strikes x
function sting(api: BossApi, x: number, ticks: number, delay: number) {
  const tick = ticks === 3 ? 220 : 150;
  api.after(delay, () => {
    STATE.tickAt = api.t + delay;
    STATE.tickN = ticks;
    for (let i = 0; i < ticks; i++) {
      api.sound.note(i % 2 ? 89 : 96, { at: (i * tick) / 1000, instrument: 'marimba', level: 0.08 });
    }
  });
  api.after(delay, () => api.warn(x, ticks * tick, () => {}, { width: 50, color: RED, kind: 'column' }));
  api.after(delay + ticks * tick - 160, () => {
    STATE.stingAt = api.t + delay + ticks * tick - 160;
    STATE.stingX = x;
    STATE.stingY = api.floorY - 6;
    api.sound.whoosh(0.1, 0.25, 0, 600, 2400);
  });
  api.after(delay + ticks * tick, () => {
    api.sound.thump(0.7);
    api.sound.note(101, { instrument: 'bell', level: 0.06 });
    api.shake(6, 180);
    api.fx.burst('spark', 12, x, api.floorY - 8, { color: BRASS_L });
    api.fx.burst('dust', 6, x, api.floorY - 4);
    if (Math.abs(x - api.marbleX) < 50) api.strikeMarble();
    else api.spawn({ frames: spark, x: x - 18, y: 0, vx: -6.5, onFloor: true, frameMs: 80, glow: '#ffcb32' });
  });
}

registerBoss({
  id: 'clock-scorpion',
  scale: 3.5,
  intro: 'drop',
  frames: () => ({
    idle: [scorpion('shut', 'open', 'up', 0), scorpion('shut', 'open', 'up', 1)],
    wind: [scorpion('open', 'glare', 'up', 0)],
    sting: [scorpion('open', 'glare', 'none', 0)],
    hurt: [scorpion('shut', 'x', 'up', 0)]
  }),
  pose(t, state, f) {
    if (state === 'hurt' || state === 'dazed' || state === 'dying') return { frame: f.hurt[0], tilt: -0.04 };
    // the alarm rattles the whole body
    const ring = t - STATE.ringAt < 700 ? (Math.floor(t / 40) % 2 ? U : -U) : 0;
    if (t - STATE.stingAt >= 0 && t - STATE.stingAt < STING_MS) return { frame: f.sting[0], dx: ring, dy: U };
    // ticking: a tiny rock with each tick
    const ts = t - STATE.tickAt;
    if (ts >= 0 && ts < STATE.tickN * 220) {
      const side = Math.floor(ts / 110) % 2 ? 1 : -1;
      return { frame: f.wind[0], tilt: side * 0.03, dx: ring };
    }
    if (state === 'wind') return { frame: f.wind[0], dy: -U * 2, dx: ring };
    if (state === 'laugh') return { frame: f.wind[0], tilt: Math.sin(t / 80) * 0.04 };
    // idle: scuttles side to side on clicking legs
    const step = Math.floor(t / 160) % 2 as 0 | 1;
    const dx = Math.round(Math.sin(t / 900) * 4) * U;
    return { frame: f.idle[step], dx: dx + ring, dy: step ? 0 : -U };
  },
  moves: [
    {
      id: 'tick-sting',
      windup: 300,
      weight: 1.2,
      run(api) {
        const x = api.aim ? api.marbleX : api.marbleX + 150 + Math.random() * 120;
        sting(api, x, 3, 0);
      }
    },
    {
      id: 'tail-laser',
      windup: 560,
      run(api) {
        // a charge-up hum, then a laser skims the floor, then sweeps high
        api.sound.note(60, { instrument: 'pad', level: 0.08, hold: 0.5 });
        api.sound.note(72, { at: 0.2, instrument: 'pad', level: 0.06, hold: 0.3 });
        api.tint(400, 'rgba(255,60,90,.1)');
        api.after(300, () => {
          STATE.laserAt = api.t + 300;
          STATE.laserY = api.floorY - 16;
          STATE.laserMs = 450;
          api.beam(api.floorY - 16, 450, { color: RED, height: 12, dodge: 'hop' });
          api.sound.whoosh(0.12, 0.45, 0, 2600, 2400);
          api.shake(3, 400);
        });
        api.after(1100, () => {
          STATE.laserAt = api.t + 1100;
          STATE.laserY = api.floorY - 64;
          STATE.laserMs = 600;
          api.beam(api.floorY - 64, 600, { color: '#ff7ab0', height: 10, dodge: 'duck' });
          api.sound.whoosh(0.12, 0.6, 0, 2400, 2800);
          api.shake(3, 500);
        });
      }
    },
    {
      id: 'gear-shed',
      windup: 420,
      weight: 0.8,
      run(api) {
        // the clock sheds spinning gears that roll across the floor
        const n = api.phase === 2 ? 3 : 2;
        for (let i = 0; i < n; i++) {
          api.after(i * 380, () => {
            const [cx, cy] = anchor(api, CLOCK);
            api.spawn({ frames: [gear], x: cx - 20, y: cy - 20, vx: -5.5 - i * 0.4, vy: -4, g: 0.35, bounce: 0.45, spin: -0.35 });
            api.sound.note(84 + i * 3, { instrument: 'glock', level: 0.05 });
            api.fx.burst('spark', 5, cx, cy, { color: BRASS_L });
          });
        }
      }
    },
    {
      id: 'alarm',
      windup: 500,
      phase: 2,
      run(api) {
        // BRRRING: the alarm bells ring, then three fast counted stings
        STATE.ringAt = api.t;
        for (let i = 0; i < 8; i++) api.sound.note(i % 2 ? 98 : 100, { at: i * 0.06, instrument: 'bell', level: 0.05 });
        api.flash(120, 'rgba(255,220,120,.4)');
        api.shake(5, 700);
        const xs = [api.marbleX + 140, api.marbleX + 260, api.marbleX + 380].map((x) => x + Math.random() * 40);
        if (api.aim) xs[0] = api.marbleX;
        xs.forEach((x, i) => sting(api, x, 2, 700 + i * 620));
      }
    }
  ],
  drawExtra(g, t, api, state) {
    if (state === 'dying' || state === 'intro') return;
    const sx = api.bossW / (ART_W + 2);
    const px = (x: number) => Math.round(x / U) * U;
    // the clock hands: the second hand ticks every half second (fast in phase 2)
    if (state !== 'hurt' && state !== 'dazed') {
      const [cx, cy] = anchor(api, CLOCK);
      const tickMs = api.phase === 2 ? 125 : 500;
      const sec = (Math.floor(t / tickMs) % 12) / 12;
      const min = (t / 60000) % 1;
      const hand = (frac: number, len: number, col: string) => {
        const a = frac * Math.PI * 2 - Math.PI / 2;
        g.fillStyle = col;
        for (let k = 0; k <= len; k++) g.fillRect(px(cx + Math.cos(a) * k * sx), px(cy + Math.sin(a) * k * sx), U, U);
      };
      hand(min, 3, INK);
      hand(sec, 5, RED);
    }
    // the tail strike: a segmented tail stretches out to the target and back
    const ss = t - STATE.stingAt;
    if (ss >= 0 && ss < STING_MS) {
      const k = ss < 160 ? ss / 160 : 1 - (ss - 160) / (STING_MS - 160);
      const [rx, ry] = anchor(api, TAIL_ROOT);
      const ex = rx + (STATE.stingX - rx) * k;
      const ey = ry + (STATE.stingY - ry) * k;
      const cxp = (rx + ex) / 2 + 20;
      const cyp = Math.min(ry, ey) - 120 * k - 20;
      for (let i = 0; i <= 10; i++) {
        const q = i / 10;
        const x = (1 - q) * (1 - q) * rx + 2 * (1 - q) * q * cxp + q * q * ex;
        const y = (1 - q) * (1 - q) * ry + 2 * (1 - q) * q * cyp + q * q * ey;
        const r = (4.5 - q * 1.5) * sx;
        pxEllipse(g, x, y, r + U, r + U, INK);
        pxEllipse(g, x, y, r, r, i % 2 ? BRASS : BRASS_D);
      }
      g.fillStyle = INK;
      g.fillRect(px(ex) - 3 * U, px(ey) - 2 * U, 6 * U, 5 * U);
      g.fillStyle = RED;
      g.fillRect(px(ex) - 2 * U, px(ey) - U, 4 * U, 3 * U);
      g.fillStyle = '#ffd0d8';
      g.fillRect(px(ex) - U, px(ey) - U, U, U);
    }
    // the laser pours out of the stinger
    const ls = t - STATE.laserAt;
    if (ls >= 0 && ls < STATE.laserMs) {
      const [tx, ty] = anchor(api, TAIL_TIP);
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = RED;
      g.globalAlpha = 0.7;
      const top = Math.min(ty, STATE.laserY);
      const bottom = Math.max(ty, STATE.laserY);
      g.fillRect(px(tx) - U, px(top), 3 * U, px(bottom - top));
      g.globalAlpha = 0.5 + Math.sin(t / 30) * 0.3;
      pxEllipse(g, tx, ty, 6 * U, 6 * U, '#ff9ab0');
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
    }
    // the stinger glows while the ticks count down
    const ts = t - STATE.tickAt;
    if (ts >= 0 && ts < STATE.tickN * 220 && t - STATE.stingAt > STING_MS) {
      const [tx, ty] = anchor(api, TAIL_TIP);
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = 0.3 + (Math.floor(ts / 110) % 2) * 0.4;
      pxEllipse(g, tx, ty, 5 * U, 5 * U, RED);
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
    }
  }
});
