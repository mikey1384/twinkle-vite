import { useEffect } from 'react';
import { enterWelcomeFocusSurface } from './store';

// A running game or sitting the welcome greeter and tour must never cover
// (an Arena battle or drill, a Grammarbles round): while `active`, they wait.
export function useWelcomeFocusSurface(active = true) {
  useEffect(() => (active ? enterWelcomeFocusSurface() : undefined), [active]);
}
