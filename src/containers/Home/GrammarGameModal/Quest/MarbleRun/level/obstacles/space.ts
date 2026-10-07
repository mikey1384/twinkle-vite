import { makeSprite, poly, drawSprite, hash2, star, r3, U, H } from '../../pixel';
import type { Sprite } from '../../pixel';
import { MR } from '../../marble';
import { thump, note, whoosh } from '../../audio';
import { paletteOf } from '../terrain';
import type { Builder, Entity, MarbleCtl } from '../types';
import { registerObstacle, ease, easeIn, easeInOut, span } from './registry';
import { fresh, skyLane, curve, linger, laneOf, dot, onScreen } from './sky';

// Space obstacles: low-gravity moon levels (the marble wears a helmet and
// every jump is a long floaty arc) plus asteroids, which also cross the fly
// lanes of space sky levels.

// ---- asteroid: tumbling rocks drift across; weave through them ------------
const ROCK = { base: '#8f8296', dark: '#605468', light: '#c2b6c8', pit: '#4e4458', rim: '#b3a6ba' };

// eight tumble frames: the outline and craters turn, the light stays put
function rockFrames(r: number, seed: number, gem: boolean): Sprite[] {
  const edge = (a: number) => 0.84 + 0.1 * Math.sin(3 * a + seed) + 0.06 * Math.sin(5 * a + seed * 2.3);
  const craters: [number, number, number][] = [
    [0.4, 0.8 + seed, 0.26],
    [0.45, 2.7 + seed, 0.2],
    [0.5, 4.4 + seed, 0.16]
  ];
  const size = r * 2 + 3;
  const c = size / 2;
  return Array.from({ length: 8 }, (_, f) => {
    const rot = (f / 8) * Math.PI * 2;
    return makeSprite(size, size, (put) => {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const dx = x + 0.5 - c;
          const dy = y + 0.5 - c;
          const d = Math.hypot(dx, dy);
          if (d > r * edge(Math.atan2(dy, dx) - rot)) continue;
          const lit = (dx * 0.6 + dy * 0.8) / r;
          let col = lit > 0.35 ? ROCK.dark : lit < -0.45 ? ROCK.light : ROCK.base;
          for (const [dist, ang, cr] of craters) {
            const cx = c + Math.cos(ang + rot) * dist * r;
            const cy = c + Math.sin(ang + rot) * dist * r;
            const dd = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
            if (dd < cr * r) col = y + 0.5 - cy > cr * r * 0.35 ? ROCK.rim : ROCK.pit;
          }
          put(x, y, col);
        }
      }
      if (gem) {
        // a little crystal stuck in the rock, turning with it
        const gx = c + Math.cos(rot + 5.5) * r * 0.45;
        const gy = c + Math.sin(rot + 5.5) * r * 0.45;
        put(gx, gy, '#9ff3ff');
        put(gx + 1, gy, '#5fd0f0');
        put(gx, gy - 1, '#ffffff');
        put(gx, gy + 1, '#5fd0f0');
      }
    });
  });
}
let rockSets: Sprite[][] | null = null;
function rocks() {
  if (!rockSets) rockSets = [rockFrames(11, 0.3, false), rockFrames(9, 1.9, true), rockFrames(12, 3.1, false)];
  return rockSets;
}

class Rock implements Entity {
  x: number;
  y: number;
  hx: number;
  hy: number;
  set: number;
  dir: [number, number];
  ph: number;
  spinMs: number;
  charge: { at: number; x: number; y: number } | null = null;
  constructor(x: number, y: number, set: number, dir: [number, number], spinMs: number) {
    this.x = this.hx = x;
    this.y = this.hy = y;
    this.set = set;
    this.dir = dir;
    this.ph = set * 1.9;
    this.spinMs = spinMs;
  }
  // a failing marble gets a rock swung into it, which then drifts home
  rush(t: number, x: number, y: number) {
    this.charge = { at: t, x, y };
  }
  pos(t: number) {
    const sway = Math.sin(t / 1100 + this.ph) * 16;
    let x = this.hx + this.dir[0] * sway;
    let y = this.hy + this.dir[1] * sway;
    if (this.charge) {
      const d = t - this.charge.at;
      const w = d < 0 ? 0 : d < 380 ? easeIn(d / 380) : d < 800 ? 1 : d < 1500 ? 1 - ease((d - 800) / 700) : 0;
      x += (this.charge.x - x) * w;
      y += (this.charge.y - y) * w;
    }
    return { x, y };
  }
  update(t: number) {
    const p = this.pos(t);
    this.x = p.x;
    this.y = p.y;
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number) {
    if (!onScreen(this.x, cam)) return;
    const frames = rocks()[this.set];
    const s = frames[Math.floor(t / this.spinMs + this.ph * 3) % frames.length];
    // faint dust trailing the way it came
    for (let i = 1; i <= 3; i++) {
      g.globalAlpha = 0.35 - i * 0.09;
      dot(g, this.x - cam - this.dir[0] * 22 * i, this.y - this.dir[1] * 22 * i - 6 * i, '#d9cfe0', U * 2, U * 2);
    }
    g.globalAlpha = 1;
    drawSprite(g, s, this.x - cam - (s.width * U) / 2, this.y - (s.height * U) / 2);
  }
}

// pebbles streaming diagonally through the field, behind everything
class Pebbles implements Entity {
  x: number;
  y: number;
  x0: number;
  x1: number;
  top: number;
  bottom: number;
  constructor(x0: number, x1: number, top: number, bottom: number) {
    this.x0 = x0;
    this.x1 = x1;
    this.x = (x0 + x1) / 2;
    this.y = top;
    this.top = top;
    this.bottom = bottom;
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number) {
    if (!onScreen(this.x, cam, 500)) return;
    const w = this.x1 - this.x0;
    const h = this.bottom - this.top;
    for (let i = 0; i < 12; i++) {
      const p = (t / (2600 + i * 170) + i * 0.37) % 1;
      const x = this.x1 - ((i * 97) % w) - p * 160;
      const y = this.top + ((i * 53) % h) * 0.4 + p * h * 0.8;
      g.globalAlpha = Math.sin(p * Math.PI) * 0.8;
      const z = i % 3 === 0 ? U * 2 : U;
      dot(g, x - cam, y, i % 4 === 0 ? '#c2b6c8' : '#8f8296', z, z);
    }
    g.globalAlpha = 1;
  }
}

registerObstacle('asteroid', (b: Builder) => {
  const fly = b.mode === 'fly';
  const waitX = b.x - 80;
  const ax = b.x + 130;
  const g0 = b.y;
  b.add(460, 'flat');
  const landX = b.x + 50;
  b.add(60, 'flat');
  const diag: [number, number] = [-0.6, 0.8];
  const A = fly ? new Rock(ax, skyLane(ax) - 78, 0, diag, 150) : new Rock(ax - 30, g0 - 185, 0, diag, 170);
  const B = fly ? new Rock(ax + 125, skyLane(ax + 125) + 72, 1, diag, 120) : new Rock(ax + 120, g0 - 30, 1, [1, 0], 130);
  const C = fly ? new Rock(ax + 250, skyLane(ax + 250) - 78, 2, diag, 190) : new Rock(ax + 260, g0 - 175, 2, diag, 200);
  b.entity(new Pebbles(ax - 120, ax + 360, fly ? skyLane(ax) - 150 : g0 - 280, fly ? skyLane(ax) + 150 : g0 - 60));
  for (const r of [A, B, C]) b.entity(r);
  const restart = fresh();
  let hit = false;
  // the fly weave: under A, over B, under C
  const weave = (m: MarbleCtl, x: number) => {
    const pts: [number, number][] = [
      [waitX, 0],
      [ax, 48],
      [ax + 125, -56],
      [ax + 250, 48],
      [landX, 0]
    ];
    let i = 0;
    while (i < pts.length - 2 && x > pts[i + 1][0]) i++;
    const [xa, ya] = pts[i];
    const [xb, yb] = pts[i + 1];
    const s = Math.max(0, Math.min(1, (x - xa) / (xb - xa)));
    return laneOf(m, x) + ya + (yb - ya) * (1 - Math.cos(s * Math.PI)) / 2;
  };
  // where the marble meets the rock on a miss
  const hitX = fly ? ax - 80 : ax + 40;
  return {
    kind: 'asteroid',
    label: 'the asteroids',
    waitX,
    pass: {
      dur: fly ? 1900 : 2300,
      step(k, m) {
        if (restart(k)) whoosh(0.05, 0.8, 0, 1200, 400);
        if (fly) {
          const x = waitX + (landX - waitX) * easeInOut(k);
          m.place(x, weave(m, x));
          m.spin(0.05);
          return;
        }
        // roll under the high rock, a long floaty hop over the low one
        const R = laneOf(m, ax);
        if (k < 0.25) m.roll(waitX + (ax + 10 - waitX) * ease(k / 0.25));
        else if (k < 0.8) {
          const s = span(k, 0.25, 0.8);
          const p = curve(ax + 10, R, ax + 230, R, 150, linger(s));
          m.place(p.x, p.y);
          m.spin(0.07);
          if (s < 0.05) m.fx.burst('dust', 2, ax + 10, R + MR);
        } else m.roll(ax + 230 + (landX - ax - 230) * ease(span(k, 0.8, 1)));
      }
    },
    fail: {
      dur: fly ? 1500 : 2300,
      step(k, m, t) {
        if (restart(k)) {
          hit = false;
          const rock = fly ? A : B;
          const ty = laneOf(m, hitX) - (fly ? 12 : 0) + (fly ? 0 : 6);
          rock.rush(t + (fly ? 120 : 400), hitX + MR + (fly ? 30 : 26), ty);
        }
        const at = fly ? 0.35 : 0.36;
        if (k < at) {
          const x = waitX + (hitX - waitX) * ease(k / at);
          if (fly) m.place(x, laneOf(m, x));
          else m.roll(x);
          return;
        }
        if (!hit) {
          hit = true;
          m.bump('BONK');
          thump(0.45);
          note(55, { instrument: 'marimba', level: 0.12 });
          m.fx.burst('frag', 8, hitX + MR, m.y, { color: ROCK.base, speed: 0.6 });
          m.fx.burst('star', 4, hitX + MR, m.y - 20, { color: '#ffe14a', speed: 0.5 });
        }
        const s = span(k, at, 1);
        const p = curve(hitX, laneOf(m, hitX), waitX, laneOf(m, waitX), fly ? 30 : 70, fly ? ease(s) : linger(s));
        m.place(p.x, p.y);
        m.spin(-0.25 * (1 - s));
      }
    }
  };
});

// ---- crater: a wide crater to float across -------------------------------
type Pal = ReturnType<typeof paletteOf>;
const rimCache = new Map<string, Sprite>();
function rimSprite(pal: Pal) {
  const hit = rimCache.get(pal.top);
  if (hit) return hit;
  // a lip of rock rising toward the crater edge (on the right)
  const s = makeSprite(15, 7, (put) => {
    poly(put, [[0, 7], [5, 4], [10, 1], [13, 0], [15, 2], [15, 7]], pal.body);
    poly(put, [[0, 7], [5, 4], [10, 1], [13, 0], [13, 2], [6, 5]], pal.top);
    put(11, 1, pal.topLight);
    put(12, 0, pal.topLight);
    put(13, 4, pal.dark);
    put(9, 5, pal.dark);
  });
  rimCache.set(pal.top, s);
  return s;
}

class Crater implements Entity {
  x: number;
  y: number;
  x1: number;
  pal: Pal;
  rim: Sprite;
  constructor(x0: number, x1: number, groundY: number, pal: Pal) {
    this.x = x0;
    this.x1 = x1;
    this.y = groundY;
    this.pal = pal;
    this.rim = rimSprite(pal);
  }
  // the crater floor, a shallow bowl low in the shaft
  floorAt(x: number) {
    const u = Math.max(0, Math.min(1, (x - this.x) / (this.x1 - this.x)));
    return r3(H - 30 - (1 - Math.sin(u * Math.PI)) * 22);
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number) {
    if (!onScreen(this.x, cam, 400)) return;
    const pal = this.pal;
    for (let x = this.x + U * 2; x < this.x1 - U * 2; x += U) {
      const fy = this.floorAt(x);
      const cx = Math.floor(x / U);
      dot(g, x - cam, fy, pal.topLight);
      dot(g, x - cam, fy + U, pal.top, U, U * 2);
      g.fillStyle = pal.dark;
      g.fillRect(r3(x - cam), fy + U * 3, U, H - fy);
      if (hash2(cx, 3) % 7 === 0) dot(g, x - cam, fy + U * 4 + (hash2(cx, 9) % 3) * U, pal.body);
    }
    // a few pebbles and a glinting crystal on the floor
    const mid = (this.x + this.x1) / 2;
    for (const [dx, z] of [[-60, 2], [-38, 1], [45, 2], [70, 1]]) {
      const fy = this.floorAt(mid + dx);
      dot(g, mid + dx - cam, fy - U * z, pal.body, U * (z + 1), U * z);
      dot(g, mid + dx - cam, fy - U * z, pal.topLight, U, U);
    }
    const cy = this.floorAt(mid + 12);
    dot(g, mid + 12 - cam, cy - U * 3, '#9ff3ff', U, U * 3);
    dot(g, mid + 15 - cam, cy - U * 2, '#5fd0f0', U, U * 2);
    if (Math.floor(t / 600) % 3 === 0) {
      g.fillStyle = '#ffffff';
      star(g, mid + 13 - cam, cy - U * 4, 5);
    }
    // raised lips on both sides
    drawSprite(g, this.rim, this.x - cam - this.rim.width * U + U * 2, this.y - this.rim.height * U + U * 2);
    drawSprite(g, this.rim, this.x1 - cam - U * 2, this.y - this.rim.height * U + U * 2, U, { flip: true });
  }
}

registerObstacle('crater', (b) => {
  const waitX = b.x - 100;
  const gx = b.x;
  const gy = b.y;
  b.add(228, 'gap');
  const gw = 228;
  const landX = b.x + 100;
  b.add(170, 'flat');
  const crater = b.entity(new Crater(gx, gx + gw, gy, paletteOf(b.theme.terrain)));
  const cx = gx + gw / 2;
  const restart = fresh();
  let launched = false;
  let landed = false;
  let bonk = false;
  return {
    kind: 'crater',
    label: 'the crater',
    waitX,
    pass: {
      dur: 2100,
      step(k, m) {
        if (restart(k)) launched = landed = false;
        const R = laneOf(m, waitX);
        if (k < 0.12) {
          m.place(waitX, R);
          m.squash(0.78);
          return;
        }
        if (!launched) {
          launched = true;
          whoosh(0.06, 0.8, 0, 700, 260);
          note(72, { instrument: 'pad', level: 0.06 });
          m.fx.burst('dust', 10, waitX, R + MR, { speed: 0.6 });
          m.fx.burst('puff', 6, waitX, R + MR, { speed: 0.4 });
        }
        if (k < 0.9) {
          // a huge, slow, floaty leap
          const p = curve(waitX, R, landX, laneOf(m, landX), 210, linger(span(k, 0.12, 0.9)));
          m.place(p.x, p.y);
          m.spin(0.06);
          return;
        }
        if (!landed) {
          landed = true;
          thump(0.3);
          m.squash(0.75);
          m.fx.burst('dust', 10, landX, laneOf(m, landX) + MR, { speed: 0.6 });
          m.fx.burst('puff', 6, landX, laneOf(m, landX) + MR, { speed: 0.4 });
        }
        m.place(landX, laneOf(m, landX));
      }
    },
    fail: {
      dur: 3200,
      step(k, m) {
        if (restart(k)) launched = bonk = landed = false;
        const R = laneOf(m, waitX);
        const floor = crater.floorAt(cx) - MR;
        if (k < 0.1) {
          m.place(waitX, R);
          m.squash(0.85);
          return;
        }
        if (!launched) {
          launched = true;
          whoosh(0.05, 0.5, 0, 600, 300);
          m.fx.burst('dust', 6, waitX, R + MR, { speed: 0.5 });
        }
        if (k < 0.46) {
          // too small a hop: it drifts down into the crater
          const p = curve(waitX, R, cx, floor, 90, linger(span(k, 0.1, 0.46)));
          m.place(p.x, p.y);
          m.spin(0.05);
          return;
        }
        if (!bonk) {
          bonk = true;
          m.bump('OOF');
          thump(0.25);
          m.fx.burst('dust', 12, cx, floor + MR, { speed: 0.6 });
        }
        if (k < 0.62) {
          const p = curve(cx, floor, cx - 24, floor, 46, span(k, 0.46, 0.62));
          m.place(p.x, p.y);
          return;
        }
        if (!landed) {
          landed = true;
          m.squash(0.7);
          note(67, { instrument: 'marimba', level: 0.1 });
          note(74, { at: 0.1, instrument: 'marimba', level: 0.1 });
          m.fx.burst('dust', 8, cx - 24, floor + MR, { speed: 0.5 });
        }
        // a big floaty bounce back out, landing at the near edge
        const p = curve(cx - 24, floor, waitX, R, 120, linger(span(k, 0.62, 1)));
        m.place(p.x, p.y);
        m.spin(-0.06);
      }
    }
  };
});

// ---- black hole: slingshot around it, or get swallowed and spat out ------
class BlackHole implements Entity {
  x: number;
  y: number;
  front: boolean;
  st: { gulpAt: number; spitAt: number; slingAt: number };
  constructor(x: number, y: number, front: boolean, st: BlackHole['st']) {
    this.x = x;
    this.y = y;
    this.front = front;
    this.st = st;
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number) {
    if (!onScreen(this.x, cam, 300)) return;
    const cx = this.x - cam;
    const cy = this.y;
    const gulp = t - this.st.gulpAt;
    const spit = t - this.st.spitAt;
    const sling = t - this.st.slingAt;
    const swell = (gulp >= 0 && gulp < 500 ? Math.sin((gulp / 500) * Math.PI) * 8 : 0) + (spit >= 0 && spit < 300 ? -6 * (1 - spit / 300) : 0);
    const fast = sling >= 0 && sling < 1200 ? 2.2 : gulp >= -1600 && gulp < 600 ? 1.8 : 1;
    if (!this.front) {
      // a soft violet halo, dithered
      for (let r = 78; r > 30; r -= 8) {
        g.globalAlpha = 0.07 + (78 - r) * 0.002 + Math.sin(t / 300) * 0.02;
        const n = Math.ceil(r / 2);
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + r;
          dot(g, cx + Math.cos(a) * r, cy + Math.sin(a) * r, '#8a4cff', U * 2, U * 2);
        }
      }
      g.globalAlpha = 1;
      // specks and stars spiralling in
      for (let i = 0; i < 10; i++) {
        const p = (t / (1700 / fast) + i / 10) % 1;
        const r = 150 * (1 - p) + 20;
        const a = i * 0.63 + p * 7;
        g.globalAlpha = Math.min(1, p * 3) * (1 - p * 0.5);
        if (i % 3 === 0) {
          g.fillStyle = '#ffe9a8';
          star(g, cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.55, 5);
        } else dot(g, cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.55, i % 2 ? '#d9b8ff' : '#9ff3ff');
      }
      g.globalAlpha = 1;
    }
    // the accretion ring: the far half behind the core, the near half in front
    const spin = (t / 260) * fast;
    for (let band = 0; band < 5; band++) {
      const rx = 52 + band * 6 + swell;
      const ry = 13 + band * 2 + swell * 0.3;
      const n = 46;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const near = Math.sin(a) > 0;
        if (near !== this.front) continue;
        const glow = (Math.sin(a * 3 - spin + band) + 1) / 2;
        const col = band === 0 ? '#ffffff' : glow > 0.75 ? '#ff9cf0' : glow > 0.4 ? (band < 3 ? '#c46bff' : '#9a4cf0') : band < 3 ? '#7a2fd0' : '#4f1f96';
        const tilt = Math.cos(a) * rx * 0.18;
        dot(g, cx + Math.cos(a) * rx, cy + Math.sin(a) * ry - tilt, col);
      }
    }
    if (this.front) return;
    // the core with its bright photon rim
    const cr = 30 + swell;
    for (let y = -cr; y <= cr; y += U) {
      const hw = Math.sqrt(Math.max(0, cr * cr - y * y));
      g.fillStyle = '#05010c';
      g.fillRect(r3(cx - hw), r3(cy + y), r3(hw * 2) || U, U);
      dot(g, cx - hw - U, cy + y, '#e8d0ff');
      dot(g, cx + hw, cy + y, '#e8d0ff');
    }
    dot(g, cx - cr * 0.3, cy - cr - U, '#e8d0ff', r3(cr * 0.6), U);
    dot(g, cx - cr * 0.3, cy + cr, '#b88cff', r3(cr * 0.6), U);
    // a spit-out burst ring
    if (spit >= 0 && spit < 450) {
      const k = spit / 450;
      g.globalAlpha = 1 - k;
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2;
        dot(g, cx + Math.cos(a) * (30 + k * 90), cy + Math.sin(a) * (30 + k * 90) * 0.6, '#ff9cf0', U * 2, U * 2);
      }
      g.globalAlpha = 1;
    }
  }
}

registerObstacle('blackhole', (b) => {
  const waitX = b.x - 80;
  const bx = b.x + 210;
  const gy = b.y;
  b.add(420, 'flat');
  const cy = gy - 84;
  const st = { gulpAt: -1e9, spitAt: -1e9, slingAt: -1e9 };
  b.entity(new BlackHole(bx, cy, false, st));
  b.entity(new BlackHole(bx, cy, true, st));
  const R = 125;
  const landX = bx + R + 190;
  b.add(60, 'flat');
  const restart = fresh();
  let flung = false;
  let gone = false;
  let spat = false;
  const toOrbit = (m: MarbleCtl, s: number) => curve(waitX, laneOf(m, waitX), bx - R, cy, 30, ease(s));
  return {
    kind: 'blackhole',
    label: 'the black hole',
    waitX,
    pass: {
      dur: 2400,
      step(k, m, t) {
        if (restart(k)) {
          flung = false;
          whoosh(0.07, 1.0, 0, 400, 1600);
        }
        if (k < 0.2) {
          const p = toOrbit(m, k / 0.2);
          m.place(p.x, p.y);
          return;
        }
        if (k < 0.72) {
          // over the top, faster and faster
          const s = easeIn(span(k, 0.2, 0.72));
          const a = Math.PI + s * Math.PI;
          m.place(bx + Math.cos(a) * R, cy + Math.sin(a) * R);
          m.spin(0.1 + s * 0.35);
          if (Math.random() < 0.6) m.fx.add({ kind: 'spark', x: m.x, y: m.y, vx: 0, vy: 0, color: '#d9b8ff', life: 0.8 });
          return;
        }
        if (!flung) {
          flung = true;
          st.slingAt = t;
          m.fx.text('WHEEE!', bx + R, cy - 60, '#ff9cf0', 12);
          m.fx.burst('star', 8, bx + R, cy, { color: '#c46bff', speed: 0.8 });
          [76, 81, 88, 93].forEach((n, i) => note(n, { at: i * 0.05, instrument: 'glock', level: 0.08 }));
        }
        // flung onward in a long floaty arc
        const p = curve(bx + R, cy, landX, laneOf(m, landX), 70, ease(span(k, 0.72, 1)));
        m.place(p.x, p.y);
        m.spin(0.2 * (1 - span(k, 0.72, 1)));
      }
    },
    fail: {
      dur: 3000,
      step(k, m, t) {
        if (restart(k)) {
          gone = spat = false;
          st.gulpAt = t + 0.62 * 3000;
          whoosh(0.1, 1.4, 0.4, 1400, 120);
        }
        if (k < 0.2) {
          const p = toOrbit(m, k / 0.2);
          m.place(p.x, p.y);
          return;
        }
        if (k < 0.62) {
          // pulled in a tightening spiral, stretching as it goes
          const s = span(k, 0.2, 0.62);
          const r = R * (1 - easeIn(s));
          const a = Math.PI + s * Math.PI * 5;
          m.place(bx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.6);
          m.spin(0.2 + s * 0.4);
          m.squash(0.8 + Math.sin(t / 50) * 0.15);
          return;
        }
        if (!gone) {
          gone = true;
          m.hide(true);
          note(43, { instrument: 'pad', level: 0.12 });
          m.fx.tint(t, 260, 'rgba(90,30,160,.25)');
        }
        if (k < 0.74) {
          m.place(bx, cy);
          return;
        }
        if (!spat) {
          spat = true;
          st.spitAt = t;
          m.hide(false);
          m.place(bx, cy);
          m.bump('PTOOEY!');
          thump(0.4);
          note(55, { instrument: 'marimba', level: 0.12 });
          note(48, { at: 0.1, instrument: 'marimba', level: 0.12 });
          m.fx.burst('star', 10, bx, cy, { color: '#c46bff', speed: 0.9 });
        }
        // spat back out, tumbling, to the start
        const s = span(k, 0.74, 1);
        const p = curve(bx, cy, waitX, laneOf(m, waitX), 120, linger(s));
        m.place(p.x, p.y);
        m.spin(-0.3 * (1 - s));
      }
    }
  };
});
