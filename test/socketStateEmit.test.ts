import test from 'node:test';
import assert from 'node:assert/strict';
import { io } from 'socket.io-client';
import { emitLatestState } from '../src/helpers/socketStateEmit';

// A real Socket.IO client that never connects: every emit lands in the same
// sendBuffer that the library replays on reconnect.
function disconnectedSocket() {
  return io('http://127.0.0.1:9', { autoConnect: false, reconnection: false });
}

function bufferedEvents(socket: ReturnType<typeof disconnectedSocket>) {
  return socket.sendBuffer.map((packet) => packet.data);
}

test('a reconnect replays one current value per state event, not every buffered report', () => {
  const socket = disconnectedSocket();
  // Minutes offline while the member switches windows and types: the flood
  // that the API ingress guard disconnected (30/s, burst 60).
  for (let i = 0; i < 80; i++) {
    emitLatestState(socket, 'change_away_status', i % 2 === 0);
    emitLatestState(socket, 'website_agent_active', { tabId: 'tab-a' });
  }
  socket.emit('new_chat_message', { messageId: 1 });
  emitLatestState(socket, 'change_away_status', true);

  assert.deepEqual(bufferedEvents(socket), [
    ['website_agent_active', { tabId: 'tab-a' }],
    ['new_chat_message', { messageId: 1 }],
    ['change_away_status', true]
  ]);
});

test('other buffered events and packets awaiting an acknowledgement are kept', () => {
  const socket = disconnectedSocket();
  socket.emit('new_chat_message', { messageId: 1 });
  socket.emit('change_away_status', false, () => {});
  emitLatestState(socket, 'change_away_status', false);
  socket.emit('new_chat_message', { messageId: 2 });
  emitLatestState(socket, 'change_away_status', true);

  const data = bufferedEvents(socket);
  assert.equal(data.length, 4);
  assert.deepEqual(data[0], ['new_chat_message', { messageId: 1 }]);
  assert.equal(socket.sendBuffer[1].id, 0);
  assert.deepEqual(data[2], ['new_chat_message', { messageId: 2 }]);
  assert.deepEqual(data[3], ['change_away_status', true]);
});

test('a connected socket sends every state report unchanged', () => {
  const sent: unknown[][] = [];
  const socket = {
    sendBuffer: [] as { data?: unknown; id?: number }[],
    emit(event: string, ...args: unknown[]) {
      sent.push([event, ...args]);
      return socket;
    }
  };
  emitLatestState(socket, 'change_away_status', true);
  emitLatestState(socket, 'change_away_status', true);
  assert.deepEqual(sent, [
    ['change_away_status', true],
    ['change_away_status', true]
  ]);
  assert.deepEqual(socket.sendBuffer, []);
});
