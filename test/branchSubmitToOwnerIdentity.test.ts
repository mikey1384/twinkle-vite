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
    /ownerUserId=\{build\.rootBuildUserId\}/
  );
  assert.match(
    collaborationPanelSource,
    /ownerProfilePicUrl=\{build\.rootBuildProfilePicUrl\}/
  );
  assert.match(
    submitPanelSource,
    /v\.state\.chatStatus\[normalizedOwnerUserId\]/
  );
  assert.match(submitPanelSource, /<ProfilePic/);
  assert.match(submitPanelSource, /statusShown/);
});
