import React from 'react';
import ProfilePic from '~/components/ProfilePic';
import ErrorBoundary from '~/components/ErrorBoundary';
import WelcomeMessage from './WelcomeMessage';
import Icon from '~/components/Icon';
import {
  Color,
  getThemeStyles,
  mobileMaxWidth,
  wideBorderRadius
} from '~/constants/css';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { useAppContext, useKeyContext } from '~/contexts';

const container = css`
  width: 100%;
  margin-top: 1rem;
  border-radius: ${wideBorderRadius};
  border: 1px solid ${Color.borderGray(0.65)};
  background: linear-gradient(
    160deg,
    rgba(255, 255, 255, 0.96) 0%,
    var(--profile-widget-bg, #f6f7fd) 100%
  );
  box-shadow: inset 0 1px 0 ${Color.white(0.85)},
    0 10px 24px rgba(15, 23, 42, 0.14);
  backdrop-filter: blur(6px);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .heading {
    padding: 1.6rem 2rem;
    display: flex;
    gap: 1.6rem;
    align-items: center;
    background: rgba(255, 255, 255, 0.96);
    cursor: pointer;
    transition: background 0.25s ease, transform 0.2s ease;
    &:hover {
      background: rgba(255, 255, 255, 0.99);
      transform: translateY(-1px);
    }
    .widget__profile-pic {
      --profile-pic-size: 7.4rem;
      border-radius: 2rem;
      box-shadow: 0 12px 24px -18px rgba(15, 23, 42, 0.36);
    }
    .names {
      flex: 1 1 auto;
      text-align: left;
      overflow: hidden;
      text-overflow: ellipsis;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
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
    padding: 1.6rem 2rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.4rem;
    background: rgba(255, 255, 255, 0.9);
    font-size: 1.4rem;
    .login-message {
      font-size: 2.1rem;
      color: ${Color.darkerGray()};
      font-weight: bold;
    }
  }

  .navigation {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
    gap: 1rem;
    width: 100%;
  }

  .navigation-item {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.85rem 1.4rem;
    border-radius: 1.1rem;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(148, 163, 184, 0.4);
    box-shadow: 0 12px 24px -18px rgba(15, 23, 42, 0.28);
    font-weight: 600;
    color: ${Color.darkerGray()};
    gap: 0.6rem;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease,
      border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
    .navigation-icon {
      color: ${Color.darkerGray()};
      transition: color 0.2s ease;
    }
    &:hover {
      transform: translateY(-2px);
      background: rgba(255, 255, 255, 0.99);
      border-color: var(
        --profile-widget-accent-border,
        ${Color.borderGray()}
      );
      box-shadow: 0 18px 32px -20px rgba(15, 23, 42, 0.34);
      color: var(--profile-widget-accent, ${Color.logoBlue()});
      .navigation-icon {
        color: var(--profile-widget-accent, ${Color.logoBlue()});
      }
    }
  }

  @media (max-width: ${mobileMaxWidth}) {
    border-radius: 0;
    border-left: 0;
    border-right: 0;
    box-shadow: none;
    .heading {
      padding: 1.4rem 1.6rem;
      .widget__profile-pic {
        --profile-pic-size: 8rem;
      }
      .names {
        a {
          font-size: 2.5rem;
        }
        span {
          font-size: 1.4rem;
        }
      }
    }
    .details {
      padding: 1.5rem 1.4rem 1.8rem;
      text-align: center;
      .login-message {
        font-size: 2.6rem;
      }
    }
    .navigation {
      grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
    }
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
    return getThemeStyles(themeName, 0.08).hoverBg;
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
        <div className="details">
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
