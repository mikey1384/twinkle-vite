import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getViewerCollaborationBuildSummaryPatch,
  patchBuildSummaryMap,
  shouldShowBuildUpdatedMeta
} from '../src/helpers/buildSummaryHelpers';

const VIEWER = 7;
const OWNER = 3;
const BUILD = 42;

function request(status: string, requesterUserId = VIEWER) {
  return {
    id: 11,
    inviteId: 0,
    buildId: BUILD,
    requesterUserId,
    ownerUserId: OWNER,
    status
  };
}

function invite(status: string, userId = VIEWER) {
  return { id: 21, buildId: BUILD, userId, status, createdAt: 1000 };
}

test('owner accepting my request marks me an active member', () => {
  const update = getViewerCollaborationBuildSummaryPatch({
    viewerId: VIEWER,
    buildId: BUILD,
    request: request('accepted'),
    invite: invite('accepted'),
    inviteStatus: 'accepted'
  });
  assert.ok(update);
  assert.equal(update.buildId, BUILD);
  assert.equal(
    (update.patch.viewerCollaborationRequest as any).status,
    'accepted'
  );
  assert.equal(update.patch.hasActiveContributionInvite, true);
  assert.equal(update.patch.viewerCollaborationRequestLoaded, true);
  assert.equal(update.patch.viewerStateUserId, VIEWER);
});

test('my new pending request lands in viewer state', () => {
  const update = getViewerCollaborationBuildSummaryPatch({
    viewerId: VIEWER,
    buildId: BUILD,
    request: request('pending')
  });
  assert.ok(update);
  assert.equal(
    (update.patch.viewerCollaborationRequest as any).status,
    'pending'
  );
  assert.equal('hasActiveContributionInvite' in update.patch, false);
});

test('rejection and cancellation store the canonical request verbatim', () => {
  for (const status of ['rejected', 'canceled']) {
    const update = getViewerCollaborationBuildSummaryPatch({
      viewerId: VIEWER,
      buildId: BUILD,
      request: request(status)
    });
    assert.ok(update);
    assert.equal(
      (update.patch.viewerCollaborationRequest as any).status,
      status
    );
  }
});

test('a direct invite applies the canonical server request projection', () => {
  const canonicalRequest = {
    ...request('invited'),
    id: 0,
    inviteId: 21
  };
  const update = getViewerCollaborationBuildSummaryPatch({
    viewerId: VIEWER,
    buildId: BUILD,
    invite: invite('pending'),
    inviteStatus: 'pending',
    request: canonicalRequest
  });
  assert.ok(update);
  assert.equal(update.patch.viewerCollaborationRequest, canonicalRequest);
  assert.equal(update.patch.viewerCollaborationRequestLoaded, true);
});

test('an invite fragment never fabricates canonical request state', () => {
  const update = getViewerCollaborationBuildSummaryPatch({
    viewerId: VIEWER,
    buildId: BUILD,
    invite: invite('pending'),
    inviteStatus: 'pending'
  });
  assert.ok(update);
  assert.equal('viewerCollaborationRequest' in update.patch, false);
  assert.equal(update.patch.viewerCollaborationRequestLoaded, false);
});

test('declined, revoked, and left clear membership and request state', () => {
  for (const status of ['declined', 'revoked', 'left']) {
    const update = getViewerCollaborationBuildSummaryPatch({
      viewerId: VIEWER,
      buildId: BUILD,
      invite: invite(status),
      inviteStatus: status
    });
    assert.ok(update);
    assert.equal(update.patch.viewerCollaborationRequest, null);
    assert.equal(update.patch.hasActiveContributionInvite, false);
  }
});

test('events about other users never touch my viewer state', () => {
  // The owner receiving someone's ask-to-join.
  assert.equal(
    getViewerCollaborationBuildSummaryPatch({
      viewerId: OWNER,
      buildId: BUILD,
      request: request('pending', VIEWER)
    }),
    null
  );
  // The owner seeing a contributor accept an invite.
  assert.equal(
    getViewerCollaborationBuildSummaryPatch({
      viewerId: OWNER,
      buildId: BUILD,
      invite: invite('accepted', VIEWER),
      inviteStatus: 'accepted'
    }),
    null
  );
});

test('payload records cannot patch a different top-level build', () => {
  assert.equal(
    getViewerCollaborationBuildSummaryPatch({
      viewerId: VIEWER,
      buildId: BUILD + 1,
      request: request('accepted')
    }),
    null
  );
  assert.equal(
    getViewerCollaborationBuildSummaryPatch({
      viewerId: VIEWER,
      buildId: BUILD + 1,
      invite: invite('accepted')
    }),
    null
  );
});

test('missing viewer or build id yields no patch', () => {
  assert.equal(
    getViewerCollaborationBuildSummaryPatch({
      viewerId: 0,
      buildId: BUILD,
      request: request('accepted')
    }),
    null
  );
  assert.equal(
    getViewerCollaborationBuildSummaryPatch({
      viewerId: VIEWER,
      request: { ...request('accepted'), buildId: 0 }
    }),
    null
  );
});

test('build id falls back to the request or invite payload', () => {
  const fromRequest = getViewerCollaborationBuildSummaryPatch({
    viewerId: VIEWER,
    request: request('accepted')
  });
  assert.equal(fromRequest?.buildId, BUILD);
  const fromInvite = getViewerCollaborationBuildSummaryPatch({
    viewerId: VIEWER,
    invite: invite('pending'),
    inviteStatus: 'pending'
  });
  assert.equal(fromInvite?.buildId, BUILD);
});

test('older collaboration events cannot overwrite newer viewer state', () => {
  const newer = patchBuildSummaryMap({}, BUILD, {
    viewerCollaborationEventTimeMs: 2000,
    viewerCollaborationRequest: request('accepted'),
    viewerCollaborationRequestLoaded: true,
    viewerStateUserId: VIEWER
  });
  const stale = patchBuildSummaryMap(newer, BUILD, {
    viewerCollaborationEventTimeMs: 1000,
    viewerCollaborationRequest: request('pending'),
    viewerCollaborationRequestLoaded: true,
    viewerStateUserId: VIEWER
  });
  assert.equal(stale, newer);
  assert.equal(stale[BUILD].viewerCollaborationRequest?.status, 'accepted');
});

test('collaboration event times normalize seconds before stale comparison', () => {
  const update = getViewerCollaborationBuildSummaryPatch({
    viewerId: VIEWER,
    buildId: BUILD,
    eventTimeMs: 2,
    request: request('pending'),
    timeStamp: 3
  });
  assert.equal(update?.patch.viewerCollaborationEventTimeMs, 3000);
});

test('Updated metadata is hidden only when it duplicates Published', () => {
  assert.equal(shouldShowBuildUpdatedMeta(100, 100), false);
  assert.equal(shouldShowBuildUpdatedMeta(100.9, 100.1), false);
  assert.equal(shouldShowBuildUpdatedMeta(101, 100), true);
  assert.equal(shouldShowBuildUpdatedMeta(100, null), true);
  assert.equal(shouldShowBuildUpdatedMeta(0, 100), false);
});
