// 지우개 따먹기 (eraser flick) rules and physics, kept pure so the same
// shot always plays out the same way (no DOM, no clock, no Math.random).
//
// The desk is seen from above in world units. Erasers are 12 × 16 blocks
// (the boss cards are 3:4); they slide with friction, spin a little when
// they glance off each other, and fall when their centre leaves the desk.
// The real playground rule decides a round: a flicked eraser that hits a
// resting one squarely at a middling speed climbs onto it (too slow just
// bumps, too fast bounces it away), and an eraser that comes to rest on top
// of the other, covering at least half of it, wins. An eraser that falls off
// the desk loses; the flicker loses if both fall.

export const ERASER_W = 12;
export const ERASER_H = 16;
// collisions treat each block as a circle of this radius
export const RADIUS = 7.2;
export const STEP = 1 / 120;
// launch speed at full power, world units per second
export const MAX_SPEED = 170;
// drag length (world units) that gives full power
export const MAX_DRAG = 36;
export const MIN_POWER = 0.06;

// a squarely-aimed impact speed inside this window climbs on
export const CLIMB_MIN = 40;
export const CLIMB_MAX = 115;
// cos of the angle between the hit and the line of centres
export const CLIMB_HEAD_ON = 0.8;
// share of the lower eraser the top one must cover to stay up
export const STAY_OVERLAP = 0.5;

const MU_DESK = 70;
// rubber on rubber grips much harder than rubber on varnished wood
const MU_TOP = 90;
const LIN_DAMP = 0.8;
const ANG_DAMP = 3;
const REST_SPEED = 0.6;
const RESTITUTION = 0.55;
const SLIP_SPEED = 25;

export interface Desk {
  w: number;
  h: number;
}

export interface EraserBody {
  x: number;
  y: number;
  // radians
  a: number;
  vx: number;
  vy: number;
  spin: number;
  // index of the eraser this one is riding on, or null on the desk
  on: number | null;
  // its centre has made it over the eraser below (it climbs on from the
  // edge, so until then it is still on the way up)
  mounted: boolean;
  // skip collisions with this eraser until the two separate (just slid off)
  ghost: number | null;
  fallen: boolean;
}

export type WorldEvent =
  | { kind: 'hit'; x: number; y: number; strength: number }
  | { kind: 'climb'; x: number; y: number; strength: number }
  | { kind: 'slip'; x: number; y: number; strength: number }
  | { kind: 'fall'; x: number; y: number; strength: number; who: number };

export interface World {
  desk: Desk;
  erasers: EraserBody[];
  time: number;
  // filled by step(); the caller drains it for crumbs and shakes
  events: WorldEvent[];
}

export interface Outcome {
  winner: number | null;
  reason: 'climb' | 'knock' | 'fall' | null;
}

export function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function rng() {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function deskFor(aspect: number): Desk {
  // a landscape screen gets a landscape desk; the shape is fixed per round
  return aspect >= 1.05 ? { w: 150, h: 100 } : { w: 100, h: 150 };
}

function body(x: number, y: number, a: number): EraserBody {
  return {
    x,
    y,
    a,
    vx: 0,
    vy: 0,
    spin: 0,
    on: null,
    mounted: false,
    ghost: null,
    fallen: false
  };
}

// player 0 starts nearer the bottom, player 1 nearer the top
export function createWorld(desk: Desk, rng: () => number = () => 0.5): World {
  const tilt = () => (rng() - 0.5) * 0.9;
  const landscape = desk.w > desk.h;
  const erasers = landscape
    ? [
        body(desk.w * 0.32, desk.h * 0.62, tilt()),
        body(desk.w * 0.66, desk.h * 0.4, tilt())
      ]
    : [
        body(desk.w * 0.4, desk.h * 0.68, tilt()),
        body(desk.w * 0.6, desk.h * 0.34, tilt())
      ];
  return { desk, erasers, time: 0, events: [] };
}

export function cloneWorld(world: World): World {
  return {
    desk: world.desk,
    erasers: world.erasers.map((e) => ({ ...e })),
    time: world.time,
    events: []
  };
}

export function corners(e: EraserBody): [number, number][] {
  const c = Math.cos(e.a);
  const s = Math.sin(e.a);
  const hw = ERASER_W / 2;
  const hh = ERASER_H / 2;
  return (
    [
      [-hw, -hh],
      [hw, -hh],
      [hw, hh],
      [-hw, hh]
    ] as [number, number][]
  ).map(([px, py]) => [e.x + px * c - py * s, e.y + px * s + py * c]);
}

export function pointInEraser(px: number, py: number, e: EraserBody) {
  const dx = px - e.x;
  const dy = py - e.y;
  const c = Math.cos(-e.a);
  const s = Math.sin(-e.a);
  const lx = dx * c - dy * s;
  const ly = dx * s + dy * c;
  return Math.abs(lx) <= ERASER_W / 2 && Math.abs(ly) <= ERASER_H / 2;
}

// share of b's top face that a covers (0..1), by convex polygon clipping
export function overlapFraction(a: EraserBody, b: EraserBody) {
  let poly = corners(a);
  const clip = corners(b);
  for (let i = 0; i < clip.length && poly.length; i++) {
    const [ax, ay] = clip[i];
    const [bx, by] = clip[(i + 1) % clip.length];
    const inside = ([px, py]: [number, number]) =>
      (bx - ax) * (py - ay) - (by - ay) * (px - ax) >= 0;
    const next: [number, number][] = [];
    for (let j = 0; j < poly.length; j++) {
      const cur = poly[j];
      const prev = poly[(j + poly.length - 1) % poly.length];
      const curIn = inside(cur);
      const prevIn = inside(prev);
      if (curIn !== prevIn) {
        next.push(intersect(prev, cur, [ax, ay], [bx, by]));
      }
      if (curIn) next.push(cur);
    }
    poly = next;
  }
  return area(poly) / (ERASER_W * ERASER_H);
}

function intersect(
  p: [number, number],
  q: [number, number],
  a: [number, number],
  b: [number, number]
): [number, number] {
  const a1 = q[1] - p[1];
  const b1 = p[0] - q[0];
  const c1 = a1 * p[0] + b1 * p[1];
  const a2 = b[1] - a[1];
  const b2 = a[0] - b[0];
  const c2 = a2 * a[0] + b2 * a[1];
  const det = a1 * b2 - a2 * b1;
  if (Math.abs(det) < 1e-12) return q;
  return [(b2 * c1 - b1 * c2) / det, (a1 * c2 - a2 * c1) / det];
}

function area(poly: [number, number][]) {
  let sum = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

export function powerFromDrag(dragLength: number) {
  return Math.max(0, Math.min(1, dragLength / MAX_DRAG));
}

export function flick(
  world: World,
  index: number,
  angle: number,
  power: number
) {
  const e = world.erasers[index];
  const p = Math.max(0, Math.min(1, power));
  e.vx = Math.cos(angle) * MAX_SPEED * p;
  e.vy = Math.sin(angle) * MAX_SPEED * p;
}

function speedOf(vx: number, vy: number) {
  return Math.hypot(vx, vy);
}

// Coulomb friction plus a little drag on (vx, vy) relative to (bx, by)
function slow(e: EraserBody, mu: number, bx: number, by: number) {
  let rx = e.vx - bx;
  let ry = e.vy - by;
  const sp = speedOf(rx, ry);
  if (sp > 0) {
    const next = Math.max(0, sp - mu * STEP) * (1 - LIN_DAMP * STEP);
    const k = next < REST_SPEED ? 0 : next / sp;
    rx *= k;
    ry *= k;
  }
  e.vx = bx + rx;
  e.vy = by + ry;
}

function offDesk(e: EraserBody, desk: Desk) {
  return e.x < 0 || e.y < 0 || e.x > desk.w || e.y > desk.h;
}

export function step(world: World) {
  const { erasers, desk } = world;
  // friction first: riders measure theirs against the eraser under them
  erasers.forEach((e) => {
    if (e.fallen) return;
    if (e.on !== null) {
      const base = erasers[e.on];
      slow(e, MU_TOP, base.vx, base.vy);
    } else {
      slow(e, MU_DESK, 0, 0);
    }
    e.spin *= 1 - ANG_DAMP * STEP;
    if (Math.abs(e.spin) < 0.05) e.spin = 0;
  });
  erasers.forEach((e) => {
    if (e.fallen) return;
    e.x += e.vx * STEP;
    e.y += e.vy * STEP;
    e.a += e.spin * STEP;
  });

  for (let i = 0; i < erasers.length; i++) {
    for (let j = i + 1; j < erasers.length; j++) collide(world, i, j);
  }

  erasers.forEach((e) => {
    if (e.fallen || e.on === null) return;
    const base = erasers[e.on];
    const inside = pointInEraser(e.x, e.y, base);
    if (inside) e.mounted = true;
    const rvx = e.vx - base.vx;
    const rvy = e.vy - base.vy;
    // still on the way up but no longer heading over the top
    const fellBack =
      !e.mounted && rvx * (base.x - e.x) + rvy * (base.y - e.y) <= 0;
    if (base.fallen || (!inside && e.mounted) || fellBack) {
      // its centre went past the edge of the eraser below: it drops
      world.events.push({ kind: 'slip', x: e.x, y: e.y, strength: 1 });
      e.ghost = e.on;
      e.on = null;
      e.mounted = false;
      return;
    }
    const relSpeed = speedOf(rvx, rvy);
    if (relSpeed < REST_SPEED * 2 && overlapFraction(e, base) < STAY_OVERLAP) {
      // stopped hanging over the edge: it teeters and slides off
      let dx = e.x - base.x;
      let dy = e.y - base.y;
      const d = Math.hypot(dx, dy);
      if (d < 1e-6) {
        dx = Math.cos(base.a);
        dy = Math.sin(base.a);
      } else {
        dx /= d;
        dy /= d;
      }
      e.vx = base.vx + dx * SLIP_SPEED;
      e.vy = base.vy + dy * SLIP_SPEED;
      e.ghost = e.on;
      e.on = null;
      e.mounted = false;
      world.events.push({ kind: 'slip', x: e.x, y: e.y, strength: 1 });
    }
  });

  erasers.forEach((e, i) => {
    if (e.fallen || e.on !== null) return;
    if (offDesk(e, desk)) {
      e.fallen = true;
      e.vx = 0;
      e.vy = 0;
      e.spin = 0;
      world.events.push({ kind: 'fall', x: e.x, y: e.y, strength: 1, who: i });
      // anything riding it drops to wherever it is
      erasers.forEach((rider) => {
        if (rider.on === i) {
          rider.on = null;
          rider.mounted = false;
          rider.ghost = null;
        }
      });
    }
  });

  world.time += STEP;
}

function collide(world: World, i: number, j: number) {
  const a = world.erasers[i];
  const b = world.erasers[j];
  if (a.fallen || b.fallen) return;
  if (a.on === j || b.on === i) return;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy);
  if (a.ghost === j || b.ghost === i) {
    if (d >= RADIUS * 2) {
      if (a.ghost === j) a.ghost = null;
      if (b.ghost === i) b.ghost = null;
    }
    return;
  }
  if (d >= RADIUS * 2 || d < 1e-9) return;
  const nx = dx / d;
  const ny = dy / d;
  const rvx = a.vx - b.vx;
  const rvy = a.vy - b.vy;
  // closing speed along the line from a to b
  const vn = rvx * nx + rvy * ny;
  const rel = speedOf(rvx, rvy);

  if (vn > 0) {
    const aMoving = speedOf(a.vx, a.vy) >= speedOf(b.vx, b.vy);
    const mover = aMoving ? a : b;
    const target = aMoving ? b : a;
    const targetIndex = aMoving ? j : i;
    const targetResting = speedOf(target.vx, target.vy) < REST_SPEED * 3;
    const headOn = rel > 0 ? vn / rel : 0;
    if (
      targetResting &&
      target.on === null &&
      vn >= CLIMB_MIN &&
      vn <= CLIMB_MAX &&
      headOn >= CLIMB_HEAD_ON
    ) {
      // climbs on: it loses speed going up, and nudges the one below
      mover.on = targetIndex;
      mover.mounted = false;
      mover.vx *= 0.75;
      mover.vy *= 0.75;
      const sign = aMoving ? 1 : -1;
      target.vx += nx * sign * vn * 0.12;
      target.vy += ny * sign * vn * 0.12;
      world.events.push({
        kind: 'climb',
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
        strength: vn
      });
      return;
    }
    const jImpulse = ((1 + RESTITUTION) * vn) / 2;
    a.vx -= jImpulse * nx;
    a.vy -= jImpulse * ny;
    b.vx += jImpulse * nx;
    b.vy += jImpulse * ny;
    // a glancing hit spins both
    const vt = rvx * -ny + rvy * nx;
    a.spin += vt * 0.05;
    b.spin -= vt * 0.05;
    world.events.push({
      kind: 'hit',
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
      strength: vn
    });
  }
  const pen = RADIUS * 2 - d;
  a.x -= (nx * pen) / 2;
  a.y -= (ny * pen) / 2;
  b.x += (nx * pen) / 2;
  b.y += (ny * pen) / 2;
}

export function atRest(world: World) {
  return world.erasers.every(
    (e) =>
      e.fallen ||
      (speedOf(e.vx, e.vy) === 0 &&
        e.spin === 0 &&
        // an eraser hanging off the edge of the other has not settled yet
        (e.on === null ||
          overlapFraction(e, world.erasers[e.on]) >= STAY_OVERLAP))
  );
}

// run a shot to the end; capped so a bug can never hang a turn
export function settle(world: World, maxSeconds = 12) {
  const limit = world.time + maxSeconds;
  while (!atRest(world) && world.time < limit) step(world);
  if (!atRest(world)) {
    world.erasers.forEach((e) => {
      e.vx = 0;
      e.vy = 0;
      e.spin = 0;
    });
  }
  return world;
}

export function outcome(world: World, shooter: number): Outcome {
  const other = 1 - shooter;
  const s = world.erasers[shooter];
  const o = world.erasers[other];
  if (s.fallen) return { winner: other, reason: 'fall' };
  if (o.fallen) return { winner: shooter, reason: 'knock' };
  if (s.on === other && overlapFraction(s, o) >= STAY_OVERLAP) {
    return { winner: shooter, reason: 'climb' };
  }
  if (o.on === shooter && overlapFraction(o, s) >= STAY_OVERLAP) {
    return { winner: other, reason: 'climb' };
  }
  return { winner: null, reason: null };
}

function distanceToEdge(e: EraserBody, desk: Desk) {
  return Math.min(e.x, e.y, desk.w - e.x, desk.h - e.y);
}

// 0 (practice) .. 1 (every boss beaten)
export function rivalSkill(won: number, total: number) {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(1, won / total));
}

export function aimNoise(skill: number) {
  return {
    angle: ((10 - 6 * skill) * Math.PI) / 180,
    power: 0.15 - 0.08 * skill
  };
}

function gaussian(rng: () => number) {
  const u = Math.max(1e-9, rng());
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// The computer tries a fan of shots on a copy of the desk, keeps the one
// that scores best (a win, else ending close to the target and away from
// the edge), then misses a little by its skill.
export function chooseRivalShot(
  world: World,
  shooter: number,
  skill: number,
  rng: () => number
) {
  const me = world.erasers[shooter];
  const them = world.erasers[1 - shooter];
  const base = Math.atan2(them.y - me.y, them.x - me.x);
  const angles: number[] = [];
  for (let k = -12; k <= 12; k++) angles.push(base + (k * 3 * Math.PI) / 180);
  const powers: number[] = [];
  for (let p = 0.12; p <= 1.0001; p += 0.04) powers.push(p);

  const grid = angles.map((angle) =>
    powers.map((power) => {
      const trial = cloneWorld(world);
      flick(trial, shooter, angle, power);
      settle(trial, 8);
      const result = outcome(trial, shooter);
      if (result.winner === shooter) return 1000;
      if (result.winner !== null) return -1000;
      const m = trial.erasers[shooter];
      const t = trial.erasers[1 - shooter];
      const edge = Math.max(0, 15 - distanceToEdge(m, trial.desk));
      return -Math.hypot(m.x - t.x, m.y - t.y) - edge * 6;
    })
  );

  let best = { angle: base, power: 0.4, score: -Infinity };
  grid.forEach((row, ai) =>
    row.forEach((score, pi) => {
      // prefer shots whose neighbours also work: they survive the miss
      let around = 0;
      let count = 0;
      for (let da = -1; da <= 1; da++) {
        for (let dp = -1; dp <= 1; dp++) {
          const v = grid[ai + da]?.[pi + dp];
          if (v === undefined || (da === 0 && dp === 0)) continue;
          around += v;
          count++;
        }
      }
      const robust = score + (count ? (0.3 * around) / count : 0);
      if (robust > best.score) {
        best = { angle: angles[ai], power: powers[pi], score: robust };
      }
    })
  );

  const noise = aimNoise(skill);
  return {
    angle: best.angle + gaussian(rng) * noise.angle,
    power: Math.max(
      MIN_POWER + 0.04,
      Math.min(1, best.power + gaussian(rng) * noise.power)
    ),
    planned: { angle: best.angle, power: best.power }
  };
}
