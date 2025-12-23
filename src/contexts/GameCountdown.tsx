import { useState, useEffect } from 'react';

type Listener = () => void;

interface CountdownStore {
  values: Record<string, number | null>;
  listeners: Set<Listener>;
  set: (channelId: number, gameType: 'chess' | 'omok', value: number | null) => void;
  get: (channelId: number, gameType: 'chess' | 'omok') => number | null;
  subscribe: (listener: Listener) => () => void;
}

// Simple store that doesn't cause React re-renders on its own
export const countdownStore: CountdownStore = {
  values: {},
  listeners: new Set(),

  set(channelId, gameType, value) {
    const key = `${channelId}-${gameType}`;
    if (this.values[key] !== value) {
      this.values[key] = value;
      this.listeners.forEach((l) => l());
    }
  },

  get(channelId, gameType) {
    return this.values[`${channelId}-${gameType}`] ?? null;
  },

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
};

// Hook that subscribes to countdown changes - only components using this will re-render
export function useCountdownValue(
  channelId: number | undefined,
  gameType: 'chess' | 'omok'
): number | null {
  const [value, setValue] = useState(() =>
    channelId ? countdownStore.get(channelId, gameType) : null
  );

  useEffect(() => {
    if (!channelId) return;
    // Set initial value
    setValue(countdownStore.get(channelId, gameType));
    // Subscribe to changes
    return countdownStore.subscribe(() => {
      setValue(countdownStore.get(channelId, gameType));
    });
  }, [channelId, gameType]);

  return value;
}
