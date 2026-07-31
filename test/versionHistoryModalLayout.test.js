import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(
  new URL(
    '../src/containers/Build/PreviewPanel/VersionHistoryModal.tsx',
    import.meta.url
  ),
  'utf8'
);

test('version history keeps the restore action intrinsic beside long summaries', () => {
  assert.match(
    source,
    /const versionRowClass = css`[\s\S]*display: grid;[\s\S]*grid-template-columns: minmax\(0, 1fr\) auto;/
  );
});
