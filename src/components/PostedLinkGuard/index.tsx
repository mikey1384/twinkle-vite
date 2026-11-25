import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useAppContext, useKeyContext } from '~/contexts';
import { lazyWithRetry } from '~/helpers/lazyImportHelpers';
import { pageLinkBlocklist, setLinkBlocklistFetcher } from '~/helpers/pageLinkBlocklist';
import { postedLinkGuard } from '~/helpers/pagePostedLinkGuard';
import {
  POSTED_LINK_REFRESH_MS,
  type PostedLinkNotice as Notice
} from '~/helpers/postedLinkGuard';

const PostedLinkNotice = lazyWithRetry(() => import('./PostedLinkNotice'));

// Mounted once in App: Twinkle's blocked-site list on every outside link
// the page shows (helpers/postedLinkGuard.ts). Listens on window in the
// capture phase, before any link's own handler. Loads the list as soon as
// the page starts, and keeps it from going stale (review B1): on any press
// or focus, when the tab comes back, and every POSTED_LINK_REFRESH_TICK_MS
// while the tab is visible, it reloads a copy older than
// POSTED_LINK_REFRESH_MS (each call does nothing otherwise). So a tap is
// held only in the page's first moment, before any list has loaded.
//
// Counts (blocked / unchecked) are tallied on the page and sent together
// at most every POSTED_LINK_FLUSH_MS and when the page hides, signed-in
// viewers only, the same pattern as the app sheet's counts.
export const POSTED_LINK_FLUSH_MS = 45_000;
export const POSTED_LINK_REFRESH_TICK_MS = 60_000;

export default function PostedLinkGuard() {
  const userId = useKeyContext((v) => v.myState.userId);
  const loadLinkBlocklist = useAppContext((v) => v.requestHelpers.loadLinkBlocklist);
  const recordPostedLinkEvents = useAppContext(
    (v) => v.requestHelpers.recordPostedLinkEvents
  );
  setLinkBlocklistFetcher(loadLinkBlocklist);
  const recordRef = useRef(recordPostedLinkEvents);
  recordRef.current = recordPostedLinkEvents;
  const signedInRef = useRef(false);
  signedInRef.current = Number(userId || 0) > 0;
  const flushTimerRef = useRef(0);
  const [notice, setNotice] = useState<(Notice & { id: number }) | null>(null);

  useEffect(() => {
    let nextId = 0;
    const onClick = (event: MouseEvent) => {
      postedLinkGuard.handleClick(event);
    };
    const refresh = () => pageLinkBlocklist.refresh(POSTED_LINK_REFRESH_MS);
    const onPress = () => refresh();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
      else flush(true);
    };
    const onHide = () => flush(true);
    const stopNotices = postedLinkGuard.onNotice((next) => {
      nextId += 1;
      setNotice({ ...next, id: nextId });
      if (!flushTimerRef.current) {
        flushTimerRef.current = window.setTimeout(() => {
          flushTimerRef.current = 0;
          flush(false);
        }, POSTED_LINK_FLUSH_MS);
      }
    });
    refresh();
    const refreshTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, POSTED_LINK_REFRESH_TICK_MS);
    window.addEventListener('click', onClick, true);
    window.addEventListener('auxclick', onClick, true);
    window.addEventListener('pointerdown', onPress, true);
    window.addEventListener('focusin', onPress, true);
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(refreshTimer);
      window.clearTimeout(flushTimerRef.current);
      flushTimerRef.current = 0;
      stopNotices();
      window.removeEventListener('click', onClick, true);
      window.removeEventListener('auxclick', onClick, true);
      window.removeEventListener('pointerdown', onPress, true);
      window.removeEventListener('focusin', onPress, true);
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onVisibility);
      flush(true);
    };
  }, []);

  return notice ? (
    <Suspense fallback={null}>
      <PostedLinkNotice
        key={notice.id}
        kind={notice.kind}
        url={notice.url}
        onClose={() => setNotice(null)}
      />
    </Suspense>
  ) : null;

  function flush(keepalive: boolean) {
    const counts = postedLinkGuard.takeCounts();
    if (!signedInRef.current || !Object.keys(counts).length) return;
    void recordRef.current?.({ counts, keepalive });
  }
}
