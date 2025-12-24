import React, {
  useEffect,
  useMemo,
  useLayoutEffect,
  useRef,
  useState
} from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import { addEvent, removeEvent } from '../listenerHelpers';
import { stringIsEmpty, addCommasToNumber } from '../stringHelpers';
import {
  useAppContext,
  useKeyContext,
  useContentContext,
  useProfileContext
} from '~/contexts';
export { default as useScrollToBottom } from './useScrollToBottom';
export { default as useInfiniteScroll } from './useInfiniteScroll';
export { default as useDraft } from './useDraft';
import {
  ADMIN_MANAGEMENT_LEVEL,
  defaultContentState,
  DEFAULT_PROFILE_THEME,
  localStorageKeys,
  wordleGuessReaction,
  wordLevelHash
} from '~/constants/defaultValues';
import { Color } from '~/constants/css';
import { levels } from '~/constants/userLevels';
import { User, UserLevel } from '~/types';
import { getStoredItem } from '~/helpers/userDataHelpers';
import { scrollPositions } from '~/constants/state';
import { throttle } from '~/helpers';

const allContentState: Record<string, any> = {};
const BodyRef = document.scrollingElement || document.documentElement;

type OutsideRef =
  | React.RefObject<HTMLElement | null>
  | HTMLElement
  | null
  | undefined;

interface OutsideClickListener {
  refs: OutsideRef[];
  handler: () => void;
}

const outsideClickListeners = new Set<OutsideClickListener>();
const globalOutsideHandlers: Array<{
  eventName: string;
  handler: (event: Event) => void;
}> = [];

const pointerEventsSupported =
  typeof window !== 'undefined' && 'PointerEvent' in window;

function collectNodes(refs: OutsideRef[]): Node[] {
  const nodes: Node[] = [];
  for (const ref of refs) {
    if (!ref) continue;
    const candidate =
      typeof (ref as any)?.current !== 'undefined' ? (ref as any).current : ref;
    if (
      candidate &&
      typeof candidate.contains === 'function' &&
      (typeof Node === 'undefined' || candidate instanceof Node)
    ) {
      nodes.push(candidate);
    }
  }
  return nodes;
}

function shouldTriggerOutside(
  refs: OutsideRef[],
  target: Node | null
): boolean {
  const nodes = collectNodes(refs);
  if (!nodes.length) return false;
  if (!target) return true;
  return !nodes.some((node) => node.contains(target));
}

function handleGlobalPointerDown(event: Event) {
  const listeners = Array.from(outsideClickListeners);
  const target = event.target as Node | null;
  // Defer execution to avoid blocking tap/click events on iOS
  // This allows the click to reach its target first, then outside-click handlers fire
  requestAnimationFrame(() => {
    for (const listener of listeners) {
      if (shouldTriggerOutside(listener.refs, target)) {
        listener.handler();
      }
    }
  });
}

function ensureGlobalOutsideHandlers() {
  if (typeof document === 'undefined') return;
  if (globalOutsideHandlers.length > 0) return;
  const downEvents = pointerEventsSupported
    ? ['pointerdown']
    : ['mousedown', 'touchstart'];
  downEvents.forEach((eventName) => {
    const handler = (event: Event) => handleGlobalPointerDown(event);
    // Use bubble phase instead of capture to avoid interfering with iOS tap events
    addEvent(document, eventName, handler, { capture: false });
    globalOutsideHandlers.push({ eventName, handler });
  });
}

function tearDownGlobalOutsideHandlers() {
  if (typeof document === 'undefined') return;
  if (!globalOutsideHandlers.length) return;
  globalOutsideHandlers.forEach(({ eventName, handler }) => {
    removeEvent(document, eventName, handler, { capture: false });
  });
  globalOutsideHandlers.length = 0;
}

function registerOutsideClickListener(listener: OutsideClickListener) {
  outsideClickListeners.add(listener);
  ensureGlobalOutsideHandlers();
}

function unregisterOutsideClickListener(listener: OutsideClickListener) {
  outsideClickListeners.delete(listener);
  if (!outsideClickListeners.size) {
    tearDownGlobalOutsideHandlers();
  }
}

export function useContentState({
  contentType,
  contentId,
  targetKey
}: {
  contentType?: string;
  contentId?: number | string | null;
  targetKey?: string | null;
}) {
  const contentKey =
    (contentType || '') + (contentId || 0) + (targetKey ? `/${targetKey}` : '');
  allContentState[contentKey] = useContentContext((v) => v.state[contentKey]);
  const state = allContentState[contentKey];
  return state ? { ...defaultContentState, ...state } : defaultContentState;
}

export function useInterval(callback: (v?: any) => any, interval: number) {
  const timerRef = useRef<any>(null);
  useEffect(() => {
    timerRef.current = setInterval(callback, interval);
    return function cleanUp() {
      clearInterval(timerRef.current);
    };
  }, [callback, interval]);
}

export function useLazyLoadForImage(selector: string, setClass: string) {
  useEffect(() => {
    const elements = document.querySelectorAll(selector);

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(setClass);
            observer.unobserve(entry.target);
          }
        });
      });

      elements.forEach((element) => {
        observer.observe(element);
      });

      return () => {
        elements.forEach((element) => {
          observer.unobserve(element);
        });
      };
    }
  }, [selector, setClass]);
}

export function useLazyLoad({
  PanelRef,
  inView,
  onSetPlaceholderHeight,
  onSetIsVisible,
  delay = 1000
}: {
  PanelRef: React.RefObject<any>;
  inView: boolean;
  onSetPlaceholderHeight?: (height: number) => void;
  onSetIsVisible?: (visible: boolean) => void;
  delay?: number;
}) {
  const timerRef = useRef<any>(null);
  const inViewRef = useRef(inView);

  useEffect(() => {
    inViewRef.current = inView;
    if (!inView) {
      timerRef.current = setTimeout(() => {
        onSetIsVisible?.(false);
      }, delay);
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      onSetIsVisible?.(true);
    }
  }, [inView, delay, onSetIsVisible]);

  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const observedElementRef = useRef<Element | null>(null);
  const callbackRef = useRef(onSetPlaceholderHeight);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = onSetPlaceholderHeight;
  });

  // Create ResizeObserver once (stable - no callback dependency)
  useEffect(() => {
    const handleResize = throttle((entries: ResizeObserverEntry[]) => {
      if (entries.length > 0) {
        const clientHeight = entries[0].target.clientHeight;
        callbackRef.current?.(clientHeight);
      }
    }, 100);

    resizeObserverRef.current = new ResizeObserver(handleResize);

    return () => {
      resizeObserverRef.current?.disconnect();
    };
  }, []);

  // Re-observe when element changes (runs after every render, but work is minimal)
  useEffect(() => {
    const element = PanelRef.current;
    if (element && element !== observedElementRef.current) {
      if (observedElementRef.current && resizeObserverRef.current) {
        resizeObserverRef.current.unobserve(observedElementRef.current);
      }
      resizeObserverRef.current?.observe(element);
      observedElementRef.current = element;
    }
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);
}

export function useMyState() {
  // Retrieve various user state values from the global app context
  const contextValues = useAppContext((v) => v.user.state.myState);

  // Current user's uid
  const userId = useAppContext((v) => v.user.state.myState.userId);

  // Retrieve the current user's state from 'userObj'
  const myStateFromUserObj = useAppContext(
    (v) => v.user.state.userObj[userId] || {}
  );

  // Key values from the global app context
  const missions = useAppContext((v) => v.user.state.missions);
  const notifications = useAppContext(
    (v) => v.user.state.myState.state?.notifications
  );
  const collectType = useAppContext((v) => v.user.state.myState.collectType);
  const lastChatPath = useAppContext((v) => v.user.state.myState.lastChatPath);
  const hideWatched = useAppContext((v) => v.user.state.myState.hideWatched);
  const searchFilter = useAppContext((v) => v.user.state.myState.searchFilter);
  const wordleStrictMode = useAppContext(
    (v) => v.user.state.myState.wordleStrictMode
  );

  // Other global user context values
  const loaded = useAppContext((v) => v.user.state.loaded);
  const signinModalShown = useAppContext((v) => v.user.state.signinModalShown);

  // Function to retrieve stored items from local storage
  const getStoredItems = (config: { [key: string]: any }) => {
    return Object.keys(config).reduce((acc: { [key: string]: any }, key) => {
      const storedValue = getStoredItem(key, config[key]);
      // Process and normalize specific stored values
      if (key === 'userId') {
        acc[key] = storedValue ? Number(storedValue) : null;
      } else if (
        key === 'level' ||
        key === 'karmaPoints' ||
        key === 'managementLevel'
      ) {
        acc[key] = Number(storedValue);
      } else {
        acc[key] = storedValue;
      }
      return acc;
    }, {});
  };

  const storedItems = useMemo(
    () => getStoredItems(localStorageKeys),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId]
  );
  const result = useMemo(() => {
    return userId
      ? {
          unlockedAchievementIds: [],
          ...contextValues,
          ...myStateFromUserObj,
          notifications,
          collectType,
          hideWatched,
          lastChatPath,
          searchFilter,
          wordleStrictMode,
          missions: {
            ...(myStateFromUserObj?.state?.missions || {}),
            ...missions
          },
          isAdmin: myStateFromUserObj.managementLevel >= ADMIN_MANAGEMENT_LEVEL,
          loggedIn: true
        }
      : {
          loaded,
          unlockedAchievementIds: [],
          missions: {},
          rewardBoostLvl: 0,
          signinModalShown,
          isAdmin: storedItems.managementLevel >= ADMIN_MANAGEMENT_LEVEL,
          ...storedItems,
          profileTheme: storedItems.profileTheme || DEFAULT_PROFILE_THEME
        };
  }, [
    collectType,
    contextValues,
    hideWatched,
    lastChatPath,
    loaded,
    missions,
    myStateFromUserObj,
    notifications,
    searchFilter,
    signinModalShown,
    storedItems,
    userId,
    wordleStrictMode
  ]);

  return result;
}

export function useOutsideClick(
  ref: any,
  callback?: () => any,
  options?: { enabled?: boolean; closeOnScroll?: boolean }
) {
  const { enabled = true, closeOnScroll = false } = options || {};
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || !callback || typeof document === 'undefined') return;
    const refs = Array.isArray(ref) ? ref : [ref];
    const listener: OutsideClickListener = {
      refs,
      handler: () => callbackRef.current?.()
    };
    registerOutsideClickListener(listener);
    return function cleanup() {
      unregisterOutsideClickListener(listener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, enabled]);

  useEffect(() => {
    if (
      !enabled ||
      !closeOnScroll ||
      !callback ||
      typeof document === 'undefined'
    )
      return;
    const refs = Array.isArray(ref) ? ref : [ref];

    function handleScroll(event: Event) {
      const target = event.target as Node | null;
      if (!shouldTriggerOutside(refs, target)) return;
      callbackRef.current?.();
    }

    addEvent(document, 'scroll', handleScroll, { capture: true });
    return function cleanUp() {
      removeEvent(document, 'scroll', handleScroll, { capture: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, enabled, closeOnScroll]);
}

export function useProfileState(username: string) {
  const userState = useProfileContext((v) => v.state[username]) || {};
  const {
    notExist = false,
    notables = { feeds: [] },
    subjects = {
      posts: []
    },
    likes = {
      all: [],
      comments: [],
      subjects: [],
      videos: [],
      links: []
    },
    posts = {
      all: [],
      comments: [],
      subjects: [],
      videos: [],
      watched: [],
      links: []
    },
    profileId
  } = userState;
  return { likes, subjects, notables, posts, notExist, profileId };
}

export function useSearch({
  onSearch,
  onEmptyQuery,
  onClear,
  onSetSearchText
}: {
  onSearch: (text: string) => any;
  onEmptyQuery?: () => void;
  onClear?: () => void;
  onSetSearchText: (text: string) => void;
}) {
  const [searching, setSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  function handleSearch(text: string) {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    onSetSearchText(text);
    onClear?.();
    if (stringIsEmpty(text)) {
      onEmptyQuery?.();
      if (isMountedRef.current) {
        setSearching(false);
      }
      return;
    }
    setSearching(true);
    timerRef.current = setTimeout(async () => {
      try {
        await onSearch(text);
      } finally {
        if (isMountedRef.current) {
          setSearching(false);
        }
        timerRef.current = null;
      }
    }, 500);
  }

  return { handleSearch, searching };
}

export function useScrollPosition({
  pathname,
  isMobile
}: {
  pathname: string;
  isMobile: boolean;
}) {
  const pathnameRef = useRef('');

  useEffect(() => {
    if (pathname !== pathnameRef.current) {
      pathnameRef.current = pathname;
      const appElement = document.getElementById('App');
      if (appElement) appElement.scrollTop = scrollPositions[pathname] || 0;
      (BodyRef || {}).scrollTop = scrollPositions[pathname] || 0;
      setTimeout(() => {
        if (appElement) appElement.scrollTop = scrollPositions[pathname] || 0;
        (BodyRef || {}).scrollTop = scrollPositions[pathname] || 0;
      }, 0);
      // prevents bug on mobile devices where tapping stops working after user swipes left to go to previous page
      if (isMobile) {
        setTimeout(() => {
          if (appElement)
            appElement.scrollTop = scrollPositions[pathnameRef.current] || 0;
          (BodyRef || {}).scrollTop = scrollPositions[pathnameRef.current] || 0;
        }, 500);
      }
    }
  }, [pathname, isMobile]);

  useLayoutEffect(() => {
    addEvent(window, 'scroll', handleScroll);
    addEvent(document.getElementById('App'), 'scroll', handleScroll);

    return function cleanUp() {
      removeEvent(window, 'scroll', handleScroll);
      removeEvent(document.getElementById('App'), 'scroll', handleScroll);
    };

    function handleScroll() {
      const appElement = document.getElementById('App');
      const appElementScrollTopPosition = appElement?.scrollTop || 0;
      const position = Math.max(
        appElementScrollTopPosition,
        (BodyRef || {}).scrollTop
      );
      scrollPositions[pathnameRef.current] = position;
    }
  }, []);
}

export function useMyLevel() {
  const achievementPoints = useKeyContext((v) => v.myState.achievementPoints);
  const canEdit = useKeyContext((v) => v.myState.canEdit);
  const canDelete = useKeyContext((v) => v.myState.canDelete);
  const canReward = useKeyContext((v) => v.myState.canReward);
  const canPinPlaylists = useKeyContext((v) => v.myState.canPinPlaylists);
  const canEditRewardLevel = useKeyContext((v) => v.myState.canEditRewardLevel);
  const managementLevel = useKeyContext((v) => v.myState.managementLevel);

  const result = useMemo(() => {
    for (let i = levels.length - 1; i >= 0; i--) {
      if (achievementPoints >= levels[i].ap) {
        return {
          ...levels[i],
          canEdit: canEdit || levels[i].canEdit,
          canDelete: canDelete || levels[i].canDelete,
          canReward: canReward || levels[i].canReward,
          canPinPlaylists: canPinPlaylists || levels[i].canPinPlaylists,
          canEditRewardLevel:
            canEditRewardLevel || levels[i].canEditRewardLevel,
          managementLevel: Math.max(managementLevel, levels[i].managementLevel),
          nextLevelAp: i === levels.length - 1 ? null : levels[i + 1].ap
        };
      }
    }
    return {
      ...levels[1],
      canEdit: canEdit || levels[1].canEdit,
      canDelete: canDelete || levels[1].canDelete,
      canReward: canReward || levels[1].canReward,
      canPinPlaylists: canPinPlaylists || levels[1].canPinPlaylists,
      canEditRewardLevel: canEditRewardLevel || levels[1].canEditRewardLevel,
      managementLevel: Math.max(managementLevel, levels[1].managementLevel),
      nextLevelAp: levels[2].ap
    };
  }, [
    achievementPoints,
    canDelete,
    canEdit,
    canEditRewardLevel,
    canPinPlaylists,
    canReward,
    managementLevel
  ]);

  return result;
}

export function useUserLevel(user: User): UserLevel {
  const userData = useAppContext((v) => v.user.state.userObj[user.id]);
  const {
    achievementPoints = user.achievementPoints || 0,
    canEdit,
    canDelete,
    canReward,
    canPinPlaylists,
    canEditRewardLevel,
    managementLevel = 0
  } = userData || {};

  const result = useMemo(() => {
    for (let i = levels.length - 1; i >= 0; i--) {
      if (achievementPoints >= levels[i].ap) {
        return {
          ...levels[i],
          canEdit: canEdit || levels[i].canEdit,
          canDelete: canDelete || levels[i].canDelete,
          canReward: canReward || levels[i].canReward,
          canPinPlaylists: canPinPlaylists || levels[i].canPinPlaylists,
          canEditRewardLevel:
            canEditRewardLevel || levels[i].canEditRewardLevel,
          managementLevel: Math.max(managementLevel, levels[i].managementLevel),
          nextLevelAp: i === levels.length - 1 ? null : levels[i + 1].ap
        };
      }
    }
    return {
      ...levels[1],
      canEdit: canEdit || levels[1].canEdit,
      canDelete: canDelete || levels[1].canDelete,
      canReward: canReward || levels[1].canReward,
      canPinPlaylists: canPinPlaylists || levels[1].canPinPlaylists,
      canEditRewardLevel: canEditRewardLevel || levels[1].canEditRewardLevel,
      managementLevel: Math.max(managementLevel, levels[1].managementLevel),
      nextLevelAp: levels[2].ap
    };
  }, [
    achievementPoints,
    canDelete,
    canEdit,
    canEditRewardLevel,
    canPinPlaylists,
    canReward,
    managementLevel
  ]);

  return result;
}

export function useWordleLabels({
  isSolved,
  isStrict,
  numGuesses,
  solution,
  wordLevel,
  xpRewardAmount,
  username,
  userId,
  myId
}: {
  isSolved: boolean;
  isStrict: boolean;
  numGuesses: number;
  solution: string;
  wordLevel: number;
  xpRewardAmount: number;
  username: string;
  userId: number;
  myId: number;
}) {
  const displayedUserLabel = useMemo(() => {
    if (userId === myId) {
      return 'You';
    }
    return (
      <UsernameText
        color="#fff"
        user={{
          id: userId,
          username
        }}
      />
    );
  }, [myId, userId, username]);

  const rewardAmountLabel = useMemo(
    () => addCommasToNumber(xpRewardAmount),
    [xpRewardAmount]
  );

  const solutionLabel = useMemo(
    () => (
      <>
        The word was <b>{solution}</b> (
        <b style={{ color: Color[wordLevelHash[wordLevel].color]() }}>
          {wordLevelHash[wordLevel].label}
        </b>{' '}
        word)
      </>
    ),
    [solution, wordLevel]
  );

  const guessLabel = useMemo(() => {
    if (wordleGuessReaction[numGuesses]) {
      return wordleGuessReaction[numGuesses];
    }
    return null;
  }, [numGuesses]);

  const guessLabelColor = useMemo(
    () =>
      numGuesses <= 2
        ? Color.gold()
        : numGuesses === 3
        ? Color.brownOrange()
        : Color.orange(),
    [numGuesses]
  );

  const bonusLabel = useMemo(() => {
    if (numGuesses < 3) {
      return null;
    }
    return isSolved && isStrict ? 'double reward bonus' : null;
  }, [isSolved, isStrict, numGuesses]);

  const resultLabel = useMemo(() => {
    return (
      <>
        {' '}
        {displayedUserLabel} earned{' '}
        <span
          className="reward-amount-label"
          style={{
            fontWeight: isSolved ? 'bold' : ''
          }}
        >
          {rewardAmountLabel} XP
        </span>{' '}
        for {isSolved ? 'solving' : 'trying to solve'} a Wordle{' '}
        {isSolved ? (
          <>
            in{' '}
            <span style={{ fontWeight: numGuesses <= 4 ? 'bold' : 'default' }}>
              {numGuesses} guess
              {numGuesses === 1
                ? '!!!'
                : numGuesses === 2
                ? 'es!!'
                : numGuesses === 3
                ? 'es!'
                : 'es'}
            </span>
          </>
        ) : (
          ''
        )}
      </>
    );
  }, [displayedUserLabel, isSolved, numGuesses, rewardAmountLabel]);

  return {
    bonusLabel,
    guessLabel,
    guessLabelColor,
    resultLabel,
    solutionLabel
  };
}
