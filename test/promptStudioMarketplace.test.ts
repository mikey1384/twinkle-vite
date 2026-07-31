import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import BuildReducer, {
  createInitialBuildStudioState
} from '../src/contexts/Build/reducer';
import {
  getPromptListTabPath,
  promptListTabRoutes
} from '../src/containers/Prompts/helpers/url';
import {
  enqueueBuildStudioPreferenceSave,
  mergeBuildStudioPreferences,
  normalizeBuildStudioPreferences
} from '../src/containers/Build/studioPreferences';
import { getBuildStudioNavTarget } from '../src/containers/Build/studioNavigation';
import {
  emitPromptStudioCloneConfirmed,
  emitPromptStudioShareStateUpdated,
  PROMPT_STUDIO_CLONE_CONFIRMED_EVENT,
  PROMPT_STUDIO_SHARE_STATE_UPDATED_EVENT
} from '../src/constants/systemPrompt';

function createBuildState() {
  return {
    buildsById: {},
    buildRuns: {},
    buildRunRequestMap: {},
    buildWorkspaces: {},
    buildWorkspaceUi: {},
    forumInvalidationVersions: {},
    runtimeVerifyResults: {},
    buildStudio: createInitialBuildStudioState()
  };
}

function captureWindowEventDetail(eventName: string, emit: () => void) {
  const previousWindow = (globalThis as any).window;
  const eventTarget = new EventTarget();
  let eventDetail: any;
  (globalThis as any).window = eventTarget;
  eventTarget.addEventListener(eventName, (event) => {
    eventDetail = (event as CustomEvent).detail;
  });
  try {
    emit();
  } finally {
    if (previousWindow === undefined) {
      delete (globalThis as any).window;
    } else {
      (globalThis as any).window = previousWindow;
    }
  }
  return eventDetail;
}

test('prompt marketplace routes stay separate from build routes', () => {
  assert.equal(getPromptListTabPath('my'), '/prompts/my');
  assert.equal(
    getPromptListTabPath('community', 'recent'),
    '/prompts/community/recent'
  );
  assert.equal(
    getPromptListTabPath('community', 'leaderboard'),
    '/prompts/community/leaderboard'
  );
  assert.equal(
    promptListTabRoutes.some(({ path }) => path === 'cloned'),
    false
  );
});

test('old buildStudio rows hydrate prompt preferences with safe defaults', () => {
  assert.deepEqual(
    normalizeBuildStudioPreferences({
      activeTab: 'open_source',
      browseModes: {
        community: 'leaderboard',
        open_source: 'recent'
      }
    }),
    {
      activeTab: 'open_source',
      browseModes: {
        community: 'leaderboard',
        open_source: 'recent'
      },
      section: 'apps',
      promptTab: 'community',
      promptBrowseModes: {
        community: 'recent'
      }
    }
  );
});

test('an account without Build Studio state starts from defaults', () => {
  const previousAccountPreferences = {
    activeTab: 'open_source',
    browseModes: {
      community: 'leaderboard',
      open_source: 'leaderboard'
    },
    section: 'prompts',
    promptTab: 'my',
    promptBrowseModes: {
      community: 'leaderboard'
    }
  };
  const noRowPreferences = normalizeBuildStudioPreferences(undefined);

  assert.notDeepEqual(noRowPreferences, previousAccountPreferences);
  assert.equal(noRowPreferences.activeTab, 'mine');
  assert.equal(noRowPreferences.promptTab, 'community');
  assert.equal(noRowPreferences.promptBrowseModes.community, 'recent');
});

test('explicit studio preference changes preserve untouched fields', () => {
  const next = mergeBuildStudioPreferences({
    current: {
      activeTab: 'community',
      browseModes: {
        community: 'recent',
        open_source: 'leaderboard'
      },
      section: 'prompts',
      promptTab: 'my',
      promptBrowseModes: {
        community: 'leaderboard'
      }
    },
    patch: {
      activeTab: 'mine',
      section: 'apps'
    }
  });
  assert.deepEqual(next, {
    activeTab: 'mine',
    browseModes: {
      community: 'recent',
      open_source: 'leaderboard'
    },
    section: 'apps',
    promptTab: 'my',
    promptBrowseModes: {
      community: 'leaderboard'
    }
  });
});

test('a section-only save preserves the canonical Build tab', () => {
  const next = mergeBuildStudioPreferences({
    current: {
      activeTab: 'open_source',
      browseModes: {
        community: 'recent',
        open_source: 'leaderboard'
      },
      section: 'prompts',
      promptTab: 'my',
      promptBrowseModes: {
        community: 'leaderboard'
      }
    },
    patch: {
      section: 'apps'
    }
  });
  assert.deepEqual(next, {
    activeTab: 'open_source',
    browseModes: {
      community: 'recent',
      open_source: 'leaderboard'
    },
    section: 'apps',
    promptTab: 'my',
    promptBrowseModes: {
      community: 'leaderboard'
    }
  });
});

test('a browse-mode save persists its URL-derived public tab explicitly', () => {
  const next = mergeBuildStudioPreferences({
    current: {
      activeTab: 'mine',
      browseModes: {
        community: 'recent',
        open_source: 'recent'
      },
      section: 'apps',
      promptTab: 'community',
      promptBrowseModes: {
        community: 'recent'
      }
    },
    patch: {
      activeTab: 'open_source',
      browseModes: {
        open_source: 'leaderboard'
      }
    }
  });
  assert.equal(next.activeTab, 'open_source');
  assert.equal(next.browseModes.open_source, 'leaderboard');
  assert.equal(next.browseModes.community, 'recent');
});

test('rapid preference saves compose explicit changes in queue order', async () => {
  const current = {
    activeTab: 'open_source' as const,
    browseModes: {
      community: 'recent' as const,
      open_source: 'leaderboard' as const
    },
    section: 'prompts' as const,
    promptTab: 'community' as const,
    promptBrowseModes: {
      community: 'recent' as const
    }
  };
  const saves: any[] = [];
  const confirmations: any[] = [];
  let releaseFirstSave = () => {};
  let markFirstSaveStarted = () => {};
  const firstSaveGate = new Promise<void>((resolve) => {
    releaseFirstSave = resolve;
  });
  const firstSaveStarted = new Promise<void>((resolve) => {
    markFirstSaveStarted = resolve;
  });

  let canonicalPreferences: any = current;
  async function save(patch: any) {
    saves.push(patch);
    if (saves.length === 1) {
      markFirstSaveStarted();
      await firstSaveGate;
    }
    canonicalPreferences = mergeBuildStudioPreferences({
      current: canonicalPreferences,
      patch
    });
    return {
      buildStudio: canonicalPreferences,
      state: { buildStudio: canonicalPreferences }
    };
  }

  const firstSave = enqueueBuildStudioPreferenceSave({
    current,
    patch: { section: 'apps' },
    save,
    scope: 'prompt-studio-rapid-save-test',
    onConfirmed: (data) => confirmations.push(data),
    onError: (error) => {
      throw error;
    }
  });
  await firstSaveStarted;
  const secondSave = enqueueBuildStudioPreferenceSave({
    current,
    patch: { activeTab: 'community' },
    save,
    scope: 'prompt-studio-rapid-save-test',
    onConfirmed: (data) => confirmations.push(data),
    onError: (error) => {
      throw error;
    }
  });
  releaseFirstSave();
  await Promise.all([firstSave, secondSave]);

  assert.equal(saves.length, 2);
  assert.deepEqual(saves[0], { section: 'apps' });
  assert.deepEqual(saves[1], { activeTab: 'community' });
  assert.equal(confirmations.length, 1);
  assert.equal(confirmations[0].buildStudio.section, 'apps');
  assert.equal(confirmations[0].buildStudio.activeTab, 'community');
});

test('a later save rebases failed unconfirmed preference intent', async () => {
  const current = {
    activeTab: 'open_source' as const,
    browseModes: {
      community: 'recent' as const,
      open_source: 'leaderboard' as const
    },
    section: 'prompts' as const,
    promptTab: 'community' as const,
    promptBrowseModes: {
      community: 'recent' as const
    }
  };
  const saves: any[] = [];
  const confirmations: any[] = [];
  const errors: unknown[] = [];
  let releaseFirstSave = () => {};
  let markFirstSaveStarted = () => {};
  const firstSaveGate = new Promise<void>((resolve) => {
    releaseFirstSave = resolve;
  });
  const firstSaveStarted = new Promise<void>((resolve) => {
    markFirstSaveStarted = resolve;
  });
  let canonicalPreferences: any = current;

  async function save(patch: any) {
    saves.push(patch);
    if (saves.length === 1) {
      markFirstSaveStarted();
      await firstSaveGate;
      throw new Error('section save failed');
    }
    canonicalPreferences = mergeBuildStudioPreferences({
      current: canonicalPreferences,
      patch
    });
    return {
      buildStudio: canonicalPreferences,
      state: { buildStudio: canonicalPreferences }
    };
  }

  const firstSave = enqueueBuildStudioPreferenceSave({
    current,
    patch: { section: 'apps' },
    save,
    scope: 'prompt-studio-failed-intent-test',
    onConfirmed: (data) => confirmations.push(data),
    onError: (error) => errors.push(error)
  });
  await firstSaveStarted;
  const secondSave = enqueueBuildStudioPreferenceSave({
    current,
    patch: { activeTab: 'community' },
    save,
    scope: 'prompt-studio-failed-intent-test',
    onConfirmed: (data) => confirmations.push(data),
    onError: (error) => errors.push(error)
  });
  releaseFirstSave();
  await Promise.all([firstSave, secondSave]);

  assert.deepEqual(saves, [
    { section: 'apps' },
    { section: 'apps', activeTab: 'community' }
  ]);
  assert.equal(errors.length, 1);
  assert.equal(confirmations.length, 1);
  assert.equal(confirmations[0].buildStudio.section, 'apps');
  assert.equal(confirmations[0].buildStudio.activeTab, 'community');
});

test('a failed latest save publishes the last confirmed queued state', async () => {
  const current = {
    activeTab: 'open_source' as const,
    browseModes: {
      community: 'recent' as const,
      open_source: 'leaderboard' as const
    },
    section: 'prompts' as const,
    promptTab: 'community' as const,
    promptBrowseModes: {
      community: 'recent' as const
    }
  };
  const confirmations: any[] = [];
  const errors: unknown[] = [];
  let saveCount = 0;
  let releaseFirstSave = () => {};
  let markFirstSaveStarted = () => {};
  const firstSaveGate = new Promise<void>((resolve) => {
    releaseFirstSave = resolve;
  });
  const firstSaveStarted = new Promise<void>((resolve) => {
    markFirstSaveStarted = resolve;
  });

  let canonicalPreferences: any = current;
  async function save(patch: any) {
    saveCount += 1;
    if (saveCount === 1) {
      markFirstSaveStarted();
      await firstSaveGate;
      canonicalPreferences = mergeBuildStudioPreferences({
        current: canonicalPreferences,
        patch
      });
      return {
        buildStudio: canonicalPreferences,
        state: { buildStudio: canonicalPreferences }
      };
    }
    throw new Error('second save failed');
  }

  const firstSave = enqueueBuildStudioPreferenceSave({
    current,
    patch: { section: 'apps' },
    save,
    scope: 'prompt-studio-failed-latest-save-test',
    onConfirmed: (data) => confirmations.push(data),
    onError: (error) => errors.push(error)
  });
  await firstSaveStarted;
  const secondSave = enqueueBuildStudioPreferenceSave({
    current,
    patch: { activeTab: 'community' },
    save,
    scope: 'prompt-studio-failed-latest-save-test',
    onConfirmed: (data) => confirmations.push(data),
    onError: (error) => errors.push(error)
  });
  releaseFirstSave();
  await Promise.all([firstSave, secondSave]);

  assert.equal(errors.length, 1);
  assert.equal(confirmations.length, 1);
  assert.equal(confirmations[0].buildStudio.section, 'apps');
  assert.equal(confirmations[0].buildStudio.activeTab, 'open_source');
});

test('prompt cache drops stale responses and records confirmed clones', () => {
  let state: any = createBuildState();
  state = BuildReducer(state, {
    type: 'SET_PROMPT_STUDIO_ITEMS',
    buildStudio: {
      promptTab: 'community',
      promptBrowseMode: 'recent',
      prompts: [{ id: 71, myClones: [] }],
      loadMoreToken: 'first',
      searchQuery: '',
      userId: 9,
      cacheGeneration: 0
    }
  });
  state = BuildReducer(state, {
    type: 'INVALIDATE_PROMPT_STUDIO_TAB',
    buildStudio: {
      promptTab: 'community',
      userId: 9
    }
  });
  state = BuildReducer(state, {
    type: 'SET_PROMPT_STUDIO_ITEMS',
    buildStudio: {
      promptTab: 'community',
      promptBrowseMode: 'recent',
      prompts: [{ id: 72 }],
      searchQuery: '',
      userId: 9,
      cacheGeneration: 0
    }
  });
  assert.equal(state.buildStudio.promptStudio.community.prompts[0].id, 71);
  assert.equal(state.buildStudio.promptStudio.community.loaded, false);

  state = BuildReducer(state, {
    type: 'SET_PROMPT_STUDIO_ITEMS',
    buildStudio: {
      promptTab: 'community',
      promptBrowseMode: 'recent',
      prompts: [{ id: 72, myClones: [] }],
      searchQuery: '',
      userId: 9,
      cacheGeneration: 1
    }
  });
  state = BuildReducer(state, {
    type: 'PATCH_PROMPT_STUDIO_CLONE',
    buildStudio: {
      prompt: {
        sharedTopicId: 72,
        target: 'zero',
        channelId: 14,
        topicId: 22
      }
    }
  });
  assert.deepEqual(
    state.buildStudio.promptStudio.community.prompts[0].myClones,
    [
      {
        target: 'zero',
        channelId: 14,
        topicId: 22
      }
    ]
  );
});

test('a confirmed share event invalidates both Prompt Studio caches', () => {
  const eventDetail = captureWindowEventDetail(
    PROMPT_STUDIO_SHARE_STATE_UPDATED_EVENT,
    () => {
      emitPromptStudioShareStateUpdated({
        channelId: 22,
        topicId: 33
      });
    }
  );
  assert.deepEqual(eventDetail, {
    channelId: 22,
    topicId: 33
  });

  let state: any = createBuildState();
  for (const promptTab of ['my', 'community'] as const) {
    state = BuildReducer(state, {
      type: 'SET_PROMPT_STUDIO_ITEMS',
      buildStudio: {
        promptTab,
        promptBrowseMode: 'recent',
        prompts: [{ id: promptTab === 'my' ? 1 : 2 }],
        searchQuery: '',
        userId: 9,
        cacheGeneration: 0
      }
    });
    state = BuildReducer(state, {
      type: 'INVALIDATE_PROMPT_STUDIO_TAB',
      buildStudio: { promptTab }
    });
  }
  assert.equal(state.buildStudio.promptStudio.my.loaded, false);
  assert.equal(state.buildStudio.promptStudio.my.cacheGeneration, 1);
  assert.equal(state.buildStudio.promptStudio.community.loaded, false);
  assert.equal(state.buildStudio.promptStudio.community.cacheGeneration, 1);
});

test('a confirmed external clone invalidates only Community prompts', () => {
  const eventDetail = captureWindowEventDetail(
    PROMPT_STUDIO_CLONE_CONFIRMED_EVENT,
    () => {
      emitPromptStudioCloneConfirmed({
        sharedTopicId: 11,
        channelId: 22,
        topicId: 33
      });
    }
  );
  assert.deepEqual(eventDetail, {
    sharedTopicId: 11,
    channelId: 22,
    topicId: 33
  });

  let state: any = createBuildState();
  for (const promptTab of ['my', 'community'] as const) {
    state = BuildReducer(state, {
      type: 'SET_PROMPT_STUDIO_ITEMS',
      buildStudio: {
        promptTab,
        promptBrowseMode: 'recent',
        prompts: [{ id: promptTab === 'my' ? 1 : 2 }],
        searchQuery: '',
        userId: 9,
        cacheGeneration: 0
      }
    });
  }
  state = BuildReducer(state, {
    type: 'INVALIDATE_PROMPT_STUDIO_TAB',
    buildStudio: { promptTab: 'community' }
  });

  assert.equal(state.buildStudio.promptStudio.my.loaded, true);
  assert.equal(state.buildStudio.promptStudio.my.cacheGeneration, 0);
  assert.equal(state.buildStudio.promptStudio.community.loaded, false);
  assert.equal(state.buildStudio.promptStudio.community.cacheGeneration, 1);
});

test('all confirmed clone request paths invalidate Community centrally', () => {
  const missionRequestSource = readFileSync(
    new URL('../src/contexts/requestHelpers/mission.ts', import.meta.url),
    'utf8'
  );
  const chatRequestSource = readFileSync(
    new URL('../src/contexts/requestHelpers/chat.ts', import.meta.url),
    'utf8'
  );
  const buildContextSource = readFileSync(
    new URL('../src/contexts/Build/index.tsx', import.meta.url),
    'utf8'
  );
  const promptListSource = readFileSync(
    new URL(
      '../src/containers/Prompts/PromptList/index.tsx',
      import.meta.url
    ),
    'utf8'
  );
  const systemPromptCloneSource = missionRequestSource.slice(
    missionRequestSource.indexOf('async cloneSharedSystemPrompt'),
    missionRequestSource.indexOf('async loadSystemPromptProgress')
  );
  const chatTopicCloneSource = chatRequestSource.slice(
    chatRequestSource.indexOf('async cloneSharedTopic'),
    chatRequestSource.indexOf('async editCanChangeTopic')
  );
  const promptCloneHandlerSource = promptListSource.slice(
    promptListSource.indexOf('function handlePromptCloneSuccess'),
    promptListSource.indexOf('function handleTabChange')
  );

  for (const source of [systemPromptCloneSource, chatTopicCloneSource]) {
    assert.match(
      source,
      /await request\.post[\s\S]*typeof data\?\.subjectId === 'number'[\s\S]*emitPromptStudioCloneConfirmed/
    );
  }
  assert.match(
    buildContextSource,
    /addEventListener\(\s*PROMPT_STUDIO_CLONE_CONFIRMED_EVENT,\s*invalidatePromptStudioCommunity/
  );
  assert.doesNotMatch(
    promptCloneHandlerSource,
    /onInvalidatePromptStudioTab/
  );
});

test('Prompt Studio transitions use canonical mode and clear stale errors', () => {
  const promptListSource = readFileSync(
    new URL(
      '../src/containers/Prompts/PromptList/index.tsx',
      import.meta.url
    ),
    'utf8'
  );
  const tabHandlerSource = promptListSource.slice(
    promptListSource.indexOf('function handleTabChange'),
    promptListSource.indexOf('function handleBrowseModeChange')
  );

  assert.match(
    tabHandlerSource,
    /persistedPreferences\.promptBrowseModes\.community/
  );
  assert.doesNotMatch(tabHandlerSource, /\? promptBrowseModes\.community/);
  assert.match(
    promptListSource,
    /useEffect\(\(\) => \{\s*setError\(''\);\s*\}, \[normalizedUserId, activeTab, activeBrowseMode\]\);/
  );
});

test('confirmed topic sharing owns Prompt Studio invalidation centrally', () => {
  const chatRequestSource = readFileSync(
    new URL('../src/contexts/requestHelpers/chat.ts', import.meta.url),
    'utf8'
  );
  const buildContextSource = readFileSync(
    new URL('../src/contexts/Build/index.tsx', import.meta.url),
    'utf8'
  );
  const managerSource = readFileSync(
    new URL(
      '../src/containers/MissionPage/SystemPromptShared/MyTopicsManager/index.tsx',
      import.meta.url
    ),
    'utf8'
  );
  const workshopSource = readFileSync(
    new URL(
      '../src/containers/MissionPage/WorkshopPage/PromptWorkshop.tsx',
      import.meta.url
    ),
    'utf8'
  );
  const shareMutationSource = chatRequestSource.slice(
    chatRequestSource.indexOf('async updateTopicShareState'),
    chatRequestSource.indexOf('async cloneSharedTopic')
  );

  assert.match(
    shareMutationSource,
    /await request\.put[\s\S]*if \(success\) \{\s*emitPromptStudioShareStateUpdated/
  );
  assert.match(
    buildContextSource,
    /addEventListener\(\s*PROMPT_STUDIO_SHARE_STATE_UPDATED_EVENT,\s*invalidatePromptStudio/
  );
  assert.doesNotMatch(managerSource, /onInvalidatePromptStudioTab/);
  assert.match(workshopSource, /emitSystemPromptTopicUpdated\(\)/);
});

test('top-level prompt cards opt out of comments without changing mission defaults', () => {
  const marketplaceSource = readFileSync(
    new URL(
      '../src/containers/Prompts/PromptList/PromptResults.tsx',
      import.meta.url
    ),
    'utf8'
  );
  const sharedCardSource = readFileSync(
    new URL(
      '../src/containers/MissionPage/SystemPromptShared/SharedPromptCard.tsx',
      import.meta.url
    ),
    'utf8'
  );
  assert.match(marketplaceSource, /showCommentComposer=\{false\}/);
  assert.match(sharedCardSource, /showCommentComposer = true/);
});

test('build and prompt heroes share their layout and primary CTA treatment', () => {
  const buildHeroSource = readFileSync(
    new URL('../src/containers/Build/List/Hero.tsx', import.meta.url),
    'utf8'
  );
  const promptHeroSource = readFileSync(
    new URL(
      '../src/containers/Prompts/PromptList/PromptHero.tsx',
      import.meta.url
    ),
    'utf8'
  );
  for (const source of [buildHeroSource, promptHeroSource]) {
    assert.match(source, /<StudioHero/);
    assert.match(source, /variant="primary"/);
    assert.match(source, /icon="wand-magic-sparkles"/);
  }
  assert.match(
    promptHeroSource,
    /Create a custom AI personality in the Prompt Workshop/
  );
});

test('the rocket nav returns to the persisted Build Studio section', () => {
  assert.equal(
    getBuildStudioNavTarget({
      loggedIn: true,
      pathname: '/chat',
      section: 'prompts',
      stateArrived: true
    }),
    '/prompts'
  );
  assert.equal(
    getBuildStudioNavTarget({
      loggedIn: true,
      pathname: '/chat',
      section: 'apps',
      stateArrived: true
    }),
    '/build'
  );
  assert.equal(
    getBuildStudioNavTarget({
      loggedIn: true,
      pathname: '/chat',
      section: 'prompts',
      stateArrived: false
    }),
    '/build'
  );
  assert.equal(
    getBuildStudioNavTarget({
      loggedIn: true,
      pathname: '/prompts/community/leaderboard',
      search: '?from=nav',
      section: 'apps',
      stateArrived: true
    }),
    '/prompts/community/leaderboard?from=nav'
  );
  assert.equal(
    getBuildStudioNavTarget({
      loggedIn: true,
      pathname: '/build/team',
      section: 'prompts',
      stateArrived: true
    }),
    '/build/team'
  );
  assert.equal(
    getBuildStudioNavTarget({
      loggedIn: false,
      pathname: '/prompts',
      section: 'prompts',
      stateArrived: true
    }),
    '/build'
  );
  assert.equal(
    getBuildStudioNavTarget({
      loggedIn: false,
      pathname: '/prompts/community/recent',
      search: '?from=share',
      section: 'prompts',
      stateArrived: true
    }),
    '/build'
  );
});

test('switching from Prompt Studio queues Apps before navigation', () => {
  const promptListSource = readFileSync(
    new URL('../src/containers/Prompts/PromptList/index.tsx', import.meta.url),
    'utf8'
  );
  const sectionHandlerSource = promptListSource.slice(
    promptListSource.indexOf('function handleSectionChange'),
    promptListSource.indexOf('function handlePromptCloneSuccess')
  );

  assert.match(
    sectionHandlerSource,
    /persistPromptStudioState\(\{ section: 'apps' \}\);[\s\S]*navigate\('\/build'\);/
  );
});

test('a cached prompt activity scope clears stale request indicators', () => {
  const activityHookSource = readFileSync(
    new URL(
      '../src/containers/Prompts/hooks/usePromptActivityPanel.ts',
      import.meta.url
    ),
    'utf8'
  );
  const cachedScopeBranch = activityHookSource.slice(
    activityHookSource.indexOf('if (cacheFresh)'),
    activityHookSource.indexOf('void loadActivity')
  );

  assert.match(cachedScopeBranch, /setLoading\(false\)/);
  assert.match(cachedScopeBranch, /setLoadingMore\(false\)/);
});
