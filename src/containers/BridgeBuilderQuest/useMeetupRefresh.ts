import { useEffect, useRef } from 'react';
import { socket } from '~/constants/sockets/api';

// An open crew page must pick up staff/CLI decisions. Read canonical state on
// chat activity, return to the tab, and periodically while visible. No form
// state or approval is changed locally. Every listener/timer is scoped here.
export default function useMeetupRefresh({
  enabled, channelId, refresh
}: {
  enabled: boolean;
  channelId?: number;
  refresh: () => Promise<unknown>;
}) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let running = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const reload = async () => {
      if (!active || running || document.visibilityState === 'hidden') return;
      running = true;
      try {
        await refreshRef.current();
      } catch {
        // Keep the last canonical view during a temporary network failure.
      } finally {
        running = false;
      }
    };
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(reload, 250);
    };
    const onMessage = (data: { channel?: { id?: number } }) => {
      if (channelId && Number(data?.channel?.id) === channelId) schedule();
    };
    const interval = setInterval(reload, 30_000);
    window.addEventListener('focus', schedule);
    document.addEventListener('visibilitychange', schedule);
    socket.on('new_chat_message', onMessage);
    return () => {
      active = false;
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener('focus', schedule);
      document.removeEventListener('visibilitychange', schedule);
      socket.off('new_chat_message', onMessage);
    };
  }, [enabled, channelId]);
}
