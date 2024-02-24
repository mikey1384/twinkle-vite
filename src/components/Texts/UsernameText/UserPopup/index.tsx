import React, { useMemo, useState } from 'react';
import Popup from './Popup';
import Icon from '~/components/Icon';
import ProfilePic from '~/components/ProfilePic';
import RichText from '~/components/Texts/RichText';
import AchievementBadges from '~/components/AchievementBadges';
import UserTitle from '~/components/Texts/UserTitle';
import Loading from '~/components/Loading';
import UsernameHistoryModal from '~/components/Modals/UsernameHistoryModal';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useAppContext, useChatContext } from '~/contexts';
import { User } from '~/types';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { Link } from 'react-router-dom';
import localize from '~/constants/localize';

const chatLabel = localize('chat2');
const profileLabel = localize('Profile');

export default function UserPopup({
  isLoading,
  myId,
  onHide,
  onLinkClick,
  onMouseEnter,
  onMouseLeave,
  popupContext,
  user
}: {
  isLoading?: boolean;
  bio?: string;
  isOnline?: boolean;
  myId: number;
  onHide: () => void;
  onLinkClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  popupContext: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  user: User;
}) {
  const {
    authLevel,
    hasUsernameChanged,
    level,
    rank,
    twinkleXP,
    profileTheme,
    realName,
    title,
    unlockedAchievementIds,
    userType,
    profileFirstRow,
    xpThisMonth
  } = useAppContext((v) => v.user.state.userObj[user.id] || {});
  const [usernameHistoryShown, setUsernameHistoryShown] = useState(false);
  const [titleModalShown, setTitleModalShown] = useState(false);

  const chatStatus = useChatContext((v) => v.state.chatStatus);
  const userRank = useMemo(() => {
    if (user.rank) {
      return Number(user.rank);
    }
    return rank;
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
  const userXP = useMemo(() => {
    if (!twinkleXP && !user.twinkleXP) {
      return null;
    }
    return addCommasToNumber(twinkleXP || user.twinkleXP);
  }, [twinkleXP, user.twinkleXP]);
  const userXPThisMonth = useMemo(() => {
    if (!user.xpThisMonth && !xpThisMonth) {
      return null;
    }
    return addCommasToNumber(user.xpThisMonth || xpThisMonth);
  }, [user.xpThisMonth, xpThisMonth]);
  const isOnline = useMemo(
    () => chatStatus[user.id]?.isOnline,
    [chatStatus, user.id]
  );

  return (
    <Popup
      popupContext={popupContext}
      onHideMenu={handleHide}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        width: '33rem',
        maxWidth: '50vw',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}
    >
      {isLoading ? (
        <Loading />
      ) : (
        <div
          style={{
            width: '100%',
            padding: '0',
            background: '#fff'
          }}
        >
          <div
            style={{
              background: Color[appliedProfileTheme || 'logoBlue'](),
              minHeight: '2rem',
              padding: '0.5rem'
            }}
          >
            <AchievementBadges
              thumbSize="2rem"
              unlockedAchievementIds={appliedUnlockedAchievementIds}
            />
          </div>
          <div style={{ padding: '0.7rem 1rem 1rem 1rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '1rem'
              }}
            >
              <div
                className={css`
                  width: 5rem;
                  @media (max-width: ${mobileMaxWidth}) {
                    width: 3rem;
                  }
                `}
              >
                <ProfilePic
                  style={{ width: '100%' }}
                  profilePicUrl={user.profilePicUrl || ''}
                  userId={user.id}
                  online={isOnline}
                  statusShown
                />
              </div>
              <div style={{ marginLeft: '1rem' }}>
                <div
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#333'
                  }}
                >
                  <span
                    className={`unselectable ${css`
                      cursor: ${hasUsernameChanged ? 'pointer' : 'default'};
                      &:hover {
                        text-decoration: ${hasUsernameChanged
                          ? 'underline'
                          : 'none'};
                      }
                    `}`}
                    onClick={() =>
                      hasUsernameChanged && setUsernameHistoryShown(true)
                    }
                  >
                    {user.username}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem' }}>
                  <UserTitle
                    user={{
                      ...user,
                      level: user.level || level,
                      title: user.title || title,
                      userType: user.userType || userType,
                      authLevel: user.authLevel || authLevel
                    }}
                    style={{ fontSize: '1rem' }}
                    className={`unselectable ${css`
                      font-weight: bold;
                      display: inline;
                      margin-right: 0.3rem;
                      color: ${Color.darkGray()};
                    `}`}
                    onTitleModalShown={setTitleModalShown}
                  />
                  {appliedRealName}
                </div>
              </div>
            </div>
            {bio && (
              <RichText
                isProfileComponent
                theme={profileTheme}
                style={{
                  marginBottom: '1rem',
                  color: '#333',
                  fontSize: '1.1rem'
                }}
              >
                {bio}
              </RichText>
            )}
            <div
              style={{
                padding: '1rem',
                borderTop: '1px solid #eee',
                borderBottom: '1px solid #eee',
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: 'space-between'
              }}
            >
              <Link
                style={{
                  color: Color.darkerGray(),
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.5rem',
                  borderRadius,
                  transition: 'background 0.3s',
                  flexGrow: 1,
                  justifyContent: 'center'
                }}
                className={css`
                  &:hover {
                    text-decoration: none;
                  }
                `}
                to={`/users/${user.username}`}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = Color.highlightGray())
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'transparent')
                }
              >
                <Icon icon="user" />
                <span style={{ marginLeft: '1rem', fontSize: '1.2rem' }}>
                  {profileLabel}
                </span>
              </Link>
              {user.id !== myId && (
                <div
                  style={{
                    color: Color.darkerGray(),
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.5rem',
                    borderRadius,
                    transition: 'background 0.3s',
                    flexGrow: 1,
                    justifyContent: 'center'
                  }}
                  onClick={onLinkClick}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = Color.highlightGray())
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'transparent')
                  }
                >
                  <Icon icon="comment" />
                  <span style={{ marginLeft: '1rem', fontSize: '1.2rem' }}>
                    {chatLabel}
                  </span>
                </div>
              )}
            </div>
            {userXP && (
              <div
                style={{
                  padding: '0.5rem 1rem',
                  background:
                    !!userRank && userRank < 4
                      ? Color.darkerGray()
                      : Color.highlightGray(),
                  color:
                    !!userRank && userRank < 4 ? '#fff' : Color.darkerGray(),
                  borderRadius,
                  textAlign: 'center',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '1.1rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  flexDirection: 'column'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%'
                  }}
                >
                  {userXP} XP
                  {!!userRank && userRank < 4 ? (
                    <span
                      style={{
                        fontWeight: 'bold',
                        marginLeft: '0.5rem',
                        color:
                          userRank === 1
                            ? Color.gold()
                            : userRank === 2
                            ? '#fff'
                            : Color.orange()
                      }}
                    >
                      (#{userRank})
                    </span>
                  ) : (
                    ''
                  )}
                </div>
                {userXPThisMonth && (
                  <div
                    style={{
                      fontSize: '1rem',
                      fontWeight: 'normal'
                    }}
                  >
                    (↑ {userXPThisMonth} this month)
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {usernameHistoryShown ? (
        <UsernameHistoryModal
          userId={user.id}
          onHide={() => setUsernameHistoryShown(false)}
        />
      ) : null}
    </Popup>
  );

  function handleHide() {
    if (!(usernameHistoryShown || titleModalShown)) {
      onHide();
    }
  }
}
