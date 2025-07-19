import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Color } from '~/constants/css';
import { useAppContext, useKeyContext } from '~/contexts';
import { isMobile } from '~/helpers';
import { User } from '~/types';
import localize from '~/constants/localize';
import UserPopup from '~/components/UserPopup';
const deviceIsMobile = isMobile(navigator);
const deletedLabel = localize('deleted');

export default function UsernameText({
  className,
  color,
  onMenuShownChange,
  style = {},
  user = {
    id: 0,
    username: '',
    profilePicUrl: '',
    profileTheme: '',
    profileFirstRow: '',
    rank: 0,
    twinkleXP: 0,
    xpThisMonth: 0
  },
  wordBreakEnabled,
  displayedName,
  wordMasterContext,
  wordMasterPoints,
  wordMasterLabel,
  activityContext,
  activityPoints
}: {
  className?: string;
  color?: string;
  onMenuShownChange?: (v: boolean) => void;
  style?: object;
  user?: User;
  wordBreakEnabled?: boolean;
  displayedName?: string;
  wordMasterContext?: boolean;
  wordMasterPoints?: number;
  wordMasterLabel?: string;
  activityContext?: string;
  activityPoints?: number;
}) {
  const [loading, setLoading] = useState(false);
  const { level, twinkleXP } = useAppContext(
    (v) => v.user.state.userObj[user.id] || {}
  );
  const coolDownRef = useRef(false);
  const showTimerRef: React.MutableRefObject<any> = useRef(0);
  const hideTimerRef: React.MutableRefObject<any> = useRef(0);
  const hideTimerRef2: React.MutableRefObject<any> = useRef(0);
  const UsernameTextRef = useRef<HTMLDivElement | null>(null);
  const mouseEntered = useRef(false);
  const loadProfile = useAppContext((v) => v.requestHelpers.loadProfile);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);

  const userId = useKeyContext((v) => v.myState.userId);
  const [dropdownContext, setDropdownContext] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const menuShownRef = useRef(false);

  const shouldLoadProfile = useMemo(() => {
    return (
      (twinkleXP == null && user.twinkleXP == null) ||
      level == null ||
      !user.unlockedAchievementIds
    );
  }, [twinkleXP, user.twinkleXP, level, user.unlockedAchievementIds]);

  useEffect(() => {
    menuShownRef.current = !!dropdownContext;
    onMenuShownChange?.(!!dropdownContext);
  }, [dropdownContext, onMenuShownChange]);

  return (
    <div
      ref={UsernameTextRef}
      style={{
        display: 'inline',
        ...(dropdownContext
          ? {}
          : { overflowX: 'hidden', textOverflow: 'ellipsis' }),
        position: 'relative',
        ...style
      }}
      className={className}
      onMouseLeave={() => {
        clearTimeout(showTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
          setDropdownContext(null);
        }, 500);
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'inline'
        }}
      >
        <div
          style={{
            display: 'inline',
            cursor: 'pointer',
            fontWeight: 'bold',
            ...(wordBreakEnabled
              ? { overflowWrap: 'break-word', wordBreak: 'break-word' }
              : {}),
            color: user.username
              ? color || Color.darkerGray()
              : Color.lighterGray()
          }}
          onClick={onUsernameClick}
          onMouseEnter={onMouseEnter}
        >
          {displayedName || user.username || `(${deletedLabel})`}
        </div>
      </div>
      {dropdownContext && (
        <UserPopup
          isLoading={loading}
          popupContext={dropdownContext}
          onMouseEnter={() => {
            clearTimeout(hideTimerRef.current);
            clearTimeout(hideTimerRef2.current);
          }}
          onMouseLeave={() => {
            hideTimerRef2.current = setTimeout(() => {
              setDropdownContext(null);
            }, 500);
          }}
          myId={userId}
          user={user}
          onHide={handleHideMenuWithCoolDown}
          onSetPopupContext={setDropdownContext}
          wordMasterContext={wordMasterContext}
          wordMasterPoints={wordMasterPoints}
          wordMasterLabel={wordMasterLabel}
          activityContext={activityContext}
          activityPoints={activityPoints}
        />
      )}
    </div>
  );

  function handleHideMenuWithCoolDown() {
    coolDownRef.current = true;
    setDropdownContext(null);
    setTimeout(() => {
      coolDownRef.current = false;
    }, 10);
  }

  async function onMouseEnter() {
    mouseEntered.current = true;
    const parentElementDimensions =
      UsernameTextRef.current?.getBoundingClientRect?.() || {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      };
    if (user.username && !deviceIsMobile) {
      clearTimeout(hideTimerRef.current);
      clearTimeout(hideTimerRef2.current);
      clearTimeout(showTimerRef.current);
      if (shouldLoadProfile) {
        setLoading(true);
        showTimerRef.current = setTimeout(async () => {
          if (mouseEntered.current) {
            setDropdownContext(parentElementDimensions);
          }
        }, 500);
        const data = await loadProfile(user.id);
        onSetUserState({
          userId: user.id,
          newState: { ...data, loaded: true }
        });
        setLoading(false);
      } else {
        showTimerRef.current = setTimeout(
          () => setDropdownContext(parentElementDimensions),
          500
        );
      }
    }
  }

  async function onUsernameClick() {
    const elementContext = {
      x: UsernameTextRef.current?.getBoundingClientRect?.()?.left || 0,
      y: UsernameTextRef.current?.getBoundingClientRect?.()?.top || 0,
      width: UsernameTextRef.current?.getBoundingClientRect?.()?.width || 0,
      height: UsernameTextRef.current?.getBoundingClientRect?.()?.height || 0
    };
    if (user.username) {
      if (shouldLoadProfile && !menuShownRef.current) {
        setLoading(true);
        setDropdownContext(elementContext);
        const data = await loadProfile(user.id);
        onSetUserState({
          userId: user.id,
          newState: { ...data, loaded: true }
        });
        setLoading(false);
      } else {
        setDropdownContext(menuShownRef.current ? null : elementContext);
      }
    }
  }
}
