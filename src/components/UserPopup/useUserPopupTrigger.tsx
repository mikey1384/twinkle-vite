import React, { useEffect, useRef, useState } from 'react';
import { useAppContext, useKeyContext } from '~/contexts';
import { isMobile } from '~/helpers';
import { isProfileAppearanceFresh } from '~/helpers/profileAppearance';
import { User } from '~/types';
import UserPopup from './index';

const deviceIsMobile = isMobile(navigator);
const HOVER_DELAY_MS = 500;

interface PopupContext {
  x: number;
  y: number;
  width: number;
  height: number;
}
type ExtraPopupProps = Pick<
  React.ComponentProps<typeof UserPopup>,
  | 'wordMasterContext'
  | 'wordMasterPoints'
  | 'wordMasterLabel'
  | 'activityContext'
  | 'activityPoints'
>;

// The site's profile card for a member: hover (desktop, after a short pause)
// or tap/click shows UserPopup next to the trigger, loading the full profile
// when the cached copy is stale. Username text and member avatars share it,
// so a face behaves exactly like a name.
//
// Wiring: put `triggerRef` and `onMouseLeave` on the element the card anchors
// to, `onMouseEnter` and `onClick` on the clickable part (often the same
// element), and render `popup` inside the anchor. A trigger whose tap must keep
// its own action (switching chats) wires hover only and calls `hide` on tap.
export default function useUserPopupTrigger<T extends HTMLElement>({
  user,
  onShownChange,
  popupProps
}: {
  user: User;
  onShownChange?: (shown: boolean) => void;
  popupProps?: ExtraPopupProps;
}) {
  const [loading, setLoading] = useState(false);
  const cachedLoaded = useAppContext(
    (v) => v.user.state.userObj[user.id]?.loaded
  );
  const cachedAppearanceLoadedAt = useAppContext(
    (v) => v.user.state.userObj[user.id]?.profileAppearanceLoadedAt
  );
  const cachedLevel = useAppContext(
    (v) => v.user.state.userObj[user.id]?.level
  );
  const cachedTwinkleXP = useAppContext(
    (v) => v.user.state.userObj[user.id]?.twinkleXP
  );
  const cachedUnlockedAchievementIds = useAppContext(
    (v) => v.user.state.userObj[user.id]?.unlockedAchievementIds
  );
  const cachedChessMaxLevelUnlocked = useAppContext(
    (v) => v.user.state.userObj[user.id]?.chessMaxLevelUnlocked
  );
  const loadProfile = useAppContext((v) => v.requestHelpers.loadProfile);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const myId = useKeyContext((v) => v.myState.userId);

  const triggerRef = useRef<T | null>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const hideTimerRef2 = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const mouseEntered = useRef(false);
  const [popupContext, setPopupContext] = useState<PopupContext | null>(null);
  const shown = !!popupContext;
  const shownRef = useRef(false);
  const onShownChangeRef = useRef(onShownChange);
  onShownChangeRef.current = onShownChange;

  useEffect(() => {
    shownRef.current = shown;
    onShownChangeRef.current?.(shown);
  }, [shown]);

  useEffect(
    () => () => {
      clearTimeout(showTimerRef.current);
      clearTimeout(hideTimerRef.current);
      clearTimeout(hideTimerRef2.current);
    },
    []
  );

  const popup = popupContext ? (
    <UserPopup
      isLoading={loading}
      triggerRef={triggerRef}
      popupContext={popupContext}
      onMouseEnter={() => {
        clearTimeout(hideTimerRef.current);
        clearTimeout(hideTimerRef2.current);
      }}
      onMouseLeave={() => {
        hideTimerRef2.current = setTimeout(() => {
          setPopupContext(null);
        }, HOVER_DELAY_MS);
      }}
      myId={myId}
      user={user}
      onHide={() => setPopupContext(null)}
      onSetPopupContext={setPopupContext}
      {...popupProps}
    />
  ) : null;

  return {
    triggerRef,
    shown: !!popupContext,
    popup,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: deviceIsMobile ? undefined : handleMouseLeave,
    onClick: handleClick,
    hide
  };

  // Closes the card and cancels a pending hover, for triggers whose tap does
  // something else (a chat-switch portrait).
  function hide() {
    mouseEntered.current = false;
    clearTimeout(showTimerRef.current);
    setPopupContext(null);
  }

  function anchorRect(): PopupContext {
    const rect = triggerRef.current?.getBoundingClientRect?.();
    return {
      x: rect?.left || 0,
      y: rect?.top || 0,
      width: rect?.width || 0,
      height: rect?.height || 0
    };
  }

  function shouldLoadProfile() {
    return (
      !isProfileAppearanceFresh(cachedAppearanceLoadedAt) ||
      (cachedTwinkleXP == null && user.twinkleXP == null) ||
      cachedLevel == null ||
      (!cachedUnlockedAchievementIds && !user.unlockedAchievementIds) ||
      (!cachedLoaded &&
        cachedChessMaxLevelUnlocked == null &&
        user.chessMaxLevelUnlocked == null)
    );
  }

  async function handleMouseEnter() {
    mouseEntered.current = true;
    if (!user.username || deviceIsMobile) return;
    const context = anchorRect();
    clearTimeout(hideTimerRef.current);
    clearTimeout(hideTimerRef2.current);
    clearTimeout(showTimerRef.current);
    if (shouldLoadProfile()) {
      setLoading(!cachedLoaded);
      showTimerRef.current = setTimeout(() => {
        if (mouseEntered.current) setPopupContext(context);
      }, HOVER_DELAY_MS);
      await refreshProfile();
    } else {
      showTimerRef.current = setTimeout(
        () => setPopupContext(context),
        HOVER_DELAY_MS
      );
    }
  }

  async function handleClick(event: React.MouseEvent<HTMLElement>) {
    event.stopPropagation();
    if (!user.username) return;
    const context = anchorRect();
    if (shouldLoadProfile() && !shownRef.current) {
      setLoading(!cachedLoaded);
      setPopupContext(context);
      await refreshProfile();
    } else {
      setPopupContext(shownRef.current ? null : context);
    }
  }

  async function refreshProfile() {
    try {
      const data = await loadProfile(user.id);
      if (data?.id === user.id) {
        onSetUserState({
          userId: user.id,
          newState: { ...data, loaded: true }
        });
      }
    } catch {
      // The request helper reports the error. Keep the available identity
      // usable, clear the spinner, and let the next interaction retry.
    } finally {
      setLoading(false);
    }
  }

  function handleMouseLeave() {
    mouseEntered.current = false;
    clearTimeout(showTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setPopupContext(null);
    }, HOVER_DELAY_MS);
  }
}
