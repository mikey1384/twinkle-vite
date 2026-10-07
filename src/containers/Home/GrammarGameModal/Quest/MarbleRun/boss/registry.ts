import type { BossDef } from './types';
import { gqMedia } from '../../../media';

const REGISTRY: Record<string, BossDef> = {};

export function registerBoss(def: BossDef) {
  REGISTRY[def.id] = def;
}
export function bossDef(id: string): BossDef | undefined {
  return REGISTRY[id];
}
export function bossIds() {
  return Object.keys(REGISTRY);
}

// Where the floor and the boss's ledge sit in each arena painting, as
// fractions of the image (measured per painting; defaults fit most).
export const ARENA_GEOMETRY: Record<string, { floor: number; ledge: number; ledgeX: number }> = {
  'w1-fort': { floor: 0.8, ledge: 0.593, ledgeX: 0.9 },
  'w1-castle': { floor: 0.8, ledge: 0.627, ledgeX: 0.875 },
  'w2-fort': { floor: 0.825, ledge: 0.645, ledgeX: 0.83 },
  'w2-castle': { floor: 0.81, ledge: 0.59, ledgeX: 0.84 },
  'w3-fort': { floor: 0.82, ledge: 0.478, ledgeX: 0.82 },
  'w3-castle': { floor: 0.8, ledge: 0.622, ledgeX: 0.85 },
  'w4-fort': { floor: 0.81, ledge: 0.555, ledgeX: 0.85 },
  'w4-castle': { floor: 0.8, ledge: 0.565, ledgeX: 0.84 },
  'w5-fort': { floor: 0.78, ledge: 0.63, ledgeX: 0.83 },
  'w5-castle': { floor: 0.8, ledge: 0.63, ledgeX: 0.85 },
  'w6-fort': { floor: 0.815, ledge: 0.5, ledgeX: 0.86 },
  'w6-castle': { floor: 0.8, ledge: 0.53, ledgeX: 0.8 },
  'w7-fort': { floor: 0.815, ledge: 0.57, ledgeX: 0.84 },
  'w7-castle': { floor: 0.83, ledge: 0.72, ledgeX: 0.84 },
  'w8-fort': { floor: 0.81, ledge: 0.495, ledgeX: 0.86 },
  'w8-castle': { floor: 0.8, ledge: 0.555, ledgeX: 0.83 },
  'w9-fort': { floor: 0.805, ledge: 0.645, ledgeX: 0.84 },
  'w9-castle': { floor: 0.805, ledge: 0.71, ledgeX: 0.84 },
  'w10-fort': { floor: 0.79, ledge: 0.48, ledgeX: 0.85 },
  'w10-castle': { floor: 0.79, ledge: 0.575, ledgeX: 0.85 }
};
export function arenaGeometry(id: string) {
  return ARENA_GEOMETRY[id] || { floor: 0.82, ledge: 0.62, ledgeX: 0.86 };
}
export function arenaUrl(id: string) {
  return gqMedia(`img/grammar-quest/arenas/${id}.png`);
}
