import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyMemberPage,
  getMemberPageQuery,
  resolveMemberPage
} from '../src/contexts/Chat/memberPage';
import ChatActions from '../src/contexts/Chat/actions';

test('preview duplicates and online/on-call ordering do not control progress', () => {
  const channel = {
    members: [{ id: 1 }, { id: 318 }, { id: 81 }],
    allMemberIds: [1, 81, 317, 318],
    nextMemberCursor: 0
  };
  const next = applyMemberPage(channel, channel, {
    members: [{ id: 318 }, { id: 317 }, { id: 317 }],
    loadMoreShown: true,
    nextMemberCursor: 299
  });
  assert.deepEqual(next.members.map((member: { id: number }) => member.id), [1, 318, 81, 317]);
  assert.equal(next.nextMemberCursor, 299);
  assert.equal(next.loadMoreMembersShown, true);
  assert.equal(channel.members.length, 3);
});

test('duplicate-only page advances and a stale duplicate cannot reopen a completed roster', () => {
  const initial = { members: [{ id: 1 }], nextMemberCursor: 50 };
  const first = {
    members: [{ id: 1 }],
    loadMoreShown: true,
    nextMemberCursor: 30
  };
  const next = applyMemberPage(initial, initial, first);
  assert.equal(next.nextMemberCursor, 30);
  assert.equal(applyMemberPage(next, initial, first), next);

  const done = applyMemberPage(next, next, {
    members: [],
    loadMoreShown: false,
    nextMemberCursor: null
  });
  assert.equal(done.nextMemberCursor, null);
  assert.equal(done.loadMoreMembersShown, false);
  assert.equal(applyMemberPage(done, initial, first), done);
  assert.deepEqual(done.members, [{ id: 1 }]);
});

test('channel reloads, departures and account reset reject old responses even at the same cursor', () => {
  const initial = {
    members: [{ id: 318 }],
    allMemberIds: [1, 318],
    nextMemberCursor: 0
  };
  const page = {
    members: [{ id: 1 }],
    loadMoreShown: false,
    nextMemberCursor: null
  };
  const reloaded = { ...initial, members: [...initial.members] };
  const departed = { ...initial, allMemberIds: [318] };
  assert.equal(applyMemberPage(reloaded, initial, page), reloaded);
  assert.equal(applyMemberPage(departed, initial, page), departed);
  assert.equal(applyMemberPage(undefined, initial, page), undefined);
  assert.equal(applyMemberPage(reloaded, { ...initial, nextMemberCursor: 20 }, page), reloaded);
});

test('terminal membership removes departures and makes a behind-cursor join reachable exactly once', () => {
  const initial = {
    members: [{ id: 42 }, { id: 30 }, { id: 29 }],
    allMemberIds: [1, 29, 30, 42],
    nextMemberCursor: 20
  };
  const terminal = {
    members: [{ id: 1 }],
    allMemberIds: [1, 29, 30, 45],
    loadMoreShown: false,
    nextMemberCursor: null
  };
  const repair = applyMemberPage(initial, initial, terminal);
  assert.deepEqual(repair.members, [{ id: 30 }, { id: 29 }, { id: 1 }]);
  assert.equal(repair.nextMemberCursor, 0);
  assert.equal(repair.loadMoreMembersShown, true);

  const done = applyMemberPage(repair, repair, {
    ...terminal,
    members: [{ id: 45 }, { id: 30 }, { id: 29 }, { id: 1 }]
  });
  assert.deepEqual(done.members, [{ id: 30 }, { id: 29 }, { id: 1 }, { id: 45 }]);
  assert.equal(done.nextMemberCursor, null);
  assert.equal(done.loadMoreMembersShown, false);
});

test('legacy requests start above all user IDs and continue from the raw returned tail', () => {
  const start = new URLSearchParams(getMemberPageQuery(0));
  assert.equal(start.get('memberCursor'), '0');
  assert.equal(start.get('lastId'), '4294967296');
  const first = resolveMemberPage({
    members: [{ id: 318 }, { id: 299 }],
    loadMoreShown: true
  });
  assert.equal(first.nextMemberCursor, 299);
  assert.equal(new URLSearchParams(getMemberPageQuery(first.nextMemberCursor!)).get('lastId'), '299');
  const complete = resolveMemberPage({ members: [], loadMoreShown: false });
  assert.equal(complete.nextMemberCursor, null);
  assert.equal(resolveMemberPage({ ...complete, nextMemberCursor: 20 }).nextMemberCursor, 20);
});

test('action carries canonical continuation, roster identity and the requesting account', () => {
  let received: any;
  const requested = { nextMemberCursor: 30, allMemberIds: [1] };
  const page = { members: [{ id: 1 }], loadMoreShown: false, nextMemberCursor: null };
  ChatActions((action) => { received = action; }).onLoadMoreChannelMembers({
    channelId: 106,
    userId: 8,
    requested,
    page
  });
  assert.equal(received.userId, 8);
  assert.equal(received.requested, requested);
  assert.equal(received.page, page);
});
