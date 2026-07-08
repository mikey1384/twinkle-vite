import React, { useEffect, useMemo, useRef, useState } from 'react';
import Nav from './Nav';
import TabStrip, {
  type NavTabDescriptor,
  type TabMenuItem
} from './TabStrip';
import MobileSideMenuNav from './MobileSideMenuNav';
import Icon from '~/components/Icon';
import { matchPath } from 'react-router-dom';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import {
  getNavSessionMeta,
  isNavTabKey,
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
import { getSectionFromPathname, isTablet } from '~/helpers';
import {
  AI_CARD_CHAT_TYPE,
  GENERAL_CHAT_PATH_ID,
  VOCAB_CHAT_TYPE
} from '~/constants/defaultValues';
import { truncateText } from '~/helpers/stringHelpers';
import {
  useAppContext,
  useChatContext,
  useHomeContext,
  useViewContext,
  useKeyContext
} from '~/contexts';
import { socket } from '~/constants/sockets/api';
import { isBuildListPath } from '~/containers/Build/List/helpers/url';

const deviceIsTablet = isTablet(navigator);
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
  const banned = useKeyContext((v) => v.myState.banned);
  const lastChatPath = useKeyContext((v) => v.myState.lastChatPath);
  const userLoaded = useAppContext((v) => v.user.state.loaded);
  const exploreCategory = useViewContext((v) => v.state.exploreCategory);
  const contentPath = useViewContext((v) => v.state.contentPath);
  const contentNav = useViewContext((v) => v.state.contentNav);
  const missionNav = useViewContext((v) => v.state.missionNav);
  const buildNav = useViewContext((v) => v.state.buildNav);
  const profileNav = useViewContext((v) => v.state.profileNav);
  const homeNav = useViewContext((v) => v.state.homeNav);
  const pageTitle = useViewContext((v) => v.state.pageTitle);
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
  const onSetBuildNav = useViewContext((v) => v.actions.onSetBuildNav);
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
  const isBuildSection = useMemo(
    () => pathname.startsWith('/build'),
    [pathname]
  );
  const missionLinkTarget = useMemo(
    () => (isMissionSection ? '/missions' : missionNav || '/missions'),
    [isMissionSection, missionNav]
  );
  // On a build list page the target must equal the current canonical URL:
  // bare /build immediately replace-redirects to a tab path, so Nav's exact
  // same-location check (which triggers the scroll-to-top) never matches it.
  const buildLinkTarget = useMemo(() => {
    if (!isBuildSection) return buildNav || '/build';
    return isBuildListPath(pathname, { loggedIn: !!userId })
      ? `${pathname}${search || ''}`
      : '/build';
  }, [isBuildSection, buildNav, pathname, search, userId]);


  const displayedTwinkleCoins = useMemo(() => {
    if (twinkleCoins > 999) {
      if (twinkleCoins > 999999) {
        return `${(twinkleCoins / 1000000).toFixed(1)}M`;
      }
      return `${(twinkleCoins / 1000).toFixed(1)}K`;
    }
    return twinkleCoins;
  }, [twinkleCoins]);

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
    if (section === 'build') {
      const nextBuildNav = `${pathname}${search || ''}`;
      if (buildNav !== nextBuildNav) {
        onSetBuildNav(nextBuildNav);
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

  const orderedTabs = useMemo(() => {
    const homeAlertShown = pathname === '/' && !usersMatch && numNewPosts > 0;
    const descriptors: Record<NavTabKey, NavTabDescriptor | null> = {
      profile: profileNav
        ? {
            key: 'profile',
            to: profileNav,
            imgLabel: 'user',
            profileUsername,
            label: truncateText({
              text: profileUsername.toUpperCase(),
              limit: 7
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
        label: `${deviceIsTablet ? '' : homeLabel}${
          homeAlertShown ? ` (${numNewPosts})` : ''
        }`
      },
      explore: {
        key: 'explore',
        to: `/${exploreCategory}`,
        imgLabel: 'search',
        label: deviceIsTablet ? '' : exploreLabel
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
              label: deviceIsTablet
                ? ''
                : contentLabels[desktopContentTab.nav] || null
            }
          : null,
      missions: {
        key: 'missions',
        to: missionLinkTarget,
        imgLabel: 'tasks',
        label: deviceIsTablet ? '' : missionsLabel
      },
      chat: banned?.chat
        ? null
        : {
            key: 'chat',
            to: chatButtonPath,
            imgLabel: 'comments',
            alert: chatAlertShown,
            label: deviceIsTablet ? '' : chatLabel
          },
      build: {
        key: 'build',
        to: buildLinkTarget,
        imgLabel: 'rocket-launch',
        label: deviceIsTablet ? '' : buildLabel
      }
    };
    // during an account switch the committed order/minimized still belong
    // to the previous scope; render the neutral defaults for those frames
    // (custom entries are already gated below)
    const scopeReady = navScope === userId;
    return (scopeReady ? tabOrder : [...NAV_TAB_KEYS])
      .map((entry: string) => {
        let descriptor: NavTabDescriptor | null;
        if (isNavTabKey(entry)) {
          descriptor = descriptors[entry];
        } else {
          const customTab =
            // during an account switch the committed customTabs still
            // belong to the previous scope — never paint another
            // account's tab labels on a shared device
            navScope === userId
              ? customTabs.find((tab) => tab.id === entry && !tab.pinned)
              : undefined;
          // captured management pages follow the same access gate as the
          // built-in management tab (kept in storage: access may return)
          descriptor =
            customTab &&
            !(customTab.to.startsWith('/management') && managementLevel <= 0)
            ? {
                key: customTab.id,
                to: customTab.to,
                imgLabel: customTab.icon,
                exactActive: true,
                label: truncateText({ text: customTab.label, limit: 14 })
              }
            : null;
        }
        if (!descriptor) return null;
        return descriptor.label
          ? {
              ...descriptor,
              minimized: scopeReady && minimizedTabKeys.includes(entry)
            }
          : descriptor;
      })
      .filter((tab): tab is NavTabDescriptor => !!tab);
  }, [
    minimizedTabKeys,
    banned?.chat,
    buildLinkTarget,
    chatAlertShown,
    chatButtonPath,
    chatMatch,
    customTabs,
    desktopContentTab,
    exploreCategory,
    homeNav,
    managementLevel,
    missionLinkTarget,
    navScope,
    numNewPosts,
    pathname,
    profileNav,
    profileUsername,
    tabOrder,
    userId,
    usersMatch
  ]);

  const pinnedNavTabs = useMemo(
    () =>
      // scope gate: see the custom-tab branch in orderedTabs
      navScope !== userId
        ? []
        : customTabs
            .filter(
              (tab) =>
                tab.pinned &&
                !(tab.to.startsWith('/management') && managementLevel <= 0)
            )
            .map((tab) => ({
              key: tab.id,
              to: tab.to,
              imgLabel: tab.icon,
              exactActive: true,
              label: minimizedTabKeys.includes(tab.id)
                ? tab.label
                : truncateText({ text: tab.label, limit: 14 }),
              minimized: minimizedTabKeys.includes(tab.id)
            })),
    [customTabs, managementLevel, minimizedTabKeys, navScope, userId]
  );

  useEffect(() => {
    socket.emit('change_busy_status', !chatMatch || isAIChat);
  }, [chatMatch, isAIChat]);

  return (
    <div
      className={css`
        padding: 0;
        display: flex;
        justify-content: center;
        width: auto;
        @media (max-width: ${mobileMaxWidth}) {
          width: 100%;
        }
      `}
    >
      <MobileSideMenuNav
        alert={numNewNotis > 0 || totalRewardAmount > 0}
        onClick={onMobileMenuOpen}
      />
      {profileNav && <Nav to={profileNav} className="mobile" imgLabel="user" />}
      <Nav
        to={homeNav}
        isHome
        isUsingChat={!!chatMatch}
        className="mobile"
        imgLabel="home"
        alert={pathname === '/' && (numNewPosts > 0 || feedsOutdated)}
      />
      <Nav to={`/${exploreCategory}`} className="mobile" imgLabel="search" />
      {contentNav && (contentNav !== 'management' || managementLevel > 0) && (
        <Nav
          to={`/${contentPath}`}
          className="mobile"
          imgLabel={contentIconType}
        />
      )}
      <Nav to={missionLinkTarget} className="mobile" imgLabel="tasks" />
      <Nav
        to={chatButtonPath}
        className="mobile"
        imgLabel="comments"
        alert={chatAlertShown}
      />
      <Nav to={buildLinkTarget} className="mobile" imgLabel="rocket-launch" />
      <TabStrip
        pinnedTabs={pinnedNavTabs}
        tabs={orderedTabs}
        onMove={handleMoveTab}
        menuItemsForTab={handleGetTabMenuItems}
        showMenuHint={!tabMenuDiscovered}
        onMenuOpen={handleMarkTabMenuDiscovered}
      />
      {userId && (
        <div
          className={`mobile ${css`
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.3rem;
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
    </div>
  );

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
      return;
    }
    navMetaRef.current.draft = {
      order: nextOrder,
      customTabs: nextCustomTabs,
      minimized: nextMinimized,
      menuDiscovered: nextMenuDiscovered
    };
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
    const minimizeItem: TabMenuItem = {
      label: minimizedTabKeys.includes(key) ? 'Expand' : 'Minimize',
      onClick: () => handleToggleTabMinimized(key)
    };
    if (key === 'content') {
      return [
        {
          label: 'Pin this page',
          onClick: () => handleCaptureContentTab(true)
        },
        { label: 'Add as tab', onClick: () => handleCaptureContentTab(false) },
        minimizeItem
      ];
    }
    const customTab = customTabs.find((tab) => tab.id === key);
    if (customTab) {
      return [
        {
          label: customTab.pinned ? 'Unpin' : 'Pin',
          onClick: () => handleToggleTabPinned(key)
        },
        minimizeItem,
        { label: 'Remove', onClick: () => handleRemoveCustomTab(key) }
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

  function handleCaptureContentTab(pinned: boolean) {
    if (userId && !navServerReadyRef.current) return;
    if (!desktopContentTab) return;
    const base = getNavEditBase();
    const to = `/${desktopContentTab.path}`;
    if (base.customTabs.some((tab) => tab.to === to)) return;
    // pageTitle belongs to the page being viewed; only use it when the
    // dynamic tab actually points at the current page
    const isCurrentPage = to === `${pathname}${search || ''}`;
    const fallbackLabel = contentLabels[desktopContentTab.nav] || 'Page';
    const newTab: CustomNavTab = {
      id: `custom-${Date.now()}`,
      to,
      icon: iconForContentNav(desktopContentTab.nav),
      label: ((isCurrentPage && pageTitle) || fallbackLabel).trim(),
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
      // the extracted tab takes the dynamic tab's current slot
      const contentIndex = base.order.indexOf('content');
      nextOrder = [...base.order];
      nextOrder.splice(
        contentIndex < 0 ? nextOrder.length : contentIndex,
        0,
        newTab.id
      );
    }
    persistNavState({
      order: nextOrder,
      custom: nextCustomTabs,
      minimized: nextMinimized
    });
  }

  function handleToggleTabPinned(id: string) {
    if (userId && !navServerReadyRef.current) return;
    const base = getNavEditBase();
    const target = base.customTabs.find((tab) => tab.id === id);
    if (!target) return;
    const nextPinned = !target.pinned;
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
}
