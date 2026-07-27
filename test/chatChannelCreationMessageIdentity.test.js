import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const reducerSource = readFileSync(
  new URL('../src/contexts/Chat/reducer.ts', import.meta.url),
  'utf8'
);

function readCase(caseName, nextCaseName) {
  const match = reducerSource.match(
    new RegExp(`case '${caseName}': \\{[\\s\\S]*?case '${nextCaseName}'`)
  );
  assert.ok(match, `Expected a ${caseName} case in the chat reducer.`);
  return match[0];
}

// A channel's creation notice is a real msg_chats row: POST /chat/channel
// inserts it and returns its id. Keying the local copy by a synthesized uuid
// hid it from every id-keyed reconciliation — the canonical favorite-state
// snapshot broadcast right after creation carries the same message under its
// real id, so the creator saw two identical "created the class group" rows.
test('the channel creation notice is keyed by the server message id', () => {
  const createCase = readCase('CREATE_NEW_CHANNEL', 'CREATE_NEW_DM_CHANNEL');

  assert.match(
    createCase,
    /const startMessageId = action\.data\.message\.id \|\| uuidv1\(\);/
  );
  assert.doesNotMatch(createCase, /const startMessageId = uuidv1\(\);/);
  assert.match(createCase, /messageIds: \[startMessageId\]/);
  assert.match(createCase, /\[startMessageId\]: action\.data\.message/);
});

test('every chat message the server has already identified keeps that id', () => {
  // The DM sibling and each realtime delivery path already do this; they are
  // the reference for the rule the creation case broke.
  for (const [caseName, nextCaseName] of [
    ['CREATE_NEW_DM_CHANNEL', 'DELETE_AI_MESSAGE'],
    ['RECEIVE_MESSAGE', 'RECEIVE_MSG_ON_DIFF_CHANNEL'],
    ['RECEIVE_FIRST_MSG', 'RECEIVE_MSG_ON_DIFF_CHANNEL']
  ]) {
    const caseSource = reducerSource.match(
      new RegExp(`case '${caseName}': \\{[\\s\\S]*?case '${nextCaseName}'`)
    );
    if (!caseSource) continue;
    assert.match(
      caseSource[0],
      /const messageId = action\.message(\?)?\.id (\|\||\?) /,
      `${caseName} should key messages by the server id when it has one`
    );
  }
});

// The canonical sidebar snapshot the create route broadcasts merges its
// messageIds into the channel. That merge is id-keyed, which is why the
// synthesized key produced a duplicate row rather than being reconciled away.
test('favorite-state merges reconcile message ids rather than concatenating', () => {
  assert.match(
    reducerSource,
    /messageIds: mergeNewestFirstMessageIds\(\{\s*currentMessageIds: currentChannel\.messageIds \|\| \[\],\s*serverMessageIds: canonicalChannel\.messageIds \|\| \[\]/
  );
});
