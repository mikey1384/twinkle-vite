import { useEffect, useRef, useState } from 'react';
import { socket } from '~/constants/sockets/api';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import {
  mergeSharedMedia,
  refreshSharedMediaPage,
  sharedMediaEventChannel,
  sharedMediaInvalidationEvents,
  type SharedMediaCacheEntry,
  type SharedMediaPage,
  type SharedMediaQuery
} from '~/helpers/chatSharedMedia';

const emptyPage: SharedMediaPage = { items: [], nextCursor: null };
const freshnessMs = 60_000;

export default function useSharedMedia(query: SharedMediaQuery) {
  const load = useAppContext((v) => v.requestHelpers.loadChatSharedMedia);
  const cachePage = useChatContext((v) => v.actions.onCacheChatSharedMedia);
  const userId = useKeyContext((v) => v.myState.userId);
  const key = `${userId}:${query.channelId}:${query.topicId || 0}:${query.kind || 'all'}`;
  const cached = useChatContext(
    (v) => v.state.sharedMediaByKey?.[key]
  ) as SharedMediaCacheEntry | undefined;
  const [state, setState] = useState({ key, loading: !cached, error: '' });
  const [revision, setRevision] = useState(0);
  const currentKey = useRef(key);
  currentKey.current = key;
  const cache = useRef(cached);
  cache.current = cached;
  const request = useRef(0);
  const visibilityVersion = useRef(0);
  const lastAttempt = useRef(0);
  const busy = useRef(false);
  const alive = useRef(false);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  useEffect(() => {
    alive.current = true;
    busy.current = false;
    lastAttempt.current = 0;
    if (!cache.current || Date.now() - cache.current.checkedAt >= freshnessMs) {
      void read(false);
    } else {
      setState({ key, loading: false, error: '' });
    }
    function invalidate() {
      // The provider clears every affected cached filter. Invalidate local
      // reads synchronously too, including detail/download actions in flight.
      request.current++;
      busy.current = false;
      cache.current = undefined;
      setState({ key, loading: true, error: '' });
      visibilityVersion.current++;
      setRevision((value) => value + 1);
      clearTimeout(refreshTimer.current);
      refreshTimer.current = undefined;
    }
    function changed(event: any) {
      if (sharedMediaEventChannel(event) !== query.channelId) return;
      invalidate();
      refreshTimer.current = setTimeout(() => {
        refreshTimer.current = undefined;
        void read(false);
      }, 200);
    }
    function received(event: any) {
      if (
        !event.message?.fileName ||
        sharedMediaEventChannel(event) !== query.channelId
      )
        return;
      clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => {
        refreshTimer.current = undefined;
        void refresh();
      }, 200);
    }
    function reconnect() {
      invalidate();
      void read(false);
    }
    function focus() {
      if (
        document.visibilityState !== 'visible' ||
        busy.current ||
        Date.now() -
          Math.max(cache.current?.checkedAt || 0, lastAttempt.current) <
          freshnessMs
      )
        return;
      // Focus and visibilitychange commonly arrive together. Reuse fresh
      // pages, coalesce the request, and keep content/preview while checking.
      void read(false);
    }
    for (const name of sharedMediaInvalidationEvents) socket.on(name, changed);
    socket.on('new_message_received', received);
    socket.on('connect', reconnect);
    window.addEventListener('focus', focus);
    document.addEventListener('visibilitychange', focus);
    return () => {
      alive.current = false;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      request.current++;
      clearTimeout(refreshTimer.current);
      refreshTimer.current = undefined;
      for (const name of sharedMediaInvalidationEvents) socket.off(name, changed);
      socket.off('new_message_received', received);
      socket.off('connect', reconnect);
      window.removeEventListener('focus', focus);
      document.removeEventListener('visibilitychange', focus);
    };
    // Request helpers are stable; the account/channel/filter owns async reads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    // A channel can be invalidated in the same render that mounts its sidebar.
    // The context selector may deliver that invalidation after the mount
    // effect, so observing only the query key would leave an empty list stuck.
    if (
      alive.current &&
      !busy.current &&
      !refreshTimer.current &&
      (!cached || !cached.checkedAt)
    )
      void read(false);
    // The cache identity owns this reconciliation; request helpers are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, cached]);

  return {
    ...(state.key === key ? state : { key, loading: !cached, error: '' }),
    page: cached?.page || emptyPage,
    revision,
    getVersion: () => visibilityVersion.current,
    refresh,
    loadMore: () => read(true)
  };

  async function refresh() {
    // Explicit retry or an upload supersedes an older read without discarding
    // confirmed pages or closing an unrelated attachment preview.
    request.current++;
    busy.current = false;
    return read(false);
  }

  async function read(append: boolean) {
    if (busy.current || (append && !cache.current?.page.nextCursor)) return;
    const version = ++request.current;
    busy.current = true;
    if (!append) lastAttempt.current = Date.now();
    // A confirmed page, including an empty one, stays settled during a head
    // recheck. Show loading only for a first page or requested older results.
    setState({ key, loading: append || !cache.current, error: '' });
    try {
      const page: SharedMediaPage = await load({
        ...query,
        ...(append ? { beforeId: cache.current!.page.nextCursor! } : {})
      });
      if (
        !alive.current ||
        currentKey.current !== key ||
        request.current !== version
      )
        return;
      const previous = cache.current;
      if (
        previous &&
        !append &&
        previous.page.items.some(
          (item) =>
            (!page.nextCursor || item.id >= page.nextCursor) &&
            !page.items.some((fresh) => fresh.id === item.id)
        )
      ) {
        // A foreground check may discover a removal whose socket event was
        // missed. Do not leave an old preview or pending detail action alive.
        visibilityVersion.current++;
        setRevision((value) => value + 1);
      }
      const entry: SharedMediaCacheEntry = {
        channelId: query.channelId,
        page: !previous
          ? page
          : append
            ? mergeSharedMedia(previous.page, page)
            : refreshSharedMediaPage(previous.page, page),
        // An older-page read does not make the head any fresher.
        checkedAt: append && previous ? previous.checkedAt : Date.now()
      };
      cache.current = entry;
      cachePage(key, entry);
      setState({ key, loading: false, error: '' });
    } catch {
      if (
        !alive.current ||
        currentKey.current !== key ||
        request.current !== version
      )
        return;
      setState({
        key,
        loading: false,
        error: 'Couldn’t load attachments. Please try again.'
      });
    } finally {
      if (request.current === version) busy.current = false;
    }
  }
}
