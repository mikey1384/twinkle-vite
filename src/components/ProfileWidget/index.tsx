import React from 'react';
import ProfilePic from '~/components/ProfilePic';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import WelcomeMessage from './WelcomeMessage';
import { container } from './Styles';
import { borderRadius } from '~/constants/css';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { useAppContext, useKeyContext } from '~/contexts';

export default function ProfileWidget() {
  const navigate = useNavigate();
  const onOpenSigninModal = useAppContext(
    (v) => v.user.actions.onOpenSigninModal
  );
  const { profilePicUrl, realName, userId, username } = useKeyContext(
    (v) => v.myState
  );

  return (
    <ErrorBoundary componentPath="ProfileWidget/index">
      <div className={container} style={{ cursor: 'pointer' }}>
        {username ? (
          <div
            className="heading"
            onClick={() => (username ? navigate(`/users/${username}`) : null)}
          >
            <div>
              <ProfilePic
                className="widget__profile-pic"
                style={{
                  cursor: userId ? 'pointer' : 'default'
                }}
                userId={userId}
                profilePicUrl={profilePicUrl}
              />
            </div>
            <div className="names">
              <a>{username}</a>
              {realName && (
                <div>
                  <span>({realName})</span>
                </div>
              )}
            </div>
          </div>
        ) : null}
        <div
          className={`details ${css`
            border-top-right-radius: ${username ? '' : borderRadius};
            border-top-left-radius: ${username ? '' : borderRadius};
          `}`}
        >
          {userId ? (
            <div>
              <Button
                style={{ width: '100%' }}
                transparent
                onClick={() => navigate(`/users/${username}`)}
              >
                MY PROFILE
              </Button>
              <Button
                style={{ width: '100%' }}
                transparent
                onClick={() => navigate(`/ai-cards/?search[owner]=${username}`)}
              >
                MY AI Cards
              </Button>
              <Button
                style={{ width: '100%' }}
                transparent
                onClick={() => navigate(`/ai-cards/?search[isBuyNow]=true`)}
              >
                BUY CARDS
              </Button>
            </div>
          ) : null}
          <WelcomeMessage userId={userId} openSigninModal={onOpenSigninModal} />
        </div>
      </div>
    </ErrorBoundary>
  );
}
