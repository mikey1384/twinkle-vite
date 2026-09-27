import { useSyncExternalStore } from 'react';
import { phoneLandscapeMediaQuery } from '~/constants/css';

function getMediaQueryList() {
  if (typeof window === 'undefined' || !window.matchMedia) return null;
  return window.matchMedia(phoneLandscapeMediaQuery);
}

function subscribe(onChange: () => void) {
  const mediaQueryList = getMediaQueryList();
  if (!mediaQueryList) return () => {};
  mediaQueryList.addEventListener('change', onChange);
  return () => mediaQueryList.removeEventListener('change', onChange);
}

function getSnapshot() {
  return Boolean(getMediaQueryList()?.matches);
}

function getServerSnapshot() {
  return false;
}

// True while a phone is held sideways (see phoneLandscapeMediaQuery). Follows
// rotation live through the media query's change event.
export default function usePhoneLandscape() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
