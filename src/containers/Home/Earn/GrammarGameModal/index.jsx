import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Game from './Game';
import ErrorBoundary from '~/components/ErrorBoundary';
import StartScreen from './StartScreen';
import FinishScreen from './FinishScreen';
import FilterBar from '~/components/FilterBar';
import Button from '~/components/Button';
import Rankings from './Rankings';
import { useAppContext, useKeyContext } from '~/contexts';

GrammarGameModal.propTypes = {
  onHide: PropTypes.func.isRequired
};

export default function GrammarGameModal({ onHide }) {
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
  const [questions, setQuestions] = useState([]);
  const [questionIds, setQuestionIds] = useState(null);
  const [questionObj, setQuestionObj] = useState({});
  const scoreArray = useMemo(() => {
    return questionIds
      ?.map((id) => questionObj[id].score)
      .filter((score) => !!score);
  }, [questionIds, questionObj]);
  const isOnStreak = useMemo(() => {
    if (!scoreArray || scoreArray?.length < 2) return false;
    for (let score of scoreArray) {
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
  useEffect(() => {
    const resultObj = questions.reduce((prev, curr, index) => {
      return {
        ...prev,
        [index]: {
          ...curr,
          selectedChoiceIndex: null
        }
      };
    }, {});
    setQuestionObj(resultObj);
    setQuestionIds([...Array(questions.length).keys()]);
  }, [questions]);

  return (
    <Modal closeWhenClickedOutside={false} onHide={onHide}>
      {gameState !== 'started' && (
        <header style={{ height: '3rem' }}>
          <FilterBar
            style={{
              marginTop: '3rem',
              height: '5rem'
            }}
          >
            <nav
              className={activeTab === 'game' ? 'active' : null}
              onClick={() => setActiveTab('game')}
            >
              Game
            </nav>
            <nav
              className={activeTab === 'rankings' ? 'active' : null}
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
            <FinishScreen scoreArray={scoreArray} />
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
    setGameLoading(true);
    const { questions, maxAttemptNumberReached } = await loadGrammarGame();
    if (maxAttemptNumberReached) {
      return window.location.reload();
    }
    setQuestions(questions);
    setGameState('started');
    setGameLoading(false);
  }

  async function handleGameFinish() {
    const promises = [
      (async () => {
        const { isDuplicate, newXp } = await uploadGrammarGameResult({
          attemptNumber: timesPlayedToday + 1,
          scoreArray: scoreArrayRef.current
        });
        if (isDuplicate) {
          return window.location.reload();
        }
        onSetUserState({
          userId,
          newState: { twinkleXP: newXp }
        });
      })(),
      (async () => {
        await new Promise((resolve) =>
          setTimeout(() => {
            setGameState('finished');
            resolve();
          }, 3000)
        );
      })()
    ];
    await Promise.all(promises);
    setGameState('finished');
  }
}
