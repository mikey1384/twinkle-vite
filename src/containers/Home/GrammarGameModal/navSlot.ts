import { createContext } from 'react';

// A spot in Grammarbles' top bar a game can fill with its own status (the
// Quest map puts its gold / nemesis / rule book / sound chips there), so the
// game below gets the full height of the screen.
export const NavSlotContext = createContext<HTMLElement | null>(null);
