import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('Build runtime only uses client launch target state when no notification id is present', () => {
  const source = readFileSync(
    new URL('../src/containers/Build/Runtime/index.tsx', import.meta.url),
    'utf8'
  );
  assert.match(
    source,
    /const \[resolvedBuildLaunchTargetKey, setResolvedBuildLaunchTargetKey\] =\s*useState\(''\);/
  );
  assert.match(
    source,
    /const \[previewMountedBuildId, setPreviewMountedBuildId\] = useState<[\s\S]*number \| null[\s\S]*>\(null\);/
  );
  assert.match(
    source,
    /const buildLaunchTargetAuthKey = userId \? `user:\$\{userId\}` : 'guest';/
  );
  assert.match(
    source,
    /const buildLaunchTargetLookupKey = useMemo\(\(\) => \{[\s\S]*return `\$\{numericBuildId\}:\$\{buildNotificationId\}:\$\{buildLaunchTargetAuthKey\}`;[\s\S]*\}, \[buildLaunchTargetAuthKey, buildNotificationId, numericBuildId\]\);/
  );
  assert.match(
    source,
    /const buildLaunchTargetReady =\s*!buildLaunchTargetLookupKey \|\|\s*resolvedBuildLaunchTargetKey === buildLaunchTargetLookupKey;/
  );
  assert.match(
    source,
    /const previewMountedForCurrentBuild =[\s\S]*runtimeBuildId === numericBuildId[\s\S]*previewMountedBuildId === runtimeBuildId;/
  );
  assert.match(
    source,
    /const shouldRenderPreviewPanel =\s*buildLaunchTargetReady \|\| previewMountedForCurrentBuild;/
  );
  assert.match(
    source,
    /import BuildAppNotificationSettingsModal,[\s\S]*BuildAppNotificationPreferences[\s\S]*BuildAppNotificationSettingsModal';/
  );
  assert.match(
    source,
    /const getBuildAppNotificationPreferences = useAppContext\([\s\S]*getBuildAppNotificationPreferences[\s\S]*\);/
  );
  assert.match(
    source,
    /function handleOpenBuildNotificationSettings\(\) \{[\s\S]*if \(!userId\) \{[\s\S]*onOpenSigninModal\(\);[\s\S]*setBuildNotificationSettingsShown\(true\);[\s\S]*\}/
  );
  assert.match(
    source,
    /getBuildAppNotificationPreferencesRef\.current\(\{[\s\S]*buildId: runtimeBuildId,[\s\S]*eventKey: runtimeNotificationEventKey[\s\S]*\}\)/
  );
  assert.match(
    source,
    /aria-label="Notification settings"[\s\S]*data-muted=[\s\S]*buildNotificationPreferences\?\.mutedBuild[\s\S]*icon=\{[\s\S]*buildNotificationPreferences\?\.mutedBuild[\s\S]*\? 'bell-slash'[\s\S]*: 'bell'/
  );
  assert.match(
    source,
    /<BuildAppNotificationSettingsModal[\s\S]*buildId=\{build\.id\}[\s\S]*eventKey=\{runtimeNotificationEventKey\}[\s\S]*onPreferencesChange=\{setBuildNotificationPreferences\}/
  );
  const effectMatch = source.match(
    /useEffect\(\(\) => \{\s*if \(!numericBuildId\) \{[\s\S]*?void loadLaunchTarget\(\);[\s\S]*?\}, \[[\s\S]*?routeBuildLaunchTarget[\s\S]*?\]\);/
  );
  assert(effectMatch, 'launch target effect must exist');
  const effectSource = effectMatch[0];
  const confirmedLookupSource = effectSource.slice(
    effectSource.indexOf('let cancelled = false')
  );

  assert.match(
    effectSource,
    /if \(!buildNotificationId\) \{[\s\S]*?setBuildLaunchTarget\(routeBuildLaunchTarget\);[\s\S]*?setResolvedBuildLaunchTargetKey\(''\);[\s\S]*?return;[\s\S]*?\}/
  );
  assert.match(
    confirmedLookupSource,
    /setBuildLaunchTarget\(null\);\s*setResolvedBuildLaunchTargetKey\(''\);/
  );
  assert.match(
    confirmedLookupSource,
    /setBuildLaunchTarget\(normalizeBuildLaunchTarget\(result\)\);/
  );
  assert.match(
    confirmedLookupSource,
    /setBuildLaunchTarget\(null\);[\s\S]*catch \(_error\) \{[\s\S]*setBuildLaunchTarget\(null\);/
  );
  assert.match(
    confirmedLookupSource,
    /finally \{[\s\S]*setResolvedBuildLaunchTargetKey\(lookupKey\);[\s\S]*\}/
  );
  assert.doesNotMatch(
    confirmedLookupSource,
    /setBuildLaunchTarget\(routeBuildLaunchTarget\);/
  );
  assert.match(
    source,
    /useEffect\(\(\) => \{[\s\S]*const currentBuildId = Math\.floor\(Number\(build\?\.id \|\| 0\)\);[\s\S]*setPreviewMountedBuildId\(currentBuildId\);[\s\S]*\}, \[build\?\.id, buildLaunchTargetReady, numericBuildId\]\);/
  );
  assert.match(
    source,
    /\{shouldRenderPreviewPanel \? \([\s\S]*<PreviewPanel[\s\S]*launchTarget=\{buildLaunchTarget\}[\s\S]*!buildLaunchTargetReady \? \([\s\S]*<Loading className=\{launchTargetLoadingOverlayClass\} \/>[\s\S]*\) : null[\s\S]*\) : \([\s\S]*<Loading className=\{launchTargetLoadingClass\} \/>[\s\S]*\)\}/
  );
});

test('Preview host bridge relies on init for the initial launch target', () => {
  const source = readFileSync(
    new URL(
      '../src/containers/Build/PreviewPanel/hooks/useHostBridge.ts',
      import.meta.url
    ),
    'utf8'
  );

  assert.match(
    source,
    /const launchTargetBroadcastReadyRef = useRef\(false\);/
  );

  const guardIndex = source.indexOf(
    'if (!launchTargetBroadcastReadyRef.current)'
  );
  const broadcastIndex = source.indexOf(
    "type: 'notifications:launch-target'"
  );
  const effectStartIndex = source.lastIndexOf(
    'useEffect(() => {',
    broadcastIndex
  );
  const effectEndIndex = source.indexOf(
    '}, [launchTarget, previewFrameMetaRef, primaryIframeRef, secondaryIframeRef]);',
    broadcastIndex
  );
  assert.notEqual(effectStartIndex, -1, 'launch target effect must exist');
  assert.notEqual(
    effectEndIndex,
    -1,
    'launch target effect deps must remain scoped'
  );

  const effectSource = source.slice(effectStartIndex, effectEndIndex);
  assert.match(
    effectSource,
    /if \(!launchTargetBroadcastReadyRef\.current\) \{[\s\S]*?launchTargetBroadcastReadyRef\.current = true;[\s\S]*?return;[\s\S]*?\}/
  );
  assert.notEqual(guardIndex, -1, 'initial launch target guard must exist');
  assert.notEqual(broadcastIndex, -1, 'launch target broadcast must exist');
  assert(
    effectStartIndex < guardIndex &&
      guardIndex < broadcastIndex &&
      broadcastIndex < effectEndIndex,
    'initial launch target guard must run before broadcasting'
  );
});
