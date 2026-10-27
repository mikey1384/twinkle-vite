import { useEffect, useRef, useState } from 'react';
import { socket } from '~/constants/sockets/api';
import { useAppContext } from '~/contexts';
import {
  mergeSharedMedia,
  type SharedMediaPage,
  type SharedMediaQuery
} from '~/helpers/chatSharedMedia';

const emptyPage: SharedMediaPage = { items: [], nextCursor: null };

export default function useSharedMedia(query: SharedMediaQuery) {
  const load = useAppContext((v) => v.requestHelpers.loadChatSharedMedia);
  const key = `${query.channelId}:${query.topicId || 0}:${query.kind || 'all'}`;
  const [state, setState] = useState({
    key,
    page: emptyPage,
    loading: true,
    error: ''
  });
  const [revision, setRevision] = useState(0);
  const currentKey = useRef(key);
  currentKey.current = key;
  const request = useRef(0);
  const visibilityVersion = useRef(0);
  const busy = useRef(false);
  const alive = useRef(false);

  useEffect(() => {
    alive.current = true;
    void refresh();
    let timer: ReturnType<typeof setTimeout>;
    function changed(event: any) {
      const channelId = Number(
        event.channelId || event.channel?.id || event.message?.channelId
      );
      if (channelId !== query.channelId) return;
      // Hide old snapshots immediately and invalidate reads already in flight.
      request.current++;
      busy.current = false;
      setState({ key, page: emptyPage, loading: true, error: '' });
      visibilityVersion.current++;
      setRevision((value) => value + 1);
      clearTimeout(timer);
      timer = setTimeout(() => void refresh(), 200);
    }
    function received(event: any) {
      if (
        !event.message?.fileName ||
        Number(
          event.channelId || event.channel?.id || event.message.channelId
        ) !== query.channelId
      )
        return;
      clearTimeout(timer);
      timer = setTimeout(() => void refresh(true), 200);
    }
    function focus() {
      if (document.visibilityState === 'visible') void refresh();
    }
    const events = [
      'chat_message_deleted',
      'hide_message_attachment',
      'chat_message_edited',
      'chat_attachment_thumbnail_updated',
      'human_topic_state_changed'
    ];
    for (const name of events) socket.on(name, changed);
    socket.on('new_message_received', received);
    socket.on('connect', refresh);
    window.addEventListener('focus', focus);
    document.addEventListener('visibilitychange', focus);
    return () => {
      alive.current = false;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      request.current++;
      clearTimeout(timer);
      for (const name of events) socket.off(name, changed);
      socket.off('new_message_received', received);
      socket.off('connect', refresh);
      window.removeEventListener('focus', focus);
      document.removeEventListener('visibilitychange', focus);
    };
    // Request helpers are stable; the filter identity owns every async read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return {
    ...(state.key === key
      ? state
      : { key, page: emptyPage, loading: true, error: '' }),
    revision,
    getVersion: () => visibilityVersion.current,
    refresh,
    loadMore: () => read(true)
  };

  async function refresh(preserve = false) {
    request.current++;
    busy.current = false;
    if (!preserve) {
      visibilityVersion.current++;
      setRevision((value) => value + 1);
    }
    return read(false, preserve);
  }

  async function read(append: boolean, prepend = false) {
    if (append && (busy.current || state.key !== key || !state.page.nextCursor))
      return;
    const version = ++request.current;
    busy.current = true;
    setState((current) => ({
      key,
      page:
        (append || prepend) && current.key === key ? current.page : emptyPage,
      loading: true,
      error: ''
    }));
    try {
      const page: SharedMediaPage = await load({
        ...query,
        ...(append ? { beforeId: state.page.nextCursor! } : {})
      });
      if (
        !alive.current ||
        currentKey.current !== key ||
        request.current !== version
      )
        return;
      setState((current) => {
        // Keep older pages only when the new head overlaps them. A burst
        // larger than one page otherwise leaves an invisible gap and an old
        // cursor that can never reach the uploads inside that gap.
        const overlaps =
          prepend &&
          page.items.some((item) =>
            current.page.items.some((existing) => existing.id === item.id)
          );
        return {
          key,
          page: append
            ? mergeSharedMedia(current.page, page)
            : overlaps
              ? {
                  ...mergeSharedMedia(current.page, page),
                  nextCursor: current.page.nextCursor
                }
              : page,
          loading: false,
          error: ''
        };
      });
    } catch {
      if (
        !alive.current ||
        currentKey.current !== key ||
        request.current !== version
      )
        return;
      setState((current) => ({
        ...current,
        loading: false,
        error: 'Couldn’t load attachments. Please try again.'
      }));
    } finally {
      if (request.current === version) busy.current = false;
    }
  }
}
