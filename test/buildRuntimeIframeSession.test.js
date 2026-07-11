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
const previewPanelSource = readFileSync(
  new URL('../src/containers/Build/PreviewPanel/index.tsx', import.meta.url),
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

test('browser visibility pauses previews without retiring their iframe', () => {
  const suspensionStart = previewPanelSource.indexOf(
    'const previewFrameSuspended ='
  );
  const lifecycleEffectStart = previewPanelSource.indexOf(
    'useEffect(() => {',
    suspensionStart
  );
  const suspensionSource = previewPanelSource.slice(
    suspensionStart,
    lifecycleEffectStart
  );

  assert.match(
    previewPanelSource,
    /const previewHostEnabled = runtimeHostVisible !== false;\s*const previewHostVisible = previewHostEnabled && pageVisible;\s*const previewAudioMuted = audioMuted \|\| !pageVisible;/m
  );
  assert.match(suspensionSource, /!previewHostEnabled/);
  assert.doesNotMatch(suspensionSource, /!previewHostVisible/);
});
