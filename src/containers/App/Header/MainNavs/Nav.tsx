import React, { memo, useMemo } from 'react';
import Icon from '~/components/Icon';
import { Link, useLocation } from 'react-router-dom';
import { Color, desktopMinWidth, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import {
  useAppContext,
  useContentContext,
  useExploreContext,
  useHomeContext,
  useNotiContext,
  useProfileContext
} from '~/contexts';
import { useRoleColor } from '~/theme/useRoleColor';

const BodyRef = document.scrollingElement || document.documentElement;

function Nav({
  alert,
  className,
  children,
  imgLabel,
  isHome,
  isUsingChat,
  profileUsername,
  to,
  style
}: {
  alert?: boolean;
  className?: string;
  children?: React.ReactNode;
  imgLabel?: string;
  isHome?: boolean;
  isUsingChat?: boolean;
  profileUsername?: string;
  to: string;
  style?: React.CSSProperties;
}) {
  const todayStats = useNotiContext((v) => v.state.todayStats);
  const alertRole = useRoleColor('alert', { fallback: 'gold' });
  const alertHue = useMemo(
    () => alertRole.getColor() || Color.gold(),
    [alertRole]
  );
  const { pathname, search } = useLocation();
  const onResetProfile = useProfileContext((v) => v.actions.onResetProfile);
  const profileState = useProfileContext((v) => v.state || {});
  const onReloadContent = useContentContext((v) => v.actions.onReloadContent);
  const onClearAICardsLoaded = useExploreContext(
    (v) => v.actions.onClearAICardsLoaded
  );
  const onClearLinksLoaded = useExploreContext(
    (v) => v.actions.onClearLinksLoaded
  );
  const onClearVideosLoaded = useExploreContext(
    (v) => v.actions.onClearVideosLoaded
  );
  const onSetSubjectsLoaded = useExploreContext(
    (v) => v.actions.onSetSubjectsLoaded
  );
  const { getColor: getFilterColor } = useRoleColor('filter', {
    fallback: 'logoBlue'
  });
  const activeColor = useMemo(
    () => getFilterColor() || Color.logoBlue(),
    [getFilterColor]
  );
  const hoverBorder = useMemo(
    () => getFilterColor(0.28) || Color.logoBlue(0.28),
    [getFilterColor]
  );
  const activeBorder = useMemo(
    () => getFilterColor() || Color.logoBlue(),
    [getFilterColor]
  );
  const highlightColor = useMemo(
    () => (alert ? alertHue : activeColor),
    [alert, alertHue, activeColor]
  );
  const onSetProfilesLoaded = useAppContext(
    (v) => v.user.actions.onSetProfilesLoaded
  );
  const onResetGroups = useHomeContext((v) => v.actions.onResetGroups);
  const isDailyTaskAlerted = useMemo(() => {
    if (!isHome || !isUsingChat) return false;
    const hasDailyBonusButNotAttempted =
      !!todayStats.dailyHasBonus && !todayStats.dailyBonusAttempted;
    const resultNotViewed = !todayStats.dailyRewardResultViewed;
    return (
      todayStats.achievedDailyGoals.length === 3 &&
      (hasDailyBonusButNotAttempted || resultNotViewed)
    );
  }, [
    isHome,
    isUsingChat,
    todayStats?.achievedDailyGoals?.length,
    todayStats?.dailyBonusAttempted,
    todayStats?.dailyHasBonus,
    todayStats?.dailyRewardResultViewed
  ]);

  const navClassName = useMemo(() => {
    if ((to || '').split('/')[1] === 'chat') {
      if (pathname.split('/')[1] === 'chat') {
        return 'active';
      }
      return '';
    }

    if (
      profileUsername &&
      (pathname.split('/')[1] === profileUsername ||
        pathname.split('/')[2] === profileUsername)
    ) {
      return 'active';
    }
    if (pathname + (search || '') === to) {
      return 'active';
    }
    return '';
  }, [pathname, profileUsername, search, to]);

  return (
    <div
      onClick={handleNavClick}
      className={`${className} ${css`
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        a {
          text-decoration: none;
          font-weight: 600;
          color: ${Color.gray()};
          align-items: center;
          line-height: 1;
          padding: 0.6rem 1rem 0.9rem;
          border: none;
          background: transparent;
          box-shadow: none;
          border-bottom: 2px solid transparent;
        }
        > a.active {
          color: ${highlightColor}!important;
          background: transparent !important;
          border-bottom-color: ${activeBorder} !important;
          > svg {
            color: ${highlightColor}!important;
          }
        }
        @keyframes colorChange {
          0% {
            color: #6a11cb;
          }
          33% {
            color: #2575fc;
          }
          66% {
            color: #ec008c;
          }
          100% {
            color: #fc6767;
          }
        }

        .color-animate {
          animation: colorChange 6s infinite alternate;
        }
        ${!isDailyTaskAlerted
          ? `@media (min-width: ${desktopMinWidth}) {
              &:hover {
                > a {
                  > svg {
                    color: ${highlightColor};
                  }
                  color: ${highlightColor};
                  border-bottom-color: ${hoverBorder};
                }
              }
            }`
          : ''}
        @media (max-width: ${mobileMaxWidth}) {
          width: 100%;
          justify-content: center;
          font-size: 3rem;
          a {
            .nav-label {
              display: none;
            }
            padding: 0.5rem 0.7rem;
            background: transparent;
            box-shadow: none;
            border: none;
          }
          > a.active {
            > svg {
              color: ${highlightColor};
            }
          }
        }
      `}`}
      style={style}
    >
      <Link
        className={`${navClassName} ${
          isDailyTaskAlerted ? 'color-animate' : ''
        }`}
        style={{
          display: 'flex',
          alignItems: 'center',
          ...(alert ? { color: alertHue } : {})
        }}
        to={to}
      >
        <Icon icon={isHome ? 'home' : imgLabel} />
        <span className="nav-label" style={{ marginLeft: '0.7rem' }}>
          {children}
        </span>
      </Link>
    </div>
  );

  function handleNavClick() {
    if (!to) return;
    if (to.includes('/users/') && to === pathname) {
      const username = to.split('/users/')[1].split('/')[0];
      const { profileId } = profileState[username] || {};
      onReloadContent({
        contentId: profileId,
        contentType: 'user'
      });
      onResetProfile(username);
    }
    if (to === '/users' && to === pathname) {
      onSetProfilesLoaded(false);
    }
    if (to === '/groups' && to === pathname) {
      onResetGroups();
    }
    if (
      ['/videos', '/links', '/subjects', '/ai-cards'].includes(to) &&
      ['/videos', '/links', '/subjects', '/ai-cards'].includes(pathname)
    ) {
      onClearAICardsLoaded();
      onClearLinksLoaded();
      onSetSubjectsLoaded(false);
      onClearVideosLoaded();
    }
    const appElement = document.getElementById('App');
    if (to === pathname) {
      if (appElement) appElement.scrollTop = 0;
      BodyRef.scrollTop = 0;
    }
  }
}

export default memo(Nav);
