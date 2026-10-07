import { makeSprite, rect, disc, poly, line, drawSprite, drawStanding, canvas, star, r3, U, W, H, INK } from '../../pixel';
import type { Sprite } from '../../pixel';
import { MR } from '../../marble';
import { thump, note, whoosh } from '../../audio';
import type { Builder, Entity, MarbleCtl, RunView } from '../types';
import type { ParticleKind } from '../../fx';
import { registerObstacle, ease, easeIn, easeInOut, span } from './registry';

// Sky obstacles for fly levels. There is no ground: restY is a lane in the
// sky (wings on the marble), so every move is placed by hand. m.fall() does
// nothing useful up here (fly mode has no gravity and the pit clip hides the
// marble at ground level), so a tumble is scripted with place() + hide() and
// ends in m.respawn(waitX).

// ---- shared helpers (space.ts uses these too) ----------------------------

// k === 0 is not guaranteed on a move's first frame (the move starts on the
// frame before its first step), so a move resets its flags when k goes back.
export function fresh() {
  let last = 2;
  return (k: number) => {
    const again = k < last;
    last = k;
    return again;
  };
}

// The fly lane, as level.ts lays it out (its FLY_LANE is not exported). Moves
// use m.restY; this is only for entities placed at build time.
export function skyLane(x: number) {
  return r3(200 + Math.sin(x / 260) * 26);
}

// where the marble rests at x while the level is being built
export function restAt(b: Builder, x: number) {
  if (b.mode === 'fly') return skyLane(x);
  return (b.groundAt(x) ?? b.BASE_Y) - MR;
}

export function laneOf(m: MarbleCtl, x: number) {
  return m.restY(x) ?? 200;
}

// a parabola between two free points (m.arc only knows resting heights)
export function curve(x0: number, y0: number, x1: number, y1: number, h: number, k: number) {
  return { x: x0 + (x1 - x0) * k, y: y0 + (y1 - y0) * k - h * 4 * k * (1 - k) };
}

// hangs around the top of a jump: floaty arcs in low gravity and gliding
export const linger = (s: number) => s + Math.sin(2 * Math.PI * s) * 0.08;

export function dot(g: CanvasRenderingContext2D, x: number, y: number, col: string, w = U, h = U) {
  g.fillStyle = col;
  g.fillRect(r3(x), r3(y), w, h);
}

export const onScreen = (x: number, cam: number, pad = 200) => x - cam > -pad && x - cam < W + pad;

// the bit of nature a level's wind carries
function windBits(b: Builder): { kind: ParticleKind; colors: string[] } {
  if (b.theme.weather === 'snow' || b.theme.weather === 'blizzard') return { kind: 'snow', colors: ['#fff'] };
  if (b.theme.weather === 'pages') return { kind: 'leaf', colors: ['#fff8e6', '#f4ead2'] };
  if (b.theme.terrain === 'moon' || b.theme.terrain === 'crystal' || b.theme.light === 'dream')
    return { kind: 'spark', colors: ['#ffe9a8', '#c9a8ff', '#9ff3ff'] };
  return { kind: 'leaf', colors: ['#7fd65a', '#5cb83f', '#ffd24a'] };
}

// ---- gust: a puffed-cheek cloud blows wind streaks down the lane ---------
const GUST_CLOUD = [0, 1].map((blowing) =>
  makeSprite(38, 28, (put) => {
    const puffs: [number, number, number][] = [
      [14, 15, 9],
      [22, 9, 9],
      [30, 13, 7.5],
      [25, 19, 8.5],
      [15, 21, 6.5],
      [32, 20, 5.5],
      [8, 12, 5]
    ];
    for (const [x, y, r] of puffs) disc(put, x, y, r, r * 0.85, '#ffffff', '#d4e1f5');
    for (const [x, y, r] of puffs) disc(put, x - r * 0.3, y - r * 0.35, r * 0.45, r * 0.35, '#ffffff');
    // cheeks puff out while it fills up, then a round blowing mouth
    const cheek = blowing ? 2.4 : 3.6;
    disc(put, 15, 17, cheek, cheek * 0.8, '#ffc0d4');
    disc(put, 25, 17, cheek * 0.8, cheek * 0.7, '#ffc0d4');
    // squeezed-shut eyes when blowing, wide eyes when inhaling
    if (blowing) {
      line(put, 13, 11, 16, 12, INK);
      line(put, 13, 13, 16, 12, INK);
      line(put, 21, 11, 24, 12, INK);
      line(put, 21, 13, 24, 12, INK);
    } else {
      rect(put, 14, 10, 2, 3, INK);
      put(14, 10, '#fff');
      rect(put, 22, 10, 2, 3, INK);
      put(22, 10, '#fff');
    }
    if (blowing) {
      disc(put, 8, 16, 2.6, 3, INK);
      put(8, 16, '#7a3a5a');
      put(7, 17, '#7a3a5a');
    } else {
      line(put, 8, 17, 11, 17, INK);
    }
    // brows angled down: it is really trying
    line(put, 12, 8, 16, 9, '#9aa9c4');
    line(put, 21, 9, 25, 8, '#9aa9c4');
  })
);

class Gust implements Entity {
  x: number;
  y: number;
  x0: number;
  x1: number;
  blastAt = -1e9;
  bits: { kind: ParticleKind; colors: string[] };
  constructor(x0: number, x1: number, cloudX: number, cloudY: number, bits: Gust['bits']) {
    this.x0 = x0;
    this.x1 = x1;
    this.x = cloudX;
    this.y = cloudY;
    this.bits = bits;
  }
  // 0..1: how hard the gust is blowing right now
  blast(t: number) {
    const d = t - this.blastAt;
    return d < 0 || d > 1100 ? 0 : d < 150 ? d / 150 : 1 - (d - 150) / 950;
  }
  blowing(t: number) {
    return this.blast(t) > 0 || t % 2000 > 900;
  }
  update(t: number, run: RunView) {
    if (Math.abs(this.x - run.marbleX) > 900) return;
    const strong = this.blast(t);
    if (Math.random() < (this.blowing(t) ? 0.12 : 0.03) + strong * 0.4) {
      const c = this.bits.colors[Math.floor(Math.random() * this.bits.colors.length)];
      run.fx.add({
        kind: this.bits.kind,
        x: this.x - 40,
        y: this.y + 40 + Math.random() * 90,
        vx: -4 - Math.random() * 3 - strong * 5,
        vy: -0.6 + Math.random() * 1.2,
        color: c,
        life: 1
      });
    }
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number) {
    if (!onScreen(this.x, cam, 520)) return;
    const strong = this.blast(t);
    const blowing = this.blowing(t);
    // wind streaks with a curl at the head, sliding left down the lane
    const n = 7 + Math.round(strong * 4);
    const span0 = this.x1 - this.x0 + 260;
    for (let i = 0; i < n; i++) {
      const speed = (blowing ? 0.42 : 0.2) + strong * 0.6;
      const head = this.x1 + 80 - ((t * speed + i * 137) % span0);
      const y = skyLane(head) + (i - n / 2) * 19 + Math.sin(t / 300 + i * 1.7) * 6;
      const len = 42 + ((i * 29) % 44);
      const edge = Math.min(1, (head - (this.x0 - 160)) / 120, (this.x1 + 80 - head) / 80);
      g.globalAlpha = Math.max(0, edge) * (0.45 + strong * 0.45);
      for (let d = 0; d < len; d += U) dot(g, head - cam + d, y + Math.sin((head + d) / 26) * 3, '#ffffff');
      for (let a = 0; a < Math.PI * 1.6; a += 0.4) {
        const r = 9 * (1 - (a / (Math.PI * 2)) * 0.7);
        dot(g, head - cam + Math.sin(-a) * r, y - 9 + Math.cos(a) * r, '#eef6ff');
      }
    }
    g.globalAlpha = 1;
    const s = GUST_CLOUD[blowing ? 1 : 0];
    const bob = Math.sin(t / 500) * 4;
    const jx = strong ? (Math.random() - 0.5) * 6 * strong : 0;
    const puff = blowing ? 1 : 1 + Math.sin(t / 120) * 0.04;
    const sc = U * puff;
    drawSprite(g, s, this.x - cam - (s.width * sc) / 2 + jx, this.y - (s.height * sc) / 2 + bob, sc);
  }
}

registerObstacle('gust', (b) => {
  const waitX = b.x - 80;
  const gx = b.x;
  b.add(360, 'flat');
  const cloudX = gx + 300;
  const gust = b.entity(new Gust(gx - 40, gx + 300, cloudX, skyLane(cloudX) - 112, windBits(b)));
  const landX = b.x + 40;
  b.add(60, 'flat');
  const restart = fresh();
  let blown = false;
  const lunge = gx + 70;
  return {
    kind: 'gust',
    label: 'the gust',
    waitX,
    pass: {
      dur: 1600,
      step(k, m, t) {
        if (restart(k)) whoosh(0.07, 0.9, 0, 1400, 500);
        // pushing into the wind: slow in the middle, flapping hard
        const x = waitX + (landX - waitX) * easeInOut(k);
        m.place(x, laneOf(m, x) + Math.sin(k * Math.PI * 7) * 7);
        m.squash(0.9 + Math.abs(Math.sin(t / 45)) * 0.1);
        if (Math.random() < 0.4) m.fx.add({ kind: 'puff', x: x - MR - 6, y: m.y + (Math.random() - 0.5) * 30, vx: -3, vy: 0, life: 0.6 });
        if (k > 0.3 && k < 0.7 && Math.random() < 0.25) m.fx.add({ kind: 'sweat', x: x + 10, y: m.y - MR, vx: -2, vy: -2, life: 0.8 });
      }
    },
    fail: {
      dur: 1700,
      step(k, m, t) {
        if (restart(k)) blown = false;
        if (k < 0.3) {
          const x = waitX + (lunge - waitX) * ease(k / 0.3);
          m.place(x, laneOf(m, x));
          return;
        }
        if (!blown) {
          blown = true;
          gust.blastAt = t;
          whoosh(0.18, 0.8, 0, 2400, 250);
          m.bump('WHOA!');
          m.fx.burst('puff', 10, lunge + MR, m.y, { speed: 0.8 });
        }
        if (k < 0.8) {
          // tossed backward in a loop, spinning
          const s = span(k, 0.3, 0.8);
          const x = lunge + (waitX - 60 - lunge) * ease(s);
          m.place(x, laneOf(m, x) - Math.sin(s * Math.PI) * 80);
          m.spin(-0.38 * (1 - s * 0.6));
        } else {
          const s = span(k, 0.8, 1);
          const x = waitX - 60 + 60 * ease(s);
          m.place(x, laneOf(m, x));
        }
      }
    }
  };
});

// ---- bird: a flock in V formation bobs across the lane -------------------
const BIRD = [0, 1, 2].map((f) =>
  makeSprite(21, 16, (put) => {
    poly(put, [[15, 8], [20, 4], [20, 7], [18, 9], [20, 12], [16, 11]], '#2f6fb8');
    disc(put, 11, 9, 6.5, 5, '#4a9de8', '#2f6fb8', '#8cc8ff');
    disc(put, 10, 11, 4, 2.4, '#ffffff');
    disc(put, 6, 6.5, 3.8, 3.5, '#4a9de8', undefined, '#8cc8ff');
    put(5, 3, '#2f6fb8');
    put(6, 2, '#2f6fb8');
    poly(put, [[0, 7], [3, 5.5], [3, 8.5]], '#ffb43a');
    put(4, 5, INK);
    put(5, 5, '#ffffff');
    put(4, 8, '#ff9db0');
    // wing: up, level, down
    if (f === 0) poly(put, [[9, 7], [13, 0], [16, 1], [14, 8]], '#2f6fb8');
    else if (f === 1) poly(put, [[9, 8], [16, 6], [17, 8], [14, 10]], '#2f6fb8');
    else poly(put, [[9, 9], [14, 15], [16, 14], [14, 9]], '#2f6fb8');
    put(10, 14, '#ffb43a');
    put(12, 14, '#ffb43a');
  })
);
const BIRD_DIZZY = makeSprite(21, 16, (put) => {
  disc(put, 11, 9, 6.5, 5, '#4a9de8', '#2f6fb8', '#8cc8ff');
  disc(put, 10, 11, 4, 2.4, '#ffffff');
  disc(put, 6, 6.5, 3.8, 3.5, '#4a9de8', undefined, '#8cc8ff');
  poly(put, [[0, 7], [3, 5.5], [3, 8.5]], '#ffb43a');
  put(3, 4, INK);
  put(5, 6, INK);
  put(5, 4, INK);
  put(3, 6, INK);
  put(4, 5, INK);
  poly(put, [[15, 8], [20, 4], [20, 12]], '#2f6fb8');
  poly(put, [[9, 8], [5, 14], [8, 15], [13, 10]], '#2f6fb8');
});
const FLOCK: [number, number, number][] = [
  [0, 0, 0],
  [48, -34, 1],
  [52, 32, 2]
];

class Flock implements Entity {
  x: number;
  y: number;
  liftAt = -1e9;
  holdAt = -1e9;
  hitAt = -1e9;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  // 1 while a failing marble flies in (the leader holds the lane for it)
  hold(t: number) {
    const d = t - this.holdAt;
    return d < 0 || d > 1700 ? 0 : d < 300 ? d / 300 : d > 1400 ? (1700 - d) / 300 : 1;
  }
  lift(t: number) {
    return Math.min(1, Math.max(0, (t - this.liftAt) / 450));
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number) {
    if (!onScreen(this.x, cam)) return;
    const hold = this.hold(t);
    const lift = ease(this.lift(t));
    const hit = t - this.hitAt;
    for (let i = 0; i < FLOCK.length; i++) {
      const [dx, dy, ph] = FLOCK[i];
      const lead = i === 0;
      const calm = lead ? 1 - hold : 1;
      let x = this.x + dx + Math.sin(t / 900 + ph) * 16 * calm;
      let y = this.y + dy + Math.sin(t / 520) * 34 * calm + Math.sin(t / 300 + ph) * 4;
      // the flock rises out of the way (and spreads) when the marble dips under
      y -= lift * (110 + i * 14);
      x += lift * (i - 1) * 16;
      let s = BIRD[Math.floor(t / 110 + ph) % 3];
      if (lead && hit < 900) {
        s = BIRD_DIZZY;
        x += Math.sin(hit / 60) * 10 * (1 - hit / 900) + 20 * (1 - hit / 900);
      }
      drawSprite(g, s, x - cam - (s.width * U) / 2, y - (s.height * U) / 2);
      if (lead && hit < 900) {
        g.fillStyle = '#ffe14a';
        for (let j = 0; j < 3; j++) {
          const a = hit / 150 + (j * Math.PI * 2) / 3;
          star(g, x - cam + Math.cos(a) * 26, y - 30 + Math.sin(a) * 7, 6);
        }
      }
    }
  }
}

registerObstacle('bird', (b) => {
  const waitX = b.x - 80;
  const fx0 = b.x + 160;
  b.add(320, 'flat');
  const flock = b.entity(new Flock(fx0, skyLane(fx0)));
  const landX = b.x + 60;
  b.add(80, 'flat');
  const restart = fresh();
  let hit = false;
  let tweet = false;
  const contact = fx0 - 62;
  return {
    kind: 'bird',
    label: 'the birds',
    waitX,
    pass: {
      dur: 1350,
      step(k, m, t) {
        if (restart(k)) {
          tweet = false;
          flock.liftAt = t;
          whoosh(0.05, 0.5, 0, 1600, 600);
        }
        // a swoop under the rising flock
        const x = waitX + (landX - waitX) * easeInOut(k);
        m.place(x, laneOf(m, x) + Math.sin(k * Math.PI) * 60);
        m.spin(0.04);
        if (!tweet && k > 0.45) {
          tweet = true;
          note(91, { instrument: 'glock', level: 0.07 });
          note(96, { at: 0.08, instrument: 'glock', level: 0.06 });
          note(93, { at: 0.16, instrument: 'glock', level: 0.05 });
        }
      }
    },
    fail: {
      dur: 1500,
      step(k, m, t) {
        if (restart(k)) {
          hit = false;
          flock.holdAt = t;
        }
        if (k < 0.35) {
          const x = waitX + (contact - waitX) * easeIn(k / 0.35);
          m.place(x, laneOf(m, x) + (flock.y - skyLane(x)) * (k / 0.35));
          return;
        }
        if (!hit) {
          hit = true;
          flock.hitAt = t;
          m.bump('BONK');
          note(62, { instrument: 'marimba', level: 0.12 });
          note(91, { at: 0.05, instrument: 'glock', level: 0.06 });
          const fy = m.y;
          m.fx.burst('leaf', 10, contact + MR, fy, { color: '#ffffff', speed: 0.6, up: 1 });
          m.fx.burst('leaf', 6, contact + MR, fy, { color: '#8cc8ff', speed: 0.5, up: 1 });
          m.fx.burst('puff', 6, contact + MR, fy, { speed: 0.6 });
        }
        const s = span(k, 0.35, 1);
        const p = curve(contact, flock.y, waitX, laneOf(m, waitX), -50, ease(s));
        m.place(p.x, p.y);
        m.spin(-0.22 * (1 - s));
      }
    }
  };
});

// ---- hoop: a golden ring to fly through (back half behind the marble) ----
function ringSprite(rx: number) {
  const ry = 23;
  const th = 3.4;
  const w = Math.ceil(rx * 2) + 3;
  const h = ry * 2 + 3;
  const cx = w / 2;
  const cy = h / 2;
  return makeSprite(w, h, (put) => {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        if ((dx / rx) ** 2 + (dy / ry) ** 2 > 1) continue;
        if ((dx / (rx - th)) ** 2 + (dy / (ry - th)) ** 2 < 1) continue;
        // lit from the top left; the inner edge shaded
        let c = '#ffcb32';
        if (dy > ry * 0.3 || (dx > rx * 0.45 && dy > -ry * 0.2)) c = '#d99a12';
        if (dy < -ry * 0.55 && dx < rx * 0.2) c = '#fff0a0';
        if (dx < -rx * 0.6 && dy < ry * 0.2 && dy > -ry * 0.5) c = '#ffe27a';
        const inner = (dx / (rx - th + 1)) ** 2 + (dy / (ry - th + 1)) ** 2 < 1;
        if (inner) c = '#b07a08';
        put(x, y, c);
      }
    }
  });
}
// the near (left) half, cropped from the outlined ring so the cut has no ink
function leftHalf(s: Sprite) {
  const c = canvas(s.width, s.height);
  const p = c.getContext('2d')!;
  p.drawImage(s, 0, 0, Math.ceil(s.width / 2), s.height, 0, 0, Math.ceil(s.width / 2), s.height);
  return c;
}
const HOOP_RX = [10, 9.4, 8.6, 8, 8.6, 9.4];
let hoopFrames: { back: Sprite; front: Sprite }[] | null = null;
function hoops() {
  if (!hoopFrames) hoopFrames = HOOP_RX.map((rx) => {
    const back = ringSprite(rx);
    return { back, front: leftHalf(back) };
  });
  return hoopFrames;
}

class Hoop implements Entity {
  x: number;
  y: number;
  front: boolean;
  state: { passedAt: number; hitAt: number };
  constructor(x: number, y: number, front: boolean, state: Hoop['state']) {
    this.x = x;
    this.y = y;
    this.front = front;
    this.state = state;
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number) {
    if (!onScreen(this.x, cam)) return;
    const f = hoops()[Math.floor(t / 150) % HOOP_RX.length];
    const s = this.front ? f.front : f.back;
    const hit = t - this.state.hitAt;
    const wob = hit < 800 ? Math.sin(hit / 45) * 8 * (1 - hit / 800) : 0;
    const passed = t - this.state.passedAt;
    const bob = Math.sin(t / 600) * 3;
    const x = this.x - cam - (f.back.width * U) / 2 + wob;
    const y = this.y - (f.back.height * U) / 2 + bob;
    drawSprite(g, s, x, y, U, { white: passed < 160 || hit < 90 });
    if (this.front) {
      // a gleam running round the near half, and twinkles
      const a = t / 450;
      dot(g, this.x - cam + wob - Math.abs(Math.cos(a)) * 26, this.y + bob + Math.sin(a) * 62, '#ffffff', U * 2, U);
      g.fillStyle = '#fff6c4';
      for (let i = 0; i < 3; i++) {
        const ph = (t / 900 + i / 3) % 1;
        if (ph > 0.3) continue;
        const ang = i * 2.1 + Math.floor(t / 900);
        g.globalAlpha = 1 - ph / 0.3;
        star(g, this.x - cam + Math.cos(ang) * 46, this.y + bob + Math.sin(ang) * 84, 6);
      }
      g.globalAlpha = 1;
    }
    // a gold shockwave ring after a clean pass
    if (!this.front && passed < 500) {
      const k = passed / 500;
      g.globalAlpha = 1 - k;
      const n = 20;
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2;
        dot(g, this.x - cam + Math.cos(ang) * (30 + k * 70), this.y + bob + Math.sin(ang) * (70 + k * 60), '#ffe27a', U * 2, U * 2);
      }
      g.globalAlpha = 1;
    }
  }
}

registerObstacle('hoop', (b) => {
  const waitX = b.x - 80;
  const hx = b.x + 150;
  b.add(270, 'flat');
  const hy = skyLane(hx);
  const state = { passedAt: -1e9, hitAt: -1e9 };
  b.entity(new Hoop(hx, hy, false, state));
  b.entity(new Hoop(hx, hy, true, state));
  const landX = b.x + 60;
  b.add(80, 'flat');
  const restart = fresh();
  let through = false;
  let clipped = false;
  const rimX = hx - 26;
  const rimY = hy - 64;
  return {
    kind: 'hoop',
    label: 'the ring',
    waitX,
    pass: {
      dur: 1200,
      step(k, m, t) {
        if (restart(k)) through = false;
        const x = waitX + (landX - waitX) * easeInOut(k);
        m.place(x, laneOf(m, x));
        if (!through && x >= hx) {
          through = true;
          state.passedAt = t;
          m.fx.burst('star', 12, hx, hy, { color: '#ffcb32', speed: 0.9 });
          m.fx.burst('sparkle', 10, hx, hy);
          m.fx.text('NICE!', hx, hy - 90, '#ffe27a', 12);
          [84, 88, 91, 96].forEach((n, i) => note(n, { at: i * 0.05, instrument: 'glock', level: 0.08 }));
        }
      }
    },
    fail: {
      dur: 1350,
      step(k, m, t) {
        if (restart(k)) clipped = false;
        if (k < 0.4) {
          // aims high and catches the rim
          const p = curve(waitX, laneOf(m, waitX), rimX - MR + 6, rimY, 20, ease(k / 0.4));
          m.place(p.x, p.y);
          return;
        }
        if (!clipped) {
          clipped = true;
          state.hitAt = t;
          m.bump('BONK');
          thump(0.3);
          note(60, { instrument: 'marimba', level: 0.12 });
          m.fx.burst('spark', 8, rimX, rimY + 20, { color: '#ffcb32', speed: 0.6 });
        }
        const s = span(k, 0.4, 1);
        const p = curve(rimX - MR + 6, rimY, waitX, laneOf(m, waitX), 40, ease(s));
        m.place(p.x, p.y);
        m.spin(-0.25 * (1 - s));
      }
    }
  };
});

// ---- island: a floating grassy island to land on and spring off ----------
const ISLAND = makeSprite(58, 42, (put) => {
  // the earthy underside, tapering to a point, with hanging roots
  for (let y = 9; y < 34; y++) {
    const f = (y - 9) / 25;
    const half = 28 * (1 - Math.pow(f, 1.25));
    const wob = Math.sin(y * 1.7) * 1.3;
    const x0 = Math.round(29 - half + wob);
    const x1 = Math.round(29 + half - wob * 0.6);
    for (let x = x0; x <= x1; x++) {
      let c = '#c98f4e';
      if (x > 29 + half * 0.3) c = '#a26e38';
      if (x < 29 - half * 0.6) c = '#d9a464';
      if (y > 20 && (x + y * 2) % 7 === 0) c = '#8a5a2c';
      if ((x * 7 + y * 13) % 29 === 0) c = '#f0c890';
      put(x, y, c);
    }
  }
  for (const [x, len] of [[18, 6], [24, 9], [33, 7], [38, 5], [29, 8]] as [number, number][]) {
    for (let i = 0; i < len; i++) put(x + (i > len / 2 ? 1 : 0), 28 + i, i < 2 ? '#8a5a2c' : '#6b8f3a');
  }
  // the grass cap, dripping over the rim
  for (let x = 1; x < 57; x++) {
    const top = x < 4 || x > 53 ? 7 : 6;
    for (let y = top; y < 11; y++) put(x, y, y === top ? '#9be05e' : '#5cb83f');
    if (x % 5 === 2) put(x, 11, '#5cb83f');
    if (x % 9 === 4) put(x, 12, '#5cb83f');
  }
  for (const x of [5, 14, 31, 44, 52]) {
    put(x, 5, '#5cb83f');
    put(x + 1, 4, '#9be05e');
    put(x + 2, 5, '#5cb83f');
  }
  // flowers
  for (const [x, c] of [[9, '#ff6fa8'], [21, '#ffe14a'], [38, '#ffffff'], [48, '#ff6fa8']] as [number, string][]) {
    put(x, 4, c);
    put(x - 1, 5, c);
    put(x + 1, 5, c);
    put(x, 5, '#ffcb32');
    put(x, 6, '#3f8f2f');
  }
});
const TREE = makeSprite(24, 30, (put) => {
  rect(put, 10, 16, 4, 14, '#8a5a2c');
  rect(put, 10, 16, 1, 14, '#b07a44');
  put(9, 29, '#8a5a2c');
  put(14, 29, '#8a5a2c');
  line(put, 13, 20, 17, 16, '#8a5a2c');
  disc(put, 12, 9, 9.5, 8.5, '#3f9b3a', '#2c7a2c', '#7fd65a');
  disc(put, 5, 13, 5, 4.5, '#3f9b3a', '#2c7a2c');
  disc(put, 19, 13, 5, 4.5, '#3f9b3a', '#2c7a2c');
  disc(put, 9, 6, 3, 2.5, '#5cb83f');
  for (const [x, y] of [[7, 10], [16, 8], [13, 14], [20, 12]] as [number, number][]) {
    put(x, y, '#ff4d4d');
    put(x, y - 1, '#ffb0b0');
  }
});

class Island implements Entity {
  x: number;
  y: number; // the grass top, at rest
  landAt = -1e9;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  top(t: number) {
    const d = t - this.landAt;
    const dip = d >= 0 && d < 450 ? Math.sin((d / 450) * Math.PI) * 10 : 0;
    return r3(this.y + Math.sin(t / 800) * 4 + dip);
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number) {
    if (!onScreen(this.x, cam)) return;
    const top = this.top(t);
    const sx = this.x - cam;
    // a thin trickle of water off the far edge
    for (let i = 0; i < 9; i++) {
      const fall = (t * 0.12 + i * 13) % 120;
      g.globalAlpha = 1 - fall / 120;
      dot(g, sx + 72 + (fall > 30 ? U : 0), top + 18 + fall, i % 3 ? '#9fdcff' : '#ffffff', U, U * 2);
    }
    g.globalAlpha = 1;
    drawSprite(g, ISLAND, sx - (ISLAND.width * U) / 2, top - 7 * U);
    drawStanding(g, TREE, sx + 48, top + 2 * U);
  }
}

registerObstacle('island', (b) => {
  const waitX = b.x - 80;
  const ix = b.x + 170;
  b.add(340, 'flat');
  const island = b.entity(new Island(ix, skyLane(ix) + MR + 18));
  const landX = b.x + 70;
  b.add(80, 'flat');
  const restart = fresh();
  let landed = false;
  let leapt = false;
  let slipped = false;
  let gone = false;
  let back = false;
  const padX = ix - 34;
  const edgeX = ix - (ISLAND.width * U) / 2;
  return {
    kind: 'island',
    label: 'the floating island',
    waitX,
    pass: {
      dur: 1900,
      step(k, m, t) {
        if (restart(k)) landed = leapt = false;
        const top = island.top(t) - MR;
        if (k < 0.38) {
          const p = curve(waitX, laneOf(m, waitX), padX, top, 90, k / 0.38);
          m.place(p.x, p.y);
          m.spin(0.1);
        } else if (k < 0.52) {
          if (!landed) {
            landed = true;
            island.landAt = t;
            m.squash(0.62);
            thump(0.25);
            note(79, { instrument: 'glock', level: 0.09 });
            m.fx.burst('leaf', 8, padX, top + MR, { color: '#7fd65a', speed: 0.6 });
            m.fx.burst('puff', 5, padX, top + MR, { speed: 0.5 });
          }
          const x = padX + 24 * span(k, 0.38, 0.52);
          m.place(x, top);
        } else {
          if (!leapt) {
            leapt = true;
            m.squash(0.7);
            note(86, { instrument: 'glock', level: 0.09 });
            note(91, { at: 0.07, instrument: 'glock', level: 0.07 });
          }
          const p = curve(padX + 24, top, landX, laneOf(m, landX), 150, linger(span(k, 0.52, 1)));
          m.place(p.x, p.y);
          m.spin(0.12);
        }
      }
    },
    fail: {
      dur: 2400,
      step(k, m, t) {
        if (restart(k)) slipped = gone = back = false;
        const top = island.top(t) - MR;
        if (k < 0.33) {
          // comes up short of the grass
          const p = curve(waitX, laneOf(m, waitX), edgeX - MR + 4, top + 22, 50, k / 0.33);
          m.place(p.x, p.y);
          return;
        }
        if (!slipped) {
          slipped = true;
          m.bump('WHOOPS');
          note(64, { instrument: 'marimba', level: 0.12 });
          note(59, { at: 0.12, instrument: 'marimba', level: 0.1 });
          m.fx.burst('dust', 6, edgeX, top + MR);
          whoosh(0.08, 0.7, 0.1, 900, 150);
        }
        if (k < 0.72) {
          // tumbles away below the island and out of the sky
          const s = span(k, 0.33, 0.72);
          m.place(edgeX - MR + 4 - 50 * s, top + 22 + easeIn(s) * (H + 120 - top));
          m.spin(0.32);
        } else if (!gone) {
          gone = true;
          m.hide(true);
        }
        if (k > 0.84 && !back) {
          back = true;
          m.respawn(waitX);
          note(84, { instrument: 'bell', level: 0.07 });
        }
        if (gone && !back) m.place(waitX, H + 140);
      }
    }
  };
});
