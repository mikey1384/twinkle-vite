import { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import { useLocation, useNavigate } from 'react-router-dom';
import { Color, desktopMinWidth, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import {
  useAppContext,
  useContentContext,
  useExploreContext,
  useKeyContext,
  useProfileContext
} from '~/contexts';

const BodyRef = document.scrollingElement || document.documentElement;

Nav.propTypes = {
  alert: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
  imgLabel: PropTypes.string,
  isHome: PropTypes.bool,
  profileUsername: PropTypes.string,
  to: PropTypes.string,
  style: PropTypes.object
};

function Nav({
  alert,
  className,
  children,
  imgLabel,
  isHome,
  profileUsername,
  to,
  style
}) {
  const {
    alert: { color: alertColor }
  } = useKeyContext((v) => v.theme);
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const onResetProfile = useProfileContext((v) => v.actions.onResetProfile);
  const profileState = useProfileContext((v) => v.state) || {};
  const onReloadContent = useContentContext((v) => v.actions.onReloadContent);
  const onClearLinksLoaded = useExploreContext(
    (v) => v.actions.onClearLinksLoaded
  );
  const onClearVideosLoaded = useExploreContext(
    (v) => v.actions.onClearVideosLoaded
  );
  const onSetSubjectsLoaded = useExploreContext(
    (v) => v.actions.onSetSubjectsLoaded
  );
  const highlightColor = useMemo(
    () => (alert ? Color[alertColor]() : Color.darkGray()),
    [alert, alertColor]
  );
  const onSetProfilesLoaded = useAppContext(
    (v) => v.user.actions.onSetProfilesLoaded
  );

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
        .chat {
          color: ${Color.lightGray()};
        }
        nav {
          text-decoration: none;
          font-weight: bold;
          color: ${Color.lightGray()};
          align-items: center;
          line-height: 1;
        }
        > nav.active {
          color: ${highlightColor}!important;
          > svg {
            color: ${highlightColor}!important;
          }
        }
        @media (min-width: ${desktopMinWidth}) {
          &:hover {
            > nav {
              > svg {
                color: ${highlightColor};
              }
              color: ${highlightColor};
            }
          }
        }
        @media (max-width: ${mobileMaxWidth}) {
          width: 100%;
          justify-content: center;
          font-size: 3rem;
          nav {
            .nav-label {
              display: none;
            }
          }
          > nav.active {
            > svg {
              color: ${highlightColor};
            }
          }
        }
      `}`}
      style={style}
    >
      <nav
        className={navClassName}
        style={{
          display: 'flex',
          alignItems: 'center',
          ...(alert ? { color: Color[alertColor]() } : {})
        }}
        onClick={() => navigate(to)}
      >
        <Icon icon={isHome ? 'home' : imgLabel} />
        <span className="nav-label" style={{ marginLeft: '0.7rem' }}>
          {children}
        </span>
      </nav>
    </div>
  );

  function handleNavClick() {
    if (!pathname) return;
    if (pathname === to) {
      document.getElementById('App').scrollTop = 0;
      BodyRef.scrollTop = 0;
    }
    if (pathname.includes('/users/') && pathname === to) {
      const username = pathname.split('/users/')[1].split('/')[0];
      const { profileId } = profileState[username] || {};
      onReloadContent({
        contentId: profileId,
        contentType: 'user'
      });
      onResetProfile(username);
    }
    if (pathname === '/users' && pathname === to) {
      onSetProfilesLoaded(false);
    }
    if (
      ['/featured', '/videos', '/links', '/subjects', '/comments'].includes(
        pathname
      )
    ) {
      onClearLinksLoaded();
      onSetSubjectsLoaded(false);
      onClearVideosLoaded();
    }
  }
}

export default memo(Nav);
