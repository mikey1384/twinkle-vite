import { makeSprite, disc, rect, line, poly, eyesX, pxEllipse, INK, U, W, type Put } from '../../pixel';
import { registerBoss } from '../registry';
import type { BossApi, Shot } from '../types';

// Fort 1 of World 6: the Snowball Yeti, a huge shaggy snow ape with curled
// ice horns and two proud little tusks. It packs giant snowballs that grow
// as they roll (and bound right over the marble), pounds its chest to shake
// icicles from the ceiling, and breathes a frost beam. Phase 2: an
// avalanche, icy glowing eyes and a ring of orbiting ice shards.

const FUR = '#eef6ff';
const FUR_D = '#b8cce8';
const FUR_DD = '#8aa0c8';
const SKIN = '#7a8cc0';
const SKIN_D = '#4a5a90';
const SKIN_L = '#a8b8e8';
const HORN = '#a8a0c8';
const HORN_D = '#6a6090';
const ICE = '#bff4ff';
const ICE_D = '#6fc8e8';
const MOUTH = '#2a1a3a';

const ART_W = 74;
const ART_H = 58;
const EYES: [number, number][] = [[15, 20], [23, 20]];
const MOUTH_AT: [number, number] = [14, 28];

// shaggy fur: an ellipse with tufts poking out along its edge
function shag(put: Put, cx: number, cy: number, rx: number, ry: number, from = 0, to = Math.PI * 2) {
  disc(put, cx, cy, rx, ry, FUR, FUR_D, '#ffffff');
  const n = Math.round((rx + ry) * 0.9);
  for (let i = 0; i <= n; i++) {
    const a = from + ((to - from) * i) / n;
    const x = cx + Math.cos(a) * rx;
    const y = cy + Math.sin(a) * ry;
    const ox = Math.cos(a) * 2;
    const oy = Math.sin(a) * 2;
    poly(put, [[x - Math.sin(a) * 1.5, y + Math.cos(a) * 1.5], [x + ox, y + oy], [x + Math.sin(a) * 1.5, y - Math.cos(a) * 1.5]], Math.sin(a) > 0.2 ? FUR_D : FUR);
  }
}

// a shaggy arm: a dark rim so it reads against the body, lit fur, strands
function limb(put: Put, x0: number, y0: number, x1: number, y1: number, front: boolean) {
  line(put, x0, y0, x1, y1, front ? FUR_DD : FUR_DD, 9);
  line(put, x0, y0, x1, y1, front ? FUR_D : '#a0b4d8', 8);
  line(put, x0 - 1, y0 - 1, x1 - 1, y1 - 1, front ? FUR : FUR_D, 6);
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 2; i < n; i += 3) {
    const x = x0 + ((x1 - x0) * i) / n;
    const y = y0 + ((y1 - y0) * i) / n;
    put(x + (i % 2 ? 1 : -1), y + 1, FUR_D);
    put(x + (i % 2 ? 1 : -1), y + 2, FUR_D);
  }
}
// fur strands scattered over a body ellipse
function strands(put: Put, cx: number, cy: number, rx: number, ry: number, seed: number) {
  for (let i = 0; i < 22; i++) {
    const a = ((i * 137.5 + seed) * Math.PI) / 180;
    const r = Math.sqrt(((i * 0.618 + seed * 0.1) % 1)) * 0.85;
    const x = Math.round(cx + Math.cos(a) * rx * r);
    const y = Math.round(cy + Math.sin(a) * ry * r);
    put(x, y, FUR_D);
    put(x + 1, y + 1, FUR_D);
  }
}

type Arms = 'down' | 'up' | 'chest' | 'throw';
function yeti(arms: Arms, mouth: 'grin' | 'roar' | 'x', alt = false) {
  return makeSprite(ART_W, ART_H, (put) => {
    // back arm (behind the body)
    if (arms === 'down') {
      limb(put, 52, 30, 62, 50, false);
      disc(put, 64, 53, 5, 4, SKIN, SKIN_D);
    } else if (arms === 'up') {
      limb(put, 52, 26, 64, 8, false);
      disc(put, 66, 6, 5, 5, SKIN, SKIN_D);
    } else if (arms === 'chest') {
      limb(put, 52, 28, 46, 34, false);
      disc(put, alt ? 42 : 44, alt ? 30 : 34, 5, 5, SKIN, SKIN_D);
    } else {
      limb(put, 52, 30, 60, 46, false);
      disc(put, 62, 49, 5, 4, SKIN, SKIN_D);
    }
    // legs
    shag(put, 34, 51, 7, 6);
    shag(put, 52, 51, 7, 6);
    rect(put, 28, 55, 12, 2, SKIN_D);
    rect(put, 46, 55, 12, 2, SKIN_D);
    // the great shaggy body, chest patch of blue skin
    shag(put, 42, 33, 23, 19);
    strands(put, 46, 32, 18, 15, 7);
    disc(put, 44, 46, 16, 5, FUR_D);
    disc(put, 34, 36, 10, 11, SKIN, SKIN_D, SKIN_L);
    line(put, 29, 33, 34, 34, SKIN_D);
    line(put, 35, 34, 40, 33, SKIN_D);
    // frost on the shoulders
    for (const [x, y] of [[48, 16], [54, 19], [60, 24], [44, 15]]) {
      put(x, y, ICE);
      put(x + 1, y, '#ffffff');
    }

    // head: low and forward, curled ice horns
    shag(put, 22, 18, 13, 12);
    // big curled ram horns: up and out, then curling down beside the face
    for (const sd of [-1, 1]) {
      const pts: [number, number][] = [[7, 7], [11, 3], [15, 4], [17, 8], [16, 13], [13, 14], [12, 11]];
      for (let i = 0; i < pts.length - 1; i++) {
        const w = i < 2 ? 4 : i < 4 ? 3 : 2;
        const [x0, y0] = pts[i];
        const [x1, y1] = pts[i + 1];
        line(put, 22 + sd * x0 - (sd < 0 ? w - 1 : 0), y0, 22 + sd * x1 - (sd < 0 ? w - 1 : 0), y1, HORN, w);
      }
      for (const [x, y] of [[10, 4], [14, 4], [17, 9], [15, 14]]) put(22 + sd * x, y, HORN_D);
      put(22 + sd * 12, 3, '#e8e4ff');
    }
    strands(put, 22, 14, 9, 6, 31);
    // face
    disc(put, 18, 23, 9, 8, SKIN, SKIN_D, SKIN_L);
    rect(put, 10, 17, 17, 2, SKIN_D);
    if (mouth === 'x') {
      eyesX(put, 12, 18, INK);
      eyesX(put, 21, 18, INK);
    } else {
      for (const [ex, ey] of EYES) {
        rect(put, ex - 2, ey, 4, 3, '#ffffff');
        rect(put, ex - 2, ey + 1, 2, 2, '#1a3a6a');
        put(ex + 1, ey, ICE);
      }
      // angry heavy brow
      line(put, 10, 17, 17, 19, SKIN_D);
      line(put, 27, 17, 20, 19, SKIN_D);
    }
    disc(put, 18, 25, 2.5, 1.6, SKIN_D);
    put(17, 25, MOUTH);
    put(19, 25, MOUTH);
    if (mouth === 'roar') {
      disc(put, 16, 29.5, 7, 3.5, MOUTH);
      rect(put, 11, 31, 11, 1, '#c0405a');
      poly(put, [[11, 27], [12, 30], [13, 27]], '#ffffff');
      poly(put, [[19, 27], [20, 30], [21, 27]], '#ffffff');
      poly(put, [[12, 33], [13, 30], [14, 33]], '#ffffff');
      poly(put, [[18, 33], [19, 30], [20, 33]], '#ffffff');
    } else if (mouth === 'x') {
      line(put, 11, 29, 22, 30, MOUTH);
      rect(put, 14, 30, 3, 3, '#ff8fa8');
    } else {
      // a toothy grin with two little tusks pointing up
      line(put, 10, 28, 23, 28, MOUTH);
      line(put, 11, 29, 22, 29, MOUTH);
      rect(put, 12, 26, 2, 2, '#ffffff');
      rect(put, 20, 26, 2, 2, '#ffffff');
      put(12, 25, '#ffffff');
      put(21, 25, '#ffffff');
    }
    // an icicle hanging from the chin fur
    poly(put, [[24, 30], [27, 30], [25.5, 35]], ICE);
    put(25, 31, '#ffffff');

    // front arm (over the body)
    if (arms === 'down') {
      limb(put, 28, 28, 14, 46, true);
      disc(put, 12, 51, 6, 4.5, SKIN, SKIN_D, SKIN_L);
      for (const x of [8, 11, 14]) put(x, 54, SKIN_D);
    } else if (arms === 'up') {
      limb(put, 32, 28, 36, 8, true);
      disc(put, 36, 5, 5.5, 5, SKIN, SKIN_D, SKIN_L);
    } else if (arms === 'chest') {
      limb(put, 31, 26, 25, 34, true);
      disc(put, alt ? 30 : 28, alt ? 36 : 32, 5.5, 5, SKIN, SKIN_D, SKIN_L);
    } else {
      limb(put, 30, 28, 8, 40, true);
      disc(put, 5, 41, 5.5, 4.5, SKIN, SKIN_D, SKIN_L);
    }
    // icicles hanging off the arm fur
    const ix = arms === 'down' ? 18 : arms === 'throw' ? 16 : 0;
    if (ix) {
      poly(put, [[ix, arms === 'down' ? 44 : 39], [ix + 3, arms === 'down' ? 44 : 39], [ix + 1.5, arms === 'down' ? 49 : 44]], ICE);
    }
  });
}

// snowballs in growing sizes (it picks up snow as it rolls)
const SNOW_SIZES = [10, 13, 16, 19];
const snowballs = SNOW_SIZES.map((d) =>
  [0, 1].map((f) =>
    makeSprite(d, d, (put) => {
      disc(put, d / 2, d / 2, d / 2, d / 2, '#ffffff', FUR_D, '#ffffff');
      // lumps and pebbles turning as it rolls
      const r = d / 2 - 2;
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + f * 0.8;
        put(d / 2 + Math.cos(a) * r * 0.6, d / 2 + Math.sin(a) * r * 0.6, i % 2 ? FUR_D : '#d8e4f4');
      }
      put(d / 2 + Math.cos(f * 1.6) * r * 0.3, d / 2 + Math.sin(f * 1.6) * r * 0.3, '#8a7a6a');
    })
  )
);
const icicle = makeSprite(7, 16, (put) => {
  poly(put, [[0, 0], [7, 0], [3.5, 16]], ICE);
  poly(put, [[3.5, 0], [7, 0], [3.5, 16]], ICE_D);
  line(put, 2, 1, 3, 9, '#ffffff');
});
const smallBall = snowballs[0];

const STATE = { poundAt: -1e9, throwAt: -1e9, breathAt: -1e9 };

function anchor(api: BossApi, p: [number, number]) {
  const sx = api.bossW / (ART_W + 2);
  const sy = api.bossH / (ART_H + 2);
  return [api.bossX - api.bossW / 2 + (p[0] + 1.5) * sx, api.bossTop + (p[1] + 1.5) * sy];
}

function rollSnowball(api: BossApi, x0: number, grow: boolean) {
  const s: Shot = {
    frames: grow ? snowballs[0] : smallBall,
    x: x0,
    y: 0,
    vx: grow ? -6.5 : -6,
    onFloor: true,
    frameMs: 110,
    dodge: grow ? 'duck' : 'hop',
    update(sh, t, a) {
      if (sh.hit || sh.done) return;
      if (Math.floor(t / 50) % 2 === 0) a.fx.add({ kind: 'snow', x: sh.x + 30, y: a.floorY - 4, vx: 1 + Math.random(), vy: -1 - Math.random(), color: '#ffffff', life: 0.6 });
      if (!grow) return;
      const travelled = x0 - sh.x;
      if (sh.onFloor) {
        sh.frames = snowballs[Math.min(SNOW_SIZES.length - 1, Math.floor(travelled / 80))];
        // big enough and close: it hits a bump and bounds over the marble
        const sw = sh.frames[0].width * U;
        if (sh.x + sw / 2 - a.marbleX < 210) {
          sh.onFloor = false;
          sh.vy = -12;
          sh.g = 0.5;
          a.sound.thump(0.5);
          a.fx.burst('snow', 10, sh.x + sw / 2, a.floorY - 6, { color: '#ffffff' });
        }
      } else {
        const sh2 = sh.frames[0].height * U;
        if (sh.vy && sh.vy > 0 && sh.y + sh2 >= a.floorY) {
          sh.done = true;
          a.fx.burst('snow', 22, sh.x + sh2 / 2, a.floorY - 10, { color: '#ffffff', speed: 1.3 });
          a.fx.burst('shard', 8, sh.x + sh2 / 2, a.floorY - 10, { color: ICE });
          a.shake(6, 200);
          a.sound.thump(0.7);
        }
      }
    }
  };
  api.spawn(s);
}

function icicleRain(api: BossApi, n: number) {
  const xs: number[] = [];
  for (let i = 0; i < n * 3 && xs.length < n; i++) {
    const x = 50 + Math.random() * (api.bossX - api.bossW * 0.5 - 60);
    if (Math.abs(x - api.marbleX) > 85 && xs.every((o) => Math.abs(o - x) > 55)) xs.push(x);
  }
  if (api.aim) xs.unshift(api.marbleX);
  xs.forEach((x, i) => {
    api.warn(x, 560 + i * 110, () => {
      const s = api.spawn({ frames: [icicle], x: x - 11, y: -50, vy: 10, g: 0.6, dodge: 'none', life: 2000 });
      s.update = (sh, _t, a) => {
        if (sh.done || sh.y + icicle.height * U < a.floorY) return;
        sh.done = true;
        a.fx.burst('shard', 10, x, a.floorY - 8, { color: ICE, speed: 0.9 });
        a.fx.burst('snow', 6, x, a.floorY - 6, { color: '#ffffff' });
        a.sound.note(96 + (i % 3) * 2, { instrument: 'glock', level: 0.05 });
      };
      if (Math.abs(x - api.marbleX) < 50) api.after(300, () => api.strikeMarble());
    }, { kind: 'shadow', width: 44 });
  });
}

registerBoss({
  id: 'yeti',
  scale: 3.5,
  intro: 'drop',
  frames: () => ({
    idle: [yeti('down', 'grin')],
    roar: [yeti('up', 'roar')],
    pound: [yeti('chest', 'roar'), yeti('chest', 'roar', true)],
    throw: [yeti('throw', 'grin')],
    hurt: [yeti('down', 'x')]
  }),
  pose(t, state, f) {
    if (state === 'hurt' || state === 'dazed' || state === 'dying') return { frame: f.hurt[0], tilt: 0.04 };
    const ps = t - STATE.poundAt;
    if (ps >= 0 && ps < 900) {
      const beat = Math.floor(ps / 150) % 2;
      return { frame: f.pound[beat], dy: beat ? U : 0, sx: beat ? 1.03 : 1 };
    }
    if (t - STATE.throwAt >= 0 && t - STATE.throwAt < 380) return { frame: f.throw[0], dx: -2 * U, tilt: -0.06 };
    if (t - STATE.breathAt >= 0 && t - STATE.breathAt < 900) return { frame: f.roar[0], tilt: -0.04 };
    if (state === 'wind') return { frame: f.roar[0], dy: -2 * U, sy: 1.04 };
    if (state === 'laugh') return { frame: f.pound[Math.floor(t / 130) % 2] };
    // idle: big slow breaths and a knuckle-walk sway
    return { frame: f.idle[0], sy: 1 + Math.sin(t / 700) * 0.025, sx: 1 - Math.sin(t / 700) * 0.012, tilt: Math.sin(t / 1300) * 0.025 };
  },
  moves: [
    {
      id: 'snowball',
      windup: 640,
      weight: 1.2,
      run(api) {
        // packs it overhead, slams it down: it grows as it rolls
        STATE.throwAt = api.t;
        api.sound.thump(0.6);
        api.sound.whoosh(0.1, 0.5, 0, 500, 200);
        api.fx.burst('snow', 12, api.bossX - api.bossW * 0.45, api.floorY - 8, { color: '#ffffff' });
        rollSnowball(api, api.bossX - api.bossW * 0.55, true);
      }
    },
    {
      id: 'chest-pound',
      windup: 520,
      run(api) {
        // BOOM BOOM BOOM: the ceiling sheds icicles (shadows show where)
        STATE.poundAt = api.t;
        for (let i = 0; i < 6; i++) {
          api.after(i * 150, () => {
            api.sound.thump(0.5 + (i % 2) * 0.3);
            api.shake(5 + i, 140);
          });
        }
        api.after(300, () => icicleRain(api, api.phase === 2 ? 6 : 4));
      }
    },
    {
      id: 'frost-breath',
      windup: 560,
      weight: 0.8,
      run(api) {
        // an icy roar straight across at head height: the marble ducks
        STATE.breathAt = api.t;
        api.tint(900, 'rgba(160,220,255,.16)');
        api.sound.whoosh(0.16, 0.9, 0, 3000, 900);
        api.sound.note(52, { instrument: 'pad', level: 0.1, hold: 0.6 });
        api.beam(api.floorY - 64, 750, { color: ICE_D, height: 11, dodge: 'duck' });
        const [mx, my] = anchor(api, MOUTH_AT);
        for (let i = 0; i < 16; i++) {
          api.after(i * 40, () => api.fx.add({ kind: 'snow', x: mx, y: my + (Math.random() - 0.5) * 20, vx: -8 - Math.random() * 6, vy: (Math.random() - 0.5) * 1.5, color: i % 2 ? '#ffffff' : ICE, life: 1 }));
        }
      }
    },
    {
      id: 'avalanche',
      windup: 760,
      phase: 2,
      run(api) {
        // a roar that brings the mountain down: snow everywhere, a train of
        // snowballs, then icicles
        api.flash(140, 'rgba(230,245,255,.6)');
        api.tint(2200, 'rgba(220,240,255,.18)');
        api.shake(9, 1600);
        api.sound.note(40, { instrument: 'pad', level: 0.14, hold: 1.2 });
        api.sound.whoosh(0.2, 1.8, 0, 200, 900);
        for (let i = 0; i < 40; i++) {
          api.after(i * 40, () => api.fx.add({ kind: 'snow', x: Math.random() * W, y: -10, vx: -2 - Math.random() * 3, vy: 2 + Math.random() * 2, color: '#ffffff', life: 1.6 }));
        }
        for (let i = 0; i < 3; i++) {
          api.after(200 + i * 520, () => {
            STATE.throwAt = api.t + 200 + i * 520;
            rollSnowball(api, api.bossX - api.bossW * 0.55, false);
          });
        }
        api.after(1700, () => icicleRain(api, 3));
      }
    }
  ],
  drawExtra(g, t, api, state) {
    if (state === 'dying' || state === 'intro') return;
    const px = (v: number) => Math.round(v / U) * U;
    const hurt = state === 'hurt' || state === 'dazed';
    // a cold aura: in phase 2 a pulsing frost ring with orbiting ice shards
    if (api.phase === 2) {
      const cx = api.bossX;
      const cy = api.bossTop + api.bossH * 0.55;
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = 0.12 + Math.sin(t / 200) * 0.05;
      pxEllipse(g, cx, cy, api.bossW * 0.62, api.bossH * 0.6, '#6fc8ff');
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 4; i++) {
        const a = t / 600 + (i * Math.PI) / 2;
        const ox = cx + Math.cos(a) * api.bossW * 0.6;
        const oy = cy + Math.sin(a) * api.bossH * 0.25;
        const front = Math.sin(a) > 0;
        g.fillStyle = INK;
        g.fillRect(px(ox) - 2 * U, px(oy) - 3 * U, 4 * U, 6 * U);
        g.fillStyle = front ? ICE : ICE_D;
        g.fillRect(px(ox) - U, px(oy) - 2 * U, 2 * U, 4 * U);
        g.fillStyle = '#ffffff';
        g.fillRect(px(ox) - U, px(oy) - 2 * U, U, U);
      }
      if (!hurt) {
        // icy glowing eyes
        g.globalCompositeOperation = 'lighter';
        for (const e of EYES) {
          const [ex, ey] = anchor(api, [e[0] - 0.5, e[1] + 1]);
          g.globalAlpha = 0.5 + Math.sin(t / 120) * 0.2;
          g.fillStyle = '#6fe8ff';
          g.fillRect(px(ex) - 3 * U, px(ey) - 2 * U, 6 * U, 4 * U);
          g.globalAlpha = 0.9;
          g.fillStyle = '#e8ffff';
          g.fillRect(px(ex) - U, px(ey) - U, 2 * U, 2 * U);
        }
        g.globalAlpha = 1;
        g.globalCompositeOperation = 'source-over';
      }
    }
    // frosty breath puffs from the mouth every couple of seconds
    const cycle = t % 2200;
    if (!hurt && cycle < 700) {
      const k = cycle / 700;
      const [mx, my] = anchor(api, MOUTH_AT);
      g.globalAlpha = (1 - k) * 0.6;
      pxEllipse(g, mx - 12 - k * 40, my - k * 14, 6 + k * 18, 4 + k * 10, '#f4fbff');
      g.globalAlpha = 1;
    }
    // light snow always drifting around it
    if (Math.random() < 0.18) {
      api.fx.add({ kind: 'snow', x: api.bossX + (Math.random() - 0.5) * api.bossW * 1.2, y: api.bossTop - 20, vx: -0.3, vy: 0.6 + Math.random() * 0.5, color: '#ffffff', life: 1.2 });
    }
  }
});
