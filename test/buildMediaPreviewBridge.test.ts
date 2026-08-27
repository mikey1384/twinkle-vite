import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { isMutatingPreviewRequestType } from '../src/containers/Build/PreviewPanel/helpers/previewRequestPolicy';

function readSource(relativePath: string) {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');
}

test('Build media paid and destructive bridge calls remain transition-safe mutations', () => {
  for (const requestType of [
    'media:capture-consent',
    'media:clip-upload-consent',
    'media:upload-clip',
    'live:start',
    'live:started',
    'live:watch-consent',
    'live:join',
    'live:leave',
    'live:report-consent',
    'live:report',
    'live:stop',
    'replay:watch-consent',
    'replay:join',
    'replay:leave',
    'replay:report-consent',
    'replay:report',
    'replay:delete-consent',
    'replay:delete'
  ]) {
    assert.equal(isMutatingPreviewRequestType(requestType), true, requestType);
  }
  assert.equal(isMutatingPreviewRequestType('media:usage'), false);
  assert.equal(isMutatingPreviewRequestType('live:list'), false);
});

test('Build media host bridge reauthorizes raw paid actions with exact action identity', () => {
  const source = readSource(
    'src/containers/Build/PreviewPanel/hooks/useHostBridge.ts'
  );
  assert.match(
    source,
    /function buildMediaActionConfirmationKey[\s\S]*?kind,[\s\S]*?requestId,[\s\S]*?audio === true[\s\S]*?saveReplay === true[\s\S]*?resourceId[\s\S]*?reason/
  );
  assert.match(
    source,
    /case 'media:upload-clip':[\s\S]*?authorizeBuildMediaAction\([\s\S]*?kind: 'clip-upload'[\s\S]*?uploadBuildRuntimeClipRef/
  );
  assert.match(
    source,
    /case 'live:start':[\s\S]*?authorizeBuildMediaAction\([\s\S]*?kind: 'live'[\s\S]*?startBuildLiveSessionRef/
  );
  assert.match(
    source,
    /case 'live:join':[\s\S]*?kind: 'live-watch'[\s\S]*?resourceId: sessionId[\s\S]*?joinBuildLiveSessionRef/
  );
  assert.match(
    source,
    /case 'live:report':[\s\S]*?viewerGrantId = normalizeBuildLiveActionId[\s\S]*?normalizeBuildLiveBridgeReportReason[\s\S]*?kind: 'live-report'[\s\S]*?reportBuildLiveSessionRef/
  );
  assert.match(
    source,
    /case 'replay:join':[\s\S]*?kind: 'replay-watch'[\s\S]*?joinBuildLiveReplayRef[\s\S]*?mediaKind: 'replay'/
  );
  assert.match(
    source,
    /case 'replay:report':[\s\S]*?kind: 'replay-report'[\s\S]*?reportBuildLiveReplayRef/
  );
  assert.match(
    source,
    /case 'replay:delete':[\s\S]*?kind: 'replay-delete'[\s\S]*?deleteBuildLiveReplayRef/
  );
  assert.match(
    source,
    /if \(navigator\.userActivation\?\.isActive !== true\)[\s\S]*?'USER_ACTIVATION_REQUIRED'/
  );
});

test('Build media confirmation copy is mixed-age and discloses saved app-usable media', () => {
  const source = readSource('src/containers/Build/PreviewPanel/index.tsx');
  const start = source.indexOf(
    'requestBuildMediaActionConfirmationRef.current'
  );
  const end = source.indexOf(
    'requestBuildMediaActionConfirmationRef.current = null',
    start
  );
  const confirmationSource = source.slice(start, end);
  assert.match(confirmationSource, /saved in your Twinkle file storage/);
  assert.match(confirmationSource, /this app can use it/);
  assert.match(
    confirmationSource,
    /report this livestream and end it immediately/
  );
  assert.match(confirmationSource, /privately record your account/);
  assert.match(
    confirmationSource,
    /saved for this app as a replay for seven days/
  );
  assert.match(confirmationSource, /Report replay\?/);
  assert.match(confirmationSource, /Remove replay\?/);
  assert.match(
    confirmationSource,
    /audio[\s\S]*?'camera and microphone permissions\.'[\s\S]*?: 'camera permission\.'/
  );
  assert.doesNotMatch(confirmationSource, /\b(?:kid|child|minor)\b/i);
});

test('livestream and replay viewers plus hosts retain platform-owned safety controls', () => {
  const stageSource = readSource(
    'src/containers/Build/PreviewPanel/PreviewStage.tsx'
  );
  const hostSource = readSource(
    'src/containers/Build/PreviewPanel/hooks/useHostBridge.ts'
  );
  const panelSource = readSource('src/containers/Build/PreviewPanel/index.tsx');

  assert.match(stageSource, /data-testid="build-live-safety-controls"/);
  assert.match(stageSource, /data-testid="build-live-host-safety-controls"/);
  assert.match(stageSource, /isReplay \? 'Replay safety' : 'Live safety'/);
  assert.match(stageSource, /aria-label="Hosted livestream safety"/);
  assert.match(
    panelSource,
    /<BuildLiveHostSafetyControls[\s\S]*?sessions=\{activeBuildLiveSafetyHostSessions\}[\s\S]*?onStop=\{handleBuildLiveSafetyStop\}/
  );
  assert.match(
    stageSource,
    /data-build-live-host-session=\{session\.sessionId\}/
  );
  assert.match(
    stageSource,
    /'privacy'[\s\S]*?'harassment'[\s\S]*?'explicit-content'[\s\S]*?'violence'[\s\S]*?'dangerous-activity'[\s\S]*?'other'/
  );
  assert.match(stageSource, /Report & end/);
  assert.match(stageSource, /Report & remove/);
  assert.match(
    stageSource,
    /submittedReason[\s\S]*?disabled=\{submitting \|\| submittedReason !== null\}/
  );
  assert.match(
    hostSource,
    /case 'live:join':[\s\S]*?registerBuildLiveSafetyGrant\(\{ sourceWindow, response \}\)/
  );
  assert.match(
    hostSource,
    /requestBuildLiveSafetyReportRef\.current = async[\s\S]*?active\.reportReason[\s\S]*?postBuildLiveSafetyStopLocal\([\s\S]*?active\.sourceWindow,[\s\S]*?sessionId,[\s\S]*?mediaKind[\s\S]*?reportBuildLiveReplayRef\.current[\s\S]*?reportBuildLiveSessionRef\.current/
  );
  assert.match(
    hostSource,
    /retireBuildLiveSafetyGrantsForWindow[\s\S]*?settleRetiredBuildLiveSafetyGrant/
  );
  assert.match(
    hostSource,
    /activeBuildLiveHostSessions[\s\S]*?function retireBuildLiveHostSessionsForWindow[\s\S]*?settleRetiredBuildLiveHostSession/
  );
  assert.match(
    hostSource,
    /postBuildLiveSafetyStopLocal\(sourceWindow, sessionId\);[\s\S]*?active\.sourceWindows\.delete\(sourceWindow\);[\s\S]*?settleRetiredBuildLiveHostSession/
  );
  assert.match(
    hostSource,
    /function settleRetiredBuildLiveSafetyGrant[\s\S]*?Number\(buildId \|\| 0\)[\s\S]*?function settleRetiredBuildLiveHostSession[\s\S]*?Number\(buildId \|\| 0\)/
  );
  assert.match(
    hostSource,
    /expiryDelayMs = hardEndsAt[\s\S]*?hardEndsAt \* 1000 - Date\.now\(\)[\s\S]*?postBuildLiveSafetyStopLocal\([\s\S]*?retired\.sourceWindow,[\s\S]*?sessionId,[\s\S]*?retired\.mediaKind[\s\S]*?settleRetiredBuildLiveSafetyGrant\(retired\)/
  );
  assert.match(
    hostSource,
    /case 'live:start':[\s\S]*?registerBuildLiveHostSession/
  );
  assert.match(
    hostSource,
    /case 'live:start':[\s\S]*?registerBuildLiveHostSession[\s\S]*?ensureBuildLiveHostSafetyPresentation[\s\S]*?stopBuildLiveSessionRef/
  );
  assert.match(
    hostSource,
    /function reconcileBuildLiveHostSession[\s\S]*?\['ended', 'failed'\][\s\S]*?activeBuildLiveHostSessions\.delete\(sessionId\)[\s\S]*?publishBuildLiveHostSessions/
  );
  assert.match(
    hostSource,
    /terminalBuildLiveHostSessions[\s\S]*?incomingUpdatedAt <= terminalUpdatedAt[\s\S]*?postBuildLiveSafetyStopLocal/
  );
  assert.match(
    hostSource,
    /reconcileBuildLiveHostSessions[\s\S]*?listBuildLiveHostSessionsRef[\s\S]*?getBuildLiveSessionStatusRef[\s\S]*?markBuildLiveHostSessionUnconfirmed/
  );
  assert.match(
    hostSource,
    /requestBuildLiveSafetyStopRef\.current = async[\s\S]*?stopBuildLiveHostSessionLocally\(sessionId\)[\s\S]*?stopBuildLiveSessionRef/
  );
  assert.match(
    hostSource,
    /stopBuildLiveHostSessionLocally[\s\S]*?primaryIframeRef\.current\?\.contentWindow[\s\S]*?secondaryIframeRef\.current\?\.contentWindow[\s\S]*?postBuildLiveSafetyStopLocal/
  );
});

test('editor and runtime camera frames use same-origin only on build-scoped preview origins', () => {
  const stageSource = readSource(
    'src/containers/Build/PreviewPanel/PreviewStage.tsx'
  );
  const helperSource = readSource(
    'src/containers/Build/PreviewPanel/helpers/previewHelpers.ts'
  );
  assert.match(
    stageSource,
    /sandbox=\{getRuntimePreviewIframeSandbox\([\s\S]*?previewFrameSources\.primary/
  );
  assert.match(
    stageSource,
    /sandbox=\{getRuntimePreviewIframeSandbox\([\s\S]*?previewFrameSources\.secondary/
  );
  assert.match(
    helperSource,
    /canUseSameOriginBuildPreviewSandbox\(frameSrc\)[\s\S]*?BUILD_APP_RUNTIME_IFRAME_SANDBOX[\s\S]*?BUILD_APP_PREVIEW_IFRAME_SANDBOX/
  );
});

test('clip upload retry accepts canonical completing, processing, or ready state', () => {
  const source = readSource('src/contexts/requestHelpers/build.ts');
  assert.match(
    source,
    /prepared\?\.clip[\s\S]*?\['completing', 'processing', 'ready'\]\.includes/
  );
});

test('media requests preserve the canonical API retry delay', () => {
  const requestSource = readSource('src/contexts/requestHelpers/build.ts');
  assert.match(
    requestSource,
    /data\.retryAfterSeconds != null[\s\S]*?: data\.retryAfter[\s\S]*?\{ retryAfterSeconds \}/
  );
});
