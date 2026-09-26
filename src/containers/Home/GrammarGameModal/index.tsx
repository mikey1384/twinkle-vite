import useUserActivity from '~/helpers/hooks/useUserActivity';
import React, { useMemo, useRef, useState, useEffect } from 'react';
import Modal from '~/components/Modal';
import Game from './Game';
import ErrorBoundary from '~/components/ErrorBoundary';
import StartScreen from './StartScreen';
import FinishScreen from './FinishScreen';
import FilterBar from '~/components/FilterBar';
import Button from '~/components/Button';
import Rankings from './Rankings';
import Review from './Review';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import {
  useAppContext,
  useHomeContext,
  useKeyContext,
  useNotiContext
} from '~/contexts';
import { buildTodayStatsPatchFromDailyTaskStatus } from '~/helpers';
import { useAgentScreenState } from '~/helpers/websiteAgentScreenState';
import {
  countAnsweredGrammarQuestions,
  resolveGrammarCloseAction
} from './closeAction';

const RESULT_SCREEN_MIN_DISPLAY_MS = 3000;

interface GrammarResultPayload {
  attemptNumber: number;
  scoreArray: string[];
  questionResults: Array<{
    questionId: number;
    isCorrect: boolean;
    grade?: string;
    selectedChoiceIndex?: number | null;
  }>;
}

export default function GrammarGameModal({ onHide }: { onHide: () => void }) {
  const userId = useKeyContext((v) => v.myState.userId);
  const [gameLoading, setGameLoading] = useState(false);
  const uploadGrammarGameResult = useAppContext(
    (v) => v.requestHelpers.uploadGrammarGameResult
  );
  const loadGrammarGame = useAppContext(
    (v) => v.requestHelpers.loadGrammarGame
  );
  const startAttempt = useAppContext(
    (v) => v.requestHelpers.startGrammarAttempt
  );
  const cancelGrammarGame = useAppContext(
    (v) => v.requestHelpers.cancelGrammarGame
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onApplyTodayStatsProgress = useNotiContext(
    (v) => v.actions.onApplyTodayStatsProgress
  );
  const [activeTab, setActiveTab] = useState('game');
  const [rankingsTab, setRankingsTab] = useState('all');
  const [gameState, setGameState] = useState('notStarted');
  useUserActivity(
    activeTab === 'game' && gameState === 'started'
      ? { kind: 'game', id: 'grammarbles' }
      : null
  );
  const [questionsReady, setQuestionsReady] = useState(false);
  const [timesPlayedToday, setTimesPlayedToday] = useState(0);
  const [hasUnlockedDailyTask, setHasUnlockedDailyTask] = useState(false);
  const attemptNumberRef = useRef<number | null>(null);
  // Set only from the server's /start answer, so a cancel always names an
  // attempt this session really started.
  const startedAttemptNumberRef = useRef<number | null>(null);
  const startAttemptPromiseRef = useRef<Promise<void> | null>(null);
  const uploadInFlightRef = useRef(false);
  const unsavedResultRef = useRef<GrammarResultPayload | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [retryingSave, setRetryingSave] = useState(false);
  const [questionIds, setQuestionIds] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [triggerEffect, setTriggerEffect] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const questionObjRef = useRef<Record<number, any>>({});
  const scoreArrayRef = useRef<string[]>([]);
  const onUpdateGrammarLoadingStatus = useHomeContext(
    (v) => v.actions.onUpdateGrammarLoadingStatus
  );
  const onUpdateGrammarGenerationProgress = useHomeContext(
    (v) => v.actions.onUpdateGrammarGenerationProgress
  );
  const isOnStreak = useMemo(() => {
    const scoreArray = questionIds
      ?.map((id) => questionObjRef.current?.[id]?.score)
      .filter((score) => !!score);
    scoreArrayRef.current = scoreArray;
    if (!scoreArray || scoreArray.length < 2) return false;
    for (const score of scoreArray) {
      if (score !== 'S') {
        return false;
      }
    }
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionIds, triggerEffect]);

  // Hands Zero and Ciel which Grammarbles screen is open and the grades of a
  // finished round; the question in play and the review list are published
  // by their own screens, and no answer key is ever included here.
  useAgentScreenState('grammarbles', {
    tab: gameState === 'started' ? 'game' : activeTab,
    gameState,
    loading: gameLoading,
    timesPlayedToday,
    onStreak: gameState === 'started' ? isOnStreak : false,
    finishedGrades:
      activeTab === 'game' && gameState === 'finished'
        ? (scoreArrayRef.current || []).slice(0, 30)
        : null
  });

  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (gameState === 'started') {
        e.preventDefault();
        const message =
          'You will lose your progress if you leave. Are you sure?';
        return message;
      }
    }

    function handlePopState(e: PopStateEvent) {
      if (gameState === 'started') {
        e.preventDefault();
        setShowConfirm(true);
      }
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [gameState]);

  function handleHide() {
    if (gameState === 'started') {
      setShowConfirm(true);
    } else {
      // Loading questions starts no attempt, so there is nothing to cancel.
      onUpdateGrammarLoadingStatus('');
      onUpdateGrammarGenerationProgress(null);
      onHide();
    }
  }

  async function handleConfirmClose() {
    setShowConfirm(false);
    if (!startedAttemptNumberRef.current && startAttemptPromiseRef.current) {
      // A close right after the round began still cancels its attempt.
      await startAttemptPromiseRef.current;
    }
    const closeAction = resolveGrammarCloseAction({
      uploadInFlight: uploadInFlightRef.current,
      hasUnsavedResult: !!unsavedResultRef.current,
      startedAttemptNumber: startedAttemptNumberRef.current,
      answeredCount: countAnsweredGrammarQuestions(
        questionIds,
        questionObjRef.current
      )
    });
    if (closeAction.type === 'resend' && unsavedResultRef.current) {
      // A finished round is never cancelled; one more try to save it.
      uploadGrammarGameResult(unsavedResultRef.current).catch(() => {});
    } else if (closeAction.type === 'cancel') {
      try {
        await cancelGrammarGame({
          attemptNumber: closeAction.attemptNumber,
          answeredCount: closeAction.answeredCount
        });
      } catch {
        // ignore
      }
    }
    onUpdateGrammarLoadingStatus('');
    onUpdateGrammarGenerationProgress(null);
    onHide();
  }

  function getCloseWarning() {
    if (saveFailed) {
      return "Your result isn't saved yet. If you close now, we'll try to save it one more time.";
    }
    if (unsavedResultRef.current) {
      return "Your result is still being saved. Closing now won't stop it.";
    }
    if (!countAnsweredGrammarQuestions(questionIds, questionObjRef.current)) {
      return "You haven't answered any questions yet, so closing now won't count against you.";
    }
    return hasUnlockedDailyTask
      ? "If you close now, this level will count as failed for today and you'll miss out on 1,000 coins."
      : "If you close now, this level will count as failed for today, you'll miss out on 1,000 coins, and you might not be able to complete today's Grammarbles daily task.";
  }

  const footer =
    gameState !== 'started' ? (
      <Button variant="ghost" onClick={handleHide}>
        Close
      </Button>
    ) : null;

  return (
    <Modal
      xpActivity
      modalKey="GrammarGameModal"
      isOpen={true}
      onClose={handleHide}
      size="lg"
      hasHeader={false}
      closeOnBackdropClick={false}
      footer={footer}
      modalLevel={0}
    >
      <div style={{ width: '100%' }}>
        {gameState !== 'started' && (
          <FilterBar
            style={{
              height: '5rem'
            }}
          >
            <nav
              className={activeTab === 'game' ? 'active' : ''}
              onClick={() => setActiveTab('game')}
            >
              Game
            </nav>
            <nav
              className={activeTab === 'rankings' ? 'active' : ''}
              onClick={() => setActiveTab('rankings')}
            >
              Rankings
            </nav>
            <nav
              className={activeTab === 'review' ? 'active' : ''}
              onClick={() => setActiveTab('review')}
            >
              Review
            </nav>
          </FilterBar>
        )}

        <ErrorBoundary componentPath="Earn/GrammarGameModal/GameState">
          {activeTab === 'game' && gameState === 'notStarted' && (
            <StartScreen
              loading={gameLoading}
              timesPlayedToday={timesPlayedToday}
              onGameStart={handleGameStart}
              onSetTimesPlayedToday={setTimesPlayedToday}
              onHide={handleHide}
              readyToBegin={questionsReady}
              onSetDailyTaskUnlocked={setHasUnlockedDailyTask}
            />
          )}
          {gameState === 'started' && (
            <Game
              currentIndex={currentIndex}
              isOnStreak={isOnStreak}
              questionIds={questionIds}
              questionObjRef={questionObjRef}
              onSetTriggerEffect={setTriggerEffect}
              onSetCurrentIndex={setCurrentIndex}
              onSetQuestionObj={(newState: Record<number, any>) => {
                questionObjRef.current = newState;
              }}
              onGameFinish={handleGameFinish}
              triggerEffect={triggerEffect}
            />
          )}
          {gameState === 'started' && saveFailed && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginTop: '2rem',
                fontSize: '1.7rem',
                textAlign: 'center'
              }}
            >
              <b>{`Couldn't save your result`}</b>
              <div style={{ marginTop: '0.5rem', fontSize: '1.5rem' }}>
                Check your connection and try again.
              </div>
              <Button
                style={{ marginTop: '1.5rem' }}
                variant="soft"
                tone="raised"
                color="logoBlue"
                loading={retryingSave}
                onClick={handleRetrySave}
              >
                Retry
              </Button>
            </div>
          )}
          {activeTab === 'game' && gameState === 'finished' && (
            <FinishScreen
              timesPlayedToday={timesPlayedToday}
              scoreArrayRef={scoreArrayRef}
              onBackToStart={handleBackToStart}
            />
          )}
          {activeTab === 'rankings' && gameState !== 'started' && (
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <Rankings
                onSetRankingsTab={setRankingsTab}
                rankingsTab={rankingsTab}
              />
            </div>
          )}
          {activeTab === 'review' && gameState !== 'started' && (
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <Review />
            </div>
          )}
        </ErrorBoundary>
        {showConfirm && (
          <ConfirmModal
            modalOverModal
            onHide={() => setShowConfirm(false)}
            title="Warning"
            description={getCloseWarning()}
            descriptionFontSize="2rem"
            onConfirm={handleConfirmClose}
            confirmButtonColor="red"
            confirmButtonLabel="Close anyway"
            isReverseButtonOrder
          />
        )}
      </div>
    </Modal>
  );

  async function handleGameStart() {
    try {
      setGameLoading(true);
      setQuestionsReady(false);
      startedAttemptNumberRef.current = null;
      startAttemptPromiseRef.current = null;
      unsavedResultRef.current = null;
      setSaveFailed(false);
      onUpdateGrammarGenerationProgress(null);
      onUpdateGrammarLoadingStatus('loading...');
      const {
        questions,
        maxAttemptNumberReached,
        alreadyFailedToday,
        attemptNumber,
        aborted
      } = await loadGrammarGame();

      if (aborted) {
        onUpdateGrammarLoadingStatus('');
        onUpdateGrammarGenerationProgress(null);
        return;
      }
      if (maxAttemptNumberReached || alreadyFailedToday) {
        onUpdateGrammarLoadingStatus?.(
          'daily limit reached. come back tomorrow!'
        );
        setQuestionsReady(false);
        setGameState('notStarted');
        onUpdateGrammarGenerationProgress(null);
        return;
      }
      attemptNumberRef.current = attemptNumber || timesPlayedToday + 1;
      questionObjRef.current = questions.reduce(
        (prev: Record<number, any>, curr: any, index: number) => {
          return {
            ...prev,
            [index]: {
              ...curr,
              selectedChoiceIndex: null
            }
          };
        },
        {}
      );
      setQuestionIds([...Array(questions.length).keys()]);
      if (questions.length) {
        setGameState('started');
        onUpdateGrammarLoadingStatus('');
        startAttemptPromiseRef.current = startAttemptInBackground();
      }
    } catch (error) {
      console.error('An error occurred:', error);
      onUpdateGrammarLoadingStatus?.('');
      onUpdateGrammarGenerationProgress?.(null);
    } finally {
      setGameLoading(false);
      setQuestionsReady(true);
    }
  }

  function handleBackToStart() {
    setQuestionsReady(false);
    setQuestionIds([]);
    setCurrentIndex(0);
    questionObjRef.current = {};
    onUpdateGrammarLoadingStatus?.('');
    setGameState('notStarted');
  }

  async function startAttemptInBackground() {
    try {
      const { attemptNumber, maxAttemptNumberReached, alreadyFailedToday } =
        (await startAttempt()) || ({} as any);
      if (maxAttemptNumberReached || alreadyFailedToday) {
        onUpdateGrammarLoadingStatus(
          'daily limit reached. come back tomorrow!'
        );
        setGameState('notStarted');
        setQuestionIds([]);
        questionObjRef.current = {};
        return;
      }
      attemptNumberRef.current = attemptNumber || timesPlayedToday + 1;
      if (attemptNumber) {
        startedAttemptNumberRef.current = attemptNumber;
      }
    } catch (e) {
      console.error(e);
    } finally {
      onUpdateGrammarGenerationProgress(null);
    }
  }

  async function handleGameFinish() {
    let retries = 0;
    const maxRetries = 3;

    await new Promise((resolve) => setTimeout(resolve, 100));

    while (scoreArrayRef.current.length !== 10 && retries < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      retries++;
    }
    if (scoreArrayRef.current.length !== 10) return;
    await submitGrammarResult(
      {
        attemptNumber: attemptNumberRef.current || timesPlayedToday + 1,
        scoreArray: [...scoreArrayRef.current],
        questionResults: questionIds
          .map((qid) => {
            const q = questionObjRef.current?.[qid];
            if (!q) return null;
            const isCorrect = q?.score === 'S' || q?.score === 'A';
            return {
              questionId: q?.id || qid,
              isCorrect,
              grade: q?.score,
              selectedChoiceIndex: q?.selectedChoiceIndex
            };
          })
          .filter(Boolean) as GrammarResultPayload['questionResults']
      },
      // Minimum time the result screen (e.g. PERFECT) stays up before
      // advancing, so the celebration is visible without dragging. The
      // upload runs in parallel; the screen shows for max(upload, this).
      RESULT_SCREEN_MIN_DISPLAY_MS
    );
  }

  async function handleRetrySave() {
    if (!unsavedResultRef.current || uploadInFlightRef.current) return;
    setRetryingSave(true);
    await submitGrammarResult(unsavedResultRef.current, 0);
    setRetryingSave(false);
  }

  // Sends a finished round's result, retrying a few times. A POST is never
  // retried by the request layer, and resending is safe: the server answers
  // isDuplicate once the attempt has a result. If every try fails, the payload
  // is kept for the Retry button (or one more try on close) instead of
  // leaving the round stuck, where closing used to cancel it as a blank fail.
  async function submitGrammarResult(
    payload: GrammarResultPayload,
    minDisplayMs: number
  ) {
    const maxRetries = 3;
    const cooldown = 1000;
    uploadInFlightRef.current = true;
    unsavedResultRef.current = payload;
    const minDisplay = new Promise<void>((resolve) =>
      setTimeout(resolve, minDisplayMs)
    );
    try {
      for (let retries = 0; retries < maxRetries; retries++) {
        try {
          const { dailyTaskStatus, isDuplicate, newXp, newCoins } =
            await uploadGrammarGameResult(payload);
          unsavedResultRef.current = null;
          if (!isDuplicate) {
            const newState: { twinkleXP?: number; twinkleCoins?: number } = {
              twinkleXP: newXp
            };
            if (newCoins) {
              newState.twinkleCoins = newCoins;
            }
            onSetUserState({
              userId,
              newState
            });
            if (dailyTaskStatus) {
              onApplyTodayStatsProgress({
                newStats:
                  buildTodayStatsPatchFromDailyTaskStatus(dailyTaskStatus)
              });
            }
          }
          await minDisplay;
          setSaveFailed(false);
          setCurrentIndex(0);
          setGameState('finished');
          return;
        } catch (error) {
          console.error(
            `An error occurred: ${error}. Retry ${retries + 1} of ${maxRetries}`
          );
          if (retries + 1 < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, cooldown));
          }
        }
      }
      console.error(`Failed after maximum (${maxRetries}) retries`);
      await minDisplay;
      setSaveFailed(true);
    } finally {
      uploadInFlightRef.current = false;
    }
  }
}
