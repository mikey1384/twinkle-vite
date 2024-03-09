import React, { useEffect, useMemo, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import Game from './Game';
import ErrorBoundary from '~/components/ErrorBoundary';
import StartScreen from './StartScreen';
import FinishScreen from './FinishScreen';
import FilterBar from '~/components/FilterBar';
import Button from '~/components/Button';
import Rankings from './Rankings';
import { useAppContext, useKeyContext } from '~/contexts';

export default function GrammarGameModal({ onHide }: { onHide: () => void }) {
  const { userId } = useKeyContext((v) => v.myState);
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
  const [questionObj, setQuestionObj] = useState<Record<string, any>>({});
  const scoreArray = useMemo(() => {
    return questionIds
      ?.map((id) => questionObj[id].score)
      .filter((score) => !!score);
  }, [questionIds, questionObj]);
  const isOnStreak = useMemo(() => {
    if (!scoreArray || scoreArray?.length < 2) return false;
    for (const score of scoreArray) {
      if (score !== 'S') {
        return false;
      }
    }
    return true;
  }, [scoreArray]);
  const scoreArrayRef = useRef(scoreArray);
  useEffect(() => {
    scoreArrayRef.current = scoreArray;
  }, [scoreArray]);

  return (
    <Modal wrapped closeWhenClickedOutside={false} onHide={onHide}>
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
              isOnStreak={isOnStreak}
              questionIds={questionIds}
              questionObj={questionObj}
              onSetQuestionObj={setQuestionObj}
              onGameFinish={handleGameFinish}
            />
          )}
          {activeTab === 'game' && gameState === 'finished' && (
            <FinishScreen
              timesPlayedToday={timesPlayedToday}
              scoreArray={scoreArray}
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
    </Modal>
  );

  async function handleGameStart() {
    try {
      setGameLoading(true);
      const { questions, maxAttemptNumberReached } = await loadGrammarGame();
      if (maxAttemptNumberReached) {
        return window.location.reload();
      }
      setQuestionObj(
        questions.reduce(
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
        )
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
          console.error(`Failed after ${maxRetries} retries. Giving up.`);
        }
      }
    }
  }
}
