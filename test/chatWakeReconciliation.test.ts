import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  getChatProjectionActivityRevision,
  markChatProjectionSocketEvent
} from '../src/helpers/chatUnreadActivity';

function readSource(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

const actionsSource = readSource('src/contexts/Chat/actions.ts');
const reducerSource = readSource('src/contexts/Chat/reducer.ts');
const socketSource = readSource(
  'src/containers/App/Header/hooks/useAPISocket/useInitSocket.ts'
);
const messagesSource = readSource(
  'src/containers/Chat/Body/MessagesContainer/index.tsx'
);
const displayedMessagesSource = readSource(
  'src/containers/Chat/Body/MessagesContainer/DisplayedMessages.tsx'
);
const messagesContentSource = readSource(
  'src/containers/Chat/Body/MessagesContainer/Content.tsx'
);
const messageInputSource = readSource(
  'src/containers/Chat/Body/MessagesContainer/MessageInput/index.tsx'
);
const messageInputLeftButtonsSource = readSource(
  'src/containers/Chat/Body/MessagesContainer/MessageInput/LeftButtons.tsx'
);
const requestHelperSource = readSource('src/contexts/requestHelpers/chat.ts');
const uploadModalSource = readSource(
  'src/components/Modals/UploadFileModal/index.tsx'
);

function sourceBetween(source: string, start: string, end: string) {
  const startIndex = source.indexOf(start);
  assert.notEqual(startIndex, -1, `Expected source marker: ${start}`);
  const endIndex = source.indexOf(end, startIndex + start.length);
  assert.notEqual(endIndex, -1, `Expected source marker: ${end}`);
  return source.slice(startIndex, endIndex);
}

test('catch-up keeps the last confirmed chat projection renderable', () => {
  const reconnectCase = sourceBetween(
    reducerSource,
    "case 'SET_RECONNECTING':",
    "case 'SET_RECONNECTED':"
  );
  const reconnectedCase = sourceBetween(
    reducerSource,
    "case 'SET_RECONNECTED':",
    "case 'SET_REPLY_TARGET':"
  );

  assert.match(reconnectCase, /reconnecting: true/);
  assert.doesNotMatch(reconnectCase, /loaded: false|channelsObj/);
  assert.match(reconnectedCase, /reconnecting: false/);
  assert.match(
    actionsSource,
    /onFinishReconnecting\(\)[\s\S]*?SET_RECONNECTED/
  );
  assert.match(
    socketSource,
    /const preserveSelectedProjection = Boolean\([\s\S]*?canonicalReadFromWriter[\s\S]*?channelsObjRef\.current\[selectedChannelIdRef\.current\]\?\.loaded[\s\S]*?onInitChat\(\{[\s\S]*?preserveSelectedProjection/
  );
  const initChatCase = sourceBetween(
    reducerSource,
    "case 'INIT_CHAT':",
    "case 'RECOVER_SELECTED_CHANNEL':"
  );
  assert.match(
    initChatCase,
    /action\.preserveSelectedProjection[\s\S]*?state\.channelsObj\[state\.selectedChannelId\]\?\.loaded/
  );
  assert.match(
    initChatCase,
    /alreadyUsingChat \|\| preserveSelectedProjection[\s\S]*?isReloadRequired: true[\s\S]*?loaded: true/
  );
});

test('wake silently validates an authenticated room barrier and broken sessions keep the writer fallback', () => {
  const wakeBarrier = sourceBetween(
    socketSource,
    'function requestChatWakeBarrier',
    'function handleVersionData'
  );
  const connectHandler = sourceBetween(
    socketSource,
    'function handleConnect()',
    'async function handleLoadChat'
  );
  const loadHandler = sourceBetween(
    socketSource,
    'async function handleLoadChat',
    'function scheduleLoadChatRetry'
  );
  const disconnectHandler = sourceBetween(
    socketSource,
    'function handleDisconnect(reason: string)',
    '// eslint-disable-next-line react-hooks/exhaustive-deps'
  );
  const transportGapMarker = sourceBetween(
    socketSource,
    'function markSocketTransportGap',
    'function requestChatWakeBarrier'
  );

  assert.doesNotMatch(wakeBarrier, /onSetReconnecting\(\)/);
  assert.match(wakeBarrier, /socket\.id === expectedSocketId/);
  assert.match(
    wakeBarrier,
    /onBound\(result\)[\s\S]*?result\?\.chatRoomsChanged[\s\S]*?handleLoadChatRef\.current\?\.\(\{[\s\S]*?fromWriter: true/
  );
  assert.doesNotMatch(wakeBarrier, /onFinishReconnecting\(\)/);
  assert.match(
    disconnectHandler,
    /recordChatBootstrapEvent\('chat-socket-disconnected',[\s\S]*?reason,[\s\S]*?visibility: document\.visibilityState[\s\S]*?hiddenForMs:[\s\S]*?online: !browserReportsOffline\(\)/
  );

  assert.match(
    connectHandler,
    /const shouldResyncAfterDisconnect = didSocketDisconnectRef\.current/
  );
  assert.match(
    connectHandler,
    /const needsPostBindWriterResync =[\s\S]*?didSocketDisconnectRef\.current[\s\S]*?!isLoadingChatRef\.current[\s\S]*?fromWriter: loadFromWriter/
  );
  assert.match(
    loadHandler,
    /const canonicalReadFromWriter =[\s\S]*?fromWriter \|\| didSocketDisconnectRef\.current[\s\S]*?loadChat\(\{[\s\S]*?fromWriter: canonicalReadFromWriter,[\s\S]*?bounded: canonicalReadFromWriter/
  );
  const postBootstrapChannelRecovery = sourceBetween(
    loadHandler,
    'if (needsPostBootstrapChannelReconciliation)',
    'if (routedChatTypeToRestore)'
  );
  assert.match(
    postBootstrapChannelRecovery,
    /const expectedActivityRevision =[\s\S]*?getChatProjectionActivityRevision\(channelId\)[\s\S]*?loadChatChannel\(\{[\s\S]*?hydrateMessages: preserveSelectedProjection,[\s\S]*?fromWriter: true,[\s\S]*?bounded: true/
  );
  assert.match(
    postBootstrapChannelRecovery,
    /getChatProjectionActivityRevision\(channelId\) !==[\s\S]*?expectedActivityRevision[\s\S]*?Canonical chat activity changed during channel recovery/
  );
  assert.match(
    postBootstrapChannelRecovery,
    /const canonicalChannelId = Number\(channelData\.channel\.id\)[\s\S]*?canonicalChannelId !== channelId[\s\S]*?canonicalChannelId !== GENERAL_CHAT_ID[\s\S]*?onUpdateSelectedChannelId\(GENERAL_CHAT_ID\)[\s\S]*?onUpdateChatType\(null\)/
  );
  assert.match(
    loadHandler,
    /const routedChatTypeToRestore =[\s\S]*?String\(currentPathIdRef\.current\) === String\(latestChatTypeRef\.current\)[\s\S]*?onInitChat\([\s\S]*?if \(routedChatTypeToRestore\) {[\s\S]*?onUpdateChatType\(routedChatTypeToRestore\)/
  );
  assert.ok(
    loadHandler.lastIndexOf('didSocketDisconnectRef.current = false') >
      loadHandler.indexOf('if (needsPostBootstrapChannelReconciliation)'),
    'the transport gap must remain open through selected-channel recovery'
  );
  assert.match(
    loadHandler,
    /Failed to sync post-load chat state:[\s\S]*?scheduleLoadChatRetry\(\{[\s\S]*?fromWriter: true,[\s\S]*?replaceSelectedProjection/
  );
  assert.match(
    loadHandler,
    /shouldFollowWithCanonicalResync =[\s\S]*?didCompleteChatSync[\s\S]*?!loadChatRetryTimerRef\.current[\s\S]*?lastFailedBootstrapIdRef\.current === null/
  );
  const fullLoadHelper = sourceBetween(
    requestHelperSource,
    'async loadChat({',
    'async loadChatChannel({'
  );
  assert.match(fullLoadHelper, /enforceTimeout: bounded/);
  assert.match(fullLoadHelper, /maxRetries: bounded \? 0/);
  assert.match(fullLoadHelper, /totalTimeoutMs: bounded \? 60000/);
  assert.match(
    loadHandler,
    /scheduleLoadChatRetry\(\{[\s\S]*?canonicalReadFromWriter \|\| didSocketDisconnectRef\.current/
  );
  assert.doesNotMatch(
    connectHandler,
    /didSocketDisconnectRef\.current = false/
  );
  assert.match(disconnectHandler, /markSocketTransportGap\(true\)/);
  assert.match(transportGapMarker, /onSetReconnecting\(\)/);
  assert.match(
    socketSource,
    /chat-bootstrap-follow-up-after-transport-gap[\s\S]*?fromWriter: true/
  );
});

test('catch-up gates sending without replacing the conversation or draft', () => {
  const pageLoading = sourceBetween(
    messagesSource,
    'const pageLoading = useMemo',
    'useEffect(() => {'
  );
  const sendHandler = sourceBetween(
    messageInputSource,
    'const handleSendMsg = useCallback',
    'const hasWordleButton = useMemo'
  );

  assert.doesNotMatch(pageLoading, /creatingNewDMChannel \|\|\s*reconnecting/);
  assert.match(
    messagesSource,
    /loading: pageLoading \|\| chatRecoveryBlocksInteraction/
  );
  assert.match(
    messagesSource,
    /isReconnecting: chatRecoveryBlocksInteraction/
  );
  assert.match(
    messagesSource,
    /if \(!isReloadRequired\) return;[\s\S]*?loadChatChannel\(\{[\s\S]*?subchannelPath: subchannelPath \|\| undefined,[\s\S]*?fromWriter: true,[\s\S]*?bounded: true/
  );
  assert.match(
    messagesSource,
    /loadChatChannel\(\{[\s\S]*?channelId: selectedChannelId,[\s\S]*?hydrateMessages: true,[\s\S]*?fromWriter: true/
  );
  assert.match(
    messagesSource,
    /loadChatSubject\(\{[\s\S]*?channelId: canonicalChannelId,[\s\S]*?fromWriter: true,[\s\S]*?bounded: true/
  );
  assert.match(
    messagesSource,
    /selectedTab === 'topic'[\s\S]*?loadTopicMessages\(\{[\s\S]*?topicId: selectedTopicId,[\s\S]*?fromWriter: true,[\s\S]*?bounded: true/
  );
  assert.match(
    messagesSource,
    /const expectedActivityRevision =[\s\S]*?getChatProjectionActivityRevision\(selectedChannelId\);[\s\S]*?await loadChatChannel\([\s\S]*?await loadChatSubject\([\s\S]*?getChatProjectionActivityRevision\(selectedChannelId\) !==[\s\S]*?expectedActivityRevision[\s\S]*?throw new ChatProjectionActivityRaceError/
  );
  assert.match(
    messagesSource,
    /shouldEscalateSelectedChannelRecovery\(failedAttempts\)[\s\S]*?requestCanonicalChatRebuild\([\s\S]*?if \(rebuildAccepted\) return;[\s\S]*?Failed to recover selected chat channel:[\s\S]*?Math\.min\(1000 \* 2 \*\* \(failedAttempts - 1\), 10000\)/
  );
  assert.match(
    messagesSource,
    /status === 403 \|\| status === 404[\s\S]*?onUpdateSelectedChannelId\(GENERAL_CHAT_ID\)[\s\S]*?navigate\(`\/chat\/\$\{GENERAL_CHAT_PATH_ID\}`/
  );
  assert.match(
    messagesSource,
    /canonicalChannelId !== selectedChannelId[\s\S]*?canonicalChannelId !== GENERAL_CHAT_ID[\s\S]*?onRecoverSelectedChannel\(\{[\s\S]*?channelData,[\s\S]*?navigate\(`\/chat\/\$\{GENERAL_CHAT_PATH_ID\}`/
  );
  assert.match(
    messagesSource,
    /selectedChannelIdRef\.current !== selectedChannelId/
  );
  assert.match(messagesSource, /userIdRef\.current !== userId/);
  assert.match(sendHandler, /if \(loading\) return;/);
  assert.match(messageInputSource, /interactionLocked=\{loading\}/);
  assert.match(uploadModalSource, /if \(interactionLocked\) return;/);
  assert.match(
    uploadModalSource,
    /disabled=\{[\s\S]*?interactionLocked \|\|[\s\S]*?isCustomUploadMode/
  );
  assert.match(
    displayedMessagesSource,
    /aria-disabled=\{isReconnecting\}[\s\S]*?pointerEvents: isReconnecting[\s\S]*?onClickCapture/
  );
  assert.doesNotMatch(displayedMessagesSource, /Catching up&hellip;/);
  assert.match(messagesContentSource, /Catching up&hellip;/);
  assert.match(
    messagesContentSource,
    /Catching up&hellip;[\s\S]*?<MessageInput/
  );
  const catchUpStatusMarkup =
    messagesContentSource.match(
      /\{catchUpStatusShown && \([\s\S]*?Catching up&hellip;[\s\S]*?\)\}/
    )?.[0] || '';
  assert.match(catchUpStatusMarkup, /width: fit-content/);
  assert.match(catchUpStatusMarkup, /height: 3rem/);
  assert.match(catchUpStatusMarkup, /margin: 0 auto 1rem/);
  assert.doesNotMatch(catchUpStatusMarkup, /(?:^|\n)\s*width: 100%;/);
  assert.match(
    messagesSource,
    /CHAT_CATCH_UP_STATUS_GRACE_PERIOD_MS = 750/
  );
  assert.match(
    messagesSource,
    /const chatRecoveryBlocksInteraction =[\s\S]*?\(reconnecting \|\| isReloadRequired\) && !selectedTerminalChatRecovery;[\s\S]*?const catchUpStatusPending = chatRecoveryBlocksInteraction && !pageLoading[\s\S]*?setTimeout\(\(\) => \{[\s\S]*?setCatchUpStatusDelayElapsed\(true\)[\s\S]*?CHAT_CATCH_UP_STATUS_GRACE_PERIOD_MS[\s\S]*?clearTimeout\(catchUpStatusTimer\)/
  );
  assert.match(
    messagesSource,
    /const catchUpStatusShown =\s*catchUpStatusPending && catchUpStatusDelayElapsed/
  );
  assert.match(
    messagesSource,
    /catchUpStatusShown \|\| selectedTerminalChatRecovery \? ' - 4rem' : ''/
  );
  assert.match(
    messageInputLeftButtonsSource,
    /disabled=\{loading \|\| !nextDayTimeStamp\}[\s\S]*?loading=\{!nextDayTimeStamp\}/,
    'generic reconnecting must keep the Wordle label stable instead of impersonating a Wordle load'
  );

  const atomicRecoveryCase = sourceBetween(
    reducerSource,
    "case 'RECOVER_SELECTED_CHANNEL':",
    "case 'INVITE_USERS_TO_CHANNEL':"
  );
  assert.match(atomicRecoveryCase, /type: 'ENTER_CHANNEL'/);
  assert.match(atomicRecoveryCase, /type: 'LOAD_SUBJECT'/);
  assert.match(atomicRecoveryCase, /type: 'LOAD_TOPIC_MESSAGES'/);
  assert.ok(
    atomicRecoveryCase.indexOf("type: 'ENTER_CHANNEL'") <
      atomicRecoveryCase.indexOf("type: 'LOAD_SUBJECT'")
  );
  assert.ok(
    atomicRecoveryCase.indexOf("type: 'LOAD_SUBJECT'") <
      atomicRecoveryCase.indexOf("type: 'LOAD_TOPIC_MESSAGES'")
  );

  assert.match(
    requestHelperSource,
    /async loadTopicMessages\(\{[\s\S]*?fromWriter = false,[\s\S]*?bounded = false[\s\S]*?fromWriter \? '&fromWriter=1' : ''[\s\S]*?enforceTimeout: bounded/
  );
  assert.match(
    requestHelperSource,
    /async loadChatSubject\(\{[\s\S]*?fromWriter = false,[\s\S]*?bounded = false[\s\S]*?fromWriter \? '&fromWriter=1' : ''[\s\S]*?enforceTimeout: bounded/
  );
  assert.match(
    requestHelperSource,
    /async loadChatChannel\(\{[\s\S]*?hydrateMessages = false[\s\S]*?hydrateMessages \? '&hydrateMessages=1' : ''/
  );
  assert.match(
    reducerSource,
    /applyCanonicalChatMessagePage\(\{[\s\S]*?currentSubchannelMessagesHydrated === true[\s\S]*?applyCanonicalChatMessagePage\(\{[\s\S]*?messagesHydrated === true/
  );
});

test('selected-channel recovery invalidates on every overwritable socket projection', () => {
  const firstChannelId = 901;
  const secondChannelId = 902;
  const firstChannelBefore = getChatProjectionActivityRevision(firstChannelId);
  const secondChannelBefore =
    getChatProjectionActivityRevision(secondChannelId);
  assert.equal(
    markChatProjectionSocketEvent('new_message_received', {
      message: { channelId: firstChannelId }
    }),
    true
  );
  assert.equal(
    getChatProjectionActivityRevision(firstChannelId),
    firstChannelBefore + 1
  );
  assert.equal(
    getChatProjectionActivityRevision(secondChannelId),
    secondChannelBefore,
    'unrelated channel activity must not starve selected-channel recovery'
  );

  const before = getChatProjectionActivityRevision();
  for (const eventName of [
    'new_message_received',
    'chat_message_edited',
    'member_joined',
    'topic_settings_changed',
    'ai_message_delta_streamed',
    'chess_move_made'
  ]) {
    assert.equal(markChatProjectionSocketEvent(eventName), true);
  }
  assert.equal(getChatProjectionActivityRevision(), before + 6);
  assert.equal(markChatProjectionSocketEvent('online_status_changed'), false);
  assert.equal(getChatProjectionActivityRevision(), before + 6);
  assert.match(
    socketSource,
    /handleChatProjectionSocketEvent = \([\s\S]*?\.\.\.args: unknown\[\][\s\S]*?markChatProjectionSocketEvent\(eventName, \.\.\.args\)[\s\S]*?socket\.onAny\(handleChatProjectionSocketEvent\)/
  );
  assert.match(
    socketSource,
    /socket\.offAny\(handleChatProjectionSocketEvent\)/
  );
});
