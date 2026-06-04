import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('pending targeted chess modal requests are one-shot channel handoffs', () => {
  const messagesContainerSource = readFileSync(
    new URL(
      '../src/containers/Chat/Body/MessagesContainer/index.tsx',
      import.meta.url
    ),
    'utf8'
  );
  const appSource = readFileSync(
    new URL('../src/containers/App/index.tsx', import.meta.url),
    'utf8'
  );

  assert.match(
    appSource,
    /onUpdateSelectedChannelId\(channelId\);[\s\S]*onSetPendingChessModalChannelId\(channelId\);[\s\S]*navigate\(pathId \? `\/chat\/\$\{pathId\}` : `\/chat\/new`\);/
  );
  assert.match(
    messagesContainerSource,
    /if \(pendingChessModalChannelId == null\) return;[\s\S]*if \(Number\(pendingChessModalChannelId\) !== Number\(selectedChannelId\)\) \{[\s\S]*onSetPendingChessModalChannelId\(null\);[\s\S]*return;[\s\S]*\}/
  );
  assert.match(
    messagesContainerSource,
    /if \(banned\?\.chess\) \{[\s\S]*onSetPendingChessModalChannelId\(null\);[\s\S]*return;[\s\S]*\}/
  );
  assert.match(
    messagesContainerSource,
    /const currentCountdown = boardCountdownObj\[selectedChannelId\]\?\.chess;[\s\S]*onSetPendingChessModalChannelId\(null\);[\s\S]*if \(currentCountdown === 0\) return;[\s\S]*onSetChessModalShown\(true\);/
  );
});
