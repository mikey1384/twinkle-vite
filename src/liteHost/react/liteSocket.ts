// The lite host's socket: the website's own client (constants/sockets/api),
// signed in with the app pass from this origin's `token` storage key. The
// server binds an app-pass socket to this one app (twinkle-api
// socket/lumineAppSocketGuard.ts): its worlds, app chat rooms and the
// member's notification room, never Twinkle chat or presence. Once bound,
// the shared bridge's world/chat requests stop waiting
// (helpers/socketAuthReady.ts), exactly as on twin-kle.com.
import { socket } from '~/constants/sockets/api';
import {
  clearSocketAuthReady,
  markSocketAuthReady,
  SOCKET_BIND_ACK_TIMEOUT_MS
} from '~/helpers/socketAuthReady';
import { getTwinkleDeviceId } from '~/helpers/userDataHelpers';

function randomId() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export interface LiteSocketIdentity {
  userId: number;
  username: string;
  profilePicUrl: string | null;
  token: string;
}

export function createLiteSocketBinder() {
  let identity: LiteSocketIdentity | null = null;
  let bindSeq = 0;

  function bind() {
    const current = identity;
    if (!current || !socket.connected) return;
    const seq = ++bindSeq;
    socket.timeout(SOCKET_BIND_ACK_TIMEOUT_MS).emit(
      'bind_uid_to_socket',
      {
        chatBindId: randomId(),
        userId: current.userId,
        username: current.username,
        profilePicUrl: current.profilePicUrl || '',
        token: current.token,
        deviceId: getTwinkleDeviceId(),
        presenceSessionId: randomId(),
        presenceVisible: false
      },
      (
        error: Error | null,
        result?: { authError?: boolean; bindError?: boolean }
      ) => {
        if (seq !== bindSeq || identity !== current) return;
        if (error || result?.authError || result?.bindError) {
          clearSocketAuthReady();
          return;
        }
        markSocketAuthReady(current.userId);
      }
    );
  }

  socket.on('connect', bind);
  socket.on('disconnect', () => clearSocketAuthReady());

  return {
    setIdentity(next: LiteSocketIdentity | null) {
      const previous = identity;
      identity = next;
      if (
        previous &&
        next &&
        previous.userId === next.userId &&
        previous.token !== next.token
      ) {
        // A refreshed app pass: the bound socket stays bound.
        return;
      }
      clearSocketAuthReady();
      if (previous && !next) {
        // Signed out: drop the member's socket identity entirely.
        bindSeq += 1;
        socket.disconnect();
        socket.connect();
        return;
      }
      if (!socket.connected) {
        socket.connect();
        return;
      }
      bind();
    }
  };
}
