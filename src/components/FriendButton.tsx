import React, { useEffect, useRef, useState } from 'react';
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

// A simple friend link between two members: one button, no feeds. It shows on
// every other member (the server decides; never for bots or someone you blocked). Two
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
  // "Requested" and "Friends" never undo anything themselves: tapping them shows
  // a separate small "Cancel request" / "Unfriend" link, and only that link
  // undoes. Two taps on the same spot can no longer withdraw a request.
  const [showUndo, setShowUndo] = useState(false);
  const [note, setNote] = useState<{ text: string; error: boolean } | null>(
    null
  );
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownState = initialState || served?.state || fetched?.state;

  // the link belongs to the state it was opened on (another panel or tab can
  // change it meanwhile)
  useEffect(() => {
    setShowUndo(false);
  }, [shownState]);

  useEffect(
    () => () => {
      if (noteTimer.current) clearTimeout(noteTimer.current);
    },
    []
  );

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
  const label = LABEL[state];
  const undoLabel = state === 'friends' ? 'Unfriend' : 'Cancel request';
  const undoShown = showUndo && (state === 'friends' || state === 'requested');

  function showNote(text: string, error: boolean) {
    if (noteTimer.current) clearTimeout(noteTimer.current);
    setNote({ text, error });
    // long enough to read a full sentence (e.g. when the daily limit frees up)
    noteTimer.current = setTimeout(() => setNote(null), 8000);
  }

  function applyStatus(next: any) {
    statusMemo.set(userId, { at: Date.now(), promise: Promise.resolve(next) });
    setFetched(next);
    // every panel and hover card showing this person agrees at once
    if (next && typeof next.eligible === 'boolean') {
      onSetUserState({ userId, newState: { friendStatus: next } });
    }
    // a list that knew the old state (the Friends page) re-sorts itself
    if (next?.state) onChange?.(next.state);
  }

  function handleClick() {
    if (busy) return;
    if (state === 'friends' || state === 'requested') {
      setShowUndo((shown) => !shown);
      return;
    }
    handleAdd();
  }

  async function handleAdd() {
    setNote(null);
    setBusy(true);
    try {
      const next = await addFriend(userId);
      applyStatus(next);
      // the button offered an accept, but they withdrew their request before
      // this tap, so it became a request: say so rather than leave it puzzling.
      // Only then: a withdrawn request the member never saw stays private.
      if (next?.state === 'requested' && state === 'incoming') {
        showNote(
          'They withdrew their request, so we sent yours instead.',
          false
        );
      }
    } catch (err: any) {
      // keep the current state and say why (daily limit, member not found...)
      showNote(String(err?.message || 'Could not do that.'), true);
    } finally {
      setBusy(false);
    }
  }

  async function handleUndo() {
    if (busy) return;
    setShowUndo(false);
    setNote(null);
    setBusy(true);
    try {
      // check the live state first: a status served earlier can be stale (they
      // accepted meanwhile), and this would then end a friendship instead of
      // cancelling a request
      const live = await loadFriendStatus(userId).catch(() => null);
      if (!live || typeof live.eligible !== 'boolean') {
        showNote('Could not check right now. Try again in a moment.', true);
        return;
      }
      if (live.state !== state) {
        applyStatus(live);
        return;
      }
      applyStatus(await removeFriend(userId));
    } catch (err: any) {
      showNote(String(err?.message || 'Could not do that.'), true);
    } finally {
      setBusy(false);
    }
  }

  const undoLink = undoShown ? (
    <span
      role="button"
      tabIndex={0}
      style={{
        fontSize: '1.2rem',
        color: Color.darkerGray(),
        textDecoration: 'underline',
        cursor: 'pointer',
        whiteSpace: 'nowrap'
      }}
      onClick={(e) => {
        e.stopPropagation();
        handleUndo();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          handleUndo();
        }
      }}
    >
      {undoLabel}
    </span>
  ) : null;
  const noteColor = note?.error ? Color.red() : Color.darkerGray();

  if (variant === 'popup') {
    return (
      <>
        <div
          role="button"
          tabIndex={0}
          title={note?.text || undefined}
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
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick();
            }
          }}
        >
          <Icon icon={icon} />
          <span
            style={{
              marginLeft: '1rem',
              fontSize: '1.2rem',
              color: note ? noteColor : undefined,
              // a full-sentence note wraps instead of pushing past the row on phones
              maxWidth: note ? '18rem' : undefined,
              whiteSpace: note ? 'normal' : undefined,
              lineHeight: note ? 1.3 : undefined
            }}
          >
            {note?.text || label}
          </span>
        </div>
        {/* a sibling, never inside the row's own button */}
        {undoLink && (
          <span style={{ alignSelf: 'center', padding: '0 0.8rem' }}>
            {undoLink}
          </span>
        )}
      </>
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
      {(undoLink || note) && (
        // its own full-width line under the button row, so the neighbouring
        // buttons never shift or wrap around it
        <span
          style={{
            display: 'flex',
            flexBasis: '100%',
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          {undoLink}
          {note && (
            <span style={{ fontSize: '1.2rem', color: noteColor }}>
              {note.text}
            </span>
          )}
        </span>
      )}
    </>
  );
}
