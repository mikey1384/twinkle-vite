export interface ViewState {
  pageVisible: boolean;
  exploreCategory: 'subjects' | 'videos' | 'links' | 'ai-cards';
  contentPath: string;
  contentNav: string;
  missionNav: string;
  buildNav: string;
  pageTitle: string;
  profileNav: string;
  boardNav: string;
  homeNav: string;
  audioKey: string;
  aiFeaturesDisabled: boolean;
  aiFeaturesLoaded: boolean;
  aiDisabledNotice: string;
  // desktop build runtime: 2nd-level collapse that also hides the global nav
  buildNavHidden: boolean;
  // session-only audio mute state for running build apps, keyed by build id
  mutedBuildAppIds: string[];
  // Build app ids that currently have a reachable nav tab. null means the
  // nav owner has not published a reliable tab list yet.
  buildAppNavTabIds: string[] | null;
  // the build app / workspace currently open — the nav spawns a tab for it
  openBuildTab: {
    to: string;
    label: string;
    kind: 'app' | 'workspace';
    ownerUserId: number | string | null;
  } | null;
  // one-shot request from the build runtime's "Close app" button to remove
  // that app's tab. MainNavs owns the tabs, so it consumes this and clears it
  // back to null. Scoped to the issuing user so a retrying request cannot
  // mutate another account's nav tabs after an SPA account switch.
  buildAppToClose: {
    buildAppId: string;
    ownerUserId: number | string | null;
  } | null;
  // request to tear down a running build app's keep-alive session, identified
  // by build id. Carries a monotonic nonce so the keep-alive host processes
  // each request exactly once (a stale request must not kill a freshly
  // reopened app). Emitted by every real tab-close path — the runtime "Close
  // app" button and MainNavs's tab removal — and consumed only by the keep-
  // alive host. MainNavs is unmounted on mobile /app routes, so a derived
  // "does a tab still exist" signal can't be trusted at close time; this
  // explicit request can.
  killBuildAppSession: {
    buildAppId: string;
    nonce: number;
  } | null;
}

export interface ViewAction {
  type:
    | 'SET_AUDIO_KEY'
    | 'SET_AI_FEATURES_DISABLED'
    | 'CHANGE_PAGE_VISIBILITY'
    | 'SET_EXPLORE_CATEGORY'
    | 'SET_CONTENT_PATH'
    | 'SET_CONTENT_NAV'
    | 'SET_MISSION_NAV'
    | 'SET_BUILD_NAV'
    | 'SET_BOARD_NAV'
    | 'SET_HOME_NAV'
    | 'SET_PAGE_TITLE'
    | 'SET_PROFILE_NAV'
    | 'SET_BUILD_NAV_HIDDEN'
    | 'SET_BUILD_APP_MUTED'
    | 'SET_BUILD_APP_NAV_TAB_IDS'
    | 'SET_OPEN_BUILD_TAB'
    | 'SET_BUILD_APP_TO_CLOSE'
    | 'KILL_BUILD_APP_SESSION';
  key?: string;
  disabled?: boolean;
  visible?: boolean;
  category?: ViewState['exploreCategory'];
  path?: string;
  nav?: string;
  title?: string;
  hidden?: boolean;
  buildAppId?: string;
  buildAppIds?: string[] | null;
  ownerUserId?: number | string | null;
  muted?: boolean;
  openBuildTab?: ViewState['openBuildTab'];
}

export const AI_DISABLED_NOTICE =
  "Twinkle's AI features are currently unavailable because our AI service providers have suspended service.";

function normalizeBuildAppIds(buildAppIds: string[] | null | undefined) {
  if (!Array.isArray(buildAppIds)) return null;
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const rawId of buildAppIds) {
    const id = String(rawId || '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    normalized.push(id);
  }
  return normalized;
}

function buildAppIdListsMatch(
  first: string[] | null,
  second: string[] | null
) {
  if (first === null || second === null) return first === second;
  if (first.length !== second.length) return false;
  return first.every((id, index) => id === second[index]);
}

export default function ViewReducer(
  state: ViewState,
  action: ViewAction
): ViewState {
  switch (action.type) {
    case 'SET_AUDIO_KEY':
      return {
        ...state,
        audioKey: action.key!
      };
    case 'SET_AI_FEATURES_DISABLED':
      return {
        ...state,
        aiFeaturesDisabled: action.disabled!,
        aiFeaturesLoaded: true
      };
    case 'CHANGE_PAGE_VISIBILITY':
      return {
        ...state,
        pageVisible: action.visible!
      };
    case 'SET_EXPLORE_CATEGORY':
      return {
        ...state,
        exploreCategory: action.category!
      };
    case 'SET_CONTENT_PATH':
      return {
        ...state,
        contentPath: action.path!
      };
    case 'SET_CONTENT_NAV':
      return {
        ...state,
        contentNav: action.nav!
      };
    case 'SET_MISSION_NAV':
      return {
        ...state,
        missionNav: action.nav!
      };
    case 'SET_BUILD_NAV':
      return {
        ...state,
        buildNav: action.nav!
      };
    case 'SET_BOARD_NAV':
      return {
        ...state,
        boardNav: action.nav!
      };
    case 'SET_HOME_NAV':
      return {
        ...state,
        homeNav: action.nav!
      };
    case 'SET_PAGE_TITLE':
      return {
        ...state,
        pageTitle: action.title!
      };
    case 'SET_PROFILE_NAV':
      return {
        ...state,
        profileNav: action.nav!
      };
    case 'SET_BUILD_NAV_HIDDEN':
      return {
        ...state,
        buildNavHidden: !!action.hidden
      };
    case 'SET_BUILD_APP_MUTED': {
      const buildAppId = String(action.buildAppId || '').trim();
      if (!buildAppId) return state;
      const currentlyMuted = state.mutedBuildAppIds.includes(buildAppId);
      const nextMuted =
        typeof action.muted === 'boolean' ? action.muted : !currentlyMuted;
      if (currentlyMuted === nextMuted) return state;
      return {
        ...state,
        mutedBuildAppIds: nextMuted
          ? [...state.mutedBuildAppIds, buildAppId]
          : state.mutedBuildAppIds.filter((id) => id !== buildAppId)
      };
    }
    case 'SET_BUILD_APP_NAV_TAB_IDS': {
      const nextBuildAppNavTabIds = normalizeBuildAppIds(action.buildAppIds);
      if (
        buildAppIdListsMatch(
          state.buildAppNavTabIds,
          nextBuildAppNavTabIds
        )
      ) {
        return state;
      }
      return {
        ...state,
        buildAppNavTabIds: nextBuildAppNavTabIds
      };
    }
    case 'SET_OPEN_BUILD_TAB':
      return {
        ...state,
        openBuildTab: action.openBuildTab ?? null
      };
    case 'SET_BUILD_APP_TO_CLOSE': {
      const buildAppId = String(action.buildAppId || '').trim();
      const next = buildAppId
        ? {
            buildAppId,
            ownerUserId: action.ownerUserId ?? null
          }
        : null;
      if (
        state.buildAppToClose?.buildAppId === next?.buildAppId &&
        state.buildAppToClose?.ownerUserId === next?.ownerUserId
      ) {
        return state;
      }
      return {
        ...state,
        buildAppToClose: next
      };
    }
    case 'KILL_BUILD_APP_SESSION': {
      const buildAppId = String(action.buildAppId || '').trim();
      if (!buildAppId) return state;
      // monotonic nonce so the keep-alive host runs each kill exactly once
      const nonce = (state.killBuildAppSession?.nonce || 0) + 1;
      return {
        ...state,
        killBuildAppSession: { buildAppId, nonce }
      };
    }
    default:
      return state;
  }
}
