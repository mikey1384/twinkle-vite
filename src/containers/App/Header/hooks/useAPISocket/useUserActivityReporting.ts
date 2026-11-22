import {
  USER_ACTIVITY_INPUT_EVENT,
  userActivityReportDelayMs
} from '~/helpers/userActivity';
import { useEffect, useRef } from 'react';
import { useKeyContext } from '~/contexts';
import { socialJoinableStore, withJoinable } from '~/helpers/socialWalkups';
import { socket } from '~/constants/sockets/api';
import { TWINKLE_SOCKET_AUTH_READY_EVENT } from '~/constants/socketEvents';
import { isSocketAuthReadyForUser } from '~/helpers/socketAuthReady';
import { userActivityRegistry } from '~/helpers/hooks/useUserActivity';


export default function useUserActivityReporting() {
  const userId = useKeyContext((v) => v.myState.userId);
  // "Don't let people walk up while I play": then this member's apps do not
  // advertise that they can be joined (the server refuses walk-ups too).
  const walkupsAllowed = useKeyContext(
    (v) => v.myState.settings?.social?.walkups !== false
  );
  const walkupsAllowedRef = useRef(walkupsAllowed);
  const reportChangeRef = useRef<() => void>(() => {});
  useEffect(() => {
    walkupsAllowedRef.current = walkupsAllowed;
    reportChangeRef.current();
  }, [walkupsAllowed]);
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
      // The app's joinable state (Twinkle.social.setJoinable) rides on the
      // same report, so it needs no socket event or lease of its own.
      // Neither window focus nor a hidden page withdraws it (Mikey, 11-22:
      // members multitask). The server keeps a hidden page's activity for
      // its grace (twinkle-api socket/userActivity.ts) and ends it there;
      // only a real page close or an account switch clears it at once.
      const activity = withJoinable(userActivityRegistry.get(userId), {
        walkupsAllowed: walkupsAllowedRef.current
      });
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
      // Route changes can unmount one app and mount the next in one commit;
      // an ending activity waits a few seconds (userActivityReportDelayMs), so
      // a round's gap never blinks the badge. Closing the page still clears
      // it at once (pageHidden).
      changeTimer = setTimeout(
        () => report(),
        userActivityReportDelayMs({
          next: userActivityRegistry.get(userId),
          lastReportedKey: lastKey
        })
      );
    }
    function userInput(event: Event) {
      const activity = userActivityRegistry.get(userId);
      // A visible window counts even unfocused (macOS scrolls a background
      // window, and a game can report input from a side-by-side window).
      if (
        !activity ||
        document.visibilityState !== 'visible' ||
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
    // Back on the page: renew at once (the server's hidden grace held the
    // activity meanwhile). Going hidden sends nothing; the server starts the
    // grace from the page's change_away_status.
    function visibilityChanged() {
      if (document.visibilityState === 'visible') report(true);
    }
    // A page restored from the back-forward cache after pagehide cleared it.
    function pageShown(event: PageTransitionEvent) {
      if (event.persisted) report(true);
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
    const unsubscribeJoinable = socialJoinableStore.subscribe(changed);
    reportChangeRef.current = changed;
    // A hidden page does not heartbeat: its timers are throttled or
    // suspended anyway, and the server holds the lease through the grace.
    const heartbeat = setInterval(() => {
      if (
        userActivityRegistry.get(userId) &&
        document.visibilityState === 'visible'
      )
        report(true);
    }, 25_000);
    window.addEventListener('pointerdown', userInput, true);
    window.addEventListener('keydown', userInput, true);
    window.addEventListener('wheel', userInput, {
      capture: true,
      passive: true
    });
    window.addEventListener(USER_ACTIVITY_INPUT_EVENT, userInput);
    window.addEventListener('pagehide', pageHidden);
    window.addEventListener('pageshow', pageShown);
    window.addEventListener(TWINKLE_SOCKET_AUTH_READY_EVENT, foregroundChanged);
    document.addEventListener('visibilitychange', visibilityChanged);
    socket.on('online_acknowledged', foregroundChanged);
    socket.on('disconnect', disconnected);
    report(true);
    return () => {
      pageHidden();
      stopped = true;
      unsubscribe();
      unsubscribeJoinable();
      reportChangeRef.current = () => {};
      clearInterval(heartbeat);
      clearTimeout(retry);
      clearTimeout(changeTimer);
      window.removeEventListener('pointerdown', userInput, true);
      window.removeEventListener('keydown', userInput, true);
      window.removeEventListener('wheel', userInput, true);
      window.removeEventListener(USER_ACTIVITY_INPUT_EVENT, userInput);
      window.removeEventListener('pagehide', pageHidden);
      window.removeEventListener('pageshow', pageShown);
      window.removeEventListener(
        TWINKLE_SOCKET_AUTH_READY_EVENT,
        foregroundChanged
      );
      document.removeEventListener('visibilitychange', visibilityChanged);
      socket.off('online_acknowledged', foregroundChanged);
      socket.off('disconnect', disconnected);
    };
  }, [userId]);
}
