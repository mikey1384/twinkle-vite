import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Loading from '~/components/Loading';
import Icon from '~/components/Icon';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import { useAppContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { borderRadius, mobileMaxWidth } from '~/constants/css';
import { timeSince } from '~/helpers/timeStampHelpers';

const displayFontFamily =
  "'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Arial Rounded MT Bold', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

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
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
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
  padding: 0.45rem 1rem;
  border-radius: 999px;
  background: rgba(65, 140, 235, 0.14);
  color: #1d4ed8;
  border: 1px solid rgba(65, 140, 235, 0.28);
  font-weight: 900;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: ${displayFontFamily};
`;

const heroTitleClass = css`
  margin: 0;
  font-size: 2.8rem;
  font-weight: 900;
  color: var(--chat-text);
  letter-spacing: 0.02em;
  font-family: ${displayFontFamily};
  line-height: 1.1;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 2.3rem;
  }
`;

const heroBodyClass = css`
  margin: 0;
  font-size: 1.35rem;
  color: var(--chat-text);
  opacity: 0.86;
  max-width: 38rem;
  line-height: 1.5;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.2rem;
  }
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
  border-left: 4px solid #418CEB;
  border-radius: ${borderRadius};
  text-decoration: none;
  color: inherit;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  transition:
    border-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
  &:hover {
    border-color: rgba(65, 140, 235, 0.28);
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    text-decoration: none;
  }
  &:focus-visible,
  &:active {
    text-decoration: none;
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
  font-weight: 900;
  font-family: ${displayFontFamily};
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
  padding: 0.3rem 0.6rem;
  border-radius: 999px;
  border: 1px solid var(--ui-border);
  line-height: 1;
  font-weight: 800;
  letter-spacing: 0.02em;
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

const emptyStateClass = css`
  padding: 2.2rem;
  border-radius: ${borderRadius};
  border: 1px solid var(--ui-border);
  background: #fafbff;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const emptyTitleClass = css`
  margin: 0;
  font-size: 2rem;
  color: var(--chat-text);
  font-family: ${displayFontFamily};
  font-weight: 900;
  line-height: 1.1;
`;

const emptyBodyClass = css`
  margin: 0;
  font-size: 1.25rem;
  color: var(--chat-text);
  opacity: 0.86;
  line-height: 1.5;
`;

const emptyInputWrapClass = css`
  display: flex;
  gap: 0.7rem;
  align-items: center;
  background: #fff;
  border: 1px solid var(--ui-border);
  border-radius: 14px;
  padding: 0.65rem;
  @media (max-width: ${mobileMaxWidth}) {
    flex-direction: column;
    align-items: stretch;
  }
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

interface BuildTone {
  background: string;
  border: string;
  color: string;
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
            font-size: 2.2rem;
            color: var(--chat-text);
            font-family: ${displayFontFamily};
            font-weight: 900;
          `}
        >
          Build apps with AI
        </h2>
        <p style={{ color: 'var(--chat-text)', opacity: 0.8, fontSize: '1.35rem' }}>
          Log in to start making your own apps.
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
            Got an app idea? Describe it and AI will build it for you.
          </p>
          <div>
            <GameCTAButton
              variant="gold"
              size="lg"
              shiny
              onClick={() => navigate('/build/new')}
            >
              New Build
            </GameCTAButton>
          </div>
        </div>
      </section>

      {builds.length === 0 ? (
        <div className={emptyStateClass}>
          <h2 className={emptyTitleClass}>Kick Off Your First Build</h2>
          <p className={emptyBodyClass}>
            Tell AI what you want to make, like a game, quiz, or helper app.
            It will start building right away.
          </p>
          <div className={emptyInputWrapClass}>
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
                height: 48px;
                border: 1px solid rgba(65, 140, 235, 0.3);
                border-radius: 12px;
                padding: 0 0.95rem;
                font-size: 1rem;
                background: #fff;
                &:focus {
                  outline: none;
                  border-color: #418CEB;
                  box-shadow: 0 0 0 2px rgba(65, 140, 235, 0.12);
                }
              `}
            />
            <GameCTAButton
              variant="success"
              size="lg"
              shiny
              loading={creatingFromPrompt}
              disabled={!promptInput.trim() || creatingFromPrompt}
              onClick={handleStartFromPrompt}
            >
              {creatingFromPrompt ? 'Starting...' : 'Start Building'}
            </GameCTAButton>
          </div>
        </div>
      ) : (
        <div className={buildGridClass}>
          {builds.map((build) => {
            const statusTone = getBuildStatusTone(build.status);
            const visibilityTone = getVisibilityTone(build.isPublic);
            const codeTone = getCodeTone(Boolean(build.hasCode));
            return (
              <Link
                key={build.id}
                to={`/build/${build.id}`}
                className={buildCardClass}
                style={{ borderLeftColor: statusTone.border }}
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
                  <span className={buildTagClass} style={toTagStyle(statusTone)}>
                    {formatBuildStatusLabel(build.status)}
                  </span>
                  <span className={buildTagClass} style={toTagStyle(visibilityTone)}>
                    {build.isPublic ? 'Public' : 'Private'}
                  </span>
                  <span className={buildTagClass} style={toTagStyle(codeTone)}>
                    {build.hasCode ? 'Code ready' : 'No code yet'}
                  </span>
                  {!!build.sourceBuildId && (
                    <span
                      className={buildTagClass}
                      style={toTagStyle({
                        background: 'rgba(147, 51, 234, 0.14)',
                        border: 'rgba(147, 51, 234, 0.36)',
                        color: '#6b21a8'
                      })}
                    >
                      Forked
                    </span>
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
            );
          })}
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

function getBuildStatusTone(status: string): BuildTone {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'draft') {
    return {
      background: 'rgba(255, 154, 0, 0.16)',
      border: 'rgba(255, 154, 0, 0.36)',
      color: '#b45309'
    };
  }
  if (normalized === 'published') {
    return {
      background: 'rgba(34, 197, 94, 0.14)',
      border: 'rgba(34, 197, 94, 0.34)',
      color: '#166534'
    };
  }
  return {
    background: 'rgba(65, 140, 235, 0.14)',
    border: 'rgba(65, 140, 235, 0.34)',
    color: '#1d4ed8'
  };
}

function getVisibilityTone(isPublic: boolean): BuildTone {
  if (isPublic) {
    return {
      background: 'rgba(65, 140, 235, 0.14)',
      border: 'rgba(65, 140, 235, 0.34)',
      color: '#1d4ed8'
    };
  }
  return {
    background: 'rgba(100, 116, 139, 0.14)',
    border: 'rgba(100, 116, 139, 0.3)',
    color: '#334155'
  };
}

function getCodeTone(hasCode: boolean): BuildTone {
  if (hasCode) {
    return {
      background: 'rgba(34, 197, 94, 0.14)',
      border: 'rgba(34, 197, 94, 0.34)',
      color: '#166534'
    };
  }
  return {
    background: 'rgba(236, 72, 153, 0.12)',
    border: 'rgba(236, 72, 153, 0.28)',
    color: '#be185d'
  };
}

function toTagStyle(tone: BuildTone): React.CSSProperties {
  return {
    background: tone.background,
    borderColor: tone.border,
    color: tone.color
  };
}
