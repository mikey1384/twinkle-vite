import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  applyBlockListResponse,
  canBlockUser,
  getBlockListSnapshot,
  isBlockedByMe,
  setFallbackNonBlockableIds
} from '../src/helpers/blockList';

function readSource(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('the block list holds only the canonical server list for the signed-in member', () => {
  setFallbackNonBlockableIds([11, 12, 13]);
  applyBlockListResponse(5, {
    blockedUsers: [{ id: 8, username: 'bully', blockedAt: 1 }],
    nonBlockableUserIds: [11, 12, 13]
  });
  assert.equal(isBlockedByMe(5, 8), true);
  assert.equal(isBlockedByMe(5, 9), false);
  // Another signed-in member never sees this member's list.
  assert.equal(isBlockedByMe(6, 8), false);
  const state = getBlockListSnapshot();
  assert.equal(canBlockUser(state, 9, 5), true);
  assert.equal(canBlockUser(state, 11, 5), false, 'Zero/Ciel/owner are not blockable');
  assert.equal(canBlockUser(state, 5, 5), false, 'nobody blocks themselves');
  applyBlockListResponse(5, { blockedUsers: [], nonBlockableUserIds: [11, 12, 13] });
  assert.equal(isBlockedByMe(5, 8), false);
});

test('background desktop notifications leave out blocked members, like push', () => {
  const source = readSource(
    'src/containers/App/Header/hooks/useAPISocket/useChatSocket.ts'
  );
  const start = source.indexOf('function notifyMessageReceivedWhileAway');
  const body = source.slice(start, start + 900);
  const guard = body.indexOf('isBlockedByMe(Number(userId), Number(message.userId))');
  assert.ok(guard > 0 && guard < body.indexOf('shouldShowBackgroundChatMessageNotification'));
  assert.match(source, /\n {2}useBlockedUsers\(\);\n/, 'the list loads for the session');
});

test('a direct chat you blocked shows no reaction button or reply', () => {
  const body = readSource('src/containers/Chat/Message/MessageBody/index.tsx');
  assert.match(body, /canReply=\{canReply && !directChatBlocked\}/);
  assert.match(body, /directChatBlocked=\{directChatBlocked\}/);
  assert.match(body, /async function handleAddReaction\(reaction: string\) \{\n {4}if \(directChatBlocked\) return;/);
  const buttons = readSource('src/containers/Chat/Message/MessageBody/ActionButtons.tsx');
  assert.match(buttons, /!directChatBlocked && \(\n\s*<ReactionButton/);
});
