import assert from 'node:assert/strict';
import test from 'node:test';
import { canGroupChatMessages } from '../src/containers/Chat/Message/helpers/messageGrouping';

const timeStamp = new Date(2026, 8, 7, 12).getTime() / 1000;
const previous = {
  id: 1, userId: 7, content: 'Hello', timeStamp,
  channelId: 2, subchannelId: 0, subjectId: 0, isLoaded: true
};
const current = { ...previous, id: 2, content: 'Another thought', timeStamp: timeStamp + 60 };

test('nearby messages from one author group without changing message data', () => {
  const older = Object.freeze({ ...previous });
  const newer = Object.freeze({ ...current });
  assert.equal(canGroupChatMessages(older, newer), true);
  assert.equal(canGroupChatMessages(previous, { ...current, timeStamp }), true);
  assert.equal(canGroupChatMessages(previous, { ...current, timeStamp: timeStamp + 300 }), true);
});

test('author, conversation, topic and time boundaries start a new group', () => {
  for (const changes of [
    { userId: 8 }, { channelId: 3 }, { subchannelId: 1 }, { subjectId: 1 },
    { timeStamp: timeStamp + 301 }, { timeStamp: timeStamp - 1 }
  ]) {
    assert.equal(canGroupChatMessages(previous, { ...current, ...changes }), false);
  }
  const midnight = new Date(2026, 8, 8).getTime() / 1000;
  assert.equal(canGroupChatMessages(
    { ...previous, timeStamp: midnight - 30 },
    { ...current, timeStamp: midnight + 30 }
  ), false);
});

test('structured notices, replies, attachments and topic starts keep their own headers', () => {
  for (const changes of [
    { rootType: 'approval' }, { isNotification: true }, { isCallMsg: true },
    { isSubject: true }, { isReloadedSubject: true }, { targetMessage: { id: 3 } },
    { targetSubject: { id: 3 } }, { filePath: 'attachment' }, { fileToUpload: {} },
    { invitePath: 'invite' }, { chessState: {} }, { omokState: {} },
    { isDrawOffer: true }, { gameWinnerId: 7 }, { rewardAmount: 100 },
    { wordleResult: {} }, { transferDetails: {} }, { transactionDetails: {} }
  ]) {
    assert.equal(canGroupChatMessages(previous, { ...current, ...changes }), false);
    assert.equal(canGroupChatMessages({ ...previous, ...changes }, current), false);
  }
});

test('missing, unloaded and invalid messages never suppress an author header', () => {
  assert.equal(canGroupChatMessages(undefined, current), false);
  assert.equal(canGroupChatMessages(previous, undefined), false);
  for (const changes of [
    { id: 0 }, { userId: 0 }, { isLoaded: false }, { content: '' },
    { timeStamp: NaN }, { timeStamp: 0 }, { timeStamp: Infinity }
  ]) {
    assert.equal(canGroupChatMessages(previous, { ...current, ...changes }), false);
  }
});

test('reactions remain attached to individual grouped messages', () => {
  assert.equal(canGroupChatMessages(previous, {
    ...current, reactions: [{ type: 'thumb', userId: 9 }]
  }), true);
});
