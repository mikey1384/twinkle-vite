import React from 'react';
import Popup from './Popup';
import Icon from '~/components/Icon';
import ProfilePic from '~/components/ProfilePic';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import localize from '~/constants/localize';

const chatLabel = localize('chat2');
const profileLabel = localize('Profile');

export default function UserPopup({
  bio,
  myId,
  navigate,
  onHide,
  onLinkClick,
  onMouseEnter,
  onMouseLeave,
  popupContext,
  profilePicUrl,
  userId,
  username,
  userRank,
  userXP
}: {
  bio?: string;
  myId: number;
  navigate: (path: string) => void;
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
  profilePicUrl: string;
  userId: number;
  username: string;
  userRank?: number;
  userXP?: string | null;
}) {
  return (
    <Popup
      popupContext={popupContext}
      onHideMenu={onHide}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        minWidth: '10rem',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}
    >
      <div style={{ width: '30rem', padding: '1rem', background: '#fff' }}>
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
              profilePicUrl={profilePicUrl}
              userId={userId}
            />
          </div>
          <div
            style={{ marginLeft: '1rem', fontSize: '1.2rem', color: '#333' }}
          >
            {username}
          </div>
        </div>
        {bio && (
          <div style={{ marginBottom: '1rem', color: '#333' }}>{bio}</div>
        )}
        <div
          style={{
            padding: '1rem',
            borderTop: '1px solid #eee',
            borderBottom: '1px solid #eee',
            marginBottom: '1rem'
          }}
        >
          <div
            style={{
              color: Color.darkerGray(),
              cursor: 'pointer',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              transition: 'background 0.3s'
            }}
            onClick={() => navigate(`/users/${username}`)}
          >
            <Icon icon="user" />
            <span style={{ marginLeft: '1rem' }}>{profileLabel}</span>
          </div>
          {userId !== myId && (
            <div
              style={{
                color: Color.darkerGray(),
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'background 0.3s'
              }}
              onClick={onLinkClick}
            >
              <Icon icon="comment" />
              <span style={{ marginLeft: '1rem' }}>{chatLabel}</span>
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
              borderRadius: '4px',
              textAlign: 'center',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
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
        )}
      </div>
    </Popup>
  );
}
