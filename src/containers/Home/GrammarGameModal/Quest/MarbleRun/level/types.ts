import type { Fx } from '../fx';
import type { Mode, Terrain, Theme } from './themes';

// ---------------------------------------------------------------------------
// The contract every obstacle, enemy and prop module follows.
//
// A level is a strip of ground pieces (world x grows to the right, y is
// canvas pixels, ground 309 at rest) plus entities (enemies, platforms,
// cannons, props). Five obstacles are laid out by the generator; each one
// adds its own ground pieces and entities through the Builder, and returns
// where the marble waits plus two scripted moves: pass (right answer, then
// the marble is promoted) and fail (wrong answer; the marble ends back at
// waitX and tries again with the next question).
// ---------------------------------------------------------------------------

export type PieceKind = 'flat' | 'slope' | 'bumps' | 'gap' | 'raised';

export interface GroundPiece {
  x0: number;
  x1: number;
  kind: PieceKind;
  y0: number;
  y1: number;
  // a different look for this stretch (stone step, wooden bridge, ...)
  material?: Terrain | 'bridge' | 'block' | 'pipe' | 'lava' | 'water';
}

export interface Entity {
  x: number;
  y: number;
  // drawn before the marble (false) or in front of it (true)
  front?: boolean;
  dead?: boolean;
  update?(t: number, run: RunView): void;
  draw(g: CanvasRenderingContext2D, cam: number, t: number, run: RunView): void;
}

export interface Move {
  dur: number;
  // k goes 0 → 1 over dur ms; drive the marble through m
  step(k: number, m: MarbleCtl, t: number): void;
}

export interface Obstacle {
  kind: string;
  label: string; // "the pit", shown on the question card
  waitX: number;
  pass: Move;
  fail: Move;
}

export interface Builder {
  theme: Theme;
  mode: Mode;
  rand: () => number;
  // cursor: the ground continues from (x, y)
  x: number;
  y: number;
  BASE_Y: number;
  add(len: number, kind: PieceKind, dy?: number, material?: GroundPiece['material']): GroundPiece;
  entity<E extends Entity>(e: E): E;
  // an enemy kind from the theme's pool (or the given one)
  enemyKind(prefer?: string): string;
  groundAt(x: number): number | null;
}

export type ObstacleMaker = (b: Builder) => Obstacle;

// What moves can do to the marble.
export interface MarbleCtl {
  x: number;
  y: number; // marble centre
  t: number;
  mode: Mode;
  fx: Fx;
  // ground height at x (null over a gap) and the marble's resting centre there
  groundAt(x: number): number | null;
  restY(x: number): number | null;
  // explicit flight: place the marble (no ground snapping this frame)
  place(x: number, y: number): void;
  // let it roll along the ground / swim along its lane to x (eased by caller)
  roll(x: number): void;
  // a parabola from x0 to x1 resting heights, h px high at the top
  arc(x0: number, x1: number, h: number, k: number): { x: number; y: number };
  // free fall from where it is (pits); it vanishes below the screen
  fall(): void;
  // pop back at x with a sparkle (after a fall)
  respawn(x: number): void;
  spin(radians: number): void;
  // rail levels: lean the cart (radians, clockwise) this frame, e.g. round a loop
  tilt(radians: number): void;
  squash(amount: number): void;
  bump(text?: string): void; // flash, wince, shake, "OUCH"
  hide(hidden: boolean): void;
}

export interface RunView {
  t: number;
  mode: Mode;
  marbleX: number;
  marbleY: number;
  fx: Fx;
  groundAt(x: number): number | null;
}
