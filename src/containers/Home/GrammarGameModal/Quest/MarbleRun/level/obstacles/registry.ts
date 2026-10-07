import type { ObstacleMaker } from '../types';

// Obstacles register by kind; themes list kinds in their `obstacles` pool.
const REGISTRY: Record<string, ObstacleMaker> = {};

export function registerObstacle(kind: string, make: ObstacleMaker) {
  REGISTRY[kind] = make;
}
export function obstacleMaker(kind: string): ObstacleMaker | undefined {
  return REGISTRY[kind];
}
export function obstacleKinds() {
  return Object.keys(REGISTRY);
}

export const ease = (k: number) => 1 - Math.pow(1 - k, 2);
export const easeIn = (k: number) => k * k;
export const easeInOut = (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
// k within a sub-range of a move, clamped 0..1
export const span = (k: number, a: number, b: number) => Math.max(0, Math.min(1, (k - a) / (b - a)));
