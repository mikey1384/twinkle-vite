import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  appendRefusedCallMessage,
  CHAT_MESSAGE_MAX_CHARS,
  CHAT_MESSAGE_MAX_UTF8_BYTES,
  buildChatMessageRelayPayload,
  getChatMessageLengthError,
  getUtf8ByteLength,
  relayChatMessage
} from '../src/helpers/chatMessageSend';

function readSource(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

function createRelaySocket() {
  const emits: Array<{ event: string; payload: any; ack: (v: any) => void }> =
    [];
  const connectHandlers: Array<() => void> = [];
  return {
    emits,
    reconnect() {
      const handlers = connectHandlers.splice(0);
      for (const handler of handlers) handler();
    },
    socket: {
      emit(event: string, payload: any, ack: (v: any) => void) {
        emits.push({ event, payload, ack });
      }
    },
    onAuthReady(handler: () => void) {
      connectHandlers.push(handler);
    }
  };
}

test('UTF-8 byte length matches the encoder for Korean, emoji and ASCII', () => {
  for (const text of ['hello', '안녕하세요', '😀👍', 'a한😀é', '\ud800x']) {
    assert.equal(
      getUtf8ByteLength(text),
      Buffer.byteLength(text, 'utf8'),
      text
    );
  }
});

test('a 50,000-character Korean message is allowed; one more character is not', () => {
  const korean = '가'.repeat(CHAT_MESSAGE_MAX_CHARS);
  assert.equal(Buffer.byteLength(korean, 'utf8'), 150_000);
  assert.equal(getChatMessageLengthError(korean), null);
  assert.equal(getChatMessageLengthError('😀'.repeat(25_000)), null);
  const tooLong = getChatMessageLengthError(`${korean}가`);
  assert.match(tooLong || '', /too long to send: 50,001 \/ 50,000 characters/);
  assert.equal(CHAT_MESSAGE_MAX_UTF8_BYTES, CHAT_MESSAGE_MAX_CHARS * 4);
});

test('the live relay carries only ids, whatever the message size', () => {
  const payload = buildChatMessageRelayPayload({
    messageId: 42,
    channelId: 7
  });
  assert.deepEqual(payload, {
    message: { id: 42, channelId: 7 },
    channel: { id: 7 }
  });
  assert.ok(Buffer.byteLength(JSON.stringify(payload)) < 200);
});

test('an ingress rejection re-sends the relay after reconnect, then reports a second refusal', () => {
  const world = createRelaySocket();
  const undelivered: any[] = [];
  relayChatMessage({
    socket: world.socket,
    onAuthReady: world.onAuthReady,
    messageId: 42,
    channelId: 7,
    onUndelivered: (ack) => undelivered.push(ack)
  });
  assert.equal(world.emits.length, 1);
  assert.equal(world.emits[0].event, 'new_chat_message');

  const rejection = {
    error: 'socket_ingress_rejected',
    reason: 'event_payload_limit'
  };
  world.emits[0].ack(rejection);
  assert.equal(world.emits.length, 1, 'waits for the new connection');
  world.reconnect();
  assert.equal(world.emits.length, 2);
  assert.deepEqual(world.emits[1].payload, world.emits[0].payload);
  assert.deepEqual(undelivered, []);

  world.emits[1].ack(rejection);
  assert.deepEqual(undelivered, [rejection]);
  world.reconnect();
  assert.equal(world.emits.length, 2, 'no third attempt');
});

test('a delivered relay, or a server without acknowledgements, changes nothing', () => {
  const world = createRelaySocket();
  const undelivered: any[] = [];
  relayChatMessage({
    socket: world.socket,
    onAuthReady: world.onAuthReady,
    messageId: 1,
    channelId: 2,
    onUndelivered: (ack) => undelivered.push(ack)
  });
  world.emits[0].ack({ ok: true });
  world.reconnect();
  assert.equal(world.emits.length, 1);
  assert.deepEqual(undelivered, []);
});

test('a retry after the server relay window is reported instead of sent', () => {
  const world = createRelaySocket();
  const undelivered: any[] = [];
  let clock = 0;
  relayChatMessage({
    socket: world.socket,
    onAuthReady: world.onAuthReady,
    messageId: 1,
    channelId: 2,
    now: () => clock,
    onUndelivered: (ack) => undelivered.push(ack)
  });
  world.emits[0].ack({ error: 'socket_ingress_rejected' });
  clock = 10 * 60_000;
  world.reconnect();
  assert.equal(world.emits.length, 1);
  assert.equal(undelivered.length, 1);
});

test('message senders use the id-only relay and mark an undelivered relay visibly', () => {
  for (const path of [
    'src/containers/App/index.tsx',
    'src/containers/Chat/Message/MessageBody/hooks/useOptimisticSave.ts'
  ]) {
    const source = readSource(path);
    assert.ok(
      !source.includes("socket.emit('new_chat_message'"),
      `${path} must relay through relayChatMessage`
    );
    assert.match(source, /relayChatMessage\(\{[\s\S]*?relayUndelivered: true/);
  }
  assert.match(
    readSource('src/containers/Chat/Message/MessageBody/Content.tsx'),
    /message\.relayUndelivered[\s\S]*?may not see it until they reload/
  );
});

test('a persistent refusal never loops: {ok:false} is final, rejections stop at one resend', () => {
  const refused = createRelaySocket();
  const refusedUndelivered: any[] = [];
  relayChatMessage({
    socket: refused.socket,
    onAuthReady: refused.onAuthReady,
    messageId: 5,
    channelId: 6,
    onUndelivered: (ack) => refusedUndelivered.push(ack)
  });
  for (let index = 0; index < 3; index += 1) {
    refused.emits[refused.emits.length - 1].ack({ ok: false });
    refused.reconnect();
  }
  assert.equal(refused.emits.length, 1, '{ok:false} is never resent');
  assert.deepEqual(refusedUndelivered, []);

  const rejected = createRelaySocket();
  const rejectedUndelivered: any[] = [];
  relayChatMessage({
    socket: rejected.socket,
    onAuthReady: rejected.onAuthReady,
    messageId: 5,
    channelId: 6,
    onUndelivered: (ack) => rejectedUndelivered.push(ack)
  });
  for (let index = 0; index < 5; index += 1) {
    rejected.emits[rejected.emits.length - 1].ack({
      error: 'socket_ingress_rejected'
    });
    rejected.reconnect();
  }
  assert.equal(rejected.emits.length, 2, 'exactly one resend');
  assert.equal(rejectedUndelivered.length, 1);
});

test('a resend refused as unbound ({ok:false}) after auth-ready shows the note', () => {
  const world = createRelaySocket();
  const undelivered: any[] = [];
  relayChatMessage({
    socket: world.socket,
    onAuthReady: world.onAuthReady,
    messageId: 8,
    channelId: 9,
    onUndelivered: (ack) => undelivered.push(ack)
  });
  world.emits[0].ack({ error: 'socket_ingress_rejected' });
  assert.equal(world.emits.length, 1, 'waits for socket auth, not connect');
  world.reconnect();
  assert.equal(world.emits.length, 2);
  world.emits[1].ack({ ok: false });
  assert.deepEqual(undelivered, [{ ok: false }]);
});

test('the resend waits for the app socket-auth-ready signal by default', () => {
  const source = readSource('src/helpers/chatMessageSend.ts');
  assert.match(source, /addEventListener\(TWINKLE_SOCKET_AUTH_READY_EVENT/);
  assert.doesNotMatch(source, /once\('connect'/);
});

test('a too-long suggestion tap shows the inline error instead of returning silently', () => {
  const input = readSource(
    'src/containers/Chat/Body/MessagesContainer/MessageInput/index.tsx'
  );
  assert.match(
    input,
    /const sendLengthError = getChatMessageLengthError\(messageText\);\s*if \(sendLengthError\) \{\s*if \(typeof overrideText === 'string'\) \{\s*setOverrideLengthError\(sendLengthError\);/
  );
  assert.match(
    input,
    /lengthNotice=\{messageLengthError \|\| overrideLengthError\}/
  );
  const area = readSource(
    'src/containers/Chat/Body/MessagesContainer/MessageInput/InputArea.tsx'
  );
  assert.match(area, /\{lengthNotice && \(/);
  // Only the box's own text blocks Enter and the send button.
  assert.match(area, /const isExceedingCharLimit = !!lengthError;/);
});

test('a retryable handler failure resends once at once, and a second failure shows the note', () => {
  const world = createRelaySocket();
  const undelivered: any[] = [];
  relayChatMessage({
    socket: world.socket,
    onAuthReady: world.onAuthReady,
    messageId: 11,
    channelId: 12,
    onUndelivered: (ack) => undelivered.push(ack)
  });
  const failure = { ok: false, error: 'relay_failed', retryable: true };
  world.emits[0].ack(failure);
  assert.equal(world.emits.length, 2, 'no wait for reconnect');
  world.emits[1].ack(failure);
  world.reconnect();
  assert.equal(world.emits.length, 2, 'never a third attempt');
  assert.deepEqual(undelivered, [failure]);
});

test('a refused voice-call message is appended, never dropped, in the chat it was typed in', () => {
  assert.equal(appendRefusedCallMessage('', 'hi'), 'hi');
  assert.equal(appendRefusedCallMessage('  ', 'hi'), 'hi');
  assert.equal(appendRefusedCallMessage('draft', 'hi'), 'draft\nhi');
  const input = readSource(
    'src/containers/Chat/Body/MessagesContainer/MessageInput/index.tsx'
  );
  assert.match(
    input,
    /prevChannelId\.current === callChannelId &&\s*prevSubchannelId\.current === callSubchannelId/
  );
  assert.match(
    input,
    /handleSetText\(\s*appendRefusedCallMessage\(textRef\.current, callMessage\)/
  );
  assert.match(
    input,
    /appendRefusedCallMessage\(\s*getInputStateValue\(draftKey\)\?\.text \|\| '',\s*callMessage/
  );
  assert.doesNotMatch(input, /if \(stringIsEmpty\(textRef\.current\)\) handleSetText\(callMessage\)/);
});
