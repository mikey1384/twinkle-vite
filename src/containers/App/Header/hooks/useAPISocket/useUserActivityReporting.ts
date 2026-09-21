import { USER_ACTIVITY_INPUT_EVENT } from '~/helpers/userActivity';
import { useEffect } from 'react';
import { useKeyContext } from '~/contexts';
import { socket } from '~/constants/sockets/api';
import { TWINKLE_SOCKET_AUTH_READY_EVENT } from '~/constants/socketEvents';
import { isSocketAuthReadyForUser } from '~/helpers/socketAuthReady';
import { userActivityRegistry } from '~/helpers/hooks/useUserActivity';

export default function useUserActivityReporting() {
  const userId = useKeyContext((v) => v.myState.userId);
  useEffect(() => {
    if (!userId) return;
    let stopped = false;
    let revision = 0;
    let lastKey = '';
    let lastInputAt = 0;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let changeTimer: ReturnType<typeof setTimeout> | undefined;

    function report(force = false) {
      if (stopped || !isSocketAuthReadyForUser(userId)) return;
      const activity =
        document.visibilityState === 'visible' && document.hasFocus()
          ? userActivityRegistry.get(userId)
          : null;
      const key = JSON.stringify(activity);
      if (!force && key === lastKey) return;
      lastKey = key;
      const requestRevision = ++revision;
      clearTimeout(retry);
      // Report through the bound socket only; Socket.IO must not buffer an
      // old app/exit and replay it as activity after a reconnect.
      socket
        .timeout(8000)
        .emit('set_user_activity', activity, (error: any, response: any) => {
          if (stopped || requestRevision !== revision) return;
          if (error || response?.ok !== true) {
            lastKey = '';
            retry = setTimeout(
              () => report(true),
              Math.max(
                1000,
                Math.min(25_000, Number(response?.retryAfterMs) || 5000)
              )
            );
          }
        });
    }
    function changed() {
      clearTimeout(changeTimer);
      // Route changes can unmount one app and mount the next in one commit.
      changeTimer = setTimeout(() => report(), 100);
    }
    function userInput(event: Event) {
      const activity = userActivityRegistry.get(userId);
      if (
        !activity ||
        document.visibilityState !== 'visible' ||
        !document.hasFocus() ||
        !isSocketAuthReadyForUser(userId)
      )
        return;
      if (event.type === USER_ACTIVITY_INPUT_EVENT) {
        if (
          activity.kind !== 'app' ||
          activity.id !== Number((event as CustomEvent).detail?.buildId)
        )
          return;
      } else if (!event.isTrusted) return;
      if (Date.now() - lastInputAt < 30_000) return;
      lastInputAt = Date.now();
      socket.emit('presence_user_action', { type: 'game-interaction' });
    }
    function foregroundChanged() {
      report(true);
    }
    function disconnected() {
      revision++;
      lastKey = '';
      clearTimeout(retry);
    }
    function pageHidden() {
      if (isSocketAuthReadyForUser(userId))
        socket.emit('set_user_activity', null);
      revision++;
      lastKey = '';
    }
    const unsubscribe = userActivityRegistry.subscribe(changed);
    const heartbeat = setInterval(() => {
      if (userActivityRegistry.get(userId)) report(true);
    }, 25_000);
    window.addEventListener('pointerdown', userInput, true);
    window.addEventListener('keydown', userInput, true);
    window.addEventListener('wheel', userInput, {
      capture: true,
      passive: true
    });
    window.addEventListener(USER_ACTIVITY_INPUT_EVENT, userInput);
    window.addEventListener('focus', foregroundChanged);
    window.addEventListener('blur', foregroundChanged);
    window.addEventListener('pagehide', pageHidden);
    window.addEventListener(TWINKLE_SOCKET_AUTH_READY_EVENT, foregroundChanged);
    document.addEventListener('visibilitychange', foregroundChanged);
    socket.on('online_acknowledged', foregroundChanged);
    socket.on('disconnect', disconnected);
    report(true);
    return () => {
      pageHidden();
      stopped = true;
      unsubscribe();
      clearInterval(heartbeat);
      clearTimeout(retry);
      clearTimeout(changeTimer);
      window.removeEventListener('pointerdown', userInput, true);
      window.removeEventListener('keydown', userInput, true);
      window.removeEventListener('wheel', userInput, true);
      window.removeEventListener(USER_ACTIVITY_INPUT_EVENT, userInput);
      window.removeEventListener('focus', foregroundChanged);
      window.removeEventListener('blur', foregroundChanged);
      window.removeEventListener('pagehide', pageHidden);
      window.removeEventListener(
        TWINKLE_SOCKET_AUTH_READY_EVENT,
        foregroundChanged
      );
      document.removeEventListener('visibilitychange', foregroundChanged);
      socket.off('online_acknowledged', foregroundChanged);
      socket.off('disconnect', disconnected);
    };
  }, [userId]);
}
