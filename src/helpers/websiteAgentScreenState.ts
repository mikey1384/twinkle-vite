import { useEffect } from 'react';

// State a component on screen hands Zero and Ciel directly, exactly as it
// holds it (a Wordle's guesses and their colours, the letters typed so far),
// instead of their reading it off the page. Only what the user can already
// see belongs here, never hidden answers. Kept while the component is
// mounted; read_page returns it as screenState.
const entries = new Map<string, { value: unknown; background: boolean }>();

// background: state about the page itself (which chat is open, today's
// progress), left out while a window (a game, a dialog) covers the page.
export function useAgentScreenState(
  key: string,
  value: unknown,
  { background = false }: { background?: boolean } = {}
) {
  const json = JSON.stringify(value ?? null);
  useEffect(() => {
    entries.set(key, { value: JSON.parse(json), background });
    return () => {
      entries.delete(key);
    };
  }, [key, json, background]);
}

// Only what is there: a component with nothing to report is left out.
export function readAgentScreenState({
  windowOpen = false
}: { windowOpen?: boolean } = {}) {
  const shown = Array.from(entries).filter(
    ([, entry]) => entry.value !== null && !(windowOpen && entry.background)
  );
  return shown.length
    ? Object.fromEntries(shown.map(([key, entry]) => [key, entry.value]))
    : null;
}
