import React from 'react';
import ProfilePic from '~/components/ProfilePic';
import ErrorBoundary from '~/components/ErrorBoundary';
import WelcomeMessage from './WelcomeMessage';
import Icon from '~/components/Icon';
import { Color, borderRadius, mobileMaxWidth, getThemeStyles } from '~/constants/css';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { useAppContext, useKeyContext } from '~/contexts';

const container = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-top: 1rem;
  z-index: 400;
  border: none;
  background: var(--profile-widget-bg);
  border-radius: ${borderRadius};
  border-left: 0;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  box-shadow: 0 20px 42px -32px rgba(15, 23, 42, 0.35);

  .heading {
    padding: 1.2rem 1.4rem;
    border: 1px solid ${Color.borderGray()};
    border-bottom: none;
    border-radius: ${borderRadius};
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    border-left: 0;
    display: flex;
    background: rgba(255, 255, 255, 0.96);
    width: 100%;
    align-items: center;
    justify-content: flex-start;
    cursor: pointer;
    transition: background 0.25s ease, box-shadow 0.25s ease;
    &:hover {
      background: rgba(255, 255, 255, 0.98);
      box-shadow: inset 0 0 0 1px ${Color.borderGray()};
    }
    .widget__profile-pic {
      width: 8rem;
      border-radius: 50%;
      box-shadow: 0 12px 28px -20px rgba(15, 23, 42, 0.45);
    }
    .names {
      width: CALC(100% - 8rem);
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      a {
        color: ${Color.darkerGray()};
        font-weight: 700;
        font-size: 2.2rem;
        text-decoration: none;
      }
      span {
        color: ${Color.gray()};
        font-size: 1.2rem;
      }
    }
  }

  .details {
    font-size: 1.3rem;
    border: 1px solid ${Color.borderGray()};
    border-left: 0;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: ${borderRadius};
    background: rgba(255, 255, 255, 0.96);
    padding: 1.2rem 1.4rem;
    box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.03);
    .login-message {
      font-size: 2rem;
      color: ${Color.darkerGray()};
      font-weight: bold;
    }
  }

  .details.no-user {
    border-top-right-radius: ${borderRadius};
  }

  .navigation {
    padding: 1.1rem 0;
    font-family: 'Poppins', sans-serif;
    font-size: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    gap: 0.8rem;
  }
  .navigation-item {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 0.7rem 1.2rem;
    border-radius: 0.9rem;
    width: 100%;
    justify-content: center;
    max-width: 22rem;
    border: 1px solid rgba(148, 163, 184, 0.4);
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 14px 28px -22px rgba(15, 23, 42, 0.35);
    transition: background 0.2s ease, box-shadow 0.2s ease,
      border-color 0.2s ease, transform 0.15s ease;
    > span {
      margin-left: 0.5rem;
      font-weight: 600;
      color: ${Color.darkerGray()};
    }
    &:hover {
      background: rgba(255, 255, 255, 0.98);
      border-color: var(
        --profile-widget-accent-border,
        ${Color.borderGray()}
      );
      box-shadow: 0 20px 34px -26px rgba(15, 23, 42, 0.42);
      transform: translateY(-2px);
      .navigation-icon {
        color: var(--profile-widget-accent, ${Color.logoBlue()});
      }
      > span {
        color: var(--profile-widget-accent, ${Color.logoBlue()});
      }
    }
  }
  .navigation-icon {
    color: ${Color.darkerGray()};
    margin-right: 0.5rem;
    transition: color 0.2s ease;
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
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const { profilePicUrl, realName, userId, username } = useKeyContext(
    (v) => v.myState
  );
  const themeBg = React.useMemo(() => {
    const themeName = (profileTheme || 'logoBlue') as string;
    return getThemeStyles(themeName, 0.06).bg;
  }, [profileTheme]);
  const homeMenuItemActive = useKeyContext(
    (v) => v.theme.homeMenuItemActive.color
  );
  const accentColorFn = React.useMemo(() => {
    const candidate = Color[homeMenuItemActive as keyof typeof Color];
    return typeof candidate === 'function'
      ? (candidate as (opacity?: number) => string)
      : null;
  }, [homeMenuItemActive]);
  const accentColor = React.useMemo(() => {
    if (accentColorFn) return accentColorFn();
    return Color.logoBlue();
  }, [accentColorFn]);
  const accentBorderColor = React.useMemo(() => {
    if (accentColorFn) return accentColorFn(0.4);
    return Color.borderGray();
  }, [accentColorFn]);

  return (
    <ErrorBoundary componentPath="ProfileWidget/index">
      <div
        className={container}
        style={{
          ['--profile-widget-bg' as any]: themeBg,
          ['--profile-widget-accent' as any]: accentColor,
          ['--profile-widget-accent-border' as any]: accentBorderColor
        }}
      >
        {username ? (
          <div
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
        <div className={`details${!username ? ' no-user' : ''}`}>
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
