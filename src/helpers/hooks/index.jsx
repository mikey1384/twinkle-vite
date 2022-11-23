import { useEffect, useMemo, useLayoutEffect, useRef, useState } from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import { addEvent, removeEvent } from '../listenerHelpers';
import { stringIsEmpty, addCommasToNumber } from '../stringHelpers';
import {
  useAppContext,
  useContentContext,
  useProfileContext
} from '~/contexts';
export { default as useScrollToBottom } from './useScrollToBottom';
export { default as useInfiniteScroll } from './useInfiniteScroll';
import {
  defaultContentState,
  wordleGuessReaction,
  wordLevelHash,
  DEFAULT_PROFILE_THEME,
  SELECTED_LANGUAGE
} from '~/constants/defaultValues';
import { Color, Theme } from '~/constants/css';

const BodyRef = document.scrollingElement || document.documentElement;

export function useContentState({ contentType, contentId }) {
  const result = {};
  result[contentType + contentId] = useContentContext(
    (v) => v.state[contentType + contentId]
  );
  const state = result[contentType + contentId];
  return state ? { ...defaultContentState, ...state } : defaultContentState;
}

export function useInterval(callback, interval) {
  const timerRef = useRef(null);
  useEffect(() => {
    timerRef.current = setInterval(callback, interval);
    return function cleanUp() {
      clearInterval(timerRef.current);
    };
  }, [callback, interval]);
}

export function useLazyLoad({
  PanelRef,
  inView,
  onSetPlaceholderHeight,
  onSetVisible,
  delay
}) {
  const timerRef = useRef(null);
  const currentInView = useRef(inView);

  useEffect(() => {
    currentInView.current = inView;
    clearTimeout(timerRef.current);
    if (currentInView.current !== false) {
      onSetVisible(true);
    } else {
      timerRef.current = setTimeout(() => {
        if (!currentInView.current) {
          onSetVisible(false);
        }
      }, delay);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  useEffect(() => {
    const clientHeight = PanelRef.current?.clientHeight;
    if (clientHeight) {
      onSetPlaceholderHeight(PanelRef.current?.clientHeight);
    }
    return function onRefresh() {
      if (clientHeight) {
        onSetPlaceholderHeight(clientHeight);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [PanelRef.current?.clientHeight]);

  useEffect(() => {
    return function cleanUp() {
      clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function useMyState() {
  const hideWatched = useAppContext((v) => v.user.state.myState.hideWatched);
  const collectType = useAppContext((v) => v.user.state.myState.collectType);
  const wordleStrictMode = useAppContext(
    (v) => v.user.state.myState.wordleStrictMode
  );
  const lastChatPath = useAppContext((v) => v.user.state.myState.lastChatPath);
  const missions = useAppContext((v) => v.user.state.missions);
  const numWordsCollected = useAppContext(
    (v) => v.user.state.myState.numWordsCollected
  );
  const searchFilter = useAppContext((v) => v.user.state.myState.searchFilter);
  const xpThisMonth = useAppContext((v) => v.user.state.myState.xpThisMonth);
  const userId = useAppContext((v) => v.user.state.myState.userId);
  const loaded = useAppContext((v) => v.user.state.loaded);
  const signinModalShown = useAppContext((v) => v.user.state.signinModalShown);
  const myState = useAppContext((v) => v.user.state.userObj[userId] || {});
  const result = useMemo(
    () =>
      myState.loaded
        ? {
            ...myState,
            missions: {
              ...(myState?.state?.missions || {}),
              ...missions
            },
            lastChatPath,
            loaded,
            numWordsCollected,
            userId,
            searchFilter,
            collectType,
            hideWatched,
            isCreator:
              myState.userType === 'webmaster' || myState.userType === 'admin',
            loggedIn: true,
            profileTheme: myState.profileTheme || DEFAULT_PROFILE_THEME,
            signinModalShown,
            wordleStrictMode,
            xpThisMonth
          }
        : {
            loaded,
            lastChatPath: '',
            rewardBoostLvl: 0,
            profileTheme: DEFAULT_PROFILE_THEME,
            signinModalShown
          },
    [
      collectType,
      hideWatched,
      lastChatPath,
      loaded,
      missions,
      myState,
      numWordsCollected,
      searchFilter,
      signinModalShown,
      userId,
      wordleStrictMode,
      xpThisMonth
    ]
  );
  return result;
}

export function useTheme(color) {
  return useMemo(() => {
    return Theme(color);
  }, [color]);
}

export function useOutsideClick(ref, callback) {
  const [insideClicked, setInsideClicked] = useState(false);
  useEffect(() => {
    function upListener(event) {
      if (insideClicked) return setInsideClicked(false);
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      callback?.();
    }
    function downListener(event) {
      if (ref.current?.contains(event.target)) {
        setInsideClicked(true);
      }
    }
    addEvent(document, 'mousedown', downListener);
    addEvent(document, 'mouseup', upListener);
    addEvent(document, 'touchend', upListener);
    return function cleanUp() {
      removeEvent(document, 'mousedown', downListener);
      removeEvent(document, 'mouseup', upListener);
      removeEvent(document, 'touchend', upListener);
    };
  });
}

export function useOutsideTap(ref, callback) {
  useEffect(() => {
    function downListener(event) {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      callback();
    }
    addEvent(document, 'scroll', downListener);
    addEvent(document, 'mousedown', downListener);
    return function cleanUp() {
      removeEvent(document, 'scroll', downListener);
      removeEvent(document, 'mousedown', downListener);
    };
  });
}

export function useProfileState(username) {
  const state = useProfileContext((v) => v.state) || {};
  const { [username]: userState = {} } = state;
  const {
    notExist = false,
    notables = { feeds: [] },
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
  return { likes, notables, posts, notExist, profileId };
}

export function useSearch({
  onSearch,
  onEmptyQuery,
  onClear,
  onSetSearchText
}) {
  const [searching, setSearching] = useState(false);
  const timerRef = useRef(null);

  function handleSearch(text) {
    clearTimeout(timerRef.current);
    onSetSearchText(text);
    onClear?.();
    if (stringIsEmpty(text)) {
      onEmptyQuery?.();
      return setSearching(false);
    }
    setSearching(true);
    timerRef.current = setTimeout(async () => {
      await onSearch(text);
      setSearching(false);
    }, 500);
  }

  return { handleSearch, searching };
}

export function useScrollPosition({
  isMobile,
  onRecordScrollPosition,
  pathname,
  scrollPositions = {}
}) {
  useEffect(() => {
    document.getElementById('App').scrollTop = scrollPositions[pathname] || 0;
    BodyRef.scrollTop = scrollPositions[pathname] || 0;
    setTimeout(() => {
      document.getElementById('App').scrollTop = scrollPositions[pathname] || 0;
      BodyRef.scrollTop = scrollPositions[pathname] || 0;
    }, 0);
    // prevents bug on mobile devices where tapping stops working after user swipes left to go to previous page
    if (isMobile) {
      setTimeout(() => {
        document.getElementById('App').scrollTop =
          scrollPositions[pathname] || 0;
        BodyRef.scrollTop = scrollPositions[pathname] || 0;
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useLayoutEffect(() => {
    addEvent(window, 'scroll', handleScroll);
    addEvent(document.getElementById('App'), 'scroll', handleScroll);

    return function cleanUp() {
      removeEvent(window, 'scroll', handleScroll);
      removeEvent(document.getElementById('App'), 'scroll', handleScroll);
    };

    function handleScroll() {
      const position = Math.max(
        document.getElementById('App').scrollTop,
        BodyRef.scrollTop
      );
      onRecordScrollPosition({ section: pathname, position });
    }
  });
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
}) {
  const displayedUserLabel = useMemo(() => {
    if (userId === myId) {
      if (SELECTED_LANGUAGE === 'kr') {
        return '회원';
      }
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
