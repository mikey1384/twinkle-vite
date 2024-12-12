import React, { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useViewContext } from '~/contexts';
import FilterBar from '~/components/FilterBar';
import Home from './Home';
import LikedPosts from './LikedPosts';
import Posts from './Posts';
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
import localize from '~/constants/localize';

const profileLabel = localize('Profile');
const watchedLabel = localize('watched');
const likesLabel = localize('likes');
const postsLabel = localize('posts');

Body.propTypes = {
  profile: PropTypes.shape({
    id: PropTypes.number.isRequired,
    username: PropTypes.string
  }),
  selectedTheme: PropTypes.string
};

export default function Body({
  profile,
  selectedTheme
}: {
  profile: { id: number; username: string };
  selectedTheme: string;
}) {
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

  useEffect(() => {
    const postsMatch = !mainMatch && !watchedMatch && !likesMatch;
    const subTitle = watchedMatch
      ? watchedLabel
      : likesMatch
      ? likesLabel
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
  }, [username, mainMatch, watchedMatch, likesMatch]);

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
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%'
        }}
      >
        <div
          className={css`
            width: 40%;
            background: #fff;
            border-bottom: 1px solid ${Color.borderGray()};
            @media (max-width: ${mobileMaxWidth}) {
              width: 20rem;
            }
          `}
        />
        <FilterBar
          style={{ margin: 0 }}
          color={selectedTheme}
          className={css`
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.3rem;
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
              !mainMatch && !watchedMatch && !likesMatch ? 'active' : ''
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
        </FilterBar>
        <div
          className={css`
            width: 35rem;
            background: #fff;
            border-bottom: 1px solid ${Color.borderGray()};
            @media (max-width: ${mobileMaxWidth}) {
              width: 0;
            }
          `}
        />
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
