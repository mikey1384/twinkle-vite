import React, { useEffect, useMemo, useRef, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Grid from './Grid';
import Keyboard from './Keyboard';
import Banner from '~/components/Banner';
import StatusRail from '../StatusRail';
import {
  ALERT_TIME_MS,
  MAX_GUESSES,
  REVEAL_TIME_MS
} from '../constants/settings';
import {
  isWordInWordList,
  unicodeLength,
  checkWordleAttemptStrictness
} from './helpers/words';
import {
  CORRECT_WORD_MESSAGE,
  NOT_ENOUGH_LETTERS_MESSAGE,
  WIN_MESSAGES,
  WORD_NOT_FOUND_MESSAGE
} from '../constants/strings';
import { useAppContext, useChatContext, useNotiContext } from '~/contexts';
import {
  buildTodayStatsPatchFromDailyTaskStatus,
  getDailyRewardPreviewStreak
} from '~/helpers';
import { type SkipShieldChecklistState } from '../SkipShieldChecklist';
import { normalizeCanonicalWordleState } from '../wordleCanonicalState';

export default function Game({
  attemptState,
  channelId,
  channelName,
  guesses = [],
  isGameOver,
  isGameWon,
  isGameLost,
  onSetOverviewModalShown,
  solution,
  isRevealing,
  isStrictMode,
  nextDayTimeStamp,
  onSetIsRevealing,
  onSetSubmissionPending,
  onRefreshCanonicalState,
  socketConnected,
  submissionPending,
  skipShieldChecklist,
  playAreaRef,
  uiScale = 1
}: {
  attemptState: any;
  channelId: number;
  channelName?: string;
  guesses: string[];
  isGameOver: boolean;
  isGameWon: boolean;
  isGameLost: boolean;
  isRevealing: boolean;
  isStrictMode: boolean;
  nextDayTimeStamp: number;
  onSetIsRevealing: (isRevealing: boolean) => void;
  onSetSubmissionPending: (isPending: boolean) => void;
  onRefreshCanonicalState: () => Promise<void>;
  onSetOverviewModalShown: (isShown: boolean) => void;
  socketConnected: boolean;
  submissionPending: boolean;
  skipShieldChecklist: SkipShieldChecklistState | null;
  playAreaRef: React.RefObject<HTMLDivElement | null>;
  solution: string;
  uiScale?: number;
}) {
  const isProcessingGameResult = useRef(false);
  const strictModeRequestInFlightRef = useRef(false);
  const onToggleWordleStrictMode = useAppContext(
    (v) => v.user.actions.onToggleWordleStrictMode
  );
  const toggleWordleStrictMode = useAppContext(
    (v) => v.requestHelpers.toggleWordleStrictMode
  );
  const [isChecking, setIsChecking] = useState(false);
  const [savingStrictMode, setSavingStrictMode] = useState(false);
  const updateWordleAttempt = useAppContext(
    (v) => v.requestHelpers.updateWordleAttempt
  );
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);
  const onApplyTodayStatsProgress = useNotiContext(
    (v) => v.actions.onApplyTodayStatsProgress
  );
  const dailyRewardPreviewStreak = useNotiContext((v) =>
    getDailyRewardPreviewStreak(v.state.todayStats)
  );
  const MAX_WORD_LENGTH = useMemo(() => solution?.length || 5, [solution]);
  const [alertMessage, setAlertMessage] = useState<any>({});
  const [isWaving, setIsWaving] = useState(false);
  const [currentGuess, setCurrentGuess] = useState('');
  const [currentRowClass, setCurrentRowClass] = useState('');
  const isEnterReady = useMemo(
    () => !isGameOver && currentGuess.length === MAX_WORD_LENGTH,
    [MAX_WORD_LENGTH, currentGuess.length, isGameOver]
  );
  const isDeleteReady = useMemo(
    () => !isGameOver && currentGuess.length > 0,
    [currentGuess.length, isGameOver]
  );
  const alertMessageColor = useMemo(() => {
    if (alertMessage.status === 'error') {
      return 'rose';
    }
    if (alertMessage.status === 'fail') {
      return 'orange';
    }
    return 'green';
  }, [alertMessage.status]);

  const strictModeSwitchDisabled = useMemo(() => {
    const { isPass } = checkWordleAttemptStrictness({
      guesses,
      solution
    });
    return !isPass;
  }, [guesses, solution]);

  useEffect(() => {
    if (strictModeSwitchDisabled && isStrictMode) {
      void persistWordleStrictMode(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStrictMode, strictModeSwitchDisabled]);

  useEffect(() => {
    if (isGameLost) {
      handleShowAlert({
        status: 'fail',
        message: CORRECT_WORD_MESSAGE(solution),
        options: {
          persist: true
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setAlertMessage({});
    setCurrentGuess('');
    setCurrentRowClass('');
    setIsChecking(false);
    setIsWaving(false);
    isProcessingGameResult.current = false;
    onSetIsRevealing(false);
    // onSetIsRevealing is a stable state setter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextDayTimeStamp]);

  return (
    <ErrorBoundary componentPath="WordleModal/Game">
      {alertMessage.shown && (
        <Banner
          style={{
            marginTop: `${1 * uiScale}rem`,
            marginBottom: `${1 * uiScale}rem`
          }}
          color={alertMessageColor}
        >
          {alertMessage.message}
        </Banner>
      )}
      <StatusRail
        streak={dailyRewardPreviewStreak}
        wordleTask={attemptState?.dailyTask}
        skipShieldChecklist={skipShieldChecklist}
        isStrictMode={isStrictMode}
        strictToggleDisabled={strictModeSwitchDisabled}
        strictToggleSaving={savingStrictMode}
        onToggleStrictMode={handleToggleWordleStrictMode}
      />
      <div
        ref={playAreaRef}
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          marginTop: `${1.6 * uiScale}rem`,
          marginBottom: `${1.6 * uiScale}rem`,
          paddingLeft: '2rem',
          paddingRight: '2rem'
        }}
      >
        <ErrorBoundary componentPath="WordleModal/Game/Grid">
          <Grid
            guesses={guesses}
            currentGuess={currentGuess}
            isRevealing={isRevealing}
            isWaving={isWaving}
            currentRowClassName={currentRowClass}
            maxWordLength={MAX_WORD_LENGTH}
            solution={solution}
            uiScale={uiScale}
          />
        </ErrorBoundary>
        <Keyboard
          isChecking={isChecking || submissionPending}
          onChar={handleChar}
          onDelete={handleDelete}
          onEnter={handleEnter}
          guesses={guesses}
          isRevealing={isRevealing}
          maxWordLength={MAX_WORD_LENGTH}
          solution={solution}
          isDeleteReady={isDeleteReady}
          isEnterReady={isEnterReady}
          uiScale={uiScale}
          style={{ marginTop: `${1.6 * uiScale}rem` }}
        />
      </div>
    </ErrorBoundary>
  );

  async function handleToggleWordleStrictMode(isStrictMode: boolean) {
    await persistWordleStrictMode(isStrictMode);
  }

  async function persistWordleStrictMode(nextStrictMode: boolean) {
    if (strictModeRequestInFlightRef.current) return;
    strictModeRequestInFlightRef.current = true;
    setSavingStrictMode(true);
    try {
      const result = await toggleWordleStrictMode(nextStrictMode);
      if (typeof result?.wordleStrictMode !== 'boolean') {
        throw new Error(
          'Wordle strict-mode update returned no canonical state'
        );
      }
      onToggleWordleStrictMode(result.wordleStrictMode);
    } catch (error) {
      console.error(error);
    } finally {
      strictModeRequestInFlightRef.current = false;
      setSavingStrictMode(false);
    }
  }

  function handleChar(value: string) {
    if (
      unicodeLength(`${currentGuess}${value}`) <= MAX_WORD_LENGTH &&
      guesses.length < MAX_GUESSES &&
      !isGameWon &&
      !isChecking &&
      !submissionPending &&
      !isRevealing &&
      !isProcessingGameResult.current
    ) {
      setCurrentGuess(`${currentGuess}${value}`);
    }
  }

  function handleDelete() {
    if (
      isChecking ||
      submissionPending ||
      isRevealing ||
      isProcessingGameResult.current
    ) {
      return;
    }
    setCurrentGuess((currentGuess) =>
      currentGuess.split('').slice(0, -1).join('')
    );
  }

  async function handleEnter() {
    if (
      !socketConnected ||
      isChecking ||
      submissionPending ||
      isRevealing ||
      isProcessingGameResult.current
    ) {
      return;
    }
    const newGuesses = guesses.concat([currentGuess]);
    if (isGameWon || isGameLost) {
      return;
    }

    if (!(unicodeLength(currentGuess) === MAX_WORD_LENGTH)) {
      setCurrentRowClass('jiggle');
      return handleShowAlert({
        status: 'error',
        message: NOT_ENOUGH_LETTERS_MESSAGE,
        options: {
          callback: () => setCurrentRowClass('')
        }
      });
    }

    if (!isWordInWordList(currentGuess)) {
      setCurrentRowClass('jiggle');
      return handleShowAlert({
        status: 'error',
        message: WORD_NOT_FOUND_MESSAGE,
        options: {
          callback: () => setCurrentRowClass('')
        }
      });
    }
    isProcessingGameResult.current = true;
    setIsChecking(true);
    onSetSubmissionPending(true);
    let canonicalSubmissionApplied = false;
    try {
      if (isStrictMode) {
        const { isPass, message } = checkWordleAttemptStrictness({
          guesses: newGuesses,
          solution
        });
        if (!isPass) {
          setCurrentRowClass('jiggle');
          handleShowAlert({
            status: 'error',
            message,
            options: {
              callback: () => setCurrentRowClass('')
            }
          });
          return;
        }
      }

      const response = await updateWordleAttempt({
        channelName,
        channelId,
        guesses: newGuesses,
        expectedSolution: solution
      });
      if (!response) return;
      const canonicalState = normalizeCanonicalWordleState(response);
      if (!canonicalState) {
        await onRefreshCanonicalState();
        return;
      }

      applyCanonicalWordleState(canonicalState);
      setCurrentGuess('');
      if (
        canonicalState.needsReload ||
        canonicalState.wordleSolution !== solution
      ) {
        return;
      }

      const revealDelayMs =
        REVEAL_TIME_MS * unicodeLength(canonicalState.wordleSolution);
      canonicalSubmissionApplied = true;
      setIsChecking(false);
      onSetIsRevealing(true);
      setTimeout(() => {
        onSetIsRevealing(false);
        isProcessingGameResult.current = false;
      }, revealDelayMs);

      const gameWasWon = canonicalState.wordleAttemptState.isSolved === true;
      const gameWasLost =
        canonicalState.wordleAttemptState.isFailed === true ||
        (canonicalState.wordleAttemptState.isCompleted === true && !gameWasWon);
      if (gameWasWon) {
        handleShowAlert({
          status: 'success',
          message:
            WIN_MESSAGES[Math.floor(Math.random() * WIN_MESSAGES.length)],
          options: {
            delayMs: revealDelayMs,
            callback: () => onSetOverviewModalShown(true)
          }
        });
      } else if (gameWasLost) {
        handleShowAlert({
          status: 'fail',
          message: CORRECT_WORD_MESSAGE(canonicalState.wordleSolution),
          options: {
            persist: true,
            delayMs: revealDelayMs,
            callback: () => onSetOverviewModalShown(true)
          }
        });
      }
    } catch (error) {
      console.error(error);
      // A lost PUT response has an unknown outcome. Reconcile from the writer
      // instead of leaving the modal on a guessed local state.
      await onRefreshCanonicalState();
    } finally {
      setIsChecking(false);
      onSetSubmissionPending(false);
      // Successful submissions stay locked through their reveal animation.
      if (!canonicalSubmissionApplied) {
        isProcessingGameResult.current = false;
      }
    }
  }

  function handleShowAlert({
    status,
    message,
    options
  }: {
    status: string;
    message?: string;
    options?: {
      delayMs?: number;
      persist?: boolean;
      callback?: () => void;
      durationMs?: number;
    };
  }) {
    const {
      delayMs = 0,
      persist,
      callback,
      durationMs = ALERT_TIME_MS
    } = options || {};
    setTimeout(() => {
      setAlertMessage({ shown: true, status, message });
      if (status === 'success') {
        onSetIsRevealing(true);
        setIsWaving(true);
        setTimeout(() => {
          onSetIsRevealing(false);
          setIsWaving(false);
        }, REVEAL_TIME_MS * MAX_WORD_LENGTH);
      }
      setTimeout(() => {
        if (!persist) {
          setAlertMessage({ shown: false, status: '', message: '' });
        }
        if (callback) {
          callback();
        }
      }, durationMs);
    }, delayMs);
  }

  function applyCanonicalWordleState(canonicalState: {
    dailyTaskStatus: Record<string, any>;
    wordleAttemptState: Record<string, any>;
    wordleGuesses: string[];
    wordleSolution: string;
    wordleWordLevel: number;
    wordleStats: Record<string, any>;
    nextDayTimeStamp: number;
  }) {
    onSetChannelState({
      channelId,
      newState: {
        wordleAttemptState: canonicalState.wordleAttemptState,
        wordleGuesses: canonicalState.wordleGuesses,
        wordleSolution: canonicalState.wordleSolution,
        wordleWordLevel: canonicalState.wordleWordLevel,
        wordleStats: canonicalState.wordleStats
      }
    });
    onApplyTodayStatsProgress({
      newStats: {
        ...buildTodayStatsPatchFromDailyTaskStatus(
          canonicalState.dailyTaskStatus
        ),
        nextDayTimeStamp: canonicalState.nextDayTimeStamp
      }
    });
  }
}
