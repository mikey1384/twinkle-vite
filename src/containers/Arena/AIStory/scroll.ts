import { createContext, useContext, useLayoutEffect } from 'react';

export const AIStoryScrollContext = createContext(() => {});

// Nested page views used to get a fresh scroll surface from their modal.
// They now share the story panel (desktop) and the Arena page (mobile).
export function useAIStoryViewScroll(view: string | number | boolean) {
  const resetScroll = useContext(AIStoryScrollContext);
  useLayoutEffect(resetScroll, [resetScroll, view]);
}
