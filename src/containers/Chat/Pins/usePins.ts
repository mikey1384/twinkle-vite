import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppContext, useKeyContext } from '~/contexts';
import { useToast } from '~/contexts/Toast';
import { socket } from '~/constants/sockets/api';
import {
  mergePinPage,
  type ChatPinHistory,
  type ChatPinScope,
  type ChatPinSnapshot
} from '~/helpers/chatPins';
import type { ChatPinsController } from './context';

export default function usePins(scope: ChatPinScope): ChatPinsController {
  const userId = useKeyContext((v) => v.myState.userId);
  const loadChatPins = useAppContext((v) => v.requestHelpers.loadChatPins);
  const updateChatPin = useAppContext((v) => v.requestHelpers.updateChatPin);
  const loadChatPinContext = useAppContext(
    (v) => v.requestHelpers.loadChatPinContext
  );
  const loadChatMessage = useAppContext(
    (v) => v.requestHelpers.loadChatMessage
  );
  const toast = useToast();
  const scopeKey = `${userId}:${scope.channelId}:${scope.subchannelId}:${scope.topicId}`;
  const [controllerScope, setControllerScope] = useState(scopeKey);
  const [snapshot, setSnapshot] = useState<ChatPinSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [dialogShown, setDialogShown] = useState(false);
  const [history, setHistory] = useState<ChatPinHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [highlightId, setHighlightId] = useState(0);
  const alive = useRef(true);
  const reading = useRef(0);
  const historyRequest = useRef(0);
  const historyRevision = useRef(0);
  const messageReads = useRef(new Map<number, number>());
  const pending = useRef(false);
  const paging = useRef(false);
  const snapshotRef = useRef(snapshot);
  const historyRef = useRef(history);
  const scopeRef = useRef(scopeKey);
  scopeRef.current = scopeKey;
  snapshotRef.current = snapshot;
  historyRef.current = history;

  useEffect(() => {
    alive.current = true;
    void refresh();
    function invalidate(event: { channelId: number }) {
      if (Number(event.channelId) === scope.channelId) void refresh();
    }
    function topicChanged(event: { channelId: number }) {
      if (Number(event.channelId) !== scope.channelId) return;
      historyRequest.current++;
      setHistory(null);
      setHistoryLoading(false);
      void refresh();
    }
    function messageDeleted(event: { channelId: number; messageId: number }) {
      if (Number(event.channelId) !== scope.channelId) return;
      historyRevision.current++;
      // Invalidate any in-flight hydration for this deleted message as well.
      const messageId = Number(event.messageId);
      messageReads.current.set(
        messageId,
        (messageReads.current.get(messageId) || 0) + 1
      );
      void refresh();
      setHistory(
        (current) =>
          current &&
          (Number(current.messageId) === Number(event.messageId)
            ? null
            : {
                ...current,
                messages: current.messages.filter(
                  (row) => Number(row.id) !== Number(event.messageId)
                )
              })
      );
    }
    function messageChanged(event: { channelId: number; messageId: number }) {
      if (Number(event.channelId) !== scope.channelId) return;
      historyRevision.current++;
      if (
        snapshotRef.current?.pinnedMessageIds.includes(Number(event.messageId))
      )
        void refresh();
      if (
        historyRef.current?.messages.some(
          (message) => Number(message.id) === Number(event.messageId)
        )
      ) {
        const version = historyRequest.current;
        const messageId = Number(event.messageId);
        const read = (messageReads.current.get(messageId) || 0) + 1;
        messageReads.current.set(messageId, read);
        loadChatMessage({ messageId: event.messageId, fromWriter: true })
          .then((message: any) => {
            if (
              !isCurrentScope() ||
              version !== historyRequest.current ||
              messageReads.current.get(messageId) !== read
            )
              return;
            setHistory(
              (current) =>
                current && {
                  ...current,
                  messages: current.messages.map((row) =>
                    Number(row.id) === Number(event.messageId)
                      ? { ...message, isLoaded: true }
                      : row
                  )
                }
            );
          })
          .catch(() => {
            /* Keep the last confirmed message on a failed read. */
          });
      }
    }
    function reconnect() {
      historyRevision.current++;
      void refresh();
      // Re-read the original context after a gap in socket events. Deleted or
      // hidden messages must not remain visible in a detached history window.
      if (historyRef.current) void jump(historyRef.current.messageId);
    }
    function focus() {
      if (document.visibilityState === 'visible') void refresh();
    }
    socket.on('chat_message_pins_changed', invalidate);
    socket.on('human_topic_state_changed', topicChanged);
    socket.on('chat_message_edited', messageChanged);
    socket.on('chat_message_deleted', messageDeleted);
    socket.on('connect', reconnect);
    document.addEventListener('visibilitychange', focus);
    return () => {
      alive.current = false;
      // These are request sequence counters, not DOM refs. Invalidate the
      // latest requests at cleanup (including StrictMode's setup/cleanup).
      // eslint-disable-next-line react-hooks/exhaustive-deps
      reading.current++;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      historyRequest.current++;
      socket.off('chat_message_pins_changed', invalidate);
      socket.off('human_topic_state_changed', topicChanged);
      socket.off('chat_message_edited', messageChanged);
      socket.off('chat_message_deleted', messageDeleted);
      socket.off('connect', reconnect);
      document.removeEventListener('visibilitychange', focus);
    };
    // Requests are invalidated on every topic/subchannel change without
    // remounting the composer and losing the user's draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, scope.channelId, scope.subchannelId, scope.topicId]);

  useEffect(() => {
    if (!highlightId) return;
    const timer = setTimeout(() => setHighlightId(0), 3500);
    return () => clearTimeout(timer);
  }, [highlightId]);

  if (controllerScope !== scopeKey) {
    setControllerScope(scopeKey);
    setSnapshot(null);
    setLoading(true);
    setLoadingMore(false);
    setSavingId(null);
    setError('');
    setDialogShown(false);
    setHistory(null);
    setHistoryLoading(false);
    setHighlightId(0);
    reading.current++;
    historyRequest.current++;
    pending.current = false;
    paging.current = false;
    messageReads.current.clear();
  }

  return useMemo(
    () => ({
      snapshot,
      loading,
      loadingMore,
      savingId,
      error,
      dialogShown,
      history,
      historyLoading,
      highlightId,
      showDialog: () => {
        setDialogShown(true);
        void refresh();
      },
      hideDialog: () => setDialogShown(false),
      refresh,
      loadMore,
      setPin,
      jump,
      loadHistory,
      leaveHistory: () => {
        historyRequest.current++;
        setHistory(null);
        setHighlightId(0);
        setHistoryLoading(false);
      }
    }),
    // Context helpers are stable; handlers capture the state listed below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      snapshot,
      loading,
      loadingMore,
      savingId,
      error,
      dialogShown,
      history,
      historyLoading,
      highlightId,
      userId,
      scope.channelId,
      scope.subchannelId,
      scope.topicId
    ]
  );

  function isCurrentScope() {
    return alive.current && scopeRef.current === scopeKey;
  }

  async function refresh() {
    if (!scope.channelId) {
      setLoading(false);
      return;
    }
    const version = ++reading.current;
    try {
      const result = await loadChatPins(scope);
      if (!isCurrentScope() || version !== reading.current) return;
      setSnapshot((current) => mergePinPage(current, result));
      setError('');
    } catch {
      if (isCurrentScope() && version === reading.current)
        setError('Couldn’t load pinned messages. Please try again.');
    } finally {
      if (isCurrentScope() && version === reading.current) setLoading(false);
    }
  }

  async function loadMore() {
    if (paging.current || !snapshot?.nextCursor) return;
    paging.current = true;
    setLoadingMore(true);
    const version = reading.current;
    try {
      const result = await loadChatPins({
        ...scope,
        beforeId: snapshot.nextCursor
      });
      if (!isCurrentScope() || reading.current !== version) return;
      if (result.revision !== snapshot.revision) {
        await refresh();
        return;
      }
      setSnapshot((current) => mergePinPage(current, result, true));
      setError('');
    } catch {
      if (isCurrentScope())
        setError('Couldn’t load more pins. Please try again.');
    } finally {
      if (isCurrentScope()) {
        paging.current = false;
        setLoadingMore(false);
      }
    }
  }

  async function setPin(messageId: number, pinned: boolean) {
    if (pending.current || !snapshot?.canManage) return;
    pending.current = true;
    setSavingId(messageId);
    setError('');
    try {
      const result = await updateChatPin({ ...scope, messageId, pinned });
      if (!isCurrentScope()) return;
      reading.current++;
      setSnapshot((current) => mergePinPage(current, result));
      toast({ message: pinned ? 'Message pinned' : 'Message unpinned' });
    } catch (failure: any) {
      if (!isCurrentScope()) return;
      const message =
        failure?.message || 'Couldn’t update this pin. Please try again.';
      toast({ message });
      // A lost write response has an unknown outcome. Only a writer read can
      // determine whether it committed; never toggle locally on failure.
      await refresh();
    } finally {
      if (isCurrentScope()) {
        pending.current = false;
        setSavingId(null);
      }
    }
  }

  async function jump(messageId: number) {
    const version = ++historyRequest.current;
    setHistoryLoading(true);
    setError('');
    try {
      const result = await readHistoryContext({ ...scope, messageId }, version);
      if (!result) return;
      setHistory({ ...result, jumpKey: version });
      setHighlightId(messageId);
      setDialogShown(false);
    } catch {
      if (isCurrentScope() && version === historyRequest.current) {
        setHistory(null);
        setHighlightId(0);
        toast({
          message: 'Couldn’t open this message. It may have been removed.'
        });
        void refresh();
      }
    } finally {
      if (isCurrentScope() && version === historyRequest.current)
        setHistoryLoading(false);
    }
  }

  async function loadHistory(direction: 'older' | 'newer') {
    if (!history || historyLoading) return;
    const version = ++historyRequest.current;
    setHistoryLoading(true);
    const cursor =
      direction === 'older'
        ? history.messages[history.messages.length - 1]?.id
        : history.messages[0]?.id;
    try {
      const result = await readHistoryContext(
        {
          ...scope,
          messageId: history.messageId,
          cursor,
          direction
        },
        version
      );
      if (!result) return;
      setHistory(
        (current) =>
          current && {
            ...current,
            messages: [
              ...new Map(
                [...current.messages, ...result.messages].map((message) => [
                  message.id,
                  message
                ])
              ).values()
            ].sort((a, b) => b.id - a.id),
            ...(direction === 'older'
              ? { hasOlder: result.hasOlder }
              : { hasNewer: result.hasNewer })
          }
      );
    } catch {
      if (isCurrentScope())
        toast({ message: 'Couldn’t load more messages. Please try again.' });
    } finally {
      if (isCurrentScope() && version === historyRequest.current)
        setHistoryLoading(false);
    }
  }

  async function readHistoryContext(
    input: Parameters<typeof loadChatPinContext>[0],
    version: number
  ) {
    // If an edit/deletion arrived while this query was in flight, retry from
    // the writer before using it. Never resurrect an older message snapshot.
    for (let attempt = 0; attempt < 3; attempt++) {
      const revision = historyRevision.current;
      const result = await loadChatPinContext(input);
      if (!isCurrentScope() || version !== historyRequest.current) return null;
      if (revision === historyRevision.current) return result;
    }
    throw new Error('Chat changed while loading messages');
  }
}
