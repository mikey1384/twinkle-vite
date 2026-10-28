import starterVillage from './art/mastery/starter-village.webp';
import harborTown from './art/mastery/harbor-town.webp';
import windmillHills from './art/mastery/windmill-hills.webp';
import forestOfClauses from './art/mastery/forest-of-clauses.webp';
import tenseCanyon from './art/mastery/tense-canyon.webp';
import passiveGlacier from './art/mastery/passive-glacier.webp';
import skyLibrary from './art/mastery/sky-library.webp';
import theCitadel from './art/mastery/the-citadel.webp';
import theAcademy from './art/mastery/the-academy.webp';
import logicTower from './art/mastery/logic-tower.webp';

// Small, distinct banner paintings. Vite fingerprints the files; only the
// selected world's image is requested, alongside its existing full map.
export const WORLD_MASTERY_ART: Record<string, string> = {
  'starter-village': starterVillage,
  'harbor-town': harborTown,
  'windmill-hills': windmillHills,
  'forest-of-clauses': forestOfClauses,
  'tense-canyon': tenseCanyon,
  'passive-glacier': passiveGlacier,
  'sky-library': skyLibrary,
  'the-citadel': theCitadel,
  'the-academy': theAcademy,
  'logic-tower': logicTower
};
