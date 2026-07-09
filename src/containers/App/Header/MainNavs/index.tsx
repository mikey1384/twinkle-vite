import React, { useEffect, useMemo, useRef, useState } from 'react';
import Nav from './Nav';
import TabStrip, {
  type NavTabDescriptor,
  type TabMenuItem
} from './TabStrip';
import MobileSideMenuNav from './MobileSideMenuNav';
import Icon from '~/components/Icon';
import AlertModal from '~/components/Modals/AlertModal';
import useTabletOrientation from '~/helpers/hooks/useTabletOrientation';
import { matchPath } from 'react-router-dom';
import { Color, desktopMinWidth, mobileMaxWidth } from '~/constants/css';
import MobileTabSwitcher, {
  SwitcherSection,
  SwitcherKind
} from './MobileTabSwitcher';
import MobileLongPressNav from './MobileLongPressNav';
import { css } from '@emotion/css';
import {
  getNavSessionMeta,
  isNavTabKey,
  isSacredDefaultKey,
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
  type NavTabKey
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

function getUnpinnedCustomTabsInNavOrder({
  customTabs,
  order
}: {
  customTabs: CustomNavTab[];
  order: string[];
}) {
  const unpinnedById = new Map(
    customTabs.filter((tab) => !tab.pinned).map((tab) => [tab.id, tab])
  );
  const orderedTabs: CustomNavTab[] = [];
  const seenIds = new Set<string>();
  for (const key of order) {
    const tab = unpinnedById.get(key);
    if (!tab || seenIds.has(tab.id)) continue;
    orderedTabs.push(tab);
    seenIds.add(tab.id);
  }
  for (const tab of customTabs) {
    if (tab.pinned || seenIds.has(tab.id)) continue;
    orderedTabs.push(tab);
    seenIds.add(tab.id);
  }
  return orderedTabs;
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
  const [tabSwitcherShown, setTabSwitcherShown] = useState(false);
  // long-press popup on a bottom-nav icon. Dynamic tabs (content/profile) offer
  // pin/add; an already-added tab offers pin + remove (mobile parity with the
  // desktop tab strip's right-click menu).
  const [longPressMenu, setLongPressMenu] = useState<{
    x: number;
    y: number;
    items: {
      icon: string;
      label: string;
      className?: string;
      onClick: () => void;
    }[];
  } | null>(null);
  // iPad landscape shows labelled tabs (desktop-like); portrait goes icon-only
  // to stay light in the narrow bar. Non-tablets are unaffected.
  const { isTabletPortrait } = useTabletOrientation();
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

  useEffect(() => {
    // scope gate (see adoption/readiness effects): during an account
    // switch the closure's customTabs still belong to the previous scope
    if (navScope !== userId) return;
    setDesktopContentTab((prev) => {
      if (
        contentNav &&
        contentPath &&
        !customTabs.some((tab) => tab.to === `/${contentPath}`)
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
    const serverCustomTabIds = new Set(
      serverCustomTabs.map((tab) => tab.id)
    );
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
                !r.sessionCreated &&
                (r.id === server.id || r.to === server.to)
            )
        )
        .map((server) => {
          const localVersion = editBase.customTabs.find(
            (local) => local.id === server.id
          );
          return localVersion && touched.has(server.id)
            ? localVersion
            : server;
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
                  (server) =>
                    server.id === local.id || server.to === local.to
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
      const defaultMinimized: string[] = [];
      if (JSON.stringify(customTabsRef.current) !== '[]') {
        setCustomTabs(defaultCustomTabs);
      }
      if (JSON.stringify(tabOrderRef.current) !== JSON.stringify(defaultOrder)) {
        setTabOrder(defaultOrder);
      }
      if (JSON.stringify(minimizedTabKeysRef.current) !== '[]') {
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
  const onProfilePage = !!profilePageMatch;

  // opening a profile spawns/moves its tab to the FAR RIGHT (same rule as
  // build/content tabs), so it lands after whatever the current rightmost tab
  // is instead of sitting at a fixed leftmost slot
  useEffect(() => {
    if (!onProfilePage) return;
    if (navScope !== userId) return;
    if (userId && !navServerReadyRef.current) return;
    const base = getNavEditBase();
    if (
      !base.order.includes('profile') ||
      base.order[base.order.length - 1] === 'profile'
    ) {
      return;
    }
    persistNavState({
      order: [...base.order.filter((entry) => entry !== 'profile'), 'profile']
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    onProfilePage,
    navScope,
    serverNavTabs,
    sessionStateArrived,
    userId,
    userLoaded
  ]);

  // opening a Lumine app or build workspace spawns a real (session, pinnable)
  // tab for it at the far right. App tabs are de-duped by build id so deep-link
  // route updates move the same session tab instead of creating siblings.
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
    handleCaptureTab({
      to: openBuildTab.to,
      icon: openBuildTab.kind === 'workspace' ? 'wrench' : 'rocket-launch',
      label: openBuildTab.label,
      pinned: false
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    openBuildTab,
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
      if (contentNav !== section) {
        onSetContentNav(section);
      }
      onSetContentPath(pathname.substring(1) + search || '');
    }
    if (section === 'missions') {
      const nextMissionNav = `${pathname}${search || ''}`;
      if (missionNav !== nextMissionNav) {
        onSetMissionNav(nextMissionNav);
      }
    }
    if (section === 'management' && managementLevel > 0) {
      if (contentNav !== 'management') {
        onSetContentNav('management');
      }
      onSetContentPath(pathname.substring(1) + (search || ''));
    } else if (contentNav === 'management' && managementLevel <= 0) {
      onSetContentNav('');
      onSetContentPath('');
    }

    if (profilePageMatch) {
      onSetProfileNav(pathname);
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
  }, [customTabs, defaultSearchFilter, managementLevel, pathname, search]);

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

  const { defaultNavTabs, extraNavTabs } = useMemo(() => {
    const homeAlertShown = pathname === '/' && !usersMatch && numNewPosts > 0;
    // like the dynamic content tab (see the desktopContentTab effect), suppress
    // the dynamic profile tab once its profile is captured/added as a custom
    // tab — otherwise the same profile shows twice (dynamic + captured).
    // Scope/access-gated: during an account switch customTabs still belong to
    // the previous scope, so only visible tabs can suppress dynamic slots.
    const profileCaptured = visibleCustomTabs.some(
      (tab) => tab.to === profileNav
    );
    const descriptors: Record<NavTabKey, NavTabDescriptor | null> = {
      profile:
        profileNav && !profileCaptured
        ? {
            key: 'profile',
            to: profileNav,
            imgLabel: 'user',
            profileUsername,
            // like the content tab, the profile tab is dynamic (reflects the
            // last-viewed profile) until pinned/added — italic label
            kind: 'dynamic' as const,
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
        label: `${isTabletPortrait ? '' : homeLabel}${
          homeAlertShown ? ` (${numNewPosts})` : ''
        }`
      },
      explore: {
        key: 'explore',
        to: `/${exploreCategory}`,
        imgLabel: 'search',
        label: isTabletPortrait ? '' : exploreLabel
      },
      content:
        desktopContentTab &&
        (desktopContentTab.nav !== 'management' || managementLevel > 0)
          ? {
              key: 'content',
              to: `/${desktopContentTab.path}`,
              imgLabel: iconForContentNav(desktopContentTab.nav),
              kind: 'dynamic' as const,
              // the slot always targets one SPECIFIC page; without this,
              // Nav's /management prefix rule lights a stale dynamic tab
              // on every management route alongside a captured one
              exactActive: true,
              label: isTabletPortrait
                ? ''
                : contentLabels[desktopContentTab.nav] || null
            }
          : null,
      missions: {
        key: 'missions',
        to: missionLinkTarget,
        imgLabel: 'tasks',
        label: isTabletPortrait ? '' : missionsLabel
      },
      // Chat is always shown, even for chat-banned users: the Chat section is
      // now more than messaging, so a chat ban no longer hides the nav entry.
      chat: {
        key: 'chat',
        to: chatButtonPath,
        imgLabel: 'comments',
        alert: chatAlertShown,
        label: isTabletPortrait ? '' : chatLabel
      },
      build: {
        key: 'build',
        to: buildLinkTarget,
        imgLabel: 'rocket-launch',
        label: isTabletPortrait ? '' : buildLabel
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
            minimized: scopeReady && minimizedTabKeys.includes(entry)
          }
        : descriptor;
    }
    const orderSource = scopeReady ? tabOrder : [...NAV_TAB_KEYS];
    // Sacred defaults: a contiguous block that pinned/extras can never enter,
    // but reorderable AMONG THEMSELVES — so they follow the saved order,
    // filtered to just the sacred keys.
    const defaultNavTabs = orderSource
      .filter((entry) => isSacredDefaultKey(entry))
      .map((entry) => resolve(entry))
      .filter((tab): tab is NavTabDescriptor => !!tab);
    // Extras (profile, the dynamic content tab, extracted/added tabs) keep the
    // user's saved relative order but always sit to the RIGHT of the defaults;
    // sacred keys are stripped out here so they can never land among extras.
    const extraNavTabs = orderSource
      .filter((entry) => !isSacredDefaultKey(entry))
      .map((entry) => resolve(entry))
      .filter((tab): tab is NavTabDescriptor => !!tab);
    return { defaultNavTabs, extraNavTabs };
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
    managementLevel,
    missionLinkTarget,
    mutedBuildAppIds,
    navScope,
    numNewPosts,
    pathname,
    profileNav,
    profileUsername,
    tabOrder,
    userId,
    usersMatch,
    visibleCustomTabs
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
            // title tooltip (see renderStaticTab). They never expand.
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
  // The mobile bar shows ONE custom ("added") tab in the slot between Build and
  // the tabs icon. It's the most recently SELECTED added tab, and a PINNED tab
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
  // the tab switcher doubles as the mobile reorder UI: three sections
  // (pinned / default / added), each drag-reorderable
  const switcherSections: SwitcherSection[] = useMemo(() => {
    const pinnedItems = visibleCustomTabs
      .filter((tab) => tab.pinned)
      .map((tab) => ({
        key: tab.id,
        to: tab.to,
        icon: tab.icon,
        label: tab.label,
        pinned: true,
        managed: true
      }));
    const addedItems = getUnpinnedCustomTabsInNavOrder({
      customTabs: visibleCustomTabs,
      order: tabOrder
    })
      .map((tab) => ({
        key: tab.id,
        to: tab.to,
        icon: tab.icon,
        label: tab.label,
        pinned: false,
        managed: true
      }));
    const defaultItems = defaultNavTabs.map((tab) => ({
      key: tab.key,
      to: tab.to,
      icon: tab.imgLabel || 'circle',
      label:
        typeof tab.label === 'string' && tab.label.trim()
          ? tab.label
          : tab.key,
      pinned: false,
      managed: false
    }));
    return [
      { kind: 'pinned', title: 'Pinned', items: pinnedItems },
      { kind: 'default', title: 'Default', items: defaultItems },
      { kind: 'added', title: 'Added', items: addedItems }
    ];
  }, [defaultNavTabs, tabOrder, visibleCustomTabs]);

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
            -webkit-overflow-scrolling: touch;
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
        {/* Sacred defaults render in the user's saved order (same source as the
            desktop strip and the mobile switcher's Default section), so a
            reorder there actually moves these icons. */}
        {defaultNavTabs.map((tab) => renderMobileDefaultNav(tab))}
        {/* The dynamic tabs (last-viewed profile + content page) sit to the RIGHT
            of the default block — after the rightmost default (Build by default)
            and before the trailing "added" tab and the windows/tabs button. */}
        {profileNav && !mobileProfileCaptured && (
          <MobileLongPressNav
            onLongPress={(rect) =>
              setLongPressMenu({
                x: rect.left + rect.width / 2,
                y: rect.top,
                items: [
                  {
                    icon: 'thumbtack',
                    label: 'Pin this page',
                    className: 'pin',
                    onClick: () => handleCaptureProfileTab(true)
                  },
                  {
                    icon: 'plus',
                    label: 'Add as tab',
                    onClick: () => handleCaptureProfileTab(false)
                  }
                ]
              })
            }
          >
            <Nav to={profileNav} className="mobile" imgLabel="user" />
          </MobileLongPressNav>
        )}
        {contentTabShown && !mobileContentCaptured && (
          <MobileLongPressNav
            onLongPress={(rect) =>
              setLongPressMenu({
                x: rect.left + rect.width / 2,
                y: rect.top,
                items: [
                  {
                    icon: 'thumbtack',
                    label: 'Pin this page',
                    className: 'pin',
                    onClick: () => handleCaptureContentTab(true)
                  },
                  {
                    icon: 'plus',
                    label: 'Add as tab',
                    onClick: () => handleCaptureContentTab(false)
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
        )}
        {mostRecentAddedTab && (
          <MobileLongPressNav
            onLongPress={(rect) =>
              setLongPressMenu({
                x: rect.left + rect.width / 2,
                y: rect.top,
                items: [
                  {
                    icon: 'thumbtack',
                    label: mostRecentAddedTab.pinned
                      ? 'Unpin this tab'
                      : 'Pin this tab',
                    className: 'pin',
                    onClick: () => handleToggleTabPinned(mostRecentAddedTab.id)
                  },
                  {
                    icon: 'trash-alt',
                    label: 'Close tab',
                    className: 'danger',
                    onClick: () => handleRemoveCustomTab(mostRecentAddedTab.id)
                  }
                ]
              })
            }
          >
            <div style={{ display: 'flex' }}>
              <Nav
                to={mostRecentAddedTab.to}
                className="mobile"
                imgLabel={mostRecentAddedTab.icon || 'clone'}
                exactActive
              />
            </div>
          </MobileLongPressNav>
        )}
        <button
          type="button"
          aria-label="Your tabs"
          onClick={() => setTabSwitcherShown(true)}
          className={`mobile ${css`
            align-items: center;
            justify-content: center;
            position: relative;
            border: none;
            background: transparent;
            color: inherit;
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
              background: ${Color.logoBlue()};
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
        onMove={handleMoveTab}
        menuItemsForTab={handleGetTabMenuItems}
        showMenuHint={!tabMenuDiscovered}
        onMenuOpen={handleMarkTabMenuDiscovered}
        onToggleAudioMuted={handleToggleBuildAppMuted}
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
      {tabSwitcherShown && (
        <MobileTabSwitcher
          sections={switcherSections}
          onReorder={handleReorderSection}
          onTogglePin={handleToggleTabPinned}
          onRemove={handleRemoveCustomTab}
          onNavigate={() => setTabSwitcherShown(false)}
          onClose={() => setTabSwitcherShown(false)}
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

  // Mobile-only renderer for a sacred default tab. Keyed off the descriptor's
  // key (not its desktop label/alert props) so the mobile bar keeps its own
  // alert semantics (e.g. home's feedsOutdated) while honoring the saved order.
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

  function handleMoveTab({
    sourceKey,
    targetKey
  }: {
    sourceKey: string;
    targetKey: string;
  }) {
    if (userId && !navServerReadyRef.current) return;
    const base = getNavEditBase();
    const from = base.order.indexOf(sourceKey);
    const to = base.order.indexOf(targetKey);
    if (from < 0 || to < 0 || from === to) return;
    const next = [...base.order];
    next.splice(from, 1);
    next.splice(to, 0, sourceKey);
    const sessionTabIds = new Set(
      base.customTabs.filter((tab) => !tab.pinned).map((tab) => tab.id)
    );
    const currentCanonicalOrder = base.order.filter(
      (key) => !sessionTabIds.has(key)
    );
    const nextCanonicalOrder = next.filter((key) => !sessionTabIds.has(key));
    if (
      JSON.stringify(currentCanonicalOrder) !==
      JSON.stringify(nextCanonicalOrder)
    ) {
      navMetaRef.current.canonicalOrderEdited = true;
    }
    persistNavState({ order: next });
  }

  // Reorder within one switcher section. Pinned tabs live in customTabs order;
  // defaults + added live in the `order` array (sacred vs non-sacred subsets).
  function handleReorderSection(
    kind: SwitcherKind,
    fromIndex: number,
    toIndex: number
  ) {
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
    if (kind === 'pinned') {
      const visiblePinned = base.customTabs.filter(
        (tab) => tab.pinned && isVisibleCustomTab(tab)
      );
      if (
        fromIndex >= visiblePinned.length ||
        toIndex >= visiblePinned.length
      ) {
        return;
      }
      const [moved] = visiblePinned.splice(fromIndex, 1);
      visiblePinned.splice(toIndex, 0, moved);
      const visiblePinnedIds = new Set(visiblePinned.map((tab) => tab.id));
      let pi = 0;
      const nextCustomTabs = base.customTabs.map((tab) => {
        if (!tab.pinned || !visiblePinnedIds.has(tab.id)) return tab;
        const replacement = visiblePinned[pi];
        pi += 1;
        return replacement || tab;
      });
      persistNavState({ custom: nextCustomTabs });
      return;
    }
    if (kind === 'default') {
      const sacred = base.order.filter((key) => isSacredDefaultKey(key));
      if (fromIndex >= sacred.length || toIndex >= sacred.length) return;
      const [moved] = sacred.splice(fromIndex, 1);
      sacred.splice(toIndex, 0, moved);
      let si = 0;
      const nextOrder = base.order.map((key) =>
        isSacredDefaultKey(key) ? sacred[si++] : key
      );
      navMetaRef.current.canonicalOrderEdited = true;
      persistNavState({ order: nextOrder });
      return;
    }
    // added: reorder the unpinned customTabs AND mirror into the order array's
    // non-sacred custom entries so desktop + mobile stay consistent
    const visibleAdded = getUnpinnedCustomTabsInNavOrder({
      customTabs: base.customTabs.filter(isVisibleCustomTab),
      order: base.order
    });
    if (fromIndex >= visibleAdded.length || toIndex >= visibleAdded.length) {
      return;
    }
    const [moved] = visibleAdded.splice(fromIndex, 1);
    visibleAdded.splice(toIndex, 0, moved);
    const addedIdSet = new Set(visibleAdded.map((tab) => tab.id));
    const orderedAddedIds = visibleAdded.map((tab) => tab.id);
    let ci = 0;
    const nextCustomTabs = base.customTabs.map((tab) => {
      if (tab.pinned || !addedIdSet.has(tab.id)) return tab;
      const replacement = visibleAdded[ci];
      ci += 1;
      return replacement || tab;
    });
    let ai = 0;
    const nextOrder = base.order.map((key) =>
      addedIdSet.has(key) ? orderedAddedIds[ai++] : key
    );
    persistNavState({
      custom: nextCustomTabs,
      order: nextOrder
    });
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
          // discovery is monotonic: a payload built from a stale closure
          // (e.g. the first-ever context menu's item callbacks) must never
          // un-discover the menu
          menuDiscovered:
            payload.menuDiscovered || tabMenuDiscoveredRef.current
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

  function handleGetTabMenuItems(key: string): TabMenuItem[] | null {
    const minimizeItem: TabMenuItem = minimizedTabKeys.includes(key)
      ? {
          label: 'Expand',
          icon: 'expand',
          onClick: () => handleToggleTabMinimized(key)
        }
      : {
          label: 'Minimize',
          icon: 'compress',
          onClick: () => handleToggleTabMinimized(key)
        };
    if (key === 'content') {
      return [
        {
          label: 'Pin this page',
          icon: 'thumbtack',
          onClick: () => handleCaptureContentTab(true)
        },
        {
          label: 'Add as tab',
          icon: 'plus',
          onClick: () => handleCaptureContentTab(false)
        },
        minimizeItem
      ];
    }
    // the profile tab is dynamic like the content tab — same capture options
    if (key === 'profile') {
      return [
        {
          label: 'Pin this page',
          icon: 'thumbtack',
          onClick: () => handleCaptureProfileTab(true)
        },
        {
          label: 'Add as tab',
          icon: 'plus',
          onClick: () => handleCaptureProfileTab(false)
        },
        minimizeItem
      ];
    }
    const customTab = customTabs.find((tab) => tab.id === key);
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
              label: 'Remove',
              icon: 'trash-alt',
              onClick: () => handleRemoveCustomTab(key)
            }
          ]
        : [
            {
              label: 'Pin',
              icon: 'thumbtack',
              onClick: () => handleToggleTabPinned(key)
            },
            minimizeItem,
            {
              label: 'Remove',
              icon: 'trash-alt',
              onClick: () => handleRemoveCustomTab(key)
            }
          ];
    }
    // built-in tabs can be minimized but never removed. Anything else is
    // a custom-tab key that no longer resolves (e.g. adopted away while
    // its menu was open) — no items, so the open menu closes itself
    return isNavTabKey(key) ? [minimizeItem] : null;
  }

  function handleToggleTabMinimized(key: string) {
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
      // spawned tabs always open at the FAR RIGHT — after whatever the current
      // rightmost tab is (consistent rule for content/profile/build tabs)
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

  function handleToggleTabPinned(id: string) {
    if (userId && !navServerReadyRef.current) return;
    const base = getNavEditBase();
    const target = base.customTabs.find((tab) => tab.id === id);
    if (!target) return;
    const nextPinned = !target.pinned;
    if (nextPinned && base.customTabs.filter((tab) => tab.pinned).length >= MAX_PINNED_TABS) {
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
