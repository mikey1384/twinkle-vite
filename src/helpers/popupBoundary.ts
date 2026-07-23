import type { RefObject } from 'react';

export type PopupBoundaryRef =
  | RefObject<HTMLElement | null>
  | HTMLElement
  | null
  | undefined;

export function popupTargetIsOutside(
  refs: PopupBoundaryRef[],
  target: Node | null
) {
  const nodes: HTMLElement[] = [];
  for (const ref of refs) {
    if (!ref) continue;
    const candidate = 'current' in ref ? ref.current : ref;
    if (candidate) nodes.push(candidate);
  }

  if (!nodes.length) return false;
  if (!target) return true;
  return !nodes.some((node) => node.contains(target));
}
