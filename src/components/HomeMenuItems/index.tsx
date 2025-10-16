import React, { useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  borderRadius,
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
  const activeRgb = useMemo<[number, number, number] | null>(() => {
    if (!activeColorFn) return null;
    const colorString = activeColorFn();
    const match = colorString.match(
      /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/
    );
    if (!match) return null;
    return [Number(match[1]), Number(match[2]), Number(match[3])];
  }, [activeColorFn]);
  const activeTextColor = useMemo(() => {
    if (!activeRgb) return Color.darkerGray();
    const normalize = (value: number) => {
      const channel = value / 255;
      return channel <= 0.03928
        ? channel / 12.92
        : Math.pow((channel + 0.055) / 1.055, 2.4);
    };
    const [r, g, b] = activeRgb;
    const luminance =
      0.2126 * normalize(r) +
      0.7152 * normalize(g) +
      0.0722 * normalize(b);
    return luminance >= 0.6 ? Color.darkerGray() : Color.white();
  }, [activeRgb]);
  const hoverAccentColor = useMemo(() => {
    if (activeColorFn) return activeColorFn();
    return Color.logoBlue();
  }, [activeColorFn]);
  const hoverBorderColor = useMemo(() => {
    if (activeColorFn) return activeColorFn(0.35);
    return Color.borderGray();
  }, [activeColorFn]);
  const themeBg = useMemo(() => {
    const themeName = (profileTheme || 'logoBlue') as string;
    // Subtle theme-tinted background for the container
    return getThemeStyles(themeName, 0.06).bg;
  }, [profileTheme]);
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
          overflow-y: auto;
          background: ${themeBg};
          display: flex;
          flex-direction: column;
          font-size: 1.7rem;
          border: 1px solid ${Color.borderGray()};
          border-radius: ${borderRadius};
          border-left: 0;
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
          padding: 1rem 0 1.2rem;
          box-shadow: 0 8px 18px -14px rgba(15, 23, 42, 0.25);
          > nav {
            height: 4.4rem;
            margin: 0.7rem 0;
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
              text-align: center;
              display: flex;
              align-items: center;
              justify-content: center;
              color: ${Color.darkGray()};
              text-decoration: none;
            }
            .homemenu__item {
              width: 100%;
              height: 100%;
              display: grid;
              grid-template-columns: 4px 4rem 1fr;
              grid-template-rows: 100%;
              grid-template-areas: 'selection icon label';
              margin: 0.6rem 1rem;
              border-radius: ${wideBorderRadius};
              background: rgba(255, 255, 255, 0.92);
              border: 1px solid rgba(148, 163, 184, 0.35);
              box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08),
                0 8px 16px rgba(15, 23, 42, 0.08);
              transition: background 0.18s ease, box-shadow 0.18s ease,
                border-color 0.18s ease, color 0.18s ease, transform 0.06s ease;
              > .selection {
                grid-area: selection;
                margin-left: -1px;
                border-radius: 1rem;
                align-self: center;
                width: 4px;
                height: 70%;
              }
              > .icon {
                grid-area: icon;
                padding-left: 0.5rem;
                justify-self: center;
                align-self: center;
                color: ${Color.darkerGray()};
              }
              > .label {
                grid-area: label;
                padding-left: 1.6rem;
                justify-self: start;
                align-self: center;
                font-weight: 600;
              }
            }
          }
          > nav:hover {
            transform: translateX(4px);
            .homemenu__item {
              background: rgba(255, 255, 255, 0.98);
              border-color: ${hoverBorderColor};
              box-shadow: 0 10px 20px -12px rgba(15, 23, 42, 0.28),
                0 2px 6px rgba(15, 23, 42, 0.08);
              > .icon,
              > .label {
                color: ${hoverAccentColor};
              }
            }
            a {
              color: ${hoverAccentColor};
            }
          }
          > nav.active {
            .homemenu__item {
              background: ${activeColorFn
                ? activeColorFn(0.16)
                : Color.highlightGray()};
              > .selection {
                background: ${homeMenuItemActiveColor};
                border: 1px solid ${homeMenuItemActiveColor};
                box-shadow: 0 0 1px ${homeMenuItemActiveColor};
              }
              > .icon,
              > .label {
                color: ${activeTextColor};
              }
              border-color: ${activeColorFn
                ? activeColorFn(0.35)
                : Color.borderGray()};
              box-shadow: 0 8px 22px -16px
                ${activeColorFn ? activeColorFn(0.45) : Color.borderGray()};
            }
            font-weight: bold;
            color: ${activeTextColor};
            a {
              color: ${activeTextColor};
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
            border-left: 1px solid ${Color.borderGray()};
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
