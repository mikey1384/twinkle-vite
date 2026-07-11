// Keys are stored per-account as `${base}:${userId || 'guest'}` (see
// scopedKey below). There is deliberately NO migration from un-suffixed
// keys: those only ever existed during pre-release development of this
// feature, so no production user has data under them.
const STORAGE_KEY = 'twinkle-desktop-tab-order';
const CUSTOM_TABS_KEY = 'twinkle-desktop-custom-tabs';
const MINIMIZED_TABS_KEY = 'twinkle-desktop-minimized-tabs';
const MENU_DISCOVERED_KEY = 'twinkle-desktop-tab-menu-discovered';

export const NAV_TAB_KEYS = [
  'profile',
  'home',
  'explore',
  'content',
  'missions',
  'chat',
  'build'
] as const;

export type NavTabKey = (typeof NAV_TAB_KEYS)[number];

// The "sacred" default tabs: a contiguous block that users may reorder only
// among themselves. Pinned tabs sit to their LEFT; every other tab (profile,
// the dynamic content tab, and extracted/added custom tabs) sits to their
// RIGHT. Nothing from another section may enter the block. This is a
// render-time partition only — the stored order/sync model is unchanged.
export const SACRED_DEFAULT_KEYS = [
  'home',
  'explore',
  'missions',
  'chat',
  'build'
] as const;

export function isSacredDefaultKey(value: string): boolean {
  return (SACRED_DEFAULT_KEYS as readonly string[]).includes(value);
}

// a page the user captured out of the dynamic tab, either pinned
// (icon-only, far left) or as a regular reorderable tab
export interface CustomNavTab {
  id: string;
  to: string;
  icon: string;
  label: string;
  pinned: boolean;
}

export function isNavTabKey(value: string): value is NavTabKey {
  return (NAV_TAB_KEYS as readonly string[]).includes(value);
}

// sanitizers accept untrusted input (localStorage or the server's navTabs blob)
// and return safe values

export function sanitizeCustomNavTabs(raw: any): CustomNavTab[] {
  if (!Array.isArray(raw)) return [];
  const tabs: CustomNavTab[] = [];
  for (const entry of raw) {
    if (
      entry &&
      typeof entry.id === 'string' &&
      typeof entry.to === 'string' &&
      entry.to.startsWith('/') &&
      typeof entry.icon === 'string' &&
      typeof entry.label === 'string' &&
      !tabs.some((tab) => tab.id === entry.id)
    ) {
      tabs.push({
        id: entry.id,
        to: entry.to,
        icon: entry.icon,
        label: entry.label,
        pinned: !!entry.pinned
      });
    }
  }
  return tabs;
}

export function sanitizeNavTabOrder(
  raw: any,
  customTabs: CustomNavTab[] = []
): string[] {
  const unpinnedCustomIds = customTabs
    .filter((tab) => !tab.pinned)
    .map((tab) => tab.id);
  const fallback = [...NAV_TAB_KEYS, ...unpinnedCustomIds];
  if (!Array.isArray(raw)) return fallback;
  const order: string[] = [];
  for (const key of raw) {
    if (
      typeof key === 'string' &&
      (isNavTabKey(key) || unpinnedCustomIds.includes(key)) &&
      !order.includes(key)
    ) {
      order.push(key);
    }
  }
  // tabs added in later releases appear even for users with a saved order
  for (const key of NAV_TAB_KEYS) {
    if (!order.includes(key)) {
      order.push(key);
    }
  }
  // custom tabs must always be reachable, even if the saved order lost them
  for (const id of unpinnedCustomIds) {
    if (!order.includes(id)) {
      order.push(id);
    }
  }
  return order;
}

export function mergeSessionNavTabsIntoServerOrder({
  serverOrder,
  localOrder,
  customTabs
}: {
  serverOrder: any;
  localOrder: string[];
  customTabs: CustomNavTab[];
}): string[] {
  const sessionTabIds = customTabs
    .filter((tab) => !tab.pinned)
    .map((tab) => tab.id);
  if (sessionTabIds.length === 0) {
    return sanitizeNavTabOrder(serverOrder, customTabs);
  }
  const sessionTabIdSet = new Set(sessionTabIds);
  const baseOrder = sanitizeNavTabOrder(serverOrder, customTabs).filter(
    (key) => !sessionTabIdSet.has(key)
  );
  const baseKeySet = new Set(baseOrder);
  const beforeAnchor = new Map<string, string[]>();
  const append: string[] = [];
  const seen = new Set<string>();
  for (let index = 0; index < localOrder.length; index += 1) {
    const key = localOrder[index];
    if (!sessionTabIdSet.has(key) || seen.has(key)) continue;
    seen.add(key);
    const anchor = localOrder
      .slice(index + 1)
      .find((candidate) => baseKeySet.has(candidate));
    if (!anchor) {
      append.push(key);
      continue;
    }
    const anchored = beforeAnchor.get(anchor) || [];
    anchored.push(key);
    beforeAnchor.set(anchor, anchored);
  }
  for (const id of sessionTabIds) {
    if (!seen.has(id)) {
      append.push(id);
    }
  }
  const merged: string[] = [];
  for (const key of baseOrder) {
    const anchored = beforeAnchor.get(key);
    if (anchored) {
      merged.push(...anchored);
    }
    merged.push(key);
  }
  merged.push(...append);
  return sanitizeNavTabOrder(merged, customTabs);
}

export function sanitizeMinimizedNavTabKeys(
  raw: any,
  customTabs: CustomNavTab[] = []
): string[] {
  if (!Array.isArray(raw)) return [];
  const customIds = customTabs.map((tab) => tab.id);
  const keys: string[] = [];
  for (const key of raw) {
    if (
      typeof key === 'string' &&
      (isNavTabKey(key) || customIds.includes(key)) &&
      !keys.includes(key)
    ) {
      keys.push(key);
    }
  }
  return keys;
}

type NavUserId = number | string | null | undefined;

export function loadNavTabOrder(
  customTabs: CustomNavTab[] = [],
  userId?: NavUserId
): string[] {
  return sanitizeNavTabOrder(
    readJson(scopedKey(STORAGE_KEY, userId)),
    customTabs
  );
}

export function saveNavTabOrder(order: string[], userId?: NavUserId) {
  writeJson(scopedKey(STORAGE_KEY, userId), order);
}

// the full custom-tab list per account for the current PAGE lifetime.
// "Session-only" means the page session, not the component lifetime: the
// header unmounts during normal navigation (e.g. /app/:id hides it), and
// extracted tabs must survive that. A module-level store lives exactly as
// long as the page and is reborn empty on reload — which is the rule:
// only pinned tabs survive a reload
const sessionCustomTabsByScope = new Map<string, CustomNavTab[]>();

function scopeOf(userId?: NavUserId) {
  return `${userId || 'guest'}`;
}

export function loadCustomNavTabs(userId?: NavUserId): CustomNavTab[] {
  const sessionTabs = sessionCustomTabsByScope.get(scopeOf(userId));
  if (sessionTabs) {
    return sanitizeCustomNavTabs(sessionTabs);
  }
  return sanitizeCustomNavTabs(readJson(scopedKey(CUSTOM_TABS_KEY, userId)));
}

export function saveCustomNavTabs(tabs: CustomNavTab[], userId?: NavUserId) {
  sessionCustomTabsByScope.set(scopeOf(userId), tabs);
  // localStorage keeps pinned only: extracted tabs must not survive reload
  writeJson(
    scopedKey(CUSTOM_TABS_KEY, userId),
    tabs.filter((tab) => tab.pinned)
  );
}

// keys (builtin or custom-tab ids) the user displays icon-only
export function loadMinimizedNavTabKeys(
  customTabs: CustomNavTab[] = [],
  userId?: NavUserId
): string[] {
  return sanitizeMinimizedNavTabKeys(
    readJson(scopedKey(MINIMIZED_TABS_KEY, userId)),
    customTabs
  );
}

export function saveMinimizedNavTabKeys(keys: string[], userId?: NavUserId) {
  writeJson(scopedKey(MINIMIZED_TABS_KEY, userId), keys);
}

export interface NavDraftState {
  order: string[];
  customTabs: CustomNavTab[];
  minimized: string[];
  menuDiscovered: boolean;
}

// per-account session metadata for the nav-sync merge: what the user
// touched/created/removed this PAGE session, which fields they edited, and
// the latest uncommitted draft. Module scope, like the session tab store
// above: the header unmounts during normal navigation (/app/:id) and this
// history must survive that — component refs silently forgot removals,
// provenance, and pending writes across remounts. Reborn empty on reload
export interface NavSessionMeta {
  customized: boolean;
  dirtyFields: { order: boolean; custom: boolean; minimized: boolean };
  canonicalOrderEdited: boolean;
  touchedIds: Set<string>;
  createdIds: Set<string>;
  removedTabs: { id: string; to: string; sessionCreated: boolean }[];
  minimizedIntents: Record<string, boolean>;
  draft: NavDraftState | null;
  sessionGen: number;
  // the write chain + sequence live here (not in component refs) so a
  // slow in-flight save from a PREVIOUS header instance stays serialized
  // ahead of a remounted instance's writes — per-instance queues let an
  // old slow write land after (and clobber) a newer one
  writeQueue: Promise<any>;
  writeSeq: number;
}

const navSessionMetaByScope = new Map<string, NavSessionMeta>();

export function getNavSessionMeta(userId?: NavUserId): NavSessionMeta {
  const scope = scopeOf(userId);
  let meta = navSessionMetaByScope.get(scope);
  if (!meta) {
    meta = {
      customized: false,
      dirtyFields: { order: false, custom: false, minimized: false },
      canonicalOrderEdited: false,
      touchedIds: new Set(),
      createdIds: new Set(),
      removedTabs: [],
      minimizedIntents: {},
      draft: null,
      sessionGen: 0,
      writeQueue: Promise.resolve(),
      writeSeq: 0
    };
    navSessionMetaByScope.set(scope, meta);
  }
  return meta;
}

export function noteNavAuthTokenChange({
  previousToken,
  nextToken,
  preserveSameUserSession
}: {
  previousToken?: string | null;
  nextToken?: string | null;
  preserveSameUserSession?: boolean;
}) {
  const previousScope = readTokenUserScope(previousToken);
  const nextScope = readTokenUserScope(nextToken);
  if (
    preserveSameUserSession &&
    previousScope &&
    previousScope === nextScope
  ) {
    return;
  }
  const affectedScopes = new Set(
    [previousScope, nextScope].filter((scope): scope is string => !!scope)
  );
  for (const scope of affectedScopes) {
    getNavSessionMeta(scope).sessionGen += 1;
  }
}

// whether the user has ever opened a tab context menu (retires the
// "right-click for options" hint)
export function loadTabMenuDiscovered(userId?: NavUserId): boolean {
  try {
    return localStorage.getItem(scopedKey(MENU_DISCOVERED_KEY, userId)) === '1';
  } catch {
    return false;
  }
}

export function saveTabMenuDiscovered(userId?: NavUserId) {
  try {
    localStorage.setItem(scopedKey(MENU_DISCOVERED_KEY, userId), '1');
  } catch {
    // localStorage unavailable; hint retires for this session only
  }
}

// nav config is per-account: cache keys are namespaced by the logged-in
// userId (from context, which hydrates synchronously at boot and updates
// immediately on login/logout) so one account's tabs never leak into
// another's on a shared device
function scopedKey(base: string, userId?: NavUserId) {
  return `${base}:${userId || 'guest'}`;
}

function readTokenUserScope(tokenValue?: string | null) {
  if (!tokenValue || typeof atob !== 'function') return null;
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

function readJson(key: string) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage unavailable (privacy mode); state stays session-only
  }
}
