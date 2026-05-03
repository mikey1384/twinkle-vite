import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Loading from '~/components/Loading';
import Icon from '~/components/Icon';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import FilterBar from '~/components/FilterBar';
import LoggedOutPrompt from '~/components/LoggedOutPrompt';
import BuildProjectListItem, {
  BuildProjectListItemData
} from '~/components/BuildProjectListItem';
import BuildForkHistoryModal from '~/components/BuildForkHistoryModal';
import BuildDescriptionModal from './BuildDescriptionModal';
import BuildDeleteModal from './BuildDeleteModal';
import {
  useAppContext,
  useBuildContext,
  useKeyContext,
  useNotiContext
} from '~/contexts';
import { css } from '@emotion/css';
import { borderRadius, mobileMaxWidth } from '~/constants/css';
import { type BuildStudioTab } from '~/contexts/Build/reducer';

const displayFontFamily =
  "'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Arial Rounded MT Bold', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

type BuildListTab = BuildStudioTab;
type PublicBuildScope = 'all' | 'open_source';

const buildListTabs: Array<{
  value: BuildListTab;
  label: string;
  icon: string;
}> = [
  { value: 'mine', label: 'My Builds', icon: 'rocket-launch' },
  { value: 'collaborating', label: 'Collaborating', icon: 'users' },
  { value: 'community', label: 'Community', icon: 'users' },
  { value: 'open_source', label: 'Open Source', icon: 'code-branch' }
];

const pageClass = css`
  width: 100%;
  max-width: 980px;
  margin: 2rem auto 0;
  padding: 0 2rem 3rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0 1rem 3rem;
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

const tabBarClass = css`
  margin: -0.7rem 0 1.4rem;
  border: 1px solid rgba(65, 140, 235, 0.24);
  border-radius: ${borderRadius};
  padding: 0.35rem;
  background: #fff;

  > .nav-section > nav {
    border-bottom: none !important;
    border-radius: 10px;
    transition:
      background-color 0.15s ease,
      color 0.15s ease,
      transform 0.15s ease;
  }

  > .nav-section > nav > a {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
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

const requestQueueClass = css`
  margin: -0.8rem 0 1.4rem;
  padding: 1rem;
  border-radius: ${borderRadius};
  border: 1px solid rgba(236, 72, 153, 0.22);
  background: #fff7fb;
  box-shadow: 0 4px 14px rgba(190, 24, 93, 0.08);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const requestQueueHeaderClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const requestQueueTitleClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  color: var(--chat-text);
  font-size: 1.25rem;
  font-weight: 900;
  font-family: ${displayFontFamily};
`;

const requestQueueCountClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.38rem 0.7rem;
  border-radius: 999px;
  background: rgba(236, 72, 153, 0.12);
  border: 1px solid rgba(236, 72, 153, 0.28);
  color: #be185d;
  font-size: 0.95rem;
  font-weight: 900;
`;

const requestQueueRowsClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
`;

const requestQueueRowClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 12px;
  border: 1px solid rgba(236, 72, 153, 0.16);
  background: rgba(255, 255, 255, 0.78);
  @media (max-width: ${mobileMaxWidth}) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const requestQueueBuildClass = css`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const requestQueueBuildTitleClass = css`
  color: var(--chat-text);
  font-size: 1.1rem;
  font-weight: 900;
  line-height: 1.2;
  overflow-wrap: anywhere;
`;

const requestQueueMetaClass = css`
  color: var(--chat-text);
  opacity: 0.68;
  font-size: 0.95rem;
  font-weight: 700;
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

const loadMoreWrapClass = css`
  margin-top: 1.6rem;
  display: flex;
  justify-content: center;
`;

export default function BuildList() {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = useKeyContext((v) => v.myState.userId);
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const numNewNotis = useNotiContext((v) => v.state.numNewNotis);
  const loadMyBuilds = useAppContext((v) => v.requestHelpers.loadMyBuilds);
  const loadCollaboratingBuilds = useAppContext(
    (v) => v.requestHelpers.loadCollaboratingBuilds
  );
  const loadPublicBuilds = useAppContext(
    (v) => v.requestHelpers.loadPublicBuilds
  );
  const createBuild = useAppContext((v) => v.requestHelpers.createBuild);
  const updateBuildMetadata = useAppContext(
    (v) => v.requestHelpers.updateBuildMetadata
  );
  const deleteBuild = useAppContext((v) => v.requestHelpers.deleteBuild);
  const buildStudio = useBuildContext((v) => v.state.buildStudio);
  const onSetBuildStudioActiveTab = useBuildContext(
    (v) => v.actions.onSetBuildStudioActiveTab
  );
  const onSetBuildStudioMyBuilds = useBuildContext(
    (v) => v.actions.onSetBuildStudioMyBuilds
  );
  const onPatchBuildStudioMyBuild = useBuildContext(
    (v) => v.actions.onPatchBuildStudioMyBuild
  );
  const onRemoveBuildStudioMyBuild = useBuildContext(
    (v) => v.actions.onRemoveBuildStudioMyBuild
  );
  const onSetBuildStudioBrowseBuilds = useBuildContext(
    (v) => v.actions.onSetBuildStudioBrowseBuilds
  );
  const onAppendBuildStudioBrowseBuilds = useBuildContext(
    (v) => v.actions.onAppendBuildStudioBrowseBuilds
  );

  const normalizedUserId = Number(userId || 0) || null;
  const activeTab = normalizeBuildListTab(buildStudio?.activeTab);
  const activeBrowseTab = getBuildListBrowseTab(activeTab);
  const activeBrowseState =
    buildStudio?.browse?.[activeBrowseTab] || createEmptyBrowseState();
  const collaboratingBrowseState =
    buildStudio?.browse?.collaborating || createEmptyBrowseState();
  const activeBrowseLoadedForCurrentUser = Boolean(
    normalizedUserId &&
      activeBrowseState.userId === normalizedUserId &&
      activeBrowseState.loaded
  );
  const collaboratingLoadedForCurrentUser = Boolean(
    normalizedUserId &&
      collaboratingBrowseState.userId === normalizedUserId &&
      collaboratingBrowseState.loaded
  );
  const collaboratingBuildCount = collaboratingLoadedForCurrentUser
    ? collaboratingBrowseState.builds.length
    : 0;
  const visibleBuildListTabs = buildListTabs.filter(
    (tab) => tab.value !== 'collaborating' || collaboratingBuildCount > 0
  );
  const buildStudioMyBuildsUserId =
    Number(buildStudio?.myBuildsUserId || 0) || null;
  const myBuildsLoadedForCurrentUser = Boolean(
    normalizedUserId &&
      buildStudioMyBuildsUserId === normalizedUserId &&
      buildStudio?.myBuildsLoaded
  );
  const builds =
    myBuildsLoadedForCurrentUser && Array.isArray(buildStudio?.myBuilds)
      ? (buildStudio.myBuilds as BuildProjectListItemData[])
      : [];
  const browseBuilds =
    activeTab === 'mine' || !activeBrowseLoadedForCurrentUser
      ? []
      : ((activeBrowseState.builds || []) as BuildProjectListItemData[]);
  const browseLoadMoreButton =
    activeTab === 'mine' ? null : activeBrowseState.loadMoreToken;
  const activeBrowseLoaded =
    activeTab === 'mine' ? true : activeBrowseLoadedForCurrentUser;
  const activeTabRef = useRef<BuildListTab>(activeTab);
  const [loading, setLoading] = useState(true);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseLoadingMore, setBrowseLoadingMore] = useState(false);
  const [editingBuild, setEditingBuild] = useState<BuildProjectListItemData | null>(
    null
  );
  const [deletingBuild, setDeletingBuild] =
    useState<BuildProjectListItemData | null>(null);
  const [forkHistoryBuildId, setForkHistoryBuildId] = useState<number | null>(
    null
  );
  const [savingMetadata, setSavingMetadata] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const [creatingFromPrompt, setCreatingFromPrompt] = useState(false);
  const buildsWithPendingRequests = builds
    .filter((build) => Number(build.pendingCollaborationRequestCount || 0) > 0)
    .sort(
      (a, b) =>
        Number(b.latestPendingCollaborationRequestAt || 0) -
        Number(a.latestPendingCollaborationRequestAt || 0)
    );
  const totalPendingCollaborationRequests = buildsWithPendingRequests.reduce(
    (total, build) => total + Number(build.pendingCollaborationRequestCount || 0),
    0
  );
  const activeTabConfig =
    visibleBuildListTabs.find((tab) => tab.value === activeTab) ||
    visibleBuildListTabs[0];
  const isMyBuildsTab = activeTab === 'mine';

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    setEditingBuild(null);
    setDeletingBuild(null);
    setForkHistoryBuildId(null);
  }, [normalizedUserId]);

  useEffect(() => {
    if (!normalizedUserId) {
      setLoading(false);
      return;
    }
    let canceled = false;
    setLoading(
      activeTabRef.current === 'mine' && !myBuildsLoadedForCurrentUser
    );
    handleLoad();

    async function handleLoad() {
      try {
        const data = await loadMyBuilds();
        if (!canceled) {
          onSetBuildStudioMyBuilds({
            builds: data?.builds || [],
            userId: normalizedUserId
          });
        }
      } catch (error) {
        console.error('Failed to load builds:', error);
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    }
    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, numNewNotis]);

  useEffect(() => {
    if (!normalizedUserId) return;
    let canceled = false;
    handleLoadCollaboratingBuilds();

    async function handleLoadCollaboratingBuilds() {
      try {
        const data = await loadCollaboratingBuilds();
        if (!canceled) {
          onSetBuildStudioBrowseBuilds({
            tab: 'collaborating',
            builds: data?.builds || [],
            loadMoreToken: getLoadMoreToken(data),
            userId: normalizedUserId
          });
        }
      } catch (error) {
        console.error('Failed to load collaborating builds:', error);
        if (!canceled) {
          onSetBuildStudioBrowseBuilds({
            tab: 'collaborating',
            builds: [],
            loadMoreToken: null,
            userId: normalizedUserId
          });
        }
      }
    }

    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, numNewNotis]);

  useEffect(() => {
    if (activeTab !== 'collaborating') return;
    if (!collaboratingLoadedForCurrentUser) return;
    if (collaboratingBuildCount > 0) return;
    onSetBuildStudioActiveTab('mine');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, collaboratingLoadedForCurrentUser, collaboratingBuildCount]);

  useEffect(() => {
    if (!userId || activeTab === 'mine') {
      setBrowseLoading(false);
      return;
    }
    if (activeBrowseLoaded) {
      setBrowseLoading(false);
      return;
    }
    let canceled = false;

    handleLoadBrowseBuilds();

    async function handleLoadBrowseBuilds() {
      setBrowseLoading(true);
      try {
        const data =
          activeTab === 'collaborating'
            ? await loadCollaboratingBuilds()
            : await loadPublicBuilds({
                sort: 'recent',
                scope: getPublicBuildScope(activeTab),
                excludeMine: shouldExcludeMineFromPublicBrowse(activeTab)
              });
        if (!canceled) {
          onSetBuildStudioBrowseBuilds({
            tab: activeTab,
            builds: data?.builds || [],
            loadMoreToken: getLoadMoreToken(data),
            userId: normalizedUserId
          });
        }
      } catch (error) {
        console.error('Failed to load public builds:', error);
        if (!canceled) {
          onSetBuildStudioBrowseBuilds({
            tab: activeTab,
            builds: [],
            loadMoreToken: null,
            userId: normalizedUserId
          });
        }
      } finally {
        if (!canceled) {
          setBrowseLoading(false);
        }
      }
    }
    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, activeTab, activeBrowseLoaded]);

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

  if (loading && isMyBuildsTab) {
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
          <h1 className={heroTitleClass}>Build Studio</h1>
          <p className={heroBodyClass}>
            Create apps, review requests, and find projects to join or fork.
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

      <FilterBar
        className={tabBarClass}
        color={profileTheme}
        style={{ margin: 0, minHeight: '3.4rem', fontSize: '1rem' }}
      >
        {visibleBuildListTabs.map((tab) => (
          <nav
            key={tab.value}
            className={activeTab === tab.value ? 'active' : ''}
            onClick={() => handleTabChange(tab.value)}
          >
            <a>
              <Icon icon={tab.icon} />
              {tab.label}
            </a>
          </nav>
        ))}
      </FilterBar>

      {isMyBuildsTab && totalPendingCollaborationRequests > 0 ? (
        <section className={requestQueueClass}>
          <div className={requestQueueHeaderClass}>
            <div className={requestQueueTitleClass}>
              <Icon icon="comments" />
              Collaboration requests
            </div>
            <div className={requestQueueCountClass}>
              <Icon icon="exclamation-circle" />
              {totalPendingCollaborationRequests === 1
                ? '1 pending'
                : `${totalPendingCollaborationRequests} pending`}
            </div>
          </div>
          <div className={requestQueueRowsClass}>
            {buildsWithPendingRequests.map((build) => {
              const requestCount = Number(
                build.pendingCollaborationRequestCount || 0
              );
              return (
                <div key={build.id} className={requestQueueRowClass}>
                  <div className={requestQueueBuildClass}>
                    <div className={requestQueueBuildTitleClass}>
                      {build.title || 'Untitled Build'}
                    </div>
                    <div className={requestQueueMetaClass}>
                      {requestCount === 1
                        ? '1 person asked to collaborate'
                        : `${requestCount} people asked to collaborate`}
                    </div>
                  </div>
                  <GameCTAButton
                    variant="pink"
                    size="sm"
                    icon="comments"
                    onClick={() => handleOpenBuildRequests(build)}
                  >
                    Review
                  </GameCTAButton>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {isMyBuildsTab ? (
        builds.length === 0 ? (
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
                onOpenForkHistory={setForkHistoryBuildId}
              />
            ))}
          </div>
        )
      ) : browseLoading ? (
        <Loading />
      ) : browseBuilds.length === 0 ? (
        <div className={emptyStateClass}>
          <h2 className={emptyTitleClass}>
            No {activeTabConfig.label} Builds Yet
          </h2>
          <p className={emptyBodyClass}>{getBrowseEmptyCopy(activeTab)}</p>
        </div>
      ) : (
        <>
          <div className={buildGridClass}>
            {browseBuilds.map((build) => (
              <BuildProjectListItem
                key={build.id}
                build={build}
                to={
                  activeTab === 'collaborating'
                    ? `/build/${build.id}`
                    : `/app/${build.id}`
                }
                navigationState={{
                  ...(activeTab === 'collaborating'
                    ? { openPeoplePanel: true }
                    : {
                        runtimeBackTo: `${location.pathname}${location.search}${location.hash}`,
                        runtimeBackLabel: 'Back to Build Studio'
                      })
                }}
                primaryActionLabel={
                  activeTab === 'collaborating' ? 'Collaborate' : undefined
                }
                primaryActionIcon={
                  activeTab === 'collaborating' ? 'users' : undefined
                }
                showCollaborationRequestAction={activeTab !== 'collaborating'}
                onOpenForkHistory={setForkHistoryBuildId}
              />
            ))}
          </div>
          {browseLoadMoreButton ? (
            <div className={loadMoreWrapClass}>
              <LoadMoreButton
                loading={browseLoadingMore}
                onClick={handleLoadMoreBrowseBuilds}
                color={profileTheme}
              />
            </div>
          ) : null}
        </>
      )}
      {editingBuild && (
        <BuildDescriptionModal
          initialTitle={editingBuild.title}
          initialDescription={editingBuild.description}
          loading={savingMetadata}
          onHide={() => (savingMetadata ? null : setEditingBuild(null))}
          onSubmit={handleSubmitMetadata}
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
      {forkHistoryBuildId ? (
        <BuildForkHistoryModal
          buildId={forkHistoryBuildId}
          isOpen
          onClose={() => setForkHistoryBuildId(null)}
        />
      ) : null}
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

  async function handleSubmitMetadata({
    title,
    description
  }: {
    title: string;
    description: string;
  }) {
    if (!editingBuild || savingMetadata) return;
    setSavingMetadata(true);
    try {
      const result = await updateBuildMetadata({
        buildId: editingBuild.id,
        title,
        description
      });
      if (result?.success && result?.build) {
        onPatchBuildStudioMyBuild({
          build: result.build,
          userId: normalizedUserId
        });
        setEditingBuild(null);
      }
    } catch (error) {
      console.error('Failed to update build metadata:', error);
    } finally {
      setSavingMetadata(false);
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
        onRemoveBuildStudioMyBuild({
          buildId: deletingBuild.id,
          userId: normalizedUserId
        });
        setDeletingBuild(null);
      }
    } catch (error) {
      console.error('Failed to delete build:', error);
    } finally {
      setDeleting(false);
    }
  }

  function handleTabChange(tab: BuildListTab) {
    if (tab !== activeTab) {
      onSetBuildStudioActiveTab(tab);
    }
  }

  async function handleLoadMoreBrowseBuilds() {
    if (browseLoadingMore || !browseLoadMoreButton || activeTab === 'mine') {
      return;
    }
    setBrowseLoadingMore(true);
    try {
      const data =
        activeTab === 'collaborating'
          ? await loadCollaboratingBuilds({
              cursor: browseLoadMoreButton
            })
          : await loadPublicBuilds(
              buildPublicLoadMoreParams(activeTab, browseLoadMoreButton)
            );
      onAppendBuildStudioBrowseBuilds({
        tab: activeTab,
        builds: data?.builds || [],
        loadMoreToken: getLoadMoreToken(data),
        userId: normalizedUserId
      });
    } catch (error) {
      console.error('Failed to load more builds:', error);
    } finally {
      setBrowseLoadingMore(false);
    }
  }

  function buildPublicLoadMoreParams(
    tab: BuildListTab,
    loadMoreToken: string
  ): {
    sort: 'recent';
    scope: PublicBuildScope;
    excludeMine: boolean;
    cursor?: string;
    lastId?: number;
  } {
    const loadMoreParams: {
      sort: 'recent';
      scope: PublicBuildScope;
      excludeMine: boolean;
      cursor?: string;
      lastId?: number;
    } = {
      sort: 'recent',
      scope: getPublicBuildScope(tab),
      excludeMine: shouldExcludeMineFromPublicBrowse(tab)
    };
    if (/^\d+$/.test(loadMoreToken)) {
      loadMoreParams.lastId = Number(loadMoreToken);
    } else {
      loadMoreParams.cursor = loadMoreToken;
    }
    return loadMoreParams;
  }

  function handleOpenBuildRequests(build: BuildProjectListItemData) {
    navigate(`/build/${build.id}`, {
      state: {
        openPeoplePanel: true
      }
    });
  }
}

function getPublicBuildScope(tab: BuildListTab): PublicBuildScope {
  if (tab === 'open_source') return 'open_source';
  return 'all';
}

function shouldExcludeMineFromPublicBrowse(tab: BuildListTab) {
  return tab === 'community';
}

function getBuildListBrowseTab(tab: BuildListTab) {
  if (tab === 'collaborating') return 'collaborating';
  if (tab === 'open_source') return 'open_source';
  return 'community';
}

function normalizeBuildListTab(value?: string | null): BuildListTab {
  if (
    value === 'collaborating' ||
    value === 'community' ||
    value === 'open_source'
  ) {
    return value;
  }
  return 'mine';
}

function createEmptyBrowseState() {
  return {
    builds: [],
    loadMoreToken: null,
    loaded: false,
    userId: null
  };
}

function getLoadMoreToken(data: any) {
  if (data?.cursor != null) return String(data.cursor);
  if (data?.loadMoreButton != null) return String(data.loadMoreButton);
  return null;
}

function getBrowseEmptyCopy(tab: BuildListTab) {
  if (tab === 'collaborating') {
    return 'Builds you collaborate on will show up here after an invitation or collaboration request is accepted.';
  }
  if (tab === 'open_source') {
    return 'No public open-source builds have been published yet.';
  }
  return 'No community builds have been published yet.';
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
