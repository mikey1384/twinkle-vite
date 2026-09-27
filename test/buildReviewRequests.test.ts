import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  buildReviewCardBanner,
  cardCraftReviewRow,
  compareBuildReviewRequestVersions,
  formatReviewBytes,
  getBuildReviewRequestManagementPath,
  parseBuildReviewRequestFocus,
  projectLimitReviewRow,
  storageLimitReviewRow
} from '../src/helpers/buildReviewRequests';

const MB = 1024 * 1024;
const GB = 1024 * MB;

test('project room shows only when nearly full or waiting, with one button', () => {
  const approval = {
    isInherited: false,
    canRequestFiles: true,
    canRequestSize: true,
    requestedMaxFiles: 500,
    requestedMaxProjectBytes: 5 * MB,
    latestRequest: null
  };
  const limits = { maxFilesPerProject: 100, maxProjectBytes: 2 * MB };
  assert.equal(
    projectLimitReviewRow({
      approval,
      usage: { projectFileCount: 10, currentProjectBytes: 1000 },
      limits,
      isOwner: true
    }),
    null
  );
  const full = projectLimitReviewRow({
    approval,
    usage: { projectFileCount: 85, currentProjectBytes: 1000 },
    limits,
    isOwner: true
  })!;
  assert.equal(full.type, 'project-limit');
  assert.equal(full.tone, 'action');
  assert.deepEqual(full.action, {
    kind: 'request-project-limit',
    label: 'Ask Mikey',
    files: true,
    size: false
  });
  assert.match(full.detail, /500 files/);
  // Branch owners and contributors never ask; Main's owner does.
  assert.equal(
    projectLimitReviewRow({
      approval: { ...approval, isInherited: true },
      usage: { projectFileCount: 85 },
      limits,
      isOwner: true
    }),
    null
  );
  const waiting = projectLimitReviewRow({
    approval: {
      ...approval,
      latestRequest: { status: 'pending', requestedMaxFiles: 500 }
    },
    usage: { projectFileCount: 85 },
    limits,
    isOwner: true
  })!;
  assert.equal(waiting.title, 'Waiting for Mikey');
  assert.equal(waiting.action, null);
  const addToRequest = projectLimitReviewRow({
    approval: {
      ...approval,
      latestRequest: { status: 'pending', requestedMaxFiles: 500 }
    },
    usage: { projectFileCount: 85, currentProjectBytes: 1.9 * MB },
    limits,
    isOwner: true
  })!;
  assert.equal(addToRequest.action?.label, 'Add to my request');
  assert.equal(addToRequest.action?.size, true);
  assert.equal(addToRequest.action?.files, false);
});

test('file storage asks for the next step for the creator', () => {
  const approval = {
    canRequest: true,
    requestTiers: [500 * MB, 1 * GB, 2 * GB],
    latestRequest: null
  };
  const limits = { maxRuntimeFileStorageBytes: 150 * MB };
  assert.equal(
    storageLimitReviewRow({
      approval,
      usage: { runtimeFileStorageBytes: 10 * MB },
      limits
    }),
    null
  );
  const full = storageLimitReviewRow({
    approval,
    usage: { runtimeFileStorageBytes: 130 * MB },
    limits
  })!;
  assert.deepEqual(full.action, {
    kind: 'request-storage-limit',
    label: 'Ask Mikey',
    bytes: 500 * MB
  });
  const waiting = storageLimitReviewRow({
    approval: {
      ...approval,
      latestRequest: {
        status: 'pending',
        requestedMaxRuntimeFileStorageBytes: 500 * MB
      }
    },
    usage: { runtimeFileStorageBytes: 10 * MB },
    limits
  })!;
  assert.equal(waiting.tone, 'waiting');
  assert.match(waiting.detail, /500 MB/);
  assert.equal(waiting.action, null);
  const mikey = storageLimitReviewRow({
    approval: { ...approval, canApproveDirectly: true },
    usage: { runtimeFileStorageBytes: 130 * MB },
    limits
  })!;
  assert.equal(mikey.action?.label, 'Approve more storage');
});

test('card crafting rows follow the recipe state, one button at most', () => {
  assert.equal(cardCraftReviewRow(null), null);
  assert.equal(cardCraftReviewRow({ state: 'not_declared' }), null);
  const needs = cardCraftReviewRow({ state: 'needs_review' })!;
  assert.deepEqual(needs.action, { kind: 'request-cardcraft', label: 'Ask Mikey' });
  const declined = cardCraftReviewRow({
    state: 'needs_review',
    liveReviewId: 3,
    latestReview: { id: 4, status: 'rejected', reason: 'Too strong' }
  })!;
  assert.equal(declined.title, 'Not approved yet');
  assert.match(declined.detail, /Too strong/);
  assert.match(declined.detail, /approved recipe keeps working/);
  const pending = cardCraftReviewRow({ state: 'pending' })!;
  assert.equal(pending.tone, 'waiting');
  assert.equal(pending.action, null);
  // Unsaved edits to an approved or pending recipe need a fresh request.
  assert.equal(
    cardCraftReviewRow({ state: 'pending' }, { hasUnsavedChanges: true })!
      .action?.kind,
    'request-cardcraft'
  );
  assert.equal(cardCraftReviewRow({ state: 'approved' })!.tone, 'done');
  assert.equal(cardCraftReviewRow({ state: 'invalid' })!.action, null);
});

test('links, banners and version order are shared by the card and the queue', () => {
  assert.equal(
    getBuildReviewRequestManagementPath('storage-limit', 12),
    '/management?review=storage-limit:12'
  );
  assert.equal(
    getBuildReviewRequestManagementPath('rewards', 70),
    '/management?rewardReview=70'
  );
  assert.deepEqual(parseBuildReviewRequestFocus('?review=cardcraft:3'), {
    type: 'cardcraft',
    id: 3
  });
  assert.deepEqual(parseBuildReviewRequestFocus('?rewardReview=70'), {
    type: 'rewards',
    id: 70
  });
  assert.equal(parseBuildReviewRequestFocus('?review=storage:0'), null);
  assert.equal(
    buildReviewCardBanner({ type: 'storage-limit', status: 'approved' }),
    'File storage approved'
  );
  assert.equal(
    buildReviewCardBanner({ type: 'cardcraft', status: 'pending' }),
    'Sent a card crafting recipe for review'
  );
  assert.ok(
    compareBuildReviewRequestVersions(
      { eventTimeMs: 2000 },
      { eventTimeMs: 1000 }
    ) > 0
  );
  assert.equal(formatReviewBytes(500 * MB), '500 MB');
  assert.equal(formatReviewBytes(2 * GB), '2 GB');
});

test('one notice in the workspace; the Lumine panel no longer carries its own', () => {
  const header = readFileSync(
    new URL('../src/containers/Build/Editor/Header.tsx', import.meta.url),
    'utf8'
  );
  assert.match(header, /<WorkspaceReviewRequests[\s\S]*limits=\{reviewRequestLimits\}/);
  assert.doesNotMatch(header, /RewardApprovalNotice/);
  const lumineHeader = readFileSync(
    new URL(
      '../src/containers/Build/Editor/ChatPanel/Header.tsx',
      import.meta.url
    ),
    'utf8'
  );
  assert.doesNotMatch(lumineHeader, /ProjectLimitNudge|StorageLimitNudge/);
  const registry = readFileSync(
    new URL('../src/contexts/requestHelpers/index.ts', import.meta.url),
    'utf8'
  );
  for (const name of [
    'loadBuildReviewRequests',
    'loadBuildReviewRequest',
    'decideBuildReviewRequest',
    'loadBuildCardCraftSettings',
    'requestBuildCardCraftReview'
  ]) {
    assert.match(registry, new RegExp(`'${name}'`));
  }
});
