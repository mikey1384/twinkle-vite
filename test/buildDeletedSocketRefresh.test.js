import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const notiSocketSource = readFileSync(
  new URL(
    '../src/containers/App/Header/hooks/useAPISocket/useNotiSocket.ts',
    import.meta.url
  ),
  'utf8'
);
const quickAccessSource = readFileSync(
  new URL(
    '../src/containers/Build/List/hooks/useQuickAccess.ts',
    import.meta.url
  ),
  'utf8'
);

assert.match(notiSocketSource, /socket\.on\('build_deleted', handleBuildDeleted\)/);
assert.match(notiSocketSource, /fetchNotifications\(\)/);
assert.match(notiSocketSource, /onLoadNotifications\(/);
assert.match(
  quickAccessSource,
  /socket\.on\('build_deleted', handleSocketBuildDeleted\)/
);
// The recent/favorite lists moved from local setState into canonical Build
// context state, so the handler now prunes them through one action and the
// reducer removes the ids from both `recent` and `favorites`.
assert.match(
  quickAccessSource,
  /onRemoveBuildStudioQuickAccessBuilds\(\{[\s\S]{0,120}buildIds: \[\.\.\.deletedBuildIds\]/
);
const buildReducerSource = readFileSync(
  new URL('../src/contexts/Build/reducer.ts', import.meta.url),
  'utf8'
);
assert.match(
  buildReducerSource,
  /case 'REMOVE_BUILD_STUDIO_QUICK_ACCESS_BUILDS':[\s\S]{0,900}recent: removeBuildsFromQuickAccessList\([\s\S]{0,300}favorites: removeBuildsFromQuickAccessList\(/
);

console.log('build deleted socket refresh source checks passed');
