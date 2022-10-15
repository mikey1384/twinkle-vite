import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { isMobile } from '~/helpers';
import { useAppContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import ErrorBoundary from '~/components/ErrorBoundary';
import localize from '~/constants/localize';

const BodyRef = document.scrollingElement || document.documentElement;

HomeMenuItems.propTypes = {
  style: PropTypes.object
};

const peopleLabel = localize('people');
const postsLabel = localize('posts');
const storeLabel = localize('store');
const deviceIsMobile = isMobile(navigator);
const year = (() => {
  const dt = new Date();
  return dt.getFullYear();
})();

export default function HomeMenuItems({ style = {} }) {
  const location = useLocation();
  const navigate = useNavigate();
  const onSetProfilesLoaded = useAppContext(
    (v) => v.user.actions.onSetProfilesLoaded
  );
  const { managementLevel } = useKeyContext((v) => v.myState);
  const {
    homeMenuItemActive: { color: homeMenuItemActive }
  } = useKeyContext((v) => v.theme);
  const homeMenuItemActiveColor = useMemo(
    () => Color[homeMenuItemActive](),
    [homeMenuItemActive]
  );

  return (
    <ErrorBoundary componentPath="HomeMenuItems">
      <div
        className={`unselectable ${css`
          width: 100%;
          background: #fff;
          display: flex;
          font-size: 1.7rem;
          flex-direction: column;
          border: 1px solid ${Color.borderGray()};
          border-radius: ${borderRadius};
          border-left: 0;
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
          padding-top: 1rem;
          > nav {
            height: 4rem;
            width: 100%;
            cursor: pointer;
            display: flex;
            align-items: center;
            color: ${Color.gray()};
            justify-content: center;
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
              grid-template-columns: 2px 4rem 1fr;
              grid-template-rows: 100%;
              grid-template-areas: 'selection icon label';
              > .selection {
                grid-area: selection;
                margin-left: -1px;
              }
              > .icon {
                grid-area: icon;
                padding-left: 1rem;
                justify-self: center;
                align-self: center;
              }
              > .label {
                grid-area: label;
                padding-left: 2rem;
                justify-self: start;
                align-self: center;
              }
            }
          }
          > nav:hover {
            background: ${Color.highlightGray()};
            color: ${Color.black()};
            a {
              color: ${Color.black()};
            }
          }
          > nav.active {
            .homemenu__item {
              > .selection {
                background: ${homeMenuItemActiveColor};
                border: 1px solid ${homeMenuItemActiveColor};
                box-shadow: 0 0 1px ${homeMenuItemActiveColor};
              }
            }
            font-weight: bold;
            color: ${Color.black()};
            a {
              color: ${Color.black()};
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
              a {
                justify-content: center;
                padding: 0;
              }
            }
            > nav:hover {
              background: none;
              color: ${Color.darkGray()};
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
          className={location.pathname === '/store' ? 'active' : ''}
          onClick={() => navigate('/store')}
        >
          <a href="/store" onClick={(e) => e.preventDefault()}>
            <div className="homemenu__item">
              <div className="selection" />
              <div className="icon">
                <Icon icon="shopping-bag" size="1x" />
              </div>
              <div className="label">{storeLabel}</div>
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
                  <Icon icon="sliders-h" size="1x" />
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
      document.getElementById('App').scrollTop = 0;
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
