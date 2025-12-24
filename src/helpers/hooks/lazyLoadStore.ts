// External store for lazy load visibility state
// Using useSyncExternalStore pattern to isolate re-renders to individual components

type Listener = () => void;

const visibilityState = new Map<string, boolean>();
const listeners = new Map<string, Set<Listener>>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

export const lazyLoadStore = {
  getVisibility(id: string): boolean {
    return visibilityState.get(id) ?? false;
  },

  setVisibility(id: string, visible: boolean, delay = 0): void {
    // Clear any pending timer for this id
    const existingTimer = timers.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
      timers.delete(id);
    }

    if (visible) {
      // Show immediately
      if (visibilityState.get(id) !== true) {
        visibilityState.set(id, true);
        this.notify(id);
      }
    } else {
      // Hide after delay
      if (delay > 0) {
        const timer = setTimeout(() => {
          timers.delete(id);
          if (visibilityState.get(id) !== false) {
            visibilityState.set(id, false);
            this.notify(id);
          }
        }, delay);
        timers.set(id, timer);
      } else {
        if (visibilityState.get(id) !== false) {
          visibilityState.set(id, false);
          this.notify(id);
        }
      }
    }
  },

  notify(id: string): void {
    const idListeners = listeners.get(id);
    if (idListeners) {
      idListeners.forEach((listener) => listener());
    }
  },

  subscribe(id: string, callback: Listener): () => void {
    if (!listeners.has(id)) {
      listeners.set(id, new Set());
    }
    listeners.get(id)!.add(callback);

    return () => {
      const idListeners = listeners.get(id);
      if (idListeners) {
        idListeners.delete(callback);
        if (idListeners.size === 0) {
          listeners.delete(id);
          // Clean up state when no more subscribers
          visibilityState.delete(id);
          const timer = timers.get(id);
          if (timer) {
            clearTimeout(timer);
            timers.delete(id);
          }
        }
      }
    };
  },

  // For debugging
  getState(): Record<string, boolean> {
    return Object.fromEntries(visibilityState);
  }
};
