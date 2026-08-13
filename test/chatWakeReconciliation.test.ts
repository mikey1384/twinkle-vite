import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

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
const messageInputSource = readSource(
  'src/containers/Chat/Body/MessagesContainer/MessageInput/index.tsx'
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
});

test('wake requires an authenticated room barrier and broken sessions keep the writer fallback', () => {
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

  assert.ok(
    wakeBarrier.indexOf('onSetReconnecting();') <
      wakeBarrier.indexOf('bindSocketToUser({'),
    'the interaction gate must close before the wake bind starts'
  );
  assert.match(wakeBarrier, /socket\.id === expectedSocketId/);
  assert.match(
    wakeBarrier,
    /onBound\(result\)[\s\S]*?result\?\.chatRoomsChanged[\s\S]*?handleLoadChatRef\.current\?\.\(\{[\s\S]*?fromWriter: true[\s\S]*?onFinishReconnecting\(\)/
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
    /loading: pageLoading \|\| reconnecting \|\| isReloadRequired/
  );
  assert.match(
    messagesSource,
    /isReconnecting: reconnecting \|\| isReloadRequired/
  );
  assert.match(
    messagesSource,
    /if \(!isReloadRequired\) return;[\s\S]*?loadChatChannel\(\{[\s\S]*?subchannelPath: subchannelPath \|\| undefined,[\s\S]*?fromWriter: true,[\s\S]*?bounded: true/
  );
  assert.match(
    messagesSource,
    /Failed to recover selected chat channel:[\s\S]*?Math\.min\(1000 \* 2 \*\* retryCount, 10000\)/
  );
  assert.match(
    messagesSource,
    /status === 403 \|\| status === 404[\s\S]*?onUpdateSelectedChannelId\(GENERAL_CHAT_ID\)[\s\S]*?navigate\(`\/chat\/\$\{GENERAL_CHAT_PATH_ID\}`/
  );
  assert.match(
    messagesSource,
    /canonicalChannelId !== selectedChannelId[\s\S]*?canonicalChannelId !== GENERAL_CHAT_ID[\s\S]*?onEnterChannelWithId\(\{ data, userId \}\)[\s\S]*?navigate\(`\/chat\/\$\{GENERAL_CHAT_PATH_ID\}`/
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
  assert.match(displayedMessagesSource, /Catching up&hellip;/);
  assert.match(displayedMessagesSource, /isReconnecting && !pageLoading/);
});
