import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Loading from '~/components/Loading';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { timeSince } from '~/helpers/timeStampHelpers';

const pageClass = css`
  width: 100%;
  max-width: 980px;
  margin: 2rem auto 3rem;
  padding: 0 2rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0 1rem;
  }
`;

const heroClass = css`
  position: relative;
  padding: 2.2rem;
  border-radius: 22px;
  background: linear-gradient(
    135deg,
    ${Color.white()} 0%,
    ${Color.whiteBlueGray(0.7)} 45%,
    ${Color.logoBlue(0.1)} 100%
  );
  border: 1px solid ${Color.logoBlue(0.18)};
  box-shadow: 0 26px 50px -40px rgba(30, 110, 183, 0.45);
  overflow: hidden;
  margin-bottom: 2rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1.6rem;
  }
  &::after {
    content: '';
    position: absolute;
    right: -10%;
    top: -40%;
    width: 280px;
    height: 280px;
    background: radial-gradient(
      circle,
      ${Color.logoBlue(0.2)} 0%,
      transparent 70%
    );
    opacity: 0.7;
  }
`;

const heroContentClass = css`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const heroBadgeClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  background: ${Color.logoBlue(0.15)};
  color: ${Color.darkOceanBlue()};
  font-weight: 800;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const heroTitleClass = css`
  margin: 0;
  font-size: 2.4rem;
  font-weight: 800;
  color: ${Color.darkBlue()};
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 2rem;
  }
`;

const heroBodyClass = css`
  margin: 0;
  font-size: 1.3rem;
  color: ${Color.darkGray()};
  max-width: 38rem;
  line-height: 1.6;
`;

const buildGridClass = css`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const buildCardClass = css`
  display: block;
  padding: 1.4rem;
  background: #fff;
  border: 1px solid ${Color.borderGray()};
  border-radius: ${borderRadius};
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s;
  box-shadow: 0 14px 30px -24px rgba(15, 23, 42, 0.35);
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 24px 40px -28px rgba(30, 110, 183, 0.4);
    border-color: ${Color.logoBlue()};
  }
`;

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <div className={heroBadgeClass}>
          <Icon icon="sparkles" />
          Build Studio
        </div>
        <h2
          className={css`
            margin: 1rem 0 0.6rem;
            font-size: 2rem;
            color: ${Color.darkBlue()};
          `}
        >
          Create and launch apps with AI
        </h2>
        <p style={{ color: Color.darkGray(), fontSize: '1.2rem' }}>
          Log in to start new builds and manage your projects.
        </p>
      </div>
    );
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <div className={pageClass}>
      <section className={heroClass}>
        <div className={heroContentClass}>
          <div className={heroBadgeClass}>
            <Icon icon="rocket-launch" />
            Build Studio
          </div>
          <h1 className={heroTitleClass}>My Builds</h1>
          <p className={heroBodyClass}>
            Iterate fast with AI, wire up SQLite, and preview everything in one
            place.
          </p>
          <div>
            <Button
              color="green"
              variant="solid"
              onClick={() => navigate('/build/new')}
            >
              New Build
            </Button>
          </div>
        </div>
      </section>

      {builds.length === 0 ? (
        <div
          className={css`
            text-align: center;
            padding: 3rem;
            background: ${Color.white()};
            border-radius: ${borderRadius};
            border: 1px dashed ${Color.logoBlue(0.4)};
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
        <div className={buildGridClass}>
          {builds.map((build) => (
            <Link
              key={build.id}
              to={`/build/${build.id}`}
              className={buildCardClass}
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
                      font-size: 1.4rem;
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
