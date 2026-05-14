import type { RefObject } from 'react';
import { useScrollAnchorRestoration } from '~/helpers/hooks/useScrollAnchorRestoration';

export function useScrollAnchor({
  anchorKey,
  containerRef,
  feedsReady
}: {
  anchorKey: string;
  containerRef: RefObject<HTMLElement | null>;
  feedsReady: boolean;
}) {
  useScrollAnchorRestoration({
    anchorKey,
    containerRef,
    initialScroll: { type: 'top' },
    itemsReady: feedsReady
  });
}
