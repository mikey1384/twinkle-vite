import { makeSprite, rect, disc, line, poly, eyesX, drawSprite, drawStanding, pxEllipse, Sprite, U, H, INK, r3, hash2 } from '../../pixel';
import { MR } from '../../marble';
import { thump, note, whoosh } from '../../audio';
import type { Builder, Entity, MarbleCtl, RunView } from '../types';
import { registerObstacle, ease, easeIn, easeInOut, span } from './registry';

// Hazards for rolling levels (roll, slide, lowgrav), in the spirit of SMB3,
// Super Mario World and Yoshi's Island: boulder, cannon, seesaw, vine,
// quicksand, geyser, crusher (thwomp) and spikes. Each one lays its own
// ground, adds animated pixel entities, and scripts a pass and a fail.

// ---- shared helpers --------------------------------------------------------

// A move can begin between frames, so its first step rarely sees k === 0.
// A k smaller than the last one means a new run: one-shot cues reset then.
function cues() {
  let last = 1;
  const done = new Set<string>();
  return {
    begin(k: number) {
      if (k < last || k === 0) done.clear();
      last = k;
    },
    once(key: string) {
      if (done.has(key)) return false;
      done.add(key);
      return true;
    }
  };
}
// a parabola between two free points (m.arc only knows resting heights)
function hop(x0: number, y0: number, x1: number, y1: number, h: number, k: number) {
  return { x: x0 + (x1 - x0) * k, y: y0 + (y1 - y0) * k - h * 4 * k * (1 - k) };
}
const restOf = (m: MarbleCtl, x: number) => m.restY(x) ?? 309 - MR;
// floaty moon levels jump a little higher
const jumpScale = (b: Builder) => (b.mode === 'lowgrav' ? 1.2 : 1);
const near = (run: RunView, x: number, d = 560) => Math.abs(run.marbleX - x) < d;
const clamp01 = (k: number) => Math.max(0, Math.min(1, k));
const easeOutBack = (k: number) => 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2);
function segDist(px: number, py: number, [ax, ay, bx, by]: number[]) {
  const dx = bx - ax;
  const dy = by - ay;
  const q = clamp01(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy));
  return Math.hypot(px - ax - dx * q, py - ay - dy * q);
}

// ============================================================================
// boulder: rolls down a hill at the marble; leap it or get bowled back
// ============================================================================
const BOULDER_R = 14.6;
function boulderFrames(snowy: boolean) {
  const bands = snowy ? ['#8fa9c9', '#b6cae2', '#dbe7f5', '#ffffff'] : ['#5b4c44', '#7a675a', '#978271', '#b6a08a'];
  const crack = snowy ? '#8fa9c9' : '#3a2f2a';
  const cracks = [[-7, -8, -2, -3], [-2, -3, -4, 3], [-4, 3, -1, 8], [-2, -3, 4, -2], [4, -2, 8, 3]];
  const spots: [number, number, number][] = [[5, -7, 2.2], [-8, 5, 2.4], [3, 8, 1.8], [-9, -3, 1.4], [8, 6, 1.6]];
  // 16 roll angles: the cracks, spots and moss turn, the light stays put
  return Array.from({ length: 16 }, (_, f) =>
    makeSprite(30, 30, (put) => {
      const a = (f / 16) * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      for (let y = 0; y < 30; y++) {
        for (let x = 0; x < 30; x++) {
          const dx = x + 0.5 - 15;
          const dy = y + 0.5 - 15;
          if (Math.hypot(dx, dy) > BOULDER_R) continue;
          const nx = dx / BOULDER_R;
          const ny = dy / BOULDER_R;
          const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
          const lit = -0.5 * nx - 0.6 * ny + 0.62 * nz;
          const band = Math.max(0, Math.min(3, Math.floor((lit + 0.25) * 3)));
          const bu = dx * c + dy * s;
          const bv = -dx * s + dy * c;
          let col = bands[band];
          if (spots.some(([sx, sy, r]) => Math.hypot(bu - sx, bv - sy) < r)) col = bands[Math.max(0, band - 1)];
          if (!snowy && bv < -9.5 && Math.abs(bu) < 7) col = band >= 2 ? '#93bf55' : '#6f9a3a';
          if (snowy && Math.abs(bu - 2) < 0.6 && bv > 2 && bv < 9) col = '#7a5a3a'; // a twig rolled up in it
          if (cracks.some((sg) => segDist(bu, bv, sg) < 0.6)) col = crack;
          if (Math.hypot(nx + 0.42, ny + 0.48) < 0.16) col = snowy ? '#ffffff' : '#e3d2bc';
          put(x, y, col);
        }
      }
    })
  );
}
let rockFrames: Sprite[] | null = null;
let snowFrames: Sprite[] | null = null;
const WEDGE = makeSprite(8, 6, (put) => {
  poly(put, [[0, 6], [8, 6], [8, 0]], '#b97a3c');
  line(put, 2, 5, 7, 1, '#e0a86a');
});

class Boulder implements Entity {
  x: number;
  y = 0;
  home: number;
  frames: Sprite[];
  state: 'idle' | 'driven' | 'free' | 'drop' | 'gone' = 'idle';
  respawn = true;
  vx = 0;
  dropAt = 0;
  last = 0;
  prevX: number;
  prevGy = 309;
  constructor(home: number, snowy: boolean) {
    this.home = this.x = this.prevX = home;
    if (snowy) this.frames = snowFrames || (snowFrames = boulderFrames(true));
    else this.frames = rockFrames || (rockFrames = boulderFrames(false));
  }
  centerY(run: { groundAt(x: number): number | null }, x = this.x) {
    const gy = run.groundAt(x) ?? 309;
    const a = run.groundAt(x - 6) ?? gy;
    const b = run.groundAt(x + 6) ?? gy;
    // on a slope the centre sits a little higher above the contact point
    return gy - 46 / Math.cos(Math.atan((b - a) / 12));
  }
  update(t: number, run: RunView) {
    const dt = this.last ? Math.min(50, t - this.last) : 16;
    this.last = t;
    if (this.state === 'free') {
      this.vx = Math.min(1.2, this.vx + 0.0006 * dt);
      this.x -= this.vx * dt;
      const gy = run.groundAt(this.x);
      // off a ledge or into a wall (both well off screen by then): gone
      if (gy === null || gy < this.prevGy - 15 || this.x < run.marbleX - 720) {
        this.state = this.respawn ? 'drop' : 'gone';
        this.dropAt = t + 350;
      } else this.prevGy = gy;
    }
    if (this.state === 'driven' || this.state === 'free') {
      if (this.prevX - this.x > 2 && Math.random() < 0.45) {
        run.fx.add({ kind: 'dust', x: this.x + 30, y: (run.groundAt(this.x) ?? 309) - 6, vx: 1.2, vy: -0.7, life: 0.7 });
      }
      this.prevX = this.x;
    }
    if (this.state === 'drop' && t >= this.dropAt + 420) {
      this.state = 'idle';
      this.x = this.prevX = this.home;
      this.prevGy = run.groundAt(this.home) ?? 309;
      run.fx.burst('dust', 10, this.home, this.prevGy - 6);
      if (near(run, this.home)) {
        thump(0.6);
        run.fx.shake(t, 4, 160);
      }
    }
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number, run: RunView) {
    if (this.state === 'gone') return;
    if (this.state === 'drop' && t < this.dropAt) return;
    let cx = this.x;
    let cy = this.centerY(run);
    let angle = this.x / 46;
    const gy = run.groundAt(cx) ?? 309;
    if (this.state === 'drop') {
      cx = this.home;
      const rest = this.centerY(run, cx);
      cy = -60 + (rest + 60) * easeIn(clamp01((t - this.dropAt) / 420));
    } else if (this.state === 'idle') {
      // straining against its little wedge
      angle += Math.sin(t / 170) * 0.13;
      drawStanding(g, WEDGE, cx - cam - 46, gy);
    }
    if (cx - cam < -120 || cx - cam > 1080) return;
    const air = Math.max(0, gy - 46 - cy);
    pxEllipse(g, cx - cam, gy - U, 40 * Math.max(0.3, 1 - air / 300), U * 2, 'rgba(0,0,0,.22)');
    const n = this.frames.length;
    const s = this.frames[((Math.round((angle / (Math.PI * 2)) * n) % n) + n) % n];
    drawSprite(g, s, cx - cam - (s.width * U) / 2, cy - (s.height * U) / 2);
  }
}

registerObstacle('boulder', (b) => {
  const jh = jumpScale(b);
  const sx = b.x;
  const waitX = sx - 80;
  const rise = Math.max(36, Math.min(84, b.y - 200));
  b.add(240, 'slope', -rise);
  b.add(210, 'flat');
  const topX = sx + 290;
  const landX = sx + 300;
  const snowy = b.theme.terrain === 'snow' || b.theme.terrain === 'ice';
  const boulder = b.entity(new Boulder(topX, snowy));
  const midX = (waitX + landX) / 2;
  const hitBX = waitX + 30 + MR + 46; // where it meets the hesitating marble
  const pc = cues();
  const fc = cues();
  // it keeps rolling after the move with the speed it had at the end
  const endSpeed = (dist: number, kMeet: number, dur: number) =>
    (dist * 1.7 * Math.pow(1 / kMeet, 0.7)) / kMeet / dur;
  return {
    kind: 'boulder',
    label: snowy ? 'the giant snowball' : 'the boulder',
    waitX,
    pass: {
      dur: 1400,
      step(k, m, _t) {
        pc.begin(k);
        boulder.respawn = false;
        if (boulder.state !== 'free' || k < 1) boulder.state = 'driven';
        // under the marble right at the top of its leap
        boulder.x = topX - (topX - midX) * Math.pow(k / 0.55, 1.7);
        if (pc.once('go')) {
          thump(0.35);
          note(43, { instrument: 'marimba', level: 0.12 });
          m.fx.burst('dust', 8, topX - 30, (m.groundAt(topX) ?? 309) - 6);
        }
        if (k < 0.3) {
          m.roll(waitX);
          if (k > 0.22) m.squash(0.82);
        } else if (k < 0.8) {
          if (pc.once('jump')) {
            whoosh(0.08, 0.3, 0, 600, 1800);
            note(79, { instrument: 'glock', level: 0.08 });
          }
          const p = m.arc(waitX, landX, 160 * jh, span(k, 0.3, 0.8));
          m.place(p.x, p.y);
          m.spin(0.1);
        } else {
          m.roll(landX);
          if (pc.once('land')) {
            m.squash(0.78);
            m.fx.burst('puff', 4, landX, restOf(m, landX) + MR);
            note(84, { instrument: 'glock', level: 0.07 });
          }
        }
        if (k >= 1) {
          boulder.state = 'free';
          boulder.vx = endSpeed(topX - midX, 0.55, 1400);
        }
      }
    },
    fail: {
      dur: 1500,
      step(k, m, _t) {
        fc.begin(k);
        boulder.respawn = true;
        boulder.state = 'driven';
        boulder.x = topX - (topX - hitBX) * Math.pow(k / 0.45, 1.7);
        if (fc.once('go')) {
          thump(0.35);
          note(43, { instrument: 'marimba', level: 0.12 });
        }
        if (k < 0.3) m.roll(waitX + 30 * ease(k / 0.3));
        else if (k < 0.45) {
          m.roll(waitX + 30);
          if (fc.once('sweat')) m.fx.burst('sweat', 3, m.x + 18, m.y - 30, { speed: 0.5 });
        } else if (k < 0.85) {
          if (fc.once('hit')) {
            m.bump();
            thump(0.8);
            m.fx.burst('dust', 12, waitX + 66, restOf(m, waitX + 30) + MR - 6);
          }
          const x0 = waitX + 30;
          const p = hop(x0, restOf(m, x0), waitX - 70, restOf(m, waitX - 70), 150, ease(span(k, 0.45, 0.85)));
          m.place(p.x, p.y);
          m.spin(-0.22);
        } else m.roll(waitX - 70);
        if (k >= 1) {
          boulder.state = 'free';
          boulder.vx = endSpeed(topX - hitBX, 0.45, 1500);
        }
      }
    }
  };
});

// ============================================================================
// cannon: an airship cannon in a metal tower fires a cute cannonball
// ============================================================================
const BARREL = makeSprite(24, 16, (put) => {
  rect(put, 4, 2, 16, 12, '#3a3d4f');
  rect(put, 4, 3, 16, 2, '#6a7088');
  rect(put, 4, 12, 16, 2, '#23253a');
  rect(put, 0, 0, 4, 16, '#4a4e60');
  rect(put, 0, 0, 4, 2, '#7a8098');
  rect(put, 0, 14, 4, 2, '#2a2c3c');
  rect(put, 0, 4, 1, 8, '#14121c');
  for (const bx of [8, 15]) {
    rect(put, bx, 1, 2, 14, '#d9a441');
    rect(put, bx, 1, 2, 1, '#ffe08a');
    rect(put, bx + 1, 2, 1, 12, '#a87a24');
  }
  rect(put, 20, 1, 4, 14, '#5a5f73');
  for (const ry of [3, 7, 11]) put(22, ry, '#c9ced8');
});
const PLATE = makeSprite(10, 24, (put) => {
  rect(put, 0, 0, 10, 24, '#6f7a8a');
  rect(put, 0, 0, 10, 1, '#b8c2d0');
  rect(put, 9, 0, 1, 24, '#525c6b');
  for (const [px, py] of [[2, 2], [7, 2], [2, 21], [7, 21]]) {
    put(px, py, '#d4dbe5');
    put(px, py + 1, '#3a3f49');
  }
  disc(put, 5, 6, 1.6, 1.6, '#ff4d6d', undefined, '#ffb0c0');
});
// the ball: round, shiny, eyes on the side it flies toward, cross brows
const BALL = [false, true].map((dazed) =>
  makeSprite(14, 14, (put) => {
    disc(put, 7, 7, 6.6, 6.6, '#3a3d4f', '#23253a');
    put(10, 3, '#9aa0b8');
    put(11, 3, '#9aa0b8');
    put(10, 4, '#9aa0b8');
    if (dazed) {
      eyesX(put, 1, 4, '#ffffff');
      eyesX(put, 6, 4, '#ffffff');
    } else {
      rect(put, 2, 4, 2, 3, '#ffffff');
      rect(put, 5, 4, 2, 3, '#ffffff');
      put(2, 5, INK);
      put(2, 6, INK);
      put(5, 5, INK);
      put(5, 6, INK);
      line(put, 1, 2, 3, 3, '#ffffff');
      line(put, 7, 2, 5, 3, '#ffffff');
      rect(put, 3, 9, 3, 1, '#ff9db0');
    }
  })
);

class CannonBall implements Entity {
  x: number;
  y: number;
  state: 'hidden' | 'flying' | 'tumble' = 'hidden';
  vx = 0;
  vy = 0;
  last = 0;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  update(t: number, run: RunView) {
    const dt = this.last ? Math.min(50, t - this.last) : 16;
    this.last = t;
    if (this.state === 'tumble') {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vy += 0.0022 * dt;
      if (this.y > H + 80) this.state = 'hidden';
    } else if (this.state === 'flying') {
      if (this.vx) this.x -= this.vx * dt;
      if (Math.random() < 0.5) run.fx.add({ kind: 'puff', x: this.x + 24, y: this.y + (Math.random() - 0.5) * 18, vx: 0.8, vy: -0.2, life: 0.5 });
      if (this.x < run.marbleX - 760) this.state = 'hidden';
    }
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number) {
    if (this.state === 'hidden') return;
    const s = BALL[this.state === 'tumble' ? 1 : 0];
    const bob = this.state === 'flying' ? Math.round(Math.sin(t / 60)) * U : 0;
    drawSprite(g, s, this.x - cam - (s.width * U) / 2, this.y - (s.height * U) / 2 + bob);
  }
}
class Cannon implements Entity {
  x: number;
  y: number;
  firedAt = -1e9;
  windFrom = -1e9;
  lastPuff = 0;
  constructor(wallX: number, boreY: number) {
    this.x = wallX;
    this.y = boreY;
  }
  update(t: number, run: RunView) {
    // idle: a lazy puff of smoke now and then
    if (t - this.lastPuff > 2600 && near(run, this.x) && t - this.firedAt > 1200) {
      this.lastPuff = t;
      run.fx.add({ kind: 'puff', x: this.x - 72, y: this.y - 6, vx: -0.6, vy: -0.8, life: 0.8 });
    }
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number) {
    const sx = this.x - cam;
    if (sx < -200 || sx > 1100) return;
    drawSprite(g, PLATE, sx - PLATE.width * U + U * 2, this.y - (PLATE.height * U) / 2);
    let off = 0;
    const since = t - this.firedAt;
    if (since >= 0 && since < 200) off = Math.round((1 - since / 200) * 3) * U; // recoil
    else if (t >= this.windFrom && t < this.firedAt) off = (Math.floor(t / 40) % 2) * U; // wind-up jitter
    drawSprite(g, BARREL, sx - BARREL.width * U + U * 3 + off, this.y - (BARREL.height * U) / 2);
    if (since >= 0 && since < 110) {
      // muzzle flash
      const mx = sx - BARREL.width * U + U * 2;
      g.fillStyle = '#fff1a0';
      g.fillRect(r3(mx - 30), r3(this.y - 9), 30, 18);
      g.fillStyle = '#ffd84a';
      g.fillRect(r3(mx - 42), r3(this.y - 3), 12, 6);
      g.fillRect(r3(mx - 21), r3(this.y - 21), 6, 42);
    }
  }
}

registerObstacle('cannon', (b) => {
  const jh = jumpScale(b);
  const waitX = b.x - 60;
  b.add(200, 'flat');
  const wallX = b.x;
  const gy = b.y;
  const tall = 72;
  b.y -= tall;
  b.add(180, 'raised', 0, 'metal');
  b.y += tall;
  b.add(90, 'flat');
  const landX = wallX + 80;
  const boreY = gy - 24;
  const startX = wallX - 56;
  const ball = b.entity(new CannonBall(startX, boreY));
  const cannon = b.entity(new Cannon(wallX, boreY));
  const SPEED = 0.46; // px per ms
  const pc = cues();
  const fc = cues();
  const fire = (m: MarbleCtl, t: number) => {
    cannon.firedAt = t;
    ball.state = 'flying';
    ball.vx = 0;
    ball.y = boreY;
    thump(0.7);
    whoosh(0.1, 0.25, 0, 900, 300);
    m.fx.burst('puff', 8, startX - 20, boreY, { speed: 0.6, dir: Math.PI, spread: 1.6 });
    m.fx.shake(t, 3, 120);
  };
  return {
    kind: 'cannon',
    label: 'the cannon',
    waitX,
    pass: {
      dur: 1300,
      step(k, m, t) {
        pc.begin(k);
        if (pc.once('wind')) cannon.windFrom = t;
        if (k >= 0.2 && pc.once('fire')) fire(m, t);
        if (k >= 0.2) ball.x = startX - SPEED * (k - 0.2) * 1300;
        if (k < 0.38) {
          m.roll(waitX);
          if (k > 0.3) m.squash(0.82);
        } else if (k < 0.88) {
          if (pc.once('jump')) note(79, { instrument: 'glock', level: 0.08 });
          const p = m.arc(waitX, landX, 170 * jh, span(k, 0.38, 0.88));
          m.place(p.x, p.y);
          m.spin(0.1);
        } else {
          m.roll(landX);
          if (pc.once('land')) {
            m.squash(0.78);
            m.fx.burst('puff', 4, landX, restOf(m, landX) + MR);
            note(84, { instrument: 'glock', level: 0.07 });
          }
        }
        if (k >= 1) ball.vx = SPEED; // it sails on off screen
      }
    },
    fail: {
      dur: 1400,
      step(k, m, t) {
        fc.begin(k);
        if (fc.once('wind')) cannon.windFrom = t;
        if (k >= 0.2 && fc.once('fire')) fire(m, t);
        const hitX = waitX + 20 + MR + 22;
        const hitK = 0.2 + (startX - hitX) / SPEED / 1400;
        if (k < hitK) {
          if (k >= 0.2) ball.x = startX - SPEED * (k - 0.2) * 1400;
          m.roll(waitX + 20 * ease(clamp01(k / 0.3)));
        } else {
          if (fc.once('hit')) {
            m.bump();
            thump(0.6);
            note(52, { instrument: 'marimba', level: 0.12 });
            // the ball pops up dizzy and drops off screen, Mario style
            ball.state = 'tumble';
            ball.x = hitX;
            ball.vx = 0.14;
            ball.vy = -0.7;
          }
          const f = span(k, hitK, Math.min(1, hitK + 0.38));
          const p = hop(waitX + 20, restOf(m, waitX + 20), waitX - 50, restOf(m, waitX - 50), 60, ease(f));
          if (f < 1) {
            m.place(p.x, p.y);
            m.spin(-0.15);
          } else m.roll(waitX - 50);
        }
      }
    }
  };
});

// ============================================================================
// seesaw: a plank over a gap; tip it the right way onto the higher ledge
// ============================================================================
const PLANK_L = 135; // half length
const PLANK_A1 = -0.42; // rest: left end down on the ground
const PLANK_A2 = 0.1; // tipped: right end resting on the ledge
const PLANK_TH = U * 4;
const FULCRUM = makeSprite(18, 13, (put) => {
  poly(put, [[0, 13], [9, 0], [18, 13]], '#8a5a30');
  line(put, 2, 12, 9, 1, '#b97a3c');
  rect(put, 0, 11, 18, 2, '#5a3a1e');
  disc(put, 9, 4, 1.6, 1.6, '#c9ced8', undefined, '#ffffff');
});
class Seesaw implements Entity {
  x: number;
  y: number;
  a = PLANK_A1;
  tipped = false;
  constructor(px: number, py: number) {
    this.x = px;
    this.y = py;
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number) {
    const px = this.x - cam;
    if (px < -300 || px > 1260) return;
    // the post down into the gap
    const postTop = r3(this.y + PLANK_TH + FULCRUM.height * U - U * 4);
    const pl = r3(px - U * 4);
    g.fillStyle = '#7a4a22';
    g.fillRect(pl, postTop, U * 8, H - postTop);
    g.fillStyle = '#a8703a';
    g.fillRect(pl + U, postTop, U * 2, H - postTop);
    g.fillStyle = '#5a3416';
    for (let y = postTop + U * 6; y < H; y += U * 9) g.fillRect(pl, r3(y), U * 8, U);
    g.fillStyle = INK;
    g.fillRect(pl - U, postTop, U, H - postTop);
    g.fillRect(pl + U * 8, postTop, U, H - postTop);
    drawSprite(g, FULCRUM, px - (FULCRUM.width * U) / 2, this.y + U * 2);
    // the plank, drawn pixel by pixel along its angle so it stays crisp
    const a = this.a + (this.tipped ? 0 : Math.sin(t / 650) * 0.006);
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    for (let s = -PLANK_L - U; s <= PLANK_L + U; s += 2) {
      const x0 = px + s * ca;
      const y0 = this.y + s * sa;
      const end = s < -PLANK_L + 2 || s > PLANK_L - 2;
      const seam = Math.abs(((s + PLANK_L) % 54) - 27) < 1.5;
      for (let j = -1; j <= 4; j++) {
        let col = '#b97a3c';
        if (j < 0 || j > 3 || end) col = INK;
        else if (j === 0) col = '#e8b070';
        else if (j === 3) col = '#7a4a22';
        else if (seam) col = '#8a5a30';
        g.fillStyle = col;
        g.fillRect(r3(x0 - sa * j * U), r3(y0 + ca * j * U), U, U);
      }
    }
    // the pivot bolt
    g.fillStyle = '#c9ced8';
    g.fillRect(r3(px - U), r3(this.y + U), U * 2, U * 2);
    g.fillStyle = '#ffffff';
    g.fillRect(r3(px - U), r3(this.y + U), U, U);
  }
}

registerObstacle('seesaw', (b) => {
  const gx = b.x;
  const gy = b.y;
  const waitX = gx - 110;
  const pivotY = r3(gy - PLANK_TH - PLANK_L * Math.sin(-PLANK_A1));
  const pivotX = Math.round(gx - 15 + PLANK_L * Math.cos(PLANK_A1));
  const ledgeY = r3(pivotY + PLANK_L * Math.sin(PLANK_A2) + PLANK_TH);
  const ledgeX = Math.round(pivotX + PLANK_L * Math.cos(PLANK_A2) - 24);
  b.add(ledgeX - gx, 'gap');
  b.y = ledgeY;
  b.add(240, 'raised');
  b.y = gy;
  const landX = ledgeX + 100;
  const saw = b.entity(new Seesaw(pivotX, pivotY));
  // the marble's centre riding the plank at distance s from the pivot
  const on = (s: number, a: number) => ({
    x: pivotX + s * Math.cos(a) + Math.sin(a) * (MR + U),
    y: pivotY + s * Math.sin(a) - Math.cos(a) * (MR + U)
  });
  const s0 = -PLANK_L + 22;
  const leftEndX = pivotX - PLANK_L * Math.cos(PLANK_A1);
  const pc = cues();
  const fc = cues();
  const hopOn = (k: number, m: MarbleCtl) => {
    const p0 = on(s0, PLANK_A1);
    const p = hop(waitX, restOf(m, waitX), p0.x, p0.y, 30, k);
    m.place(p.x, p.y);
  };
  return {
    kind: 'seesaw',
    label: 'the seesaw',
    waitX,
    pass: {
      dur: 1500,
      step(k, m, _t) {
        pc.begin(k);
        if (k < 0.12) {
          saw.a = PLANK_A1;
          hopOn(k / 0.12, m);
          return;
        }
        if (pc.once('on')) note(67, { instrument: 'marimba', level: 0.09 });
        let p;
        if (k < 0.5) {
          saw.a = PLANK_A1;
          p = on(s0 + (10 - s0) * ease(span(k, 0.12, 0.5)), PLANK_A1);
        } else if (k < 0.68) {
          const f = span(k, 0.5, 0.68);
          saw.a = PLANK_A1 + (PLANK_A2 - PLANK_A1) * easeOutBack(f);
          if (pc.once('tip')) {
            thump(0.45);
            note(60, { instrument: 'marimba', level: 0.12 });
            note(72, { at: 0.12, instrument: 'marimba', level: 0.1 });
          }
          p = on(10 + 40 * f, saw.a);
        } else if (k < 0.86) {
          saw.a = PLANK_A2;
          saw.tipped = true;
          if (pc.once('clack')) m.fx.burst('dust', 6, pivotX + PLANK_L, ledgeY - 4);
          p = on(50 + (PLANK_L - 64) * span(k, 0.68, 0.86), PLANK_A2);
        } else {
          const e = on(PLANK_L - 14, PLANK_A2);
          const f = span(k, 0.86, 1);
          if (f >= 1) {
            m.roll(landX);
            return;
          }
          p = hop(e.x, e.y, landX, restOf(m, landX), 14, f);
        }
        m.place(p.x, p.y);
      }
    },
    fail: {
      dur: 1700,
      step(k, m, t) {
        fc.begin(k);
        if (k < 0.12) {
          saw.a = PLANK_A1;
          hopOn(k / 0.12, m);
          return;
        }
        const sStop = -34;
        if (k < 0.42) {
          saw.a = PLANK_A1;
          const p = on(s0 + (sStop - s0) * ease(span(k, 0.12, 0.42)), PLANK_A1);
          m.place(p.x, p.y);
        } else if (k < 0.5) {
          // it starts to tip... and doesn't
          const f = span(k, 0.42, 0.5);
          saw.a = PLANK_A1 + 0.1 * Math.sin(f * Math.PI * 0.5);
          if (fc.once('sweat')) m.fx.burst('sweat', 3, m.x + 18, m.y - 30, { speed: 0.5 });
          const p = on(sStop + 4 * f, saw.a);
          m.place(p.x, p.y);
        } else {
          if (fc.once('snap')) {
            thump(0.6);
            note(55, { instrument: 'marimba', level: 0.12 });
            m.fx.burst('dust', 10, leftEndX, gy - 6);
            m.fx.shake(t, 4, 160);
            m.bump('WHOA');
          }
          // snaps back the wrong way, flinging the marble off the low end
          const sf = span(k, 0.5, 0.58);
          saw.a = sf < 1 ? PLANK_A1 + 0.1 * (1 - sf) * Math.cos(sf * Math.PI * 1.5) : PLANK_A1;
          const st = on(sStop + 4, PLANK_A1 + 0.1);
          const f = span(k, 0.5, 0.88);
          if (f < 1) {
            const p = hop(st.x, st.y, waitX - 24, restOf(m, waitX - 24), 70, ease(f));
            m.place(p.x, p.y);
            m.spin(-0.2);
          } else m.roll(waitX - 24);
        }
      }
    }
  };
});

// ============================================================================
// vine: a beanstalk up a cliff to a high ledge
// ============================================================================
const VINE_H = 56;
const VINE = [0, 1].map((f) =>
  makeSprite(24, VINE_H, (put) => {
    const stalkX = (y: number) => 10 + Math.sin(y / 6.5) * 3.5;
    for (let y = 6; y < VINE_H; y++) {
      const x = Math.round(stalkX(y));
      put(x - 1, y, '#7fd65a');
      put(x, y, '#3f9a3a');
      put(x + 1, y, '#2a6b2a');
    }
    // leaves on alternating sides, fluttering a pixel between frames
    for (let i = 0, y = VINE_H - 6; y > 8; y -= 7, i++) {
      const side = i % 2 ? 1 : -1;
      const lx = stalkX(y) + side * 5;
      const ly = y - 1 + (f && i % 2 === 0 ? -1 : 0);
      disc(put, lx, ly, 3.6, 2.1, '#5cc04a', '#3a8a34', '#a8ec7a');
      line(put, Math.round(stalkX(y)), y, Math.round(lx + side * 2), Math.round(ly), '#2f7a2c');
    }
    // a curly tendril and a bud at the top, leaning over the ledge
    for (let a = 0; a < 14; a++) {
      const r = 1 + a * 0.25;
      put(Math.round(16 + Math.cos(a * 0.6 + f * 0.4) * r), Math.round(18 + Math.sin(a * 0.6 + f * 0.4) * r), '#4fae40');
    }
    line(put, 10, 6, 16, 2 + f, '#3f9a3a');
    disc(put, 19, 2.5 + f, 3.2, 2.4, '#ff8fc0', '#d0507f', '#ffd0e6');
    put(21, 2 + f, '#ffe08a');
    disc(put, 7, 7, 3, 2, '#5cc04a', '#3a8a34');
  })
);
class Vine implements Entity {
  x: number;
  y: number;
  rustleUntil = 0;
  constructor(x: number, groundY: number) {
    this.x = x;
    this.y = groundY;
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number) {
    const sx = this.x - cam;
    if (sx < -100 || sx > 1060) return;
    const ms = t < this.rustleUntil ? 90 : 520;
    drawStanding(g, VINE[Math.floor(t / ms) % 2], sx + U * 3, this.y);
  }
}

registerObstacle('vine', (b) => {
  const start = b.x;
  b.add(120, 'flat');
  const wallX = b.x;
  const gy = b.y;
  const rise = Math.min(126, gy - 150);
  b.y -= rise;
  b.add(260, 'raised');
  b.y += rise;
  const ledgeTop = gy - rise;
  const vx = wallX - MR - 3;
  const waitX = Math.min(start - 10, vx - 100);
  const landX = wallX + 80;
  const vine = b.entity(new Vine(vx, gy));
  const topY = ledgeTop - MR - 18;
  const pc = cues();
  const fc = cues();
  const rustle = (m: MarbleCtl, t: number) => {
    vine.rustleUntil = t + 200;
    if (Math.random() < 0.12) {
      m.fx.add({ kind: 'leaf', x: vx + (Math.random() - 0.5) * 40, y: m.y, vx: (Math.random() - 0.5) * 1.5, vy: -0.4, life: 1, color: '#5cc04a' });
    }
  };
  return {
    kind: 'vine',
    label: 'the vine',
    waitX,
    pass: {
      dur: 1500,
      step(k, m, t) {
        pc.begin(k);
        const rest = restOf(m, vx);
        if (k < 0.14) {
          m.roll(waitX + (vx - waitX) * ease(k / 0.14));
          return;
        }
        if (k < 0.78) {
          const f = span(k, 0.14, 0.78);
          // hand over hand: a wiggle side to side on the way up
          m.place(vx + Math.sin(f * Math.PI * 6) * 6, rest + (topY - rest) * easeInOut(f));
          rustle(m, t);
          [0.15, 0.4, 0.65].forEach((at, i) => {
            if (f >= at && pc.once(`n${i}`)) note([72, 76, 79][i], { instrument: 'glock', level: 0.07 });
          });
          return;
        }
        if (pc.once('pop')) {
          note(84, { instrument: 'glock', level: 0.08 });
          m.fx.burst('leaf', 5, vx, topY, { color: '#7fd65a', speed: 0.6 });
        }
        const f = span(k, 0.78, 1);
        if (f >= 1) {
          m.roll(landX);
          return;
        }
        const p = hop(vx, topY, landX, restOf(m, landX), 46, f);
        m.place(p.x, p.y);
      }
    },
    fail: {
      dur: 1900,
      step(k, m, t) {
        fc.begin(k);
        const rest = restOf(m, vx);
        const midY = rest + (topY - rest) * 0.5;
        if (k < 0.14) {
          m.roll(waitX + (vx - waitX) * ease(k / 0.14));
        } else if (k < 0.42) {
          const f = span(k, 0.14, 0.42);
          m.place(vx + Math.sin(f * Math.PI * 3) * 6, rest + (midY - rest) * easeInOut(f));
          rustle(m, t);
        } else if (k < 0.55) {
          // losing grip: a frantic wiggle, slipping a little
          const f = span(k, 0.42, 0.55);
          if (fc.once('slip')) {
            m.fx.burst('sweat', 3, vx + 18, midY - 30, { speed: 0.5 });
            m.fx.text('SLIP!', vx, midY - 56, '#ffffff', 12);
            note(64, { instrument: 'marimba', level: 0.1 });
          }
          m.place(vx + Math.sin(f * Math.PI * 10) * 4, midY + 8 * f);
          rustle(m, t);
        } else if (k < 0.7) {
          const f = span(k, 0.55, 0.7);
          if (fc.once('slide')) whoosh(0.07, 0.25, 0, 1600, 400);
          m.place(vx, midY + 8 + (rest - midY - 8) * easeIn(f));
          rustle(m, t);
        } else {
          if (fc.once('bottom')) {
            m.bump('OOPS');
            m.fx.burst('leaf', 6, vx, rest, { color: '#5cc04a', speed: 0.5 });
          }
          m.roll(vx + (waitX - vx) * ease(span(k, 0.72, 1)));
        }
      }
    }
  };
});

// ============================================================================
// quicksand: a bubbling patch; skip across it or sink and struggle
// ============================================================================
const POOL_TINT: Record<string, string> = {
  sunset: 'rgba(255,120,60,.14)',
  night: 'rgba(20,30,90,.38)',
  dark: 'rgba(14,8,30,.34)',
  dream: 'rgba(170,110,255,.14)'
};
// drawn in front of the marble, so a sinking marble is hidden below the surface
class Quicksand implements Entity {
  x: number;
  y = 0;
  x1: number;
  front = true;
  tint: string | undefined;
  constructor(x0: number, x1: number, light: string) {
    this.x = x0;
    this.x1 = x1;
    this.tint = POOL_TINT[light];
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number, run: RunView) {
    const l = r3(this.x - cam);
    const r = r3(this.x1 - cam);
    if (r < -20 || l > 980) return;
    const gy = run.groundAt(this.x + 6) ?? 309;
    const depth = 66;
    for (let sx = l; sx < r; sx += U) {
      const wx = sx + cam;
      const cx = Math.floor(wx / U);
      const edge = Math.min(sx - l, r - U - sx) / U; // 0 at the rims
      const wave = edge < 2 ? 0 : Math.round(Math.sin(wx / 16 + t / 280) * 0.9) * U;
      const top = gy - U + wave;
      for (let y = top; y < gy + depth; y += U) {
        const d = (y - top) / U;
        let col = '#d9ad55';
        if (d === 0) col = '#f6dc96';
        else if (d === 1) col = '#e8c070';
        else if ((cx * 3 + Math.floor(y / U) * 5 + Math.floor(t / 160)) % 29 === 0) col = '#b4853a';
        else if ((cx + Math.floor(y / U) * 2 - Math.floor(t / 90)) % 17 === 0) col = '#c99a45';
        if (edge < 1 || y >= gy + depth - U * 2) col = '#a87a35';
        g.fillStyle = col;
        g.fillRect(sx, y, U, U);
      }
    }
    // bubbles swell and pop at fixed spots, each on its own beat
    for (let i = 0; i < 4; i++) {
      const bx = r3(l + U * 6 + ((hash2(i, Math.floor(this.x)) % 1000) / 1000) * (r - l - U * 12));
      const ph = ((t + i * 530) % 1700) / 1700;
      if (ph < 0.75) {
        const rr = Math.round(1 + ph * 3) * U;
        g.fillStyle = '#f6dc96';
        g.fillRect(bx - rr, gy - U - rr, rr * 2, rr);
        g.fillStyle = '#ffffff';
        g.fillRect(bx - rr + U, gy - U - rr, U, U);
      } else if (ph < 0.85) {
        g.fillStyle = '#fff0b0';
        g.fillRect(bx - U * 3, gy - U * 3, U, U);
        g.fillRect(bx + U * 2, gy - U * 3, U, U);
        g.fillRect(bx, gy - U * 4, U, U);
      }
    }
    // rings around a marble stuck in it
    const mx = run.marbleX;
    if (mx > this.x && mx < this.x1 && run.marbleY > gy - MR + U * 2) {
      const rr = MR + 6 + Math.round(((t / 12) % 18) / U) * U;
      g.fillStyle = '#b4853a';
      g.fillRect(r3(mx - cam - rr), gy - U, U * 3, U);
      g.fillRect(r3(mx - cam + rr - U * 3), gy - U, U * 3, U);
    }
    if (this.tint) {
      g.fillStyle = this.tint;
      g.fillRect(l, gy - U * 2, r - l, depth + U * 2);
    }
  }
}

registerObstacle('quicksand', (b) => {
  const jh = jumpScale(b);
  const waitX = b.x - 70;
  b.add(30, 'flat');
  const q0 = b.x;
  b.add(240, 'flat', 0, 'sand');
  const q1 = b.x;
  b.add(150, 'flat');
  const landX = q1 + 80;
  b.entity(new Quicksand(q0, q1, b.theme.light));
  const hops: [number, number, number, number, number][] = [
    // from, to, k start, k end, height
    [waitX, q0 + 70, 0, 0.33, 80],
    [q0 + 70, q0 + 170, 0.33, 0.6, 60],
    [q0 + 170, landX, 0.6, 1, 100]
  ];
  const stuckX = q0 + 60;
  const pc = cues();
  const fc = cues();
  const splash = (m: MarbleCtl, x: number) => {
    const gy = m.groundAt(x) ?? 309;
    m.fx.burst('frag', 6, x, gy - 3, { color: '#e8c070', speed: 0.55, size: U });
    m.fx.burst('dust', 3, x, gy - 3);
  };
  return {
    kind: 'quicksand',
    label: 'the quicksand',
    waitX,
    pass: {
      dur: 1300,
      step(k, m) {
        pc.begin(k);
        hops.forEach(([x0, x1, a, z, h], i) => {
          if (k < a || (k >= z && i < hops.length - 1)) return;
          if (pc.once(`h${i}`)) {
            if (i > 0) splash(m, x0);
            note([72, 76, 79][i], { instrument: 'marimba', level: 0.1 });
          }
          const f = span(k, a, z);
          if (f >= 1) {
            m.roll(x1);
            if (pc.once('land')) m.squash(0.8);
            return;
          }
          const p = m.arc(x0, x1, h * jh, f);
          m.place(p.x, p.y);
          m.spin(0.08);
        });
      }
    },
    fail: {
      dur: 2000,
      step(k, m, _t) {
        fc.begin(k);
        const rest = restOf(m, stuckX);
        const sunk = rest + MR * 0.95;
        if (k < 0.22) {
          m.roll(waitX + (stuckX - waitX) * ease(k / 0.22));
        } else if (k < 0.5) {
          const f = span(k, 0.22, 0.5);
          if (fc.once('sink')) {
            whoosh(0.06, 0.6, 0, 500, 120);
            note(55, { instrument: 'marimba', level: 0.1 });
          }
          m.place(stuckX + Math.sin(f * 30) * 2, rest + (sunk - rest) * ease(f));
          if (Math.random() < 0.15) m.fx.add({ kind: 'dust', x: stuckX + (Math.random() - 0.5) * 70, y: rest + MR - 4, vx: 0, vy: -0.5, life: 0.6 });
        } else if (k < 0.72) {
          const f = span(k, 0.5, 0.72);
          if (fc.once('stuck')) {
            m.fx.text('STUCK!', stuckX, rest - 40, '#ffffff', 12);
            m.fx.burst('sweat', 3, stuckX + 18, sunk - 30, { speed: 0.5 });
          }
          m.place(stuckX + Math.sin(f * 40) * 5, sunk + Math.sin(f * 28) * 3);
          m.spin(Math.sin(f * 40) * 0.08);
        } else {
          if (fc.once('pop')) {
            m.bump('POP');
            thump(0.4);
            note(72, { instrument: 'glock', level: 0.08 });
            m.fx.burst('frag', 12, stuckX, rest + MR - 4, { color: '#e8c070', speed: 0.8, size: U });
          }
          const f = span(k, 0.72, 1);
          if (f < 1) {
            const p = hop(stuckX, sunk, waitX, restOf(m, waitX), 110, f);
            m.place(p.x, p.y);
            m.spin(-0.18);
          } else m.roll(waitX);
        }
      }
    }
  };
});

// ============================================================================
// geyser: a vent erupts and lifts the marble to a ledge (lava in dark caves)
// ============================================================================
type Jet = 'water' | 'steam' | 'lava';
const JET: Record<Jet, { edge: string; body: string; core: string; foam: string; hole: string; rock: [string, string, string] }> = {
  water: { edge: '#2b8fd6', body: '#5cc4ff', core: '#c8f0ff', foam: '#ffffff', hole: '#1d4a6b', rock: ['#8a8f99', '#5f646e', '#b8bdc6'] },
  steam: { edge: '#aeb9c6', body: '#dde4ec', core: '#ffffff', foam: '#ffffff', hole: '#3a3f49', rock: ['#7f8a99', '#525c6b', '#b4bfcc'] },
  lava: { edge: '#c8321a', body: '#ff7a1a', core: '#ffd84a', foam: '#fff1a0', hole: '#ffb03a', rock: ['#4a3a40', '#2e2428', '#6e5a5e'] }
};
const VENTS = {} as Record<Jet, Sprite>;
(Object.keys(JET) as Jet[]).forEach((k) => {
  const j = JET[k];
  VENTS[k] = makeSprite(26, 10, (put) => {
    poly(put, [[0, 10], [5, 2], [21, 2], [26, 10]], j.rock[0]);
    rect(put, 3, 8, 21, 2, j.rock[1]);
    line(put, 1, 9, 5, 3, j.rock[2]);
    for (const [px, py] of [[8, 6], [17, 7], [12, 8], [21, 6]]) put(px, py, j.rock[1]);
    disc(put, 13, 2.5, 6, 1.8, j.hole);
    if (k === 'lava') rect(put, 10, 2, 6, 1, '#fff1a0');
  });
});
class Geyser implements Entity {
  x: number;
  y: number;
  h = 0; // column height in px
  driven = false;
  rumbleUntil = 0;
  jet: Jet;
  last = 0;
  lastWisp = 0;
  constructor(x: number, groundY: number, jet: Jet) {
    this.x = x;
    this.y = groundY;
    this.jet = jet;
  }
  update(t: number, run: RunView) {
    const dt = this.last ? Math.min(50, t - this.last) : 16;
    this.last = t;
    if (!this.driven) this.h = Math.max(0, this.h - dt * 0.35);
    if (this.h > 20 && Math.random() < 0.5) {
      // spray falling off the top
      run.fx.add({
        kind: this.jet === 'lava' ? 'ember' : this.jet === 'steam' ? 'puff' : 'splash',
        x: this.x + (Math.random() - 0.5) * 50,
        y: this.y - this.h,
        vx: (Math.random() - 0.5) * 3,
        vy: -1.5 - Math.random() * 2,
        life: 0.8
      });
    }
    if (t - this.lastWisp > 900 && near(run, this.x)) {
      this.lastWisp = t;
      run.fx.add({ kind: this.jet === 'lava' ? 'ember' : 'puff', x: this.x, y: this.y - 8, vx: 0.2, vy: -0.8, life: 0.7 });
    }
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number) {
    const sx = this.x - cam;
    if (sx < -100 || sx > 1060) return;
    const j = JET[this.jet];
    if (this.h > 2) {
      const top = r3(this.y - this.h);
      for (let y = top; y < this.y; y += U) {
        const hw = r3(20 + Math.sin((y + t * 0.5) / 10) * 3 + (y - top < 12 ? 6 : 0));
        const stripe = (y + Math.floor(t * 0.4)) % 18 < 3;
        g.fillStyle = j.edge;
        g.fillRect(r3(sx - hw), y, hw * 2, U);
        g.fillStyle = j.body;
        g.fillRect(r3(sx - hw + U * 2), y, hw * 2 - U * 4, U);
        g.fillStyle = stripe ? j.foam : j.core;
        g.fillRect(r3(sx - U * 2 + Math.sin((y - t * 0.3) / 7) * U), y, U * 3, U);
      }
      // the frothy cap
      pxEllipse(g, sx, top, 30 + Math.sin(t / 70) * 3, 9, j.body);
      pxEllipse(g, sx - 6, top - 3, 18, 6, j.foam);
      if (this.jet === 'lava') {
        g.fillStyle = 'rgba(255,140,40,.18)';
        g.fillRect(r3(sx - 48), top - 12, 96, this.y - top + 12);
      }
    }
    const shake = t < this.rumbleUntil ? (Math.floor(t / 35) % 2 ? U : -U) : 0;
    drawStanding(g, VENTS[this.jet], sx + shake, this.y);
    if (this.jet === 'lava') {
      // a warm glow over the vent mouth
      g.fillStyle = `rgba(255,150,50,${0.18 + Math.sin(t / 300) * 0.06})`;
      g.fillRect(r3(sx - 30), this.y - U * 9, 60, U * 6);
    }
  }
}

registerObstacle('geyser', (b) => {
  const terrain = b.theme.terrain;
  const dim = b.theme.light === 'dark' || b.theme.light === 'night';
  const jet: Jet =
    (terrain === 'rock' || terrain === 'stone') && dim ? 'lava' : terrain === 'metal' || terrain === 'circuit' ? 'steam' : 'water';
  b.add(110, 'flat');
  const wallX = b.x;
  const gy = b.y;
  const rise = Math.min(126, gy - 150);
  b.y -= rise;
  b.add(240, 'raised');
  b.y += rise;
  const ledgeTop = gy - rise;
  const vx = wallX - MR - 14;
  const waitX = vx - 110;
  const landX = wallX + 80;
  const colH = rise + 40;
  const geyser = b.entity(new Geyser(vx, gy, jet));
  const pc = cues();
  const fc = cues();
  const rumble = (m: MarbleCtl, t: number, c: ReturnType<typeof cues>) => {
    geyser.rumbleUntil = t + 60;
    if (c.once('rumble')) {
      thump(0.3);
      note(40, { instrument: 'pad', level: 0.1, hold: 0.3 });
      m.fx.shake(t, 2, 200);
    }
    if (Math.random() < 0.3) m.fx.add({ kind: jet === 'lava' ? 'ember' : 'puff', x: vx + (Math.random() - 0.5) * 30, y: gy - 10, vy: -1.2, life: 0.6 });
  };
  const erupt = (m: MarbleCtl, strong: boolean) => {
    whoosh(strong ? 0.14 : 0.07, strong ? 0.6 : 0.3, 0, 300, strong ? 2200 : 900);
    m.fx.burst(jet === 'lava' ? 'ember' : 'splash', strong ? 14 : 6, vx, gy - 10, { speed: strong ? 1 : 0.5, dir: -Math.PI / 2, spread: 1.4 });
  };
  return {
    kind: 'geyser',
    label: 'the geyser',
    waitX,
    pass: {
      dur: 1500,
      step(k, m, t) {
        pc.begin(k);
        geyser.driven = true;
        if (k < 0.16) {
          geyser.h = 0;
          m.roll(waitX + (vx - waitX) * ease(k / 0.16));
        } else if (k < 0.32) {
          geyser.h = 0;
          m.roll(vx);
          rumble(m, t, pc);
        } else if (k < 0.72) {
          if (pc.once('erupt')) erupt(m, true);
          geyser.h = colH * ease(span(k, 0.32, 0.6)) + Math.sin(t / 60) * 3;
          m.place(vx, gy - geyser.h - MR);
        } else {
          geyser.h = colH + Math.sin(t / 60) * 3;
          if (pc.once('hop')) note(84, { instrument: 'glock', level: 0.08 });
          const f = span(k, 0.72, 1);
          if (f < 1) {
            const p = hop(vx, gy - colH - MR, landX, restOf(m, landX), 40, f);
            m.place(p.x, p.y);
          } else m.roll(landX);
        }
        if (k >= 1) geyser.driven = false;
      }
    },
    fail: {
      dur: 1800,
      step(k, m, t) {
        fc.begin(k);
        geyser.driven = true;
        const weak = 70;
        const bonk = { x: wallX - MR - 2, y: ledgeTop + 6 };
        if (k < 0.16) {
          geyser.h = 0;
          m.roll(waitX + (vx - waitX) * ease(k / 0.16));
        } else if (k < 0.32) {
          geyser.h = 0;
          m.roll(vx);
          rumble(m, t, fc);
        } else if (k < 0.48) {
          if (fc.once('erupt')) erupt(m, false);
          // a sputtering spurt
          geyser.h = weak * ease(span(k, 0.32, 0.46)) + Math.sin(t / 30) * 6;
          m.place(vx, gy - geyser.h - MR);
        } else if (k < 0.6) {
          geyser.h = weak * (1 - span(k, 0.48, 0.6));
          if (fc.once('fizzle')) {
            m.fx.burst('puff', 6, vx, gy - 20, { speed: 0.4 });
            note(50, { instrument: 'marimba', level: 0.1 });
          }
          const p = hop(vx, gy - weak - MR, bonk.x, bonk.y, 30, span(k, 0.48, 0.6));
          m.place(p.x, p.y);
        } else {
          geyser.h = 0;
          if (fc.once('bonk')) {
            m.bump('BONK');
            thump(0.4);
          }
          const f = span(k, 0.6, 1);
          if (f < 1) {
            const p = hop(bonk.x, bonk.y, waitX, restOf(m, waitX), 24, easeIn(f) * 0.4 + f * 0.6);
            m.place(p.x, p.y);
            m.spin(-0.12);
          } else m.roll(waitX);
        }
        if (k >= 1) geyser.driven = false;
      }
    }
  };
});

// ============================================================================
// thwomp: a stone crusher slams down on a beat; dash under as it lifts
// ============================================================================
const CRUSH_UP = 132; // how high it hovers above the floor
const CRUSHER = [false, true].map((slam) =>
  makeSprite(30, 34, (put) => {
    rect(put, 3, 3, 24, 28, '#8f9bb3');
    rect(put, 3, 3, 24, 2, '#c4cde0');
    rect(put, 3, 3, 2, 28, '#b0bbd0');
    rect(put, 25, 3, 2, 28, '#5e6982');
    rect(put, 3, 29, 24, 2, '#5e6982');
    // stubby spikes all round the edge
    for (const p of [6, 12, 18, 24]) {
      poly(put, [[p - 2, 3], [p, 0], [p + 2, 3]], '#c4cde0');
      poly(put, [[p - 2, 31], [p, 34], [p + 2, 31]], '#5e6982');
    }
    for (const p of [8, 16, 24]) {
      poly(put, [[3, p - 2], [0, p], [3, p + 2]], '#b0bbd0');
      poly(put, [[27, p - 2], [30, p], [27, p + 2]], '#5e6982');
    }
    for (const [px, py] of [[22, 6], [6, 27], [21, 27], [8, 7]]) put(px, py, '#6f7a92');
    // the angry face, looking left toward the marble
    line(put, 7, slam ? 11 : 10, 12, 13, INK, 2);
    line(put, 22, slam ? 11 : 10, 17, 13, INK, 2);
    const eh = slam ? 2 : 4;
    rect(put, 8, 14, 4, eh, '#ffffff');
    rect(put, 17, 14, 4, eh, '#ffffff');
    rect(put, 8, 14 + eh - 2, 2, 2, INK);
    rect(put, 17, 14 + eh - 2, 2, 2, INK);
    const my = slam ? 20 : 21;
    const mh = slam ? 7 : 5;
    rect(put, 7, my, 16, mh, INK);
    rect(put, 8, my + 1, 14, mh - 2, '#ffffff');
    for (const tx of [11, 14, 17, 20]) rect(put, tx, my + 1, 1, mh - 2, INK);
    if (mh > 5) rect(put, 8, my + 3, 14, 1, INK);
  })
);
class Crusher implements Entity {
  x: number;
  y: number; // the floor
  drive: number | null = null; // lift while a move scripts it
  base = 0; // when the idle beat started
  lastLift = CRUSH_UP;
  falling = false;
  constructor(x: number, floor: number) {
    this.x = x;
    this.y = floor;
  }
  beat(t: number) {
    const c = (((t - this.base) % 2600) + 2600) % 2600;
    if (c < 1300) return CRUSH_UP;
    if (c < 1450) return CRUSH_UP * (1 - easeIn((c - 1300) / 150));
    if (c < 1950) return 0;
    return CRUSH_UP * easeInOut((c - 1950) / 650);
  }
  lift(t: number) {
    return this.drive ?? this.beat(t);
  }
  release(t: number, down: boolean) {
    this.drive = null;
    this.base = down ? t - 1450 : t;
  }
  update(t: number, run: RunView) {
    const l = this.lift(t);
    if (this.lastLift > 6 && l <= 0.5 && near(run, this.x, 640)) {
      run.fx.burst('dust', 6, this.x - 40, this.y - 6, { dir: Math.PI, spread: 1 });
      run.fx.burst('dust', 6, this.x + 40, this.y - 6, { dir: 0, spread: 1 });
      if (this.drive === null) thump(0.22);
    }
    this.falling = l < this.lastLift - 0.5;
    this.lastLift = l;
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number) {
    const sx = this.x - cam;
    if (sx < -120 || sx > 1080) return;
    const l = this.lift(t);
    const falling = this.falling || l < CRUSH_UP * 0.4;
    // a tremble just before an idle drop
    const c = (((t - this.base) % 2600) + 2600) % 2600;
    const tremble = this.drive === null && c > 1050 && c < 1300 ? (Math.floor(t / 40) % 2 ? U : -U) : 0;
    pxEllipse(g, sx, this.y - U, 30 + 14 * (1 - l / CRUSH_UP), U * 2, 'rgba(0,0,0,.25)');
    drawStanding(g, CRUSHER[falling ? 1 : 0], sx + tremble, this.y - l + U * 2);
  }
}

registerObstacle('thwomp', (b) => {
  const start = b.x;
  b.add(80, 'flat');
  b.add(84, 'flat', 0, 'block');
  b.add(150, 'flat');
  const tx = start + 122;
  const floor = b.groundAt(tx) ?? b.y;
  const waitX = tx - 150;
  const landX = tx + 170;
  const cr = b.entity(new Crusher(tx, floor));
  const pc = cues();
  const fc = cues();
  let y0 = CRUSH_UP;
  const slamFx = (m: MarbleCtl, t: number, mag: number) => {
    thump(0.6 + mag * 0.05);
    m.fx.shake(t, mag, 200 + mag * 15);
    m.fx.burst('dust', 10, tx, floor - 6, { speed: 1.2 });
  };
  return {
    kind: 'thwomp',
    label: 'the crusher',
    waitX,
    pass: {
      dur: 1300,
      step(k, m, t) {
        pc.begin(k);
        if (pc.once('start')) y0 = cr.lift(t);
        // slam (or stay down), sit, lift; the marble dashes under; it slams behind
        let l;
        if (k < 0.12) l = y0 * (1 - easeIn(k / 0.12));
        else if (k < 0.25) l = 0;
        else if (k < 0.42) l = CRUSH_UP * ease(span(k, 0.25, 0.42));
        else if (k < 0.88) l = CRUSH_UP;
        else l = CRUSH_UP * (1 - easeIn(span(k, 0.88, 0.95)));
        cr.drive = l;
        if (k >= 0.12 && pc.once('slam1') && y0 > 6) slamFx(m, t, 4);
        if (k >= 0.95 && pc.once('slam2')) slamFx(m, t, 5);
        if (k < 0.42) {
          m.roll(waitX);
          if (k > 0.33) m.squash(0.84);
        } else if (k < 0.85) {
          if (pc.once('dash')) {
            whoosh(0.09, 0.3, 0, 500, 1600);
            note(76, { instrument: 'glock', level: 0.08 });
          }
          m.roll(waitX + (landX - waitX) * easeInOut(span(k, 0.42, 0.85)));
          if (Math.random() < 0.6) m.fx.add({ kind: 'dust', x: m.x - 30, y: m.y + 24, vx: -2, vy: -0.5, life: 0.6 });
        } else m.roll(landX);
        if (k >= 1) cr.release(t, true);
      }
    },
    fail: {
      dur: 1500,
      step(k, m, t) {
        fc.begin(k);
        if (fc.once('start')) y0 = cr.lift(t);
        let l;
        if (k < 0.15) l = y0 + (CRUSH_UP - y0) * ease(k / 0.15);
        else if (k < 0.45) l = CRUSH_UP;
        else if (k < 0.5) l = CRUSH_UP * (1 - easeIn(span(k, 0.45, 0.5)));
        else if (k < 0.7) l = 0;
        else l = CRUSH_UP * easeInOut(span(k, 0.7, 1));
        cr.drive = l;
        const stopX = tx - 39 - MR - 12;
        if (k < 0.25) m.roll(waitX + 30 * ease(k / 0.25));
        else if (k < 0.42) {
          m.roll(waitX + 30);
          if (fc.once('sweat')) m.fx.burst('sweat', 3, m.x + 18, m.y - 30, { speed: 0.5 });
        } else if (k < 0.5) {
          m.roll(waitX + 30 + (stopX - waitX - 30) * easeIn(span(k, 0.42, 0.5)));
        } else {
          if (fc.once('slam')) {
            slamFx(m, t, 9);
            m.bump('EEK');
          }
          const f = span(k, 0.5, 0.8);
          if (f < 1) {
            const p = hop(stopX, restOf(m, stopX), waitX - 30, restOf(m, waitX - 30), 50, ease(f));
            m.place(p.x, p.y);
            m.spin(-0.15);
          } else m.roll(waitX - 30);
        }
        if (k >= 1) cr.release(t, false);
      }
    }
  };
});

// ============================================================================
// spikes: a row of metal spikes; a big jump clears them, a short one bounces
// ============================================================================
const SPIKE_SEGS = 6;
const SPIKES = makeSprite(SPIKE_SEGS * 10, 12, (put) => {
  rect(put, 0, 9, SPIKE_SEGS * 10, 3, '#6f7a8a');
  rect(put, 0, 9, SPIKE_SEGS * 10, 1, '#b8c2d0');
  for (let i = 0; i < SPIKE_SEGS * 2; i++) {
    const c = i * 5 + 2.5;
    for (let y = 0; y < 9; y++) {
      const half = ((y + 1) * 2.5) / 9;
      for (let x = Math.floor(c - half); x < Math.ceil(c + half); x++) {
        put(x, y, x + 0.5 < c - 0.4 ? '#eef2f7' : x + 0.5 > c + 0.6 ? '#8f9aab' : '#c9d1dc');
      }
    }
  }
  for (let i = 0; i < SPIKE_SEGS; i++) {
    put(i * 10 + 5, 10, '#d4dbe5');
    put(i * 10 + 5, 11, '#3a3f49');
  }
});
class Spikes implements Entity {
  x: number;
  y: number;
  constructor(x0: number, groundY: number) {
    this.x = x0;
    this.y = groundY;
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number) {
    const sx = this.x - cam;
    if (sx < -200 || sx > 1000) return;
    drawSprite(g, SPIKES, sx - U, this.y - SPIKES.height * U + U);
    // a glint runs along the tips now and then
    const i = Math.floor(t / 70) % (SPIKE_SEGS * 2 + 14);
    if (i < SPIKE_SEGS * 2) {
      const tipX = r3(sx + (i * 5 + 2) * U);
      const tipY = this.y - SPIKES.height * U + U * 2;
      g.fillStyle = '#ffffff';
      g.fillRect(tipX, tipY, U, U * 2);
      g.fillRect(tipX - U, tipY + U, U * 3, U);
    }
  }
}

registerObstacle('spikes', (b) => {
  const jh = jumpScale(b);
  const waitX = b.x - 70;
  b.add(36, 'flat');
  const s0 = b.x;
  const gy = b.y;
  const len = SPIKE_SEGS * 10 * U;
  b.add(len, 'flat', 0, 'metal');
  const s1 = b.x;
  b.add(150, 'flat');
  const landX = s1 + 80;
  b.entity(new Spikes(s0, gy));
  const tipY = gy - 36; // top of the spikes
  const pc = cues();
  const fc = cues();
  return {
    kind: 'spikes',
    label: 'the spikes',
    waitX,
    pass: {
      dur: 1150,
      step(k, m) {
        pc.begin(k);
        if (k < 0.12) {
          m.roll(waitX);
          m.squash(0.78);
        } else if (k < 0.92) {
          if (pc.once('jump')) {
            whoosh(0.08, 0.35, 0, 600, 2000);
            note(79, { instrument: 'glock', level: 0.08 });
            note(86, { at: 0.08, instrument: 'glock', level: 0.06 });
          }
          const p = m.arc(waitX, landX, 190 * jh, span(k, 0.12, 0.92));
          m.place(p.x, p.y);
          m.spin(0.16);
        } else {
          m.roll(landX);
          if (pc.once('land')) {
            m.squash(0.75);
            m.fx.burst('puff', 4, landX, restOf(m, landX) + MR);
          }
        }
      }
    },
    fail: {
      dur: 1600,
      step(k, m, _t) {
        fc.begin(k);
        const hitX = s0 + 36;
        const hitY = tipY - MR;
        if (k < 0.1) {
          m.roll(waitX);
          m.squash(0.85);
        } else if (k < 0.42) {
          if (fc.once('jump')) note(72, { instrument: 'glock', level: 0.06 });
          const p = hop(waitX, restOf(m, waitX), hitX, hitY, 80, span(k, 0.1, 0.42));
          m.place(p.x, p.y);
        } else {
          if (fc.once('ouch')) {
            m.bump('OUCH');
            thump(0.5);
            note(83, { instrument: 'glock', level: 0.07 });
            note(71, { at: 0.08, instrument: 'marimba', level: 0.1 });
            m.fx.burst('spark', 8, hitX, tipY, { color: '#ffffff', speed: 0.7 });
          }
          const f = span(k, 0.42, 0.85);
          if (f < 1) {
            const p = hop(hitX, hitY, waitX - 30, restOf(m, waitX - 30), 110, f);
            m.place(p.x, p.y);
            m.spin(-0.2);
          } else m.roll(waitX - 30);
        }
      }
    }
  };
});
