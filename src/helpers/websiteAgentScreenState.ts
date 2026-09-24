import { useEffect } from 'react';

// State a component on screen hands Zero and Ciel directly, exactly as it
// holds it (a Wordle's guesses and their colours, the letters typed so far),
// instead of their reading it off the page. Only what the user can already
// see belongs here, never hidden answers. Kept while the component is
// mounted; read_page returns it as screenState.
const entries = new Map<string, unknown>();

export function useAgentScreenState(key: string, value: unknown) {
  const json = JSON.stringify(value ?? null);
  useEffect(() => {
    entries.set(key, JSON.parse(json));
    return () => {
      entries.delete(key);
    };
  }, [key, json]);
}

export function readAgentScreenState() {
  return entries.size ? Object.fromEntries(entries) : null;
}
