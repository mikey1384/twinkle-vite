import {
  makeSprite,
  rect,
  disc,
  line,
  poly,
  drawStanding,
  U,
  type Put
} from '../../pixel';
import { MR } from '../../marble';
import { thump, note, whoosh } from '../../audio';
import { Enemy, enemyDef } from '../enemies/registry';
import type { Entity, Builder, RunView } from '../types';
import { registerObstacle, ease, easeIn, span } from './registry';

// The obstacles that ask the question types (Mikey 10-10: "obstacles have
// identities": the question is the way past them):
//   fork      — "Which way?": a signpost and an arched gate; the right
//               sentence is the right road
//   crackwall — "Spot the crack": a brick wall with one glowing cracked
//               brick; find the wrong word and the wall breaks
//   lockgate  — "Fix it": a gate jammed by the wrong key; the right word is
//               the right key
//   stompers  — "Stomp": a squad of the level's own enemies, one per
//               sentence; stomp the wrong ones
//   iceslide  — "Momentum": an ice slide with three flag gates; three quick
//               calls, three gates
//   islands   — "Build it": floating islands that line up into a staircase
//               once the sentence is built
// They stand on the ground in rolling levels and float in the marble's lane
// in water and sky levels, so every theme can ask every type.
export const FORMAT_OBSTACLES = {
  which: 'fork',
  crack: 'crackwall',
  fix: 'lockgate',
  stomp: 'stompers',
  momentum: 'iceslide',
  build: 'islands'
} as const;

// the line the structure stands on: the marble's resting bottom here
function baseAt(b: Builder, x: number) {
  return (b.restY(x) ?? b.BASE_Y - MR) + MR;
}

// a flickering flame (torches and lanterns), drawn live
function flame(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
  seed = 0
) {
  const f = Math.sin(t / 90 + seed) * 0.5 + Math.sin(t / 37 + seed * 3) * 0.5;
  const h = 5 + Math.round(f * 1.5);
  g.fillStyle = 'rgba(255,190,80,.22)';
  g.fillRect(x - 4 * U, y - (h + 3) * U, 8 * U, (h + 4) * U);
  g.fillStyle = '#ff8a2b';
  g.fillRect(x - 2 * U, y - h * U, 4 * U, h * U);
  g.fillStyle = '#ffd34d';
  g.fillRect(x - U, y - (h - 2) * U, 2 * U, (h - 2) * U);
}

// ---- fork: signpost + arched gate -----------------------------------------
const STONE = '#a8a2bc';
const STONE_DARK = '#7a7590';
const STONE_LIGHT = '#cfcade';
const POST = makeSprite(6, 46, (put) => {
  rect(put, 1, 0, 4, 46, '#7d4f24');
  rect(put, 1, 0, 1, 46, '#a8733f');
  rect(put, 4, 0, 1, 46, '#5c3816');
  for (let y = 6; y < 46; y += 9) rect(put, 2, y, 2, 1, '#5c3816');
  rect(put, 0, 42, 6, 4, '#5c3816');
});
// one arrow board, pointing right, with its letter
function board(letter: 'A' | 'B', tone: string) {
  return makeSprite(26, 9, (put) => {
    poly(
      put,
      [
        [0, 0],
        [20, 0],
        [25, 4],
        [20, 8],
        [0, 8]
      ],
      tone
    );
    rect(put, 0, 0, 20, 1, '#f3d99a');
    rect(put, 0, 7, 20, 1, '#a8733f');
    rect(put, 2, 4, 1, 1, '#5c3816');
    rect(put, 17, 4, 1, 1, '#5c3816');
    const glyph =
      letter === 'A'
        ? ['.#.', '#.#', '###', '#.#', '#.#']
        : ['##.', '#.#', '##.', '#.#', '##.'];
    glyph.forEach((row, y) =>
      [...row].forEach((c, x) => c === '#' && put(8 + x, 2 + y, '#4a2c0c'))
    );
  });
}
const BOARD_A = board('A', '#e8c37a');
const BOARD_B = board('B', '#d9a85b');
const ARCH = [false, true].map((lit) =>
  makeSprite(40, 58, (put) => {
    // two stone pillars and an arch, blocks outlined
    for (const x0 of [0, 31]) {
      rect(put, x0, 14, 9, 44, STONE);
      rect(put, x0, 14, 1, 44, STONE_LIGHT);
      rect(put, x0 + 8, 14, 1, 44, STONE_DARK);
      for (let y = 20; y < 58; y += 7) rect(put, x0, y, 9, 1, STONE_DARK);
    }
    for (let a = 0; a <= 20; a++) {
      const ang = Math.PI * (a / 20);
      const x = 20 - Math.cos(ang) * 16;
      const y = 16 - Math.sin(ang) * 13;
      disc(put, x, y, 4.2, 4.2, a % 4 === 0 ? STONE_DARK : STONE);
    }
    // keystone
    rect(put, 18, 0, 5, 6, lit ? '#9fe0b4' : '#c9c3dc');
    rect(put, 19, 1, 3, 1, lit ? '#e6fff0' : '#ece8f6');
    // the opening: dark, or warm light when the road is right
    for (let y = 16; y < 58; y++) {
      const half =
        y < 22
          ? Math.round(Math.sqrt(Math.max(0, 1 - ((22 - y) / 9) ** 2)) * 11)
          : 11;
      rect(
        put,
        20 - half,
        y,
        half * 2,
        1,
        lit ? (y % 3 ? '#fff4c4' : '#ffe9a0') : '#2c2540'
      );
    }
  })
);
const PORTCULLIS = makeSprite(22, 42, (put) => {
  for (let x = 1; x < 22; x += 5) {
    rect(put, x, 0, 2, 40, '#4c4860');
    rect(put, x, 0, 1, 40, '#7d7896');
    rect(put, x, 39, 2, 3, '#4c4860');
  }
  for (const y of [6, 18, 30]) rect(put, 0, y, 22, 2, '#5d5975');
});
const DEAD_END = makeSprite(18, 18, (put) => {
  line(put, 1, 1, 16, 16, '#e04848');
  line(put, 2, 1, 17, 16, '#e04848');
  line(put, 16, 1, 1, 16, '#e04848');
  line(put, 17, 1, 2, 16, '#e04848');
});
class Fork implements Entity {
  x: number;
  y: number;
  gateX: number;
  lit = false;
  litAt = -1;
  blockedAt = -1e9;
  constructor(x: number, gateX: number, y: number) {
    this.x = x;
    this.gateX = gateX;
    this.y = y;
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number) {
    const sx = this.x - cam;
    const gx = this.gateX - cam;
    drawStanding(g, POST, sx, this.y);
    // the boards sway a little; the right one (A, up) and B (down)
    const sway = Math.round(Math.sin(t / 600) * 1) * U;
    drawStanding(g, BOARD_A, sx + 30 + sway, this.y - 30 * U);
    drawStanding(g, BOARD_B, sx + 30 - sway, this.y - 17 * U);
    flame(g, sx, this.y - 46 * U, t, this.x);
    drawStanding(g, ARCH[this.lit ? 1 : 0], gx, this.y);
    // the portcullis: rises on the right road, slams on the wrong one
    const up = this.litAt < 0 ? 0 : Math.min(1, (t - this.litAt) / 500);
    const slam =
      t - this.blockedAt < 160 ? (Math.floor(t / 40) % 2 ? U : 0) : 0;
    drawStanding(g, PORTCULLIS, gx, this.y - up * 40 * U + slam, U, {
      alpha: 1 - up * 0.5
    });
    const since = t - this.blockedAt;
    if (since < 900) {
      const pop = Math.min(1, since / 120);
      drawStanding(g, DEAD_END, gx, this.y - 40 * (1 - pop) - 30 * U, U, {
        alpha: Math.min(1, (900 - since) / 200)
      });
    }
  }
}
registerObstacle('fork', (b) => {
  const waitX = b.x - 70;
  const signX = b.x;
  const gateX = b.x + 170;
  const y = baseAt(b, gateX);
  b.add(320, 'flat');
  const fork = b.entity(new Fork(signX, gateX, y));
  const landX = gateX + 120;
  let flags: Record<string, boolean> = {};
  return {
    kind: 'fork',
    label: 'the fork in the road',
    waitX,
    pass: {
      dur: 1500,
      step(k, m) {
        if (k === 0) flags = {};
        if (!flags.lit && k > 0.12) {
          flags.lit = true;
          fork.lit = true;
          fork.litAt = m.t;
          m.fx.burst('sparkle', 12, gateX, y - 70);
          note(76, { instrument: 'glock', level: 0.08 });
          note(83, { at: 0.08, instrument: 'glock', level: 0.07 });
        }
        m.roll(waitX + (landX - waitX) * ease(span(k, 0.25, 1)));
      }
    },
    fail: {
      dur: 1300,
      step(k, m) {
        if (k === 0) flags = {};
        const near = gateX - 60;
        if (k < 0.45) m.roll(waitX + (near - waitX) * ease(k / 0.45));
        else {
          if (!flags.blocked) {
            flags.blocked = true;
            fork.blockedAt = m.t;
            m.fx.burst('dust', 10, gateX, y - 6);
            m.bump();
            thump(0.4);
          }
          m.roll(near + (waitX - near) * ease(span(k, 0.5, 1)));
        }
      }
    }
  };
});

// ---- crackwall: find the cracked brick ------------------------------------
const WALL_W = 26;
const WALL_H = 56;
const BRICK_TONES = ['#c46a4a', '#b85c3e', '#cf7a55', '#bd6446'];
function drawWall(put: Put) {
  for (let row = 0; row < 8; row++) {
    const y = row * 7;
    const shift = row % 2 ? 6 : 0;
    for (let col = -1; col < 3; col++) {
      const x = col * 12 + shift;
      const x0 = Math.max(0, x);
      const x1 = Math.min(WALL_W, x + 11);
      if (x1 <= x0) continue;
      rect(put, x0, y, x1 - x0, 6, BRICK_TONES[(row * 3 + col + 4) % 4]);
      rect(put, x0, y, x1 - x0, 1, '#e7a07a');
      rect(put, x0, y + 5, x1 - x0, 1, '#9a4a30');
    }
    rect(put, 0, y + 6, WALL_W, 1, '#6f3524');
  }
  // moss along the foot and a cap stone
  for (let x = 0; x < WALL_W; x++)
    if ((x * 7) % 5 < 3)
      rect(put, x, WALL_H - 2 - ((x * 3) % 2), 1, 2, '#5f9a4a');
  rect(put, 0, 0, WALL_W, 2, '#a8a2bc');
}
const WALL = makeSprite(WALL_W, WALL_H, (put) => {
  drawWall(put);
  // the weak brick: row 4, in the middle, cracked
  line(put, 11, 29, 13, 31, '#2b1a14');
  line(put, 13, 31, 12, 34, '#2b1a14');
  line(put, 13, 31, 16, 32, '#2b1a14');
});
// the crack's glow: drawn live so it pulses
const CRACK_GLOW = makeSprite(
  9,
  8,
  (put) => disc(put, 4, 4, 4, 3.5, '#ffe37a'),
  { outline: false }
);
class CrackWall implements Entity {
  x: number;
  y: number;
  broken = false;
  shakeAt = -1e9;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number) {
    if (this.broken) return;
    const shake =
      t - this.shakeAt < 300 ? (Math.floor(t / 40) % 2 ? U : -U) : 0;
    const x = this.x - cam + shake;
    drawStanding(g, WALL, x, this.y);
    const pulse = 0.25 + (Math.sin(t / 260) + 1) * 0.2;
    drawStanding(g, CRACK_GLOW, x - 0.5 * U, this.y - (WALL_H - 35) * U, U, {
      alpha: pulse
    });
  }
}
registerObstacle('crackwall', (b) => {
  const waitX = b.x - 70;
  const wallX = b.x + 40;
  const y = baseAt(b, wallX);
  b.add(240, 'flat');
  const wall = b.entity(new CrackWall(wallX, y));
  const landX = wallX + 150;
  let flags: Record<string, boolean> = {};
  const hitX = wallX - (WALL_W * U) / 2 - MR;
  return {
    kind: 'crackwall',
    label: 'the cracked wall',
    waitX,
    pass: {
      dur: 1500,
      step(k, m) {
        if (k === 0) flags = {};
        if (k < 0.3) {
          m.roll(waitX + (hitX - waitX) * ease(k / 0.3));
          return;
        }
        if (!flags.smash) {
          flags.smash = true;
          wall.broken = true;
          // the wall comes apart brick by brick
          for (let i = 0; i < 4; i++) {
            m.fx.burst('frag', 7, wallX, y - (WALL_H * U * (i + 0.5)) / 4, {
              color: BRICK_TONES[i],
              speed: 1.2 + i * 0.15
            });
          }
          m.fx.burst('dust', 14, wallX, y - 10);
          m.fx.text('CRACK!', wallX, y - WALL_H * U - 16, '#ffe37a', 12);
          thump(0.8);
          whoosh(0.1, 0.4, 0, 400, 120);
        }
        m.roll(hitX + (landX - hitX) * ease(span(k, 0.32, 1)));
        m.spin(0.12);
      }
    },
    fail: {
      dur: 1100,
      step(k, m) {
        if (k === 0) flags = {};
        if (k < 0.4) m.roll(waitX + (hitX - waitX) * ease(k / 0.4));
        else {
          if (!flags.bump) {
            flags.bump = true;
            wall.shakeAt = m.t;
            m.fx.burst('dust', 6, hitX + MR, y - 30);
            m.bump();
            thump(0.4);
          }
          m.roll(hitX + (waitX - hitX) * ease(span(k, 0.45, 1)));
        }
      }
    }
  };
});

// ---- lockgate: the wrong key jams it, the right key opens it ---------------
const BARS = makeSprite(28, 48, (put) => {
  rect(put, 0, 0, 28, 4, '#6d6a7c');
  rect(put, 0, 0, 28, 1, '#a19eb4');
  for (let x = 1; x < 28; x += 5) {
    rect(put, x, 4, 2, 42, '#55526a');
    rect(put, x, 4, 1, 42, '#8a87a0');
    poly(
      put,
      [
        [x - 1, 46],
        [x + 1, 44],
        [x + 3, 46],
        [x + 1, 48]
      ],
      '#55526a'
    );
  }
  for (const y of [16, 30]) {
    rect(put, 0, y, 28, 2, '#6d6a7c');
    for (let x = 2; x < 28; x += 5) put(x, y, '#c4c1d4');
  }
});
const PILLARS = makeSprite(40, 56, (put) => {
  for (const x0 of [0, 33]) {
    rect(put, x0, 4, 7, 52, STONE);
    rect(put, x0, 4, 1, 52, STONE_LIGHT);
    rect(put, x0 + 6, 4, 1, 52, STONE_DARK);
    for (let y = 10; y < 56; y += 8) rect(put, x0, y, 7, 1, STONE_DARK);
    rect(put, x0 - 1, 0, 9, 5, STONE_LIGHT);
    rect(put, x0 - 1, 4, 9, 1, STONE_DARK);
  }
  rect(put, 0, 4, 40, 3, STONE);
  rect(put, 0, 4, 40, 1, STONE_LIGHT);
});
const PADLOCK = [false, true].map((open) =>
  makeSprite(14, 16, (put) => {
    // the shackle (popped up when open)
    const lift = open ? 3 : 0;
    rect(put, 3, 0 - lift + 3, 8, 2, '#c9ccd6');
    rect(put, 2, 2 - lift + 3, 2, 5, '#c9ccd6');
    rect(
      put,
      10,
      2 - lift + 3 + (open ? 3 : 0),
      2,
      5 - (open ? 3 : 0),
      '#c9ccd6'
    );
    rect(put, 0, 7, 14, 9, '#e0b13c');
    rect(put, 0, 7, 14, 1, '#f5d36b');
    rect(put, 0, 15, 14, 1, '#a87a18');
    disc(put, 7, 10.5, 1.6, 1.6, '#4a3008');
    rect(put, 6, 11, 2, 3, '#4a3008');
  })
);
const KEY = (gold: boolean) =>
  makeSprite(14, 7, (put) => {
    const c = gold ? '#ffd24a' : '#d64545';
    const d = gold ? '#c99a1a' : '#9a2a2a';
    disc(put, 3, 3, 3, 3, c);
    rect(put, 2, 2, 2, 2, d);
    rect(put, 6, 3, 8, 1, c);
    rect(put, 6, 4, 8, 1, d);
    rect(put, 10, 5, 1, 2, c);
    rect(put, 13, 5, 1, 2, c);
  });
const WRONG_KEY = KEY(false);
const GOLD_KEY = KEY(true);
class LockGate implements Entity {
  x: number;
  y: number;
  liftAt = -1;
  fixedAt = -1;
  rattleAt = -1e9;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number) {
    const x = this.x - cam;
    const lift = this.liftAt < 0 ? 0 : Math.min(1, (t - this.liftAt) / 600);
    drawStanding(g, BARS, x, this.y - lift * 130, U, { alpha: 1 - lift * 0.4 });
    drawStanding(g, PILLARS, x, this.y);
    flame(g, x - 16 * U, this.y - 56 * U, t, this.x);
    flame(g, x + 17 * U, this.y - 56 * U, t, this.x + 9);
    const lockY = this.y - 22 * U - lift * 130;
    const jig = t - this.rattleAt < 500 ? (Math.floor(t / 50) % 2 ? U : -U) : 0;
    const fixed = this.fixedAt >= 0;
    const pop = fixed ? Math.min(1, (t - this.fixedAt) / 300) : 0;
    if (lift < 1) {
      drawStanding(g, PADLOCK[lift > 0 ? 1 : 0], x + jig, lockY);
      // the key: the jammed wrong one until fixed, then the gold one sliding in
      drawStanding(
        g,
        fixed ? GOLD_KEY : WRONG_KEY,
        x + jig + 20 + (fixed ? (1 - pop) * 36 : 0),
        lockY - 4 * U,
        U,
        {
          alpha: fixed ? pop : 1
        }
      );
      if (!fixed && t - this.rattleAt < 400 && Math.floor(t / 60) % 2) {
        g.fillStyle = '#ffe37a';
        g.fillRect(x + 14, lockY - 9 * U, U, U);
        g.fillRect(x + 26, lockY - 6 * U, U, U);
      }
    }
  }
}
registerObstacle('lockgate', (b) => {
  const waitX = b.x - 70;
  const gateX = b.x + 50;
  const y = baseAt(b, gateX);
  b.add(260, 'flat');
  const gate = b.entity(new LockGate(gateX, y));
  const landX = gateX + 150;
  const hitX = gateX - 60 - MR;
  let flags: Record<string, boolean> = {};
  return {
    kind: 'lockgate',
    label: 'the jammed gate',
    waitX,
    pass: {
      dur: 2000,
      step(k, m) {
        if (k === 0) flags = {};
        if (!flags.key && k > 0.05) {
          flags.key = true;
          gate.fixedAt = m.t;
          note(72, { instrument: 'glock', level: 0.08 });
        }
        if (!flags.lift && k > 0.3) {
          flags.lift = true;
          gate.liftAt = m.t;
          m.fx.burst('sparkle', 10, gateX, y - 80);
          note(79, { instrument: 'glock', level: 0.08 });
          note(84, { at: 0.1, instrument: 'glock', level: 0.07 });
        }
        m.roll(waitX + (landX - waitX) * ease(span(k, 0.5, 1)));
      }
    },
    fail: {
      dur: 1200,
      step(k, m) {
        if (k === 0) flags = {};
        if (k < 0.4) m.roll(waitX + (hitX - waitX) * ease(k / 0.4));
        else {
          if (!flags.rattle) {
            flags.rattle = true;
            gate.rattleAt = m.t;
            m.bump();
            note(48, { instrument: 'marimba', level: 0.1 });
          }
          m.roll(hitX + (waitX - hitX) * ease(span(k, 0.45, 1)));
        }
      }
    }
  };
});

// ---- stompers: a squad of the level's enemies, one per sentence ------------
// Each holds up a numbered placard (its sentence on the card). A pass hops
// along the squad stomping the wrong ones and sails over the one that is
// right; a miss bounces off the first.
const PLACARD = [1, 2, 3, 4].map((n) =>
  makeSprite(11, 16, (put) => {
    rect(put, 5, 9, 1, 7, '#7d4f24');
    rect(put, 0, 0, 11, 10, '#f6f1e4');
    rect(put, 0, 9, 11, 1, '#cfc6ad');
    const glyphs: Record<number, string[]> = {
      1: ['.#.', '##.', '.#.', '.#.', '###'],
      2: ['##.', '..#', '.#.', '#..', '###'],
      3: ['##.', '..#', '.#.', '..#', '##.'],
      4: ['#.#', '#.#', '###', '..#', '..#']
    };
    glyphs[n].forEach((row, y) =>
      [...row].forEach((c, x) => c === '#' && put(4 + x, 2 + y, '#3a2c5a'))
    );
  })
);
class Squad implements Entity {
  x: number;
  y = 0;
  front = true;
  members: Enemy[];
  constructor(members: Enemy[]) {
    this.members = members;
    this.x = members[0].x;
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number, run: RunView) {
    this.members.forEach((e, i) => {
      if (!e.alive) return;
      const bob = Math.round(Math.sin(t / 300 + i) * 1) * U;
      drawStanding(g, PLACARD[i], e.x - cam + 10, e.topAt(run) - 4 + bob);
    });
  }
}
function stompable(b: Builder) {
  for (let i = 0; i < 6; i++) {
    const kind = b.enemyKind();
    if (!enemyDef(kind).spiky) return kind;
  }
  return 'beetle';
}
registerObstacle('stompers', (b) => {
  const waitX = b.x - 80;
  const kind = stompable(b);
  const xs = [0, 1, 2, 3].map((i) => b.x + 100 + i * 78);
  b.add(460, 'flat');
  const squad = xs.map((x) => {
    const e = b.entity(new Enemy(kind, x));
    e.def = { ...e.def, patrol: 6 };
    return e;
  });
  b.entity(new Squad(squad));
  const landX = xs[3] + 130;
  // the right sentence's enemy is spared: the marble sails over it
  let friend = 1;
  let flags: Record<string, boolean> = {};
  const stops = [waitX, ...xs, landX];
  return {
    kind: 'stompers',
    label: 'the squad',
    waitX,
    pass: {
      dur: 2200,
      step(k, m, t) {
        if (k === 0) {
          flags = {};
          friend = m.hint != null && m.hint >= 0 && m.hint < 4 ? m.hint : 1;
        }
        const hops = stops.length - 1;
        const i = Math.min(hops - 1, Math.floor(k * hops));
        const local = k * hops - i;
        const from = stops[i];
        const to = stops[i + 1];
        const target = squad[i];
        const high = i === friend + 1 || i === 0 ? 120 : 90;
        const p = m.arc(from, to, high, local);
        const top = target && target.alive ? target.topAt(m) - MR : null;
        m.place(p.x, top != null && local > 0.8 ? Math.min(p.y, top) : p.y);
        // landing on each enemy but the friend: stomp
        if (local > 0.95 && target && !flags[`s${i}`]) {
          flags[`s${i}`] = true;
          if (i === friend) {
            m.fx.burst('sparkle', 8, target.x, target.topAt(m) - 20);
            note(81, { instrument: 'glock', level: 0.07 });
          } else {
            target.stomp(t);
            thump(0.45);
            m.fx.burst('puff', 10, target.x, target.topAt(m) + 10);
            m.fx.text('STOMP!', target.x, target.topAt(m) - 50, '#fff', 11);
          }
        }
      }
    },
    fail: {
      dur: 1000,
      step(k, m) {
        if (k === 0) flags = {};
        const near = xs[0] - 44;
        if (k < 0.35) m.roll(waitX + (near - waitX) * easeIn(k / 0.35));
        else {
          if (!flags.bump) {
            flags.bump = true;
            m.bump();
          }
          const p = m.arc(near, waitX - 20, 46, span(k, 0.35, 1));
          m.place(p.x, p.y);
        }
      }
    }
  };
});

// ---- iceslide: three flag gates on a sheet of ice ------------------------
const ICE_W = 120;
const ICE = makeSprite(ICE_W, 8, (put) => {
  rect(put, 0, 0, ICE_W, 8, '#9fd8f0');
  rect(put, 0, 0, ICE_W, 2, '#e8fbff');
  rect(put, 0, 6, ICE_W, 2, '#5fa8cc');
  for (let x = 3; x < ICE_W; x += 13) {
    line(put, x, 3, x + 5, 3, '#ffffff');
    put(x + 8, 5, '#c8eefa');
  }
  for (let x = 0; x < ICE_W; x += 9)
    rect(put, x + 4, 8, 2, 1 + ((x * 7) % 3), '#bfe9f8');
});
const FLAG = [false, true].map((done) =>
  makeSprite(12, 30, (put) => {
    rect(put, 0, 0, 2, 30, '#d9e2ea');
    rect(put, 0, 0, 1, 30, '#ffffff');
    const c = done ? '#4bd17a' : '#ff6b8a';
    const d = done ? '#2c9a54' : '#c2405e';
    poly(
      put,
      [
        [2, 1],
        [11, 4],
        [2, 8]
      ],
      c
    );
    rect(put, 2, 7, 6, 1, d);
  })
);
class IceSlide implements Entity {
  x: number;
  y: number;
  gates: number[];
  passed = [-1, -1, -1];
  constructor(x: number, y: number, gates: number[]) {
    this.x = x;
    this.y = y;
    this.gates = gates;
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number) {
    drawStanding(g, ICE, this.x - cam, this.y + 7 * U);
    this.gates.forEach((gx, i) => {
      const done = this.passed[i] >= 0;
      const wave = done ? 0 : Math.round(Math.sin(t / 200 + i) * 1) * U;
      drawStanding(g, FLAG[done ? 1 : 0], gx - cam + wave, this.y);
      if (!done && Math.floor(t / 500 + i) % 3 === 0) {
        g.fillStyle = '#ffffff';
        g.fillRect(gx - cam - 8 * U, this.y - 2 * U, U, U);
      }
    });
  }
}
registerObstacle('iceslide', (b) => {
  const waitX = b.x - 70;
  const start = b.x + 30;
  const y = baseAt(b, start + 180);
  b.add(ICE_W * U + 120, 'flat');
  const mid = start + (ICE_W * U) / 2;
  const gates = [start + 70, mid, start + ICE_W * U - 70];
  const slide = b.entity(new IceSlide(mid, y, gates));
  const landX = start + ICE_W * U + 70;
  let flags: Record<string, boolean> = {};
  return {
    kind: 'iceslide',
    label: 'the ice slide',
    waitX,
    pass: {
      dur: 1700,
      step(k, m) {
        if (k === 0) {
          flags = {};
          slide.passed = [-1, -1, -1];
        }
        // a long fast slide: easing in, then gliding through the gates
        const x =
          waitX +
          (landX - waitX) *
            (k < 0.2
              ? easeIn(k / 0.2) * 0.12
              : 0.12 + 0.88 * ease(span(k, 0.2, 1)));
        m.roll(x);
        m.spin(0.16);
        gates.forEach((gx, i) => {
          if (x >= gx && !flags[`g${i}`]) {
            flags[`g${i}`] = true;
            slide.passed[i] = m.t;
            note(76 + i * 4, { instrument: 'glock', level: 0.08 });
            m.fx.burst('snow', 8, gx, y - 20);
          }
        });
        if (Math.random() < 0.5)
          m.fx.add({
            kind: 'snow',
            x: m.x - MR,
            y: y - 4,
            vx: -1.5,
            vy: -0.6,
            life: 0.6
          });
      }
    },
    fail: {
      dur: 1500,
      step(k, m) {
        if (k === 0) flags = {};
        // it slides in, loses its grip at the first gate and skids back
        const near = gates[0] - 30;
        if (k < 0.4) m.roll(waitX + (near - waitX) * ease(k / 0.4));
        else {
          if (!flags.spin) {
            flags.spin = true;
            m.bump('WHOA');
            whoosh(0.08, 0.3);
          }
          m.spin(-0.3 * (1 - span(k, 0.4, 1)));
          m.roll(near + (waitX - near) * ease(span(k, 0.4, 1)));
        }
      }
    }
  };
});

// ---- islands: floating islands that line up into steps -------------------
const ISLAND = makeSprite(30, 18, (put) => {
  // grass top, rocky underside, dangling roots
  poly(
    put,
    [
      [0, 4],
      [30, 4],
      [24, 13],
      [16, 18],
      [8, 13]
    ],
    '#8a6a52'
  );
  poly(
    put,
    [
      [3, 7],
      [27, 7],
      [22, 12],
      [16, 15],
      [9, 12]
    ],
    '#6f533f'
  );
  rect(put, 0, 1, 30, 4, '#5fbf4a');
  rect(put, 0, 1, 30, 1, '#9be37a');
  for (let x = 2; x < 30; x += 5) rect(put, x, 0, 2, 1, '#7ad65e');
  rect(put, 6, 5, 1, 4, '#4a3426');
  rect(put, 20, 5, 1, 5, '#4a3426');
  put(12, 9, '#a8876b');
  put(18, 8, '#a8876b');
});
class Islands implements Entity {
  x: number;
  y: number;
  spots: { x: number; y: number; homeY: number }[];
  alignedAt = -1;
  wobbleAt = -1e9;
  constructor(spots: { x: number; y: number }[]) {
    this.spots = spots.map((s, i) => ({
      ...s,
      homeY: s.y + (i % 2 ? 40 : -26)
    }));
    this.x = spots[0].x;
    this.y = spots[0].y;
  }
  islandY(i: number, t: number) {
    const s = this.spots[i];
    const k =
      this.alignedAt < 0
        ? 0
        : Math.min(1, (t - this.alignedAt - i * 120) / 360);
    const y = s.homeY + (s.y - s.homeY) * Math.max(0, k);
    const bob = this.alignedAt < 0 ? Math.sin(t / 500 + i * 1.7) * 6 : 0;
    const wob = t - this.wobbleAt < 500 ? Math.sin(t / 30 + i) * 4 : 0;
    return y + bob + wob;
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number) {
    this.spots.forEach((s, i) =>
      drawStanding(g, ISLAND, s.x - cam, this.islandY(i, t) + 16 * U)
    );
  }
}
registerObstacle('islands', (b) => {
  const waitX = b.x - 70;
  const base = baseAt(b, b.x + 200);
  // four steps up and over: their tops are where the marble lands
  const spots = [0, 1, 2, 3].map((i) => ({
    x: b.x + 70 + i * 100,
    y: base - 50 - [0, 34, 52, 26][i]
  }));
  b.add(520, 'flat');
  const isles = b.entity(new Islands(spots));
  const landX = spots[3].x + 130;
  let flags: Record<string, boolean> = {};
  return {
    kind: 'islands',
    label: 'the floating islands',
    waitX,
    pass: {
      dur: 2400,
      step(k, m) {
        if (k === 0) flags = {};
        if (!flags.align) {
          flags.align = true;
          isles.alignedAt = m.t;
          [0, 1, 2, 3].forEach((i) =>
            note(72 + i * 3, { at: i * 0.12, instrument: 'glock', level: 0.07 })
          );
        }
        if (k < 0.2) return;
        // hop island to island, then down to the ground
        const hops = [waitX, ...spots.map((s) => s.x), landX];
        const kk = span(k, 0.2, 1) * (hops.length - 1);
        const i = Math.min(hops.length - 2, Math.floor(kk));
        const local = kk - i;
        const fromY =
          i === 0 ? (m.restY(waitX) ?? base - MR) : spots[i - 1].y - MR;
        const toY =
          i + 1 < hops.length - 1
            ? spots[i].y - MR
            : (m.restY(landX) ?? base - MR);
        const x = hops[i] + (hops[i + 1] - hops[i]) * local;
        const yy = fromY + (toY - fromY) * local - 70 * 4 * local * (1 - local);
        m.place(x, yy);
        m.spin(0.1);
        if (local > 0.92 && !flags[`h${i}`] && i < spots.length) {
          flags[`h${i}`] = true;
          m.fx.burst('leaf', 5, spots[i].x, spots[i].y);
          thump(0.2);
        }
      }
    },
    fail: {
      dur: 1500,
      step(k, m) {
        if (k === 0) flags = {};
        // the first jump: the islands drift apart and it drops back
        const first = isles.spots[0];
        if (k < 0.35) {
          const from = m.restY(waitX) ?? base - MR;
          const yy =
            from +
            (first.homeY - 20 - from) * (k / 0.35) -
            50 * Math.sin(Math.PI * (k / 0.35));
          m.place(waitX + (first.x - 40 - waitX) * (k / 0.35), yy);
          return;
        }
        if (!flags.drop) {
          flags.drop = true;
          isles.wobbleAt = m.t;
          m.bump();
          whoosh(0.08, 0.3, 0, 300, 120);
        }
        const p = m.arc(first.x - 40, waitX, 30, span(k, 0.35, 1));
        m.place(p.x, p.y);
      }
    }
  };
});

export type { RunView };
