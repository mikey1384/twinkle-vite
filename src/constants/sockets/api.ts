import io from 'socket.io-client';
import URL from '~/constants/URL';
import { getStoredItem, getTwinkleDeviceId } from '~/helpers/userDataHelpers';
import { browserReportsOffline } from '~/helpers/browserNetwork';
import { clientVersion } from '~/constants/defaultValues';
import { getPresenceContinuityBindMetadata } from '~/helpers/presenceContinuity';
import { isLuminePreviewCaptureContext } from '~/helpers/luminePreviewCapture';
import {
  createSocketKeepalive,
  guardSocketConnect
} from '~/helpers/socketKeepalive';

function buildSocketAuthPayload() {
  const token = getStoredItem('token');
  const userId = Number(getStoredItem('userId') || 0);
  if (!token || !userId) return {};
  return {
    userId,
    token,
    username: getStoredItem('username'),
    profilePicUrl: getStoredItem('profilePicUrl'),
    deviceId: getTwinkleDeviceId(),
    ...getPresenceContinuityBindMetadata(userId),
    clientVersion
  };
}

export const socket = io(URL as string, {
  // An offline browser cannot complete a transport handshake. Waiting for the
  // browser's `online` event avoids an otherwise-unbounded reconnect loop on a
  // mobile device without changing or discarding the authenticated session.
  // A Lumine view_preview uses a read-only capture credential, which the
  // member socket intentionally rejects. Do not start even a guest handshake.
  autoConnect:
    !browserReportsOffline() &&
    (typeof window === 'undefined' ||
      !isLuminePreviewCaptureContext(window.location, getStoredItem('token'))),
  transports: ['websocket'],
  // `navigator.onLine` is only a hint on iOS. When Safari reports online but
  // the route is actually unavailable, back off the Manager-owned handshake
  // loop instead of waking the radio every few seconds indefinitely.
  reconnectionDelay: 1_000,
  reconnectionDelayMax: 15_000,
  // A network interface can stay "online" while the internet route is gone.
  // Bound each Manager burst so Safari does not wake the radio forever. The
  // visible-session recovery scheduler starts a new bounded attempt (at most
  // once/minute) and therefore still reconnects when service returns even if
  // iOS never dispatches an `online` event.
  reconnectionAttempts: 6,
  randomizationFactor: 0.5,
  auth(callback: (data: ReturnType<typeof buildSocketAuthPayload>) => void) {
    callback(buildSocketAuthPayload());
  }
});

// The page's one periodic beat (helpers/socketKeepalive.ts): the server's
// transport ping. Small periodic work subscribes to it so a phone's radio
// wakes once per beat, and two missed beats on a visible page close the dead
// transport so Socket.IO's own bounded reconnect takes over.
export const socketKeepalive = createSocketKeepalive({
  onDeadLink() {
    try {
      socket.io.engine?.close();
    } catch {
      // The Manager owns the transport; a close that throws leaves it as is.
    }
  }
});

// The transport, not the namespace, is what pings: a transport that opened
// but never answered the namespace CONNECT is watched too.
socket.io.on('open', socketKeepalive.connected);
socket.io.on('close', socketKeepalive.disconnected);
socket.io.on('ping', socketKeepalive.ping);

// No caller can repeat a namespace CONNECT that is already on its way.
guardSocketConnect(socket);
if (typeof document !== 'undefined') {
  socketKeepalive.visibilityChanged(document.visibilityState === 'visible');
  document.addEventListener('visibilitychange', () => {
    socketKeepalive.visibilityChanged(document.visibilityState === 'visible');
  });
}
