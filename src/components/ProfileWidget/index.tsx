import React from 'react';
import ProfilePic from '~/components/ProfilePic';
import ErrorBoundary from '~/components/ErrorBoundary';
import WelcomeMessage from './WelcomeMessage';
import Icon from '~/components/Icon';
import { Color, mobileMaxWidth, wideBorderRadius } from '~/constants/css';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { useAppContext, useKeyContext } from '~/contexts';
import { useHomePanelVars } from '~/theme/useHomePanelVars';
import { useRoleColor } from '~/theme/useRoleColor';

const container = css`
  width: 100%;
  margin-top: 1rem;
  border-radius: ${wideBorderRadius};
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border: 1px solid var(--ui-border);
  background: var(--profile-widget-bg, #f6f7fd);
  box-shadow: none;
  backdrop-filter: blur(6px);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .heading {
    padding: 1.2rem 1.6rem;
    display: flex;
    gap: 1.6rem;
    align-items: center;
    background: rgba(255, 255, 255, 0.99);
    border-bottom: 1px solid var(--ui-border);
    cursor: pointer;
    transition: background 0.25s ease;
    .widget__profile-pic {
      --profile-pic-size: 7.4rem;
      border-radius: 2rem;
      box-shadow: none;
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
    padding: 1.2rem 1.6rem 1.4rem;
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
    padding: 0.7rem 1.2rem;
    border-radius: 1.1rem;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid var(--ui-border);
    box-shadow: none;
    font-weight: 600;
    color: ${Color.darkerGray()};
    gap: 0.6rem;
    cursor: pointer;
    transition: transform 0.2s ease,
      border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
    .navigation-icon {
      color: ${Color.darkerGray()};
      transition: color 0.2s ease;
    }
    &:hover {
      transform: translateY(-2px);
      background: rgba(255, 255, 255, 0.99);
      border-color: var(--ui-border-strong);
      box-shadow: none;
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
  const { profilePicUrl, realName, userId, username } = useKeyContext(
    (v) => v.myState
  );
  const { themeStyles, accentColor: defaultAccent } = useHomePanelVars(0.08);
  const themeBg = themeStyles.hoverBg || '#f6f7fd';
  const homeMenuItemActiveRole = useRoleColor('homeMenuItemActive', {
    fallback: 'logoBlue'
  });
  const accentColor = React.useMemo(() => {
    return homeMenuItemActiveRole.getColor() || defaultAccent;
  }, [homeMenuItemActiveRole, defaultAccent]);
  const accentBorderColor = React.useMemo(() => {
    return homeMenuItemActiveRole.getColor(0.4) || 'var(--ui-border)';
  }, [homeMenuItemActiveRole, defaultAccent]);

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
