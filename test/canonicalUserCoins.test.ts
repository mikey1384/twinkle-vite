import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyCanonicalCoinsAndReconcile,
  isCurrentBrowserSessionUser
} from '../src/helpers/canonicalUserCoins';

test('coin reconciliation requires an authenticated user identity', () => {
  assert.equal(isCurrentBrowserSessionUser(0), false);
});

test('overlapping coin updates finish on the latest writer-backed balance', async () => {
  const applied: number[] = [];
  let canonicalCoins = 900;
  let loadCount = 0;
  let releaseFirstLoad = () => {};
  const firstLoadGate = new Promise<void>((resolve) => {
    releaseFirstLoad = resolve;
  });
  const loadCoins = async () => {
    loadCount += 1;
    const snapshot = canonicalCoins;
    if (loadCount === 1) {
      await firstLoadGate;
    }
    return snapshot;
  };
  const onSetUserState = ({
    newState
  }: {
    userId: number;
    newState: { twinkleCoins: number };
  }) => {
    applied.push(newState.twinkleCoins);
  };

  const first = applyCanonicalCoinsAndReconcile({
    coins: 900,
    loadCoins,
    onSetUserState,
    userId: 1
  });
  const second = applyCanonicalCoinsAndReconcile({
    coins: 800,
    loadCoins,
    onSetUserState,
    userId: 1
  });

  canonicalCoins = 800;
  releaseFirstLoad();
  await Promise.all([first, second]);

  assert.equal(applied.at(-1), 800);
  assert.equal(loadCount, 2);
});

test('coin reconciliation is isolated by account', async () => {
  const applied: Array<{ userId: number; coins: number }> = [];
  const onSetUserState = ({
    userId,
    newState
  }: {
    userId: number;
    newState: { twinkleCoins: number };
  }) => {
    applied.push({ userId, coins: newState.twinkleCoins });
  };

  await Promise.all([
    applyCanonicalCoinsAndReconcile({
      coins: 90,
      loadCoins: async () => 95,
      onSetUserState,
      userId: 1
    }),
    applyCanonicalCoinsAndReconcile({
      coins: 40,
      loadCoins: async () => 45,
      onSetUserState,
      userId: 2
    })
  ]);

  assert.equal(applied.filter(({ userId }) => userId === 1).at(-1)?.coins, 95);
  assert.equal(applied.filter(({ userId }) => userId === 2).at(-1)?.coins, 45);
});

test('an in-flight reconciliation cannot cross an account boundary', async () => {
  const previousLocalStorage = globalThis.localStorage;
  let currentUserId = '1';
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem(key: string) {
        return key === 'userId' ? currentUserId : null;
      }
    }
  });

  const applied: number[] = [];
  let releaseLoad = () => {};
  const loadGate = new Promise<void>((resolve) => {
    releaseLoad = resolve;
  });

  try {
    const reconciliation = applyCanonicalCoinsAndReconcile({
      coins: 90,
      loadCoins: async () => {
        await loadGate;
        return 40;
      },
      onSetUserState: ({ newState }) => {
        applied.push(newState.twinkleCoins);
      },
      userId: 1
    });

    currentUserId = '2';
    releaseLoad();
    await reconciliation;

    assert.deepEqual(applied, [90]);
  } finally {
    if (previousLocalStorage === undefined) {
      Reflect.deleteProperty(globalThis, 'localStorage');
    } else {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: previousLocalStorage
      });
    }
  }
});
