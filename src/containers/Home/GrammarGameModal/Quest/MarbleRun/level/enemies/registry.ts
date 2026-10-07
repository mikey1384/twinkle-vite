import { U, Sprite, drawStanding, drawSprite } from '../../pixel';
import type { Entity, RunView } from '../types';

// Small level enemies. Each kind registers its pixel frames (facing LEFT,
// toward the marble coming from the left) and how it moves. Sprites are
// built with makeSprite at about 16–26 art pixels wide and drawn at U.
export interface EnemyDef {
  frames: Sprite[]; // walk / flap / swim cycle, 2–4 frames
  frameMs?: number;
  // 'walk' patrols on the ground; 'hover' bobs in the air at `height`;
  // 'swim' drifts in the water lane; 'hop' jumps in place; 'still' stays put
  motion: 'walk' | 'hover' | 'swim' | 'hop' | 'still';
  height?: number; // px above the ground for hover/swim
  patrol?: number; // px each way
  spiky?: boolean; // can't be stomped: the marble jumps clean over it
  scale?: number;
  // art px from the sprite's top to where its body starts (a spider's thread)
  bodyTop?: number;
}

const REGISTRY: Record<string, EnemyDef> = {};

export function registerEnemy(kind: string, def: EnemyDef) {
  REGISTRY[kind] = def;
}
export function enemyDef(kind: string): EnemyDef {
  return REGISTRY[kind] || REGISTRY.beetle;
}
export function enemyKinds() {
  return Object.keys(REGISTRY);
}

export class Enemy implements Entity {
  x: number;
  y = 0;
  home: number;
  kind: string;
  def: EnemyDef;
  alive = true;
  stompedAt = 0;
  dead = false;
  constructor(kind: string, x: number) {
    this.kind = kind;
    this.def = enemyDef(kind);
    this.x = x;
    this.home = x;
  }
  get height() {
    return this.def.frames[0].height * (this.def.scale || U);
  }
  // the enemy's top, where a stomp lands (world y)
  topAt(run: { groundAt(x: number): number | null }) {
    return this.baseY(run) - this.height + (this.def.bodyTop || 0) * (this.def.scale || U);
  }
  baseY(run: { groundAt(x: number): number | null; t?: number }) {
    const gy = run.groundAt(this.x) ?? 309;
    const lift = this.def.motion === 'hover' || this.def.motion === 'swim' ? this.def.height || 80 : 0;
    return gy - lift;
  }
  stomp(t: number) {
    this.alive = false;
    this.stompedAt = t;
  }
  update(t: number) {
    if (!this.alive) {
      if (t - this.stompedAt > 600) this.dead = true;
      return;
    }
    const p = this.def.patrol ?? 24;
    if (this.def.motion !== 'still') this.x = this.home + Math.sin(t / 700 + this.home) * p;
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number, run: RunView) {
    const def = this.def;
    const sc = def.scale || U;
    const sx = this.x - cam;
    if (sx < -120 || sx > 1100) return;
    const frame = def.frames[Math.floor(t / (def.frameMs || 220)) % def.frames.length];
    let base = this.baseY(run);
    if (def.motion === 'hover' || def.motion === 'swim') base += Math.sin(t / 380 + this.home) * 10;
    if (def.motion === 'hop') base -= Math.abs(Math.sin(t / 260 + this.home)) * 18;
    // facing: toward the marble
    const flip = run.marbleX > this.x + 10;
    if (this.alive) {
      drawStanding(g, frame, sx, base, sc, { flip });
    } else {
      // stomped: squashed flat, then fades
      const k = Math.min(1, (t - this.stompedAt) / 500);
      g.globalAlpha = 1 - k;
      const h = frame.height * sc * 0.35;
      g.imageSmoothingEnabled = false;
      g.drawImage(frame, Math.round(sx - (frame.width * sc) / 2), Math.round(base - h), frame.width * sc, h);
      g.globalAlpha = 1;
    }
  }
}

export function drawEnemyPreview(g: CanvasRenderingContext2D, kind: string, x: number, y: number, t: number) {
  const def = enemyDef(kind);
  const f = def.frames[Math.floor(t / (def.frameMs || 220)) % def.frames.length];
  drawSprite(g, f, x, y, def.scale || U);
}
