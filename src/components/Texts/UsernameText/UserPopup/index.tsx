import React from 'react';
import Popup from './Popup';
import Icon from '~/components/Icon';
import ProfilePic from '~/components/ProfilePic';
import RichText from '~/components/Texts/RichText';
import AchievementBadges from '~/components/AchievementBadges';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { Link } from 'react-router-dom';
import localize from '~/constants/localize';

const chatLabel = localize('chat2');
const profileLabel = localize('Profile');

export default function UserPopup({
  bio,
  myId,
  onHide,
  onLinkClick,
  onMouseEnter,
  onMouseLeave,
  popupContext,
  profileTheme,
  profilePicUrl,
  realName,
  unlockedAchievementIds = [],
  userId,
  username,
  userRank,
  userXP,
  xpThisMonth
}: {
  bio?: string;
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
  profileTheme?: string;
  profilePicUrl?: string;
  realName: string;
  unlockedAchievementIds?: number[];
  userId: number;
  username: string;
  userRank?: number;
  userXP?: string | null;
  xpThisMonth?: string | null;
}) {
  return (
    <Popup
      popupContext={popupContext}
      onHideMenu={onHide}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        minWidth: '10rem',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}
    >
      <div
        style={{
          width: '30rem',
          padding: '0',
          background: '#fff'
        }}
      >
        <div
          style={{
            background: Color[profileTheme || 'logoBlue'](),
            minHeight: '2rem',
            padding: '0.5rem'
          }}
        >
          <AchievementBadges
            thumbSize="2rem"
            unlockedAchievementIds={unlockedAchievementIds}
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
                profilePicUrl={profilePicUrl || ''}
                userId={userId}
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
                {username}
              </div>
              <div style={{ fontSize: '0.8rem' }}>({realName})</div>
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
              to={`/users/${username}`}
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
            {userId !== myId && (
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
                color: !!userRank && userRank < 4 ? '#fff' : Color.darkerGray(),
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
              {xpThisMonth && (
                <div
                  style={{
                    fontSize: '1rem',
                    fontWeight: 'normal'
                  }}
                >
                  (↑ {xpThisMonth} this month)
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Popup>
  );
}
