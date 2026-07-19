import React, { useEffect, useMemo, useRef, useState } from 'react';
import Nav, { navTargetIsActive } from './Nav';
import TabStrip, { type NavTabDescriptor, type TabMenuItem } from './TabStrip';
import MobileSideMenuNav from './MobileSideMenuNav';
import Icon from '~/components/Icon';
import AlertModal from '~/components/Modals/AlertModal';
import useTabletOrientation from '~/helpers/hooks/useTabletOrientation';
import { matchPath } from 'react-router-dom';
import { Color, desktopMinWidth, mobileMaxWidth } from '~/constants/css';
import TabSwitcher, {
  SwitcherSection,
  SwitcherItem,
  SwitcherKind
} from './TabSwitcher';
import MobileLongPressNav from './MobileLongPressNav';
import { css } from '@emotion/css';
import {
  getDefaultMinimizedNavTabKeys,
  getNavSessionMeta,
  getPrimaryNavTabOrder,
  isDefaultMinimizedNavTabKey,
  isNavTabKey,
  isSacredDefaultKey,
  NAV_TAB_ORDER_VERSION,
  NAV_TAB_KEYS,
  loadCustomNavTabs,
  loadMinimizedNavTabKeys,
  loadNavTabOrder,
  mergeSessionNavTabsIntoServerOrder,
  sanitizeCustomNavTabs,
  sanitizeMinimizedNavTabKeys,
  loadTabMenuDiscovered,
  sanitizeNavTabOrder,
  saveCustomNavTabs,
  saveMinimizedNavTabKeys,
  saveNavTabOrder,
  saveTabMenuDiscovered,
  type CustomNavTab,
  type NavDraftState,
  type NavTabKey,
  type PrimaryNavTabKey
} from '~/helpers/navTabOrder';
import { getSectionFromPathname } from '~/helpers';
import {
  AI_CARD_CHAT_TYPE,
  GENERAL_CHAT_PATH_ID,
  VOCAB_CHAT_TYPE
} from '~/constants/defaultValues';
import { truncateText, abbreviateNumber } from '~/helpers/stringHelpers';
import {
  useAppContext,
  useChatContext,
  useHomeContext,
  useViewContext,
  useKeyContext
} from '~/contexts';
import { socket } from '~/constants/sockets/api';
import { isBuildListPath } from '~/containers/Build/List/helpers/url';

// max tabs a user may pin (server enforces the same cap in settings.ts)
const MAX_PINNED_TABS = 10;
const homeLabel = 'Home';
const exploreLabel = 'Explore';
const missionsLabel = 'Missions';
const buildLabel = 'Build';
const chatLabel = 'Chat';
const contentLabels: Record<string, string> = {
  comments: 'Comment',
  links: 'Link',
  missions: 'Mission',
  playlists: 'Playlist',
  subjects: 'Subject',
  videos: 'Video',
  'ai-cards': 'AI Card',
  'ai-stories': 'AI Story',
  'daily-reflections': 'Daily Reflection',
  'mission-passes': 'Mission Pass',
  'achievement-unlocks': 'Achievement',
  'daily-rewards': 'Daily Goal',
  'shared-prompts': 'Shared Prompt',
  management: 'Management'
};

function getDynamicTabDismissalKey(
  userId: number | string | null | undefined,
  to: string
) {
  return `${userId || 'guest'}::${to}`;
}

function isDynamicTabTargetDismissed({
  dismissedKey,
  userId,
  target
}: {
  dismissedKey: string | null;
  userId: number | string | null | undefined;
  target?: string | null;
}) {
  return !!target && dismissedKey === getDynamicTabDismissalKey(userId, target);
}

function readAuthToken() {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
}

function readTokenUserId(tokenValue: string | null) {
  if (!tokenValue) return null;
  const [, payload] = tokenValue.split('.');
  if (!payload) return null;
  try {
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = normalizedPayload.padEnd(
      Math.ceil(normalizedPayload.length / 4) * 4,
      '='
    );
    const decoded = JSON.parse(atob(paddedPayload));
    return decoded?.sub == null ? null : String(decoded.sub);
  } catch {
    return null;
  }
}

function tokenMatchesUser(
  tokenValue: string | null,
  userId: number | string | null | undefined
) {
  if (!userId) return false;
  return readTokenUserId(tokenValue) === String(userId);
}

function tokenTransitionMatchesUser({
  previousToken,
  currentToken,
  userId
}: {
  previousToken: string | null;
  currentToken: string | null;
  userId: number | string | null | undefined;
}) {
  if (currentToken === previousToken) return true;
  return (
    tokenMatchesUser(previousToken, userId) &&
    tokenMatchesUser(currentToken, userId)
  );
}

function getBuildAppIdFromTabTarget(to: string) {
  const pathname = String(to || '').split(/[?#]/)[0];
  const match = matchPath({ path: '/app/:buildId/*', end: true }, pathname);
  const rawBuildId = String(match?.params.buildId || '').trim();
  if (!/^\d+$/.test(rawBuildId)) return null;
  const buildId = Number(rawBuildId);
  return Number.isSafeInteger(buildId) && buildId > 0 ? rawBuildId : null;
}

function buildTabIntentBelongsToUser({
  ownerUserId,
  userId
}: {
  ownerUserId: number | string | null | undefined;
  userId: number | string | null | undefined;
}) {
  if (ownerUserId == null) return userId == null;
  return String(ownerUserId) === String(userId);
}

function isCustomTabVisibleForNavScope({
  tab,
  navScope,
  userId,
  managementLevel
}: {
  tab: CustomNavTab;
  navScope: number | string | null | undefined;
  userId: number | string | null | undefined;
  managementLevel: number | null | undefined;
}) {
  if (navScope !== userId) return false;
  if (tab.to.startsWith('/management') && Number(managementLevel || 0) <= 0) {
    return false;
  }
  return true;
}

function iconForContentNav(nav: string) {
  return nav === 'management'
    ? 'user-group-crown'
    : nav === 'videos' || nav === 'playlists'
      ? 'film'
      : nav === 'ai-cards'
        ? 'cards-blank'
        : nav === 'ai-stories'
          ? 'book-open'
          : nav === 'links'
            ? 'book'
            : nav === 'subjects'
              ? 'bolt'
              : nav === 'missions'
                ? 'clipboard-check'
                : nav === 'achievement-unlocks'
                  ? 'trophy'
                  : nav === 'mission-passes'
                    ? 'check-circle'
                    : nav === 'daily-rewards'
                      ? 'check-circle'
                      : nav === 'daily-reflections'
                        ? 'pencil-alt'
                        : nav === 'shared-prompts'
                          ? 'share'
                          : 'comment-alt';
}

export default function MainNavs({
  isAIChat,
  loggedIn,
  numChatUnreads,
  numNewNotis,
  numNewPosts,
  onMobileMenuOpen,
  pathname,
  search,
  defaultSearchFilter,
  totalRewardAmount,
  onSetBalanceModalShown
}: {
  isAIChat: boolean;
  loggedIn: boolean;
  numChatUnreads: number;
  numNewNotis: number;
  numNewPosts: number;
  onMobileMenuOpen: () => void;
  pathname: string;
  search: string;
  defaultSearchFilter: string;
  onSetBalanceModalShown: () => void;
  totalRewardAmount: number;
}) {
  const twinkleCoins = useKeyContext((v) => v.myState.twinkleCoins);
  const userId = useKeyContext((v) => v.myState.userId);
  const managementLevel = useKeyContext((v) => v.myState.managementLevel);
  const lastChatPath = useKeyContext((v) => v.myState.lastChatPath);
  const userLoaded = useAppContext((v) => v.user.state.loaded);
  const exploreCategory = useViewContext((v) => v.state.exploreCategory);
  const contentPath = useViewContext((v) => v.state.contentPath);
  const contentNav = useViewContext((v) => v.state.contentNav);
  const missionNav = useViewContext((v) => v.state.missionNav);
  const profileNav = useViewContext((v) => v.state.profileNav);
  const homeNav = useViewContext((v) => v.state.homeNav);
  const pageTitle = useViewContext((v) => v.state.pageTitle);
  const openBuildTab = useViewContext((v) => v.state.openBuildTab);
  const buildAppToClose = useViewContext((v) => v.state.buildAppToClose);
  const mutedBuildAppIds = useViewContext((v) => v.state.mutedBuildAppIds);
  const onSetBuildAppMuted = useViewContext(
    (v) => v.actions.onSetBuildAppMuted
  );
  const onToggleBuildAppMuted = useViewContext(
    (v) => v.actions.onToggleBuildAppMuted
  );
  const onSetBuildAppNavTabIds = useViewContext(
    (v) => v.actions.onSetBuildAppNavTabIds
  );
  const onSetOpenBuildTab = useViewContext((v) => v.actions.onSetOpenBuildTab);
  const onRequestCloseBuildApp = useViewContext(
    (v) => v.actions.onRequestCloseBuildApp
  );
  const onKillBuildAppSession = useViewContext(
    (v) => v.actions.onKillBuildAppSession
  );
  const updateNavTabsState = useAppContext(
    (v) => v.requestHelpers.updateNavTabsState
  );
  const onUpdateNavTabsState = useAppContext(
    (v) => v.user.actions.onUpdateNavTabsState
  );
  const serverNavTabs = useAppContext(
    (v) => v.user.state.myState.state?.navTabs
  );
  // whether the session payload itself ever arrived: `loaded` flips true
  // in handleInit's finally EVEN when every retry failed, so it can't
  // distinguish "account has no nav state" from "we never saw the state"
  const sessionStateArrived = useAppContext(
    (v) => v.user.state.myState.state !== undefined
  );
  const [customTabs, setCustomTabs] = useState<CustomNavTab[]>(() =>
    loadCustomNavTabs(userId)
  );
  const [tabOrder, setTabOrder] = useState<string[]>(() =>
    loadNavTabOrder(loadCustomNavTabs(userId), userId)
  );
  const [minimizedTabKeys, setMinimizedTabKeys] = useState<string[]>(() =>
    loadMinimizedNavTabKeys(loadCustomNavTabs(userId), userId)
  );
  const [pinLimitAlertShown, setPinLimitAlertShown] = useState(false);
  // which surface opened the tab switcher. The two surfaces' dynamic content
  // slots have different sources (desktop strip: desktopContentTab, which can
  // retain an older uncovered page; mobile bar: the shared contentNav/
  // contentPath), and the switcher must mirror the strip/bar it was opened
  // from — otherwise a dynamic tab visible in the desktop strip could be
  // missing from the manager.
  const [tabSwitcherShownFrom, setTabSwitcherShownFrom] = useState<
    'mobile' | 'desktop' | null
  >(null);
  // long-press popup on a bottom-nav icon. Dynamic tabs (content/profile) offer
  // pin/add; an already-added tab offers pin + remove (mobile parity with the
  // desktop tab strip's right-click menu).
  const [longPressMenu, setLongPressMenu] = useState<{
    x: number;
    y: number;
    items: {
      icon: string | [string, string];
      label: string;
      className?: string;
      onClick: () => void;
    }[];
  } | null>(null);
  // Tablet portrait keeps customizable extras compact and narrows the pinned
  // lane. Primary labels are resolved separately below so the active primary
  // remains labelled in either tablet orientation.
  const { isTabletPortrait } = useTabletOrientation();
  const [lastActivePrimaryKey, setLastActivePrimaryKey] =
    useState<PrimaryNavTabKey | null>(
      () => getNavSessionMeta(userId).lastActivePrimaryKey
    );
  const [recentExtraTabKeys, setRecentExtraTabKeys] = useState<string[]>(
    () => [...getNavSessionMeta(userId).recentExtraTabKeys]
  );
  // which account the COMMITTED nav state belongs to. On an SPA login the
  // account-reset effect and the adoption effect share one flush: the
  // reset's setStates haven't committed, so adoption's closures still
  // hold the previous scope's tabs. State (not a ref) because it must
  // commit together with the reloaded per-account state
  const [navScope, setNavScope] = useState(userId);
  const [tabMenuDiscovered, setTabMenuDiscovered] = useState<boolean>(() =>
    loadTabMenuDiscovered(userId)
  );
  const tabMenuDiscoveredRef = useRef(tabMenuDiscovered);
  tabMenuDiscoveredRef.current = tabMenuDiscovered;
  // render-synced mirrors for async consumers (the write queue's
  // reconciliation runs long after the closure that enqueued it)
  const customTabsRef = useRef(customTabs);
  customTabsRef.current = customTabs;
  const tabOrderRef = useRef(tabOrder);
  tabOrderRef.current = tabOrder;
  const minimizedTabKeysRef = useRef(minimizedTabKeys);
  minimizedTabKeysRef.current = minimizedTabKeys;
  const visibleCustomTabs = useMemo(
    () =>
      customTabs.filter((tab) =>
        isCustomTabVisibleForNavScope({
          tab,
          navScope,
          userId,
          managementLevel
        })
      ),
    [customTabs, managementLevel, navScope, userId]
  );
  // the DESKTOP dynamic slot: last content page not covered by a custom
  // tab. Kept separate from contentNav/contentPath, which track every
  // content page for the mobile bottom nav — this is what lets the
  // desktop slot keep pointing at page B while the user visits captured
  // page A, without desktop customization ever affecting mobile
  const [desktopContentTab, setDesktopContentTab] = useState<{
    nav: string;
    path: string;
  } | null>(null);
  const dismissedDynamicContentTabRef = useRef<string | null>(null);
  const dismissedDynamicProfileTabRef = useRef<string | null>(null);

  useEffect(() => {
    // scope gate (see adoption/readiness effects): during an account
    // switch the closure's customTabs still belong to the previous scope
    if (navScope !== userId) return;
    setDesktopContentTab((prev) => {
      const contentTarget = `/${contentPath}`;
      const dynamicTargetDismissed = isDynamicTabTargetDismissed({
        dismissedKey: dismissedDynamicContentTabRef.current,
        userId,
        target: contentTarget
      });
      if (
        contentNav &&
        contentPath &&
        !customTabs.some((tab) => tab.to === contentTarget) &&
        !dynamicTargetDismissed
      ) {
        return prev?.nav === contentNav && prev?.path === contentPath
          ? prev
          : { nav: contentNav, path: contentPath };
      }
      // the slot's own page just became captured (pin/extract/adoption)
      if (prev && customTabs.some((tab) => tab.to === `/${prev.path}`)) {
        return null;
      }
      return prev;
    });
  }, [contentNav, contentPath, customTabs, navScope, userId]);
  // this account's session merge history: which fields the user edited
  // (a pin-only action must not flush a stale local ORDER), tabs they
  // created/touched (the only local entries allowed to override the
  // server), removals with provenance (removing a session-created tab
  // says nothing about server state; removing a pre-existing pin does),
  // and per-key minimize intents. Module-backed via getNavSessionMeta so
  // it survives header remounts and logout/relogin within the page session
  // — see NavSessionMeta in navTabOrder.ts
  const navMetaRef = useRef(getNavSessionMeta(userId));
  // JSON of the last server snapshot this instance adopted or reconciled.
  // A content guard (not a once-flag): if a PREVIOUS header instance's
  // in-flight save resolves after this instance already adopted, its
  // reconcile updates the context copy and this instance must re-adopt
  // the newer canonical — while our own reconcile records its snapshot
  // here so it never triggers a self-perpetuating adopt/flush loop
  const lastAdoptedNavTabsRef = useRef<string | null>(null);
  const navConfigUserIdRef = useRef(userId);
  // server writes chain on navMetaRef.current.writeQueue (module-scoped,
  // per account) so ordering holds even across header remounts — see
  // NavSessionMeta
  // login-session generation lives with the module-scoped write queue in
  // NavSessionMeta, and token storage bumps it even while Header is unmounted
  // writes are HELD until the session's nav state has been seen: a write
  // built from the stale pre-hydration cache would otherwise erase pins
  // made on other devices before this device ever learns about them
  const navServerReadyRef = useRef(false);
  const pendingNavWriteRef = useRef<{
    order: string[];
    pinnedTabs: CustomNavTab[];
    minimized: string[];
    menuDiscovered: boolean;
    localCustomTabs?: CustomNavTab[];
  } | null>(null);

  function publishBuildAppNavTabIdsFromCustomTabs(
    sourceCustomTabs: CustomNavTab[] | null
  ) {
    if (
      !sourceCustomTabs ||
      navScope !== userId ||
      (userId && !navServerReadyRef.current)
    ) {
      onSetBuildAppNavTabIds(null);
      return;
    }
    const buildAppIds = sourceCustomTabs
      .filter((tab) =>
        isCustomTabVisibleForNavScope({
          tab,
          navScope,
          userId,
          managementLevel
        })
      )
      .map((tab) => getBuildAppIdFromTabTarget(tab.to))
      .filter((buildAppId): buildAppId is string => !!buildAppId);
    onSetBuildAppNavTabIds(buildAppIds);
  }

  useEffect(() => {
    publishBuildAppNavTabIdsFromCustomTabs(getNavEditBase().customTabs);
    // onSetBuildAppNavTabIds is a stable context action — excluded per repo rule
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    customTabs,
    managementLevel,
    navScope,
    serverNavTabs,
    sessionStateArrived,
    userId,
    userLoaded
  ]);

  // nav config is per-account: on login/logout re-init from the new
  // account's (namespaced) cache and let its server config adopt fresh
  useEffect(() => {
    if (navConfigUserIdRef.current === userId) return;
    navConfigUserIdRef.current = userId;
    navMetaRef.current.sessionGen += 1;
    navMetaRef.current.draft = null;
    lastAdoptedNavTabsRef.current = null;
    setNavScope(userId);
    // per-scope session meta is NOT cleared — it lives at module level so
    // each account's merge history survives both header remounts and
    // logout/relogin within the same page session
    navMetaRef.current = getNavSessionMeta(userId);
    navMetaRef.current.draft = null;
    setLastActivePrimaryKey(navMetaRef.current.lastActivePrimaryKey);
    setRecentExtraTabKeys([...navMetaRef.current.recentExtraTabKeys]);
    navServerReadyRef.current = false;
    pendingNavWriteRef.current = null;
    const storedCustomTabs = loadCustomNavTabs(userId);
    setCustomTabs(storedCustomTabs);
    setTabOrder(loadNavTabOrder(storedCustomTabs, userId));
    setMinimizedTabKeys(loadMinimizedNavTabKeys(storedCustomTabs, userId));
    setTabMenuDiscovered(loadTabMenuDiscovered(userId));
  }, [userId]);

  // discovery is monotonic and adopted regardless of local customization.
  // tabMenuDiscovered/userId are deps because on an account switch this
  // can first run with the PREVIOUS account's (possibly true) local value
  // and must re-run after the per-account cache reset applies
  useEffect(() => {
    // scope gate for uniformity with every other nav effect (this one is
    // provably safe without it — its stale-flush outcome matches the
    // correct final value — but "all nav effects are gated" is a simpler
    // invariant to maintain than one documented exception)
    if (navScope !== userId) return;
    if (serverNavTabs?.menuDiscovered && !tabMenuDiscovered) {
      setTabMenuDiscovered(true);
      saveTabMenuDiscovered(userId);
    }
  }, [serverNavTabs, tabMenuDiscovered, userId, navScope]);

  // adopt the server-synced nav config once it arrives with /user/session.
  // If the user already customized tabs this session, their order/minimize
  // changes win — but server pins they haven't seen yet are merged in
  // rather than silently overwritten (the pre-hydration edit was made
  // against a stale view; destroying another device's pins from it would
  // be data loss)
  useEffect(() => {
    if (!serverNavTabs) return;
    // the committed state must belong to the current account — on an SPA
    // login this defers one render until the per-account reset commits
    if (navScope !== userId) return;
    const serverSnapshot = JSON.stringify(serverNavTabs);
    if (serverSnapshot === lastAdoptedNavTabsRef.current) return;
    lastAdoptedNavTabsRef.current = serverSnapshot;
    navServerReadyRef.current = true;
    const hadPendingWrite = !!pendingNavWriteRef.current;
    pendingNavWriteRef.current = null;
    const serverCustomTabs = sanitizeCustomNavTabs(serverNavTabs.pinnedTabs);
    const serverCustomTabIds = new Set(serverCustomTabs.map((tab) => tab.id));
    // Pins the server now knows are no longer session-created/local-only.
    // If a tab was added, removed before the add ACK reconciled, and then
    // the remove write failed, the server snapshot proves the pending
    // removal must now suppress that server-backed tab.
    for (const tab of serverCustomTabs) {
      navMetaRef.current.createdIds.delete(tab.id);
    }
    navMetaRef.current.removedTabs = navMetaRef.current.removedTabs.map(
      (removed) =>
        removed.sessionCreated && serverCustomTabIds.has(removed.id)
          ? { ...removed, sessionCreated: false }
          : removed
    );
    if (navMetaRef.current.customized) {
      const editBase = getNavEditBase();
      // per-field merge: only fields the user actually edited this session
      // win over the server; everything else adopts the server value
      // (a pre-hydration pin must not flush the stale local order)
      const dirty = navMetaRef.current.dirtyFields;
      const touched = navMetaRef.current.touchedIds;
      const removed = navMetaRef.current.removedTabs;
      // merge base is the SERVER's pins, not the cache: a cached pin the
      // server no longer has was removed on another device and must not
      // be resurrected. Only session-touched local tabs override
      const baseTabs = serverCustomTabs
        .filter(
          (server) =>
            !removed.some(
              (r) =>
                !r.sessionCreated && (r.id === server.id || r.to === server.to)
            )
        )
        .map((server) => {
          const localVersion = editBase.customTabs.find(
            (local) => local.id === server.id
          );
          return localVersion && touched.has(server.id) ? localVersion : server;
        });
      // session tabs dedupe against the POST-removal base: a pin the user
      // removed and re-added under the same URL must survive. Unpinned
      // (extracted) tabs are kept regardless of `touched` — they only ever
      // exist client-side this page session (possibly created before a
      // header remount reset the refs), so keeping them cannot resurrect
      // another device's removals
      const nextCustomTabs = dirty.custom
        ? [
            ...baseTabs,
            ...editBase.customTabs.filter(
              (local) =>
                (!local.pinned || touched.has(local.id)) &&
                !baseTabs.some(
                  (base) => base.id === local.id || base.to === local.to
                )
            )
          ]
        : [
            ...serverCustomTabs,
            ...editBase.customTabs.filter(
              (local) =>
                !local.pinned &&
                !serverCustomTabs.some(
                  (server) => server.id === local.id || server.to === local.to
                )
            )
          ];
      const serverOrderWithSessionTabs = mergeSessionNavTabsIntoServerOrder({
        serverOrder: serverNavTabs.order,
        localOrder: editBase.order,
        customTabs: nextCustomTabs
      });
      const nextOrder =
        dirty.order && navMetaRef.current.canonicalOrderEdited
          ? sanitizeNavTabOrder(editBase.order, nextCustomTabs)
          : serverOrderWithSessionTabs;
      const serverMinimized = sanitizeMinimizedNavTabKeys(
        serverNavTabs.minimized,
        nextCustomTabs
      );
      let nextMinimized = serverMinimized;
      if (dirty.minimized) {
        // server list is the base; the user's explicit per-key toggles
        // from this session are applied on top
        const intents = navMetaRef.current.minimizedIntents;
        const merged = serverMinimized.filter((key) => intents[key] !== false);
        for (const [key, minimized] of Object.entries(intents)) {
          if (minimized && !merged.includes(key)) {
            merged.push(key);
          }
        }
        nextMinimized = sanitizeMinimizedNavTabKeys(merged, nextCustomTabs);
      }
      setCustomTabs(nextCustomTabs);
      setTabOrder(nextOrder);
      setMinimizedTabKeys(nextMinimized);
      saveCustomNavTabs(nextCustomTabs, userId);
      saveNavTabOrder(nextOrder, userId);
      saveMinimizedNavTabKeys(nextMinimized, userId);
      // the pre-hydration writes were held; flush the merged result once.
      // menuDiscovered derives from the server value directly: the sibling
      // effect that adopts it has only SCHEDULED its setState in this same
      // flush, so both the closure and the render-synced ref can still
      // read false when the queued thunk starts (microtasks can beat the
      // re-render commit) — the flag is monotonic and must never regress
      const flushPayload = {
        order: nextOrder,
        pinnedTabs: nextCustomTabs.filter((tab) => tab.pinned),
        minimized: nextMinimized,
        menuDiscovered:
          !!serverNavTabs.menuDiscovered || editBase.menuDiscovered
      };
      // a remount of an already-synced customized session merges to
      // exactly what the server holds — skip the redundant write then
      const serverEquivalent = {
        order: serverOrderWithSessionTabs,
        pinnedTabs: serverCustomTabs.filter((tab) => tab.pinned),
        minimized: serverMinimized,
        menuDiscovered: !!serverNavTabs.menuDiscovered
      };
      if (JSON.stringify(flushPayload) !== JSON.stringify(serverEquivalent)) {
        navMetaRef.current.draft = {
          order: flushPayload.order,
          customTabs: nextCustomTabs,
          minimized: flushPayload.minimized,
          menuDiscovered: flushPayload.menuDiscovered
        };
        queueNavTabsWrite({
          ...flushPayload,
          localCustomTabs: nextCustomTabs
        });
      } else {
        navMetaRef.current.draft = null;
      }
      return;
    }
    // full adoption still preserves session-extracted (unpinned) tabs —
    // they never round-trip through the server, and a header remount
    // must not destroy them
    const adoptedCustomTabs = [
      ...serverCustomTabs,
      ...customTabs.filter(
        (local) =>
          !local.pinned &&
          !serverCustomTabs.some(
            (server) => server.id === local.id || server.to === local.to
          )
      )
    ];
    const nextOrder = mergeSessionNavTabsIntoServerOrder({
      serverOrder: serverNavTabs.order,
      localOrder: tabOrder,
      customTabs: adoptedCustomTabs
    });
    const nextMinimized = sanitizeMinimizedNavTabKeys(
      serverNavTabs.minimized,
      adoptedCustomTabs
    );
    setCustomTabs(adoptedCustomTabs);
    setTabOrder(nextOrder);
    setMinimizedTabKeys(nextMinimized);
    // mirror locally so the next load renders the synced state instantly,
    // before /user/session returns
    saveCustomNavTabs(adoptedCustomTabs, userId);
    saveNavTabOrder(nextOrder, userId);
    saveMinimizedNavTabKeys(nextMinimized, userId);
    navMetaRef.current.draft = null;
    if (hadPendingWrite) {
      // a held non-customizing write (menu discovery) must still land,
      // rebuilt on top of the adopted state (server value ORed in for the
      // same scheduler-race reason as the customized branch above)
      queueNavTabsWrite({
        order: nextOrder,
        pinnedTabs: serverCustomTabs.filter((tab) => tab.pinned),
        minimized: nextMinimized,
        localCustomTabs: adoptedCustomTabs,
        menuDiscovered:
          !!serverNavTabs.menuDiscovered || tabMenuDiscoveredRef.current
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverNavTabs, navScope, userId]);

  // accounts with no server nav state yet: once the session confirms
  // there is nothing to adopt, release any held write. userId is a dep
  // because `loaded` survives logout (LOGOUT only resets myState): an
  // A->B switch where neither account has navTabs changes neither other
  // dep, and sync would stay disarmed for B forever. Arming right away
  // on a switch is sound — the login response already carried the new
  // account's canonical state
  useEffect(() => {
    // Guests have no server-owned nav row. Their scoped local layout is the
    // canonical state and is migrated by loadStoredNavLayout; this bootstrap
    // branch must never reinterpret a missing server row as a reset request.
    if (!userId) {
      navServerReadyRef.current = true;
      return;
    }
    if (
      !userLoaded ||
      !sessionStateArrived ||
      serverNavTabs ||
      navServerReadyRef.current
    ) {
      return;
    }
    // same gate as the adoption effect: on an account switch this runs in
    // the reset's flush while the refs still mirror the PREVIOUS scope's
    // committed state — flushing then would persist the wrong account's
    // layout as this account's canonical nav state
    if (navScope !== userId) return;
    navServerReadyRef.current = true;
    if (pendingNavWriteRef.current) {
      const pending = pendingNavWriteRef.current;
      pendingNavWriteRef.current = null;
      queueNavTabsWrite(pending);
    } else if (navMetaRef.current.customized) {
      // a previous header instance customized tabs and this account has no
      // server state to merge against — flush the current snapshot so the
      // session's changes still land
      navMetaRef.current.draft = {
        order: tabOrderRef.current,
        customTabs: customTabsRef.current,
        minimized: minimizedTabKeysRef.current,
        menuDiscovered: tabMenuDiscoveredRef.current
      };
      queueNavTabsWrite({
        order: tabOrderRef.current,
        pinnedTabs: customTabsRef.current.filter((tab) => tab.pinned),
        minimized: minimizedTabKeysRef.current,
        localCustomTabs: customTabsRef.current,
        menuDiscovered: tabMenuDiscoveredRef.current
      });
    } else {
      const defaultCustomTabs: CustomNavTab[] = [];
      const defaultOrder = [...NAV_TAB_KEYS];
      const defaultMinimized = getDefaultMinimizedNavTabKeys();
      if (JSON.stringify(customTabsRef.current) !== '[]') {
        setCustomTabs(defaultCustomTabs);
      }
      if (
        JSON.stringify(tabOrderRef.current) !== JSON.stringify(defaultOrder)
      ) {
        setTabOrder(defaultOrder);
      }
      if (
        JSON.stringify(minimizedTabKeysRef.current) !==
        JSON.stringify(defaultMinimized)
      ) {
        setMinimizedTabKeys(defaultMinimized);
      }
      // no server row is the canonical default. Do not keep showing stale
      // local-only cache as accepted state.
      navMetaRef.current.draft = null;
      saveCustomNavTabs(defaultCustomTabs, userId);
      saveNavTabOrder(defaultOrder, userId);
      saveMinimizedNavTabKeys(defaultMinimized, userId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userLoaded, sessionStateArrived, serverNavTabs, navScope]);
  const onSetExploreCategory = useViewContext(
    (v) => v.actions.onSetExploreCategory
  );
  const onSetContentPath = useViewContext((v) => v.actions.onSetContentPath);
  const onSetContentNav = useViewContext((v) => v.actions.onSetContentNav);
  const onSetMissionNav = useViewContext((v) => v.actions.onSetMissionNav);
  const onSetProfileNav = useViewContext((v) => v.actions.onSetProfileNav);
  const onSetHomeNav = useViewContext((v) => v.actions.onSetHomeNav);

  const onSetLastChatPath = useAppContext(
    (v) => v.user.actions.onSetLastChatPath
  );
  const feedsOutdated = useHomeContext((v) => v.state.feedsOutdated);
  const chatType = useChatContext((v) => v.state.chatType);
  const loaded = useRef(false);
  const isMissionSection = useMemo(
    () => pathname.startsWith('/missions'),
    [pathname]
  );
  const isBuildListSection = useMemo(
    () => isBuildListPath(pathname, { loggedIn: !!userId }),
    [pathname, userId]
  );
  const missionLinkTarget = useMemo(
    () => (isMissionSection ? '/missions' : missionNav || '/missions'),
    [isMissionSection, missionNav]
  );
  const buildLinkTarget = isBuildListSection
    ? `${pathname}${search || ''}`
    : '/build';

  const displayedTwinkleCoins = useMemo(
    () => abbreviateNumber(twinkleCoins),
    [twinkleCoins]
  );

  const chatMatch = useMemo(
    () =>
      matchPath(
        {
          path: '/chat/*'
        },
        pathname
      ),
    [pathname]
  );

  const homeMatch = useMemo(
    () =>
      matchPath(
        {
          path: '/'
        },
        pathname
      ),
    [pathname]
  );

  const usersMatch = useMemo(
    () =>
      matchPath(
        {
          path: '/users'
        },
        pathname
      ),
    [pathname]
  );

  const earnMatch = useMemo(
    () =>
      matchPath(
        {
          path: '/earn'
        },
        pathname
      ),
    [pathname]
  );

  const achievementsMatch = useMemo(
    () =>
      matchPath(
        {
          path: '/achievements'
        },
        pathname
      ),
    [pathname]
  );

  const groupsMatch = useMemo(
    () =>
      matchPath(
        {
          path: '/groups'
        },
        pathname
      ),
    [pathname]
  );

  const storeMatch = useMemo(
    () =>
      matchPath(
        {
          path: '/settings'
        },
        pathname
      ),
    [pathname]
  );

  const contentPageMatch = useMemo(() => {
    const cardPageMatch = matchPath(
      {
        path: '/ai-cards/:id'
      },
      pathname
    );
    const storyPageMatch = matchPath(
      {
        path: '/ai-stories/:id'
      },
      pathname
    );
    const subjectPageMatch = matchPath(
      {
        path: '/subjects/:id'
      },
      pathname
    );
    const playlistsMatch = matchPath(
      {
        path: '/playlists/:id'
      },
      pathname
    );
    const videoPageMatch = matchPath(
      {
        path: '/videos/:id'
      },
      pathname
    );
    const videoQuestionPageMatch = matchPath(
      {
        path: '/videos/:id/questions'
      },
      pathname
    );
    const linkPageMatch = matchPath(
      {
        path: '/links/:id'
      },
      pathname
    );
    const commentPageMatch = matchPath(
      {
        path: '/comments/:id'
      },
      pathname
    );
    const dailyReflectionPageMatch = matchPath(
      {
        path: '/daily-reflections/:id'
      },
      pathname
    );
    const missionPassPageMatch = matchPath(
      {
        path: '/mission-passes/:id'
      },
      pathname
    );
    const achievementUnlockPageMatch = matchPath(
      {
        path: '/achievement-unlocks/:id'
      },
      pathname
    );
    const dailyRewardPageMatch = matchPath(
      {
        path: '/daily-rewards/:id'
      },
      pathname
    );
    const sharedPromptPageMatch = matchPath(
      {
        path: '/shared-prompts/:id'
      },
      pathname
    );

    return (
      !!cardPageMatch ||
      !!storyPageMatch ||
      !!subjectPageMatch ||
      !!playlistsMatch ||
      !!videoPageMatch ||
      !!videoQuestionPageMatch ||
      !!linkPageMatch ||
      !!commentPageMatch ||
      !!dailyReflectionPageMatch ||
      !!missionPassPageMatch ||
      !!achievementUnlockPageMatch ||
      !!dailyRewardPageMatch ||
      !!sharedPromptPageMatch
    );
  }, [pathname]);

  const profilePageMatch = matchPath(
    {
      path: '/users/:userId/*'
    },
    pathname
  );

  // Opening a Lumine app or build workspace spawns a real (session, pinnable)
  // extra tab. App tabs are de-duped by build id; the active one moves to the
  // left edge through the shared MRU ordering below.
  // Depends on the nav-readiness signals (serverNavTabs / userLoaded /
  // sessionStateArrived) so an app opened BEFORE the nav is ready still spawns
  // its tab once readiness lands, instead of being dropped by the ready-gate.
  useEffect(() => {
    if (!openBuildTab) return;
    if (
      !buildTabIntentBelongsToUser({
        ownerUserId: openBuildTab.ownerUserId,
        userId
      })
    ) {
      onSetOpenBuildTab(null);
      return;
    }
    if (navScope !== userId) return;
    if (userId && !navServerReadyRef.current) return;
    const openBuildAppId = getBuildAppIdFromTabTarget(openBuildTab.to);
    const canonicalOpenTab = customTabs.find(
      (tab) =>
        tab.to === openBuildTab.to ||
        (openBuildAppId &&
          getBuildAppIdFromTabTarget(tab.to) === openBuildAppId)
    );
    if (canonicalOpenTab && !canonicalOpenTab.pinned) {
      rememberExtraTabOpened(canonicalOpenTab.id);
    }
    handleCaptureTab({
      to: openBuildTab.to,
      icon: openBuildTab.kind === 'workspace' ? 'wrench' : 'rocket-launch',
      label: openBuildTab.label,
      pinned: false
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    openBuildTab,
    customTabs,
    navScope,
    userId,
    serverNavTabs,
    userLoaded,
    sessionStateArrived
  ]);

  // The build runtime's "Close app" button can't reach the tab list directly
  // (MainNavs is unmounted on mobile /app routes), so it posts the build id
  // here; once MainNavs is mounted again it consumes the request and removes
  // that app's tab. Session teardown is handled separately by the runtime's
  // direct kill request, so this only reconciles the nav.
  useEffect(() => {
    if (!buildAppToClose) return;
    if (
      !buildTabIntentBelongsToUser({
        ownerUserId: buildAppToClose.ownerUserId,
        userId
      })
    ) {
      onRequestCloseBuildApp(null);
      return;
    }
    if (handleCloseBuildAppTab(buildAppToClose.buildAppId)) {
      onRequestCloseBuildApp(null);
    }
    // handlers + onRequestCloseBuildApp are stable — excluded per repo rule
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    buildAppToClose,
    navScope,
    serverNavTabs,
    sessionStateArrived,
    userId,
    userLoaded
  ]);

  useEffect(() => {
    const { section } = getSectionFromPathname(pathname);
    const currentLocation = `${pathname}${search || ''}`;
    if (homeMatch) {
      onSetHomeNav('/');
    } else if (usersMatch) {
      onSetHomeNav('/users');
    } else if (earnMatch) {
      onSetHomeNav('/earn');
    } else if (groupsMatch) {
      onSetHomeNav('/groups');
    } else if (storeMatch) {
      onSetHomeNav('/settings');
    } else if (achievementsMatch) {
      onSetHomeNav('/achievements');
    }

    if (chatMatch) {
      const lastChatPathArray = pathname.split('chat/');
      const path = lastChatPathArray?.[1] || '';
      if (path) {
        onSetLastChatPath(`/${path}`);
      }
    }

    // NOTE: contentNav/contentPath deliberately track ALL content pages,
    // including ones captured as desktop custom tabs — the mobile bottom
    // nav renders from this same state and must stay unaffected by desktop
    // tab customization. The desktop strip hides its duplicate at render
    // time instead (see the content descriptor in orderedTabs).
    if (contentPageMatch) {
      if (
        !isDynamicTabTargetDismissed({
          dismissedKey: dismissedDynamicContentTabRef.current,
          userId,
          target: currentLocation
        })
      ) {
        if (contentNav !== section) {
          onSetContentNav(section);
        }
        onSetContentPath(currentLocation.substring(1));
      }
    }
    if (section === 'missions') {
      const nextMissionNav = `${pathname}${search || ''}`;
      if (missionNav !== nextMissionNav) {
        onSetMissionNav(nextMissionNav);
      }
    }
    if (section === 'management' && managementLevel > 0) {
      if (
        !isDynamicTabTargetDismissed({
          dismissedKey: dismissedDynamicContentTabRef.current,
          userId,
          target: currentLocation
        })
      ) {
        if (contentNav !== 'management') {
          onSetContentNav('management');
        }
        onSetContentPath(currentLocation.substring(1));
      }
    } else if (contentNav === 'management' && managementLevel <= 0) {
      onSetContentNav('');
      onSetContentPath('');
    }
    if (
      !contentPageMatch &&
      !(section === 'management' && managementLevel > 0)
    ) {
      dismissedDynamicContentTabRef.current = null;
    }

    if (profilePageMatch) {
      if (
        !isDynamicTabTargetDismissed({
          dismissedKey: dismissedDynamicProfileTabRef.current,
          userId,
          target: pathname
        })
      ) {
        onSetProfileNav(pathname);
      }
    } else {
      dismissedDynamicProfileTabRef.current = null;
    }
    if (['links', 'videos', 'subjects', 'ai-cards'].includes(section)) {
      onSetExploreCategory(`${section}${search ? `/${search}` : ''}`);
      loaded.current = true;
    } else if (!loaded.current && defaultSearchFilter) {
      onSetExploreCategory(
        ['videos', 'subjects', 'links', 'ai-cards'].includes(
          defaultSearchFilter
        )
          ? defaultSearchFilter
          : 'subjects'
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultSearchFilter, managementLevel, pathname, search, userId]);

  const contentIconType = useMemo(
    () => iconForContentNav(contentNav),
    [contentNav]
  );

  const profileUsername = useMemo(() => {
    let result = '';
    if (profileNav) {
      const splitProfileNav = profileNav.split('/users/')[1].split('/');
      result = splitProfileNav[0];
    }
    return result;
  }, [profileNav]);

  const chatAlertShown = useMemo(
    () => loggedIn && !chatMatch && numChatUnreads > 0,
    [chatMatch, loggedIn, numChatUnreads]
  );

  const chatButtonPath = useMemo(() => {
    const normalizedLastChatPath =
      lastChatPath && lastChatPath !== '/' ? lastChatPath : '';
    const preferredChatPath =
      chatType === VOCAB_CHAT_TYPE
        ? `/${VOCAB_CHAT_TYPE}`
        : chatType === AI_CARD_CHAT_TYPE
          ? `/${AI_CARD_CHAT_TYPE}`
          : normalizedLastChatPath ||
            (userLoaded ? `/${GENERAL_CHAT_PATH_ID}` : '');
    return preferredChatPath ? `/chat${preferredChatPath}` : '/chat';
  }, [chatType, lastChatPath, userLoaded]);

  const {
    currentActiveExtraTabKey,
    currentActivePrimaryKey,
    defaultNavTabs,
    extraNavTabs,
    visibleExtraTabKeys
  } = useMemo(() => {
    const homeAlertShown = pathname === '/' && !usersMatch && numNewPosts > 0;
    // like the dynamic content tab (see the desktopContentTab effect), suppress
    // the dynamic profile tab once its profile is captured/added as a custom
    // tab — otherwise the same profile shows twice (dynamic + captured).
    // Scope/access-gated: during an account switch customTabs still belong to
    // the previous scope, so only visible tabs can suppress dynamic slots.
    const profileCaptured = visibleCustomTabs.some(
      (tab) => tab.to === profileNav
    );
    const profileDynamicTargetDismissed = isDynamicTabTargetDismissed({
      dismissedKey: dismissedDynamicProfileTabRef.current,
      userId,
      target: profileNav
    });
    const descriptors: Record<NavTabKey, NavTabDescriptor | null> = {
      profile:
        profileNav && !profileCaptured && !profileDynamicTargetDismissed
          ? {
              key: 'profile',
              to: profileNav,
              imgLabel: 'user',
              profileUsername,
              // like the content tab, the profile tab is dynamic (reflects the
              // last-viewed profile) until pinned/added — italic label
              kind: 'dynamic' as const,
              closable: true,
              // show the true username casing (matches the captured tab and how
              // usernames render everywhere else) — no lossy uppercasing.
              // same truncation limit as the captured profile tab (1133) so the
              // preview matches what gets pinned (WYSIWYG)
              label: truncateText({
                text: profileUsername,
                limit: 14
              })
            }
          : null,
      home: {
        key: 'home',
        to: homeNav,
        imgLabel: 'home',
        isHome: true,
        isUsingChat: !!chatMatch,
        alert: homeAlertShown,
        label: `${homeLabel}${homeAlertShown ? ` (${numNewPosts})` : ''}`
      },
      explore: {
        key: 'explore',
        to: `/${exploreCategory}`,
        imgLabel: 'search',
        label: exploreLabel
      },
      content:
        desktopContentTab &&
        (desktopContentTab.nav !== 'management' || managementLevel > 0)
          ? {
              key: 'content',
              to: `/${desktopContentTab.path}`,
              imgLabel: iconForContentNav(desktopContentTab.nav),
              kind: 'dynamic' as const,
              closable: true,
              // the slot always targets one SPECIFIC page; without this,
              // Nav's /management prefix rule lights a stale dynamic tab
              // on every management route alongside a captured one
              exactActive: true,
              label: contentLabels[desktopContentTab.nav] || null
            }
          : null,
      missions: {
        key: 'missions',
        to: missionLinkTarget,
        imgLabel: 'tasks',
        label: missionsLabel
      },
      // Chat is always shown, even for chat-banned users: the Chat section is
      // now more than messaging, so a chat ban no longer hides the nav entry.
      chat: {
        key: 'chat',
        to: chatButtonPath,
        imgLabel: 'comments',
        alert: chatAlertShown,
        label: chatLabel
      },
      build: {
        key: 'build',
        to: buildLinkTarget,
        imgLabel: 'rocket-launch',
        label: buildLabel
      }
    };
    // during an account switch the committed order/minimized still belong
    // to the previous scope; render the neutral defaults for those frames
    // (custom entries are already gated below)
    const scopeReady = navScope === userId;
    function resolve(entry: string): NavTabDescriptor | null {
      let descriptor: NavTabDescriptor | null;
      if (isNavTabKey(entry)) {
        descriptor = descriptors[entry];
      } else {
        const customTab = visibleCustomTabs.find(
          (tab) => tab.id === entry && !tab.pinned
        );
        if (customTab) {
          const buildAppId = getBuildAppIdFromTabTarget(customTab.to);
          descriptor = {
            key: customTab.id,
            to: customTab.to,
            imgLabel: customTab.icon,
            exactActive: true,
            label: truncateText({ text: customTab.label, limit: 14 }),
            closable: true,
            buildAppId: buildAppId || undefined,
            audioMuted: buildAppId
              ? mutedBuildAppIds.includes(buildAppId)
              : undefined
          };
        } else {
          descriptor = null;
        }
      }
      if (!descriptor) return null;
      return descriptor.label
        ? {
            ...descriptor,
            minimized:
              isTabletPortrait ||
              (scopeReady
                ? minimizedTabKeys.includes(entry)
                : isDefaultMinimizedNavTabKey(entry))
          }
        : descriptor;
    }
    const primaryTabByKey = new Map(
      getPrimaryNavTabOrder().map((entry) => [entry, resolve(entry)] as const)
    );
    const currentActivePrimaryKey = getPrimaryNavTabOrder().find((entry) => {
      const descriptor = primaryTabByKey.get(entry);
      return Boolean(
        descriptor &&
          navTargetIsActive({
            exactActive: descriptor.exactActive,
            pathname,
            profileUsername: descriptor.profileUsername,
            search,
            to: descriptor.to
          })
      );
    });
    const displayedPrimaryKey =
      currentActivePrimaryKey || lastActivePrimaryKey;
    // Primary tabs have one fixed baseline order. The current (or most
    // recently active) primary moves to the right edge and is the only primary
    // whose label renders on desktop/tablet. Non-primary navigation therefore
    // leaves the primary arrangement intact; mobile uses the same icon order.
    const defaultNavTabs = getPrimaryNavTabOrder(displayedPrimaryKey)
      .map<NavTabDescriptor | null>((entry) => {
        const descriptor = primaryTabByKey.get(entry);
        return descriptor
          ? { ...descriptor, minimized: entry !== displayedPrimaryKey }
          : null;
      })
      .filter((tab): tab is NonNullable<typeof tab> => tab !== null);
    // Extras are automatic MRU rather than manually ordered. The currently
    // open extra is moved left immediately; the remembered sequence keeps the
    // rest in most-recently-opened order. Pinned tabs are a separate section
    // and remain the only custom-orderable tabs.
    const baseExtraNavTabs = [
      'profile',
      'content',
      ...visibleCustomTabs.filter((tab) => !tab.pinned).map((tab) => tab.id)
    ]
      .map<NavTabDescriptor | null>((entry) => resolve(entry))
      .filter((tab): tab is NavTabDescriptor => !!tab);
    const currentActiveExtraTabKey =
      baseExtraNavTabs.find((tab) =>
        navTargetIsActive({
          exactActive: tab.exactActive,
          pathname,
          profileUsername: tab.profileUsername,
          search,
          to: tab.to
        })
      )?.key || null;
    const liveRecentExtraTabKeys = currentActiveExtraTabKey
      ? [
          currentActiveExtraTabKey,
          ...recentExtraTabKeys.filter(
            (key) => key !== currentActiveExtraTabKey
          )
        ]
      : recentExtraTabKeys;
    const baseExtraTabByKey = new Map(
      baseExtraNavTabs.map((tab) => [tab.key, tab] as const)
    );
    const recentExtraNavTabs = liveRecentExtraTabKeys.flatMap((key) => {
      const tab = baseExtraTabByKey.get(key);
      return tab ? [tab] : [];
    });
    const recentExtraKeySet = new Set(
      recentExtraNavTabs.map((tab) => tab.key)
    );
    const extraNavTabs = [
      ...recentExtraNavTabs,
      ...baseExtraNavTabs.filter((tab) => !recentExtraKeySet.has(tab.key))
    ];
    return {
      currentActiveExtraTabKey,
      currentActivePrimaryKey,
      defaultNavTabs,
      extraNavTabs,
      visibleExtraTabKeys: baseExtraNavTabs.map((tab) => tab.key)
    };
  }, [
    minimizedTabKeys,
    buildLinkTarget,
    chatAlertShown,
    chatButtonPath,
    chatMatch,
    desktopContentTab,
    exploreCategory,
    homeNav,
    isTabletPortrait,
    lastActivePrimaryKey,
    managementLevel,
    missionLinkTarget,
    mutedBuildAppIds,
    navScope,
    numNewPosts,
    pathname,
    profileNav,
    profileUsername,
    recentExtraTabKeys,
    search,
    userId,
    usersMatch,
    visibleCustomTabs
  ]);

  useEffect(() => {
    if (!currentActivePrimaryKey) return;
    navMetaRef.current.lastActivePrimaryKey = currentActivePrimaryKey;
    setLastActivePrimaryKey((previousKey) =>
      previousKey === currentActivePrimaryKey
        ? previousKey
        : currentActivePrimaryKey
    );
  }, [currentActivePrimaryKey]);

  useEffect(() => {
    if (navScope !== userId) return;
    const visibleKeySet = new Set(visibleExtraTabKeys);
    const retainedKeys = recentExtraTabKeys.filter((key) =>
      visibleKeySet.has(key)
    );
    const nextKeys = currentActiveExtraTabKey
      ? [
          currentActiveExtraTabKey,
          ...retainedKeys.filter((key) => key !== currentActiveExtraTabKey)
        ]
      : retainedKeys;
    const unchanged =
      nextKeys.length === recentExtraTabKeys.length &&
      nextKeys.every((key, index) => key === recentExtraTabKeys[index]);
    const canonicalKeys = unchanged ? recentExtraTabKeys : nextKeys;
    navMetaRef.current.recentExtraTabKeys = canonicalKeys;
    if (!unchanged) setRecentExtraTabKeys(nextKeys);
  }, [
    currentActiveExtraTabKey,
    navScope,
    recentExtraTabKeys,
    userId,
    visibleExtraTabKeys
  ]);

  const pinnedNavTabs = useMemo(
    () =>
      visibleCustomTabs
        .filter((tab) => tab.pinned)
        .map((tab) => {
          const buildAppId = getBuildAppIdFromTabTarget(tab.to);
          return {
            key: tab.id,
            to: tab.to,
            imgLabel: tab.icon,
            exactActive: true,
            buildAppId: buildAppId || undefined,
            audioMuted: buildAppId
              ? mutedBuildAppIds.includes(buildAppId)
              : undefined,
            // pinned tabs are ALWAYS icon-only; the full label lives in the
            // tab wrapper's title tooltip. They never expand.
            label: tab.label,
            minimized: true
          };
        }),
    [mutedBuildAppIds, visibleCustomTabs]
  );

  useEffect(() => {
    socket.emit('change_busy_status', !chatMatch || isAIChat);
  }, [chatMatch, isAIChat]);

  const contentTabShown =
    !!contentNav && (contentNav !== 'management' || managementLevel > 0);
  // The mobile bar shows ONE custom ("added") tab before the tabs icon. It's
  // the most recently SELECTED added tab, and a PINNED tab
  // is eligible too — a pinned tab is still user-added (unlike the Home/Explore
  // defaults), so selecting one should give it this slot. `lastSelectedAddedTab`
  // remembers which added tab you were last on so it keeps the slot after you
  // navigate to a default page; before any pick it falls back to the most
  // recently added unpinned tab.
  const [lastSelectedAddedTabId, setLastSelectedAddedTabId] = useState<
    string | null
  >(null);
  useEffect(() => {
    const activeKey = `${pathname}${search || ''}`;
    const active = visibleCustomTabs.find((tab) => tab.to === activeKey);
    if (active) setLastSelectedAddedTabId(active.id);
  }, [pathname, search, visibleCustomTabs]);
  const mostRecentAddedTab = useMemo(() => {
    if (!visibleCustomTabs.length) return null;
    const selected = lastSelectedAddedTabId
      ? visibleCustomTabs.find((tab) => tab.id === lastSelectedAddedTabId)
      : null;
    if (selected) return selected;
    const unpinned = visibleCustomTabs.filter((tab) => !tab.pinned);
    return unpinned.length ? unpinned[unpinned.length - 1] : null;
  }, [lastSelectedAddedTabId, visibleCustomTabs]);

  // The mobile dynamic tabs mirror the desktop dedup (see `profileCaptured` and
  // the desktopContentTab effect): once a profile/content page is captured as a
  // custom tab, its dynamic (last-viewed) tab is suppressed so the same page
  // never shows twice in the strip.
  const mobileProfileCaptured = visibleCustomTabs.some(
    (tab) => tab.to === profileNav
  );
  const mobileContentCaptured = visibleCustomTabs.some(
    (tab) => tab.to === `/${contentPath}`
  );
  const mobileProfileDynamicTargetDismissed = isDynamicTabTargetDismissed({
    dismissedKey: dismissedDynamicProfileTabRef.current,
    userId,
    target: profileNav
  });
  const mobileContentDynamicTargetDismissed = isDynamicTabTargetDismissed({
    dismissedKey: dismissedDynamicContentTabRef.current,
    userId,
    target: contentPath ? `/${contentPath}` : null
  });
  const mobileProfileTabShown = Boolean(
    profileNav &&
      !mobileProfileCaptured &&
      !mobileProfileDynamicTargetDismissed
  );
  const mobileContentTabShown = Boolean(
    contentTabShown &&
      !mobileContentCaptured &&
      !mobileContentDynamicTargetDismissed
  );
  const availableMobileExtraTabKeys = [
    ...(mobileProfileTabShown ? ['profile'] : []),
    ...(mobileContentTabShown ? ['content'] : []),
    ...(mostRecentAddedTab ? [mostRecentAddedTab.id] : [])
  ];
  const availableMobileExtraTabKeySet = new Set(
    availableMobileExtraTabKeys
  );
  const mobileExtraTabKeys = extraNavTabs
    .map((tab) => tab.key)
    .filter((key) => availableMobileExtraTabKeySet.has(key));
  for (const key of availableMobileExtraTabKeys) {
    if (!mobileExtraTabKeys.includes(key)) mobileExtraTabKeys.push(key);
  }
  // The tab switcher only lists user-managed tabs. Primary tabs stay visible in
  // the nav but are omitted here because they cannot be modified. The
  // dynamic (last-viewed) profile/content tabs get their own section with
  // explicit Pin/Add/Close actions — a plainly visible version of the
  // long-press popup's (mobile) and right-click menu's (desktop) capabilities,
  // which most users never discover.
  const switcherSections: SwitcherSection[] = useMemo(() => {
    const pinnedItems = visibleCustomTabs
      .filter((tab) => tab.pinned)
      .map((tab) => ({
        key: tab.id,
        to: tab.to,
        icon: tab.icon,
        label: tab.label,
        pinned: true
      }));
    const unpinnedTabById = new Map(
      visibleCustomTabs
        .filter((tab) => !tab.pinned)
        .map((tab) => [tab.id, tab] as const)
    );
    const addedItems = extraNavTabs.flatMap((descriptor) => {
      const tab = unpinnedTabById.get(descriptor.key);
      return tab
        ? [
            {
              key: tab.id,
              to: tab.to,
              icon: tab.icon,
              label: tab.label,
              pinned: false
            }
          ]
        : [];
    });
    const dynamicItems: SwitcherItem[] = [];
    if (mobileProfileTabShown && profileNav) {
      dynamicItems.push({
        key: 'profile',
        to: profileNav,
        icon: 'user',
        label: profileUsername || 'Profile',
        pinned: false
      });
    }
    // The content slot mirrors the surface the switcher was opened from. The
    // desktop strip's slot (desktopContentTab) can retain an older uncovered
    // page while the current page is captured; the mobile bar always tracks
    // the current content page. Building from the wrong source would leave a
    // dynamic tab visible in the desktop strip unmanageable here. The pin/
    // add/close handlers already operate on desktopContentTab, matching this
    // desktop item.
    if (tabSwitcherShownFrom === 'desktop') {
      if (
        desktopContentTab &&
        (desktopContentTab.nav !== 'management' || managementLevel > 0)
      ) {
        const to = `/${desktopContentTab.path}`;
        // pageTitle belongs to the page being viewed; only use it when the
        // dynamic tab actually points at the current page
        const isCurrentPage = to === `${pathname}${search || ''}`;
        dynamicItems.push({
          key: 'content',
          to,
          icon: iconForContentNav(desktopContentTab.nav),
          label: (
            (isCurrentPage && pageTitle) ||
            contentLabels[desktopContentTab.nav] ||
            'Page'
          ).trim(),
          pinned: false
        });
      }
    } else if (mobileContentTabShown && contentPath) {
      const to = `/${contentPath}`;
      // pageTitle belongs to the page being viewed; only use it when the
      // dynamic tab actually points at the current page
      const isCurrentPage = to === `${pathname}${search || ''}`;
      dynamicItems.push({
        key: 'content',
        to,
        icon: contentIconType,
        label: (
          (isCurrentPage && pageTitle) ||
          contentLabels[contentNav] ||
          'Page'
        ).trim(),
        pinned: false
      });
    }
    return [
      { kind: 'pinned', title: 'Pinned', items: pinnedItems },
      ...(dynamicItems.length
        ? [
            {
              kind: 'dynamic' as const,
              title: 'Recently viewed',
              items: dynamicItems
            }
          ]
        : []),
      { kind: 'added', title: 'Added', items: addedItems }
    ];
  }, [
    extraNavTabs,
    visibleCustomTabs,
    mobileProfileTabShown,
    mobileContentTabShown,
    profileNav,
    profileUsername,
    contentPath,
    contentNav,
    contentIconType,
    desktopContentTab,
    managementLevel,
    pageTitle,
    pathname,
    search,
    tabSwitcherShownFrom
  ]);

  return (
    <div
      className={css`
        padding: 0;
        display: flex;
        justify-content: center;
        width: auto;
        @media (min-width: ${desktopMinWidth}) {
          min-width: 0;
          /* shrink-only (no grow): size to the tabs so space-between keeps
             them centered, but give way when crowded so the strip scrolls
             instead of pushing into the account menu */
          flex: 0 1 auto;
          overflow: hidden;
          margin: 0 1rem;
        }
        @media (max-width: ${mobileMaxWidth}) {
          /* fixed hamburger (left) + fixed coins (right) bookend a fixed-width
             scrollable middle strip; space-between centers the strip, and the
             side padding keeps the hamburger/coins off the screen edges */
          width: 100%;
          flex-wrap: nowrap;
          align-items: center;
          justify-content: space-between;
          padding: 0 0.8rem;
        }
      `}
    >
      <MobileSideMenuNav
        alert={numNewNotis > 0 || totalRewardAmount > 0}
        onClick={onMobileMenuOpen}
      />
      {/* Fixed scrollable lane: the nav destinations + the tabs button live in
          a fixed invisible boundary between the hamburger (left) and coins
          (right), which stay pinned outside it. The lane always fills that gap
          (never resizes with icon count); when the icons don't fit they simply
          scroll on the x-axis. */}
      <div
        className={`mobile ${css`
          @media (max-width: ${mobileMaxWidth}) {
            display: flex;
            align-items: center;
            min-width: 0;
            /* fill the fixed gap between the hamburger and coins bookends;
               min-width:0 lets the lane shrink below its content so overflow
               scrolls instead of pushing the coins off-screen. The side margins
               give the hamburger and coins breathing room from the icons (fixed
               gutters that stay put — the scroll happens inside the lane). */
            flex: 1 1 auto;
            margin: 0 0.9rem;
            /* distribute the icons evenly across the fixed lane; when they
               overflow there's no free space to spread, so they pack and the
               lane scrolls on the x-axis */
            justify-content: space-between;
            gap: 0.4rem;
            overflow-x: auto;
            /* Keep this off the iOS async scroll layer. In a fixed bottom bar,
               WebKit can keep that layer intercepting taps after a brief
               horizontal scroll; global mobile scrollers use the same guard. */
            -webkit-overflow-scrolling: auto;
            scrollbar-width: none;
            &::-webkit-scrollbar {
              display: none;
            }
            > * {
              flex-shrink: 0;
            }
          }
        `}`}
      >
        {/* Primary defaults use the fixed baseline order with the active tab
            rotated to the right, shared by every breakpoint. */}
        {defaultNavTabs.map((tab) => renderMobileDefaultNav(tab))}
        {/* Unpinned extras share the desktop/tablet MRU order. The most
            recently opened dynamic, Lumine, or added tab is first. */}
        {mobileExtraTabKeys.map((key) => renderMobileExtraNav(key))}
        <button
          type="button"
          aria-label="Your tabs"
          onClick={() => setTabSwitcherShownFrom('mobile')}
          className={`mobile ${css`
            align-items: center;
            justify-content: center;
            position: relative;
            border: none;
            background: transparent;
            color: ${Color.gray()};
            font-size: 3rem;
            cursor: pointer;
            padding: 0 0.6rem 0 0.4rem;
            .count {
              position: absolute;
              top: -0.4rem;
              right: 0.1rem;
              min-width: 1.7rem;
              height: 1.7rem;
              padding: 0 0.45rem;
              border-radius: 0.85rem;
              background: ${Color.gray()};
              color: #fff;
              font-size: 1rem;
              font-weight: 800;
              display: flex;
              align-items: center;
              justify-content: center;
            }
          `}`}
        >
          <Icon icon="clone" />
          {visibleCustomTabs.length > 0 && (
            <span className="count">{visibleCustomTabs.length}</span>
          )}
        </button>
      </div>
      <TabStrip
        pinnedTabs={pinnedNavTabs}
        defaultTabs={defaultNavTabs}
        tabs={extraNavTabs}
        onMovePinned={handleMovePinnedTab}
        menuItemsForTab={handleGetTabMenuItems}
        showMenuHint={!tabMenuDiscovered}
        onMenuOpen={handleMarkTabMenuDiscovered}
        onCloseTab={handleCloseUnpinnedTab}
        onToggleAudioMuted={handleToggleBuildAppMuted}
        onOpenTabManager={() => setTabSwitcherShownFrom('desktop')}
        isTabletPortrait={isTabletPortrait}
      />
      {userId && (
        <div
          className={`mobile ${css`
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.3rem;
              flex-shrink: 0;
            }
          `}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            paddingRight: '1rem'
          }}
          onClick={onSetBalanceModalShown}
        >
          <Icon style={{ marginRight: '0.5rem' }} icon="coins" />
          {typeof twinkleCoins === 'number' ? (
            displayedTwinkleCoins
          ) : (
            <Icon style={{ marginLeft: '0.7rem' }} icon="spinner" pulse />
          )}
        </div>
      )}
      {pinLimitAlertShown && (
        <AlertModal
          title="Pin limit reached"
          content={`You can pin up to ${MAX_PINNED_TABS} tabs. Unpin one to make space for a new pin.`}
          onHide={() => setPinLimitAlertShown(false)}
        />
      )}
      {tabSwitcherShownFrom && (
        <TabSwitcher
          openedFrom={tabSwitcherShownFrom}
          sections={switcherSections}
          onReorder={handleReorderSection}
          onTogglePin={handleToggleTabPinned}
          onRemove={handleRemoveCustomTab}
          onPinDynamic={handlePinDynamicSwitcherTab}
          onAddDynamic={handleAddDynamicSwitcherTab}
          onDismissDynamic={handleDismissDynamicSwitcherTab}
          onNavigate={() => setTabSwitcherShownFrom(null)}
          onClose={() => setTabSwitcherShownFrom(null)}
        />
      )}
      {longPressMenu && (
        <>
          <div
            className={css`
              position: fixed;
              inset: 0;
              z-index: 100000;
            `}
            onClick={() => setLongPressMenu(null)}
          />
          <div
            className={css`
              position: fixed;
              z-index: 100001;
              transform: translateX(-50%);
              min-width: 16rem;
              background: #fff;
              border: 1px solid ${Color.borderGray()};
              border-radius: 12px;
              box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
              overflow: hidden;
              button {
                display: flex;
                align-items: center;
                gap: 0.9rem;
                width: 100%;
                padding: 1.3rem 1.4rem;
                border: none;
                background: transparent;
                font-size: 1.3rem;
                font-weight: 600;
                color: ${Color.black()};
                cursor: pointer;
                text-align: left;
              }
              button + button {
                border-top: 1px solid ${Color.borderGray()};
              }
              .pin {
                color: ${Color.brownOrange()};
              }
              .danger {
                color: ${Color.rose()};
              }
            `}
            style={{
              left: longPressMenu.x,
              bottom: window.innerHeight - longPressMenu.y + 8
            }}
          >
            {longPressMenu.items.map((item) => (
              <button
                key={item.label}
                type="button"
                className={item.className}
                onClick={() => {
                  item.onClick();
                  setLongPressMenu(null);
                }}
              >
                <Icon icon={item.icon} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  // Mobile-only renderer for a primary tab. Keyed off the descriptor's key
  // (not its desktop label/alert props) so the mobile bar keeps its own alert
  // semantics while following the active-rightmost order.
  function renderMobileDefaultNav(tab: NavTabDescriptor) {
    switch (tab.key) {
      case 'home':
        return (
          <Nav
            key="home"
            to={homeNav}
            isHome
            isUsingChat={!!chatMatch}
            className="mobile"
            imgLabel="home"
            alert={pathname === '/' && (numNewPosts > 0 || feedsOutdated)}
          />
        );
      case 'explore':
        return (
          <Nav
            key="explore"
            to={`/${exploreCategory}`}
            className="mobile"
            imgLabel="search"
          />
        );
      case 'missions':
        return (
          <Nav
            key="missions"
            to={missionLinkTarget}
            className="mobile"
            imgLabel="tasks"
          />
        );
      case 'chat':
        return (
          <Nav
            key="chat"
            to={chatButtonPath}
            className="mobile"
            imgLabel="comments"
            alert={chatAlertShown}
          />
        );
      case 'build':
        return (
          <Nav
            key="build"
            to={buildLinkTarget}
            className="mobile"
            imgLabel="rocket-launch"
          />
        );
      default:
        return null;
    }
  }

  function renderMobileExtraNav(key: string) {
    if (key === 'profile' && mobileProfileTabShown) {
      return (
        <MobileLongPressNav
          key="profile"
          onLongPress={(rect) =>
            setLongPressMenu({
              x: rect.left + rect.width / 2,
              y: rect.top,
              items: [
                {
                  icon: ['far', 'thumbtack'],
                  label: 'Pin this page',
                  className: 'pin',
                  onClick: () => handleCaptureProfileTab(true)
                },
                {
                  icon: 'plus',
                  label: 'Add as tab',
                  onClick: () => handleCaptureProfileTab(false)
                },
                {
                  icon: 'trash-alt',
                  label: 'Close tab',
                  className: 'danger',
                  onClick: handleCloseDynamicProfileTab
                }
              ]
            })
          }
        >
          <Nav to={profileNav} className="mobile" imgLabel="user" />
        </MobileLongPressNav>
      );
    }
    if (key === 'content' && mobileContentTabShown) {
      return (
        <MobileLongPressNav
          key="content"
          onLongPress={(rect) =>
            setLongPressMenu({
              x: rect.left + rect.width / 2,
              y: rect.top,
              items: [
                {
                  icon: ['far', 'thumbtack'],
                  label: 'Pin this page',
                  className: 'pin',
                  onClick: () => handleCaptureContentTab(true)
                },
                {
                  icon: 'plus',
                  label: 'Add as tab',
                  onClick: () => handleCaptureContentTab(false)
                },
                {
                  icon: 'trash-alt',
                  label: 'Close tab',
                  className: 'danger',
                  onClick: handleCloseDynamicContentTab
                }
              ]
            })
          }
        >
          <Nav
            to={`/${contentPath}`}
            className="mobile"
            imgLabel={contentIconType}
          />
        </MobileLongPressNav>
      );
    }
    const addedTab = mostRecentAddedTab;
    if (addedTab?.id === key) {
      return (
        <MobileLongPressNav
          key={addedTab.id}
          onLongPress={(rect) =>
            setLongPressMenu({
              x: rect.left + rect.width / 2,
              y: rect.top,
              items: [
                {
                  icon: addedTab.pinned ? 'thumbtack' : ['far', 'thumbtack'],
                  label: addedTab.pinned
                    ? 'Unpin this tab'
                    : 'Pin this tab',
                  className: 'pin',
                  onClick: () => handleToggleTabPinned(addedTab.id)
                },
                {
                  icon: 'trash-alt',
                  label: 'Close tab',
                  className: 'danger',
                  onClick: () => handleRemoveCustomTab(addedTab.id)
                }
              ]
            })
          }
        >
          <div style={{ display: 'flex' }}>
            <Nav
              to={addedTab.to}
              className="mobile"
              imgLabel={addedTab.icon || 'clone'}
              exactActive
            />
          </div>
        </MobileLongPressNav>
      );
    }
    return null;
  }

  function rememberExtraTabOpened(key: string) {
    const previousKeys = navMetaRef.current.recentExtraTabKeys;
    const nextKeys = [key, ...previousKeys.filter((entry) => entry !== key)];
    const unchanged =
      nextKeys.length === previousKeys.length &&
      nextKeys.every((entry, index) => entry === previousKeys[index]);
    if (unchanged) return;
    navMetaRef.current.recentExtraTabKeys = nextKeys;
    setRecentExtraTabKeys(nextKeys);
  }

  function handleMovePinnedTab({
    sourceKey,
    targetKey
  }: {
    sourceKey: string;
    targetKey: string;
  }) {
    const base = getNavEditBase();
    const visiblePinned = base.customTabs.filter(
      (tab) =>
        tab.pinned &&
        isCustomTabVisibleForNavScope({
          tab,
          navScope,
          userId,
          managementLevel
        })
    );
    const fromIndex = visiblePinned.findIndex((tab) => tab.id === sourceKey);
    const toIndex = visiblePinned.findIndex((tab) => tab.id === targetKey);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;
    handleReorderSection('pinned', fromIndex, toIndex);
  }

  // Pinned tabs are the only manually reorderable section.
  function handleReorderSection(
    kind: SwitcherKind,
    fromIndex: number,
    toIndex: number
  ) {
    if (kind !== 'pinned') return;
    if (fromIndex === toIndex) return;
    if (userId && !navServerReadyRef.current) return;
    const base = getNavEditBase();
    function isVisibleCustomTab(tab: CustomNavTab) {
      return isCustomTabVisibleForNavScope({
        tab,
        navScope,
        userId,
        managementLevel
      });
    }
    const visiblePinned = base.customTabs.filter(
      (tab) => tab.pinned && isVisibleCustomTab(tab)
    );
    if (fromIndex >= visiblePinned.length || toIndex >= visiblePinned.length) {
      return;
    }
    const [moved] = visiblePinned.splice(fromIndex, 1);
    visiblePinned.splice(toIndex, 0, moved);
    const visiblePinnedIds = new Set(visiblePinned.map((tab) => tab.id));
    let pinnedIndex = 0;
    const nextCustomTabs = base.customTabs.map((tab) => {
      if (!tab.pinned || !visiblePinnedIds.has(tab.id)) return tab;
      const replacement = visiblePinned[pinnedIndex];
      pinnedIndex += 1;
      return replacement || tab;
    });
    persistNavState({ custom: nextCustomTabs });
  }

  function handleToggleBuildAppMuted(buildAppId: string) {
    onToggleBuildAppMuted(buildAppId);
  }

  function applyLocalNavState({
    order,
    custom,
    minimized
  }: {
    order: string[];
    custom: CustomNavTab[];
    minimized: string[];
  }) {
    setTabOrder(order);
    setCustomTabs(custom);
    setMinimizedTabKeys(minimized);
    saveNavTabOrder(order, userId);
    saveCustomNavTabs(custom, userId);
    saveMinimizedNavTabKeys(minimized, userId);
  }

  function getNavEditBase(): NavDraftState {
    const draft = navMetaRef.current.draft;
    return draft
      ? {
          order: draft.order,
          customTabs: draft.customTabs,
          minimized: draft.minimized,
          menuDiscovered: draft.menuDiscovered
        }
      : {
          order: tabOrder,
          customTabs,
          minimized: minimizedTabKeys,
          menuDiscovered: tabMenuDiscovered
        };
  }

  // single write-through point: guest state commits locally; logged-in
  // state is server-owned and commits only from the canonical response.
  function persistNavState({
    order,
    custom,
    minimized,
    menuDiscovered
  }: {
    order?: string[];
    custom?: CustomNavTab[];
    minimized?: string[];
    menuDiscovered?: boolean;
  }) {
    if (userId && !navServerReadyRef.current) return;
    const base = getNavEditBase();
    const nextOrder = order ?? base.order;
    const nextCustomTabs = custom ?? base.customTabs;
    const nextMinimized = minimized ?? base.minimized;
    const nextMenuDiscovered = menuDiscovered ?? base.menuDiscovered;
    navMetaRef.current.customized = true;
    if (order && JSON.stringify(nextOrder) !== JSON.stringify(base.order)) {
      navMetaRef.current.dirtyFields.order = true;
    }
    if (
      custom &&
      JSON.stringify(nextCustomTabs) !== JSON.stringify(base.customTabs)
    ) {
      navMetaRef.current.dirtyFields.custom = true;
    }
    if (
      minimized &&
      JSON.stringify(nextMinimized) !== JSON.stringify(base.minimized)
    ) {
      navMetaRef.current.dirtyFields.minimized = true;
    }
    if (!userId) {
      applyLocalNavState({
        order: nextOrder,
        custom: nextCustomTabs,
        minimized: nextMinimized
      });
      publishBuildAppNavTabIdsFromCustomTabs(nextCustomTabs);
      return;
    }
    navMetaRef.current.draft = {
      order: nextOrder,
      customTabs: nextCustomTabs,
      minimized: nextMinimized,
      menuDiscovered: nextMenuDiscovered
    };
    publishBuildAppNavTabIdsFromCustomTabs(nextCustomTabs);
    queueNavTabsWrite({
      order: nextOrder,
      pinnedTabs: nextCustomTabs.filter((tab) => tab.pinned),
      minimized: nextMinimized,
      menuDiscovered: nextMenuDiscovered,
      localCustomTabs: nextCustomTabs
    });
  }

  function navWriteSessionMatches({
    enqueuedGen,
    enqueuedToken,
    enqueuedUserId
  }: {
    enqueuedGen: number;
    enqueuedToken: string | null;
    enqueuedUserId: number | string | null | undefined;
  }) {
    if (getNavSessionMeta(enqueuedUserId).sessionGen !== enqueuedGen) {
      return false;
    }
    return tokenTransitionMatchesUser({
      previousToken: enqueuedToken,
      currentToken: readAuthToken(),
      userId: enqueuedUserId
    });
  }

  function queueNavTabsWrite(payload: {
    order: string[];
    pinnedTabs: CustomNavTab[];
    minimized: string[];
    menuDiscovered: boolean;
    localCustomTabs?: CustomNavTab[];
  }) {
    if (!userId) return;
    if (!navServerReadyRef.current) {
      // hold until the session's nav state has been seen; each payload is
      // a full snapshot so keeping only the latest is safe
      pendingNavWriteRef.current = payload;
      return;
    }
    const writeMeta = navMetaRef.current;
    const enqueuedGen = writeMeta.sessionGen;
    const enqueuedUserId = userId;
    // the auth token is swapped synchronously at the start of login/logout,
    // before React renders and bumps the generation. Compare token subjects
    // instead of raw token strings so same-user rotations (password changes)
    // do not abandon a valid queued save.
    const enqueuedToken = readAuthToken();
    const seq = ++writeMeta.writeSeq;
    writeMeta.writeQueue = writeMeta.writeQueue
      .then(async () => {
        // the login session may have changed while this write sat in the
        // queue (account switch OR logout/relogin into the same account);
        // a previous session's snapshot must never be sent
        if (
          !navWriteSessionMatches({
            enqueuedGen,
            enqueuedToken,
            enqueuedUserId
          })
        ) {
          return;
        }
        const { localCustomTabs, ...serverPayload } = payload;
        const finalPayload = {
          ...serverPayload,
          orderVersion: NAV_TAB_ORDER_VERSION,
          // discovery is monotonic: a payload built from a stale closure
          // (e.g. the first-ever context menu's item callbacks) must never
          // un-discover the menu
          menuDiscovered: payload.menuDiscovered || tabMenuDiscoveredRef.current
        };
        let data = null;
        try {
          data = await updateNavTabsState(finalPayload);
        } catch {
          // retried below
        }
        if (!data?.navTabs) {
          // one retry — nav preferences don't warrant an offline queue,
          // and logged-in UI/cache stay on the last accepted server state
          await new Promise((resolve) => setTimeout(resolve, 2000));
          if (
            !navWriteSessionMatches({
              enqueuedGen,
              enqueuedToken,
              enqueuedUserId
            })
          ) {
            return;
          }
          try {
            data = await updateNavTabsState(finalPayload);
          } catch {
            // fall through to the warning
          }
        }
        if (!data?.navTabs) {
          if (
            seq === writeMeta.writeSeq &&
            navWriteSessionMatches({
              enqueuedGen,
              enqueuedToken,
              enqueuedUserId
            })
          ) {
            writeMeta.dirtyFields = {
              order: false,
              custom: false,
              minimized: false
            };
            writeMeta.canonicalOrderEdited = false;
            writeMeta.customized = false;
            writeMeta.touchedIds.clear();
            writeMeta.createdIds.clear();
            writeMeta.removedTabs = [];
            writeMeta.minimizedIntents = {};
            writeMeta.draft = null;
            publishBuildAppNavTabIdsFromCustomTabs(customTabsRef.current);
            console.warn(
              'Nav tab sync failed; keeping the last accepted server state'
            );
          }
          return;
        }
        // the response is canonical (the server may have normalized the
        // payload); reconcile it back to the accepted state. Later queued
        // writes will reconcile again when their own canonical response lands
        if (
          // same guard as above: block account/session changes, allow
          // same-user token rotations.
          navWriteSessionMatches({
            enqueuedGen,
            enqueuedToken,
            enqueuedUserId
          })
        ) {
          handleReconcileNavTabs(data.navTabs, {
            localCustomTabs,
            settledLatest: seq === writeMeta.writeSeq
          });
        }
      })
      .catch(() => {});
  }

  function handleReconcileNavTabs(
    canonical: {
      order?: string[];
      orderVersion?: number;
      pinnedTabs?: CustomNavTab[];
      minimized?: string[];
      menuDiscovered?: boolean;
    },
    {
      localCustomTabs = customTabsRef.current,
      settledLatest = true
    }: {
      localCustomTabs?: CustomNavTab[];
      settledLatest?: boolean;
    } = {}
  ) {
    // this runs from the async write queue: commit only what the server
    // accepted, while preserving session-only extracted tabs that never
    // round-trip through the server's pinnedTabs list
    const currentCustomTabs = customTabsRef.current;
    const serverCustomTabs = sanitizeCustomNavTabs(canonical.pinnedTabs);
    // accepted pins are no longer local-only (see the adoption effect)
    for (const tab of serverCustomTabs) {
      navMetaRef.current.createdIds.delete(tab.id);
    }
    // session-only extracted tabs never round-trip through the server
    const extracted = sanitizeCustomNavTabs(localCustomTabs).filter(
      (tab) => !tab.pinned
    );
    const nextCustomTabs = [
      ...serverCustomTabs,
      ...extracted.filter(
        (tab) => !serverCustomTabs.some((server) => server.id === tab.id)
      )
    ];
    const nextOrder = sanitizeNavTabOrder(canonical.order, nextCustomTabs);
    const nextMinimized = sanitizeMinimizedNavTabKeys(
      canonical.minimized,
      nextCustomTabs
    );
    if (JSON.stringify(nextCustomTabs) !== JSON.stringify(currentCustomTabs)) {
      setCustomTabs(nextCustomTabs);
    }
    if (JSON.stringify(nextOrder) !== JSON.stringify(tabOrderRef.current)) {
      setTabOrder(nextOrder);
    }
    if (
      JSON.stringify(nextMinimized) !==
      JSON.stringify(minimizedTabKeysRef.current)
    ) {
      setMinimizedTabKeys(nextMinimized);
    }
    // session intents the server has now ACKNOWLEDGED are retired — flags
    // must not outlive their realization, or later changes from other
    // devices (arriving via a same-session relogin) get overridden by
    // stale intents for the rest of the page session. Same class as the
    // createdIds pruning above. Done ONLY here: reconcile's canonical is
    // fresh from the write, while adoption consumes context snapshots
    // that can be stale and would retire intents prematurely
    if (settledLatest) {
      const ackMeta = navMetaRef.current;
      ackMeta.removedTabs = ackMeta.removedTabs.filter((removed) =>
        serverCustomTabs.some(
          (server) => server.id === removed.id || server.to === removed.to
        )
      );
      for (const key of Object.keys(ackMeta.minimizedIntents)) {
        if (nextMinimized.includes(key) === ackMeta.minimizedIntents[key]) {
          delete ackMeta.minimizedIntents[key];
        }
      }
      for (const id of [...ackMeta.touchedIds]) {
        const local = nextCustomTabs.find((tab) => tab.id === id);
        const server = serverCustomTabs.find((tab) => tab.id === id);
        if (local && server && local.pinned === server.pinned) {
          ackMeta.touchedIds.delete(id);
        }
      }
      // seq-guarded: this reconcile is the settled latest write, so local
      // state now equals canonical (+ session-only extracted tabs)
      ackMeta.dirtyFields = { order: false, custom: false, minimized: false };
      ackMeta.canonicalOrderEdited = false;
      ackMeta.customized =
        ackMeta.removedTabs.length > 0 ||
        ackMeta.touchedIds.size > 0 ||
        ackMeta.createdIds.size > 0 ||
        Object.keys(ackMeta.minimizedIntents).length > 0;
      ackMeta.draft = null;
    }
    // the cache must mirror what the server actually accepted
    saveCustomNavTabs(nextCustomTabs, userId);
    saveNavTabOrder(nextOrder, userId);
    saveMinimizedNavTabKeys(nextMinimized, userId);
    publishBuildAppNavTabIdsFromCustomTabs(nextCustomTabs);
    // keep the context copy canonical too: a header remount (e.g. after
    // visiting /app/:id) re-adopts from myState.state.navTabs, and a
    // session-start snapshot there would revert everything saved since.
    // Recording the snapshot in the content guard first keeps our own
    // dispatch from re-triggering adoption (adopt -> flush -> reconcile
    // would otherwise loop)
    lastAdoptedNavTabsRef.current = JSON.stringify(canonical);
    onUpdateNavTabsState(canonical);
  }

  function handleMarkTabMenuDiscovered() {
    const base = getNavEditBase();
    if (base.menuDiscovered) return;
    if (userId && !navServerReadyRef.current) return;
    if (!userId) {
      setTabMenuDiscovered(true);
      saveTabMenuDiscovered(userId);
      return;
    }
    persistNavState({ menuDiscovered: true });
  }

  function getRenderedTab(key: string) {
    return (
      pinnedNavTabs.find((tab) => tab.key === key) ||
      defaultNavTabs.find((tab) => tab.key === key) ||
      extraNavTabs.find((tab) => tab.key === key) ||
      null
    );
  }

  function tabSupportsLabelControl(key: string) {
    const renderedTab = getRenderedTab(key);
    const customTab = customTabsRef.current.find((tab) => tab.id === key);
    return Boolean(
      renderedTab &&
        !isTabletPortrait &&
        !isSacredDefaultKey(key) &&
        renderedTab.label &&
        !customTab?.pinned
    );
  }

  function handleGetTabMenuItems(key: string): TabMenuItem[] | null {
    const renderedTab = getRenderedTab(key);
    if (!renderedTab || isSacredDefaultKey(key)) return null;
    const customTab = customTabs.find((tab) => tab.id === key);
    const labelControlItems: TabMenuItem[] =
      !tabSupportsLabelControl(key)
        ? []
        : [
            renderedTab.minimized
              ? {
                  label: 'Expand',
                  icon: 'expand',
                  onClick: () => handleToggleTabMinimized(key)
                }
              : {
                  label: 'Minimize',
                  icon: 'compress',
                  onClick: () => handleToggleTabMinimized(key)
                }
          ];
    if (key === 'content') {
      return [
        {
          label: 'Pin this page',
          icon: ['far', 'thumbtack'],
          onClick: () => handleCaptureContentTab(true)
        },
        {
          label: 'Add as tab',
          icon: 'plus',
          onClick: () => handleCaptureContentTab(false)
        },
        ...labelControlItems,
        {
          label: 'Close tab',
          icon: 'trash-alt',
          onClick: () => handleCloseUnpinnedTab('content')
        }
      ];
    }
    // the profile tab is dynamic like the content tab — same capture options
    if (key === 'profile') {
      return [
        {
          label: 'Pin this page',
          icon: ['far', 'thumbtack'],
          onClick: () => handleCaptureProfileTab(true)
        },
        {
          label: 'Add as tab',
          icon: 'plus',
          onClick: () => handleCaptureProfileTab(false)
        },
        ...labelControlItems,
        {
          label: 'Close tab',
          icon: 'trash-alt',
          onClick: () => handleCloseUnpinnedTab('profile')
        }
      ];
    }
    if (customTab) {
      // pinned tabs are always icon-only — no Minimize/Expand for them
      return customTab.pinned
        ? [
            {
              label: 'Unpin',
              icon: 'thumbtack',
              onClick: () => handleToggleTabPinned(key)
            },
            {
              label: 'Close tab',
              icon: 'trash-alt',
              onClick: () => handleRemoveCustomTab(key)
            }
          ]
        : [
            {
              label: 'Pin',
              icon: ['far', 'thumbtack'],
              onClick: () => handleToggleTabPinned(key)
            },
            ...labelControlItems,
            {
              label: 'Close tab',
              icon: 'trash-alt',
              onClick: () => handleCloseUnpinnedTab(key)
            }
          ];
    }
    // Any other rendered built-in can only expose a meaningful label control.
    return isNavTabKey(key) && labelControlItems.length > 0
      ? labelControlItems
      : null;
  }

  function handleCloseUnpinnedTab(key: string) {
    if (key === 'content') {
      handleCloseDynamicContentTab();
      return;
    }
    if (key === 'profile') {
      handleCloseDynamicProfileTab();
      return;
    }
    const tab = customTabsRef.current.find((item) => item.id === key);
    if (!tab || tab.pinned) return;
    handleRemoveCustomTab(key);
  }

  function handleToggleTabMinimized(key: string) {
    if (!tabSupportsLabelControl(key)) return;
    if (userId && !navServerReadyRef.current) return;
    const base = getNavEditBase();
    const nowMinimized = !base.minimized.includes(key);
    navMetaRef.current.minimizedIntents[key] = nowMinimized;
    const next = nowMinimized
      ? [...base.minimized, key]
      : base.minimized.filter((k) => k !== key);
    persistNavState({ minimized: next });
  }

  // Create a custom tab for a specific page (content, profile, build app,
  // workspace...). Build app tabs are one per build id; other tabs de-dupe by
  // `to`, so re-capturing the same page is a no-op.
  function handleCaptureTab({
    to,
    icon,
    label,
    pinned
  }: {
    to: string;
    icon: string;
    label: string;
    pinned: boolean;
  }) {
    if (userId && !navServerReadyRef.current) return;
    if (!to) return;
    const base = getNavEditBase();
    const normalizedLabel = (label || 'Page').trim();
    const buildAppId = getBuildAppIdFromTabTarget(to);
    if (buildAppId) {
      const existingBuildAppTab = base.customTabs.find(
        (tab) => getBuildAppIdFromTabTarget(tab.to) === buildAppId
      );
      if (existingBuildAppTab) {
        if (
          existingBuildAppTab.to === to &&
          existingBuildAppTab.icon === icon &&
          existingBuildAppTab.label === normalizedLabel
        ) {
          return;
        }
        navMetaRef.current.touchedIds.add(existingBuildAppTab.id);
        const nextCustomTabs = base.customTabs.map((tab) =>
          tab.id === existingBuildAppTab.id
            ? {
                ...tab,
                to,
                icon,
                label: normalizedLabel
              }
            : tab
        );
        persistNavState({ custom: nextCustomTabs });
        return;
      }
    }
    if (base.customTabs.some((tab) => tab.to === to)) return;
    if (
      pinned &&
      base.customTabs.filter((tab) => tab.pinned).length >= MAX_PINNED_TABS
    ) {
      setPinLimitAlertShown(true);
      return;
    }
    const newTab: CustomNavTab = {
      id: `custom-${Date.now()}`,
      to,
      icon,
      label: normalizedLabel,
      pinned
    };
    navMetaRef.current.touchedIds.add(newTab.id);
    navMetaRef.current.createdIds.add(newTab.id);
    const nextCustomTabs = [...base.customTabs, newTab];
    let nextMinimized = base.minimized;
    let nextOrder = base.order;
    if (pinned) {
      // pinned tabs start icon-only (Chrome-style); expandable via the menu
      navMetaRef.current.minimizedIntents[newTab.id] = true;
      nextMinimized = [...base.minimized, newTab.id];
    } else {
      // `order` retains membership for sync/reconciliation. Visible unpinned
      // order is route-derived MRU, so the newly opened tab renders leftmost.
      nextOrder = [
        ...base.order.filter((entry) => entry !== newTab.id),
        newTab.id
      ];
    }
    persistNavState({
      order: nextOrder,
      custom: nextCustomTabs,
      minimized: nextMinimized
    });
  }

  function handleCaptureContentTab(pinned: boolean) {
    if (!desktopContentTab) return;
    const to = `/${desktopContentTab.path}`;
    // pageTitle belongs to the page being viewed; only use it when the
    // dynamic tab actually points at the current page
    const isCurrentPage = to === `${pathname}${search || ''}`;
    const fallbackLabel = contentLabels[desktopContentTab.nav] || 'Page';
    handleCaptureTab({
      to,
      icon: iconForContentNav(desktopContentTab.nav),
      label: ((isCurrentPage && pageTitle) || fallbackLabel).trim(),
      pinned
    });
  }

  function handleCaptureProfileTab(pinned: boolean) {
    if (!profileNav) return;
    handleCaptureTab({
      to: profileNav,
      icon: 'user',
      label: profileUsername || 'Profile',
      pinned
    });
  }

  // The tab switcher's dynamic-section actions mirror the long-press popup on
  // the bottom-nav dynamic icons; `key` is 'profile' or 'content'.
  function handlePinDynamicSwitcherTab(key: string) {
    if (key === 'profile') handleCaptureProfileTab(true);
    else handleCaptureContentTab(true);
  }

  function handleAddDynamicSwitcherTab(key: string) {
    if (key === 'profile') handleCaptureProfileTab(false);
    else handleCaptureContentTab(false);
  }

  function handleDismissDynamicSwitcherTab(key: string) {
    if (key === 'profile') handleCloseDynamicProfileTab();
    else handleCloseDynamicContentTab();
  }

  function handleCloseDynamicContentTab() {
    if (desktopContentTab) {
      dismissedDynamicContentTabRef.current = getDynamicTabDismissalKey(
        userId,
        `/${desktopContentTab.path}`
      );
    }
    setDesktopContentTab(null);
    onSetContentNav('');
    onSetContentPath('');
  }

  function handleCloseDynamicProfileTab() {
    if (profileNav) {
      dismissedDynamicProfileTabRef.current = getDynamicTabDismissalKey(
        userId,
        profileNav
      );
    }
    onSetProfileNav('');
  }

  function handleToggleTabPinned(id: string) {
    if (userId && !navServerReadyRef.current) return;
    const base = getNavEditBase();
    const target = base.customTabs.find((tab) => tab.id === id);
    if (!target) return;
    const nextPinned = !target.pinned;
    if (
      nextPinned &&
      base.customTabs.filter((tab) => tab.pinned).length >= MAX_PINNED_TABS
    ) {
      setPinLimitAlertShown(true);
      return;
    }
    navMetaRef.current.touchedIds.add(id);
    const nextCustomTabs = base.customTabs.map((tab) =>
      tab.id === id ? { ...tab, pinned: nextPinned } : tab
    );
    const nextOrder = nextPinned
      ? base.order.filter((entry) => entry !== id)
      : [id, ...base.order.filter((entry) => entry !== id)];
    // pinning defaults to icon-only; unpinning restores the label
    navMetaRef.current.minimizedIntents[id] = nextPinned;
    const nextMinimized = nextPinned
      ? base.minimized.includes(id)
        ? base.minimized
        : [...base.minimized, id]
      : base.minimized.includes(id)
        ? base.minimized.filter((key) => key !== id)
        : base.minimized;
    persistNavState({
      order: nextOrder,
      custom: nextCustomTabs,
      minimized: nextMinimized
    });
  }

  function handleRemoveCustomTab(id: string) {
    if (userId && !navServerReadyRef.current) return;
    const base = getNavEditBase();
    const removedTab = base.customTabs.find((tab) => tab.id === id);
    if (removedTab) {
      dismissDynamicReplacementForRemovedTab(removedTab);
      navMetaRef.current.removedTabs.push({
        id: removedTab.id,
        to: removedTab.to,
        sessionCreated: navMetaRef.current.createdIds.has(removedTab.id)
      });
      const buildAppId = getBuildAppIdFromTabTarget(removedTab.to);
      if (
        openBuildTab &&
        (openBuildTab.to === removedTab.to ||
          (buildAppId &&
            getBuildAppIdFromTabTarget(openBuildTab.to) === buildAppId))
      ) {
        onSetOpenBuildTab(null);
      }
      if (buildAppId) {
        onSetBuildAppMuted(buildAppId, false);
        // closing a build app's tab tears down its running keep-alive session
        onKillBuildAppSession(buildAppId);
      }
    }
    delete navMetaRef.current.minimizedIntents[id];
    navMetaRef.current.touchedIds.delete(id);
    const nextCustomTabs = base.customTabs.filter((tab) => tab.id !== id);
    // keep the same reference when nothing actually changes so the
    // per-field dirty tracking in persistNavState stays accurate
    const nextOrder = base.order.includes(id)
      ? base.order.filter((entry) => entry !== id)
      : base.order;
    const nextMinimized = base.minimized.includes(id)
      ? base.minimized.filter((key) => key !== id)
      : base.minimized;
    persistNavState({
      order: nextOrder,
      custom: nextCustomTabs,
      minimized: nextMinimized
    });
  }

  function dismissDynamicReplacementForRemovedTab(removedTab: CustomNavTab) {
    const currentLocation = `${pathname}${search || ''}`;
    const { section } = getSectionFromPathname(pathname);
    const isCurrentContentTarget =
      removedTab.to === currentLocation &&
      (contentPageMatch || (section === 'management' && managementLevel > 0));
    if (isCurrentContentTarget) {
      dismissedDynamicContentTabRef.current = getDynamicTabDismissalKey(
        userId,
        currentLocation
      );
      setDesktopContentTab((currentTab) =>
        currentTab && `/${currentTab.path}` === currentLocation
          ? null
          : currentTab
      );
    }

    if (profilePageMatch && removedTab.to === pathname) {
      dismissedDynamicProfileTabRef.current = getDynamicTabDismissalKey(
        userId,
        pathname
      );
    }
  }

  // Close a running build app by its build id: find its tab and remove it
  // (which also fires the session kill via handleRemoveCustomTab). Invoked when
  // the build runtime's "Close app" button posts a buildAppToClose request.
  function handleCloseBuildAppTab(buildId: string) {
    const normalizedId = String(buildId || '').trim();
    if (!normalizedId) return true;
    if (userId && !navServerReadyRef.current) return false;
    const base = getNavEditBase();
    const target = base.customTabs.find(
      (tab) => getBuildAppIdFromTabTarget(tab.to) === normalizedId
    );
    if (!target) return true;
    handleRemoveCustomTab(target.id);
    return true;
  }
}
