import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeBuildSummary } from '../src/helpers/buildSummaryHelpers';

const before = normalizeBuildSummary({
  id: 42,
  userId: 3,
  username: 'oldOwner',
  profilePicUrl: '/old.png'
});

test('after a trade the previous owner name and photo are never reused', () => {
  const after = normalizeBuildSummary(
    { id: 42, userId: 9, username: 'newOwner', profilePicUrl: null },
    before
  );
  assert.equal(after?.userId, 9);
  assert.equal(after?.username, 'newOwner');
  assert.notEqual(after?.profilePicUrl, '/old.png');
});

test('the same owner keeps cached name and photo when the update omits them', () => {
  const after = normalizeBuildSummary({ id: 42, userId: 3 }, before);
  assert.equal(after?.username, 'oldOwner');
  assert.equal(after?.profilePicUrl, '/old.png');
});

test('an update with no owner id keeps the cached owner', () => {
  const after = normalizeBuildSummary({ id: 42, title: 'Renamed' }, before);
  assert.equal(after?.userId, 3);
  assert.equal(after?.username, 'oldOwner');
});
