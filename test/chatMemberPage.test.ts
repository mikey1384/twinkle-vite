import assert from 'node:assert/strict';
import test from 'node:test';
import { applyMemberPage } from '../src/contexts/Chat/memberPage';
import ChatActions from '../src/contexts/Chat/actions';

test('preview duplicates and online/on-call ordering do not control progress', () => {
  const channel = { members: [{id: 1}, {id: 318}, {id: 81}], nextMemberCursor: 0 };
  const next = applyMemberPage(channel, {
    members: [{id: 318}, {id: 317}, {id: 317}],
    loadMoreShown: true, nextMemberCursor: 299, requestedMemberCursor: 0
  });
  assert.deepEqual(next.members.map(m => m.id), [1, 318, 81, 317]);
  assert.equal(next.nextMemberCursor, 299);
  assert.equal(next.loadMoreMembersShown, true);
  assert.equal(channel.members.length, 3);
});

test('duplicate-only page advances; stale concurrent response cannot reopen completed roster', () => {
  const next = applyMemberPage({members: [{id: 1}], nextMemberCursor: 50}, {
    members: [{id: 1}], loadMoreShown: true, nextMemberCursor: 30, requestedMemberCursor: 50
  });
  assert.equal(next.nextMemberCursor, 30);
  const stale = applyMemberPage(next, {members: [], loadMoreShown: true, nextMemberCursor: 40, requestedMemberCursor: 50});
  assert.equal(stale.nextMemberCursor, 30);
  const done = applyMemberPage(stale, {members: [], loadMoreShown: false, nextMemberCursor: null, requestedMemberCursor: 30});
  const late = applyMemberPage(done, {members: [{id: 20}], loadMoreShown: true, nextMemberCursor: 40, requestedMemberCursor: 50});
  assert.equal(late.nextMemberCursor, null);
  assert.equal(late.loadMoreMembersShown, false);
  assert.deepEqual(late.members.map(m => m.id), [1]);
});

test('action carries canonical continuation and completion', () => {
  let received: any;
  ChatActions(action => { received = action; }).onLoadMoreChannelMembers({
    channelId: 106, members: [], loadMoreShown: false, nextMemberCursor: null, requestedMemberCursor: 30
  });
  assert.equal(received.nextMemberCursor, null);
  assert.equal(received.loadMoreShown, false);
});

test('a late final page cannot complete a freshly reloaded roster', () => {
  const reloaded = {members: [{id: 318}], nextMemberCursor: 0, loadMoreMembersShown: true};
  assert.equal(applyMemberPage(reloaded, {members: [{id: 1}], loadMoreShown: false,
    nextMemberCursor: null, requestedMemberCursor: 20}), reloaded);
});
