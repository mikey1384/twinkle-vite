import React from 'react';
import ProfilePic from '~/components/ProfilePic';
import ErrorBoundary from '~/components/ErrorBoundary';
import WelcomeMessage from './WelcomeMessage';
import Icon from '~/components/Icon';
import {
  Color,
  mobileMaxWidth,
  tabletMaxWidth,
  borderRadius
} from '~/constants/css';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { useAppContext, useKeyContext } from '~/contexts';
import { useHomePanelVars } from '~/theme/useHomePanelVars';
import { useRoleColor } from '~/theme/useRoleColor';

const container = css`
  width: 100%;
  margin-top: 1rem;
  border-radius: ${borderRadius};
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border: none;
  background: #fff;
  box-shadow: none;
  backdrop-filter: none;
  display: flex;
  flex-direction: column;
  overflow: visible;

  .heading {
    padding: 0.8rem 1.2rem;
    display: flex;
    gap: 1.2rem;
    align-items: center;
    background: transparent;
    border-bottom: 0;
    cursor: pointer;
    transition: color 0.2s ease, transform 0.12s ease;
    .widget__profile-pic {
      --profile-pic-size: 6.2rem;
      box-shadow: none;
    }
    .titles {
      flex: 1 1 auto;
      min-width: 0;
      text-align: left;
      overflow: hidden;
      text-overflow: ellipsis;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      .real-name {
        color: ${Color.darkerGray()};
        font-weight: 700;
        font-size: 2rem;
      }
      .username {
        color: ${Color.gray()};
        font-size: 1.3rem;
        font-weight: 600;
      }
      &.no-realname {
        .username {
          color: ${Color.darkerGray()};
          font-size: 2rem;
          font-weight: 700;
        }
      }
    }
  }

  /* Tablet: stack name under avatar to avoid overflow */
  @media (max-width: ${tabletMaxWidth}) {
    .heading {
      flex-direction: column;
      align-items: center;
      gap: 0.8rem;
      .widget__profile-pic {
        --profile-pic-size: 5.6rem;
      }
      .titles {
        text-align: center;
        width: 100%;
        min-width: 0;
        .real-name,
        .username {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }
  }

  .details {
    padding: 0.8rem 1.2rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    background: transparent;
    font-size: 1.4rem;
    .login-message {
      font-size: 2rem;
      color: ${Color.darkerGray()};
      font-weight: 700;
    }
  }

  .navigation {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
    gap: 0.8rem;
    width: 100%;
  }

  .navigation-item {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.6rem 1rem;
    border-radius: 1rem;
    background: transparent;
    border: 1px solid transparent;
    box-shadow: none;
    font-weight: 600;
    color: ${Color.darkerGray()};
    gap: 0.6rem;
    cursor: pointer;
    transition: transform 0.12s ease, border-color 0.18s ease,
      background 0.18s ease, color 0.18s ease;
    .navigation-icon {
      color: ${Color.darkerGray()};
      transition: color 0.18s ease;
    }
    &:hover {
      transform: translateX(4px);
      background: var(--profile-widget-hover-bg, transparent);
      border-color: var(--profile-widget-accent-border, var(--ui-border));
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
      padding: 1.2rem 1.4rem;
      .widget__profile-pic {
        --profile-pic-size: 7.2rem;
      }
      .titles {
        .real-name {
          font-size: 2.3rem;
        }
        .username {
          font-size: 1.5rem;
        }
        &.no-realname {
          .username {
            font-size: 2.3rem;
          }
        }
      }
    }
    .details {
      padding: 1.2rem 1.2rem 1.6rem;
      text-align: center;
      .login-message {
        font-size: 2.4rem;
      }
    }
    .navigation {
      /* Stack navigation items in a single column on mobile */
      grid-template-columns: 1fr;
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
  const themeBg = themeStyles.hoverBg || 'transparent';
  const homeMenuItemActiveRole = useRoleColor('homeMenuItemActive', {
    fallback: 'logoBlue'
  });
  const accentColor = React.useMemo(() => {
    return homeMenuItemActiveRole.getColor() || defaultAccent;
  }, [homeMenuItemActiveRole, defaultAccent]);
  const accentBorderColor = React.useMemo(() => {
    return homeMenuItemActiveRole.getColor(0.4) || 'var(--ui-border)';
  }, [homeMenuItemActiveRole]);

  return (
    <ErrorBoundary componentPath="ProfileWidget/index">
      <div
        className={container}
        style={{
          ['--profile-widget-bg' as any]: themeBg,
          ['--profile-widget-hover-bg' as any]: themeBg,
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
            <div className={`titles ${!realName ? 'no-realname' : ''}`}>
              {realName ? <div className="real-name">{realName}</div> : null}
              <div className="username">@{username}</div>
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
