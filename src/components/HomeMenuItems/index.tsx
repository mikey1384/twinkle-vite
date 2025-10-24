import React, { useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Color,
  mobileMaxWidth,
  tabletMaxWidth,
  wideBorderRadius,
  getThemeStyles
} from '~/constants/css';
import { isMobile } from '~/helpers';
import {
  useAppContext,
  useHomeContext,
  useKeyContext,
  useNotiContext
} from '~/contexts';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import ErrorBoundary from '~/components/ErrorBoundary';
import RecentGroupItems from './RecentGroupItems';
import localize from '~/constants/localize';

const BodyRef = document.scrollingElement || document.documentElement;

const peopleLabel = localize('people');
const postsLabel = localize('posts');
const achievementsLabel = localize('achievements');
const deviceIsMobile = isMobile(navigator);

export default function HomeMenuItems({
  style = {}
}: {
  style?: React.CSSProperties;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const { standardTimeStamp } = useNotiContext((v) => v.state.todayStats);
  const location = useLocation();
  const navigate = useNavigate();
  const onSetProfilesLoaded = useAppContext(
    (v) => v.user.actions.onSetProfilesLoaded
  );
  const onResetGroups = useHomeContext((v) => v.actions.onResetGroups);
  const managementLevel = useKeyContext((v) => v.myState.managementLevel);
  const homeMenuItemActive = useKeyContext(
    (v) => v.theme.homeMenuItemActive.color
  );
  const activeColorFn = useMemo(() => {
    const candidate = Color[homeMenuItemActive];
    return typeof candidate === 'function'
      ? (candidate as (opacity?: number) => string)
      : null;
  }, [homeMenuItemActive]);
  const homeMenuItemActiveColor = useMemo(() => {
    if (activeColorFn) return activeColorFn();
    return Color.logoBlue();
  }, [activeColorFn]);
  const activeContentColor = useMemo(() => {
    if (activeColorFn) return activeColorFn();
    return Color.logoBlue();
  }, [activeColorFn]);
  const hoverAccentColor = useMemo(() => {
    if (activeColorFn) return activeColorFn();
    return Color.logoBlue();
  }, [activeColorFn]);
  const themeName = (profileTheme || 'logoBlue') as string;
  const isVanta = themeName === 'vantaBlack';
  const hoverBg = useMemo(
    () => getThemeStyles(themeName, 0.12).bg,
    [themeName]
  );
  const outlineAccent = useMemo(() => {
    return isVanta
      ? 'rgba(0,0,0,0.9)'
      : activeColorFn
      ? activeColorFn(0.4)
      : 'var(--ui-border)';
  }, [activeColorFn, isVanta]);
  const year = useMemo(() => {
    return new Date(standardTimeStamp || Date.now()).getFullYear();
  }, [standardTimeStamp]);

  return (
    <ErrorBoundary componentPath="HomeMenuItems">
      <div
        className={`unselectable ${css`
          width: 100%;
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: visible;
          position: relative;
          background: #fff;
          &::before {
            content: '';
            display: none;
          }
          display: flex;
          flex-direction: column;
          font-size: 1.7rem;
          border: none;
          border-radius: ${wideBorderRadius};
          border-left: 0;
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
          padding: 0.6rem 0 0.8rem;
          box-shadow: none;
          > nav {
            position: relative;
            z-index: 1;
            height: 4.8rem;
            margin: 0.6rem 0;
            width: 100%;
            cursor: pointer;
            display: flex;
            align-items: center;
            color: ${Color.gray()};
            justify-content: center;
            transition: transform 0.18s ease;
            > a {
              width: 100%;
              height: 100%;
              text-align: left;
              display: flex;
              align-items: center;
              justify-content: flex-start;
              color: ${Color.darkGray()};
              text-decoration: none;
            }
            .homemenu__item {
              width: 100%;
              height: 100%;
              margin: 0.4rem 1rem;
              display: flex;
              align-items: center;
              gap: 1.1rem;
              padding: 1.2rem 1.5rem;
              border-radius: ${wideBorderRadius};
              background: transparent;
              border: 1px solid transparent;
              box-shadow: none;
              transition: background 0.18s ease, border-color 0.18s ease,
                color 0.18s ease, transform 0.06s ease;
              > .selection {
                display: none;
              }
              > .icon {
                padding-left: 0.2rem;
                color: ${Color.darkerGray()};
              }
              > .label {
                padding-left: 0.4rem;
                font-weight: 600;
              }
            }
          }
          > nav:hover {
            transform: translateX(4px);
            .homemenu__item {
              background: ${hoverBg};
              border-color: ${isVanta
                ? 'rgba(0,0,0,0.9)'
                : activeColorFn
                ? activeColorFn(0.4)
                : 'var(--ui-border)'};
              box-shadow: 0 12px 20px -14px rgba(15, 23, 42, 0.22);
              > .icon,
              > .label {
                color: ${isVanta ? Color.darkGray() : hoverAccentColor};
              }
            }
            a {
              color: ${isVanta ? Color.darkGray() : hoverAccentColor};
            }
          }
          > nav.active {
            .homemenu__item {
              background: ${isVanta
                ? 'rgba(0,0,0,0.7)'
                : activeColorFn
                ? activeColorFn(0.22)
                : Color.highlightGray()};
              > .selection {
                background: ${homeMenuItemActiveColor};
                border: 1px solid ${homeMenuItemActiveColor};
                box-shadow: 0 0 1px ${homeMenuItemActiveColor};
              }
              > .icon,
              > .label {
                color: ${isVanta ? '#ffffff' : activeContentColor};
              }
              border: 1px solid
                ${isVanta
                  ? 'rgba(0,0,0,0.9)'
                  : activeColorFn
                  ? activeColorFn(0.4)
                  : 'var(--ui-border)'};
              box-shadow: 0 16px 26px -18px ${outlineAccent};
            }
            font-weight: bold;
            color: ${isVanta ? '#ffffff' : activeContentColor};
            a {
              color: ${isVanta ? '#ffffff' : activeContentColor};
            }
          }
          @media (max-width: ${tabletMaxWidth}) {
            font-size: 1.5rem;
            > nav {
              .homemenu__item {
                margin: 0 0.6rem;
                > .icon {
                  padding-left: 0;
                }
                > .label {
                  padding-left: 0;
                }
              }
            }
          }
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 2rem;
            background: #fff;
            &::before {
              display: none;
            }
            border-radius: 0;
            border-left: 0;
            border-right: 0;
            > nav {
              height: 5rem;
              margin: 0.6rem 0;
              a {
                justify-content: center;
                padding: 0;
              }
              .homemenu__item {
                margin: 0.45rem 0.4rem;
                border-radius: ${wideBorderRadius};
                > .icon {
                  padding-left: 0.5rem;
                }
                > .label {
                  padding-left: 1.6rem;
                }
              }
            }
            > nav:hover {
              background: none;
              color: ${Color.darkGray()};
              transform: none;
              a {
                color: ${Color.darkGray()};
              }
            }
            > nav.active {
              .homemenu__item {
                > .selection {
                  margin-left: 0;
                }
              }
            }
          }
          @media (min-width: 2304px) {
            border-left: 1px solid var(--ui-border);
          }
        `}`}
        style={style}
      >
        <nav
          className={location.pathname === '/' ? 'active' : ''}
          onClick={handleStoryClick}
        >
          <a href="/" onClick={(e) => e.preventDefault()}>
            <div className="homemenu__item">
              <div className="selection" />
              <div className="icon">
                <Icon icon="book" size="1x" />
              </div>
              <div className="label">{postsLabel}</div>
            </div>
          </a>
        </nav>
        <nav
          className={location.pathname === '/users' ? 'active' : ''}
          onClick={handleOnPeopleClick}
        >
          <a href="/users" onClick={(e) => e.preventDefault()}>
            <div className="homemenu__item">
              <div className="selection" />
              <div className="icon">
                <Icon icon="users" size="1x" />
              </div>
              <div className="label">{peopleLabel}</div>
            </div>
          </a>
        </nav>
        <nav
          className={location.pathname === '/groups' ? 'active' : ''}
          onClick={() => {
            onResetGroups();
            navigate('/groups');
          }}
        >
          <a href="/groups" onClick={(e) => e.preventDefault()}>
            <div className="homemenu__item">
              <div className="selection" />
              <div className="icon">
                <Icon icon="comments" size="1x" />
              </div>
              <div className="label">Groups</div>
            </div>
          </a>
        </nav>
        {userId && <RecentGroupItems />}
        <nav
          className={location.pathname === '/earn' ? 'active' : ''}
          onClick={() => navigate('/earn')}
        >
          <a href="/earn" onClick={(e) => e.preventDefault()}>
            <div className="homemenu__item">
              <div className="selection" />
              <div className="icon">
                <Icon icon="bolt" size="1x" />
              </div>
              <div className="label">XP & KP</div>
            </div>
          </a>
        </nav>
        <nav
          className={location.pathname === '/achievements' ? 'active' : ''}
          onClick={() => navigate('/achievements')}
        >
          <a href="/achievements" onClick={(e) => e.preventDefault()}>
            <div className="homemenu__item">
              <div className="selection" />
              <div className="icon">
                <Icon icon="award" size="1x" />
              </div>
              <div className="label">{achievementsLabel}</div>
            </div>
          </a>
        </nav>
        <nav
          className={location.pathname === '/settings' ? 'active' : ''}
          onClick={() => navigate('/settings')}
        >
          <a href="/settings" onClick={(e) => e.preventDefault()}>
            <div className="homemenu__item">
              <div className="selection" />
              <div className="icon">
                <Icon icon="sliders-h" size="1x" />
              </div>
              <div className="label">Settings</div>
            </div>
          </a>
        </nav>
        {managementLevel > 0 && deviceIsMobile && (
          <nav
            className={
              location.pathname.split('/')[1] === 'management' ? 'active' : ''
            }
            onClick={() => navigate('/management')}
          >
            <a href="/management" onClick={(e) => e.preventDefault()}>
              <div className="homemenu__item">
                <div className="selection" />
                <div className="icon">
                  <Icon icon="user-group-crown" size="1x" />
                </div>
                <span className="label">Manage</span>
              </div>
            </a>
          </nav>
        )}
        <div
          style={{
            fontSize: '1rem',
            display: 'flex',
            justifyContent: 'flex-start',
            marginTop: '1.5rem',
            marginLeft: '1rem',
            marginBottom: '0.5rem',
            color: Color.gray()
          }}
        >
          <div>
            © {year} Twinkle Network ·{' '}
            <Link to="/privacy" style={{ color: Color.gray() }}>
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );

  function handleStoryClick() {
    if (location.pathname === '/') {
      const appElement = document.getElementById('App');
      if (appElement) appElement.scrollTop = 0;
      BodyRef.scrollTop = 0;
      return;
    }
    navigate('/');
  }

  function handleOnPeopleClick() {
    if (deviceIsMobile) {
      onSetProfilesLoaded(false);
    }
    navigate('/users');
  }
}
