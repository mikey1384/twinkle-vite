import { useRef, type RefObject } from 'react';
import {
  clearSavedScrollAnchors,
  useScrollAnchorRestoration
} from '~/helpers/hooks/useScrollAnchorRestoration';

export function useScrollAnchor({
  anchorKey,
  containerRef,
  feedsReady
}: {
  anchorKey: string;
  containerRef: RefObject<HTMLElement | null>;
  feedsReady: boolean;
}) {
  const activeAnchorKeyRef = useRef(anchorKey);
  // The home filter tabs are rendered in-flow above the feed, so they are only
  // reachable at the top of the feed: an anchor key change while Stories stays
  // mounted is always a tab/subfilter/order switch, and arriving at a tab that
  // way should show the newest posts, never a stale saved position. Restore
  // still applies on fresh mounts with an unchanged key (back-navigation from
  // a content page, Posts <-> People side-menu switches).
  if (activeAnchorKeyRef.current !== anchorKey) {
    clearSavedScrollAnchors(activeAnchorKeyRef.current, anchorKey);
    activeAnchorKeyRef.current = anchorKey;
  }

  useScrollAnchorRestoration({
    anchorKey,
    containerRef,
    initialScroll: { type: 'top' },
    itemsReady: feedsReady
  });
}
