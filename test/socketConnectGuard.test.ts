import test from 'node:test';
import assert from 'node:assert/strict';
import io from 'socket.io-client';
import {
  guardSocketConnect,
  isSocketHandshakeInFlight
} from '../src/helpers/socketKeepalive';

// A real Socket.IO client socket whose Manager is "open" without a network:
// packets the socket would write are captured instead.
function openSocket() {
  const socket = io('http://127.0.0.1:9', {
    autoConnect: false,
    reconnection: false,
    transports: ['websocket']
  });
  const packets: { type: number }[] = [];
  const manager = socket.io as any;
  manager._readyState = 'open';
  manager._packet = (packet: { type: number }) => packets.push(packet);
  const connects = () => packets.filter((packet) => packet.type === 0).length;
  return { socket, manager, connects };
}

test('the library repeats the namespace CONNECT when connect() is called during the handshake', () => {
  const { socket, connects } = openSocket();
  socket.connect();
  assert.equal(connects(), 1);
  socket.connect();
  assert.equal(
    connects(),
    2,
    'if this stops being true the guard is no longer needed'
  );
});

test('the guarded socket sends one CONNECT however often connect() is called before the answer', () => {
  const { socket, connects } = openSocket();
  guardSocketConnect(socket);
  socket.connect();
  socket.connect();
  socket.open();
  assert.equal(connects(), 1);
  assert.equal(isSocketHandshakeInFlight(socket), true);
});

test('the guard still connects a socket that is not in a handshake', () => {
  const { socket, manager, connects } = openSocket();
  guardSocketConnect(socket);
  socket.connect();
  assert.equal(connects(), 1);
  // The server refused or ended the namespace: the socket leaves its Manager
  // and the next connect() must send CONNECT again.
  socket.disconnect();
  manager._readyState = 'open';
  assert.equal(socket.active, false);
  assert.equal(isSocketHandshakeInFlight(socket), false);
  socket.connect();
  assert.equal(connects(), 2);
});

test('a closed Manager is opened by the guarded connect', () => {
  const { socket, manager } = openSocket();
  manager._readyState = 'closed';
  let opened = 0;
  manager.open = () => {
    opened += 1;
    return manager;
  };
  guardSocketConnect(socket);
  socket.connect();
  assert.equal(opened, 1);
  // Opening is in flight now; the library itself ignores a second open.
  manager._readyState = 'opening';
  assert.equal(isSocketHandshakeInFlight(socket), true);
});
