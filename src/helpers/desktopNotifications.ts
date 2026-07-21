const STORAGE_KEY = 'twinkle-desktop-notifications';
const CHAT_PUSH_SW_URL = '/chat-push-sw.js';

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

export async function unsubscribeFromChatPush(): Promise<string | null> {
  if (
    typeof navigator === 'undefined' ||
    !('serviceWorker' in navigator)
  ) {
    return null;
  }
  try {
    const registration =
      await navigator.serviceWorker.getRegistration(CHAT_PUSH_SW_URL);
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return null;
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    return endpoint;
  } catch {
    return null;
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
