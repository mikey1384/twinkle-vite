import { gqMedia } from '../media';
import type { MouseFit, Point } from './stopSpacing';
import { stopsAlongPath } from './worldPaths';

export const WORLD_IMAGES: Record<string, string> = {
  'starter-village': gqMedia('img/grammar-quest/starter-village.jpg'),
  'harbor-town': gqMedia('img/grammar-quest/harbor-town.jpg'),
  'windmill-hills': gqMedia('img/grammar-quest/windmill-hills.jpg'),
  'forest-of-clauses': gqMedia('img/grammar-quest/forest-of-clauses.jpg'),
  'tense-canyon': gqMedia('img/grammar-quest/tense-canyon.jpg'),
  'passive-glacier': gqMedia('img/grammar-quest/passive-glacier.jpg'),
  'sky-library': gqMedia('img/grammar-quest/sky-library.jpg'),
  'the-citadel': gqMedia('img/grammar-quest/the-citadel.jpg'),
  'the-academy': gqMedia('img/grammar-quest/the-academy.jpg'),
  'logic-tower': gqMedia('img/grammar-quest/logic-tower.jpg')
};

// small copies for the world tiles under the map (the full paintings are
// ~400KB each; ten tiles must not cost a phone 4MB)
export const WORLD_THUMBS: Record<string, string> = Object.fromEntries(
  Object.keys(WORLD_IMAGES).map((key) => [
    key,
    gqMedia(`img/grammar-quest/thumbs/${key}.jpg`)
  ])
);

// Each world's stops on its painted path (worked out ahead: worldPaths.ts);
// `mouseBigStops` (the forts' and castle's places) picks the mouse layout,
// `fit` the window's (a narrow window's discs are smaller)
export function nodePositions(
  worldKey: string,
  count: number,
  mouseBigStops?: number[],
  fit?: MouseFit
): Point[] {
  return stopsAlongPath(worldKey, count, mouseBigStops, fit);
}
