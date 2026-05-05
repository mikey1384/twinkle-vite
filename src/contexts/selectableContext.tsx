import React, {
  useCallback,
  useContext as useReactContext,
  useLayoutEffect,
  useReducer,
  useRef,
  type ReactNode
} from 'react';

interface SelectableSnapshot<T> {
  value: T;
  version: number;
}

interface SelectableStore<T> {
  listeners: Set<() => void>;
  notifyQueued: boolean;
  notifiedVersion: number;
  snapshot: SelectableSnapshot<T>;
  subscribe: (listener: () => void) => () => void;
}

function queueSelectableStoreNotification<T>(store: SelectableStore<T>) {
  if (store.notifyQueued) {
    return;
  }
  store.notifyQueued = true;
  const notify = () => {
    store.notifyQueued = false;
    for (const listener of Array.from(store.listeners)) {
      listener();
    }
  };
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(notify);
    return;
  }
  void Promise.resolve().then(notify);
}

export interface SelectableContext<T> {
  Provider: React.FC<{ value: T; children?: ReactNode }>;
  _defaultStore: SelectableStore<T>;
  _storeContext: React.Context<SelectableStore<T> | null>;
}

function createSelectableStore<T>(value: T): SelectableStore<T> {
  const store: SelectableStore<T> = {
    listeners: new Set(),
    notifyQueued: false,
    notifiedVersion: 0,
    snapshot: {
      value,
      version: 0
    },
    subscribe(listener) {
      store.listeners.add(listener);
      return () => {
        store.listeners.delete(listener);
      };
    }
  };
  return store;
}

export function createContext<T>(defaultValue: T): SelectableContext<T> {
  const StoreContext =
    React.createContext<SelectableStore<T> | null>(null);
  const defaultStore = createSelectableStore(defaultValue);

  function Provider({
    children,
    value
  }: {
    value: T;
    children?: ReactNode;
  }) {
    const storeRef = useRef<SelectableStore<T> | null>(null);
    if (!storeRef.current) {
      storeRef.current = createSelectableStore(value);
    }
    const store = storeRef.current;

    useLayoutEffect(() => {
      if (Object.is(store.snapshot.value, value)) {
        return;
      }
      const nextVersion = store.snapshot.version + 1;
      store.snapshot = {
        value,
        version: nextVersion
      };
      if (store.notifiedVersion >= nextVersion) {
        return;
      }
      store.notifiedVersion = nextVersion;
      queueSelectableStoreNotification(store);
    }, [store, value]);

    return (
      <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
    );
  }

  return {
    Provider,
    _defaultStore: defaultStore,
    _storeContext: StoreContext
  };
}

export function useContextSelector<T, S>(
  context: SelectableContext<T>,
  selector: (value: T) => S
): S {
  const store =
    useReactContext(context._storeContext) || context._defaultStore;
  const selectorRef = useRef(selector);
  const selectedRef = useRef<S | null>(null);
  const hasSelectedRef = useRef(false);
  const [, forceUpdate] = useReducer((version) => version + 1, 0);
  selectorRef.current = selector;

  const selected = selector(store.snapshot.value);

  useLayoutEffect(() => {
    selectedRef.current = selected;
    hasSelectedRef.current = true;
  });

  const checkForUpdates = useCallback(() => {
    const nextSelected = selectorRef.current(store.snapshot.value);
    if (hasSelectedRef.current && Object.is(selectedRef.current, nextSelected)) {
      return;
    }
    selectedRef.current = nextSelected;
    hasSelectedRef.current = true;
    forceUpdate();
  }, [store]);

  useLayoutEffect(() => {
    checkForUpdates();
    return store.subscribe(checkForUpdates);
  }, [checkForUpdates, store]);

  return selected;
}

export function useContext<T>(context: SelectableContext<T>): T {
  return useContextSelector(context, (value) => value);
}
