import { makeSprite, disc, rect, line, poly, eyesX, ring, pxEllipse, star, r3, U, INK, type Sprite, type Put } from '../../pixel';
import { registerBoss } from '../registry';
import type { BossApi, Shot } from '../types';

// Fort 4 of the Sky Library: a floating, horned spellbook bound in plum
// leather, chained shut, with one great slit eye in a gold sigil on its
// cover. It flaps open to summon glyph-minions (little abstract ink
// creatures, no letters) that march across the floor, whips up a page storm,
// and pulses a magic circle outward. Phase 2: its eye burns red, runes spin
// faster, and it fires an arcane beam the marble ducks under.

const SCALE = 3;
const C = '#4a2266';
const CD = '#2e1442';
const CL = '#6e3a8e';
const SPINE = '#24122f';
const GOLD = '#e8b84a';
const GOLDD = '#a8762a';
const PAGE = '#f4ead0';
const PAGED = '#d8c8a0';
const BONE = '#e8dcc0';
const BONED = '#b8a888';
const MAG = '#ff4fd8';
const MAGL = '#ffb0f0';

function eye(put: Put, cx: number, cy: number, rx: number, ry: number, lid: number, x: boolean, lidCol: string) {
  disc(put, cx, cy, rx, ry, '#fff6f0');
  if (x) {
    eyesX(put, cx - 2, cy - 2, INK);
    return;
  }
  disc(put, cx - 1.5, cy, rx * 0.45, ry * 0.8, '#ff3d8e');
  line(put, Math.round(cx - 1.5), Math.round(cy - ry * 0.6), Math.round(cx - 1.5), Math.round(cy + ry * 0.6), INK);
  put(cx - 3, cy - 2, '#fff');
  // a heavy, smug lid
  for (let y = Math.floor(cy - ry); y < cy - ry + lid; y++) {
    for (let xx = Math.floor(cx - rx); xx <= cx + rx; xx++) {
      const dx = (xx + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) put(xx, y, lidCol);
    }
  }
  if (lid > 0) line(put, Math.round(cx - rx + 1), Math.round(cy - ry + lid), Math.round(cx + rx - 1), Math.round(cy - ry + lid), CD);
}

function closedBook(lid: number, eyes: 'open' | 'x', swing: number) {
  return makeSprite(64, 58, (put) => {
    // horns
    poly(put, [[17, 7], [10, 0], [12, 4], [22, 5]], BONE);
    line(put, 11, 1, 16, 6, BONED);
    poly(put, [[45, 5], [54, 0], [52, 4], [48, 8]], BONE);
    line(put, 53, 1, 48, 6, BONED);
    // spine, page edges, cover
    rect(put, 50, 6, 7, 45, SPINE);
    for (const y of [12, 28, 44]) rect(put, 50, y, 7, 2, GOLDD);
    rect(put, 10, 7, 4, 43, PAGE);
    for (let y = 8; y < 50; y += 2) put(10, y, PAGED);
    rect(put, 14, 5, 36, 3, PAGE);
    rect(put, 14, 7, 37, 44, C);
    rect(put, 14, 7, 37, 1, CL);
    rect(put, 48, 8, 3, 43, CD);
    rect(put, 14, 49, 37, 2, CD);
    // tooled border
    for (let x = 18; x < 46; x += 3) {
      put(x, 10, CL);
      put(x, 47, CL);
    }
    for (let y = 12; y < 46; y += 3) {
      put(17, y, CL);
      put(46, y, CL);
    }
    // gold corner guards
    poly(put, [[14, 7], [21, 7], [14, 14]], GOLD);
    poly(put, [[51, 7], [44, 7], [51, 14]], GOLD);
    poly(put, [[14, 51], [21, 51], [14, 44]], GOLD);
    poly(put, [[51, 51], [44, 51], [51, 44]], GOLD);
    // the gold sigil: two rings and three points
    ring(put, 32, 29, 12, GOLD, 48);
    ring(put, 32, 29, 10, GOLDD, 40);
    poly(put, [[32, 14], [34, 18], [30, 18]], GOLD);
    poly(put, [[19, 37], [23, 35], [22, 39]], GOLD);
    poly(put, [[45, 37], [41, 35], [42, 39]], GOLD);
    // the great eye
    eye(put, 32, 29, 8, 6, lid, eyes === 'x', C);
    // clasp strap and lock on the open edge
    rect(put, 6, 26, 10, 6, '#7a3a2a');
    rect(put, 3, 24, 7, 10, GOLD);
    rect(put, 3, 24, 7, 1, '#fff3b0');
    rect(put, 5, 27, 2, 3, INK);
    put(6, 30, INK);
    // chains and ribbons dangle from the bottom (they sway between frames)
    for (const [x0, dir] of [[18, -1], [46, 1]]) {
      for (let i = 0; i < 4; i++) {
        const x = x0 + Math.round((i * swing * dir) / 2);
        rect(put, x, 51 + i * 2, 2, 1, i % 2 ? '#9a9aa8' : '#c8c8d8');
        put(x + (i % 2), 52 + i * 2, '#6a6a78');
      }
    }
    line(put, 36, 51, 37 + swing, 57, '#e0344e', 2);
    line(put, 40, 51, 41 - swing, 55, '#2fa8a0', 2);
  });
}

function openBook(eyes: 'open' | 'glare') {
  return makeSprite(64, 58, (put) => {
    // covers behind the pages
    poly(put, [[0, 9], [32, 15], [32, 57], [0, 51]], C);
    poly(put, [[64, 9], [32, 15], [32, 57], [64, 51]], C);
    poly(put, [[0, 9], [3, 9], [3, 52], [0, 51]], GOLD);
    poly(put, [[61, 9], [64, 9], [64, 51], [61, 52]], GOLD);
    poly(put, [[2, 8], [1, 2], [6, 7]], BONE);
    poly(put, [[62, 8], [63, 2], [58, 7]], BONE);
    // two pages spread wide, glowing
    poly(put, [[4, 12], [32, 18], [32, 54], [4, 48]], PAGE);
    poly(put, [[32, 18], [60, 12], [60, 48], [32, 54]], PAGE);
    line(put, 32, 18, 32, 54, PAGED);
    for (let i = 0; i < 6; i++) {
      line(put, 7, 16 + i * 5, 14, 17 + i * 5, PAGED);
      line(put, 50, 17 + i * 5, 57, 16 + i * 5, PAGED);
    }
    // the magic circle drawn across both pages
    ring(put, 32, 34, 14, MAG, 56);
    ring(put, 32, 34, 10, MAG, 40);
    poly(put, [[32, 21], [43, 40], [21, 40]], MAGL);
    poly(put, [[32, 23], [41, 39], [23, 39]], PAGE);
    line(put, 32, 47, 21, 28, MAG);
    line(put, 32, 47, 43, 28, MAG);
    line(put, 21, 28, 43, 28, MAG);
    for (const [x, y] of [[32, 20], [45, 34], [19, 34], [32, 48]]) {
      rect(put, x - 1, y - 1, 3, 3, MAG);
      put(x, y, '#fff');
    }
    // the eye, wide open in the gutter
    eye(put, 32, 34, 5, 6, 0, false, C);
    if (eyes === 'glare') line(put, 27, 28, 37, 30, CD);
    // loose pages lifting off
    rect(put, 26, 4, 5, 6, PAGE);
    rect(put, 35, 1, 5, 6, PAGE);
    line(put, 27, 6, 29, 6, PAGED);
    line(put, 36, 3, 38, 3, PAGED);
  });
}

// glyph-minions: little abstract ink creatures (deliberately no letter shapes)
function minion(kind: number, step: number) {
  return makeSprite(16, 16, (put) => {
    const B = ['#5a2a8a', '#2a5a8a', '#8a2a5a'][kind];
    const H = ['#c77dff', '#7dc7ff', '#ff7dc7'][kind];
    const legs = (xs: number[]) =>
      xs.forEach((x, i) => line(put, x, 12, x + ((i + step) % 2 ? -1 : 1), 15, B));
    if (kind === 0) {
      // a spiral shell critter with eye stalks
      for (let a = 0; a < Math.PI * 4; a += 0.18) {
        const r = 1 + a * 0.45;
        put(9 + Math.cos(a) * r, 7 + Math.sin(a) * r, a > Math.PI * 3 ? H : B);
      }
      disc(put, 9, 8, 2.5, 2.5, B);
      line(put, 3, 9, 1, 4, B);
      line(put, 5, 8, 4, 3, B);
      put(1, 3, '#fff');
      put(4, 2, '#fff');
      legs([5, 9, 13]);
    } else if (kind === 1) {
      // a four-point star with one big eye
      poly(put, [[8, 0], [10, 5], [16, 7], [10, 9], [8, 13], [6, 9], [0, 7], [6, 5]], B);
      put(8, 2, H);
      put(13, 7, H);
      disc(put, 8, 7, 2.4, 2.4, '#fff');
      rect(put, 7, 6, 2, 2, INK);
      legs([5, 11]);
    } else {
      // a teardrop with a curly tail and two eyes
      disc(put, 7, 8, 5.5, 4.5, B);
      poly(put, [[5, 4], [9, 4], [8, 0]], B);
      line(put, 12, 9, 15, 8, B);
      put(15, 7, B);
      put(14, 6, B);
      put(6, 5, H);
      rect(put, 4, 7, 2, 2, '#fff');
      rect(put, 8, 7, 2, 2, '#fff');
      put(4, 8, INK);
      put(8, 8, INK);
      legs([5, 9]);
    }
  });
}
const MINIONS = [0, 1, 2].map((k) => [minion(k, 0), minion(k, 1)]);

const page = [0, 1].map((f) =>
  makeSprite(f ? 4 : 9, 11, (put) => {
    const w = f ? 4 : 9;
    rect(put, 0, 0, w, 11, PAGE);
    for (const y of [2, 4, 6, 8]) line(put, 1, y, w - 2, y, PAGED);
  })
);
// a pulse of the magic circle travelling along the floor: a tall arc
const pulse = [0, 1].map((f) =>
  makeSprite(10, 20, (put) => {
    for (let y = 0; y < 20; y++) {
      const x = Math.round(5 - Math.sin((y / 19) * Math.PI) * 4);
      rect(put, x, y, 3, 1, f ? MAGL : MAG);
      put(x + 3, y, '#fff');
    }
  })
);
const RUNES = [
  makeSprite(7, 7, (put) => {
    ring(put, 3, 3, 3, GOLD, 16);
    poly(put, [[3, 1], [5, 5], [1, 5]], MAGL);
  }),
  makeSprite(7, 7, (put) => {
    poly(put, [[3, 0], [6, 3], [3, 6], [0, 3]], GOLD);
    put(3, 3, MAG);
  }),
  makeSprite(7, 7, (put) => {
    disc(put, 3, 3, 3, 3, GOLD);
    disc(put, 4.5, 2.5, 2.5, 2.5, null);
    rect(put, 0, 6, 7, 1, MAGL);
  })
];

let built: Record<string, Sprite[]> | null = null;
function frames() {
  if (!built) {
    built = {
      idle: [closedBook(3, 'open', -1), closedBook(3, 'open', 0), closedBook(3, 'open', 1), closedBook(3, 'open', 0)],
      blink: [closedBook(12, 'open', 0)],
      wind: [openBook('open')],
      angryWind: [openBook('glare')],
      hurt: [closedBook(0, 'x', 1)]
    };
  }
  return built;
}

// ---- per-fight state (reset at the intro)
let openUntil = 0;
let circleAt = -1e9;
let beamUntil = 0;
let isOpen = false;
let angry = false;
let lastIntro = -1e9;
function reset() {
  openUntil = 0;
  circleAt = -1e9;
  beamUntil = 0;
  angry = false;
}
const art = (api: BossApi, ax: number, ay: number): [number, number] => [
  api.bossX - api.bossW / 2 + (ax + 1) * SCALE,
  api.bossTop + (ay + 1) * SCALE
];

function summon(api: BossApi, n: number) {
  openUntil = Math.max(openUntil, api.t + 400 + n * 260);
  const [bx, by] = art(api, 32, 34);
  for (let i = 0; i < n; i++) {
    api.after(i * 260, () => {
      const fr = MINIONS[i % 3];
      const sh = fr[0].height * 3;
      const speed = 3.6 + (i % 3) * 0.4;
      const s: Shot = {
        frames: fr,
        x: bx - 24,
        y: by - 24,
        vx: -1.2 - i * 0.2,
        vy: -4.5,
        g: 0.32,
        scale: 3,
        frameMs: 140,
        update(m, _t, a) {
          if (m.hit || m.onFloor) return;
          if (m.y + sh >= a.floorY) {
            // lands and starts marching toward the marble
            m.onFloor = true;
            m.vx = -speed;
            m.vy = 0;
            m.g = 0;
            a.fx.burst('dust', 5, m.x + sh / 2, a.floorY - 4);
          }
        }
      };
      api.spawn(s);
      api.fx.burst('spark', 8, bx, by, { color: MAGL, speed: 0.6 });
      api.sound.note(67 + (i % 3) * 4, { instrument: 'marimba', level: 0.08 });
      api.sound.note(91, { at: 0.05, instrument: 'glock', level: 0.03 });
    });
  }
}

registerBoss({
  id: 'grim-grimoire',
  scale: SCALE,
  hover: 40,
  intro: 'fly',
  frames,
  pose(t, state, f) {
    if (state === 'intro') {
      if (t - lastIntro > 1000) reset();
      lastIntro = t;
    }
    const bob = Math.round(Math.sin(t / 450) * 4) * U;
    isOpen = false;
    if (state === 'hurt' || state === 'dazed' || state === 'dying') return { frame: f.hurt[0], tilt: -0.1, dy: bob };
    if (state === 'wind' || t < openUntil || t < beamUntil) {
      isOpen = true;
      // flaps open, trembling with power
      return { frame: angry ? f.angryWind[0] : f.wind[0], dy: bob - 2 * U, dx: Math.round(Math.sin(t / 40)) * U };
    }
    if (t % 4100 < 150) return { frame: f.blink[0], dy: bob };
    return { frame: f.idle[Math.floor(t / 240) % 4], dy: bob, tilt: Math.sin(t / 800) * 0.05 };
  },
  moves: [
    {
      id: 'summon-glyphs',
      windup: 650,
      run(api) {
        summon(api, api.phase === 2 ? 5 : 3);
      }
    },
    {
      id: 'page-storm',
      windup: 600,
      run(api) {
        // a torrent of pages; most fly high, a few skim the floor to hop
        openUntil = api.t + 1300;
        api.tint(1300, 'rgba(90,30,120,.12)');
        api.sound.whoosh(0.16, 1.3, 0, 2200, 500);
        const [bx, by] = art(api, 32, 30);
        const n = api.phase === 2 ? 18 : 13;
        for (let i = 0; i < n; i++) {
          const low = i % 5 === 0;
          api.after(i * 85, () => {
            const sh = page[0].height * 3;
            const lane = low ? api.floorY - sh - 6 : 70 + ((i * 47) % 120);
            const ph = i * 1.3;
            api.spawn({
              frames: page,
              x: bx - 12,
              y: by,
              vx: -8 - (i % 3),
              scale: 3,
              frameMs: 70 + (i % 3) * 20,
              dodge: low ? 'hop' : 'none',
              update(s, t) {
                if (s.hit) return;
                // swirl down to the lane, fluttering
                s.y += (lane - s.y) * 0.08 + Math.sin(t / 80 + ph) * (low ? 0.4 : 2);
                s.vy = 0;
              }
            });
            if (i % 3 === 0) api.sound.note(84 + (i % 7), { instrument: 'glock', level: 0.03 });
          });
        }
      }
    },
    {
      id: 'magic-circle',
      windup: 700,
      run(api) {
        // the circle pulses outward three times; each pulse runs along the floor
        circleAt = api.t;
        openUntil = api.t + 1500;
        const x0 = api.bossX - api.bossW * 0.45;
        for (let i = 0; i < 3; i++) {
          api.after(i * 520, () => {
            api.spawn({ frames: pulse, x: x0, y: 0, vx: -6.6, onFloor: true, scale: 3, frameMs: 80, glow: MAG });
            api.flash(70, 'rgba(255,80,220,.18)');
            [60, 67, 72].forEach((m, j) => api.sound.note(m + i * 2, { at: j * 0.02, instrument: 'bell', level: 0.06 }));
          });
        }
      }
    },
    {
      id: 'arcane-beam',
      windup: 800,
      phase: 2,
      run(api) {
        // a beam at head height: the marble ducks under it
        beamUntil = api.t + 950;
        api.beam(api.floorY - 62, 900, { color: MAG, height: 9, dodge: 'duck' });
        api.shake(6, 900);
        api.sound.note(38, { instrument: 'pad', level: 0.14, hold: 0.9 });
        api.sound.whoosh(0.14, 0.9, 0, 3200, 2000);
        api.after(1000, () => summon(api, 2));
      }
    }
  ],
  drawExtra(g, t, api, state) {
    angry = api.phase === 2;
    if (state === 'dying') return;
    const cx = api.bossX;
    const cy = api.bossTop + api.bossH * 0.5;
    // the magic circle: a flattened rune ring under the book, pulsing outward
    const since = t - circleAt;
    if (since >= 0 && since < 1600) {
      const fade = Math.min(1, since / 200, (1600 - since) / 300);
      const ly = api.bossTop + api.bossH + 20;
      for (const [r, col, sp] of [[api.bossW * 0.55, MAG, 1], [api.bossW * 0.42, GOLD, -1.4]] as [number, string, number][]) {
        const steps = 36;
        for (let i = 0; i < steps; i++) {
          const a = (i / steps) * Math.PI * 2 + (t / 400) * sp;
          g.globalAlpha = fade * (i % 3 === 0 ? 1 : 0.55);
          g.fillStyle = col;
          g.fillRect(r3(cx + Math.cos(a) * r), r3(ly + Math.sin(a) * r * 0.22), U * 2, U);
        }
      }
      for (let i = 0; i < 3; i++) {
        const k = (since - i * 520) / 700;
        if (k < 0 || k > 1) continue;
        g.globalAlpha = 1 - k;
        const r = api.bossW * 0.3 + k * 260;
        for (let j = 0; j < 48; j++) {
          const a = (j / 48) * Math.PI * 2;
          g.fillStyle = j % 2 ? MAG : MAGL;
          g.fillRect(r3(cx + Math.cos(a) * r), r3(cy + Math.sin(a) * r * 0.75), U * 2, U * 2);
        }
      }
      g.globalAlpha = 1;
    }
    // runes orbit the book
    const n = angry ? 4 : 3;
    for (let i = 0; i < n; i++) {
      const a = t / (angry ? 500 : 1000) + (i * Math.PI * 2) / n;
      const rune = RUNES[i % RUNES.length];
      const front = Math.sin(a) > 0;
      g.globalAlpha = front ? 1 : 0.5;
      g.imageSmoothingEnabled = false;
      g.drawImage(rune, r3(cx + Math.cos(a) * api.bossW * 0.62 - rune.width * 1.5), r3(cy + Math.sin(a) * api.bossH * 0.3 - rune.height * 1.5), rune.width * 3, rune.height * 3);
      if (angry) {
        g.globalCompositeOperation = 'lighter';
        g.globalAlpha = 0.4;
        pxEllipse(g, cx + Math.cos(a) * api.bossW * 0.62, cy + Math.sin(a) * api.bossH * 0.3, 12, 12, '#ff3d6d');
        g.globalCompositeOperation = 'source-over';
      }
    }
    g.globalAlpha = 1;
    // gold motes drifting up off the pages
    for (let i = 0; i < 4; i++) {
      const k = ((t / 1700 + i / 4) % 1);
      g.globalAlpha = 1 - k;
      g.fillStyle = i % 2 ? GOLD : MAGL;
      star(g, cx - 40 + i * 26 + Math.sin(t / 260 + i) * 8, cy + 20 - k * 110, 3);
    }
    g.globalAlpha = 1;
    // the beam's source: the open book blazes
    if (t < beamUntil) {
      const [bx, by] = art(api, 32, 34);
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = 0.6 + Math.sin(t / 50) * 0.2;
      pxEllipse(g, bx, by, 40, 34, MAG);
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = MAGL;
      for (let i = 0; i < 6; i++) {
        // sparks run from the pages down into the beam
        const y = by + (api.floorY - 62 - by) * (i / 5);
        const x = bx - 60 * (i / 5) + Math.sin(t / 40 + i) * 6;
        g.fillRect(r3(x), r3(y), U * 2, U * 2);
      }
    }
    // phase 2: the eye burns red and purple wisps lick the cover
    if (angry && state !== 'hurt' && state !== 'dazed') {
      const [ex, ey] = isOpen ? art(api, 31, 34) : art(api, 30.5, 29);
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = 0.55 + Math.sin(t / 110) * 0.2;
      pxEllipse(g, ex, ey, 18, 14, '#ff2d55');
      for (let i = 0; i < 6; i++) {
        const k = ((t / 1100 + i / 6) % 1);
        const side = i % 2 ? 1 : -1;
        g.globalAlpha = 0.45 * (1 - k);
        pxEllipse(g, cx + side * api.bossW * 0.38 + Math.sin(t / 150 + i) * 6, api.bossTop + api.bossH * (0.85 - (i / 6) * 0.6) - k * 40, 8, 10, '#a040ff');
      }
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
    }
  }
});
