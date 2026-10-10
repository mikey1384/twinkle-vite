import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  getBranchSubmitOwnerCopy,
  getBranchSubmitOwnerPresence
} from '../src/helpers/branchSubmitToOwnerHelpers';

test('the branch handoff action speaks directly to its owner', () => {
  assert.deepEqual(
    getBranchSubmitOwnerCopy({ ownerUsername: 'Maya', sent: false }),
    {
      ownerName: 'Maya',
      actionLabel: 'Send update to Maya',
      sentLabel: 'Update sent to Maya'
    }
  );
  assert.equal(
    getBranchSubmitOwnerCopy({ ownerUsername: 'Maya', sent: true })
      .actionLabel,
    'Send another update to Maya'
  );
});

test('missing owner copy stays approachable and grammatically complete', () => {
  assert.deepEqual(
    getBranchSubmitOwnerCopy({ ownerUsername: null, sent: false }),
    {
      ownerName: 'the project owner',
      actionLabel: 'Send update to the project owner',
      sentLabel: 'Update sent to the project owner'
    }
  );
});

test('only confirmed online presence produces an avatar status', () => {
  assert.deepEqual(getBranchSubmitOwnerPresence(undefined), {
    isOnline: false,
    isAway: false,
    isBusy: false
  });
  assert.deepEqual(
    getBranchSubmitOwnerPresence({
      isOnline: true,
      isAway: true,
      isBusy: false
    }),
    {
      isOnline: true,
      isAway: true,
      isBusy: false
    }
  );
  assert.deepEqual(
    getBranchSubmitOwnerPresence({
      isOnline: false,
      isAway: true,
      isBusy: true
    }),
    {
      isOnline: false,
      isAway: false,
      isBusy: false
    }
  );
});

test('the branch workspace wires canonical owner identity into the person CTA', () => {
  const collaborationPanelSource = readFileSync(
    new URL(
      '../src/containers/Build/Editor/CollaborationPanel/index.tsx',
      import.meta.url
    ),
    'utf8'
  );
  const submitPanelSource = readFileSync(
    new URL(
      '../src/containers/Build/Editor/BranchSubmitToOwnerPanel.tsx',
      import.meta.url
    ),
    'utf8'
  );

  assert.match(
    collaborationPanelSource,
    /ownerUserId=\{target\.ownerUserId\}/
  );
  assert.match(
    collaborationPanelSource,
    /ownerProfilePicUrl=\{target\.ownerProfilePicUrl\}/
  );
  assert.match(
    submitPanelSource,
    /v\.state\.chatStatus\[normalizedOwnerUserId\]/
  );
  assert.match(submitPanelSource, /<ProfilePic/);
  assert.match(submitPanelSource, /statusShown/);
});

test('a sent update says when it went and who it is waiting on', async () => {
  const { formatBranchSubmitWaitingLine } = await import(
    '../src/helpers/branchSubmitToOwnerHelpers'
  );
  assert.equal(
    formatBranchSubmitWaitingLine({ ownerName: 'Maya', sentAgo: '4 days ago' }),
    'Sent 4 days ago, waiting for Maya'
  );
});

test('the owner identity behind the CTA comes from the canonical build fields', async () => {
  const { getBranchSubmitToOwnerTarget } = await import(
    '../src/helpers/branchSubmitToOwnerHelpers'
  );
  const target = getBranchSubmitToOwnerTarget({
    build: {
      id: 20,
      contributionStatus: 'draft',
      contributionContributorId: 8,
      contributionRootBuildId: 10,
      contributionRevisionHash: 'rev',
      contributionSubmittedAt: 1000,
      contributionSubmittedRevisionHash: 'rev',
      rootBuildUserId: 7,
      rootBuildUsername: 'maya',
      rootBuildProfilePicUrl: '/pic.png'
    },
    userId: 8
  });
  assert.equal(target?.ownerUserId, 7);
  assert.equal(target?.ownerProfilePicUrl, '/pic.png');
  assert.equal(target?.submittedAt, 1000);
});
