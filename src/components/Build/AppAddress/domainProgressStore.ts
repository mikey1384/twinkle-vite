import type { DomainProgressView } from './checkout/model';

// Pure store for the shared domain-purchase progress poller and its per-build
// hosting/domain-sales eligibility gate. Keyed by (userId, buildId[, orderId]);
// wiped on account switch, reset and re-polled for live subscribers on
// ownership transfer, paused when the tab is hidden; entries are deleted once
// no surface is listening so SPA revisits fetch fresh.

export type ProgressLoader = (input: {
  buildId: number;
  orderId?: number;
}) => Promise<{ progress: DomainProgressView | null }>;

export interface DomainProgressFallbackTarget {
  buildId: number;
  orderId: number;
}

export interface DomainProgressStoreOptions {
  isHidden?: () => boolean;
  setTimeoutFn?: (fn: () => void, ms: number) => ReturnType<typeof setTimeout>;
  clearTimeoutFn?: (id: ReturnType<typeof setTimeout>) => void;
}

interface Entry {
  key: string;
  userId: number;
  buildId: number;
  orderId: number;
  progress: DomainProgressView | null;
  loaded: boolean;
  listeners: Set<() => void>;
  timer: ReturnType<typeof setTimeout> | null;
  delay: number;
  failures: number;
  running: boolean;
  pendingRefresh: boolean;
  generation: number;
  load: ProgressLoader | null;
}

const INITIAL_DELAY_MS = 10_000;
const MAX_ACTIVE_DELAY_MS = 60_000;
const IDLE_WAIT_DELAY_MS = 5 * 60_000;
const INITIAL_RETRY_MS = 15_000;

function normalizeOrderId(orderId?: number | null): number {
  const n = Number(orderId || 0);
  return Number.isSafeInteger(n) && n > 0 ? n : 0;
}

function makeKey(userId: number, buildId: number, orderId = 0) {
  const normalized = normalizeOrderId(orderId);
  return normalized > 0 ? `${userId}:${buildId}:${normalized}` : `${userId}:${buildId}`;
}

function peekDelay(entry: Entry): number {
  const stage = entry.progress?.stage;
  if (stage === 'setting_up' || stage === 'refunding') return entry.delay;
  if (stage === 'one_step_left' || stage === 'support') return IDLE_WAIT_DELAY_MS;
  return 0;
}

function defaultIsHidden() {
  return typeof document !== 'undefined' && document.visibilityState === 'hidden';
}

export function createDomainProgressStore(options: DomainProgressStoreOptions = {}) {
  const isHidden = options.isHidden || defaultIsHidden;
  const setTimeoutFn = options.setTimeoutFn || ((fn, ms) => globalThis.setTimeout(fn, ms));
  const clearTimeoutFn = options.clearTimeoutFn || ((id) => globalThis.clearTimeout(id));

  const entries = new Map<string, Entry>();
  const allowedBuilds = new Map<number, boolean>();
  const allowedListeners = new Map<number, Set<() => void>>();
  const fallbackTargets = new Map<number, DomainProgressFallbackTarget>();
  const fallbackListeners = new Map<number, Set<() => void>>();
  let currentUserId: number | null = null;

  function clearTimer(entry: Entry) {
    if (entry.timer !== null) {
      clearTimeoutFn(entry.timer);
      entry.timer = null;
    }
  }

  function syncUser(userId: number | null | undefined) {
    const nextUser = userId && userId > 0 ? Number(userId) : null;
    if (currentUserId === nextUser) return;
    currentUserId = nextUser;
    for (const entry of entries.values()) {
      clearTimer(entry);
    }
    entries.clear();
  }

  async function poll(entry: Entry) {
    clearTimer(entry);
    if (entries.get(entry.key) !== entry || !entry.load || !entry.listeners.size || entry.running) {
      return;
    }
    const gen = entry.generation;
    entry.running = true;
    entry.pendingRefresh = false;
    let wait = 0;
    let stale = false;
    try {
      const data = await entry.load(
        entry.orderId > 0
          ? { buildId: entry.buildId, orderId: entry.orderId }
          : { buildId: entry.buildId }
      );
      if (entries.get(entry.key) !== entry || !entry.listeners.size) return;
      if (entry.generation !== gen) {
        stale = true;
      } else {
        const prevStage = entry.progress?.stage;
        entry.progress = data?.progress || null;
        entry.loaded = true;
        entry.failures = 0;
        if (entry.progress?.stage !== prevStage) entry.delay = INITIAL_DELAY_MS;
        wait = peekDelay(entry);
        if (entry.progress?.stage === 'setting_up' || entry.progress?.stage === 'refunding') {
          entry.delay = Math.min(MAX_ACTIVE_DELAY_MS, Math.round(entry.delay * 1.5));
        }
      }
    } catch (error: any) {
      if (entries.get(entry.key) !== entry || !entry.listeners.size) return;
      if (entry.generation !== gen) {
        stale = true;
      } else {
        const status = Number(error?.status || 0);
        if (status === 403 || status === 404) {
          entry.progress = null;
          entry.loaded = true;
          entry.failures = 0;
          wait = 0;
        } else {
          entry.failures += 1;
          wait = Math.min(IDLE_WAIT_DELAY_MS, INITIAL_RETRY_MS * 2 ** (entry.failures - 1));
        }
      }
    } finally {
      entry.running = false;
    }
    if (entries.get(entry.key) !== entry || !entry.listeners.size) return;
    if (!stale) {
      entry.listeners.forEach((listener) => listener());
    }
    if (entry.pendingRefresh) {
      if (!isHidden()) {
        entry.pendingRefresh = false;
        void poll(entry);
      }
      return;
    }
    if (wait > 0 && !isHidden()) {
      entry.timer = setTimeoutFn(() => {
        entry.timer = null;
        void poll(entry);
      }, wait);
    }
  }

  function subscribe(
    userId: number,
    buildId: number,
    load: ProgressLoader,
    listener: () => void,
    orderId = 0
  ) {
    syncUser(userId);
    const normalizedOrderId = normalizeOrderId(orderId);
    const key = makeKey(userId, buildId, normalizedOrderId);
    let entry = entries.get(key);
    if (!entry) {
      entry = {
        key,
        userId,
        buildId,
        orderId: normalizedOrderId,
        progress: null,
        loaded: false,
        listeners: new Set(),
        timer: null,
        delay: INITIAL_DELAY_MS,
        failures: 0,
        running: false,
        pendingRefresh: false,
        generation: 0,
        load
      };
      entries.set(key, entry);
    } else {
      entry.load = load;
    }
    entry.listeners.add(listener);
    if (!isHidden() && !entry.running && entry.timer === null) {
      if (!entry.loaded || entry.pendingRefresh || peekDelay(entry) > 0) {
        void poll(entry);
      }
    }
    return () => {
      entry.listeners.delete(listener);
      if (!entry.listeners.size) {
        clearTimer(entry);
        if (entries.get(key) === entry) {
          entries.delete(key);
        }
      }
    };
  }

  function refresh(buildId: number, orderId = 0) {
    const normalizedOrderId = normalizeOrderId(orderId);
    for (const entry of entries.values()) {
      if (entry.buildId !== buildId) continue;
      if (normalizedOrderId > 0 && entry.orderId > 0 && entry.orderId !== normalizedOrderId) {
        continue;
      }
      entry.delay = INITIAL_DELAY_MS;
      if (entry.running) {
        entry.pendingRefresh = true;
      } else if (entry.listeners.size) {
        if (isHidden()) {
          entry.pendingRefresh = true;
        } else {
          void poll(entry);
        }
      }
    }
  }

  function clearBuild(buildId: number) {
    for (const [key, entry] of [...entries.entries()]) {
      if (entry.buildId !== buildId) continue;
      clearTimer(entry);
      entry.generation += 1;
      entry.progress = null;
      entry.loaded = false;
      entry.delay = INITIAL_DELAY_MS;
      entry.failures = 0;
      if (!entry.listeners.size) {
        entries.delete(key);
        continue;
      }
      for (const listener of [...entry.listeners]) {
        listener();
      }
      if (entries.get(key) !== entry || !entry.listeners.size) continue;
      if (entry.running || isHidden()) {
        entry.pendingRefresh = true;
      } else {
        void poll(entry);
      }
    }
  }

  function handleVisibilityChange() {
    if (isHidden()) {
      for (const entry of entries.values()) {
        clearTimer(entry);
      }
      return;
    }
    for (const entry of entries.values()) {
      if (entry.running || entry.timer !== null || !entry.listeners.size) continue;
      if (!entry.loaded || entry.pendingRefresh || entry.failures > 0 || peekDelay(entry) > 0) {
        void poll(entry);
      }
    }
  }

  function getProgress(userId: number, buildId: number, orderId = 0): DomainProgressView | null {
    if (!userId || !buildId || currentUserId !== userId) return null;
    return entries.get(makeKey(userId, buildId, orderId))?.progress || null;
  }

  function setFallbackTarget(buildId: number, target: DomainProgressFallbackTarget | null) {
    if (!buildId) return;
    const prev = fallbackTargets.get(buildId) || null;
    const next =
      target && target.buildId > 0 && target.orderId > 0
        ? { buildId: Number(target.buildId), orderId: Number(target.orderId) }
        : null;
    if (
      prev?.buildId === next?.buildId &&
      prev?.orderId === next?.orderId
    ) {
      return;
    }
    if (next) fallbackTargets.set(buildId, next);
    else fallbackTargets.delete(buildId);
    fallbackListeners.get(buildId)?.forEach((listener) => listener());
  }

  function getFallbackTarget(buildId: number): DomainProgressFallbackTarget | null {
    return buildId ? fallbackTargets.get(buildId) || null : null;
  }

  function subscribeFallbackTarget(buildId: number, listener: () => void) {
    let set = fallbackListeners.get(buildId);
    if (!set) {
      set = new Set();
      fallbackListeners.set(buildId, set);
    }
    set.add(listener);
    return () => {
      set?.delete(listener);
      if (set && set.size === 0) fallbackListeners.delete(buildId);
    };
  }

  function setAllowed(buildId: number, allowed: boolean) {
    if (!buildId) return;
    const prev = Boolean(allowedBuilds.get(buildId));
    if (allowed) allowedBuilds.set(buildId, true);
    else allowedBuilds.delete(buildId);
    if (prev !== allowed) {
      allowedListeners.get(buildId)?.forEach((listener) => listener());
    }
  }

  function isAllowed(buildId: number): boolean {
    return Boolean(buildId && allowedBuilds.get(buildId));
  }

  function subscribeAllowed(buildId: number, listener: () => void) {
    let set = allowedListeners.get(buildId);
    if (!set) {
      set = new Set();
      allowedListeners.set(buildId, set);
    }
    set.add(listener);
    return () => {
      set?.delete(listener);
      if (set && set.size === 0) allowedListeners.delete(buildId);
    };
  }

  function entryCount() {
    return entries.size;
  }

  return {
    syncUser,
    subscribe,
    refresh,
    clearBuild,
    handleVisibilityChange,
    getProgress,
    setAllowed,
    isAllowed,
    subscribeAllowed,
    setFallbackTarget,
    getFallbackTarget,
    subscribeFallbackTarget,
    entryCount
  };
}

export const domainProgressStore = createDomainProgressStore();
