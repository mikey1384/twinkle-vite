import React, { useMemo, useRef, useState, useEffect } from 'react';
import NewModal from '~/components/NewModal';
import Game from './Game';
import ErrorBoundary from '~/components/ErrorBoundary';
import StartScreen from './StartScreen';
import FinishScreen from './FinishScreen';
import FilterBar from '~/components/FilterBar';
import Button from '~/components/Button';
import Rankings from './Rankings';
import Review from './Review';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import { useAppContext, useHomeContext, useKeyContext } from '~/contexts';

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
  const [activeTab, setActiveTab] = useState('game');
  const [rankingsTab, setRankingsTab] = useState('all');
  const [gameState, setGameState] = useState('notStarted');
  const [questionsReady, setQuestionsReady] = useState(false);
  const [timesPlayedToday, setTimesPlayedToday] = useState(0);
  const [hasUnlockedDailyTask, setHasUnlockedDailyTask] = useState(false);
  const attemptNumberRef = useRef<number | null>(null);
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
      if (gameLoading) {
        cancelGrammarGame().catch(() => {});
      }
      onUpdateGrammarLoadingStatus('');
      onUpdateGrammarGenerationProgress(null);
      onHide();
    }
  }

  async function handleConfirmClose() {
    setShowConfirm(false);
    try {
      await cancelGrammarGame();
    } catch {
      // ignore
    }
    onUpdateGrammarLoadingStatus('');
    onUpdateGrammarGenerationProgress(null);
    onHide();
  }

  const footer =
    gameState !== 'started' ? (
      <Button variant="ghost" onClick={handleHide}>
        Close
      </Button>
    ) : null;

  return (
    <NewModal
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
          {activeTab === 'game' && gameState === 'finished' && (
            <FinishScreen
              timesPlayedToday={timesPlayedToday}
              scoreArrayRef={scoreArrayRef}
              onBackToStart={() => {
                setQuestionsReady(false);
                setQuestionIds([]);
                setCurrentIndex(0);
                questionObjRef.current = {};
                onUpdateGrammarLoadingStatus?.('');
                setGameState('notStarted');
              }}
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
            description={
              hasUnlockedDailyTask
                ? "If you close now, you'll miss out on 1,000 coins."
                : "If you close now, you'll miss out on 1,000 coins and you might not be able to complete today's Grammarbles daily task."
            }
            descriptionFontSize="2rem"
            onConfirm={handleConfirmClose}
            confirmButtonColor="red"
            confirmButtonLabel="Close anyway"
            isReverseButtonOrder
          />
        )}
      </div>
    </NewModal>
  );

  async function handleGameStart() {
    try {
      setGameLoading(true);
      setQuestionsReady(false);
      onUpdateGrammarGenerationProgress(null);
      onUpdateGrammarLoadingStatus('loading...');
      const { questions, maxAttemptNumberReached, attemptNumber, aborted } =
        await loadGrammarGame();

      if (aborted) {
        onUpdateGrammarLoadingStatus('');
        onUpdateGrammarGenerationProgress(null);
        return;
      }
      if (maxAttemptNumberReached) {
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
        startAttemptInBackground();
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

  async function startAttemptInBackground() {
    try {
      const { attemptNumber, maxAttemptNumberReached } =
        (await startAttempt()) || ({} as any);
      if (maxAttemptNumberReached) {
        onUpdateGrammarLoadingStatus(
          'daily limit reached. come back tomorrow!'
        );
        setGameState('notStarted');
        setQuestionIds([]);
        questionObjRef.current = {};
        return;
      }
      attemptNumberRef.current = attemptNumber || timesPlayedToday + 1;
    } catch (e) {
      console.error(e);
    } finally {
      onUpdateGrammarGenerationProgress(null);
    }
  }

  async function handleGameFinish() {
    let retries = 0;
    const maxRetries = 3;
    const cooldown = 1000;

    await new Promise((resolve) => setTimeout(resolve, 100));

    while (retries < maxRetries) {
      try {
        if (scoreArrayRef.current.length !== 10) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          retries++;
          continue;
        }
        const promises = [
          (async () => {
            const { isDuplicate, newXp, newCoins } =
              await uploadGrammarGameResult({
                attemptNumber: attemptNumberRef.current || timesPlayedToday + 1,
                scoreArray: scoreArrayRef.current,
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
                  .filter(Boolean) as Array<{
                  questionId: number;
                  isCorrect: boolean;
                  grade?: string;
                  selectedChoiceIndex?: number | null;
                }>
              });
            if (isDuplicate) {
              setCurrentIndex(0);
              setGameState('finished');
              return;
            }
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
          })(),
          (async () => {
            await new Promise<void>((resolve) => setTimeout(resolve, 3000));
          })()
        ];
        await Promise.all(promises);
        setCurrentIndex(0);
        setGameState('finished');
        break;
      } catch (error) {
        console.error(
          `An error occurred: ${error}. Retry ${retries + 1} of ${maxRetries}`
        );
        retries++;
        if (retries < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, cooldown));
        } else {
          console.error(`Failed after maximum (${maxRetries}) retries`);
        }
      }
    }
  }
}
