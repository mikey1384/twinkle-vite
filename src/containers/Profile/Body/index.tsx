import React, { useEffect, useMemo } from 'react';
import { mobileMaxWidth } from '~/constants/css';
import { useAppContext, useKeyContext, useViewContext } from '~/contexts';
import FilterBar from '~/components/FilterBar';
import Home from './Home';
import LikedPosts from './LikedPosts';
import Posts from './Posts';
import Builds from './Builds';
import {
  matchPath,
  Navigate,
  Routes,
  Route,
  useParams,
  useLocation,
  useNavigate
} from 'react-router-dom';
import { css } from '@emotion/css';
const profileLabel = 'Profile';
const watchedLabel = 'Watched';
const likesLabel = 'Likes';
const postsLabel = 'Posts';
const buildsLabel = 'Builds';

export default function Body({
  profile,
  selectedTheme
}: {
  profile: { id: number; username: string };
  selectedTheme: string;
}) {
  const isAdmin = useKeyContext((v) => v.myState.isAdmin);
  const sessionLoaded = useAppContext((v) => v.user.state.loaded);
  const onSetPageTitle = useViewContext((v) => v.actions.onSetPageTitle);
  const navigate = useNavigate();
  const location = useLocation();
  const { username } = useParams();

  const mainMatch = useMemo(
    () =>
      matchPath(
        {
          path: '/users/:username'
        },
        location.pathname
      ),
    [location.pathname]
  );
  const watchedMatch = useMemo(
    () =>
      matchPath(
        {
          path: '/users/:username/watched'
        },
        location.pathname
      ),
    [location.pathname]
  );
  const likesMatch = useMemo(
    () =>
      matchPath(
        {
          path: '/users/:username/likes/:section'
        },
        location.pathname
      ),
    [location.pathname]
  );
  const buildsMatch = useMemo(
    () => {
      if (!isAdmin) return null;
      return matchPath(
        {
          path: '/users/:username/builds'
        },
        location.pathname
      );
    },
    [isAdmin, location.pathname]
  );

  useEffect(() => {
    const postsMatch = !mainMatch && !watchedMatch && !likesMatch && !buildsMatch;
    const subTitle = watchedMatch
      ? watchedLabel
      : likesMatch
      ? likesLabel
      : buildsMatch
      ? buildsLabel
      : postsMatch
      ? postsLabel
      : '';
    if (username) {
      onSetPageTitle(
        `${subTitle ? `${subTitle} | ` : ''}${
          subTitle ? username : `${username} | Twinkle`
        }`
      );
    }
    return () => onSetPageTitle('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, mainMatch, watchedMatch, likesMatch, buildsMatch]);

  return (
    <div
      className={css`
        width: 100%;
        @media (max-width: ${mobileMaxWidth}) {
          width: 100%;
        }
      `}
    >
      <div
        className={css`
          width: 100%;
          border-bottom: none;
          background: #fff;
          padding: 0.2rem 0;
        `}
      >
        <FilterBar
          style={{ margin: 0 }}
          color={selectedTheme}
          className={css`
            /* On desktop, indent tabs so "Profile" starts under username column */
            > .nav-section {
              padding-left: 29rem;
            }
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.15rem;
              > .nav-section {
                padding-left: 15rem;
                gap: 0.3rem;
              }
              > .nav-section > nav {
                padding: 0.6rem 0.8rem;
              }
              > .nav-section > nav > a {
                max-width: 100%;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
            }
          `}
        >
          <nav
            className={mainMatch ? 'active' : ''}
            style={{ cursor: 'pointer' }}
            onClick={() => (mainMatch ? null : navigate(`/users/${username}`))}
          >
            <a>{profileLabel}</a>
          </nav>
          <nav
            className={watchedMatch ? 'active' : ''}
            style={{ cursor: 'pointer' }}
            onClick={() =>
              watchedMatch ? null : navigate(`/users/${username}/watched`)
            }
          >
            <a>{watchedLabel}</a>
          </nav>
          <nav
            className={likesMatch ? 'active' : ''}
            style={{ cursor: 'pointer' }}
            onClick={() =>
              likesMatch ? null : navigate(`/users/${username}/likes/all`)
            }
          >
            <a>{likesLabel}</a>
          </nav>
          <nav
            className={
              !mainMatch && !watchedMatch && !likesMatch && !buildsMatch
                ? 'active'
                : ''
            }
            style={{ cursor: 'pointer' }}
            onClick={() =>
              location.pathname === `/users/${username}/all`
                ? null
                : navigate(`/users/${username}/all`)
            }
          >
            <a>{postsLabel}</a>
          </nav>
          {isAdmin && (
            <nav
              className={buildsMatch ? 'active' : ''}
              style={{ cursor: 'pointer' }}
              onClick={() =>
                buildsMatch ? null : navigate(`/users/${username}/builds`)
              }
            >
              <a>{buildsLabel}</a>
            </nav>
          )}
        </FilterBar>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <div
          className={css`
            display: flex;
            margin: 1rem 0 0 0;
            width: 100%;
            justify-content: center;
            @media (max-width: ${mobileMaxWidth}) {
              margin-top: 1rem;
            }
          `}
        >
          <Routes>
            <Route path="/likes" element={<Navigate replace to={`./all`} />} />
            <Route
              path="/likes/:section"
              element={<LikedPosts selectedTheme={selectedTheme} />}
            />
            {!isAdmin && !sessionLoaded && (
              <Route path="/builds" element={null} />
            )}
            {!isAdmin && sessionLoaded && username && (
              <Route
                path="/builds"
                element={<Navigate replace to={`/users/${username}`} />}
              />
            )}
            {isAdmin && (
              <Route
                path="/builds"
                element={
                  <Builds
                    selectedTheme={selectedTheme}
                    profileUserId={profile.id}
                  />
                }
              />
            )}
            <Route
              path="/:section/*"
              element={<Posts selectedTheme={selectedTheme} />}
            />
            <Route
              path="*"
              element={<Home profile={profile} selectedTheme={selectedTheme} />}
            />
          </Routes>
        </div>
      </div>
    </div>
  );
}
