import io from 'socket.io-client';
import URL from '~/constants/URL';
import {
  getStoredItem,
  getTwinkleDeviceId
} from '~/helpers/userDataHelpers';

function buildSocketAuthPayload() {
  const token = getStoredItem('token');
  const userId = Number(getStoredItem('userId') || 0);
  if (!token || !userId) return {};
  return {
    userId,
    token,
    username: getStoredItem('username'),
    profilePicUrl: getStoredItem('profilePicUrl'),
    deviceId: getTwinkleDeviceId()
  };
}

export const socket = io(URL as string, {
  transports: ['websocket'],
  auth(callback: (data: ReturnType<typeof buildSocketAuthPayload>) => void) {
    callback(buildSocketAuthPayload());
  }
});
