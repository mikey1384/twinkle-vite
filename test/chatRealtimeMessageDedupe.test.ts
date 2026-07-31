import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  getRealtimeChatMessageKey,
  hasCanonicalChatMessage
} from '../src/helpers/chatRealtimeMessageIdentity';

test('canonical chat message identity covers root and subchannel messages', () => {
  const channelsObj = {
    4: {
      messagesObj: {
        10: { id: 10, channelId: 4 }
      },
      subchannelObj: {
        7: {
          messagesObj: {
            11: { id: 11, channelId: 4, subchannelId: 7 }
          }
        }
      }
    }
  };

  assert.equal(
    getRealtimeChatMessageKey({ id: 10, channelId: 4 }),
    '4:0:10'
  );
  assert.equal(
    getRealtimeChatMessageKey({ id: 11, channelId: 4, subchannelId: 7 }),
    '4:7:11'
  );
  assert.equal(
    hasCanonicalChatMessage({
      channelsObj,
      message: { id: 10, channelId: 4 }
    }),
    true
  );
  assert.equal(
    hasCanonicalChatMessage({
      channelsObj,
      message: { id: 11, channelId: 4, subchannelId: 7 }
    }),
    true
  );
  assert.equal(
    hasCanonicalChatMessage({
      channelsObj,
      message: { id: 11, channelId: 4 }
    }),
    false
  );
});

test('replayed chat socket messages are rejected before visible side effects', () => {
  const reducerSource = readFileSync(
    new URL('../src/contexts/Chat/reducer.ts', import.meta.url),
    'utf8'
  );
  const socketSource = readFileSync(
    new URL(
      '../src/containers/App/Header/hooks/useAPISocket/useChatSocket.ts',
      import.meta.url
    ),
    'utf8'
  );

  for (const [caseName, nextCaseName] of [
    ['RECEIVE_MESSAGE', 'RECEIVE_FIRST_MSG'],
    ['RECEIVE_FIRST_MSG', 'RECEIVE_MSG_ON_DIFF_CHANNEL'],
    [
      'RECEIVE_MSG_ON_DIFF_CHANNEL',
      'APPLY_CANONICAL_REACTION_ADD_ACTIVITY'
    ]
  ]) {
    const reducerCase =
      reducerSource.match(
        new RegExp(
          `case '${caseName}':[\\s\\S]*?(?=\\n    case '${nextCaseName}')`
        )
      )?.[0] || '';
    assert.match(reducerCase, /hasCanonicalChatMessage\(\{/);
    assert.ok(
      reducerCase.indexOf('hasCanonicalChatMessage({') <
        reducerCase.indexOf('numUnreads'),
      `${caseName} must reject a replay before changing unread state`
    );
  }

  for (const handlerName of [
    'handleChatInvitation',
    'handleReceiveMessage'
  ]) {
    const handler =
      socketSource.match(
        new RegExp(
          `function ${handlerName}\\([\\s\\S]*?(?=\\n    (?:async )?function )`
        )
      )?.[0] || '';
    assert.match(handler, /if \(shouldSkipRealtimeMessage\(message\)\) return;/);
    assert.ok(
      handler.indexOf('shouldSkipRealtimeMessage(message)') <
        handler.indexOf('markUnreadActivity()'),
      `${handlerName} must reject a replay before notifications and unread activity`
    );
    assert.match(handler, /rememberHandledRealtimeMessage\(message\);/);
  }
});
