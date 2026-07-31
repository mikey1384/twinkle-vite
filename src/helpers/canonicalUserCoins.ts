interface CanonicalCoinReconciliation {
  latest: {
    loadCoins: () => Promise<number>;
    onSetUserState: (value: {
      userId: number;
      newState: { twinkleCoins: number };
    }) => void;
  };
  queued: boolean;
  runner: Promise<void> | null;
}

const reconciliations = new Map<number, CanonicalCoinReconciliation>();

export function isCurrentBrowserSessionUser(userId: number) {
  if (!(userId > 0)) return false;
  if (typeof globalThis.localStorage === 'undefined') return true;
  return Number(globalThis.localStorage.getItem('userId') || 0) === userId;
}

export function applyCanonicalCoinsAndReconcile({
  coins,
  loadCoins,
  onSetUserState,
  userId
}: {
  coins?: number;
  loadCoins: () => Promise<number>;
  onSetUserState: (value: {
    userId: number;
    newState: { twinkleCoins: number };
  }) => void;
  userId: number;
}) {
  if (!isCurrentBrowserSessionUser(userId)) {
    return Promise.resolve();
  }

  if (Number.isFinite(coins)) {
    onSetUserState({
      userId,
      newState: { twinkleCoins: Number(coins) }
    });
  }

  const reconciliation =
    reconciliations.get(userId) ||
    ({
      latest: { loadCoins, onSetUserState },
      queued: false,
      runner: null
    } satisfies CanonicalCoinReconciliation);
  reconciliation.latest = { loadCoins, onSetUserState };
  reconciliation.queued = true;
  reconciliations.set(userId, reconciliation);

  return ensureCanonicalCoinReconciliationRunner({
    reconciliation,
    userId
  });
}

function ensureCanonicalCoinReconciliationRunner({
  reconciliation,
  userId
}: {
  reconciliation: CanonicalCoinReconciliation;
  userId: number;
}) {
  if (reconciliation.runner) return reconciliation.runner;
  reconciliation.runner = runCanonicalCoinReconciliation({
    reconciliation,
    userId
  }).finally(() => {
    reconciliation.runner = null;
    if (reconciliation.queued) {
      void ensureCanonicalCoinReconciliationRunner({
        reconciliation,
        userId
      });
    } else {
      reconciliations.delete(userId);
    }
  });
  return reconciliation.runner;
}

async function runCanonicalCoinReconciliation({
  reconciliation,
  userId
}: {
  reconciliation: CanonicalCoinReconciliation;
  userId: number;
}) {
  while (reconciliation.queued) {
    reconciliation.queued = false;
    if (!isCurrentBrowserSessionUser(userId)) continue;
    const { loadCoins, onSetUserState } = reconciliation.latest;
    try {
      const coins = await loadCoins();
      if (isCurrentBrowserSessionUser(userId) && Number.isFinite(coins)) {
        onSetUserState({
          userId,
          newState: { twinkleCoins: Number(coins) }
        });
      }
    } catch (error) {
      console.error('Failed to reconcile canonical coin balance:', error);
    }
  }
}
