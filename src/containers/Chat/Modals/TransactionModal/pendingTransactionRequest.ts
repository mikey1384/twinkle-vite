const pendingTransactionStoragePrefix = 'twinkle:pending-transaction';
const memoryRequestIds = new Map<string, string>();

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface PendingRequestDependencies {
  storage?: StorageLike | null;
  createRequestId?: () => string;
  runExclusive?: <T>(key: string, operation: () => T | Promise<T>) => Promise<T>;
}

export async function getTransactionClientRequestId({
  userId,
  requestPayload,
  dependencies
}: {
  userId: number;
  requestPayload: Record<string, unknown>;
  dependencies?: PendingRequestDependencies;
}) {
  const createRequestId =
    dependencies?.createRequestId || createTransactionClientRequestId;
  const fingerprint = JSON.stringify(requestPayload);
  const storageKey = getPendingRequestStorageKey({ userId, fingerprint });
  const storage =
    dependencies && 'storage' in dependencies
      ? dependencies.storage
      : getBrowserStorage();
  const runExclusive = dependencies?.runExclusive || runWithBrowserLock;

  return runExclusive(storageKey, () => {
    const storedRequestId = readStoredRequestId(storage, storageKey);
    if (storedRequestId) {
      memoryRequestIds.set(storageKey, storedRequestId);
      return storedRequestId;
    }
    const memoryRequestId = memoryRequestIds.get(storageKey);
    if (memoryRequestId) {
      writeStoredRequestId(storage, storageKey, memoryRequestId);
      return memoryRequestId;
    }
    const clientRequestId = createRequestId();
    memoryRequestIds.set(storageKey, clientRequestId);
    writeStoredRequestId(storage, storageKey, clientRequestId);
    return readStoredRequestId(storage, storageKey) || clientRequestId;
  });
}

export async function clearPendingTransactionRequest({
  userId,
  requestPayload,
  clientRequestId,
  dependencies
}: {
  userId: number;
  requestPayload: Record<string, unknown>;
  clientRequestId: string;
  dependencies?: Pick<PendingRequestDependencies, 'storage' | 'runExclusive'>;
}) {
  const fingerprint = JSON.stringify(requestPayload);
  const storageKey = getPendingRequestStorageKey({ userId, fingerprint });
  const storage =
    dependencies && 'storage' in dependencies
      ? dependencies.storage
      : getBrowserStorage();
  const runExclusive = dependencies?.runExclusive || runWithBrowserLock;

  await runExclusive(storageKey, () => {
    if (memoryRequestIds.get(storageKey) === clientRequestId) {
      memoryRequestIds.delete(storageKey);
    }
    try {
      if (storage?.getItem(storageKey) === clientRequestId) {
        storage.removeItem(storageKey);
      }
    } catch {
      // The in-memory entry was still cleared. A later successful storage
      // access can reconcile the durable entry by its exact request id.
    }
  });
}

function createTransactionClientRequestId() {
  return typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getPendingRequestStorageKey({
  userId,
  fingerprint
}: {
  userId: number;
  fingerprint: string;
}) {
  return `${pendingTransactionStoragePrefix}:${userId}:${encodeURIComponent(
    fingerprint
  )}`;
}

function getBrowserStorage() {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function readStoredRequestId(
  storage: StorageLike | null | undefined,
  storageKey: string
) {
  try {
    return storage?.getItem(storageKey) || null;
  } catch {
    return null;
  }
}

function writeStoredRequestId(
  storage: StorageLike | null | undefined,
  storageKey: string,
  clientRequestId: string
) {
  try {
    storage?.setItem(storageKey, clientRequestId);
  } catch {
    // The module-level map preserves same-page retries when browser storage is
    // unavailable. Durable cross-page recovery necessarily requires storage.
  }
}

async function runWithBrowserLock<T>(
  key: string,
  operation: () => T | Promise<T>
): Promise<T> {
  if (
    typeof navigator !== 'undefined' &&
    navigator.locks &&
    typeof navigator.locks.request === 'function'
  ) {
    return navigator.locks.request(key, operation);
  }
  return operation();
}
