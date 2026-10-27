import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '~/contexts';
import { useChatPins } from '../Pins/context';
import Panel from './Panel';
import Browser from './Browser';
import AttachmentDialog from './AttachmentDialog';
import useSharedMedia from './useSharedMedia';
import {
  sharedAttachmentPath,
  type SharedAttachment,
  type SharedMediaKind
} from '~/helpers/chatSharedMedia';

export default function SharedMedia({
  channelId,
  channelPath,
  channelName,
  currentTopic
}: {
  channelId: number;
  channelPath: string;
  channelName: string;
  currentTopic?: { id: number; title: string };
}) {
  const readItem = useAppContext(
    (v) => v.requestHelpers.loadChatSharedMediaItem
  );
  const pins = useChatPins();
  const navigate = useNavigate();
  const location = useLocation();
  const pendingJump = useRef<{ item: SharedAttachment; path: string } | null>(
    null
  );
  const [shown, setShown] = useState(false);
  const [kind, setKind] = useState<SharedMediaKind>('all');
  const [topicId, setTopicId] = useState(0);
  const [selected, setSelected] = useState<SharedAttachment | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [action, setAction] = useState('');
  const [error, setError] = useState('');
  const media = useSharedMedia({ channelId, kind, topicId });
  const actionRequest = useRef(0);
  const busy = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    // Reconnect, deletion, a hidden attachment or a new filter invalidates
    // both the browser and an already-open preview.
    actionRequest.current++;
    busy.current = false;
    setSelected(null);
    setPendingId(null);
    setAction('');
    setError('');
  }, [media.revision, kind, topicId]);
  useEffect(() => {
    setTopicId(0);
  }, [currentTopic?.id]);

  useEffect(() => {
    const pending = pendingJump.current;
    if (!pending) return;
    if (location.pathname !== pending.path) {
      pendingJump.current = null;
      return;
    }
    // Let normal routing align the header and reply destination before
    // opening older history. The existing composer keeps the draft.
    if (
      pins?.snapshot?.channelId === channelId &&
      pins.snapshot.topicId === pending.item.topicId &&
      pins.snapshot.subchannelId === pending.item.subchannelId
    ) {
      pendingJump.current = null;
      void pins.jump(pending.item.id);
    }
  }, [location.pathname, pins, channelId]);

  return (
    <>
      <Panel
        items={media.page.items}
        loading={media.loading}
        error={media.error}
        onSelect={select}
        onOpen={open}
        autoFill={!shown && !selected}
        nextCursor={media.page.nextCursor}
        onNeedMore={media.loadMore}
      />
      {error && !shown && !selected && (
        <p
          role="alert"
          className={css`
            margin: 8px;
            font-size: 1.1rem;
            color: #a33f39;
          `}
        >
          {error}
        </p>
      )}
      {shown && (
        <Browser
          channelName={channelName}
          page={media.page}
          loading={media.loading}
          error={error || media.error}
          kind={kind}
          topicId={topicId}
          currentTopic={currentTopic?.id ? currentTopic : undefined}
          pendingId={pendingId}
          onKind={setKind}
          onTopic={setTopicId}
          onSelect={select}
          onClose={close}
          onMore={media.loadMore}
          onRetry={() => {
            setError('');
            void media.refresh();
          }}
        />
      )}
      {selected && (
        <AttachmentDialog
          item={selected}
          action={action}
          error={error}
          onClose={() => {
            actionRequest.current++;
            busy.current = false;
            setSelected(null);
            setAction('');
            setError('');
          }}
          onDownload={() => runAction('download')}
          onJump={pins ? () => runAction('jump') : undefined}
        />
      )}
    </>
  );

  function open(nextKind: SharedMediaKind) {
    pendingJump.current = null;
    setError('');
    setKind(nextKind);
    setShown(true);
    if (media.error) void media.refresh();
  }
  function close() {
    actionRequest.current++;
    busy.current = false;
    setShown(false);
    setKind('all');
    setTopicId(0);
    setError('');
    setPendingId(null);
    setAction('');
  }
  async function select(item: SharedAttachment) {
    if (busy.current) return;
    busy.current = true;
    const version = ++actionRequest.current;
    const mediaVersion = media.getVersion();
    setPendingId(item.id);
    setError('');
    try {
      const fresh = await readItem({ channelId, messageId: item.id });
      if (
        !mounted.current ||
        version !== actionRequest.current ||
        mediaVersion !== media.getVersion()
      )
        return;
      setSelected(fresh);
    } catch {
      if (mounted.current && version === actionRequest.current)
        setError('Couldn’t open this attachment. It may have been removed.');
    } finally {
      if (mounted.current && version === actionRequest.current) {
        busy.current = false;
        setPendingId(null);
      }
    }
  }
  async function runAction(nextAction: 'download' | 'jump') {
    if (!selected || busy.current) return;
    busy.current = true;
    const version = ++actionRequest.current;
    const mediaVersion = media.getVersion();
    setAction(nextAction);
    setError('');
    try {
      const fresh = await readItem({
        channelId,
        messageId: selected.id,
        download: nextAction === 'download'
      });
      if (
        !mounted.current ||
        version !== actionRequest.current ||
        mediaVersion !== media.getVersion()
      )
        return;
      if (nextAction === 'download') {
        if (!fresh.downloadUrl) throw new Error('No download URL');
        const link = document.createElement('a');
        link.href = fresh.downloadUrl;
        link.download = fresh.name;
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else if (pins) {
        const path = sharedAttachmentPath(channelPath, fresh);
        if (!path)
          throw new Error('The original conversation is no longer available');
        setSelected(null);
        close();
        if (
          location.pathname === path &&
          pins.snapshot?.topicId === fresh.topicId &&
          pins.snapshot?.subchannelId === fresh.subchannelId
        ) {
          void pins.jump(fresh.id);
        } else {
          pendingJump.current = { item: fresh, path };
          navigate(path);
        }
      }
    } catch {
      if (mounted.current && version === actionRequest.current)
        setError(
          'Couldn’t open this attachment. It may have been removed. Please try again.'
        );
    } finally {
      if (mounted.current && version === actionRequest.current) {
        busy.current = false;
        setAction('');
      }
    }
  }
}
