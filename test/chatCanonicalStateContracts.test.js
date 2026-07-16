import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('quick access uses server revisions instead of caller-specific race guards', () => {
  const reducerSource = readSource('src/contexts/Chat/reducer.ts');
  const actionSource = readSource('src/contexts/Chat/actions.ts');
  const socketSource = readSource(
    'src/containers/App/Header/hooks/useAPISocket/useChatSocket.ts'
  );
  const refreshSource = readSource(
    'src/helpers/hooks/useChatQuickAccessRefresh.ts'
  );
  const combinedSource = [
    reducerSource,
    actionSource,
    socketSource,
    refreshSource
  ].join('\n');

  assert.doesNotMatch(
    combinedSource,
    /quickAccessUpdatedAt|expectedUpdatedAt|refreshRequestId|beginChatQuickAccessRefresh/
  );
  assert.match(
    reducerSource,
    /Number\(action\.quickAccess\?\.revision \|\| 0\) <[\s\S]*?Number\(state\.quickAccess\?\.revision \|\| 0\)/
  );
  assert.equal(
    actionSource.match(/type: 'APPLY_CANONICAL_CHAT_SIDEBAR_STATE'/g)?.length,
    1
  );
  assert.match(socketSource, /'chat_sidebar_state_updated'/);
});

test('all reaction transports enter one canonical reducer action', () => {
  const actionSource = readSource('src/contexts/Chat/actions.ts');
  const reducerSource = readSource('src/contexts/Chat/reducer.ts');
  const socketSource = readSource(
    'src/containers/App/Header/hooks/useAPISocket/useChatSocket.ts'
  );
  const messageSource = readSource(
    'src/containers/Chat/Message/MessageBody/index.tsx'
  );
  const combinedSource = [
    actionSource,
    reducerSource,
    socketSource,
    messageSource
  ].join('\n');

  assert.equal(
    actionSource.match(/type: 'APPLY_CANONICAL_CHAT_REACTION'/g)?.length,
    1
  );
  assert.match(socketSource, /onApplyCanonicalChatReaction\(\{\s*update,/);
  assert.match(
    messageSource,
    /onApplyCanonicalChatReaction\(\{\s*update: response,/
  );
  assert.doesNotMatch(
    combinedSource,
    /ADD_REACTION_TO_MESSAGE|SET_MESSAGE_REACTIONS|RECEIVE_CHAT_REACTION|REMOVE_REACTION_FROM_MESSAGE/
  );
  assert.match(
    reducerSource,
    /incomingActivityRevision > appliedActivityRevision[\s\S]*?appliedReactionActivityRevisionsByChannel/
  );
  assert.match(
    reducerSource,
    /reactionActivityRevision[\s\S]*?setCanonicalReactionActivityOnChannel/
  );
  assert.match(
    reducerSource,
    /incomingActivityRevision < existingActivityRevision[\s\S]*?reconcileConfirmedReactionMarkers/
  );
  assert.match(
    socketSource,
    /chat_reaction_added[\s\S]*?syncLegacyChatReaction[\s\S]*?handleChatReactionUpdate\(reactionUpdate\)/
  );
  assert.match(socketSource, /if \(payload\?\.canonicalBridge\) return/);
  assert.match(
    socketSource,
    /requiresSidebarResync[\s\S]*?queueChannelUnreadStateResync/
  );
});

test('reaction activity uses the observed message pointer as its recency watermark', () => {
  const reducerSource = readSource('src/contexts/Chat/reducer.ts');
  const typeSource = readSource('src/types/chat.ts');
  const reactionActivityReducer =
    reducerSource.match(
      /function setCanonicalReactionActivityOnChannel[\s\S]*?(?=\nfunction reconcileConfirmedReactionMarkers)/
    )?.[0] || '';

  assert.match(
    typeSource,
    /interface CanonicalChatReactionActivity \{[\s\S]*?lastMessageId: number;/
  );
  assert.match(
    reactionActivityReducer,
    /currentLastMessageId > Number\(channelActivity\.lastMessageId\)/
  );
  assert.match(
    reactionActivityReducer,
    /lastUpdated: messageActivityWasSuperseded[\s\S]*?channel\.lastUpdated[\s\S]*?channelActivity\.lastUpdated/
  );
});

test('durable promotion timer commands retry only unknown transport outcomes', () => {
  const appContextSource = readSource('src/contexts/AppContext.tsx');
  const puzzleSource = readSource(
    'src/containers/Home/ChessPuzzleModal/Puzzle/index.tsx'
  );
  const timerMutation =
    puzzleSource.match(
      /async function adjustCanonicalTimeAttackTimer[\s\S]*?(?=\n  function |\n  async function |\n  return \()/
    )?.[0] || '';

  assert.match(appContextSource, /isTransportError: true/);
  assert.match(
    timerMutation,
    /if \(!error\?\.isTransportError\) \{[\s\S]*?pendingPromotionTimerCommandRef\.current = null;[\s\S]*?throw error;/
  );
  assert.match(
    timerMutation,
    /pendingPromotionTimerCommandRef\.current = command;[\s\S]*?while \([\s\S]*?adjustTimeAttackTimer\(\s*command\s*\)/
  );
  assert.match(
    timerMutation,
    /transportFailureCount \+= 1;[\s\S]*?waitForPromotionTimerRetry\(transportFailureCount\)/
  );
  assert.match(
    timerMutation,
    /const timerState =[\s\S]*?pendingPromotionTimerCommandRef\.current = null;[\s\S]*?applyCanonicalTimeAttackClock/
  );
});

test('canonical last-read reconciliation is monotonic across writes, reads, and bootstrap', () => {
  const typeSource = readSource('src/types/chat.ts');
  const requestSource = readSource('src/contexts/requestHelpers/chat.ts');
  const reducerSource = readSource('src/contexts/Chat/reducer.ts');
  const mainSource = readSource('src/containers/Chat/Main.tsx');
  const socketSource = readSource(
    'src/containers/App/Header/hooks/useAPISocket/useChatSocket.ts'
  );

  assert.match(
    typeSource,
    /interface CanonicalChatUnreadScopeState \{\s*lastRead: number;/
  );
  assert.match(
    requestSource,
    /recoverCanonicalChatChannelUnreadState[\s\S]*?loadCanonicalChatChannelUnreadState/
  );
  assert.match(
    reducerSource,
    /incomingChannelLastRead >= currentChannelLastRead/
  );
  assert.match(
    reducerSource,
    /incomingSubchannelLastRead >= currentSubchannelLastRead/
  );
  assert.match(
    reducerSource,
    /function bufferCanonicalUnreadStateDuringBootstrap[\s\S]*?existingScope\?\.lastRead[\s\S]*?incomingScope\?\.lastRead/
  );
  assert.match(reducerSource, /getLatestCanonicalUnreadScopeState/);
  assert.match(
    `${mainSource}\n${socketSource}`,
    /onApplyCanonicalChannelUnreadState\(unreadState\)/
  );
  assert.doesNotMatch(reducerSource, /CLEAR_SUBCHANNEL_UNREADS/);
});

test('standalone last-read writes and AI receipts invalidate older unread snapshots', () => {
  const reconcilerSource = readSource(
    'src/helpers/hooks/useChatLastReadReconciler.ts'
  );
  const aiSocketSource = readSource(
    'src/containers/App/Header/hooks/useAPISocket/useAISocket.ts'
  );

  assert.match(
    reconcilerSource,
    /markChatUnreadActivity\(\);[\s\S]*?const expectedActivityRevision = getChatUnreadActivityRevision\(\);[\s\S]*?await request\(\)/m
  );
  assert.match(
    aiSocketSource,
    /cancelledMessageIds[\s\S]*?markChatUnreadActivity\(\);[\s\S]*?if \(messageIsForCurrentChannel\)/m
  );
});

test('bootstrap reconciliation is owned by an explicit user attempt', () => {
  const actionSource = readSource('src/contexts/Chat/actions.ts');
  const reducerSource = readSource('src/contexts/Chat/reducer.ts');
  const initSocketSource = readSource(
    'src/containers/App/Header/hooks/useAPISocket/useInitSocket.ts'
  );

  assert.match(
    reducerSource,
    /activeBootstrap\.id === action\.bootstrapId[\s\S]*?Number\(activeBootstrap\.userId\) === Number\(action\.userId\)/
  );
  assert.match(
    actionSource,
    /type: 'START_CHAT_BOOTSTRAP',[\s\S]*?bootstrapId,[\s\S]*?userId,[\s\S]*?startedAt/
  );
  assert.match(
    initSocketSource,
    /const bootstrapUserId = userIdRef\.current[\s\S]*?onStartChatBootstrap\(\{[\s\S]*?userId: bootstrapUserId/
  );
  assert.match(
    initSocketSource,
    /previousUserId === userId[\s\S]*?activeBootstrapIdRef\.current = null[\s\S]*?onFinishChatBootstrap\(staleBootstrapId\)/
  );
  assert.doesNotMatch(
    reducerSource,
    /wasRealtimeActivityConfirmedSince|confirmedRealtimeReceivedAt/
  );
  assert.match(reducerSource, /confirmedRealtimeSequence/);
});

test('bootstrap buffers independent canonical projections and reversals', () => {
  const reducerSource = readSource('src/contexts/Chat/reducer.ts');

  assert.match(
    reducerSource,
    /function bufferCanonicalReactionUpdateDuringBootstrap[\s\S]*?reactionStateRevision/
  );
  assert.doesNotMatch(
    reducerSource.match(
      /function bufferCanonicalReactionUpdateDuringBootstrap[\s\S]*?function applyCanonicalUnreadScope/
    )?.[0] || '',
    /channelActivity\?\.changed/
  );
  assert.match(
    reducerSource,
    /confirmedMessageDeletionsDuringBootstrap[\s\S]*?type: 'DELETE_MESSAGE'/
  );
  assert.match(
    reducerSource,
    /latestChannelEventSequence > unreadEventSequence/
  );
});

test('favorite watermarks advance only from full canonical snapshots', () => {
  const reducerSource = readSource('src/contexts/Chat/reducer.ts');

  for (const actionType of ['CREATE_NEW_CHANNEL', 'LEAVE_CHANNEL']) {
    const actionBlock =
      reducerSource.match(
        new RegExp(`case '${actionType}'[\\s\\S]*?(?=\\n    case '|$)`)
      )?.[0] || '';
    assert.match(actionBlock, /APPLY_CANONICAL_FAVORITE_STATE/);
    assert.doesNotMatch(actionBlock, /favoriteStateRevision\s*:/);
  }
  assert.match(
    reducerSource,
    /Equal membership revisions describe the same canonical set/
  );
});

test('account-bound chat responses cannot mutate another loaded user', () => {
  const reducerSource = readSource('src/contexts/Chat/reducer.ts');
  const actionSource = readSource('src/contexts/Chat/actions.ts');
  const mainSource = readSource('src/containers/Chat/Main.tsx');

  for (const actionType of [
    'CREATE_NEW_CHANNEL',
    'CREATE_NEW_DM_CHANNEL',
    'ENTER_CHANNEL',
    'LEAVE_CHANNEL',
    'RECEIVE_FIRST_MSG'
  ]) {
    const actionBlock =
      reducerSource.match(
        new RegExp(`case '${actionType}'[\\s\\S]*?(?=\\n    case '|$)`)
      )?.[0] || '';
    assert.match(
      actionBlock,
      /canonicalApplyOwnerMatchesBoundUser\(state, action\.userId\)/
    );
  }

  for (const actionType of [
    'APPLY_CANONICAL_FAVORITE_STATE',
    'APPLY_CANONICAL_QUICK_ACCESS'
  ]) {
    const actionBlock =
      reducerSource.match(
        new RegExp(`case '${actionType}'[\\s\\S]*?(?=\\n    case '|$)`)
      )?.[0] || '';
    assert.match(
      actionBlock,
      /canonicalApplyOwnerMatchesBoundUser\(state, action\.userId\)/
    );
  }

  assert.doesNotMatch(
    reducerSource,
    /action\.userId \?\? state\.loadedForUserId/
  );
  assert.match(
    actionSource,
    /onEnterChannelWithId\(\{[\s\S]*?userId: number[\s\S]*?type: 'ENTER_CHANNEL'[\s\S]*?userId/m
  );
  assert.match(
    mainSource,
    /requestKey = `\$\{requestUserId\}:[\s\S]*?Number\(userIdRef\.current \|\| 0\) !== requestUserId/m
  );
});

test('favorite membership snapshots reconcile independent activity domains', () => {
  const reducerSource = readSource('src/contexts/Chat/reducer.ts');
  const channelSource = readSource(
    '../twinkle-api/controllers/chat/model/channel.ts'
  );

  assert.match(reducerSource, /function reconcileCanonicalFavoriteOrder/);
  assert.match(
    reducerSource,
    /Message creation and reaction activity are independent monotonic domains[\s\S]*?canonicalDominates[\s\S]*?currentDominates/m
  );
  assert.match(reducerSource, /lastMessageId: getConfirmedLastMessageId/g);
  assert.match(
    channelSource,
    /lastMessageId: Number\(channel\.lastMessageId\)/
  );
});

test('confirmed visibility has a channel-owned revision and message watermark', () => {
  const reducerSource = readSource('src/contexts/Chat/reducer.ts');
  const messageContainerSource = readSource(
    'src/containers/Chat/Body/MessagesContainer/index.tsx'
  );
  const socketSource = readSource(
    'src/containers/App/Header/hooks/useAPISocket/useChatSocket.ts'
  );

  assert.doesNotMatch(reducerSource, /case 'HIDE_CHAT'/);
  assert.match(
    messageContainerSource,
    /channelVisibility, quickAccess[\s\S]*?onApplyCanonicalChatSidebarState\(\{ channelVisibility, quickAccess \}\)/m
  );
  assert.match(
    socketSource,
    /channelVisibility[\s\S]*?onApplyCanonicalChatSidebarState/
  );
  assert.match(
    reducerSource,
    /function mergeCanonicalChannelVisibility[\s\S]*?revision < currentRevision[\s\S]*?function applyCanonicalChannelVisibility[\s\S]*?currentLastMessageId <= visibilityAtLastMessageId/m
  );
  assert.match(
    reducerSource,
    /channelVisibilityById[\s\S]*?Reapply them after both summary and current-channel reconciliation/m
  );
  assert.doesNotMatch(
    reducerSource.match(
      /case 'APPLY_CANONICAL_CHAT_SIDEBAR_STATE'[\s\S]*?case 'APPLY_CANONICAL_FAVORITE_STATE'/
    )?.[0] || '',
    /currentQuickAccessRevision/
  );
});

test('quick-access identity is resolved from live profile state', () => {
  const identitySource = readSource(
    'src/containers/Chat/LeftMenu/QuickAccess/usePartnerIdentity.ts'
  );
  const portraitSource = readSource(
    'src/containers/Chat/LeftMenu/QuickAccess/Portrait.tsx'
  );
  const avatarSource = readSource(
    'src/containers/Chat/LeftMenu/QuickAccess/Avatar.tsx'
  );

  assert.match(identitySource, /userObj\[partner\.id\]\?\.username/);
  assert.match(identitySource, /userObj\[partner\.id\]\?\.profilePicUrl/);
  assert.match(portraitSource, /useQuickAccessPartnerIdentity\(partner\)/);
  assert.doesNotMatch(avatarSource, /preferProvidedProfilePicUrl/);
});

test('current-channel recency reuses the all-scope reconciliation result', () => {
  const reducerSource = readSource('src/contexts/Chat/reducer.ts');
  assert.match(
    reducerSource,
    /const mergedCurrentSettings = loadChannelSettings\(\s*reconciledCurrentChannel\.settings\s*\)/
  );
  assert.match(
    reducerSource,
    /const mergedCurrentLastUpdated = Number\(\s*reconciledCurrentChannel\.lastUpdated \|\| 0\s*\)/
  );
});

test('bootstrap invalidates noncanonical topic message caches and navigation', () => {
  const reducerSource = readSource('src/contexts/Chat/reducer.ts');

  assert.match(
    reducerSource,
    /function resetTopicMessageCachesForCanonicalChannelLoad[\s\S]*?loaded: false,[\s\S]*?messageIds: \[\]/
  );
  assert.match(
    reducerSource,
    /function reconcileCanonicalTopicNavigation[\s\S]*?selectedTopicIsVisible[\s\S]*?selectedTab: 'all'/
  );
  assert.doesNotMatch(reducerSource, /messageIds:\s*existingTopic\.messageIds/);
});
