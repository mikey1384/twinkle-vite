import { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import FilterBar from '~/components/FilterBar';
import Game from './Game';
import ErrorBoundary from '~/components/ErrorBoundary';
import StartScreen from './StartScreen';

GrammarGameModal.propTypes = {
  onHide: PropTypes.func.isRequired
};
export default function GrammarGameModal({ onHide }) {
  const [gameState, setGameState] = useState('notStarted');
  const [activeTab, setActiveTab] = useState('game');

  return (
    <Modal closeWhenClickedOutside={false} onHide={onHide}>
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
      <main
        style={{
          padding: 0,
          marginTop: 0
        }}
      >
        {activeTab === 'game' ? (
          <ErrorBoundary componentPath="Earn/GrammarGameModal/GameState">
            {gameState === 'notStarted' && (
              <StartScreen onSetGameState={setGameState} />
            )}
            {gameState === 'started' && <Game />}
            {gameState === 'finished' && <div>Finished</div>}
          </ErrorBoundary>
        ) : activeTab === 'rankings' ? (
          <div>Rankings</div>
        ) : (
          <div>Something Else</div>
        )}
      </main>
      <footer></footer>
    </Modal>
  );
}
