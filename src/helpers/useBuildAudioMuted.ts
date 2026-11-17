import { useSyncExternalStore } from 'react';

const changeEvent = 'twinkle-build-audio-preference';
const memory = new Map<string, boolean>();

function subscribe(listener: () => void) {
  window.addEventListener('storage', listener);
  window.addEventListener(changeEvent, listener);
  return () => {
    window.removeEventListener('storage', listener);
    window.removeEventListener(changeEvent, listener);
  };
}

// A device preference, isolated by member (including a separate guest key).
// The in-memory fallback also works when browser storage is unavailable.
export default function useBuildAudioMuted(userId: number | null | undefined) {
  const key = `twinkle:build-audio-muted:${userId || 'guest'}`;
  function read() {
    if (memory.has(key)) return memory.get(key) === true;
    try {
      return window.localStorage.getItem(key) === 'true';
    } catch {
      return memory.get(key) === true;
    }
  }
  const muted = useSyncExternalStore(subscribe, read, () => false);
  function setMuted(next: boolean) {
    try {
      window.localStorage.setItem(key, String(next));
      memory.delete(key);
    } catch {
      memory.set(key, next);
      // Keep the control usable for this session when storage is blocked.
    }
    window.dispatchEvent(new Event(changeEvent));
  }
  return [muted, setMuted] as const;
}
