import { createContext, useContext, useEffect, useState } from 'react';

// The Grammarbles page goes fixed over the site's bars on a phone on its side
// and during a round (z-index 2147481000), above the site's #modal layer
// (Mikey 10-11: a Challenge opened behind the page). While it is fixed, its
// dialogs mount inside it; otherwise they use #modal as everywhere else.
export const GamePageContext = createContext<HTMLElement | null>(null);

export function fixedPage(page: HTMLElement | null) {
  return page && getComputedStyle(page).position === 'fixed' ? page : undefined;
}

export function useGamePortalTarget() {
  const page = useContext(GamePageContext);
  // a phone turned while a dialog is open: look again (the page goes fixed
  // or back on its side)
  const [, setTurns] = useState(0);
  useEffect(() => {
    const look = () => setTurns((n) => n + 1);
    window.addEventListener('resize', look);
    window.addEventListener('orientationchange', look);
    return () => {
      window.removeEventListener('resize', look);
      window.removeEventListener('orientationchange', look);
    };
  }, []);
  return fixedPage(page);
}
