const STORAGE_KEY = 'twinkle-desktop-notifications';

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
      icon: '/favicon.png'
    });
    notification.onclick = () => {
      window.focus();
      onClick?.();
      notification.close();
    };
  } catch {
    // new Notification() throws on platforms that require a service worker
    // (e.g. Android Chrome); page-triggered notifications are desktop-only
  }
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
