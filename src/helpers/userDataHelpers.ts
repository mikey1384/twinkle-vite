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

export function setStoredItem(key: string, value: string) {
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

export function removeStoredItem(key: string) {
  const storage = getLocalStorage();
  if (!storage) {
    return false;
  }

  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
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
