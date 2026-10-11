import { gqMedia } from '../media';
import { closestGap, stopGap, type Point } from './stopSpacing';
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

// Each world's stops on its painted path (worked out ahead: worldPaths.ts)
export function nodePositions(worldKey: string, count: number): Point[] {
  return stopsAlongPath(worldKey, count);
}

// How far a stop sits from the map's nearest edge, in height percent (x on
// the painting's 16:9 shape, as in stopSpacing.ts)
const ASPECT = 16 / 9;
export function edgeGap([x, y]: Point) {
  return Math.min(y, 100 - y, x * ASPECT, (100 - x) * ASPECT);
}

// How tall the map must be drawn, per px of the room its stops need, for:
// `tap`: its two closest stops to sit a whole tap box apart; `big`: a fort
// or castle and its closest neighbour to keep its bigger disc out of the
// neighbour's box; `edge` (stops) and `bigEdge` (forts and castles): every
// stop to sit half its tap box (its disc and the pad around it) inside the
// map's edges, so the edge never clips a disc or a tap box (r28 review:
// stop 1 at the path's start lost up to 9 px of its box to the bottom
// edge). The map grows past the screen, and scrolls, when the screen is
// smaller than that.
export function mapHeightPerGapPx(
  worldKey: string,
  count: number,
  bigStops: number[]
) {
  const points = nodePositions(worldKey, count);
  const per = (gap: number) => (gap > 0 && gap < Infinity ? 100 / gap : 0);
  const isBig = new Set(bigStops);
  let big = Infinity;
  for (const i of bigStops)
    points.forEach((p, j) => {
      if (j !== i && points[i]) big = Math.min(big, stopGap(points[i], p));
    });
  let edge = Infinity;
  let bigEdge = Infinity;
  points.forEach((p, i) => {
    if (isBig.has(i)) bigEdge = Math.min(bigEdge, edgeGap(p));
    else edge = Math.min(edge, edgeGap(p));
  });
  return {
    tap: per(closestGap(points)),
    big: per(big),
    edge: per(edge),
    bigEdge: per(bigEdge)
  };
}
