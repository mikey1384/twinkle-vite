import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '~/contexts';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import BuildCard from './BuildCard';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

interface Build {
  id: number;
  userId: number;
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

export default function Builds({
  selectedTheme,
  profileUserId
}: {
  selectedTheme: string;
  profileUserId: number;
}) {
  const { username } = useParams();
  const navigate = useNavigate();
  const loadUserBuilds = useAppContext((v) => v.requestHelpers.loadUserBuilds);

  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreButton, setLoadMoreButton] = useState<number | null>(null);

  useEffect(() => {
    handleLoadBuilds();

    async function handleLoadBuilds() {
      setLoading(true);
      try {
        const data = await loadUserBuilds({ userId: profileUserId });
        setBuilds(data?.builds || []);
        setLoadMoreButton(data?.loadMoreButton || null);
      } catch (error) {
        console.error('Failed to load builds:', error);
      }
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileUserId]);

  async function handleLoadMore() {
    if (loadingMore || !loadMoreButton) return;
    setLoadingMore(true);
    try {
      const data = await loadUserBuilds({
        userId: profileUserId,
        lastId: loadMoreButton
      });
      setBuilds((prev) => [...prev, ...(data?.builds || [])]);
      setLoadMoreButton(data?.loadMoreButton || null);
    } catch (error) {
      console.error('Failed to load more builds:', error);
    }
    setLoadingMore(false);
  }

  function handleBuildClick(buildId: number) {
    navigate(`/build/${buildId}`);
  }

  if (loading) {
    return <Loading />;
  }

  if (builds.length === 0) {
    return (
      <div
        className={css`
          width: 100%;
          padding: 3rem 1rem;
          text-align: center;
          color: var(--chat-text);
          opacity: 0.7;
        `}
      >
        {username} hasn&apos;t published any builds yet.
      </div>
    );
  }

  return (
    <div
      className={css`
        width: 100%;
        max-width: 60rem;
        padding: 0 1rem;
        @media (max-width: ${mobileMaxWidth}) {
          padding: 0 0.5rem;
        }
      `}
    >
      <div
        className={css`
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
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
            color={selectedTheme}
          />
        </div>
      )}
    </div>
  );
}
