import React, {
  useCallback,
  useContext as useReactContext,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode
} from 'react';

interface SelectableSnapshot<T> {
  value: T;
  version: number;
}

interface SelectableStore<T> {
  listeners: Set<() => void>;
  notifiedVersion: number;
  snapshot: SelectableSnapshot<T>;
  subscribe: (listener: () => void) => () => void;
}

export interface SelectableContext<T> {
  Provider: React.FC<{ value: T; children?: ReactNode }>;
  _defaultStore: SelectableStore<T>;
  _storeContext: React.Context<SelectableStore<T> | null>;
}

function createSelectableStore<T>(value: T): SelectableStore<T> {
  const store: SelectableStore<T> = {
    listeners: new Set(),
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
      for (const listener of Array.from(store.listeners)) {
        listener();
      }
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
  const selectionRef = useRef<{
    selected: S;
    selector: (value: T) => S;
    snapshot: SelectableSnapshot<T>;
  } | null>(null);
  selectorRef.current = selector;

  const subscribe = useCallback(
    (listener: () => void) => store.subscribe(listener),
    [store]
  );
  const getSelectionSnapshot = useCallback(() => {
    const snapshot = store.snapshot;
    const currentSelector = selectorRef.current;
    const previous = selectionRef.current;
    if (
      previous?.snapshot === snapshot &&
      previous.selector === currentSelector
    ) {
      return previous.selected;
    }

    const selected = currentSelector(snapshot.value);
    if (previous && Object.is(previous.selected, selected)) {
      selectionRef.current = {
        selected: previous.selected,
        selector: currentSelector,
        snapshot
      };
      return previous.selected;
    }

    selectionRef.current = {
      selected,
      selector: currentSelector,
      snapshot
    };
    return selected;
  }, [store]);

  return useSyncExternalStore(
    subscribe,
    getSelectionSnapshot,
    getSelectionSnapshot
  );
}

export function useContext<T>(context: SelectableContext<T>): T {
  return useContextSelector(context, (value) => value);
}
