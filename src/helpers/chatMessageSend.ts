import {
  CHAT_MESSAGE_MAX_CHARS,
  CHAT_MESSAGE_MAX_UTF8_BYTES
} from '~/constants/chatMessageLimits';
import { TWINKLE_SOCKET_AUTH_READY_EVENT } from '~/constants/socketEvents';

export { CHAT_MESSAGE_MAX_CHARS, CHAT_MESSAGE_MAX_UTF8_BYTES };

// The window in which the API still relays a just-saved message
// (RECENT_BROWSER_MESSAGE_RELAY_SECONDS in twinkle-api socket/chat.ts).
const RELAY_RETRY_WINDOW_MS = 4 * 60_000;

export function getUtf8ByteLength(text: string) {
  let bytes = 0;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    if (code < 0x80) bytes += 1;
    else if (code < 0x800) bytes += 2;
    else if (
      code >= 0xd800 &&
      code <= 0xdbff &&
      index + 1 < text.length &&
      text.charCodeAt(index + 1) >= 0xdc00 &&
      text.charCodeAt(index + 1) <= 0xdfff
    ) {
      bytes += 4;
      index += 1;
    } else bytes += 3;
  }
  return bytes;
}

export function getChatMessageLengthError(text: string): string | null {
  const value = text || '';
  if (value.length > CHAT_MESSAGE_MAX_CHARS) {
    return `This message is too long to send: ${value.length.toLocaleString()} / ${CHAT_MESSAGE_MAX_CHARS.toLocaleString()} characters. Shorten it or split it into parts.`;
  }
  // Only a string longer than a quarter of the byte budget can exceed it.
  if (value.length * 3 <= CHAT_MESSAGE_MAX_UTF8_BYTES) return null;
  if (getUtf8ByteLength(value) > CHAT_MESSAGE_MAX_UTF8_BYTES) {
    return 'This message is too long to send. Shorten it or split it into parts.';
  }
  return null;
}

// The live relay of a message the HTTP route already saved. The API reloads
// the canonical row by id (loadCanonicalBrowserMessageRelay) and discards
// everything else, so the payload carries only ids. Sending the whole message
// made long (Korean, 3 bytes per character) messages overflow the socket
// guard, which then dropped the sender's connection.
export function buildChatMessageRelayPayload({
  messageId,
  channelId
}: {
  messageId: number;
  channelId: number;
}) {
  return {
    message: { id: Number(messageId), channelId: Number(channelId) },
    channel: { id: Number(channelId) }
  };
}

interface RelaySocket {
  emit: (event: string, ...args: any[]) => unknown;
}

// The ingress guard refused the event and is dropping this connection.
export function isIngressRejectedAck(ack: any) {
  return (
    !!ack && typeof ack === 'object' && ack.error === 'socket_ingress_rejected'
  );
}

// Resume once the reconnected socket is bound to the user (handshake auth or
// a later bind_uid_to_socket). A raw 'connect' can come before the bind, and
// the server refuses an unbound relay with {ok:false}.
function onceSocketAuthReady(handler: () => void) {
  if (typeof window === 'undefined') return;
  window.addEventListener(TWINKLE_SOCKET_AUTH_READY_EVENT, () => handler(), {
    once: true
  });
}

// Relays a saved message and recovers when the server refuses the event: the
// ingress guard answers the acknowledgement before it drops the connection,
// so the relay is sent again once the socket is authenticated again. If that
// one resend is refused in any way, onUndelivered tells the sender others may
// not have it live. Servers without acknowledgements never call back, which
// changes nothing.
export function relayChatMessage({
  socket,
  messageId,
  channelId,
  onUndelivered,
  onAuthReady = onceSocketAuthReady,
  now = () => Date.now()
}: {
  socket: RelaySocket;
  messageId: number;
  channelId: number;
  onUndelivered?: (ack: any) => void;
  onAuthReady?: (handler: () => void) => void;
  now?: () => number;
}) {
  const payload = buildChatMessageRelayPayload({ messageId, channelId });
  const startedAt = now();
  let attempts = 0;
  let answered = 0;
  send();

  function send() {
    attempts += 1;
    const attempt = attempts;
    socket.emit('new_chat_message', payload, (ack: any) =>
      handleAck(ack, attempt)
    );
  }

  // Bounded by construction: only the latest attempt's first answer counts,
  // a first-attempt {ok:false} (e.g. no channel access) is final, and an
  // ingress refusal or a retryable handler failure earns exactly one resend.
  function handleAck(ack: any, attempt: number) {
    if (attempt !== attempts || answered >= attempt) return;
    answered = attempt;
    const rejected = isIngressRejectedAck(ack);
    if (attempt >= 2) {
      if (rejected || ack?.ok === false) onUndelivered?.(ack);
      return;
    }
    if (ack?.error === 'relay_failed' && ack?.retryable === true) {
      // The handler failed after admission; the connection is still up and
      // the server freed its claim, so resend once now.
      send();
      return;
    }
    if (!rejected) return;
    if (now() - startedAt > RELAY_RETRY_WINDOW_MS) {
      onUndelivered?.(ack);
      return;
    }
    onAuthReady(() => {
      if (now() - startedAt > RELAY_RETRY_WINDOW_MS) {
        onUndelivered?.(ack);
        return;
      }
      send();
    });
  }
}

// A refused voice-call message goes back into the box after any text already
// there, on its own line, so nothing is overwritten or lost.
export function appendRefusedCallMessage(existing: string, message: string) {
  return existing && existing.trim() ? `${existing}\n${message}` : message;
}
