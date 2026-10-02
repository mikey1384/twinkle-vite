import { useEffect, useRef } from 'react';
import { useChatContext, useKeyContext } from '~/contexts';
import { socket } from '~/constants/sockets/api';
import { TWINKLE_SOCKET_AUTH_READY_EVENT } from '~/constants/socketEvents';
import {
  isSocketAuthReadyForUser,
  SOCKET_BIND_ACK_TIMEOUT_MS
} from '~/helpers/socketAuthReady';
import { getNextUserActivityRefreshAt } from '~/helpers/userActivity';

const RETRY_DELAY_MS = 15_000;

export default function useUserActivityRefresh() {
  const userId = useKeyContext((v) => v.myState.userId);
  const nextRefreshAt = useChatContext((v) =>
    getNextUserActivityRefreshAt(v.state.chatStatus)
  );
  const onSetOnlinePresenceSnapshot = useChatContext(
    (v) => v.actions.onSetOnlinePresenceSnapshot
  );
  const nextRefreshAtRef = useRef(nextRefreshAt);
  const scheduleRef = useRef<() => void>(() => {});
  nextRefreshAtRef.current = nextRefreshAt;

  useEffect(() => {
    if (!userId) return;
    let stopped = false;
    let inFlight = false;
    let revision = 0;
    let notBefore = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    function canRefresh() {
      return (
        !stopped &&
        document.visibilityState === 'visible' &&
        document.hasFocus() &&
        isSocketAuthReadyForUser(userId)
      );
    }

    function schedule() {
      clearTimeout(timer);
      timer = undefined;
      const refreshAt = nextRefreshAtRef.current;
      if (!refreshAt || inFlight || !canRefresh()) return;
      timer = setTimeout(
        refresh,
        Math.max(0, refreshAt - Date.now(), notBefore - Date.now())
      );
    }

    function refresh() {
      timer = undefined;
      if (inFlight || !canRefresh()) return;
      const refreshAt = nextRefreshAtRef.current;
      if (!refreshAt) return;
      if (Date.now() < Math.max(refreshAt, notBefore)) {
        schedule();
        return;
      }

      inFlight = true;
      const requestRevision = ++revision;
      const socketId = socket.id;
      const requestedAt = Date.now();
      socket
        .timeout(SOCKET_BIND_ACK_TIMEOUT_MS)
        .emit('check_user_activity', (error: any, response: any) => {
          if (stopped || requestRevision !== revision) return;
          inFlight = false;
          notBefore = Date.now() + RETRY_DELAY_MS;
          if (
            !error &&
            socket.id === socketId &&
            isSocketAuthReadyForUser(userId) &&
            response?.onlineUsers &&
            typeof response.onlineUsers === 'object' &&
            !Array.isArray(response.onlineUsers)
          ) {
            onSetOnlinePresenceSnapshot({
              onlineUsers: response.onlineUsers,
              isComplete: response.isComplete === true,
              requestedAt
            });
          }
          // Failed/incomplete reads preserve the known state and retry with a
          // bounded delay. Fresh events or snapshots cancel obsolete timers.
          schedule();
        });
    }

    function disconnected() {
      revision++;
      inFlight = false;
      clearTimeout(timer);
      timer = undefined;
    }

    scheduleRef.current = schedule;
    window.addEventListener('focus', schedule);
    window.addEventListener('blur', schedule);
    window.addEventListener('pageshow', schedule);
    window.addEventListener(TWINKLE_SOCKET_AUTH_READY_EVENT, schedule);
    document.addEventListener('visibilitychange', schedule);
    socket.on('disconnect', disconnected);
    schedule();
    return () => {
      stopped = true;
      revision++;
      clearTimeout(timer);
      scheduleRef.current = () => {};
      window.removeEventListener('focus', schedule);
      window.removeEventListener('blur', schedule);
      window.removeEventListener('pageshow', schedule);
      window.removeEventListener(TWINKLE_SOCKET_AUTH_READY_EVENT, schedule);
      document.removeEventListener('visibilitychange', schedule);
      socket.off('disconnect', disconnected);
    };
    // Context actions are stable; the timer reads changing eligibility through
    // refs and canonical socket/browser state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    scheduleRef.current();
  }, [nextRefreshAt]);
}
