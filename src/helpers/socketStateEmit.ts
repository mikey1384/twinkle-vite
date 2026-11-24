// Socket.IO keeps every emit made while the socket is disconnected (or while
// its ping has expired) in `sendBuffer` and replays the whole buffer the moment
// the namespace reconnects. For events that only report the page's current
// state, every buffered copy but the newest is stale, and a page that spent a
// few minutes disconnected while the member switched windows and typed (each
// focus, visibility change and 3-second agent-activity report adds one) replays
// dozens of them inside a single frame. The API's ingress guard (30 events/s,
// burst 60) then disconnects the new socket within ~100 ms, which starts the
// cycle again (users 18697 on 11-12 and 11-17, 6589 on 11-24:
// change_away_status + website_agent_active, connectionAgeMs ~70-110).
//
// emitLatestState sends like socket.emit while connected. When the packet is
// buffered instead, it drops the older buffered copies of the same event, so a
// reconnect replays one current value per state event, at the position of the
// newest report. Packets that wait for an acknowledgement are never dropped.

interface BufferedPacket {
  data?: unknown;
  id?: number;
}

interface StateSocket {
  emit(event: string, ...args: unknown[]): unknown;
  sendBuffer: BufferedPacket[];
}

function packetEvent(packet: BufferedPacket | undefined) {
  return Array.isArray(packet?.data) ? packet.data[0] : undefined;
}

export function emitLatestState(
  socket: StateSocket,
  event: string,
  ...args: unknown[]
) {
  const before = Array.isArray(socket.sendBuffer)
    ? socket.sendBuffer.length
    : 0;
  socket.emit(event, ...args);
  const buffer = socket.sendBuffer;
  if (!Array.isArray(buffer) || buffer.length !== before + 1) return;
  const newest = buffer[buffer.length - 1];
  if (packetEvent(newest) !== event) return;
  const kept = buffer.filter(
    (packet, index) =>
      index === buffer.length - 1 ||
      packetEvent(packet) !== event ||
      typeof packet?.id === 'number'
  );
  if (kept.length !== buffer.length) socket.sendBuffer = kept;
}
