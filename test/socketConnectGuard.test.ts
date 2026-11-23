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

test('a CONNECT unanswered for ten seconds may be sent again', () => {
  const { socket, connects } = openSocket();
  let clock = 1_000;
  guardSocketConnect(socket, () => clock);
  socket.connect();
  clock += 9_999;
  socket.connect();
  assert.equal(connects(), 1);
  clock += 1;
  socket.connect();
  assert.equal(connects(), 2);
  socket.connect();
  assert.equal(connects(), 2, 'the repeat starts a new ten-second wait');
});

test('a CONNECT the Manager sent itself when the transport opened is not repeated', () => {
  const { socket, manager, connects } = openSocket();
  manager._readyState = 'opening';
  let clock = 50_000;
  guardSocketConnect(socket, () => clock);
  // The library subscribes the socket to its Manager; the transport opens.
  manager.open = () => manager;
  socket.connect();
  manager._readyState = 'open';
  manager.emitReserved('open');
  assert.equal(connects(), 1);
  clock += 500;
  socket.connect();
  assert.equal(connects(), 1);
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
