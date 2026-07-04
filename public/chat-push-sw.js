/* Twinkle chat push service worker.
 * Push-only: no fetch handler on purpose, so this worker never intercepts
 * network requests or caches pages. */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    return;
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || 'Twinkle', {
      body: payload.body || '',
      tag: payload.tag || 'twinkle-chat',
      icon: '/favicon.png',
      badge: '/favicon.png',
      data: { url: payload.url || '/chat' }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/chat';
  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      });
      for (const client of clientList) {
        if ('focus' in client) {
          try {
            await client.focus();
            if ('navigate' in client) {
              await client.navigate(url);
              return;
            }
          } catch {
            // navigate() rejects for clients this worker doesn't control
            // (e.g. tabs opened before it registered); fall through
          }
          // focused a tab but couldn't take it to the chat; open one that
          // lands there
          break;
        }
      }
      await self.clients.openWindow(url);
    })()
  );
});
