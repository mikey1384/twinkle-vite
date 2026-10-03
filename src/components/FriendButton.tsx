import React, { useEffect, useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext, useKeyContext } from '~/contexts';
import { Color } from '~/constants/css';

type FriendState = 'none' | 'requested' | 'incoming' | 'friends';

const LABEL: Record<FriendState, string> = {
  none: 'Add friend',
  requested: 'Requested',
  incoming: 'Accept friend request',
  friends: 'Friends'
};

// Hovering a username asks for the same person again and again: answers are
// remembered briefly and a request already in flight is shared.
const STATUS_TTL_MS = 30_000;
const statusMemo = new Map<number, { at: number; promise: Promise<any> }>();

// A simple friend link between two members: one button, no feeds. It only
// shows for people you have already talked with (the server decides). Two
// people are friends when both added each other. `variant` is the look:
// 'panel' (profile card) or 'popup' (the hover card on a username).
export default function FriendButton({
  userId,
  variant,
  buttonProps
}: {
  userId: number;
  variant: 'panel' | 'popup';
  // the host's own button look (so it matches its neighbours)
  buttonProps?: Record<string, any>;
}) {
  const myId = useKeyContext((v) => v.myState.userId);
  const loadFriendStatus = useAppContext((v) => v.requestHelpers.loadFriendStatus);
  const addFriend = useAppContext((v) => v.requestHelpers.addFriend);
  const removeFriend = useAppContext((v) => v.requestHelpers.removeFriend);
  const [status, setStatus] = useState<{ eligible: boolean; state: FriendState } | null>(null);
  const [busy, setBusy] = useState(false);
  // undoing (cancel a request / unfriend) takes a second tap
  const [confirming, setConfirming] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!myId || !userId || userId === myId) return;
    let active = true;
    setStatus(null);
    const memo = statusMemo.get(userId);
    const promise =
      memo && Date.now() - memo.at < STATUS_TTL_MS
        ? memo.promise
        : loadFriendStatus(userId);
    if (!memo || promise !== memo.promise) {
      statusMemo.set(userId, { at: Date.now(), promise });
      promise.catch(() => statusMemo.delete(userId));
    }
    promise
      .then((data: any) => {
        if (active) setStatus(data);
      })
      .catch(() => null);
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId, userId]);

  if (!myId || userId === myId || !status?.eligible) return null;
  const state = status.state;
  const icon = state === 'friends' ? 'user-check' : state === 'requested' ? 'clock' : 'user-plus';
  const label = confirming
    ? state === 'friends'
      ? 'Unfriend?'
      : 'Cancel request?'
    : LABEL[state];

  async function handleClick() {
    if (busy) return;
    if ((state === 'friends' || state === 'requested') && !confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3500);
      return;
    }
    setConfirming(false);
    setNote('');
    setBusy(true);
    try {
      const next =
        state === 'none' || state === 'incoming'
          ? await addFriend(userId)
          : await removeFriend(userId);
      statusMemo.set(userId, { at: Date.now(), promise: Promise.resolve(next) });
      setStatus(next);
    } catch (err: any) {
      // keep the current state and say why (daily limit, not someone you know...)
      setNote(String(err?.message || 'Could not do that.'));
      setTimeout(() => setNote(''), 5000);
    } finally {
      setBusy(false);
    }
  }

  if (variant === 'popup') {
    return (
      <div
        role="button"
        tabIndex={0}
        title={note || undefined}
        style={{
          color: state === 'friends' ? Color.green() : Color.darkerGray(),
          cursor: busy ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          padding: '0.5rem',
          flexGrow: 1,
          justifyContent: 'center',
          opacity: busy ? 0.6 : 1
        }}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleClick();
        }}
      >
        <Icon icon={icon} />
        <span style={{ marginLeft: '1rem', fontSize: '1.2rem', color: note ? Color.red() : undefined }}>
          {note || label}
        </span>
      </div>
    );
  }
  return (
    <>
      <Button
        variant="soft"
        tone="raised"
        color="logoBlue"
        loading={busy}
        disabled={busy}
        {...buttonProps}
        onClick={handleClick}
      >
        <Icon icon={icon} />
        {label}
      </Button>
      {note && <span style={{ fontSize: '1.2rem', color: Color.red() }}>{note}</span>}
    </>
  );
}
