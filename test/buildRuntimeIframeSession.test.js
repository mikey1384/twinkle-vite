import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const frameManagerSource = readFileSync(
  new URL(
    '../src/containers/Build/PreviewPanel/hooks/useFrameManager.ts',
    import.meta.url
  ),
  'utf8'
);

test('runtime iframe survives signed preview token refresh before bridge confirmation', () => {
  const tokenRefreshBlockStart = frameManagerSource.indexOf(
    'const primaryHasTokenOnlyRefresh ='
  );
  const tokenRefreshBlockEnd = frameManagerSource.indexOf(
    'const shouldPreservePrimaryFrame =',
    tokenRefreshBlockStart
  );
  assert.notEqual(
    tokenRefreshBlockStart,
    -1,
    'runtime token refresh preservation block must exist'
  );
  assert.notEqual(
    tokenRefreshBlockEnd,
    -1,
    'runtime token refresh preservation block must feed preservation decision'
  );

  const tokenRefreshBlock = frameManagerSource.slice(
    tokenRefreshBlockStart,
    tokenRefreshBlockEnd
  );

  assert.match(tokenRefreshBlock, /isPreviewFrameTokenOnlyRefresh/);
  assert.match(tokenRefreshBlock, /currentPrimaryMeta\.hasLoaded/);
  assert.match(tokenRefreshBlock, /currentPrimaryMeta\.viewerKey === viewerKey/);
  assert.doesNotMatch(
    tokenRefreshBlock,
    /bridgeConfirmed/,
    'token-only refresh must preserve the loaded iframe even if the preview bridge has not confirmed yet'
  );
});
