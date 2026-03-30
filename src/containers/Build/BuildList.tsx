import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Loading from '~/components/Loading';
import Icon from '~/components/Icon';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import LoggedOutPrompt from '~/components/LoggedOutPrompt';
import BuildProjectListItem, {
  BuildProjectListItemData
} from '~/components/BuildProjectListItem';
import BuildDescriptionModal from './BuildDescriptionModal';
import BuildDeleteModal from './BuildDeleteModal';
import { useAppContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { borderRadius, mobileMaxWidth } from '~/constants/css';

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

export default function BuildList() {
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
  const loadMyBuilds = useAppContext((v) => v.requestHelpers.loadMyBuilds);
  const createBuild = useAppContext((v) => v.requestHelpers.createBuild);
  const updateBuildMetadata = useAppContext(
    (v) => v.requestHelpers.updateBuildMetadata
  );
  const deleteBuild = useAppContext((v) => v.requestHelpers.deleteBuild);

  const [loading, setLoading] = useState(true);
  const [builds, setBuilds] = useState<BuildProjectListItemData[]>([]);
  const [editingBuild, setEditingBuild] = useState<BuildProjectListItemData | null>(
    null
  );
  const [deletingBuild, setDeletingBuild] =
    useState<BuildProjectListItemData | null>(null);
  const [savingDescription, setSavingDescription] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
      <LoggedOutPrompt
        title="Build apps with AI"
        body={
          <>
            Let <strong>Lumine, your AI app-building assistant</strong>, turn
            your idea into a working app and help you refine it. When you are
            ready, you can publish it so other Twinkle users can use it, and
            even people outside the website.
          </>
        }
      />
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
          <h2 className={emptyTitleClass}>Make Your First App</h2>
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
          {builds.map((build) => (
            <BuildProjectListItem
              key={build.id}
              build={build}
              isOwner
              onAddDescription={setEditingBuild}
              onDelete={setDeletingBuild}
            />
          ))}
        </div>
      )}
      {editingBuild && (
        <BuildDescriptionModal
          buildTitle={editingBuild.title}
          initialDescription={editingBuild.description}
          loading={savingDescription}
          onHide={() => (savingDescription ? null : setEditingBuild(null))}
          onSubmit={handleSubmitDescription}
        />
      )}
      {deletingBuild && (
        <BuildDeleteModal
          buildTitle={deletingBuild.title}
          loading={deleting}
          onHide={() => (deleting ? null : setDeletingBuild(null))}
          onSubmit={handleDeleteBuild}
        />
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

  async function handleSubmitDescription(description: string) {
    if (!editingBuild || savingDescription) return;
    setSavingDescription(true);
    try {
      const result = await updateBuildMetadata({
        buildId: editingBuild.id,
        description
      });
      if (result?.success && result?.build) {
        setBuilds((prev) =>
          prev.map((build) =>
            build.id === editingBuild.id ? { ...build, ...result.build } : build
          )
        );
        setEditingBuild(null);
      }
    } catch (error) {
      console.error('Failed to update build description:', error);
    } finally {
      setSavingDescription(false);
    }
  }

  async function handleDeleteBuild(confirmTitle: string) {
    if (!deletingBuild || deleting) return;
    setDeleting(true);
    try {
      const result = await deleteBuild({
        buildId: deletingBuild.id,
        confirmTitle
      });
      if (result?.success) {
        setBuilds((prev) =>
          prev.filter((build) => build.id !== deletingBuild.id)
        );
        setDeletingBuild(null);
      }
    } catch (error) {
      console.error('Failed to delete build:', error);
    } finally {
      setDeleting(false);
    }
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
