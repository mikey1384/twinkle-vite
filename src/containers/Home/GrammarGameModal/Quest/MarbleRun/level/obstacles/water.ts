import { makeSprite, rect, disc, line, poly, drawSprite, drawStanding, pxEllipse, r3, U, INK, type Put, type Sprite } from '../../pixel';
import { MR } from '../../marble';
import { thump, note, whoosh } from '../../audio';
import type { Builder, Entity, MarbleCtl, RunView } from '../types';
import { registerObstacle, ease, easeIn, easeInOut, span } from './registry';

// Underwater obstacles for swim levels. The marble swims along a lane above
// the seabed (level.restY); ground pieces are the seabed. Every obstacle
// dresses its stretch with coral, rocks and sea grass so the floor never
// reads as a bare strip.

const BASE = 309;
// mirrors level.ts (SWIM_DEPTH is not exported): the lane's centre at x
const SWIM_DEPTH = 96;
function laneAt(floor: number | null, x: number) {
  return r3(Math.min(floor ?? BASE, BASE) - SWIM_DEPTH + Math.sin(x / 220) * 14);
}
// A move restarts with k below where it last stopped. The runner starts a
// move one frame late, so k is almost never exactly 0 on the first step.
function starts() {
  let last = Infinity;
  return (k: number) => {
    const fresh = k < last;
    last = k;
    return fresh;
  };
}
// a parabola between two explicit points (m.arc only knows resting heights)
function hop(x0: number, y0: number, x1: number, y1: number, h: number, k: number) {
  return { x: x0 + (x1 - x0) * k, y: y0 + (y1 - y0) * k - h * 4 * k * (1 - k) };
}
// bubbles streaming off the back of the marble
function trail(m: MarbleCtl, chance = 0.6) {
  if (Math.random() > chance) return;
  m.fx.add({
    kind: 'bubble',
    x: m.x - MR + Math.random() * 10,
    y: m.y + (Math.random() - 0.5) * 44,
    vx: -1 - Math.random() * 1.5,
    vy: -0.4 - Math.random() * 0.4,
    life: 0.9
  });
}
function fizz(m: MarbleCtl, x: number, y: number, n = 14) {
  m.fx.burst('bubble', n, x, y, { speed: 0.6, up: 1 });
}

// ---- seabed dressing ------------------------------------------------------
const CORAL_FAN = makeSprite(16, 14, (put) => {
  disc(put, 8, 6.5, 7.6, 6.4, '#ff7a9a', '#e0507a', '#ffc1d0');
  // a lattice of holes: the outline pass turns them into the fan's net
  for (let y = 1; y < 11; y++) for (let x = 1; x < 16; x++) if ((x + y * 2) % 4 === 0 && (y % 2 === 0)) put(x, y, null);
  line(put, 8, 13, 8, 8, '#c03a62');
  line(put, 8, 9, 4, 5, '#c03a62');
  line(put, 8, 9, 12, 5, '#c03a62');
});
const CORAL_BRANCH = makeSprite(13, 16, (put) => {
  const c = '#ff9a3c';
  line(put, 5, 15, 5, 7, c, 2);
  line(put, 5, 10, 2, 5, c, 2);
  line(put, 2, 5, 1, 1, c);
  line(put, 2, 5, 4, 1, c);
  line(put, 6, 8, 10, 4, c, 2);
  line(put, 10, 4, 11, 0, c);
  line(put, 10, 4, 8, 1, c);
  for (const [x, y] of [[1, 0], [4, 0], [11, 0], [8, 0]]) put(x, y, '#ffe0a8');
  line(put, 6, 14, 6, 8, '#d06a1c');
});
const ROCK = makeSprite(20, 10, (put) => {
  disc(put, 10, 7, 10, 6.5, '#8a8f9e', '#646978', '#b8bccb');
  rect(put, 0, 10, 20, 1, null);
  put(6, 5, '#646978');
  put(13, 4, '#b8bccb');
  rect(put, 3, 8, 4, 1, '#5f9a52');
});
const STARFISH = makeSprite(10, 9, (put) => {
  poly(put, [[5, 0], [6.4, 3.4], [10, 3.6], [7.2, 5.8], [8.4, 9], [5, 7], [1.6, 9], [2.8, 5.8], [0, 3.6], [3.6, 3.4]], '#ff8a3c');
  for (const [x, y] of [[5, 2], [3, 4], [7, 4], [4, 6], [6, 6]]) put(x, y, '#ffd08a');
});
const SHELL = makeSprite(8, 6, (put) => {
  disc(put, 4, 4, 4, 3.6, '#ffe2c8', '#e8b890');
  for (const x of [2, 4, 6]) line(put, 4, 6, x, 1, '#d49a70');
  rect(put, 3, 5, 3, 1, '#d49a70');
});
const SEAGRASS = [0, 1].map((f) =>
  makeSprite(11, 17, (put) => {
    line(put, 2, 16, 1 + f, 5, '#4fbf6a');
    line(put, 5, 16, 6 - f, 0, '#3fa95a');
    line(put, 8, 16, 10 - f, 7, '#6fd68a');
    put(6 - f, 0, '#a8f0b0');
  })
);
const ANEMONE = [0, 1].map((f) =>
  makeSprite(14, 12, (put) => {
    for (let i = 0; i < 6; i++) {
      const bx = 2 + i * 2;
      const tip = 1 + ((i + f) % 2);
      line(put, bx, 8, bx + (f ? 1 : -1) * (i % 2), tip, '#c77dff');
      put(bx + (f ? 1 : -1) * (i % 2), tip, '#ffd1f4');
    }
    disc(put, 7, 9.5, 6, 2.6, '#8a4fd8', '#6a34b0');
  })
);
const DRESSING: Sprite[][] = [[CORAL_FAN], [CORAL_BRANCH], [ROCK], [STARFISH], [SHELL], SEAGRASS, SEAGRASS, ANEMONE];

class SeaBed implements Entity {
  x: number;
  y = 0;
  items: { x: number; frames: Sprite[]; ph: number }[] = [];
  constructor(x: number) {
    this.x = x;
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number, run: RunView) {
    for (const it of this.items) {
      const sx = it.x - cam;
      if (sx < -80 || sx > 1040) continue;
      const f = it.frames[Math.floor(t / 520 + it.ph) % it.frames.length];
      drawStanding(g, f, sx, run.groundAt(it.x) ?? BASE);
    }
  }
}
// scatter a few seabed bits between x0 and x1, away from the given spots
function dress(b: Builder, x0: number, x1: number, n: number, avoid: number[] = []) {
  const bed = b.entity(new SeaBed(x0));
  for (let i = 0; i < n; i++) {
    const x = r3(x0 + ((i + 0.2 + b.rand() * 0.6) / n) * (x1 - x0));
    if (avoid.some((a) => Math.abs(a - x) < 40)) continue;
    bed.items.push({ x, frames: DRESSING[Math.floor(b.rand() * DRESSING.length)], ph: b.rand() * 4 });
  }
  return bed;
}

// ---- fish: a puffer patrols the lane --------------------------------------
const PUFFER = [0, 1].map((f) =>
  makeSprite(23, 17, (put) => {
    poly(put, [[16, 8], [22, 3 + f * 2], [22, 13 - f * 2]], '#f0a020');
    line(put, 18, 8, 21, 6 + f, '#c97a10');
    poly(put, [[8, 2], [11, 0], [13, 3]], '#f0a020');
    disc(put, 9.5, 8.5, 8, 7, '#ffd23f', '#e8a317', '#fff4b0');
    disc(put, 9, 12.5, 5.5, 2.2, '#fff1c4');
    for (const [x, y] of [[12, 4], [14, 7], [11, 6], [15, 10], [13, 11]]) put(x, y, '#e07b16');
    poly(put, [[9, 9], [13, 11 + f], [10, 13]], '#f0a020');
    disc(put, 5, 6, 2.4, 2.4, '#ffffff');
    rect(put, 4, 6, 2, 2, INK);
    put(5, 5, '#ffffff');
    rect(put, 0, 9, 2, 2, '#ff8a9a');
    put(0, 9, INK);
  })
);
const PUFFED = [0, 1].map((f) =>
  makeSprite(31, 31, (put) => {
    // spines first, so the body covers their roots
    for (let a = 0; a < 16; a++) {
      const ang = (a / 16) * Math.PI * 2 + f * 0.12;
      const len = a % 2 ? 13 : 15;
      line(put, 15 + Math.cos(ang) * 9, 15 + Math.sin(ang) * 9, 15 + Math.cos(ang) * len, 15 + Math.sin(ang) * len, '#f6e7b0');
    }
    disc(put, 15, 15, 11, 11, '#ffd23f', '#e8a317', '#fff4b0');
    disc(put, 15, 20, 8, 3.5, '#fff1c4');
    for (const [x, y] of [[19, 9], [22, 13], [18, 13], [21, 18]]) put(x, y, '#e07b16');
    disc(put, 9, 12, 3.4, 3.4, '#ffffff');
    rect(put, 7, 12, 2, 2, INK);
    line(put, 5, 7, 11, 9, INK);
    disc(put, 5, 19, 2.2, 2.2, '#ff8a9a');
    rect(put, 5, 19, 1, 1, INK);
  })
);
class Puffer implements Entity {
  x: number;
  y: number;
  home: number;
  hold: number | null = null; // when set, it hovers here
  puffAt = -1e9;
  startleAt = -1e9;
  constructor(x: number, y: number) {
    this.x = this.home = x;
    this.y = y;
  }
  update(t: number) {
    if (this.hold !== null) this.x += (this.hold - this.x) * 0.2;
    else this.x = this.home + Math.sin(t / 800) * 40;
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number) {
    const sx = this.x - cam;
    if (sx < -120 || sx > 1100) return;
    const puffed = t - this.puffAt < 1300;
    // startled by the marble overhead: a quick dip and a wobble
    const st = t - this.startleAt;
    const dip = st < 500 ? Math.sin((st / 500) * Math.PI) * 18 : 0;
    const cy = this.y + Math.sin(t / 300) * 4 + dip;
    if (puffed) {
      const s = PUFFED[Math.floor(t / 90) % 2];
      const pop = t - this.puffAt < 90;
      drawSprite(g, s, sx - (s.width * U) / 2, cy - (s.height * U) / 2, U, { white: pop });
    } else {
      const s = PUFFER[Math.floor(t / 180) % 2];
      const right = this.hold === null && Math.cos(t / 800) > 0.15;
      drawSprite(g, s, sx - (s.width * U) / 2, cy - (s.height * U) / 2, U, { flip: right });
    }
  }
}
registerObstacle('fish', (b) => {
  const x0 = b.x;
  const waitX = x0 - 80;
  const fx = x0 + 130;
  b.add(330, 'flat');
  dress(b, x0 - 40, b.x, 5);
  const fish = b.entity(new Puffer(fx, laneAt(b.y, fx) + 6));
  const landX = fx + 170;
  const passNew = starts();
  const failNew = starts();
  let startled = false;
  let puffed = false;
  let bounced = false;
  return {
    kind: 'fish',
    label: 'the fish',
    waitX,
    pass: {
      dur: 1050,
      step(k, m, t) {
        if (passNew(k)) startled = false;
        const p = m.arc(waitX, landX, 125, easeInOut(k));
        m.place(p.x, p.y);
        m.spin(0.08);
        trail(m);
        if (!startled && k > 0.35) {
          startled = true;
          fish.startleAt = t;
          m.fx.burst('sweat', 3, fish.x, fish.y - 30, { speed: 0.5 });
          note(84, { instrument: 'glock', level: 0.08 });
          note(88, { at: 0.08, instrument: 'glock', level: 0.07 });
        }
      }
    },
    fail: {
      dur: 1250,
      step(k, m, t) {
        if (failNew(k)) puffed = bounced = false;
        if (k < 0.5) fish.hold = fish.hold ?? fish.x;
        const stopX = (fish.hold ?? fish.x) - 84;
        if (k < 0.3) m.roll(waitX + (stopX - waitX) * ease(k / 0.3));
        else if (k < 0.38) {
          if (!puffed) {
            puffed = true;
            fish.puffAt = t;
            whoosh(0.1, 0.18, 0, 600, 2400);
            note(72, { instrument: 'marimba', level: 0.12 });
            note(79, { at: 0.05, instrument: 'marimba', level: 0.1 });
            fizz(m, fish.x, fish.y, 10);
          }
        } else {
          if (!bounced) {
            bounced = true;
            m.bump('BOING');
            thump(0.4);
          }
          const p = m.arc(stopX, waitX, 40, ease(span(k, 0.38, 1)));
          m.place(p.x, p.y);
          m.spin(-0.12);
        }
        if (k >= 1) fish.hold = null;
      }
    }
  };
});

// ---- current: a band of fast water flowing against the marble -----------
class CurrentBand implements Entity {
  x: number;
  y: number;
  x0: number;
  x1: number;
  top: number;
  bot: number;
  front: boolean;
  surgeAt = -1e9;
  streaks: { y: number; len: number; sp: number; off: number }[] = [];
  constructor(x0: number, x1: number, top: number, bot: number, front: boolean, rand: () => number) {
    this.x = x0;
    this.y = top;
    this.x0 = x0;
    this.x1 = x1;
    this.top = top;
    this.bot = bot;
    this.front = front;
    for (let i = 0; i < (front ? 7 : 16); i++) {
      this.streaks.push({ y: top + 6 + rand() * (bot - top - 12), len: 24 + rand() * 54, sp: 0.35 + rand() * 0.3, off: rand() * 2000 });
    }
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number) {
    const l = this.x0 - cam;
    const w = this.x1 - this.x0;
    if (l > 1000 || l + w < -40) return;
    const surge = Math.max(0, 1 - (t - this.surgeAt) / 900);
    if (!this.front) {
      // the band itself: a faint wavy column of brighter water
      g.fillStyle = `rgba(150,225,255,${0.1 + surge * 0.1})`;
      for (let x = 0; x < w; x += U) {
        const wob = r3(Math.sin((x + t * 0.3) / 30) * 6);
        g.fillRect(r3(l + x), this.top + wob, U, this.bot - this.top);
      }
    }
    const speed = 1 + surge * 1.6;
    for (const s of this.streaks) {
      const cycle = w + s.len;
      const head = this.x1 - ((t * s.sp * speed + s.off) % cycle);
      const y = r3(s.y + Math.sin((head + s.off) / 40) * 6);
      const a = Math.max(0, Math.min(head - this.x0, this.x1 - head - 0) / 40);
      const fade = Math.min(1, a);
      g.fillStyle = `rgba(225,250,255,${0.55 * fade})`;
      const x0 = Math.max(this.x0, head);
      const x1 = Math.min(this.x1, head + s.len);
      if (x1 > x0) g.fillRect(r3(x0 - cam), y, r3(x1 - x0), U);
      g.fillStyle = `rgba(255,255,255,${0.9 * fade})`;
      if (head > this.x0 && head < this.x1) g.fillRect(r3(head - cam), y - U, U * 2, U * 3);
    }
    if (this.front) {
      // grit and a lost leaf tumbling along
      for (let i = 0; i < 5; i++) {
        const cycle = w + 60;
        const px = this.x1 - ((t * 0.5 * speed + i * 157) % cycle);
        if (px < this.x0) continue;
        const py = this.top + 20 + ((i * 53) % (this.bot - this.top - 40)) + Math.sin(t / 150 + i) * 8;
        g.fillStyle = i === 2 ? '#6fd06a' : '#d9c38a';
        g.fillRect(r3(px - cam), r3(py), i === 2 ? U * 2 : U, U);
      }
    }
  }
}
registerObstacle('current', (b) => {
  const x0 = b.x;
  const waitX = x0 - 70;
  const cx0 = x0 + 40;
  const cx1 = cx0 + 270;
  b.add(cx1 - x0 + 120, 'flat');
  const lane = laneAt(b.y, cx0);
  dress(b, x0 - 30, b.x, 5);
  const back = b.entity(new CurrentBand(cx0, cx1, lane - 84, lane + 78, false, b.rand));
  const fore = b.entity(new CurrentBand(cx0, cx1, lane - 70, lane + 64, true, b.rand));
  const landX = cx1 + 80;
  const passNew = starts();
  const failNew = starts();
  let kicks = 0;
  let stalled = false;
  let swept = false;
  return {
    kind: 'current',
    label: 'the current',
    waitX,
    pass: {
      dur: 1500,
      step(k, m) {
        if (passNew(k)) kicks = 0;
        // three kicks: the speed pulses, a burst of bubbles on each
        const s = ease(k);
        const p = s - Math.sin(s * Math.PI * 6) / (Math.PI * 6);
        m.roll(waitX + (landX - waitX) * p);
        trail(m, 0.9);
        const kick = Math.floor(s * 3 + 0.1);
        if (kick > kicks - 1 && kicks < 3) {
          kicks++;
          fizz(m, m.x - MR, m.y, 12);
          m.squash(0.82);
          whoosh(0.07, 0.22, 0, 900, 2600);
          note(76 + kicks * 3, { instrument: 'glock', level: 0.07 });
        }
      }
    },
    fail: {
      dur: 1800,
      step(k, m, t) {
        if (failNew(k)) stalled = swept = false;
        const deep = cx0 + 60;
        if (k < 0.3) m.roll(waitX + (deep - waitX) * ease(k / 0.3));
        else if (k < 0.45) {
          // struggling in place
          if (!stalled) {
            stalled = true;
            m.fx.burst('sweat', 3, m.x, m.y - 30, { speed: 0.5 });
          }
          m.roll(deep + Math.sin(k * 120) * 3);
        } else {
          if (!swept) {
            swept = true;
            back.surgeAt = fore.surgeAt = t;
            whoosh(0.14, 0.7, 0, 2200, 300);
            m.fx.text('WHOA', m.x, m.y - 50, '#bfefff', 12);
          }
          const s = span(k, 0.45, 1);
          const x = deep + (waitX - deep) * easeInOut(s);
          const rest = m.restY(x) ?? lane;
          m.place(x, rest - Math.sin(s * Math.PI * 3) * 18 * (1 - s));
          m.spin(-0.3 * (1 - s));
          trail(m);
        }
      }
    }
  };
});

// ---- weeds: a kelp forest gate that sways shut and open ------------------
interface Strand {
  x: number;
  len: number;
  ph: number;
}
const KELP_FRONT = { stem: '#3a9a46', leaf: '#5cc45a', hi: '#a8ee8a', float: '#d8e05a' };
const KELP_BACK = { stem: '#2a6e3a', leaf: '#3c8e48', hi: '#5fb06a', float: '#a8b048' };
function strandPoints(s: Strand, base: number, lean: number, t: number) {
  const seg = 6;
  const n = Math.max(4, Math.round(s.len / seg));
  const pts: [number, number][] = [];
  let px = s.x;
  let py = base;
  for (let i = 0; i <= n; i++) {
    pts.push([px, py]);
    const f = i / n;
    // laid over toward the right when open, upright when shut
    const a = lean * 2 * Math.pow(f, 0.6) + Math.sin(t / 520 + s.ph + i * 0.45) * 0.16 * f;
    px += Math.sin(a) * seg;
    py -= Math.cos(a) * seg;
  }
  return pts;
}
function drawStrand(g: CanvasRenderingContext2D, pts: [number, number][], cam: number, pal: typeof KELP_FRONT) {
  for (const pass of [0, 1]) {
    for (let i = 0; i < pts.length; i++) {
      const x = r3(pts[i][0] - cam);
      const y = r3(pts[i][1]);
      const w = i < pts.length - 4 ? 2 : 1;
      g.fillStyle = pass ? pal.stem : INK;
      if (pass) g.fillRect(x, y - U, w * U, U * 3);
      else g.fillRect(x - U, y - U * 2, (w + 2) * U, U * 5);
      if (i > 2 && i % 4 === 0) {
        const side = i % 8 === 0 ? 1 : -1;
        const lx = x + side * 10;
        if (pass) {
          pxEllipse(g, lx, y, 10, 4, pal.leaf);
          g.fillStyle = pal.hi;
          g.fillRect(r3(lx - 3), y - U, U * 2, U);
        } else pxEllipse(g, lx, y, 13, 7, INK);
      }
    }
    // a float bladder at the tip
    const [tx, ty] = pts[pts.length - 1];
    if (pass) pxEllipse(g, tx - cam, ty, 5, 5, pal.float);
    else pxEllipse(g, tx - cam, ty, 8, 8, INK);
  }
}
class Kelp implements Entity {
  x: number;
  y = 0;
  strands: Strand[];
  front: boolean;
  pal: typeof KELP_FRONT;
  owner: KelpGate;
  constructor(owner: KelpGate, strands: Strand[], front: boolean) {
    this.owner = owner;
    this.strands = strands;
    this.front = front;
    this.pal = front ? KELP_FRONT : KELP_BACK;
    this.x = strands[0]?.x ?? 0;
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number, run: RunView) {
    if (this.x - cam > 1100 || this.x - cam < -500) return;
    for (const s of this.strands) {
      const base = (run.groundAt(s.x) ?? BASE) + U;
      // back strands lag a little behind the gate, so the forest has depth
      const lean = this.front ? this.owner.lean : this.owner.lean * 0.7 + 0.1;
      drawStrand(g, strandPoints(s, base, lean, t), cam, this.pal);
    }
    if (this.front && t < this.owner.tangleUntil) this.drawTangle(g, cam, t, run);
  }
  // loops of kelp wrapped round the marble
  drawTangle(g: CanvasRenderingContext2D, cam: number, t: number, run: RunView) {
    const cx = run.marbleX - cam;
    const cy = run.marbleY;
    for (const pass of [0, 1]) {
      for (let j = 0; j < 3; j++) {
        const ry = MR * (0.45 + j * 0.22);
        const tilt = (j - 1) * 0.5 + Math.sin(t / 90 + j) * 0.08;
        for (let a = 0.3; a < Math.PI - 0.3; a += 0.12) {
          const px = Math.cos(a) * (MR + 5);
          const py = Math.sin(a) * ry;
          const x = r3(cx + px * Math.cos(tilt) - py * Math.sin(tilt));
          const y = r3(cy + px * Math.sin(tilt) + py * Math.cos(tilt) - ry * 0.2 + j * 6);
          g.fillStyle = pass ? KELP_FRONT.stem : INK;
          if (pass) g.fillRect(x, y, U * 2, U);
          else g.fillRect(x - U, y - U, U * 4, U * 3);
        }
      }
    }
  }
}
class KelpGate implements Entity {
  x: number;
  y = 0;
  lean = 0.5;
  force: number | null = null; // the move's say on how open it is
  tangleUntil = 0;
  constructor(x: number) {
    this.x = x;
  }
  update(t: number) {
    const idle = 0.5 + Math.sin(t / 1100) * 0.45;
    const target = this.force ?? idle;
    this.lean += (target - this.lean) * (this.force !== null ? 0.2 : 0.06);
  }
  draw() {}
}
registerObstacle('weeds', (b) => {
  const x0 = b.x;
  const waitX = x0 - 60;
  const gx0 = x0 + 70;
  const gx1 = gx0 + 150;
  b.add(gx1 - x0 + 190, 'flat');
  dress(b, x0 - 40, b.x, 4, [gx0, gx0 + 50, gx0 + 100, gx1]);
  const gate = b.entity(new KelpGate(gx0));
  const back: Strand[] = [];
  const fore: Strand[] = [];
  for (let i = 0; i < 4; i++) back.push({ x: r3(gx0 + 20 + i * 38 + b.rand() * 9), len: 120 + b.rand() * 30, ph: b.rand() * 6 });
  for (let i = 0; i < 5; i++) fore.push({ x: r3(gx0 + i * 37), len: 150 + b.rand() * 24, ph: b.rand() * 6 });
  b.entity(new Kelp(gate, back, false));
  b.entity(new Kelp(gate, fore, true));
  const landX = gx1 + 150;
  const passNew = starts();
  const failNew = starts();
  let parted = false;
  let caught = false;
  let freed = false;
  return {
    kind: 'weeds',
    label: 'the kelp',
    waitX,
    pass: {
      dur: 1500,
      step(k, m) {
        if (passNew(k)) parted = false;
        // the kelp sways wide open, the marble slips over it, it sways back
        gate.force = k < 0.8 ? 1 : k < 1 ? 0.5 : null;
        if (!parted) {
          parted = true;
          whoosh(0.06, 0.4, 0, 500, 1400);
        }
        if (k < 0.2) {
          m.roll(waitX + 10 * ease(k / 0.2));
          return;
        }
        const s = span(k, 0.2, 1);
        const p = m.arc(waitX + 10, landX, 62, easeInOut(s));
        m.place(p.x, p.y);
        trail(m);
        if (Math.random() < 0.15) m.fx.add({ kind: 'leaf', x: m.x, y: m.y + MR, vx: -1, vy: 0.5, color: '#5cc45a', life: 0.8 });
      }
    },
    fail: {
      dur: 1900,
      step(k, m, t) {
        if (failNew(k)) caught = freed = false;
        // it springs upright just as the marble arrives
        gate.force = k < 1 ? 0 : null;
        const stuckX = gx0 + 24;
        if (k < 0.28) m.roll(waitX + (stuckX - waitX) * ease(k / 0.28));
        else if (k < 0.66) {
          if (!caught) {
            caught = true;
            gate.tangleUntil = t + 700;
            m.fx.text('STUCK', m.x, m.y - 54, '#a8ee8a', 12);
            note(55, { instrument: 'marimba', level: 0.12 });
            note(54, { at: 0.12, instrument: 'marimba', level: 0.1 });
          }
          // wriggling
          m.roll(stuckX + Math.sin(k * 90) * 6);
          m.spin(Math.sin(k * 70) * 0.25);
          if (Math.random() < 0.2) m.squash(0.85);
        } else {
          if (!freed) {
            freed = true;
            m.fx.burst('leaf', 8, m.x, m.y, { color: '#5cc45a', speed: 0.6 });
            note(67, { instrument: 'glock', level: 0.06 });
          }
          const p = m.arc(stuckX, waitX, 22, ease(span(k, 0.66, 1)));
          m.place(p.x, p.y);
        }
      }
    }
  };
});

// ---- bubbles: ride a rising column up and over a reef wall ---------------
const BUB = [2, 3, 5].map((r) =>
  makeSprite(r * 2 + 1, r * 2 + 1, (put) => {
    for (let a = 0; a < 24; a++) {
      put(r + Math.round(Math.cos((a / 24) * Math.PI * 2) * r), r + Math.round(Math.sin((a / 24) * Math.PI * 2) * r), '#d6f6ff');
    }
    put(r - Math.ceil(r / 2), r - Math.ceil(r / 2), '#ffffff');
    if (r > 2) put(r - Math.ceil(r / 2) + 1, r - Math.ceil(r / 2), '#ffffff');
  }, { outline: false })
);
const VENT = makeSprite(22, 10, (put) => {
  disc(put, 11, 8, 11, 7.5, '#7d7a8c', '#5a5768', '#a9a6b8');
  rect(put, 0, 9, 22, 2, null);
  disc(put, 11, 3, 4, 1.6, '#2a2236');
  rect(put, 8, 2, 6, 1, '#4a4558');
  put(4, 6, '#ff8fa3');
  put(17, 5, '#ff8fa3');
});
class BubbleColumn implements Entity {
  x: number;
  y: number;
  top: number;
  offFrom = 0;
  offTo = 0;
  boostAt = -1e9;
  constructor(x: number, base: number, top: number) {
    this.x = x;
    this.y = base;
    this.top = top;
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number) {
    const sx = this.x - cam;
    if (sx < -80 || sx > 1040) return;
    const rise = 1700;
    const n = 26;
    const boost = t - this.boostAt < 900;
    for (let i = 0; i < n; i++) {
      const ph = (t / rise + i / n + (i % 3) * 0.013) % 1;
      // bubbles born while the vent sputtered never appear
      const born = t - ph * rise;
      if (born > this.offFrom && born < this.offTo) continue;
      const y = this.y - 12 - ph * (this.y - this.top);
      const x = sx + Math.sin(ph * 14 + i * 1.7) * (6 + ph * 8) + ((i % 3) - 1) * 9;
      const s = BUB[(i * 7) % 3];
      const a = ph > 0.85 ? (1 - ph) / 0.15 : 1;
      drawSprite(g, s, x - s.width * 1.5, y, U, { alpha: a * (boost ? 1 : 0.85) });
    }
    drawStanding(g, VENT, sx, this.y);
  }
}
registerObstacle('bubbles', (b) => {
  const x0 = b.x;
  const waitX = x0 - 40;
  b.add(150, 'flat');
  const wallX = b.x;
  const ventX = wallX - 60;
  const lift = 99;
  b.y -= lift;
  b.add(186, 'raised', 0, 'coral');
  const reefY = b.y;
  b.y += lift;
  const reefEnd = b.x;
  b.add(170, 'flat');
  const landX = reefEnd + 90;
  dress(b, x0 - 60, ventX - 30, 2);
  dress(b, wallX + 15, reefEnd - 15, 4);
  dress(b, reefEnd + 30, b.x, 2);
  const topY = laneAt(reefY, ventX) - 36;
  const column = b.entity(new BubbleColumn(ventX, b.BASE_Y, 40));
  const passNew = starts();
  const failNew = starts();
  let notes = 0;
  let sputtered = false;
  let bonked = false;
  return {
    kind: 'bubbles',
    label: 'the bubble column',
    waitX,
    pass: {
      dur: 1900,
      step(k, m, t) {
        if (passNew(k)) notes = 0;
        const lane0 = m.restY(ventX) ?? laneAt(b.BASE_Y, ventX);
        if (k < 0.2) m.roll(waitX + (ventX - waitX) * ease(k / 0.2));
        else if (k < 0.6) {
          // riding the column up, wobbling with the bubbles
          const s = span(k, 0.2, 0.6);
          column.boostAt = t;
          m.place(ventX + Math.sin(s * 14) * 6, lane0 + (topY - lane0) * easeInOut(s));
          if (Math.random() < 0.5) m.fx.add({ kind: 'bubble', x: ventX + (Math.random() - 0.5) * 50, y: m.y + MR, vy: -2.4, life: 0.9 });
          const want = Math.floor(s * 4);
          while (notes <= want && notes < 4) {
            note([72, 76, 79, 84][notes], { instrument: 'glock', level: 0.07 });
            notes++;
          }
        } else {
          const s = span(k, 0.6, 1);
          const p = hop(ventX, topY, landX, m.restY(landX) ?? laneAt(b.BASE_Y, landX), 24, easeInOut(s));
          m.place(p.x, p.y);
          m.spin(0.06);
          trail(m);
        }
      }
    },
    fail: {
      dur: 1500,
      step(k, m, t) {
        if (failNew(k)) sputtered = bonked = false;
        if (!sputtered) {
          // the vent hiccups: the column breaks just as the marble arrives
          sputtered = true;
          column.offFrom = t - 200;
          column.offTo = t + 1100;
          m.fx.burst('puff', 4, ventX, b.BASE_Y - 20, { speed: 0.4 });
          note(60, { instrument: 'marimba', level: 0.1 });
        }
        const hitX = wallX - MR - 6;
        if (k < 0.45) m.roll(waitX + (hitX - waitX) * easeIn(k / 0.45));
        else {
          if (!bonked) {
            bonked = true;
            m.bump('BONK');
            thump(0.5);
            m.fx.burst('frag', 5, wallX, m.y, { color: '#ff8fa3', speed: 0.5 });
          }
          const p = m.arc(hitX, waitX, 26, ease(span(k, 0.45, 1)));
          m.place(p.x, p.y);
        }
      }
    }
  };
});

// ---- clam: a giant clam snaps at whatever swims over it -------------------
// The top shell turns about the hinge (right end): 0 is shut, ~135° leans it
// back past upright so the mouth gapes open. Snapping shut sweeps it up
// through the swim lane, which is what stops a marble that comes too early.
const SHELL_L = 34;
const SHELL_D = 11;
const ANGLES = Array.from({ length: 11 }, (_, i) => (i * 15 * Math.PI) / 180);
function shellPoints(a: number, step = 1) {
  const pts: [number, number][] = [];
  for (let s = 0; s <= SHELL_L; s += step) pts.push([-s, -SHELL_D * Math.sin((Math.PI * s) / SHELL_L)]);
  const rot = (p: [number, number]): [number, number] => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
  return pts.map(rot);
}
let minX = 0;
let maxX = 0;
let minY = 0;
let maxY = 0;
for (const a of ANGLES) {
  for (const [x, y] of shellPoints(a)) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
}
const HX = Math.ceil(-minX) + 1;
const HY = Math.ceil(-minY) + 1;
const SHELL_W = HX + Math.ceil(maxX) + 2;
const SHELL_H = HY + Math.ceil(maxY) + 2;
const TOP_SHELL = ANGLES.map((a) =>
  makeSprite(SHELL_W, SHELL_H, (put) => {
    const pts = shellPoints(a).map(([x, y]) => [HX + x, HY + y] as [number, number]);
    const inside = a > Math.PI / 2;
    poly(put, [...pts, [HX, HY]], inside ? '#ffd8e8' : '#b9a6e6');
    const dome = shellPoints(a, 2);
    if (inside) {
      // nacre with a pearly sheen; the rim stays shell coloured
      for (const [x, y] of shellPoints(a, 1)) put(HX + x, HY + y, '#b9a6e6');
      for (const [x, y] of dome) line(put, HX + x * 0.55, HY + y * 0.55, HX + x * 0.62, HY + y * 0.62, '#fff2f8');
    } else {
      // ribs fanning from the hinge, a scalloped lip
      for (let j = 1; j < 6; j++) {
        const [x, y] = dome[Math.round((j / 6) * (dome.length - 1))];
        line(put, HX, HY, HX + x * 0.92, HY + y * 0.92, '#8f78c8');
      }
      dome.forEach(([x, y], i) => put(HX + x, HY + y, i % 2 ? '#efe6ff' : '#d8ccf6'));
    }
    rect(put, HX - 1, HY - 1, 3, 3, '#6a58a0');
  })
);
const BOTTOM_SHELL = makeSprite(SHELL_L + 4, 15, (put) => {
  const hx = SHELL_L + 1;
  const hy = 3;
  const pts: [number, number][] = [];
  for (let s = 0; s <= SHELL_L; s++) pts.push([hx - s, hy + 10 * Math.sin((Math.PI * s) / SHELL_L)]);
  poly(put, [...pts, [hx, hy]], '#9d88d4');
  for (let j = 1; j < 6; j++) line(put, hx, hy, hx - (SHELL_L * j) / 6, hy + 9 * Math.sin((Math.PI * j) / 6), '#7c66b8');
  // the bright, frilly giant-clam mantle along the lip
  for (let x = 1; x < SHELL_L; x++) {
    put(x + 1, hy - 1 + (x % 3 === 0 ? -1 : 0), '#3fb6d8');
    put(x + 1, hy, x % 4 === 1 ? '#a3f0ff' : '#2a8fc0');
    put(x + 1, hy + 1, '#7c4fc8');
  }
});
const PEARL = makeSprite(7, 7, (put) => {
  disc(put, 3.5, 3.5, 3.5, 3.5, '#fff6fb', '#e9cfe6', '#ffffff');
  put(2, 2, '#ffffff');
});
class GiantClam implements Entity {
  x: number; // the hinge
  y = 0;
  snapAt = -1e9;
  sparkleAt = -1e9;
  constructor(x: number) {
    this.x = x;
  }
  angle(t: number) {
    const open = (135 + Math.sin(t / 600) * 8) * (Math.PI / 180);
    const d = t - this.snapAt;
    if (d < 0 || d > 1800) return open;
    if (d < 140) return open * (1 - easeIn(d / 140));
    if (d < 900) return 0;
    return open * ease((d - 900) / 900);
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number, run: RunView) {
    const sx = this.x - cam;
    if (sx < -200 || sx > 1200) return;
    const ground = run.groundAt(this.x) ?? BASE;
    const hy = ground - 30;
    const a = this.angle(t);
    drawSprite(g, BOTTOM_SHELL, sx - (SHELL_L + 2) * U, hy - 4 * U);
    if (a > 0.3) {
      const px = sx - (SHELL_L / 2) * U;
      const glow = t - this.sparkleAt < 700;
      if (glow) pxEllipse(g, px, hy - 6, 16, 12, 'rgba(255,240,250,.45)');
      drawSprite(g, PEARL, px - 4 * U, hy - 6 * U);
      if (Math.floor(t / 300) % 7 === 0 || glow) {
        g.fillStyle = '#ffffff';
        g.fillRect(r3(px - U), r3(hy - 6 * U), U, U);
      }
    }
    const i = Math.max(0, Math.min(ANGLES.length - 1, Math.round(a / (Math.PI / 12))));
    drawSprite(g, TOP_SHELL[i], sx - (HX + 1) * U, hy - (HY + 1) * U);
  }
}
registerObstacle('clam', (b) => {
  const x0 = b.x;
  const hinge = x0 + 210;
  const front = hinge - SHELL_L * U;
  const waitX = x0 - 40;
  b.add(430, 'flat');
  dress(b, x0 - 40, front - 30, 2);
  dress(b, hinge + 40, b.x, 3);
  const clam = b.entity(new GiantClam(hinge));
  const landX = hinge + 200;
  const passNew = starts();
  const failNew = starts();
  let sparkled = false;
  let snapped = false;
  let hit = false;
  const snap = (m: MarbleCtl, t: number, missed: boolean) => {
    clam.snapAt = t;
    thump(0.7, 0.12);
    note(45, { at: 0.12, instrument: 'marimba', level: 0.16 });
    m.fx.shake(t + 140, 4, 180);
    m.fx.burst('dust', 8, front, b.BASE_Y - 6);
    m.fx.text(missed ? 'chomp?' : 'CHOMP', front + 40, b.BASE_Y - 150, '#ffd8e8', 12);
  };
  return {
    kind: 'clam',
    label: 'the giant clam',
    waitX,
    pass: {
      dur: 1250,
      step(k, m, t) {
        if (passNew(k)) sparkled = snapped = false;
        // zips over while it gapes; it snaps shut too late, behind the marble
        const p = m.arc(waitX, landX, 92, easeInOut(k));
        m.place(p.x, p.y);
        trail(m, 0.8);
        if (!sparkled && m.x > hinge - SHELL_L * U * 0.7) {
          sparkled = true;
          clam.sparkleAt = t;
          m.fx.burst('sparkle', 8, hinge - (SHELL_L / 2) * U, b.BASE_Y - 50, { speed: 0.6 });
          note(88, { instrument: 'bell', level: 0.1 });
          note(95, { at: 0.07, instrument: 'glock', level: 0.06 });
        }
        if (!snapped && k > 0.8) {
          snapped = true;
          snap(m, t, true);
        }
      }
    },
    fail: {
      dur: 1500,
      step(k, m, t) {
        if (failNew(k)) snapped = hit = false;
        const stopX = front + 6 - MR;
        if (k < 0.34) m.roll(waitX + (stopX - waitX) * ease(k / 0.34));
        if (!snapped && k > 0.25) {
          snapped = true;
          snap(m, t, false);
        }
        if (k >= 0.34) {
          if (!hit) {
            hit = true;
            m.bump('YIKES');
          }
          const p = m.arc(stopX, waitX, 34, ease(span(k, 0.34, 1)));
          m.place(p.x, p.y);
          m.spin(-0.1);
        }
      }
    }
  };
});

// ---- urchin: spiky urchins on the seabed and a ceiling, a narrow gap -----
function urchinSprite(f: number, hanging: boolean) {
  return makeSprite(21, 18, (put) => {
    const P: Put = (x, y, c) => put(x, hanging ? 17 - y : y, c);
    for (let i = 0; i < 13; i++) {
      const a = Math.PI + (i / 12) * Math.PI;
      const len = (i + f) % 2 ? 9 : 7;
      const x1 = 10 + Math.cos(a) * len;
      const y1 = 12 + Math.sin(a) * len;
      line(P, 10 + Math.cos(a) * 4, 12 + Math.sin(a) * 4, x1, y1, '#4a3478');
      P(Math.round(x1), Math.round(y1), '#d9c8ff');
    }
    for (let y = 0; y < 18; y++) {
      for (let x = 0; x < 21; x++) {
        const dx = (x + 0.5 - 10.5) / 7;
        const dy = (y + 0.5 - 13) / 5.4;
        if (dx * dx + dy * dy > 1 || y > 17) continue;
        let c = '#3a2a5a';
        if (dx * 0.55 + dy * 0.85 > 0.5) c = '#241838';
        if (Math.hypot(dx + 0.38, dy + 0.45) < 0.26) c = '#6a55a0';
        P(x, y, c);
      }
    }
    // small, worried eyes
    P(7, 13, '#ffffff');
    P(13, 13, '#ffffff');
    P(7, 14, INK);
    P(13, 14, INK);
  });
}
const URCHIN = [0, 1].map((f) => urchinSprite(f, false));
const URCHIN_HANG = [0, 1].map((f) => urchinSprite(f, true));
const CEILING = makeSprite(78, 36, (put) => {
  rect(put, 0, 0, 78, 24, '#5d5a6e');
  for (let x = 0; x < 78; x++) {
    const d = 24 + Math.round(Math.abs(Math.sin(x / 5.3)) * 6 + Math.sin(x / 2.1) * 2 + (x % 11 === 0 ? 4 : 0));
    for (let y = 24; y < Math.min(36, d); y++) put(x, y, y > d - 3 ? '#433f52' : '#5d5a6e');
    if ((x * 7) % 13 === 0) put(x, (x * 3) % 20 + 2, '#7a7690');
    if ((x * 5) % 17 === 0) put(x, (x * 7) % 18 + 3, '#433f52');
  }
  for (let x = 4; x < 78; x += 9) rect(put, x, 20 + (x % 3), 2, 2, '#ff8fa3');
  for (let x = 8; x < 78; x += 13) rect(put, x, 22, 1, 3, '#5fb06a');
});
class Urchins implements Entity {
  x: number;
  y = 0;
  floor: { x: number; y: number }[];
  hang: { x: number; y: number }[];
  rockX: number;
  rockY: number;
  bristleAt = -1e9;
  constructor(floor: { x: number; y: number }[], hang: { x: number; y: number }[], rockX: number, rockY: number) {
    this.floor = floor;
    this.hang = hang;
    this.x = rockX;
    this.rockX = rockX;
    this.rockY = rockY;
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number, run: RunView) {
    const rx = this.rockX - cam;
    if (rx > 1100 || rx < -400) return;
    // the overhang reaches up past the top of the screen
    g.fillStyle = INK;
    g.fillRect(r3(rx) - U, -60, CEILING.width * U - U * 0, this.rockY + 60);
    g.fillStyle = '#5d5a6e';
    g.fillRect(r3(rx), -60, CEILING.width * U - U * 2, this.rockY + 60);
    drawSprite(g, CEILING, rx, this.rockY);
    const fast = t - this.bristleAt < 1500;
    const fr = Math.floor(t / (fast ? 90 : 400));
    this.hang.forEach((u, i) => {
      const s = URCHIN_HANG[(fr + i) % 2];
      drawSprite(g, s, u.x - cam - (s.width * U) / 2, u.y);
    });
    this.floor.forEach((u, i) => {
      const s = URCHIN[(fr + i + 1) % 2];
      const sx = u.x - cam;
      const bed = run.groundAt(u.x) ?? BASE;
      if (u.y < bed - U) {
        g.fillStyle = INK;
        g.fillRect(r3(sx - 21), r3(u.y - U * 2), 42, bed - u.y + U * 3);
        g.fillStyle = '#6f6b80';
        g.fillRect(r3(sx - 18), r3(u.y - U), 36, bed - u.y + U);
        g.fillStyle = '#9a96ac';
        g.fillRect(r3(sx - 18), r3(u.y - U), 36, U);
      }
      g.save();
      g.beginPath();
      g.rect(sx - 60, 0, 120, Math.min(u.y, bed) + U);
      g.clip();
      drawStanding(g, s, sx, u.y);
      g.restore();
    });
  }
}
registerObstacle('urchin', (b) => {
  const x0 = b.x;
  const waitX = x0 - 70;
  const ux = x0 + 100;
  b.add(420, 'flat');
  const urH = 18 * U;
  // tips sit a hair outside the marble: a narrow, honest gap
  // floor urchins sit on a rock stub where the lane runs high, or half in
  // the sand where it runs low, so the gap is the same everywhere
  const floor = [0, 80, 160].map((d) => {
    const x = ux + d;
    return { x, y: laneAt(b.y, x) + MR + 9 + urH };
  });
  const hang = [40, 120].map((d) => {
    const x = ux + d;
    return { x, y: laneAt(b.y, x) - MR - 12 - urH };
  });
  const rockY = Math.max(...hang.map((h) => h.y)) - 30 * U + 3 * U;
  const rockX = ux - 40;
  dress(b, x0 - 30, ux - 40, 2);
  dress(b, ux + 210, b.x, 3);
  const urchins = b.entity(new Urchins(floor, hang, rockX, rockY));
  const landX = ux + 270;
  const passNew = starts();
  const failNew = starts();
  let tick = 0;
  let pricked = false;
  return {
    kind: 'urchin',
    label: 'the urchins',
    waitX,
    pass: {
      dur: 2000,
      step(k, m, t) {
        if (passNew(k)) tick = 0;
        // slow and careful through the middle, quick at both ends
        const s = k < 0.5 ? 0.5 * Math.pow(k * 2, 0.7) : 1 - 0.5 * Math.pow((1 - k) * 2, 0.7);
        const x = waitX + (landX - waitX) * s;
        m.place(x, m.restY(x) ?? laneAt(b.BASE_Y, x));
        if (x > ux - 60 && x < ux + 200) {
          urchins.bristleAt = t;
          m.squash(0.94);
          const n = Math.floor(k * 10);
          if (n > tick) {
            tick = n;
            note(83 + (n % 2) * 2, { instrument: 'glock', level: 0.04 });
          }
        }
        if (k >= 1) m.fx.text('PHEW', landX, (m.restY(landX) ?? 210) - 50, '#bfefff', 10);
      }
    },
    fail: {
      dur: 1400,
      step(k, m, t) {
        if (failNew(k)) pricked = false;
        // drifts low as it squeezes in and meets the first urchin
        const hitX = ux - 40;
        if (k < 0.4) {
          const s = ease(k / 0.4);
          const x = waitX + (hitX - waitX) * s;
          m.place(x, (m.restY(x) ?? 210) + 20 * s);
        } else {
          if (!pricked) {
            pricked = true;
            urchins.bristleAt = t;
            m.bump('OUCH');
            m.fx.burst('spark', 8, ux - 10, b.BASE_Y - 50, { color: '#d9c8ff', speed: 0.6 });
            note(91, { instrument: 'glock', level: 0.08 });
          }
          const y0 = (m.restY(hitX) ?? 210) + 20;
          const p = hop(hitX, y0, waitX, m.restY(waitX) ?? 210, 30, ease(span(k, 0.4, 1)));
          m.place(p.x, p.y);
        }
      }
    }
  };
});

// ---- eel: lunges out of a cave in a rock --------------------------------
const EEL_ROCK = makeSprite(48, 18, (put) => {
  disc(put, 24, 18, 24, 18, '#6f6b80', '#4f4b60', '#9a96ac');
  rect(put, 0, 18, 48, 1, null);
  for (const [x, y] of [[14, 6], [30, 4], [38, 10], [22, 12]]) put(x, y, '#4f4b60');
  for (const [x, y] of [[20, 3], [33, 9]]) put(x, y, '#9a96ac');
  // the cave mouth on its left shoulder
  disc(put, 9, 11, 5, 4.5, '#1a1426');
  disc(put, 9, 12, 3.5, 3, '#0c0812');
  rect(put, 26, 0, 1, 2, '#5fb06a');
  rect(put, 28, 1, 1, 2, '#5fb06a');
});
const EEL_HEAD = [0, 1].map((open) =>
  makeSprite(18, 13, (put) => {
    disc(put, 10, 6, 8, 5.5, '#5fae3c', '#3f7e26', '#9ad870');
    rect(put, 12, 3, 6, 7, '#5fae3c');
    rect(put, 12, 9, 6, 1, '#3f7e26');
    if (open) {
      poly(put, [[0, 5], [8, 7], [1, 12]], '#c23a52');
      for (const x of [1, 3, 5]) put(x, 6, '#ffffff');
      put(2, 11, '#ffffff');
      disc(put, 6, 11, 4, 1.6, '#d8e87a');
    } else {
      line(put, 1, 7, 8, 8, INK);
      disc(put, 7, 10, 5, 1.6, '#d8e87a');
    }
    disc(put, 7, 3.5, 2, 2, '#fff36a');
    rect(put, 6, 3, 1, 2, INK);
    for (const [x, y] of [[12, 4], [15, 6], [13, 8]]) put(x, y, '#2f6e22');
  })
);
class Eel implements Entity {
  x: number; // the cave mouth
  y = 0;
  reach: { x: number; y: number };
  lungeAt = -1e9;
  front = true;
  constructor(mouthX: number, reach: { x: number; y: number }) {
    this.x = mouthX;
    this.reach = reach;
  }
  out(t: number) {
    const d = t - this.lungeAt;
    const peek = 0.1 + Math.max(0, Math.sin(t / 900)) * 0.08;
    if (d < 0 || d > 820) return peek;
    if (d < 130) return peek + (1 - peek) * ease(d / 130);
    if (d < 420) return 1;
    return 1 - (1 - peek) * easeInOut((d - 420) / 400);
  }
  head(t: number, ground: number) {
    const mx = this.x;
    const my = ground - 21;
    const e = this.out(t);
    // an arcing path: out of the cave and up into the lane
    const cx = mx - 20;
    const cy = this.reach.y - 30;
    const q = (a: number, b2: number, c: number) => (1 - e) * (1 - e) * a + 2 * (1 - e) * e * b2 + e * e * c;
    return { x: q(mx, cx, this.reach.x), y: q(my, cy, this.reach.y), e, mx, my };
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number, run: RunView) {
    const ground = run.groundAt(this.x) ?? BASE;
    const sx = this.x - cam;
    if (sx < -300 || sx > 1200) return;
    const h = this.head(t, ground);
    // body: a chain from the cave to the head, wiggling
    const n = 14;
    for (const pass of [0, 1]) {
      for (let i = 0; i <= n; i++) {
        const f = i / n;
        const bx = h.mx + (h.x + 30 - h.mx) * f;
        const by = h.my + (h.y - h.my) * f - Math.sin(f * Math.PI) * 30 * h.e;
        const wob = Math.sin(f * 9 - t / 70) * 5 * h.e;
        const r = 12 - f * 3;
        if (pass) {
          pxEllipse(g, bx - cam, by + wob, r, r, i % 3 === 0 ? '#4f9a30' : '#5fae3c');
          g.fillStyle = '#d8e87a';
          g.fillRect(r3(bx - cam - U), r3(by + wob + r - U * 2), U * 2, U);
        } else pxEllipse(g, bx - cam, by + wob, r + 3, r + 3, INK);
      }
    }
    drawStanding(g, EEL_ROCK, sx + 15 * U, ground);
    const open = t - this.lungeAt < 500 ? 1 : 0;
    const s = EEL_HEAD[open];
    drawSprite(g, s, h.x - cam - 3 * U, h.y - (s.height * U) / 2);
  }
}
registerObstacle('eel', (b) => {
  const x0 = b.x;
  const mouthX = x0 + 220;
  const waitX = x0 - 20;
  b.add(460, 'flat');
  dress(b, x0 - 30, mouthX - 120, 3);
  dress(b, mouthX + 140, b.x, 2);
  const lane = laneAt(b.y, mouthX - 70);
  const eel = b.entity(new Eel(mouthX, { x: mouthX - 90, y: lane - 6 }));
  const landX = mouthX + 210;
  const passNew = starts();
  const failNew = starts();
  let lunged = false;
  let hit = false;
  const lunge = (m: MarbleCtl, t: number) => {
    eel.lungeAt = t;
    whoosh(0.1, 0.2, 0, 2400, 700);
    note(50, { at: 0.08, instrument: 'marimba', level: 0.14 });
    m.fx.burst('bubble', 10, mouthX - 40, lane + 30, { speed: 0.5, up: 1 });
  };
  return {
    kind: 'eel',
    label: 'the eel',
    waitX,
    pass: {
      dur: 1700,
      step(k, m, t) {
        if (passNew(k)) lunged = false;
        // edge in, let it lunge at nothing, then dart past as it pulls back
        if (k < 0.18) m.roll(waitX + 30 * ease(k / 0.18));
        if (!lunged && k > 0.1) {
          lunged = true;
          lunge(m, t);
          m.fx.text('SNAP', mouthX - 80, lane - 60, '#c9f59a', 12);
        }
        if (k >= 0.18 && k < 0.45) {
          m.roll(waitX + 30 - Math.sin(span(k, 0.18, 0.45) * Math.PI) * 14);
          if (k < 0.24) m.squash(0.86);
        }
        if (k >= 0.45) {
          const s = span(k, 0.45, 1);
          const from = waitX + 30;
          const p = hop(from, m.restY(from) ?? lane, landX, m.restY(landX) ?? lane, 34, ease(s));
          m.place(p.x, p.y);
          trail(m, 0.95);
          m.spin(0.1);
        }
      }
    },
    fail: {
      dur: 1400,
      step(k, m, t) {
        if (failNew(k)) lunged = hit = false;
        // darts too early, straight into the lunge
        const hitX = mouthX - 90 - 16 * U - MR + 30;
        if (k < 0.3) m.roll(waitX + (hitX - waitX) * ease(k / 0.3));
        if (!lunged && k > 0.16) {
          lunged = true;
          lunge(m, t);
        }
        if (k >= 0.3) {
          if (!hit) {
            hit = true;
            m.bump('OUCH');
          }
          const p = m.arc(hitX, waitX, 30, ease(span(k, 0.3, 1)));
          m.place(p.x, p.y);
          m.spin(-0.12);
        }
      }
    }
  };
});
