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
  useProfileContext,
  useKeyContext,
  useViewContext
} from '~/contexts';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { DEFAULT_PROFILE_THEME } from '~/constants/defaultValues';
import { resetAppShellScroll } from '~/helpers/appShellScroll';

function getBuildAppIdFromPath(value: string) {
  const pathname = String(value || '').split(/[?#]/)[0];
  const match = /^\/app\/(\d+)(?:\/|$)/.exec(pathname);
  return match?.[1] || '';
}

function buildAppTabMatchesPath(to: string, pathname: string) {
  const targetBuildId = getBuildAppIdFromPath(to);
  if (!targetBuildId) return false;
  return targetBuildId === getBuildAppIdFromPath(pathname);
}

function Nav({
  alert,
  className,
  children,
  imgLabel,
  isHome,
  isUsingChat,
  profileUsername,
  to,
  style,
  variant,
  tabKind,
  exactActive
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
  variant?: 'tab';
  tabKind?: 'pinned' | 'dynamic';
  exactActive?: boolean;
}) {
  const AI_FEATURES_DISABLED = useViewContext(
    (v) => v.state.aiFeaturesDisabled
  );
  const todayStats = useNotiContext((v) => v.state.todayStats);
  const viewerTheme =
    useKeyContext((v) => v.myState.profileTheme) || DEFAULT_PROFILE_THEME;
  const alertRole = useRoleColor('alert', {
    fallback: 'gold',
    themeName: viewerTheme
  });
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
    fallback: 'logoBlue',
    themeName: viewerTheme
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
  const activeUnderlineColor = useMemo(
    () => (alert ? alertHue : activeBorder),
    [alert, alertHue, activeBorder]
  );
  const hoverUnderlineColor = useMemo(
    () => (alert ? alertHue : hoverBorder),
    [alert, alertHue, hoverBorder]
  );
  const onSetProfilesLoaded = useAppContext(
    (v) => v.user.actions.onSetProfilesLoaded
  );
  const onResetGroups = useHomeContext((v) => v.actions.onResetGroups);
  const isDailyTaskAlerted = useMemo(() => {
    if (!isHome || !isUsingChat) return false;
    const hasDailyBonusButNotAttempted =
      !AI_FEATURES_DISABLED &&
      !!todayStats.dailyHasBonus &&
      !todayStats.dailyBonusAttempted;
    const resultNotViewed = !todayStats.dailyRewardResultViewed;
    return (
      todayStats.achievedDailyGoals.length === 3 &&
      (hasDailyBonusButNotAttempted || resultNotViewed)
    );
  }, [
    AI_FEATURES_DISABLED,
    isHome,
    isUsingChat,
    todayStats?.achievedDailyGoals?.length,
    todayStats?.dailyBonusAttempted,
    todayStats?.dailyHasBonus,
    todayStats?.dailyRewardResultViewed
  ]);

  const navClassName = useMemo(() => {
    // captured (custom) tabs target one specific page; the section-prefix
    // rules below would light them up across a whole section (e.g. a
    // pinned /management/a tab on every /management route)
    if (exactActive) {
      if (buildAppTabMatchesPath(to, pathname)) {
        return 'active';
      }
      // A captured tab whose `to` carries its own query string (e.g. a
      // query-identified content page) stays matched on the full path+search.
      if (to.includes('?')) {
        return pathname + (search || '') === to ? 'active' : '';
      }
      return pathname === to ? 'active' : '';
    }
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
    if (to.startsWith('/missions') && pathname.startsWith('/missions')) {
      return 'active';
    }
    if (to.startsWith('/build') && pathname.startsWith('/build')) {
      return 'active';
    }
    if (to.startsWith('/management') && pathname.startsWith('/management')) {
      return 'active';
    }
    if (pathname + (search || '') === to) {
      return 'active';
    }
    return '';
  }, [exactActive, pathname, profileUsername, search, to]);

  const tabVariantClass = css`
    position: relative;
    display: flex;
    align-items: flex-end;
    height: 100%;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    a {
      text-decoration: none;
      font-weight: 600;
      color: ${Color.gray()};
      display: flex;
      align-items: center;
      line-height: 1;
      height: 3.4rem;
      max-width: 15rem;
      padding: 0 1rem;
      border: 1px solid transparent;
      border-bottom: none;
      border-radius: 10px 10px 0 0;
      background: transparent;
      -webkit-tap-highlight-color: transparent;
    }
    .nav-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }
    ${tabKind === 'pinned'
      ? `a {
          background: ${Color.wellGray(0.6)};
        }`
      : ''}
    ${tabKind === 'dynamic'
      ? `.nav-label {
          font-style: italic;
        }`
      : ''}
    > a.active {
      color: ${highlightColor}!important;
      background: ${Color.white()};
      border-color: var(--ui-border);
      position: relative;
      z-index: 1;
      > svg {
        color: ${highlightColor}!important;
      }
    }
    > a:focus {
      outline: none;
    }
    > a:focus-visible {
      outline: none;
      background: ${Color.wellGray()};
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
            > a:not(.active) {
              background: ${Color.wellGray()};
              color: ${highlightColor};
              > svg {
                color: ${highlightColor};
              }
            }
          }
        }`
      : ''}
  `;

  return (
    <div
      className={`${className} ${
        variant === 'tab'
          ? tabVariantClass
          : css`
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
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
          -webkit-tap-highlight-color: transparent;
        }
        > a.active {
          color: ${highlightColor}!important;
          background: transparent !important;
          border-bottom-color: ${activeUnderlineColor} !important;
          > svg {
            color: ${highlightColor}!important;
          }
        }
        > a:focus {
          outline: none;
        }
        > a:focus-visible {
          text-decoration: none;
          outline: none;
          border-bottom-color: ${hoverUnderlineColor};
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
                  border-bottom-color: ${hoverUnderlineColor};
                }
              }
            }`
          : ''}
        @media (max-width: ${mobileMaxWidth}) {
          /* natural width so the bottom bar can pack + scroll (was 100% for the
             old evenly-spread fixed bar); centering is handled by the row */
          width: auto;
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
        onClick={handleNavClick}
        to={to}
        draggable={variant === 'tab' ? false : undefined}
      >
        <Icon icon={isHome ? 'home' : imgLabel} />
        {children ? (
          <span
            className="nav-label"
            style={{ marginLeft: variant === 'tab' ? '0.5rem' : '0.7rem' }}
          >
            {children}
          </span>
        ) : null}
      </Link>
    </div>
  );

  function handleNavClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (!to) return;
    if (navClickShouldKeepCurrentScroll(event)) return;
    if (navClickTargetsCurrentLocation(to, pathname, search)) {
      resetAppShellScroll();
    }
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
  }

  function navClickShouldKeepCurrentScroll(
    event: React.MouseEvent<HTMLAnchorElement>
  ) {
    return (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    );
  }

  function navClickTargetsCurrentLocation(
    target: string,
    currentPathname: string,
    currentSearch: string
  ) {
    const targetLocation = getNavTargetLocation(target);
    return (
      targetLocation.pathname === currentPathname &&
      targetLocation.search === currentSearch
    );
  }

  function getNavTargetLocation(target: string) {
    try {
      const url = new URL(target, window.location.origin);
      return {
        pathname: url.pathname,
        search: url.search
      };
    } catch {
      const [pathnameSearch] = target.split('#');
      const [pathname, targetSearch = ''] = pathnameSearch.split('?');
      return {
        pathname,
        search: targetSearch ? `?${targetSearch}` : ''
      };
    }
  }
}

export default memo(Nav);
