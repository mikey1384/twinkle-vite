import React, { useMemo, useState } from 'react';
import Popup from './Popup';
import Icon from '~/components/Icon';
import ProfilePic from '~/components/ProfilePic';
import RichText from '~/components/Texts/RichText';
import AchievementBadges from '~/components/AchievementBadges';
import UserTitle from '~/components/Texts/UserTitle';
import Loading from '~/components/Loading';
import UsernameHistoryModal from '~/components/Modals/UsernameHistoryModal';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { User } from '~/types';
import { getSectionFromPathname } from '~/helpers';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import localize from '~/constants/localize';

const chatLabel = localize('chat2');
const profileLabel = localize('Profile');

export default function UserPopup({
  isLoading,
  myId,
  onHide,
  onMouseEnter,
  onMouseLeave,
  onSetPopupContext,
  popupContext,
  user,
  wordMasterContext,
  wordMasterPoints,
  wordMasterLabel,
  activityContext,
  activityPoints
}: {
  isLoading?: boolean;
  bio?: string;
  isOnline?: boolean;
  myId: number;
  onHide: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onSetPopupContext: (context: any) => void;
  popupContext: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  user: User;
  wordMasterContext?: boolean;
  wordMasterPoints?: number;
  wordMasterLabel?: string;
  activityContext?: string;
  activityPoints?: number;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const usingChat = useMemo(
    () => getSectionFromPathname(location?.pathname)?.section === 'chat',
    [location?.pathname]
  );
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
  const { userId, username, profilePicUrl } =
    useKeyContext((v) => v.myState) || {};
  const onUpdateSelectedChannelId = useChatContext(
    (v) => v.actions.onUpdateSelectedChannelId
  );
  const onOpenNewChatTab = useChatContext((v) => v.actions.onOpenNewChatTab);
  const [usernameHistoryShown, setUsernameHistoryShown] = useState(false);
  const [titleModalShown, setTitleModalShown] = useState(false);

  const reportError = useAppContext((v) => v.requestHelpers.reportError);
  const chatStatus = useChatContext((v) => v.state.chatStatus);
  const loadDMChannel = useAppContext((v) => v.requestHelpers.loadDMChannel);
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

  const xpContent = useMemo(() => {
    const renderBadge = (rank: number | undefined) => {
      if (!rank || rank >= 4) return null;

      return (
        <span
          style={{
            fontWeight: 'bold',
            marginLeft: '0.5rem',
            color:
              rank === 1 ? Color.gold() : rank === 2 ? '#fff' : Color.orange()
          }}
        >
          (#{rank})
        </span>
      );
    };

    // Word Master context
    if (
      (wordMasterContext && typeof wordMasterPoints === 'number') ||
      (activityContext === 'wordMaster' && typeof activityPoints === 'number')
    ) {
      const points = wordMasterPoints || activityPoints || 0;
      const label = wordMasterLabel || (points === 1 ? 'pt' : 'pts');

      return (
        <>
          {addCommasToNumber(points)} {label}
          {renderBadge(user.rank)}
        </>
      );
    }

    // Monthly XP context
    if (activityContext === 'monthlyXP') {
      return (
        <>
          {addCommasToNumber(user.twinkleXP || 0)} XP
          {renderBadge(user.rank)}
        </>
      );
    }

    // Wordle XP context
    if (activityContext === 'wordleXP') {
      return (
        <>
          {addCommasToNumber(user.xpEarned || 0)} XP from Wordle
          {renderBadge(user.rank)}
        </>
      );
    }

    // Activity-specific context (AI Stories, Grammar, etc.)
    if (activityContext && typeof activityPoints === 'number') {
      let contextLabel = '';
      if (activityContext === 'aiStories') contextLabel = 'from AI Stories';
      else if (activityContext === 'grammar') contextLabel = 'from Grammarbles';

      return (
        <>
          {addCommasToNumber(activityPoints)} XP {contextLabel}
          {renderBadge(user.rank)}
        </>
      );
    }

    // Default - show total XP
    return (
      <>
        {userXP} XP
        {renderBadge(userRank)}
      </>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    wordMasterContext,
    wordMasterPoints,
    activityContext,
    activityPoints,
    userXP,
    userRank,
    wordMasterLabel,
    user.rank,
    user.twinkleXP
  ]);

  const shouldShowMonthlyXP = useMemo(() => {
    return (
      !wordMasterContext &&
      activityContext !== 'monthlyXP' &&
      activityContext !== 'wordMaster' &&
      activityContext !== 'wordleXP' &&
      activityContext !== 'aiStories' &&
      activityContext !== 'grammar' &&
      userXPThisMonth
    );
  }, [wordMasterContext, activityContext, userXPThisMonth]);

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
                to={`/ai-cards/?search[owner]=${user.username}`}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = Color.highlightGray())
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'transparent')
                }
              >
                <Icon icon="cards-blank" />
                <span style={{ marginLeft: '1rem', fontSize: '1.2rem' }}>
                  Cards
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
                  onClick={handleLinkClick}
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
                  {xpContent}
                </div>

                {shouldShowMonthlyXP && (
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

  async function handleLinkClick() {
    onSetPopupContext(null);
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
}
