import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  describeLumineRunApprovalStatus,
  getLumineRunCardButtonLabels,
  hasFiniteRemainingEnergyPercent,
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

test('isLumineRunPreview accepts valid lumine_run previews and rejects null, empty, or non-numeric fields', () => {
  assert.equal(isLumineRunPreview(samplePreview), true);
  assert.equal(isLumineRunPreview({ ...samplePreview, kind: 'message_cleanup' }), false);
  assert.equal(isLumineRunPreview({ kind: 'lumine_run', buildId: 42 }), false);
  assert.equal(isLumineRunPreview({ ...samplePreview, buildId: null }), false);
  assert.equal(isLumineRunPreview({ ...samplePreview, buildId: '' }), false);
  assert.equal(isLumineRunPreview({ ...samplePreview, buildId: 0 }), false);
  assert.equal(
    isLumineRunPreview({ ...samplePreview, estimatedEnergyPercent: null }),
    false
  );
  assert.equal(
    isLumineRunPreview({ ...samplePreview, estimatedEnergyPercent: '' }),
    false
  );
  assert.equal(isLumineRunPreview(null), false);
});

test('hasFiniteRemainingEnergyPercent rejects null and empty strings while accepting 0 and positive numbers', () => {
  assert.equal(hasFiniteRemainingEnergyPercent(80), true);
  assert.equal(hasFiniteRemainingEnergyPercent(0), true);
  assert.equal(hasFiniteRemainingEnergyPercent(null), false);
  assert.equal(hasFiniteRemainingEnergyPercent(''), false);
  assert.equal(hasFiniteRemainingEnergyPercent(undefined), false);
  assert.equal(hasFiniteRemainingEnergyPercent(Number.NaN), false);
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

test('WebsiteAgentCard settles lumine_run cards in place without posting an extra chat turn and binds previewedLumineRunCardId', () => {
  const cardSource = fs.readFileSync(
    new URL(
      '../src/containers/Chat/Message/MessageBody/WebsiteAgentCard.tsx',
      import.meta.url
    ),
    'utf8'
  );
  assert.match(
    cardSource,
    /lumineRunPreview\s*\?\s*\{\s*previewedLumineRunCardId:\s*card\.id\s*\}/
  );
  const earlyReturnIndex = cardSource.indexOf(
    "if (nextCard.preview?.kind === 'lumine_run') return;"
  );
  const onAnsweredIndex = cardSource.indexOf('if (onAnswered)');
  assert.ok(earlyReturnIndex > 0, 'expected early return for settled lumine_run cards');
  assert.ok(
    earlyReturnIndex < onAnsweredIndex,
    'lumine_run early return must run before onAnswered / onSubmitMessage'
  );
});

test('LumineRunPreview avoids padded line-clamp bleed, provides expand toggle, prevents title overflow, and sizes mobile touch targets', () => {
  const previewSource = fs.readFileSync(
    new URL(
      '../src/containers/Chat/Message/MessageBody/LumineRunPreview.tsx',
      import.meta.url
    ),
    'utf8'
  );
  assert.match(previewSource, /hasFiniteRemainingEnergyPercent/);
  assert.doesNotMatch(previewSource, /Number\.isFinite\(Number\(preview\.remainingEnergyPercent\)\)/);
  assert.match(previewSource, /Show full instruction/);
  assert.match(previewSource, /Show less/);
  assert.match(
    previewSource,
    /<Icon\s+icon="bolt"\s+className=\{headingIconClass\}\s*\/>/
  );
  assert.match(
    previewSource,
    /<span\s+className=\{headingTitleClass\}>/
  );
  assert.match(previewSource, /headingIconClass[\s\S]*?flex-shrink:\s*0;/);
  assert.match(
    previewSource,
    /headingTitleClass[\s\S]*?min-width:\s*0;[\s\S]*?overflow-wrap:\s*anywhere;/
  );
  assert.match(
    previewSource,
    /instructionTextClampedClass[\s\S]*?padding:\s*0;[\s\S]*?-webkit-line-clamp:\s*4;/
  );
  assert.match(previewSource, /openBuildButtonClass[\s\S]*?min-height:\s*3\.8rem;/);
  assert.match(previewSource, /fallbackLinkClass[\s\S]*?min-height:\s*3\.8rem;/);
});
