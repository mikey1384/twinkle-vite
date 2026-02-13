import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Loading from '~/components/Loading';
import Icon from '~/components/Icon';
import { useAppContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { borderRadius, mobileMaxWidth } from '~/constants/css';
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
  background: #fff;
  border: 1px solid var(--ui-border);
  overflow: hidden;
  margin-bottom: 2rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1.6rem;
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
  background: var(--chat-bg);
  color: var(--theme-bg);
  border: 1px solid var(--ui-border);
  font-weight: 800;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const heroTitleClass = css`
  margin: 0;
  font-size: 2.4rem;
  font-weight: 800;
  color: var(--chat-text);
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 2rem;
  }
`;

const heroBodyClass = css`
  margin: 0;
  font-size: 1.3rem;
  color: var(--chat-text);
  opacity: 0.75;
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
  border: 1px solid var(--ui-border);
  border-radius: ${borderRadius};
  text-decoration: none;
  color: inherit;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease;
  &:hover {
    border-color: var(--theme-border);
    transform: translateY(-1px);
  }
`;

const primaryButtonClass = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.65rem 1.2rem;
  border-radius: 10px;
  border: 1px solid var(--theme-border);
  background: var(--theme-bg);
  color: var(--theme-text);
  font-size: 0.95rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
  &:hover {
    background: var(--theme-hover-bg);
    transform: translateY(-1px);
  }
  &:focus-visible {
    outline: 2px solid var(--theme-border);
    outline-offset: 2px;
  }
`;

const buildCardHeaderClass = css`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
`;

const buildTitleClass = css`
  margin: 0 0 0.45rem 0;
  color: var(--chat-text);
  font-size: 1.45rem;
`;

const buildDescriptionClass = css`
  margin: 0;
  color: var(--chat-text);
  opacity: 0.72;
  font-size: 0.95rem;
  line-height: 1.45;
`;

const buildUpdatedClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  color: var(--chat-text);
  opacity: 0.65;
  white-space: nowrap;
`;

const buildTagRowClass = css`
  margin-top: 0.9rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
`;

const buildTagClass = css`
  font-size: 0.74rem;
  padding: 0.28rem 0.55rem;
  border-radius: 999px;
  background: var(--chat-bg);
  color: var(--chat-text);
  border: 1px solid var(--ui-border);
  line-height: 1;
`;

const buildMetaRowClass = css`
  margin-top: 0.85rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
`;

const buildMetaItemClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: var(--chat-text);
  opacity: 0.72;
`;

interface BuildListItem {
  id: number;
  title: string;
  description: string | null;
  status: string;
  isPublic: boolean;
  updatedAt: number;
  createdAt: number;
  hasCode?: boolean;
  viewCount?: number;
  publishedAt?: number | null;
  sourceBuildId?: number | null;
}

export default function BuildList() {
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
  const loadMyBuilds = useAppContext((v) => v.requestHelpers.loadMyBuilds);
  const createBuild = useAppContext((v) => v.requestHelpers.createBuild);

  const [loading, setLoading] = useState(true);
  const [builds, setBuilds] = useState<BuildListItem[]>([]);
  const [promptInput, setPromptInput] = useState('');
  const [creatingFromPrompt, setCreatingFromPrompt] = useState(false);

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
            color: var(--chat-text);
          `}
        >
          Create and launch apps with AI
        </h2>
        <p style={{ color: 'var(--chat-text)', opacity: 0.7, fontSize: '1.2rem' }}>
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
            Turn rough ideas into working apps in minutes. Copilot can draft
            screens, wire data flows, run review/fix loops, and keep version
            history as you iterate.
          </p>
          <div>
            <button
              className={primaryButtonClass}
              onClick={() => navigate('/build/new')}
              type="button"
            >
              New Build
            </button>
          </div>
        </div>
      </section>

      {builds.length === 0 ? (
        <div
          className={css`
            padding: 3rem;
            background: #fff;
            border-radius: ${borderRadius};
            border: 1px dashed var(--ui-border);
            display: flex;
            flex-direction: column;
            gap: 1rem;
          `}
        >
          <p
            style={{
              margin: 0,
              fontSize: '1.15rem',
              color: 'var(--chat-text)',
              opacity: 0.85,
              lineHeight: 1.55
            }}
          >
            Describe anything you want to build. Copilot will start coding right
            away, ask follow-up questions if needed, or suggest the closest
            realistic version using Twinkle SDK capabilities.
          </p>
          <div
            className={css`
              display: flex;
              gap: 0.7rem;
              align-items: center;
              @media (max-width: ${mobileMaxWidth}) {
                flex-direction: column;
                align-items: stretch;
              }
            `}
          >
            <input
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleStartFromPrompt();
                }
              }}
              placeholder='Try: "Build a daily reflection app with streaks and friend feed"'
              className={css`
                flex: 1;
                min-width: 0;
                height: 44px;
                border: 1px solid var(--ui-border);
                border-radius: 10px;
                padding: 0 0.9rem;
                font-size: 0.95rem;
                &:focus {
                  outline: none;
                  border-color: var(--theme-border);
                }
              `}
            />
            <button
              className={primaryButtonClass}
              disabled={!promptInput.trim() || creatingFromPrompt}
              onClick={handleStartFromPrompt}
              type="button"
            >
              {creatingFromPrompt ? 'Starting...' : 'Start Building'}
            </button>
          </div>
        </div>
      ) : (
        <div className={buildGridClass}>
          {builds.map((build) => (
            <Link
              key={build.id}
              to={`/build/${build.id}`}
              className={buildCardClass}
            >
              <div className={buildCardHeaderClass}>
                <div>
                  <h3 className={buildTitleClass}>{build.title}</h3>
                  <p className={buildDescriptionClass}>
                    {build.description?.trim() || deriveBuildCardSummary(build)}
                  </p>
                </div>
                <span className={buildUpdatedClass}>
                  <Icon icon="clock" />
                  Updated {formatRelativeTime(build.updatedAt)}
                </span>
              </div>
              <div className={buildTagRowClass}>
                <span className={buildTagClass}>
                  {formatBuildStatusLabel(build.status)}
                </span>
                <span className={buildTagClass}>
                  {build.isPublic ? 'Public' : 'Private'}
                </span>
                <span className={buildTagClass}>
                  {build.hasCode ? 'Code ready' : 'No code yet'}
                </span>
                {!!build.sourceBuildId && (
                  <span className={buildTagClass}>Forked</span>
                )}
              </div>
              <div className={buildMetaRowClass}>
                <span className={buildMetaItemClass}>
                  <Icon icon="clock-rotate-left" />
                  Created {formatRelativeTime(build.createdAt)}
                </span>
                <span className={buildMetaItemClass}>
                  <Icon icon="eye" />
                  {formatViewLabel(build.viewCount)}
                </span>
                {build.isPublic && build.publishedAt ? (
                  <span className={buildMetaItemClass}>
                    <Icon icon="globe" />
                    Published {formatRelativeTime(build.publishedAt)}
                  </span>
                ) : (
                  <span className={buildMetaItemClass}>
                    <Icon icon="lock" />
                    Not published yet
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  async function handleStartFromPrompt() {
    if (!promptInput.trim() || creatingFromPrompt) return;
    const prompt = promptInput.trim();
    setCreatingFromPrompt(true);
    try {
      const title = deriveBuildTitle(prompt);
      const { build } = await createBuild({ title });
      if (build?.id) {
        navigate(`/build/${build.id}`, {
          state: { initialPrompt: prompt }
        });
      }
    } catch (error) {
      console.error('Failed to start build from prompt:', error);
    }
    setCreatingFromPrompt(false);
  }
}

function deriveBuildTitle(prompt: string) {
  const cleaned = (prompt || '')
    .normalize('NFKC')
    .replace(/\s+/gu, ' ')
    .replace(/[^\p{L}\p{N}\p{M}\s-]/gu, '')
    .replace(/-{2,}/g, '-')
    .trim();
  if (!cleaned) return 'New Build';
  const words = cleaned.split(' ').slice(0, 6).join(' ');
  return words.length > 70 ? `${words.slice(0, 67)}...` : words;
}

function deriveBuildCardSummary(build: BuildListItem) {
  if (build.hasCode) {
    return 'Open this build to continue refining code, data, and interaction flow.';
  }
  if (build.status === 'draft') {
    return 'Kick off this draft with a prompt and Copilot will generate the first working version.';
  }
  return 'Open this build to continue iterating with Copilot.';
}

function formatBuildStatusLabel(status: string) {
  if (!status) return 'Unknown';
  const normalized = status.toLowerCase();
  if (normalized === 'draft') return 'Draft';
  if (normalized === 'published') return 'Published';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatRelativeTime(timestamp?: number | null) {
  if (!timestamp || Number.isNaN(Number(timestamp))) return 'just now';
  return timeSince(Number(timestamp));
}

function formatViewLabel(viewCount?: number | null) {
  const views = Number.isFinite(Number(viewCount)) ? Number(viewCount) : 0;
  if (views <= 0) return 'No views yet';
  if (views === 1) return '1 view';
  return `${views} views`;
}
