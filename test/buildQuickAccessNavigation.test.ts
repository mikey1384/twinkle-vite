import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { getCollaboratingBuildListItemTargetPath } from '../src/containers/Build/List/helpers';

test('quick access opens public apps and keeps private team work in Build', () => {
  assert.equal(
    getCollaboratingBuildListItemTargetPath({
      id: 41,
      title: 'Public app',
      description: null,
      isPublic: true,
      updatedAt: 1,
      createdAt: 1
    }),
    '/app/41'
  );
  assert.equal(
    getCollaboratingBuildListItemTargetPath({
      id: 42,
      title: 'Private team app',
      description: null,
      isPublic: false,
      updatedAt: 1,
      createdAt: 1
    }),
    '/build/42'
  );
});

test('quick access uses the shared public-versus-workspace destination', () => {
  const source = readFileSync(
    new URL(
      '../src/containers/Build/List/hooks/useQuickAccess.ts',
      import.meta.url
    ),
    'utf8'
  );

  assert.match(
    source,
    /navigate\(getCollaboratingBuildListItemTargetPath\(build\), \{/
  );
  assert.doesNotMatch(
    source,
    /function handleOpenBuild[\s\S]{0,180}navigate\(`\/app\/\$\{buildId\}`/
  );
});
