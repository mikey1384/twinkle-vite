import { makeSprite, disc, rect, line, poly, eyesX, pxEllipse, pixelRing, drawSprite, star, r3, U, INK } from '../../pixel';
import type { Sprite, Put } from '../../pixel';
import { registerBoss } from '../registry';
import type { BossApi, Shot } from '../types';

// Fort 3 of the Sky Library: an origami firebird, all crisp folds and
// facets, its tail and crest tipped with flame. It sends homing paper cranes,
// dives low across the hall leaving paper flames on the floor, and fans
// burning feathers. Phase 2: white-hot eyes and a storm of burning scraps.
// When dazed it crumples to grey ash, then flashes and refolds in gold:
// a rebirth.

const SCALE = 3.5;
interface Pal {
  R: string;
  RD: string;
  O: string;
  OD: string;
  Y: string;
  YD: string;
  P: string;
  PD: string;
  C: string;
}
const FIRE: Pal = { R: '#e8443a', RD: '#a82838', O: '#ff8a2a', OD: '#d0601e', Y: '#ffcf4a', YD: '#e0a030', P: '#fbe9cf', PD: '#e2c49a', C: '#fff6e6' };
const ASH: Pal = { R: '#6a6470', RD: '#4a4552', O: '#8a8490', OD: '#6e6876', Y: '#a8a2ac', YD: '#8e8894', P: '#c8c2cc', PD: '#a8a2ae', C: '#dcd8e0' };
const GILT: Pal = { R: '#ffb43a', RD: '#e08a2a', O: '#ffd84a', OD: '#f0b030', Y: '#fff3b0', YD: '#ffe07a', P: '#fffbe8', PD: '#fff0c0', C: '#ffffff' };

type Wing = 'up' | 'mid' | 'down' | 'wide';
function phoenix(wing: Wing, eye: 'open' | 'x' | 'shut', pal: Pal, beak: 'shut' | 'open' = 'shut') {
  return makeSprite(72, 52, (put) => {
    const { R, RD, O, OD, Y, YD, P, PD, C } = pal;
    // far wing (behind, darker)
    if (wing === 'up' || wing === 'wide') poly(put, [[30, 22], [44, 4], [54, 2], [46, 20]], RD);
    else if (wing === 'mid') poly(put, [[30, 24], [48, 16], [60, 18], [44, 28]], RD);
    else poly(put, [[30, 26], [44, 36], [50, 46], [40, 34]], RD);
    // tail: three long folded plumes with flame tips
    poly(put, [[46, 26], [70, 20], [52, 31]], R);
    poly(put, [[46, 26], [70, 20], [58, 25]], RD);
    poly(put, [[46, 30], [71, 33], [50, 36]], O);
    poly(put, [[46, 30], [71, 33], [58, 32]], OD);
    poly(put, [[44, 34], [66, 46], [46, 38]], Y);
    poly(put, [[44, 34], [66, 46], [54, 39]], YD);
    for (const [x, y] of [[69, 19], [70, 32], [65, 45]]) {
      rect(put, x - 1, y - 1, 3, 3, Y);
      put(x, y, '#fff');
    }
    // body: a folded rhombus with a centre crease
    poly(put, [[18, 26], [34, 17], [50, 26], [38, 40], [24, 38]], P);
    poly(put, [[34, 17], [50, 26], [38, 40], [33, 28]], PD);
    line(put, 34, 18, 33, 38, C);
    line(put, 20, 27, 33, 28, PD);
    // tucked feet
    poly(put, [[28, 38], [32, 38], [30, 44]], Y);
    poly(put, [[34, 39], [37, 39], [36, 43]], YD);
    // neck and head
    poly(put, [[14, 18], [22, 14], [29, 24], [20, 29]], P);
    line(put, 22, 14, 24, 26, PD);
    poly(put, [[6, 15], [13, 8], [21, 13], [17, 22], [8, 20]], P);
    poly(put, [[13, 8], [21, 13], [17, 22], [14, 15]], PD);
    // crest: three folded plumes, flame-tipped
    poly(put, [[12, 10], [13, 0], [17, 9]], R);
    poly(put, [[15, 10], [22, 1], [20, 11]], O);
    poly(put, [[18, 12], [28, 5], [22, 14]], Y);
    put(13, 1, Y);
    put(22, 2, Y);
    put(27, 5, '#fff');
    // beak
    if (beak === 'open') {
      poly(put, [[0, 13], [8, 13], [8, 16]], Y);
      poly(put, [[1, 20], [8, 17], [8, 20]], YD);
      put(4, 16, RD);
    } else {
      poly(put, [[0, 16], [8, 13], [8, 19]], Y);
      poly(put, [[0, 16], [8, 16], [8, 19]], YD);
    }
    // a fierce eye
    if (eye === 'x') eyesX(put, 9, 12, INK);
    else if (eye === 'shut') line(put, 9, 14, 13, 14, INK);
    else {
      poly(put, [[9, 13], [14, 12], [13, 16]], '#fff');
      rect(put, 10, 13, 2, 2, INK);
      line(put, 8, 11, 14, 10, RD);
    }
    // near wing: origami facets alternating colours, crisp creases
    const facet = (pts: [number, number][], col: string) => poly(put, pts, col);
    if (wing === 'up' || wing === 'wide') {
      const top = wing === 'wide' ? 0 : 2;
      facet([[24, 26], [34, top + 2], [42, top], [38, 24]], O);
      facet([[34, top + 2], [42, top], [38, 24]], OD);
      facet([[30, 26], [44, top + 4], [56, top + 2], [44, 24]], R);
      facet([[44, top + 4], [56, top + 2], [44, 24]], RD);
      facet([[38, 26], [56, top + 8], [64, top + 10], [48, 28]], Y);
      line(put, 30, 25, 40, top + 2, C);
      line(put, 36, 25, 52, top + 4, C);
    } else if (wing === 'mid') {
      facet([[24, 26], [40, 12], [52, 12], [36, 28]], O);
      facet([[40, 12], [52, 12], [40, 22]], OD);
      facet([[30, 28], [52, 16], [64, 18], [44, 30]], R);
      facet([[52, 16], [64, 18], [50, 24]], RD);
      line(put, 28, 27, 46, 13, C);
    } else {
      facet([[24, 28], [38, 36], [44, 48], [32, 40]], O);
      facet([[38, 36], [44, 48], [36, 40]], OD);
      facet([[30, 28], [46, 34], [56, 46], [40, 38]], R);
      facet([[46, 34], [56, 46], [46, 40]], RD);
      facet([[36, 28], [52, 30], [62, 38], [46, 34]], Y);
      line(put, 28, 29, 42, 46, C);
    }
  });
}

function crane(col: string, dark: string, up: boolean) {
  return makeSprite(18, 13, (put: Put) => {
    // body diamond, neck up front, tail up back, wings folded up or down
    poly(put, [[5, 8], [9, 5], [13, 8], [9, 11]], col);
    line(put, 6, 8, 2, 2, col, 2);
    poly(put, [[0, 3], [3, 1], [3, 4]], col);
    line(put, 12, 8, 17, 3, col, 2);
    if (up) poly(put, [[7, 7], [11, 0], [13, 1], [11, 7]], dark);
    else poly(put, [[7, 8], [11, 12], [13, 12], [11, 8]], dark);
    line(put, 9, 5, 9, 11, dark);
    put(2, 2, INK);
  });
}
const CRANES = [
  ['#ffffff', '#c8d4e8'],
  ['#ffb6d0', '#e07aa0'],
  ['#8ee0d8', '#4aa8a8']
].map(([c, d]) => [crane(c, d, true), crane(c, d, false)]);

const paperFlame = [0, 1].map((f) =>
  makeSprite(16, 18, (put) => {
    poly(put, [[0, 18], [2, 8 - f], [5, 11], [8, 0 + f], [11, 9], [14, 5 - f], [16, 18]], '#ff6a2a');
    poly(put, [[8, f], [11, 9], [14, 5 - f], [16, 18], [9, 18]], '#d0441e');
    poly(put, [[4, 18], [6, 11], [8, 13], [10, 7 + f], [12, 18]], '#ffcf4a');
    rect(put, 6, 14, 4, 4, '#fbe9cf');
    line(put, 7, 14, 9, 17, '#e2c49a');
  })
);
const feather = makeSprite(15, 6, (put) => {
  poly(put, [[0, 3], [5, 0], [15, 2], [15, 4], [5, 6]], '#ff8a2a');
  poly(put, [[0, 3], [5, 3], [15, 4], [5, 6]], '#e8443a');
  line(put, 1, 3, 14, 3, '#ffcf4a');
  put(0, 3, '#fff3b0');
});
const scrap = [0, 1].map((f) =>
  makeSprite(12, 14, (put) => {
    poly(put, [[1, 5], [11, 4], [10, 14], [2, 13]], '#fbe9cf');
    line(put, 2, 9, 10, 8, '#e2c49a');
    poly(put, [[1, 5], [4, 0 + f], [6, 3], [8, 1 - f + 1], [11, 4]], '#ff8a2a');
    put(5, 4, '#ffcf4a');
  })
);

let built: Record<string, Sprite[]> | null = null;
function frames() {
  if (!built) {
    built = {
      flap: [phoenix('up', 'open', FIRE), phoenix('mid', 'open', FIRE), phoenix('down', 'open', FIRE), phoenix('mid', 'open', FIRE)],
      wind: [phoenix('wide', 'open', FIRE, 'open')],
      dive: [phoenix('up', 'open', FIRE, 'open')],
      hurt: [phoenix('mid', 'x', FIRE)],
      ash: [phoenix('down', 'shut', ASH)],
      gilt: [phoenix('up', 'shut', GILT), phoenix('mid', 'shut', GILT), phoenix('down', 'shut', GILT), phoenix('mid', 'shut', GILT)]
    };
  }
  return built;
}

// ---- per-fight state (reset at the intro)
let dive: { at: number; until: number } | null = null;
let dazedAt = -1;
let reborn = false;
let lastIntro = -1e9;
function reset() {
  dive = null;
  dazedAt = -1;
  reborn = false;
}
const art = (api: BossApi, ax: number, ay: number): [number, number] => [
  api.bossX - api.bossW / 2 + (ax + 1) * SCALE,
  api.bossTop + (ay + 1) * SCALE
];
// the dive's path: down and forward across the hall, then back up
function diveOffset(t: number): [number, number] {
  if (!dive || t < dive.at || t > dive.until) return [0, 0];
  const k = (t - dive.at) / (dive.until - dive.at);
  const s = Math.sin(k * Math.PI);
  return [r3(-s * 270), r3(Math.pow(s, 0.7) * 96)];
}

function cranes(api: BossApi, n: number) {
  const [wx, wy] = art(api, 44, 6);
  for (let i = 0; i < n; i++) {
    api.after(i * 170, () => {
      const fr = CRANES[i % CRANES.length];
      const sw = fr[0].width * 3;
      const sh = fr[0].height * 3;
      let leaving = false;
      const s: Shot = {
        frames: fr,
        x: wx - sw / 2,
        y: wy - sh / 2,
        vx: -2.5 - i * 0.3,
        vy: -3.5 + i * 0.6,
        scale: 3,
        frameMs: 110,
        dodge: 'duck',
        update(c, _t, a) {
          if (c.hit) {
            // aimed: it truly homes on the marble
            const dx = a.marbleX - sw / 2 - c.x;
            const dy = a.marbleY - sh / 2 - c.y;
            const d = Math.hypot(dx, dy) || 1;
            c.vx = (c.vx || 0) + ((dx / d) * 9 - (c.vx || 0)) * 0.18;
            c.vy = (c.vy || 0) + ((dy / d) * 9 - (c.vy || 0)) * 0.18;
            return;
          }
          if (!leaving && c.x < a.marbleX + 30) leaving = true;
          if (leaving) {
            // swoops over the ducking marble and peels away upward
            c.vx = Math.min(c.vx || 0, -5.5);
            c.vy = (c.vy || 0) - 0.3;
            return;
          }
          // homes on a spot just over the marble's head
          const tx = a.marbleX - 30;
          const ty = a.floorY - 52 - sh;
          const dx = tx - c.x;
          const dy = ty - c.y;
          const d = Math.hypot(dx, dy) || 1;
          c.vx = (c.vx || 0) + ((dx / d) * 5.6 - (c.vx || 0)) * 0.06;
          c.vy = (c.vy || 0) + ((dy / d) * 5.6 - (c.vy || 0)) * 0.06;
          if ((c.vx || 0) > -0.6) c.vx = -0.6;
        }
      };
      api.spawn(s);
      api.sound.whoosh(0.05, 0.3, 0, 2400, 1400);
      api.sound.note(79 + i * 3, { instrument: 'glock', level: 0.04 });
    });
  }
}

registerBoss({
  id: 'paper-phoenix',
  scale: SCALE,
  hover: 30,
  intro: 'fly',
  frames,
  pose(t, state, f) {
    if (state === 'intro') {
      if (t - lastIntro > 1000) reset();
      lastIntro = t;
    }
    if (state === 'dazed') {
      // crumples to ash, then flashes and refolds in gold
      const since = dazedAt < 0 ? 0 : t - dazedAt;
      if (since < 650) return { frame: f.ash[0], dy: r3(Math.min(1, since / 400) * 18), tilt: 0.12 };
      return { frame: f.gilt[Math.floor(t / 110) % 4], dy: Math.round(Math.sin(t / 300) * 3) * U };
    }
    if (state === 'hurt' || state === 'dying') return { frame: f.hurt[0], tilt: 0.08 };
    const [ox, oy] = diveOffset(t);
    if (ox || oy) return { frame: f.dive[0], dx: ox, dy: oy, tilt: dive && t - dive.at < (dive.until - dive.at) / 2 ? -0.18 : 0.14 };
    if (state === 'wind') return { frame: f.wind[0], dy: -3 * U, tilt: 0.05 };
    return { frame: f.flap[Math.floor(t / 130) % 4], dy: Math.round(Math.sin(t / 360) * 4) * U };
  },
  moves: [
    {
      id: 'crane-flock',
      windup: 520,
      run(api) {
        cranes(api, api.phase === 2 ? 5 : 3);
      }
    },
    {
      id: 'flame-dive',
      windup: 620,
      run(api) {
        // swoops low across the hall; paper flames catch on the floor
        dive = { at: api.t, until: api.t + 1000 };
        api.sound.whoosh(0.16, 1, 0, 1800, 300);
        api.sound.note(64, { instrument: 'marimba', level: 0.1 });
        const lowX = api.bossX - 270;
        api.after(420, () => {
          api.shake(6, 260);
          api.sound.thump(0.6);
          api.fx.burst('ember', 16, lowX, api.floorY - 20);
          for (let i = 0; i < (api.phase === 2 ? 5 : 4); i++) {
            api.after(i * 70, () => {
              api.spawn({ frames: paperFlame, x: lowX - 20 + i * 26, y: 0, vx: -7 - i * 0.2, onFloor: true, scale: 3, frameMs: 80, glow: '#ff6a2a' });
            });
          }
        });
      }
    },
    {
      id: 'feather-fan',
      windup: 460,
      weight: 0.8,
      run(api) {
        const [x, y] = art(api, 40, 8);
        const n = api.phase === 2 ? 7 : 5;
        for (let i = 0; i < n; i++) {
          const a = Math.PI - 0.15 - (i / (n - 1)) * 0.55;
          const sp = 7;
          const sw = feather.width * 3;
          api.spawn({
            frames: [feather],
            x: x - sw / 2,
            y,
            vx: Math.cos(a) * sp,
            vy: -Math.sin(a) * sp,
            g: 0.1,
            scale: 3,
            spin: 1e-6,
            glow: '#ff8a2a',
            update(s, _t, ap) {
              s.angle = Math.atan2(s.vy || 0, s.vx || 0);
              if (!s.hit && s.y + 18 >= ap.floorY) {
                s.done = true;
                ap.fx.burst('ember', 6, s.x + sw / 2, ap.floorY - 6);
              }
            }
          });
        }
        api.sound.whoosh(0.1, 0.4, 0, 2600, 900);
        [76, 79, 83].forEach((m, i) => api.sound.note(m, { at: i * 0.04, instrument: 'glock', level: 0.04 }));
      }
    },
    {
      id: 'firestorm',
      windup: 800,
      phase: 2,
      run(api) {
        // burning scraps rain down around the marble, and a few cranes too
        api.tint(1800, 'rgba(255,110,30,.12)');
        api.shake(5, 1200);
        api.sound.note(40, { instrument: 'pad', level: 0.12, hold: 1.2 });
        api.sound.whoosh(0.14, 1.6, 0, 900, 300);
        const xs = Array.from({ length: 6 }, (_, i) => 70 + ((i * 131 + 50) % 580)).filter((x) => Math.abs(x - api.marbleX) > 80);
        if (api.aim) xs.unshift(api.marbleX);
        xs.forEach((x, i) => {
          api.warn(x, 600 + i * 140, () => {
            const sh = scrap[0].height * 3.5;
            api.spawn({
              frames: scrap,
              x: x - 22,
              y: -60,
              vy: 11,
              scale: 3.5,
              frameMs: 90,
              spin: 0.15,
              dodge: 'none',
              glow: '#ff8a2a',
              update(s, t, a) {
                s.x += Math.sin(t / 90 + i) * 1.2;
                if (s.y + sh < a.floorY) return;
                s.done = true;
                a.fx.burst('ember', 12, x, a.floorY - 8);
                a.sound.note(70 - (i % 4) * 3, { instrument: 'marimba', level: 0.06 });
              }
            });
            if (Math.abs(x - api.marbleX) < 50) api.strikeMarble();
          }, { kind: 'shadow', width: 56, color: '#ff8a2a' });
        });
        api.after(500, () => cranes(api, 2));
      }
    }
  ],
  drawExtra(g, t, api, state) {
    const angry = api.phase === 2;
    const f = frames();
    // the rebirth: a flash as it crumples, a bigger one as it refolds in gold
    if (state === 'dazed') {
      if (dazedAt < 0) {
        dazedAt = t;
        api.flash(140, 'rgba(255,240,200,.6)');
        api.fx.burst('ember', 24, api.bossX, api.bossTop + api.bossH / 2);
      }
      const since = t - dazedAt;
      if (since >= 650 && !reborn) {
        reborn = true;
        api.flash(260, 'rgba(255,214,90,.75)');
        api.shake(6, 300);
        api.fx.burst('star', 14, api.bossX, api.bossTop + api.bossH / 2, { color: '#ffd84a' });
        api.fx.burst('ember', 30, api.bossX, api.bossTop + api.bossH / 2, { speed: 1.4 });
        [72, 76, 79, 84, 88].forEach((m, i) => api.sound.note(m, { at: i * 0.07, instrument: 'bell', level: 0.08 }));
      }
      if (since >= 650 && since < 1500) {
        const k = (since - 650) / 850;
        g.globalAlpha = 1 - k;
        pixelRing(g, api.bossX, api.bossTop + api.bossH / 2, 30 + k * 160, 1, '#ffd84a');
        pixelRing(g, api.bossX, api.bossTop + api.bossH / 2, 20 + k * 110, 1, '#ff8a2a');
        g.globalAlpha = 1;
      }
      if (since >= 650) {
        g.globalCompositeOperation = 'lighter';
        g.globalAlpha = 0.22 + Math.sin(t / 150) * 0.08;
        pxEllipse(g, api.bossX, api.bossTop + api.bossH / 2, api.bossW * 0.55, api.bossH * 0.55, '#ffb43a');
        g.globalAlpha = 1;
        g.globalCompositeOperation = 'source-over';
      }
      return;
    }
    if (state === 'dying') return;
    // afterimages behind the dive
    const [ox, oy] = diveOffset(t);
    if (ox || oy) {
      for (const lag of [70, 140, 210]) {
        const [px, py] = diveOffset(t - lag);
        const fr = f.dive[0];
        drawSprite(g, fr, api.bossX + px - ox - (fr.width * SCALE) / 2, api.bossTop + py - oy, SCALE, { alpha: 0.4 - lag / 700 });
      }
      api.fx.add({ kind: 'ember', x: api.bossX + 60, y: api.bossTop + api.bossH * 0.5, vx: 2, vy: -1 });
    }
    // flickering flame on the crest and tail tips; embers drift up
    g.globalCompositeOperation = 'lighter';
    for (const [ax, ay] of [[13, 1], [22, 2], [27, 5], [69, 19], [70, 32], [65, 45]]) {
      const [x, y] = art(api, ax, ay);
      g.globalAlpha = 0.35 + Math.abs(Math.sin(t / 70 + ax)) * 0.35;
      pxEllipse(g, x, y - 4, 8, 10, angry ? '#ffe9a0' : '#ff9a3a');
    }
    if (angry) {
      // white-hot eyes and a shimmering heat aura
      const [ex, ey] = art(api, 11, 14);
      g.globalAlpha = 0.6 + Math.sin(t / 100) * 0.25;
      pxEllipse(g, ex, ey, 14, 10, '#fff3c0');
      g.globalAlpha = 0.14 + Math.sin(t / 220) * 0.05;
      pxEllipse(g, api.bossX, api.bossTop + api.bossH * 0.5, api.bossW * 0.56, api.bossH * 0.6, '#ff6a2a');
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 5; i++) {
      const k = ((t / 1500 + i / 5) % 1);
      g.globalAlpha = 1 - k;
      g.fillStyle = k < 0.5 ? '#ffd84a' : '#ff6a2a';
      star(g, api.bossX + 40 + Math.sin(t / 300 + i * 2) * 20 + i * 14, api.bossTop + api.bossH * 0.7 - k * 90, 3);
    }
    g.globalAlpha = 1;
  }
});
