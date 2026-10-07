import { makeSprite, disc, rect, line, poly, eyesX, ring, pxEllipse, r3, U, INK } from '../../pixel';
import type { Sprite } from '../../pixel';
import { registerBoss } from '../registry';
import type { BossApi, Shot } from '../types';

// Fort 1 of the Sky Library: a long worm made of books, rising in a swaying
// S from a pile of tomes. Its head is a plum leather tome whose covers are
// the jaws (pages for teeth), with round reading glasses and a ribbon
// tongue. It throws spinning page shuriken, snakes a train of books through
// the air in a wavy dive, and lashes its ribbon along the floor. Phase 2:
// its glasses glare amber and the shelves rain books.

const SCALE = 3.5;
const PL = '#7a2e5a';
const PLD = '#4e1a3a';
const PLL = '#a8517f';
const PAGE = '#f4ead0';
const PAGED = '#d8c8a0';
const GOLD = '#e8b84a';
const RIB = '#e0344e';
const BOOKS = ['#3f7a5a', '#2f5a9a', '#b0503a', '#c9973a', '#6a4a9a', '#2f7a86', '#9a3a5a'];

// one book seen spine-on: cover colour, gold bands, cream page edge on the left
function bookSeg(put: (x: number, y: number, c: string | null) => void, x: number, y: number, w: number, h: number, col: string) {
  rect(put, x, y, w, h, col);
  rect(put, x, y, 2, h, PAGE);
  for (let j = 1; j < h; j += 2) put(x, y + j, PAGED);
  rect(put, x + 4, y, 1, h, GOLD);
  rect(put, x + w - 4, y, 1, h, GOLD);
  rect(put, x + 2, y, w - 2, 1, 'rgba(255,255,255,.25)');
  rect(put, x + 2, y + h - 1, w - 2, 1, 'rgba(0,0,0,.25)');
}

function wyrm(sway: number, mouth: 'shut' | 'open', eyes: 'open' | 'x') {
  return makeSprite(64, 62, (put) => {
    // the pile it rises from
    bookSeg(put, 28, 56, 34, 6, '#5a3a2a');
    bookSeg(put, 32, 50, 28, 6, '#2f5a9a');
    bookSeg(put, 26, 45, 24, 5, '#3f7a5a');
    // the body: a swaying S of stacked books, tapering toward the neck
    for (let i = 0; i < 6; i++) {
      const y = 40 - i * 5;
      const w = 18 - i;
      const cx = 38 + Math.round(Math.sin(i * 0.95 + sway) * 6) - Math.round(i * 0.8);
      bookSeg(put, cx - w / 2, y, w, 5, BOOKS[i % BOOKS.length]);
    }
    // a bookmark ribbon tail fluttering from the pile
    line(put, 58, 50, 61 + Math.round(Math.sin(sway) * 2), 40, RIB, 2);
    poly(put, [[60, 40], [63, 40], [62, 37]], RIB);
    // the head: a thick tome lying sideways; its covers are the jaws
    const open = mouth === 'open';
    // upper cover
    poly(put, [[2, open ? 6 : 10], [30, 4], [34, 8], [34, 16], [4, open ? 14 : 18]], PL);
    poly(put, [[2, open ? 6 : 10], [30, 4], [32, 6], [4, open ? 8 : 12]], PLL);
    line(put, 34, 8, 34, 16, PLD, 2);
    // pages between the covers
    if (open) {
      poly(put, [[4, 14], [34, 16], [34, 22], [6, 28]], '#2a0f22');
      for (let x = 6; x < 30; x += 4) {
        poly(put, [[x, 14], [x + 3, 14], [x + 1.5, 18]], PAGE);
        poly(put, [[x + 1, 27 - (x - 6) / 6], [x + 4, 27 - (x - 6) / 6], [x + 2.5, 23 - (x - 6) / 6]], PAGE);
      }
      // ribbon tongue
      line(put, 14, 24, 6, 26, RIB, 2);
      poly(put, [[2, 25], [6, 24], [6, 28]], RIB);
    } else {
      rect(put, 4, 18, 30, 4, PAGE);
      for (let x = 6; x < 34; x += 3) put(x, 19 + (x % 2), PAGED);
      // the ribbon tongue peeks out and dangles
      line(put, 6, 22, 4, 28, RIB, 2);
      poly(put, [[2, 28], [6, 28], [4, 31]], RIB);
    }
    // lower cover (jaw)
    const jy = open ? 28 : 22;
    poly(put, [[4, jy], [34, jy - (open ? 6 : 0)], [36, jy + 4 - (open ? 6 : 0)], [8, jy + 5]], PL);
    line(put, 6, jy + 4, 34, jy + 2 - (open ? 6 : 0), PLD);
    // gold corner guards and a clasp
    poly(put, [[2, open ? 6 : 10], [7, open ? 6 : 9], [3, open ? 11 : 14]], GOLD);
    rect(put, 30, 10, 4, 4, GOLD);
    put(31, 11, '#fff3b0');
    // a quill crest
    poly(put, [[24, 6], [34, 0], [44, 1], [30, 8]], '#fbf6ea');
    line(put, 24, 6, 44, 1, '#c8bfa8');
    for (const x of [30, 34, 38]) put(x, 2, '#c8bfa8');
    // big eyes behind round reading glasses
    for (const [ex, ey] of [[12, 9], [21, 8]]) {
      disc(put, ex, ey, 3.6, 3.6, '#fff');
      if (eyes === 'x') eyesX(put, ex - 2, ey - 2);
      else {
        rect(put, ex - 2, ey - 1, 2, 3, INK);
        put(ex - 2, ey - 1, '#fff');
      }
      ring(put, ex, ey, eyes === 'x' ? 4.6 : 4.4, GOLD, 24);
    }
    line(put, 16, 8, 17, 8, GOLD);
    if (eyes === 'x') put(9, 14, GOLD);
    // a stern bookish brow
    line(put, 8, 4, 14, 5, PLD);
    line(put, 18, 4, 24, 3, PLD);
  });
}

const shuriken = [0, 1].map((f) =>
  makeSprite(12, 12, (put) => {
    poly(put, [[6, 0], [8, 4], [12, 6], [8, 8], [6, 12], [4, 8], [0, 6], [4, 4]], PAGE);
    poly(put, [[6, 0], [8, 4], [6, 6]], PAGED);
    poly(put, [[12, 6], [8, 8], [6, 6]], PAGED);
    poly(put, [[6, 12], [4, 8], [6, 6]], PAGED);
    poly(put, [[0, 6], [4, 4], [6, 6]], PAGED);
    put(6, 6, f ? RIB : GOLD);
    for (const [x, y] of [[5, 3], [9, 5], [7, 9], [3, 7]]) put(x, y, '#9a8a6a');
  })
);
const snakeHead = [0, 1].map((f) =>
  makeSprite(18, 14, (put) => {
    poly(put, [[0, 3 - f], [16, 1], [17, 6], [2, 6]], PL);
    rect(put, 2, 6, 15, 2, PAGE);
    poly(put, [[2, 8 + f], [17, 8], [16, 12], [4, 12 + f]], PL);
    disc(put, 8, 3, 1.8, 1.8, '#fff');
    put(7, 3, INK);
    line(put, 2, 9, 0, 12, RIB);
  })
);
const snakeSeg = BOOKS.map((c) => makeSprite(14, 10, (put) => bookSeg(put, 0, 0, 14, 10, c)));
const tome = [0, 1].map((f) =>
  makeSprite(18, 14, (put) => {
    rect(put, 0, 0, 18, 14, BOOKS[f ? 2 : 4]);
    rect(put, 0, 0, 18, 2, PAGE);
    rect(put, 3, 4, 12, 6, GOLD);
    rect(put, 4, 5, 10, 4, BOOKS[f ? 2 : 4]);
    rect(put, 16, 2, 2, 12, 'rgba(0,0,0,.3)');
  })
);
const page = makeSprite(8, 10, (put) => {
  rect(put, 0, 0, 8, 10, PAGE);
  for (const y of [2, 4, 6, 8]) line(put, 1, y, 6, y, PAGED);
});

let built: Record<string, Sprite[]> | null = null;
function frames() {
  if (!built) {
    built = {
      idle: [0, 1, 2, 3].map((i) => wyrm((i / 4) * Math.PI * 2, 'shut', 'open')),
      wind: [wyrm(0, 'open', 'open')],
      hurt: [wyrm(1, 'shut', 'x')]
    };
  }
  return built;
}

// ---- per-fight state (reset at the intro)
let lash: { at: number; until: number } | null = null;
let lunge: { at: number; until: number } | null = null;
let lastIntro = -1e9;
function reset() {
  lash = null;
  lunge = null;
}
const art = (api: BossApi, ax: number, ay: number): [number, number] => [
  api.bossX - api.bossW / 2 + (ax + 1) * SCALE,
  api.bossTop + (ay + 1) * SCALE
];

// a train of books snaking through the air: it dives from the mouth in a
// wave that flattens into a lane the marble ducks under (or, low, hops)
function bookTrain(api: BossApi, low: boolean) {
  const [mx, my] = art(api, 2, 22);
  const n = 8;
  const speed = 6.4;
  const segH = (snakeSeg[0].height) * 3;
  const laneTop = low ? api.floorY - segH : api.floorY - 52 - segH;
  for (let i = 0; i < n; i++) {
    api.after(i * 85, () => {
      const head = i === 0;
      const fr = head ? snakeHead : [snakeSeg[i % snakeSeg.length]];
      const h = fr[0].height * 3;
      const s: Shot = {
        frames: fr,
        x: mx - 30,
        y: my - h / 2,
        vx: 0,
        scale: 3,
        frameMs: 140,
        dodge: low ? 'hop' : 'duck',
        update(sh, t) {
          if (sh.hit) return;
          const age = (t - (sh.born || t)) / 16.7;
          const x = mx - 30 - age * speed;
          const k = Math.min(1, (mx - x) / 320);
          const lane = laneTop - (h - segH);
          const wave = Math.sin((mx - x) / 46) * 70 * (1 - k);
          sh.x = x;
          sh.y = my - h / 2 + (lane - (my - h / 2)) * (k * k * (3 - 2 * k)) + wave;
          sh.vx = 0;
          sh.vy = 0;
        }
      };
      api.spawn(s);
      if (head) api.sound.whoosh(0.1, 0.9, 0, 1800, 500);
      else api.sound.note(60 + ((i * 5) % 12), { instrument: 'marimba', level: 0.05 });
    });
  }
}

registerBoss({
  id: 'bookwyrm',
  scale: SCALE,
  intro: 'rise',
  frames,
  pose(t, state, f) {
    if (state === 'intro') {
      if (t - lastIntro > 1000) reset();
      lastIntro = t;
    }
    if (state === 'hurt' || state === 'dazed' || state === 'dying') return { frame: f.hurt[0], tilt: 0.04 };
    if (lunge && t < lunge.until) {
      const k = (t - lunge.at) / (lunge.until - lunge.at);
      return { frame: f.wind[0], dx: -Math.round(Math.sin(k * Math.PI) * 6) * U, tilt: -Math.sin(k * Math.PI) * 0.1 };
    }
    if (state === 'wind') return { frame: f.wind[0], tilt: 0.06, dy: -U, dx: 2 * U };
    // the whole stack sways like a charmed snake
    const i = Math.floor(t / 210) % 4;
    return { frame: f.idle[i], tilt: Math.sin(t / 650) * 0.025 };
  },
  moves: [
    {
      id: 'page-shuriken',
      windup: 460,
      run(api) {
        const [mx, my] = art(api, 2, 18);
        const n = api.phase === 2 ? 5 : 3;
        for (let i = 0; i < n; i++) {
          api.after(i * 150, () => {
            // alternating heights: the marble hops the low ones, ducks the high ones
            const low = i % 2 === 0;
            const ty = low ? api.floorY - 24 : api.floorY - 86;
            const T = 48;
            api.spawn({
              frames: shuriken,
              x: mx - 20,
              y: my - 20,
              vx: (api.marbleX - 40 - mx) / T,
              vy: (ty - my) / T,
              scale: 3.5,
              spin: 0.4,
              frameMs: 60,
              dodge: low ? 'hop' : 'duck',
              update(s) {
                // level out once it reaches its height
                if (!s.hit && s.vy && ((s.vy > 0 && s.y + 20 >= ty) || (s.vy < 0 && s.y + 20 <= ty))) s.vy = 0;
              }
            });
            api.sound.whoosh(0.07, 0.25, 0, 3000, 1200);
            api.sound.note(84 + i * 2, { instrument: 'glock', level: 0.04 });
          });
        }
      }
    },
    {
      id: 'wavy-dive',
      windup: 640,
      run(api) {
        lunge = { at: api.t, until: api.t + 900 };
        bookTrain(api, false);
        if (api.phase === 2) api.after(1100, () => bookTrain(api, true));
      }
    },
    {
      id: 'ribbon-lash',
      windup: 520,
      weight: 0.8,
      run(api) {
        // the ribbon tongue cracks along the floor like a whip
        lash = { at: api.t, until: api.t + 420 };
        api.beam(api.floorY - 12, 380, { color: RIB, height: 8, dodge: 'hop' });
        api.sound.whoosh(0.12, 0.3, 0, 4000, 800);
        api.sound.thump(0.4);
        api.shake(4, 160);
        api.fx.burst('dust', 8, api.marbleX + 140, api.floorY - 4);
      }
    },
    {
      id: 'shelf-rain',
      windup: 760,
      phase: 2,
      run(api) {
        // the shelves rumble and heavy books fall, around the marble unless aimed
        api.shake(7, 900);
        api.tint(1400, 'rgba(120,60,20,.10)');
        api.sound.thump(0.9);
        api.sound.note(41, { instrument: 'pad', level: 0.1, hold: 0.8 });
        const xs = Array.from({ length: 5 }, (_, i) => 80 + ((i * 149 + 20) % 560)).filter((x) => Math.abs(x - api.marbleX) > 80);
        if (api.aim) xs.unshift(api.marbleX);
        xs.forEach((x, i) => {
          api.warn(x, 620 + i * 160, () => {
            const sh = tome[0].height * 3.5;
            api.spawn({
              frames: tome,
              x: x - 32,
              y: -70,
              vy: 12,
              scale: 3.5,
              spin: 0.2,
              frameMs: 120,
              dodge: 'none',
              update(s, _t, a) {
                if (s.y + sh < a.floorY) return;
                s.done = true;
                a.shake(4, 120);
                a.sound.thump(0.4);
                for (let p = 0; p < 4; p++) a.fx.add({ kind: 'leaf', x, y: a.floorY - 20, vx: (Math.random() - 0.5) * 5, vy: -3 - Math.random() * 2, color: PAGE });
                a.fx.burst('dust', 6, x, a.floorY - 4);
              }
            });
            if (Math.abs(x - api.marbleX) < 50) api.strikeMarble();
          }, { kind: 'shadow', width: 64 });
        });
      }
    }
  ],
  drawExtra(g, t, api, state) {
    const angry = api.phase === 2;
    const alive = state !== 'dying';
    // loose pages orbit the wyrm, turning as they go
    if (alive) {
      const n = angry ? 6 : 4;
      for (let i = 0; i < n; i++) {
        const a = t / (angry ? 520 : 900) + (i * Math.PI * 2) / n;
        const x = api.bossX + 20 + Math.cos(a) * api.bossW * 0.5;
        const y = api.bossTop + api.bossH * 0.45 + Math.sin(a) * api.bossH * 0.35;
        const turn = Math.abs(Math.cos(t / 180 + i));
        const w = Math.max(U, r3(page.width * 3 * turn));
        g.globalAlpha = Math.sin(a) < 0 ? 0.55 : 1;
        g.imageSmoothingEnabled = false;
        g.drawImage(page, r3(x - w / 2), r3(y), w, page.height * 3);
      }
      g.globalAlpha = 1;
    }
    // the ribbon whip, drawn from the mouth down to the floor
    if (lash && t < lash.until) {
      const k = (t - lash.at) / (lash.until - lash.at);
      const [mx, my] = art(api, 4, 26);
      const reach = 120 + k * 520;
      g.fillStyle = RIB;
      for (let i = 0; i <= 40; i++) {
        const q = i / 40;
        const x = mx - reach * q;
        const y = my + (api.floorY - 12 - my) * Math.min(1, q * 3) + Math.sin(q * 14 - t / 30) * 6 * (1 - q);
        g.fillRect(r3(x), r3(y), U * 2, U * 2);
      }
    }
    // phase 2: the glasses glare amber
    if (angry && state !== 'hurt' && state !== 'dazed' && alive) {
      g.globalCompositeOperation = 'lighter';
      for (const [ax, ay] of [[12, 9], [21, 8]]) {
        const [ex, ey] = art(api, ax, ay);
        g.globalAlpha = 0.5 + Math.sin(t / 130) * 0.2;
        pxEllipse(g, ex, ey, 16, 14, '#ffb43a');
      }
      g.globalAlpha = 0.18 + Math.sin(t / 300) * 0.06;
      pxEllipse(g, api.bossX, api.bossTop + api.bossH * 0.5, api.bossW * 0.5, api.bossH * 0.52, '#c9973a');
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
    }
  }
});
