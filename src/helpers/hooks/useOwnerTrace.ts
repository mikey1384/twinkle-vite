import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  getOwnerTraceScrollHeight,
  getOwnerTraceScrollTop,
  isOwnerTraceActive,
  recordOwnerTrace
} from '~/helpers/ownerTrace';
import { useAppNavigationType } from '~/helpers/hooks/useAppNavigationType';
import {
  homeFeedActionIntentStateKey,
  homeFeedNavigationStateKey
} from '~/helpers/homeFeedActionIntent';

const CONTENT_SCROLL_FOLLOW_UPS_MS = [1000, 3000];

// Owner trace: every route change with its navigation type
// (useAppNavigationType: the real PUSH/POP/REPLACE) and the keys of
// its location state (Home feed navigation/intent summarised by id and
// action only). A no-op unless the owner is signed in. userId re-runs it on
// sign-in so the trace starts with the current page (INIT for the first page
// the trace sees, CURRENT when only the signed-in user changed).
export function useOwnerTraceRoute(userId: number) {
  const location = useLocation();
  const navigationType = useAppNavigationType();
  const previousPathRef = useRef('');
  const previousKeyRef = useRef('');

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    const from = previousPathRef.current;
    previousPathRef.current = path;
    const previousKey = previousKeyRef.current;
    previousKeyRef.current = location.key;
    if (!isOwnerTraceActive()) return;
    recordOwnerTrace(
      'route',
      {
        nav: !previousKey
          ? 'INIT'
          : previousKey === location.key
            ? 'CURRENT'
            : navigationType,
        from,
        ...(location.hash ? { hash: location.hash.slice(0, 60) } : {}),
        ...describeLocationState(location.state)
      },
      path.slice(0, 255)
    );
    // location.key changes on every navigation, including same-path ones.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key, userId]);
}

// Owner trace: where a content page is scrolled at mount, once its content is
// ready, and 1s/3s after that (scroll restore and late layout shifts).
export function useOwnerTraceContentScroll({
  contentType,
  contentId,
  ready
}: {
  contentType: string;
  contentId: number;
  ready: boolean;
}) {
  useEffect(() => {
    if (!isOwnerTraceActive()) return;
    recordContentScroll('mount');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentType, contentId]);

  useEffect(() => {
    if (!ready || !isOwnerTraceActive()) return;
    recordContentScroll('ready');
    const timers = CONTENT_SCROLL_FOLLOW_UPS_MS.map((delay) =>
      window.setTimeout(() => recordContentScroll(`ready+${delay}ms`), delay)
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentType, contentId, ready]);

  function recordContentScroll(phase: string) {
    recordOwnerTrace('content-scroll', {
      ct: contentType,
      id: contentId,
      phase,
      st: getOwnerTraceScrollTop(),
      sh: getOwnerTraceScrollHeight(),
      vh: window.innerHeight
    });
  }
}

export function describeLocationState(state: unknown) {
  if (!state || typeof state !== 'object') return {};
  const value = state as Record<string, any>;
  const result: Record<string, unknown> = {
    stateKeys: Object.keys(value).slice(0, 12)
  };
  const navigation = value[homeFeedNavigationStateKey];
  if (navigation && typeof navigation === 'object') {
    result.feedNav = {
      ct: navigation.contentType,
      id: navigation.contentId,
      ...(navigation.action ? { action: navigation.action } : {})
    };
  }
  const intent = value[homeFeedActionIntentStateKey];
  if (intent && typeof intent === 'object') {
    result.feedIntent = intent.action;
  }
  return result;
}
