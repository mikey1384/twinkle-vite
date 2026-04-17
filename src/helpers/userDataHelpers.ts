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
export function getStoredItem(key: string, defaultValue = ''): string {
  if (typeof localStorage === 'undefined') {
    return defaultValue;
  }
  let item = '';
  try {
    item = localStorage.getItem(key) || '';
  } catch {
    return defaultValue;
  }
  return item || defaultValue;
}

let sessionTwinkleDeviceId = '';

export function getTwinkleDeviceId() {
  if (typeof localStorage !== 'undefined') {
    try {
      const existingId = localStorage.getItem('twinkleDeviceId');
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

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('twinkleDeviceId', deviceId);
    } catch {
      // The session id is still stable for this page lifetime.
    }
  }

  return deviceId;
}
