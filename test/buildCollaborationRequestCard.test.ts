import assert from 'node:assert/strict';
import test from 'node:test';
import { getBuildCollaborationRequestChipLabel } from '../src/helpers/buildCollaborationRequestCardHelpers';

test('pending join requests name the viewer who can act', () => {
  assert.equal(
    getBuildCollaborationRequestChipLabel({
      memberLeft: false,
      sentByMe: true,
      status: 'pending'
    }),
    'Waiting for reply'
  );
  assert.equal(
    getBuildCollaborationRequestChipLabel({
      memberLeft: false,
      sentByMe: false,
      status: 'pending'
    }),
    'Waiting on you'
  );
});

test('settled join request labels do not depend on the viewer', () => {
  const settledStates = [
    ['accepted', 'On the team'],
    ['rejected', 'Declined'],
    ['canceled', 'Canceled'],
    ['invited', 'Invited']
  ] as const;

  for (const [status, expectedLabel] of settledStates) {
    assert.equal(
      getBuildCollaborationRequestChipLabel({
        memberLeft: false,
        sentByMe: true,
        status
      }),
      expectedLabel
    );
    assert.equal(
      getBuildCollaborationRequestChipLabel({
        memberLeft: false,
        sentByMe: false,
        status
      }),
      expectedLabel
    );
  }
});

test('leaving the team takes precedence over the accepted request row', () => {
  assert.equal(
    getBuildCollaborationRequestChipLabel({
      memberLeft: true,
      sentByMe: true,
      status: 'accepted'
    }),
    'Left the team'
  );
});
