import type { Sprite } from '../pixel';
import type { Fx } from '../fx';

// ---------------------------------------------------------------------------
// The contract every boss module follows.
//
// A boss is a pixel sprite (built in code with the pixel kit, so it can
// squash, flap, flash and burst) with its own idle motion and its own moves.
// The fight engine runs the arena, the health bar, the questions, the marble
// and the hits; a boss only decides how it looks and what it throws.
//
// Shots never hurt the marble unless they were aimed after a wrong pick
// (`hit: true`); the marble dodges everything else on its own (hop over
// low shots, duck under high ones), so attacks are spectacle, and only a
// wrong answer gets the marble hit.
// ---------------------------------------------------------------------------

export interface Pose {
  frame: Sprite;
  dx?: number; // offsets from the boss's spot (px)
  dy?: number;
  sx?: number; // squash / stretch
  sy?: number;
  tilt?: number; // radians
  alpha?: number;
  flip?: boolean;
}

export interface Shot {
  frames: Sprite[];
  x: number;
  y: number; // top-left in world px
  vx?: number;
  vy?: number;
  g?: number; // gravity
  bounce?: number; // floor bounce factor
  onFloor?: boolean; // slides along the floor
  scale?: number;
  frameMs?: number;
  life?: number; // ms
  spin?: number; // visual spin (radians per frame), drawn rotated
  dodge?: 'hop' | 'duck' | 'none';
  hit?: boolean; // aimed: hurts the marble on contact
  glow?: string; // a soft coloured halo
  // custom behaviour each frame (homing, waves, splitting...)
  update?(s: Shot, t: number, api: BossApi): void;
  // set by the engine
  born?: number;
  done?: boolean;
  angle?: number;
}

export interface BossApi {
  t: number;
  fx: Fx;
  W: number;
  H: number;
  floorY: number; // the arena floor (where the marble rolls)
  ledgeY: number; // where the boss stands
  bossX: number; // boss centre x
  bossTop: number; // top of the boss sprite
  bossW: number;
  bossH: number;
  marbleX: number;
  marbleY: number;
  menace: number;
  phase: number; // 1, or 2 once its health is low (menace ≥ 5)
  aim: boolean; // this move answers a wrong pick: make it hit
  spawn(s: Shot): Shot;
  // a warning marker at x for ms (a glowing column / shadow), then fn
  warn(x: number, ms: number, fn: () => void, opts?: { width?: number; color?: string; kind?: 'column' | 'shadow' | 'ring' }): void;
  after(ms: number, fn: () => void): void;
  shake(mag: number, ms: number): void;
  flash(ms: number, color?: string): void;
  tint(ms: number, color: string): void;
  // a full-width beam at height y for ms (sweeps are drawn by the boss)
  beam(y: number, ms: number, opts?: { color?: string; height?: number; dodge?: 'hop' | 'duck' }): void;
  // the floor turns to ice for ms: the marble slips and skids about on it
  iceFloor(ms: number): void;
  // hurts the marble now if this move is aimed (for strikes/beams resolved by the boss)
  strikeMarble(): void;
  sound: {
    thump(strength?: number): void;
    note(midi: number, opts?: { at?: number; instrument?: 'bell' | 'glock' | 'marimba' | 'pad'; level?: number; hold?: number }): void;
    whoosh(level?: number, length?: number, at?: number, from?: number, to?: number): void;
  };
}

export interface BossMove {
  id: string;
  windup: number; // ms of tell before the move fires (the boss's `wind` pose)
  phase?: 1 | 2; // only in this phase (default: both)
  weight?: number;
  run(api: BossApi): void;
}

export interface BossDef {
  id: string;
  scale: number; // art px → canvas px (3–5)
  hover?: number; // flies this high above its ledge
  intro?: 'drop' | 'fly' | 'rise' | 'fade';
  // built once, lazily
  frames(): Record<string, Sprite[]>;
  // how it looks right now; state: idle | wind | hurt | dazed | laugh | phase2
  pose(t: number, state: BossState, f: Record<string, Sprite[]>): Pose;
  moves: BossMove[];
  // where thrown marbles should hit right now, when the boss is drawn away
  // from its ledge (a pendulum swing, a dive): its body's centre, or null
  target?(t: number): { x: number; y: number } | null;
  // extra drawing (auras, orbiting things, eyes glowing in phase 2...)
  drawExtra?(g: CanvasRenderingContext2D, t: number, api: BossApi, state: BossState): void;
}

export type BossState = 'intro' | 'idle' | 'wind' | 'hurt' | 'dazed' | 'laugh' | 'dying';
