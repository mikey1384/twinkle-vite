import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('pending chess modal requests are one-shot channel handoffs', () => {
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
  const topMenuSource = readFileSync(
    new URL('../src/containers/Home/TopMenu/index.tsx', import.meta.url),
    'utf8'
  );
  const pendingNavigationSource = readFileSync(
    new URL('../src/helpers/pendingChessModalNavigation.ts', import.meta.url),
    'utf8'
  );

  assert.match(
    pendingNavigationSource,
    /onUpdateSelectedChannelId\(channelId\);[\s\S]*onSetPendingChessModalChannelId\(channelId\);[\s\S]*navigate\(chatPath\);/
  );
  assert.match(
    appSource,
    /navigateToChatWithPendingChessModal\(\{[\s\S]*channelId,[\s\S]*chatPath: pathId \? `\/chat\/\$\{pathId\}` : `\/chat\/new`,[\s\S]*onSetPendingChessModalChannelId,[\s\S]*onUpdateSelectedChannelId[\s\S]*\}\);/
  );
  assert.match(
    topMenuSource,
    /navigateToChatWithPendingChessModal\(\{[\s\S]*channelId: unansweredChessMsgChannelId,[\s\S]*chatPath: `\/chat\/\$\{[\s\S]*Number\(CHAT_ID_BASE_NUMBER\) \+ Number\(unansweredChessMsgChannelId\)[\s\S]*\}`,[\s\S]*onSetPendingChessModalChannelId,[\s\S]*onUpdateSelectedChannelId[\s\S]*\}\);/
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
