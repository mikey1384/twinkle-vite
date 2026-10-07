import { makeSprite, disc, rect, line, poly, eyesX, drawSprite, r3, INK, U, W, type Put, type Sprite } from '../../pixel';
import { registerBoss } from '../registry';
import type { BossApi, BossState, Pose, Shot } from '../types';

// Castle of the Sky Library: a winged sphinx in half-moon spectacles, sitting
// on a pile of books. Eye beams sweep the floor, flying books come in waves,
// riddle rings ripple out from her paws. Phase 2: she takes flight off the
// pile, the sky goes dark and columns of light strike (warning glow first).

const FW = 84;
const FH = 58;
const G = '#ffcb32';
const GD = '#c98a1e';
const SKIN = '#e8b85a';
const SKD = '#a8742e';
const SKL = '#ffe39a';
const LAPIS = '#2d5fb8';
const CREAM = '#f4ecd8';
const FEATHER = '#c8b89a';
const SKY = '#6f9ad8';
const GLOW = '#7ff6ff';

type Eyes = 'open' | 'glow' | 'x';

function pile(put: Put) {
  // [x, y, w, cover]
  const books: [number, number, number, string][] = [
    [24, 54, 58, '#7a2a4a'],
    [30, 50, 48, '#2d5a8c'],
    [33, 46, 22, '#3f7a3a'],
    [56, 46, 20, '#b0702a']
  ];
  for (const [x, y, w, c] of books) {
    rect(put, x, y, w, 4, c);
    rect(put, x, y, w, 1, CREAM);
    rect(put, x + w - 3, y + 1, 3, 2, CREAM);
    rect(put, x + 3, y + 1, 1, 3, G);
    rect(put, x + 6, y + 1, 1, 3, G);
    rect(put, x, y + 3, w, 1, INK);
  }
}

// lapis-and-gold stripes inside any shape
const stripes = (put: Put): Put => (x, y) => put(x, y, y % 3 === 0 ? G : LAPIS);

function head(put: Put, eyes: Eyes) {
  poly(stripes(put), [[12, 10], [32, 10], [37, 33], [30, 28], [16, 28], [9, 33]], LAPIS);
  disc(stripes(put), 22, 12, 11, 5, LAPIS);
  rect(put, 12, 11, 20, 1, G);
  disc(put, 21, 19, 7, 8, SKIN, SKD, SKL);
  rect(put, 20, 8, 3, 3, GLOW);
  put(20, 8, '#fff');
  // braided beard
  for (let y = 26; y < 32; y++) rect(put, 19, y, 4, 1, y % 2 ? G : LAPIS);
  rect(put, 20, 32, 2, 1, G);
  // nose and a small knowing smile
  put(19, 21, SKD);
  put(19, 22, SKD);
  line(put, 17, 24, 22, 24, '#7a3a2a');
  put(16, 23, '#7a3a2a');
  if (eyes === 'x') {
    eyesX(put, 14, 15);
    eyesX(put, 22, 15);
    // spectacles knocked crooked
    line(put, 13, 21, 18, 19, G);
    line(put, 21, 22, 26, 20, G);
    return;
  }
  const iris = eyes === 'glow' ? GLOW : '#fff';
  for (const x of [15, 22]) {
    rect(put, x, 17, 4, 2, iris);
    if (eyes === 'glow') rect(put, x + 1, 17, 2, 2, '#fff');
    else rect(put, x, 17, 2, 2, INK);
  }
  // brows: arched, or furrowed when she means it
  if (eyes === 'glow') {
    line(put, 14, 14, 18, 16, INK);
    line(put, 26, 14, 22, 16, INK);
  } else {
    line(put, 14, 15, 18, 15, SKD);
    line(put, 22, 15, 26, 15, SKD);
  }
  // half-moon reading glasses
  line(put, 14, 20, 19, 20, G);
  line(put, 21, 20, 26, 20, G);
  put(20, 19, G);
  line(put, 26, 19, 31, 17, GD);
}

// feathers: rows of little scallops so the wings never read as a flat blob
const feathered = (put: Put): Put => (x, y) => put(x, y, y % 4 === 3 && (x + (y >> 2) * 2) % 4 !== 0 ? FEATHER : (x + y) % 9 === 0 ? '#fffaf0' : CREAM);

function folded(put: Put, up: boolean) {
  const lift = up ? 4 : 0;
  poly(feathered(put), [[40, 34], [45, 14 - lift], [55, 3 - lift], [70, 1 - lift], [80, 9 - lift], [76, 20], [66, 30], [52, 36]], CREAM);
  poly(put, [[66, 30], [76, 20], [80, 9 - lift], [83, 16 - lift], [79, 26], [70, 33]], SKY);
  line(put, 46, 28, 76, 12 - lift, FEATHER);
  line(put, 48, 32, 74, 22, FEATHER);
  line(put, 44, 24, 62, 6 - lift, G, 2);
  for (let k = 0; k < 4; k++) put(70 + k * 3, 30 - k * 4 - (up ? 1 : 0), LAPIS);
}

function spread(put: Put, up: boolean) {
  if (up) {
    poly(put, [[34, 30], [26, 6], [40, 1], [48, 26]], FEATHER);
    poly(feathered(put), [[42, 34], [44, 8], [56, 0], [72, 0], [84, 4], [78, 16], [64, 28], [52, 36]], CREAM);
    poly(put, [[64, 28], [78, 16], [84, 4], [84, 12], [80, 22], [70, 31]], SKY);
    line(put, 46, 26, 80, 6, FEATHER);
    line(put, 48, 31, 76, 16, FEATHER);
    line(put, 44, 22, 60, 2, G, 2);
  } else {
    poly(put, [[36, 32], [30, 46], [40, 50], [46, 36]], FEATHER);
    poly(feathered(put), [[42, 30], [58, 26], [76, 28], [84, 36], [82, 48], [70, 50], [56, 44], [46, 38]], CREAM);
    poly(put, [[70, 50], [82, 48], [84, 36], [84, 44], [80, 52], [72, 53]], SKY);
    line(put, 48, 32, 82, 40, FEATHER);
    line(put, 48, 36, 76, 48, FEATHER);
    line(put, 44, 30, 70, 27, G, 2);
  }
}

function body(put: Put) {
  disc(put, 70, 40, 9, 7, SKIN, SKD);
  disc(put, 54, 40, 22, 7, SKIN, SKD, SKL);
  // tail with a lapis tuft
  line(put, 77, 42, 81, 36, SKIN);
  line(put, 81, 36, 82, 31, SKIN);
  disc(put, 82, 30, 2.5, 2.5, LAPIS);
  disc(put, 32, 34, 9, 9, SKIN, SKD, SKL);
}

function sphinx(pose: 'sit' | 'sitUp' | 'flyUp' | 'flyDown', eyes: Eyes) {
  return makeSprite(FW, FH, (put) => {
    const flying = pose === 'flyUp' || pose === 'flyDown';
    if (!flying) pile(put);
    if (flying) spread(put, pose === 'flyUp');
    body(put);
    if (flying) {
      // legs dangle under her once she leaves the pile
      rect(put, 62, 44, 5, 8, SKD);
      rect(put, 71, 44, 5, 7, SKD);
      rect(put, 61, 51, 6, 2, SKIN);
      rect(put, 70, 50, 6, 2, SKIN);
      rect(put, 18, 40, 14, 5, SKIN);
      disc(put, 17, 44, 3, 2.5, SKL);
    } else {
      rect(put, 16, 39, 18, 3, SKD);
      rect(put, 12, 41, 24, 5, SKIN);
      rect(put, 12, 45, 24, 1, SKD);
      disc(put, 12, 44, 3, 2.5, SKL);
      for (const x of [9, 11, 13]) put(x, 46, '#fff');
    }
    if (!flying) folded(put, pose === 'sitUp');
    else {
      // a jewelled collar shows more in flight
      for (let x = 26; x < 38; x += 2) put(x, 33, x % 4 ? G : GLOW);
    }
    head(put, eyes);
  });
}

const book = ['#b33a4a', '#3f7a3a', '#5a3fa0'].map((cover) =>
  [0, 1].map((f) =>
    makeSprite(14, 10, (put) => {
      if (f) {
        // open, pages flapping like wings
        poly(put, [[7, 6], [0, 1], [2, 0], [7, 4]], CREAM);
        poly(put, [[7, 6], [14, 1], [12, 0], [7, 4]], CREAM);
        line(put, 0, 2, 7, 7, cover);
        line(put, 14, 2, 7, 7, cover);
        rect(put, 6, 5, 2, 4, cover);
      } else {
        rect(put, 1, 2, 12, 7, cover);
        rect(put, 12, 3, 2, 5, CREAM);
        rect(put, 1, 2, 12, 1, G);
        rect(put, 3, 5, 6, 1, G);
      }
    })
  )
);
const scorch = [0, 1].map((f) =>
  makeSprite(16, 9, (put) => {
    disc(put, 8, 7, 8, 2, '#2a8fb0');
    poly(put, [[2, 8], [4 + f, 2], [7, 5], [9, 0 + f], [12, 4], [14, 8]], GLOW);
    rect(put, 6, 6, 4, 2, '#fff');
  })
);
const glyph = [0, 1].map((f) =>
  makeSprite(16, 8, (put) => {
    disc(put, 8, 4, 8, 3.5, f ? G : '#ffe9a0');
    disc(put, 8, 4, 5, 2, '#5a3fa0');
    for (let k = 0; k < 4; k++) put(3 + k * 3, f ? 4 : 3, '#fff');
  })
);

// ---- effects she draws herself (beams, rings, light columns)
let now = 0;
let phase = 1;
let lastFrame: Sprite | null = null;
let lastState: BossState = 'idle';
let hurtStart = -1e9;
const sweeps: { s: Shot; at: number }[] = [];
const rings: { at: number; cx: number; cy: number; col: string }[] = [];
const pillars: { x: number; at: number }[] = [];
const RING_SPEED = 0.5; // px per ms

const fresh = (at: number, ms: number) => at <= now + 50 && now - at < ms;

function eyesAt(api: BossApi) {
  const sc = api.bossW / (FW + 2);
  return { x: api.bossX - api.bossW / 2 + 21 * sc, y: api.bossTop + 19 * (api.bossH / (FH + 2)) };
}

function spreadXs(api: BossApi, n: number) {
  const xs: number[] = [];
  for (let i = 0; i < n * 3 && xs.length < n; i++) {
    const x = 90 + ((i * 211 + Math.random() * 60) % (W * 0.66));
    if (Math.abs(x - api.marbleX) > 95 && xs.every((o) => Math.abs(o - x) > 80)) xs.push(x);
  }
  return xs;
}

registerBoss({
  id: 'librarian-sphinx',
  scale: 3,
  intro: 'drop',
  frames: () => ({
    sit: [sphinx('sit', 'open'), sphinx('sitUp', 'open')],
    wind: [sphinx('sitUp', 'glow')],
    hurt: [sphinx('sit', 'x')],
    fly: [sphinx('flyUp', 'glow'), sphinx('flyDown', 'glow')],
    flyHurt: [sphinx('flyDown', 'x')]
  }),
  pose(t, state, f) {
    let p: Pose;
    if (state === 'hurt' || state === 'dazed' || state === 'dying') p = { frame: phase === 2 ? f.flyHurt[0] : f.hurt[0], dy: phase === 2 ? -30 : 0 };
    else if (phase === 2) {
      // aloft above her abandoned pile, wings beating
      const fast = state === 'wind' ? 90 : 170;
      p = { frame: f.fly[Math.floor(t / fast) % 2], dy: -36 + Math.round(Math.sin(t / 420) * 3) * U };
    } else if (state === 'wind') p = { frame: f.wind[0], dy: -U };
    else {
      // calm reading breath; the wings ruffle now and then
      const ruffle = t % 3200 < 360 && Math.floor(t / 120) % 2 === 0;
      p = { frame: f.sit[ruffle ? 1 : 0], dy: Math.floor(t / 900) % 2 ? U : 0 };
    }
    lastFrame = p.frame;
    return p;
  },
  moves: [
    {
      id: 'eye-beam',
      windup: 700,
      run(api) {
        // her eyes sweep a scorching beam along the floor toward the marble
        const n = api.phase === 2 ? 2 : 1;
        for (let i = 0; i < n; i++) {
          api.after(i * 620, () => {
            const s = api.spawn({ frames: scorch, x: api.bossX - api.bossW * 0.4, y: 0, vx: -10, onFloor: true, glow: GLOW, frameMs: 60, life: 1600 });
            sweeps.push({ s, at: now });
            api.sound.note(76, { instrument: 'pad', level: 0.08, hold: 0.6 });
            api.sound.whoosh(0.12, 0.8, 0, 3000, 600);
            api.shake(4, 500);
          });
        }
      }
    },
    {
      id: 'book-barrage',
      windup: 600,
      run(api) {
        // waves of books flap at the marble: low ones to hop, high ones to duck
        const lanes: ('low' | 'high')[] = api.phase === 2 ? ['low', 'high', 'low'] : ['low', 'high'];
        lanes.forEach((lane, w) => {
          for (let i = 0; i < 3; i++) {
            api.after(w * 760 + i * 150, () => {
              const fr = book[(w + i) % 3];
              const h = fr[0].height * U;
              const target = lane === 'low' ? api.floorY - h - U : api.floorY - 56 - h;
              api.spawn({
                frames: fr,
                x: api.bossX - api.bossW * 0.35,
                y: api.bossTop + api.bossH * 0.3,
                vx: -6.6 - w * 0.3,
                frameMs: 110,
                update(sh, t) {
                  if (sh.hit) return;
                  sh.y += (target + Math.sin(t / 90 + i) * U - sh.y) * 0.09;
                }
              });
              api.sound.whoosh(0.05, 0.25, 0, 1800, 900);
            });
          }
        });
      }
    },
    {
      id: 'riddle-rings',
      windup: 650,
      run(api) {
        // rings ripple out from her paws; the marble hops each one's floor rune
        const n = api.phase === 2 ? 4 : 3;
        const cx = api.bossX - api.bossW * 0.3;
        const cy = api.floorY - 24;
        for (let i = 0; i < n; i++) {
          api.after(i * 480, () => {
            const ring = { at: now, cx, cy, col: i % 2 ? GLOW : G };
            rings.push(ring);
            api.sound.note([79, 83, 86, 91][i % 4], { instrument: 'glock', level: 0.07 });
            api.spawn({
              frames: glyph,
              x: cx,
              y: 0,
              onFloor: true,
              glow: ring.col,
              frameMs: 80,
              update(sh, t) {
                if (sh.hit) return;
                sh.x = ring.cx - (t - ring.at) * RING_SPEED - 24;
              }
            });
          });
        }
      }
    },
    {
      id: 'light-columns',
      windup: 820,
      phase: 2,
      run(api) {
        // the dark sky opens: columns of light strike around the marble
        api.tint(2200, 'rgba(18,8,60,.28)');
        api.sound.note(43, { instrument: 'pad', level: 0.14, hold: 1.4 });
        const xs = spreadXs(api, 4);
        if (api.aim) xs.unshift(api.marbleX);
        else xs.splice(1, 0, Math.min(W - 200, api.marbleX + 110));
        xs.forEach((x, i) => {
          api.warn(x, 760 + i * 210, () => {
            pillars.push({ x, at: now });
            api.shake(7, 200);
            api.flash(70, 'rgba(255,240,180,.35)');
            api.sound.note(84 - i * 3, { instrument: 'bell', level: 0.1 });
            api.sound.thump(0.5);
            api.fx.burst('star', 6, x, api.floorY - 10, { color: '#ffe9a0' });
            api.fx.burst('sparkle', 8, x, api.floorY - 20);
            if (Math.abs(x - api.marbleX) < 50) api.strikeMarble();
          }, { kind: 'column', color: '#ffe9a0', width: 54 });
        });
      }
    }
  ],
  drawExtra(g, t, api, state) {
    now = t;
    if (state === 'intro') {
      // a fresh fight: forget the last one's timers and effects
      sweeps.length = 0;
      rings.length = 0;
      pillars.length = 0;
      hurtStart = -1e9;
    }
    if (state !== 'dying' && state !== 'dazed') phase = api.phase;
    if (state === 'hurt' && lastState !== 'hurt') hurtStart = t;
    lastState = state;
    const eye = eyesAt(api);
    const dark = phase === 2 && state !== 'dazed' && state !== 'dying' && state !== 'intro';

    if (dark) {
      // the sky darkens over everything but her (she is redrawn on top)
      g.fillStyle = 'rgba(14,6,44,.34)';
      g.fillRect(-40, -40, W + 80, api.H + 80);
      for (let i = 0; i < 26; i++) {
        const tw = Math.sin(t / 300 + i * 1.7);
        if (tw < 0.2) continue;
        g.fillStyle = i % 3 ? '#fff' : '#ffe9a0';
        g.fillRect(r3((i * 137) % W), r3(14 + ((i * 59) % 120)), U, U);
      }
      // the abandoned pile glows faintly below her
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = 'rgba(255,200,90,.12)';
      g.fillRect(r3(api.bossX - api.bossW * 0.3), r3(api.ledgeY - 30), r3(api.bossW * 0.66), 30);
      g.globalCompositeOperation = 'source-over';
      if (lastFrame) {
        const white = t - hurtStart < 120;
        drawSprite(g, lastFrame, api.bossX - api.bossW / 2, api.bossTop, api.bossW / lastFrame.width, { white });
      }
    }

    // books orbit her head while she reads the room
    const spin = dark ? 520 : 900;
    for (let i = 0; i < 3; i++) {
      const a = t / spin + (i * Math.PI * 2) / 3;
      const bx = eye.x + 30 + Math.cos(a) * api.bossW * 0.42;
      const by = api.bossTop + 10 + Math.sin(a) * 18;
      drawSprite(g, book[i][Math.floor(t / 200 + i) % 2], bx, by, 2);
    }

    // glowing eyes: in her wind-up, and always once she is aloft
    if (state === 'wind' || dark) {
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = 'rgba(127,246,255,.55)';
      const p = 6 + Math.round(Math.abs(Math.sin(t / 80)) * 2) * U;
      g.fillRect(r3(eye.x - 14 - p / 2), r3(eye.y - p / 2), r3(p + 10), r3(p));
      g.fillRect(r3(eye.x + 6 - p / 2), r3(eye.y - p / 2), r3(p + 10), r3(p));
      g.globalCompositeOperation = 'source-over';
    }

    // eye beams down to their scorch marks on the floor
    for (let i = sweeps.length - 1; i >= 0; i--) {
      const { s, at } = sweeps[i];
      if (!fresh(at, 1500) || s.done || s.x < -100) {
        sweeps.splice(i, 1);
        continue;
      }
      const tx = s.x + 24;
      const ty = api.floorY - 8;
      const n = Math.max(1, Math.round(Math.hypot(tx - eye.x, ty - eye.y) / U));
      for (let k = 0; k <= n; k += 1) {
        const x = eye.x + ((tx - eye.x) * k) / n;
        const y = eye.y + ((ty - eye.y) * k) / n;
        g.fillStyle = 'rgba(127,246,255,.45)';
        g.fillRect(r3(x) - U * 2, r3(y) - U, U * 4, U * 3);
        g.fillStyle = k % 2 ? '#fff' : GLOW;
        g.fillRect(r3(x), r3(y), U, U);
      }
    }

    // riddle rings: dotted arcs widening over the room
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      const rad = (t - r.at) * RING_SPEED;
      if (!fresh(r.at, 2600) || rad > 1100) {
        rings.splice(i, 1);
        continue;
      }
      g.globalAlpha = Math.max(0.15, 1 - rad / 1100);
      const steps = Math.max(16, Math.round(rad / 4));
      for (let k = 0; k <= steps; k++) {
        const a = Math.PI + (k / steps) * Math.PI;
        g.fillStyle = k % 6 === 0 ? '#fff' : r.col;
        g.fillRect(r3(r.cx + Math.cos(a) * rad), r3(r.cy + Math.sin(a) * rad * 0.8), U * 2, U * 2);
      }
      g.globalAlpha = 1;
    }

    // columns of light, narrowing as they fade
    for (let i = pillars.length - 1; i >= 0; i--) {
      const p = pillars[i];
      const k = (t - p.at) / 420;
      if (!fresh(p.at, 420)) {
        pillars.splice(i, 1);
        continue;
      }
      const w = r3(66 * (1 - k * 0.8));
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = 'rgba(255,233,160,.55)';
      g.fillRect(r3(p.x - w), 0, w * 2, api.floorY);
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = '#fff';
      g.fillRect(r3(p.x - w / 4), 0, Math.max(U, r3(w / 2)), api.floorY);
    }
  }
});
