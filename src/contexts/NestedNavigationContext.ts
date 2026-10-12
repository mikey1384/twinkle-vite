import { createContext, useContext } from 'react';

// Lets links nested deep inside a surface (for example the reference lines in
// a compact comment preview) navigate through that surface's own handler.
// The home feed card provides its nested-navigation handler here, so those
// taps save the scroll anchor, record the owner trace and respect the
// popup-dismiss guard. Outside a provider the value is null and callers fall
// back to plain router navigation.
export type NestedNavigate = (
  path: string,
  sourceElement: HTMLElement | null
) => void;

export const NestedNavigationContext = createContext<NestedNavigate | null>(
  null
);

export function useNestedNavigate() {
  return useContext(NestedNavigationContext);
}
