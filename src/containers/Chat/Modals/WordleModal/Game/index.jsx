import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
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
import { isWordInWordList, unicodeLength } from './helpers/words';
import {
  CORRECT_WORD_MESSAGE,
  NOT_ENOUGH_LETTERS_MESSAGE,
  WIN_MESSAGES,
  WORD_NOT_FOUND_MESSAGE
} from '../constants/strings';
import { default as GraphemeSplitter } from 'grapheme-splitter';
import { useAppContext, useChatContext } from '~/contexts';
import { isMobile } from '~/helpers';

const deviceIsMobile = isMobile(navigator);

Game.propTypes = {
  channelId: PropTypes.number.isRequired,
  channelName: PropTypes.string.isRequired,
  guesses: PropTypes.array.isRequired,
  isGameOver: PropTypes.bool,
  isGameWon: PropTypes.bool,
  isGameLost: PropTypes.bool,
  isRevealing: PropTypes.bool,
  onSetIsRevealing: PropTypes.func.isRequired,
  onSetOverviewModalShown: PropTypes.func.isRequired,
  socketConnected: PropTypes.bool,
  solution: PropTypes.string.isRequired
};

export default function Game({
  channelId,
  channelName,
  guesses,
  isGameOver,
  isGameWon,
  isGameLost,
  onSetOverviewModalShown,
  solution,
  isRevealing,
  onSetIsRevealing,
  socketConnected
}) {
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
  const MAX_WORD_LENGTH = solution.length;
  const delayMs = REVEAL_TIME_MS * MAX_WORD_LENGTH;
  const [isStrictMode, setIsStrictMode] = useState(false);
  const [alertMessage, setAlertMessage] = useState({});
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

  return (
    <ErrorBoundary componentPath="WordleModal/Game">
      {alertMessage.shown && (
        <Banner style={{ marginTop: '1rem' }} color={alertMessageColor}>
          {alertMessage.message}
        </Banner>
      )}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          width: '100%',
          marginRight: '5rem'
        }}
      >
        <SwitchButton
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
          onChange={() => setIsStrictMode((isStrictMode) => !isStrictMode)}
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
        <Grid
          guesses={guesses}
          currentGuess={currentGuess}
          isRevealing={isRevealing}
          isWaving={isWaving}
          currentRowClassName={currentRowClass}
          maxWordLength={MAX_WORD_LENGTH}
          solution={solution}
        />
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

  function handleChar(value) {
    if (
      unicodeLength(`${currentGuess}${value}`) <= MAX_WORD_LENGTH &&
      guesses.length < MAX_GUESSES &&
      !isGameWon
    ) {
      setCurrentGuess(`${currentGuess}${value}`);
    }
  }

  function handleDelete() {
    setCurrentGuess(
      new GraphemeSplitter().splitGraphemes(currentGuess).slice(0, -1).join('')
    );
  }

  async function handleEnter() {
    if (!socketConnected) return;
    const newGuesses = guesses.concat(currentGuess);
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

    if (newGuesses.length < MAX_GUESSES && currentGuess !== solution) {
      setIsChecking(true);
      const { isDuplicate, actualSolution, needsReload } =
        await checkIfDuplicateWordleAttempt({
          channelId,
          numGuesses: newGuesses.length,
          solution
        });
      if (needsReload) window.location.reload();
      if (isDuplicate) return;
      if (actualSolution) {
        onSetChannelState({
          channelId,
          newState: { wordleSolution: actualSolution }
        });
      }
      updateWordleAttempt({
        channelName,
        channelId,
        guesses: newGuesses,
        solution: actualSolution || solution
      });
      setIsChecking(false);
    }
    setCurrentGuess('');
    onSetWordleGuesses({
      channelId,
      guesses: newGuesses
    });
    onSetIsRevealing(true);
    setTimeout(() => {
      onSetIsRevealing(false);
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
        guesses: guesses.concat(currentGuess),
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
        guesses: guesses.concat(currentGuess),
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

  function handleShowAlert({ status, message, options }) {
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
