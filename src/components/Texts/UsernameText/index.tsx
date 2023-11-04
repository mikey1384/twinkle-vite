import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Color } from '~/constants/css';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { isMobile, getSectionFromPathname } from '~/helpers';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { User } from '~/types';
import localize from '~/constants/localize';
import UserPopup from './UserPopup';

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
  displayedName
}: {
  className?: string;
  color?: string;
  onMenuShownChange?: (v: boolean) => void;
  style?: object;
  user?: User;
  wordBreakEnabled?: boolean;
  displayedName?: string;
}) {
  const reportError = useAppContext((v) => v.requestHelpers.reportError);
  const navigate = useNavigate();
  const location = useLocation();
  const usingChat = useMemo(
    () => getSectionFromPathname(location?.pathname)?.section === 'chat',
    [location?.pathname]
  );
  const coolDownRef = useRef(false);
  const showTimerRef: React.MutableRefObject<any> = useRef(0);
  const hideTimerRef: React.MutableRefObject<any> = useRef(0);
  const hideTimerRef2: React.MutableRefObject<any> = useRef(0);
  const UsernameTextRef = useRef<HTMLDivElement | null>(null);
  const mouseEntered = useRef(false);
  const loadDMChannel = useAppContext((v) => v.requestHelpers.loadDMChannel);
  const loadProfile = useAppContext((v) => v.requestHelpers.loadProfile);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const {
    rank,
    twinkleXP,
    profileTheme,
    realName,
    unlockedAchievementIds,
    profileFirstRow
  } = useAppContext((v) => v.user.state.userObj[user.id] || {});

  const { userId, username, profilePicUrl } = useKeyContext((v) => v.myState);
  const onUpdateSelectedChannelId = useChatContext(
    (v) => v.actions.onUpdateSelectedChannelId
  );
  const onOpenNewChatTab = useChatContext((v) => v.actions.onOpenNewChatTab);
  const [dropdownContext, setDropdownContext] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const menuShownRef = useRef(false);
  const userXP = useMemo(() => {
    if (!twinkleXP && !user.twinkleXP) {
      return null;
    }
    return addCommasToNumber(user.twinkleXP || twinkleXP);
  }, [twinkleXP, user.twinkleXP]);
  const userXPThisMonth = useMemo(() => {
    if (!user.xpThisMonth) {
      return null;
    }
    return addCommasToNumber(user.xpThisMonth);
  }, [user.xpThisMonth]);
  const userRank = useMemo(() => {
    return user.rank || rank;
  }, [rank, user.rank]);
  const appliedProfileTheme = useMemo(() => {
    return user.profileTheme || profileTheme;
  }, [user.profileTheme, profileTheme]);
  const appliedRealName = useMemo(() => {
    return user.realName || realName;
  }, [realName, user.realName]);
  const appliedUnlockedAchievementIds = useMemo(() => {
    return user.unlockedAchievementIds || unlockedAchievementIds;
  }, [unlockedAchievementIds, user.unlockedAchievementIds]);
  const bio = useMemo(() => {
    return user.profileFirstRow || profileFirstRow;
  }, [user.profileFirstRow, profileFirstRow]);

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
          userId={user.id}
          unlockedAchievementIds={appliedUnlockedAchievementIds}
          realName={appliedRealName}
          username={user.username}
          userRank={userRank}
          userXP={userXP}
          xpThisMonth={userXPThisMonth}
          profilePicUrl={user.profilePicUrl}
          profileTheme={appliedProfileTheme}
          bio={bio}
          onHide={handleHideMenuWithCoolDown}
          onLinkClick={handleLinkClick}
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
      if (!twinkleXP && !user.twinkleXP) {
        showTimerRef.current = setTimeout(async () => {
          const data = await loadProfile(user.id);
          if (mouseEntered.current) {
            onSetUserState({
              userId: user.id,
              newState: { ...data, loaded: true }
            });
            setDropdownContext(parentElementDimensions);
          }
        }, 500);
      } else {
        showTimerRef.current = setTimeout(
          () => setDropdownContext(parentElementDimensions),
          500
        );
      }
    }
  }

  async function handleLinkClick() {
    setDropdownContext(null);
    if (user.id !== userId) {
      const { channelId, pathId } = await loadDMChannel({ recipient: user });
      if (!pathId) {
        if (!user?.id) {
          return reportError({
            componentPath: 'Texts/UsernameText',
            message: `handleLinkClick: recipient userId is null. recipient: ${JSON.stringify(
              user
            )}`
          });
        }
        onOpenNewChatTab({
          user: { username, id: userId, profilePicUrl },
          recipient: {
            username: user.username,
            id: user.id,
            profilePicUrl: user.profilePicUrl
          }
        });
        if (!usingChat) {
          onUpdateSelectedChannelId(channelId);
        }
      }
      setTimeout(() => navigate(pathId ? `/chat/${pathId}` : `/chat/new`), 0);
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
      if (!twinkleXP && !user.twinkleXP && !menuShownRef.current) {
        const data = await loadProfile(user.id);
        onSetUserState({
          userId: user.id,
          newState: { ...data, loaded: true }
        });
        setDropdownContext(elementContext);
      } else {
        setDropdownContext(menuShownRef.current ? null : elementContext);
      }
    }
  }
}
