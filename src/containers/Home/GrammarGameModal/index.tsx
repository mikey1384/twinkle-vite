import React, { useMemo, useRef, useState, useEffect } from 'react';
import Modal from '~/components/Modal';
import Game from './Game';
import ErrorBoundary from '~/components/ErrorBoundary';
import StartScreen from './StartScreen';
import FinishScreen from './FinishScreen';
import FilterBar from '~/components/FilterBar';
import Button from '~/components/Button';
import Rankings from './Rankings';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import { useAppContext, useKeyContext } from '~/contexts';

export default function GrammarGameModal({ onHide }: { onHide: () => void }) {
  const userId = useKeyContext((v) => v.myState.userId);
  const [gameLoading, setGameLoading] = useState(false);
  const uploadGrammarGameResult = useAppContext(
    (v) => v.requestHelpers.uploadGrammarGameResult
  );
  const loadGrammarGame = useAppContext(
    (v) => v.requestHelpers.loadGrammarGame
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const [activeTab, setActiveTab] = useState('game');
  const [rankingsTab, setRankingsTab] = useState('all');
  const [gameState, setGameState] = useState('notStarted');
  const [timesPlayedToday, setTimesPlayedToday] = useState(0);
  const [questionIds, setQuestionIds] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [triggerEffect, setTriggerEffect] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const questionObjRef = useRef<Record<number, any>>({});
  const scoreArrayRef = useRef<string[]>([]);
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
      onHide();
    }
  }

  function handleConfirmClose() {
    setShowConfirm(false);
    onHide();
  }

  return (
    <Modal wrapped closeWhenClickedOutside={false} onHide={handleHide}>
      {gameState !== 'started' && (
        <header style={{ height: '3rem', padding: 0 }}>
          <FilterBar
            style={{
              marginTop: '3.5rem',
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
          </FilterBar>
        </header>
      )}
      <main
        style={{
          padding: 0,
          marginTop: gameState === 'started' ? '-0.5rem' : '3rem'
        }}
      >
        <ErrorBoundary componentPath="Earn/GrammarGameModal/GameState">
          {activeTab === 'game' && gameState === 'notStarted' && (
            <StartScreen
              loading={gameLoading}
              timesPlayedToday={timesPlayedToday}
              onGameStart={handleGameStart}
              onSetTimesPlayedToday={setTimesPlayedToday}
              onHide={onHide}
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
              onBackToStart={() => setGameState('notStarted')}
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
        </ErrorBoundary>
      </main>
      {gameState !== 'started' && (
        <footer>
          <Button transparent onClick={onHide}>
            Close
          </Button>
        </footer>
      )}
      {showConfirm && (
        <ConfirmModal
          modalOverModal
          onHide={() => setShowConfirm(false)}
          title="Warning"
          description="If you quit the game in the middle, you will miss the opportunity to earn 1,000 coins by completing all 5 grammar games today without quitting any of them. You will also miss the chance to unlock daily bonus rewards."
          descriptionFontSize="2rem"
          onConfirm={handleConfirmClose}
          confirmButtonColor="red"
          confirmButtonLabel="Close anyway"
          isReverseButtonOrder
        />
      )}
    </Modal>
  );

  async function handleGameStart() {
    try {
      setGameLoading(true);
      const { questions, maxAttemptNumberReached } = await loadGrammarGame();
      if (maxAttemptNumberReached) {
        return window.location.reload();
      }
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

      await new Promise((resolve) => setTimeout(resolve, 200));

      setGameState('started');
    } catch (error) {
      console.error('An error occurred:', error);
    } finally {
      setGameLoading(false);
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
                attemptNumber: timesPlayedToday + 1,
                scoreArray: scoreArrayRef.current
              });
            if (isDuplicate) {
              return window.location.reload();
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
