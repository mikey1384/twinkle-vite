import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const buildListSource = readFileSync(
  new URL('../src/containers/Build/List/index.tsx', import.meta.url),
  'utf8'
);
const userRequestHelpersSource = readFileSync(
  new URL('../src/contexts/requestHelpers/user.ts', import.meta.url),
  'utf8'
);
const buildReducerSource = readFileSync(
  new URL('../src/contexts/Build/reducer.ts', import.meta.url),
  'utf8'
);
const buildActionsSource = readFileSync(
  new URL('../src/contexts/Build/actions.ts', import.meta.url),
  'utf8'
);
const buildSocketSource = readFileSync(
  new URL(
    '../src/containers/App/Header/hooks/useAPISocket/useBuildSocket.ts',
    import.meta.url
  ),
  'utf8'
);
const contributionInviteStatusUpdaterSource = readFileSync(
  new URL(
    '../src/helpers/hooks/useContributionInviteStatusUpdater.ts',
    import.meta.url
  ),
  'utf8'
);
const chatBuildContributionInviteSource = readFileSync(
  new URL(
    '../src/containers/Chat/Message/MessageBody/BuildContributionInvite.tsx',
    import.meta.url
  ),
  'utf8'
);
const keepAliveHostSource = readFileSync(
  new URL(
    '../src/containers/Build/Runtime/KeepAliveHost.tsx',
    import.meta.url
  ),
  'utf8'
);
const requestHelperIndexSource = readFileSync(
  new URL('../src/contexts/requestHelpers/index.ts', import.meta.url),
  'utf8'
);
const settingsRouteSource = readFileSync(
  new URL(
    '../../twinkle-api/controllers/user/routes/settings.ts',
    import.meta.url
  ),
  'utf8'
);
const collaboratingPreloadEffectSource = buildListSource.slice(
  buildListSource.indexOf('handleLoadCollaboratingBuilds();') - 220,
  buildListSource.indexOf('handleLoadCollaboratingBuilds();') + 1500
);
const handleTabChangeSource = buildListSource.slice(
  buildListSource.indexOf('function handleTabChange'),
  buildListSource.indexOf('function handleBrowseModeChange')
);
const handleBrowseModeChangeSource = buildListSource.slice(
  buildListSource.indexOf('function handleBrowseModeChange'),
  buildListSource.indexOf('async function handleLoadMoreBrowseBuilds')
);

assert.match(
  buildListSource,
  /const persistedBuildStudioState = useKeyContext\([\s\S]*v\.myState\.state\?\.buildStudio/,
  'Expected Build Studio view preference to hydrate from user state JSON.'
);
assert.match(
  buildListSource,
  /const updateBuildStudioState = useAppContext\([\s\S]*v\.requestHelpers\.updateBuildStudioState/,
  'Expected Build Studio preference saves to use the request helper.'
);
assert.match(
  buildListSource,
  /function getPersistedBuildStudioStateKey/,
  'Expected persisted Build Studio state to be normalized before hydration.'
);
assert.match(
  collaboratingPreloadEffectSource,
  /if \(collaboratingCacheFreshForCurrentUser\) return;[\s\S]*handleLoadCollaboratingBuilds\(\);/,
  'Expected Team Builds preload not to overwrite cached loaded pages on normal remount.'
);
assert.match(
  collaboratingPreloadEffectSource,
  /\}, \[[\s\S]*normalizedUserId,[\s\S]*collaboratingCacheFreshForCurrentUser,[\s\S]*collaboratingCacheRefreshKey,[\s\S]*collaboratingCacheGeneration[\s\S]*\]\);/,
  'Expected Team Builds preload to rerun when invalidation changes cache freshness.'
);
assert.match(
  buildListSource,
  /const collaboratingCacheRefreshKey =[\s\S]*getCollaboratingBuildsCacheRefreshKey\(numNewNotis\);/,
  'Expected Team Builds cache freshness to track notification changes.'
);
assert.match(
  buildListSource,
  /collaboratingBrowseState\.cacheRefreshKey === collaboratingCacheRefreshKey/,
  'Expected Team Builds preload to refresh when its notification refresh key is stale.'
);
assert.match(
  buildListSource,
  /tab: 'collaborating'[\s\S]*cacheRefreshKey: collaboratingCacheRefreshKey/,
  'Expected Team Builds loads to store the notification refresh key in context.'
);
assert.match(
  buildReducerSource,
  /cacheRefreshKey: number;/,
  'Expected Build Studio browse cache state to store a refresh key.'
);
assert.match(
  buildReducerSource,
  /cacheGeneration: number;/,
  'Expected Build Studio browse cache state to store a generation token.'
);
assert.match(
  buildActionsSource,
  /onInvalidateBuildStudioBrowseTab/,
  'Expected Build Studio browse cache to have an explicit invalidation action.'
);
assert.match(
  buildReducerSource,
  /INVALIDATE_BUILD_STUDIO_BROWSE_TAB[\s\S]*cacheGeneration: currentCacheGeneration \+ 1/,
  'Expected Build Studio browse invalidation to advance the cache generation.'
);
assert.doesNotMatch(
  buildReducerSource,
  /if \(!browseState\.loaded && browseState\.cacheRefreshKey === 0\)/,
  'Expected Build Studio browse invalidation to be recorded while a tab is loading.'
);
assert.match(
  buildReducerSource,
  /SET_BUILD_STUDIO_BROWSE_BUILDS[\s\S]*hasActionCacheGeneration[\s\S]*actionCacheGeneration !== currentCacheGeneration[\s\S]*return state;/,
  'Expected stale Build Studio browse set responses to be ignored after invalidation.'
);
assert.match(
  buildReducerSource,
  /APPEND_BUILD_STUDIO_BROWSE_BUILDS[\s\S]*hasActionCacheGeneration[\s\S]*actionCacheGeneration === currentCacheGeneration[\s\S]*currentTabState\.userId === userId/,
  'Expected stale Build Studio browse append responses to be ignored after invalidation.'
);
assert.match(
  buildListSource,
  /cacheGeneration: collaboratingCacheGeneration/,
  'Expected Team Builds loads and appends to carry the cache generation they started with.'
);
assert.match(
  buildListSource,
  /buildStudioPreferenceSaveIdRef[\s\S]*buildStudioPreferenceSaveQueueRef[\s\S]*saveId !== buildStudioPreferenceSaveIdRef\.current/,
  'Expected Build Studio preference saves to serialize and ignore stale responses.'
);
assert.match(
  keepAliveHostSource,
  /state: \{[\s\S]*\.\.\.getLocationStateObject\(session\.location\),[\s\S]*runtimeBackTo:/,
  'Expected runtime restore to preserve existing session route state.'
);
assert.match(
  buildSocketSource,
  /function handleBuildCollaborationUpdated[\s\S]*onInvalidateBuildStudioBrowseTab\(\{[\s\S]*tab: 'collaborating'/,
  'Expected collaboration socket updates to invalidate cached Team Builds.'
);
assert.match(
  contributionInviteStatusUpdaterSource,
  /onInvalidateBuildStudioBrowseTab\(\{ tab: 'collaborating' \}\)/,
  'Expected shared invite status updates to invalidate cached Team Builds.'
);
assert.match(
  chatBuildContributionInviteSource,
  /function invalidateBuildStudioCollaboratingBuilds\(\)[\s\S]*onInvalidateBuildStudioBrowseTab\(\{ tab: 'collaborating' \}\)/,
  'Expected chat invite actions to invalidate cached Team Builds.'
);
assert.match(
  handleTabChangeSource,
  /onSetBuildStudioActiveTab\(tab\);[\s\S]*persistBuildStudioState\(\{ activeTab: tab \}\)/,
  'Expected Build Studio tab changes to persist.'
);
assert.match(
  handleBrowseModeChangeSource,
  /onSetBuildStudioBrowseMode\(\{ tab: activeTab, browseMode \}\);[\s\S]*persistBuildStudioState\(\{[\s\S]*browseMode,[\s\S]*browseModeTab: activeTab/,
  'Expected Build Studio browse-mode changes to persist.'
);
assert.match(
  userRequestHelpersSource,
  /async updateBuildStudioState\([\s\S]*\/user\/state\/build-studio/,
  'Expected frontend request helper for Build Studio state persistence.'
);
assert.match(
  requestHelperIndexSource,
  /'updateBuildStudioState'/,
  'Expected lazy request-helper registry to include Build Studio state persistence.'
);
assert.match(
  settingsRouteSource,
  /router\.put\('\/state\/build-studio'/,
  'Expected API route for Build Studio state persistence.'
);
assert.match(
  settingsRouteSource,
  /JSON_SET\([\s\S]*'\$\.buildStudio'[\s\S]*CAST\(\? AS JSON\)/,
  'Expected API route to update only users.state.buildStudio.'
);

console.log('Build Studio state persistence verifier passed.');
