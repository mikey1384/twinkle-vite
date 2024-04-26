import React from 'react';
import ProfilePic from '~/components/ProfilePic';
import ErrorBoundary from '~/components/ErrorBoundary';
import WelcomeMessage from './WelcomeMessage';
import Icon from '~/components/Icon';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { useAppContext, useKeyContext } from '~/contexts';

const container = css`
  .navigation {
    padding: 1rem 0;
    font-family: 'Poppins', sans-serif;
    font-size: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    gap: 0.7rem;
  }

  .navigation-item {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    transition: background-color 0.3s ease;
    > span {
      margin-left: 0.5rem;
    }
  }

  .navigation-item:hover {
    background-color: ${Color.highlightGray()};
  }

  .navigation-icon {
    color: ${Color.darkerGray()};
    margin-right: 0.5rem;
  }

  display: flex;
  border: none;
  flex-direction: column;
  width: 100%;
  z-index: 400;
  a {
    text-decoration: none;
  }
  .heading {
    padding: 1rem;
    border: 1px solid ${Color.borderGray()};
    border-bottom: none;
    border-radius: ${borderRadius};
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    border-left: 0;
    display: flex;
    background: #fff;
    width: 100%;
    align-items: center;
    justify-content: flex-start;
    .names {
      width: CALC(100% - 8rem);
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      a {
        color: ${Color.darkerGray()};
        font-weight: bold;
        font-size: 2.2rem;
      }
      span {
        color: ${Color.darkerGray()};
        font-size: 1.2rem;
      }
    }
    &:hover {
      transition: background 0.5s;
      background: ${Color.highlightGray()};
    }
  }
  .widget__profile-pic {
    width: 8rem;
  }
  .details {
    font-size: 1.3rem;
    border: 1px solid ${Color.borderGray()};
    border-left: 0;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: ${borderRadius};
    background: #fff;
    padding: 1rem;
    .login-message {
      font-size: 2rem;
      color: ${Color.darkerGray()};
      font-weight: bold;
    }
  }
  @media (max-width: ${mobileMaxWidth}) {
    border-radius: 0;
    .heading {
      border: 0;
      border-radius: 0;
      justify-content: space-around;
      .names {
        text-align: center;
        a {
          font-size: 2.5rem;
        }
        span {
          font-size: 1.5rem;
        }
        width: 50%;
      }
    }
    .details {
      border: 0;
      border-top: 1px solid ${Color.borderGray()};
      border-bottom: 1px solid ${Color.borderGray()};
      border-radius: 0;
      text-align: center;
      font-size: 3rem;
      .login-message {
        font-size: 3rem;
      }
      button {
        font-size: 2rem;
      }
    }
  }
  @media (min-width: 2304px) {
    border-left: 1px solid ${Color.borderGray()};
  }
`;

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
      <div className={container}>
        {username ? (
          <div
            style={{ cursor: 'pointer' }}
            className="heading"
            onClick={() => (username ? navigate(`/users/${username}`) : null)}
          >
            <div>
              <ProfilePic
                className="widget__profile-pic"
                style={{ cursor: userId ? 'pointer' : 'default' }}
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
            <div className="navigation">
              <div
                className="navigation-item"
                onClick={() => navigate(`/users/${username}`)}
              >
                <Icon icon="user" className="navigation-icon" />
                <span>My Profile</span>
              </div>
              <div
                className="navigation-item"
                onClick={() => navigate(`/ai-cards/?search[owner]=${username}`)}
              >
                <Icon icon="cards-blank" className="navigation-icon" />
                <span>My AI Cards</span>
              </div>
              <div
                className="navigation-item"
                onClick={() => navigate(`/ai-cards/?search[isBuyNow]=true`)}
              >
                <Icon icon="money-bill-trend-up" className="navigation-icon" />
                <span>Buy Cards</span>
              </div>
            </div>
          ) : null}
          <WelcomeMessage userId={userId} openSigninModal={onOpenSigninModal} />
        </div>
      </div>
    </ErrorBoundary>
  );
}
