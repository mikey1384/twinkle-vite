import React, { useEffect, useMemo, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { useLocation, useNavigate } from 'react-router-dom';
import LoggedOutPrompt from '~/components/LoggedOutPrompt';
import TabFilter from '~/containers/Build/TabFilter';
import SectionSwitcher from '~/containers/Build/SectionSwitcher';
import {
  BuildQuickAccessModal,
  BuildQuickAccessStrip
} from '~/containers/Build/List/QuickAccess';
import {
  studioLayoutClass,
  studioMainClass,
  studioPageClass
} from '~/containers/Build/List/StudioLayout';
import useQuickAccess from '~/containers/Build/List/hooks/useQuickAccess';
import {
  enqueueBuildStudioPreferenceSave,
  getBuildStudioPreferencesKey,
  normalizeBuildStudioPreferences,
  type BuildStudioPreferencesPatch
} from '~/containers/Build/studioPreferences';
import { useAppContext, useBuildContext, useKeyContext } from '~/contexts';
import type { SharedTopic } from '~/containers/MissionPage/SystemPromptShared/SharedPromptCard';
import type { PromptBrowseMode, PromptListTab } from '../types';
import { getPromptListTabPath } from '../helpers/url';
import PromptHero from './PromptHero';
import PromptResults from './PromptResults';
import { mobileMaxWidth } from '~/constants/css';
import PromptActivityPanel from '../PromptActivityPanel';
import usePromptActivityPanel from '../hooks/usePromptActivityPanel';

const promptScopeTabs: Array<{
  value: PromptListTab;
  label: string;
  icon: string;
}> = [
  { value: 'my', label: 'My Prompts', icon: 'user' },
  { value: 'community', label: 'Community', icon: 'users' }
];

const promptBrowseModeTabs: Array<{
  value: PromptBrowseMode;
  label: string;
  icon: string;
}> = [
  { value: 'recent', label: 'Recent', icon: 'clock' },
  { value: 'leaderboard', label: 'Leaderboard', icon: 'trophy' }
];

const quickAccessWrapClass = css`
  @media (max-width: ${mobileMaxWidth}) {
    display: none;
  }
`;

const browseModeWrapClass = css`
  margin-bottom: 1rem;
`;

const errorClass = css`
  margin: 0 0 1rem;
  padding: 0.9rem 1rem;
  border: 1px solid rgba(220, 38, 38, 0.24);
  border-radius: 1rem;
  background: rgba(220, 38, 38, 0.06);
  color: #b91c1c;
  font-size: 1.1rem;
`;

export default function PromptList({
  tab: urlTab,
  browseMode: urlBrowseMode
}: {
  tab?: PromptListTab;
  browseMode?: PromptBrowseMode;
} = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = useKeyContext((v) => v.myState.userId);
  const username = useKeyContext((v) => v.myState.username);
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const buildQuickAccessMode = useKeyContext(
    (v) => v.myState.buildQuickAccessMode
  );
  const persistedBuildStudioActiveTab = useKeyContext(
    (v) => v.myState.state?.buildStudio?.activeTab
  );
  const persistedBuildStudioCommunityBrowseMode = useKeyContext(
    (v) => v.myState.state?.buildStudio?.browseModes?.community
  );
  const persistedBuildStudioOpenSourceBrowseMode = useKeyContext(
    (v) => v.myState.state?.buildStudio?.browseModes?.open_source
  );
  const persistedBuildStudioSection = useKeyContext(
    (v) => v.myState.state?.buildStudio?.section
  );
  const persistedPromptTab = useKeyContext(
    (v) => v.myState.state?.buildStudio?.promptTab
  );
  const persistedPromptCommunityBrowseMode = useKeyContext(
    (v) => v.myState.state?.buildStudio?.promptBrowseModes?.community
  );
  const sessionLoaded = useAppContext((v) => v.user.state.loaded);
  const sessionStateArrived = useAppContext(
    (v) => v.user.state.myState.state !== undefined
  );
  const loadMySharedPrompts = useAppContext(
    (v) => v.requestHelpers.loadMySharedPrompts
  );
  const loadOtherUserTopics = useAppContext(
    (v) => v.requestHelpers.loadOtherUserTopics
  );
  const loadMoreOtherUserTopics = useAppContext(
    (v) => v.requestHelpers.loadMoreOtherUserTopics
  );
  const updateBuildStudioState = useAppContext(
    (v) => v.requestHelpers.updateBuildStudioState
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);

  const buildStudioSection = useBuildContext(
    (v) => v.state.buildStudio.section
  );
  const promptTabPreference = useBuildContext(
    (v) => v.state.buildStudio.promptTab
  );
  const promptBrowseModes = useBuildContext(
    (v) => v.state.buildStudio.promptBrowseModes
  );
  const promptMyState = useBuildContext(
    (v) => v.state.buildStudio.promptStudio.my
  );
  const promptCommunityState = useBuildContext(
    (v) => v.state.buildStudio.promptStudio.community
  );
  const collaboratingBrowseState = useBuildContext(
    (v) => v.state.buildStudio.browse.collaborating
  );
  const communityBrowseState = useBuildContext(
    (v) => v.state.buildStudio.browse.community
  );
  const openSourceBrowseState = useBuildContext(
    (v) => v.state.buildStudio.browse.open_source
  );
  const onSetBuildStudioSection = useBuildContext(
    (v) => v.actions.onSetBuildStudioSection
  );
  const onSetPromptStudioTab = useBuildContext(
    (v) => v.actions.onSetPromptStudioTab
  );
  const onSetPromptStudioBrowseMode = useBuildContext(
    (v) => v.actions.onSetPromptStudioBrowseMode
  );
  const onInvalidatePromptStudioTab = useBuildContext(
    (v) => v.actions.onInvalidatePromptStudioTab
  );
  const onSetPromptStudioItems = useBuildContext(
    (v) => v.actions.onSetPromptStudioItems
  );
  const onAppendPromptStudioItems = useBuildContext(
    (v) => v.actions.onAppendPromptStudioItems
  );
  const onPatchPromptStudioClone = useBuildContext(
    (v) => v.actions.onPatchPromptStudioClone
  );
  const onPatchBuildStudioMyBuild = useBuildContext(
    (v) => v.actions.onPatchBuildStudioMyBuild
  );
  const onSetBuildStudioBrowseBuilds = useBuildContext(
    (v) => v.actions.onSetBuildStudioBrowseBuilds
  );

  const normalizedUserId = Number(userId || 0) || null;
  const persistedBuildStudioState = useMemo(
    () => ({
      activeTab: persistedBuildStudioActiveTab,
      browseModes: {
        community: persistedBuildStudioCommunityBrowseMode,
        open_source: persistedBuildStudioOpenSourceBrowseMode
      },
      section: persistedBuildStudioSection,
      promptTab: persistedPromptTab,
      promptBrowseModes: {
        community: persistedPromptCommunityBrowseMode
      }
    }),
    [
      persistedBuildStudioActiveTab,
      persistedBuildStudioCommunityBrowseMode,
      persistedBuildStudioOpenSourceBrowseMode,
      persistedBuildStudioSection,
      persistedPromptCommunityBrowseMode,
      persistedPromptTab
    ]
  );
  const persistedPreferences = normalizeBuildStudioPreferences(
    persistedBuildStudioState
  );
  const activeTab = urlTab || persistedPreferences.promptTab;
  const activeBrowseMode: PromptBrowseMode =
    activeTab === 'community'
      ? urlBrowseMode ||
        persistedPreferences.promptBrowseModes.community
      : 'recent';
  const hasCanonicalListUrl = Boolean(
    urlTab && (urlTab === 'my' || urlBrowseMode)
  );
  const activePromptState =
    activeTab === 'my' ? promptMyState : promptCommunityState;
  const activeCacheGeneration = Math.max(
    0,
    Math.floor(Number(activePromptState?.cacheGeneration) || 0)
  );
  const activeLoadedForCurrentUser = Boolean(
    normalizedUserId &&
    activePromptState?.loaded &&
    activePromptState.userId === normalizedUserId &&
    activePromptState.browseMode === activeBrowseMode &&
    activePromptState.searchQuery === ''
  );
  const prompts = activeLoadedForCurrentUser
    ? ((activePromptState.prompts || []) as SharedTopic[])
    : [];
  const loadMoreToken = activeLoadedForCurrentUser
    ? activePromptState.loadMoreToken
    : null;
  const activeAnchorKey = `/prompts:${activeTab}:${activeBrowseMode}`;
  const persistedPreferencesKey = getBuildStudioPreferencesKey(
    persistedBuildStudioState
  );
  const preferenceSource = persistedPreferences;
  const quickAccessBuildStudio = useMemo(
    () => ({
      browse: {
        collaborating: collaboratingBrowseState,
        community: communityBrowseState,
        open_source: openSourceBrowseState
      }
    }),
    [collaboratingBrowseState, communityBrowseState, openSourceBrowseState]
  );
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const initialAnchorKeyRef = useRef(activeAnchorKey);
  const listInitialScrollRef = useRef<HTMLDivElement | null>(null);

  const {
    activeBuilds: activeQuickAccessBuilds,
    activeCursor: activeQuickAccessCursor,
    error: quickAccessError,
    loading: quickAccessLoading,
    loadingMore: quickAccessLoadingMore,
    savingMode: quickAccessSavingMode,
    modalBuilds: quickAccessModalBuilds,
    modalCursor: quickAccessModalCursor,
    modalMode: quickAccessModalMode,
    onBuildFavoriteChange: handleBuildFavoriteChange,
    onBuildFavoriteError: handleBuildFavoriteError,
    onBuildFavoriteStart: handleBuildFavoriteStart,
    onCloseModal: handleCloseQuickAccessModal,
    onLoadMoreModalBuilds: handleLoadMoreQuickAccessModalBuilds,
    onModeChange: handleQuickAccessModeChange,
    onOpenBuild: handleOpenQuickAccessBuild,
    onShowMore: handleShowMoreQuickAccess,
    openButtonStyle: quickAccessOpenButtonStyle,
    quickAccessMode
  } = useQuickAccess({
    buildQuickAccessMode,
    buildStudio: quickAccessBuildStudio,
    normalizedUserId,
    onPatchBuildStudioMyBuild,
    onSetBuildStudioBrowseBuilds,
    profileTheme
  });

  const {
    panelProps: promptActivityPanelProps,
    refresh: refreshPromptActivity
  } = usePromptActivityPanel({
    userId: normalizedUserId
  });

  useEffect(() => {
    setError('');
  }, [normalizedUserId, activeTab, activeBrowseMode]);

  useEffect(() => {
    if (!normalizedUserId || !persistedPreferencesKey) return;
    if (buildStudioSection !== persistedPreferences.section) {
      onSetBuildStudioSection(persistedPreferences.section);
    }
    if (promptTabPreference !== persistedPreferences.promptTab) {
      onSetPromptStudioTab(persistedPreferences.promptTab);
    }
    if (
      promptBrowseModes.community !==
      persistedPreferences.promptBrowseModes.community
    ) {
      onSetPromptStudioBrowseMode(
        persistedPreferences.promptBrowseModes.community
      );
    }
    // Context actions are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedUserId, persistedPreferencesKey]);

  useEffect(() => {
    if (hasCanonicalListUrl || !normalizedUserId || !sessionLoaded) {
      return;
    }
    const targetTab = urlTab || persistedPreferences.promptTab;
    const targetBrowseMode =
      targetTab === 'community'
        ? persistedPreferences.promptBrowseModes.community
        : undefined;
    navigate(
      `${getPromptListTabPath(targetTab, targetBrowseMode)}${
        location.search
      }${location.hash}`,
      { replace: true }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hasCanonicalListUrl,
    normalizedUserId,
    sessionLoaded,
    urlTab,
    persistedPreferencesKey,
    location.pathname
  ]);

  useEffect(() => {
    if (
      !normalizedUserId ||
      !sessionLoaded ||
      !sessionStateArrived ||
      !hasCanonicalListUrl
    ) {
      return;
    }
    void persistPromptStudioState({
      section: 'prompts',
      promptTab: activeTab,
      promptBrowseModes:
        activeTab === 'community'
          ? { community: activeBrowseMode }
          : undefined
    });
    // Request helpers and context actions are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    normalizedUserId,
    sessionLoaded,
    sessionStateArrived,
    hasCanonicalListUrl,
    activeTab,
    activeBrowseMode,
    persistedPreferencesKey
  ]);

  useEffect(() => {
    if (
      !normalizedUserId ||
      !hasCanonicalListUrl ||
      activeLoadedForCurrentUser
    ) {
      setLoading(false);
      return;
    }
    let canceled = false;
    void loadPrompts();

    async function loadPrompts() {
      setLoading(true);
      setError('');
      try {
        const result =
          activeTab === 'my'
            ? await loadMySharedPrompts()
            : await loadOtherUserTopics({
                sortBy: activeBrowseMode === 'leaderboard' ? 'cloned' : 'new'
              });
        if (canceled) return;
        const nextPrompts =
          activeTab === 'my'
            ? mapMyPrompts(result?.prompts || [])
            : result?.subjects || [];
        onSetPromptStudioItems({
          promptTab: activeTab,
          promptBrowseMode: activeBrowseMode,
          prompts: nextPrompts,
          loadMoreToken: createPromptLoadMoreToken({
            hasMore: Boolean(result?.loadMoreButton),
            prompts: nextPrompts
          }),
          searchQuery: '',
          userId: normalizedUserId,
          cacheGeneration: activeCacheGeneration
        });
      } catch (loadError: any) {
        if (canceled) return;
        setError(
          loadError?.response?.data?.error ||
            loadError?.message ||
            'Prompts could not load.'
        );
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    }

    return () => {
      canceled = true;
    };
    // Request helpers and context actions are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    normalizedUserId,
    hasCanonicalListUrl,
    activeTab,
    activeBrowseMode,
    activeLoadedForCurrentUser,
    activeCacheGeneration
  ]);

  if (!userId) {
    return (
      <LoggedOutPrompt
        title="Explore AI Prompts"
        body={
          <>
            Log in to browse prompts shared by the community and clone one into
            a conversation with Zero or Ciel.
          </>
        }
      />
    );
  }

  return (
    <div className={studioPageClass}>
      <div className={studioLayoutClass}>
        <main className={studioMainClass}>
          <SectionSwitcher
            activeSection="prompts"
            color={profileTheme}
            onChange={handleSectionChange}
          />

          <div className={quickAccessWrapClass}>
            <BuildQuickAccessStrip
              activeMode={quickAccessMode}
              builds={activeQuickAccessBuilds}
              color={profileTheme}
              error={quickAccessError}
              hasMore={Boolean(activeQuickAccessCursor)}
              loading={quickAccessLoading}
              savingMode={quickAccessSavingMode}
              openButtonStyle={quickAccessOpenButtonStyle}
              onModeChange={handleQuickAccessModeChange}
              onOpenBuild={handleOpenQuickAccessBuild}
              onShowMore={handleShowMoreQuickAccess}
              onFavoriteChange={handleBuildFavoriteChange}
              onFavoriteError={handleBuildFavoriteError}
              onFavoriteStart={handleBuildFavoriteStart}
            />
          </div>

          <PromptHero
            onOpenWorkshop={() => navigate('/missions/system-prompt/workshop')}
          />

          <div
            ref={listInitialScrollRef}
            data-scroll-initial-target="prompt-list"
          >
            <TabFilter
              activeTab={activeTab}
              color={profileTheme}
              onChange={handleTabChange}
              tabs={promptScopeTabs}
            />

            {activeTab === 'community' ? (
              <div className={browseModeWrapClass}>
                <TabFilter
                  activeTab={activeBrowseMode}
                  color={profileTheme}
                  density="compact"
                  onChange={handleBrowseModeChange}
                  tabs={promptBrowseModeTabs}
                />
              </div>
            ) : null}

            <PromptActivityPanel
              {...promptActivityPanelProps}
              variant="mobile"
            />

            {error ? <div className={errorClass}>{error}</div> : null}

            <PromptResults
              anchorKey={activeAnchorKey}
              browseMode={activeBrowseMode}
              color={profileTheme}
              hasMore={Boolean(loadMoreToken)}
              initialScrollTargetRef={listInitialScrollRef}
              initialScrollToList={
                initialAnchorKeyRef.current === activeAnchorKey
              }
              loading={loading || (!activeLoadedForCurrentUser && !error)}
              loadingMore={loadingMore}
              prompts={prompts}
              tab={activeTab}
              userId={normalizedUserId || 0}
              onCloneSuccess={handlePromptCloneSuccess}
              onLoadMore={handleLoadMore}
            />
          </div>
        </main>

        <PromptActivityPanel {...promptActivityPanelProps} variant="rail" />
      </div>

      {quickAccessModalMode ? (
        <BuildQuickAccessModal
          builds={quickAccessModalBuilds}
          cursor={quickAccessModalCursor}
          error={quickAccessError}
          loadingMore={quickAccessLoadingMore}
          mode={quickAccessModalMode}
          openButtonStyle={quickAccessOpenButtonStyle}
          onClose={handleCloseQuickAccessModal}
          onLoadMore={handleLoadMoreQuickAccessModalBuilds}
          onOpenBuild={handleOpenQuickAccessBuild}
          onFavoriteChange={handleBuildFavoriteChange}
          onFavoriteError={handleBuildFavoriteError}
          onFavoriteStart={handleBuildFavoriteStart}
        />
      ) : null}
    </div>
  );

  function handleSectionChange(section: 'apps' | 'prompts') {
    if (section === 'apps') {
      void persistPromptStudioState({ section: 'apps' });
      navigate('/build');
    }
  }

  function persistPromptStudioState(patch: BuildStudioPreferencesPatch) {
    if (!normalizedUserId || !sessionStateArrived) {
      return Promise.resolve();
    }
    return enqueueBuildStudioPreferenceSave({
      current: preferenceSource,
      patch,
      save: updateBuildStudioState,
      scope: normalizedUserId,
      onConfirmed: (data) => {
        if (!data?.state) return;
        onSetUserState({
          userId: normalizedUserId,
          newState: { state: data.state }
        });
      },
      onError: (saveError) => {
        console.error(
          'Failed to save Prompt Studio view preference:',
          saveError
        );
      }
    });
  }

  function handlePromptCloneSuccess(data: {
    sharedTopicId: number;
    target: 'zero' | 'ciel';
    topicId: number;
    channelId: number;
  }) {
    onPatchPromptStudioClone(data);
    refreshPromptActivity();
  }

  function handleTabChange(tab: PromptListTab) {
    if (tab === activeTab) {
      setError('');
      onInvalidatePromptStudioTab({
        promptTab: tab,
        userId: normalizedUserId
      });
      return;
    }
    navigate(
      getPromptListTabPath(
        tab,
        tab === 'community'
          ? persistedPreferences.promptBrowseModes.community
          : undefined
      )
    );
  }

  function handleBrowseModeChange(browseMode: PromptBrowseMode) {
    if (browseMode === activeBrowseMode) {
      setError('');
      onInvalidatePromptStudioTab({
        promptTab: 'community',
        userId: normalizedUserId
      });
      return;
    }
    navigate(getPromptListTabPath('community', browseMode));
  }

  async function handleLoadMore() {
    if (!normalizedUserId || !loadMoreToken || loading || loadingMore) {
      return;
    }
    const cursor = parsePromptLoadMoreToken(loadMoreToken);
    if (!cursor) return;
    setLoadingMore(true);
    setError('');
    try {
      const result =
        activeTab === 'my'
          ? await loadMySharedPrompts({
              lastId: cursor.id,
              lastSharedAt: cursor.sharedAt
            })
          : await loadMoreOtherUserTopics({
              lastSubject: cursor,
              sortBy: activeBrowseMode === 'leaderboard' ? 'cloned' : 'new'
            });
      const nextPrompts =
        activeTab === 'my'
          ? mapMyPrompts(result?.prompts || [])
          : result?.subjects || [];
      onAppendPromptStudioItems({
        promptTab: activeTab,
        promptBrowseMode: activeBrowseMode,
        prompts: nextPrompts,
        loadMoreToken: createPromptLoadMoreToken({
          hasMore: Boolean(result?.loadMoreButton),
          prompts: nextPrompts
        }),
        searchQuery: '',
        userId: normalizedUserId,
        cacheGeneration: activeCacheGeneration
      });
    } catch (loadError: any) {
      setError(
        loadError?.response?.data?.error ||
          loadError?.message ||
          'More prompts could not load.'
      );
    } finally {
      setLoadingMore(false);
    }
  }

  function mapMyPrompts(items: any[]): SharedTopic[] {
    return items.map((prompt) => ({
      ...prompt,
      userId: Number(prompt.userId) || normalizedUserId || 0,
      username: prompt.username || username || 'You',
      profileTheme: prompt.profileTheme || profileTheme,
      cloneCount: Number(prompt.cloneCount) || 0,
      messageCount: Number(prompt.messageCount) || 0,
      numComments: Number(prompt.numComments) || 0
    }));
  }
}

interface PromptCursor {
  id: number;
  timeStamp: number;
  sharedAt: number;
  cloneCount: number;
  messageCount: number;
}

function createPromptLoadMoreToken({
  hasMore,
  prompts
}: {
  hasMore: boolean;
  prompts: SharedTopic[];
}) {
  if (!hasMore || prompts.length === 0) return null;
  const lastPrompt = prompts[prompts.length - 1];
  return JSON.stringify({
    id: Number(lastPrompt.id) || 0,
    timeStamp: Number(lastPrompt.timeStamp) || 0,
    sharedAt: Number(lastPrompt.sharedAt) || Number(lastPrompt.timeStamp) || 0,
    cloneCount: Number(lastPrompt.cloneCount) || 0,
    messageCount: Number(lastPrompt.messageCount) || 0
  } satisfies PromptCursor);
}

function parsePromptLoadMoreToken(value: string): PromptCursor | null {
  try {
    const parsed = JSON.parse(value);
    const cursor: PromptCursor = {
      id: Number(parsed?.id) || 0,
      timeStamp: Number(parsed?.timeStamp) || 0,
      sharedAt: Number(parsed?.sharedAt) || 0,
      cloneCount: Number(parsed?.cloneCount) || 0,
      messageCount: Number(parsed?.messageCount) || 0
    };
    return cursor.id > 0 ? cursor : null;
  } catch {
    return null;
  }
}
