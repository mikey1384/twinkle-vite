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

test('reaction requests expose pending UI without synthesizing canonical counts', () => {
  const uiConstantsSource = readSource('src/constants/ui.ts');
  const navigationFeedbackSource = readSource(
    'src/containers/App/navigationFeedback.tsx'
  );
  const messageSource = readSource(
    'src/containers/Chat/Message/MessageBody/index.tsx'
  );
  const reactionsSource = readSource(
    'src/containers/Chat/Message/MessageBody/Reactions/index.tsx'
  );
  const reactionSource = readSource(
    'src/containers/Chat/Message/MessageBody/Reactions/Reaction.tsx'
  );

  assert.match(
    messageSource,
    /setPendingReactionMutation\(reaction, mutation\)[\s\S]*?await (?:postChatReaction|removeChatReaction)/
  );
  assert.match(uiConstantsSource, /LOADING_INDICATOR_GRACE_PERIOD_MS = 200/);
  assert.match(
    navigationFeedbackSource,
    /setTimeout\(\(\) => \{[\s\S]*?LOADING_INDICATOR_GRACE_PERIOD_MS/
  );
  assert.match(
    messageSource,
    /pendingReactionIndicatorTimersRef\.current\[reaction\] = setTimeout\([\s\S]*?LOADING_INDICATOR_GRACE_PERIOD_MS/
  );
  assert.match(
    reactionsSource,
    /mutation === 'add'[\s\S]*?result\.push\(reaction\)/
  );
  assert.match(
    reactionsSource,
    /reactionCount=\{reactionObj\[reaction\]\?\.length \|\| 0\}/
  );
  assert.match(reactionSource, /aria-busy=\{isPending\}/);
  assert.match(reactionSource, /icon="spinner"/);
  assert.match(
    messageSource,
    /finally \{\s*setPendingReactionMutation\(reaction, null\);/
  );
  assert.match(
    messageSource,
    /if \(response\?\.success === true\) \{[\s\S]*?return;[\s\S]*?throw new Error\('Invalid canonical chat reaction response'\)/
  );
  assert.doesNotMatch(
    messageSource,
    /onAddReactionToMessage|onRemoveReactionFromMessage/
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
    /interface CanonicalChatUnreadScopeState \{\s*lastRead: number;\s*lastReadMessageId: number;/
  );
  assert.match(
    requestSource,
    /recoverCanonicalChatChannelUnreadState[\s\S]*?loadCanonicalChatChannelUnreadState/
  );
  assert.match(
    requestSource,
    /async updateChatLastRead\(\{[\s\S]*?lastReadMessageId[\s\S]*?\{ channelId, lastReadMessageId \}/
  );
  assert.match(mainSource, /reconcileChannelLastRead\(selectedChannelId\)/);
  assert.match(
    socketSource,
    /lastReadMessageId >[\s\S]*?previousMainWrite\?\.lastReadMessageId[\s\S]*?updateChatLastRead\(\{ channelId, lastReadMessageId \}\)/
  );
  assert.match(
    reducerSource,
    /function canonicalUnreadScopeIsAtLeastAsNew[\s\S]*?incomingLastReadMessageId > existingLastReadMessageId/
  );
  assert.match(
    reducerSource,
    /canonicalUnreadScopeIsAtLeastAsNew\(\{[\s\S]*?incomingSource: unreadState\.channel,[\s\S]*?existingSource: prevChannel/
  );
  assert.match(
    reducerSource,
    /function bufferCanonicalUnreadStateDuringBootstrap[\s\S]*?canonicalUnreadScopeIsAtLeastAsNew\(\{[\s\S]*?incomingSource: incomingScope,[\s\S]*?existingSource: existingScope/
  );
  assert.match(reducerSource, /getLatestCanonicalUnreadScopeState/);
  // The call also names the account the snapshot belongs to, so a snapshot
  // owned by a different account is rejected rather than applied.
  assert.match(
    `${mainSource}\n${socketSource}`,
    /onApplyCanonicalChannelUnreadState\(\{ unreadState, userId \}\)/
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
    /channelSummaryIsNeeded[\s\S]*?markChatUnreadActivity\(\);[\s\S]*?messageIsForActiveChannel/m
  );
  assert.match(
    aiSocketSource,
    /messageScopeIsActivelyVisible[\s\S]*?reconcileChannelLastRead\(channelId, message\.id\)[\s\S]*?reconcileChannelUnreadActivity\(\{[\s\S]*?channelId/m
  );
  assert.doesNotMatch(aiSocketSource, /numUnreads:\s*1/);
  assert.match(
    reconcilerSource,
    /function reconcileChannelUnreadActivity[\s\S]*?applyFreshUnreadState/m
  );
  assert.doesNotMatch(reconcilerSource, /applyFreshGlobalUnreadCount/);
});

test('chat visibility follows the rendered body independently from presence', () => {
  const socketManagerSource = readSource(
    'src/containers/App/Header/hooks/useAPISocket/index.ts'
  );
  const initSocketSource = readSource(
    'src/containers/App/Header/hooks/useAPISocket/useInitSocket.ts'
  );
  const aiSocketSource = readSource(
    'src/containers/App/Header/hooks/useAPISocket/useAISocket.ts'
  );

  assert.match(socketManagerSource, /usingChatRef\.current = usingChat;/);
  assert.match(
    socketManagerSource,
    /chatBusyRef\.current = !usingChat \|\| isAIChat;/
  );
  assert.doesNotMatch(socketManagerSource, /usingChat && !isAIChat/);
  assert.match(
    initSocketSource,
    /socket\.emit\('change_busy_status', chatBusyRef\.current\)/
  );
  // A normal active channel follows the rendered body (selectedChannelId).
  // Requiring selected === routed made activeChatChannelId null on any path/
  // selection disagreement, so live chess/omok moves took the different-
  // channel path and sticky left-menu unreads after watching. Collect routes
  // render a different body and must not inherit the stale selection.
  assert.match(
    socketManagerSource,
    /selectedChatChannelId > 0[\s\S]*\? selectedChatChannelId[\s\S]*: routedChannelId/
  );
  assert.match(
    socketManagerSource,
    /const showingChannelBody =[\s\S]*chatType !== VOCAB_CHAT_TYPE[\s\S]*chatType !== AI_CARD_CHAT_TYPE;[\s\S]*const activeChatChannelId = !showingChannelBody[\s\S]*\? null/
  );
  assert.doesNotMatch(
    socketManagerSource,
    /routedChannelId === Number\(selectedChannelId \|\| 0\)/
  );
  assert.match(
    aiSocketSource,
    /const messageIsForActiveChannel =[\s\S]*?channelId === activeChatChannelIdRef\.current;[\s\S]*?messageScopeIsActivelyVisible[\s\S]*?currentSubchannelId === 0[\s\S]*?if \(messageScopeIsActivelyVisible\) \{[\s\S]*?reconcileChannelLastRead\(channelId, message\.id\)/
  );
  assert.match(
    socketManagerSource,
    /useAISocket\(\{[\s\S]*?subchannelId,[\s\S]*?usingChatRef/
  );
  assert.doesNotMatch(aiSocketSource, /selectedChannelIdRef/);
});

test('navigation and live activity reconcile only the visible chat scope', () => {
  const mainSource = readSource('src/containers/Chat/Main.tsx');
  const socketSource = readSource(
    'src/containers/App/Header/hooks/useAPISocket/useChatSocket.ts'
  );
  const channelSource = readSource(
    'src/containers/Chat/LeftMenu/Channels/Channel.tsx'
  );
  const reducerSource = readSource('src/contexts/Chat/reducer.ts');

  assert.match(
    mainSource,
    /if \(subchannelPath\) \{[\s\S]*?reconcileSubchannelLastRead[\s\S]*?return;[\s\S]*?if \(selectedSubchannelId\) return;[\s\S]*?reconcileChannelLastRead\(selectedChannelId\)/
  );
  assert.match(mainSource, /routedChannelId !== selectedChannelId\) return/);
  assert.match(
    socketSource,
    /messageIsForCurrentChannel =[\s\S]*?Number\(message\.channelId\) === activeChatChannelIdRef\.current/
  );
  assert.match(
    socketSource,
    /const activityChannel =[\s\S]*?channelsObjRef\.current\?\.\[message\.channelId\] \|\| channel;[\s\S]*?!messageIsForCurrentChannel &&[\s\S]*?activityChannel &&[\s\S]*?!channelSummaryIsNeeded[\s\S]*?channel: activityChannel/
  );
  assert.match(
    socketSource,
    /reactionIsForCurrentChannel =[\s\S]*?channelId === currentActiveChatChannelId/
  );
  assert.match(
    socketSource,
    /const scopeIsActivelyVisible = Boolean\([\s\S]*?messageIsForCurrentChannel[\s\S]*?currentPageVisible[\s\S]*?usingChatRef\.current/
  );
  assert.match(
    reducerSource,
    /const scopeIsOpen = Boolean\(action\.pageVisible && action\.usingChat\);[\s\S]*?subchannelId === currentSubchannelId && scopeIsOpen[\s\S]*?scopeIsOpen && currentSubchannelId === 0/
  );
  assert.match(
    channelSource,
    /const badgeShown =\s*!selected && canonicalUnreadBadgeIsShown\(totalNumUnreads\)/
  );
  assert.match(
    socketSource,
    /normalizedSubchannelId === 0[\s\S]*?shouldUpdateSubchannel[\s\S]*?normalizedSubchannelId > 0/
  );
  assert.doesNotMatch(
    socketSource,
    /else \{\s*void maybeUpdateLastRead\(\{ channelId: message\.channelId \}\)/
  );

  for (const actionType of [
    'ENTER_CHANNEL',
    'ENTER_EMPTY_CHAT',
    'LOAD_AI_CARD_CHAT',
    'LOAD_VOCABULARY',
    'NOTIFY_MEMBER_LEFT',
    'UPDATE_LAST_SUBCHANNEL_PATH',
    'UPDATE_SELECTED_CHANNEL_ID'
  ]) {
    const actionBlock =
      reducerSource.match(
        new RegExp(`case '${actionType}'[\\s\\S]*?(?=\\n    case '|$)`)
      )?.[0] || '';
    assert.doesNotMatch(actionBlock, /numUnreads:\s*0/);
  }
  const submitMessageCase =
    reducerSource.match(
      /case 'SUBMIT_MESSAGE':[\s\S]*?(?=\n    case 'TRIM_MESSAGES')/
    )?.[0] || '';
  assert.match(
    submitMessageCase,
    /numUnreads: Number\(prevChannelObj\.numUnreads \|\| 0\)/
  );
  assert.doesNotMatch(submitMessageCase, /numUnreads:\s*0/);
});

test('sidebar and member-leave paths consume canonical scoped unread state', () => {
  const channelSource = readSource(
    'src/containers/Chat/LeftMenu/Channels/Channel.tsx'
  );
  const subchannelSource = readSource(
    'src/containers/Chat/LeftMenu/Subchannels/Subchannel.tsx'
  );
  const mainSource = readSource('src/containers/Chat/Main.tsx');
  const socketSource = readSource(
    'src/containers/App/Header/hooks/useAPISocket/useChatSocket.ts'
  );

  assert.doesNotMatch(channelSource, /lastUnreadSenderId|lastSenderId/);
  assert.match(
    subchannelSource,
    /badgeShown =\s*!subchannelSelected && canonicalUnreadBadgeIsShown\(numUnreads\)/
  );
  assert.doesNotMatch(
    subchannelSource,
    /lastUnreadSenderId|lastMessage\?\.userId/
  );
  assert.match(
    mainSource,
    /pageVisible &&[\s\S]*?channelId === selectedChannelId &&[\s\S]*?!selectedSubchannelId[\s\S]*?reconcileChannelLastRead/
  );
  assert.match(socketSource, /socket\.on\('member_left'/);
  assert.match(
    socketSource,
    /handleMemberLeftUnreadState[\s\S]*?mainScopeIsVisible[\s\S]*?queueChannelUnreadStateResync\(\{[\s\S]*?subchannelId: 0/
  );
});

test('same-account socket messages update caches without becoming unread', () => {
  const actionSource = readSource('src/contexts/Chat/actions.ts');
  const reducerSource = readSource('src/contexts/Chat/reducer.ts');
  const socketSource = readSource(
    'src/containers/App/Header/hooks/useAPISocket/useChatSocket.ts'
  );
  const receiveMessageHandler =
    socketSource.match(
      /async function handleReceiveMessage[\s\S]*?(?=\n    function notifyMessageReceivedWhileAway)/
    )?.[0] || '';
  const receiveMessageCase =
    reducerSource.match(
      /case 'RECEIVE_MESSAGE':[\s\S]*?(?=\n    case 'RECEIVE_FIRST_MSG')/
    )?.[0] || '';

  assert.match(
    receiveMessageHandler,
    /const isMyMessage =[\s\S]*?Number\(message\.userId\) === Number\(userId\) && !message\.transferId[\s\S]*?onReceiveMessage\(\{[\s\S]*?isMyMessage/
  );
  assert.doesNotMatch(
    socketSource,
    /if \(senderIsUser && currentPageVisible\) return/
  );
  assert.match(
    actionSource,
    /onReceiveMessage\(\{[\s\S]*?isMyMessage = false[\s\S]*?type: 'RECEIVE_MESSAGE'[\s\S]*?isMyMessage/
  );
  assert.match(
    receiveMessageCase,
    /const scopeWouldBeUnread =[\s\S]*?!action\.isMyMessage[\s\S]*?scopeIsOpen/
  );
  assert.match(
    receiveMessageHandler,
    /if \(!isMyMessage && !scopeIsActivelyVisible\) \{[\s\S]*?queueChannelUnreadStateResync/
  );
  assert.doesNotMatch(
    receiveMessageHandler,
    /if \(isMyMessage\)[\s\S]{0,200}?queueChannelUnreadStateResync/
  );
  assert.match(
    receiveMessageCase,
    /prependUniqueChatMessageId\(\{[\s\S]*?messageIds: prevChannelObj\.messageIds,[\s\S]*?messageId/
  );
});

test('socket echoes and HTTP submit confirmations are idempotent by message id', () => {
  const reducerSource = readSource('src/contexts/Chat/reducer.ts');
  const receiveMessageCase =
    reducerSource.match(
      /case 'RECEIVE_MESSAGE':[\s\S]*?(?=\n    case 'RECEIVE_FIRST_MSG')/
    )?.[0] || '';
  const submitMessageCase =
    reducerSource.match(
      /case 'SUBMIT_MESSAGE':[\s\S]*?(?=\n    case 'TRIM_MESSAGES')/
    )?.[0] || '';

  assert.match(
    reducerSource,
    /function prependUniqueChatMessageId\([\s\S]*?String\(messageId\)[\s\S]*?String\(existingMessageId\) === messageIdKey/
  );
  assert.match(
    reducerSource,
    /function getSubmittedChatMessage\([\s\S]*?if \(existingMessage\) return existingMessage;/
  );
  assert.match(receiveMessageCase, /prependUniqueChatMessageId\(\{/);
  assert.match(
    submitMessageCase,
    /existingMessage: action\.subchannelId[\s\S]*?prevChannelObj\?\.messagesObj\?\.\[action\.messageId\]/
  );
  assert.match(
    submitMessageCase,
    /const messageIds = action\.subchannelId[\s\S]*?prependUniqueChatMessageId\(\{/
  );
});

test('equal-activity favorite snapshots still reconcile scoped reads', () => {
  const reducerSource = readSource('src/contexts/Chat/reducer.ts');
  const mergeBody = reducerSource.slice(
    reducerSource.indexOf('function mergeCanonicalFavoriteChannelSummary'),
    reducerSource.indexOf('function getFreshestFavoriteActivity')
  );

  assert.match(
    mergeBody,
    /canonicalFavoriteActivityIsAtLeastAsNew[\s\S]*?!canonicalFavoriteActivityDominates[\s\S]*?getLatestCanonicalUnreadScopeState[\s\S]*?\.\.\.mergedSubchannelState/
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
  // The serialized watermark is the repaired canonical row, coerced to a
  // number — deliberately not channel.lastMessageId, which can be the stale
  // pre-repair pointer read alongside the channel.
  assert.match(
    channelSource,
    /lastMessageId: Number\(lastMessageRow\.id\) \|\| null/
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
    /channelVisibility, quickAccess[\s\S]*?onApplyCanonicalChatSidebarState\(\{\s*channelVisibility,\s*quickAccess,\s*userId/m
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
  const topicProjectionSource = readSource(
    'src/contexts/Chat/topicProjectionState.ts'
  );

  assert.match(
    topicProjectionSource,
    /function resetTopicMessageCachesForCanonicalChannelLoad[\s\S]*?loaded: false,[\s\S]*?messageIds: \[\]/
  );
  assert.match(
    topicProjectionSource,
    /function reconcileCanonicalTopicNavigation[\s\S]*?selectedTopicIsVisible[\s\S]*?selectedTab: 'all'/
  );
  assert.match(reducerSource, /mergeCanonicalTopicProjection\(\{/);
  assert.doesNotMatch(
    topicProjectionSource,
    /messageIds:\s*existingTopic\.messageIds/
  );
});

test('global Chat unread state is reconciled canonically when Chat becomes visible', () => {
  const headerSource = readSource('src/containers/App/Header/index.tsx');
  const mainSource = readSource('src/containers/Chat/Main.tsx');
  const reconcilerSource = readSource(
    'src/helpers/hooks/useChatLastReadReconciler.ts'
  );
  const initSocketSource = readSource(
    'src/containers/App/Header/hooks/useAPISocket/useInitSocket.ts'
  );
  const chatSocketSource = readSource(
    'src/containers/App/Header/hooks/useAPISocket/useChatSocket.ts'
  );
  const reducerSource = readSource('src/contexts/Chat/reducer.ts');
  const mainNavSource = readSource(
    'src/containers/App/Header/MainNavs/index.tsx'
  );

  assert.doesNotMatch(headerSource, /onGetNumberOfUnreadMessages\(0\)/);
  assert.doesNotMatch(mainSource, /onClearNumUnreads|CLEAR_NUM_UNREADS/);
  assert.doesNotMatch(reducerSource, /case 'CLEAR_NUM_UNREADS'/);
  assert.doesNotMatch(reconcilerSource, /applyFreshGlobalUnreadCount/);
  assert.match(
    reconcilerSource,
    /applyFreshUnreadState[\s\S]*?onApplyCanonicalChannelUnreadState/
  );
  assert.match(
    mainSource,
    /if \(!pageVisible \|\| !chatReadyForCurrentUser \|\| !selectedChannelId\) return;[\s\S]*?reconcileChannelLastRead\(selectedChannelId\)[\s\S]*?pageVisible,/
  );
  assert.match(
    initSocketSource,
    /loadFreshCanonicalChatGlobalUnreadCount\(\{[\s\S]*?getNumberOfUnreadMessages\(\{ fromWriter: true \}\)/
  );
  assert.match(
    chatSocketSource,
    /const activityRaced =[\s\S]*?markUnreadActivity\(\);[\s\S]*?if \(activityRaced\)/
  );
  const socketLastReadReconciler = chatSocketSource.slice(
    chatSocketSource.indexOf('async function reconcileCanonicalLastRead'),
    chatSocketSource.indexOf("socket.on('ai_thinking_status_updated'")
  );
  assert.doesNotMatch(socketLastReadReconciler, /queueGlobalUnreadCountResync/);
  assert.match(
    chatSocketSource,
    /const reactionScopeIsActivelyVisible =[\s\S]*?currentPageVisible &&[\s\S]*?reactionIsForCurrentChannel[\s\S]*?reactionIsForCurrentSubchannel/
  );
  assert.match(
    chatSocketSource,
    /if \(!isMyMessage && scopeIsActivelyVisible\) \{[\s\S]*?maybeUpdateLastRead/
  );
  assert.doesNotMatch(chatSocketSource, /wasUsingChat|route-exit restoration/);
  assert.match(
    reducerSource,
    /applyCanonicalGlobalUnreadProjection[\s\S]*?hasVisibleCanonicalChatUnread/
  );
  assert.match(
    mainNavSource,
    /numChatUnreads > 0 &&[\s\S]*?hasVisibleChatUnreadBadge/
  );
  assert.doesNotMatch(
    reducerSource,
    /Number\(state\.numUnreads\) \+ 1|state\.numUnreads \+ 1/
  );
  const receiveFirstMessageCase =
    reducerSource.match(
      /case 'RECEIVE_FIRST_MSG':[\s\S]*?(?=\n    case 'RECEIVE_MSG_ON_DIFF_CHANNEL')/
    )?.[0] || '';
  assert.match(receiveFirstMessageCase, /numUnreads: state\.numUnreads/);
  assert.doesNotMatch(
    receiveFirstMessageCase,
    /numUnreads\s*:\s*(?:1|[^,\n]*\+|Math\.max\()/,
    'an invitation envelope must preserve, not fabricate, the confirmed unread count'
  );
  assert.doesNotMatch(
    reducerSource,
    /alreadyUsingChat && !preservedRealtimeActivity \? 0 : state\.numUnreads/
  );
  assert.match(
    reducerSource,
    /const scopeIsOpen = Boolean\(action\.pageVisible && action\.usingChat\)/
  );
  for (const [caseName, nextCaseName] of [
    ['RECEIVE_MESSAGE', 'RECEIVE_FIRST_MSG'],
    ['RECEIVE_FIRST_MSG', 'RECEIVE_MSG_ON_DIFF_CHANNEL'],
    ['RECEIVE_MSG_ON_DIFF_CHANNEL', 'APPLY_CANONICAL_REACTION_ADD_ACTIVITY']
  ]) {
    const reducerCase =
      reducerSource.match(
        new RegExp(
          `case '${caseName}':[\\s\\S]*?(?=\\n    case '${nextCaseName}')`
        )
      )?.[0] || '';
    assert.doesNotMatch(
      reducerCase,
      /numUnreads\s*:\s*[^,\n]*(?:\+|Math\.max\()/,
      `${caseName} must not synthesize a server-owned unread count`
    );
  }
  assert.doesNotMatch(
    reducerSource,
    /getRebasedConfirmedUnreadActivityState[\s\S]{0,500}?Math\.max\(/
  );
  assert.match(
    chatSocketSource,
    /!isMyMessage && !scopeIsActivelyVisible[\s\S]*?queueChannelUnreadStateResync/
  );
});

test('every unread-producing socket path converges on a visible canonical scope', () => {
  const socketSource = readSource(
    'src/containers/App/Header/hooks/useAPISocket/useChatSocket.ts'
  );
  const requestSource = readSource('src/contexts/requestHelpers/chat.ts');
  const reducerSource = readSource('src/contexts/Chat/reducer.ts');
  const typeSource = readSource('src/types/chat.ts');
  const unreadProjectionSource = readSource(
    'src/helpers/chatUnreadProjection.ts'
  );

  assert.match(
    typeSource,
    /interface CanonicalChatChannelUnreadState \{[\s\S]*?numUnreads: number;[\s\S]*?channelSummary\?: ChatChannelSummary;/
  );
  assert.match(
    requestSource,
    /includeChannelSummary = false[\s\S]*?includeChannelSummary \? '&includeChannelSummary=1'/
  );
  const publicUnreadStateHelper =
    requestSource.match(
      /async loadChatChannelUnreadState\(\{[\s\S]*?(?=\n    async hideChatAttachment)/
    )?.[0] || '';
  assert.match(
    publicUnreadStateHelper,
    /includeChannelSummary = false[\s\S]*?loadCanonicalChatChannelUnreadState\(\{[\s\S]*?includeChannelSummary/
  );
  assert.match(
    socketSource,
    /handleChatInvitation[\s\S]*?invitationScopeIsActivelyVisible[\s\S]*?maybeUpdateLastRead[\s\S]*?queueChannelUnreadStateResync/
  );
  assert.match(
    socketSource,
    /invitationSubchannelId === activeSubchannelId[\s\S]*?invitationChannelId === activeChatChannelIdRef\.current/
  );
  assert.match(
    socketSource,
    /function canonicalUnreadSummaryIsNeeded[\s\S]*?chatRealtimeChannelNeedsCanonicalSummary\(\{[\s\S]*?isListed: listedChannelIdsRef\.current\.has/
  );
  assert.match(
    unreadProjectionSource,
    /function chatRealtimeChannelNeedsCanonicalSummary[\s\S]*?!channel\?\.id[\s\S]*?!channel\.pathId[\s\S]*?channel\.isHidden[\s\S]*?!isListed/
  );
  assert.doesNotMatch(
    socketSource,
    /includeChannelSummary:\s*!channelsObjRef\.current/,
    'an existing but hidden or unlisted channel shell still needs a canonical summary'
  );
  for (const handlerName of [
    'handleMemberLeftUnreadState',
    'handleNewWordleAttempt',
    'handleReceiveMessage',
    'handleTopicChange',
    'handleHumanTopicStateChanged'
  ]) {
    const handlerStart = socketSource.indexOf(`function ${handlerName}`);
    assert.ok(handlerStart >= 0, `missing ${handlerName}`);
    const nextHandler = socketSource.indexOf('\n    function ', handlerStart + 10);
    const handlerSource = socketSource.slice(
      handlerStart,
      nextHandler >= 0 ? nextHandler : undefined
    );
    assert.match(
      handlerSource,
      /queueChannelUnreadStateResync\(\{/,
      `${handlerName} must reconcile its canonical unread scope`
    );
  }
  assert.match(
    socketSource,
    /catch \(error\) \{[\s\S]*?socket\.connected[\s\S]*?retryCount: scope\.retryCount \+ 1[\s\S]*?getUnreadResyncRetryDelayMs/
  );

  const unreadReducerCase = reducerSource.slice(
    reducerSource.indexOf("case 'APPLY_CANONICAL_CHANNEL_UNREAD_STATE':"),
    reducerSource.indexOf("case 'EDIT_CHANNEL_SETTINGS':")
  );
  assert.match(
    unreadReducerCase,
    /channelSummary[\s\S]*?homeChannelIds[\s\S]*?favoriteChannelIds[\s\S]*?classChannelIds/
  );
  assert.doesNotMatch(
    unreadReducerCase,
    /!state\.channelsObj\[channelId\] && hasCanonicalChannelSummary/,
    'an existing channel shell must not prevent canonical list membership repair'
  );
  assert.match(
    unreadReducerCase,
    /projectCanonicalUnreadChannelLists\(\{[\s\S]*?mergeCanonicalFavoriteChannelSummary\(\{/
  );
  assert.match(
    unreadReducerCase,
    /nextState = \{[\s\S]*?\.\.\.nextState,[\s\S]*?channelsObj: \{[\s\S]*?\.\.\.nextState\.channelsObj/
  );
  assert.match(
    unreadReducerCase,
    /applyCanonicalGlobalUnreadProjection\([\s\S]*?unreadState\.numUnreads/
  );
});

test('unlisted realtime channels wait for canonical identity before rendering', () => {
  const socketSource = readSource(
    'src/containers/App/Header/hooks/useAPISocket/useChatSocket.ts'
  );
  const aiSocketSource = readSource(
    'src/containers/App/Header/hooks/useAPISocket/useAISocket.ts'
  );
  const chessSocketSource = readSource(
    'src/containers/App/Header/hooks/useAPISocket/useChessSocket.ts'
  );
  const reconcilerSource = readSource(
    'src/helpers/hooks/useChatLastReadReconciler.ts'
  );
  const reducerSource = readSource('src/contexts/Chat/reducer.ts');
  const handlerSource = socketSource.slice(
    socketSource.indexOf('async function handleReceiveMessage'),
    socketSource.indexOf('function shouldSkipRealtimeMessage')
  );

  assert.match(
    handlerSource,
    /const channelSummaryIsNeeded = canonicalUnreadSummaryIsNeeded/
  );
  assert.match(
    handlerSource,
    /else if \(!messageIsForCurrentChannel && channelSummaryIsNeeded\)[\s\S]*?includeChannelSummary: true/
  );
  assert.match(
    handlerSource,
    /!messageIsForCurrentChannel &&[\s\S]*?activityChannel &&[\s\S]*?!channelSummaryIsNeeded[\s\S]*?onReceiveMessageOnDifferentChannel/
  );

  for (const handlerName of ['handleNewWordleAttempt', 'handleTopicChange']) {
    const handlerStart = socketSource.indexOf(`function ${handlerName}`);
    const nextHandler = socketSource.indexOf(
      '\n    function ',
      handlerStart + 10
    );
    const specialHandlerSource = socketSource.slice(handlerStart, nextHandler);
    assert.match(
      specialHandlerSource,
      /channelSummaryIsNeeded[\s\S]*?includeChannelSummary: (?:true|channelSummaryIsNeeded)/
    );
    assert.match(
      specialHandlerSource,
      /!channelSummaryIsNeeded[\s\S]*?onReceiveMessageOnDifferentChannel/
    );
    if (handlerName === 'handleTopicChange') {
      assert.match(
        specialHandlerSource,
        /messageIsForCurrentChannel \|\| !channelSummaryIsNeeded[\s\S]*?onChangeChatSubject/
      );
      assert.match(
        specialHandlerSource,
        /else if \(!messageIsForCurrentChannel && channelSummaryIsNeeded\)[\s\S]*?includeChannelSummary: true/
      );
      assert.match(specialHandlerSource, /isMyMessage: senderIsUser/);
    }
  }

  assert.match(
    aiSocketSource,
    /channelSummaryIsNeeded =[\s\S]*?includeChannelSummary: channelSummaryIsNeeded[\s\S]*?onReceiveMessageOnDifferentChannel\(\{[\s\S]*?deferChannelListProjection: channelSummaryIsNeeded/
  );
  assert.match(
    chessSocketSource,
    /canApplyPersistedChessActivityImmediately[\s\S]*?includeChannelSummary: true[\s\S]*?channel\?\.id[\s\S]*?selectedChannelIdRef\.current/
  );
  assert.match(
    reconcilerSource,
    /reconcileChannelUnreadActivity\(\{[\s\S]*?includeChannelSummary = false[\s\S]*?applyFreshUnreadState\(\{[\s\S]*?includeChannelSummary/
  );
  assert.match(
    reducerSource,
    /case 'APPLY_CANONICAL_REACTION_ADD_ACTIVITY':[\s\S]*?action\.deferChannelListProjection[\s\S]*?state\.homeChannelIds/
  );
  assert.match(
    reducerSource,
    /case 'RECEIVE_MSG_ON_DIFF_CHANNEL':[\s\S]*?action\.deferChannelListProjection[\s\S]*?state\.homeChannelIds/
  );
});
