import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Game from './Game';
import ErrorBoundary from '~/components/ErrorBoundary';
import StartScreen from './StartScreen';
import FinishScreen from './FinishScreen';
import Button from '~/components/Button';
import { useAppContext } from '~/contexts';

GrammarGameModal.propTypes = {
  onHide: PropTypes.func.isRequired
};

export default function GrammarGameModal({ onHide }) {
  const loadGrammarGame = useAppContext(
    (v) => v.requestHelpers.loadGrammarGame
  );
  const [gameState, setGameState] = useState('notStarted');
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
      <main
        style={{
          padding: 0,
          marginTop: 0
        }}
      >
        <ErrorBoundary componentPath="Earn/GrammarGameModal/GameState">
          {gameState === 'notStarted' && (
            <StartScreen onGameStart={handleGameStart} />
          )}
          {gameState === 'started' && (
            <Game
              isOnStreak={isOnStreak}
              questionIds={questionIds}
              questionObj={questionObj}
              onSetQuestionObj={setQuestionObj}
              onSetGameState={setGameState}
            />
          )}
          {gameState === 'finished' && <FinishScreen scoreArray={scoreArray} />}
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
    const questions = await loadGrammarGame();
    setQuestions(questions);
    setGameState('started');
  }
}
