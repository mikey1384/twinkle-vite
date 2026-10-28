import { makeSprite, rect, disc, poly, line, ring, drawSprite, drawStanding, pxEllipse, hash2, r3, canvas, Sprite, U, W, INK } from '../../pixel';
import { MR } from '../../marble';
import { thump, note, whoosh } from '../../audio';
import { paletteOf } from '../terrain';
import type { Entity, MarbleCtl, Builder, RunView } from '../types';
import { registerObstacle, ease, easeIn, easeInOut, span } from './registry';

// Themed obstacles (Super Mario Bros. 3 / Super Mario World / Yoshi's Island
// flavour): ghost-house Boo, ghost doors, note blocks, warp pipes, a storm
// cloud, a laser gate, and the mine-cart set (broken track, bat tunnel, loop).
// Same contract as ground.ts: read the builder's cursor, add ground and
// entities, script a pass and a fail.

// One-shot cues inside a move. The runner starts a move between frames, so
// the first step can arrive with k > 0; a new run is detected by k going
// backwards instead of waiting for k === 0.
function cues() {
  let last = 2;
  let fired = new Set<string>();
  return {
    tick(k: number) {
      if (k < last) fired = new Set();
      last = k;
    },
    once(name: string, when: boolean, fn: () => void) {
      if (when && !fired.has(name)) {
        fired.add(name);
        fn();
      }
    }
  };
}

// a parabola between two explicit points (ledges, blocks, pipe mouths)
function hop(x0: number, y0: number, x1: number, y1: number, h: number, k: number) {
  return { x: x0 + (x1 - x0) * k, y: y0 + (y1 - y0) * k - h * 4 * k * (1 - k) };
}

// a chunky pixel line on the canvas (bolts, beams, rails)
function pxLine(g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, col: string, w = U) {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) / U));
  g.fillStyle = col;
  for (let i = 0; i <= n; i++) {
    g.fillRect(r3(x0 + ((x1 - x0) * i) / n - w / 2), r3(y0 + ((y1 - y0) * i) / n - w / 2), w, w);
  }
}

// the sky lane in fly levels (level.ts FLY_LANE; the Builder has no restY)
const flyLane = (x: number) => r3(200 + Math.sin(x / 260) * 26);

// ===========================================================================
// ghost: a shy Boo. Stare it down and it hides its face; look away and BOO!
// ===========================================================================
type GhostFace = 'look' | 'shy' | 'boo';
const G_BODY = '#f6f3ff';
const G_SHADE = '#cfc6ec';
const G_EDGE = '#9a8fc4';
const G_MOUTH = '#5a1638';
const G_TONGUE = '#ff6f9a';
function ghostSprite(face: GhostFace, f: number) {
  return makeSprite(26, 24, (put) => {
    // a wispy tail curling off the back
    const tw = f ? 1 : 0;
    poly(put, [[16, 12], [25, 7 + tw], [24, 12 + tw], [19, 19]], G_BODY);
    put(24, 8 + tw, G_SHADE);
    put(23, 11 + tw, G_SHADE);
    disc(put, 12, 12, 11, 10.5, G_BODY, G_SHADE, '#ffffff');
    if (face === 'look') {
      disc(put, 1.5, 15, 2.2, 1.7, G_BODY, G_SHADE);
      disc(put, 22.5, 16 - tw, 2.2, 1.7, G_BODY, G_SHADE);
      rect(put, 5, 7, 2, 5, INK);
      rect(put, 10, 7, 2, 5, INK);
      put(5, 7, '#ffffff');
      put(10, 7, '#ffffff');
      poly(put, [[4, 14], [13, 14], [11.5, 19], [5.5, 19]], G_MOUTH);
      disc(put, 8.5, 18, 2.4, 1.3, G_TONGUE);
      put(5, 14, '#ffffff');
      put(12, 14, '#ffffff');
      put(5, 15, '#ffffff');
      put(12, 15, '#ffffff');
    } else if (face === 'shy') {
      // little arms over its eyes, one pupil peeking between them
      for (const ax of [5, 11.5]) {
        disc(put, ax, 9, 3.6, 2.8, G_EDGE);
        disc(put, ax, 8.8, 2.9, 2.2, G_BODY, undefined, '#ffffff');
      }
      put(8, 10, INK);
      rect(put, 2, 12, 2, 1, '#ff9db0');
      rect(put, 14, 12, 2, 1, '#ff9db0');
      put(6, 15, INK);
      put(7, 16, INK);
      put(8, 15, INK);
      put(9, 16, INK);
      put(10, 15, INK);
    } else {
      // BOO: arms up, brows down, a huge mouth
      disc(put, 1, 6, 2.2, 1.8, G_BODY, G_SHADE);
      disc(put, 23, 5 + tw, 2.2, 1.8, G_BODY, G_SHADE);
      line(put, 3, 5, 7, 7, INK);
      line(put, 13, 5, 9, 7, INK);
      rect(put, 5, 8, 2, 4, INK);
      rect(put, 10, 8, 2, 4, INK);
      put(5, 8, '#ff3c5a');
      put(10, 8, '#ff3c5a');
      poly(put, [[3, 13], [15, 13], [13, 21], [5, 21]], G_MOUTH);
      disc(put, 9, 19.5, 3, 1.6, G_TONGUE);
      for (const fx of [4, 6, 12, 14]) put(fx, 13, '#ffffff');
      put(5, 14, '#ffffff');
      put(13, 14, '#ffffff');
    }
  });
}
const GHOST: Record<GhostFace, Sprite[]> = {
  look: [0, 1].map((f) => ghostSprite('look', f)),
  shy: [0, 1].map((f) => ghostSprite('shy', f)),
  boo: [0, 1].map((f) => ghostSprite('boo', f))
};

class Ghost implements Entity {
  x: number;
  y: number;
  front = true;
  shyUntil = -1e9;
  booAt = -1e9;
  // 0..1: how far it has lunged toward the marble's face
  swoop = 0;
  swoopX = 0;
  swoopY = 0;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number, run: RunView) {
    if (this.x - cam < -160 || this.x - cam > W + 160) return;
    const face: GhostFace = t - this.booAt < 900 ? 'boo' : t < this.shyUntil ? 'shy' : 'look';
    const s = this.swoop;
    const idleX = this.x + Math.sin(t / 1300 + this.x) * 14;
    const idleY = this.y + Math.sin(t / 420 + this.x) * 9;
    let x = idleX + (this.swoopX - idleX) * s;
    const y = idleY + (this.swoopY - idleY) * s;
    // shy Boos tremble and go see-through
    if (face === 'shy') x += Math.floor(t / 60) % 2 ? U : -U;
    const alpha = face === 'shy' ? 0.62 + Math.sin(t / 90) * 0.08 : 0.94;
    const scale = face === 'boo' && s > 0.4 ? 5 : 4;
    const spr = GHOST[face][Math.floor(t / 300) % 2];
    const gy = run.groundAt(this.x);
    if (gy !== null) pxEllipse(g, x - cam, gy - U, 30 - s * 6, U * 2, 'rgba(60,30,100,.18)');
    // ectoplasm wisps trailing behind
    for (let i = 0; i < 3; i++) {
      const ph = ((t / 900 + i / 3) % 1);
      g.fillStyle = `rgba(220,205,255,${0.5 * (1 - ph)})`;
      g.fillRect(r3(x - cam + 40 + ph * 40 + i * 6), r3(y + 10 + Math.sin(t / 200 + i) * 8 - ph * 20), U, U);
    }
    const flip = run.marbleX > x + 30;
    drawSprite(g, spr, x - cam - (spr.width * scale) / 2, y - (spr.height * scale) / 2, scale, { flip, alpha });
  }
}

registerObstacle('ghost', (b) => {
  const waitX = b.x - 80;
  const gx = b.x + 130;
  const gy = b.y - 165;
  b.add(400, 'flat');
  const ghost = b.entity(new Ghost(gx, gy));
  const landX = gx + 200;
  const pc = cues();
  const fc = cues();
  return {
    kind: 'ghost',
    label: 'the ghost',
    waitX,
    pass: {
      dur: 1900,
      step(k, m, t) {
        pc.tick(k);
        ghost.swoop = 0;
        // edge up, then a long hard stare
        if (k < 0.15) m.roll(waitX + 40 * ease(k / 0.15));
        else if (k < 0.42) {
          m.roll(waitX + 40);
          m.squash(0.88);
          pc.once('stare', true, () => {
            ghost.shyUntil = t + 1500;
            m.fx.burst('sparkle', 5, m.x + 24, m.y - 14, { dir: -0.6, spread: 0.6, speed: 0.8 });
            m.fx.text('EEP!', ghost.x, ghost.y - 66, '#ffc4dc', 10);
            note(84, { instrument: 'glock', level: 0.07 });
            note(88, { at: 0.08, instrument: 'glock', level: 0.06 });
            note(91, { at: 0.16, instrument: 'glock', level: 0.05 });
          });
        } else {
          // keep it covering its face while the marble slips underneath
          ghost.shyUntil = Math.max(ghost.shyUntil, t + 300);
          m.roll(waitX + 40 + (landX - waitX - 40) * easeInOut(span(k, 0.42, 1)));
          if (Math.random() < 0.3) m.fx.add({ kind: 'dust', x: m.x - 30, y: m.y + 24, vx: -1.5, vy: -0.4, life: 0.6 });
        }
      }
    },
    fail: {
      dur: 1600,
      step(k, m, t) {
        fc.tick(k);
        const nearX = gx - 120;
        if (k < 0.3) {
          ghost.swoop = 0;
          m.roll(waitX + (nearX - waitX) * ease(k / 0.3));
          return;
        }
        fc.once('boo', true, () => {
          ghost.booAt = t;
          ghost.swoopX = nearX + 62;
          ghost.swoopY = m.y - 22;
          m.fx.text('BOO!', nearX + 70, m.y - 96, '#c79bff', 18);
          m.fx.tint(t, 260, 'rgba(90,40,160,.22)');
          m.fx.shake(t, 5, 220);
          whoosh(0.1, 0.4, 0, 500, 120);
          note(47, { instrument: 'marimba', level: 0.18 });
          note(43, { at: 0.09, instrument: 'marimba', level: 0.16 });
        });
        // lunge in, hold, drift back up
        ghost.swoop = k < 0.42 ? ease(span(k, 0.3, 0.42)) : 1 - easeInOut(span(k, 0.62, 1));
        if (k < 0.4) {
          m.roll(nearX);
          return;
        }
        fc.once('flinch', true, () => {
          m.bump('YIKES!');
          m.fx.burst('sweat', 4, m.x + 10, m.y - 30, { dir: -Math.PI / 2, spread: 1.4, speed: 0.6 });
        });
        if (k < 0.85) {
          const p = m.arc(nearX, waitX - 20, 50, span(k, 0.4, 0.85));
          m.place(p.x, p.y);
        } else m.roll(waitX - 20);
      }
    }
  };
});

// ===========================================================================
// door: walk-in doors. A right answer opens it and pops out of the next door;
// a wrong one finds it locked.
// ===========================================================================
interface DoorPal {
  frame: string;
  frameDark: string;
  door: string;
  dark: string;
  light: string;
  knob: string;
  inside: string;
}
const DOOR_PALS: Record<'wood' | 'mirror' | 'neon', DoorPal> = {
  wood: { frame: '#6a5070', frameDark: '#4a3450', door: '#8a5a3a', dark: '#6b4229', light: '#b07a4e', knob: '#ffcb32', inside: '#1a1030' },
  mirror: { frame: '#d4dcec', frameDark: '#9aa4c0', door: '#9a86d8', dark: '#7058b0', light: '#d6c8ff', knob: '#ffffff', inside: '#22163e' },
  neon: { frame: '#2a3350', frameDark: '#1c2440', door: '#3a4670', dark: '#252e50', light: '#29e0d0', knob: '#ff4fd8', inside: '#0c0e1e' }
};
// inside an arched opening spanning l..r, starting at top
function inArch(x: number, y: number, l: number, r: number, top: number) {
  if (x < l || x > r || y < top) return false;
  const rx = (r - l + 1) / 2;
  const cx = l + rx - 0.5;
  const cy = top + rx;
  if (y >= cy) return true;
  const dx = (x - cx) / rx;
  const dy = (y - cy) / rx;
  return dx * dx + dy * dy <= 1;
}
function doorSprite(p: DoorPal, open: boolean, style: string) {
  return makeSprite(28, 38, (put) => {
    for (let y = 0; y < 38; y++) {
      for (let x = 0; x < 28; x++) {
        if (!inArch(x, y, 0, 27, 0)) continue;
        if (inArch(x, y, 3, 24, 3)) {
          if (open) {
            // the dark beyond, deeper toward the back
            put(x, y, y < 12 || x > 20 ? '#000000' : p.inside);
          } else {
            const seam = (x - 3) % 5 === 4;
            put(x, y, seam ? p.dark : (x - 3) % 5 === 0 ? p.light : p.door);
          }
        } else {
          // stone (or silver, or metal) frame with block seams
          // a dark lip just around the doorway gives it depth
          const seam = (y % 6 === 0 && (x < 3 || x > 24)) || ((x + y) % 11 === 0 && y < 6);
          put(x, y, seam || inArch(x, y, 2, 25, 2) ? p.frameDark : p.frame);
        }
      }
    }
    rect(put, 0, 36, 28, 2, p.frameDark);
    if (open) {
      // the door swung inward, seen edge-on, and something watching
      rect(put, 3, 13, 3, 23, p.door);
      rect(put, 5, 13, 1, 23, p.dark);
      if (style === 'wood') {
        put(12, 20, '#ffd84a');
        put(16, 20, '#ffd84a');
      } else {
        ring(put, 14, 22, 4, p.light, 20);
        ring(put, 14, 22, 2, p.knob, 12);
      }
    } else {
      for (const by of [12, 29]) {
        rect(put, 3, by, 22, 2, '#3a3f49');
        for (const rx of [5, 12, 19, 23]) put(rx, by, '#8a8f99');
      }
      disc(put, 20.5, 22, 1.6, 1.6, p.knob, undefined, '#ffffff');
      put(20, 25, INK);
      put(20, 26, INK);
    }
  });
}
const PADLOCK = makeSprite(9, 11, (put) => {
  ring(put, 4, 4, 3, '#c9ced8', 20);
  rect(put, 0, 4, 9, 7, '#ffcb32');
  rect(put, 0, 4, 9, 1, '#ffe68a');
  rect(put, 0, 10, 9, 1, '#c98a00');
  put(4, 6, INK);
  rect(put, 4, 7, 1, 2, INK);
});
const DOOR_CACHE = new Map<string, Sprite[]>();
function doorFrames(style: 'wood' | 'mirror' | 'neon') {
  let hit = DOOR_CACHE.get(style);
  if (!hit) {
    hit = [doorSprite(DOOR_PALS[style], false, style), doorSprite(DOOR_PALS[style], true, style)];
    DOOR_CACHE.set(style, hit);
  }
  return hit;
}

class Door implements Entity {
  x: number;
  y: number; // the floor the door stands on
  front: boolean;
  frames: Sprite[];
  open = false;
  rattleAt = -1e9;
  constructor(x: number, y: number, frames: Sprite[], front: boolean) {
    this.x = x;
    this.y = y;
    this.frames = frames;
    this.front = front;
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number) {
    if (this.x - cam < -120 || this.x - cam > W + 120) return;
    const r = t - this.rattleAt;
    const shake = r < 500 ? (Math.floor(t / 45) % 2 ? U : -U) : 0;
    drawStanding(g, this.frames[this.open ? 1 : 0], this.x - cam + shake, this.y);
    if (r < 1200) {
      // the padlock snaps on and jiggles
      const jig = r < 600 ? (Math.floor(t / 60) % 2 ? U : 0) : 0;
      drawSprite(g, PADLOCK, this.x - cam + 9 + jig, this.y - 72 + jig, U, { alpha: Math.min(1, (1200 - r) / 250) });
    }
  }
}

registerObstacle('door', (b) => {
  const style = b.theme.terrain === 'crystal' ? 'mirror' : b.theme.terrain === 'circuit' ? 'neon' : 'wood';
  const frames = doorFrames(style);
  const waitX = b.x - 80;
  const wallX = b.x;
  const floor = b.y;
  const rest = floor - MR;
  const WALL = 162;
  b.y -= WALL;
  b.add(210, 'raised');
  b.y += WALL;
  b.add(250, 'flat');
  const d1 = b.entity(new Door(wallX + 48, floor, frames, true));
  const d2 = b.entity(new Door(wallX + 210 + 130, floor, frames, false));
  const landX = d2.x + 95;
  const pc = cues();
  const fc = cues();
  const creak = (at = 0) => {
    note(50, { at, instrument: 'marimba', level: 0.1 });
    note(53, { at: at + 0.12, instrument: 'marimba', level: 0.08 });
  };
  return {
    kind: 'door',
    label: 'the door',
    waitX,
    pass: {
      dur: 2400,
      step(k, m, _t) {
        pc.tick(k);
        pc.once('open1', k > 0.04, () => {
          d1.open = true;
          creak();
        });
        if (k < 0.32) {
          m.place(waitX + (d1.x - waitX) * easeInOut(span(k, 0.06, 0.32)), rest);
          return;
        }
        pc.once('in', true, () => m.hide(true));
        pc.once('shut1', k > 0.4, () => {
          d1.open = false;
          thump(0.4);
          m.fx.burst('dust', 6, d1.x, floor - 6);
        });
        if (k < 0.64) {
          // through the house unseen: the camera follows to the next door
          m.place(d1.x + (d2.x - d1.x) * easeInOut(span(k, 0.36, 0.6)), rest);
          pc.once('open2', k > 0.58, () => {
            d2.open = true;
            creak();
          });
          return;
        }
        pc.once('out', true, () => {
          m.hide(false);
          m.fx.burst('puff', 12, d2.x, rest);
          m.fx.burst('sparkle', 6, d2.x, rest - 20);
          note(79, { instrument: 'glock', level: 0.08 });
          note(84, { at: 0.07, instrument: 'glock', level: 0.07 });
        });
        pc.once('shut2', k > 0.86, () => {
          d2.open = false;
          thump(0.3);
        });
        m.roll(d2.x + (landX - d2.x) * ease(span(k, 0.64, 0.96)));
      }
    },
    fail: {
      dur: 1500,
      step(k, m, t) {
        fc.tick(k);
        const atX = wallX - MR + 2;
        if (k < 0.3) {
          m.roll(waitX + (atX - waitX) * ease(k / 0.3));
          return;
        }
        fc.once('rattle', true, () => {
          d1.rattleAt = t;
          m.fx.text('RATTLE', d1.x, floor - 130, '#ffe08a', 10);
          [60, 62, 60, 62].forEach((n, i) => note(n, { at: i * 0.07, instrument: 'marimba', level: 0.1 }));
        });
        if (k < 0.55) {
          // tugging at the handle
          m.roll(atX - (Math.floor(t / 60) % 2 ? 6 : 0));
          return;
        }
        fc.once('bump', true, () => m.bump('LOCKED'));
        if (k < 0.92) {
          const p = m.arc(atX, waitX - 15, 34, span(k, 0.55, 0.92));
          m.place(p.x, p.y);
        } else m.roll(waitX - 15);
      }
    }
  };
});

// ===========================================================================
// note: Super Mario World note blocks over a gap. Boing boing boing.
// ===========================================================================
const NOTE_BLOCK = makeSprite(18, 18, (put) => {
  rect(put, 0, 0, 18, 18, '#fff6e0');
  rect(put, 0, 0, 18, 1, '#ffffff');
  rect(put, 0, 0, 1, 18, '#ffffff');
  rect(put, 17, 1, 1, 17, '#d8c8a0');
  rect(put, 1, 17, 17, 1, '#d8c8a0');
  rect(put, 16, 2, 1, 15, '#eadcb8');
  for (const [cx, cy] of [[0, 0], [17, 0], [0, 17], [17, 17]]) put(cx, cy, null);
  // an eighth note
  disc(put, 7, 12.5, 2.6, 2, INK);
  rect(put, 9, 4, 1, 9, INK);
  line(put, 10, 4, 12, 7, INK);
  put(12, 8, INK);
  put(6, 12, '#5a5a6a');
});
const NOTE_COLORS = ['#ff6fa8', '#ffcb32', '#5ad1ff', '#8ae05e', '#c79bff'];
const NOTE_ICONS = NOTE_COLORS.map((c) =>
  makeSprite(6, 8, (put) => {
    disc(put, 2, 6, 2, 1.6, c);
    rect(put, 3, 0, 1, 6, c);
    rect(put, 4, 0, 2, 1, c);
    put(5, 1, c);
  })
);

class NoteRow implements Entity {
  x: number;
  y: number; // block tops
  blocks: { x: number; hitAt: number }[];
  floaters: { x: number; y: number; at: number; c: number }[] = [];
  constructor(xs: number[], top: number) {
    this.x = xs[0];
    this.y = top;
    this.blocks = xs.map((x) => ({ x, hitAt: -1e9 }));
  }
  hit(i: number, t: number) {
    const bl = this.blocks[i];
    bl.hitAt = t;
    for (let j = 0; j < 2; j++) this.floaters.push({ x: bl.x - 10 + j * 22, y: this.y - 8, at: t + j * 90, c: (i + j) % NOTE_COLORS.length });
  }
  dip(i: number, t: number) {
    const k = (t - this.blocks[i].hitAt) / 260;
    return k < 0 || k > 1 ? 0 : Math.sin(k * Math.PI) * 12 * (1 - k * 0.4);
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number) {
    if (this.x - cam > W + 100 || this.blocks[this.blocks.length - 1].x - cam < -100) return;
    this.blocks.forEach((bl, i) => {
      // a lazy wave along the row, like the blocks are humming
      const hum = Math.round(Math.sin(t / 320 - i * 0.9)) * U;
      const lit = t - bl.hitAt < 120;
      drawSprite(g, NOTE_BLOCK, bl.x - cam - (NOTE_BLOCK.width * U) / 2, this.y - U + this.dip(i, t) + hum, U, { white: lit });
    });
    this.floaters = this.floaters.filter((f) => t - f.at < 1100);
    for (const f of this.floaters) {
      const k = (t - f.at) / 1100;
      if (k < 0) continue;
      drawSprite(g, NOTE_ICONS[f.c], f.x - cam + Math.sin(k * 9) * 8, f.y - k * 90, U, { alpha: 1 - k });
    }
  }
}

registerObstacle('note', (b) => {
  const waitX = b.x - 70;
  const gx = b.x;
  const top = r3(b.y - 66);
  b.add(336, 'gap');
  b.add(190, 'flat');
  const xs = [48, 128, 208, 288].map((d) => gx + d);
  const row = b.entity(new NoteRow(xs, top));
  const landX = gx + 336 + 80;
  const onTop = top - MR;
  // do-mi-sol-do climbing, then the landing chord
  const PITCH = [72, 76, 79, 84];
  const pc = cues();
  const fc = cues();
  const boing = (i: number, m: MarbleCtl, t: number) => {
    row.hit(i, t);
    note(PITCH[i], { instrument: 'glock', level: 0.11 });
    note(PITCH[i] + 12, { at: 0.05, instrument: 'bell', level: 0.04 });
    m.squash(0.68);
    m.fx.burst('sparkle', 3, xs[i], top);
  };
  return {
    kind: 'note',
    label: 'the note blocks',
    waitX,
    pass: {
      dur: 2300,
      step(k, m, t) {
        pc.tick(k);
        const startY = m.restY(waitX) ?? onTop;
        const pts: [number, number][] = [[waitX, startY], ...xs.map((x) => [x, onTop] as [number, number]), [landX, m.restY(landX) ?? onTop]];
        const seg = Math.min(4, Math.floor(k * 5));
        const sk = k * 5 - seg;
        const [x0, y0] = pts[seg];
        const [x1, y1] = pts[seg + 1];
        // each block springs it a little higher
        const p = hop(x0, y0, x1, y1, 70 + seg * 10, k >= 1 ? 1 : sk);
        m.place(p.x, p.y);
        m.spin(0.12);
        for (let i = 0; i < 4; i++) pc.once(`b${i}`, k >= (i + 1) / 5, () => boing(i, m, t));
        pc.once('land', k >= 1, () => {
          note(84, { instrument: 'bell', level: 0.09 });
          note(88, { instrument: 'bell', level: 0.07 });
          note(91, { instrument: 'glock', level: 0.05 });
        });
      }
    },
    fail: {
      dur: 2500,
      step(k, m, t) {
        fc.tick(k);
        if (k < 0.2) {
          const p = hop(waitX, m.restY(waitX) ?? onTop, xs[0], onTop, 70, k / 0.2);
          m.place(p.x, p.y);
          return;
        }
        fc.once('b0', true, () => boing(0, m, t));
        if (k < 0.38) {
          const p = hop(xs[0], onTop, xs[1], onTop, 80, span(k, 0.2, 0.38));
          m.place(p.x, p.y);
          return;
        }
        fc.once('b1', true, () => {
          // a sour note: the block over-bounces and flings it sideways
          row.hit(1, t);
          note(61, { instrument: 'marimba', level: 0.14 });
          note(60, { at: 0.06, instrument: 'marimba', level: 0.12 });
          m.squash(0.55);
          m.fx.text('BOING?', xs[1], top - 80, '#ffe08a', 10);
        });
        if (k < 0.6) {
          const p = hop(xs[1], onTop, xs[1] + 46, top + 40, 120, span(k, 0.38, 0.6));
          m.place(p.x, p.y);
          m.spin(-0.15);
          return;
        }
        fc.once('fall', true, () => {
          m.fall();
          whoosh(0.08, 0.5, 0, 900, 200);
        });
        fc.once('back', k > 0.86, () => m.respawn(waitX));
      }
    }
  };
});

// ===========================================================================
// pipe: SMB3 warp pipes. In the top of one, out of the next.
// ===========================================================================
const P_DEEP = '#145a1c';
const P_DARK = '#1f8a2a';
const P_MID = '#3fbf4f';
const P_LIGHT = '#6fdc5c';
const P_HI = '#c8f7b0';
function pipeShade(x: number, w: number) {
  const u = (x + 0.5) / w;
  if (u < 0.07) return P_DARK;
  if (u < 0.16) return P_MID;
  if (u < 0.22) return P_LIGHT;
  if (u < 0.3) return P_HI;
  if (u < 0.38) return P_LIGHT;
  if (u < 0.66) return P_MID;
  if (u < 0.74) return P_DARK;
  if (u < 0.8) return P_MID;
  if (u < 0.88) return P_DARK;
  return P_DEEP;
}
function pipeSprite(h: number) {
  return makeSprite(38, h, (put) => {
    for (let x = 0; x < 32; x++) rect(put, 3 + x, 10, 1, h - 10, pipeShade(x, 32));
    // the rim overhangs the body
    for (let x = 0; x < 38; x++) rect(put, x, 0, 1, 10, pipeShade(x, 38));
    rect(put, 0, 0, 38, 1, P_HI);
    rect(put, 2, 1, 34, 1, P_LIGHT);
    rect(put, 0, 9, 38, 1, P_DEEP);
    rect(put, 3, 10, 32, 1, '#0e3a14');
  });
}
const PIPE_SPRITES = new Map<number, Sprite>();
function pipeOf(h: number) {
  let s = PIPE_SPRITES.get(h);
  if (!s) PIPE_SPRITES.set(h, (s = pipeSprite(h)));
  return s;
}

class Pipe implements Entity {
  x: number; // centre
  y: number; // floor
  front = true;
  sprite: Sprite;
  bonkAt = -1e9;
  steamAt = -1e9;
  constructor(x: number, floor: number, hArt: number) {
    this.x = x;
    this.y = floor;
    this.sprite = pipeOf(hArt);
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number) {
    if (this.x - cam < -140 || this.x - cam > W + 140) return;
    const b = t - this.bonkAt;
    const wob = b < 300 ? Math.round(Math.sin(b / 30) * (1 - b / 300) * 2) * U : 0;
    drawStanding(g, this.sprite, this.x - cam + wob, this.y);
    const top = this.y - (this.sprite.height - 2) * U;
    // a breath of steam from the exit pipe as the marble's about to arrive
    const s = t - this.steamAt;
    if (s > 0 && s < 700) {
      for (let i = 0; i < 4; i++) {
        const k = (s / 700 + i * 0.2) % 1;
        g.fillStyle = `rgba(255,255,255,${0.7 * (1 - k)})`;
        g.fillRect(r3(this.x - cam - 24 + i * 15), r3(top - 6 - k * 40), U * 2, U * 2);
      }
    }
  }
}

registerObstacle('pipe', (b) => {
  const waitX = b.x - 100;
  const floor = b.y;
  const H1 = 36;
  const H2 = 28;
  const p1x0 = b.x;
  b.y -= H1 * U;
  b.add(96, 'raised', 0, 'pipe');
  b.y += H1 * U;
  b.add(230, 'flat');
  const p2x0 = b.x;
  b.y -= H2 * U;
  b.add(96, 'raised', 0, 'pipe');
  b.y += H2 * U;
  b.add(180, 'flat');
  const p1 = b.entity(new Pipe(p1x0 + 48, floor, H1));
  const p2 = b.entity(new Pipe(p2x0 + 48, floor, H2));
  const top1 = floor - H1 * U;
  const top2 = floor - H2 * U;
  const landX = p2x0 + 96 + 90;
  const rimX = p1x0 - 9; // the rim's left lip
  const pc = cues();
  const fc = cues();
  return {
    kind: 'pipe',
    label: 'the warp pipe',
    waitX,
    pass: {
      dur: 2400,
      step(k, m, t) {
        pc.tick(k);
        if (k < 0.28) {
          const p = m.arc(waitX, p1.x, 150, ease(k / 0.28));
          m.place(p.x, p.y);
          return;
        }
        pc.once('in', true, () => {
          m.fx.burst('puff', 6, p1.x, top1);
          // the classic warp: three falling pulses
          [52, 48, 43].forEach((n, i) => note(n, { at: i * 0.09, instrument: 'marimba', level: 0.14 }));
          thump(0.3, 0.27);
        });
        if (k < 0.4) {
          // sink down the pipe (it is drawn in front of the marble)
          m.place(p1.x, top1 - MR + (MR * 2 + 12) * easeIn(span(k, 0.28, 0.4)));
          return;
        }
        pc.once('hide', true, () => m.hide(true));
        if (k < 0.68) {
          m.place(p1.x + (p2.x - p1.x) * easeInOut(span(k, 0.42, 0.66)), top2 + MR + 12);
          pc.once('steam', k > 0.55, () => (p2.steamAt = t));
          return;
        }
        pc.once('out', true, () => {
          m.hide(false);
          m.fx.burst('puff', 12, p2.x, top2);
          whoosh(0.1, 0.3, 0, 400, 1600);
          note(67, { instrument: 'glock', level: 0.09 });
          note(79, { at: 0.07, instrument: 'glock', level: 0.08 });
        });
        if (k < 0.78) {
          // shoots straight up out of the mouth
          m.place(p2.x, top2 + MR + 12 - (MR * 2 + 12 + 70) * ease(span(k, 0.68, 0.78)));
          return;
        }
        const p = hop(p2.x, top2 - MR - 70, landX, m.restY(landX) ?? floor - MR, 30, span(k, 0.78, 1));
        m.place(p.x, p.y);
        m.spin(0.2);
      }
    },
    fail: {
      dur: 1500,
      step(k, m, t) {
        fc.tick(k);
        const rest = m.restY(waitX) ?? floor - MR;
        const hitX = rimX - MR + 3;
        const hitY = top1 + 15;
        if (k < 0.38) {
          // a jump that comes up short, right into the rim
          const u = k / 0.38;
          m.place(waitX + (hitX - waitX) * u, rest + (hitY - rest) * ease(u));
          return;
        }
        fc.once('bonk', true, () => {
          p1.bonkAt = t;
          m.bump('BONK');
          thump(0.6);
          m.fx.burst('star', 5, rimX, hitY, { color: '#ffe08a', speed: 0.7 });
        });
        if (k < 0.9) {
          const p = hop(hitX, hitY, waitX - 20, rest, 24, span(k, 0.38, 0.9));
          m.place(p.x, Math.min(p.y, rest));
          m.spin(-0.08);
        } else m.roll(waitX - 20);
      }
    }
  };
});

// ===========================================================================
// storm: a grumpy thundercloud zapping the path. Works on the ground and in
// the sky (the bolt strikes the flying lane).
// ===========================================================================
type CloudFace = 'grump' | 'charge' | 'zap';
function cloudSprite(face: CloudFace) {
  return makeSprite(46, 28, (put) => {
    const C = '#8a86a8';
    const CD = '#5e5a80';
    const CL = '#b9b5d6';
    disc(put, 12, 15, 10, 9, C, CD, CL);
    disc(put, 23, 10, 11, 9.5, C, CD, CL);
    disc(put, 34, 14, 10, 9, C, CD, CL);
    disc(put, 23, 18, 19, 8, C, CD);
    for (let x = 6; x < 41; x++) if ((x * 7) % 5 < 3) put(x, 25, '#4a4668');
    // the face sits on the left, glaring at the marble
    if (face === 'charge') {
      line(put, 9, 12, 12, 13, INK);
      line(put, 17, 12, 14, 13, INK);
      rect(put, 7, 15, 3, 2, '#ff8fa3');
      rect(put, 17, 15, 3, 2, '#ff8fa3');
      rect(put, 11, 17, 5, 1, INK);
      put(22, 6, '#ffe08a');
      put(30, 8, '#ffe08a');
    } else {
      line(put, 8, 9, 12, 11, INK);
      line(put, 18, 9, 14, 11, INK);
      rect(put, 9, 12, 3, 3, '#ffffff');
      rect(put, 14, 12, 3, 3, '#ffffff');
      rect(put, 9, 13, 2, 2, INK);
      rect(put, 14, 13, 2, 2, INK);
      if (face === 'zap') {
        disc(put, 13, 19, 3.5, 2.6, '#3a1428');
        rect(put, 11, 17, 5, 1, '#ffffff');
      } else {
        put(10, 19, INK);
        rect(put, 11, 18, 5, 1, INK);
        put(16, 19, INK);
      }
    }
  });
}
const CLOUD: Record<CloudFace, Sprite> = { grump: cloudSprite('grump'), charge: cloudSprite('charge'), zap: cloudSprite('zap') };
const CLOUD_W = CLOUD.grump.width * U;
const CLOUD_H = CLOUD.grump.height * U;

class StormCloud implements Entity {
  x: number;
  y: number; // centre
  strikeY: number;
  front = true;
  // scripted bolts (start times) while a move runs; idle zaps otherwise
  zaps: number[] = [];
  scriptUntil = -1e9;
  lastBolt = -1;
  constructor(x: number, y: number, strikeY: number) {
    this.x = x;
    this.y = y;
    this.strikeY = strikeY;
  }
  state(t: number): 'calm' | 'warn' | 'bolt' {
    if (t < this.scriptUntil) {
      for (const z of this.zaps) {
        if (t >= z && t < z + 280) return 'bolt';
        if (t >= z - 520 && t < z) return 'warn';
      }
      return 'calm';
    }
    const ph = (t + this.x * 7) % 3000;
    return ph > 2650 ? 'bolt' : ph > 2100 ? 'warn' : 'calm';
  }
  boltId(t: number) {
    if (t < this.scriptUntil) return this.zaps.findIndex((z) => t >= z && t < z + 280) + 1e6;
    return Math.floor((t + this.x * 7) / 3000);
  }
  update(t: number, run: RunView) {
    if (this.state(t) !== 'bolt' || Math.abs(run.marbleX - this.x) > 900) return;
    const id = this.boltId(t);
    if (id === this.lastBolt) return;
    this.lastBolt = id;
    run.fx.burst('spark', 10, this.x, this.strikeY, { color: '#ffe86a', speed: 0.8, dir: -Math.PI / 2, spread: 2.4 });
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number) {
    if (this.x - cam < -200 || this.x - cam > W + 200) return;
    const st = this.state(t);
    const sx = this.x - cam;
    const bob = Math.sin(t / 500) * 6 - (st === 'bolt' ? 6 : 0);
    const cy = this.y + bob;
    const bottom = cy + CLOUD_H / 2 - U * 4;
    // drizzle
    for (let i = 0; i < 6; i++) {
      const ph = (t / 5 + i * 41) % 70;
      g.fillStyle = 'rgba(140,200,255,.6)';
      g.fillRect(r3(sx - 54 + i * 21 - ph * 0.15), r3(bottom + ph), U, U * 2);
    }
    if (st === 'bolt') this.drawBolt(g, sx, bottom, t);
    else if (st === 'warn') {
      // the telegraph: a flickering glow where it will hit
      if (Math.floor(t / 80) % 2) pxEllipse(g, sx, this.strikeY - U, 36, U * 2, 'rgba(255,230,100,.45)');
    }
    const face: CloudFace = st === 'bolt' ? 'zap' : st === 'warn' ? 'charge' : 'grump';
    const white = st === 'warn' && Math.floor(t / 70) % 3 === 0;
    const jit = st === 'warn' ? (Math.floor(t / 50) % 2 ? U : 0) : 0;
    drawSprite(g, CLOUD[face], sx - CLOUD_W / 2 + jit, cy - CLOUD_H / 2, U, { white });
  }
  drawBolt(g: CanvasRenderingContext2D, sx: number, top: number, t: number) {
    const seed = Math.floor(t / 60);
    const pts: [number, number][] = [[sx, top]];
    const n = 6;
    for (let i = 1; i < n; i++) {
      const j = ((hash2(seed, i) % 100) / 100 - 0.5) * 36;
      pts.push([sx + j, top + ((this.strikeY - top) * i) / n]);
    }
    pts.push([sx, this.strikeY]);
    for (let i = 0; i < n; i++) pxLine(g, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 'rgba(255,240,140,.85)', U * 3);
    for (let i = 0; i < n; i++) pxLine(g, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], '#ffffff', U);
    // a little fork off the middle
    const [fx, fy] = pts[3];
    pxLine(g, fx, fy, fx + 26, fy + 30, '#fff3a0', U);
    pxEllipse(g, sx, this.strikeY - U, 42, U * 3, 'rgba(255,240,150,.6)');
  }
}

const thunder = () => {
  thump(0.7);
  whoosh(0.1, 0.45, 0, 3200, 300);
  note(40, { instrument: 'pad', level: 0.1, hold: 0.4 });
};

registerObstacle('storm', (b) => {
  const fly = b.mode === 'fly';
  const waitX = b.x - 80;
  const cx = b.x + 150;
  b.add(360, 'flat');
  const pathY = fly ? flyLane(cx) : b.y - MR; // the marble's centre under the cloud
  const strikeY = fly ? pathY + MR : b.y;
  const cloudY = Math.max(48, pathY - MR - 150);
  const cloud = b.entity(new StormCloud(cx, cloudY, strikeY));
  const landX = cx + 170;
  const pc = cues();
  const fc = cues();
  return {
    kind: 'storm',
    label: 'the storm cloud',
    waitX,
    pass: {
      dur: 2000,
      step(k, m, t) {
        pc.tick(k);
        pc.once('script', true, () => {
          cloud.zaps = [t + (0.26 - k) * 2000, t + (0.88 - k) * 2000];
          cloud.scriptUntil = t + 2300;
        });
        const holdX = cx - 115;
        if (k < 0.2) m.roll(waitX + (holdX - waitX) * ease(k / 0.2));
        else if (k < 0.42) {
          m.roll(holdX);
          pc.once('crack', k > 0.27, () => {
            thunder();
            m.squash(0.82);
            m.fx.burst('sweat', 3, m.x + 14, m.y - 30, { dir: -Math.PI / 2, spread: 1.2, speed: 0.5 });
          });
        } else {
          // the instant the bolt fades: go go go
          m.roll(holdX + (landX - holdX) * easeInOut(span(k, 0.42, 0.74)));
          if (k < 0.74 && Math.random() < 0.4) m.fx.add({ kind: 'dust', x: m.x - 34, y: m.y + 20, vx: -2.5, vy: -0.3, life: 0.6 });
          pc.once('behind', k > 0.89, () => {
            thunder();
            m.fx.text('PHEW', m.x, m.y - 60, '#bfe8ff', 10);
          });
        }
      }
    },
    fail: {
      dur: 1700,
      step(k, m, t) {
        fc.tick(k);
        fc.once('script', true, () => {
          cloud.zaps = [t + (0.36 - k) * 1700];
          cloud.scriptUntil = t + 1900;
        });
        if (k < 0.36) {
          m.roll(waitX + (cx - waitX) * easeIn(k / 0.36));
          return;
        }
        fc.once('zap', true, () => {
          thunder();
          m.bump('ZAP!');
          m.fx.flash(t, 110, 'rgba(255,245,170,.75)');
          m.fx.shake(t, 8, 260);
          m.fx.burst('spark', 14, m.x, m.y, { color: '#ffe86a', speed: 1.1 });
        });
        if (k < 0.85) {
          const p = m.arc(cx, waitX - 15, 56, easeInOut(span(k, 0.4, 0.85)));
          m.place(p.x, p.y);
          if (Math.random() < 0.25) m.fx.add({ kind: 'frag', x: m.x + 10, y: m.y - 30, vx: 0.3, vy: -0.8, gravity: -0.02, color: '#5e5a80', size: U * 2, life: 0.8 });
        } else m.roll(waitX - 15);
      }
    }
  };
});

// ===========================================================================
// laser: a sci-fi gate. Wait for the beam to drop, then go.
// ===========================================================================
const NEON_C = '#29e0d0';
const NEON_M = '#ff4fd8';
function emitterSprite(top: boolean, lit: boolean) {
  return makeSprite(18, 13, (put) => {
    const P: typeof put = (x, y, c) => put(x, top ? 12 - y : y, c);
    rect(P, 0, 10, 18, 3, '#2a3350');
    rect(P, 0, 10, 18, 1, '#5a6890');
    poly(P, [[2, 10], [16, 10], [13, 3], [5, 3]], '#4a5578');
    rect(P, 5, 3, 8, 1, '#7a88b0');
    line(P, 3, 9, 5, 4, '#8a98c0');
    for (const lx of [4, 13]) P(lx, 8, lit ? NEON_M : '#6a2a5e');
    disc(P, 9, 3, 3, 2.2, lit ? '#b4fff6' : '#1f6f78', undefined, lit ? '#ffffff' : undefined);
    rect(P, 7, 0, 5, 1, lit ? NEON_C : '#1f4f58');
  });
}
const EMIT = {
  bottom: [emitterSprite(false, false), emitterSprite(false, true)],
  top: [emitterSprite(true, false), emitterSprite(true, true)]
};

class LaserGate implements Entity {
  x: number;
  y: number; // floor
  topY: number; // the hanging emitter's lens
  forced: boolean | null = null;
  changedAt = -1e9;
  wasOn = true;
  constructor(x: number, floor: number) {
    this.x = x;
    this.y = floor;
    this.topY = floor - 210;
  }
  idleOn(t: number) {
    return (t + this.x * 3) % 2600 < 1500;
  }
  on(t: number) {
    return this.forced ?? this.idleOn(t);
  }
  update(t: number) {
    const on = this.on(t);
    if (on !== this.wasOn) {
      this.wasOn = on;
      this.changedAt = t;
    }
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number) {
    const sx = this.x - cam;
    if (sx < -120 || sx > W + 120) return;
    const on = this.on(t);
    const since = t - this.changedAt;
    const lensTop = this.topY + U * 2;
    const lensBot = this.y - U * 13;
    // the girder holding the top emitter
    g.fillStyle = '#2a3350';
    g.fillRect(r3(sx - 12), 0, U * 2, r3(this.topY - 30));
    g.fillRect(r3(sx + 6), 0, U * 2, r3(this.topY - 30));
    g.fillStyle = '#4a5578';
    for (let y = 6; y < this.topY - 36; y += 24) {
      pxLine(g, sx - 9, y, sx + 9, y + 18, '#4a5578', U);
      g.fillRect(r3(sx - 12), r3(y), U * 8, U);
    }
    const mid = (lensTop + lensBot) / 2;
    if (on) {
      // snap on from both lenses toward the middle; snap off the other way
      const grow = Math.min(1, since / 110);
      const half = ((lensBot - lensTop) / 2) * grow;
      const pulse = Math.floor(t / 70) % 2;
      for (const [y0, y1] of [[lensTop, lensTop + half], [lensBot - half, lensBot]]) {
        g.fillStyle = 'rgba(255,79,216,.35)';
        g.fillRect(r3(sx - U * 3), r3(y0), U * 6, r3(y1 - y0));
        g.fillStyle = 'rgba(41,224,208,.75)';
        g.fillRect(r3(sx - U * 2), r3(y0), U * 4, r3(y1 - y0));
        g.fillStyle = '#ffffff';
        g.fillRect(r3(sx - (pulse ? U : U / 2)), r3(y0), pulse ? U * 2 : U, r3(y1 - y0));
      }
      // scanline sparkles running down the beam
      for (let i = 0; i < 4; i++) {
        const y = lensTop + ((t / 3 + i * 47) % (lensBot - lensTop));
        g.fillStyle = i % 2 ? NEON_M : '#ffffff';
        g.fillRect(r3(sx - U * 2), r3(y), U * 4, U);
      }
      pxEllipse(g, sx, this.y - U, 24, U * 2, 'rgba(41,224,208,.35)');
    } else {
      // off: a faint dotted guide, and the lenses flicker before it returns
      if (since < 140) {
        const k = since / 140;
        g.fillStyle = 'rgba(255,255,255,.8)';
        g.fillRect(r3(sx - U), r3(mid - (1 - k) * 40), U * 2, r3((1 - k) * 80));
      }
      g.fillStyle = 'rgba(41,224,208,.3)';
      for (let y = lensTop; y < lensBot; y += U * 4) g.fillRect(r3(sx - U / 2), r3(y), U, U);
    }
    const warn = !on && this.forced === null && (t + this.x * 3) % 2600 > 2250;
    const lit = on || (warn && Math.floor(t / 70) % 2 === 0);
    drawStanding(g, EMIT.bottom[lit ? 1 : 0], sx, this.y);
    drawSprite(g, EMIT.top[lit ? 1 : 0], sx - (EMIT.top[0].width * U) / 2, this.topY - 36);
  }
}

const powerDown = () => [76, 71, 64].forEach((n, i) => note(n, { at: i * 0.05, instrument: 'glock', level: 0.07 }));
const powerUp = () => [64, 71, 76].forEach((n, i) => note(n, { at: i * 0.04, instrument: 'glock', level: 0.07 }));

registerObstacle('laser', (b) => {
  const waitX = b.x - 80;
  const lx = b.x + 130;
  const floor = b.y;
  b.add(340, 'flat');
  const gate = b.entity(new LaserGate(lx, floor));
  const landX = lx + 170;
  const pc = cues();
  const fc = cues();
  return {
    kind: 'laser',
    label: 'the laser gate',
    waitX,
    pass: {
      dur: 1700,
      step(k, m) {
        pc.tick(k);
        const holdX = lx - MR - 40;
        if (k < 0.22) {
          gate.forced = true;
          m.roll(waitX + (holdX - waitX) * ease(k / 0.22));
          return;
        }
        if (k < 0.36) {
          m.roll(holdX);
          pc.once('off', k > 0.3, () => {
            gate.forced = false;
            powerDown();
          });
          return;
        }
        gate.forced = false;
        m.roll(holdX + (landX - holdX) * easeInOut(span(k, 0.36, 0.72)));
        if (k < 0.72 && Math.random() < 0.4) m.fx.add({ kind: 'spark', x: m.x - 30, y: m.y + 20, vx: -2, vy: -0.5, color: NEON_C, life: 0.6 });
        pc.once('on', k > 0.84, () => {
          gate.forced = true;
          powerUp();
        });
        if (k >= 1) gate.forced = null;
      }
    },
    fail: {
      dur: 1500,
      step(k, m, t) {
        fc.tick(k);
        const hitX = lx - MR - 6;
        if (k < 0.32) {
          gate.forced = false;
          m.roll(waitX + (hitX - waitX) * easeIn(k / 0.32));
          return;
        }
        fc.once('snap', true, () => {
          gate.forced = true;
          powerUp();
          m.bump('ZZT!');
          m.fx.flash(t, 90, 'rgba(41,224,208,.35)');
          m.fx.burst('spark', 8, lx, m.y, { color: NEON_C, speed: 0.9 });
          m.fx.burst('spark', 8, lx, m.y, { color: NEON_M, speed: 0.9 });
        });
        if (k < 0.85) {
          const p = m.arc(hitX, waitX - 15, 40, span(k, 0.34, 0.85));
          m.place(p.x, p.y);
        } else m.roll(waitX - 15);
        if (k >= 1) gate.forced = null;
      }
    }
  };
});

// ===========================================================================
// Rail levels: the runner draws the cart; we lay the track.
// ===========================================================================
// One track per level, drawn along whatever ground is on screen (gaps stay
// bare), so the stretches between obstacles get rails too.
class Rails implements Entity {
  x = 0;
  y = 0;
  draw(g: CanvasRenderingContext2D, cam: number, _t: number, run: RunView) {
    const first = Math.floor(cam / U) * U;
    for (let wx = first; wx < cam + W; wx += U) {
      const gy = run.groundAt(wx);
      if (gy === null) continue;
      const sx = wx - cam;
      const c = Math.floor(wx / U);
      // gravel ballast, sleepers, then the rail on top
      if (hash2(c, 3) % 3 === 0) {
        g.fillStyle = '#6a5f58';
        g.fillRect(sx, gy + U * 4, U, U);
      }
      if (c % 9 < 3) {
        g.fillStyle = '#5a3a22';
        g.fillRect(sx, gy + U, U, U * 3);
        g.fillStyle = c % 9 === 0 ? '#8a5a34' : '#6e4628';
        g.fillRect(sx, gy + U, U, U);
      }
      g.fillStyle = '#d4d9e2';
      g.fillRect(sx, gy + U * 2, U, U);
      g.fillStyle = '#6a707a';
      g.fillRect(sx, gy + U * 3, U, U);
    }
  }
}
const railsLaid = new WeakSet<Builder>();
function layRails(b: Builder) {
  if (railsLaid.has(b)) return;
  railsLaid.add(b);
  b.entity(new Rails());
}

// sparks thrown off the wheels
function wheelSparks(m: MarbleCtl, n = 2, dir = -1) {
  for (let i = 0; i < n; i++) {
    m.fx.add({ kind: 'spark', x: m.x + dir * 20, y: m.y + MR + 8, vx: dir * (1 + Math.random() * 3), vy: -1 - Math.random() * 2.5, color: Math.random() < 0.5 ? '#ffd84a' : '#ff8a2a', life: 0.7 });
  }
}

// ---- railgap: a broken stretch of track ----------------------------------
class BrokenTrack implements Entity {
  x: number;
  y: number;
  x1: number;
  constructor(x0: number, x1: number, y: number) {
    this.x = x0;
    this.x1 = x1;
    this.y = y;
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number) {
    const l = this.x - cam;
    const r = this.x1 - cam;
    if (r < -80 || l > W + 80) return;
    const y = this.y + U * 2;
    // rail ends torn and bent down into the shaft
    pxLine(g, l, y, l + 18, y + 9, '#d4d9e2', U);
    pxLine(g, l + 18, y + 9, l + 27, y + 24, '#a4a9b2', U);
    pxLine(g, r, y, r - 15, y + 12, '#d4d9e2', U);
    pxLine(g, r - 15, y + 12, r - 18, y + 30, '#a4a9b2', U);
    // a sleeper dangling from one bolt, swinging
    const sw = Math.sin(t / 380) * 6;
    pxLine(g, l + 27, y + 24, l + 30 + sw, y + 54, '#6e4628', U * 2);
    // a red warning lamp on a post at the edge
    g.fillStyle = '#5a3a22';
    g.fillRect(r3(l - 30), r3(this.y - 66), U * 2, 66);
    const blink = Math.floor(t / 400) % 2 === 0;
    g.fillStyle = INK;
    g.fillRect(r3(l - 33), r3(this.y - 78), U * 4, U * 4);
    g.fillStyle = blink ? '#ff3c5a' : '#7a1a2a';
    g.fillRect(r3(l - 30), r3(this.y - 75), U * 2, U * 2);
    if (blink) pxEllipse(g, l - 27, this.y - 72, 15, 12, 'rgba(255,60,90,.22)');
  }
}

registerObstacle('railgap', (b) => {
  layRails(b);
  const waitX = b.x - 80;
  const gx = b.x;
  b.add(168, 'gap');
  const landX = b.x + 90;
  b.add(190, 'flat');
  b.entity(new BrokenTrack(gx, gx + 168, b.y));
  const pc = cues();
  const fc = cues();
  return {
    kind: 'railgap',
    label: 'the broken track',
    waitX,
    pass: {
      dur: 1300,
      step(k, m, t) {
        pc.tick(k);
        const take = gx - 30;
        if (k < 0.3) {
          m.roll(waitX + (take - waitX) * easeIn(k / 0.3));
          wheelSparks(m, 1);
          return;
        }
        pc.once('jump', true, () => whoosh(0.08, 0.35, 0, 600, 1800));
        if (k < 0.9) {
          const p = m.arc(take, landX, 120, span(k, 0.3, 0.9));
          m.place(p.x, p.y);
          m.spin(0.1);
          return;
        }
        pc.once('land', true, () => {
          thump(0.5);
          m.squash(0.7);
          m.fx.burst('spark', 10, m.x, m.y + MR, { color: '#ffd84a', speed: 0.7, dir: -Math.PI / 2, spread: 2.6 });
          m.fx.shake(t, 3, 120);
        });
        m.roll(landX + 20 * ease(span(k, 0.9, 1)));
      }
    },
    fail: {
      dur: 1900,
      step(k, m, _t) {
        fc.tick(k);
        const stopX = gx - 22;
        if (k < 0.18) {
          m.roll(waitX + (stopX - 40 - waitX) * (k / 0.18));
          return;
        }
        fc.once('brake', true, () => {
          m.fx.text('SCREECH!', stopX, m.y - 70, '#ffd84a', 10);
          [96, 98, 96, 98, 96].forEach((n, i) => note(n, { at: i * 0.05, instrument: 'glock', level: 0.04 }));
        });
        if (k < 0.36) {
          // full brakes, sparks flying, stopping right at the lip
          m.roll(stopX - 40 + 40 * ease(span(k, 0.18, 0.36)));
          wheelSparks(m, 3, 1);
          return;
        }
        if (k < 0.58) {
          // teetering over the edge
          m.roll(stopX + Math.sin((k - 0.36) * 60) * 5 * (1 - span(k, 0.36, 0.58)));
          fc.once('sweat', true, () => {
            m.fx.burst('sweat', 4, m.x, m.y - 30, { dir: -Math.PI / 2, spread: 1.4, speed: 0.6 });
            note(55, { instrument: 'marimba', level: 0.1 });
          });
          return;
        }
        fc.once('backup', true, () => m.bump('WHOA!'));
        m.roll(stopX + (waitX - 10 - stopX) * easeInOut(span(k, 0.58, 1)));
      }
    }
  };
});

// ---- bats: a low tunnel full of bats -------------------------------------
function batSprite(f: number) {
  return makeSprite(18, 12, (put) => {
    const WING = '#6a55a0';
    const tip = [1, 4, 9][f];
    poly(put, [[8, 5], [0, tip], [1, tip + 2], [3, tip + 1], [5, tip + 3], [8, 8]], WING);
    poly(put, [[10, 5], [17, tip], [16, tip + 2], [14, tip + 1], [12, tip + 3], [10, 8]], WING);
    disc(put, 9, 7, 3.6, 3.6, '#4a3a6a', '#3a2c56', '#7a6aa0');
    put(7, 3, '#4a3a6a');
    put(7, 2, '#4a3a6a');
    put(11, 3, '#4a3a6a');
    put(11, 2, '#4a3a6a');
    put(7, 3, '#ff9db0');
    put(7, 6, '#ffd84a');
    put(9, 6, '#ffd84a');
    put(8, 9, '#ffffff');
  });
}
const BAT = [0, 1, 2, 1].map(batSprite);

class Tunnel implements Entity {
  x: number;
  y: number; // floor
  x1: number;
  ceil: number;
  rock: { body: string; dark: string; light: string; top: string };
  constructor(x0: number, x1: number, floor: number, rock: Tunnel['rock']) {
    this.x = x0;
    this.x1 = x1;
    this.y = floor;
    this.ceil = floor - 64;
    this.rock = rock;
  }
  // the rock is pre-drawn once: a rounded hill with jagged teeth underneath
  art: Sprite | null = null;
  rockArt() {
    if (this.art) return this.art;
    const w = this.x1 - this.x + 60;
    const y0 = this.ceil - 172;
    const c = canvas(w, this.y - y0);
    const p = c.getContext('2d')!;
    for (let x = 0; x < w; x += U) {
      const u = x / w;
      const top = r3(this.ceil - 70 - Math.sin(u * Math.PI) * 90 + Math.sin(x / 13) * 6) - y0;
      const col = Math.floor(x / U);
      const inside = x >= 30 && x <= w - 30;
      const tooth = col % 7 === 0 ? U * 2 : col % 7 === 1 || col % 7 === 6 ? U : 0;
      const edge = x < 30 ? 30 - x : x - (w - 30);
      const bottom = r3(inside ? this.ceil + tooth : this.ceil - 6 + Math.min(70, edge * 2)) - y0;
      p.fillStyle = this.rock.body;
      p.fillRect(x, top, U, bottom - top);
      p.fillStyle = this.rock.top;
      p.fillRect(x, top, U, U * 2);
      for (let y = top + U * 3; y < bottom; y += U) {
        const h = hash2(col, Math.floor(y / U));
        if ((h & 15) === 0) {
          p.fillStyle = this.rock.dark;
          p.fillRect(x, y, U, U);
        } else if ((h & 15) === 1) {
          p.fillStyle = this.rock.light;
          p.fillRect(x, y, U, U);
        } else if ((h & 127) === 2) {
          // a glint of gold in the rock
          p.fillStyle = '#ffd84a';
          p.fillRect(x, y, U, U);
        }
      }
      p.fillStyle = INK;
      p.fillRect(x, top - U, U, U);
      p.fillRect(x, bottom, U, U);
    }
    this.art = c;
    return c;
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number) {
    const l = this.x - cam;
    const r = this.x1 - cam;
    if (r < -100 || l > W + 100) return;
    // the dim inside of the tunnel
    g.fillStyle = 'rgba(12,6,24,.55)';
    g.fillRect(r3(l), r3(this.ceil), r3(r - l), r3(this.y - this.ceil));
    g.imageSmoothingEnabled = false;
    g.drawImage(this.rockArt(), r3(l - 30), r3(this.ceil - 172));
    // timber frames at both mouths and a lantern
    for (const px of [l, r - U * 3]) {
      g.fillStyle = '#7a4826';
      g.fillRect(r3(px), r3(this.ceil), U * 3, r3(this.y - this.ceil));
      g.fillStyle = '#a8703e';
      g.fillRect(r3(px), r3(this.ceil), U, r3(this.y - this.ceil));
    }
    g.fillStyle = '#7a4826';
    g.fillRect(r3(l - U * 2), r3(this.ceil - U * 3), r3(r - l + U * 4), U * 3);
    g.fillStyle = '#a8703e';
    g.fillRect(r3(l - U * 2), r3(this.ceil - U * 3), r3(r - l + U * 4), U);
    const lx = (l + r) / 2;
    const fl = 0.18 + Math.sin(t / 90) * 0.04 + Math.sin(t / 37) * 0.03;
    pxEllipse(g, lx, this.ceil + 14, 40, 30, `rgba(255,190,90,${fl})`);
    g.fillStyle = INK;
    g.fillRect(r3(lx - U * 2), r3(this.ceil), U * 4, U * 6);
    g.fillStyle = '#ffd84a';
    g.fillRect(r3(lx - U), r3(this.ceil + U * 2), U * 2, U * 3);
  }
}

class Bats implements Entity {
  x: number; // the tunnel mouth they guard
  y: number;
  front = true;
  scatterAt = -1e9;
  swarm = 0;
  tx = 0;
  ty = 0;
  last: number[] = [0, 0, 0];
  constructor(x: number, floor: number) {
    this.x = x;
    this.y = floor;
  }
  pos(i: number, t: number): [number, number] {
    const a = t / 650 + i * 2.1;
    let x = this.x - 50 + i * 30 + Math.cos(a) * 52;
    let y = this.y - 120 + Math.sin(a * 2) * 26 + i * 6;
    // startled: they shoot up out of the way, then drift back
    const s = (t - this.scatterAt) / 1000;
    if (s > 0 && s < 2.4) {
      const off = s < 0.8 ? Math.sin((s / 0.8) * (Math.PI / 2)) : 1 - easeInOut((s - 0.8) / 1.6);
      x -= off * (60 + i * 40);
      y -= off * 300;
    }
    if (this.swarm > 0) {
      const b = t / 110 + i * 2.1;
      const sx = this.tx + Math.cos(b) * 38;
      const sy = this.ty - 6 + Math.sin(b * 1.3) * 24;
      x += (sx - x) * this.swarm;
      y += (sy - y) * this.swarm;
    }
    return [x, y];
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number) {
    if (this.x - cam < -300 || this.x - cam > W + 300) return;
    const fast = this.swarm > 0.3 || t - this.scatterAt < 900;
    for (let i = 0; i < 3; i++) {
      const [x, y] = this.pos(i, t);
      const flip = x > this.last[i];
      this.last[i] = x;
      const f = BAT[Math.floor(t / (fast ? 70 : 140) + i) % BAT.length];
      drawSprite(g, f, x - cam - (f.width * U) / 2, y - (f.height * U) / 2, U, { flip });
    }
  }
}

const squeak = (at = 0) => {
  note(98, { at, instrument: 'glock', level: 0.04 });
  note(101, { at: at + 0.05, instrument: 'glock', level: 0.035 });
};

registerObstacle('bats', (b) => {
  layRails(b);
  const waitX = b.x - 80;
  const x0 = b.x + 90;
  const x1 = x0 + 300;
  const floor = b.y;
  b.add(600, 'flat');
  const pal = paletteOf(b.theme.terrain);
  b.entity(new Tunnel(x0, x1, floor, { body: pal.body, dark: pal.dark, light: pal.light, top: pal.top }));
  const bats = b.entity(new Bats(x0 - 10, floor));
  const landX = x1 + 90;
  const pc = cues();
  const fc = cues();
  return {
    kind: 'bats',
    label: 'the bat tunnel',
    waitX,
    pass: {
      dur: 2000,
      step(k, m, t) {
        pc.tick(k);
        bats.swarm = 0;
        pc.once('scatter', true, () => {
          bats.scatterAt = t;
          squeak();
          squeak(0.12);
          whoosh(0.06, 0.25, 0, 900, 2000);
        });
        if (k < 0.22) {
          m.roll(waitX + (x0 - MR - 20 - waitX) * ease(k / 0.22));
          // tuck down as it reaches the low ceiling
          m.squash(1 - 0.45 * span(k, 0.1, 0.22));
          return;
        }
        if (k < 0.82) {
          m.squash(0.55);
          m.roll(x0 - MR - 20 + (x1 + 30 - (x0 - MR - 20)) * easeInOut(span(k, 0.22, 0.82)));
          wheelSparks(m, 1);
          pc.once('zoom', true, () => whoosh(0.08, 0.5, 0, 400, 1200));
          return;
        }
        m.roll(x1 + 30 + (landX - x1 - 30) * ease(span(k, 0.82, 1)));
      }
    },
    fail: {
      dur: 2100,
      step(k, m, _t) {
        fc.tick(k);
        bats.tx = m.x;
        bats.ty = m.y;
        const nearX = x0 - 150;
        if (k < 0.25) {
          bats.swarm = 0;
          m.roll(waitX + (nearX - waitX) * ease(k / 0.25));
          return;
        }
        // they mob its face
        bats.swarm = k < 0.75 ? ease(span(k, 0.25, 0.38)) : 1 - ease(span(k, 0.75, 1));
        fc.once('mob', true, () => {
          squeak();
          squeak(0.1);
          squeak(0.22);
          whoosh(0.07, 0.4, 0, 1200, 600);
        });
        if (k < 0.4) {
          m.roll(nearX);
          return;
        }
        fc.once('flinch', true, () => m.bump('EEK!'));
        // backs the cart up, wobbling
        m.roll(nearX + (waitX - 10 - nearX) * easeInOut(span(k, 0.4, 0.92)) + Math.sin(k * 40) * 3 * (1 - span(k, 0.8, 0.92)));
        if (k < 0.75 && Math.random() < 0.2) m.fx.add({ kind: 'sweat', x: m.x + 10, y: m.y - 30, vx: 1, vy: -2, life: 0.8 });
      }
    }
  };
});

// ---- loop: a loop-the-loop -----------------------------------------------
class LoopTrack implements Entity {
  x: number; // centre
  y: number; // centre
  R: number; // the rail's radius
  floor: number;
  constructor(x: number, y: number, R: number, floor: number) {
    this.x = x;
    this.y = y;
    this.R = R;
    this.floor = floor;
  }
  draw(g: CanvasRenderingContext2D, cam: number) {
    const cx = this.x - cam;
    if (cx < -this.R - 120 || cx > W + this.R + 120) return;
    const R = this.R;
    // wooden trestle legs holding the loop up
    for (const side of [-1, 1]) {
      const px = cx + side * R * 0.72;
      const py = this.y + R * 0.7;
      g.fillStyle = '#6e4628';
      g.fillRect(r3(px - U), r3(py), U * 3, r3(this.floor - py));
      g.fillStyle = '#9a6a3c';
      g.fillRect(r3(px - U), r3(py), U, r3(this.floor - py));
      pxLine(g, px, py + 10, cx + side * R * 0.25, this.floor - 4, '#5a3a22', U);
    }
    pxLine(g, cx - R, this.y, cx + R, this.y, 'rgba(90,58,34,.6)', U);
    pxLine(g, cx, this.y - R, cx, this.y + R * 0.5, 'rgba(90,58,34,.6)', U);
    // sleepers pointing out from the rail, then the rails themselves
    const steps = Math.ceil((Math.PI * 2 * R) / U);
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      if (i % 9 < 3) {
        g.fillStyle = i % 9 === 0 ? '#8a5a34' : '#5a3a22';
        for (let d = -U; d <= U * 2; d += U) g.fillRect(r3(cx + c * (R + d)), r3(this.y + s * (R + d)), U, U);
      }
    }
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      g.fillStyle = '#d4d9e2';
      g.fillRect(r3(cx + Math.cos(a) * R), r3(this.y + Math.sin(a) * R), U, U);
      g.fillStyle = '#6a707a';
      g.fillRect(r3(cx + Math.cos(a) * (R + U)), r3(this.y + Math.sin(a) * (R + U)), U, U);
    }
  }
}

registerObstacle('loop', (b) => {
  layRails(b);
  const waitX = b.x - 80;
  const lx = b.x + 170;
  const floor = b.y;
  b.add(480, 'flat');
  const r = 84; // the marble's path round the inside
  const cy = floor - MR - r;
  const R = r + MR + U * 2;
  b.entity(new LoopTrack(lx, floor - R + U * 2, R, floor));
  const landX = lx + 210;
  const at = (th: number) => ({ x: lx + r * Math.sin(th), y: cy + r * Math.cos(th) });
  const pc = cues();
  const fc = cues();
  return {
    kind: 'loop',
    label: 'the loop',
    waitX,
    pass: {
      dur: 2400,
      step(k, m, _t) {
        pc.tick(k);
        if (k < 0.22) {
          m.roll(waitX + (lx - waitX) * easeIn(k / 0.22));
          wheelSparks(m, 1);
          return;
        }
        pc.once('loop', true, () => {
          whoosh(0.1, 0.9, 0, 500, 2200);
          [72, 76, 79, 84].forEach((n, i) => note(n, { at: 0.1 + i * 0.12, instrument: 'glock', level: 0.06 }));
        });
        if (k < 0.78) {
          const th = Math.PI * 2 * easeInOut(span(k, 0.22, 0.78));
          const p = at(th);
          m.place(p.x, p.y);
          m.tilt(-th);
          m.spin(0.25);
          if (Math.random() < 0.5) m.fx.add({ kind: 'spark', x: p.x - Math.sin(th) * MR, y: p.y + Math.cos(th) * MR, vx: -Math.cos(th) * 2, vy: Math.sin(th) * 2, color: '#ffd84a', life: 0.6 });
          return;
        }
        pc.once('out', true, () => {
          m.fx.text('WHEE!', lx, cy - r - 30, '#ffe08a', 12);
          m.fx.burst('star', 6, lx, cy - r, { color: '#ffcb32', speed: 0.6 });
        });
        m.roll(lx + (landX - lx) * ease(span(k, 0.78, 1)));
      }
    },
    fail: {
      dur: 2600,
      step(k, m) {
        fc.tick(k);
        if (k < 0.2) {
          m.roll(waitX + (lx - waitX) * easeIn(k / 0.2));
          return;
        }
        // up the side, slower and slower, a wobble near the top, then back down
        const peak = Math.PI * 0.72;
        let th: number;
        if (k < 0.48) th = peak * ease(span(k, 0.2, 0.48));
        else if (k < 0.6) {
          th = peak + Math.sin((k - 0.48) * 70) * 0.04;
          fc.once('stall', true, () => {
            m.fx.burst('sweat', 4, at(peak).x, at(peak).y - 30, { dir: -Math.PI / 2, spread: 1.4, speed: 0.6 });
            note(60, { instrument: 'marimba', level: 0.12 });
            note(55, { at: 0.12, instrument: 'marimba', level: 0.12 });
          });
        } else if (k < 0.8) th = peak * (1 - easeIn(span(k, 0.6, 0.8)));
        else {
          fc.once('back', true, () => m.bump('UH-OH'));
          m.roll(lx + (waitX - 10 - lx) * ease(span(k, 0.8, 1)));
          return;
        }
        const p = at(th);
        m.place(p.x, p.y);
        m.tilt(-th);
      }
    }
  };
});
