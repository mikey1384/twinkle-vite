import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('channel presence waits for the current chat bootstrap and rejects stale replies', () => {
  const mainSource = readSource('src/containers/Chat/Main.tsx');
  const effectStart = mainSource.indexOf(
    '// Also re-runs on reconnect, not just on channel change'
  );
  const effectEnd = mainSource.indexOf(
    'const handleCreateNewChannel',
    effectStart
  );
  const presenceEffect = mainSource.slice(effectStart, effectEnd);

  assert.match(
    presenceEffect,
    /if \(!chatReadyForCurrentUser \|\| !selectedChannelId \|\| !socketConnected\)/
  );
  assert.match(
    presenceEffect,
    /const requestUserId = Number\(userId \|\| 0\);[\s\S]*?const requestChannelId = Number\(selectedChannelId\);/
  );
  assert.match(
    presenceEffect,
    /Number\(userIdRef\.current \|\| 0\) !== requestUserId/
  );
  assert.match(
    presenceEffect,
    /Number\(currentSelectedChannelIdRef\.current \|\| 0\) !==[\s\S]*?requestChannelId/
  );
  assert.match(presenceEffect, /Number\(channelId\) !== requestChannelId/);
  assert.match(
    presenceEffect,
    /\[chatReadyForCurrentUser, selectedChannelId, socketConnected, userId\]/
  );
  assert.doesNotMatch(
    presenceEffect,
    /recentOfflineUsers:\s*recentOfflineUsers \|\| \[\]/
  );
});

test('recent-offline snapshots stay account-owned and survive same-user init', () => {
  const actionSource = readSource('src/contexts/Chat/actions.ts');
  const reducerSource = readSource('src/contexts/Chat/reducer.ts');
  const setOnlineUsersStart = reducerSource.indexOf("case 'SET_ONLINE_USERS'");
  const setOnlineUsersEnd = reducerSource.indexOf(
    "case 'SET_MY_STREAM'",
    setOnlineUsersStart
  );
  const setOnlineUsersCase = reducerSource.slice(
    setOnlineUsersStart,
    setOnlineUsersEnd
  );

  assert.match(
    actionSource,
    /onSetOnlineUsers\(\{[\s\S]*?userId,[\s\S]*?type: 'SET_ONLINE_USERS',[\s\S]*?userId,/
  );
  assert.match(
    setOnlineUsersCase,
    /if \(!canonicalApplyOwnerMatchesBoundUser\(state, action\.userId\)\) \{[\s\S]*?return state;/
  );
  assert.match(
    reducerSource,
    /\.\.\.initialChatState,[\s\S]{0,300}?chatStatus: state\.chatStatus,[\s\S]{0,300}?recentOfflineUsers: state\.recentOfflineUsers/
  );
});
