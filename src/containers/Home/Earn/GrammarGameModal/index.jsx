import { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import FilterBar from '~/components/FilterBar';
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
  const [activeTab, setActiveTab] = useState('game');
  const [questions, setQuestions] = useState([]);

  return (
    <Modal closeWhenClickedOutside={false} onHide={onHide}>
      {gameState !== 'started' && (
        <header style={{ padding: 0 }}>
          <FilterBar
            style={{
              marginTop: '2rem',
              height: '5rem'
            }}
          >
            <nav
              className={activeTab === 'game' ? 'active' : null}
              onClick={() => setActiveTab('game')}
            >
              The Grammar Game
            </nav>
            <nav
              className={activeTab === 'rankings' ? 'active' : null}
              onClick={() => setActiveTab('rankings')}
            >
              Top Scorers
            </nav>
          </FilterBar>
        </header>
      )}
      <main
        style={{
          padding: 0,
          marginTop: 0
        }}
      >
        {activeTab === 'game' ? (
          <ErrorBoundary componentPath="Earn/GrammarGameModal/GameState">
            {gameState === 'notStarted' && (
              <StartScreen onGameStart={handleGameStart} />
            )}
            {gameState === 'started' && (
              <Game questions={questions} onSetGameState={setGameState} />
            )}
            {gameState === 'finished' && <FinishScreen />}
          </ErrorBoundary>
        ) : activeTab === 'rankings' ? (
          <div>Rankings</div>
        ) : (
          <div>Something Else</div>
        )}
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
