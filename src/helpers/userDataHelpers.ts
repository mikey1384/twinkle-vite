import { noteNavAuthTokenChange } from './navTabOrder';

let inMemoryAuthToken = '';
let authTokenRemovalPending = false;

const AUTH_TOKEN_STORAGE_KEY = 'token';
const EXPLICIT_LOGOUT_STORAGE_KEY = 'twinkleExplicitLogoutAt';
const EXPLICIT_LOGOUT_SIGNAL_MAX_AGE_MS = 60_000;
const EXPLICIT_LOGOUT_SIGNAL_CLOCK_SKEW_MS = 5_000;

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
      usedMemoryFallback:
        !authTokenRemovalPending && !!inMemoryAuthToken
    };
  }

  try {
    if (authTokenRemovalPending) {
      storage.removeItem('token');
      if (!storage.getItem('token')) {
        authTokenRemovalPending = false;
      }
      return {
        storageAvailable: true,
        token: '',
        usedMemoryFallback: false
      };
    }

    const storedToken = storage.getItem('token') || '';
    if (storedToken) {
      inMemoryAuthToken = storedToken;
      return {
        storageAvailable: true,
        token: storedToken,
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
  authTokenRemovalPending = false;
  try {
    // A newly confirmed login/account switch retires any prior explicit-logout
    // signal before another tab can mistake a later storage cleanup for that
    // older user action.
    storage.removeItem(EXPLICIT_LOGOUT_STORAGE_KEY);
  } catch {
    // The token round trip above is the persistence boundary. This marker is
    // only cross-tab intent metadata and must not invalidate a saved login.
  }
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
      } catch {
        // This tab still logs out locally. Other tabs conservatively preserve
        // their confirmed sessions when logout intent cannot be proven.
      }
    }
    inMemoryAuthToken = '';
    authTokenRemovalPending = true;
  }
  if (!storage) {
    return false;
  }

  try {
    const previousValue =
      key === 'token'
        ? storage.getItem(key) || previousMemoryToken || ''
        : '';
    storage.removeItem(key);
    if (key === 'token' && !storage.getItem(key)) {
      authTokenRemovalPending = false;
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

export function resetAuthTokenMemoryForTests() {
  inMemoryAuthToken = '';
  authTokenRemovalPending = false;
}

export function adoptAuthTokenStorageChange(nextToken: string | null) {
  // A StorageEvent is emitted only for an actual same-origin mutation made
  // by another document. Unlike an ordinary localStorage read, it is an
  // authoritative account transition and may safely replace the page-lifetime
  // fallback credential.
  inMemoryAuthToken = nextToken || '';
  authTokenRemovalPending = false;
}

export function isExplicitAuthTokenRemovalStorageEvent(
  event: Pick<StorageEvent, 'key' | 'newValue' | 'storageArea'>,
  now = Date.now()
) {
  if (event.key !== AUTH_TOKEN_STORAGE_KEY || event.newValue) return false;
  const storage = event.storageArea || getLocalStorage();
  if (!storage) return false;
  try {
    const signalledAt = Number(storage.getItem(EXPLICIT_LOGOUT_STORAGE_KEY));
    return (
      Number.isFinite(signalledAt) &&
      signalledAt > 0 &&
      signalledAt <= now + EXPLICIT_LOGOUT_SIGNAL_CLOCK_SKEW_MS &&
      now - signalledAt <= EXPLICIT_LOGOUT_SIGNAL_MAX_AGE_MS
    );
  } catch {
    return false;
  }
}

if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('storage', (event) => {
    if (event.key !== AUTH_TOKEN_STORAGE_KEY) return;
    if (event.newValue) {
      // A concrete replacement credential is an authoritative account
      // transition. Canonical HTTP session state still determines its user.
      adoptAuthTokenStorageChange(event.newValue);
      return;
    }
    if (isExplicitAuthTokenRemovalStorageEvent(event)) {
      adoptAuthTokenStorageChange(null);
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
