import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
  useCallback
} from 'react';
import { buildPreviewFrameSrc } from '~/helpers/buildPreviewOriginHelpers';
import Header from './Header';
import SocketManager from './SocketManager';
import InvalidPage from '~/components/InvalidPage';
import LazyModalFallback from '~/components/Modals/LazyModalFallback';
import { LazyDailyRewardModal } from '~/components/Modals/DailyRewardModal/lazy';
import Loading from '~/components/Loading';
import ErrorBoundary from '~/components/ErrorBoundary';
import API_URL from '~/constants/URL';
import {
  matchPath,
  useLocation,
  useNavigate,
  Routes,
  Route
} from 'react-router-dom';
import { Color, mobileMaxWidth } from '~/constants/css';
import {
  APP_SHELL_HEADER_OFFSET_STYLE,
  APP_SHELL_KEYBOARD_INSET_STYLE
} from '~/constants/appShell';
import {
  localStorageKeys,
  ZERO_TWINKLE_ID,
  DEFAULT_PROFILE_THEME
} from '~/constants/defaultValues';
import { stripClientUpdateReloadParam } from '~/helpers/clientUpdate';
import { css } from '@emotion/css';
import { Global } from '@emotion/react';
import { socket } from '~/constants/sockets/api';
import { addEvent, removeEvent } from '~/helpers/listenerHelpers';
import {
  clearAnalyticsUser,
  setAnalyticsUser,
  trackEvent,
  trackPageView
} from '~/helpers/analytics';
import {
  createAnalyticsPageViewController,
  getAnalyticsPath
} from '~/helpers/analyticsPageViews';
import { getConfirmedAnalyticsUserId } from '~/helpers/analyticsIdentity';
import { lazyWithRetry } from '~/helpers/lazyImportHelpers';
import { navigateToChatWithPendingChessModal } from '~/helpers/pendingChessModalNavigation';
import {
  getStoredItem,
  isExplicitAuthTokenRemovalStorageEvent,
  readAuthToken,
  setStoredItem
} from '~/helpers/userDataHelpers';
import {
  browserReportsOffline,
  markBrowserNetworkReachable
} from '~/helpers/browserNetwork';
import { finalizeEmoji, generateFileName } from '~/helpers/stringHelpers';
import { useMyState } from '~/helpers/hooks';
import {
  buildTodayStatsFromResponse,
  buildTodayStatsForNextDay,
  getSectionFromPathname,
  toValidNextDayTimeStamp,
  returnImageFileFromUrl
} from '~/helpers';
import {
  chatPushAutoEnrollEligible,
  setupChatPushBestEffort
} from '~/helpers/desktopNotifications';
import { v1 as uuidv1 } from 'uuid';
import type { UploadCompletionMeta } from '~/types';
import {
  useAppContext,
  useManagementContext,
  useHomeContext,
  useContentContext,
  useExploreContext,
  useProfileContext,
  useInputContext,
  useViewContext,
  useNotiContext,
  useChatContext,
  useChessContext,
  useMissionContext,
  KeyContext
} from '~/contexts';
import { extractVideoThumbnail } from '~/helpers/videoHelpers';
import { useRootTheme } from '~/theme/RootThemeProvider';
import useOrientationReflow from './hooks/useOrientationReflow';
import useAppShellHeaderOffset from './hooks/useAppShellHeaderOffset';
import useMobileKeyboardInset from './hooks/useMobileKeyboardInset';
import { NavigationRouteReadyObserver } from './navigationFeedback';

const userIsUsingIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
// persists the build "super full screen" (nav-also-hidden) preference
const BUILD_NAV_HIDDEN_KEY = 'twinkle-build-nav-hidden';
const OFFLINE_SESSION_RECOVERY_PROBE_DELAYS_MS = [15_000, 30_000, 60_000];

const Build = lazyWithRetry(() => import('~/containers/Build'));
const Prompts = lazyWithRetry(() => import('~/containers/Prompts'));
const BuildRuntimeKeepAliveHost = lazyWithRetry(
  () => import('~/containers/Build/Runtime/KeepAliveHost')
);
const BuildThumbnailCaptureHost = lazyWithRetry(
  () => import('~/containers/Build/ThumbnailCaptureHost')
);
const Chat = lazyWithRetry(() => import('~/containers/Chat'));
const CliDeviceAuth = lazyWithRetry(() => import('~/containers/CliDeviceAuth'));
const ContentPage = lazyWithRetry(() => import('~/containers/ContentPage'));
const AchievementPage = lazyWithRetry(
  () => import('~/containers/AchievementPage')
);
const Explore = lazyWithRetry(() => import('~/containers/Explore'));
const ExploreRedirect = lazyWithRetry(
  () => import('~/containers/Explore/Redirect')
);
const Home = lazyWithRetry(() => import('~/containers/Home'));
const ChessOptionsModal = lazyWithRetry(
  () => import('~/containers/Home/TopMenu/ChessOptionsModal')
);
const ChessPuzzleModal = lazyWithRetry(
  () => import('~/containers/Home/ChessPuzzleModal')
);
const LinkPage = lazyWithRetry(() => import('~/containers/LinkPage'));
const PlaylistPage = lazyWithRetry(() => import('~/containers/PlaylistPage'));
const Privacy = lazyWithRetry(() => import('~/containers/Privacy'));
const Redirect = lazyWithRetry(() => import('~/containers/Redirect'));
const MissionPage = lazyWithRetry(() => import('~/containers/MissionPage'));
const Mission = lazyWithRetry(() => import('~/containers/Mission'));
const Management = lazyWithRetry(() => import('~/containers/Management'));
const Profile = lazyWithRetry(() => import('~/containers/Profile'));
const ResetPassword = lazyWithRetry(() => import('~/containers/ResetPassword'));
const Verify = lazyWithRetry(() => import('~/containers/Verify'));
const VideoPage = lazyWithRetry(() => import('~/containers/VideoPage'));
const SigninModal = lazyWithRetry(() => import('~/containers/Signin'));
const MobileMenu = lazyWithRetry(() => import('./MobileMenu'));
const Incoming = lazyWithRetry(() => import('./Stream/Incoming'));
const Outgoing = lazyWithRetry(() => import('./Stream/Outgoing'));
const AICallWindow = lazyWithRetry(() => import('./AICallWindow'));
const AdminTelemetryWindow = lazyWithRetry(
  () => import('./AdminTelemetryWindow')
);
const UpdateNotice = lazyWithRetry(() => import('./UpdateNotice'));

const buildRuntimeLoadingClass = css`
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100dvh;
  min-height: 100dvh;
  background: #fff;
  z-index: 70;
`;

const buildRuntimeLoadingInnerClass = css`
  width: 100%;
  height: 15rem;
`;

const sessionRecoveryClass = css`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2.4rem;
  background: ${Color.white()};
  text-align: center;

  > div {
    width: min(48rem, 100%);
  }

  p {
    margin: 0.8rem auto 0;
    color: ${Color.darkerGray()};
    font-size: 1.5rem;
    line-height: 1.5;
  }
`;

function BuildRuntimeLoading() {
  return (
    <div className={buildRuntimeLoadingClass} data-build-runtime-loading="true">
      <Loading className={buildRuntimeLoadingInnerClass} />
    </div>
  );
}

function SessionRecovery({ offline }: { offline: boolean }) {
  return (
    <section
      className={sessionRecoveryClass}
      aria-live="polite"
      data-session-recovery="true"
    >
      <div>
        <Loading
          text={
            offline
              ? 'Your session is saved. Waiting for internet…'
              : 'Restoring your saved session…'
          }
        />
        <p>
          Twinkle has not logged you out. Your account will reconnect
          automatically when the server is reachable.
        </p>
      </div>
    </section>
  );
}

function BuildRuntimeKeepAliveRoute() {
  return <BuildRuntimeLoading />;
}

function routeMatches(path: string, pathname: string) {
  return Boolean(matchPath({ path, end: true }, pathname));
}

function BuildPreviewPassthrough() {
  const location = useLocation();

  useEffect(() => {
    const previewPath = `${location.pathname}${location.search}${location.hash}`;
    const previewHostDestination = buildPreviewFrameSrc(previewPath);
    if (
      previewHostDestination &&
      previewHostDestination !== previewPath &&
      previewHostDestination !== window.location.href
    ) {
      window.location.replace(previewHostDestination);
      return;
    }

    const rawBackendUrl = String(API_URL || '').trim();
    if (!rawBackendUrl) return;
    try {
      const destination = new URL(previewPath, rawBackendUrl).toString();
      if (destination === window.location.href) return;
      window.location.replace(destination);
    } catch (error) {
      console.error('Failed to redirect build preview request:', error);
    }
  }, [location.hash, location.pathname, location.search]);

  return (
    <InvalidPage
      title="Redirecting Preview..."
      text="This preview URL should be served by the backend. If it does not redirect, production routing still needs to be fixed."
    />
  );
}

export default function App() {
  useOrientationReflow();
  const navigate = useNavigate();
  const location = useLocation();
  const onCloseSigninModal = useAppContext(
    (v) => v.user.actions.onCloseSigninModal
  );
  const onOpenSigninModal = useAppContext(
    (v) => v.user.actions.onOpenSigninModal
  );
  const onLogout = useAppContext((v) => v.user.actions.onLogout);
  const onSetAchievementsObj = useAppContext(
    (v) => v.user.actions.onSetAchievementsObj
  );
  const adminTelemetryEvents = useManagementContext(
    (v) => v.state.adminTelemetryEvents
  );
  const shouldShowAdminTelemetryWindow = adminTelemetryEvents?.some(
    (event: { notifyAdmin?: boolean }) => event?.notifyAdmin
  );
  const todayStats = useNotiContext((v) => v.state.todayStats);
  const onHydrateTodayStats = useNotiContext(
    (v) => v.actions.onHydrateTodayStats
  );
  const onSetTodayStatsLoading = useNotiContext(
    (v) => v.actions.onSetTodayStatsLoading
  );
  const onResetNumNewNotis = useNotiContext(
    (v) => v.actions.onResetNumNewNotis
  );
  const achievementsObj = useAppContext((v) => v.user.state.achievementsObj);
  const onInitMyState = useAppContext((v) => v.user.actions.onInitMyState);
  const onSetTopMenuSectionSection = useHomeContext(
    (v) => v.actions.onSetTopMenuSectionSection
  );
  const chessPuzzleModalShown = useHomeContext(
    (v) => v.state.chessPuzzleModalShown
  );
  const chessOptionsTargetUser = useHomeContext(
    (v) => v.state.chessOptionsTargetUser
  );
  const onSetChessPuzzleModalShown = useHomeContext(
    (v) => v.actions.onSetChessPuzzleModalShown
  );
  const onSetChessOptionsTargetUser = useHomeContext(
    (v) => v.actions.onSetChessOptionsTargetUser
  );
  const onSetSessionLoaded = useAppContext(
    (v) => v.user.actions.onSetSessionLoaded
  );
  const canonicalSessionUserId = useAppContext(
    (v) => Number(v.user.state.myState.userId || 0)
  );
  const auth = useAppContext((v) => v.requestHelpers.auth);
  const loadMyData = useAppContext((v) => v.requestHelpers.loadMyData);
  const loadAllAchievements = useAppContext(
    (v) => v.requestHelpers.loadAllAchievements
  );
  const fetchTodayStats = useAppContext(
    (v) => v.requestHelpers.fetchTodayStats
  );
  const loadCommunityFunds = useAppContext(
    (v) => v.requestHelpers.loadCommunityFunds
  );
  const recordUserTraffic = useAppContext(
    (v) => v.requestHelpers.recordUserTraffic
  );
  const loadChatNotificationSettings = useAppContext(
    (v) => v.requestHelpers.loadChatNotificationSettings
  );
  const loadPushVapidKey = useAppContext(
    (v) => v.requestHelpers.loadPushVapidKey
  );
  const savePushSubscription = useAppContext(
    (v) => v.requestHelpers.savePushSubscription
  );
  const uploadFile = useAppContext((v) => v.requestHelpers.uploadFile);
  const saveFileData = useAppContext((v) => v.requestHelpers.saveFileData);
  const loadChessStats = useAppContext((v) => v.requestHelpers.loadChessStats);
  const uploadContent = useAppContext((v) => v.requestHelpers.uploadContent);
  const uploadFileOnChat = useAppContext(
    (v) => v.requestHelpers.uploadFileOnChat
  );
  const saveChatMessageWithFileAttachment = useAppContext(
    (v) => v.requestHelpers.saveChatMessageWithFileAttachment
  );
  const reportError = useAppContext((v) => v.requestHelpers.reportError);
  const myState = useMyState();
  const { themeRoles } = useRootTheme();
  const backgroundColorName = themeRoles.background?.color || 'whiteGray';
  const backgroundColorFn = Color[backgroundColorName as keyof typeof Color];
  const resolvedBackgroundColor = backgroundColorFn
    ? backgroundColorFn()
    : backgroundColorName;

  const {
    achievementPoints,
    joinDate,
    level,
    profilePicUrl,
    sessionInterruption,
    signinModalShown,
    twinkleCoins,
    twinkleXP,
    isAdmin,
    userId,
    userType,
    username
  } = myState;
  const [sessionCredentialUnavailable, setSessionCredentialUnavailable] =
    useState(() => Boolean(userId && !readAuthToken().token));
  const awaitingCanonicalSession = Boolean(
    !sessionInterruption &&
      (sessionCredentialUnavailable ||
        (!canonicalSessionUserId && readAuthToken().token))
  );

  const prevUserId = useRef(userId);
  const sessionInitPromiseRef = useRef<Promise<boolean> | null>(null);
  const [confirmedAnalyticsUserId, setConfirmedAnalyticsUserId] = useState<
    number | null
  >(null);
  const analyticsPageViewControllerRef = useRef<ReturnType<
    typeof createAnalyticsPageViewController
  > | null>(null);
  if (!analyticsPageViewControllerRef.current) {
    analyticsPageViewControllerRef.current =
      createAnalyticsPageViewController(trackPageView);
  }
  const analyticsPageViewController = analyticsPageViewControllerRef.current;
  const chatPushEnsuredUserIdRef = useRef<number | null>(null);
  const onSetChatNotificationSettings = useChatContext(
    (v) => v.actions.onSetChatNotificationSettings
  );
  const zeroChannelId = useChatContext((v) => v.state.zeroChannelId);
  const thinkHardState = useChatContext((v) => v.state.thinkHard);
  const channelOnCall = useChatContext((v) => v.state.channelOnCall);
  const channelsObj = useChatContext((v) => v.state.channelsObj);
  const onOpenNewChatTab = useChatContext((v) => v.actions.onOpenNewChatTab);
  const onUpdateSelectedChannelId = useChatContext(
    (v) => v.actions.onUpdateSelectedChannelId
  );
  const onSetPendingChessModalChannelId = useChatContext(
    (v) => v.actions.onSetPendingChessModalChannelId
  );
  const onReceiveMessage = useChatContext((v) => v.actions.onReceiveMessage);
  const onSetChessTarget = useChatContext((v) => v.actions.onSetChessTarget);
  const onSetReplyTarget = useChatContext((v) => v.actions.onSetReplyTarget);
  const onPostFileUploadStatus = useChatContext(
    (v) => v.actions.onPostFileUploadStatus
  );
  const onRemoveFileUploadStatus = useChatContext(
    (v) => v.actions.onRemoveFileUploadStatus
  );
  const onResetTodayStats = useNotiContext((v) => v.actions.onResetTodayStats);
  const onCreateNewDMChannel = useChatContext(
    (v) => v.actions.onCreateNewDMChannel
  );
  const onUpdateChannelPathIdHash = useChatContext(
    (v) => v.actions.onUpdateChannelPathIdHash
  );
  const onUpdateChatUploadProgress = useChatContext(
    (v) => v.actions.onUpdateChatUploadProgress
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onSetCommunityFunds = useAppContext(
    (v) => v.user.actions.onSetCommunityFunds
  );
  const onSetChessStats = useChessContext((v) => v.actions.onSetChessStats);
  const onLoadNewFeeds = useHomeContext((v) => v.actions.onLoadNewFeeds);
  const onResetFeeds = useHomeContext((v) => v.actions.onResetFeeds);
  const onResetContent = useContentContext((v) => v.actions.onResetContent);
  const onResetSubjects = useExploreContext((v) => v.actions.onResetSubjects);
  const onResetProfileViewerState = useProfileContext(
    (v) => v.actions.onResetProfileViewerState
  );
  const onSetInputModalShown = useHomeContext(
    (v) => v.actions.onSetInputModalShown
  );
  const onSetSubmittingSubject = useHomeContext(
    (v) => v.actions.onSetSubmittingSubject
  );
  const onUpdateFileUploadProgress = useHomeContext(
    (v) => v.actions.onUpdateFileUploadProgress
  );

  const onUpdateSecretAttachmentUploadProgress = useHomeContext(
    (v) => v.actions.onUpdateSecretAttachmentUploadProgress
  );
  const onClearFileUploadProgress = useHomeContext(
    (v) => v.actions.onClearFileUploadProgress
  );
  const onSetUploadingFile = useHomeContext(
    (v) => v.actions.onSetUploadingFile
  );
  const onResetSharedPrompts = useMissionContext(
    (v) => v.actions.onResetSharedPrompts
  );
  const updateDetail = useNotiContext((v) => v.state.updateDetail);
  const getCurrentNextDayTimeStamp = useAppContext(
    (v) => v.requestHelpers.getCurrentNextDayTimeStamp
  );
  const onSetDailyRewardModalShown = useNotiContext(
    (v) => v.actions.onSetDailyRewardModalShown
  );
  const dailyRewardModalShown = useNotiContext(
    (v) => v.state.dailyRewardModalShown
  );
  const onSetDailyBonusModalShown = useNotiContext(
    (v) => v.actions.onSetDailyBonusModalShown
  );
  const onSetIsZeroCallAvailable = useChatContext(
    (v) => v.actions.onSetIsZeroCallAvailable
  );
  const onSetZeroChannelId = useChatContext(
    (v) => v.actions.onSetZeroChannelId
  );
  const dailyBonusModalShown = useNotiContext(
    (v) => v.state.dailyBonusModalShown
  );
  const loadDMChannel = useAppContext((v) => v.requestHelpers.loadDMChannel);
  const updateNoticeShown = useNotiContext((v) => v.state.updateNoticeShown);
  const uploadThumb = useAppContext((v) => v.requestHelpers.uploadThumb);
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );
  const pageVisible = useViewContext((v) => v.state.pageVisible);
  const buildNavHidden = useViewContext((v) => v.state.buildNavHidden);
  const onSetBuildNavHidden = useViewContext(
    (v) => v.actions.onSetBuildNavHidden
  );
  const buildHeaderCollapsed = !!useAppContext(
    (v) => v.user.state.myState.buildHeaderCollapsed
  );
  const userSessionLoaded = useAppContext((v) => v.user.state.loaded);
  const aiCallChannelId = useChatContext((v) => v.state.aiCallChannelId);
  const onChangePageVisibility = useViewContext(
    (v) => v.actions.onChangePageVisibility
  );
  const onResetSubjectInput = useInputContext(
    (v) => v.actions.onResetSubjectInput
  );
  const onResetContentInput = useInputContext(
    (v) => v.actions.onResetContentInput
  );
  const [mobileMenuShown, setMobileMenuShown] = useState(false);
  const visibilityChangeRef: React.RefObject<any> = useRef(null);
  const hiddenRef: React.RefObject<any> = useRef(null);
  const authRef: React.RefObject<any> = useRef(null);

  const checkUserChange = useCallback((idToCheck: number) => {
    return idToCheck !== prevUserId.current;
  }, []);

  const keyContextMyState = useMemo(
    () => ({
      ...myState,
      profileTheme: myState.profileTheme || DEFAULT_PROFILE_THEME
    }),
    [myState]
  );
  const keyContextHelpers = useMemo(
    () => ({ checkUserChange, setMobileMenuShown }),
    [checkUserChange]
  );
  const keyContextValue = useMemo(
    () => ({
      myState: keyContextMyState,
      theme: themeRoles,
      helpers: keyContextHelpers
    }),
    [keyContextHelpers, keyContextMyState, themeRoles]
  );

  const aiCallOngoing = useMemo(
    () => !!zeroChannelId && zeroChannelId === aiCallChannelId,
    [aiCallChannelId, zeroChannelId]
  );

  const usingChat = useMemo(
    () => getSectionFromPathname(location?.pathname)?.section === 'chat',
    [location?.pathname]
  );
  const usingBuildAppRuntime = useMemo(
    // Match the deep-link splat too (e.g. /app/884/432-some-slug) so the keep-
    // alive host actually mounts for shared book links, not just /app/:buildId.
    () => routeMatches('/app/:buildId/*', location.pathname),
    [location.pathname]
  );
  const usingEmbeddedBuildAppRuntime = useMemo(
    () =>
      usingBuildAppRuntime &&
      new URLSearchParams(location.search).get('embedded') === '1',
    [location.search, usingBuildAppRuntime]
  );
  const usingFullBuildAppRuntime =
    usingBuildAppRuntime && !usingEmbeddedBuildAppRuntime;
  const usingBuildRuntime = useMemo(
    () =>
      usingBuildAppRuntime ||
      routeMatches('/app-capture/:buildId', location.pathname),
    [location.pathname, usingBuildAppRuntime]
  );
  const [runtimeKeepAliveHostEnabled, setRuntimeKeepAliveHostEnabled] =
    useState(usingBuildAppRuntime);
  // Build apps use the global nav on every device (phones get it as the fixed
  // bottom bar, with the runtime overlay reserving space above it). The build
  // toolbar's two-level collapse still hides the nav for "super full screen".
  // The thumbnail-capture route (/app-capture) must stay chrome-free — it's in
  // usingBuildRuntime but NOT usingFullBuildAppRuntime, so it keeps
  // suppressHeader. Embedded app previews also stay chrome-free inside iframes.
  const showBuildHeader = usingFullBuildAppRuntime;
  // the 2nd-level build collapse ALSO hides the global nav (full-screen app)
  const suppressHeader =
    (usingBuildRuntime && !showBuildHeader) ||
    (showBuildHeader && buildHeaderCollapsed && buildNavHidden);
  const buildNavHiddenStorageReady = !userId || userSessionLoaded;
  const analyticsPath = getAnalyticsPath(location);
  const analyticsUserIdForSync = getConfirmedAnalyticsUserId({
    confirmedUserId: confirmedAnalyticsUserId,
    currentUserId: userId,
    sessionLoaded: userSessionLoaded
  });
  // After an update reload lands, drop the cache-busting param from the URL.
  useEffect(() => {
    stripClientUpdateReloadParam();
  }, []);

  // On (re)entering a full build app page, restore/persist the "super full
  // screen" preference only when the build toolbar is also collapsed. Embedded
  // app previews are iframe chrome and must not read or overwrite this state.
  useEffect(() => {
    if (usingFullBuildAppRuntime) {
      if (!buildNavHiddenStorageReady) return;
      let persistedNavHidden = false;
      try {
        persistedNavHidden = localStorage.getItem(BUILD_NAV_HIDDEN_KEY) === '1';
      } catch {
        // sandboxed embeds can block storage access
      }
      // The canonical expanded toolbar state always wins. Clear any stale
      // session-only nav flag left by an interrupted/older restore so the
      // forbidden "build toolbar shown, global nav hidden" combination cannot
      // survive reconciliation.
      if (!buildHeaderCollapsed && buildNavHidden) {
        onSetBuildNavHidden(false);
      }
      if (persistedNavHidden && buildHeaderCollapsed && !buildNavHidden) {
        onSetBuildNavHidden(true);
        return;
      }
      try {
        localStorage.setItem(
          BUILD_NAV_HIDDEN_KEY,
          buildNavHidden && buildHeaderCollapsed ? '1' : '0'
        );
      } catch {
        // storage can be unavailable in some browser modes
      }
    } else if (buildNavHidden) {
      onSetBuildNavHidden(false);
    }
    // onSetBuildNavHidden is a stable context action — excluded per repo rule
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    buildHeaderCollapsed,
    buildNavHidden,
    buildNavHiddenStorageReady,
    usingFullBuildAppRuntime
  ]);
  useAppShellHeaderOffset({
    headerVisible: !suppressHeader,
    routeKey: location.pathname
  });
  useMobileKeyboardInset({ enabled: !usingChat });

  useEffect(() => {
    if (usingBuildAppRuntime) {
      setRuntimeKeepAliveHostEnabled(true);
    }
  }, [usingBuildAppRuntime]);

  useEffect(() => {
    if (!analyticsUserIdForSync) return;
    // The session response establishes the initial GA identity synchronously
    // in handleInit. Keep its properties current afterwards from the same
    // server/socket-owned user state, never from localStorage's cached user.
    setAnalyticsUser({
      id: analyticsUserIdForSync,
      achievementPoints,
      joinDate,
      level,
      userType
    });
  }, [achievementPoints, analyticsUserIdForSync, joinDate, level, userType]);

  useEffect(() => {
    analyticsPageViewController.observe({
      path: analyticsPath
    });
  }, [analyticsPageViewController, analyticsPath]);

  useEffect(() => {
    if (
      confirmedAnalyticsUserId !== null &&
      confirmedAnalyticsUserId !== Number(userId || 0)
    ) {
      setConfirmedAnalyticsUserId(null);
    }
  }, [confirmedAnalyticsUserId, userId]);

  useEffect(() => {
    checkZeroCallAvailability();

    async function checkZeroCallAvailability() {
      if (userId) {
        const { pathId, channelId } = await loadDMChannel({
          recipient: { id: ZERO_TWINKLE_ID },
          createIfNotExist: true
        });
        onSetIsZeroCallAvailable(!!pathId);
        onSetZeroChannelId(channelId);
      } else {
        onSetIsZeroCallAvailable(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    onSetChatNotificationSettings(null);
    if (!userId) return;
    loadSettings();

    async function loadSettings() {
      try {
        const settings = await loadChatNotificationSettings();
        if (!cancelled && Number(settings?.userId) === Number(userId)) {
          onSetChatNotificationSettings(settings);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load chat notification settings:', error);
        }
      }
    }

    return () => {
      cancelled = true;
    };
    // Stable context actions and request helpers are intentionally omitted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    // Ensure a server-side push subscription exists for devices that enabled
    // chat notifications before the push rollout (or whose browser rotated
    // the endpoint, or that re-log-in after logout tore the subscription
    // down). Runs once per user per session.
    if (!userId) {
      // Logout tears the subscription down; clear the guard so the same
      // account re-enrolls on its next login without a page reload.
      chatPushEnsuredUserIdRef.current = null;
      return;
    }
    if (chatPushEnsuredUserIdRef.current === userId) return;
    if (!chatPushAutoEnrollEligible()) return;
    chatPushEnsuredUserIdRef.current = userId;
    let cancelled = false;
    ensureChatPushSubscription();

    async function ensureChatPushSubscription() {
      const { chatNotificationSettings } = await setupChatPushBestEffort({
        loadVapidKey: loadPushVapidKey,
        saveSubscription: savePushSubscription
      });
      // Re-enrolling can create this account's first subscription row (an
      // earlier one having been pruned or expired), which flips the mute
      // control's gate. Adopt the canonical settings the save returned — but
      // only for the account that is still signed in. A logout or account
      // switch mid-flight would otherwise install the departing user's
      // snapshot over the cleared state, and the reducer would then reject the
      // arriving account's snapshot for having a different userId.
      if (
        cancelled ||
        !chatNotificationSettings ||
        Number(chatNotificationSettings.userId) !== Number(userId)
      ) {
        return;
      }
      onSetChatNotificationSettings(chatNotificationSettings);
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (userId) {
      handleLoadTodayStats();
    }
    async function handleLoadTodayStats() {
      if (!todayStats.loaded) {
        onSetTodayStatsLoading(true);
      }
      try {
        const todayStatsFromServer = await fetchTodayStats();
        if (checkUserChange(userId)) return;
        onHydrateTodayStats({
          todayStats: buildTodayStatsFromResponse(todayStatsFromServer)
        });
      } catch (error) {
        if (!checkUserChange(userId)) {
          console.error('Failed to load today stats:', error);
        }
      } finally {
        if (!checkUserChange(userId)) {
          onSetTodayStatsLoading(false);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [twinkleXP, twinkleCoins, userId]);

  useEffect(() => {
    const tokenRead = readAuthToken();
    const token = tokenRead.token;
    const prevToken = authRef.current?.headers?.authorization;

    if (!achievementsObj || Object.keys(achievementsObj).length === 0) {
      initAchievements();
    }
    if (!token) {
      authRef.current = null;
      const hadAuthenticatedSession = Boolean(
        userId || getStoredItem('userId')
      );
      // A missing read is not an authentication verdict. Mobile Safari can
      // transiently deny or return an empty localStorage read during a route,
      // visibility, or process-resume transition. Preserve the authenticated
      // projection and let the bounded recovery loop below reread the saved
      // credential. Only a canonical HTTP 401 may interrupt the session.
      setSessionCredentialUnavailable(
        !sessionInterruption && hadAuthenticatedSession
      );
      onSetSessionLoaded();
    } else {
      setSessionCredentialUnavailable(false);
      if (token === prevToken) {
        onSetSessionLoaded();
      } else {
        handleInit();
      }
      authRef.current = { headers: { authorization: token } };
    }
    async function initAchievements() {
      const data = await loadAllAchievements();
      onSetAchievementsObj(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, pageVisible, signinModalShown, userId]);

  useEffect(() => {
    const handleAuthTokenStorageChange = (event: StorageEvent) => {
      if (event.key !== 'token') return;

      if (!event.newValue) {
        if (!isExplicitAuthTokenRemovalStorageEvent(event)) {
          // A token-removal event proves only that storage changed, not why.
          // Preserve and repair a page-lifetime credential after Safari
          // cleanup or an older buggy tab; if this page has no credential to
          // repair, keep its signed-in projection behind the recovery screen.
          const retainedToken = readAuthToken().token;
          if (retainedToken) {
            authRef.current = {
              headers: { authorization: retainedToken }
            };
            setSessionCredentialUnavailable(false);
          } else if (userId || getStoredItem('userId')) {
            authRef.current = null;
            setSessionCredentialUnavailable(true);
          }
          return;
        }

        // The dedicated logout signal plus token removal proves another
        // same-origin tab explicitly signed out through Twinkle.
        setSessionCredentialUnavailable(false);
        authRef.current = null;
        onLogout();
        return;
      }

      // A login or account switch in another tab is also authoritative, but
      // the server remains the source of truth for the resulting identity.
      // Adopt only the credential here and let the canonical session response
      // populate shared state.
      setSessionCredentialUnavailable(false);
      authRef.current = { headers: { authorization: event.newValue } };
      const initializeChangedCredential = () => {
        if (readAuthToken().token !== event.newValue) return;
        authRef.current = { headers: { authorization: event.newValue } };
        void handleInit();
      };
      const activeInit = sessionInitPromiseRef.current;
      if (activeInit) {
        // An older credential's canonical read owns the current single-flight
        // slot. Let it observe the token mismatch and settle, then initialize
        // the newly stored credential; joining the old promise would otherwise
        // leave shared state on the departing account until another route.
        void activeInit.then(
          initializeChangedCredential,
          initializeChangedCredential
        );
      } else {
        initializeChangedCredential();
      }
    };

    window.addEventListener('storage', handleAuthTokenStorageChange);
    return () => {
      window.removeEventListener('storage', handleAuthTokenStorageChange);
    };
    // `handleInit` is the component-owned canonical session pipeline.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onLogout]);

  useEffect(() => {
    let offlineRecoveryTimer: number | null = null;
    let offlineRecoveryAttempt = 0;

    const clearOfflineRecoveryProbe = () => {
      if (offlineRecoveryTimer !== null) {
        window.clearTimeout(offlineRecoveryTimer);
        offlineRecoveryTimer = null;
      }
    };

    const resumeSavedSession = (allowOfflineProbe = false) => {
      const recoveredToken = readAuthToken().token;
      const hasSavedSessionIdentity = Boolean(
        canonicalSessionUserId || userId || getStoredItem('userId')
      );
      if (
        sessionInterruption ||
        (!recoveredToken && !hasSavedSessionIdentity)
      ) {
        return;
      }
      if (!recoveredToken) {
        setSessionCredentialUnavailable(true);
        return;
      }
      setSessionCredentialUnavailable(false);
      authRef.current = { headers: { authorization: recoveredToken } };
      // Socket.IO is manually paused on a real offline event. If Safari later
      // updates navigator.onLine without delivering `online`, a focus or the
      // bounded fallback probe must explicitly restart its Manager.
      if (!browserReportsOffline() && !socket.connected) {
        socket.connect();
      }
      // A confirmed session normally needs no HTTP work on focus; Socket.IO's
      // own focus path reconnects it. The exception is iOS reporting offline
      // after the route is usable again: make one canonical request to prove
      // reachability, then reconnect explicitly below.
      if (
        canonicalSessionUserId &&
        (!allowOfflineProbe || !browserReportsOffline())
      ) {
        return;
      }
      void handleInit(
        0,
        Boolean(canonicalSessionUserId),
        allowOfflineProbe
      );
    };
    const scheduleOfflineRecoveryProbe = () => {
      clearOfflineRecoveryProbe();
      if (
        sessionInterruption ||
        (!readAuthToken().token &&
          !sessionCredentialUnavailable &&
          !canonicalSessionUserId &&
          !userId) ||
        (socket.connected && canonicalSessionUserId) ||
        document.visibilityState !== 'visible'
      ) {
        return;
      }
      const delay =
        OFFLINE_SESSION_RECOVERY_PROBE_DELAYS_MS[
          Math.min(
            offlineRecoveryAttempt,
            OFFLINE_SESSION_RECOVERY_PROBE_DELAYS_MS.length - 1
          )
        ];
      offlineRecoveryTimer = window.setTimeout(() => {
        offlineRecoveryTimer = null;
        offlineRecoveryAttempt += 1;
        // This is the last-resort path for iOS omitting both `online` and a
        // resume event. Canonical HTTP identity recovery must not wait behind
        // Socket.IO: the Manager can remain connected/reconnecting while a
        // prior session read failed. Once identity exists, this timer only
        // rescues a Manager that has stopped. Either path backs off to at most
        // once/minute.
        // `socket.active` remains true after Socket.IO exhausts its configured
        // reconnect attempts, so it cannot tell us that the Manager needs a
        // fresh bounded burst. `socket.connect()` is a no-op while a Manager
        // attempt is already active and restarts it after `reconnect_failed`.
        resumeSavedSession(true);
        scheduleOfflineRecoveryProbe();
      }, delay);
    };
    const onOnline = () => {
      clearOfflineRecoveryProbe();
      offlineRecoveryAttempt = 0;
      markBrowserNetworkReachable();
      resumeSavedSession();
    };
    // Safari can restore a usable route before it updates navigator.onLine or
    // dispatches `online`. A user-driven resume gets one real session request
    // even while that hint is stale; handleInit deliberately does not retry
    // that probe until the browser itself reports online.
    const onFocus = () => {
      offlineRecoveryAttempt = 0;
      resumeSavedSession(true);
      scheduleOfflineRecoveryProbe();
    };
    const onPageShow = () => {
      offlineRecoveryAttempt = 0;
      resumeSavedSession(true);
      scheduleOfflineRecoveryProbe();
    };
    const onOffline = () => {
      offlineRecoveryAttempt = 0;
      scheduleOfflineRecoveryProbe();
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('focus', onFocus);
    window.addEventListener('pageshow', onPageShow);
    // A transport loss is authoritative even when Safari omits its network
    // events. Start the same bounded canonical recovery loop so an exhausted
    // Socket.IO reconnect burst cannot leave an otherwise valid saved session
    // offline until the next focus or navigation.
    socket.on('disconnect', scheduleOfflineRecoveryProbe);
    scheduleOfflineRecoveryProbe();
    return () => {
      clearOfflineRecoveryProbe();
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pageshow', onPageShow);
      socket.off('disconnect', scheduleOfflineRecoveryProbe);
    };
    // `handleInit` deliberately remains a component-owned pipeline. This
    // listener only supplies the missing cold-start transition: a saved token
    // whose first canonical session read happened while the browser was
    // offline must retry as soon as connectivity returns. Safari may resume a
    // suspended or back-forward-cached page without first delivering `online`,
    // so focus/pageshow are equivalent bounded recovery opportunities.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    canonicalSessionUserId,
    sessionCredentialUnavailable,
    sessionInterruption,
    userId
  ]);

  const handleVisibilityChange = useCallback(() => {
    const visible = !document[hiddenRef.current as keyof Document];
    socket.emit('change_away_status', visible);
    onChangePageVisibility(visible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof document.hidden !== 'undefined') {
      hiddenRef.current = 'hidden';
      visibilityChangeRef.current = 'visibilitychange';
    } else if (typeof document.msHidden !== 'undefined') {
      hiddenRef.current = 'msHidden';
      visibilityChangeRef.current = 'msvisibilitychange';
    } else if (typeof document.webkitHidden !== 'undefined') {
      hiddenRef.current = 'webkitHidden';
      visibilityChangeRef.current = 'webkitvisibilitychange';
    }
    const eventName = visibilityChangeRef.current;
    addEvent(document, eventName, handleVisibilityChange);
    handleVisibilityChange();
    return function cleanUp() {
      removeEvent(document, eventName, handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  const outgoingShown = useMemo(() => {
    return channelOnCall.imCalling || channelOnCall.outgoingShown;
  }, [channelOnCall.imCalling, channelOnCall.outgoingShown]);

  useLayoutEffect(() => {
    if (prevUserId.current === userId) return;
    onResetContent();
    onResetFeeds();
    onResetSubjects();
    onResetProfileViewerState();
    prevUserId.current = userId;
    // These reset helpers are stable context helpers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    prevUserId.current = userId;
    onSetTopMenuSectionSection('start');
    onSetSubmittingSubject(false);
    onClearFileUploadProgress();
    onSetUploadingFile(false);
    onResetSharedPrompts();
    onResetTodayStats();
    if (!userId) {
      onResetNumNewNotis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <ErrorBoundary
      componentPath="App/index"
      className={css`
        ${usingChat ? 'border-top: 1px solid transparent;' : ''}
        /* Outside chat, the keyboard inset keeps the shell inside the VISUAL
           viewport so bottom-anchored controls stay above the on-screen
           keyboard. Chat retains native viewport ownership instead. */
        height: ${
          suppressHeader
            ? `calc(100% - ${APP_SHELL_KEYBOARD_INSET_STYLE})`
            : `calc(100% - ${APP_SHELL_HEADER_OFFSET_STYLE} - ${APP_SHELL_KEYBOARD_INSET_STYLE})`
        };
        width: 100%;
        display: flow-root;
        @media (max-width: ${mobileMaxWidth}) {
          height: calc(100% - ${APP_SHELL_KEYBOARD_INSET_STYLE});
        }
      `}
    >
      <KeyContext.Provider value={keyContextValue}>
        <SocketManager onInit={handleInit} />
        {mobileMenuShown && (
          <Suspense fallback={null}>
            <MobileMenu onClose={() => setMobileMenuShown(false)} />
          </Suspense>
        )}
        {updateNoticeShown && (
          <Suspense fallback={null}>
            <UpdateNotice updateDetail={updateDetail} />
          </Suspense>
        )}
        {!suppressHeader && (
          awaitingCanonicalSession ? null : (
            <Header onMobileMenuOpen={() => setMobileMenuShown(true)} />
          )
        )}
        {awaitingCanonicalSession ? (
          <SessionRecovery offline={browserReportsOffline()} />
        ) : null}
        <div
          id="App"
          className={`${userIsUsingIOS && !usingChat ? 'ios ' : ''}${css`
            margin-top: ${suppressHeader ? '0' : APP_SHELL_HEADER_OFFSET_STYLE};
            height: 100%;
            min-height: 100%;
            @media (max-width: ${mobileMaxWidth}) {
              margin-top: 0;
              padding-top: 0;
            }
          `}`}
        >
          {!awaitingCanonicalSession ? (
            <Suspense fallback={<Loading />}>
              <NavigationRouteReadyObserver />
              <Routes>
              <Route path="/users/:username/*" element={<Profile />} />
              <Route path="/ai-stories/:contentId" element={<ContentPage />} />
              <Route path="/comments/:contentId" element={<ContentPage />} />
              <Route
                path="/mission-passes/:contentId"
                element={<ContentPage />}
              />
              <Route
                path="/achievement-unlocks/:contentId"
                element={<ContentPage />}
              />
              <Route
                path="/daily-rewards/:contentId"
                element={<ContentPage />}
              />
              <Route
                path="/shared-prompts/:contentId"
                element={<ContentPage />}
              />
              <Route
                path="/daily-reflections/:contentId"
                element={<ContentPage />}
              />
              <Route path="/videos/:videoId" element={<VideoPage />} />
              <Route path="/videos/:videoId/*" element={<VideoPage />} />
              <Route path="/links/:linkId" element={<LinkPage />} />
              <Route path="/subjects/:contentId" element={<ContentPage />} />
              <Route path="/explore" element={<ExploreRedirect />} />
              <Route
                path="/ai-cards"
                element={<Explore category="ai-cards" />}
              />
              <Route path="/videos" element={<Explore category="videos" />} />
              <Route path="/links" element={<Explore category="links" />} />
              <Route
                path="/subjects"
                element={<Explore category="subjects" />}
              />
              <Route path="/playlists/*" element={<PlaylistPage />} />
              <Route
                path="/missions/:missionType/*"
                element={<MissionPage />}
              />
              <Route path="/missions" element={<Mission />} />
              <Route
                path="/build/preview/*"
                element={<BuildPreviewPassthrough />}
              />
              <Route path="/build/*" element={<Build />} />
              <Route path="/prompts/*" element={<Prompts />} />
              <Route
                path="/app-capture/:buildId"
                element={<BuildThumbnailCaptureHost />}
              />
              <Route
                path="/app/:buildId/*"
                element={<BuildRuntimeKeepAliveRoute />}
              />
              <Route path="/cli" element={<CliDeviceAuth />} />
              <Route
                path="/chat/*"
                element={<Chat onFileUpload={handleFileUploadOnChat} />}
              />
              <Route path="/management/*" element={<Management />} />
              <Route path="/reset/*" element={<ResetPassword />} />
              <Route path="/verify/*" element={<Verify />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/users" element={<Home section="people" />} />
              <Route path="/groups" element={<Home section="group" />} />
              <Route
                path="/achievements"
                element={<Home section="achievement" />}
              />
              <Route
                path="/achievements/:achievementType"
                element={<AchievementPage />}
              />
              <Route path="/settings" element={<Home section="store" />} />
              <Route path="/earn" element={<Home section="earn" />} />
              <Route
                path="/"
                element={
                  <Home section="story" onFileUpload={handleFileUploadOnHome} />
                }
              />
              <Route path="/:username/*" element={<Redirect />} />
              <Route path="*" element={<InvalidPage />} />
              </Routes>
            </Suspense>
          ) : null}
        </div>
        {!awaitingCanonicalSession &&
        (usingBuildAppRuntime || runtimeKeepAliveHostEnabled) ? (
          <Suspense
            fallback={usingBuildAppRuntime ? <BuildRuntimeLoading /> : null}
          >
            <BuildRuntimeKeepAliveHost />
          </Suspense>
        ) : null}
        {chessOptionsTargetUser && (
          <Suspense fallback={null}>
            <ChessOptionsModal
              onHide={handleHideChessOptionsModal}
              targetUsername={chessOptionsTargetUser.username}
              unansweredChessMsgChannelId={null}
              onStartTargetChess={
                Number(chessOptionsTargetUser.id) !== Number(userId)
                  ? handleStartTargetChess
                  : undefined
              }
              onPlayPuzzles={handleGlobalPlayPuzzles}
            />
          </Suspense>
        )}
        {chessPuzzleModalShown && (
          <Suspense fallback={null}>
            <ChessPuzzleModal
              onHide={() => onSetChessPuzzleModalShown(false)}
            />
          </Suspense>
        )}
        {dailyRewardModalShown && (
          <Suspense
            fallback={
              <LazyModalFallback
                onHide={() => onSetDailyRewardModalShown(false)}
                title="Daily Reward"
                loadingText="Opening your daily reward..."
              />
            }
          >
            <LazyDailyRewardModal
              onSetHasBonus={(hasBonus: boolean) => {
                onUpdateTodayStats({
                  newStats: {
                    dailyHasBonus: hasBonus,
                    dailyRewardResultViewed: true
                  }
                });
              }}
              onSetIsDailyRewardChecked={() => {
                onUpdateTodayStats({
                  newStats: {
                    dailyRewardResultViewed: true
                  }
                });
              }}
              onCountdownComplete={handleCountdownComplete}
              onHide={() => onSetDailyRewardModalShown(false)}
            />
          </Suspense>
        )}
        {dailyBonusModalShown && (
          <Suspense
            fallback={
              <LazyModalFallback
                onHide={() => onSetDailyBonusModalShown(false)}
                title="Daily Bonus"
                loadingText="Opening your daily bonus..."
              />
            }
          >
            <LazyDailyRewardModal
              openBonus
              onHide={() => onSetDailyBonusModalShown(false)}
              onSetDailyBonusAttempted={handleSetDailyBonusAttempted}
              onSetHasBonus={() => {}}
              onSetIsDailyRewardChecked={() => {}}
              onCountdownComplete={() => {}}
            />
          </Suspense>
        )}
        {signinModalShown && (
          <Suspense fallback={null}>
            <SigninModal onHide={onCloseSigninModal} />
          </Suspense>
        )}
        {channelOnCall.incomingShown && (
          <Suspense fallback={null}>
            <Incoming />
          </Suspense>
        )}
        {outgoingShown && (
          <Suspense fallback={null}>
            <Outgoing />
          </Suspense>
        )}
        <div
          className={css`
            opacity: 0;
            position: fixed;
            background: url('/img/emojis.png');
          `}
        />
        {aiCallOngoing && (
          <Suspense fallback={null}>
            <AICallWindow
              initialPosition={{
                x: Math.max(0, window.innerWidth - 520),
                y: 70
              }}
            />
          </Suspense>
        )}
        {isAdmin && shouldShowAdminTelemetryWindow && (
          <Suspense fallback={null}>
            <AdminTelemetryWindow
              initialPosition={{
                x: Math.max(0, window.innerWidth - 520),
                y: 100
              }}
            />
          </Suspense>
        )}
      </KeyContext.Provider>
      <Global
        styles={{
          body: {
            background: `var(--page-bg, ${resolvedBackgroundColor})`
          }
        }}
      />
    </ErrorBoundary>
  );

  function handleHideChessOptionsModal() {
    onSetChessOptionsTargetUser(null);
  }

  function handleGlobalPlayPuzzles() {
    onSetChessOptionsTargetUser(null);
    onSetChessPuzzleModalShown(true);
  }

  async function handleStartTargetChess() {
    const targetUser = chessOptionsTargetUser;
    onSetChessOptionsTargetUser(null);

    if (!userId) {
      onOpenSigninModal();
      return;
    }

    if (!targetUser?.id || Number(targetUser.id) === Number(userId)) {
      return;
    }

    try {
      const { channelId, pathId } = await loadDMChannel({
        recipient: targetUser
      });
      if (!pathId) {
        onOpenNewChatTab({
          user: { username, id: userId, profilePicUrl },
          recipient: {
            username: targetUser.username,
            id: targetUser.id,
            profilePicUrl: targetUser.profilePicUrl
          }
        });
      }
      navigateToChatWithPendingChessModal({
        channelId,
        chatPath: pathId ? `/chat/${pathId}` : `/chat/new`,
        navigate,
        onSetPendingChessModalChannelId,
        onUpdateSelectedChannelId
      });
    } catch (error) {
      reportError({
        componentPath: 'containers/App/index',
        message: `handleStartTargetChess failed: ${JSON.stringify({
          targetUserId: targetUser.id,
          targetUsername: targetUser.username
        })}`,
        info: error instanceof Error ? error.message : String(error)
      });
    }
  }

  function handleSetDailyBonusAttempted() {
    onUpdateTodayStats({
      newStats: {
        dailyBonusAttempted: true
      }
    });
  }

  async function handleCountdownComplete() {
    onSetDailyRewardModalShown(false);
    const newNextDayTimeStamp = toValidNextDayTimeStamp(
      await getCurrentNextDayTimeStamp()
    );
    if (newNextDayTimeStamp === null) {
      console.error('Failed to resolve next day timestamp for app rollover');
      return;
    }
    onHydrateTodayStats({
      todayStats: buildTodayStatsForNextDay(newNextDayTimeStamp, todayStats)
    });
    if (!userId) return;
    try {
      const todayStatsFromServer = await fetchTodayStats();
      if (checkUserChange(userId)) return;
      onHydrateTodayStats({
        todayStats: buildTodayStatsFromResponse(todayStatsFromServer)
      });
    } catch (error) {
      if (!checkUserChange(userId)) {
        console.error('Failed to refresh today stats after rollover:', error);
      }
    }
  }

  async function handleFileUploadOnHome({
    attachment,
    byUser,
    description,
    filePath,
    hasSecretAnswer,
    rewardLevel,
    secretAnswer,
    secretAttachment,
    title
  }: {
    attachment: any;
    byUser: any;
    description: string;
    filePath: string;
    hasSecretAnswer: boolean;
    rewardLevel: number;
    secretAnswer: string;
    secretAttachment: any;
    title: string;
  }) {
    const { file, thumbnail, contentType } = attachment ?? {};
    const appliedFileName = generateFileName(attachment?.file?.name || '');
    const appliedSecretFileName = generateFileName(
      secretAttachment?.file?.name || ''
    );
    try {
      const secretAttachmentFilePath = uuidv1();
      if (contentType === 'file') {
        await handleFileUpload({
          filePath,
          file,
          fileName: appliedFileName,
          onUploadProgress: handleUploadProgress
        });
      }
      if (hasSecretAnswer && secretAttachment) {
        await handleFileUpload({
          filePath: secretAttachmentFilePath,
          file: secretAttachment.file,
          fileName: appliedSecretFileName,
          onUploadProgress: handleSecretAttachmentUploadProgress
        });
      }

      const [thumbUrl, secretThumbUrl] = await Promise.all([
        handleThumbnailUpload({
          thumbnail,
          file
        }),
        hasSecretAnswer
          ? handleThumbnailUpload({
              thumbnail: secretAttachment?.thumbnail,
              file: secretAttachment?.file
            })
          : Promise.resolve('')
      ]);

      const userChanged = checkUserChange(userId);
      if (userChanged) {
        return;
      }

      const data = await uploadContent({
        title,
        byUser,
        description: finalizeEmoji(description),
        secretAnswer: hasSecretAnswer ? secretAnswer : '',
        rewardLevel,
        thumbUrl,
        secretAttachmentThumbUrl: secretThumbUrl,
        ...(hasSecretAnswer && secretAttachment
          ? {
              secretAttachmentFilePath,
              secretAttachmentFileName: appliedSecretFileName,
              secretAttachmentFileSize: secretAttachment.file.size
            }
          : {}),
        ...(contentType === 'file'
          ? { filePath, fileName: appliedFileName, fileSize: file.size }
          : {}),
        ...(attachment && contentType !== 'file'
          ? { rootId: attachment.id, rootType: contentType }
          : {})
      });
      if (data) {
        onLoadNewFeeds([data]);
      }
      onResetSubjectInput();
      onResetContentInput();
      onSetSubmittingSubject(false);
      onClearFileUploadProgress();
      onSetInputModalShown({ shown: false });
      onSetUploadingFile(false);
    } catch (error) {
      console.error(error);
    }
    function handleSecretAttachmentUploadProgress({
      loaded,
      total
    }: {
      loaded: number;
      total: number;
    }) {
      onUpdateSecretAttachmentUploadProgress(loaded / total);
    }
    function handleUploadProgress({
      loaded,
      total
    }: {
      loaded: number;
      total: number;
    }) {
      const userChanged = checkUserChange(userId);
      if (userChanged) {
        return;
      }
      onUpdateFileUploadProgress(loaded / total);
    }
  }

  async function handleFileUploadOnChat({
    channelId,
    content,
    fileName,
    filePath,
    fileToUpload,
    recipientId,
    recipientUsername,
    targetMessageId,
    subchannelId,
    topicId,
    thumbnail,
    isCielChat,
    isZeroChat,
    onAiUsagePolicyUpdate
  }: {
    channelId: number;
    content: string;
    fileName: string;
    filePath: string;
    fileToUpload: File;
    recipientId: number;
    recipientUsername?: string;
    targetMessageId: number;
    subchannelId: number;
    topicId: number;
    thumbnail: string;
    isCielChat: boolean;
    isZeroChat: boolean;
    onAiUsagePolicyUpdate?: (policy?: any) => void;
  }) {
    const currentChannel = channelsObj[channelId];
    if (channelId === 0 && !recipientId) {
      reportError({
        componentPath: 'App/index',
        message: `handleFileUploadOnChat: User is trying to send the first file message to someone but recipient ID is missing`
      });
      return window.location.reload();
    }
    onSetChessTarget({ channelId, target: null });
    onSetReplyTarget({ channelId, subchannelId, target: null });

    onPostFileUploadStatus({
      channelId,
      content,
      fileName,
      filePath,
      fileToUpload,
      recipientId,
      subchannelId
    });

    let completedUploadMeta: {
      uploadId: string;
      uploadToken: string;
    };
    try {
      completedUploadMeta = await uploadFileOnChat({
        fileName,
        selectedFile: fileToUpload,
        onUploadProgress: handleUploadProgress,
        isAIChat: isCielChat || isZeroChat,
        path: filePath
      });
    } catch (error) {
      onRemoveFileUploadStatus({
        channelId,
        subchannelId,
        filePath
      });
      throw error;
    }

    let thumbUrl;
    let savedFileMessage;
    try {
      thumbUrl = await handleThumbnailUpload({
        thumbnail,
        file: fileToUpload
      });

      const userChanged = checkUserChange(userId);
      if (userChanged) {
        return;
      }

      await saveFileData({
        fileName,
        filePath,
        actualFileName: fileToUpload.name,
        rootType: 'chat',
        uploadId: completedUploadMeta.uploadId,
        uploadToken: completedUploadMeta.uploadToken
      });

      savedFileMessage = await saveChatMessageWithFileAttachment({
        channelId,
        content,
        fileName,
        actualFileName: fileToUpload.name,
        fileSize: fileToUpload.size,
        path: filePath,
        recipientId,
        targetMessageId,
        chessState: currentChannel.chessTarget,
        thumbUrl,
        subchannelId,
        topicId,
        isCielChat,
        isZeroChat,
        thinkHard:
          (isCielChat &&
            (thinkHardState.ciel[topicId] ?? thinkHardState.ciel.global)) ||
          (isZeroChat &&
            (thinkHardState.zero[topicId] ?? thinkHardState.zero.global))
      });
    } catch (error: any) {
      console.error('Failed to save uploaded chat file:', error);
      onRemoveFileUploadStatus({
        channelId,
        subchannelId,
        filePath
      });
      if (error?.aiUsagePolicy) {
        onAiUsagePolicyUpdate?.(error.aiUsagePolicy);
      }
      throw error;
    }

    const {
      channel,
      message,
      alreadyExists,
      netCoins,
      aiUsagePolicy,
      quickAccess
    } = savedFileMessage;

    if (typeof netCoins === 'number') {
      onSetUserState({
        userId,
        newState: { twinkleCoins: netCoins }
      });
    }
    if (aiUsagePolicy) {
      onAiUsagePolicyUpdate?.(aiUsagePolicy);
    }

    if (alreadyExists) {
      return window.location.reload();
    }
    onRemoveFileUploadStatus({
      channelId,
      subchannelId,
      filePath
    });
    trackEvent('chat_message_send', {
      channel_type: isZeroChat
        ? 'ai_zero'
        : isCielChat
          ? 'ai_ciel'
          : currentChannel?.twoPeople
            ? 'dm'
            : 'group',
      has_attachment: true
    });
    if (channelId && message) {
      onReceiveMessage({
        pageVisible: document.visibilityState === 'visible',
        message,
        usingChat: true,
        currentSubchannelId: Number(message.subchannelId || subchannelId || 0),
        isMyMessage: true
      });
    }
    if (channelId) {
      const channelData = {
        id: channelId,
        channelName: recipientUsername || currentChannel.channelName,
        members: currentChannel.members,
        twoPeople: currentChannel.twoPeople,
        pathId: currentChannel.pathId
      };
      // No client-side flags on the relay payload: the socket server reloads
      // the canonical message row and discards anything else. "New message"
      // stamping happens on the receiving client in RECEIVE_MESSAGE.
      socket.emit('new_chat_message', {
        message,
        channel: channelData
      });
    }
    if (channel) {
      onUpdateChannelPathIdHash({
        channelId: channel.id,
        pathId: channel.pathId
      });
      onCreateNewDMChannel({
        channel,
        message,
        quickAccess,
        userId
      });
      socket.emit('join_chat_group', message.channelId);
      socket.emit('send_bi_chat_invitation', {
        userId: recipientId,
        members: currentChannel.members,
        pathId: channel.pathId,
        message
      });
      navigate(`/chat/${channel.pathId}`, { replace: true });
    }
    function handleUploadProgress({
      loaded,
      total
    }: {
      loaded: number;
      total: number;
    }) {
      const userChanged = checkUserChange(userId);
      if (userChanged) {
        return;
      }
      onUpdateChatUploadProgress({
        channelId,
        subchannelId,
        path: filePath,
        progress: loaded / total
      });
    }
  }

  async function handleInit(
    attempts = 0,
    canonicalAnalyticsUserConfirmed = false,
    allowOfflineProbe = false
  ): Promise<boolean> {
    if (attempts > 0) {
      return runSessionInit(
        attempts,
        canonicalAnalyticsUserConfirmed,
        allowOfflineProbe
      );
    }

    const existingInit = sessionInitPromiseRef.current;
    if (existingInit) return existingInit;

    const initPromise = runSessionInit(
      attempts,
      canonicalAnalyticsUserConfirmed,
      allowOfflineProbe
    );
    const trackedInit = initPromise.finally(() => {
      if (sessionInitPromiseRef.current === trackedInit) {
        sessionInitPromiseRef.current = null;
      }
    });
    sessionInitPromiseRef.current = trackedInit;
    return trackedInit;
  }

  async function runSessionInit(
    attempts: number,
    canonicalAnalyticsUserConfirmed: boolean,
    allowOfflineProbe: boolean
  ): Promise<boolean> {
    const initToken = auth()?.headers?.authorization;
    if (!initToken) return false;
    if (browserReportsOffline() && !allowOfflineProbe) {
      onSetSessionLoaded();
      return false;
    }
    const sessionChanged = () => auth()?.headers?.authorization !== initToken;
    const maxRetries = 3;
    const retryDelay = 1000;
    let analyticsUserConfirmed = canonicalAnalyticsUserConfirmed;

    try {
      const data = await loadMyData(location.pathname);
      if (sessionChanged()) return false;
      if (!data?.id) {
        throw new Error('Session response did not include a canonical user');
      }
      // The canonical session response is stronger reachability evidence than
      // Safari's navigator.onLine hint. This lets the ensuing identity update
      // reconnect Socket.IO even if iOS has not refreshed that hint yet.
      markBrowserNetworkReachable();
      Object.keys(localStorageKeys).forEach((key) => {
        const value = data[key] || localStorageKeys[key];
        setStoredItem(key, value);
      });
      onSetUserState({
        userId: data.id,
        newState: data
      });
      onInitMyState(data);
      if (!socket.connected) {
        // This is the bounded stale-navigator recovery path above. The stored
        // identity is canonical at this point, so the socket can safely resume
        // without waiting for a browser `online` event that Safari omitted.
        socket.connect();
      }
      setConfirmedAnalyticsUserId(Number(data.id));
      setAnalyticsUser(data);
      analyticsUserConfirmed = true;
      try {
        const { totalFunds } = await loadCommunityFunds();
        if (sessionChanged()) return false;
        onSetCommunityFunds(totalFunds || 0);
      } catch (error) {
        console.error('Failed to load community funds:', error);
      }

      try {
        const chessStats = await loadChessStats();
        if (sessionChanged()) return false;
        if (chessStats) {
          onSetChessStats(chessStats);
        }
      } catch (error) {
        console.error('Failed to load chess stats:', error);
      }
      try {
        await recordUserTraffic(location.pathname);
      } catch (error) {
        // Traffic accounting is ancillary. Retrying the complete identity
        // bootstrap when it fails multiplies session reads and socket work on
        // a weak mobile route even though canonical identity already loaded.
        console.error('Failed to record user traffic:', error);
      }
      return !sessionChanged();
    } catch (error: any) {
      if (sessionChanged()) return false;
      // The global request boundary has already moved a canonically rejected
      // session into the sign-in interruption state. Retaining the credential
      // for diagnosis/recovery must not turn the old token into a retry loop.
      if (error?.status === 401) return false;
      // A focus/pageshow probe made while Safari still says offline is a
      // one-shot reachability check. If it fails, wait for another explicit
      // recovery signal instead of heating the device with retry traffic.
      if (attempts < maxRetries && !browserReportsOffline()) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        if (sessionChanged()) return false;
        // Keep the original in-flight owner closed until the entire bounded
        // retry chain settles. Releasing it before a recursive attempt ends
        // lets focus/pageshow start duplicate session requests on mobile.
        return handleInit(
          attempts + 1,
          analyticsUserConfirmed,
          allowOfflineProbe
        );
      }
      if (!analyticsUserConfirmed) clearAnalyticsUser();
      console.error('Failed to initialize after multiple attempts:', error);
      return false;
    } finally {
      if (!sessionChanged()) onSetSessionLoaded();
    }
  }

  async function handleThumbnailUpload({
    thumbnail,
    file
  }: {
    thumbnail: string;
    file?: File;
  }) {
    if (!thumbnail) {
      if (file?.type?.startsWith('video/')) {
        try {
          const videoUrl = URL.createObjectURL(file);
          const extractedThumbnail = await extractVideoThumbnail(videoUrl);
          if (extractedThumbnail) {
            const thumbnailFile = returnImageFileFromUrl({
              imageUrl: extractedThumbnail
            });
            return await uploadThumb({
              file: thumbnailFile,
              path: uuidv1()
            });
          }
        } catch (error) {
          console.error('Video thumbnail extraction failed:', error);
        }
      }
      return '';
    }

    try {
      const file = returnImageFileFromUrl({ imageUrl: thumbnail });
      return await uploadThumb({
        file,
        path: uuidv1()
      });
    } catch (error) {
      console.error('Thumbnail upload failed:', error);
      return '';
    }
  }

  async function handleFileUpload({
    filePath,
    file,
    fileName,
    onUploadProgress
  }: {
    filePath: string;
    file: File;
    fileName: string;
    onUploadProgress: (params: { loaded: number; total: number }) => void;
  }) {
    let uploadId = '';
    let uploadToken = '';
    const uploadedPath = await uploadFile({
      filePath,
      file,
      fileName,
      onUploadCompletedMeta: (meta: UploadCompletionMeta) => {
        uploadId = meta.uploadId;
        uploadToken = meta.uploadToken;
      },
      onUploadProgress
    });
    await saveFileData({
      fileName,
      filePath,
      actualFileName: file.name,
      rootType: 'subject',
      uploadId,
      uploadToken
    });
    return uploadedPath;
  }
}
