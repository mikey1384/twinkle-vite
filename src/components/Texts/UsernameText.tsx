import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import DropdownList from '~/components/DropdownList';
import { Color } from '~/constants/css';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { isMobile, getSectionFromPathname } from '~/helpers';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import Icon from '~/components/Icon';
import localize from '~/constants/localize';

const deviceIsMobile = isMobile(navigator);
const chatLabel = localize('chat2');
const deletedLabel = localize('deleted');
const profileLabel = localize('Profile');

UsernameText.propTypes = {
  className: PropTypes.string,
  color: PropTypes.string,
  onMenuShownChange: PropTypes.func,
  style: PropTypes.object,
  user: PropTypes.object,
  displayedName: PropTypes.string,
  wordBreakEnabled: PropTypes.bool
};

export default function UsernameText({
  className,
  color,
  onMenuShownChange,
  style = {},
  user = {},
  wordBreakEnabled,
  displayedName
}) {
  const reportError = useAppContext((v) => v.requestHelpers.reportError);
  const navigate = useNavigate();
  const location = useLocation();
  const usingChat = useMemo(
    () => getSectionFromPathname(location?.pathname)?.section === 'chat',
    [location?.pathname]
  );
  const coolDownRef = useRef(null);
  const showTimerRef = useRef(null);
  const hideTimerRef = useRef(null);
  const hideTimerRef2 = useRef(null);
  const UsernameTextRef = useRef(null);
  const mouseEntered = useRef(false);
  const loadDMChannel = useAppContext((v) => v.requestHelpers.loadDMChannel);
  const loadProfile = useAppContext((v) => v.requestHelpers.loadProfile);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const { rank, twinkleXP } = useAppContext(
    (v) => v.user.state.userObj[user.id] || {}
  );
  const { userId, username, profilePicUrl, authLevel } = useKeyContext(
    (v) => v.myState
  );
  const onUpdateSelectedChannelId = useChatContext(
    (v) => v.actions.onUpdateSelectedChannelId
  );
  const onOpenNewChatTab = useChatContext((v) => v.actions.onOpenNewChatTab);
  const [dropdownContext, setDropdownContext] = useState(null);
  const menuShownRef = useRef(false);
  const userXP = useMemo(() => {
    if (!twinkleXP && !user.twinkleXP) {
      return null;
    }
    return addCommasToNumber(user.twinkleXP || twinkleXP);
  }, [twinkleXP, user.twinkleXP]);
  const userRank = useMemo(() => {
    return user.rank || rank;
  }, [rank, user.rank]);

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
        <DropdownList
          dropdownContext={dropdownContext}
          onHideMenu={handleHideMenuWithCoolDown}
          onMouseEnter={() => {
            clearTimeout(hideTimerRef.current);
            clearTimeout(hideTimerRef2.current);
          }}
          style={{ minWidth: '10rem' }}
          onMouseLeave={() => {
            hideTimerRef2.current = setTimeout(() => {
              setDropdownContext(null);
            }, 500);
          }}
        >
          <li
            style={{
              color: Color.darkerGray()
            }}
            onClick={() => navigate(`/users/${user.username}`)}
          >
            <Icon icon="user" />
            <span style={{ marginLeft: '1rem' }}>{profileLabel}</span>
          </li>
          {user.id !== userId && (
            <li
              style={{
                color: Color.darkerGray()
              }}
              onClick={handleLinkClick}
            >
              <Icon icon="comment" />
              <span style={{ marginLeft: '1rem' }}>{chatLabel}</span>
            </li>
          )}
          {userXP && (
            <li
              style={{
                padding: '5px',
                background:
                  !!userRank && userRank < 4
                    ? Color.darkerGray()
                    : Color.highlightGray(),
                color: !!userRank && userRank < 4 ? '#fff' : Color.darkerGray(),
                fontSize: '1rem',
                textAlign: 'center',
                fontWeight: 'bold'
              }}
            >
              {userXP} XP
              {!!userRank && userRank < 4 ? (
                <span
                  style={{
                    fontWeight: 'bold',
                    color:
                      userRank === 1
                        ? Color.gold()
                        : userRank === 2
                        ? '#fff'
                        : Color.orange()
                  }}
                >
                  {' '}
                  (#{userRank})
                </span>
              ) : (
                ''
              )}
            </li>
          )}
        </DropdownList>
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
          user: { username, id: userId, profilePicUrl, authLevel },
          recipient: {
            username: user.username,
            id: user.id,
            profilePicUrl: user.profilePicUrl,
            authLevel: user.authLevel
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
      x: UsernameTextRef.current.getBoundingClientRect().left,
      y: UsernameTextRef.current.getBoundingClientRect().top,
      width: UsernameTextRef.current.getBoundingClientRect().width,
      height: UsernameTextRef.current.getBoundingClientRect().height
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
