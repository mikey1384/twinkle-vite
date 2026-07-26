import type { ChatNotificationSettings } from '~/types/chat';

const STORAGE_KEY = 'twinkle-desktop-notifications';
const CHAT_PUSH_SW_URL = '/chat-push-sw.js';

export interface PushSubscriptionSaveResult {
  success?: boolean;
  chatNotificationSettings?: ChatNotificationSettings | null;
}

export type DesktopNotificationStatus =
  | 'unsupported'
  | 'blocked'
  | 'enabled'
  | 'disabled';

export function desktopNotificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getDesktopNotificationStatus(): DesktopNotificationStatus {
  if (!desktopNotificationsSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'blocked';
  if (Notification.permission === 'granted' && readPreference() === 'on') {
    return 'enabled';
  }
  return 'disabled';
}

export async function enableDesktopNotifications(): Promise<DesktopNotificationStatus> {
  if (!desktopNotificationsSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      writePreference('on');
    }
  } catch {
    // some browsers reject the permission promise instead of resolving 'denied'
  }
  return getDesktopNotificationStatus();
}

export function disableDesktopNotifications(): DesktopNotificationStatus {
  writePreference('off');
  return getDesktopNotificationStatus();
}

export function showDesktopNotification({
  title,
  body,
  tag,
  onClick
}: {
  title: string;
  body?: string;
  tag?: string;
  onClick?: () => void;
}) {
  if (getDesktopNotificationStatus() !== 'enabled') return;
  try {
    const notification = new Notification(title, {
      body,
      tag,
      icon: '/icon-192.png'
    });
    notification.onclick = () => {
      window.focus();
      onClick?.();
      notification.close();
    };
  } catch {
    // new Notification() throws on platforms that require a service worker
    // (e.g. Android Chrome); fall back to the chat push worker when present.
    // SW notifications can't carry an onClick callback, so taps land on /chat.
    navigator.serviceWorker
      ?.getRegistration(CHAT_PUSH_SW_URL)
      .then((registration) =>
        registration?.showNotification(title, {
          body,
          tag,
          icon: '/icon-192.png',
          badge: '/badge.png',
          data: { url: '/chat' }
        })
      )
      .catch(() => {});
  }
}

export function chatPushSupported() {
  return (
    desktopNotificationsSupported() &&
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

export function chatPushAutoEnrollEligible() {
  return (
    chatPushSupported() &&
    readPreference() === 'on' &&
    Notification.permission === 'granted'
  );
}

// Called on app startup so an already-enabled device re-registers the worker
// and picks up chat-push-sw.js updates.
export function registerChatPushServiceWorkerIfEnabled() {
  if (!chatPushAutoEnrollEligible()) return;
  navigator.serviceWorker.register(CHAT_PUSH_SW_URL).catch(() => {});
}

// Called from explicit logout. The local unsubscribe alone is enough for
// privacy: it invalidates the endpoint at the push service, so the server's
// next send gets a 410 and prunes the row. The server-side delete is
// best-effort tidiness. The caller binds the departing account's authorization
// before clearing local session state so this delayed delete keeps its owner.
export async function teardownChatPushOnLogout(
  deletePushSubscription: (endpoint: string) => Promise<unknown>
) {
  try {
    const endpoint = await unsubscribeFromChatPush();
    if (endpoint) {
      await deletePushSubscription(endpoint);
    }
  } catch {
    // best-effort
  }
}

export async function subscribeToChatPush(vapidPublicKey: string): Promise<{
  endpoint: string;
  keys: { p256dh: string; auth: string };
} | null> {
  if (!chatPushSupported() || !vapidPublicKey) return null;
  try {
    const registration =
      await navigator.serviceWorker.register(CHAT_PUSH_SW_URL);
    await navigator.serviceWorker.ready;
    const subscription =
      (await registration.pushManager.getSubscription()) ||
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      }));
    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return null;
    return {
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth }
    };
  } catch {
    // push subscription is an enhancement on top of in-page notifications;
    // failures (unsupported browser, user dismissed) must not break the toggle
    return null;
  }
}

export interface ChatPushSetupResult {
  status: 'enabled' | 'failed';
  // Canonical settings the save route returned, or null when the save never
  // happened. Subscribing flips `hasPushSubscription`, so callers hand this
  // straight to chat state rather than inferring the new value locally.
  chatNotificationSettings: ChatNotificationSettings | null;
}

export async function setupChatPushBestEffort({
  loadVapidKey,
  saveSubscription,
  subscribe = subscribeToChatPush
}: {
  loadVapidKey: () => Promise<string>;
  saveSubscription: (subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  }) => Promise<PushSubscriptionSaveResult>;
  subscribe?: typeof subscribeToChatPush;
}): Promise<ChatPushSetupResult> {
  try {
    const publicKey = await loadVapidKey();
    if (!publicKey) return { status: 'failed', chatNotificationSettings: null };
    const subscription = await subscribe(publicKey);
    if (!subscription) {
      return { status: 'failed', chatNotificationSettings: null };
    }
    const result = await saveSubscription(subscription);
    return {
      status: 'enabled',
      chatNotificationSettings: result?.chatNotificationSettings || null
    };
  } catch {
    // Web Push is secondary to browser notifications. Its setup outcome must
    // never change the confirmed local Notification permission/preference.
    return { status: 'failed', chatNotificationSettings: null };
  }
}

export async function unsubscribeFromChatPush(): Promise<string | null> {
  if (
    typeof navigator === 'undefined' ||
    !('serviceWorker' in navigator)
  ) {
    return null;
  }
  let endpoint: string | null = null;
  try {
    const registration = await navigator.serviceWorker.getRegistration(
      CHAT_PUSH_SW_URL
    );
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return endpoint;
    endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    return endpoint;
  } catch {
    // Return a discovered endpoint even if local unsubscription failed so the
    // caller can still remove the canonical server subscription.
    return endpoint;
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function readPreference() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writePreference(value: 'on' | 'off') {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // localStorage unavailable (privacy mode); permission gate still applies
  }
}
