import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext, useKeyContext } from '~/contexts';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import FilterBar from '~/components/FilterBar';
import ErrorBoundary from '~/components/ErrorBoundary';
import BuildCard from './BuildCard';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

const displayFontFamily =
  "'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Arial Rounded MT Bold', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

type SortOption = 'recent' | 'popular' | 'starred';

interface Build {
  id: number;
  userId: number;
  username: string;
  profilePicUrl: string | null;
  title: string;
  description: string | null;
  slug: string;
  status: string;
  thumbnailUrl: string | null;
  publishedAt: number;
  sourceBuildId: number | null;
  createdAt: number;
  updatedAt: number;
  stats: {
    viewCount: number;
    starCount: number;
    commentCount: number;
    forkCount: number;
  };
}

const galleryFilterClass = css`
  border: 1px solid rgba(65, 140, 235, 0.24);
  border-radius: 14px;
  padding: 0.35rem;
  background: #fff;

  > .nav-section > nav {
    border-bottom: none !important;
    border-radius: 10px;
    transition: transform 0.15s ease;
  }

  > .nav-section > nav.active {
    background: rgba(65, 140, 235, 0.14);
    color: #1d4ed8 !important;
  }

  > .nav-section > nav:not(.active):hover {
    background: rgba(65, 140, 235, 0.08);
    transform: translateY(-1px);
  }
`;

export default function Builds() {
  const navigate = useNavigate();
  const { profileTheme } = useKeyContext((v) => v.myState);
  const loadPublicBuilds = useAppContext(
    (v) => v.requestHelpers.loadPublicBuilds
  );

  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreButton, setLoadMoreButton] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('recent');

  useEffect(() => {
    handleLoadBuilds();

    async function handleLoadBuilds() {
      setLoading(true);
      try {
        const data = await loadPublicBuilds({ sort: sortOption });
        setBuilds(data?.builds || []);
        setLoadMoreButton(
          data?.cursor != null
            ? String(data.cursor)
            : data?.loadMoreButton != null
              ? String(data.loadMoreButton)
              : null
        );
      } catch (error) {
        console.error('Failed to load builds:', error);
      }
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortOption]);

  async function handleLoadMore() {
    if (loadingMore || !loadMoreButton) return;
    setLoadingMore(true);
    try {
      const loadMoreParams: any = { sort: sortOption };
      if (/^\d+$/.test(loadMoreButton)) {
        loadMoreParams.lastId = Number(loadMoreButton);
      } else {
        loadMoreParams.cursor = loadMoreButton;
      }
      const data = await loadPublicBuilds(loadMoreParams);
      setBuilds((prev) => [...prev, ...(data?.builds || [])]);
      setLoadMoreButton(
        data?.cursor != null
          ? String(data.cursor)
          : data?.loadMoreButton != null
            ? String(data.loadMoreButton)
            : null
      );
    } catch (error) {
      console.error('Failed to load more builds:', error);
    }
    setLoadingMore(false);
  }

  function handleBuildClick(buildId: number) {
    navigate(`/build/${buildId}`);
  }

function handleSortChange(sort: SortOption) {
    if (sort !== sortOption) {
      setSortOption(sort);
    }
  }

  return (
    <ErrorBoundary componentPath="Builds">
      <div
        className={css`
          width: 100%;
          min-height: 100%;
        `}
      >
        <div
          className={css`
            background: #fff;
            padding: 1.5rem 2rem;
            border-bottom: 1px solid var(--ui-border);
            @media (max-width: ${mobileMaxWidth}) {
              padding: 1rem;
            }
          `}
        >
          <div
            className={css`
              max-width: 1200px;
              margin: 0 auto;
            `}
          >
            <div
              className={css`
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 1rem;
              `}
            >
              <div>
                <h1
                  className={css`
                    margin: 0;
                    font-size: 2.45rem;
                    font-weight: 900;
                    color: var(--chat-text);
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-family: ${displayFontFamily};
                    @media (max-width: ${mobileMaxWidth}) {
                      font-size: 2rem;
                    }
                  `}
                >
                  <Icon icon="laptop-code" />
                  Build Gallery
                </h1>
                <p
                  className={css`
                    margin: 0.5rem 0 0 0;
                    font-size: 1rem;
                    color: var(--chat-text);
                    opacity: 0.7;
                  `}
                >
                  Discover apps created by the community
                </p>
              </div>
              <GameCTAButton
                onClick={() => navigate('/build/new')}
                variant="gold"
                size="lg"
                shiny
                icon="plus"
              >
                Create Build
              </GameCTAButton>
            </div>
          </div>
        </div>

        <div
          className={css`
            background: #fff;
            border-bottom: 1px solid var(--ui-border);
          `}
        >
          <div
            className={css`
              max-width: 1200px;
              margin: 0 auto;
              padding: 0.65rem 0.9rem 0.95rem;
              @media (max-width: ${mobileMaxWidth}) {
                padding: 0.55rem;
              }
            `}
          >
            <FilterBar
              style={{ margin: 0, minHeight: '3.6rem', fontSize: '1rem' }}
              className={galleryFilterClass}
              color={profileTheme}
            >
              <nav
                className={sortOption === 'recent' ? 'active' : ''}
                onClick={() => handleSortChange('recent')}
                style={{ cursor: 'pointer' }}
              >
                <a>Recent</a>
              </nav>
              <nav
                className={sortOption === 'popular' ? 'active' : ''}
                onClick={() => handleSortChange('popular')}
                style={{ cursor: 'pointer' }}
              >
                <a>Popular</a>
              </nav>
              <nav
                className={sortOption === 'starred' ? 'active' : ''}
                onClick={() => handleSortChange('starred')}
                style={{ cursor: 'pointer' }}
              >
                <a>Most Starred</a>
              </nav>
            </FilterBar>
          </div>
        </div>

        <div
          className={css`
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
            @media (max-width: ${mobileMaxWidth}) {
              padding: 1rem;
            }
          `}
        >
          {loading ? (
            <Loading />
          ) : builds.length === 0 ? (
            <div
              className={css`
                padding: 4rem 1rem;
                text-align: center;
                color: var(--chat-text);
              `}
            >
              <Icon
                icon="laptop-code"
                size="3x"
                style={{ marginBottom: '1rem', opacity: 0.4 }}
              />
              <p style={{ fontSize: '1.2rem', margin: '0 0 0.5rem 0' }}>
                No builds yet
              </p>
              <p style={{ opacity: 0.7, margin: 0 }}>
                Be the first to publish a build!
              </p>
            </div>
          ) : (
            <>
              <div
                className={css`
                  display: grid;
                  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                  gap: 1.5rem;
                  @media (max-width: ${mobileMaxWidth}) {
                    grid-template-columns: 1fr;
                    gap: 1rem;
                  }
                `}
              >
                {builds.map((build) => (
                  <BuildCard
                    key={build.id}
                    build={build}
                    onClick={() => handleBuildClick(build.id)}
                  />
                ))}
              </div>
              {loadMoreButton && (
                <div
                  className={css`
                    margin-top: 2rem;
                    display: flex;
                    justify-content: center;
                  `}
                >
                  <LoadMoreButton
                    loading={loadingMore}
                    onClick={handleLoadMore}
                    color={profileTheme}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
