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
const useSourceSource = readFileSync(
  new URL(
    '../src/containers/Build/PreviewPanel/hooks/useSource.ts',
    import.meta.url
  ),
  'utf8'
);

test('workspace iframe survives signed preview token refresh in place', () => {
  const runtimeOnlyBranchStart = frameManagerSource.indexOf(
    'if (runtimeOnly) {'
  );
  assert.notEqual(runtimeOnlyBranchStart, -1);

  const workspaceTokenRefreshStart = frameManagerSource.indexOf(
    'const activeFrameHasTokenOnlyRefresh =',
    runtimeOnlyBranchStart
  );
  assert.notEqual(
    workspaceTokenRefreshStart,
    -1,
    'workspace (non-runtimeOnly) path must detect token-only refreshes after the runtimeOnly branch'
  );

  const doubleBufferLoadStart = frameManagerSource.indexOf(
    '[inactiveFrame]: previewSrc',
    runtimeOnlyBranchStart
  );
  assert.notEqual(doubleBufferLoadStart, -1);
  assert.ok(
    workspaceTokenRefreshStart < doubleBufferLoadStart,
    'token-only refresh preservation must run before the double-buffered frame swap'
  );

  const workspaceTokenRefreshBlock = frameManagerSource.slice(
    workspaceTokenRefreshStart,
    doubleBufferLoadStart
  );
  assert.match(workspaceTokenRefreshBlock, /isPreviewFrameTokenOnlyRefresh/);
  assert.match(workspaceTokenRefreshBlock, /activeMeta\.hasLoaded/);
  assert.match(workspaceTokenRefreshBlock, /activeMeta\.viewerKey === viewerKey/);
  assert.match(
    workspaceTokenRefreshBlock,
    /postPreviewTokenRefreshToFrame/,
    'token-only refresh must be delivered over the preview bridge instead of remounting the frame'
  );
  assert.match(
    workspaceTokenRefreshBlock,
    /if \(activeFrameHasTokenOnlyRefresh\) \{[\s\S]*?return;/,
    'token-only refresh must return without retiring or replacing frames'
  );
  assert.doesNotMatch(
    workspaceTokenRefreshBlock,
    /bridgeConfirmed/,
    'token-only refresh must preserve the loaded iframe even if the preview bridge has not confirmed yet'
  );
});

test('workspace preview src refreshes its signed token in place before expiry', () => {
  const workspaceHookStart = useSourceSource.indexOf(
    'export function useWorkspacePreviewSrc'
  );
  assert.notEqual(workspaceHookStart, -1);
  const workspaceHookSource = useSourceSource.slice(workspaceHookStart);

  assert.match(
    workspaceHookSource,
    /expiresAt: tokenExpiresAt \|\| undefined/,
    'workspace src state must track the signed token expiry'
  );
  assert.match(
    workspaceHookSource,
    /setWorkspacePreviewRefreshNonce/,
    'workspace src must schedule a token refresh instead of waiting for unrelated state churn'
  );
  assert.match(
    workspaceHookSource,
    /workspacePreviewRefreshNonce\s*\]/,
    'the scheduled refresh nonce must re-run the src resolution effect'
  );
  assert.match(
    workspaceHookSource,
    /canUseSameOriginBuildPreviewSandbox/,
    'cross-origin (non-bridgeable) frames must keep the focused-player refresh deferral'
  );
});

test('token refresh preserves the bridge load identity after in-preview navigation', () => {
  const canonicalRefreshStart = frameManagerSource.indexOf(
    'if (\n        currentNavigation &&\n        canonicalPreviewSrc &&'
  );
  assert.notEqual(canonicalRefreshStart, -1);
  const canonicalRefreshEnd = frameManagerSource.indexOf(
    'return null;',
    canonicalRefreshStart
  );
  assert.notEqual(canonicalRefreshEnd, -1);
  const canonicalRefreshBlock = frameManagerSource.slice(
    canonicalRefreshStart,
    canonicalRefreshEnd
  );

  assert.match(
    canonicalRefreshBlock,
    /const bridgeLoadId = currentNavigation\.bridgeLoadId;/,
    'a credential-only refresh must retain the already-loaded bridge identity'
  );
  assert.doesNotMatch(
    canonicalRefreshBlock,
    /createPreviewFrameBridgeLoadId\(\)/,
    'rotating the load identity would make the refresh look like a navigation and remount the iframe'
  );
});
