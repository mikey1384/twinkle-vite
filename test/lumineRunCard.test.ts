import assert from 'node:assert/strict';
import test from 'node:test';
import {
  describeLumineRunApprovalStatus,
  getLumineRunCardButtonLabels,
  isLumineRunPreview,
  resolveLumineRunBuildPath,
  type LumineRunPreviewData
} from '../src/helpers/lumineRunCard';

const samplePreview: LumineRunPreviewData = {
  kind: 'lumine_run',
  buildId: 42,
  appTitle: 'Space Runner',
  buildPath: '/build/42',
  instruction: 'Add a pause menu with sound toggle',
  estimatedEnergyPercent: 18,
  estimatedEnergyUnits: 213_000,
  remainingEnergyPercent: 80,
  modeLabel: 'Auto'
};

test('isLumineRunPreview accepts valid lumine_run previews and rejects other kinds', () => {
  assert.equal(isLumineRunPreview(samplePreview), true);
  assert.equal(isLumineRunPreview({ ...samplePreview, kind: 'message_cleanup' }), false);
  assert.equal(isLumineRunPreview({ kind: 'lumine_run', buildId: 42 }), false);
  assert.equal(isLumineRunPreview(null), false);
});

test('resolveLumineRunBuildPath prefers canonical result buildPath and blocks unsafe paths', () => {
  assert.equal(resolveLumineRunBuildPath(samplePreview), '/build/42');
  assert.equal(
    resolveLumineRunBuildPath(samplePreview, { buildPath: '/build/42/3' }),
    '/build/42/3'
  );
  assert.equal(
    resolveLumineRunBuildPath(samplePreview, { buildPath: '//evil.example/build/1' }),
    '/build'
  );
  assert.equal(
    resolveLumineRunBuildPath({ ...samplePreview, buildPath: 'https://evil.example' }),
    '/build'
  );
});

test('lumine_run confirm card uses Start / Not now labels and clear status copy', () => {
  assert.deepEqual(getLumineRunCardButtonLabels(), {
    approve: 'Start',
    decline: 'Not now'
  });
  assert.match(
    describeLumineRunApprovalStatus('approved', { data: { waitingBehindOwnRun: false } }) || '',
    /Lumine started/
  );
  assert.match(
    describeLumineRunApprovalStatus('approved', { data: { waitingBehindOwnRun: true } }) || '',
    /Queued for Lumine/
  );
  assert.equal(describeLumineRunApprovalStatus('declined'), 'Okay, not started.');
  assert.equal(
    describeLumineRunApprovalStatus('failed', {
      data: { error: 'You are out of AI Energy right now.' }
    }),
    'You are out of AI Energy right now.'
  );
  assert.equal(describeLumineRunApprovalStatus('pending'), undefined);
});
