import { seeded, r3 } from '../pixel';
import { MR } from '../marble';
import type { Builder, Entity, GroundPiece, Obstacle, PieceKind } from './types';
import type { Theme } from './themes';
import { obstacleMaker } from './obstacles/registry';
import { enemyKinds } from './enemies/registry';

export const BASE_Y = 309;
// swimmers keep to a lane above the seabed; flyers to a lane in the sky
const SWIM_DEPTH = 96;
export const FLY_LANE = 200;

// A built level: ground pieces, entities and five obstacles, in world space.
export class Level {
  theme: Theme;
  pieces: GroundPiece[] = [];
  entities: Entity[] = [];
  obstacles: Obstacle[] = [];
  goalX = 0;
  end = 0;

  constructor(theme: Theme) {
    this.theme = theme;
  }
  get mode() {
    return this.theme.mode;
  }
  get terrain() {
    return this.theme.terrain;
  }
  get light() {
    return this.theme.light;
  }
  pieceAt(x: number) {
    const ps = this.pieces;
    let lo = 0;
    let hi = ps.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (x < ps[mid].x0) hi = mid - 1;
      else if (x >= ps[mid].x1) lo = mid + 1;
      else return ps[mid];
    }
    return x < 0 ? ps[0] : ps[ps.length - 1];
  }
  groundAt(x: number): number | null {
    if (this.mode === 'fly') return null;
    const pc = this.pieceAt(x);
    if (!pc) return BASE_Y;
    return pieceHeight(pc, x);
  }
  // where the marble's centre rests at x
  restY(x: number): number | null {
    if (this.mode === 'fly') return r3(FLY_LANE + Math.sin(x / 260) * 26);
    const gy = this.groundAt(x);
    if (this.mode === 'swim') {
      const floor = gy ?? BASE_Y + 40;
      return r3(Math.min(floor, BASE_Y) - SWIM_DEPTH + Math.sin(x / 220) * 14);
    }
    if (gy === null) return null;
    return gy - MR;
  }
}

export function pieceHeight(pc: GroundPiece, x: number): number | null {
  switch (pc.kind) {
    case 'gap':
      return null;
    case 'slope':
      return r3(pc.y0 + ((pc.y1 - pc.y0) * (x - pc.x0)) / (pc.x1 - pc.x0));
    case 'bumps':
      return r3(pc.y0 - Math.abs(Math.sin(((x - pc.x0) / (pc.x1 - pc.x0)) * Math.PI * 2)) * 15);
    default:
      return pc.y0;
  }
}

// Lays out a level for a theme. The seed (the stop id) varies approach
// lengths and the stretches between obstacles, so two levels with the same
// theme still differ. `kinds` overrides an obstacle slot (Mikey 10-10: each
// question type has its own obstacle; the server picks the five types).
export function buildLevel(theme: Theme, seed: string, kinds: Array<string | null> = []): Level {
  const lv = new Level(theme);
  const rand = seeded(seed);
  const b: Builder = {
    theme,
    mode: theme.mode,
    rand,
    x: 0,
    y: BASE_Y,
    BASE_Y,
    add(len: number, kind: PieceKind, dy = 0, material?: GroundPiece['material']) {
      const pc: GroundPiece = { x0: b.x, x1: b.x + len, kind, y0: b.y, y1: b.y + dy, material };
      lv.pieces.push(pc);
      b.x += len;
      b.y += dy;
      return pc;
    },
    entity(e) {
      lv.entities.push(e);
      return e;
    },
    enemyKind(prefer?: string) {
      const known = enemyKinds();
      const pool = theme.enemies.filter((k) => known.includes(k));
      if (prefer && known.includes(prefer)) return prefer;
      if (!pool.length) return 'beetle';
      return pool[Math.floor(rand() * pool.length)];
    },
    groundAt: (x: number) => lv.groundAt(x),
    restY: (x: number) => lv.restY(x)
  };
  b.add(320, 'flat');
  theme.obstacles.forEach((themeKind, i) => {
    const kind = kinds[i] || themeKind;
    b.add(190 + Math.round(rand() * 6) * 15, 'flat');
    const make = obstacleMaker(kind) || obstacleMaker('pit')!;
    lv.obstacles.push(make(b));
    connector(b, rand);
  });
  b.add(320, 'flat');
  lv.goalX = b.x;
  b.add(1100, 'flat');
  lv.end = b.x;
  return lv;
}

// A stretch between obstacles: a dip, a rise, bumps, or flat, kept within
// the screen's height range.
function connector(b: Builder, rand: () => number) {
  const r = rand();
  if (b.mode === 'fly' || b.mode === 'swim') {
    b.add(140 + Math.round(r * 120), 'flat');
    return;
  }
  if (b.y < BASE_Y - 20) {
    b.add(180 + Math.round(r * 60), 'slope', BASE_Y - b.y);
  } else if (r < 0.3) {
    b.add(240, 'bumps');
  } else if (r < 0.5 && b.y > 250) {
    b.add(160, 'slope', -36);
    b.add(90, 'flat');
    b.add(160, 'slope', 36);
  } else {
    b.add(140 + Math.round(rand() * 80), 'flat');
  }
}
