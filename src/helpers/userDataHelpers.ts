import { noteNavAuthTokenChange } from './navTabOrder';

let inMemoryAuthToken = '';
let authTokenRemovalPending = false;
let authTokenPendingRemovalValue = '';

const AUTH_TOKEN_STORAGE_KEY = 'token';
export const EXPLICIT_LOGOUT_STORAGE_KEY = 'twinkleExplicitLogoutAt';
export const REJECTED_AUTH_SESSION_STORAGE_KEY =
  'twinkleRejectedAuthSession';
const AUTH_TRANSITION_SIGNAL_MAX_AGE_MS = 60_000;
const AUTH_TRANSITION_SIGNAL_CLOCK_SKEW_MS = 5_000;

interface AuthTransitionSignal {
  at: number;
  credentialId?: string;
}

function getAuthCredentialId(token: string) {
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < token.length; index++) {
    const code = token.charCodeAt(index);
    first = Math.imul(first ^ code, 0x01000193);
    second = Math.imul(second ^ code, 0x5bd1e995);
  }
  return `${token.length}.${(first >>> 0).toString(36)}.${(
    second >>> 0
  ).toString(36)}`;
}

function parseAuthTransitionSignal(
  value: string | null
): AuthTransitionSignal | null {
  if (!value) return null;
  const numericTimestamp = Number(value);
  if (Number.isFinite(numericTimestamp) && numericTimestamp > 0) {
    return { at: numericTimestamp };
  }
  try {
    const parsed = JSON.parse(value);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !Number.isFinite(parsed.at) ||
      parsed.at <= 0
    ) {
      return null;
    }
    return {
      at: parsed.at,
      credentialId:
        typeof parsed.credentialId === 'string' && parsed.credentialId
          ? parsed.credentialId
          : undefined
    };
  } catch {
    return null;
  }
}

function hasActiveAuthTransitionSignal(value: string | null) {
  return Boolean(parseAuthTransitionSignal(value));
}

function authTransitionSignalTargetsToken(
  value: string | null,
  token: string
) {
  const signal = parseAuthTransitionSignal(value);
  if (!signal) return false;
  return (
    !signal.credentialId ||
    !token ||
    signal.credentialId === getAuthCredentialId(token)
  );
}

function createRejectedAuthSessionSignal(token: string, now: number) {
  return JSON.stringify({
    at: now,
    credentialId: getAuthCredentialId(token)
  });
}

function beginAuthTokenRemoval(expectedToken = '') {
  authTokenRemovalPending = true;
  authTokenPendingRemovalValue = expectedToken;
}

function finishAuthTokenRemoval() {
  authTokenRemovalPending = false;
  authTokenPendingRemovalValue = '';
}

function clearAuthTransitionSignal(storage: Storage, key: string) {
  try {
    storage.removeItem(key);
    // Some mobile storage implementations silently drop removals while still
    // accepting writes. An empty value is also an inactive signal.
    if (storage.getItem(key)) storage.setItem(key, '');
  } catch {
    try {
      storage.setItem(key, '');
    } catch {}
  }
  try {
    return !hasActiveAuthTransitionSignal(storage.getItem(key));
  } catch {
    return false;
  }
}

function hasBlockingAuthTransitionMarker(storage: Storage) {
  return (
    hasActiveAuthTransitionSignal(
      storage.getItem(REJECTED_AUTH_SESSION_STORAGE_KEY)
    ) ||
    hasActiveAuthTransitionSignal(storage.getItem(EXPLICIT_LOGOUT_STORAGE_KEY))
  );
}

export interface AuthTokenRead {
  storageAvailable: boolean;
  token: string;
  usedMemoryFallback: boolean;
}

export function checkMultiMissionPassStatus({
  mission,
  myAttempts
}: {
  mission: any;
  myAttempts: any;
}) {
  let numTasks = 0;
  let numPassedTasks = 0;
  for (const subMission of mission.subMissions) {
    for (const task of subMission.tasks) {
      numTasks++;
      if (myAttempts[task.id]?.status === 'pass') {
        numPassedTasks++;
      }
    }
  }
  return {
    numTasks,
    numPassedTasks,
    passed: numTasks > 0 && numTasks === numPassedTasks
  };
}
export function getLocalStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storage = window.localStorage;
    if (
      !storage ||
      typeof storage.getItem !== 'function' ||
      typeof storage.setItem !== 'function' ||
      typeof storage.removeItem !== 'function'
    ) {
      return null;
    }
    return storage;
  } catch {
    return null;
  }
}

export function getStoredItem(key: string, defaultValue = ''): string {
  if (key === 'token') {
    return readAuthToken().token || defaultValue;
  }
  const storage = getLocalStorage();
  if (!storage) {
    return defaultValue;
  }

  let item = '';
  try {
    item = storage.getItem(key) || '';
  } catch {
    return defaultValue;
  }
  return item || defaultValue;
}

export function readAuthToken(): AuthTokenRead {
  const storage = getLocalStorage();
  if (!storage) {
    return {
      storageAvailable: false,
      token: authTokenRemovalPending ? '' : inMemoryAuthToken,
      usedMemoryFallback: !authTokenRemovalPending && !!inMemoryAuthToken
    };
  }

  try {
    const explicitLogoutSignal = storage.getItem(
      EXPLICIT_LOGOUT_STORAGE_KEY
    );
    const rejectedSessionSignal = storage.getItem(
      REJECTED_AUTH_SESSION_STORAGE_KEY
    );
    const storedToken = storage.getItem(AUTH_TOKEN_STORAGE_KEY) || '';
    const currentToken = storedToken || inMemoryAuthToken;
    const explicitLogoutActive = hasActiveAuthTransitionSignal(
      explicitLogoutSignal
    );
    const rejectedCredentialActive = authTransitionSignalTargetsToken(
      rejectedSessionSignal,
      currentToken
    );

    if (explicitLogoutActive || rejectedCredentialActive) {
      // A canonical rejection or explicit logout remains authoritative across
      // suspended tabs and reloads. Never repair that credential from memory.
      inMemoryAuthToken = '';
      if (explicitLogoutActive) {
        beginAuthTokenRemoval(currentToken);
        storage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        if (!storage.getItem(AUTH_TOKEN_STORAGE_KEY)) {
          finishAuthTokenRemoval();
        }
      } else {
        finishAuthTokenRemoval();
      }
      return {
        storageAvailable: true,
        token: '',
        usedMemoryFallback: false
      };
    }

    if (hasActiveAuthTransitionSignal(rejectedSessionSignal)) {
      // A fresh login won a cross-tab race after an older request was
      // rejected. The rejection belongs only to the old credential.
      clearAuthTransitionSignal(storage, REJECTED_AUTH_SESSION_STORAGE_KEY);
      finishAuthTokenRemoval();
    }

    if (authTokenRemovalPending) {
      const tokenPendingRemoval = storage.getItem(AUTH_TOKEN_STORAGE_KEY) || '';
      if (
        tokenPendingRemoval &&
        authTokenPendingRemovalValue &&
        tokenPendingRemoval !== authTokenPendingRemovalValue
      ) {
        inMemoryAuthToken = tokenPendingRemoval;
        finishAuthTokenRemoval();
        return {
          storageAvailable: true,
          token: tokenPendingRemoval,
          usedMemoryFallback: false
        };
      }
      storage.removeItem('token');
      if (!storage.getItem('token')) {
        finishAuthTokenRemoval();
      }
      return {
        storageAvailable: true,
        token: '',
        usedMemoryFallback: false
      };
    }

    const confirmedStoredToken = storage.getItem('token') || '';
    if (confirmedStoredToken) {
      inMemoryAuthToken = confirmedStoredToken;
      return {
        storageAvailable: true,
        token: confirmedStoredToken,
        usedMemoryFallback: false
      };
    }

    if (inMemoryAuthToken) {
      // Mobile Safari can transiently lose access to a localStorage entry
      // while the page itself is still alive. The token was established by a
      // confirmed login/session read earlier in this page lifetime, so retain
      // it and repair the durable copy instead of turning a storage glitch
      // into a destructive logout.
      try {
        storage.setItem('token', inMemoryAuthToken);
      } catch {
        // The in-memory session still keeps this page authenticated.
      }
      return {
        storageAvailable: true,
        token: inMemoryAuthToken,
        usedMemoryFallback: true
      };
    }

    return {
      storageAvailable: true,
      token: '',
      usedMemoryFallback: false
    };
  } catch {
    return {
      storageAvailable: false,
      token: inMemoryAuthToken,
      usedMemoryFallback: !!inMemoryAuthToken
    };
  }
}

export function setStoredItem(
  key: string,
  value: string,
  options: { preserveNavSession?: boolean } = {}
) {
  if (key === 'token') {
    return persistAuthToken(value, options);
  }
  const storage = getLocalStorage();
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function persistAuthToken(
  token: unknown,
  options: { preserveNavSession?: boolean } = {}
) {
  if (typeof token !== 'string' || !token) return false;
  const storage = getLocalStorage();
  if (!storage) return false;

  let previousValue = '';
  try {
    previousValue = storage.getItem('token') || inMemoryAuthToken || '';
    if (hasBlockingAuthTransitionMarker(storage)) {
      // Remove the departed credential before clearing its marker. Writing a
      // new token while a transition marker is still active lets another tab
      // mistake that new login for the departed session.
      storage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      if (storage.getItem(AUTH_TOKEN_STORAGE_KEY)) {
        storage.setItem(AUTH_TOKEN_STORAGE_KEY, '');
      }
      if (storage.getItem(AUTH_TOKEN_STORAGE_KEY)) return false;
      inMemoryAuthToken = '';
      finishAuthTokenRemoval();
    }

    const logoutSignalCleared = clearAuthTransitionSignal(
      storage,
      EXPLICIT_LOGOUT_STORAGE_KEY
    );
    const rejectionSignalCleared = clearAuthTransitionSignal(
      storage,
      REJECTED_AUTH_SESSION_STORAGE_KEY
    );
    if (!logoutSignalCleared || !rejectionSignalCleared) return false;

    storage.setItem('token', token);
    if (storage.getItem('token') !== token) return false;
  } catch {
    return false;
  }

  // Only publish the credential to page memory and account-scoped navigation
  // state after durable storage confirms the exact value. A silently dropped
  // mobile write is not a session-producing event and must have no optimistic
  // side effects for the failed token.
  inMemoryAuthToken = token;
  finishAuthTokenRemoval();
  if (previousValue !== token) {
    noteNavAuthTokenChange({
      previousToken: previousValue,
      nextToken: token,
      preserveSameUserSession: options.preserveNavSession
    });
  }
  return true;
}

export function removeStoredItem(key: string) {
  const storage = getLocalStorage();
  const previousMemoryToken = key === 'token' ? inMemoryAuthToken : '';
  if (key === 'token') {
    if (storage) {
      try {
        // Token removal alone is ambiguous: a browser storage cleanup or an
        // older buggy tab can also produce it. Record the explicit user action
        // first so other tabs clear their page-lifetime credential only for a
        // genuine logout initiated through Twinkle.
        storage.setItem(EXPLICIT_LOGOUT_STORAGE_KEY, String(Date.now()));
        clearAuthTransitionSignal(
          storage,
          REJECTED_AUTH_SESSION_STORAGE_KEY
        );
      } catch {
        // This tab still logs out locally. Other tabs conservatively preserve
        // their confirmed sessions when logout intent cannot be proven.
      }
    }
    inMemoryAuthToken = '';
    beginAuthTokenRemoval(previousMemoryToken);
  }
  if (!storage) {
    return false;
  }

  try {
    const previousValue =
      key === 'token' ? storage.getItem(key) || previousMemoryToken || '' : '';
    storage.removeItem(key);
    if (key === 'token' && !storage.getItem(key)) {
      finishAuthTokenRemoval();
    }
    if (key === 'token' && previousValue) {
      noteNavAuthTokenChange({
        previousToken: previousValue,
        nextToken: null
      });
    }
    return true;
  } catch {
    return false;
  }
}

function isRecentAuthTransitionSignal(value: string | null, now: number) {
  const signal = parseAuthTransitionSignal(value);
  if (!signal) return false;
  const signalledAt = signal.at;
  return (
    signalledAt <= now + AUTH_TRANSITION_SIGNAL_CLOCK_SKEW_MS &&
    now - signalledAt <= AUTH_TRANSITION_SIGNAL_MAX_AGE_MS
  );
}

function hasRejectedAuthSessionMarkerInStorage(storage: Storage) {
  const signal = storage.getItem(REJECTED_AUTH_SESSION_STORAGE_KEY);
  if (!hasActiveAuthTransitionSignal(signal)) return false;
  const currentToken =
    storage.getItem(AUTH_TOKEN_STORAGE_KEY) || inMemoryAuthToken;
  if (currentToken && !authTransitionSignalTargetsToken(signal, currentToken)) {
    return false;
  }
  return true;
}

export function hasRejectedAuthSessionMarker() {
  const storage = getLocalStorage();
  if (!storage) return false;
  try {
    return hasRejectedAuthSessionMarkerInStorage(storage);
  } catch {
    return false;
  }
}

export function hasExplicitAuthLogoutMarker() {
  const storage = getLocalStorage();
  if (!storage) return false;
  try {
    return hasActiveAuthTransitionSignal(
      storage.getItem(EXPLICIT_LOGOUT_STORAGE_KEY)
    );
  } catch {
    return false;
  }
}

/**
 * Retires only the credential that the canonical session boundary rejected.
 * A newer login that lands while an older request is resolving must survive.
 */
export function retireRejectedAuthToken(
  expectedToken: string,
  now = Date.now()
) {
  if (!expectedToken || readAuthToken().token !== expectedToken) return false;

  const storage = getLocalStorage();
  let rejectionSignalPersisted = false;
  if (storage) {
    try {
      const durableToken = storage.getItem(AUTH_TOKEN_STORAGE_KEY) || '';
      if (durableToken && durableToken !== expectedToken) return false;
      clearAuthTransitionSignal(storage, EXPLICIT_LOGOUT_STORAGE_KEY);
      const rejectionSignal = createRejectedAuthSessionSignal(
        expectedToken,
        now
      );
      storage.setItem(REJECTED_AUTH_SESSION_STORAGE_KEY, rejectionSignal);
      rejectionSignalPersisted =
        storage.getItem(REJECTED_AUTH_SESSION_STORAGE_KEY) === rejectionSignal;
      const currentToken = storage.getItem(AUTH_TOKEN_STORAGE_KEY) || '';
      if (currentToken && currentToken !== expectedToken) {
        clearAuthTransitionSignal(storage, REJECTED_AUTH_SESSION_STORAGE_KEY);
        inMemoryAuthToken = currentToken;
        finishAuthTokenRemoval();
        return false;
      }
    } catch {
      // The canonical rejection still retires this page's in-memory token.
      // Other tabs will independently reach the same server boundary.
    }
  }

  inMemoryAuthToken = '';
  if (rejectionSignalPersisted) {
    finishAuthTokenRemoval();
  } else {
    beginAuthTokenRemoval(expectedToken);
  }
  if (storage) {
    try {
      const tokenBeforeRemoval =
        storage.getItem(AUTH_TOKEN_STORAGE_KEY) || '';
      if (tokenBeforeRemoval && tokenBeforeRemoval !== expectedToken) {
        inMemoryAuthToken = tokenBeforeRemoval;
        finishAuthTokenRemoval();
        return false;
      }
      storage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      const remainingToken = storage.getItem(AUTH_TOKEN_STORAGE_KEY) || '';
      if (remainingToken && remainingToken !== expectedToken) {
        inMemoryAuthToken = remainingToken;
        finishAuthTokenRemoval();
        return false;
      }
      if (remainingToken) {
        beginAuthTokenRemoval(expectedToken);
      } else {
        finishAuthTokenRemoval();
      }
    } catch {
      // Keep removal pending so this page cannot resurrect the rejected token.
    }
  }

  // The marker remains authoritative if a mobile storage implementation drops
  // the removal. Its credential id also lets a newer cross-tab login survive a
  // delayed rejection event or repair an exceptionally narrow write/remove
  // race without ever making the rejected credential usable again.

  noteNavAuthTokenChange({
    previousToken: expectedToken,
    nextToken: null
  });
  return true;
}

export function resetAuthTokenMemoryForTests() {
  inMemoryAuthToken = '';
  finishAuthTokenRemoval();
}

export function adoptAuthTokenStorageChange(nextToken: string | null) {
  // A StorageEvent is emitted only for an actual same-origin mutation made
  // by another document. Unlike an ordinary localStorage read, it is an
  // authoritative account transition and may safely replace the page-lifetime
  // fallback credential.
  inMemoryAuthToken = nextToken || '';
  finishAuthTokenRemoval();
}

export function isExplicitAuthTokenRemovalStorageEvent(
  event: Pick<StorageEvent, 'key' | 'newValue' | 'storageArea'>,
  now = Date.now()
) {
  if (event.key !== AUTH_TOKEN_STORAGE_KEY || event.newValue) return false;
  const storage = event.storageArea || getLocalStorage();
  if (!storage) return false;
  try {
    return isRecentAuthTransitionSignal(
      storage.getItem(EXPLICIT_LOGOUT_STORAGE_KEY),
      now
    );
  } catch {
    return false;
  }
}

export function isExplicitAuthLogoutStorageEvent(
  event: Pick<StorageEvent, 'key' | 'newValue' | 'storageArea'>,
  now = Date.now()
) {
  if (event.key === EXPLICIT_LOGOUT_STORAGE_KEY) {
    return isRecentAuthTransitionSignal(event.newValue, now);
  }
  return isExplicitAuthTokenRemovalStorageEvent(event, now);
}

export function isExplicitAuthLogoutMarkerStorageEvent(
  event: Pick<StorageEvent, 'key' | 'newValue'>,
  now = Date.now()
) {
  return (
    event.key === EXPLICIT_LOGOUT_STORAGE_KEY &&
    isRecentAuthTransitionSignal(event.newValue, now)
  );
}

export function adoptRejectedAuthSessionStorageEvent(
  event: Pick<
    StorageEvent,
    'key' | 'newValue' | 'oldValue' | 'storageArea'
  >
) {
  const storage = event.storageArea || getLocalStorage();
  if (!storage) return false;

  if (event.key === REJECTED_AUTH_SESSION_STORAGE_KEY) {
    const memoryTokenBeforeRejection = inMemoryAuthToken;
    try {
      if (
        !hasActiveAuthTransitionSignal(event.newValue) ||
        storage.getItem(REJECTED_AUTH_SESSION_STORAGE_KEY) !== event.newValue
      ) {
        return false;
      }
      // Consult the shared marker through readAuthToken so a suspended tab
      // cannot repair that credential from its page-memory fallback.
      readAuthToken();
      if (!hasRejectedAuthSessionMarkerInStorage(storage)) return false;
      if (memoryTokenBeforeRejection) {
        noteNavAuthTokenChange({
          previousToken: memoryTokenBeforeRejection,
          nextToken: null
        });
      }
      return true;
    } catch {
      // The StorageEvent itself is authoritative even if mobile storage has
      // become temporarily unreadable. Retire only matching page memory; a
      // newer credential must survive the delayed event.
      if (
        memoryTokenBeforeRejection &&
        !authTransitionSignalTargetsToken(
          event.newValue,
          memoryTokenBeforeRejection
        )
      ) {
        return false;
      }
      inMemoryAuthToken = '';
      beginAuthTokenRemoval(memoryTokenBeforeRejection);
      if (memoryTokenBeforeRejection) {
        noteNavAuthTokenChange({
          previousToken: memoryTokenBeforeRejection,
          nextToken: null
        });
      }
      return hasActiveAuthTransitionSignal(event.newValue);
    }
  }

  if (
    event.key !== AUTH_TOKEN_STORAGE_KEY ||
    event.newValue ||
    !event.oldValue
  ) {
    return false;
  }

  try {
    if (!hasRejectedAuthSessionMarkerInStorage(storage)) {
      return false;
    }

    // Shared durable storage wins over an old page-lifetime value. A login
    // that replaced the rejected token while this event was queued survives.
    const durableToken = storage.getItem(AUTH_TOKEN_STORAGE_KEY) || '';
    const currentToken = durableToken || inMemoryAuthToken;
    if (currentToken && currentToken !== event.oldValue) return false;

    inMemoryAuthToken = '';
    beginAuthTokenRemoval(event.oldValue);
    if (durableToken === event.oldValue) {
      storage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    }
    const remainingToken = storage.getItem(AUTH_TOKEN_STORAGE_KEY) || '';
    if (remainingToken) {
      if (remainingToken !== event.oldValue) {
        adoptAuthTokenStorageChange(remainingToken);
        return false;
      }
    } else {
      finishAuthTokenRemoval();
    }
  } catch {
    if (inMemoryAuthToken && inMemoryAuthToken !== event.oldValue) {
      return false;
    }
    inMemoryAuthToken = '';
    beginAuthTokenRemoval(event.oldValue);
  }

  noteNavAuthTokenChange({
    previousToken: event.oldValue,
    nextToken: null
  });
  return true;
}

if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('storage', (event) => {
    if (isExplicitAuthLogoutStorageEvent(event)) {
      // The marker is written before token removal. Treat it as the canonical
      // cross-tab logout signal even when removeItem('token') is a no-op and
      // therefore produces no second StorageEvent.
      adoptAuthTokenStorageChange(null);
      return;
    }
    if (event.key !== AUTH_TOKEN_STORAGE_KEY) return;
    if (event.newValue) {
      // A concrete replacement credential is an authoritative account
      // transition. Canonical HTTP session state still determines its user.
      adoptAuthTokenStorageChange(event.newValue);
      return;
    }
    // An unexplained removal is not a logout verdict. Keep the confirmed
    // page-lifetime token so readAuthToken can repair durable storage.
  });
}

let sessionTwinkleDeviceId = '';

export function getTwinkleDeviceId() {
  const storage = getLocalStorage();

  if (storage) {
    try {
      const existingId = storage.getItem('twinkleDeviceId');
      if (existingId) return existingId;
    } catch {
      // Fall back to an in-memory id for browsers with restricted storage.
    }
  }

  if (sessionTwinkleDeviceId) return sessionTwinkleDeviceId;

  const randomId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const deviceId = `web:${randomId}`;
  sessionTwinkleDeviceId = deviceId;

  if (storage) {
    try {
      storage.setItem('twinkleDeviceId', deviceId);
    } catch {
      // The session id is still stable for this page lifetime.
    }
  }

  return deviceId;
}
