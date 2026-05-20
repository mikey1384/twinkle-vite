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
assert.match(quickAccessSource, /setRecentlyUsedBuilds/);
assert.match(quickAccessSource, /setFavoriteBuilds/);

console.log('build deleted socket refresh source checks passed');
