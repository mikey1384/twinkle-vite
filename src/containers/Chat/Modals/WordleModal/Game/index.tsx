import React, { useEffect, useMemo, useRef, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Grid from './Grid';
import Keyboard from './Keyboard';
import Banner from '~/components/Banner';
import SwitchButton from '~/components/Buttons/SwitchButton';
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
import { useAppContext, useChatContext } from '~/contexts';
import { isMobile } from '~/helpers';

const deviceIsMobile = isMobile(navigator);

export default function Game({
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
  socketConnected
}: {
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
  onSetOverviewModalShown: (isShown: boolean) => void;
  socketConnected: boolean;
  solution: string;
}) {
  const isProcessingGameResult = useRef(false);
  const onToggleWordleStrictMode = useAppContext(
    (v) => v.user.actions.onToggleWordleStrictMode
  );
  const toggleWordleStrictMode = useAppContext(
    (v) => v.requestHelpers.toggleWordleStrictMode
  );
  const [isChecking, setIsChecking] = useState(false);
  const updateWordleAttempt = useAppContext(
    (v) => v.requestHelpers.updateWordleAttempt
  );
  const checkIfDuplicateWordleAttempt = useAppContext(
    (v) => v.requestHelpers.checkIfDuplicateWordleAttempt
  );
  const onSetWordleGuesses = useChatContext(
    (v) => v.actions.onSetWordleGuesses
  );
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);
  const MAX_WORD_LENGTH = useMemo(() => solution?.length || 5, [solution]);
  const delayMs = REVEAL_TIME_MS * MAX_WORD_LENGTH;
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
    if (strictModeSwitchDisabled) {
      onToggleWordleStrictMode(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strictModeSwitchDisabled]);

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
     
  }, [nextDayTimeStamp]);

  return (
    <ErrorBoundary componentPath="WordleModal/Game">
      {alertMessage.shown && (
        <Banner
          style={{ marginTop: '1rem', marginBottom: '1rem' }}
          color={alertMessageColor}
        >
          {alertMessage.message}
        </Banner>
      )}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          width: 'CALC(100% - 3rem)',
          marginRight: '3rem'
        }}
      >
        <SwitchButton
          disabled={strictModeSwitchDisabled}
          labelStyle={{
            display: 'inline',
            fontSize: deviceIsMobile ? '1.2rem' : '1.3rem',
            fontWeight: deviceIsMobile ? 'normal' : 'bold',
            marginRight: deviceIsMobile ? '0.5rem' : '1rem'
          }}
          style={{ flexDirection: 'row' }}
          small={deviceIsMobile}
          checked={isStrictMode}
          label="Aim for Double Bonus"
          onChange={() => handleToggleWordleStrictMode(!isStrictMode)}
        />
      </div>
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          marginTop: '3rem',
          marginBottom: '2.5rem',
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
          />
        </ErrorBoundary>
        <Keyboard
          isChecking={isChecking}
          onChar={handleChar}
          onDelete={handleDelete}
          onEnter={handleEnter}
          guesses={guesses}
          isRevealing={isRevealing}
          maxWordLength={MAX_WORD_LENGTH}
          solution={solution}
          isDeleteReady={isDeleteReady}
          isEnterReady={isEnterReady}
          style={{ marginTop: '2rem' }}
        />
      </div>
    </ErrorBoundary>
  );

  function handleToggleWordleStrictMode(isStrictMode: boolean) {
    toggleWordleStrictMode(isStrictMode);
    onToggleWordleStrictMode(isStrictMode);
  }

  function handleChar(value: string) {
    if (
      unicodeLength(`${currentGuess}${value}`) <= MAX_WORD_LENGTH &&
      guesses.length < MAX_GUESSES &&
      !isGameWon
    ) {
      setCurrentGuess(`${currentGuess}${value}`);
    }
  }

  function handleDelete() {
    setCurrentGuess((currentGuess) =>
      currentGuess.split('').slice(0, -1).join('')
    );
  }

  async function handleEnter() {
    if (!socketConnected || isProcessingGameResult.current) return;
    const newGuesses = guesses.concat([currentGuess]);
    if (isGameWon || isGameLost) {
      return;
    }

    if (isStrictMode) {
      const { isPass, message } = checkWordleAttemptStrictness({
        guesses: guesses.concat([currentGuess]),
        solution
      });
      if (!isPass) {
        setCurrentRowClass('jiggle');
        return handleShowAlert({
          status: 'error',
          message,
          options: {
            callback: () => setCurrentRowClass('')
          }
        });
      }
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
    const { isDuplicate, actualWordLevel, actualSolution, needsReload } =
      await checkIfDuplicateWordleAttempt({
        channelId,
        numGuesses: newGuesses.length,
        solution
      });
    if (isDuplicate || needsReload) return window.location.reload();
    if (actualSolution) {
      onSetChannelState({
        channelId,
        newState: {
          wordleWordLevel: actualWordLevel,
          wordleSolution: actualSolution
        }
      });
      isProcessingGameResult.current = false;
    }
    if (
      newGuesses.length < MAX_GUESSES &&
      currentGuess !== (actualSolution || solution)
    ) {
      await updateWordleAttempt({
        channelName,
        channelId,
        guesses: newGuesses,
        solution: actualSolution || solution
      });
    }
    setIsChecking(false);

    setCurrentGuess('');
    onSetWordleGuesses({
      channelId,
      guesses: newGuesses
    });
    onSetIsRevealing(true);
    setTimeout(() => {
      onSetIsRevealing(false);
      isProcessingGameResult.current = false;
    }, REVEAL_TIME_MS * MAX_WORD_LENGTH);

    if (
      unicodeLength(currentGuess) === MAX_WORD_LENGTH &&
      guesses.length < MAX_GUESSES &&
      !isGameWon
    ) {
      if (currentGuess === solution) {
        return handleGameWon();
      }

      if (newGuesses.length === MAX_GUESSES) {
        handleGameLost();
      }
    }

    async function handleGameLost() {
      const loadStartTime = Date.now();
      const { wordleAttemptState, wordleStats } = await updateWordleAttempt({
        channelName,
        channelId,
        guesses: guesses.concat([currentGuess]),
        solution,
        isSolved: false
      });
      onSetChannelState({
        channelId,
        newState: { wordleAttemptState, wordleStats }
      });
      const loadEndTime = Date.now();
      const loadTime = loadEndTime - loadStartTime;
      handleShowAlert({
        status: 'fail',
        message: CORRECT_WORD_MESSAGE(solution),
        options: {
          persist: true,
          delayMs: Math.max(delayMs - loadTime, 0),
          callback: () => onSetOverviewModalShown(true)
        }
      });
    }

    async function handleGameWon() {
      const loadStartTime = Date.now();
      const { wordleAttemptState, wordleStats } = await updateWordleAttempt({
        channelName,
        channelId,
        guesses: guesses.concat([currentGuess]),
        solution,
        isSolved: true
      });
      onSetChannelState({
        channelId,
        newState: { wordleAttemptState, wordleStats }
      });
      const loadEndTime = Date.now();
      const loadTime = loadEndTime - loadStartTime;
      return handleShowAlert({
        status: 'success',
        message: WIN_MESSAGES[Math.floor(Math.random() * WIN_MESSAGES.length)],
        options: {
          delayMs: Math.max(delayMs - loadTime, 0),
          callback: () => onSetOverviewModalShown(true)
        }
      });
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
}
