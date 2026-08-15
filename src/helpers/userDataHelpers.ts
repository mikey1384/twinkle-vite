import { noteNavAuthTokenChange } from './navTabOrder';

let inMemoryAuthToken = '';
let authTokenRemovalPending = false;

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
  const storage = getLocalStorage();
  if (!storage) {
    return false;
  }

  try {
    const previousValue =
      key === 'token'
        ? storage.getItem(key) || inMemoryAuthToken || ''
        : '';
    storage.setItem(key, value);
    if (key === 'token') {
      inMemoryAuthToken = value;
      authTokenRemovalPending = false;
    }
    if (key === 'token' && previousValue !== value) {
      noteNavAuthTokenChange({
        previousToken: previousValue,
        nextToken: value,
        preserveSameUserSession: options.preserveNavSession
      });
    }
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
  if (!setStoredItem('token', token, options)) return false;
  const storage = getLocalStorage();
  if (!storage) return false;
  try {
    return storage.getItem('token') === token;
  } catch {
    return false;
  }
}

export function removeStoredItem(key: string) {
  const storage = getLocalStorage();
  const previousMemoryToken = key === 'token' ? inMemoryAuthToken : '';
  if (key === 'token') {
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

if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('storage', (event) => {
    if (event.key !== 'token') return;
    // A real same-origin change in another tab is authoritative. Explicit
    // logout clears the shadow token; login/account switching adopts the new
    // token so a later route read cannot restore stale credentials.
    inMemoryAuthToken = event.newValue || '';
    authTokenRemovalPending = false;
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
