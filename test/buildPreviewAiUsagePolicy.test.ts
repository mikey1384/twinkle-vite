import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  getBuildAppAiUsagePolicy,
  sanitizeBuildAppAiUsagePolicyPayload
} from '../src/containers/Build/PreviewPanel/helpers/previewAiUsagePolicy';

test('Build app AI policy exposes battery state without account identity metadata', () => {
  assert.deepEqual(
    getBuildAppAiUsagePolicy({
      dayIndex: 12,
      dayKey: '2026-08-18',
      energyPercent: 73,
      energySegments: 5,
      energySegmentsRemaining: 4,
      currentMode: 'full_quality',
      quotaEmail: 'viewer@example.com',
      identityType: 'verified_email',
      riskDecisionReasons: ['private-signal'],
      communityFundResetEligibility: { eligible: true }
    }),
    {
      dayIndex: 12,
      dayKey: '2026-08-18',
      energyPercent: 73,
      energySegments: 5,
      energySegmentsRemaining: 4,
      currentMode: 'full_quality'
    }
  );
});

test('Build app AI policy rejects non-object snapshots', () => {
  assert.equal(getBuildAppAiUsagePolicy(null), null);
  assert.equal(getBuildAppAiUsagePolicy([]), null);
});

test('Build app AI response filtering preserves payload data and removes private policy metadata', () => {
  const response = sanitizeBuildAppAiUsagePolicyPayload({
    text: 'done',
    aiUsagePolicy: {
      energyRemaining: 12,
      quotaEmail: 'viewer@example.com',
      riskDecisionReasons: ['private-signal']
    }
  });
  assert.deepEqual(response, {
    text: 'done',
    aiUsagePolicy: { energyRemaining: 12 }
  });
  assert.equal(sanitizeBuildAppAiUsagePolicyPayload('done'), 'done');
});

test('Build iframe success, stream, socket, and error paths share policy filtering', () => {
  const source = fs.readFileSync(
    path.resolve(
      process.cwd(),
      'src/containers/Build/PreviewPanel/hooks/useHostBridge.ts'
    ),
    'utf8'
  );
  assert.match(
    source,
    /const iframeResponse = sanitizeBuildAppAiUsagePolicyPayload\(response\)/
  );
  assert.match(
    source,
    /const iframeEvent = sanitizeBuildAppAiUsagePolicyPayload\(event \|\| \{\}\)/
  );
  assert.match(
    source,
    /const iframePayload = sanitizeBuildAppAiUsagePolicyPayload\(payload\)/
  );
  assert.match(
    source,
    /const errorDetails = sanitizeBuildAppAiUsagePolicyPayload\([\s\S]*?rawErrorDetails[\s\S]*?\)/
  );
});
