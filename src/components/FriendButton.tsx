import React, { useEffect, useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext, useKeyContext } from '~/contexts';
import { Color } from '~/constants/css';

export type FriendState = 'none' | 'requested' | 'incoming' | 'friends';

const LABEL: Record<FriendState, string> = {
  none: 'Add friend',
  requested: 'Requested',
  incoming: 'Accept friend request',
  friends: 'Friends'
};

// A screen that was not served the status asks once; a request already in
// flight is shared, and only a real answer is remembered (a failure never
// becomes "no button").
const STATUS_TTL_MS = 30_000;
const statusMemo = new Map<number, { at: number; promise: Promise<any> }>();

// A simple friend link between two members: one button, no feeds. It only
// shows for people you have already talked with (the server decides). Two
// people are friends when both added each other. `variant` is the look:
// 'panel' (profile card) or 'popup' (the hover card on a username).
// The state comes with the profile itself (friendStatus, served with /user and
// the Users page's cards), so the button normally asks for nothing.
export default function FriendButton({
  userId,
  variant,
  buttonProps,
  initialState,
  onChange
}: {
  userId: number;
  variant: 'panel' | 'popup';
  // the host's own button look (so it matches its neighbours)
  buttonProps?: Record<string, any>;
  // a list that already knows the state (the Friends page) skips the lookup
  initialState?: FriendState;
  // told after an add/remove succeeds (the Friends page re-sorts its lists)
  onChange?: (state: FriendState) => void;
}) {
  const myId = useKeyContext((v) => v.myState.userId);
  const loadFriendStatus = useAppContext((v) => v.requestHelpers.loadFriendStatus);
  const addFriend = useAppContext((v) => v.requestHelpers.addFriend);
  const removeFriend = useAppContext((v) => v.requestHelpers.removeFriend);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const served = useAppContext(
    (v) => v.user.state.userObj[userId]?.friendStatus
  ) as { eligible: boolean; state: FriendState } | undefined;
  const [fetched, setFetched] = useState<{ eligible: boolean; state: FriendState } | null>(null);
  const status = initialState
    ? { eligible: true, state: initialState }
    : served || fetched;
  const [busy, setBusy] = useState(false);
  // undoing (cancel a request / unfriend) takes a second tap
  const [confirming, setConfirming] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!myId || !userId || userId === myId || initialState || served) return;
    let active = true;
    setFetched(null);
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
        if (active && data && typeof data.eligible === 'boolean') setFetched(data);
      })
      .catch(() => null);
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId, userId, initialState, Boolean(served)]);

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
      // undoing is destructive: confirm against the live state first. A status
      // served earlier can be stale (they accepted meanwhile), and the second
      // tap would then end a friendship instead of cancelling a request.
      setBusy(true);
      let live = status;
      try {
        live = await loadFriendStatus(userId);
      } catch {
        live = status;
      } finally {
        setBusy(false);
      }
      if (live && typeof live.eligible === 'boolean' && live.state !== state) {
        statusMemo.set(userId, { at: Date.now(), promise: Promise.resolve(live) });
        setFetched(live);
        onSetUserState({ userId, newState: { friendStatus: live } });
        // a list that knew the old state (the Friends page) re-sorts itself
        onChange?.(live.state);
        return;
      }
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
      setFetched(next);
      // every panel and hover card showing this person agrees at once
      if (next && typeof next.eligible === 'boolean') {
        onSetUserState({ userId, newState: { friendStatus: next } });
      }
      if (next?.state) onChange?.(next.state);
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
