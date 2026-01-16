import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Loading from '~/components/Loading';
import Button from '~/components/Button';
import { useAppContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { timeSince } from '~/helpers/timeStampHelpers';

export default function BuildList() {
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
  const loadMyBuilds = useAppContext((v) => v.requestHelpers.loadMyBuilds);

  const [loading, setLoading] = useState(true);
  const [builds, setBuilds] = useState<any[]>([]);

  useEffect(() => {
    if (userId) {
      handleLoad();
    } else {
      setLoading(false);
    }

    async function handleLoad() {
      try {
        const data = await loadMyBuilds();
        setBuilds(data?.builds || []);
      } catch (error) {
        console.error('Failed to load builds:', error);
      }
      setLoading(false);
    }
  }, [userId]);

  if (!userId) {
    return (
      <div
        className={css`
          width: 100%;
          max-width: 800px;
          margin: 3rem auto;
          padding: 2rem;
          text-align: center;
        `}
      >
        <h2 style={{ marginBottom: '1rem' }}>Build</h2>
        <p style={{ color: Color.darkGray() }}>
          Please log in to create and manage your builds.
        </p>
      </div>
    );
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <div
      className={css`
        width: 100%;
        max-width: 800px;
        margin: 2rem auto;
        padding: 1rem 2rem;
        @media (max-width: ${mobileMaxWidth}) {
          padding: 1rem;
        }
      `}
    >
      <div
        className={css`
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        `}
      >
        <h1 style={{ margin: 0 }}>My Builds</h1>
        <Button color="green" onClick={() => navigate('/build/new')}>
          New Build
        </Button>
      </div>

      {builds.length === 0 ? (
        <div
          className={css`
            text-align: center;
            padding: 3rem;
            background: ${Color.wellGray()};
            border-radius: 8px;
          `}
        >
          <p style={{ fontSize: '1.1rem', color: Color.darkGray() }}>
            You have not created any builds yet.
          </p>
          <Button
            color="green"
            style={{ marginTop: '1rem' }}
            onClick={() => navigate('/build/new')}
          >
            Create Your First Build
          </Button>
        </div>
      ) : (
        <div
          className={css`
            display: flex;
            flex-direction: column;
            gap: 1rem;
          `}
        >
          {builds.map((build) => (
            <Link
              key={build.id}
              to={`/build/${build.id}`}
              className={css`
                display: block;
                padding: 1.25rem;
                background: #fff;
                border: 1px solid ${Color.borderGray()};
                border-radius: 8px;
                text-decoration: none;
                color: inherit;
                transition: box-shadow 0.2s, border-color 0.2s;
                &:hover {
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                  border-color: ${Color.logoBlue()};
                }
              `}
            >
              <div
                className={css`
                  display: flex;
                  justify-content: space-between;
                  align-items: flex-start;
                `}
              >
                <div>
                  <h3
                    className={css`
                      margin: 0 0 0.5rem 0;
                      color: ${Color.darkerGray()};
                    `}
                  >
                    {build.title}
                  </h3>
                  {build.description && (
                    <p
                      className={css`
                        margin: 0;
                        color: ${Color.darkGray()};
                        font-size: 0.9rem;
                      `}
                    >
                      {build.description}
                    </p>
                  )}
                </div>
                <span
                  className={css`
                    font-size: 0.8rem;
                    color: ${Color.gray()};
                    white-space: nowrap;
                    margin-left: 1rem;
                  `}
                >
                  {timeSince(build.updatedAt)}
                </span>
              </div>
              <div
                className={css`
                  margin-top: 0.75rem;
                  display: flex;
                  gap: 0.5rem;
                `}
              >
                <span
                  className={css`
                    font-size: 0.75rem;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    background: ${build.status === 'published'
                      ? Color.green(0.15)
                      : Color.gray(0.15)};
                    color: ${build.status === 'published'
                      ? Color.green()
                      : Color.darkGray()};
                  `}
                >
                  {build.status}
                </span>
                {build.isPublic && (
                  <span
                    className={css`
                      font-size: 0.75rem;
                      padding: 0.25rem 0.5rem;
                      border-radius: 4px;
                      background: ${Color.blue(0.15)};
                      color: ${Color.blue()};
                    `}
                  >
                    public
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
