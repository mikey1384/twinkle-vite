import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  enableDesktopNotifications,
  getDesktopNotificationStatus,
  setupChatPushBestEffort
} from '../src/helpers/desktopNotifications';

test('Web Push failures do not disable confirmed browser notifications', async (t) => {
  const previousWindow = (globalThis as any).window;
  const previousNotification = (globalThis as any).Notification;
  const previousLocalStorage = (globalThis as any).localStorage;
  const storage = new Map<string, string>();
  const NotificationApi = {
    permission: 'granted',
    requestPermission: async () => 'granted'
  };
  (globalThis as any).window = { Notification: NotificationApi };
  (globalThis as any).Notification = NotificationApi;
  (globalThis as any).localStorage = {
    getItem: (key: string) => storage.get(key) || null,
    setItem: (key: string, value: string) => storage.set(key, value)
  };
  t.after(() => {
    (globalThis as any).window = previousWindow;
    (globalThis as any).Notification = previousNotification;
    (globalThis as any).localStorage = previousLocalStorage;
  });

  assert.equal(await enableDesktopNotifications(), 'enabled');

  const vapidFailure = await setupChatPushBestEffort({
    loadVapidKey: async () => {
      throw new Error('network unavailable');
    },
    saveSubscription: async () => undefined
  });
  assert.equal(vapidFailure, 'failed');
  assert.equal(getDesktopNotificationStatus(), 'enabled');

  const subscriptionFailure = await setupChatPushBestEffort({
    loadVapidKey: async () => 'public-key',
    subscribe: async () => null,
    saveSubscription: async () => undefined
  });
  assert.equal(subscriptionFailure, 'failed');
  assert.equal(getDesktopNotificationStatus(), 'enabled');

  const persistenceFailure = await setupChatPushBestEffort({
    loadVapidKey: async () => 'public-key',
    subscribe: async () => ({
      endpoint: 'https://push.example/device',
      keys: { p256dh: 'key', auth: 'auth' }
    }),
    saveSubscription: async () => {
      throw new Error('API unavailable');
    }
  });
  assert.equal(persistenceFailure, 'failed');
  assert.equal(getDesktopNotificationStatus(), 'enabled');
});

test('successful Web Push setup still reports enabled', async () => {
  let savedEndpoint = '';
  const result = await setupChatPushBestEffort({
    loadVapidKey: async () => 'public-key',
    subscribe: async () => ({
      endpoint: 'https://push.example/device',
      keys: { p256dh: 'key', auth: 'auth' }
    }),
    saveSubscription: async (subscription) => {
      savedEndpoint = subscription.endpoint;
    }
  });

  assert.equal(result, 'enabled');
  assert.equal(savedEndpoint, 'https://push.example/device');
});

test('the device enable path never writes the local preference back to off', () => {
  const source = readFileSync(
    new URL(
      '../src/containers/Home/Store/ChatNotificationsItem.tsx',
      import.meta.url
    ),
    'utf8'
  );
  const start = source.indexOf('async function enableNotificationsOnDevice()');
  const end = source.indexOf(
    '\n  async function handlePreferenceUpdate',
    start
  );
  const enablePath = source.slice(start, end);

  assert.ok(start > 0 && end > start);
  assert.match(enablePath, /setDeviceStatus\(newStatus\)/);
  assert.match(enablePath, /setupChatPushBestEffort/);
  assert.doesNotMatch(enablePath, /disableDesktopNotifications/);
});
